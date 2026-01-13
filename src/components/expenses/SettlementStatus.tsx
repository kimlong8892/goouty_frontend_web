import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { ArrowRight, Check, CreditCard, QrCode, Info, ChevronRight } from 'lucide-react';
import { PaymentSettlementResponse, PaymentTransactionResponse } from '@/types/expense';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { api } from '@/integrations/api/client.ts';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';

interface SettlementStatusProps {
  settlements: PaymentSettlementResponse[];
  onSettlementUpdate: () => void;
}

export const SettlementStatus: React.FC<SettlementStatusProps> = ({
  settlements,
  onSettlementUpdate
}) => {
  const { isPWA } = usePWA();
  const isMobile = useIsMobile();
  const isMobileView = isPWA || isMobile;

  const [updatingSettlements, setUpdatingSettlements] = useState<Set<string>>(new Set());
  const [transactionsBySettlement, setTransactionsBySettlement] = useState<Record<string, PaymentTransactionResponse[]>>({});
  const { user } = useAuth();
  const [amountInputs, setAmountInputs] = useState<Record<string, string>>({});
  const [methodInputs, setMethodInputs] = useState<Record<string, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [qrSettlementId, setQrSettlementId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const methodLabel = (method?: string) => {
    switch (method) {
      case 'cash': return 'tiền mặt';
      case 'bank_transfer': return 'chuyển khoản';
      case 'momo': return 'MoMo';
      case 'zalo_pay': return 'ZaloPay';
      case 'other': return 'khác';
      default: return 'khác';
    }
  };

  const loadTransactions = async (settlementId: string) => {
    try {
      const txs = await api.expenses.getPaymentTransactions(settlementId);
      setTransactionsBySettlement(prev => ({ ...prev, [settlementId]: txs }));
    } catch (e) {
      // silent fail
    }
  };

  const handleSettlementToggle = async (settlement: PaymentSettlementResponse) => {
    // Không cho toggle thủ công. Yêu cầu: mọi lần thanh toán phải là 1 PaymentTransaction riêng.
    // Gợi ý dùng ô nhập và nút "Ghi nhận" bên dưới.
    toast.info('Hãy nhập số tiền và bấm "Ghi nhận" để tạo giao dịch');
  };

  const getRemaining = (s: PaymentSettlementResponse) => {
    // Prioritize calculating from local transactions for immediate real-time updates
    const transactions = transactionsBySettlement[s.id];
    if (transactions) {
      const totalPaid = transactions.reduce((sum, tx) => sum + (tx.status === 'success' ? tx.amount : 0), 0);
      return Math.max(0, s.amount - totalPaid);
    }

    // Use backend-calculated remaining if available (fallback)
    if (s.remaining !== undefined) {
      return Math.max(0, s.remaining);
    }

    return s.amount;
  };

  const clampAmountInput = (s: PaymentSettlementResponse, raw: string) => {
    const remaining = getRemaining(s);
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    const parsed = Number(digitsOnly || '0');
    if (Number.isNaN(parsed)) return '0';
    const clamped = Math.max(0, Math.min(remaining, parsed));
    return clamped.toString();
  };

  const formatWithSeparators = (value: string | number): string => {
    const num = typeof value === 'number' ? value : Number((value || '0').toString().replace(/[^0-9]/g, ''));
    return num.toLocaleString('vi-VN');
  };

  const handleCreateTransaction = async (settlement: PaymentSettlementResponse) => {
    if (updatingSettlements.has(settlement.id)) return;

    try {
      const remaining = getRemaining(settlement);
      const entered = Number(amountInputs[settlement.id] ?? remaining);

      // Security check: Only the creditor (receiver) can record the transaction
      if (user?.id !== settlement.creditorId) {
        toast.error('Chỉ người nhận tiền mới có quyền ghi nhận thanh toán');
        return;
      }

      if (!entered || entered <= 0) {
        toast.error('Số tiền phải > 0');
        return;
      }
      if (entered > remaining) {
        toast.error('Số tiền vượt quá phần còn lại');
        return;
      }

      setUpdatingSettlements(prev => new Set(prev).add(settlement.id));
      const method = methodInputs[settlement.id] || 'cash';
      const note = noteInputs[settlement.id];
      await api.expenses.createPaymentTransaction(settlement.id, { amount: entered, status: 'success', method, note });
      toast.success('Ghi nhận thanh toán thành công');
      await loadTransactions(settlement.id);
      onSettlementUpdate();
      setAmountInputs(prev => {
        const next = { ...prev };
        delete next[settlement.id];
        return next;
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể tạo giao dịch');
    } finally {
      setUpdatingSettlements(prev => {
        const newSet = new Set(prev);
        newSet.delete(settlement.id);
        return newSet;
      });
    }
  };

  const buildQrUrl = (s: PaymentSettlementResponse) => {
    const bankId = (s as any).creditor?.bankId;
    const bankNumber = (s as any).creditor?.bankNumber;
    const amount = amountInputs[s.id] ?? getRemaining(s);
    const desc = `Thanh toan #${s.id}`;
    return `https://qr.sepay.vn/img?acc=${encodeURIComponent(bankNumber)}&bank=${encodeURIComponent(bankId)}&amount=${encodeURIComponent(amount)}&des=${encodeURIComponent(desc)}`;
  };

  const handleDownloadQr = async (s: PaymentSettlementResponse) => {
    try {
      const url = buildQrUrl(s);
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `qr-${s.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      const url = buildQrUrl(s);
      window.open(url, '_blank');
    }
  };

  const pendingSettlements = settlements.filter(s => s.status === 'pending');

  React.useEffect(() => {
    pendingSettlements.forEach(s => {
      if (!transactionsBySettlement[s.id]) loadTransactions(s.id);
      const remaining = getRemaining(s);
      setAmountInputs(prev => (prev[s.id] ? prev : { ...prev, [s.id]: remaining.toString() }));
      setMethodInputs(prev => (prev[s.id] ? prev : { ...prev, [s.id]: 'cash' }));
      setNoteInputs(prev => (prev[s.id] !== undefined ? prev : { ...prev, [s.id]: '' }));
    });
  }, [pendingSettlements.length]);

  React.useEffect(() => {
    pendingSettlements.forEach(s => {
      const remaining = getRemaining(s);
      setAmountInputs(prev => {
        const current = prev[s.id];
        if (current === undefined || Number(current) > remaining) {
          return { ...prev, [s.id]: remaining.toString() };
        }
        return prev;
      });
    });
  }, [JSON.stringify(transactionsBySettlement), pendingSettlements.length]);

  if (pendingSettlements.length === 0) return null;

  return (
    <>
      <div className={cn("space-y-4", isMobileView ? "mb-6" : "mb-8")}>
        <div className="flex items-center gap-2 px-1">
          <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-500" />
          <h3 className={cn("font-bold text-slate-900 dark:text-white", isMobileView ? "text-base" : "text-lg")}>Thanh toán</h3>
        </div>
        <div className={cn("grid gap-4", isMobileView ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
          {pendingSettlements.map((settlement) => {
            const isUpdating = updatingSettlements.has(settlement.id);
            const remaining = getRemaining(settlement);
            if (remaining === 0) return null;

            const isReceiver = user?.id === settlement.creditorId;
            const isPayer = user?.id === settlement.debtorId;

            return (
              <div
                key={settlement.id}
                className="bg-white dark:bg-card/50 border border-slate-100 dark:border-white/5 rounded-[24px] overflow-hidden hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors shadow-sm"
              >
                <div className={cn(isMobileView ? "p-4" : "p-6", "space-y-6")}>
                  {/* Participant Flow */}
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                      <Avatar className={cn("border-2 border-white dark:border-slate-800 shadow-sm font-bold", isMobileView ? "w-12 h-12" : "w-16 h-16")}>
                        {settlement.debtor.profilePicture && <AvatarImage src={settlement.debtor.profilePicture} />}
                        <AvatarFallback className={cn("bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 uppercase", isMobileView ? "text-sm" : "text-base")}>
                          {(settlement.debtor.fullName || settlement.debtor.email).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center w-full">
                        <p className={cn("font-bold text-slate-900 dark:text-white truncate", isMobileView ? "text-xs" : "text-sm")}>
                          {(settlement.debtor.fullName || settlement.debtor.email)}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className={cn("text-slate-300 dark:text-slate-600 flex-shrink-0", isMobileView ? "w-4 h-4" : "w-5 h-5")} />

                    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                      <Avatar className={cn("border-2 border-white dark:border-slate-800 shadow-sm font-bold", isMobileView ? "w-12 h-12" : "w-16 h-16")}>
                        {settlement.creditor.profilePicture && <AvatarImage src={settlement.creditor.profilePicture} />}
                        <AvatarFallback className={cn("bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 uppercase", isMobileView ? "text-sm" : "text-base")}>
                          {(settlement.creditor.fullName || settlement.creditor.email).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center w-full">
                        <p className={cn("font-bold text-slate-900 dark:text-white truncate", isMobileView ? "text-xs" : "text-sm")}>
                          {(settlement.creditor.fullName || settlement.creditor.email)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-[1.2] min-w-0">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">Cần trả</span>
                      <span className={cn("font-black text-orange-600 dark:text-orange-500 leading-none", isMobileView ? "text-lg" : "text-xl")}>
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Form / Message */}
                  {(isReceiver || (isPayer && (settlement as any).creditor?.bankId && (settlement as any).creditor?.bankNumber)) && (
                    <div className={cn("bg-slate-50/50 dark:bg-white/5 rounded-[20px] space-y-4", isMobileView ? "p-4" : "p-6")}>
                      {isReceiver ? (
                        <div className={cn("grid gap-4", isMobileView ? "grid-cols-1" : "grid-cols-2")}>
                          <div className="space-y-1.5">
                            <label className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest pl-1">Bạn đã trả bao nhiêu?</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="w-full px-4 h-11 rounded-xl border-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 shadow-sm font-black text-slate-900 dark:text-white"
                              value={formatWithSeparators(amountInputs[settlement.id] ?? remaining.toString())}
                              onChange={e => setAmountInputs(prev => ({ ...prev, [settlement.id]: clampAmountInput(settlement, e.target.value) }))}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest pl-1">Phương thức</label>
                            <select
                              className="w-full px-4 h-11 rounded-xl border-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-500 shadow-sm font-bold text-slate-700 dark:text-slate-200 appearance-none bg-white dark:bg-slate-800 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                              value={methodInputs[settlement.id] || 'cash'}
                              onChange={e => setMethodInputs(prev => ({ ...prev, [settlement.id]: e.target.value }))}
                            >
                              <option value="cash">Tiền mặt</option>
                              <option value="bank_transfer">Chuyển khoản</option>
                              <option value="momo">MoMo</option>
                              <option value="zalo_pay">ZaloPay</option>
                            </select>
                          </div>

                          <div className={cn("flex gap-2", isMobileView ? "flex-col" : "col-span-2")}>
                            <Button
                              className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 dark:shadow-none"
                              disabled={isUpdating}
                              onClick={() => handleCreateTransaction(settlement)}
                            >
                              {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Ghi nhận thanh toán</>}
                            </Button>

                            {(settlement as any).creditor?.bankId && (settlement as any).creditor?.bankNumber && (
                              <Button
                                variant="outline"
                                className={cn("h-11 rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5", isMobileView ? "w-full" : "w-11 p-0")}
                                onClick={() => setQrSettlementId(settlement.id)}
                              >
                                <QrCode className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-2" />
                                {isMobileView && "QR Profile"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {isPayer && (settlement as any).creditor?.bankId && (settlement as any).creditor?.bankNumber && (
                            <Button
                              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 dark:shadow-none"
                              onClick={() => setQrSettlementId(settlement.id)}
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              Quét QR Chuyển khoản
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Help Info */}
        <div className="mt-8 p-6 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-[24px] border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Info className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-400 mb-1">Hướng dẫn thanh toán</h4>
            <div className="space-y-1 text-xs text-indigo-700/80 dark:text-indigo-500/60 font-medium">
              <p>• Hệ thống đã tính toán các khoản bù trừ để tối ưu hóa số lượng giao dịch.</p>
              <p>• Bạn có thể thanh toán một phần hoặc toàn bộ số tiền cần chuyển.</p>
              <p>• Sử dụng mã QR để chuyển khoản nhanh chóng và chính xác.</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <Dialog open={!!qrSettlementId} onOpenChange={(open) => !open && setQrSettlementId(null)}>
        <DialogContent className={cn(
          "bg-white dark:bg-slate-900 border-none shadow-2xl overflow-hidden flex flex-col",
          isMobileView ? "h-full w-full max-w-none rounded-none p-4" : "rounded-[32px] p-8 max-w-sm"
        )}>
          <DialogHeader className={cn(isMobileView ? "mb-4 pt-10" : "mb-6")}>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl font-black text-slate-900 dark:text-white">
              Quét QR Chuyển Khoản
            </DialogTitle>
          </DialogHeader>
          {qrSettlementId && (
            <div className="space-y-6 overflow-y-auto pb-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 relative group max-w-[280px] mx-auto">
                <img
                  src={buildQrUrl(settlements.find((s) => s.id === qrSettlementId)!)}
                  alt="QR Code"
                  className="w-full h-auto rounded-xl"
                />
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Thanh toán cho</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {(settlements.find(s => s.id === qrSettlementId)?.creditor?.fullName || 'Người dùng')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Số tiền</p>
                  <p className="text-sm font-black text-primary">
                    {formatCurrency(Number(amountInputs[qrSettlementId] || settlements.find(s => s.id === qrSettlementId)?.amount || 0))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <Button
                  variant="outline"
                  onClick={() => setQrSettlementId(null)}
                  className="h-12 rounded-2xl border-slate-200 dark:border-white/10 font-bold text-slate-600 dark:text-slate-400 dark:hover:bg-white/5"
                >
                  Đóng
                </Button>
                <Button
                  onClick={() => handleDownloadQr(settlements.find((s) => s.id === qrSettlementId)!)}
                  className="h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 dark:shadow-none"
                >
                  Tải QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
