// Types for expense calculations and settlements
export interface UserBalance {
  userId: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = should receive money, negative = should pay money
  totalReceived: number; // total amount received from successful transactions
  totalPaidOut: number; // total amount paid out from successful transactions
  remaining?: number; // positive: still to receive; negative: still to pay
}

export interface PaymentSettlement {
  debtorId: string;
  debtor: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  creditorId: string;
  creditor: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  amount: number;
}

export interface ExpenseCalculationResponse {
  tripId: string;
  totalExpenses: number;
  transactionCount: number;
  userBalances: UserBalance[];
  settlements: PaymentSettlement[];
  isBalanced: boolean;
}

export interface PaymentSettlementResponse {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  description?: string;
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
  tripId: string;
  debtorId: string;
  debtor: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  creditorId: string;
  creditor: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  // Calculated fields from backend
  totalPaid?: number;  // Total amount paid through successful transactions
  remaining?: number;  // Amount still to be paid (amount - totalPaid)
}


export interface PaymentTransactionResponse {
  id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  method?: string;
  note?: string;
  createdAt: string;
  settlementId: string;
  fromUserId: string;
  toUserId: string;
}
