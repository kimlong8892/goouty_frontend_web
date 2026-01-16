import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { ExpenseSummary } from './ExpenseSummary';
import { PersonalBalance } from './PersonalBalance';
import { SettlementStatus } from './SettlementStatus';
import { PaymentHistory } from './PaymentHistory';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import { ExpenseList } from './ExpenseList';
import { AddExpenseDialog } from '@/components/dialogs/AddExpenseDialog.tsx';
import { ExpenseCalculationResponse, PaymentSettlementResponse, PaymentTransactionResponse } from '@/types/expense';
import { api } from '@/integrations/api/client.ts';
import { toast } from 'sonner';
import { CheckCircle2, Sparkles, LayoutGrid, ReceiptText, Handshake, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { User, Users2 } from 'lucide-react';

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
  const { user } = useAuth();
  const [calculation, setCalculation] = useState<ExpenseCalculationResponse | null>(null);
  const [settlements, setSettlements] = useState<PaymentSettlementResponse[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [expenseListKey, setExpenseListKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState('personal');
  const [touchDelta, setTouchDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (activeTab !== 'settlements') return;
    touchEndX.current = null;
    touchEndY.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !touchStartX.current) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;

    // Check if it's a vertical swipe to allow scrolling
    if (touchStartY.current) {
      const diffY = Math.abs(currentY - touchStartY.current);
      const diffX = Math.abs(currentX - touchStartX.current);
      if (diffY > diffX && diffY > 10) {
        setIsDragging(false);
        return;
      }
    }

    let deltaX = currentX - touchStartX.current;

    // Rubber banding at edges
    if ((activeSubTab === 'personal' && deltaX > 0) || (activeSubTab === 'group' && deltaX < 0)) {
      deltaX = deltaX * 0.3;
    }

    setTouchDelta(deltaX);
    touchEndX.current = currentX;
    touchEndY.current = currentY;
  };

  const handleSubSwipe = (distanceX: number) => {
    const subTabs = ['personal', 'group'];
    const currentIndex = subTabs.indexOf(activeSubTab);
    if (distanceX > 0) { // Swipe left -> next
      if (currentIndex < subTabs.length - 1) setActiveSubTab(subTabs[currentIndex + 1]);
    } else { // Swipe right -> prev
      if (currentIndex > 0) setActiveSubTab(subTabs[currentIndex - 1]);
    }
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const finalDelta = touchDelta;
    setTouchDelta(0);

    if (Math.abs(finalDelta) > minSwipeDistance) {
      if (finalDelta < 0 && activeSubTab === 'personal') {
        setActiveSubTab('group');
      } else if (finalDelta > 0 && activeSubTab === 'group') {
        setActiveSubTab('personal');
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

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
      return data;
    } catch (error: any) {
      console.error('Error fetching settlements:', error);
      return [];
    }
  };

  const fetchTransactions = async (currentSettlements: PaymentSettlementResponse[]) => {
    try {
      const allTransactions = [];
      for (const settlement of currentSettlements) {
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
    const [_, currentSettlements] = await Promise.all([
      fetchCalculation(),
      fetchSettlements()
    ]);
    await fetchTransactions(currentSettlements);
    setExpenseListKey(prev => prev + 1);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [_, currentSettlements] = await Promise.all([
        fetchCalculation(),
        fetchSettlements()
      ]);
      await fetchTransactions(currentSettlements);
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
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

  if (isPWA) {
    return (
      <div
        className="space-y-6 min-h-[60vh]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="grid grid-cols-3 h-14 p-1 bg-secondary/30 dark:bg-white/5 rounded-[20px] w-full mb-6"
            onTouchStart={(e) => e.stopPropagation()}
          >
            <TabsTrigger
              value="overview"
              className="rounded-[16px] data-[state=active]:bg-white dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-lg data-[state=active]:text-primary dark:data-[state=active]:text-white transition-all duration-300 flex flex-col items-center justify-center gap-1 h-full py-1 text-slate-500 dark:text-white/50"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-tight leading-none text-center px-1">Tổng quan nhóm</span>
            </TabsTrigger>
            <TabsTrigger
              value="settlements"
              className="rounded-[16px] data-[state=active]:bg-white dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-lg data-[state=active]:text-primary dark:data-[state=active]:text-white transition-all duration-300 flex flex-col items-center justify-center gap-1 h-full py-1 text-slate-500 dark:text-white/50"
            >
              <Handshake className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-tight leading-none text-center px-1">Giải quyết trả tiền</span>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="rounded-[16px] data-[state=active]:bg-white dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-lg data-[state=active]:text-primary dark:data-[state=active]:text-white transition-all duration-300 flex flex-col items-center justify-center gap-1 h-full py-1 text-slate-500 dark:text-white/50"
            >
              <ReceiptText className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-tight leading-none text-center px-1">Lịch sử chi tiêu</span>
            </TabsTrigger>
          </TabsList>

          <div className="overflow-hidden -mx-4 px-4">
            <div
              className="flex w-[300%] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(${activeTab === 'overview' ? '0%' : activeTab === 'settlements' ? '-33.333%' : '-66.666%'})` }}
            >
              {/* SLIDE 1: Overview */}
              <div className="w-1/3 pr-8 space-y-8">
                <ExpenseSummary
                  calculation={{ ...calculation, transactionCount: transactions.length }}
                  onAddExpense={handleAddExpense}
                  canAddExpense={isOwner || isMember}
                  onShowHistory={() => setShowHistoryDialog(true)}
                />
                <PersonalBalance userBalances={calculation.userBalances} />
              </div>

              {/* SLIDE 2: Settlements */}
              <div className="w-1/3 px-4 space-y-6">
                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                  <TabsList
                    className="grid grid-cols-2 bg-slate-100/50 dark:bg-white/5 p-1 rounded-xl h-10 w-full mb-4"
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <TabsTrigger
                      value="personal"
                      className="rounded-lg px-4 text-[12px] font-bold tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-white dark:text-white/50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5" />
                      Cá nhân
                    </TabsTrigger>
                    <TabsTrigger
                      value="group"
                      className="rounded-lg px-4 text-[12px] font-bold tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-white dark:text-white/50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Users2 className="w-3.5 h-3.5" />
                      Cả nhóm
                    </TabsTrigger>
                  </TabsList>

                  <div className="overflow-hidden">
                    <div
                      className={cn(
                        "flex w-[200%] transition-transform ease-[cubic-bezier(0.16,1,0.3,1)]",
                        isDragging ? "duration-0" : "duration-500"
                      )}
                      style={{
                        transform: `translateX(calc(${activeSubTab === 'personal' ? '0%' : '-50%'} + ${touchDelta}px))`
                      }}
                    >
                      {/* Cá nhân Content */}
                      <div className="w-1/2 px-0.5 space-y-6">
                        <div className="flex items-center gap-2 px-1 mb-2">
                          <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">Thanh toán</h3>
                        </div>

                        {(() => {
                          const personalSettlements = settlements.filter(s => s.debtorId === user?.id || s.creditorId === user?.id);
                          const pendingPersonal = personalSettlements.filter(s => s.status === 'pending');

                          return (
                            <>
                              {pendingPersonal.length > 0 ? (
                                <SettlementStatus
                                  settlements={pendingPersonal}
                                  onSettlementUpdate={handleSettlementUpdate}
                                />
                              ) : (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-100 dark:border-green-500/20 rounded-[24px] p-6 shadow-sm relative overflow-hidden group mb-6">
                                  <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Sparkles className="w-16 h-16 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                      <CheckCircle2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="font-black text-green-800 dark:text-green-400 text-base">Bạn đã hoàn tất!</h3>
                                      <p className="text-xs text-green-700/80 dark:text-green-500/70 font-medium">
                                        Tất cả các khoản thu chi cá nhân của bạn đã được giải quyết xong.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {personalSettlements.length > 0 && (
                                <PaymentHistory settlements={personalSettlements} />
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Cả nhóm Content */}
                      <div className="w-1/2 px-0.5 space-y-6">
                        <div className="flex items-center gap-2 px-1 mb-2">
                          <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">Thanh toán</h3>
                        </div>

                        {settlements.some(s => s.status === 'pending') && (
                          <SettlementStatus
                            settlements={settlements}
                            onSettlementUpdate={handleSettlementUpdate}
                          />
                        )}
                        {calculation.isBalanced && settlements.length === 0 && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-100 dark:border-green-500/20 rounded-[24px] p-6 shadow-sm relative overflow-hidden group">
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
                        {settlements.length > 0 && (
                          <PaymentHistory settlements={settlements} />
                        )}
                      </div>
                    </div>
                  </div>
                </Tabs>
              </div>

              {/* SLIDE 3: Payments */}
              <div className="w-1/3 pl-8">
                <div className="pt-2">
                  <ExpenseList
                    key={expenseListKey}
                    tripId={tripId}
                    isOwner={isOwner}
                    isMember={isMember}
                    onExpenseChange={handleSettlementUpdate}
                  />
                </div>
              </div>
            </div>
          </div>
        </Tabs>

        {/* Add Expense Dialog */}
        <AddExpenseDialog
          open={showAddExpenseDialog}
          onOpenChange={setShowAddExpenseDialog}
          tripId={tripId}
          onSuccess={handleExpenseAdded}
        />

        <PaymentHistoryDialog
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
          transactions={transactions}
          settlements={settlements}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Chi phí chuyến đi - Trip Expenses Summary */}
      <ExpenseSummary
        calculation={{ ...calculation, transactionCount: transactions.length }}
        onAddExpense={handleAddExpense}
        canAddExpense={isOwner || isMember}
        onShowHistory={() => setShowHistoryDialog(true)}
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

      {/* Payment History Dialog */}
      <PaymentHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        transactions={transactions}
        settlements={settlements}
      />

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

