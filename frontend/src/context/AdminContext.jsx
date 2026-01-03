import React, { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { propertyAPI, uploadAPI, adminAPI } from '../services/api.js';
import logger from '../utils/logger.js';

// Dummy Users Data
const generateDummyUsers = () => {
  const names = [
    'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
    'Anjali Desai', 'Rahul Mehta', 'Kavita Joshi', 'Suresh Iyer', 'Meera Nair',
    'Arjun Kapoor', 'Divya Agarwal', 'Karan Malhotra', 'Neha Gupta', 'Rohan Verma',
    'Pooja Shah', 'Aditya Rao', 'Shruti Menon', 'Nikhil Tiwari', 'Anita Das'
  ];
  
  const emails = names.map((name, idx) => 
    `${name.toLowerCase().replace(/\s+/g, '.')}${idx + 1}@example.com`
  );

  const accountStatuses = ['active', 'locked', 'suspended'];
  
  return names.map((name, index) => {
    const registrationDate = new Date(2024, 0, 1 + index * 5);
    const accountStatus = index % 10 === 0 ? 'locked' : index % 15 === 0 ? 'suspended' : 'active';
    
    // Generate wallet data
    const totalInvestments = Math.floor(Math.random() * 5000000) + 500000; // 5L to 50L
    const balance = Math.floor(Math.random() * 2000000) + 100000; // 1L to 20L
    const earningsReceived = Math.floor(totalInvestments * 0.015); // 1.5% of investments
    const withdrawableBalance = Math.floor(totalInvestments * 0.3); // 30% withdrawable
    
    // Generate investments (holdings)
    const numInvestments = Math.floor(Math.random() * 5) + 1; // 1 to 5 investments
    const investments = [];
    const propertyNames = [
      'Tech Park Alpha', 'Digital Mall Infinity', 'Co-working Hub Skyline',
      'Smart Office Complex', 'Cloud Infrastructure Hub', 'Data Center Nova'
    ];
    
    for (let i = 0; i < numInvestments; i++) {
      const amountInvested = Math.floor(Math.random() * 2000000) + 500000; // 5L to 25L
      const purchaseDate = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
      const maturityDate = new Date(purchaseDate);
      maturityDate.setMonth(maturityDate.getMonth() + 3);
      const isMatured = maturityDate < new Date();
      
      investments.push({
        id: `inv-${index}-${i}`,
        propertyId: `listing-${i + 1}`,
        propertyName: propertyNames[i % propertyNames.length],
        amountInvested,
        purchaseDate: purchaseDate.toISOString().split('T')[0],
        maturityDate: maturityDate.toISOString().split('T')[0],
        status: isMatured ? 'matured' : 'lock-in',
        monthlyEarning: Math.floor(amountInvested * 0.005), // 0.5%
        totalEarningsReceived: isMatured ? Math.floor(amountInvested * 0.015) : Math.floor(amountInvested * 0.005),
        daysRemaining: isMatured ? 0 : Math.ceil((maturityDate - new Date()) / (1000 * 60 * 60 * 24)),
        lockInMonths: 3,
        canWithdrawInvestment: isMatured,
        canWithdrawEarnings: false,
      });
    }
    
    // Generate bank details
    const bankDetails = {
      accountHolderName: name,
      accountNumber: `${String(index + 1000000000).slice(0, 12)}`,
      ifscCode: `HDFC${String(index + 10000).slice(-6)}`,
    };
    
    // Generate transaction history
    const transactions = [];
    investments.forEach((inv, invIdx) => {
      transactions.push({
        id: `txn-${index}-${invIdx}-1`,
        date: inv.purchaseDate,
        type: 'investment',
        amount: inv.amountInvested,
        description: `Investment in ${inv.propertyName}`,
        status: 'completed',
      });
      
      if (inv.totalEarningsReceived > 0) {
        transactions.push({
          id: `txn-${index}-${invIdx}-2`,
          date: new Date(inv.purchaseDate).toISOString().split('T')[0],
          type: 'earning',
          amount: inv.monthlyEarning,
          description: `Monthly earning from ${inv.propertyName}`,
          status: 'completed',
        });
      }
    });
    
    return {
      id: `user-${index + 1}`,
      name,
      email: emails[index],
      phone: `+91 ${String(9000000000 + index).slice(0, 10)}`,
      registrationDate: registrationDate.toISOString().split('T')[0],
      accountStatus,
      wallet: {
        balance,
        totalInvestments,
        earningsReceived,
        withdrawableBalance,
        lockedAmount: totalInvestments - withdrawableBalance,
        monthlyEarnings: Math.floor(totalInvestments * 0.005),
      },
      investments,
      bankDetails,
      transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
    };
  });
};

// Properties will be fetched from API

// Dummy Withdrawals Data
const generateDummyWithdrawals = (users) => {
  const withdrawals = [];
  const statuses = ['pending', 'processing', 'completed', 'rejected'];
  
  // Generate withdrawals for some users
  users.slice(0, 15).forEach((user, index) => {
    const numWithdrawals = Math.floor(Math.random() * 3) + 1; // 1 to 3 withdrawals per user
    
    for (let i = 0; i < numWithdrawals; i++) {
      const requestDate = new Date();
      requestDate.setDate(requestDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      let processedDate = null;
      if (status === 'completed' || status === 'rejected') {
        processedDate = new Date(requestDate);
        processedDate.setDate(processedDate.getDate() + Math.floor(Math.random() * 5) + 1);
      }
      
      const amount = Math.floor(Math.random() * 500000) + 10000; // ₹10K to ₹5L
      
      withdrawals.push({
        id: `withdrawal-${index}-${i}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        amount,
        bankDetails: user.bankDetails,
        requestDate: requestDate.toISOString().split('T')[0],
        processedDate: processedDate ? processedDate.toISOString().split('T')[0] : null,
        status,
        rejectionReason: status === 'rejected' ? 'Bank account details mismatch' : null,
        transactionId: status === 'completed' ? `TXN${Date.now()}${Math.floor(Math.random() * 1000)}` : null,
      });
    }
  });
  
  return withdrawals.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
};

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  
  // Loading and error states
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [withdrawalsError, setWithdrawalsError] = useState(null);

  // Track ongoing requests to prevent duplicates
  const fetchUsersAbortController = useRef(null);
  const isFetchingUsersRef = useRef(false);

  // Fetch users from API
  const fetchUsers = useCallback(async (params = {}) => {
    logger.log('🔄 AdminContext - fetchUsers called:', {
      params,
      timestamp: new Date().toISOString(),
      isAlreadyFetching: isFetchingUsersRef.current
    });
    
    // Cancel any ongoing request
    if (fetchUsersAbortController.current) {
      logger.warn('⚠️ AdminContext - Canceling previous users fetch request');
      fetchUsersAbortController.current.abort();
    }

    // Prevent duplicate requests
    if (isFetchingUsersRef.current) {
      logger.log('⏸️ AdminContext - Users request already in progress, skipping');
      return {
        success: false,
        message: 'Request already in progress',
        data: [],
        total: 0,
        page: 1,
        pages: 1,
        count: 0,
      };
    }

    try {
      isFetchingUsersRef.current = true;
      setUsersLoading(true);
      setUsersError(null);
      
      logger.log('📡 AdminContext - Calling adminAPI.getUsers()');
      
      // Create new abort controller for this request
      fetchUsersAbortController.current = new AbortController();
      
      const response = await adminAPI.getUsers(params);
      logger.log('📥 AdminContext - Users API response:', {
        success: response?.success,
        count: response?.count || response?.data?.length || 0,
        total: response?.total,
        hasData: !!response?.data,
        dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        const usersData = response.data || [];
        // Format users to match frontend structure
        const formattedUsers = usersData.map(user => ({
          id: user._id || user.id,
          _id: user._id || user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          registrationDate: user.createdAt || user.registrationDate,
          accountStatus: user.accountStatus || 'active', // Default to active if not set
          wallet: {
            balance: user.wallet?.balance || 0,
            totalInvestments: user.wallet?.totalInvestments || 0,
            earningsReceived: user.wallet?.earningsReceived || 0,
            withdrawableBalance: user.wallet?.withdrawableBalance || 0,
            lockedAmount: user.wallet?.lockedAmount || 0,
            monthlyEarnings: user.wallet?.monthlyEarnings || 0,
          },
          bankDetails: user.bankDetails || null,
          investments: user.investments || [],
          transactions: user.transactions || [],
          role: user.role || 'investor',
          kycStatus: user.kycStatus || 'pending',
          kycDocuments: user.kycDocuments || null,
          kycSubmittedAt: user.kycSubmittedAt || null,
          kycRejectionReason: user.kycRejectionReason || null,
        }));
        
        logger.log('✅ AdminContext - Users fetched successfully:', {
          count: formattedUsers.length,
          total: response.total,
          page: response.page,
          pages: response.pages,
          userIds: formattedUsers.slice(0, 5).map(u => u.id),
          statuses: formattedUsers.reduce((acc, u) => {
            acc[u.accountStatus] = (acc[u.accountStatus] || 0) + 1;
            return acc;
          }, {})
        });
        setUsers(formattedUsers);
        
        // Return response with pagination info
        return {
          success: true,
          data: formattedUsers,
          total: response.total,
          page: response.page,
          pages: response.pages,
          count: formattedUsers.length,
        };
      } else {
        logger.error('❌ AdminContext - Users API returned error:', {
          message: response.message,
          response: response
        });
        setUsersError(response.message || 'Failed to fetch users');
        setUsers([]);
        return {
          success: false,
          message: response.message || 'Failed to fetch users',
          data: [],
          total: 0,
          page: 1,
          pages: 1,
          count: 0,
        };
      }
    } catch (error) {
      // Don't log error if request was aborted
      if (error.name !== 'AbortError') {
        logger.error('❌ AdminContext - Failed to fetch users:', {
          error: error.message,
          stack: error.stack,
          name: error.name,
          fullError: error
        });
        setUsersError(error.message || 'Failed to fetch users');
        setUsers([]);
        return {
          success: false,
          message: error.message || 'Failed to fetch users',
          data: [],
          total: 0,
          page: 1,
          pages: 1,
          count: 0,
        };
      } else {
        logger.log('ℹ️ AdminContext - Users request was aborted');
        return {
          success: false,
          message: 'Request aborted',
          data: [],
          total: 0,
          page: 1,
          pages: 1,
          count: 0,
        };
      }
    } finally {
      isFetchingUsersRef.current = false;
      setUsersLoading(false);
      fetchUsersAbortController.current = null;
      logger.log('🏁 AdminContext - fetchUsers completed');
    }
  }, []); // Empty dependency array - function doesn't depend on any state

  // Refresh users list
  const refreshUsers = () => {
    return fetchUsers();
  };

  // Update user function
  const updateUser = (userId, updates) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        (user.id === userId || user._id === userId) ? { ...user, ...updates } : user
      )
    );
  };

  // Lock/Unlock user account
  const toggleUserAccountStatus = async (userId, action) => {
    const user = users.find(u => u.id === userId || u._id === userId);
    if (!user) {
      logger.error('❌ AdminContext - User not found:', userId);
      throw new Error('User not found');
    }

    // Handle delete action separately
    if (action === 'delete') {
      logger.log('🗑️ AdminContext - deleteUser called:', {
        userId,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      try {
        const id = user._id || user.id;
        logger.log('📡 AdminContext - Calling adminAPI.deleteUser()');
        const response = await adminAPI.deleteUser(id);
        logger.log('📥 AdminContext - Delete user API response:', {
          success: response?.success,
          message: response?.message,
          timestamp: new Date().toISOString()
        });
        
        if (response.success) {
          // Remove user from local state
          setUsers(prevUsers => 
            prevUsers.filter(u => (u.id !== userId && u._id !== userId))
          );
          
          // Clear selected user if it's the deleted user
          if (selectedUser && (selectedUser.id === userId || selectedUser._id === userId)) {
            setSelectedUser(null);
          }
          
          logger.log('✅ AdminContext - User deleted successfully');
        } else {
          logger.error('❌ AdminContext - Failed to delete user:', {
            message: response.message
          });
          throw new Error(response.message || 'Failed to delete user');
        }
      } catch (error) {
        logger.error('❌ AdminContext - Error deleting user:', {
          error: error.message,
          stack: error.stack,
          name: error.name
        });
        throw error;
      }
      return;
    }

    // Handle status updates (lock, unlock, suspend)
    let newStatus = 'active';
    if (action === 'lock') newStatus = 'locked';
    else if (action === 'unlock') newStatus = 'active';
    else if (action === 'suspend') newStatus = 'suspended';

        logger.log('🔒 AdminContext - toggleUserAccountStatus called:', {
      userId,
      action,
      currentStatus: user.accountStatus,
      newStatus,
      timestamp: new Date().toISOString()
    });

    try {
      const id = user._id || user.id;
      logger.log('📡 AdminContext - Calling adminAPI.updateUserStatus()');
      const response = await adminAPI.updateUserStatus(id, newStatus);
      logger.log('📥 AdminContext - Update user status API response:', {
        success: response?.success,
        message: response?.message,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(u => {
            if (u.id === userId || u._id === userId) {
              return { ...u, accountStatus: newStatus };
            }
            return u;
          })
        );
        logger.log('✅ AdminContext - User status updated successfully');
      } else {
        logger.error('❌ AdminContext - Failed to update user status:', {
          message: response.message
        });
        throw new Error(response.message || 'Failed to update user status');
      }
    } catch (error) {
      logger.error('❌ AdminContext - Error updating user status:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  };

  // Credit/Debit wallet
  const updateWallet = async (userId, type, amount, reason) => {
    const user = users.find(u => u.id === userId || u._id === userId);
    if (!user) {
      logger.error('❌ AdminContext - User not found:', userId);
      throw new Error('User not found');
    }

        logger.log('💰 AdminContext - updateWallet called:', {
      userId,
      type,
            amount,
      reason,
      currentBalance: user.wallet?.balance || 0,
      timestamp: new Date().toISOString()
    });

    try {
      const id = user._id || user.id;
      
      let response;
      if (type === 'credit') {
        logger.log('📡 AdminContext - Calling adminAPI.creditWallet()');
        response = await adminAPI.creditWallet(id, amount, reason);
      } else {
        logger.log('📡 AdminContext - Calling adminAPI.debitWallet()');
        response = await adminAPI.debitWallet(id, amount, reason);
      }
      
      logger.log('📥 AdminContext - Wallet update API response:', {
        success: response?.success,
        newBalance: response?.data?.balance,
        message: response?.message,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(u => {
            if (u.id === userId || u._id === userId) {
          return {
                ...u,
                wallet: {
                  ...u.wallet,
                  balance: response.data.balance || (type === 'credit' ? u.wallet.balance + amount : u.wallet.balance - amount)
                }
              };
            }
            return u;
          })
        );
        logger.log('✅ AdminContext - Wallet updated successfully');
        
        // Refresh user detail if selected
        if (selectedUser && (selectedUser.id === userId || selectedUser._id === userId)) {
          await fetchUserDetail(id);
        }
      } else {
        logger.error('❌ AdminContext - Failed to update wallet:', {
          message: response.message
        });
        throw new Error(response.message || 'Failed to update wallet');
      }
    } catch (error) {
      logger.error('❌ AdminContext - Error updating wallet:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  };

  // Fetch user detail with holdings and transactions
  const fetchUserDetail = async (userId) => {
        logger.log('👤 AdminContext - fetchUserDetail called:', {
      userId,
      timestamp: new Date().toISOString()
    });

    try {
      const id = userId._id || userId.id || userId;
      logger.log('📡 AdminContext - Calling adminAPI.getUserDetail()');
      const response = await adminAPI.getUserDetail(id);
      logger.log('📥 AdminContext - User detail API response:', {
        success: response?.success,
        hasUser: !!response?.data?.user,
        hasHoldings: !!response?.data?.holdings,
        hasTransactions: !!response?.data?.transactions,
        timestamp: new Date().toISOString()
      });
      
      if (response.success && response.data) {
        const { user, holdings, transactions } = response.data;
        
        // Format user data
        const formattedUser = {
          id: user._id || user.id,
          _id: user._id || user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          registrationDate: user.createdAt || user.registrationDate,
          accountStatus: user.accountStatus || 'active',
          wallet: {
            balance: user.wallet?.balance || 0,
            totalInvestments: user.wallet?.totalInvestments || 0,
            earningsReceived: user.wallet?.earningsReceived || 0,
            withdrawableBalance: user.wallet?.withdrawableBalance || 0,
            lockedAmount: user.wallet?.lockedAmount || 0,
            monthlyEarnings: user.wallet?.monthlyEarnings || 0,
          },
          kycStatus: user.kycStatus || 'pending',
          kycDocuments: user.kycDocuments || null,
          kycSubmittedAt: user.kycSubmittedAt || null,
          kycRejectionReason: user.kycRejectionReason || null,
          bankDetails: user.bankDetails || null,
          investments: holdings?.map(h => ({
            id: h._id || h.id,
            propertyId: h.propertyId?._id || h.propertyId?.id || h.propertyId,
            propertyName: h.propertyId?.title || 'Unknown Property',
            amountInvested: h.amountInvested || 0,
            purchaseDate: h.createdAt || h.purchaseDate,
            maturityDate: h.maturityDate,
            status: h.status || 'lock-in',
            monthlyEarning: h.monthlyEarning || 0,
            totalEarningsReceived: h.totalEarningsReceived || 0,
            daysRemaining: h.daysRemaining || 0,
          })) || [],
          transactions: transactions?.map(t => ({
            id: t._id || t.id,
            date: t.createdAt || t.date,
            type: t.type,
            amount: t.amount,
            description: t.description,
            status: t.status || 'completed',
          })) || [],
          role: user.role || 'investor',
        };
        
        logger.log('✅ AdminContext - User detail fetched successfully:', {
          userId: formattedUser.id,
          investmentsCount: formattedUser.investments.length,
          transactionsCount: formattedUser.transactions.length
        });
        
        // Update user in list
        setUsers(prevUsers => 
          prevUsers.map(u => 
            (u.id === formattedUser.id || u._id === formattedUser.id) ? formattedUser : u
          )
        );
        
        // Update selected user
        setSelectedUser(formattedUser);
        
        return formattedUser;
      } else {
        logger.error('❌ AdminContext - Failed to fetch user detail:', {
          message: response.message
        });
        throw new Error(response.message || 'Failed to fetch user detail');
      }
    } catch (error) {
      logger.error('❌ AdminContext - Error fetching user detail:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  };

  // Track ongoing requests to prevent duplicates
  const fetchPropertiesAbortController = useRef(null);
  const isFetchingRef = useRef(false);

  // Fetch properties from API
  const fetchProperties = async () => {
        logger.log('🔄 AdminContext - fetchProperties called:', {
      timestamp: new Date().toISOString(),
      isAlreadyFetching: isFetchingRef.current
    });
    
    // Cancel any ongoing request
    if (fetchPropertiesAbortController.current) {
      logger.log('⚠️ AdminContext - Canceling previous fetch request');
      fetchPropertiesAbortController.current.abort();
    }

    // Prevent duplicate requests
    if (isFetchingRef.current) {
      logger.log('⏸️ AdminContext - Request already in progress, skipping');
      return;
    }

    try {
      isFetchingRef.current = true;
      setPropertiesLoading(true);
      setPropertiesError(null);
      
      logger.log('📡 AdminContext - Calling propertyAPI.getAll()');
      
      // Create new abort controller for this request
      fetchPropertiesAbortController.current = new AbortController();
      
      const response = await propertyAPI.getAll();
      logger.log('📥 AdminContext - Properties API response:', {
        success: response?.success,
        count: response?.count || response?.data?.length || 0,
        hasData: !!response?.data,
        dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        const properties = response.data || [];
        logger.log('✅ AdminContext - Properties fetched successfully:', {
          count: properties.length,
          propertyIds: properties.slice(0, 5).map(p => p._id || p.id),
          statuses: properties.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {})
        });
        setProperties(properties);
      } else {
        logger.error('❌ AdminContext - Properties API returned error:', {
          message: response.message,
          response: response
        });
        setPropertiesError(response.message || 'Failed to fetch properties');
        setProperties([]);
      }
    } catch (error) {
      // Don't log error if request was aborted
      if (error.name !== 'AbortError') {
        logger.error('❌ AdminContext - Failed to fetch properties:', {
          error: error.message,
          stack: error.stack,
          name: error.name,
          fullError: error
        });
        setPropertiesError(error.message || 'Failed to fetch properties');
        setProperties([]);
      } else {
        logger.log('ℹ️ AdminContext - Request was aborted');
      }
    } finally {
      isFetchingRef.current = false;
      setPropertiesLoading(false);
      fetchPropertiesAbortController.current = null;
      logger.log('🏁 AdminContext - fetchProperties completed');
    }
  };

  // Refresh properties list
  const refreshProperties = () => {
    return fetchProperties();
  };

  // Property Management Functions
  const addProperty = async (propertyData) => {
        logger.log('➕ AdminContext - addProperty called:', {
      propertyTitle: propertyData.title,
      propertyType: propertyData.propertyType,
      availableToInvest: propertyData.availableToInvest,
      hasImage: !!propertyData.image,
      imageType: propertyData.image instanceof File ? 'File' : typeof propertyData.image,
      documentCount: propertyData.documents?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Handle image upload if it's a File object
      let imageUrl = propertyData.image;
      if (propertyData.image && propertyData.image instanceof File) {
        logger.log('📤 AdminContext - Uploading image file:', {
          fileName: propertyData.image.name,
          fileSize: propertyData.image.size,
          fileType: propertyData.image.type
        });
        const uploadRes = await uploadAPI.uploadImage(propertyData.image);
        imageUrl = uploadRes.data?.url || uploadRes.url;
        logger.log('✅ AdminContext - Image uploaded successfully:', {
          imageUrl: imageUrl?.substring(0, 50) + '...'
        });
      } else if (propertyData.image) {
        logger.log('ℹ️ AdminContext - Using existing image URL');
      }

      // Handle document uploads
      const documentUrls = [];
      if (propertyData.documents && Array.isArray(propertyData.documents)) {
        logger.log('📤 AdminContext - Processing documents:', {
          count: propertyData.documents.length
        });
        for (const doc of propertyData.documents) {
          if (doc instanceof File) {
            logger.log('📤 AdminContext - Uploading document:', {
              fileName: doc.name,
              fileSize: doc.size
            });
            const docRes = await uploadAPI.uploadDocument(doc);
            const docUrl = docRes.data?.url || docRes.url;
            documentUrls.push(docUrl);
            logger.log('✅ AdminContext - Document uploaded:', {
              fileName: doc.name,
              url: docUrl?.substring(0, 50) + '...'
            });
          } else if (typeof doc === 'string') {
            documentUrls.push(doc);
            logger.log('ℹ️ AdminContext - Using existing document URL');
          } else if (doc.url) {
            documentUrls.push(doc.url);
            logger.log('ℹ️ AdminContext - Using existing document URL from object');
          }
        }
      }

      const propertyPayload = {
      ...propertyData,
        image: imageUrl,
        documents: documentUrls,
      };

      logger.log('📦 AdminContext - Final property payload for API:', {
        ...propertyPayload,
        description: propertyPayload.description?.substring(0, 50) + '...',
        image: propertyPayload.image ? (typeof propertyPayload.image === 'string' ? propertyPayload.image.substring(0, 50) + '...' : 'File object') : 'none',
        documents: propertyPayload.documents.length > 0 ? `${propertyPayload.documents.length} URL(s)` : 'none'
      });

      logger.log('📡 AdminContext - Calling propertyAPI.create()');
      const response = await propertyAPI.create(propertyPayload);
      logger.log('📥 AdminContext - Create property API response:', {
        success: response?.success,
        hasData: !!response?.data,
        propertyId: response?.data?._id || response?.data?.id,
        propertyTitle: response?.data?.title,
        message: response?.message,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        logger.log('✅ AdminContext - Property created successfully, refreshing list...');
        await fetchProperties(); // Refresh list
        logger.log('✅ AdminContext - Property list refreshed');
        return response.data;
      } else {
        logger.error('❌ AdminContext - Property creation failed:', {
          message: response.message,
          response: response
        });
        throw new Error(response.message || 'Failed to create property');
      }
    } catch (error) {
      logger.error('❌ AdminContext - Error creating property:', {
        error: error.message,
        stack: error.stack,
        name: error.name,
        status: error.status,
        response: error.response?.data,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      throw error;
    }
  };

  const updateProperty = async (propertyId, updates) => {
    const id = propertyId._id || propertyId.id || propertyId;
        logger.log('✏️ AdminContext - updateProperty called:', {
      propertyId: id,
      updates: {
        ...updates,
        description: updates.description?.substring(0, 50) + '...',
        hasImage: !!updates.image,
        imageType: updates.image instanceof File ? 'File' : typeof updates.image,
        documentCount: updates.documents?.length || 0
      },
      timestamp: new Date().toISOString()
    });
    
    try {
      // Handle image upload if it's a File object
      let imageUrl = updates.image;
      if (updates.image && updates.image instanceof File) {
        logger.log('📤 AdminContext - Uploading new image for update:', {
          fileName: updates.image.name,
          fileSize: updates.image.size
        });
        const uploadRes = await uploadAPI.uploadImage(updates.image);
        imageUrl = uploadRes.data?.url || uploadRes.url;
        logger.log('✅ AdminContext - Image uploaded for update');
      } else if (updates.image === null || updates.image === undefined) {
        logger.log('ℹ️ AdminContext - No image update provided');
        // Don't update image if not provided
        delete updates.image;
      }

      // Handle document uploads
      if (updates.documents && Array.isArray(updates.documents)) {
        logger.log('📤 AdminContext - Processing document updates:', {
          count: updates.documents.length
        });
        const documentUrls = [];
        for (const doc of updates.documents) {
          if (doc instanceof File) {
            const docRes = await uploadAPI.uploadDocument(doc);
            documentUrls.push(docRes.data?.url || docRes.url);
          } else if (typeof doc === 'string') {
            documentUrls.push(doc);
          } else if (doc.url) {
            documentUrls.push(doc.url);
          }
        }
        updates.documents = documentUrls;
      }

      const propertyPayload = {
        ...updates,
        ...(imageUrl !== undefined && { image: imageUrl }),
      };

      logger.log('📦 AdminContext - Final update payload:', {
        ...propertyPayload,
        description: propertyPayload.description?.substring(0, 50) + '...'
      });

      logger.log('📡 AdminContext - Calling propertyAPI.update()');
      const response = await propertyAPI.update(id, propertyPayload);
      logger.log('📥 AdminContext - Update property API response:', {
        success: response?.success,
        hasData: !!response?.data,
        propertyId: response?.data?._id || response?.data?.id,
        message: response?.message
      });
      
      if (response.success) {
        logger.log('✅ AdminContext - Property updated successfully, refreshing list...');
        await fetchProperties(); // Refresh list
        return response.data;
      } else {
        logger.error('❌ AdminContext - Property update failed:', {
          message: response.message
        });
        throw new Error(response.message || 'Failed to update property');
      }
    } catch (error) {
      logger.error('❌ AdminContext - Error updating property:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  };

  const deleteProperty = async (propertyId) => {
    try {
      const id = propertyId._id || propertyId.id || propertyId;
      const response = await propertyAPI.delete(id);
      if (response.success) {
        await fetchProperties(); // Refresh list
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete property');
      }
    } catch (error) {
      logger.error('Error deleting property:', error);
      throw error;
    }
  };

  const togglePropertyStatus = async (propertyId, newStatus) => {
    try {
      const id = propertyId._id || propertyId.id || propertyId;
      const response = await propertyAPI.updateStatus(id, newStatus);
      if (response.success) {
        await fetchProperties(); // Refresh list
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update property status');
      }
    } catch (error) {
      logger.error('Error updating property status:', error);
      throw error;
    }
  };

  // Don't fetch users on mount - let AdminUsers component handle it
  // This prevents duplicate requests when both AdminContext and AdminUsers try to fetch
  // Cleanup: abort any ongoing request on unmount
  useEffect(() => {
    return () => {
      if (fetchUsersAbortController.current) {
        fetchUsersAbortController.current.abort();
      }
    };
  }, []);

  // Track ongoing requests to prevent duplicates for withdrawals
  const fetchWithdrawalsAbortController = useRef(null);
  const isFetchingWithdrawalsRef = useRef(false);

  // Fetch withdrawals from API
  const fetchWithdrawals = useCallback(async (params = {}) => {
        logger.log('🔄 AdminContext - fetchWithdrawals called:', {
      params,
      timestamp: new Date().toISOString(),
      isAlreadyFetching: isFetchingWithdrawalsRef.current
    });
    
    // Cancel any ongoing request
    if (fetchWithdrawalsAbortController.current) {
      logger.log('⚠️ AdminContext - Canceling previous withdrawals fetch request');
      fetchWithdrawalsAbortController.current.abort();
    }

    // Prevent duplicate requests
    if (isFetchingWithdrawalsRef.current) {
      logger.log('⏸️ AdminContext - Withdrawals request already in progress, skipping');
      return {
        success: false,
        message: 'Request already in progress',
        data: [],
        total: 0,
        page: 1,
        pages: 1,
        count: 0,
      };
    }

    try {
      isFetchingWithdrawalsRef.current = true;
      setWithdrawalsLoading(true);
      setWithdrawalsError(null);
      
      logger.log('📡 AdminContext - Calling adminAPI.getWithdrawals()');
      
      // Create new abort controller for this request
      fetchWithdrawalsAbortController.current = new AbortController();
      
      const response = await adminAPI.getWithdrawals(params);
      logger.log('📥 AdminContext - Withdrawals API response:', {
        success: response?.success,
        count: response?.count || response?.data?.length || 0,
        total: response?.total,
        hasData: !!response?.data,
        dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        const withdrawalsData = response.data || [];
        // Format withdrawals to match frontend structure
        const formattedWithdrawals = withdrawalsData.map(withdrawal => {
          const userId = withdrawal.userId?._id || withdrawal.userId?.id || withdrawal.userId;
          const userName = withdrawal.userId?.name || 'Unknown User';
          const userEmail = withdrawal.userId?.email || 'N/A';
          
          // Map backend status to frontend status
          let status = withdrawal.status;
          if (status === 'approved') {
            status = 'completed'; // Frontend uses 'completed' instead of 'approved'
          } else if (status === 'processed') {
            status = 'completed'; // Map 'processed' to 'completed'
          }
          
          return {
            id: withdrawal._id || withdrawal.id,
            _id: withdrawal._id || withdrawal.id,
            userId: userId,
            userName: userName,
            userEmail: userEmail,
            amount: withdrawal.amount || 0,
            type: withdrawal.type || 'earnings',
            bankDetails: withdrawal.bankDetails || {
              accountHolderName: 'N/A',
              accountNumber: 'N/A',
              ifscCode: 'N/A',
              bankName: 'N/A',
            },
            status: status,
            requestDate: withdrawal.createdAt || withdrawal.requestDate,
            processedDate: withdrawal.processedAt || withdrawal.processedDate,
            rejectionReason: withdrawal.adminNotes || withdrawal.rejectionReason || null,
            adminNotes: withdrawal.adminNotes || null,
            processedBy: withdrawal.processedBy || null,
            transactionId: withdrawal.transactionId || null,
          };
        });
        
        logger.log('✅ AdminContext - Withdrawals fetched successfully:', {
          count: formattedWithdrawals.length,
          total: response.total,
          page: response.page,
          pages: response.pages,
          withdrawalIds: formattedWithdrawals.slice(0, 5).map(w => w.id),
          statuses: formattedWithdrawals.reduce((acc, w) => {
            acc[w.status] = (acc[w.status] || 0) + 1;
            return acc;
          }, {})
        });
        setWithdrawals(formattedWithdrawals);
        
        // Return response with pagination info
        return {
          success: true,
          data: formattedWithdrawals,
          total: response.total,
          page: response.page,
          pages: response.pages,
          count: formattedWithdrawals.length,
        };
      } else {
        logger.error('❌ AdminContext - Withdrawals API returned error:', {
          message: response.message,
          response: response
        });
        setWithdrawalsError(response.message || 'Failed to fetch withdrawals');
        setWithdrawals([]);
        return {
          success: false,
          message: response.message || 'Failed to fetch withdrawals',
          data: [],
          total: 0,
          page: 1,
          pages: 1,
          count: 0,
        };
      }
    } catch (error) {
      // Don't log error if request was aborted
      if (error.name !== 'AbortError') {
        logger.error('❌ AdminContext - Failed to fetch withdrawals:', {
          error: error.message,
          stack: error.stack,
          name: error.name,
          fullError: error
        });
        setWithdrawalsError(error.message || 'Failed to fetch withdrawals');
        setWithdrawals([]);
        return {
          success: false,
          message: error.message || 'Failed to fetch withdrawals',
          data: [],
          total: 0,
          page: 1,
          pages: 1,
          count: 0,
        };
      } else {
        logger.log('ℹ️ AdminContext - Withdrawals request was aborted');
        return {
          success: false,
          message: 'Request aborted',
          data: [],
          total: 0,
          page: 1,
          pages: 1,
          count: 0,
        };
      }
    } finally {
      isFetchingWithdrawalsRef.current = false;
      setWithdrawalsLoading(false);
      fetchWithdrawalsAbortController.current = null;
      logger.log('🏁 AdminContext - fetchWithdrawals completed');
    }
  }, []); // Empty dependency array - function doesn't depend on any state

  // Refresh withdrawals list
  const refreshWithdrawals = () => {
    return fetchWithdrawals();
  };

  // Withdrawal Management Functions
  const updateWithdrawalStatus = async (withdrawalId, newStatus, rejectionReason = null) => {
        logger.log('🔄 AdminContext - updateWithdrawalStatus called:', {
      withdrawalId,
      newStatus,
      hasRejectionReason: !!rejectionReason,
      timestamp: new Date().toISOString()
    });

    try {
      const withdrawal = withdrawals.find(w => w.id === withdrawalId || w._id === withdrawalId);
      if (!withdrawal) {
        logger.error('❌ AdminContext - Withdrawal not found:', withdrawalId);
        throw new Error('Withdrawal not found');
      }

      const id = withdrawal._id || withdrawal.id;
      let response;

      if (newStatus === 'completed' || newStatus === 'approved') {
        // Approve withdrawal
        logger.log('📡 AdminContext - Calling adminAPI.approveWithdrawal()');
        response = await adminAPI.approveWithdrawal(id, rejectionReason || null);
      } else if (newStatus === 'rejected') {
        // Reject withdrawal
        logger.log('📡 AdminContext - Calling adminAPI.rejectWithdrawal()');
        response = await adminAPI.rejectWithdrawal(id, rejectionReason || 'Rejected by admin');
      } else {
        // For other statuses, just update locally (processing, etc.)
    setWithdrawals(prevWithdrawals =>
          prevWithdrawals.map(w => {
            if (w.id === withdrawalId || w._id === withdrawalId) {
              return {
                ...w,
            status: newStatus,
            processedDate: newStatus === 'completed' || newStatus === 'rejected' 
                  ? new Date().toISOString() 
                  : w.processedDate,
                rejectionReason: rejectionReason || w.rejectionReason,
              };
            }
            return w;
          })
        );
        return;
      }

      logger.log('📥 AdminContext - Update withdrawal status API response:', {
        success: response?.success,
        message: response?.message,
        timestamp: new Date().toISOString()
      });

      if (response.success) {
        // Refresh withdrawals to get updated data
        await fetchWithdrawals();
        logger.log('✅ AdminContext - Withdrawal status updated successfully');
      } else {
        logger.error('❌ AdminContext - Failed to update withdrawal status:', {
          message: response.message
        });
        throw new Error(response.message || 'Failed to update withdrawal status');
      }
    } catch (error) {
      logger.error('❌ AdminContext - Error updating withdrawal status:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  };

  const bulkUpdateWithdrawals = async (withdrawalIds, newStatus, rejectionReason = null) => {
        logger.log('🔄 AdminContext - bulkUpdateWithdrawals called:', {
      withdrawalIds,
      newStatus,
      count: withdrawalIds.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Process each withdrawal sequentially to avoid overwhelming the API
      for (const withdrawalId of withdrawalIds) {
        await updateWithdrawalStatus(withdrawalId, newStatus, rejectionReason);
      }
      logger.log('✅ AdminContext - Bulk withdrawal update completed');
    } catch (error) {
      logger.error('❌ AdminContext - Error in bulk update:', {
        error: error.message
      });
      throw error;
    }
  };


  // Fetch properties on mount (only if we're actually on an admin route)
  useEffect(() => {
    // Only fetch if we're on an admin route
    const isAdminRoute = location.pathname.startsWith('/admin');
    if (isAdminRoute) {
      fetchProperties();
    }
    
    // Cleanup: abort any ongoing request on unmount
    return () => {
      if (fetchPropertiesAbortController.current) {
        fetchPropertiesAbortController.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Re-fetch when route changes

  // Note: Withdrawals are now fetched by the AdminWithdrawals component itself
  // This prevents duplicate fetches and infinite loops
  // The component handles fetching with proper filters and pagination
  // useEffect(() => {
  //   const isWithdrawalsPage = location.pathname === '/admin/withdrawals';
  //   if (isWithdrawalsPage) {
  //     fetchWithdrawals();
  //   }
  //   
  //   return () => {
  //     if (fetchWithdrawalsAbortController.current) {
  //       fetchWithdrawalsAbortController.current.abort();
  //     }
  //   };
  // }, [location.pathname, fetchWithdrawals]);

  const value = useMemo(
    () => ({
      users,
      usersLoading,
      usersError,
      selectedUser,
      setSelectedUser,
      updateUser,
      toggleUserAccountStatus,
      updateWallet,
      fetchUsers,
      refreshUsers,
      fetchUserDetail,
      properties,
      propertiesLoading,
      propertiesError,
      selectedProperty,
      setSelectedProperty,
      addProperty,
      updateProperty,
      deleteProperty,
      togglePropertyStatus,
      refreshProperties,
      fetchProperties,
      withdrawals,
      withdrawalsLoading,
      withdrawalsError,
      selectedWithdrawal,
      setSelectedWithdrawal,
      fetchWithdrawals,
      refreshWithdrawals,
      updateWithdrawalStatus,
      bulkUpdateWithdrawals,
    }),
    [users, usersLoading, usersError, selectedUser, properties, propertiesLoading, propertiesError, selectedProperty, withdrawals, withdrawalsLoading, withdrawalsError, selectedWithdrawal, fetchWithdrawals]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
