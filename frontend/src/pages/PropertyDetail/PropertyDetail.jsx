import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useState, useMemo } from "react";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, holdings } = useAppState();
  const [calculatorAmount, setCalculatorAmount] = useState(500000);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const property = listings.find((p) => p.id === id);
  const userInvestments = holdings.filter((h) => h.propertyId === id);

  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const calculateROI = useMemo(() => {
    const amount = calculatorAmount >= 500000 ? calculatorAmount : 500000;
    const monthlyEarning = amount * 0.005;
    const totalEarnings3Months = monthlyEarning * 3;
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + 3);
    return {
      investmentAmount: amount,
      monthlyEarning,
      totalEarnings3Months,
      maturityDate: maturityDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };
  }, [calculatorAmount]);


  const faqs = [
    {
      id: 1,
      question: "What is the minimum investment?",
      answer: "The minimum investment required is ₹5,00,000 (5 Lakh). You can invest any amount above this minimum, with no maximum limit.",
    },
    {
      id: 2,
      question: "What is the lock-in period?",
      answer: "The lock-in period is 3 months (90 days). During this period, you cannot withdraw your investment amount. After 3 months, your investment becomes withdrawable.",
    },
    {
      id: 3,
      question: "When can I withdraw my investment?",
      answer: "You can withdraw your investment amount only after the 3-month lock-in period is complete. The investment becomes withdrawable on the maturity date.",
    },
    {
      id: 4,
      question: "When can I withdraw earnings?",
      answer: "Earnings can be withdrawn monthly. Every month, you receive 0.5% of your invested amount as earnings, which can be withdrawn at any time (subject to manual processing).",
    },
    {
      id: 5,
      question: "How are monthly earnings calculated?",
      answer: "Monthly earnings are calculated as 0.5% of your total invested amount. For example, if you invest ₹10,00,000, you will earn ₹5,000 per month.",
    },
    {
      id: 6,
      question: "Can I invest multiple times in the same property?",
      answer: "Yes, you can invest multiple times in the same property. Each investment will have its own 3-month lock-in period and will generate monthly earnings separately.",
    },
  ];

  if (!property) {
    return (
      <div className="property-detail">
        <div className="property-detail__not-found">
          <h2>Property Not Found</h2>
          <p>The property you are looking for does not exist.</p>
          <button onClick={() => navigate("/explore")} className="btn-primary">
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="property-detail">
      {/* Header Section */}
      <div className="property-detail__header">
        <div className="property-detail__header-top">
          <button onClick={() => navigate(-1)} className="property-detail__back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <button onClick={() => navigate("/invest", { state: { propertyId: property.id } })} className="property-detail__invest-btn property-detail__invest-btn--top">
            Invest Now
          </button>
        </div>
        <div className="property-detail__header-box">
          <div className="property-detail__header-content">
            <div className="property-detail__icon">
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#e0e7ff" />
                <path
                  d="M16 8L24 12V20L16 24L8 20V12L16 8Z"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="property-detail__header-info">
              <h1 className="property-detail__title">{property.title}</h1>
              <p className="property-detail__type">Digital Property</p>
              <p className="property-detail__description">{property.description || "Premium digital property investment opportunity"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Investment Info Card */}
      <div className="property-detail__info-card">
        <div className="property-detail__info-item">
          <span className="property-detail__info-label">Minimum Investment</span>
          <span className="property-detail__info-value">{formatCurrency(property.minInvestment, "INR")}</span>
        </div>
        <div className="property-detail__info-item">
          <span className="property-detail__info-label">Monthly Return</span>
          <span className="property-detail__info-value property-detail__info-value--green">0.5%</span>
        </div>
        <div className="property-detail__info-item">
          <span className="property-detail__info-label">Lock-in Period</span>
          <span className="property-detail__info-value">3 months</span>
        </div>
        <div className="property-detail__info-item">
          <span className="property-detail__info-label">Deadline</span>
          <span className="property-detail__info-value">{formatDate(property.deadline)}</span>
        </div>
      </div>

      {/* Investment Terms */}
      <div className="property-detail__terms">
        <h2 className="property-detail__section-title">Investment Terms</h2>
        <div className="property-detail__terms-list">
          <div className="property-detail__term-item">
            <span className="property-detail__term-label">Minimum Investment</span>
            <span className="property-detail__term-value">₹5,00,000 (mandatory)</span>
          </div>
          <div className="property-detail__term-item">
            <span className="property-detail__term-label">Maximum Investment</span>
            <span className="property-detail__term-value">No limit</span>
          </div>
          <div className="property-detail__term-item">
            <span className="property-detail__term-label">Lock-in Period</span>
            <span className="property-detail__term-value">3 months (cannot withdraw before)</span>
          </div>
          <div className="property-detail__term-item">
            <span className="property-detail__term-label">Monthly Return</span>
            <span className="property-detail__term-value">0.5% of invested amount</span>
          </div>
          <div className="property-detail__term-item">
            <span className="property-detail__term-label">Earnings Withdrawal</span>
            <span className="property-detail__term-value">Available monthly (manual processing)</span>
          </div>
          <div className="property-detail__term-item">
            <span className="property-detail__term-label">Investment Withdrawal</span>
            <span className="property-detail__term-value">After 3 months lock-in period</span>
          </div>
        </div>
      </div>

      {/* Your Investments Table */}
      {userInvestments.length > 0 && (
        <div className="property-detail__investments">
          <h2 className="property-detail__section-title">Your Investments</h2>
          <div className="property-detail__investments-table">
            <div className="property-detail__table-header">
              <span>Date</span>
              <span>Amount Invested</span>
              <span>Status</span>
              <span>Lock-in Ends</span>
              <span>Monthly Earning</span>
            </div>
            {userInvestments.map((investment) => {
              const isMatured = investment.status === "matured" || investment.daysRemaining === 0;
              return (
                <div key={investment.id} className="property-detail__table-row">
                  <span>{formatDate(investment.purchaseDate)}</span>
                  <span className="property-detail__table-value">{formatCurrency(investment.amountInvested, "INR")}</span>
                  <span className={`property-detail__table-status ${isMatured ? "property-detail__table-status--matured" : "property-detail__table-status--locked"}`}>
                    {isMatured ? "Matured" : "Locked"}
                  </span>
                  <span>{formatDate(investment.maturityDate)}</span>
                  <span className="property-detail__table-value property-detail__table-value--green">
                    {formatCurrency(investment.monthlyEarning, "INR")}/month
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROI Calculator */}
      <div className="property-detail__calculator">
        <h2 className="property-detail__section-title">ROI Calculator</h2>
        <div className="property-detail__calculator-content">
          <div className="property-detail__calculator-input">
            <label htmlFor="calculator-amount">Investment Amount (Minimum ₹5,00,000)</label>
            <input
              id="calculator-amount"
              type="number"
              min="500000"
              step="100000"
              value={calculatorAmount}
              onChange={(e) => setCalculatorAmount(Math.max(500000, parseInt(e.target.value) || 500000))}
              className="property-detail__input"
            />
          </div>
          <div className="property-detail__calculator-grid">
            <div className="property-detail__calc-card">
              <span className="property-detail__calc-label">Investment Amount</span>
              <span className="property-detail__calc-value">{formatCurrency(calculateROI.investmentAmount, "INR")}</span>
            </div>
            <div className="property-detail__calc-card property-detail__calc-card--earning">
              <span className="property-detail__calc-label">Monthly Earning</span>
              <span className="property-detail__calc-value property-detail__calc-value--green">
                {formatCurrency(calculateROI.monthlyEarning, "INR")}
              </span>
              <span className="property-detail__calc-subtext">0.5% per month</span>
            </div>
            <div className="property-detail__calc-card">
              <span className="property-detail__calc-label">Lock-in Period</span>
              <span className="property-detail__calc-value">3 months</span>
            </div>
            <div className="property-detail__calc-card property-detail__calc-card--earning">
              <span className="property-detail__calc-label">Total Earnings</span>
              <span className="property-detail__calc-value property-detail__calc-value--green">
                {formatCurrency(calculateROI.totalEarnings3Months, "INR")}
              </span>
              <span className="property-detail__calc-subtext">In 3 months</span>
            </div>
            <div className="property-detail__calc-card">
              <span className="property-detail__calc-label">Maturity Date</span>
              <span className="property-detail__calc-value">{calculateROI.maturityDate}</span>
            </div>
            <div className="property-detail__calc-card property-detail__calc-card--highlight">
              <span className="property-detail__calc-label">Withdrawable Amount</span>
              <span className="property-detail__calc-value">
                {formatCurrency(calculateROI.investmentAmount, "INR")}
              </span>
              <span className="property-detail__calc-subtext">After 3 months</span>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="property-detail__documents">
        <h2 className="property-detail__section-title">Legal Documents</h2>
        <div className="property-detail__documents-list">
          <a href="#" className="property-detail__document-item" onClick={(e) => e.preventDefault()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <span className="property-detail__document-name">Property Agreement</span>
              <span className="property-detail__document-size">PDF Document</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a href="#" className="property-detail__document-item" onClick={(e) => e.preventDefault()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <span className="property-detail__document-name">Terms & Conditions</span>
              <span className="property-detail__document-size">PDF Document</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a href="#" className="property-detail__document-item" onClick={(e) => e.preventDefault()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <span className="property-detail__document-name">Investment Certificate Template</span>
              <span className="property-detail__document-size">PDF Document</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="property-detail__faq">
        <h2 className="property-detail__section-title">Frequently Asked Questions</h2>
        <div className="property-detail__faq-list">
          {faqs.map((faq) => (
            <div key={faq.id} className="property-detail__faq-item">
              <button
                className={`property-detail__faq-question ${expandedFaq === faq.id ? "property-detail__faq-question--active" : ""}`}
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <span>{faq.question}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`property-detail__faq-icon ${expandedFaq === faq.id ? "property-detail__faq-icon--rotated" : ""}`}
                >
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {expandedFaq === faq.id && <div className="property-detail__faq-answer">{faq.answer}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Invest Now Button */}
      <div className="property-detail__bottom-action">
        <button onClick={() => navigate("/invest", { state: { propertyId: property.id } })} className="property-detail__invest-btn property-detail__invest-btn--large">
          Invest Now
        </button>
      </div>
    </div>
  );
};

export default PropertyDetail;

