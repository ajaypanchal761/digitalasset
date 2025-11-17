const StatusBadge = ({ status, variant = 'default' }) => {
  const statusConfig = {
    // KYC Status
    pending: { label: 'Pending', color: 'yellow', bg: '#fef3c7', text: '#92400e' },
    approved: { label: 'Approved', color: 'green', bg: '#d1fae5', text: '#065f46' },
    rejected: { label: 'Rejected', color: 'red', bg: '#fee2e2', text: '#991b1b' },
    
    // Account Status
    active: { label: 'Active', color: 'green', bg: '#d1fae5', text: '#065f46' },
    locked: { label: 'Locked', color: 'red', bg: '#fee2e2', text: '#991b1b' },
    suspended: { label: 'Suspended', color: 'orange', bg: '#fed7aa', text: '#9a3412' },
    
    // Withdrawal Status
    processing: { label: 'Processing', color: 'blue', bg: '#dbeafe', text: '#1e40af' },
    completed: { label: 'Completed', color: 'green', bg: '#d1fae5', text: '#065f46' },
    
    // Investment Status
    'lock-in': { label: 'Lock-in', color: 'blue', bg: '#dbeafe', text: '#1e40af' },
    matured: { label: 'Matured', color: 'green', bg: '#d1fae5', text: '#065f46' },
    withdrawn: { label: 'Withdrawn', color: 'gray', bg: '#f3f4f6', text: '#374151' },
    
    // Property Status
    inactive: { label: 'Inactive', color: 'gray', bg: '#f3f4f6', text: '#374151' },
    closed: { label: 'Closed', color: 'red', bg: '#fee2e2', text: '#991b1b' },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  const customLabel = variant === 'custom' ? status : config.label;

  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {customLabel}
    </span>
  );
};

export default StatusBadge;

