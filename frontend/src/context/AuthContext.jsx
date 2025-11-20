import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { authAPI, adminAuthAPI } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Fetch user data from backend when token exists
  const fetchUser = useCallback(async () => {
    // Check for tokens
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');
    
    // Determine route type first - this is the key to fixing cross-tab issues
    const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/admin-auth');
    const isAuthRoute = location.pathname.startsWith('/auth/login') || 
                       location.pathname.startsWith('/auth/register') ||
                       location.pathname.startsWith('/auth/login-otp') ||
                       location.pathname.startsWith('/auth/verify-otp');
    
    // Select token based on route, not on token existence
    // This allows different tabs to have different logins
    // IMPORTANT: On auth routes (login/register), completely ignore admin token
    let token = null;
    
    if (isAdminRoute) {
      // On admin routes, use adminToken if available
      token = adminToken || null;
      if (token) {
        console.log('🔐 AuthContext.fetchUser - Using adminToken for admin route');
      }
    } else if (isAuthRoute) {
      // On auth routes (login/register), ONLY use userToken, completely ignore adminToken
      // This prevents admin token from interfering with user login flow
      token = userToken || null;
      if (token) {
        console.log('👤 AuthContext.fetchUser - Using userToken for auth route (ignoring adminToken)');
      } else {
        console.log('👤 AuthContext.fetchUser - No userToken on auth route, skipping fetch (adminToken ignored)');
      }
    } else {
      // On regular routes, use userToken if available
      token = userToken || null;
      if (token) {
        console.log('👤 AuthContext.fetchUser - Using userToken for regular route');
      }
    }
    
    console.log('🔄 AuthContext.fetchUser - Called:', {
      pathname: location.pathname,
      hasAdminToken: !!adminToken,
      hasUserToken: !!userToken,
      isAdminRoute,
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? token.substring(0, 30) + '...' : 'null',
      tokenType: adminToken ? 'adminToken' : (userToken ? 'token' : 'none'),
      timestamp: new Date().toISOString()
    });
    
    // Only fetch if token exists
    if (!token) {
      console.log('⚠️ AuthContext.fetchUser - No token found, skipping fetch');
      setLoading(false);
      return;
    }


    try {
      let response;
      
      // Try admin API if on admin route, otherwise try regular user API
      if (isAdminRoute) {
        console.log('🔐 AuthContext.fetchUser - Using admin API');
        try {
          response = await adminAuthAPI.getMe();
          console.log('📥 AuthContext.fetchUser - Admin API response:', {
            success: response?.success,
            hasUser: !!response?.user,
            userRole: response?.user?.role,
            userEmail: response?.user?.email
          });
        } catch (adminError) {
          console.error('❌ AuthContext.fetchUser - Admin API error:', adminError);
          // If admin API fails, token might be invalid
          throw adminError;
        }
      } else {
        console.log('👤 AuthContext.fetchUser - Using user API');
        response = await authAPI.getMe();
      }

      if (response && response.success && response.user) {
        console.log('✅ AuthContext.fetchUser - User data received:', {
          userId: response.user.id || response.user._id,
          userName: response.user.name,
          userEmail: response.user.email,
          userRole: response.user.role
        });
        // Determine if this is an admin user
        // If we're on an admin route and got a response, it's definitely an admin
        // Also check if the response came from admin API (no wallet field indicates admin)
        // OR if the role is explicitly set to 'admin'
        const isAdmin = isAdminRoute || 
                       response.user.role === 'admin' || 
                       !response.user.wallet ||
                       (response.user.role && response.user.role.toLowerCase() === 'admin');
        
        // Format user data for frontend
        const formattedUser = {
          id: response.user.id || response.user._id,
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone,
          role: isAdmin ? 'admin' : (response.user.role || 'investor'),
          wallet: response.user.wallet,
          kycStatus: response.user.kycStatus,
          // Generate avatar initials
          avatarInitials: response.user.name
            ? response.user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            : 'U',
          avatarUrl: response.user.avatarUrl || '',
        };
        setUser(formattedUser);
        setLoading(false);
      } else {
        // Only clear token if we're NOT on an admin route
        if (!isAdminRoute) {
          localStorage.removeItem('token');
        }
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      const errorMsg = error.message || '';
      
      // For admin routes, NEVER clear the token
      if ((errorMsg.includes('401') || errorMsg.includes('Unauthorized')) && !errorMsg.includes('Network')) {
        if (!isAdminRoute) {
          localStorage.removeItem('token');
        }
      } else if (!isAdminRoute && !errorMsg.includes('Network')) {
        localStorage.removeItem('token');
      }
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [location.pathname]);

  // Refresh user function that can be called manually
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

    // Fetch user on mount and when route changes
  useEffect(() => {
    fetchUser();

    // Listen for storage changes (when token is set in another tab)
    // Only react to changes for the token relevant to the current route
    const handleStorageChange = (e) => {
      const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/admin-auth');
      
      // Only react if the changed token is relevant to current route
      if (isAdminRoute && e.key === 'adminToken') {
        // Admin route - only react to adminToken changes
        if (e.newValue) {
          fetchUser();
        } else {
          setUser(null);
        }
      } else if (!isAdminRoute && e.key === 'token') {
        // Regular route - only react to user token changes
        if (e.newValue) {
          fetchUser();
        } else {
          setUser(null);
        }
      }
      // Ignore changes to the other token type to prevent cross-tab interference
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchUser, location.pathname]); // Re-fetch when route changes

  const signIn = async (credentials) => {
    // This is kept for backward compatibility but login should use authAPI directly
    // The actual login is handled in LoginOtp.jsx using authAPI.loginWithOTP
    // After successful login, fetchUser will be called
    try {
      await fetchUser();
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (payload) => {
    // This is kept for backward compatibility but registration should use authAPI directly
    // After successful registration, fetchUser will be called
    try {
      await fetchUser();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = () => {
    // Clear token using API service
    authAPI.logout();
    // Clear user state
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      signIn,
      signUp,
      signOut,
      refreshUser,
    }),
    [user, loading, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

