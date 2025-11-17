import { useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import StatusBadge from '../../../components/Admin/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import AddPropertyForm from '../../../components/Admin/AddPropertyForm';
import PropertyDetail from '../../../components/Admin/PropertyDetail';

const AdminProperties = () => {
  const { properties, selectedProperty, setSelectedProperty } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showPropertyDetail, setShowPropertyDetail] = useState(false);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch = 
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [properties, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleViewProperty = (property) => {
    setSelectedProperty(property);
    setShowPropertyDetail(true);
  };

  const handleAddProperty = () => {
    setShowAddForm(true);
  };

  return (
    <div className="admin-properties">
      {/* Page Header */}
      <div className="admin-properties__header">
        <div>
          <h1 className="admin-properties__title">Property Management</h1>
          <p className="admin-properties__subtitle">
            Create, edit, and manage digital property listings
          </p>
        </div>
        <div className="admin-properties__header-actions">
          <button 
            className="admin-properties__add-btn"
            onClick={handleAddProperty}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Property
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-properties__stats">
        <div className="admin-properties__stat">
          <span className="admin-properties__stat-label">Total Properties</span>
          <span className="admin-properties__stat-value">{properties.length}</span>
        </div>
        <div className="admin-properties__stat">
          <span className="admin-properties__stat-label">Active</span>
          <span className="admin-properties__stat-value">
            {properties.filter(p => p.status === 'active').length}
          </span>
        </div>
        <div className="admin-properties__stat">
          <span className="admin-properties__stat-label">Total Invested</span>
          <span className="admin-properties__stat-value">
            {formatCurrency(properties.reduce((sum, p) => sum + p.totalInvested, 0))}
          </span>
        </div>
        <div className="admin-properties__stat">
          <span className="admin-properties__stat-label">Total Investors</span>
          <span className="admin-properties__stat-value">
            {properties.reduce((sum, p) => sum + p.investorCount, 0)}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-properties__filters">
        <div className="admin-properties__search">
          <input
            type="text"
            placeholder="Search by property name or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-properties__search-input"
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="admin-properties__search-icon">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        <div className="admin-properties__filter-group">
          <label className="admin-properties__filter-label">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-properties__filter-select"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <button
          onClick={handleClearFilters}
          className="admin-properties__clear-filters"
        >
          Clear Filters
        </button>
      </div>

      {/* Properties Table */}
      <div className="admin-properties__table-container">
        <table className="admin-properties__table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Total Invested</th>
              <th>Available</th>
              <th>Investors</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProperties.length === 0 ? (
              <tr>
                <td colSpan="7" className="admin-properties__empty">
                  No properties found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedProperties.map((property) => (
                <tr key={property.id}>
                  <td>
                    <div className="admin-properties__property-info">
                      <div className="admin-properties__property-image">
                        {property.image ? (
                          <img src={property.image} alt={property.title} />
                        ) : (
                          <div className="admin-properties__property-placeholder">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <path d="M3 9h18M9 3v18"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="admin-properties__property-details">
                        <div className="admin-properties__property-title">{property.title}</div>
                        <div className="admin-properties__property-type">{property.propertyType}</div>
                      </div>
                    </div>
                  </td>
                  <td>{formatCurrency(property.totalInvested)}</td>
                  <td>{formatCurrency(property.availableToInvest)}</td>
                  <td>{property.investorCount}</td>
                  <td>
                    <StatusBadge status={property.status} />
                  </td>
                  <td>{formatDate(property.deadline)}</td>
                  <td>
                    <div className="admin-properties__actions">
                      <button 
                        className="admin-properties__action-btn admin-properties__action-btn--view"
                        onClick={() => handleViewProperty(property)}
                        title="View Details"
                      >
                        View
                      </button>
                      <button 
                        className="admin-properties__action-btn admin-properties__action-btn--edit"
                        title="Edit Property"
                        onClick={() => {
                          setEditingProperty(property);
                          setShowAddForm(true);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredProperties.length > 0 && (
        <div className="admin-properties__pagination">
          <div className="admin-properties__pagination-info">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredProperties.length)} of {filteredProperties.length} properties
          </div>
          <div className="admin-properties__pagination-controls">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="admin-properties__page-size"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="admin-properties__pagination-btn"
            >
              Previous
            </button>
            <span className="admin-properties__pagination-page">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="admin-properties__pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Property Form Modal */}
      {showAddForm && (
        <AddPropertyForm 
          property={editingProperty}
          onClose={() => {
            setShowAddForm(false);
            setEditingProperty(null);
          }} 
        />
      )}

      {/* Property Detail Modal */}
      {showPropertyDetail && selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onClose={() => {
            setShowPropertyDetail(false);
            setSelectedProperty(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminProperties;
