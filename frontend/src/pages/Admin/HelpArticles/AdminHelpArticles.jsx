import React, { useState, useMemo, useEffect } from 'react';
import { helpArticleAPI } from '../../../services/api';
import StatusBadge from '../../../components/Admin/common/StatusBadge';
import AddHelpArticleForm from '../../../components/Admin/AddHelpArticleForm';
import { useToast } from '../../../context/ToastContext';
import Select from '../../../components/common/Select';

const AdminHelpArticles = () => {
  const { showToast } = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  const categories = ['KYC', 'Investment', 'Wallet', 'Withdrawal', 'Account', 'Technical', 'Getting Started'];

  // Fetch articles
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await helpArticleAPI.getAll();
      if (response.success) {
        setArticles(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch articles');
      }
    } catch (err) {
      console.error('Error fetching help articles:', err);
      setError(err.message || 'Failed to fetch articles');
      showToast(err.message || 'Failed to fetch articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Filter articles
  const filteredArticles = useMemo(() => {
    if (!articles || articles.length === 0) return [];
    
    return articles.filter(article => {
      const matchesSearch = 
        article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [articles, searchQuery, categoryFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      const response = await helpArticleAPI.delete(articleId);
      if (response.success) {
        showToast('Article deleted successfully', 'success');
        fetchArticles();
      } else {
        throw new Error(response.message || 'Failed to delete article');
      }
    } catch (err) {
      console.error('Error deleting article:', err);
      showToast(err.message || 'Failed to delete article', 'error');
    }
  };

  const handleAddArticle = () => {
    setEditingArticle(null);
    setShowAddForm(true);
  };

  const handleEditArticle = (article) => {
    setEditingArticle(article);
    setShowAddForm(true);
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setEditingArticle(null);
    // Small delay to ensure backend has processed the request
    setTimeout(() => {
      fetchArticles(); // Refresh list
    }, 500);
  };

  if (loading) {
    return (
      <div className="admin-help-articles">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="admin-help-articles">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>Error: {error}</p>
          <button 
            onClick={fetchArticles}
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
    <div className="admin-help-articles">
      {/* Page Header */}
      <div className="admin-help-articles__header">
        <div>
          <h1 className="admin-help-articles__title">Help Articles Management</h1>
          <p className="admin-help-articles__subtitle">
            Create, edit, and manage help center articles
          </p>
        </div>
        <div className="admin-help-articles__header-actions">
          <button 
            className="admin-help-articles__add-btn"
            onClick={handleAddArticle}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Article
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-help-articles__stats">
        <div className="admin-help-articles__stat">
          <div className="admin-help-articles__stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="admin-help-articles__stat-content">
            <span className="admin-help-articles__stat-label">Total Articles</span>
            <span className="admin-help-articles__stat-value">{articles.length}</span>
          </div>
        </div>
        <div className="admin-help-articles__stat">
          <div className="admin-help-articles__stat-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="admin-help-articles__stat-content">
            <span className="admin-help-articles__stat-label">Active</span>
            <span className="admin-help-articles__stat-value">
              {articles.filter(a => a.status === 'active').length}
            </span>
          </div>
        </div>
        <div className="admin-help-articles__stat">
          <div className="admin-help-articles__stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className="admin-help-articles__stat-content">
            <span className="admin-help-articles__stat-label">Popular</span>
            <span className="admin-help-articles__stat-value">
              {articles.filter(a => a.isPopular).length}
            </span>
          </div>
        </div>
        <div className="admin-help-articles__stat">
          <div className="admin-help-articles__stat-icon" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="admin-help-articles__stat-content">
            <span className="admin-help-articles__stat-label">Categories</span>
            <span className="admin-help-articles__stat-value">{categories.length}</span>
          </div>
        </div>
      </div>

      {/* Search, Filters and Table Container */}
      <div className="admin-help-articles__data-container">
        {/* Search and Filters */}
        <div className="admin-help-articles__filters">
          <div className="admin-help-articles__search">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-help-articles__search-input"
            />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="admin-help-articles__search-icon">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>

          <div className="admin-help-articles__filter-group">
            <label className="admin-help-articles__filter-label">Category</label>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat, label: cat })),
              ]}
              className="admin-help-articles__filter-select"
            />
          </div>

          <div className="admin-help-articles__filter-group">
            <label className="admin-help-articles__filter-label">Status</label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              className="admin-help-articles__filter-select"
            />
          </div>

          <button
            onClick={handleClearFilters}
            className="admin-help-articles__clear-filters"
          >
            Clear Filters
          </button>
        </div>

        {/* Articles Table */}
        <div className="admin-help-articles__table-container">
        <table className="admin-help-articles__table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Description</th>
              <th>Popular</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedArticles.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-help-articles__empty">
                  No articles found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedArticles.map((article) => (
                <tr key={article._id || article.id}>
                  <td>
                    <div className="admin-help-articles__article-title">{article.title}</div>
                  </td>
                  <td>
                    <span className="admin-help-articles__category-badge">{article.category}</span>
                  </td>
                  <td>
                    <div className="admin-help-articles__article-description">
                      {article.description?.substring(0, 100)}
                      {article.description?.length > 100 ? '...' : ''}
                    </div>
                  </td>
                  <td>
                    {article.isPopular ? (
                      <span className="admin-help-articles__popular-badge">Yes</span>
                    ) : (
                      <span className="admin-help-articles__popular-badge admin-help-articles__popular-badge--no">No</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={article.status} />
                  </td>
                  <td>
                    <div className="admin-help-articles__actions">
                      <button 
                        className="admin-help-articles__action-btn admin-help-articles__action-btn--edit"
                        title="Edit Article"
                        onClick={() => handleEditArticle(article)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        className="admin-help-articles__action-btn admin-help-articles__action-btn--delete"
                        title="Delete Article"
                        onClick={() => handleDelete(article._id || article.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredArticles.length > 0 && (
        <div className="admin-help-articles__pagination">
          <div className="admin-help-articles__pagination-info">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredArticles.length)} of {filteredArticles.length} articles
          </div>
          <div className="admin-help-articles__pagination-controls">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="admin-help-articles__page-size"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="admin-help-articles__pagination-btn"
            >
              Previous
            </button>
            <span className="admin-help-articles__pagination-page">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="admin-help-articles__pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Article Form Modal */}
      {showAddForm && (
        <AddHelpArticleForm 
          article={editingArticle}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default AdminHelpArticles;

