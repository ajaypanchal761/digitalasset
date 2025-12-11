import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import heroBackground from "../../assets/hero-section-main.jpg";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const sectionsRef = useRef([]);
  const heroRef = useRef(null);

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

    // Parallax effect for hero background (subtle)
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.3;
        if (scrolled < window.innerHeight) {
          heroRef.current.style.transform = `translate3d(0, ${scrolled * parallaxSpeed}px, 0)`;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section);
      });
      window.removeEventListener("scroll", handleScroll);
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
        <div className="home-hero__background" ref={heroRef}>
          <img 
            src={heroBackground} 
            alt="Handshake background" 
            className="home-hero__bg-image"
            loading="eager"
          />
        </div>
        <div className="home-hero__overlay"></div>
        <div className="home-hero__container">
          <div className="home-hero__content-wrapper">
            <div className="home-hero__content">
              <h1 className="home-hero__title">
                <span className="home-hero__title-line">Welcome to</span>
                <span className="home-hero__highlight">DigitalAssets</span>
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

      {/* Footer Section */}
      <footer className="home-footer">
        <div className="home-footer__container">
          <div className="home-footer__content">
            {/* Company Info */}
            <div className="home-footer__section">
              <h3 className="home-footer__logo">DigitalAssets</h3>
              <p className="home-footer__description">
                Your trusted platform for real estate investment opportunities. 
                Start building wealth through fractional property ownership.
              </p>
              <div className="home-footer__social">
                <a href="#" className="home-footer__social-link" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="home-footer__social-link" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="home-footer__social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="home-footer__social-link" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="home-footer__section">
              <h4 className="home-footer__heading">Quick Links</h4>
              <ul className="home-footer__links">
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/explore"); }}>Explore Properties</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>Dashboard</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/kyc"); }}>KYC Verification</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/support"); }}>Support</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/help"); }}>Help Center</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="home-footer__section">
              <h4 className="home-footer__heading">Company</h4>
              <ul className="home-footer__links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">How It Works</a></li>
                <li><a href="#">Investment Process</a></li>
                <li><a href="#">Our Properties</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="home-footer__section">
              <h4 className="home-footer__heading">Legal</h4>
              <ul className="home-footer__links">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms & Conditions</a></li>
                <li><a href="#">Refund Policy</a></li>
                <li><a href="#">Disclaimer</a></li>
                <li><a href="#">Compliance</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="home-footer__section">
              <h4 className="home-footer__heading">Contact</h4>
              <ul className="home-footer__contact">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>123 Business Street, Mumbai, India</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>+91 1800-123-4567</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>support@digitalassets.com</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="home-footer__bottom">
            <p className="home-footer__copyright">
              © {new Date().getFullYear()} DigitalAssets. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

