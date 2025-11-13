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
    const { email, password } = credentials;
    if (email === 'demo@digitalassets.in' && password === 'Demo@123') {
      setUser(DEFAULT_USER);
      return { success: true, user: DEFAULT_USER };
    }
    return { success: false, error: 'Invalid credentials' };
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

