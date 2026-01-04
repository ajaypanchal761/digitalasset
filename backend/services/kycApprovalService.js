import OfflineBuyerRequest from '../models/OfflineBuyerRequest.js';
import User from '../models/User.js';
import Holding from '../models/Holding.js';
import Property from '../models/Property.js';
import Transaction from '../models/Transaction.js';
import { calculateMonthlyEarning, calculateMaturityDate, calculateNextPayoutDate } from '../utils/calculate.js';

/**
 * Check and process offline buyer requests when KYC is approved
 * This should be called whenever a user's KYC status changes to 'approved'
 */
export const processOfflineBuyerRequests = async (userId, userEmail) => {
  try {
    // Find pending offline buyer requests matching this user's email
    const pendingRequests = await OfflineBuyerRequest.find({
      buyerEmail: userEmail.toLowerCase().trim(),
      status: 'pending',
    })
      .populate('holdingId')
      .populate('propertyId')
      .populate('sellerId', 'name email wallet');

    if (pendingRequests.length === 0) {
      return { processed: 0, message: 'No pending offline buyer requests found' };
    }

    let processedCount = 0;
    const errors = [];

    for (const request of pendingRequests) {
      try {
        // Verify the user exists and KYC is approved
        const buyer = await User.findById(userId);
        if (!buyer || buyer.kycStatus !== 'approved') {
          continue; // Skip if KYC not approved
        }

        // Verify email matches
        if (buyer.email.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
          continue; // Skip if email doesn't match
        }

        const holding = request.holdingId;
        const property = request.propertyId;
        const seller = request.sellerId;

        if (!holding || !property || !seller) {
          errors.push(`Request ${request._id}: Missing required data`);
          continue;
        }

        // Verify holding still belongs to seller
        if (holding.userId.toString() !== seller._id.toString()) {
          errors.push(`Request ${request._id}: Holding no longer belongs to seller`);
          continue;
        }

        // Calculate new dates and values for buyer
        const transferDate = new Date();
        const newPurchaseDate = transferDate;
        // Preserve the original lock period from seller's holding
        const originalLockMonths = holding.lockInMonths || 3;
        const newMaturityDate = calculateMaturityDate(newPurchaseDate, originalLockMonths);
        const newNextPayoutDate = calculateNextPayoutDate(newPurchaseDate);

        // Calculate monthly earning based on sale price
        const monthlyReturnRate = property.monthlyReturnRate || 0.5;
        const newMonthlyEarning = calculateMonthlyEarning(request.salePrice, monthlyReturnRate);

        // Update holding with new owner and preserve original lock period
        holding.userId = buyer._id;
        holding.purchaseDate = newPurchaseDate;
        holding.maturityDate = newMaturityDate;
        holding.status = 'lock-in';
        holding.canWithdrawInvestment = false;
        holding.lockInMonths = originalLockMonths; // Preserve original lock period
        holding.totalEarningsReceived = 0;
        holding.payoutCount = 0;
        holding.nextPayoutDate = newNextPayoutDate;
        holding.lastPayoutDate = null;
        holding.monthlyEarning = newMonthlyEarning;
        holding.amountInvested = request.salePrice; // Update to sale price
        await holding.save();

        // Credit seller's wallet with sale price
        seller.wallet.balance = (seller.wallet.balance || 0) + request.salePrice;
        await seller.save();

        // Update buyer's wallet stats (no balance deduction for offline purchase)
        buyer.wallet.totalInvestments = (buyer.wallet.totalInvestments || 0) + request.salePrice;
        buyer.wallet.lockedAmount = (buyer.wallet.lockedAmount || 0) + request.salePrice;
        await buyer.save();

        // Create transaction for seller (credit)
        await Transaction.create({
          userId: seller._id,
          type: 'credit',
          amount: request.salePrice,
          description: `Property sale: ${property.title} - transferred to ${buyer.name}`,
          status: 'completed',
          holdingId: holding._id,
          propertyId: property._id,
        });

        // Create transaction for buyer (investment - no balance deduction)
        await Transaction.create({
          userId: buyer._id,
          type: 'investment',
          amount: request.salePrice,
          description: `Property purchase: ${property.title} - transferred from ${seller.name} (offline)`,
          status: 'completed',
          holdingId: holding._id,
          propertyId: property._id,
        });

        // Mark request as completed
        request.status = 'completed';
        request.transferCompletedDate = transferDate;
        await request.save();

        processedCount++;

        console.log(`✅ Offline buyer request processed: ${request._id} - Property transferred from ${seller.name} to ${buyer.name}`);
      } catch (error) {
        console.error(`❌ Error processing offline buyer request ${request._id}:`, error);
        errors.push(`Request ${request._id}: ${error.message}`);
      }
    }

    return {
      processed: processedCount,
      total: pendingRequests.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${processedCount} of ${pendingRequests.length} offline buyer requests`,
    };
  } catch (error) {
    console.error('❌ Error in processOfflineBuyerRequests:', error);
    return {
      processed: 0,
      error: error.message,
      message: 'Failed to process offline buyer requests',
    };
  }
};

