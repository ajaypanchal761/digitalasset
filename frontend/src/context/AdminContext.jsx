import { createContext, useContext, useMemo, useState } from 'react';

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

  const kycStatuses = ['pending', 'approved', 'rejected'];
  const accountStatuses = ['active', 'locked', 'suspended'];
  
  return names.map((name, index) => {
    const registrationDate = new Date(2024, 0, 1 + index * 5);
    const kycStatus = kycStatuses[index % 3];
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
    
    // Generate KYC data
    const kycData = {
      fullName: name,
      panNumber: `ABCDE${String(index + 1000).slice(-4)}F`,
      aadhaarNumber: `${String(index + 100000000000).slice(0, 12)}`,
      bankDetails: {
        accountHolderName: name,
        accountNumber: `${String(index + 1000000000).slice(0, 12)}`,
        ifscCode: `HDFC${String(index + 10000).slice(-6)}`,
      },
      submittedDate: new Date(registrationDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: kycStatus,
      rejectionReason: kycStatus === 'rejected' ? 'Name on bank account does not match with provided documents.' : null,
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
      kycStatus,
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
      kycData,
      transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
    };
  });
};

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [users, setUsers] = useState(generateDummyUsers());
  const [selectedUser, setSelectedUser] = useState(null);

  // Update user function
  const updateUser = (userId, updates) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      )
    );
  };

  // Lock/Unlock user account
  const toggleUserAccountStatus = (userId, action) => {
    setUsers(prevUsers => 
      prevUsers.map(user => {
        if (user.id === userId) {
          let newStatus = user.accountStatus;
          if (action === 'lock') newStatus = 'locked';
          else if (action === 'unlock') newStatus = 'active';
          else if (action === 'suspend') newStatus = 'suspended';
          return { ...user, accountStatus: newStatus };
        }
        return user;
      })
    );
  };

  // Credit/Debit wallet
  const updateWallet = (userId, type, amount, reason) => {
    setUsers(prevUsers => 
      prevUsers.map(user => {
        if (user.id === userId) {
          const newBalance = type === 'credit' 
            ? user.wallet.balance + amount 
            : user.wallet.balance - amount;
          
          const newTransaction = {
            id: `txn-${userId}-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: type === 'credit' ? 'credit' : 'debit',
            amount,
            description: reason || `${type === 'credit' ? 'Wallet credited' : 'Wallet debited'} by admin`,
            status: 'completed',
          };
          
          return {
            ...user,
            wallet: { ...user.wallet, balance: newBalance },
            transactions: [newTransaction, ...user.transactions],
          };
        }
        return user;
      })
    );
  };

  const value = useMemo(
    () => ({
      users,
      selectedUser,
      setSelectedUser,
      updateUser,
      toggleUserAccountStatus,
      updateWallet,
    }),
    [users, selectedUser]
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
