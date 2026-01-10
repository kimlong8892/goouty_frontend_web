import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { ExpenseSummary } from './ExpenseSummary';
import { PersonalBalance } from './PersonalBalance';
import { SettlementStatus } from './SettlementStatus';
import { PaymentHistory } from './PaymentHistory';
import { ExpenseList } from './ExpenseList';
import { AddExpenseDialog } from '@/components/dialogs/AddExpenseDialog.tsx';
import { ExpenseCalculationResponse, PaymentSettlementResponse, PaymentTransactionResponse } from '@/types/expense';
import { api } from '@/integrations/api/client.ts';
import { toast } from 'sonner';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface ExpenseSectionProps {
  tripId: string;
  isOwner: boolean;
  isMember?: boolean;
}

export const ExpenseSection: React.FC<ExpenseSectionProps> = ({
  tripId,
  isOwner,
  isMember = false
}) => {
  const navigate = useNavigate();
  const { isPWA } = usePWA();
  const [calculation, setCalculation] = useState<ExpenseCalculationResponse | null>(null);
  const [settlements, setSettlements] = useState<PaymentSettlementResponse[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [expenseListKey, setExpenseListKey] = useState(0);

  const fetchCalculation = async () => {
    try {
      const data = await api.expenses.calculateTripExpenses(tripId);
      setCalculation(data);
    } catch (error: any) {
      toast.error('Không thể tải tính toán chi phí');
      console.error('Error fetching calculation:', error);
    }
  };

  const fetchSettlements = async () => {
    try {
      const data = await api.expenses.getPaymentSettlements(tripId);
      setSettlements(data);
    } catch (error: any) {
      console.error('Error fetching settlements:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const allTransactions = [];
      for (const settlement of settlements) {
        try {
          const settlementTransactions = await api.expenses.getPaymentTransactions(settlement.id);
          allTransactions.push(...settlementTransactions);
        } catch (error) {
          console.error(`Error fetching transactions for settlement ${settlement.id}:`, error);
        }
      }
      setTransactions(allTransactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSettlementUpdate = async () => {
    await Promise.all([fetchCalculation(), fetchSettlements()]);
    await fetchTransactions();
    setExpenseListKey(prev => prev + 1);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCalculation(), fetchSettlements()]);
      await fetchTransactions();
      setLoading(false);
    };
    loadData();
  }, [tripId]);

  const handleAddExpense = () => {
    if (isPWA) {
      navigate(`/pwa-add-expense/${tripId}`);
    } else {
      setShowAddExpenseDialog(true);
    }
  };

  const handleExpenseAdded = async () => {
    await handleSettlementUpdate();
    setExpenseListKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6347f9]"></div>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Đang chuẩn bị dữ liệu chi phí...</p>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="text-center py-20 bg-red-50 dark:bg-red-500/10 rounded-[32px] border border-red-100 dark:border-red-500/20">
        <p className="text-red-500 font-bold">Không thể kết nối với dữ liệu chi phí</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-xs font-bold text-red-600 dark:text-red-400 underline">Thử lại ngay</button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Chi phí chuyến đi - Trip Expenses Summary */}
      <ExpenseSummary
        calculation={calculation}
        onAddExpense={handleAddExpense}
        canAddExpense={isOwner || isMember}
      />

      <div className="grid grid-cols-1 gap-10">
        {/* Tình hình cá nhân - Personal Status */}
        <PersonalBalance userBalances={calculation.userBalances} />

        {/* Settlement Status - Only show if there are pending settlements */}
        {settlements.some(s => s.status === 'pending') && (
          <SettlementStatus
            settlements={settlements}
            onSettlementUpdate={handleSettlementUpdate}
          />
        )}

        {/* All Balanced Status - Only show if truly balanced */}
        {calculation.isBalanced && settlements.length === 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-100 dark:border-green-500/20 rounded-[24px] p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <Sparkles className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-green-900/40">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-green-800 dark:text-green-400 text-lg">Tất cả đã cân bằng!</h3>
                <p className="text-sm text-green-700/80 dark:text-green-500/70 font-medium">
                  Tuyệt vời! Mọi chi phí đã được thanh toán và chia đều cho tất cả mọi người.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Giải quyết trả tiền - Payment History */}
        {settlements.length > 0 && (
          <PaymentHistory settlements={settlements} />
        )}

        {/* Chi tiết chi phí - Expense Details */}
        <div className="pt-6 border-t border-slate-100 dark:border-white/10">
          <ExpenseList
            key={expenseListKey}
            tripId={tripId}
            isOwner={isOwner}
            isMember={isMember}
            onExpenseChange={handleSettlementUpdate}
          />
        </div>
      </div>

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        open={showAddExpenseDialog}
        onOpenChange={setShowAddExpenseDialog}
        tripId={tripId}
        onSuccess={handleExpenseAdded}
      />
    </div>
  );
};
