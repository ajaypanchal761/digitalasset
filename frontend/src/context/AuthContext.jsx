import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: 'demo-user-001',
  name: 'Demo Investor',
  email: 'demo@digitalassets.in',
  role: 'investor',
  kycStatus: 'pending',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const signIn = async (credentials) => {
    // TODO: Replace with API integration
    const { phoneOrEmail, otp } = credentials;
    
    // For now, accept any 6-digit OTP for demo purposes
    // In production, verify OTP with backend
    if (phoneOrEmail && otp && otp.length === 6) {
      setUser({
        ...DEFAULT_USER,
        email: phoneOrEmail.includes('@') ? phoneOrEmail : DEFAULT_USER.email,
      });
      return { success: true, user: DEFAULT_USER };
    }
    return { success: false, error: 'Invalid OTP. Please try again.' };
  };

  const signUp = async (payload) => {
    // TODO: Replace with API integration
    setUser({
      ...DEFAULT_USER,
      name: payload.fullName,
      email: payload.email,
    });
    return { success: true };
  };

  const signOut = () => setUser(null);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signOut,
    }),
    [user],
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

