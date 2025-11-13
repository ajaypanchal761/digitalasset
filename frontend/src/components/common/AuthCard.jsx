const AuthCard = ({ title, subtitle, children, footer }) => {
  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="auth-card__body">{children}</div>
      {footer ? <div className="auth-card__footer">{footer}</div> : null}
    </div>
  );
};

export default AuthCard;

