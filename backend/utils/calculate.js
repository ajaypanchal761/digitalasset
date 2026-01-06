/**
 * Calculate which year of investment it is
 * @param {Date} purchaseDate - Purchase date
 * @returns {number} Investment year (1, 2, 3, etc.)
 */
export const calculateInvestmentYear = (purchaseDate) => {
  const now = new Date();
  const purchase = new Date(purchaseDate);

  const yearsDiff = now.getFullYear() - purchase.getFullYear();

  // If same year, it's year 1
  if (yearsDiff === 0) {
    return 1;
  }

  // If next year but before anniversary, still year 1
  if (yearsDiff === 1) {
    if (now.getMonth() < purchase.getMonth() ||
        (now.getMonth() === purchase.getMonth() && now.getDate() < purchase.getDate())) {
      return 1;
    }
  }

  // Otherwise, it's yearsDiff + 1
  return yearsDiff + 1;
};

/**
 * Calculate yearly payout with 5% increment after Year 1
 * @param {number} amountInvested - Investment amount
 * @param {Date} purchaseDate - Purchase date
 * @returns {number} Yearly payout amount
 */
export const calculateYearlyPayout = (amountInvested, purchaseDate) => {
  const investmentYear = calculateInvestmentYear(purchaseDate);

  if (investmentYear === 1) {
    // Year 1: Fixed 0.5% monthly = 6% yearly
    return Math.floor(amountInvested * 0.06);
  } else {
    // Year 2+: 5% increment on previous year's payout
    const year1Payout = Math.floor(amountInvested * 0.06);
    let currentPayout = year1Payout;

    for (let year = 2; year <= investmentYear; year++) {
      currentPayout = Math.floor(currentPayout * 1.05);
    }

    return currentPayout;
  }
};

/**
 * Calculate monthly earning based on investment amount with year-based increment
 * @param {number} amountInvested - Investment amount
 * @param {Date} purchaseDate - Purchase date
 * @returns {number} Monthly earning amount
 */
export const calculateMonthlyEarning = (amountInvested, purchaseDate) => {
  const yearlyPayout = calculateYearlyPayout(amountInvested, purchaseDate);
  return Math.floor(yearlyPayout / 12);
};

/**
 * Legacy function for backward compatibility (deprecated)
 * @param {number} amountInvested - Investment amount
 * @param {number} monthlyReturnRate - Monthly return rate (default 0.5%)
 * @returns {number} Monthly earning amount
 */
export const calculateMonthlyEarningLegacy = (amountInvested, monthlyReturnRate = 0.5) => {
  return Math.floor(amountInvested * (monthlyReturnRate / 100));
};

/**
 * Calculate total earnings for a given period
 * @param {number} amountInvested - Investment amount
 * @param {number} months - Number of months
 * @param {number} monthlyReturnRate - Monthly return rate (default 0.5%)
 * @returns {number} Total earnings
 */
export const calculateTotalEarnings = (amountInvested, months, monthlyReturnRate = 0.5) => {
  const monthlyEarning = calculateMonthlyEarning(amountInvested, monthlyReturnRate);
  return monthlyEarning * months;
};

/**
 * Calculate maturity date from purchase date
 * @param {Date} purchaseDate - Purchase date
 * @param {number} lockInMonths - Lock-in period in months (default 3)
 * @returns {Date} Maturity date
 */
export const calculateMaturityDate = (purchaseDate, lockInMonths = 3) => {
  const maturityDate = new Date(purchaseDate);
  maturityDate.setMonth(maturityDate.getMonth() + lockInMonths);
  return maturityDate;
};

/**
 * Check if investment is matured
 * @param {Date} maturityDate - Maturity date
 * @returns {boolean} True if matured
 */
export const isMatured = (maturityDate) => {
  return new Date() >= new Date(maturityDate);
};

/**
 * Calculate days remaining until maturity
 * @param {Date} maturityDate - Maturity date
 * @returns {number} Days remaining
 */
export const calculateDaysRemaining = (maturityDate) => {
  const today = new Date();
  const maturity = new Date(maturityDate);
  const diffTime = maturity - today;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Calculate next payout date (1st of the month, 3 months after purchase date due to lock-in period)
 * @param {Date} purchaseDate - Purchase date
 * @returns {Date} Next payout date (after 3-month lock-in period)
 */
export const calculateNextPayoutDate = (purchaseDate) => {
  const nextPayout = new Date(purchaseDate);
  // Add 3 months for lock-in period, then set to 1st of that month
  nextPayout.setMonth(nextPayout.getMonth() + 3);
  nextPayout.setDate(1);
  return nextPayout;
};



