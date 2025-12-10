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
    const borderWidth = 3; // Border line width
    const borderGap = 8; // Gap between double borders
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
      .fillColor('#F8F1E4')
      .fill();

    // Draw double-line gold border with rounded corners
    const goldColor = '#D4AF37';
    const innerRect = {
      x: margin,
      y: margin,
      width: pageWidth - (margin * 2),
      height: pageHeight - (margin * 2),
    };

    // Outer border
    doc.roundedRect(
      innerRect.x,
      innerRect.y,
      innerRect.width,
      innerRect.height,
      cornerRadius
    )
      .lineWidth(borderWidth)
      .strokeColor(goldColor)
      .stroke();

    // Inner border
    doc.roundedRect(
      innerRect.x + borderGap,
      innerRect.y + borderGap,
      innerRect.width - (borderGap * 2),
      innerRect.height - (borderGap * 2),
      cornerRadius - 2
    )
      .lineWidth(borderWidth)
      .strokeColor(goldColor)
      .stroke();

    // Content area (inside borders) - Reduced top padding
    const contentX = margin + borderGap + 20;
    const contentY = margin + borderGap + 15; // Reduced from 30 to 15
    const contentWidth = pageWidth - (contentX * 2);
    // Calculate bottom boundary of inner border
    const innerBorderBottom = pageHeight - margin - borderGap;

    // Set text color to dark brown/black
    doc.fillColor('#2c1810');

    // Logo area - Load logo image from assets folder
    const logoY = contentY + 10; // Reduced from 20 to 10
    const logoCenterX = pageWidth / 2;
    const logoImagePath = path.join(__dirname, '..', 'assets', 'image.png');
    const logoSize = 50; // Height of logo
    
    // Function to draw the exact logo matching the reference image
    const drawLogoFallback = () => {
      doc.fillColor(goldColor);
      
      // Building dimensions - all have flat bases aligned at bottom
      const buildingWidth = 18; // Consistent width for all buildings
      const gap = 6; // Equal gap between buildings
      const baseY = logoY + logoSize - 5; // Bottom alignment point
      const slantOffset = 4; // Amount of slant for the top edge
      
      // Left building - medium height
      const leftBuildingX = logoCenterX - buildingWidth - gap / 2;
      const leftBuildingHeight = 22; // Medium height
      const leftTopY = baseY - leftBuildingHeight;
      doc.moveTo(leftBuildingX, baseY) // Bottom left
        .lineTo(leftBuildingX + buildingWidth, baseY) // Bottom right
        .lineTo(leftBuildingX + buildingWidth - slantOffset, leftTopY) // Top right (slanted)
        .lineTo(leftBuildingX + slantOffset, leftTopY) // Top left (slanted)
        .closePath()
        .fill();
      
      // Center building - tallest
      const centerBuildingX = logoCenterX - buildingWidth / 2;
      const centerBuildingHeight = 30; // Tallest
      const centerTopY = baseY - centerBuildingHeight;
      doc.moveTo(centerBuildingX, baseY) // Bottom left
        .lineTo(centerBuildingX + buildingWidth, baseY) // Bottom right
        .lineTo(centerBuildingX + buildingWidth - slantOffset, centerTopY) // Top right (slanted)
        .lineTo(centerBuildingX + slantOffset, centerTopY) // Top left (slanted)
        .closePath()
        .fill();
      
      // Right building - shortest
      const rightBuildingX = logoCenterX + gap / 2;
      const rightBuildingHeight = 18; // Shortest
      const rightTopY = baseY - rightBuildingHeight;
      doc.moveTo(rightBuildingX, baseY) // Bottom left
        .lineTo(rightBuildingX + buildingWidth, baseY) // Bottom right
        .lineTo(rightBuildingX + buildingWidth - slantOffset, rightTopY) // Top right (slanted)
        .lineTo(rightBuildingX + slantOffset, rightTopY) // Top left (slanted)
        .closePath()
        .fill();
      
      doc.fillColor('#2c1810');
    };
    
    // Check if logo image exists, if not, draw the exact logo
    if (fs.existsSync(logoImagePath)) {
      try {
        doc.image(logoImagePath, logoCenterX - logoSize / 2, logoY, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize],
          align: 'center'
        });
      } catch (error) {
        console.warn('Error loading logo image, using fallback:', error);
        drawLogoFallback();
      }
    } else {
      console.warn(`Logo image not found at ${logoImagePath}. Please add image.png to backend/assets/`);
      drawLogoFallback();
    }

    // Company Name
    doc.fontSize(20)
      .font('Times-Bold')
      .text('SHAAN ESTATE PRIVATE LIMITED', contentX, logoY + 50, {
        width: contentWidth,
        align: 'center'
      });

    // Subtitle
    doc.fontSize(14)
      .font('Times-Roman')
      .text('Digital Property Division', contentX, logoY + 75, {
        width: contentWidth,
        align: 'center'
      });

    // Main Title
    doc.fontSize(22)
      .font('Times-Bold')
      .text('CERTIFICATE OF DIGITAL PROPERTY OWNERSHIP', contentX, logoY + 110, {
        width: contentWidth,
        align: 'center'
      });

    let currentY = logoY + 160;

    // "This is to certify that:" section
    doc.fontSize(12)
      .font('Times-Roman')
      .text('This is to certify that:', contentX, currentY, {
        width: contentWidth,
        align: 'left'
      });

    currentY += 30;

    // Owner Name field
    const fieldLabelX = contentX;
    const fieldValueX = contentX + 140;
    // Calculate max underline width to stay within boundaries
    const maxUnderlineWidth = (contentX + contentWidth) - fieldValueX - 20; // 20px margin from right
    const underlineLength = Math.min(280, maxUnderlineWidth);
    const underlineYOffset = 3; // Position text slightly above underline

    doc.fontSize(12)
      .font('Times-Roman')
      .text('Owner Name:', fieldLabelX, currentY);
    
    // Draw underline
    doc.moveTo(fieldValueX, currentY + 12)
      .lineTo(fieldValueX + underlineLength, currentY + 12)
      .lineWidth(0.5)
      .strokeColor('#2c1810')
      .stroke();
    
    // Place dynamic data on underline (with width constraint to prevent overflow)
    doc.fontSize(12)
      .font('Times-Bold')
      .text(holding.userId.name || 'N/A', fieldValueX, currentY - underlineYOffset, {
        width: underlineLength,
        ellipsis: true
      });

    currentY += 30;

    // Mobile Number field
    doc.fontSize(12)
      .font('Times-Roman')
      .text('Mobile Number:', fieldLabelX, currentY);
    
    doc.moveTo(fieldValueX, currentY + 12)
      .lineTo(fieldValueX + underlineLength, currentY + 12)
      .lineWidth(0.5)
      .strokeColor('#2c1810')
      .stroke();
    
    doc.fontSize(12)
      .font('Times-Roman')
      .text(holding.userId.phone || 'N/A', fieldValueX, currentY - underlineYOffset, {
        width: underlineLength,
        ellipsis: true
      });

    currentY += 30;

    // Email field
    doc.fontSize(12)
      .font('Times-Roman')
      .text('Email:', fieldLabelX, currentY);
    
    doc.moveTo(fieldValueX, currentY + 12)
      .lineTo(fieldValueX + underlineLength, currentY + 12)
      .lineWidth(0.5)
      .strokeColor('#2c1810')
      .stroke();
    
    doc.fontSize(12)
      .font('Times-Roman')
      .text(holding.userId.email || 'N/A', fieldValueX, currentY - underlineYOffset, {
        width: underlineLength,
        ellipsis: true
      });

    currentY += 35;

    // Static paragraph
    doc.fontSize(12)
      .font('Times-Roman')
      .text('has successfully purchased the Shaan Estate Digital Property', contentX, currentY, {
        width: contentWidth,
        align: 'center'
      });

    currentY += 20;

    doc.fontSize(12)
      .font('Times-Roman')
      .text('under the official digital assets program of Shaan Estate Pvt. Ltd.', contentX, currentY, {
        width: contentWidth,
        align: 'center'
      });

    currentY += 40;

    // Certificate Details Section
    doc.fontSize(14)
      .font('Times-Bold')
      .text('Certificate Details', contentX, currentY, {
        width: contentWidth,
        align: 'left'
      });

    currentY += 30;

    // Digital Property ID field
    doc.fontSize(12)
      .font('Times-Roman')
      .text('Digital Property ID:', fieldLabelX, currentY);
    
    doc.moveTo(fieldValueX, currentY + 12)
      .lineTo(fieldValueX + underlineLength, currentY + 12)
      .lineWidth(0.5)
      .strokeColor('#2c1810')
      .stroke();
    
    doc.fontSize(12)
      .font('Times-Roman')
      .text(holding._id.toString() || 'N/A', fieldValueX, currentY - underlineYOffset, {
        width: underlineLength,
        ellipsis: true
      });

    currentY += 30;

    // Plan/Category field
    doc.fontSize(12)
      .font('Times-Roman')
      .text('Plan/Category:', fieldLabelX, currentY);
    
    doc.moveTo(fieldValueX, currentY + 12)
      .lineTo(fieldValueX + underlineLength, currentY + 12)
      .lineWidth(0.5)
      .strokeColor('#2c1810')
      .stroke();
    
    doc.fontSize(12)
      .font('Times-Roman')
      .text(holding.propertyId?.title || 'Digital Property', fieldValueX, currentY - underlineYOffset, {
        width: underlineLength,
        ellipsis: true
      });

    currentY += 30;

    // Purchase Amount field
    doc.fontSize(12)
      .font('Times-Roman')
      .text('Purchase Amount:', fieldLabelX, currentY);
    
    doc.moveTo(fieldValueX, currentY + 12)
      .lineTo(fieldValueX + underlineLength, currentY + 12)
      .lineWidth(0.5)
      .strokeColor('#2c1810')
      .stroke();
    
    // Use actual amount invested, ensure it's a valid number
    const amountInvested = holding.amountInvested && typeof holding.amountInvested === 'number' && holding.amountInvested > 0 
      ? holding.amountInvested 
      : (holding.amountInvested || 0);
    const formattedAmount = `₹${formatCurrency(amountInvested)}`;
    doc.fontSize(12)
      .font('Times-Roman')
      .text(formattedAmount, fieldValueX, currentY - underlineYOffset, {
        width: underlineLength,
        ellipsis: true
      });

    currentY += 30;

    // Date of Purchase field
    doc.fontSize(12)
      .font('Times-Roman')
      .text('Date of Purchase:', fieldLabelX, currentY);
    
    doc.moveTo(fieldValueX, currentY + 12)
      .lineTo(fieldValueX + underlineLength, currentY + 12)
      .lineWidth(0.5)
      .strokeColor('#2c1810')
      .stroke();
    
    doc.fontSize(12)
      .font('Times-Roman')
      .text(formatDate(holding.purchaseDate), fieldValueX, currentY - underlineYOffset, {
        width: underlineLength,
        ellipsis: true
      });

    currentY += 50;

    // Privileges / Benefits Section
    doc.fontSize(14)
      .font('Times-Bold')
      .text('Privileges / Benefits', contentX, currentY, {
        width: contentWidth,
        align: 'left'
      });

    currentY += 30;

    // Bullet points
    const bulletPoints = [
      'Verified digital property ownership',
      'Exclusive updates and early access to new digital assets',
      'Priority support from the Shaan Estate customer care team',
      'Eligibility for partner-level privileges (if applicable)'
    ];

    bulletPoints.forEach((point, index) => {
      doc.fontSize(12)
        .font('Times-Roman')
        .text(`• ${point}`, contentX + 15, currentY, {
          width: contentWidth - 15,
          align: 'left'
        });
      currentY += 22;
    });

    currentY += 30;

    // Authorized Signatory Section
    doc.fontSize(14)
      .font('Times-Bold')
      .text('Authorized Signatory', contentX, currentY, {
        width: contentWidth,
        align: 'left'
      });

    currentY += 40;

    // Signature line
    const signatureLineX = contentX;
    const signatureLineLength = 200;
    doc.moveTo(signatureLineX, currentY)
      .lineTo(signatureLineX + signatureLineLength, currentY)
      .lineWidth(0.5)
      .strokeColor('#2c1810')
      .stroke();

    currentY += 25;

    // Director title - Ensure it stays within border boundaries
    // Calculate max width to stay within content area (with margin from right border)
    const rightMargin = 20; // Margin from right border
    const maxTextWidth = contentWidth - rightMargin;
    // Ensure text stays above the inner border bottom with some margin
    const bottomMargin = 15; // Margin from bottom border
    const maxY = innerBorderBottom - bottomMargin;
    if (currentY > maxY) {
      currentY = maxY;
    }
    doc.fontSize(12)
      .font('Times-Roman')
      .text('Director – Shaan Estate Pvt. Ltd.', contentX, currentY, {
        width: maxTextWidth,
        align: 'left',
        ellipsis: true
      });

    // Company Seal (bottom right) - Ensure it stays within inner border
    const sealRadius = 35;
    const sealMargin = 20; // Margin from inner border
    const sealX = pageWidth - margin - borderGap - sealMargin - sealRadius;
    const sealY = innerBorderBottom - sealMargin - sealRadius;

    // Draw circular seal with double border
    doc.circle(sealX, sealY, sealRadius)
      .lineWidth(2)
      .strokeColor(goldColor)
      .stroke();

    doc.circle(sealX, sealY, sealRadius - 4)
      .lineWidth(2)
      .strokeColor(goldColor)
      .stroke();

    // Add "COMPANY SEAL" text inside circle
    doc.fontSize(8)
      .font('Times-Bold')
      .fillColor('#2c1810')
      .text('COMPANY', sealX, sealY - 8, {
        width: sealRadius * 2,
        align: 'center'
      });

    // Draw horizontal line in seal
    doc.moveTo(sealX - sealRadius + 5, sealY)
      .lineTo(sealX + sealRadius - 5, sealY)
      .lineWidth(0.5)
      .strokeColor('#2c1810')
      .stroke();

    doc.fontSize(8)
      .font('Times-Bold')
      .text('SEAL', sealX, sealY + 2, {
        width: sealRadius * 2,
        align: 'center'
      });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating certificate:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate certificate',
      });
    }
  }
};
