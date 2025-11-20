import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Explore from "./pages/Explore/Explore.jsx";
import Invest from "./pages/Invest/Invest.jsx";
import Payment from "./pages/Payment/Payment.jsx";
import Wallet from "./pages/Wallet/Wallet.jsx";
import ActiveInvestments from "./pages/Wallet/ActiveInvestments.jsx";
import MaturedInvestments from "./pages/Wallet/MaturedInvestments.jsx";
import AllInvestments from "./pages/Wallet/AllInvestments.jsx";
import Earnings from "./pages/Wallet/Earnings.jsx";
import Profile from "./pages/Profile/Profile.jsx";
import EditProfile from "./pages/EditProfile/EditProfile.jsx";
import PropertyDetail from "./pages/PropertyDetail/PropertyDetail.jsx";
import HoldingDetail from "./pages/HoldingDetail/HoldingDetail.jsx";
import WithdrawInfo from "./pages/WithdrawInfo/WithdrawInfo.jsx";
import ContactOwner from "./pages/ContactOwner/ContactOwner.jsx";
import PropertySaleOffline from "./pages/PropertySaleOffline/PropertySaleOffline.jsx";
import TransferOwnership from "./pages/TransferOwnership/TransferOwnership.jsx";
import Chat from "./pages/Chat/Chat.jsx";
import Holdings from "./pages/Holdings/Holdings.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import ForgotPassword from "./pages/Auth/ForgotPassword.jsx";
import VerifyEmail from "./pages/Auth/VerifyEmail.jsx";
import VerifyOtp from "./pages/Auth/VerifyOtp.jsx";
import LoginOtp from "./pages/Auth/LoginOtp.jsx";
import AdminDashboard from "./pages/Admin/Dashboard/AdminDashboard.jsx";
import AdminUsers from "./pages/Admin/Users/AdminUsers.jsx";
import AdminProperties from "./pages/Admin/Properties/AdminProperties.jsx";
import AdminWithdrawals from "./pages/Admin/Withdrawals/AdminWithdrawals.jsx";
import NotFound from "./pages/NotFound.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
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
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="verify-otp" element={<VerifyOtp />} />
        <Route path="login-otp" element={<LoginOtp />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="properties" element={<AdminProperties />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
