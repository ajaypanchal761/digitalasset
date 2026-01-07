import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Holding from '../models/Holding.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Generate investment certificate PDF
// @route   GET /api/certificates/:holdingId
// @access  Private
export const generateCertificate = async (req, res) => {
  try {
    const { holdingId } = req.params;
    const userId = req.user.id;

    // Fetch holding with populated property and user data
    const holding = await Holding.findById(holdingId)
      .populate('propertyId', 'title description propertyType')
      .populate('userId', 'name email phone');

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found',
      });
    }

    // Check if user owns this holding
    if (holding.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this certificate',
      });
    }

    // Create PDF document with no margins for full-page design
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Certificate_${holding._id}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // A4 dimensions: 595.28 x 841.89 points
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40; // Outer margin for border
    const cornerRadius = 15; // Rounded corner radius

    // Helper function to format currency in Indian format (₹5,00,000)
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0,
      }).format(amount);
    };

    // Helper function to format date
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    // Draw cream background
    doc.rect(0, 0, pageWidth, pageHeight)
      .fillColor('#FCFBF7')
      .fill();

    // Draw modern geometric triple-layer border
    const goldColor = '#B8860B';
    const accentGold = '#DAA520';
    const borderColor = goldColor;
    const innerRect = {
      x: margin - 10,
      y: margin - 10,
      width: pageWidth - ((margin - 10) * 2),
      height: pageHeight - ((margin - 10) * 2),
    };

    // 1. Layer 1: Outer thin border
    doc.rect(innerRect.x, innerRect.y, innerRect.width, innerRect.height)
      .lineWidth(1)
      .strokeColor(borderColor)
      .stroke();

    // 2. Layer 2: Middle gap and main frame
    const midGap = 8;
    doc.rect(innerRect.x + midGap, innerRect.y + midGap, innerRect.width - (midGap * 2), innerRect.height - (midGap * 2))
      .lineWidth(2.5)
      .strokeColor(borderColor)
      .stroke();

    // 3. Layer 3: Inner delicate line
    const innerGap = 16;
    doc.rect(innerRect.x + innerGap, innerRect.y + innerGap, innerRect.width - (innerGap * 2), innerRect.height - (innerGap * 2))
      .lineWidth(0.5)
      .strokeColor(accentGold)
      .stroke();

    // 4. Modern Geometric Corners (L-Brackets)
    const cornerSize = 40;
    const drawModernCorner = (x, y, scaleX, scaleY) => {
      doc.save()
        .translate(x, y)
        .scale(scaleX, scaleY)
        .lineWidth(3)
        .strokeColor(borderColor)
        .moveTo(0, cornerSize)
        .lineTo(0, 0)
        .lineTo(cornerSize, 0)
        .stroke()
        .restore();
    };

    // Top-Left
    drawModernCorner(innerRect.x - 5, innerRect.y - 5, 1, 1);
    // Top-Right
    drawModernCorner(innerRect.x + innerRect.width + 5, innerRect.y - 5, -1, 1);
    // Bottom-Left
    drawModernCorner(innerRect.x - 5, innerRect.y + innerRect.height + 5, 1, -1);
    // Bottom-Right
    drawModernCorner(innerRect.x + innerRect.width + 5, innerRect.y + innerRect.height + 5, -1, -1);

    // Content settings
    const contentX = margin + 35;
    const contentWidth = pageWidth - (contentX * 2);
    const primaryTextColor = '#1A1A1A';
    doc.fillColor(primaryTextColor);

    // 1. Logo Section (Even larger logo, position strictly preserved)
    const logoY = margin + 5; // Minimal top gap
    const logoCenterX = pageWidth / 2;
    const logoImagePath = path.join(__dirname, '..', 'assets', 'logo.png');

    if (fs.existsSync(logoImagePath)) {
      // Significantly larger logo
      doc.image(logoImagePath, logoCenterX - 225, logoY, {
        fit: [450, 135],
        align: 'center'
      });
    }

    // currentY must not change to keep other elements undisturbed
    let currentY = margin + 115;

    // 2. Subtitle Section
    doc.fontSize(11)
      .font('Helvetica')
      .fillColor('#2C2C2C')
      .text('Digital Property Division', contentX, currentY, {
        width: contentWidth,
        align: 'center',
        characterSpacing: 1
      });

    currentY += 20;

    // 3. Delicate separator line
    doc.moveTo(logoCenterX - 100, currentY)
      .lineTo(logoCenterX + 100, currentY)
      .lineWidth(0.5)
      .strokeColor(accentGold)
      .stroke();

    currentY += 25;

    // 4. Main Title Section (Premium Symmetrical Layout)
    doc.fontSize(22)
      .font('Times-Bold')
      .fillColor(goldColor)
      .text('CERTIFICATE OF DIGITAL PROPERTY OWNERSHIP', contentX, currentY, {
        width: contentWidth,
        align: 'center',
        lineGap: 4
      });

    currentY += 75;

    // 4. "This is to certify that"
    doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#1A1A1A')
      .text('This is to certify that:', contentX, currentY);

    currentY += 25;

    // Helper for rows
    const drawRow = (label, value, isBold = false) => {
      doc.fontSize(11).font('Helvetica').fillColor('#2C2C2C').text(label, contentX + 10, currentY);
      doc.fontSize(11).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor(primaryTextColor)
        .text(value || 'N/A', contentX + 140, currentY - 1, { width: contentWidth - 150 });

      // Underline
      doc.moveTo(contentX + 140, currentY + 11)
        .lineTo(contentX + contentWidth - 10, currentY + 11)
        .lineWidth(0.3).strokeColor('#CCCCCC').stroke();

      currentY += 28;
    };

    drawRow('Owner Name:', holding.userId.name, true);
    drawRow('Mobile Number:', holding.userId.phone);
    drawRow('Email Address:', holding.userId.email);

    currentY += 5; // Minimal gap after owner rows

    // 5. Paragraph (Realigned Left)
    doc.fontSize(10.5)
      .font('Helvetica')
      .fillColor('#2C2C2C')
      .text('has successfully purchased the Shaan Estate Digital Property', contentX + 10, currentY, { align: 'left' });

    doc.fontSize(10.5)
      .font('Helvetica-Bold')
      .fillColor(goldColor)
      .text('under the official digital assets program of Shaan Estate Pvt. Ltd.', contentX + 10, currentY + 15, { align: 'left' });

    currentY += 45; // Professional margin before next section

    // 6. Certificate Details
    doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryTextColor).text('Certificate Details', contentX, currentY);
    currentY += 25;

    drawRow('Digital Property ID:', holding._id.toString());
    drawRow('Plan/Category:', holding.propertyId?.title || 'Digital Property');
    drawRow('Purchase Amount:', `Rs. ${formatCurrency(holding.amountInvested || 0)}`, true);
    drawRow('Date of Purchase:', formatDate(holding.purchaseDate));

    currentY += 15;

    // 7. Privileges
    doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryTextColor).text('Privileges / Benefits', contentX, currentY);
    currentY += 22;

    const bulletPoints = [
      'Verified digital property ownership',
      'Exclusive updates and early access to new digital assets',
      'Priority support from the Shaan Estate customer care team',
      'Eligibility for partner-level privileges (if applicable)'
    ];

    bulletPoints.forEach(point => {
      doc.circle(contentX + 15, currentY + 4, 1.5).fillColor(goldColor).fill();
      doc.fontSize(10).font('Helvetica').fillColor('#2C2C2C').text(point, contentX + 25, currentY, { width: contentWidth - 40 });
      currentY += 16;
    });

    // 8. Footer (Signature and Seal Section)
    const footerY = pageHeight - margin - 120; // Slightly higher from bottom border

    // Centered alignment for Signatory and Seal
    const signatureAreaHeight = 65;
    const sealRadius = 40;
    const sealX = pageWidth - margin - 65;
    const sealY = footerY + (signatureAreaHeight / 2) + 5; // Perfectly leveled with the middle of the signature block

    // Authorized Signatory
    doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryTextColor).text('Authorized Signatory', contentX, footerY);
    doc.moveTo(contentX, footerY + 45).lineTo(contentX + 200, footerY + 45).lineWidth(0.8).strokeColor(primaryTextColor).stroke();
    doc.fontSize(11).font('Helvetica-Bold').text('Director – Shaan Estate Pvt. Ltd.', contentX, footerY + 55);

    // Seal (Drawn at the same horizontal level)
    doc.circle(sealX, sealY, sealRadius).lineWidth(1.5).strokeColor(goldColor).stroke();
    doc.circle(sealX, sealY, sealRadius - 4).lineWidth(0.5).strokeColor(accentGold).stroke();

    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(goldColor).text('SHAAN ESTATE', sealX - sealRadius, sealY - 12, { width: sealRadius * 2, align: 'center' });
    doc.moveTo(sealX - 25, sealY).lineTo(sealX + 25, sealY).lineWidth(0.5).strokeColor(accentGold).stroke();
    doc.text('OFFICIAL SEAL', sealX - sealRadius, sealY + 4, { width: sealRadius * 2, align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating certificate:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate certificate' });
    }
  }
};
