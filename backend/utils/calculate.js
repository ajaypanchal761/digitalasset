/**
 * Calculate monthly earning based on investment amount
 * @param {number} amountInvested - Investment amount
 * @param {number} monthlyReturnRate - Monthly return rate (default 0.5%)
 * @returns {number} Monthly earning amount
 */
export const calculateMonthlyEarning = (amountInvested, monthlyReturnRate = 0.5) => {
  return Math.floor(amountInvested * (monthlyReturnRate / 100));
};

/**
 * Calculate total earnings for a given period
 * @param {number} amountInvested - Investment amount
 * @param {number} months - Number of months
 * @param {number} monthlyReturnRate - Monthly return rate (default 0.5%)
 * @returns {number} Total earnings
 */
export const calculateTotalEarnings = (amountInvested, months, monthlyReturnRate = 0.5) => {
  const monthlyEarning = calculateMonthlyEarning(amountInvested, monthlyReturnRate);
  return monthlyEarning * months;
};

/**
 * Calculate maturity date from purchase date
 * @param {Date} purchaseDate - Purchase date
 * @param {number} lockInMonths - Lock-in period in months (default 3)
 * @returns {Date} Maturity date
 */
export const calculateMaturityDate = (purchaseDate, lockInMonths = 3) => {
  const maturityDate = new Date(purchaseDate);
  maturityDate.setMonth(maturityDate.getMonth() + lockInMonths);
  return maturityDate;
};

/**
 * Check if investment is matured
 * @param {Date} maturityDate - Maturity date
 * @returns {boolean} True if matured
 */
export const isMatured = (maturityDate) => {
  return new Date() >= new Date(maturityDate);
};

/**
 * Calculate days remaining until maturity
 * @param {Date} maturityDate - Maturity date
 * @returns {number} Days remaining
 */
export const calculateDaysRemaining = (maturityDate) => {
  const today = new Date();
  const maturity = new Date(maturityDate);
  const diffTime = maturity - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Calculate next payout date (1st of next month from purchase date)
 * @param {Date} purchaseDate - Purchase date
 * @returns {Date} Next payout date
 */
export const calculateNextPayoutDate = (purchaseDate) => {
  const nextPayout = new Date(purchaseDate);
  nextPayout.setMonth(nextPayout.getMonth() + 1);
  nextPayout.setDate(1);
  return nextPayout;
};



