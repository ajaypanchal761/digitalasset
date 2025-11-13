import { Outlet } from "react-router-dom";
import "../styles/auth.css";

const AuthLayout = () => (
  <div className="auth-layout">
    <div className="auth-visual" aria-hidden="true" />
    <div className="auth-container">
      <Outlet />
    </div>
  </div>
);

export default AuthLayout;
