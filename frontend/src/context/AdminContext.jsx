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

// Dummy Properties Data
const generateDummyProperties = () => {
  const propertyTitles = [
    'Co-working Hub Skyline',
    'Data Center Nova',
    'Tech Park Alpha',
    'Digital Mall Infinity',
    'Smart Office Complex',
    'Cloud Infrastructure Hub',
    'AI Innovation Center',
    'Blockchain Tech Plaza',
    'Digital Commerce Tower',
    'Smart City Hub'
  ];

  const descriptions = [
    'A premium co-working space in the heart of the city',
    'State-of-the-art data center facility',
    'Modern technology park with premium facilities',
    'Luxury digital shopping and entertainment complex',
    'AI-powered smart office building with green technology',
    'Advanced cloud computing and storage facility',
    'Cutting-edge AI research and development center',
    'Blockchain technology innovation hub',
    'Modern e-commerce and digital business center',
    'Integrated smart city infrastructure platform'
  ];

  const statuses = ['active', 'inactive', 'closed'];
  
  return propertyTitles.map((title, index) => {
    const createdDate = new Date(2024, 0, 1 + index * 10);
    const deadline = new Date(createdDate);
    deadline.setMonth(deadline.getMonth() + 12 + Math.floor(Math.random() * 12));
    
    const totalInvested = Math.floor(Math.random() * 10000000) + 500000; // 5L to 1Cr
    const availableToInvest = Math.floor(Math.random() * 5000000) + 1000000; // 10L to 50L
    const investorCount = Math.floor(Math.random() * 20) + 3; // 3 to 23 investors
    
    const status = index % 10 === 0 ? 'closed' : index % 15 === 0 ? 'inactive' : 'active';
    
    return {
      id: `property-${index + 1}`,
      title,
      description: descriptions[index % descriptions.length],
      image: null, // Will be uploaded
      propertyType: 'Digital Property',
      minInvestment: 500000, // Fixed ₹5 lakh
      lockInMonths: 3, // Fixed 3 months
      monthlyReturnRate: 0.5, // Fixed 0.5%
      deadline: deadline.toISOString().split('T')[0],
      availableToInvest,
      totalInvested,
      investorCount,
      status,
      createdAt: createdDate.toISOString().split('T')[0],
      documents: [], // Will store document URLs
    };
  });
};

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
  const [users, setUsers] = useState(generateDummyUsers());
  const [selectedUser, setSelectedUser] = useState(null);
  const [properties, setProperties] = useState(generateDummyProperties());
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [withdrawals, setWithdrawals] = useState(() => generateDummyWithdrawals(generateDummyUsers()));
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

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

  // Property Management Functions
  const addProperty = (propertyData) => {
    const newProperty = {
      id: `property-${Date.now()}`,
      ...propertyData,
      totalInvested: 0,
      investorCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      documents: propertyData.documents || [],
    };
    setProperties(prev => [newProperty, ...prev]);
    return newProperty;
  };

  const updateProperty = (propertyId, updates) => {
    setProperties(prevProperties =>
      prevProperties.map(property =>
        property.id === propertyId ? { ...property, ...updates } : property
      )
    );
  };

  const deleteProperty = (propertyId) => {
    setProperties(prevProperties =>
      prevProperties.filter(property => property.id !== propertyId)
    );
  };

  const togglePropertyStatus = (propertyId, newStatus) => {
    setProperties(prevProperties =>
      prevProperties.map(property =>
        property.id === propertyId ? { ...property, status: newStatus } : property
      )
    );
  };

  // Withdrawal Management Functions
  const updateWithdrawalStatus = (withdrawalId, newStatus, rejectionReason = null) => {
    setWithdrawals(prevWithdrawals =>
      prevWithdrawals.map(withdrawal => {
        if (withdrawal.id === withdrawalId) {
          const updates = {
            status: newStatus,
            processedDate: newStatus === 'completed' || newStatus === 'rejected' 
              ? new Date().toISOString().split('T')[0] 
              : withdrawal.processedDate,
            rejectionReason: rejectionReason || null,
            transactionId: newStatus === 'completed' 
              ? `TXN${Date.now()}${Math.floor(Math.random() * 1000)}` 
              : withdrawal.transactionId,
          };
          return { ...withdrawal, ...updates };
        }
        return withdrawal;
      })
    );
  };

  const bulkUpdateWithdrawals = (withdrawalIds, newStatus, rejectionReason = null) => {
    setWithdrawals(prevWithdrawals =>
      prevWithdrawals.map(withdrawal => {
        if (withdrawalIds.includes(withdrawal.id)) {
          const updates = {
            status: newStatus,
            processedDate: newStatus === 'completed' || newStatus === 'rejected' 
              ? new Date().toISOString().split('T')[0] 
              : withdrawal.processedDate,
            rejectionReason: rejectionReason || null,
            transactionId: newStatus === 'completed' 
              ? `TXN${Date.now()}${Math.floor(Math.random() * 1000)}` 
              : withdrawal.transactionId,
          };
          return { ...withdrawal, ...updates };
        }
        return withdrawal;
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
      properties,
      selectedProperty,
      setSelectedProperty,
      addProperty,
      updateProperty,
      deleteProperty,
      togglePropertyStatus,
      withdrawals,
      selectedWithdrawal,
      setSelectedWithdrawal,
      updateWithdrawalStatus,
      bulkUpdateWithdrawals,
    }),
    [users, selectedUser, properties, selectedProperty, withdrawals, selectedWithdrawal]
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
