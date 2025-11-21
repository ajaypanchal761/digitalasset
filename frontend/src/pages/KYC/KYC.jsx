import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./KYC.css";

const KYC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      setLoading(false);
    }
  }, [authUser]);

  const getStatusBadge = () => {
    const status = authUser?.kycStatus || "pending";
    const statusConfig = {
      pending: { text: "Under Review", color: "#f59e0b", bg: "#fef3c7" },
      approved: { text: "Approved", color: "#10b981", bg: "#d1fae5" },
      rejected: { text: "Rejected", color: "#ef4444", bg: "#fee2e2" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <div className="kyc-status-badge" style={{ backgroundColor: config.bg, color: config.color }}>
        {config.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="kyc-page">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const kycStatus = authUser?.kycStatus || "pending";

  return (
    <div className="kyc-page">
      {/* Header */}
      <header className="kyc-header">
        <button type="button" className="kyc-header__back" onClick={() => navigate("/profile")} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="kyc-header__title">KYC Verification</h1>
        <div className="kyc-header__spacer"></div>
      </header>

      <div className="kyc-content">
        {/* Status Section */}
        {authUser?.kycStatus && (
          <div className="kyc-status-section">
            <div className="kyc-status-header">
              <h2>Verification Status</h2>
              {getStatusBadge()}
            </div>
            {kycStatus === "pending" && (
              <p className="kyc-status-message">
                Your KYC documents are under review. We'll notify you once the verification is complete.
              </p>
            )}
            {kycStatus === "approved" && authUser?.kycSubmittedAt && (
              <p className="kyc-status-message">
                Your KYC has been approved on {new Date(authUser.kycSubmittedAt).toLocaleDateString()}.
              </p>
            )}
            {kycStatus === "rejected" && authUser?.kycRejectionReason && (
              <div className="kyc-rejection-reason">
                <p className="kyc-rejection-title">Rejection Reason:</p>
                <p className="kyc-rejection-text">{authUser.kycRejectionReason}</p>
                <p className="kyc-rejection-note">Please contact support for assistance with resubmission.</p>
              </div>
            )}
          </div>
        )}

        {/* DigiLocker Section */}
        <div className="kyc-digilocker-section">
          <div className="kyc-digilocker-card">
            <div className="kyc-digilocker-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h3>Verify with DigiLocker</h3>
            <p>Quick and secure verification using DigiLocker (Coming Soon)</p>
            <button className="kyc-digilocker-btn" disabled>
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYC;
