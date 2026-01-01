import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  name: string;
  is_creator: boolean;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  participants: string[];
  date: string | null;
}

interface Settlement {
  from: Member;
  to: Member;
  amount: number;
  id: string;
}

interface SettlementCalculatorProps {
  expenses: Expense[];
  members: Member[];
}

export const SettlementCalculator: React.FC<SettlementCalculatorProps> = ({ expenses, members }) => {
  const [settledTransactions, setSettledTransactions] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Calculate member balances
  const memberBalances = members.map(member => {
    const totalPaid = expenses
      .filter(expense => expense.paid_by === member.id)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    const totalOwed = expenses
      .filter(expense => expense.participants.includes(member.id))
      .reduce((sum, expense) => sum + (Number(expense.amount) / expense.participants.length), 0);

    return {
      member,
      balance: totalPaid - totalOwed
    };
  });

  // Calculate optimal settlements using greedy algorithm
  const calculateOptimalSettlements = (): Settlement[] => {
    const settlements: Settlement[] = [];
    const balances = [...memberBalances];
    
    // Sort by balance - creditors first (positive), then debtors (negative)
    balances.sort((a, b) => b.balance - a.balance);
    
    let creditorIndex = 0;
    let debtorIndex = balances.length - 1;
    
    while (creditorIndex < debtorIndex) {
      const creditor = balances[creditorIndex];
      const debtor = balances[debtorIndex];
      
      // Skip if already balanced
      if (Math.abs(creditor.balance) < 1000) {
        creditorIndex++;
        continue;
      }
      if (Math.abs(debtor.balance) < 1000) {
        debtorIndex--;
        continue;
      }
      
      // Calculate settlement amount
      const settlementAmount = Math.min(creditor.balance, Math.abs(debtor.balance));
      
      if (settlementAmount >= 1000) { // Only settle amounts >= 1000 VND
        settlements.push({
          from: debtor.member,
          to: creditor.member,
          amount: settlementAmount,
          id: `${debtor.member.id}-${creditor.member.id}-${settlementAmount}`
        });
        
        // Update balances
        creditor.balance -= settlementAmount;
        debtor.balance += settlementAmount;
      }
      
      // Move to next if current person is settled
      if (Math.abs(creditor.balance) < 1000) creditorIndex++;
      if (Math.abs(debtor.balance) < 1000) debtorIndex--;
    }
    
    return settlements;
  };

  const settlements = calculateOptimalSettlements();

  const toggleSettlement = (settlementId: string) => {
    const newSettled = new Set(settledTransactions);
    if (newSettled.has(settlementId)) {
      newSettled.delete(settlementId);
    } else {
      newSettled.add(settlementId);
    }
    setSettledTransactions(newSettled);
  };

  const unsettledAmount = settlements
    .filter(s => !settledTransactions.has(s.id))
    .reduce((sum, s) => sum + s.amount, 0);

  if (settlements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Tất cả đã cân bằng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tuyệt vời! Tất cả chi phí đã được chia đều và không cần thanh toán thêm.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Thanh toán cần thực hiện</span>
          <Badge variant="outline">
            {settlements.length - settledTransactions.size} giao dịch còn lại
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span>Tổng cần thanh toán:</span>
            <span className="font-medium">{formatCurrency(unsettledAmount)}</span>
          </div>
        </div>

        {/* Settlement List */}
        <div className="space-y-3">
          {settlements.map((settlement) => {
            const isSettled = settledTransactions.has(settlement.id);
            
            return (
              <div 
                key={settlement.id} 
                className={`p-4 border rounded-lg transition-all ${
                  isSettled ? 'bg-green-50 border-green-200 opacity-75' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">                  
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-medium">
                          {settlement.from.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{settlement.from.name}</span>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium">
                          {settlement.to.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{settlement.to.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold ${isSettled ? 'line-through text-muted-foreground' : ''}`}>
                      {formatCurrency(settlement.amount)}
                    </p>
                    {isSettled && (
                      <Badge variant="secondary" className="text-xs">
                        Đã thanh toán
                      </Badge>
                    )}
                  </div>
                </div>
                
                {!isSettled && (
                  <p className="text-xs text-muted-foreground mt-2 ml-9">
                    💡 {settlement.from.name} cần chuyển {formatCurrency(settlement.amount)} cho {settlement.to.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 mt-4 p-3 bg-muted/30 rounded-lg">
          <p><strong>Hướng dẫn:</strong></p>
          <p>• Danh sách trên cho thấy cách thanh toán tối ưu với ít giao dịch nhất</p>
          <p>• Đánh dấu ✓ khi giao dịch đã hoàn tất</p>
          <p>• Các số tiền đã được làm tròn để dễ thanh toán</p>
        </div>
      </CardContent>
    </Card>
  );
};