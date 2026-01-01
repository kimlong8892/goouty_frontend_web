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
        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">
          <ArrowDownLeft className="w-3 h-3" />
          <span>+{formatCurrency(net)}</span>
        </div>
      );
    } else if (net < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold">
          <ArrowUpRight className="w-3 h-3" />
          <span>{formatCurrency(net)}</span>
        </div>
      );
    }
    return (
      <div className="text-slate-400 bg-slate-50 px-3 py-1 rounded-full text-xs font-bold">
        Đã cân bằng
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", isMobileView && "space-y-3")}>
      <div className="flex items-center gap-2 px-1">
        <Wallet className="w-5 h-5 text-[#6c5dd3]" />
        <h3 className={cn("font-bold text-slate-900", isMobileView ? "text-base" : "text-lg")}>Cá nhân</h3>
      </div>
      <div className={cn("grid gap-3", isMobileView ? "grid-cols-1" : "grid-cols-2")}>
        {userBalances.map((userBalance) => {
          const isCurrentUser = user && userBalance.user.id === user.id;

          return (
            <div
              key={userBalance.userId}
              className={`p-4 rounded-[20px] border transition-all duration-200 flex flex-col gap-4 ${isCurrentUser
                ? 'border-[#6c5dd3]/20 bg-[#6c5dd3]/5 shadow-sm'
                : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm font-bold">
                      {userBalance.user.profilePicture && (
                        <AvatarImage src={userBalance.user.profilePicture} />
                      )}
                      <AvatarFallback className="bg-slate-100 text-[#6c5dd3]">
                        {(userBalance.user.fullName || userBalance.user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isCurrentUser && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#6c5dd3] rounded-full border-2 border-white flex items-center justify-center">
                        <UserIcon className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {userBalance.user.fullName || userBalance.user.email}
                      {isCurrentUser && ' (bạn)'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Đã chi: {formatCurrency(userBalance.totalPaid)}
                    </p>
                  </div>
                </div>
                {getBalanceBadge(userBalance.totalReceived, userBalance.totalPaidOut, userBalance.remaining)}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/50 p-2 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Phải thu</p>
                  <p className="text-xs font-bold text-green-600">
                    {formatCurrency(userBalance.totalReceived + (userBalance.remaining > 0 ? userBalance.remaining : 0))}
                  </p>
                </div>
                <div className="bg-white/50 p-2 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Phải trả</p>
                  <p className="text-xs font-bold text-red-600">
                    {formatCurrency(userBalance.totalPaidOut + (userBalance.remaining < 0 ? Math.abs(userBalance.remaining) : 0))}
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
