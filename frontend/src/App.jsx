import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "./components/Toast.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";

// Lazy load components for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard.jsx"));
const Explore = lazy(() => import("./pages/Explore/Explore.jsx"));
const Invest = lazy(() => import("./pages/Invest/Invest.jsx"));
const Payment = lazy(() => import("./pages/Payment/Payment.jsx"));
const Wallet = lazy(() => import("./pages/Wallet/Wallet.jsx"));
const ActiveInvestments = lazy(() => import("./pages/Wallet/ActiveInvestments.jsx"));
const MaturedInvestments = lazy(() => import("./pages/Wallet/MaturedInvestments.jsx"));
const AllInvestments = lazy(() => import("./pages/Wallet/AllInvestments.jsx"));
const Earnings = lazy(() => import("./pages/Wallet/Earnings.jsx"));
const Profile = lazy(() => import("./pages/Profile/Profile.jsx"));
const EditProfile = lazy(() => import("./pages/EditProfile/EditProfile.jsx"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail/PropertyDetail.jsx"));
const HoldingDetail = lazy(() => import("./pages/HoldingDetail/HoldingDetail.jsx"));
const WithdrawInfo = lazy(() => import("./pages/WithdrawInfo/WithdrawInfo.jsx"));
const ContactOwner = lazy(() => import("./pages/ContactOwner/ContactOwner.jsx"));
const PropertySaleOffline = lazy(() => import("./pages/PropertySaleOffline/PropertySaleOffline.jsx"));
const TransferOwnership = lazy(() => import("./pages/TransferOwnership/TransferOwnership.jsx"));
const Chat = lazy(() => import("./pages/Chat/Chat.jsx"));
const Holdings = lazy(() => import("./pages/Holdings/Holdings.jsx"));
const Login = lazy(() => import("./pages/Auth/Login.jsx"));
const Register = lazy(() => import("./pages/Auth/Register.jsx"));
const VerifyEmail = lazy(() => import("./pages/Auth/VerifyEmail.jsx"));
const VerifyOtp = lazy(() => import("./pages/Auth/VerifyOtp.jsx"));
const LoginOtp = lazy(() => import("./pages/Auth/LoginOtp.jsx"));
const AdminDashboard = lazy(() => import("./pages/Admin/Dashboard/AdminDashboard.jsx"));
const AdminUsers = lazy(() => import("./pages/Admin/Users/AdminUsers.jsx"));
const AdminProperties = lazy(() => import("./pages/Admin/Properties/AdminProperties.jsx"));
const AdminWithdrawals = lazy(() => import("./pages/Admin/Withdrawals/AdminWithdrawals.jsx"));
const AdminPayouts = lazy(() => import("./pages/Admin/Payouts/AdminPayouts.jsx"));
const AdminChat = lazy(() => import("./pages/Admin/Chat/AdminChat.jsx"));
const AdminProfileSettings = lazy(() => import("./pages/Admin/Profile/AdminProfileSettings.jsx"));
const AdminLogin = lazy(() => import("./pages/Admin/Auth/AdminLogin.jsx"));
const AdminRegister = lazy(() => import("./pages/Admin/Auth/AdminRegister.jsx"));
const AdminVerifyOtp = lazy(() => import("./pages/Admin/Auth/AdminVerifyOtp.jsx"));
const AdminForgotPassword = lazy(() => import("./pages/Admin/Auth/AdminForgotPassword.jsx"));
const AdminResetPassword = lazy(() => import("./pages/Admin/Auth/AdminResetPassword.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

// Loading component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    fontSize: '1.1rem',
    color: '#64748b'
  }}>
    Loading...
  </div>
);

function App() {
  return (
    <>
      <ToastContainer />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/auth/login" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="explore" element={<Explore />} />
            <Route path="property/:id" element={<PropertyDetail />} />
            <Route path="holding/:id" element={<HoldingDetail />} />
            <Route path="invest" element={<Invest />} />
            <Route path="payment" element={<Payment />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="wallet/active-investments" element={<ActiveInvestments />} />
            <Route path="wallet/matured-investments" element={<MaturedInvestments />} />
            <Route path="wallet/investments" element={<AllInvestments />} />
            <Route path="wallet/earnings" element={<Earnings />} />
            <Route path="withdraw-info" element={<WithdrawInfo />} />
            <Route path="contact-owner" element={<ContactOwner />} />
            <Route path="property-sale/offline" element={<PropertySaleOffline />} />
            <Route path="transfer-ownership" element={<TransferOwnership />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<EditProfile />} />
            <Route path="chat" element={<Chat />} />
            <Route path="holdings" element={<Holdings />} />
          </Route>

          <Route path="/auth" element={<AuthLayout />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="verify-otp" element={<VerifyOtp />} />
            <Route path="login-otp" element={<LoginOtp />} />
          </Route>

          {/* Admin Auth Routes */}
          <Route path="/admin-auth" element={<AuthLayout />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<AdminLogin />} />
            <Route path="register" element={<AdminRegister />} />
            <Route path="verify-otp" element={<AdminVerifyOtp />} />
            <Route path="forgot-password" element={<AdminForgotPassword />} />
            <Route path="reset-password" element={<AdminResetPassword />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="chat" element={<AdminChat />} />
            <Route path="profile" element={<AdminProfileSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
