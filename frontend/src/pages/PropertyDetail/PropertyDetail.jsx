import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useState, useMemo, useEffect } from "react";
import { propertyAPI, holdingAPI } from "../../services/api.js";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { holdings: contextHoldings } = useAppState();
  const [property, setProperty] = useState(null);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [propertyError, setPropertyError] = useState(null);
  const [userInvestments, setUserInvestments] = useState([]);
  const [calculatorAmount, setCalculatorAmount] = useState(500000);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [roiData, setRoiData] = useState(null);
  const [roiLoading, setRoiLoading] = useState(false);

  // Fetch property details from API
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setPropertyLoading(true);
        setPropertyError(null);
        console.log('📡 PropertyDetail - Fetching property:', id);
        const response = await propertyAPI.getById(id);

        if (response.success && response.data) {
          console.log('✅ PropertyDetail - Property fetched:', {
            propertyId: response.data._id,
            title: response.data.title,
            minInvestment: response.data.minInvestment,
            monthlyReturnRate: response.data.monthlyReturnRate,
            lockInMonths: response.data.lockInMonths
          });
          setProperty(response.data);
          // Set calculator default to property's min investment
          if (response.data.minInvestment) {
            setCalculatorAmount(response.data.minInvestment);
          }
        } else {
          console.error('❌ PropertyDetail - Property not found:', response.message);
          setPropertyError(response.message || 'Property not found');
        }
      } catch (error) {
        console.error('❌ PropertyDetail - Error fetching property:', error);
        setPropertyError(error.message || 'Failed to load property');
      } finally {
        setPropertyLoading(false);
      }
    };

    if (id && id !== 'undefined') {
      fetchProperty();
    } else {
      setPropertyError('Invalid property ID');
      setPropertyLoading(false);
    }
  }, [id]);

  // Fetch user holdings for this property
  useEffect(() => {
    const fetchUserHoldings = async () => {
      try {
        console.log('📡 PropertyDetail - Fetching user holdings for property:', id);
        const response = await holdingAPI.getAll();

        if (response.success && response.data) {
          // Filter holdings for this property
          const propertyHoldings = response.data.filter((h) => {
            const holdingPropertyId = h.propertyId?._id || h.propertyId || h.property;
            return holdingPropertyId === id;
          });
          console.log('✅ PropertyDetail - User holdings fetched:', {
            totalHoldings: response.data.length,
            propertyHoldings: propertyHoldings.length
          });
          setUserInvestments(propertyHoldings);
        }
      } catch (error) {
        console.error('❌ PropertyDetail - Error fetching holdings:', error);
        // Fallback to context holdings if API fails
        const propertyHoldings = contextHoldings.filter((h) => {
          const holdingPropertyId = h.propertyId?._id || h.propertyId || h.property;
          return holdingPropertyId === id;
        });
        setUserInvestments(propertyHoldings);
      }
    };

    if (id) {
      fetchUserHoldings();
    }
  }, [id, contextHoldings]);

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

  // Fetch ROI calculation from backend when calculator amount or property changes
  useEffect(() => {
    const fetchROI = async () => {
      if (!property || !id) {
        setRoiData(null);
        return;
      }

      try {
        setRoiLoading(true);
        const response = await propertyAPI.calculateROI(id, calculatorAmount);

        if (response.success && response.data) {
          setRoiData(response.data);
        } else {
          console.error('❌ PropertyDetail - Error calculating ROI:', response.message);
          // Fallback to default values
          setRoiData({
            investmentAmount: calculatorAmount,
            monthlyEarning: 0,
            totalEarnings: 0,
            lockInMonths: property.lockInMonths || 3,
            maturityDate: '',
          });
        }
      } catch (error) {
        console.error('❌ PropertyDetail - Error fetching ROI:', error);
        // Fallback to default values on error
        setRoiData({
          investmentAmount: calculatorAmount,
          monthlyEarning: 0,
          totalEarnings: 0,
          lockInMonths: property.lockInMonths || 3,
          maturityDate: '',
        });
      } finally {
        setRoiLoading(false);
      }
    };

    // Debounce API calls to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchROI();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [calculatorAmount, property, id]);

  // Default ROI data for display
  const calculateROI = roiData || {
    investmentAmount: calculatorAmount,
    monthlyEarning: 0,
    totalEarnings: 0,
    lockInMonths: property?.lockInMonths || 3,
    maturityDate: '',
  };


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
      answer: "Earnings start generating after the 3-month lock-in period. Every month after the lock-in period, you receive 0.5% of your invested amount as earnings, which can be withdrawn at any time (subject to manual processing).",
    },
    {
      id: 5,
      question: "How are monthly earnings calculated?",
      answer: "Monthly earnings are calculated as 0.5% of your total invested amount, starting from the 4th month after investment. For example, if you invest ₹10,00,000, you will start earning ₹5,000 per month from the 4th month onwards.",
    },
    {
      id: 6,
      question: "Can I invest multiple times in the same property?",
      answer: "Yes, you can invest multiple times in the same property. Each investment will have its own 3-month lock-in period and will generate monthly earnings separately.",
    },
  ];

  // Show loading state
  if (propertyLoading) {
    return (
      <div className="property-detail">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (propertyError || !property) {
    return (
      <div className="property-detail">
        <div className="property-detail__not-found" style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Property Not Found</h2>
          <p>{propertyError || "The property you are looking for does not exist."}</p>
          <button onClick={() => navigate("/explore")} className="btn-primary" style={{ marginTop: "1rem" }}>
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="property-detail">
      {/* Mobile Header */}
      <div className="property-detail__mobile-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {/* Header Section */}
      <button onClick={() => navigate(-1)} className="btn-back" style={{ position: 'absolute', left: '1rem', top: '1rem', zIndex: 10 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="property-detail__header">
        <div className="property-detail__header-box">
          <div className="property-detail__header-content">
            <div className="property-detail__icon">
              {property.image ? (
                <img
                  src={property.image}
                  alt={property.title}
                  className="property-detail__image"
                  onError={(e) => {
                    // Fallback to SVG if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <svg
                width="48"
                height="48"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: property.image ? 'none' : 'block' }}
              >
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
              <p className="property-detail__id">Property ID: {property.propertyId || property._id || property.id}</p>
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
          <span className="property-detail__info-label">Monthly return after 3 month of lock</span>
          <span className="property-detail__info-value property-detail__info-value--green">
            {property.monthlyReturnRate || 0.5}%
          </span>
        </div>
        <div className="property-detail__info-item">
          <span className="property-detail__info-label">Lock-in Period</span>
          <span className="property-detail__info-value">
            {property.lockInMonths || 3} months
          </span>
        </div>
        {property.title === 'Shaan Estate' && (
          <div className="property-detail__info-item">
            <span className="property-detail__info-label">Available Stocks</span>
            <span className="property-detail__info-value">
              {(() => {
                const storedStocks = localStorage.getItem('shaanEstate_totalStocks');
                const totalStocks = property.totalStocks || (storedStocks ? parseInt(storedStocks, 10) : 0);
                const remainingStocks = Math.max(0, totalStocks - (property.investorCount || 0));
                return totalStocks > 0 ? `${remainingStocks} / ${totalStocks}` : '0 / 0';
              })()}
            </span>
          </div>
        )}
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
            <span className="property-detail__term-value">
              {formatCurrency(property.minInvestment || 500000)} (mandatory)
            </span>
          </div>
          <div className="property-detail__term-item">
            <span className="property-detail__term-label">Maximum Investment</span>
            <span className="property-detail__term-value">
              {property.availableToInvest ? formatCurrency(property.availableToInvest) : 'No limit'}
            </span>
          </div>
          {property.title === 'Shaan Estate' && (
            <div className="property-detail__term-item">
              <span className="property-detail__term-label">Available Stocks</span>
              <span className="property-detail__term-value">
                {(() => {
                  const storedStocks = localStorage.getItem('shaanEstate_totalStocks');
                  const totalStocks = property.totalStocks || (storedStocks ? parseInt(storedStocks, 10) : 0);
                  const remainingStocks = Math.max(0, totalStocks - (property.investorCount || 0));
                  return totalStocks > 0 ? `${remainingStocks} of ${totalStocks} remaining` : '0 of 0 remaining';
                })()}
              </span>
            </div>
          )}
          <div className="property-detail__term-item">
            <span className="property-detail__term-label">Lock-in Period</span>
            <span className="property-detail__term-value">
              {property.lockInMonths || 3} months (cannot withdraw before)
            </span>
          </div>
          <div className="property-detail__term-item">
            <span className="property-detail__term-label">Monthly return after 3 month of lock</span>
            <span className="property-detail__term-value">
              {property.monthlyReturnRate || 0.5}% of invested amount (after 3-month lock-in)
            </span>
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
              const investmentId = investment._id || investment.id;
              const purchaseDate = investment.purchaseDate || investment.createdAt;
              const maturityDate = investment.maturityDate;

              // Calculate if matured: check if maturity date has passed
              const isMatured = investment.status === "matured" ||
                (maturityDate && new Date(maturityDate) <= new Date());

              return (
                <div key={investmentId} className="property-detail__table-row">
                  <span>{formatDate(purchaseDate)}</span>
                  <span className="property-detail__table-value">
                    {formatCurrency(investment.amountInvested || 0, "INR")}
                  </span>
                  <span className={`property-detail__table-status ${isMatured ? "property-detail__table-status--matured" : "property-detail__table-status--locked"}`}>
                    {isMatured ? "Matured" : "Locked"}
                  </span>
                  <span>{maturityDate ? formatDate(maturityDate) : "N/A"}</span>
                  <span className="property-detail__table-value property-detail__table-value--green">
                    {formatCurrency(investment.monthlyEarning || 0, "INR")}/month
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
            <label htmlFor="calculator-amount">
              Investment Amount (Minimum {formatCurrency(property.minInvestment || 500000)})
            </label>
            <input
              id="calculator-amount"
              type="number"
              min={property.minInvestment || 500000}
              step="100000"
              value={calculatorAmount}
              onChange={(e) => setCalculatorAmount(Math.max(property.minInvestment || 500000, parseInt(e.target.value) || property.minInvestment || 500000))}
              className="property-detail__input"
            />
          </div>
          {roiLoading && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
              Calculating...
            </div>
          )}
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
              <span className="property-detail__calc-subtext">
                {property.monthlyReturnRate || 0.5}% per month (after 3-month lock-in)
              </span>
            </div>
            <div className="property-detail__calc-card">
              <span className="property-detail__calc-label">Lock-in Period</span>
              <span className="property-detail__calc-value">
                {calculateROI.lockInMonths || property.lockInMonths || 3} months
              </span>
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
              <span className="property-detail__calc-subtext">
                After {calculateROI.lockInMonths || property.lockInMonths || 3} months
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      {property.documents && property.documents.length > 0 && (
        <div className="property-detail__documents">
          <h2 className="property-detail__section-title">Legal Documents</h2>
          <div className="property-detail__documents-list">
            {property.documents.map((docUrl, index) => {
              const docName = docUrl.split('/').pop() || `Document ${index + 1}`;
              return (
                <a
                  key={index}
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="property-detail__document-item"
                >
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
                    <span className="property-detail__document-name">{docName}</span>
                    <span className="property-detail__document-size">PDF Document</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              );
            })}
          </div>
        </div>
      )}

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
        <button
          onClick={() => {
            if (!calculateROI || !property) return;
            // Check if property is active before allowing investment
            if (property.status !== 'active') {
              alert(`This property is ${property.status}. Only active properties are available for investment.`);
              return;
            }
            navigate("/invest", {
              state: {
                propertyId: property._id || property.id,
                propertyTitle: property.title,
                investmentAmount: calculateROI.investmentAmount,
                monthlyEarning: calculateROI.monthlyEarning,
                totalEarnings: calculateROI.totalEarnings,
                lockInMonths: calculateROI.lockInMonths,
                maturityDate: calculateROI.maturityDate,
                monthlyReturnRate: property.monthlyReturnRate || 0.5,
              }
            });
          }}
          className="property-detail__invest-btn property-detail__invest-btn--large"
          disabled={property.status !== 'active'}
          title={property.status !== 'active' ? `This property is ${property.status}. Only active properties are available for investment.` : 'Invest in this property'}
        >
          {property.status === 'active' ? 'Invest Now' : `Property ${property.status.charAt(0).toUpperCase() + property.status.slice(1)}`}
        </button>
      </div>
    </div>
  );
};

export default PropertyDetail;

