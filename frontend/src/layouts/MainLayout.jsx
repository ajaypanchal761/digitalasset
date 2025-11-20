import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import logoImage from "../assets/logo.png";

const desktopNavLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/explore", label: "Explore" },
  { to: "/chat", label: "Chat" },
  { to: "/wallet", label: "Wallet" },
  { to: "/profile", label: "Profile" },
];

const bottomNavLinks = [
  { to: "/dashboard", label: "Home", icon: HomeIcon },
  { to: "/chat", label: "Chat", icon: ChatIcon },
  { to: "/wallet", label: "Wallet", icon: WalletIcon },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

const formatCurrency = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const MetricItem = ({ label, value }) => (
  <div className="wallet-summary-card__metric">
    <span className="wallet-summary-card__metric-label">{label}</span>
    <span className="wallet-summary-card__metric-value">{value}</span>
  </div>
);

const WalletSummaryCard = ({ wallet }) => {
  // Handle wallet being null or undefined
  if (!wallet) {
    return (
      <div className="wallet-summary-card">
        <div className="wallet-summary-card__header">
          <span className="wallet-summary-card__label">Wallet Balance</span>
          <span className="wallet-summary-card__value">{formatCurrency(0, "INR")}</span>
        </div>
      </div>
    );
  }

  const metrics = useMemo(
    () => [
      { label: "Total Investments", value: formatCurrency(wallet.totalInvestments || 0, wallet.currency || "INR") },
      { label: "Earnings Received", value: formatCurrency(wallet.earningsReceived || 0, wallet.currency || "INR") },
      { label: "Withdrawable Balance", value: formatCurrency(wallet.withdrawableBalance || 0, wallet.currency || "INR") },
    ],
    [wallet.currency, wallet.earningsReceived, wallet.totalInvestments, wallet.withdrawableBalance],
  );

  return (
    <div className="wallet-summary-card">
      <div className="wallet-summary-card__header">
        <span className="wallet-summary-card__label">Wallet Balance</span>
        <span className="wallet-summary-card__value">{formatCurrency(wallet.balance || 0, wallet.currency || "INR")}</span>
      </div>
      <div className="wallet-summary-card__metrics">
        {metrics.map((metric) => (
          <MetricItem key={metric.label} {...metric} />
        ))}
      </div>
    </div>
  );
};

function NotificationIcon({ active }) {
  return (
    <svg
      className="icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3C8.68629 3 6 5.68629 6 9V11.5866C6 12.168 5.78084 12.7267 5.38268 13.1479L4.2764 14.3175C3.41947 15.2205 4.05947 16.75 5.3236 16.75H18.6764C19.9405 16.75 20.5805 15.2205 19.7236 14.3175L18.6173 13.1479C18.2192 12.7267 18 12.168 18 11.5866V9C18 5.68629 15.3137 3 12 3Z"
        stroke={active ? "#2563eb" : "#1f2937"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 17.5C10.1472 18.6569 11.4713 19.25 12.7954 18.9386C13.627 18.7423 14.3387 18.1667 14.7 17.5"
        stroke={active ? "#2563eb" : "#1f2937"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10.5L12 4L20 10.5V19.5C20 20.3284 19.3284 21 18.5 21H5.5C4.67157 21 4 20.3284 4 19.5V10.5Z"
        stroke={active ? "#2563eb" : "#475569"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 21V12H15V21"
        stroke={active ? "#2563eb" : "#475569"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 11.5C21 16.1944 17.1944 20 12.5 20C11.4514 20 10.4543 19.7762 9.5578 19.3764L4.5 21L6.12361 16.4422C5.72376 15.5457 5.5 14.5486 5.5 13.5C5.5 8.80558 9.30558 5 14 5C18.6944 5 22.5 8.80558 22.5 13.5"
        stroke={active ? "#2563eb" : "#475569"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 11.5C9 11.7761 9.22386 12 9.5 12H14.5C14.7761 12 15 11.7761 15 11.5V11.5C15 11.2239 14.7761 11 14.5 11H9.5C9.22386 11 9 11.2239 9 11.5V11.5Z"
        stroke={active ? "#2563eb" : "#475569"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 14.5C9 14.7761 9.22386 15 9.5 15H12.5C12.7761 15 13 14.7761 13 14.5V14.5C13 14.2239 12.7761 14 12.5 14H9.5C9.22386 14 9 14.2239 9 14.5V14.5Z"
        stroke={active ? "#2563eb" : "#475569"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7.5C4 6.67157 4.67157 6 5.5 6H18.5C19.3284 6 20 6.67157 20 7.5V16.5C20 17.3284 19.3284 18 18.5 18H5.5C4.67157 18 4 17.3284 4 16.5V7.5Z"
        stroke={active ? "#2563eb" : "#475569"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 9H15C14.1716 9 13.5 9.67157 13.5 10.5C13.5 11.3284 14.1716 12 15 12H20"
        stroke={active ? "#2563eb" : "#475569"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 12H16.01"
        stroke={active ? "#2563eb" : "#475569"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z"
        stroke={active ? "#2563eb" : "#475569"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 20C5.6653 17.3474 8.62594 15.75 12 15.75C15.3741 15.75 18.3347 17.3474 19.5 20"
        stroke={active ? "#2563eb" : "#475569"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const Avatar = ({ name, avatarUrl, initials }) => {
  if (avatarUrl) {
    return <img className="avatar-image" src={avatarUrl} alt={name} />;
  }

  return <span className="avatar-fallback">{initials || name.slice(0, 2).toUpperCase()}</span>;
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const query = window.matchMedia("(max-width: 768px)");
    const handler = (event) => setIsMobile(event.matches);

    if (query.addEventListener) {
      query.addEventListener("change", handler);
    } else {
      query.addListener(handler);
    }

    return () => {
      if (query.removeEventListener) {
        query.removeEventListener("change", handler);
      } else {
        query.removeListener(handler);
      }
    };
  }, []);

  return isMobile;
};

const MainLayout = () => {
  const { wallet } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, signOut, loading } = useAuth();
  const isMobile = useIsMobile();
  const isPropertyDetailPage = location.pathname.startsWith("/property/");
  const isHoldingDetailPage = location.pathname.startsWith("/holding/");
  const isEditProfilePage = location.pathname === "/profile/edit";
  const isProfilePage = location.pathname === "/profile";

  // List of public routes that don't require authentication
  const publicRoutes = ["/explore", "/property/"];
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

  // Check authentication and redirect if needed
  useEffect(() => {
    // Don't redirect while loading
    if (loading) {
      return;
    }

    // Allow public routes without authentication
    if (isPublicRoute) {
      return;
    }

    // Check if user has a token
    const userToken = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');

    // If no token and not authenticated, redirect to login
    if (!userToken && !adminToken && !isAuthenticated) {
      console.log('🔒 MainLayout - No authentication, redirecting to login:', {
        pathname: location.pathname,
        isAuthenticated,
        hasUserToken: !!userToken,
        hasAdminToken: !!adminToken,
        timestamp: new Date().toISOString()
      });
      navigate("/auth/login", { replace: true });
      return;
    }

    // If admin token exists but user is on user routes, allow them to proceed
    // Don't redirect - let user login flow work normally
    // Only redirect if they're trying to access protected routes without proper user authentication
    // Exception: If they're explicitly on login/register pages, allow them to proceed
    const isAuthRoute = location.pathname.startsWith('/auth/login') || 
                       location.pathname.startsWith('/auth/register') ||
                       location.pathname.startsWith('/auth/login-otp') ||
                       location.pathname.startsWith('/auth/verify-otp');
    
    if (adminToken && !userToken && !isAuthenticated && !isPublicRoute && !isAuthRoute) {
      // Only redirect if NOT on auth routes (login/register pages)
      // This allows users to login even if admin token exists
      console.log('🔒 MainLayout - Admin token but accessing protected user route, redirecting to user login');
      navigate("/auth/login", { replace: true });
      return;
    }
  }, [location.pathname, isAuthenticated, loading, navigate, isPublicRoute]);

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
      // Clear any other app state
      localStorage.clear();
      navigate("/auth/login", { replace: true });
      return;
    }
    navigate("/auth/login");
  };

  const authButtonLabel = isAuthenticated ? "Logout" : "Login";

  const isExplorePage = location.pathname === "/explore";
  const isChatPage = location.pathname === "/chat";
  const isHoldingsPage = location.pathname === "/holdings";
  const isDashboardPage = location.pathname === "/dashboard";
  const isWalletPage = location.pathname === "/wallet";
  
  // Show wallet balance box only on Dashboard and Wallet pages
  const shouldShowWalletBalance = isDashboardPage || isWalletPage;

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render protected content if not authenticated (will redirect)
  const userToken = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  if (!isPublicRoute && !userToken && !adminToken && !isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (isMobile && (isPropertyDetailPage || isHoldingDetailPage || isProfilePage || isEditProfilePage || isExplorePage || isChatPage || isHoldingsPage)) {
    return (
      <div className="mobile-shell mobile-shell--plain">
        <main className="mobile-content mobile-content--plain">
          <Outlet />
        </main>
        {!isChatPage && (
          <nav className="mobile-bottom-nav" aria-label="Primary">
            {bottomNavLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className="mobile-bottom-nav__link">
                {({ isActive }) => (
                  <>
                    <Icon active={isActive} />
                    <span className="mobile-bottom-nav__label">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    );
  }

  if (isMobile) {
    const notificationCount = authUser?.notifications?.length ?? 0;

    return (
      <div className="mobile-shell">
        {!isPropertyDetailPage && !isHoldingDetailPage && !isEditProfilePage && !isExplorePage && !isChatPage && !isHoldingsPage && (
          <header className="mobile-header">
            <div className="mobile-header__row">
              <NavLink to="/dashboard" className="mobile-header__logo">
                <img src={logoImage} alt="DigitalAssets" className="mobile-header__logo-img" />
              </NavLink>
              <div className="mobile-header__welcome">
                <span className="mobile-header__welcome-label">Welcome</span>
                <span className="mobile-header__welcome-name">
                  {isAuthenticated && authUser ? authUser.name.split(" ")[0] : "Guest"}
                </span>
              </div>
              <button
                type="button"
                className="avatar-button"
                aria-label="User profile"
                onClick={() => navigate("/profile")}
              >
                <Avatar 
                  name={authUser?.name || "Guest"} 
                  avatarUrl={authUser?.avatarUrl} 
                  initials={authUser?.avatarInitials || "G"} 
                />
              </button>
            </div>
            {shouldShowWalletBalance && <WalletSummaryCard wallet={wallet} />}
          </header>
        )}
        <main className="mobile-content">
          <div className="mobile-scroll-area">
            <Outlet />
          </div>
        </main>
        <nav className="mobile-bottom-nav" aria-label="Primary">
          {bottomNavLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="mobile-bottom-nav__link">
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span className="mobile-bottom-nav__label">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <NavLink to="/dashboard" className="brand__link">
            <img src={logoImage} alt="DigitalAssets" className="brand__logo" />
          </NavLink>
        </div>
        <nav className="nav-links">
          {desktopNavLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className="nav-link">
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="app-header__profile">
          {isAuthenticated && authUser ? (
            <>
              <span className="app-header__welcome">Welcome back, {authUser.name}</span>
              <div className="app-header__avatar">
                <Avatar name={authUser.name} avatarUrl={authUser.avatarUrl} initials={authUser.avatarInitials} />
              </div>
            </>
          ) : (
            <span className="app-header__welcome">Welcome</span>
          )}
          <button type="button" className="app-header__auth-btn" onClick={handleAuthAction}>
            {authButtonLabel}
          </button>
        </div>
      </header>
      <main className="app-content">
        {shouldShowWalletBalance && <WalletSummaryCard wallet={wallet} />}
        <div className="app-content__page">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

