import StatusBadge from './common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PropertyDetail = ({ property, onClose }) => {
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
            <p className="property-detail__id">ID: {property.id}</p>
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
            <h3>Documents</h3>
            {documents.length > 0 ? (
              <div className="property-detail__documents-list">
                {documents.map((doc) => (
                  <div key={doc.id || doc.name} className="property-detail__document">
                    <div>
                      <p className="property-detail__document-name">{doc.name}</p>
                      <p className="property-detail__document-meta">
                        {doc.type ? doc.type.toUpperCase() : 'Document'}
                      </p>
                    </div>
                    <button
                      className="property-detail__document-btn"
                      onClick={() => window.open(doc.url, '_blank')}
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

