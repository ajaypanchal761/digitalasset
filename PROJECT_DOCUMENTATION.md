# Digital Assets Platform - Project Documentation

## Project Overview
Digital Assets platform ek investment platform hai jahan users digital properties mein invest kar sakte hain. Platform sirf digital properties par focus karta hai, koi physical products nahi.

---

## 1. User Wallet System

### Wallet Balance Components:
1. **Total Investment Amount** (Wallet Balance)
   - User ne jo total amount invest kiya hai sab properties mein
   - Example: ₹10,00,000 (3 properties mein invest kiya)

2. **Total Earnings** (Separate - Wallet se mix nahi hoga)
   - Har property se monthly 0.5% earning
   - Sab properties ki total monthly earnings
   - Example: ₹5,000/month (₹10,00,000 ka 0.5%)
   - **Important:** Yeh amount wallet balance mein add nahi hota, completely separate rakha jayega

3. **Withdrawable Amount**
   - Jo investments 3 months complete kar chuki hain
   - Only investment amount (earnings nahi)
   - Example: ₹5,00,000 (1 property matured, 3 months complete)

4. **Total Investments**
   - Abhi tak total kitna invest kiya (all properties combined)

### Data Structure:
```javascript
wallet: {
  currency: "INR",
  balance: 1000000,              // Total invested amount (wallet balance)
  totalInvestments: 1000000,     // Same as balance
  earningsReceived: 0,           // Total earnings received so far (separate)
  monthlyEarnings: 5000,         // Current monthly earnings (0.5% of total investment)
  withdrawableBalance: 0,        // Matured investments (after 3 months)
  lockedAmount: 1000000          // Amount in lock-in period (can't withdraw)
}
```

---

## 2. Property Investment Rules

### Minimum Investment:
- **₹5,00,000 (5 Lakh)** - Minimum amount required to invest in any property
- User 5 lakh se kam invest nahi kar sakta
- Maximum limit nahi hai (jitna chahe invest kar sakta hai, but minimum 5 lakh)

### Lock-in Period:
- **3 Months (Minimum)** - Mandatory lock-in period
- Investment ke baad 3 months tak user apna investment amount withdraw nahi kar sakta
- 3 months complete hone ke baad hi investment amount withdraw kar sakta hai

### Monthly Earnings:
- **0.5% per month** of invested amount
- Har mahine automatically credit hoga
- Earnings separate account/field mein store hongi
- **Important:** Earnings wallet balance mein add nahi hongi

### Example Calculation:
```
User invests: ₹10,00,000 in Property A
Monthly earning: ₹10,00,000 × 0.5% = ₹5,000/month

Month 1: Earnings = ₹5,000 (can withdraw)
Month 2: Earnings = ₹5,000 (can withdraw)
Month 3: Earnings = ₹5,000 (can withdraw)
After 3 months: Investment ₹10,00,000 can be withdrawn
```

### Earning Withdrawal Rules:
- Earnings har mahine withdraw kar sakte hain (3 months ka wait nahi)
- Earnings always available for withdrawal (separate from investment)
- Earnings wallet balance mein add nahi hoti

### Investment Withdrawal Rules:
- Investment amount withdraw karne ke liye 3 months wait karna hoga
- 3 months complete hone ke baad investment amount withdraw kar sakta hai
- Earnings separately withdraw kar sakta hai (monthly)

---

## 3. Data Structure Changes

### Property/Holding Data:
```javascript
{
  id: "holding-1",
  name: "Tech Park Alpha",
  amountInvested: 500000,          // Minimum 5 lakh
  purchaseDate: "2024-01-15",
  maturityDate: "2024-04-15",      // 3 months from purchase
  status: "active" | "lock-in" | "matured",
  monthlyEarning: 2500,            // 0.5% of amountInvested (₹500000 × 0.5% = ₹2500)
  totalEarningsReceived: 7500,     // Total earnings received so far
  lockInMonths: 3,
  canWithdraw: false,              // Can withdraw investment after 3 months
  canWithdrawEarnings: true        // Can withdraw earnings monthly
}
```

### Property Listing Data:
```javascript
{
  id: "listing-1",
  title: "Co-working Hub Skyline",
  minInvestment: 500000,           // Minimum 5 lakh (fixed for all)
  lockInMonths: 3,                 // Minimum 3 months (fixed)
  monthlyReturnRate: 0.5,          // 0.5% per month (fixed)
  returnRate: 0.5,                 // For display
  deadline: "2025-12-30",          // Deadline to invest
  availableToInvest: 3200000,      // How much can be invested (not fixed total value)
  totalInvested: 1000000,          // How much already invested
  // NO fixed total value - users can invest any amount (min 5 lakh)
}
```

