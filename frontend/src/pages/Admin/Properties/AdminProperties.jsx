import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdmin } from '../../../context/AdminContext';
import StatusBadge from '../../../components/Admin/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import AddPropertyForm from '../../../components/Admin/AddPropertyForm';
import PropertyDetail from '../../../components/Admin/PropertyDetail';
import Select from '../../../components/common/Select';

const AdminProperties = () => {
  const location = useLocation();
  const { 
    properties, 
    propertiesLoading, 
    propertiesError,
    selectedProperty, 
    setSelectedProperty,
    refreshProperties 
  } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showPropertyDetail, setShowPropertyDetail] = useState(false);

  // Check for search query from navigation state (from header search)
  useEffect(() => {
    if (location.state?.searchQuery) {
      console.log('🔍 AdminProperties - Received search query from navigation:', {
        query: location.state.searchQuery,
        timestamp: new Date().toISOString()
      });
      setSearchQuery(location.state.searchQuery);
      setCurrentPage(1); // Reset to first page
      // Clear the state to prevent re-applying on re-renders
      window.history.replaceState({ ...location.state, searchQuery: undefined }, '');
    }
  }, [location.state]);

  // Listen for search events from header (when already on this page)
  useEffect(() => {
    const handleSearchEvent = (event) => {
      const query = event.detail?.searchQuery;
      if (query) {
        console.log('🔍 AdminProperties - Received search event from header:', {
          query,
          timestamp: new Date().toISOString()
        });
        setSearchQuery(query);
        setCurrentPage(1);
      }
    };

    window.addEventListener('adminSearch', handleSearchEvent);
    return () => {
      window.removeEventListener('adminSearch', handleSearchEvent);
    };
  }, []);

  // Check if Shaan Estate exists
  const shaanEstateExists = useMemo(() => {
    return properties.some(property => property.title === 'Shaan Estate');
  }, [properties]);

  const shaanEstateProperty = useMemo(() => {
    return properties.find(property => property.title === 'Shaan Estate');
  }, [properties]);

  // Filter properties (client-side filtering for now, can be moved to backend later)
  const filteredProperties = useMemo(() => {
    if (!properties || properties.length === 0) return [];

    return properties.filter(property => {
      const matchesSearch =
        property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description?.toLowerCase().includes(searchQuery.toLowerCase());

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
    console.log('➕ AdminProperties - Add/Manage Property button clicked:', {
      shaanEstateExists,
      timestamp: new Date().toISOString()
    });

    if (shaanEstateExists) {
      // Edit existing Shaan Estate
      setEditingProperty(shaanEstateProperty);
    } else {
      // Create new Shaan Estate (should not happen with our constraints, but kept for safety)
      setEditingProperty(null);
    }
    setShowAddForm(true);
  };

  // Log component state changes
  React.useEffect(() => {
    console.log('📊 AdminProperties - Component state:', {
      propertiesCount: properties.length,
      loading: propertiesLoading,
      error: propertiesError,
      hasProperties: properties.length > 0,
      timestamp: new Date().toISOString()
    });
  }, [properties, propertiesLoading, propertiesError]);

  // Show loading state
  if (propertiesLoading) {
    console.log('⏳ AdminProperties - Showing loading state');
    return (
      <div className="admin-properties">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading properties...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (propertiesError) {
    console.error('❌ AdminProperties - Showing error state:', {
      error: propertiesError,
      timestamp: new Date().toISOString()
    });
    return (
      <div className="admin-properties">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>Error: {propertiesError}</p>
          <button 
            onClick={() => {
              console.log('🔄 AdminProperties - Retry button clicked');
              refreshProperties();
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-properties">
      {/* Page Header */}
      <div className="admin-properties__header">
        <div>
          <h1 className="admin-properties__title">Shaan Estate Management</h1>
          <p className="admin-properties__subtitle">
            Manage your primary property asset - update stock count and investment parameters
          </p>
        </div>
      </div>

      {/* Shaan Estate Management Card */}
      <div className="admin-properties__management-card">
        {/* Primary Asset Badge */}
        <div className="admin-properties__badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Primary Asset
        </div>

        {propertiesLoading ? (
          <div className="admin-properties__loading">
            <div className="admin-properties__loading-spinner"></div>
            <p>Loading Shaan Estate data...</p>
          </div>
        ) : shaanEstateProperty ? (
          <div className="admin-properties__card-content">
            {/* Property Header */}
            <div className="admin-properties__property-header">
              <div className="admin-properties__property-image">
                {shaanEstateProperty.image ? (
                  <img
                    src={shaanEstateProperty.image}
                    alt="Shaan Estate"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="admin-properties__property-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9h18M9 3v18"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="admin-properties__property-info">
                <h2 className="admin-properties__property-title">{shaanEstateProperty.title}</h2>
                <p className="admin-properties__property-description">{shaanEstateProperty.description || 'Premium digital property investment'}</p>
                <div className="admin-properties__property-meta">
                  <span className="admin-properties__property-type">{shaanEstateProperty.propertyType}</span>
                  <span className="admin-properties__property-id">ID: {shaanEstateProperty._id || shaanEstateProperty.id}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="admin-properties__stats-grid">
              <div className="admin-properties__stat-item">
                <div className="admin-properties__stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div className="admin-properties__stat-content">
                  <span className="admin-properties__stat-value">{formatCurrency(shaanEstateProperty.totalInvested || 0)}</span>
                  <span className="admin-properties__stat-label">Total Invested</span>
                </div>
              </div>

              <div className="admin-properties__stat-item">
                <div className="admin-properties__stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="admin-properties__stat-content">
                  <span className="admin-properties__stat-value">{shaanEstateProperty.investorCount || 0}</span>
                  <span className="admin-properties__stat-label">Investors</span>
                </div>
              </div>

              <div className="admin-properties__stat-item">
                <div className="admin-properties__stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 3v18"/>
                  </svg>
                </div>
                <div className="admin-properties__stat-content">
                  <span className="admin-properties__stat-value">
                    {(() => {
                      const storedStocks = localStorage.getItem('shaanEstate_totalStocks');
                      const totalStocks = shaanEstateProperty.totalStocks || (storedStocks ? parseInt(storedStocks, 10) : 0);
                      const remainingStocks = Math.max(0, totalStocks - (shaanEstateProperty.investorCount || 0));
                      return totalStocks > 0 ? `${remainingStocks} / ${totalStocks}` : '0 / 0';
                    })()}
                  </span>
                  <span className="admin-properties__stat-label">Available Stocks</span>
                </div>
              </div>

              <div className="admin-properties__stat-item">
                <div className="admin-properties__stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="admin-properties__stat-content">
                  <span className="admin-properties__stat-value">{formatDate(shaanEstateProperty.deadline)}</span>
                  <span className="admin-properties__stat-label">Deadline</span>
                </div>
              </div>
            </div>

            {/* Status and Investment Amount */}
            <div className="admin-properties__status-section">
              <div className="admin-properties__status-item">
                <span className="admin-properties__status-label">Status</span>
                <span className={`admin-properties__status-badge ${shaanEstateProperty.status === 'active' ? 'admin-properties__status-badge--active' : ''}`}>
                  {shaanEstateProperty.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="admin-properties__status-item">
                <span className="admin-properties__status-label">Investment Amount</span>
                <span className="admin-properties__status-value">
                  {formatCurrency(shaanEstateProperty.availableToInvest || 500000)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="admin-properties__actions">
              <button
                className="admin-properties__action-btn admin-properties__action-btn--view"
                onClick={() => handleViewProperty(shaanEstateProperty)}
                disabled={propertiesLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                View Details
              </button>
              <button
                className="admin-properties__action-btn admin-properties__action-btn--edit"
                onClick={() => {
                  setEditingProperty(shaanEstateProperty);
                  setShowAddForm(true);
                }}
                disabled={propertiesLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Manage Property
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-properties__empty-state">
            <div className="admin-properties__empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 3v18"/>
              </svg>
            </div>
            <h3 className="admin-properties__empty-title">Shaan Estate Not Found</h3>
            <p className="admin-properties__empty-description">
              The Shaan Estate property has not been created yet. Click below to create it.
            </p>
            <button
              className="admin-properties__create-btn"
              onClick={handleAddProperty}
              disabled={propertiesLoading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Shaan Estate
            </button>
          </div>
        )}
      </div>

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
