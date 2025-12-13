import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext.jsx';
import { adminAPI } from '../../../services/api.js';
import Select from '../../../components/common/Select';
import './AdminContactOwner.css';

const AdminContactOwner = () => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('read');
  const [processing, setProcessing] = useState(null);
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await adminAPI.getContactOwnerMessages(params);
      if (response.success) {
        setMessages(response.data || []);
        if (response.statusCounts) {
          setStatusCounts(response.statusCounts);
        }
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      showToast(error.message || 'Failed to load contact messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      setProcessing(messageId);
      const response = await adminAPI.markContactMessageAsRead(messageId);
      if (response.success) {
        showToast('Message marked as read', 'success');
        fetchMessages();
        if (selectedMessage && (selectedMessage._id || selectedMessage.id) === messageId) {
          setSelectedMessage(response.data);
        }
      } else {
        showToast(response.message || 'Failed to mark as read', 'error');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      showToast(error.message || 'Failed to mark as read', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleRespond = async (messageId) => {
    if (!responseText.trim()) {
      showToast('Please enter a response message', 'error');
      return;
    }

    try {
      setProcessing(messageId);
      const response = await adminAPI.respondToContactMessage(
        messageId,
        responseText.trim(),
        statusUpdate,
        adminNotes.trim() || undefined
      );
      if (response.success) {
        showToast('Response sent successfully', 'success');
        setShowDetail(false);
        setSelectedMessage(null);
        setResponseText('');
        setAdminNotes('');
        setStatusUpdate('read');
        fetchMessages();
      } else {
        showToast(response.message || 'Failed to send response', 'error');
      }
    } catch (error) {
      console.error('Error responding to message:', error);
      showToast(error.message || 'Failed to send response', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateStatus = async (messageId, newStatus) => {
    try {
      setProcessing(messageId);
      const response = await adminAPI.updateContactMessageStatus(
        messageId,
        newStatus,
        adminNotes.trim() || undefined
      );
      if (response.success) {
        showToast('Status updated successfully', 'success');
        setShowDetail(false);
        setSelectedMessage(null);
        setAdminNotes('');
        fetchMessages();
      } else {
        showToast(response.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast(error.message || 'Failed to update status', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'admin-contact-owner__badge--pending', text: 'Pending' },
      read: { class: 'admin-contact-owner__badge--read', text: 'Read' },
      replied: { class: 'admin-contact-owner__badge--replied', text: 'Replied' },
      resolved: { class: 'admin-contact-owner__badge--resolved', text: 'Resolved' },
      closed: { class: 'admin-contact-owner__badge--closed', text: 'Closed' },
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`admin-contact-owner__badge ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="admin-contact-owner">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading contact messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-contact-owner">
      <div className="admin-contact-owner__header">
        <div>
          <h1 className="admin-contact-owner__title">Contact Owner Messages</h1>
          <p className="admin-contact-owner__subtitle">
            Manage messages from users contacting property owners
          </p>
        </div>
        <div className="admin-contact-owner__filters">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-contact-owner__filter-select"
            options={[
              { value: 'all', label: 'All Messages' },
              { value: 'pending', label: `Pending (${statusCounts.pending || 0})` },
              { value: 'read', label: `Read (${statusCounts.read || 0})` },
              { value: 'replied', label: `Replied (${statusCounts.replied || 0})` },
              { value: 'resolved', label: `Resolved (${statusCounts.resolved || 0})` },
              { value: 'closed', label: `Closed (${statusCounts.closed || 0})` },
            ]}
          />
        </div>
      </div>

      <div className="admin-contact-owner__table-container">
        <table className="admin-contact-owner__table">
          <thead>
            <tr>
              <th>User</th>
              <th>Property</th>
              <th>Subject</th>
              <th>Contact Preference</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No contact messages found
                </td>
              </tr>
            ) : (
              messages.map((message) => (
                <tr key={message._id || message.id}>
                  <td>
                    <div className="admin-contact-owner__user-info">
                      <div className="admin-contact-owner__user-avatar">
                        {message.userId?.avatarUrl ? (
                          <img src={message.userId.avatarUrl} alt={message.userId.name} />
                        ) : (
                          <div className="admin-contact-owner__user-avatar-placeholder">
                            {message.userId?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="admin-contact-owner__user-name">{message.userId?.name || 'N/A'}</div>
                        <div className="admin-contact-owner__user-email">{message.userId?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{message.propertyId?.title || 'N/A'}</td>
                  <td className="admin-contact-owner__subject">{message.subject}</td>
                  <td className="admin-contact-owner__preference">
                    {message.contactPreference === 'email' ? '📧 Email' : '📞 Phone'}
                  </td>
                  <td>{getStatusBadge(message.status)}</td>
                  <td>{formatDate(message.createdAt)}</td>
                  <td>
                    <div className="admin-contact-owner__actions">
                      <button
                        className="admin-contact-owner__btn admin-contact-owner__btn--view"
                        onClick={() => {
                          setSelectedMessage(message);
                          setShowDetail(true);
                          setResponseText(message.adminResponse?.message || '');
                          setAdminNotes(message.adminNotes || '');
                          if (message.status === 'pending') {
                            handleMarkAsRead(message._id || message.id);
                          }
                        }}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedMessage && (
        <div className="admin-contact-owner__modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="admin-contact-owner__modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-contact-owner__modal-header">
              <h2>Contact Owner Message Details</h2>
              <button
                className="admin-contact-owner__modal-close"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedMessage(null);
                  setResponseText('');
                  setAdminNotes('');
                  setStatusUpdate('read');
                }}
              >
                ×
              </button>
            </div>
            <div className="admin-contact-owner__modal-content">
              <div className="admin-contact-owner__detail-section">
                <h3>User Information</h3>
                <p><strong>Name:</strong> {selectedMessage.userId?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedMessage.userId?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedMessage.userId?.phone || 'N/A'}</p>
              </div>
              <div className="admin-contact-owner__detail-section">
                <h3>Property Details</h3>
                <p><strong>Property:</strong> {selectedMessage.propertyId?.title || 'N/A'}</p>
                <p><strong>Investment Amount:</strong> {formatCurrency(selectedMessage.holdingId?.amountInvested || 0)}</p>
                <p><strong>Holding Status:</strong> {selectedMessage.holdingId?.status || 'N/A'}</p>
              </div>
              <div className="admin-contact-owner__detail-section">
                <h3>Message Details</h3>
                <p><strong>Subject:</strong> {selectedMessage.subject}</p>
                <p><strong>Message:</strong></p>
                <div className="admin-contact-owner__message-content">
                  {selectedMessage.message}
                </div>
                <p><strong>Contact Preference:</strong> {selectedMessage.contactPreference === 'email' ? 'Email' : 'Phone'}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedMessage.status)}</p>
                <p><strong>Date:</strong> {formatDate(selectedMessage.createdAt)}</p>
              </div>
              {selectedMessage.adminResponse && (
                <div className="admin-contact-owner__detail-section">
                  <h3>Admin Response</h3>
                  <p><strong>Response:</strong></p>
                  <div className="admin-contact-owner__response-content">
                    {selectedMessage.adminResponse.message}
                  </div>
                  <p><strong>Responded By:</strong> {selectedMessage.adminResponse.respondedBy?.name || 'N/A'}</p>
                  <p><strong>Response Date:</strong> {formatDate(selectedMessage.adminResponse.respondedAt)}</p>
                </div>
              )}
              {selectedMessage.adminNotes && (
                <div className="admin-contact-owner__detail-section">
                  <h3>Admin Notes</h3>
                  <p>{selectedMessage.adminNotes}</p>
                </div>
              )}
              <div className="admin-contact-owner__detail-section">
                <h3>Response / Update</h3>
                <label className="admin-contact-owner__label">
                  Response Message
                </label>
                <textarea
                  className="admin-contact-owner__response-input"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response to the user..."
                  rows={4}
                />
                <label className="admin-contact-owner__label">
                  Update Status
                </label>
                <Select
                  className="admin-contact-owner__status-select"
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  options={[
                    { value: 'read', label: 'Read' },
                    { value: 'replied', label: 'Replied' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                />
                <label className="admin-contact-owner__label">
                  Admin Notes (Optional)
                </label>
                <textarea
                  className="admin-contact-owner__notes-input"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={3}
                />
              </div>
            </div>
            <div className="admin-contact-owner__modal-actions">
              <button
                className="admin-contact-owner__modal-btn admin-contact-owner__modal-btn--cancel"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedMessage(null);
                  setResponseText('');
                  setAdminNotes('');
                  setStatusUpdate('read');
                }}
              >
                Close
              </button>
              {responseText.trim() && (
                <button
                  className="admin-contact-owner__modal-btn admin-contact-owner__modal-btn--respond"
                  onClick={() => handleRespond(selectedMessage._id || selectedMessage.id)}
                  disabled={processing === (selectedMessage._id || selectedMessage.id)}
                >
                  {processing === (selectedMessage._id || selectedMessage.id) ? 'Processing...' : 'Send Response'}
                </button>
              )}
              <button
                className="admin-contact-owner__modal-btn admin-contact-owner__modal-btn--update"
                onClick={() => handleUpdateStatus(selectedMessage._id || selectedMessage.id, statusUpdate)}
                disabled={processing === (selectedMessage._id || selectedMessage.id)}
              >
                {processing === (selectedMessage._id || selectedMessage.id) ? 'Processing...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactOwner;

