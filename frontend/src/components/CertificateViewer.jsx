import "./CertificateViewer.css";

const CertificateViewer = ({ holding, user, onClose }) => {
  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  const generateCertificateNumber = () => {
    if (!holding) return "CERT-000000";
    const holdingId = holding.id.replace("holding-", "");
    const date = new Date(holding.purchaseDate || new Date());
    const year = date.getFullYear();
    return `CERT-${year}-${holdingId.padStart(6, "0")}`;
  };

  if (!holding || !user) return null;

  const certificateNumber = generateCertificateNumber();
  const issueDate = formatDate(holding.purchaseDate);
  const maturityDate = formatDate(holding.maturityDate);

  return (
    <div className="certificate-modal" onClick={onClose}>
      <div className="certificate-modal__overlay"></div>
      <div className="certificate-modal__content" onClick={(e) => e.stopPropagation()}>
        <button className="certificate-modal__close-btn" onClick={onClose} aria-label="Close certificate">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="certificate__wrapper">
          <div className="certificate">
            {/* Watermark Logo */}
            <div className="certificate__watermark">
              <img src="/logo1.png" alt="" />
            </div>

            <div className="certificate__header">
              <div className="certificate__logo">
                <img src="/logo1.png" alt="Shaan Estate Logo" />
              </div>
              <p className="certificate__company-subtitle">Digital Property Division</p>
              <div className="certificate__header-line"></div>
              <h2 className="certificate__main-title">CERTIFICATE OF DIGITAL PROPERTY OWNERSHIP</h2>
            </div>

            <div className="certificate__body">
              <div className="certificate__intro">
                <p>This is to certify that:</p>

              </div>

              <div className="certificate__details-grid">
                <div className="certificate__field">
                  <span className="certificate__label">Owner Name:</span>
                  <span className="certificate__value certificate__value--bold">{user.name}</span>
                </div>
                <div className="certificate__field">
                  <span className="certificate__label">Mobile Number:</span>
                  <span className="certificate__value">{user.phone || "N/A"}</span>
                </div>
                <div className="certificate__field">
                  <span className="certificate__label">Email:</span>
                  <span className="certificate__value">{user.email}</span>
                </div>
              </div>

              <div className="certificate__message">
                <p>has successfully purchased the Shaan Estate Digital Property</p>
                <p className="certificate__message--highlight">under the official digital assets program of Shaan Estate Pvt. Ltd.</p>
              </div>

              <div className="certificate__section-title">Certificate Details</div>

              <div className="certificate__details-grid">
                <div className="certificate__field">
                  <span className="certificate__label">Digital Property ID:</span>
                  <span className="certificate__value">{holding.propertyId?._id || holding.propertyId || holding.id}</span>
                </div>
                <div className="certificate__field">
                  <span className="certificate__label">Plan/Category:</span>
                  <span className="certificate__value">{holding.name}</span>
                </div>
                <div className="certificate__field">
                  <span className="certificate__label">Purchase Amount:</span>
                  <span className="certificate__value certificate__value--bold">
                    Rs. {holding.amountInvested?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="certificate__field">
                  <span className="certificate__label">Date of Purchase:</span>
                  <span className="certificate__value">{issueDate}</span>
                </div>
              </div>

              <div className="certificate__section-title">Privileges / Benefits</div>
              <div className="certificate__benefits-list">
                <div className="certificate__benefit-item">
                  <span className="certificate__benefit-bullet"></span>
                  <p>Verified digital property ownership</p>
                </div>
                <div className="certificate__benefit-item">
                  <span className="certificate__benefit-bullet"></span>
                  <p>Exclusive updates and early access to new digital assets</p>
                </div>
                <div className="certificate__benefit-item">
                  <span className="certificate__benefit-bullet"></span>
                  <p>Priority support from the Shaan Estate customer care team</p>
                </div>
                <div className="certificate__benefit-item">
                  <span className="certificate__benefit-bullet"></span>
                  <p>Eligibility for partner-level privileges (if applicable)</p>
                </div>
              </div>

              <div className="certificate__footer-section">
                <div className="certificate__signatory">
                  <h3 className="certificate__section-title--small">Authorized Signatory</h3>
                  <div className="certificate__signature-space"></div>
                  <p className="certificate__signatory-name">Director – Shaan Estate Pvt. Ltd.</p>
                </div>

                <div className="certificate__seal">
                  <div className="certificate__seal-outer">
                    <div className="certificate__seal-inner">
                      <span>SHAAN ESTATE</span>
                      <div className="certificate__seal-line"></div>
                      <span>OFFICIAL SEAL</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="certificate__border-decoration">
              <div className="certificate__border-outer"></div>
              <div className="certificate__border-inner"></div>
              <div className="certificate__corner certificate__corner--tl"></div>
              <div className="certificate__corner certificate__corner--tr"></div>
              <div className="certificate__corner certificate__corner--bl"></div>
              <div className="certificate__corner certificate__corner--br"></div>
            </div>
          </div>
        </div>

        <div className="certificate-modal__actions">
          <button className="certificate-modal__download-btn" onClick={() => window.print()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 9V2H18V9M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 18 20 18H18M6 14H18V22H6V14Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download / Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;

