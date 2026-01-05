import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext.jsx";
import { contactOwnerAPI } from "../../services/api.js";
import "./ContactOwnerMessages.css";

const ContactOwnerMessages = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await contactOwnerAPI.getAll(params);
      if (response.success) {
        setMessages(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      showToast(error.message || "Failed to load messages", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: "contact-owner-messages__badge--pending", text: "Pending" },
      read: { class: "contact-owner-messages__badge--read", text: "Read" },
      replied: { class: "contact-owner-messages__badge--replied", text: "Replied" },
      resolved: { class: "contact-owner-messages__badge--resolved", text: "Resolved" },
      closed: { class: "contact-owner-messages__badge--closed", text: "Closed" },
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`contact-owner-messages__badge ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const handleViewMessage = async (messageId) => {
    try {
      const response = await contactOwnerAPI.getById(messageId);
      if (response.success) {
        setSelectedMessage(response.data);
        setShowDetail(true);
      }
    } catch (error) {
      console.error("Error fetching message:", error);
      showToast(error.message || "Failed to load message details", "error");
    }
  };

  if (loading) {
    return (
      <div className="contact-owner-messages">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-owner-messages">
      <div className="contact-owner-messages__container">
        {/* Header */}
        <div className="contact-owner-messages__header">
          <button
            className="btn-back"
            onClick={() => navigate(-1)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="contact-owner-messages__title">My Messages</h1>
          <div style={{ width: "24px" }}></div>
        </div>

        {/* Info Card */}
        <div className="contact-owner-messages__info-card">
          <div className="contact-owner-messages__icon-wrapper">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="contact-owner-messages__info-title">Contact Owner Messages</h2>
          <p className="contact-owner-messages__info-text">
            View all your messages to property owners and their responses.
          </p>
        </div>

        {/* Filter */}
        <div className="contact-owner-messages__filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="contact-owner-messages__filter-select"
          >
            <option value="all">All Messages</option>
            <option value="pending">Pending</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Messages List */}
        <div className="contact-owner-messages__list">
          {messages.length === 0 ? (
            <div className="contact-owner-messages__empty">
              <p>No messages found</p>
              <button
                className="contact-owner-messages__btn contact-owner-messages__btn--primary"
                onClick={() => navigate("/wallet")}
              >
                Go to Wallet
              </button>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id || message.id}
                className="contact-owner-messages__card"
              >
                <div className="contact-owner-messages__card-header">
                  <div>
                    <h3 className="contact-owner-messages__card-title">
                      {message.subject}
                    </h3>
                    <p className="contact-owner-messages__card-property">
                      {message.propertyId?.title || "N/A"}
                    </p>
                  </div>
                  {getStatusBadge(message.status)}
                </div>
                <div className="contact-owner-messages__card-body">
                  <p className="contact-owner-messages__card-message">
                    {message.message.length > 150
                      ? `${message.message.substring(0, 150)}...`
                      : message.message}
                  </p>
                  <div className="contact-owner-messages__card-meta">
                    <span className="contact-owner-messages__card-date">
                      Sent: {formatDate(message.createdAt)}
                    </span>
                    {message.adminResponse && (
                      <span className="contact-owner-messages__card-response">
                        ✓ Response received
                      </span>
                    )}
                  </div>
                </div>
                <div className="contact-owner-messages__card-actions">
                  <button
                    className="contact-owner-messages__btn contact-owner-messages__btn--view"
                    onClick={() => handleViewMessage(message._id || message.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedMessage && (
        <div
          className="contact-owner-messages__modal-overlay"
          onClick={() => {
            setShowDetail(false);
            setSelectedMessage(null);
          }}
        >
          <div
            className="contact-owner-messages__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="contact-owner-messages__modal-header">
              <h2>Message Details</h2>
              <button
                className="contact-owner-messages__modal-close"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedMessage(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="contact-owner-messages__modal-content">
              <div className="contact-owner-messages__detail-section">
                <h3>Property Information</h3>
                <p>
                  <strong>Property:</strong> {selectedMessage.propertyId?.title || "N/A"}
                </p>
                <p>
                  <strong>Investment Amount:</strong>{" "}
                  {formatCurrency(selectedMessage.holdingId?.amountInvested || 0)}
                </p>
                <p>
                  <strong>Holding Status:</strong>{" "}
                  {selectedMessage.holdingId?.status || "N/A"}
                </p>
              </div>

              <div className="contact-owner-messages__detail-section">
                <h3>Your Message</h3>
                <p>
                  <strong>Subject:</strong> {selectedMessage.subject}
                </p>
                <div className="contact-owner-messages__message-content">
                  {selectedMessage.message}
                </div>
                <p>
                  <strong>Contact Preference:</strong>{" "}
                  {selectedMessage.contactPreference === "email" ? "Email" : "Phone"}
                </p>
                <p>
                  <strong>Status:</strong> {getStatusBadge(selectedMessage.status)}
                </p>
                <p>
                  <strong>Sent:</strong> {formatDate(selectedMessage.createdAt)}
                </p>
              </div>

              {selectedMessage.adminResponse && (
                <div className="contact-owner-messages__detail-section contact-owner-messages__detail-section--response">
                  <h3>Owner Response</h3>
                  <div className="contact-owner-messages__response-content">
                    {selectedMessage.adminResponse.message}
                  </div>
                  <p>
                    <strong>Responded By:</strong>{" "}
                    {selectedMessage.adminResponse.respondedBy?.name || "Property Owner"}
                  </p>
                  <p>
                    <strong>Response Date:</strong>{" "}
                    {formatDate(selectedMessage.adminResponse.respondedAt)}
                  </p>
                </div>
              )}

              {!selectedMessage.adminResponse && (
                <div className="contact-owner-messages__detail-section contact-owner-messages__detail-section--waiting">
                  <p className="contact-owner-messages__waiting-text">
                    Waiting for owner response...
                  </p>
                </div>
              )}
            </div>
            <div className="contact-owner-messages__modal-actions">
              <button
                className="contact-owner-messages__modal-btn"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedMessage(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactOwnerMessages;

