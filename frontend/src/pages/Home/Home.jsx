import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const sectionsRef = useRef([]);

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("home-section--visible");
        }
      });
    }, observerOptions);

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero__content">
          <h1 className="home-hero__title">
            Welcome to <span className="home-hero__highlight">DigitalAssets</span>
          </h1>
          <p className="home-hero__subtitle">
            Your Gateway to Real Estate Investment Opportunities
          </p>
          <div className="home-hero__actions">
            <button
              className="home-hero__btn home-hero__btn--primary"
              onClick={() => navigate("/explore")}
            >
              Explore Properties
            </button>
            <button
              className="home-hero__btn home-hero__btn--secondary"
              onClick={() => navigate("/dashboard")}
            >
              View Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* About the Platform */}
      <section
        ref={addToRefs}
        className="home-section home-section--about-platform"
      >
        <div className="home-section__container">
          <div className="home-section__header">
            <h2 className="home-section__title">About Our Platform</h2>
            <div className="home-section__underline"></div>
          </div>
          <div className="home-section__content">
            <div className="home-feature-grid">
              <div className="home-feature-card">
                <div className="home-feature-card__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <h3 className="home-feature-card__title">Real Estate Investment</h3>
                <p className="home-feature-card__description">
                  Invest in premium real estate properties with fractional ownership. Start with as little as ₹5,00,000 and build your portfolio.
                </p>
              </div>
              <div className="home-feature-card">
                <div className="home-feature-card__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <h3 className="home-feature-card__title">Monthly Returns</h3>
                <p className="home-feature-card__description">
                  Earn consistent monthly returns of 0.5% on your investments. Receive regular payouts directly to your wallet.
                </p>
              </div>
              <div className="home-feature-card">
                <div className="home-feature-card__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <h3 className="home-feature-card__title">Flexible Terms</h3>
                <p className="home-feature-card__description">
                  Choose investment periods from 3 months to 24 months. After 3 months, you can sell your holdings to other investors.
                </p>
              </div>
              <div className="home-feature-card">
                <div className="home-feature-card__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <h3 className="home-feature-card__title">Secure & Transparent</h3>
                <p className="home-feature-card__description">
                  All transactions are secure and transparent. Track your investments, earnings, and property details in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Properties */}
      <section
        ref={addToRefs}
        className="home-section home-section--about-property"
      >
        <div className="home-section__container">
          <div className="home-section__header">
            <h2 className="home-section__title">About Our Properties</h2>
            <div className="home-section__underline"></div>
          </div>
          <div className="home-section__content">
            <div className="home-property-info">
              <div className="home-property-info__item">
                <h3 className="home-property-info__title">Premium Real Estate Assets</h3>
                <p className="home-property-info__text">
                  Our platform offers carefully curated real estate properties across prime locations. Each property undergoes rigorous due diligence to ensure quality and potential for returns.
                </p>
              </div>
              <div className="home-property-info__item">
                <h3 className="home-property-info__title">Fractional Ownership</h3>
                <p className="home-property-info__text">
                  You don't need to buy an entire property. Invest in fractional shares starting from ₹5,00,000. Own a portion of premium real estate and earn returns proportional to your investment.
                </p>
              </div>
              <div className="home-property-info__item">
                <h3 className="home-property-info__title">Diversified Portfolio</h3>
                <p className="home-property-info__text">
                  Build a diversified real estate portfolio by investing in multiple properties. Spread your risk and maximize your earning potential across different property types and locations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Criteria */}
      <section
        ref={addToRefs}
        className="home-section home-section--criteria"
      >
        <div className="home-section__container">
          <div className="home-section__header">
            <h2 className="home-section__title">Investment Criteria</h2>
            <div className="home-section__underline"></div>
          </div>
          <div className="home-section__content">
            <div className="home-criteria-list">
              <div className="home-criteria-item">
                <div className="home-criteria-item__number">01</div>
                <div className="home-criteria-item__content">
                  <h3 className="home-criteria-item__title">Minimum Investment</h3>
                  <p className="home-criteria-item__description">
                    Minimum investment amount is ₹5,00,000 per property. You can invest in multiple properties to build your portfolio.
                  </p>
                </div>
              </div>
              <div className="home-criteria-item">
                <div className="home-criteria-item__number">02</div>
                <div className="home-criteria-item__content">
                  <h3 className="home-criteria-item__title">Investment Period</h3>
                  <p className="home-criteria-item__description">
                    Choose from flexible investment periods: 3 months (minimum lock-in), 6 months, 12 months, or 24 months.
                  </p>
                </div>
              </div>
              <div className="home-criteria-item">
                <div className="home-criteria-item__number">03</div>
                <div className="home-criteria-item__content">
                  <h3 className="home-criteria-item__title">Monthly Returns</h3>
                  <p className="home-criteria-item__description">
                    Earn 0.5% monthly returns on your investment. Returns are calculated and paid monthly to your wallet.
                  </p>
                </div>
              </div>
              <div className="home-criteria-item">
                <div className="home-criteria-item__number">04</div>
                <div className="home-criteria-item__content">
                  <h3 className="home-criteria-item__title">Lock-in Period</h3>
                  <p className="home-criteria-item__description">
                    There is a 3-month lock-in period. After this period, you can withdraw your investment or sell your holdings to other investors.
                  </p>
                </div>
              </div>
              <div className="home-criteria-item">
                <div className="home-criteria-item__number">05</div>
                <div className="home-criteria-item__content">
                  <h3 className="home-criteria-item__title">KYC Verification</h3>
                  <p className="home-criteria-item__description">
                    Complete KYC (Know Your Customer) verification before making your first investment. This ensures compliance and security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Flow */}
      <section
        ref={addToRefs}
        className="home-section home-section--flow"
      >
        <div className="home-section__container">
          <div className="home-section__header">
            <h2 className="home-section__title">Investment Process Flow</h2>
            <div className="home-section__underline"></div>
          </div>
          <div className="home-section__content">
            <div className="home-flow">
              <div className="home-flow__step">
                <div className="home-flow__step-icon">
                  <div className="home-flow__step-number">1</div>
                </div>
                <h3 className="home-flow__step-title">Browse Properties</h3>
                <p className="home-flow__step-description">
                  Explore available properties, view details, investment amounts, and expected returns.
                </p>
              </div>
              <div className="home-flow__connector"></div>
              <div className="home-flow__step">
                <div className="home-flow__step-icon">
                  <div className="home-flow__step-number">2</div>
                </div>
                <h3 className="home-flow__step-title">Complete KYC</h3>
                <p className="home-flow__step-description">
                  Verify your identity by completing the KYC process. Upload required documents for verification.
                </p>
              </div>
              <div className="home-flow__connector"></div>
              <div className="home-flow__step">
                <div className="home-flow__step-icon">
                  <div className="home-flow__step-number">3</div>
                </div>
                <h3 className="home-flow__step-title">Create Investment Request</h3>
                <p className="home-flow__step-description">
                  Select your property, choose investment amount and period, and submit your investment request.
                </p>
              </div>
              <div className="home-flow__connector"></div>
              <div className="home-flow__step">
                <div className="home-flow__step-icon">
                  <div className="home-flow__step-number">4</div>
                </div>
                <h3 className="home-flow__step-title">Make Payment</h3>
                <p className="home-flow__step-description">
                  Complete payment through secure payment gateway. Your investment will be processed after payment confirmation.
                </p>
              </div>
              <div className="home-flow__connector"></div>
              <div className="home-flow__step">
                <div className="home-flow__step-icon">
                  <div className="home-flow__step-number">5</div>
                </div>
                <h3 className="home-flow__step-title">Receive Certificate</h3>
                <p className="home-flow__step-description">
                  Get your investment certificate and start earning monthly returns. Track your investment in your wallet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policy & Terms */}
      <section
        ref={addToRefs}
        className="home-section home-section--policy"
      >
        <div className="home-section__container">
          <div className="home-section__header">
            <h2 className="home-section__title">Policies & Terms</h2>
            <div className="home-section__underline"></div>
          </div>
          <div className="home-section__content">
            <div className="home-policy-grid">
              <div className="home-policy-card">
                <h3 className="home-policy-card__title">Buying Policy</h3>
                <ul className="home-policy-card__list">
                  <li>Minimum investment: ₹5,00,000 per property</li>
                  <li>Investment periods: 3, 6, 12, or 24 months</li>
                  <li>3-month lock-in period applies to all investments</li>
                  <li>KYC verification required before first investment</li>
                  <li>All investments are subject to property availability</li>
                  <li>Returns are calculated monthly at 0.5% rate</li>
                </ul>
              </div>
              <div className="home-policy-card">
                <h3 className="home-policy-card__title">Selling Policy</h3>
                <ul className="home-policy-card__list">
                  <li>Holdings can be sold after 3-month lock-in period</li>
                  <li>Minimum sale price: 80% of original investment</li>
                  <li>Find buyers through the platform or contact property owner</li>
                  <li>Transfer requests require buyer acceptance</li>
                  <li>Admin approval required for ownership transfer</li>
                  <li>Sale proceeds are credited to your wallet</li>
                </ul>
              </div>
              <div className="home-policy-card">
                <h3 className="home-policy-card__title">Withdrawal Policy</h3>
                <ul className="home-policy-card__list">
                  <li>Investment withdrawal available after 3 months</li>
                  <li>Earnings can be withdrawn at any time</li>
                  <li>Withdrawal requests processed within 3-5 business days</li>
                  <li>Bank account verification required for withdrawals</li>
                  <li>Minimum withdrawal amount: ₹1,000</li>
                  <li>Processing fees may apply as per terms</li>
                </ul>
              </div>
              <div className="home-policy-card">
                <h3 className="home-policy-card__title">Terms & Conditions</h3>
                <ul className="home-policy-card__list">
                  <li>All investments are subject to market risks</li>
                  <li>Returns are not guaranteed and may vary</li>
                  <li>Platform reserves right to modify terms with notice</li>
                  <li>Users must comply with all regulatory requirements</li>
                  <li>Disputes will be resolved through arbitration</li>
                  <li>Platform is not liable for property value fluctuations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta">
        <div className="home-cta__content">
          <h2 className="home-cta__title">Ready to Start Investing?</h2>
          <p className="home-cta__subtitle">
            Join thousands of investors building wealth through real estate
          </p>
          <div className="home-cta__actions">
            <button
              className="home-cta__btn home-cta__btn--primary"
              onClick={() => navigate("/explore")}
            >
              Explore Properties
            </button>
            <button
              className="home-cta__btn home-cta__btn--secondary"
              onClick={() => navigate("/kyc")}
            >
              Complete KYC
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

