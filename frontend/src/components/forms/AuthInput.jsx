import { forwardRef } from 'react';

const AuthInput = forwardRef(function AuthInput(
  { icon, type = 'text', placeholder, value, onChange, name, autoComplete, autoFocus, disabled, maxLength },
  ref,
) {
  return (
    <label className={`auth-field ${disabled ? 'auth-field--disabled' : ''}`}>
      {icon ? <span className="auth-field-icon">{icon}</span> : null}
      <input
        ref={ref}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        maxLength={maxLength}
      />
    </label>
  );
});

export default AuthInput;

