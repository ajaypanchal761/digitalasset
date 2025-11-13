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
    name: "Tech Park Alpha",
    amountInvested: 250000,
    ownershipPercent: 3.5,
    purchaseDate: "2024-02-15",
    maturityDate: "2026-02-15",
    status: "active",
    returnRate: 11.2,
  },
  {
    id: "holding-2",
    name: "Digital Mall Infinity",
    amountInvested: 180000,
    ownershipPercent: 2.1,
    purchaseDate: "2023-12-08",
    maturityDate: "2025-12-08",
    status: "lock-in",
    returnRate: 9.4,
  },
];

const defaultListings = [
  {
    id: "listing-1",
    title: "Co-working Hub Skyline",
    totalValue: 12000000,
    availableToInvest: 3200000,
    lockInMonths: 18,
    returnRate: 10.5,
    minInvestment: 25000,
    deadline: "2025-12-30",
  },
  {
    id: "listing-2",
    title: "Data Center Nova",
    totalValue: 18500000,
    availableToInvest: 5400000,
    lockInMonths: 24,
    returnRate: 12.8,
    minInvestment: 50000,
    deadline: "2025-11-18",
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


