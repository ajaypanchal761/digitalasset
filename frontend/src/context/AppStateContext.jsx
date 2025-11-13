import { createContext, useContext, useMemo, useState } from "react";

const defaultUser = {
  name: "Yunus Ahmed",
  avatarInitials: "YA",
  avatarUrl: "",
  notifications: [
    { id: "n-1", message: "KYC verification pending", type: "kyc" },
    { id: "n-2", message: "Welcome to DigitalAssets", type: "info" },
  ],
};

const defaultWallet = {
  currency: "INR",
  balance: 895890,
  totalInvestments: 568000,
  earningsReceived: 16800,
  withdrawableBalance: 235000,
};

const defaultHoldings = [
  {
    id: "holding-1",
    propertyId: "listing-1",
    name: "Tech Park Alpha",
    amountInvested: 500000,
    purchaseDate: "2024-01-15",
    maturityDate: "2024-04-15", // 3 months from purchase
    status: "lock-in", // "lock-in" | "matured"
    monthlyEarning: 2500, // 0.5% of amountInvested
    totalEarningsReceived: 5000,
    daysRemaining: 45,
    lockInMonths: 3,
    canWithdrawInvestment: false,
    canWithdrawEarnings: false,
  },
  {
    id: "holding-2",
    propertyId: "listing-2",
    name: "Digital Mall Infinity",
    amountInvested: 800000,
    purchaseDate: "2023-10-01",
    maturityDate: "2024-01-01", // Already matured
    status: "matured",
    monthlyEarning: 4000, // 0.5% of amountInvested
    totalEarningsReceived: 12000,
    daysRemaining: 0,
    lockInMonths: 3,
    canWithdrawInvestment: true,
    canWithdrawEarnings: false,
  },
];

const defaultListings = [
  {
    id: "listing-1",
    title: "Co-working Hub Skyline",
    description: "A premium co-working space in the heart of the city",
    minInvestment: 500000, // Minimum ₹5 lakh (fixed)
    lockInMonths: 3, // Fixed 3 months
    monthlyReturnRate: 0.5, // Fixed 0.5% per month
    deadline: "2025-12-30",
    availableToInvest: 3200000,
    totalInvested: 1000000,
    investorCount: 5,
  },
  {
    id: "listing-2",
    title: "Data Center Nova",
    description: "State-of-the-art data center facility",
    minInvestment: 500000, // Minimum ₹5 lakh (fixed)
    lockInMonths: 3, // Fixed 3 months
    monthlyReturnRate: 0.5, // Fixed 0.5% per month
    deadline: "2025-11-18",
    availableToInvest: 5400000,
    totalInvested: 1500000,
    investorCount: 8,
  },
  {
    id: "listing-3",
    title: "Tech Park Alpha",
    description: "Modern technology park with premium facilities",
    minInvestment: 500000,
    lockInMonths: 3,
    monthlyReturnRate: 0.5,
    deadline: "2026-01-15",
    availableToInvest: 4500000,
    totalInvested: 2000000,
    investorCount: 12,
  },
  {
    id: "listing-4",
    title: "Digital Mall Infinity",
    description: "Luxury digital shopping and entertainment complex",
    minInvestment: 500000,
    lockInMonths: 3,
    monthlyReturnRate: 0.5,
    deadline: "2025-10-20",
    availableToInvest: 2800000,
    totalInvested: 1800000,
    investorCount: 9,
  },
  {
    id: "listing-5",
    title: "Smart Office Complex",
    description: "AI-powered smart office building with green technology",
    minInvestment: 500000,
    lockInMonths: 3,
    monthlyReturnRate: 0.5,
    deadline: "2026-02-28",
    availableToInvest: 6000000,
    totalInvested: 1200000,
    investorCount: 6,
  },
  {
    id: "listing-6",
    title: "Cloud Infrastructure Hub",
    description: "Advanced cloud computing and storage facility",
    minInvestment: 500000,
    lockInMonths: 3,
    monthlyReturnRate: 0.5,
    deadline: "2025-09-10",
    availableToInvest: 3800000,
    totalInvested: 2200000,
    investorCount: 11,
  },
];

const AppStateContext = createContext(null);

export const AppStateProvider = ({ children }) => {
  const [user, setUser] = useState(defaultUser);
  const [wallet, setWallet] = useState(defaultWallet);
  const [holdings, setHoldings] = useState(defaultHoldings);
  const [listings, setListings] = useState(defaultListings);

  const value = useMemo(
    () => ({
      user,
      wallet,
      holdings,
      listings,
      updateUser: setUser,
      updateWallet: setWallet,
      setHoldings,
      setListings,
    }),
    [user, wallet, holdings, listings],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
};


