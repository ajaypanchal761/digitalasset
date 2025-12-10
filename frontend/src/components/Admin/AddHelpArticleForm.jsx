import { useState, useEffect } from 'react';
import { helpArticleAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AddHelpArticleForm = ({ onClose, article = null }) => {
  const { showToast } = useToast();
  const isEditMode = !!article;
  const [allArticles, setAllArticles] = useState([]);

  const [formData, setFormData] = useState({
    title: article?.title || '',
    category: article?.category || 'KYC',
    description: article?.description || '',
    content: article?.content || '',
    iconComponent: article?.iconComponent || 'KYC',
    isPopular: article?.isPopular || false,
    status: article?.status || 'active',
    relatedArticles: article?.relatedArticles?.map(a => a._id || a.id) || [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all articles for related articles selection
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await helpArticleAPI.getAll();
        if (response.success) {
          // Exclude current article if editing
          const filtered = response.data.filter(a => {
            if (isEditMode && article) {
              return (a._id || a.id) !== (article._id || article.id);
            }
            return true;
          });
          setAllArticles(filtered);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
      }
    };
    fetchArticles();
  }, [isEditMode, article]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleContentChange = (e) => {
    setFormData(prev => ({
      ...prev,
      content: e.target.value
    }));
    if (errors.content) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.content;
        return newErrors;
      });
    }
  };

  const handleRelatedArticlesChange = (articleId) => {
    setFormData(prev => {
      const current = prev.relatedArticles || [];
      if (current.includes(articleId)) {
        return {
          ...prev,
          relatedArticles: current.filter(id => id !== articleId)
        };
      } else {
        return {
          ...prev,
          relatedArticles: [...current, articleId]
        };
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const articleData = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        content: formData.content.trim(),
        iconComponent: formData.iconComponent || formData.category,
        isPopular: formData.isPopular,
        status: formData.status,
        relatedArticles: formData.relatedArticles,
      };

      let response;
      if (isEditMode) {
        const articleId = article._id || article.id;
        response = await helpArticleAPI.update(articleId, articleData);
      } else {
        response = await helpArticleAPI.create(articleData);
      }

      if (response.success) {
        showToast(isEditMode ? 'Article updated successfully!' : 'Article created successfully!', 'success');
        // Close form immediately and let parent component refresh
        onClose();
      } else {
        throw new Error(response.message || 'Failed to save article');
      }
    } catch (error) {
      console.error('Error saving article:', error);
      setErrors({ submit: error.message || 'Failed to save article. Please try again.' });
      showToast(error.message || 'Failed to save article', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['KYC', 'Investment', 'Wallet', 'Withdrawal', 'Account', 'Technical', 'Getting Started'];

  return (
    <div className="add-help-article-form__overlay" onClick={onClose}>
      <div className="add-help-article-form__modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-help-article-form__header">
          <h2 className="add-help-article-form__title">
            {isEditMode ? 'Edit Help Article' : 'Add New Help Article'}
          </h2>
          <button 
            className="add-help-article-form__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="add-help-article-form" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="add-help-article-form__section">
            <h3 className="add-help-article-form__section-title">Basic Information</h3>
            
            <div className="add-help-article-form__field">
              <label className="add-help-article-form__label">
                Title <span className="add-help-article-form__required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`add-help-article-form__input ${errors.title ? 'add-help-article-form__input--error' : ''}`}
                placeholder="e.g., How to Complete KYC Verification"
              />
              {errors.title && (
                <span className="add-help-article-form__error">{errors.title}</span>
              )}
            </div>

            <div className="add-help-article-form__field">
              <label className="add-help-article-form__label">
                Category <span className="add-help-article-form__required">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`add-help-article-form__select ${errors.category ? 'add-help-article-form__input--error' : ''}`}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <span className="add-help-article-form__error">{errors.category}</span>
              )}
            </div>

            <div className="add-help-article-form__field">
              <label className="add-help-article-form__label">
                Icon Component
              </label>
              <select
                name="iconComponent"
                value={formData.iconComponent}
                onChange={handleInputChange}
                className="add-help-article-form__select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Help">Help</option>
              </select>
            </div>

            <div className="add-help-article-form__field">
              <label className="add-help-article-form__label">
                Description <span className="add-help-article-form__required">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`add-help-article-form__textarea ${errors.description ? 'add-help-article-form__input--error' : ''}`}
                placeholder="Brief description of the article..."
                rows="3"
              />
              {errors.description && (
                <span className="add-help-article-form__error">{errors.description}</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="add-help-article-form__section">
            <h3 className="add-help-article-form__section-title">Content</h3>
            
            <div className="add-help-article-form__field">
              <label className="add-help-article-form__label">
                Article Content <span className="add-help-article-form__required">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleContentChange}
                className={`add-help-article-form__textarea add-help-article-form__textarea--large ${errors.content ? 'add-help-article-form__input--error' : ''}`}
                placeholder="Enter article content using simple formatting...

# Main Heading
## Subheading
### Smaller Heading

**Bold text** or *italic text*

- List item 1
- List item 2
- List item 3

1. Numbered item 1
2. Numbered item 2

Separate paragraphs with blank lines."
                rows="15"
              />
              <p className="add-help-article-form__hint">
                Use simple formatting: # for headings, ** for bold, * for italic, - for lists. Separate paragraphs with blank lines.
              </p>
              {errors.content && (
                <span className="add-help-article-form__error">{errors.content}</span>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="add-help-article-form__section">
            <h3 className="add-help-article-form__section-title">Settings</h3>
            
            <div className="add-help-article-form__field">
              <label className="add-help-article-form__label">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="add-help-article-form__select"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="add-help-article-form__field">
              <label className="add-help-article-form__checkbox-label">
                <input
                  type="checkbox"
                  name="isPopular"
                  checked={formData.isPopular}
                  onChange={handleInputChange}
                  className="add-help-article-form__checkbox"
                />
                <span>Mark as Popular Article</span>
              </label>
            </div>

            <div className="add-help-article-form__field">
              <label className="add-help-article-form__label">
                Related Articles
              </label>
              <div className="add-help-article-form__related-articles">
                {allArticles.length === 0 ? (
                  <p className="add-help-article-form__hint">No other articles available</p>
                ) : (
                  allArticles.map(art => (
                    <label key={art._id || art.id} className="add-help-article-form__checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.relatedArticles.includes(art._id || art.id)}
                        onChange={() => handleRelatedArticlesChange(art._id || art.id)}
                        className="add-help-article-form__checkbox"
                      />
                      <span>{art.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="add-help-article-form__error-message">
              {errors.submit}
            </div>
          )}

          {/* Form Actions */}
          <div className="add-help-article-form__actions">
            <button
              type="button"
              className="add-help-article-form__cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-help-article-form__submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Article' : 'Create Article')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHelpArticleForm;

