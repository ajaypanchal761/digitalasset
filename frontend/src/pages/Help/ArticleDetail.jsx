import { useParams, useNavigate } from "react-router-dom";
import {
  KYCIcon,
  InvestmentIcon,
  WalletIcon,
  WithdrawalIcon,
  AccountIcon,
  TechnicalIcon,
} from "../../components/HelpIcons.jsx";
import "./ArticleDetail.css";

// Icon mapping function
const getArticleIcon = (category) => {
  const iconProps = { size: 48, color: "#3b82f6" };
  switch (category) {
    case "KYC":
      return <KYCIcon {...iconProps} />;
    case "Investment":
      return <InvestmentIcon {...iconProps} />;
    case "Wallet":
      return <WalletIcon {...iconProps} />;
    case "Withdrawal":
      return <WithdrawalIcon {...iconProps} />;
    case "Account":
      return <AccountIcon {...iconProps} />;
    case "Technical":
      return <TechnicalIcon {...iconProps} />;
    default:
      return <KYCIcon {...iconProps} />;
  }
};

const getRelatedArticleIcon = (category) => {
  const iconProps = { size: 32, color: "#3b82f6" };
  switch (category) {
    case "KYC":
      return <KYCIcon {...iconProps} />;
    case "Investment":
      return <InvestmentIcon {...iconProps} />;
    case "Wallet":
      return <WalletIcon {...iconProps} />;
    case "Withdrawal":
      return <WithdrawalIcon {...iconProps} />;
    case "Account":
      return <AccountIcon {...iconProps} />;
    case "Technical":
      return <TechnicalIcon {...iconProps} />;
    default:
      return <KYCIcon {...iconProps} />;
  }
};

