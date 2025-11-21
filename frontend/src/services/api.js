// frontend/src/services/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get token from localStorage (for regular users)
const getToken = () => {
  return localStorage.getItem('token');
};

// Set token in localStorage (for regular users)
const setToken = (token) => {
  localStorage.setItem('token', token);
  localStorage.removeItem('tokenTimestamp');
};

// Remove token from localStorage (for regular users)
const removeToken = () => {
  localStorage.removeItem('token');
};

// Admin token management functions
// Cache token to avoid multiple localStorage reads
let cachedAdminToken = null;
let tokenCacheTime = 0;
const TOKEN_CACHE_DURATION = 1000; // Cache for 1 second

const getAdminToken = () => {
  // Use cached token if available and not expired
  const now = Date.now();
  if (cachedAdminToken !== null && (now - tokenCacheTime) < TOKEN_CACHE_DURATION) {
    return cachedAdminToken;
  }
  
  const token = localStorage.getItem('adminToken');
  
  
  // Update cache
  cachedAdminToken = token;
  tokenCacheTime = now;
  
  return token;
};

const setAdminToken = (token) => {
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      // Token validation - no logging needed
    }
    return;
  }
  
  localStorage.setItem('adminToken', token);
  
  // Update cache
  cachedAdminToken = token;
  tokenCacheTime = Date.now();
  
  if (process.env.NODE_ENV === 'development') {
    // Token saved - no logging needed
  }
};

const removeAdminToken = () => {
  localStorage.removeItem('adminToken');
  
  // Clear cache
  cachedAdminToken = null;
  tokenCacheTime = 0;
  
  if (process.env.NODE_ENV === 'development') {
    // Token removed - no logging needed
  }
};

