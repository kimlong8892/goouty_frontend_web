import React from 'react';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { DollarSign, TrendingUp, Plus, ReceiptText } from 'lucide-react';
import { ExpenseCalculationResponse } from '@/types/expense';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';

interface ExpenseSummaryProps {
  calculation: ExpenseCalculationResponse;
  onAddExpense: () => void;
  canAddExpense: boolean;
  onShowHistory?: () => void;
}

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  calculation,
  onAddExpense,
  canAddExpense,
  onShowHistory
}) => {
  const { isPWA } = usePWA();
  const isMobile = useIsMobile();
  const isMobileView = isPWA || isMobile;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={cn("space-y-6", isMobileView && "space-y-4")}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className={cn("font-bold text-slate-900 dark:text-foreground", isMobileView ? "text-lg" : "text-xl")}>Chi phí</h2>
          {!isMobileView && <p className="text-slate-500 dark:text-muted-foreground text-sm mt-1">Quản lý ngân sách và chi tiêu</p>}
        </div>
        {canAddExpense && (
          <Button
            onClick={onAddExpense}
            size={isMobileView ? "sm" : "default"}
            className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 dark:shadow-none flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {isMobileView ? "Thêm" : "Thêm chi phí"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className={cn(isMobileView ? "w-16 h-16" : "w-24 h-24", "rotate-12")} />
          </div>
          <CardContent className={cn(isMobileView ? "p-4" : "p-6", "relative z-10")}>
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <span className="text-[10px] font-black uppercase tracking-widest">Tổng chi phí</span>
            </div>
            <p className={cn("font-black", isMobileView ? "text-2xl" : "text-3xl")}>{formatCurrency(calculation.totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] bg-white dark:bg-secondary/40 border border-slate-100 dark:border-border overflow-hidden relative shadow-sm">
          <CardContent className={cn(isMobileView ? "p-4" : "p-6")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">Số giao dịch</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className={cn("font-black text-slate-900 dark:text-white leading-none", isMobileView ? "text-2xl" : "text-3xl")}>{calculation.transactionCount}</p>
                  {onShowHistory && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowHistory();
                      }}
                      className="h-7 px-2 text-[10px] font-bold text-primary hover:text-primary/80 hover:bg-primary/5 transition-all uppercase tracking-widest bg-primary/5 rounded-lg relative z-30"
                    >
                      Xem lịch sử
                    </Button>
                  )}
                </div>
              </div>
              <div className={cn("rounded-2xl bg-primary/10 flex items-center justify-center", isMobileView ? "w-12 h-12" : "w-16 h-16")}>
                <ReceiptText className={cn("text-primary", isMobileView ? "w-6 h-6" : "w-8 h-8")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};