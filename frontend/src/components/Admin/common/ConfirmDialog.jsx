import { useEffect } from 'react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onCancel,
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  confirmText,
  cancelLabel = 'Cancel',
  variant = 'default', // default, danger
  showInput = false,
  inputValue = '',
  onInputChange,
  inputPlaceholder = '',
  confirmButtonClass = ''
}) => {
  const isDialogOpen = isOpen !== undefined ? isOpen : true; // Default to true if not provided (for backward compatibility)
  const handleCancel = onCancel || onClose;
  const confirmButtonText = confirmText || confirmLabel;

  useEffect(() => {
    if (isDialogOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDialogOpen]);

  if (!isDialogOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    if (onClose) onClose();
  };

  const handleCancelClick = () => {
    if (handleCancel) handleCancel();
  };

  return (
    <div className="confirm-dialog__overlay" onClick={handleCancelClick}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__header">
          <h3 className="confirm-dialog__title">{title}</h3>
          <button 
            className="confirm-dialog__close"
            onClick={handleCancelClick}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="confirm-dialog__body">
          <p className="confirm-dialog__message">{message}</p>
          {showInput && (
            <div className="confirm-dialog__input-container">
              <textarea
                className="confirm-dialog__input"
                value={inputValue}
                onChange={(e) => onInputChange && onInputChange(e.target.value)}
                placeholder={inputPlaceholder}
                rows={4}
              />
            </div>
          )}
        </div>
        <div className="confirm-dialog__footer">
          <button 
            className="confirm-dialog__button confirm-dialog__button--cancel"
            onClick={handleCancelClick}
          >
            {cancelLabel}
          </button>
          <button 
            className={`confirm-dialog__button confirm-dialog__button--confirm ${
              variant === 'danger' ? 'confirm-dialog__button--danger' : ''
            } ${confirmButtonClass}`}
            onClick={handleConfirm}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