// Mock article data
const articles = {
  1: {
    id: 1,
    title: "How to Complete KYC Verification",
    category: "KYC",
    content: `
      <h2>Step-by-Step KYC Verification Guide</h2>
      <p>Completing your KYC verification is mandatory before you can invest in any property. Follow these simple steps:</p>
      
      <h3>Step 1: Access KYC Page</h3>
      <p>Navigate to your Profile page and click on "KYC Verification" from the menu.</p>
      
      <h3>Step 2: Prepare Your Documents</h3>
      <p>Make sure you have the following documents ready:</p>
      <ul>
        <li><strong>PAN Card:</strong> Clear photo or scan of your PAN card</li>
        <li><strong>Aadhaar Card:</strong> Clear photo or scan of your Aadhaar card (front and back)</li>
        <li><strong>Profile Photo:</strong> Recent passport-size photo (JPG or PNG format)</li>
        <li><strong>Address Proof:</strong> Utility bill, bank statement, or rental agreement</li>
      </ul>
      
      <h3>Step 3: Enter Your Details</h3>
      <p>Enter your PAN Number (10 characters, e.g., ABCDE1234F) and Aadhaar Number (12 digits).</p>
      
      <h3>Step 4: Upload Documents</h3>
      <p>Upload all required documents. Make sure:</p>
      <ul>
        <li>Documents are clear and readable</li>
        <li>File size is under 5MB</li>
        <li>Photo is in JPG or PNG format (not PDF)</li>
      </ul>
      
      <h3>Step 5: Submit for Review</h3>
      <p>Click "Submit KYC" and wait for admin approval. This usually takes 1-3 business days.</p>
      
      <h3>What Happens Next?</h3>
      <p>Once submitted, your KYC status will be "Pending". You'll receive a notification when:</p>
      <ul>
        <li>Your KYC is approved - You can now invest!</li>
        <li>Your KYC is rejected - Check the rejection reason and resubmit</li>
      </ul>
      
      <h3>Need Help?</h3>
      <p>If you face any issues during KYC submission, contact our support team for assistance.</p>
    `,
    relatedArticles: [2, 3],
  },
  2: {
    id: 2,
    title: "Understanding Investment Process",
    category: "Investment",
    content: `
      <h2>How to Invest in Digital Properties</h2>
      <p>Investing in digital properties on our platform is simple and secure. Here's everything you need to know:</p>
      
      <h3>Before You Invest</h3>
      <ul>
        <li>Complete your KYC verification (mandatory)</li>
        <li>Ensure you have sufficient funds in your wallet</li>
        <li>Read the property details and terms carefully</li>
      </ul>
      
      <h3>Investment Process</h3>
      <ol>
        <li><strong>Browse Properties:</strong> Visit the "Explore" page to see available investment opportunities</li>
        <li><strong>View Details:</strong> Click on any property to see detailed information, ROI calculator, and legal documents</li>
        <li><strong>Choose Investment Amount:</strong> Enter the amount you want to invest (within min-max limits)</li>
        <li><strong>Review Terms:</strong> Check lock-in period, return rate, and maturity date</li>
        <li><strong>Make Payment:</strong> Proceed to payment gateway and complete the transaction</li>
        <li><strong>Confirmation:</strong> You'll receive confirmation and your investment will appear in your portfolio</li>
      </ol>
      
      <h3>Understanding Returns</h3>
      <p>Returns are calculated based on:</p>
      <ul>
        <li>Your investment amount</li>
        <li>Property's monthly return rate</li>
        <li>Lock-in period duration</li>
      </ul>
      
      <h3>Lock-in Period</h3>
      <p>During the lock-in period:</p>
      <ul>
        <li>Your investment cannot be withdrawn</li>
        <li>You'll receive monthly returns (if applicable)</li>
        <li>After maturity, you can withdraw your investment and remaining earnings</li>
      </ul>
      
      <h3>Tracking Your Investment</h3>
      <p>You can track all your investments from:</p>
      <ul>
        <li>Dashboard - Overview of all investments</li>
        <li>Wallet - Detailed investment history</li>
        <li>Holdings - Individual property details</li>
      </ul>
    `,
    relatedArticles: [1, 4],
  },
  3: {
    id: 3,
    title: "Wallet Management Guide",
    category: "Wallet",
    content: `
      <h2>Managing Your Wallet</h2>
      <p>Your wallet is the central hub for all financial transactions on the platform.</p>
      
      <h3>Wallet Overview</h3>
      <p>The wallet shows:</p>
      <ul>
        <li><strong>Current Balance:</strong> Available funds in your wallet</li>
        <li><strong>Total Investments:</strong> Sum of all your investments</li>
        <li><strong>Earnings Received:</strong> Total returns you've received</li>
        <li><strong>Withdrawable Balance:</strong> Amount you can withdraw</li>
      </ul>
      
      <h3>Adding Funds</h3>
      <p>To add funds to your wallet:</p>
      <ol>
        <li>Go to the property you want to invest in</li>
        <li>Click "Invest Now"</li>
        <li>Enter investment amount</li>
        <li>Complete payment through the payment gateway</li>
        <li>Funds are automatically added to your wallet</li>
      </ol>
      
      <h3>Transaction History</h3>
      <p>View all your transactions including:</p>
      <ul>
        <li>Investments made</li>
        <li>Returns received</li>
        <li>Withdrawals processed</li>
        <li>Payment history</li>
      </ul>
      
      <h3>Investment Types</h3>
      <p>Track different types of investments:</p>
      <ul>
        <li><strong>Active Investments:</strong> Currently in lock-in period</li>
        <li><strong>Matured Investments:</strong> Lock-in period completed, ready for withdrawal</li>
        <li><strong>All Investments:</strong> Complete investment history</li>
      </ul>
    `,
    relatedArticles: [2, 4],
  },
  4: {
    id: 4,
    title: "How to Withdraw Funds",
    category: "Withdrawal",
    content: `
      <h2>Withdrawing Your Funds</h2>
      <p>Learn how to withdraw your earnings and matured investments.</p>
      
      <h3>Eligibility for Withdrawal</h3>
      <p>You can withdraw funds when:</p>
      <ul>
        <li>Your investment has matured (lock-in period ended)</li>
        <li>You have withdrawable balance in your wallet</li>
        <li>Your bank details are verified</li>
      </ul>
      
      <h3>Withdrawal Process</h3>
      <ol>
        <li><strong>Check Withdrawable Balance:</strong> Go to Wallet and check your withdrawable amount</li>
        <li><strong>Add Bank Details:</strong> Ensure your bank account details are added in Profile settings</li>
        <li><strong>Request Withdrawal:</strong> Click "Withdraw" and enter the amount</li>
        <li><strong>Admin Approval:</strong> Your request will be reviewed by admin (1-3 business days)</li>
        <li><strong>Fund Transfer:</strong> Once approved, funds are transferred to your bank account (2-5 business days)</li>
      </ol>
      
      <h3>Important Notes</h3>
      <ul>
        <li>You cannot withdraw during the lock-in period</li>
        <li>Minimum withdrawal amount may apply</li>
        <li>Bank account must be in your name</li>
        <li>Withdrawal requests are processed on business days only</li>
      </ul>
      
      <h3>Tracking Withdrawal Status</h3>
      <p>You can track your withdrawal requests in the Wallet section. Status will show:</p>
      <ul>
        <li><strong>Pending:</strong> Awaiting admin approval</li>
        <li><strong>Approved:</strong> Approved and processing</li>
        <li><strong>Completed:</strong> Funds transferred successfully</li>
        <li><strong>Rejected:</strong> Request rejected (check reason)</li>
      </ul>
    `,
    relatedArticles: [2, 3],
  },
  5: {
    id: 5,
    title: "Account Settings & Profile",
    category: "Account",
    content: `
      <h2>Managing Your Account</h2>
      <p>Keep your account information up to date for a smooth experience.</p>
      
      <h3>Profile Information</h3>
      <p>You can update:</p>
      <ul>
        <li>Name</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Profile photo</li>
      </ul>
      
      <h3>Bank Details</h3>
      <p>Add or update your bank account details for withdrawals:</p>
      <ul>
        <li>Account Holder Name</li>
        <li>Account Number</li>
        <li>IFSC Code</li>
        <li>Bank Name</li>
      </ul>
      <p><strong>Note:</strong> Bank details cannot be changed if you have pending withdrawal requests.</p>
      
      <h3>Password Management</h3>
      <p>To change your password:</p>
      <ol>
        <li>Go to Profile settings</li>
        <li>Click "Change Password"</li>
        <li>Enter current and new password</li>
        <li>Save changes</li>
      </ol>
      
      <h3>Security</h3>
      <p>Keep your account secure:</p>
      <ul>
        <li>Use a strong password</li>
        <li>Don't share your login credentials</li>
        <li>Log out from shared devices</li>
        <li>Report any suspicious activity immediately</li>
      </ul>
    `,
    relatedArticles: [1, 6],
  },
  6: {
    id: 6,
    title: "Troubleshooting Common Issues",
    category: "Technical",
    content: `
      <h2>Common Issues and Solutions</h2>
      <p>Here are solutions to common problems you might encounter:</p>
      
      <h3>Login Issues</h3>
      <p><strong>Problem:</strong> Cannot log in to your account</p>
      <p><strong>Solutions:</strong></p>
      <ul>
        <li>Check if your email/phone and password are correct</li>
        <li>Try using OTP login instead</li>
        <li>Clear browser cache and cookies</li>
        <li>Try a different browser</li>
        <li>Contact support if issue persists</li>
      </ul>
      
      <h3>OTP Not Received</h3>
      <p><strong>Problem:</strong> Not receiving OTP on phone</p>
      <p><strong>Solutions:</strong></p>
      <ul>
        <li>Check if phone number is correct</li>
        <li>Check SMS inbox and spam folder</li>
        <li>Wait a few minutes and try again</li>
        <li>Use email OTP as alternative</li>
        <li>Contact support for assistance</li>
      </ul>
      
      <h3>Payment Issues</h3>
      <p><strong>Problem:</strong> Payment not going through</p>
      <p><strong>Solutions:</strong></p>
      <ul>
        <li>Check your bank account balance</li>
        <li>Verify payment gateway is working</li>
        <li>Try a different payment method</li>
        <li>Check internet connection</li>
        <li>Contact your bank if issue persists</li>
      </ul>
      
      <h3>Page Not Loading</h3>
      <p><strong>Problem:</strong> Website or pages not loading</p>
      <p><strong>Solutions:</strong></p>
      <ul>
        <li>Refresh the page</li>
        <li>Check your internet connection</li>
        <li>Clear browser cache</li>
        <li>Try incognito/private mode</li>
        <li>Update your browser</li>
      </ul>
      
      <h3>Still Need Help?</h3>
      <p>If you're still experiencing issues, contact our support team with details about the problem.</p>
    `,
    relatedArticles: [1, 5],
  },
};