---

## 4. Dashboard Components

### Current Holdings Section:
**Changes Needed:**
- ❌ Remove graph/chart (no trend line needed)
- ✅ Show: Property name, Amount invested, Monthly earning (0.5%), Status (Lock-in/Matured)
- ✅ Buttons: View Detail, Withdraw (only when matured - 3 months complete)
- ✅ Show lock-in status: "Locked - X days remaining" or "Matured"
- ✅ Show monthly earning amount for each property

**Card Display:**
```
Property Name
Amount Invested: ₹5,00,000
Monthly Earning: ₹2,500 (0.5%)
Status: Locked / Matured
Lock-in: 45 days remaining / Matured
[View Detail] [Withdraw - when matured]
```

### Explore Digital Properties Section:
**Changes Needed:**
- ❌ Remove graph/chart (no trend line needed)
- ❌ Remove fixed "Total Value" - properties don't have fixed value
- ✅ Show: Property name, Minimum Investment (₹5,00,000), Monthly Return (0.5%), Lock-in (3 months), Deadline
- ✅ "Available to Invest" - kitna aur invest ho sakta hai
- ✅ "Invest Now" button

**Card Display:**
```
Property Name
Minimum Investment: ₹5,00,000
Monthly Return: 0.5%
Lock-in Period: 3 months
Deadline: 30 Dec 2025
Available: ₹32,00,000
[Invest Now]
```

---

## 5. Wallet Summary Card Updates

**Current Display:**
- Wallet Balance (Total invested amount)
- Total Investments
- Earnings Received (Total earnings till now)
- Withdrawable Balance (Matured investments)

