import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FAQ.css";

// Mock FAQ data
const faqData = [
  {
    id: 1,
    category: "General",
    question: "What is Digital Asset Investment Platform?",
    answer: "Digital Asset Investment Platform is a platform where you can invest in digital properties like real estate, tech assets, domains, and NFTs. You can start investing with a minimum amount and earn returns over a lock-in period.",
  },
  {
    id: 2,
    category: "General",
    question: "How do I get started?",
    answer: "To get started, you need to: 1) Register an account, 2) Complete KYC verification, 3) Add funds to your wallet, 4) Browse available properties, and 5) Make your first investment.",
  },
  {
    id: 3,
    category: "KYC",
    question: "What documents are required for KYC verification?",
    answer: "You need to submit: PAN Card document, Aadhaar Card document, Profile Photo (image file), and Address Proof document. You also need to provide your PAN Number and Aadhaar Number.",
  },
  {
    id: 4,
    category: "KYC",
    question: "How long does KYC verification take?",
    answer: "KYC verification typically takes 1-3 business days. You'll receive a notification once your KYC is approved or if any additional documents are required.",
  },
  {
    id: 5,
    category: "KYC",
    question: "What if my KYC is rejected?",
    answer: "If your KYC is rejected, you'll receive a rejection reason. You can review the reason, update your documents, and resubmit your KYC application. You can also contact support for assistance.",
  },
  {
    id: 6,
    category: "KYC",
    question: "Can I invest without completing KYC?",
    answer: "No, KYC verification is mandatory before you can invest in any property. This is required for compliance and security purposes.",
  },
  {
    id: 7,
    category: "Investment",
    question: "What is the minimum investment amount?",
    answer: "The minimum investment amount varies by property. Most properties have a minimum investment of ₹5,00,000. Check the property details page for specific requirements.",
  },
  {
    id: 8,
    category: "Investment",
    question: "What is a lock-in period?",
    answer: "Lock-in period is the duration during which your investment is locked and cannot be withdrawn. After the lock-in period ends, you can withdraw your investment and earnings.",
  },
  {
    id: 9,
    category: "Investment",
    question: "How are returns calculated?",
    answer: "Returns are calculated based on the property's return rate and your investment amount. Returns are typically paid monthly or as specified in the property details.",
  },
  {
    id: 10,
    category: "Investment",
    question: "Can I invest in multiple properties?",
    answer: "Yes, you can invest in multiple properties. Each investment is tracked separately in your portfolio, and you can manage all your investments from the Wallet section.",
  },
  {
    id: 11,
    category: "Wallet",
    question: "How do I add money to my wallet?",
    answer: "You can add money to your wallet through the payment gateway when making an investment. Currently, we support UPI, Debit/Credit Cards, and Net Banking.",
  },
  {
    id: 12,
    category: "Wallet",
    question: "What is withdrawable balance?",
    answer: "Withdrawable balance is the amount you can withdraw from your wallet. This includes earnings from matured investments and any funds that are not locked in active investments.",
  },
  {
    id: 13,
    category: "Wallet",
    question: "How do I view my transaction history?",
    answer: "You can view your complete transaction history in the Wallet section. It shows all investments, earnings, withdrawals, and other transactions with dates and status.",
  },
  {
    id: 14,
    category: "Withdrawal",
    question: "When can I withdraw my investment?",
    answer: "You can withdraw your investment only after the lock-in period ends and the investment has matured. You cannot withdraw during the lock-in period.",
  },
  {
    id: 15,
    category: "Withdrawal",
    question: "How long does withdrawal take?",
    answer: "Withdrawal requests are processed within 1-3 business days. Once approved, funds are transferred to your registered bank account within 2-5 business days.",
  },
  {
    id: 16,
    category: "Withdrawal",
    question: "Do I need to provide bank details for withdrawal?",
    answer: "Yes, you need to provide your bank account details (Account Number, IFSC Code, Account Holder Name) before you can withdraw funds. You can add or update bank details in your Profile settings.",
  },
  {
    id: 17,
    category: "Account",
    question: "How do I update my profile information?",
    answer: "You can update your profile information from the Profile page. Click on 'Edit Profile' to update your name, email, phone number, and other details.",
  },
  {
    id: 18,
    category: "Account",
    question: "How do I change my password?",
    answer: "You can change your password from the Profile settings. If you've forgotten your password, use the 'Forgot Password' option on the login page.",
  },
  {
    id: 19,
    category: "Account",
    question: "Can I delete my account?",
    answer: "To delete your account, please contact our support team. Note that you cannot delete your account if you have active investments or pending transactions.",
  },
  {
    id: 20,
    category: "Technical",
    question: "I'm having trouble logging in. What should I do?",
    answer: "If you're having trouble logging in, try: 1) Check if your email/phone and password are correct, 2) Use the OTP login option, 3) Clear your browser cache, 4) Contact support if the issue persists.",
  },
  {
    id: 21,
    category: "Technical",
    question: "The app is not loading properly. What can I do?",
    answer: "Try these steps: 1) Refresh the page, 2) Clear browser cache and cookies, 3) Check your internet connection, 4) Try a different browser, 5) Contact support if the problem continues.",
  },
];

const categories = ["All", "General", "KYC", "Investment", "Wallet", "Withdrawal", "Account", "Technical"];

const FAQ = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (id) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = faqData.filter((faq) => {
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="faq-page">
      {/* Header */}
      <header className="faq-header">
        <button
          type="button"
          className="faq-header__back"
          onClick={() => navigate("/help")}
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="faq-header__title">Frequently Asked Questions</h1>
        <div className="faq-header__spacer"></div>
      </header>

      <div className="faq-content">
        {/* Search Bar */}
        <div className="faq-search">
          <div className="faq-search__wrapper">
            <svg
              className="faq-search__icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="faq-search__input"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="faq-search__clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="faq-categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`faq-category-tab ${selectedCategory === category ? "faq-category-tab--active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="faq-items">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <div key={faq.id} className="faq-item">
                <button
                  type="button"
                  className={`faq-item__question ${openItems.has(faq.id) ? "faq-item__question--active" : ""}`}
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={openItems.has(faq.id)}
                >
                  <span className="faq-item__question-text">{faq.question}</span>
                  <svg
                    className={`faq-item__icon ${openItems.has(faq.id) ? "faq-item__icon--rotated" : ""}`}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {openItems.has(faq.id) && (
                  <div className="faq-item__answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="faq-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p>No FAQs found. Try a different search term or category.</p>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="faq-help-section">
          <div className="faq-help-card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3>Still have questions?</h3>
            <p>Can't find the answer you're looking for? Contact our support team for assistance.</p>
            <button
              type="button"
              className="faq-help-card__button"
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

export default FAQ;



