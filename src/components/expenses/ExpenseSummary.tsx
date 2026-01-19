import React from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { DollarSign, TrendingUp, Plus, ReceiptText, Scan, Upload, Camera, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { ExpenseCalculationResponse } from '@/types/expense';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';
import { api } from '@/integrations/api/client.ts';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ExpenseSummaryProps {
  calculation: ExpenseCalculationResponse;
  onAddExpense: (initialData?: { title: string; amount: string }) => void;
  canAddExpense: boolean;
  onShowHistory?: () => void;
}

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  calculation,
  onAddExpense,
  canAddExpense,
  onShowHistory
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [usage, setUsage] = React.useState<{ usedCount: number; dailyLimit: number; remaining: number } | null>(null);
  const { isPWA } = usePWA();
  const isMobile = useIsMobile();
  const isMobileView = isPWA || isMobile;

  const fetchUsage = async () => {
    try {
      const res = await api.ai.getUsage();
      if (res.success) {
        setUsage(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch AI usage:', error);
    }
  };

  React.useEffect(() => {
    if (canAddExpense) {
      fetchUsage();
    }
  }, [canAddExpense]);

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
      {/* Full-screen Loading Overlay */}
      {isScanning && createPortal(
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center animate-fade-in bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-card p-10 rounded-[48px] shadow-2xl flex flex-col items-center gap-8 border border-slate-100 dark:border-white/10 animate-slide-up mx-6 max-w-[400px]">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Scan className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">AI ĐANG QUÉT HÓA ĐƠN</h3>
              <p className="text-base text-slate-500 dark:text-muted-foreground font-medium px-2">
                Vui lòng đợi trong giây lát, Goouty đang trích xuất thông tin chi phí giúp bạn...
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className={cn("font-bold text-slate-900 dark:text-foreground", isMobileView ? "text-lg" : "text-xl")}>Chi phí</h2>
          {!isMobileView && <p className="text-slate-500 dark:text-muted-foreground text-sm mt-1">Quản lý ngân sách và chi tiêu</p>}
        </div>
        {canAddExpense && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => onAddExpense()}
              size={isMobileView ? "sm" : "default"}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 dark:shadow-none"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {isMobileView ? "Thêm" : "Thêm chi phí"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size={isMobileView ? "sm" : "default"}
                  disabled={isScanning || usage?.remaining === 0}
                  className="rounded-xl border-primary text-primary hover:bg-primary/5 shadow-lg shadow-primary/5 dark:shadow-none"
                >
                  {isScanning ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Scan className="w-4 h-4 mr-1.5" />
                  )}
                  {isMobileView ? "Quét HĐ" : "Quét hóa đơn"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] border-slate-100 dark:border-white/10 shadow-2xl z-[100]">
                <DropdownMenuItem
                  disabled={usage?.remaining === 0}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl py-2.5 px-3 focus:bg-primary/10 focus:text-primary cursor-pointer transition-all font-bold"
                >
                  <Upload className="w-4 h-4 mr-2.5" />
                  <span className="text-sm">Tải lên hóa đơn</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={usage?.remaining === 0}
                  onClick={() => cameraInputRef.current?.click()}
                  className="rounded-xl py-2.5 px-3 focus:bg-primary/10 focus:text-primary cursor-pointer transition-all font-bold"
                >
                  <Camera className="w-4 h-4 mr-2.5" />
                  <span className="text-sm">Chụp hóa đơn</span>
                </DropdownMenuItem>
                {usage && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/10 px-3 pb-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-muted-foreground uppercase tracking-widest font-black">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Hết hạn trong ngày</span>
                      </div>
                      <span className={cn(usage.remaining === 0 ? "text-red-500" : "text-primary")}>
                        {usage.remaining}/{usage.dailyLimit}
                      </span>
                    </div>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    setIsScanning(true);
                    const result = await api.ai.processBill(file);

                    if (result.success) {
                      toast.success('Xử lý hóa đơn thành công!');
                      fetchUsage();
                      onAddExpense({
                        title: result.data.name,
                        amount: result.data.total.toString()
                      });
                    }
                  } catch (error: any) {
                    const message = error.response?.data?.message || error.message || 'Không thể xử lý hóa đơn';
                    toast.error(message);
                    if (error.response?.status === 403) {
                      fetchUsage();
                    }
                  } finally {
                    setIsScanning(false);
                    if (e.target) e.target.value = '';
                  }
                }
              }}
            />
            <input
              type="file"
              ref={cameraInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    setIsScanning(true);
                    const result = await api.ai.processBill(file);

                    if (result.success) {
                      toast.success('Xử lý hóa đơn thành công!');
                      fetchUsage();
                      onAddExpense({
                        title: result.data.name,
                        amount: result.data.total.toString()
                      });
                    }
                  } catch (error: any) {
                    const message = error.response?.data?.message || error.message || 'Không thể xử lý hóa đơn';
                    toast.error(message);
                    if (error.response?.status === 403) {
                      fetchUsage();
                    }
                  } finally {
                    setIsScanning(false);
                    if (e.target) e.target.value = '';
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {usage?.remaining === 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-3 animate-fade-in">
          <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
            Bạn đã dùng hết 5 lượt quét hóa đơn AI trong ngày hôm nay.
          </p>
        </div>
      )}

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