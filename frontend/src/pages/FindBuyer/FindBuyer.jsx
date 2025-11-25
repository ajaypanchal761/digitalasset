import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { transferRequestAPI } from "../../services/api.js";
import "./FindBuyer.css";

const FindBuyer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { holdings, listings, loading: holdingsLoading } = useAppState();
  const { showToast } = useToast();
  const holdingId = location.state?.holdingId;
  
  // More robust holding lookup - convert both to strings for comparison
  const holding = holdings.find((h) => {
    const hId = (h._id || h.id)?.toString();
    const searchId = holdingId?.toString();
    return hId === searchId;
  });

  const [availableBuyers, setAvailableBuyers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("buyers"); // "buyers" or "requests"
  const [salePrice, setSalePrice] = useState(holding?.amountInvested || 0);

  useEffect(() => {
    // Wait for holdings to load before checking
    if (holdingsLoading) {
      return;
    }

    // Check if holdingId was provided
    if (!holdingId) {
      showToast("Holding ID is required", "error");
      navigate("/wallet");
      return;
    }

    // Check if holding exists
    if (!holding) {
      showToast("Holding not found", "error");
      navigate("/wallet");
      return;
    }

    fetchData();
  }, [holding, holdingId, holdingsLoading, navigate, showToast]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available buyers
      const buyersResponse = await transferRequestAPI.getAvailableBuyers();
      if (buyersResponse.success) {
        setAvailableBuyers(buyersResponse.data || []);
      }

      // Fetch sent requests
      const requestsResponse = await transferRequestAPI.getSent();
      if (requestsResponse.success) {
        const holdingRequests = (requestsResponse.data || []).filter(
          (req) => (req.holdingId?._id || req.holdingId) === (holding?._id || holding?.id)
        );
        setSentRequests(holdingRequests);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast(error.message || "Failed to load data", "error");
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

  const handleSendRequest = async (buyerId) => {
    if (!salePrice || salePrice < (holding.amountInvested * 0.8)) {
      showToast(
        `Minimum sale price is ${formatCurrency(holding.amountInvested * 0.8, "INR")} (80% of investment)`,
        "error"
      );
      return;
    }

    try {
      setSendingRequest(buyerId);
      const response = await transferRequestAPI.create(
        buyerId,
        holding._id || holding.id,
        salePrice
      );

      if (response.success) {
        showToast("Buy request sent successfully!", "success");
        fetchData(); // Refresh data
        setActiveTab("requests"); // Switch to requests tab
      } else {
        showToast(response.message || "Failed to send request", "error");
      }
    } catch (error) {
      console.error("Error sending request:", error);
      showToast(error.message || "Failed to send request", "error");
    } finally {
      setSendingRequest(null);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) {
      return;
    }

    try {
      const response = await transferRequestAPI.cancel(requestId);
      if (response.success) {
        showToast("Request cancelled successfully", "success");
        fetchData();
      } else {
        showToast(response.message || "Failed to cancel request", "error");
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      showToast(error.message || "Failed to cancel request", "error");
    }
  };

  const getStatusBadge = (status, buyerResponse) => {
    if (status === "completed") {
      return <span className="find-buyer__status-badge find-buyer__status-badge--completed">Completed</span>;
    }
    if (status === "admin_approved") {
      return <span className="find-buyer__status-badge find-buyer__status-badge--approved">Approved</span>;
    }
    if (status === "admin_rejected" || status === "rejected") {
      return <span className="find-buyer__status-badge find-buyer__status-badge--rejected">Rejected</span>;
    }
    if (status === "admin_pending") {
      return <span className="find-buyer__status-badge find-buyer__status-badge--pending">Admin Review</span>;
    }
    if (status === "accepted" && buyerResponse === "accepted") {
      return <span className="find-buyer__status-badge find-buyer__status-badge--accepted">Accepted</span>;
    }
    if (buyerResponse === "declined") {
      return <span className="find-buyer__status-badge find-buyer__status-badge--declined">Declined</span>;
    }
    return <span className="find-buyer__status-badge find-buyer__status-badge--pending">Pending</span>;
  };

  if (loading) {
    return (
      <div className="find-buyer-page">
        <div className="find-buyer-page__container">
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const property = listings.find(
    (p) => (p._id || p.id) === (holding.propertyId?._id || holding.propertyId || holding.property)
  );

  return (
    <div className="find-buyer-page">
      <div className="find-buyer-page__container">
        {/* Header */}
        <div className="find-buyer-page__header">
          <button className="find-buyer-page__back" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="find-buyer-page__title">Find Buyer</h1>
          <div style={{ width: "24px" }}></div>
        </div>

        {/* Property Info */}
        <div className="find-buyer-page__property-card">
          <h3 className="find-buyer-page__property-title">Property Details</h3>
          <div className="find-buyer-page__property-info">
            <div className="find-buyer-page__property-item">
              <span className="find-buyer-page__property-label">Property</span>
              <span className="find-buyer-page__property-value">{property?.title || holding?.name || "N/A"}</span>
            </div>
            <div className="find-buyer-page__property-item">
              <span className="find-buyer-page__property-label">Your Investment</span>
              <span className="find-buyer-page__property-value">{formatCurrency(holding.amountInvested, "INR")}</span>
            </div>
            <div className="find-buyer-page__property-item">
              <span className="find-buyer-page__property-label">Sale Price</span>
              <input
                type="number"
                className="find-buyer-page__price-input"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                min={holding.amountInvested * 0.8}
                placeholder="Enter sale price"
              />
            </div>
            <p className="find-buyer-page__price-hint">
              Minimum {formatCurrency(holding.amountInvested * 0.8, "INR")} (80% of your investment)
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="find-buyer-page__tabs">
          <button
            className={`find-buyer-page__tab ${activeTab === "buyers" ? "find-buyer-page__tab--active" : ""}`}
            onClick={() => setActiveTab("buyers")}
          >
            Available Buyers ({availableBuyers.length})
          </button>
          <button
            className={`find-buyer-page__tab ${activeTab === "requests" ? "find-buyer-page__tab--active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Sent Requests ({sentRequests.length})
          </button>
        </div>

        {/* Buyers List */}
        {activeTab === "buyers" && (
          <div className="find-buyer-page__buyers-list">
            {availableBuyers.length === 0 ? (
              <div className="find-buyer-page__empty">
                <p>No available buyers found</p>
              </div>
            ) : (
              availableBuyers.map((buyer) => {
                const hasPendingRequest = sentRequests.some(
                  (req) =>
                    (req.buyerId?._id || req.buyerId) === (buyer._id || buyer.id) &&
                    ["pending", "accepted", "admin_pending"].includes(req.status)
                );

                return (
                  <div key={buyer._id || buyer.id} className="find-buyer-page__buyer-card">
                    <div className="find-buyer-page__buyer-info">
                      <div className="find-buyer-page__buyer-avatar">
                        {buyer.avatarUrl ? (
                          <img src={buyer.avatarUrl} alt={buyer.name} />
                        ) : (
                          <div className="find-buyer-page__buyer-avatar-placeholder">
                            {buyer.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="find-buyer-page__buyer-details">
                        <h4 className="find-buyer-page__buyer-name">{buyer.name}</h4>
                        <p className="find-buyer-page__buyer-email">{buyer.email}</p>
                        {buyer.phone && <p className="find-buyer-page__buyer-phone">{buyer.phone}</p>}
                      </div>
                    </div>
                    <button
                      className={`find-buyer-page__send-btn ${hasPendingRequest ? "find-buyer-page__send-btn--disabled" : ""}`}
                      onClick={() => !hasPendingRequest && handleSendRequest(buyer._id || buyer.id)}
                      disabled={hasPendingRequest || sendingRequest === (buyer._id || buyer.id)}
                    >
                      {sendingRequest === (buyer._id || buyer.id)
                        ? "Sending..."
                        : hasPendingRequest
                        ? "Request Sent"
                        : "Send Buy Request"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Sent Requests List */}
        {activeTab === "requests" && (
          <div className="find-buyer-page__requests-list">
            {sentRequests.length === 0 ? (
              <div className="find-buyer-page__empty">
                <p>No requests sent yet</p>
              </div>
            ) : (
              sentRequests.map((request) => {
                const buyer = request.buyerId;
                const canProceed = request.status === "accepted" && request.buyerResponse === "accepted";
                const canCancel = ["pending", "accepted"].includes(request.status);

                return (
                  <div key={request._id || request.id} className="find-buyer-page__request-card">
                    <div className="find-buyer-page__request-header">
                      <div className="find-buyer-page__request-buyer">
                        <div className="find-buyer-page__buyer-avatar">
                          {buyer?.avatarUrl ? (
                            <img src={buyer.avatarUrl} alt={buyer?.name} />
                          ) : (
                            <div className="find-buyer-page__buyer-avatar-placeholder">
                              {buyer?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="find-buyer-page__request-buyer-name">{buyer?.name || "N/A"}</h4>
                          <p className="find-buyer-page__request-buyer-email">{buyer?.email || "N/A"}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status, request.buyerResponse)}
                    </div>
                    <div className="find-buyer-page__request-details">
                      <div className="find-buyer-page__request-detail-item">
                        <span className="find-buyer-page__request-detail-label">Sale Price</span>
                        <span className="find-buyer-page__request-detail-value">{formatCurrency(request.salePrice, "INR")}</span>
                      </div>
                      <div className="find-buyer-page__request-detail-item">
                        <span className="find-buyer-page__request-detail-label">Request Date</span>
                        <span className="find-buyer-page__request-detail-value">
                          {new Date(request.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="find-buyer-page__request-actions">
                      {canProceed && (
                        <button
                          className="find-buyer-page__proceed-btn"
                          onClick={async () => {
                            try {
                              const response = await transferRequestAPI.initiateTransfer(request._id || request.id);
                              if (response.success) {
                                showToast("Transfer request sent to admin for approval", "success");
                                fetchData();
                              } else {
                                showToast(response.message || "Failed to initiate transfer", "error");
                              }
                            } catch (error) {
                              console.error("Error initiating transfer:", error);
                              showToast(error.message || "Failed to initiate transfer", "error");
                            }
                          }}
                        >
                          Proceed to Transfer
                        </button>
                      )}
                      {canCancel && (
                        <button
                          className="find-buyer-page__cancel-btn"
                          onClick={() => handleCancelRequest(request._id || request.id)}
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindBuyer;

