import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';

// Helper function to convert data URL to File
const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const AddPropertyForm = ({ onClose, property = null }) => {
  const { addProperty, updateProperty } = useAdmin();
  const isEditMode = !!property;

  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    propertyType: property?.propertyType || 'Digital Property',
    deadline: property?.deadline || '',
    availableToInvest: property?.availableToInvest || 1000000,
    status: property?.status || 'active',
    image: property?.image || null,
    documents: property?.documents || [],
  });

  const [imagePreview, setImagePreview] = useState(property?.image || null);
  const [imageFile, setImageFile] = useState(null); // Store actual File object
  const [uploadedDocuments, setUploadedDocuments] = useState(property?.documents || []);
  const [documentFiles, setDocumentFiles] = useState([]); // Store File objects
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('📝 AddPropertyForm - Input changed:', {
      field: name,
      value: value,
      timestamp: new Date().toISOString()
    });
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('🖼️ AddPropertyForm - Image selected:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        sizeInMB: (file.size / (1024 * 1024)).toFixed(2),
        timestamp: new Date().toISOString()
      });
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        console.error('❌ AddPropertyForm - Image too large:', {
          fileSize: file.size,
          maxSize: 5 * 1024 * 1024
        });
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }
      setImageFile(file); // Store File object
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        console.log('✅ AddPropertyForm - Image preview generated');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    console.log('📄 AddPropertyForm - Documents selected:', {
      count: files.length,
      files: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })),
      timestamp: new Date().toISOString()
    });
    const newDocuments = files.map(file => ({
      id: `doc-${Date.now()}-${Math.random()}`,
      name: file.name,
      file: file, // Store File object
      type: file.type,
      size: file.size,
    }));
    setUploadedDocuments(prev => [...prev, ...newDocuments]);
    setDocumentFiles(prev => [...prev, ...files]);
  };

  const handleRemoveDocument = (docId) => {
    const docToRemove = uploadedDocuments.find(doc => doc.id === docId);
    if (docToRemove && docToRemove.file) {
      setDocumentFiles(prev => prev.filter(f => f !== docToRemove.file));
    }
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const validateForm = () => {
    console.log('🔍 AddPropertyForm - Validating form:', {
      formData: {
        title: formData.title,
        description: formData.description?.substring(0, 50) + '...',
        propertyType: formData.propertyType,
        deadline: formData.deadline,
        availableToInvest: formData.availableToInvest,
        status: formData.status,
        hasImage: !!imageFile || !!imagePreview,
        documentCount: uploadedDocuments.length
      },
      timestamp: new Date().toISOString()
    });
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Property title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate <= today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }
    
    if (!formData.availableToInvest || formData.availableToInvest < 100000) {
      newErrors.availableToInvest = 'Available amount must be at least ₹1,00,000';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log(isValid ? '✅ AddPropertyForm - Form validation passed' : '❌ AddPropertyForm - Form validation failed:', {
      errors: newErrors,
      isValid
    });
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 AddPropertyForm - Form submission started:', {
      isEditMode,
      timestamp: new Date().toISOString()
    });
    
    if (!validateForm()) {
      console.log('⏸️ AddPropertyForm - Form submission stopped due to validation errors');
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      // Prepare property data
      const propertyData = {
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType,
        deadline: formData.deadline,
        availableToInvest: Number(formData.availableToInvest),
        status: formData.status,
        // Fixed fields
        minInvestment: 500000,
        lockInMonths: 3,
        monthlyReturnRate: 0.5,
      };

      console.log('📦 AddPropertyForm - Preparing property data:', {
        ...propertyData,
        description: propertyData.description?.substring(0, 50) + '...',
        hasImage: !!imageFile || !!imagePreview,
        imageType: imageFile ? 'File' : (imagePreview ? 'URL/DataURL' : 'none'),
        documentCount: uploadedDocuments.length
      });

      // Handle image - use File object if available, otherwise use existing URL
      if (imageFile) {
        console.log('🖼️ AddPropertyForm - Using image file:', {
          fileName: imageFile.name,
          fileSize: imageFile.size,
          fileType: imageFile.type
        });
        propertyData.image = imageFile;
      } else if (imagePreview && typeof imagePreview === 'string' && !imagePreview.startsWith('http')) {
        console.log('🖼️ AddPropertyForm - Converting data URL to file');
        // Convert data URL to File if needed
        propertyData.image = dataURLtoFile(imagePreview, 'property-image.jpg');
      } else if (imagePreview) {
        console.log('🖼️ AddPropertyForm - Using existing image URL:', imagePreview.substring(0, 50) + '...');
        propertyData.image = imagePreview; // Existing URL
      } else {
        console.log('ℹ️ AddPropertyForm - No image provided');
      }

      // Handle documents - extract File objects
      const documentFilesToUpload = uploadedDocuments
        .filter(doc => doc.file)
        .map(doc => doc.file);
      
      if (documentFilesToUpload.length > 0) {
        console.log('📄 AddPropertyForm - Uploading document files:', {
          count: documentFilesToUpload.length,
          files: documentFilesToUpload.map(f => ({ name: f.name, size: f.size }))
        });
        propertyData.documents = documentFilesToUpload;
      } else if (uploadedDocuments.length > 0) {
        console.log('📄 AddPropertyForm - Using existing document URLs:', {
          count: uploadedDocuments.length
        });
        // Use existing document URLs
        propertyData.documents = uploadedDocuments.map(doc => doc.url || doc);
      } else {
        console.log('ℹ️ AddPropertyForm - No documents provided');
        propertyData.documents = [];
      }
      
      console.log('📤 AddPropertyForm - Final property payload:', {
        ...propertyData,
        description: propertyData.description?.substring(0, 50) + '...',
        image: propertyData.image instanceof File 
          ? `File: ${propertyData.image.name}` 
          : (typeof propertyData.image === 'string' 
            ? propertyData.image.substring(0, 50) + '...' 
            : 'none'),
        documents: propertyData.documents.length > 0 
          ? `${propertyData.documents.length} document(s)` 
          : 'none'
      });
      
      if (isEditMode) {
        const propertyId = property._id || property.id;
        console.log('✏️ AddPropertyForm - Updating property:', {
          propertyId,
          updates: propertyData
        });
        await updateProperty(propertyId, propertyData);
        console.log('✅ AddPropertyForm - Property updated successfully');
        setSuccessMessage('Property updated successfully!');
      } else {
        console.log('➕ AddPropertyForm - Creating new property');
        const result = await addProperty(propertyData);
        console.log('✅ AddPropertyForm - Property created successfully:', {
          propertyId: result?._id || result?.id,
          propertyTitle: result?.title
        });
        setSuccessMessage('Property created successfully!');
      }
      
      // Close form after successful submission
      setTimeout(() => {
        console.log('🔒 AddPropertyForm - Closing form after successful submission');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('❌ AddPropertyForm - Error saving property:', {
        error: error.message,
        stack: error.stack,
        name: error.name,
        fullError: error
      });
      setErrors({ submit: error.message || 'Failed to save property. Please try again.' });
    } finally {
      setIsSubmitting(false);
      console.log('🏁 AddPropertyForm - Form submission completed');
    }
  };

  return (
    <div className="add-property-form__overlay" onClick={onClose}>
      <div className="add-property-form__modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-property-form__header">
          <h2 className="add-property-form__title">
            {isEditMode ? 'Edit Property' : 'Add New Property'}
          </h2>
          <button 
            className="add-property-form__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="add-property-form" onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="add-property-form__section">
            <h3 className="add-property-form__section-title">Basic Information</h3>
            
            <div className="add-property-form__field">
              <label className="add-property-form__label">
                Property Title <span className="add-property-form__required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`add-property-form__input ${errors.title ? 'add-property-form__input--error' : ''}`}
                placeholder="e.g., Tech Park Alpha"
              />
              {errors.title && (
                <span className="add-property-form__error">{errors.title}</span>
              )}
            </div>

            <div className="add-property-form__field">
              <label className="add-property-form__label">
                Description <span className="add-property-form__required">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`add-property-form__textarea ${errors.description ? 'add-property-form__input--error' : ''}`}
                placeholder="Describe the property..."
                rows="4"
              />
              {errors.description && (
                <span className="add-property-form__error">{errors.description}</span>
              )}
            </div>

            <div className="add-property-form__field">
              <label className="add-property-form__label">Property Type</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="add-property-form__select"
              >
                <option value="Digital Property">Digital Property</option>
                <option value="Tech Infrastructure">Tech Infrastructure</option>
                <option value="Data Center">Data Center</option>
                <option value="Co-working Space">Co-working Space</option>
                <option value="Commercial Property">Commercial Property</option>
              </select>
            </div>

            <div className="add-property-form__field">
              <label className="add-property-form__label">Property Image</label>
              <div className="add-property-form__image-upload">
                {imagePreview ? (
                  <div className="add-property-form__image-preview">
                    <img 
                      src={imagePreview} 
                      alt="Preview"
                      loading="lazy"
                      decoding="async"
                    />
                    <button
                      type="button"
                      className="add-property-form__remove-image"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        setFormData(prev => ({ ...prev, image: null }));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="add-property-form__image-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="add-property-form__file-input"
                    />
                    <div className="add-property-form__image-upload-content">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span>Click to upload image</span>
                      <span className="add-property-form__image-upload-hint">Max 5MB</span>
                    </div>
                  </label>
                )}
              </div>
              {errors.image && (
                <span className="add-property-form__error">{errors.image}</span>
              )}
            </div>
          </div>

          {/* Investment Details Section */}
          <div className="add-property-form__section">
            <h3 className="add-property-form__section-title">Investment Details</h3>
            
            <div className="add-property-form__fixed-fields">
              <div className="add-property-form__fixed-field">
                <label className="add-property-form__label">Minimum Investment</label>
                <div className="add-property-form__fixed-value">₹5,00,000 (Fixed)</div>
              </div>
              <div className="add-property-form__fixed-field">
                <label className="add-property-form__label">Lock-in Period</label>
                <div className="add-property-form__fixed-value">3 Months (Fixed)</div>
              </div>
              <div className="add-property-form__fixed-field">
                <label className="add-property-form__label">Monthly Return Rate</label>
                <div className="add-property-form__fixed-value">0.5% (Fixed)</div>
              </div>
            </div>

            <div className="add-property-form__field">
              <label className="add-property-form__label">
                Investment Deadline <span className="add-property-form__required">*</span>
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                className={`add-property-form__input ${errors.deadline ? 'add-property-form__input--error' : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.deadline && (
                <span className="add-property-form__error">{errors.deadline}</span>
              )}
            </div>

            <div className="add-property-form__field">
              <label className="add-property-form__label">
                Available to Invest (₹) <span className="add-property-form__required">*</span>
              </label>
              <input
                type="number"
                name="availableToInvest"
                value={formData.availableToInvest}
                onChange={handleInputChange}
                className={`add-property-form__input ${errors.availableToInvest ? 'add-property-form__input--error' : ''}`}
                placeholder="1000000"
                min="100000"
                step="10000"
              />
              {errors.availableToInvest && (
                <span className="add-property-form__error">{errors.availableToInvest}</span>
              )}
              <span className="add-property-form__hint">Minimum ₹1,00,000</span>
            </div>
          </div>

          {/* Documents Section */}
          <div className="add-property-form__section">
            <h3 className="add-property-form__section-title">Legal Documents</h3>
            
            <div className="add-property-form__field">
              <label className="add-property-form__label">Upload Documents</label>
              <label className="add-property-form__file-upload-label">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleDocumentUpload}
                  className="add-property-form__file-input"
                />
                <div className="add-property-form__file-upload-content">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Click to upload documents</span>
                </div>
              </label>
            </div>

            {uploadedDocuments.length > 0 && (
              <div className="add-property-form__documents-list">
                {uploadedDocuments.map((doc) => (
                  <div key={doc.id} className="add-property-form__document-item">
                    <div className="add-property-form__document-info">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span>{doc.name}</span>
                    </div>
                    <button
                      type="button"
                      className="add-property-form__remove-document"
                      onClick={() => handleRemoveDocument(doc.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Section */}
          <div className="add-property-form__section">
            <h3 className="add-property-form__section-title">Status</h3>
            
            <div className="add-property-form__field">
              <label className="add-property-form__label">Property Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="add-property-form__select"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="add-property-form__actions">
            <button
              type="button"
              className="add-property-form__cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-property-form__submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Property' : 'Create Property'}
            </button>
          </div>

          {successMessage && (
            <div className="add-property-form__submit-success" style={{ 
              padding: '0.75rem', 
              backgroundColor: '#d1fae5', 
              color: '#065f46', 
              borderRadius: '0.5rem',
              marginTop: '1rem'
            }}>
              {successMessage}
            </div>
          )}
          {errors.submit && (
            <div className="add-property-form__submit-error" style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fee2e2', 
              color: '#991b1b', 
              borderRadius: '0.5rem',
              marginTop: '1rem'
            }}>
              {errors.submit}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddPropertyForm;

