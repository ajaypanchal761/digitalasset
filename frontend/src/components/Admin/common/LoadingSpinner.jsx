const LoadingSpinner = ({ size = 'medium', fullScreen = false }) => {
  const sizeClasses = {
    small: 'loading-spinner--small',
    medium: 'loading-spinner--medium',
    large: 'loading-spinner--large',
  };

  const spinner = (
    <div className={`loading-spinner ${sizeClasses[size]}`}>
      <div className="loading-spinner__circle"></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner__overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;

