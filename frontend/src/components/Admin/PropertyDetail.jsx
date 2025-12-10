import { useState, useEffect } from 'react';
import StatusBadge from './common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { adminAPI } from '../../services/api';

const PropertyDetail = ({ property, onClose }) => {
  const [investors, setInvestors] = useState([]);
  const [investorsLoading, setInvestorsLoading] = useState(false);
  const [investorsError, setInvestorsError] = useState(null);

  useEffect(() => {
    const fetchInvestors = async () => {
      if (!property?._id && !property?.id) return;

      setInvestorsLoading(true);
      setInvestorsError(null);
      try {
        const propertyId = property._id || property.id;
        const response = await adminAPI.getPropertyInvestors(propertyId);
        
        if (response.success && response.data) {
          setInvestors(response.data || []);
        } else {
          setInvestorsError(response.message || 'Failed to fetch investors');
        }
      } catch (error) {
        console.error('Error fetching investors:', error);
        setInvestorsError(error.message || 'Failed to fetch investors');
      } finally {
        setInvestorsLoading(false);
      }
    };

    fetchInvestors();
  }, [property]);

  if (!property) return null;

  const stats = [
    { label: 'Total Invested', value: formatCurrency(property.totalInvested) },
    { label: 'Available to Invest', value: formatCurrency(property.availableToInvest) },
    { label: 'Investors', value: property.investorCount },
    { label: 'Deadline', value: formatDate(property.deadline) },
    { label: 'Status', value: <StatusBadge status={property.status} /> },
  ];

  const documents = property.documents || [];

  return (
    <div className="property-detail__overlay" onClick={onClose}>
      <div className="property-detail__modal" onClick={(e) => e.stopPropagation()}>
        <header className="property-detail__header">
          <div>
            <p className="property-detail__tag">{property.propertyType}</p>
            <h2 className="property-detail__title">{property.title}</h2>
            <p className="property-detail__id">ID: {property._id || property.id}</p>
          </div>
          <button className="property-detail__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="property-detail__body">
          <section className="property-detail__section">
            <h3>Investment Snapshot</h3>
            <div className="property-detail__stats-grid">
              {stats.map((stat) => (
                <div key={stat.label} className="property-detail__stat-card">
                  <p className="property-detail__stat-label">{stat.label}</p>
                  <p className="property-detail__stat-value">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="property-detail__section">
            <h3>Description</h3>
            <p className="property-detail__description">{property.description}</p>
          </section>

          <section className="property-detail__section">
            <h3>Key Details</h3>
            <div className="property-detail__details-grid">
              <div>
                <p className="property-detail__detail-label">Min Investment</p>
                <p className="property-detail__detail-value">₹5,00,000 (fixed)</p>
              </div>
              <div>
                <p className="property-detail__detail-label">Lock-in Period</p>
                <p className="property-detail__detail-value">3 Months (fixed)</p>
              </div>
              <div>
                <p className="property-detail__detail-label">Monthly Return</p>
                <p className="property-detail__detail-value">0.5% (fixed)</p>
              </div>
              <div>
                <p className="property-detail__detail-label">Created Date</p>
                <p className="property-detail__detail-value">{formatDate(property.createdAt)}</p>
              </div>
            </div>
          </section>

          <section className="property-detail__section">
            <h3>Investors</h3>
            {investorsLoading ? (
              <p className="property-detail__empty">Loading investors...</p>
            ) : investorsError ? (
              <p className="property-detail__empty" style={{ color: '#ef4444' }}>{investorsError}</p>
            ) : investors.length > 0 ? (
              <div className="property-detail__investors-list">
                {investors.map((investor) => (
                  <div key={investor.id} className="property-detail__investor-card">
                    <div className="property-detail__investor-header">
                      <div className="property-detail__investor-info">
                        <p className="property-detail__investor-name">{investor.userName}</p>
                        <p className="property-detail__investor-email">{investor.userEmail}</p>
                        {investor.userPhone && (
                          <p className="property-detail__investor-phone">{investor.userPhone}</p>
                        )}
                      </div>
                      <div className="property-detail__investor-status">
                        <StatusBadge status={investor.status} />
                      </div>
                    </div>
                    <div className="property-detail__investor-details">
                      <div className="property-detail__investor-detail-item">
                        <span className="property-detail__investor-detail-label">Amount Invested</span>
                        <span className="property-detail__investor-detail-value">
                          {formatCurrency(investor.amountInvested)}
                        </span>
                      </div>
                      <div className="property-detail__investor-detail-item">
                        <span className="property-detail__investor-detail-label">Purchase Date</span>
                        <span className="property-detail__investor-detail-value">
                          {formatDate(investor.purchaseDate)}
                        </span>
                      </div>
                      <div className="property-detail__investor-detail-item">
                        <span className="property-detail__investor-detail-label">Maturity Date</span>
                        <span className="property-detail__investor-detail-value">
                          {formatDate(investor.maturityDate)}
                        </span>
                      </div>
                      <div className="property-detail__investor-detail-item">
                        <span className="property-detail__investor-detail-label">Monthly Earning</span>
                        <span className="property-detail__investor-detail-value">
                          {formatCurrency(investor.monthlyEarning)}
                        </span>
                      </div>
                      <div className="property-detail__investor-detail-item">
                        <span className="property-detail__investor-detail-label">Total Earnings Received</span>
                        <span className="property-detail__investor-detail-value">
                          {formatCurrency(investor.totalEarningsReceived || 0)}
                        </span>
                      </div>
                      <div className="property-detail__investor-detail-item">
                        <span className="property-detail__investor-detail-label">Payouts</span>
                        <span className="property-detail__investor-detail-value">
                          {investor.payoutCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="property-detail__empty">No investors yet.</p>
            )}
          </section>

          <section className="property-detail__section">
            <h3>Documents</h3>
            {documents.length > 0 ? (
              <div className="property-detail__documents-list">
                {documents.map((doc, index) => (
                  <div key={doc.id || doc.name || index} className="property-detail__document">
                    <div>
                      <p className="property-detail__document-name">{doc.name}</p>
                      <p className="property-detail__document-meta">
                        {doc.type ? doc.type.toUpperCase() : 'Document'}
                      </p>
                    </div>
                    <button
                      className="property-detail__document-btn"
                      onClick={() => {
                        const docUrl = typeof doc === 'string' ? doc : doc.url;
                        if (docUrl) window.open(docUrl, '_blank');
                      }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="property-detail__empty">No documents uploaded yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;

