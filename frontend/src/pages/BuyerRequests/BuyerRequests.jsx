import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext.jsx";
import { transferRequestAPI } from "../../services/api.js";
import "./BuyerRequests.css";

const BuyerRequests = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await transferRequestAPI.getReceived();
      if (response.success) {
        setReceivedRequests(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      showToast(error.message || "Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const handleRespond = async (requestId, response) => {
    try {
      setRespondingTo(requestId);
      const apiResponse = await transferRequestAPI.respond(requestId, response);
      if (apiResponse.success) {
        showToast(
          `Request ${response === "accepted" ? "accepted" : "declined"} successfully!`,
          "success"
        );
        fetchRequests();
      } else {
        showToast(apiResponse.message || "Failed to respond", "error");
      }
    } catch (error) {
      console.error("Error responding to request:", error);
      showToast(error.message || "Failed to respond", "error");
    } finally {
      setRespondingTo(null);
    }
  };

  const getStatusBadge = (status, buyerResponse) => {
    if (status === "completed") {
      return <span className="buyer-requests__status-badge buyer-requests__status-badge--completed">Completed</span>;
    }
    if (status === "admin_approved") {
      return <span className="buyer-requests__status-badge buyer-requests__status-badge--approved">Approved</span>;
    }
    if (status === "admin_rejected" || status === "rejected") {
      return <span className="buyer-requests__status-badge buyer-requests__status-badge--rejected">Rejected</span>;
    }
    if (status === "admin_pending") {
      return <span className="buyer-requests__status-badge buyer-requests__status-badge--pending">Admin Review</span>;
    }
    if (buyerResponse === "accepted") {
      return <span className="buyer-requests__status-badge buyer-requests__status-badge--accepted">Accepted</span>;
    }
    if (buyerResponse === "declined") {
      return <span className="buyer-requests__status-badge buyer-requests__status-badge--declined">Declined</span>;
    }
    return <span className="buyer-requests__status-badge buyer-requests__status-badge--pending">Pending Response</span>;
  };

  if (loading) {
    return (
      <div className="buyer-requests-page">
        <div className="buyer-requests-page__container">
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buyer-requests-page">
      <div className="buyer-requests-page__container">
        {/* Header */}
        <div className="buyer-requests-page__header">
          <button className="buyer-requests-page__back" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="buyer-requests-page__title">Buy Requests</h1>
          <div style={{ width: "24px" }}></div>
        </div>

        {/* Requests List */}
        <div className="buyer-requests-page__list">
          {receivedRequests.length === 0 ? (
            <div className="buyer-requests-page__empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p>No buy requests received yet</p>
            </div>
          ) : (
            receivedRequests.map((request) => {
              const seller = request.sellerId;
              const property = request.propertyId;
              const holding = request.holdingId;
              const canRespond = request.buyerResponse === "pending" && request.status === "pending";

              return (
                <div key={request._id || request.id} className="buyer-requests-page__request-card">
                  <div className="buyer-requests-page__request-header">
                    <div className="buyer-requests-page__seller-info">
                      <div className="buyer-requests-page__seller-avatar">
                        {seller?.avatarUrl ? (
                          <img src={seller.avatarUrl} alt={seller?.name} />
                        ) : (
                          <div className="buyer-requests-page__seller-avatar-placeholder">
                            {seller?.name?.charAt(0).toUpperCase() || "S"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="buyer-requests-page__seller-name">{seller?.name || "N/A"}</h4>
                        <p className="buyer-requests-page__seller-email">{seller?.email || "N/A"}</p>
                      </div>
                    </div>
                    {getStatusBadge(request.status, request.buyerResponse)}
                  </div>

                  {/* Property Details */}
                  <div className="buyer-requests-page__property-section">
                    <h5 className="buyer-requests-page__section-title">Property Details</h5>
                    <div className="buyer-requests-page__property-details">
                      <div className="buyer-requests-page__property-detail-item">
                        <span className="buyer-requests-page__property-detail-label">Property</span>
                        <span className="buyer-requests-page__property-detail-value">{property?.title || "N/A"}</span>
                      </div>
                      <div className="buyer-requests-page__property-detail-item">
                        <span className="buyer-requests-page__property-detail-label">Investment Amount</span>
                        <span className="buyer-requests-page__property-detail-value">
                          {formatCurrency(holding?.amountInvested || 0, "INR")}
                        </span>
                      </div>
                      <div className="buyer-requests-page__property-detail-item">
                        <span className="buyer-requests-page__property-detail-label">Monthly Earning</span>
                        <span className="buyer-requests-page__property-detail-value">
                          {formatCurrency(holding?.monthlyEarning || 0, "INR")}/month
                        </span>
                      </div>
                      <div className="buyer-requests-page__property-detail-item">
                        <span className="buyer-requests-page__property-detail-label">Sale Price</span>
                        <span className="buyer-requests-page__property-detail-value buyer-requests-page__property-detail-value--highlight">
                          {formatCurrency(request.salePrice, "INR")}
                        </span>
                      </div>
                      <div className="buyer-requests-page__property-detail-item">
                        <span className="buyer-requests-page__property-detail-label">Request Date</span>
                        <span className="buyer-requests-page__property-detail-value">
                          {new Date(request.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canRespond && (
                    <div className="buyer-requests-page__actions">
                      <button
                        className="buyer-requests-page__btn buyer-requests-page__btn--accept"
                        onClick={() => handleRespond(request._id || request.id, "accepted")}
                        disabled={respondingTo === (request._id || request.id)}
                      >
                        {respondingTo === (request._id || request.id) ? "Processing..." : "Accept"}
                      </button>
                      <button
                        className="buyer-requests-page__btn buyer-requests-page__btn--decline"
                        onClick={() => handleRespond(request._id || request.id, "declined")}
                        disabled={respondingTo === (request._id || request.id)}
                      >
                        {respondingTo === (request._id || request.id) ? "Processing..." : "Decline"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerRequests;