// Base fetch function with error handling
const apiRequest = async (url, options = {}) => {
  // Check if this is an admin route
  // Property routes need admin token when creating/updating/deleting
  const isAdminRoute = url.startsWith('/admin-auth') || 
                       url.startsWith('/admin') ||
                       (url.startsWith('/properties') && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE' || options.method === 'PATCH'));
  
  // Get tokens once (cached, so multiple calls are efficient)
  const adminToken = getAdminToken();
  const userToken = getToken();
  const hasAdminToken = !!adminToken;
  
  const isPropertyAdminOp = url.startsWith('/properties') && 
                            (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE' || options.method === 'PATCH') &&
                            hasAdminToken;
  
  const token = (isAdminRoute || isPropertyAdminOp) ? adminToken : userToken;
  
  // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
  const isFormData = options.body instanceof FormData;
  
  const config = {
    ...options,
    headers: {
      // Only set Content-Type for JSON, not for FormData
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    let response;
    try {
      response = await fetch(`${API_URL}${url}`, config);
    } catch (fetchError) {
      // Network error - fetch failed completely
      // Network error handled by error handler
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    // Parse response as text first, then JSON
    let responseText = '';
    try {
      responseText = await response.text();
    } catch (textError) {
      // Safely extract message from textError
      let textErrorMessage = 'Failed to read response';
      try {
        if (textError && typeof textError === 'object' && 'message' in textError) {
          const msg = textError.message;
          if (typeof msg === 'string') {
            textErrorMessage = `Failed to read response: ${msg}`;
          }
        }
      } catch (e) {
        // Ignore extraction errors
      }
      throw new Error(textErrorMessage);
    }

    // Parse JSON from text
    let data = {};
    try {
      if (responseText) {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      // If not JSON, create error object from text
      data = { 
        success: false, 
        message: responseText || `Server error: ${response.status}` 
      };
    }

    if (!response.ok) {
      // Handle rate limiting (429) - don't retry automatically
      if (response.status === 429) {
        let errorMessage = 'Too many requests. Please wait a moment and try again.';
        
        try {
          if (data && typeof data === 'object' && data !== null && !Array.isArray(data)) {
            if (data.message && typeof data.message === 'string' && data.message.trim()) {
              errorMessage = data.message.trim();
            } else if (data.error && typeof data.error === 'string' && data.error.trim()) {
              errorMessage = data.error.trim();
            }
          }
        } catch (e) {
          // Use default message
        }
        
        // Log rate limit error (but don't spam)
        // Rate limit error - handled by error message
        
        throw new Error(errorMessage);
      }
      
      // If unauthorized, remove appropriate token and redirect
      if (response.status === 401) {
        if (isAdminRoute || isPropertyAdminOp) {
          removeAdminToken();
          window.location.href = '/admin-auth/login';
        } else {
          removeToken();
          window.location.href = '/auth/login';
        }
      }
      
      // Extract error message safely from response data
      // Response data is already parsed JSON, so it's safe
      let errorMessage = `Request failed with status ${response.status}`;
      
      try {
        // data is already a plain object from JSON.parse, so it's safe to access
        if (data && typeof data === 'object' && data !== null && !Array.isArray(data)) {
          // Try multiple possible error message fields
          if (data.message && typeof data.message === 'string' && data.message.trim()) {
            errorMessage = data.message.trim();
          } else if (data.error && typeof data.error === 'string' && data.error.trim()) {
            errorMessage = data.error.trim();
          } else if (data.msg && typeof data.msg === 'string' && data.msg.trim()) {
            errorMessage = data.msg.trim();
          }
        }
      } catch (e) {
        // If extraction fails, use default message
        // Error extraction failed - use default message
      }
      
      // Error logged via error message
      
      // Throw simple error with just message string
      // errorMessage is guaranteed to be a string at this point
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // If error was thrown from our code above, it already has the correct message
    // Just re-throw it - our Error instances are safe to access
    
    // Check if it's an Error instance we created (safe to access)
    if (error instanceof Error) {
      const msg = error.message;
      
      // Error handled via error message
      
      // Re-throw the error with its message
      throw error;
    }
    
    // If it's not an Error instance, create one
    throw new Error('An unexpected error occurred. Please try again.');
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

  // Calculate ROI for a property
  calculateROI: async (propertyId, investmentAmount) => {
    return apiRequest(`/properties/${propertyId}/calculate-roi`, {
      method: 'POST',
      body: JSON.stringify({ investmentAmount }),
    });
  },

  // Create property (Admin only)
  create: async (propertyData) => {
    console.log('📡 propertyAPI.create - Calling API:', {
      hasAdminToken: !!getAdminToken(),
      hasUserToken: !!getToken(),
      propertyTitle: propertyData?.title,
      propertyType: propertyData?.propertyType,
      timestamp: new Date().toISOString()
    });
    return apiRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  // Update property (Admin only)
  update: async (id, propertyData) => {
    console.log('📡 propertyAPI.update - Calling API:', {
      propertyId: id,
      hasAdminToken: !!getAdminToken(),
      hasUserToken: !!getToken(),
      timestamp: new Date().toISOString()
    });
    return apiRequest(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  },

  // Delete property (Admin only)
  delete: async (id) => {
    console.log('📡 propertyAPI.delete - Calling API:', {
      propertyId: id,
      hasAdminToken: !!getAdminToken(),
      hasUserToken: !!getToken(),
      timestamp: new Date().toISOString()
    });
    return apiRequest(`/properties/${id}`, {
      method: 'DELETE',
    });
  },

  // Update property status (Admin only)
  updateStatus: async (id, status) => {
    console.log('📡 propertyAPI.updateStatus - Calling API:', {
      propertyId: id,
      status,
      hasAdminToken: !!getAdminToken(),
      hasUserToken: !!getToken(),
      timestamp: new Date().toISOString()
    });
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

  // Get user payouts
  getPayouts: async () => {
    return apiRequest('/wallet/payouts');
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
  submitKYC: async (kycData) => {
    const formData = new FormData();
    
    // Append files
    if (kycData.panCard) formData.append('panCard', kycData.panCard);
    if (kycData.aadhaarCard) formData.append('aadhaarCard', kycData.aadhaarCard);
    if (kycData.photo) formData.append('photo', kycData.photo);
    if (kycData.addressProof) formData.append('addressProof', kycData.addressProof);
    
    // Append text fields
    if (kycData.panNumber) formData.append('panNumber', kycData.panNumber);
    if (kycData.aadhaarNumber) formData.append('aadhaarNumber', kycData.aadhaarNumber);
    
    // Get token for authorization
    const token = getToken();
    
    return apiRequest('/profile/kyc', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, browser will set it with boundary for FormData
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
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

// ==================== CHAT API ====================

export const chatAPI = {
  // Get user conversations
  getConversations: async () => {
    return apiRequest('/chat/conversations');
  },

  // Get chat messages (adminId is optional in body)
  getMessages: async () => {
    return apiRequest('/chat/messages');
  },

  // Send message to admin
  sendMessage: async (message, adminId) => {
    return apiRequest('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ message, adminId }),
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

  // Delete user account
  deleteUser: async (id) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'DELETE',
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

  // Get current admin
  getMe: async () => {
    return apiRequest('/admin-auth/me');
  },

  // Get admin chat conversations
  getChatConversations: async () => {
    return apiRequest('/admin/chat/conversations');
  },

  // Get chat messages with a user
  getChatMessages: async (userId) => {
    return apiRequest(`/admin/chat/messages/${userId}`);
  },

  // Send message to user
  sendChatMessage: async (userId, message) => {
    return apiRequest(`/admin/chat/messages/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Get all payouts
  getPayouts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/admin/payouts?${queryString}` : '/admin/payouts';
    return apiRequest(url);
  },

  // Process payouts
  processPayouts: async (payoutIds) => {
    return apiRequest('/admin/payouts/process', {
      method: 'POST',
      body: JSON.stringify({ payoutIds }),
    });
  },

  // Get payout history
  getPayoutHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/admin/payouts/history?${queryString}` : '/admin/payouts/history';
    return apiRequest(url);
  },
};

// ==================== UPLOAD API ====================

export const uploadAPI = {
  // Upload image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    // Use adminToken if available (for admin operations), otherwise use regular token
    const adminToken = getAdminToken();
    const userToken = getToken();
    const token = adminToken || userToken;
    
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

    // Use adminToken if available (for admin operations), otherwise use regular token
    const adminToken = getAdminToken();
    const userToken = getToken();
    const token = adminToken || userToken;
    
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

// ==================== ADMIN AUTH API ====================

export const adminAuthAPI = {
  // Send OTP for admin (for registration)
  sendOTP: async (data) => {
    return apiRequest('/admin-auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Register admin
  register: async (userData) => {
    const response = await apiRequest('/admin-auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.token) {
      setAdminToken(response.token);
    }
    
    return response;
  },

  // Login admin with password
  login: async (data) => {
    console.log('🔐 adminAuthAPI.login - Starting login request:', {
      email: data.email,
      hasPassword: !!data.password,
      timestamp: new Date().toISOString()
    });
    
    const response = await apiRequest('/admin-auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log('📥 adminAuthAPI.login - Response received:', {
      success: response?.success,
      hasToken: !!response?.token,
      hasUser: !!response?.user,
      message: response?.message,
      responseKeys: response ? Object.keys(response) : null,
      timestamp: new Date().toISOString()
    });
    
    // Check for token in response
    const token = response?.token || response?.data?.token || response?.accessToken;
    
    console.log('🔍 adminAuthAPI.login - Token extraction:', {
      hasResponse: !!response,
      responseSuccess: response?.success,
      hasToken: !!token,
      hasResponseToken: !!response?.token,
      hasDataToken: !!response?.data?.token,
      tokenLength: token?.length,
      tokenPreview: token ? token.substring(0, 50) + '...' : 'null'
    });
    
    if (response && response.success && token) {
      console.log('✅ adminAuthAPI.login - Valid response with token, saving to localStorage...');
      // Save admin token to localStorage with key 'adminToken'
      setAdminToken(token);
      
      // Verify token was saved
      const verifyToken = localStorage.getItem('adminToken');
      console.log('✅ adminAuthAPI.login - Token verification:', {
        saved: !!verifyToken,
        matches: verifyToken === token,
        length: verifyToken?.length
      });
    } else {
      console.warn('⚠️ adminAuthAPI.login - Response missing success or token:', {
        success: response?.success,
        hasToken: !!token,
        message: response?.message,
        error: response?.error
      });
    }
    
    return response;
  },

  // Login admin with OTP (kept for backward compatibility)
  loginWithOTP: async (data) => {
    const response = await apiRequest('/admin-auth/login-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.success && response.token) {
      setAdminToken(response.token);
    }
    
    return response;
  },

  // Get current admin user
  getMe: async () => {
    return apiRequest('/admin-auth/me');
  },

  // Update admin profile
  updateProfile: async (profileData) => {
    return apiRequest('/admin-auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Forgot password - request password reset
  forgotPassword: async (email) => {
    return apiRequest('/admin-auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password - set new password with token
  resetPassword: async (token, password) => {
    return apiRequest('/admin-auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  // Logout (remove admin token)
  logout: () => {
    removeAdminToken();
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
  adminAuth: adminAuthAPI,
  upload: uploadAPI,
};