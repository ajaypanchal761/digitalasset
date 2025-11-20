# Project Update Flow - Step-by-Step Roadmap

## Overview
This document outlines the sequential flow of updates needed to fully connect the frontend with the backend, following the pattern we used for Profile data integration.

---

## ✅ COMPLETED: Step 1 - User Profile Data

### What We Did:
- ✅ Connected `AuthContext` to fetch user data from `/api/auth/me`
- ✅ Updated `Profile.jsx` to display real user data
- ✅ Updated `EditProfile.jsx` to save changes to backend
- ✅ Updated header to show logged-in user's name
- ✅ Implemented logout functionality

### Files Updated:
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/pages/Profile/Profile.jsx`
- `frontend/src/pages/EditProfile/EditProfile.jsx`
- `frontend/src/layouts/MainLayout.jsx`
- `frontend/src/pages/Auth/LoginOtp.jsx`

---

## 🔄 STEP 2: Connect AppStateContext to Backend (NEXT PRIORITY)

### Why This is Next:
- AppStateContext currently uses hardcoded data for:
  - Properties/Listings (6 hardcoded properties)
  - Holdings/Investments (5 hardcoded holdings)
  - Wallet balance (hardcoded values)
- This affects ALL major pages: Dashboard, Explore, Holdings, Wallet

### What Needs to Be Done:

#### 2.1 Update AppStateContext.jsx
**File:** `frontend/src/context/AppStateContext.jsx`

**Changes:**
1. Import API services: `propertyAPI`, `holdingAPI`, `walletAPI`
2. Add `useEffect` to fetch data on mount
3. Add loading and error states
4. Fetch properties (public, no auth needed)
5. Fetch holdings (only if authenticated)
6. Fetch wallet (only if authenticated)
7. Add `refreshData()` function

**Code Pattern:**
```javascript
useEffect(() => {
  const fetchData = async () => {
    // Fetch properties (always)
    const propertiesRes = await propertyAPI.getAll();
    setListings(propertiesRes.data || []);
    
    // Fetch holdings & wallet (only if authenticated)
    if (isAuthenticated) {
      const [holdingsRes, walletRes] = await Promise.all([
        holdingAPI.getAll(),
        walletAPI.getBalance()
      ]);
      setHoldings(holdingsRes.data || []);
      setWallet(walletRes.data || walletRes);
    }
  };
  fetchData();
}, [isAuthenticated]);
```

#### 2.2 Update Components for Loading States
**Files to Update:**
- `frontend/src/pages/Dashboard/Dashboard.jsx`
- `frontend/src/pages/Explore/Explore.jsx`
- `frontend/src/pages/Holdings/Holdings.jsx`
- `frontend/src/pages/Wallet/Wallet.jsx`
- `frontend/src/components/AssetsSection.jsx`
- `frontend/src/components/ExplorePropertiesSection.jsx`

**Changes:**
- Check for `loading` state from AppStateContext
- Show loading spinner/skeleton while fetching
- Show empty state if no data
- Handle error states

### Expected Outcome:
- ✅ Properties load from database
- ✅ Holdings show real user investments
- ✅ Wallet shows real balance
- ✅ All pages display real data

### Estimated Time: 2-3 hours

---

## 🔄 STEP 3: Property Detail & Investment Flow

### Why This is Next:
- Users can view properties but can't invest yet
- Investment flow needs backend integration

### What Needs to Be Done:

#### 3.1 Update PropertyDetail.jsx
**File:** `frontend/src/pages/PropertyDetail/PropertyDetail.jsx`

**Changes:**
1. Fetch property by ID from backend
2. Handle loading/error states
3. Connect "Invest Now" button to investment flow

#### 3.2 Update Invest.jsx
**File:** `frontend/src/pages/Invest/Invest.jsx`

**Changes:**
1. Validate investment amount (min ₹5,00,000)
2. Check property availability
3. Create investment via `holdingAPI.create()`
4. Navigate to payment after validation

#### 3.3 Update Payment.jsx
**File:** `frontend/src/pages/Payment/Payment.jsx`

**Changes:**
1. Integrate with payment gateway (Razorpay/Paytm)
2. Create payment order via `paymentAPI.createOrder()`
3. Verify payment via `paymentAPI.verify()`
4. Create holding after successful payment
5. Update wallet balance

### Expected Outcome:
- ✅ Users can view property details from database
- ✅ Users can invest in properties
- ✅ Payment processing works
- ✅ Holdings created after payment

### Estimated Time: 4-5 hours

---

## 🔄 STEP 4: Wallet & Transactions

### Why This is Next:
- Wallet page shows hardcoded transactions
- Need real transaction history

### What Needs to Be Done:

#### 4.1 Update Wallet.jsx
**File:** `frontend/src/pages/Wallet/Wallet.jsx`

**Changes:**
1. Fetch real transactions from `walletAPI.getTransactions()`
2. Display transaction history
3. Show real wallet balance (already from AppStateContext)
4. Handle different transaction types:
   - Investment
   - Earnings
   - Withdrawal
   - Deposit

#### 4.2 Update WithdrawInfo.jsx
**File:** `frontend/src/pages/WithdrawInfo/WithdrawInfo.jsx`

**Changes:**
1. Create withdrawal request via `withdrawalAPI.create()`
2. Validate withdrawal amount
3. Check if investment is matured (3 months)
4. Submit bank details if needed

### Expected Outcome:
- ✅ Real transaction history displayed
- ✅ Users can request withdrawals
- ✅ Withdrawal validation works

### Estimated Time: 3-4 hours

---

## 🔄 STEP 5: Holdings Management

### Why This is Next:
- Holdings page shows data but actions don't work
- Need to handle withdrawals, earnings

### What Needs to Be Done:

#### 5.1 Update Holdings.jsx
**File:** `frontend/src/pages/Holdings/Holdings.jsx`

**Changes:**
1. Display real holdings (already from AppStateContext)
2. Calculate days remaining dynamically
3. Show withdrawal eligibility based on maturity

#### 5.2 Update HoldingDetail.jsx
**File:** `frontend/src/pages/HoldingDetail/HoldingDetail.jsx`

**Changes:**
1. Fetch holding details by ID
2. Show investment details
3. Enable withdrawal if matured
4. Show earnings history

### Expected Outcome:
- ✅ Holdings display correctly
- ✅ Users can view holding details
- ✅ Withdrawal eligibility shown

### Estimated Time: 2-3 hours

---

## 🔄 STEP 6: Admin Features

### Why This is Next:
- Admin panel exists but uses dummy data
- Need real admin functionality

### What Needs to Be Done:

#### 6.1 Update AdminContext.jsx
**File:** `frontend/src/context/AdminContext.jsx`

**Changes:**
1. Connect to `adminAPI` endpoints
2. Fetch real users, properties, withdrawals
3. Remove dummy data generation

#### 6.2 Update Admin Pages
**Files:**
- `frontend/src/pages/Admin/Dashboard/AdminDashboard.jsx`
- `frontend/src/pages/Admin/Users/AdminUsers.jsx`
- `frontend/src/pages/Admin/Properties/AdminProperties.jsx`
- `frontend/src/pages/Admin/Withdrawals/AdminWithdrawals.jsx`

**Changes:**
1. Fetch real data from backend
2. Implement CRUD operations
3. Handle approvals/rejections
4. Show real statistics

### Expected Outcome:
- ✅ Admin dashboard shows real stats
- ✅ Admin can manage users
- ✅ Admin can manage properties
- ✅ Admin can approve/reject withdrawals

### Estimated Time: 5-6 hours

---

## 🔄 STEP 7: Error Handling & UX Improvements

### Why This is Important:
- Better user experience
- Handle edge cases
- Professional feel

### What Needs to Be Done:

#### 7.1 Add Error Boundaries
**Files to Create:**
- `frontend/src/components/ErrorBoundary.jsx`

**Purpose:**
- Catch React errors
- Show user-friendly error messages
- Prevent app crashes

#### 7.2 Add Loading Skeletons
**Files to Update:**
- All pages that fetch data

**Purpose:**
- Better loading experience
- Show placeholders while loading

#### 7.3 Add Toast Notifications
**Files to Create:**
- `frontend/src/components/Toast.jsx`
- `frontend/src/context/ToastContext.jsx`

**Purpose:**
- Show success/error messages
- Better feedback for user actions

#### 7.4 Add Retry Logic
**Files to Update:**
- API service layer
- Context providers

**Purpose:**
- Retry failed API calls
- Handle network errors gracefully

### Expected Outcome:
- ✅ Better error handling
- ✅ Professional UX
- ✅ Graceful degradation

### Estimated Time: 4-5 hours

---

## 📊 Summary Table

| Step | Feature | Priority | Time | Status |
|------|---------|----------|------|--------|
| 1 | User Profile Data | ✅ Done | - | ✅ Complete |
| 2 | AppStateContext Connection | 🔴 Critical | 2-3h | ⏳ Next |
| 3 | Investment Flow | 🟡 High | 4-5h | ⏳ Pending |
| 4 | Wallet & Transactions | 🟡 High | 3-4h | ⏳ Pending |
| 5 | Holdings Management | 🟢 Medium | 2-3h | ⏳ Pending |
| 6 | Admin Features | 🟢 Medium | 5-6h | ⏳ Pending |
| 7 | Error Handling & UX | 🟢 Low | 4-5h | ⏳ Pending |

**Total Estimated Time:** 20-26 hours

---

## 🎯 Recommended Order of Execution

### Phase 1: Core Data (Steps 1-2) ✅
1. ✅ User Profile Data - **DONE**
2. ⏳ AppStateContext Connection - **NEXT**

### Phase 2: User Features (Steps 3-5)
3. Investment Flow
4. Wallet & Transactions
5. Holdings Management

### Phase 3: Admin & Polish (Steps 6-7)
6. Admin Features
7. Error Handling & UX

---

## 🚀 Quick Start: Step 2 Implementation

### Immediate Next Steps:

1. **Open:** `frontend/src/context/AppStateContext.jsx`

2. **Add imports:**
   ```javascript
   import { useEffect } from "react";
   import { propertyAPI, holdingAPI, walletAPI } from "../services/api.js";
   import { useAuth } from "./AuthContext.jsx";
   ```

3. **Add state for loading/error:**
   ```javascript
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   ```

4. **Add useEffect to fetch data:**
   - Fetch properties (always)
   - Fetch holdings & wallet (if authenticated)

5. **Update components to handle loading states**

6. **Test:**
   - Check Dashboard shows real properties
   - Check Holdings shows real investments (if any)
   - Check Wallet shows real balance

---

## 📝 Notes

- Each step builds on the previous one
- Test after each step before moving to next
- Some steps can be done in parallel (e.g., Steps 4 & 5)
- Focus on Step 2 first as it's the foundation

---

**Last Updated:** After Profile Data Integration
**Next Action:** Implement Step 2 - Connect AppStateContext to Backend





