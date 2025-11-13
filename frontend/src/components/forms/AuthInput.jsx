import { forwardRef } from 'react';

const AuthInput = forwardRef(function AuthInput(
  { icon, type = 'text', placeholder, value, onChange, name, autoComplete, autoFocus },
  ref,
) {
  return (
    <label className="auth-field">
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
      />
    </label>
  );
});

export default AuthInput;

