import React, { createContext, useContext, useMemo, useState, useEffect, useRef } from "react";
import { propertyAPI, holdingAPI, walletAPI } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";
import { useLocation } from "react-router-dom";
import logger from "../utils/logger.js";

const AppStateContext = createContext(null);

export const AppStateProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // State with empty defaults (will be populated from API)
  const [wallet, setWallet] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [listings, setListings] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track ongoing requests to prevent duplicates
  const fetchDataAbortController = useRef(null);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Fetch data from API
  const fetchData = async () => {
    // Skip if we're on an admin route (AdminContext handles properties there)
    const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/admin-auth');
    if (isAdminRoute) {
      setLoading(false);
      return;
    }

    // Cancel any ongoing request
    if (fetchDataAbortController.current) {
      fetchDataAbortController.current.abort();
    }

    // Prevent duplicate requests (debounce: wait at least 1 second between requests)
    const now = Date.now();
    if (isFetchingRef.current || (now - lastFetchTimeRef.current < 1000)) {
      return;
    }

    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      setLoading(true);
      setError(null);

      // Create new abort controller for this request
      fetchDataAbortController.current = new AbortController();

      // Always fetch properties (public) - but skip if on admin route
      const propertiesRes = await propertyAPI.getAll().catch(err => {
        if (err.name !== 'AbortError') {
          logger.error('Failed to fetch properties:', err);
        }
        return { data: [], success: false };
      });

      // Update properties
      if (propertiesRes.success !== false) {
        setListings(propertiesRes.data || propertiesRes || []);
      } else {
        setListings([]);
      }

      // Only fetch holdings and wallet if authenticated
      if (isAuthenticated) {
        const [holdingsRes, walletRes] = await Promise.all([
          holdingAPI.getAll().catch(err => {
            logger.error('Failed to fetch holdings:', err);
            return { data: [], success: false };
          }),
          walletAPI.getBalance().catch(err => {
            logger.error('Failed to fetch wallet:', err);
            return null;
          }),
        ]);

        // Update holdings
        if (holdingsRes.success !== false) {
          setHoldings(holdingsRes.data || holdingsRes || []);
        } else {
          setHoldings([]);
        }

        // Update wallet
        if (walletRes) {
          const walletData = walletRes.data || walletRes;
          // Ensure wallet has required structure
          setWallet({
            currency: walletData.currency || "INR",
            balance: walletData.balance || walletData.wallet?.balance || 0,
            totalInvestments: walletData.totalInvestments || walletData.wallet?.totalInvestments || 0,
            earningsReceived: walletData.earningsReceived || walletData.wallet?.earningsReceived || 0,
            withdrawableBalance: walletData.withdrawableBalance || walletData.wallet?.withdrawableBalance || 0,
            lockedAmount: walletData.lockedAmount || walletData.wallet?.lockedAmount || 0,
          });
        } else {
          // Default wallet structure if API fails
          setWallet({
            currency: "INR",
            balance: 0,
            totalInvestments: 0,
            earningsReceived: 0,
            withdrawableBalance: 0,
            lockedAmount: 0,
          });
        }
      } else {
        // Not authenticated - clear holdings and wallet
        setHoldings([]);
        setWallet({
          currency: "INR",
          balance: 0,
          totalInvestments: 0,
          earningsReceived: 0,
          withdrawableBalance: 0,
          lockedAmount: 0,
        });
      }

    } catch (err) {
      // Don't log error if request was aborted
      if (err.name !== 'AbortError') {
        logger.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      fetchDataAbortController.current = null;
    }
  };

  // Fetch data on mount and when authentication changes (but not on admin routes)
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/admin-auth');
    if (!isAdminRoute) {
      fetchData();
    } else {
      setLoading(false);
    }

    // Cleanup: abort any ongoing request on unmount or route change
    return () => {
      if (fetchDataAbortController.current) {
        fetchDataAbortController.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, location.pathname]); // Re-fetch when auth or route changes

  // Refresh function to manually reload data
  const refreshData = () => {
    fetchData();
  };

  const value = useMemo(
    () => ({
      wallet,
      holdings,
      listings,
      loading,
      error,
      updateWallet: setWallet,
      setHoldings,
      setListings,
      refreshData,
    }),
    [wallet, holdings, listings, loading, error],
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


