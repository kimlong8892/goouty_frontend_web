import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { UserBalance } from '@/types/expense';
import { Wallet, ArrowDownLeft, ArrowUpRight, User as UserIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';

interface PersonalBalanceProps {
  userBalances: UserBalance[];
}

export const PersonalBalance: React.FC<PersonalBalanceProps> = ({ userBalances }) => {
  const { user } = useAuth();
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

  const getBalanceBadge = (totalReceived: number, totalPaidOut: number, remaining?: number) => {
    const net = remaining !== undefined ? remaining : 0;

    if (net > 0) {
      return (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 bg-white dark:bg-amber-500/10 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-amber-100 dark:border-amber-500/20">
          <ArrowDownLeft className="w-3 h-3" />
          <span>+{formatCurrency(net)}</span>
        </div>
      );
    } else if (net < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-500 bg-white dark:bg-red-500/10 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-red-100 dark:border-red-500/20">
          <ArrowUpRight className="w-3 h-3" />
          <span>{formatCurrency(net)}</span>
        </div>
      );
    }
    return (
      <div className="text-green-600 dark:text-green-500 bg-white dark:bg-green-500/10 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border border-green-100 dark:border-green-500/20">
        Đã cân bằng
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", isMobileView && "space-y-3")}>
      <div className="flex items-center gap-2 px-1">
        <Wallet className="w-5 h-5 text-primary" />
        <h3 className={cn("font-bold text-slate-900 dark:text-white", isMobileView ? "text-base" : "text-lg")}>Tổng quan nhóm</h3>
      </div>
      <div className={cn("grid gap-3", isMobileView ? "grid-cols-1" : "grid-cols-2")}>
        {userBalances.map((userBalance) => {
          const isCurrentUser = user && userBalance.user.id === user.id;

          return (
            <div
              key={userBalance.userId}
              className={cn(
                "p-4 rounded-[20px] border transition-all duration-200 flex flex-col gap-4",
                isCurrentUser
                  ? "border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm dark:border-primary/30"
                  : "border-slate-100 bg-white dark:bg-card/50 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className={cn("border-2 border-white dark:border-slate-800 shadow-sm font-bold", isMobileView ? "w-12 h-12" : "w-14 h-14")}>
                      {userBalance.user.profilePicture && (
                        <AvatarImage src={userBalance.user.profilePicture} />
                      )}
                      <AvatarFallback className={cn("bg-slate-100 dark:bg-slate-800 text-primary", isMobileView ? "text-sm" : "text-base")}>
                        {(userBalance.user.fullName || userBalance.user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isCurrentUser && (
                      <div className={cn("absolute -top-1 -right-1 bg-primary rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center", isMobileView ? "w-4 h-4" : "w-5 h-5")}>
                        <UserIcon className={cn("text-white", isMobileView ? "w-2 h-2" : "w-3 h-3")} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={cn("font-bold text-slate-900 dark:text-white", isMobileView ? "text-base" : "text-lg")}>
                      {userBalance.user.fullName || userBalance.user.email}
                      {isCurrentUser && ' (bạn)'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      Đã chi: {formatCurrency(userBalance.totalPaid)}
                    </p>
                  </div>
                </div>
                {getBalanceBadge(userBalance.totalReceived, userBalance.totalPaidOut, userBalance.remaining)}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/50 dark:bg-white/5 p-2 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">Phải thu</p>
                  <p className="text-xs font-bold text-green-600 dark:text-green-500">
                    {formatCurrency(userBalance.remaining !== undefined && userBalance.remaining > 0 ? userBalance.remaining : 0)}
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-white/5 p-2 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">Phải trả</p>
                  <p className="text-xs font-bold text-red-600 dark:text-red-500">
                    {formatCurrency(userBalance.remaining !== undefined && userBalance.remaining < 0 ? Math.abs(userBalance.remaining) : 0)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
