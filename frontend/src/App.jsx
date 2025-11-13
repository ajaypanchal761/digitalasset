import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Explore from "./pages/Explore/Explore.jsx";
import Invest from "./pages/Invest/Invest.jsx";
import Wallet from "./pages/Wallet/Wallet.jsx";
import Profile from "./pages/Profile/Profile.jsx";
import EditProfile from "./pages/EditProfile/EditProfile.jsx";
import Kyc from "./pages/Kyc/Kyc.jsx";
import PropertyDetail from "./pages/PropertyDetail/PropertyDetail.jsx";
import Chat from "./pages/Chat/Chat.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import ForgotPassword from "./pages/Auth/ForgotPassword.jsx";
import VerifyEmail from "./pages/Auth/VerifyEmail.jsx";
import AdminDashboard from "./pages/Admin/Dashboard/AdminDashboard.jsx";
import AdminUsers from "./pages/Admin/Users/AdminUsers.jsx";
import AdminProperties from "./pages/Admin/Properties/AdminProperties.jsx";
import AdminKyc from "./pages/Admin/Kyc/AdminKyc.jsx";
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
        <Route path="invest" element={<Invest />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="kyc" element={<Kyc />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/edit" element={<EditProfile />} />
        <Route path="chat" element={<Chat />} />
      </Route>

      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="properties" element={<AdminProperties />} />
        <Route path="kyc" element={<AdminKyc />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
