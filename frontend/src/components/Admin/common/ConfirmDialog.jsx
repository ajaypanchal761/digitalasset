import { useEffect } from 'react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default' // default, danger
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="confirm-dialog__overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__header">
          <h3 className="confirm-dialog__title">{title}</h3>
          <button 
            className="confirm-dialog__close"
            onClick={onClose}
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
        </div>
        <div className="confirm-dialog__footer">
          <button 
            className="confirm-dialog__button confirm-dialog__button--cancel"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button 
            className={`confirm-dialog__button confirm-dialog__button--confirm ${
              variant === 'danger' ? 'confirm-dialog__button--danger' : ''
            }`}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

