// frontend/src/services/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Set token in localStorage
const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem('token');
};

// Base fetch function with error handling
const apiRequest = async (url, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      // If unauthorized, remove token and redirect to login
      if (response.status === 401) {
        removeToken();
        window.location.href = '/auth/login';
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ==================== AUTHENTICATION API ====================

export const authAPI = {
  // Register user
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.token) {
      setToken(response.token);
    }
    
    return response;
  },

  // Send OTP
  sendOTP: async (data) => {
    return apiRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Verify OTP
  verifyOTP: async (data) => {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Login with OTP
  loginWithOTP: async (data) => {
    const response = await apiRequest('/auth/login-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.success && response.token) {
      setToken(response.token);
    }
    
    return response;
  },

  // Get current user
  getMe: async () => {
    return apiRequest('/auth/me');
  },

  // Forgot password
  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword: async (token, password) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  // Logout (remove token)
  logout: () => {
    removeToken();
  },
};

// ==================== PROPERTY API ====================

export const propertyAPI = {
  // Get all properties
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/properties?${queryString}` : '/properties';
    return apiRequest(url);
  },

  // Get property by ID
  getById: async (id) => {
    return apiRequest(`/properties/${id}`);
  },

  // Create property (Admin only)
  create: async (propertyData) => {
    return apiRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  // Update property (Admin only)
  update: async (id, propertyData) => {
    return apiRequest(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  },

  // Delete property (Admin only)
  delete: async (id) => {
    return apiRequest(`/properties/${id}`, {
      method: 'DELETE',
    });
  },

  // Update property status (Admin only)
  updateStatus: async (id, status) => {
    return apiRequest(`/properties/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ==================== HOLDING API ====================

export const holdingAPI = {
  // Get user holdings
  getAll: async () => {
    return apiRequest('/holdings');
  },

  // Get holding by ID
  getById: async (id) => {
    return apiRequest(`/holdings/${id}`);
  },

  // Create investment (holding)
  create: async (holdingData) => {
    return apiRequest('/holdings', {
      method: 'POST',
      body: JSON.stringify(holdingData),
    });
  },
};

// ==================== WALLET API ====================

export const walletAPI = {
  // Get wallet balance
  getBalance: async () => {
    return apiRequest('/wallet');
  },

  // Get transactions
  getTransactions: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/wallet/transactions?${queryString}` : '/wallet/transactions';
    return apiRequest(url);
  },
};

// ==================== PAYMENT API ====================

export const paymentAPI = {
  // Create payment order
  createOrder: async (orderData) => {
    return apiRequest('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Verify payment
  verify: async (paymentData) => {
    return apiRequest('/payment/verify', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
};

// ==================== WITHDRAWAL API ====================

export const withdrawalAPI = {
  // Create withdrawal request
  create: async (withdrawalData) => {
    return apiRequest('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(withdrawalData),
    });
  },

  // Get user withdrawals
  getAll: async () => {
    return apiRequest('/withdrawals');
  },

  // Get withdrawal by ID
  getById: async (id) => {
    return apiRequest(`/withdrawals/${id}`);
  },
};

// ==================== PROFILE API ====================

export const profileAPI = {
  // Get user profile
  get: async () => {
    return apiRequest('/profile');
  },

  // Update profile
  update: async (profileData) => {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Submit KYC documents
  submitKYC: async (documents) => {
    return apiRequest('/profile/kyc', {
      method: 'POST',
      body: JSON.stringify({ documents }),
    });
  },

  // Update bank details
  updateBankDetails: async (bankDetails) => {
    return apiRequest('/profile/bank-details', {
      method: 'PUT',
      body: JSON.stringify(bankDetails),
    });
  },
};

// ==================== ADMIN API ====================

export const adminAPI = {
  // Get dashboard stats
  getDashboardStats: async () => {
    return apiRequest('/admin/dashboard');
  },

  // Get all users
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/admin/users?${queryString}` : '/admin/users';
    return apiRequest(url);
  },

  // Get user detail
  getUserDetail: async (id) => {
    return apiRequest(`/admin/users/${id}`);
  },

  // Update user status
  updateUserStatus: async (id, status) => {
    return apiRequest(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Credit user wallet
  creditWallet: async (id, amount, reason) => {
    return apiRequest(`/admin/users/${id}/wallet/credit`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  },

  // Debit user wallet
  debitWallet: async (id, amount, reason) => {
    return apiRequest(`/admin/users/${id}/wallet/debit`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  },

  // Get all withdrawals
  getWithdrawals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/admin/withdrawals?${queryString}` : '/admin/withdrawals';
    return apiRequest(url);
  },

  // Approve withdrawal
  approveWithdrawal: async (id, adminNotes) => {
    return apiRequest(`/admin/withdrawals/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes }),
    });
  },

  // Reject withdrawal
  rejectWithdrawal: async (id, adminNotes) => {
    return apiRequest(`/admin/withdrawals/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes }),
    });
  },
};

// ==================== UPLOAD API ====================

export const uploadAPI = {
  // Upload image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = getToken();
    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/auth/login';
      }
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  },

  // Upload document
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);

    const token = getToken();
    const response = await fetch(`${API_URL}/upload/document`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/auth/login';
      }
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  },
};

// Export default API object
export default {
  auth: authAPI,
  property: propertyAPI,
  holding: holdingAPI,
  wallet: walletAPI,
  payment: paymentAPI,
  withdrawal: withdrawalAPI,
  profile: profileAPI,
  admin: adminAPI,
  upload: uploadAPI,
};