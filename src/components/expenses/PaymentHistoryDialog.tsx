import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import { PaymentTransactionResponse, PaymentSettlementResponse } from '@/types/expense';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { cn } from '@/lib/utils';
import { History, ReceiptText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useIsMobile } from '@/hooks/use-mobile.tsx';

interface PaymentHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transactions: PaymentTransactionResponse[];
    settlements: PaymentSettlementResponse[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export const PaymentHistoryDialog: React.FC<PaymentHistoryDialogProps> = ({
    open,
    onOpenChange,
    transactions,
    settlements
}) => {
    const { isPWA } = usePWA();
    const { user } = useAuth();
    const isMobile = useIsMobile();
    const isMobileView = isPWA || isMobile;

    // Create a map for quick creditor/debtor lookup
    const settlementsMap = React.useMemo(() => {
        return new Map(settlements.map(s => [s.id, s]));
    }, [settlements]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "bg-white dark:bg-slate-900 border-none shadow-2xl overflow-hidden flex flex-col transition-all duration-300",
                isPWA
                    ? "w-[90vw] max-w-[400px] h-[75dvh] rounded-[32px] p-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    : "max-w-2xl h-[80vh] rounded-[32px] p-0"
            )}>
                <DialogHeader className="flex-shrink-0 border-b border-slate-100 dark:border-white/10 p-6 relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <History className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Lịch sử giao dịch</DialogTitle>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Toàn bộ các khoản thanh toán trong nhóm</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none md:scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                    {transactions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                                <ReceiptText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chưa có giao dịch nào được ghi nhận</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(tx => {
                                const settlement = settlementsMap.get(tx.settlementId);
                                const debtorName = settlement ? (settlement.debtor.fullName || settlement.debtor.email) + (user && settlement.debtor.id === user.id ? ' (bạn)' : '') : 'Người dùng';
                                const creditorName = settlement ? (settlement.creditor.fullName || settlement.creditor.email) + (user && settlement.creditor.id === user.id ? ' (bạn)' : '') : 'Người dùng';

                                return (
                                    <div key={tx.id} className="flex items-start justify-between bg-slate-50 dark:bg-white/5 p-4 rounded-[20px] border border-slate-100 dark:border-white/5">
                                        <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-4">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                                {debtorName} <span className="text-slate-400 font-normal">đã chuyển cho</span> {creditorName}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/5">
                                                    {tx.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                    {formatDateTime(String(tx.createdAt))}
                                                </span>
                                            </div>
                                            {tx.note && (
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">" {tx.note} "</p>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="text-sm font-black text-primary">{formatCurrency(tx.amount)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
