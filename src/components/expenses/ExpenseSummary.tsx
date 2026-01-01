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
}

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  calculation,
  onAddExpense,
  canAddExpense
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
          <h2 className={cn("font-bold text-slate-900", isMobileView ? "text-lg" : "text-xl")}>Chi phí</h2>
          {!isMobileView && <p className="text-slate-500 text-sm mt-1">Quản lý ngân sách và chi tiêu</p>}
        </div>
        {canAddExpense && (
          <Button
            onClick={onAddExpense}
            size={isMobileView ? "sm" : "default"}
            className="rounded-xl bg-[#6c5dd3] hover:bg-[#5b4ec2] text-white shadow-lg shadow-purple-100 flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {isMobileView ? "Thêm" : "Thêm chi phí"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-[#6c5dd3] to-[#8673f5] text-white overflow-hidden relative">
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

        <Card className="rounded-[24px] border-none shadow-sm bg-white border border-slate-100 overflow-hidden relative group hover:shadow-md transition-shadow">
          <CardContent className={cn(isMobileView ? "p-4" : "p-6")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số giao dịch</span>
                </div>
                <p className={cn("font-black text-slate-900", isMobileView ? "text-2xl" : "text-3xl")}>{calculation.transactionCount}</p>
              </div>
              <div className={cn("rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors", isMobileView ? "w-12 h-12" : "w-16 h-16")}>
                <ReceiptText className={cn("text-slate-300 group-hover:text-[#6c5dd3] transition-colors", isMobileView ? "w-6 h-6" : "w-8 h-8")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};