**Additional Fields (if needed):**
- Monthly Earnings (Current month's earning from all properties)
- Locked Amount (Amount in lock-in period)

---

## 6. Earnings System Logic

### How Earnings Work:
1. User invests ₹5,00,000 in Property A on Jan 1
2. Monthly earning starts: ₹5,00,000 × 0.5% = ₹2,500/month
3. Feb 1: User receives ₹2,500 (can withdraw immediately)
4. Mar 1: User receives ₹2,500 (can withdraw immediately)
5. Apr 1: User receives ₹2,500 (can withdraw immediately)
6. Apr 1 onwards: Investment amount (₹5,00,000) can be withdrawn (3 months complete)

### Earnings Storage:
- Earnings wallet balance mein add nahi hoti
- Separate `earningsReceived` field mein track hoti hain
- Monthly earnings automatically calculate hoti hain
- User har month earnings withdraw kar sakta hai

---

## 7. Investment Flow

### Step 1: Browse Properties (Explore Section)
- User properties dekhta hai
- Minimum investment ₹5,00,000 dikhta hai
- Monthly return 0.5% dikhta hai
- Lock-in period 3 months dikhta hai

### Step 2: Invest
- User minimum ₹5,00,000 se invest karta hai
- Investment amount wallet se deduct hota hai
- Lock-in period start hota hai (3 months)
- Monthly earnings calculation start hota hai (0.5% per month)

### Step 3: Monthly Earnings
- Har mahine 0.5% earning automatically credit hoti hai
- Earnings separate field mein store hoti hain
- User earnings withdraw kar sakta hai (3 months ka wait nahi)

### Step 4: Maturity (After 3 Months)
- 3 months complete hone ke baad investment amount withdraw kar sakta hai
- Earnings separately bhi withdraw kar sakta hai

---

## 8. UI Changes Required

### Current Holdings Cards:
- ❌ Remove return percentage with arrows
- ❌ Remove graph/trend line
- ✅ Show: Property name, Amount invested, Monthly earning, Status, Lock-in remaining
- ✅ Simple card design (no graph)

### Explore Properties Cards:
- ❌ Remove graph/trend line
- ❌ Remove "Total Value"
- ❌ Remove return percentage with arrows (if any)
- ✅ Show: Property name, Minimum Investment (₹5,00,000), Monthly Return (0.5%), Lock-in (3 months), Deadline, Available to Invest
- ✅ Simple card design

---

## 9. Features to Keep

### Existing Features (No Changes):
- ✅ Login/Signup
- ✅ KYC Verification
- ✅ Dashboard Structure
- ✅ Wallet Summary Card
- ✅ Navigation
- ✅ Responsive Design

---

## 10. Clarifications - Answers

1. **Multiple Investments in Same Property:**
   - ✅ **YES** - User ek hi property mein multiple baar invest kar sakta hai
   - Example: User Property A mein pehle ₹5 lakh invest karta hai, baad mein aur ₹10 lakh invest kar sakta hai

2. **Earnings Withdrawal:**
   - Earnings abhi direct/instant nahi denge
   - Manual processing hoga (admin approval required)

3. **Property Details Page:**
   - Suggested content (see section below)

4. **Investment Limits:**
   - ❌ Maximum investment limit nahi hai
   - User jitna chahe invest kar sakta hai (minimum ₹5 lakh)

5. **Earnings Display:**
   - ✅ Current Holdings mein **monthly earning** dikhana hai
   - Har property ki monthly earning amount show karega

6. **Status Indicators:**
   - ✅ **Days remaining** dikhana hai
   - Example: "Lock-in: 45 days remaining" or "Matured"

---

## 11. Property Detail Page - Suggested Content

### Page Layout:

#### Top Section:
1. **Property Header**
   - Property Name (Large, Bold)
   - Property Image/Thumbnail (if available)
   - Short Description/Overview

2. **Key Investment Info (Card/Box)**
   - Minimum Investment: ₹5,00,000
   - Monthly Return: 0.5%
   - Lock-in Period: 3 months
   - Investment Deadline: [Date]

#### Investment Statistics Section:
3. **Investment Stats**
   - Total Available to Invest: ₹X (or "Unlimited")
   - Total Already Invested: ₹X
   - Number of Investors: X
   - Your Investment: ₹X (if user has invested)
   - Your Monthly Earning: ₹X (if user has invested)

#### Detailed Information Section:
4. **Property Details**
   - Full Property Description
   - Property Type: Digital Property
   - Location/Benefits/Features
   - Why Invest Here?

5. **Investment Terms**
   - Minimum Investment: ₹5,00,000 (mandatory)
   - Maximum Investment: No limit
   - Lock-in Period: 3 months (cannot withdraw before)
   - Monthly Return: 0.5% of invested amount
   - Earnings Withdrawal: Available monthly (manual processing)
   - Investment Withdrawal: After 3 months lock-in period

6. **Your Investments (if user has invested)**
   - Investment History Table:
     - Date | Amount Invested | Status | Lock-in Ends | Monthly Earning
   - Example:
     - "15 Jan 2024 | ₹5,00,000 | Locked | 15 Apr 2024 | ₹2,500/month"
     - "20 Feb 2024 | ₹3,00,000 | Locked | 20 May 2024 | ₹1,500/month"

#### ROI Calculator Section:
7. **ROI Calculator**
   - Investment Amount Input: [₹X] (minimum ₹5,00,000)
   - Calculation Display:
     - Investment Amount: ₹X
     - Monthly Earning: ₹X (0.5% of investment)
     - Lock-in Period: 3 months
     - Total Earnings in 3 months: ₹X (Monthly earning × 3)
     - After 3 months: Investment ₹X can be withdrawn

#### Documents Section:
8. **Legal Documents**
   - Property Agreement (PDF)
   - Terms & Conditions (PDF)
   - Investment Certificate Template
   - View/Download buttons

#### FAQ Section:
9. **Frequently Asked Questions**
   - What is the minimum investment?
   - What is the lock-in period?
   - When can I withdraw my investment?
   - When can I withdraw earnings?
   - How are monthly earnings calculated?
   - Can I invest multiple times in the same property?
   - etc.

#### Action Button:
10. **Invest Now Button**
    - Prominent button at top and bottom
    - Opens investment modal/form
    - Validation: Minimum ₹5,00,000 required

### Investment Flow (From Detail Page):
1. User clicks "Invest Now"
2. Investment Form opens:
   - Enter Investment Amount (minimum ₹5,00,000)
   - Show calculation:
     * Investment Amount: ₹X
     * Monthly Earning: ₹X (0.5% of amount)
     * Lock-in Period: 3 months
     * Maturity Date: [Date]
     * Total Earnings in 3 months: ₹X
3. Terms & Conditions checkbox
4. Proceed to Payment

### Suggested Components:
- PropertyHeader (name, image, description)
- InvestmentInfoCard (min investment, return, lock-in, deadline)
- InvestmentStats (total invested, available, investors count)
- YourInvestmentsTable (if user has invested)
- ROICalculator (interactive calculator)
- DocumentsList (downloadable PDFs)
- FAQAccordion (collapsible questions)
- InvestNowButton (prominent CTA)

---

## 12. Implementation Notes

### Data Flow:
1. User invests → Wallet balance se amount deduct
2. Investment created → Lock-in period start (3 months)
3. Monthly earnings calculate → Separate earnings field update
4. Earnings withdraw → Earnings field se deduct
5. After 3 months → Investment amount withdraw kar sakta hai

### Important Rules:
- Earnings NEVER add to wallet balance
- Earnings are SEPARATE from investment
- Minimum investment: ₹5,00,000 (mandatory)
- Lock-in period: 3 months (mandatory)
- Monthly return: 0.5% (fixed for all properties)
- Earnings withdraw: Anytime (monthly)
- Investment withdraw: After 3 months only

---

## 13. Data Structure Updates

### Updated Holding Data (Multiple Investments Support):
```javascript
// User's investment in a property (can have multiple entries for same property)
holding: {
  id: "holding-1",
  propertyId: "listing-1",        // Property reference ID
  propertyName: "Tech Park Alpha",
  amountInvested: 500000,         // This specific investment amount
  purchaseDate: "2024-01-15",
  maturityDate: "2024-04-15",     // 3 months from purchase
  status: "lock-in",              // "active" | "lock-in" | "matured"
  monthlyEarning: 2500,           // 0.5% of amountInvested
  totalEarningsReceived: 5000,    // Total earnings received so far
  daysRemaining: 45,              // Days remaining for maturity
  lockInMonths: 3,
  canWithdrawInvestment: false,   // Can withdraw investment after 3 months
  canWithdrawEarnings: false      // Earnings withdrawal (manual processing - not instant)
}
```

### Property Listing Data (Updated):
```javascript
listing: {
  id: "listing-1",
  title: "Co-working Hub Skyline",
  description: "Full property description...",
  minInvestment: 500000,           // Minimum ₹5 lakh (fixed)
  lockInMonths: 3,                 // Fixed 3 months
  monthlyReturnRate: 0.5,          // Fixed 0.5% per month
  deadline: "2025-12-30",          // Investment deadline
  availableToInvest: 3200000,      // How much can still be invested
  totalInvested: 1000000,          // Total invested by all users
  investorCount: 5,                // Number of investors
  // NO fixed total value
  // NO graph/chart needed
}
```

### Wallet Data (Updated):
```javascript
wallet: {
  currency: "INR",
  balance: 1500000,                // Total invested amount (wallet balance)
  totalInvestments: 1500000,       // Total investments made
  earningsReceived: 15000,         // Total earnings received so far (separate)
  monthlyEarnings: 7500,           // Current monthly earnings (0.5% of total investment)
  withdrawableBalance: 500000,     // Matured investments (after 3 months)
  lockedAmount: 1000000,           // Amount in lock-in period
  availableBalance: 500000         // Available to invest
}
```

---

## 14. Current Holdings Card Updates

### Display Information:
1. **Property Name** (top, bold)
2. **Amount Invested** (₹X)
3. **Monthly Earning** (₹X - 0.5% of invested amount)
4. **Status Badge**: "Locked" or "Matured"
5. **Lock-in Status**: "X days remaining" or "Matured"
6. **Buttons**: 
   - "View Detail" (always visible)
   - "Withdraw" (only when matured - 3 months complete)

### Card Design:
- ❌ Remove return percentage with arrow
- ❌ Remove graph/trend line
- ✅ Simple card with text information
- ✅ Status indicator (Locked/Matured)
- ✅ Days remaining display

---

## 15. Explore Properties Card Updates

### Display Information:
1. **Property Name** (top, bold)
2. **Minimum Investment**: ₹5,00,000 (prominent)
3. **Monthly Return**: 0.5%
4. **Lock-in Period**: 3 months
5. **Deadline**: Investment deadline date
6. **Available to Invest**: ₹X (optional - can show how much available)
7. **Button**: "Invest Now"

### Card Design:
- ❌ Remove graph/trend line
- ❌ Remove "Total Value"
- ❌ Remove return percentage with arrow
- ✅ Simple card with key information
- ✅ Minimum investment amount prominently displayed

---

## 16. Next Steps

1. ✅ Documentation created
2. ⏳ Wait for clarifications on questions
3. ⏳ Update data structures in AppStateContext
4. ⏳ Update Current Holdings cards (remove graph, update details)
5. ⏳ Update Explore Properties cards (remove graph, update details)
6. ⏳ Update wallet calculations
7. ⏳ Implement earnings logic
8. ⏳ Add investment flow
9. ⏳ Add withdrawal flow

---

**Note:** Is documentation ke according sab features implement karenge. Agar koi doubt ya clarification chahiye ho to batayein.

