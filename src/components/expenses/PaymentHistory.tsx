import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { CheckCircle, ArrowRight, Clock, History, AlertCircle } from 'lucide-react';
import { PaymentSettlementResponse, PaymentTransactionResponse } from '@/types/expense';
import { api } from '@/integrations/api/client.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { cn } from '@/lib/utils';

interface PaymentHistoryProps {
  settlements: PaymentSettlementResponse[];
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ settlements }) => {
  const [transactionsBySettlement, setTransactionsBySettlement] = React.useState<Record<string, PaymentTransactionResponse[]>>({});
  const { user } = useAuth();
  const { isPWA } = usePWA();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const loadTransactions = async (settlementId: string) => {
    try {
      const txs = await api.expenses.getPaymentTransactions(settlementId);
      setTransactionsBySettlement(prev => ({ ...prev, [settlementId]: txs }));
    } catch (e) {
      // ignore
    }
  };

  const getTotalPaid = (settlement: PaymentSettlementResponse) => {
    // Use backend-calculated totalPaid if available
    if (settlement.totalPaid !== undefined) {
      return settlement.totalPaid;
    }

    // Fallback: calculate from local transactions
    const list = transactionsBySettlement[settlement.id] || [];
    return list.reduce((sum, tx) => sum + (tx.status === 'success' ? tx.amount : 0), 0);
  };

  React.useEffect(() => {
    settlements.forEach(s => {
      loadTransactions(s.id);
    });
  }, [settlements.map(s => `${s.id}-${s.status}-${s.amount}-${s.updatedAt}`).join('|')]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (settlements.length === 0) {
    return (
      <Card className="rounded-[24px] border-none shadow-sm bg-slate-50 dark:bg-card/50 border border-slate-100 dark:border-white/5">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Chưa có thanh toán nào</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Các giao dịch thanh toán sẽ xuất hiện ở đây khi có chi phí cần chia sẻ
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[24px] border-none shadow-sm bg-white dark:bg-card/50 border border-slate-100 dark:border-white/5 overflow-hidden">
      {!isPWA && (
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Giải quyết trả tiền</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent rounded-full px-3">
              {settlements.length} giao dịch
            </Badge>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-6">
        <div className="space-y-4">
          {settlements.map((settlement) => {
            const isCompleted = settlement.status === 'completed';
            const debtorName = (settlement.debtor.fullName || settlement.debtor.email) + (user && settlement.debtor.id === user.id ? ' (bạn)' : '');
            const creditorName = (settlement.creditor.fullName || settlement.creditor.email) + (user && settlement.creditor.id === user.id ? ' (bạn)' : '');
            // Use backend-calculated remaining if available, otherwise calculate
            const remainingAmount = settlement.remaining !== undefined
              ? settlement.remaining
              : Math.max(0, settlement.amount - getTotalPaid(settlement));

            return (
              <div
                key={settlement.id}
                className={cn(
                  "group rounded-[24px] border transition-all duration-300 overflow-hidden",
                  isCompleted
                    ? 'border-green-100 bg-green-50/30 dark:border-green-500/10 dark:bg-green-500/5'
                    : 'border-orange-100 bg-orange-50/30 shadow-sm dark:border-orange-500/20 dark:bg-orange-500/10'
                )}
              >
                <div className="p-5 md:p-6 space-y-6">
                  {/* Status header */}
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-500' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-500'
                    )}>
                      {isCompleted ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {isCompleted ? 'Đã hoàn tất' : 'Chờ thanh toán'}
                    </div>
                    <div className="text-right">
                      <p className={cn("text-xl font-black", isCompleted ? 'text-green-700 dark:text-green-500' : 'text-orange-700 dark:text-orange-500')}>
                        {formatCurrency(isCompleted ? settlement.amount : remainingAmount)}
                      </p>
                      {isCompleted && settlement.settledAt && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
                          {formatDate(settlement.settledAt.toString())}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Flow Visualization */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <Avatar className="w-14 h-14 border-2 border-white dark:border-slate-800 shadow-md">
                        {settlement.debtor.profilePicture && <AvatarImage src={settlement.debtor.profilePicture} />}
                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm">
                          {(settlement.debtor.fullName || settlement.debtor.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{debtorName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Người gửi</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className={cn("w-full h-[2px] rounded-full relative", isCompleted ? 'bg-green-200 dark:bg-green-500/30' : 'bg-orange-200 dark:bg-orange-500/30')}>
                        <div className={cn(
                          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center border-2",
                          isCompleted ? 'bg-green-50 border-green-200 text-green-600 dark:bg-slate-900 dark:border-green-500/40 dark:text-green-500' : 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-slate-900 dark:border-orange-500/40 dark:text-orange-500'
                        )}>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 flex-1">
                      <Avatar className="w-14 h-14 border-2 border-white dark:border-slate-800 shadow-md">
                        {settlement.creditor.profilePicture && <AvatarImage src={settlement.creditor.profilePicture} />}
                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm">
                          {(settlement.creditor.fullName || settlement.creditor.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{creditorName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Người nhận</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Note */}
                  <div className={cn(
                    "p-4 rounded-2xl text-xs font-medium leading-relaxed",
                    isCompleted ? 'bg-green-100/50 text-green-800 dark:bg-green-500/10 dark:text-green-400' : 'bg-orange-100/50 text-orange-800 dark:bg-orange-500/10 dark:text-orange-400'
                  )}>
                    {isPWA ? (
                      isCompleted
                        ? `${debtorName} đã hoàn tất thanh toán`
                        : `${debtorName} còn thiếu ${formatCurrency(remainingAmount)}`
                    ) : (
                      isCompleted
                        ? `${debtorName} đã hoàn tất việc chuyển tiền cho ${creditorName}`
                        : `${debtorName} cần thanh toán thêm ${formatCurrency(remainingAmount)} cho ${creditorName}`
                    )}
                  </div>

                  {/* Transactions details */}
                  {transactionsBySettlement[settlement.id] && transactionsBySettlement[settlement.id].length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lịch sử giao dịch</h4>
                      <div className="space-y-2">
                        {transactionsBySettlement[settlement.id].map(tx => (
                          <div key={tx.id} className="flex items-center justify-between bg-white/60 dark:bg-white/5 p-3 rounded-xl border border-white dark:border-white/5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {isPWA ? (
                                  <>{debtorName} <span className="text-primary italic">đã chuyển {formatCurrency(tx.amount)}</span></>
                                ) : (
                                  <>{debtorName} <span className="text-slate-400 font-normal">đã chuyển cho</span> {creditorName}</>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                <span>{tx.note || (tx.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản')}</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-slate-400" />
                                <span>{formatDateTime(String(tx.createdAt))}</span>
                              </span>
                            </div>
                            {!isPWA && <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
