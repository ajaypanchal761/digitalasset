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
          <div className="certificate__header">
            <div className="certificate__logo">
              <svg width="60" height="60" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#6366f1" />
                <path
                  d="M16 8L24 12V20L16 24L8 20V12L16 8Z"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="certificate__title">Investment Certificate</h1>
            <p className="certificate__subtitle">Digital Assets Platform</p>
          </div>

          <div className="certificate__body">
            <div className="certificate__intro">
              <p className="certificate__text">
                This is to certify that <strong className="certificate__highlight">{user.name}</strong> has successfully
                invested in the following digital property:
              </p>
            </div>

            <div className="certificate__details">
              <div className="certificate__detail-row">
                <span className="certificate__detail-label">Property Name:</span>
                <span className="certificate__detail-value">{holding.name}</span>
              </div>
              <div className="certificate__detail-row">
                <span className="certificate__detail-label">Investment Amount:</span>
                <span className="certificate__detail-value certificate__detail-value--highlight">
                  {formatCurrency(holding.amountInvested, "INR")}
                </span>
              </div>
              <div className="certificate__detail-row">
                <span className="certificate__detail-label">Purchase Date:</span>
                <span className="certificate__detail-value">{issueDate}</span>
              </div>
              <div className="certificate__detail-row">
                <span className="certificate__detail-label">Maturity Date:</span>
                <span className="certificate__detail-value">{maturityDate}</span>
              </div>
              <div className="certificate__detail-row">
                <span className="certificate__detail-label">Lock-in Period:</span>
                <span className="certificate__detail-value">{holding.lockInMonths || 3} months</span>
              </div>
              <div className="certificate__detail-row">
                <span className="certificate__detail-label">Monthly Return Rate:</span>
                <span className="certificate__detail-value certificate__detail-value--green">0.5%</span>
              </div>
            </div>

            <div className="certificate__footer">
              <div className="certificate__cert-number">
                <span className="certificate__cert-label">Certificate Number:</span>
                <span className="certificate__cert-value">{certificateNumber}</span>
              </div>
              <div className="certificate__signature">
                <div className="certificate__signature-line"></div>
                <p className="certificate__signature-label">Authorized Signature</p>
              </div>
            </div>
          </div>

          <div className="certificate__border-decoration">
            <div className="certificate__corner certificate__corner--top-left"></div>
            <div className="certificate__corner certificate__corner--top-right"></div>
            <div className="certificate__corner certificate__corner--bottom-left"></div>
            <div className="certificate__corner certificate__corner--bottom-right"></div>
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