const ArticleDetail = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const article = articles[parseInt(articleId)];

  if (!article) {
    return (
      <div className="article-detail-page">
        <header className="article-detail-header">
          <button
            type="button"
            className="article-detail-header__back"
            onClick={() => navigate("/help")}
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="article-detail-header__title">Article Not Found</h1>
          <div className="article-detail-header__spacer"></div>
        </header>
        <div className="article-detail-content">
          <div className="article-detail-empty">
            <p>Article not found. Please go back and try again.</p>
            <button
              type="button"
              className="article-detail-empty__button"
              onClick={() => navigate("/help")}
            >
              Back to Help Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  const relatedArticles = article.relatedArticles
    .map((id) => articles[id])
    .filter(Boolean);

  return (
    <div className="article-detail-page">
      {/* Header */}
      <header className="article-detail-header">
        <button
          type="button"
          className="article-detail-header__back"
          onClick={() => navigate("/help")}
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="article-detail-header__title">Help Article</h1>
        <div className="article-detail-header__spacer"></div>
      </header>

      <div className="article-detail-content">
        {/* Breadcrumb */}
        <nav className="article-detail-breadcrumb">
          <button type="button" onClick={() => navigate("/help")}>
            Help Center
          </button>
          <span>/</span>
          <span>{article.category}</span>
          <span>/</span>
          <span>{article.title}</span>
        </nav>

        {/* Article */}
        <article className="article-detail-article">
          <div className="article-detail-article__header">
            <div className="article-detail-article__icon">{getArticleIcon(article.category)}</div>
            <div>
              <span className="article-detail-article__category">{article.category}</span>
              <h1 className="article-detail-article__title">{article.title}</h1>
            </div>
          </div>

          <div
            className="article-detail-article__body"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="article-detail-related">
            <h2 className="article-detail-related__title">Related Articles</h2>
            <div className="article-detail-related__list">
              {relatedArticles.map((related) => (
                <button
                  key={related.id}
                  type="button"
                  className="article-detail-related__item"
                  onClick={() => navigate(`/help/${related.id}`)}
                >
                  <div className="article-detail-related__icon">{getRelatedArticleIcon(related.category)}</div>
                  <div className="article-detail-related__content">
                    <h3 className="article-detail-related__title-item">{related.title}</h3>
                    <span className="article-detail-related__category">{related.category}</span>
                  </div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="article-detail-help">
          <div className="article-detail-help__card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3>Still need help?</h3>
            <p>Can't find what you're looking for? Contact our support team.</p>
            <button
              type="button"
              className="article-detail-help__button"
              onClick={() => navigate("/chat")}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;

