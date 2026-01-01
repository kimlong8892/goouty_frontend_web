import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Users, Calendar, User, Edit, Trash2, Lock, Handshake, ReceiptText } from 'lucide-react';
import { api } from '@/integrations/api/client.ts';
import { DATABASE_TYPES } from '@/integrations/api/types.ts';
import { AddExpenseDialog } from '@/components/dialogs/AddExpenseDialog.tsx';
import { EditExpenseDialog } from '@/components/dialogs/EditExpenseDialog.tsx';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';

interface Member {
  id: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  role: string;
}

interface ExpenseListProps {
  tripId: string;
  isOwner: boolean;
  isMember?: boolean;
  onExpenseChange?: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  tripId,
  isOwner,
  isMember = false,
  onExpenseChange
}) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<DATABASE_TYPES.expenses[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<DATABASE_TYPES.expenses | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await api.expenses.getByTrip(tripId);
      setExpenses(data);
    } catch (error: any) {
      toast.error('Không thể tải danh sách chi phí');
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await api.members.getByTrip(tripId);
      setMembers(data);
    } catch (error: any) {
      console.error('Error fetching members:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchExpenses(), fetchMembers()]);
    };
    loadData();
  }, [tripId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  };

  const getPayerInfo = (payerId: string) => {
    const member = members.find(m => m.user.id === payerId);
    if (!member) return { name: 'Người dùng ẩn', profilePicture: null };
    const base = member.user.fullName || member.user.email;
    const name = base + (user?.id === member.user.id ? ' (bạn)' : '');
    return { name, profilePicture: member.user.profilePicture };
  };

  const getParticipantInfos = (participants: any[]) => {
    return participants.map((participant) => {
      const base = participant.user.fullName ?? participant.user.email;
      const name = base + (user?.id === participant.user.id ? ' (bạn)' : '');
      return { name, profilePicture: participant.user.profilePicture };
    });
  };

  const handleEditExpense = (expense: DATABASE_TYPES.expenses) => {
    setSelectedExpense(expense);
    setShowEditDialog(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chi phí này?')) {
      return;
    }

    try {
      await api.expenses.delete(expenseId);
      toast.success('Đã xóa chi phí thành công');
      fetchExpenses();
      onExpenseChange?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Không thể xóa chi phí');
    }
  };

  const canEditOrDelete = (expense: DATABASE_TYPES.expenses) => {
    if (!user) return false;
    if (expense.isLocked) return false;
    return isOwner || isMember || expense.payerId === user.id;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Chi tiết chi phí</h2>
        <div className="text-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6347f9] mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium tracking-wide font-bold uppercase text-[10px]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Lịch sử chi tiêu</h2>
        <Badge variant="outline" className="text-slate-400 border-slate-200 rounded-full px-3">
          {expenses.length} khoản chi
        </Badge>
      </div>

      {expenses.length === 0 ? (
        <Card className="rounded-[32px] border-2 border-dashed border-slate-100 shadow-none bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
              <ReceiptText className="w-8 h-8 text-indigo-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có chi phí nào</h3>
            <p className="text-slate-500 text-sm max-w-xs mb-8">
              Bắt đầu ghi lại các khoản chi tiêu để hệ thống tự động tính toán và chia sẻ chi phí.
            </p>
            {(isOwner || isMember) && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="rounded-xl bg-[#6347f9] hover:bg-[#5136db] text-white"
              >
                <Handshake className="w-4 h-4 mr-2" />
                Ghi chú chi phí ngay
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => {
            const payerInfo = getPayerInfo(expense.payerId);
            const participants = getParticipantInfos(expense.participants);

            return (
              <div
                key={expense.id}
                className={`group rounded-[24px] border transition-all duration-300 relative overflow-hidden ${expense.isLocked ? 'bg-slate-50/80 border-slate-100 opacity-90' : 'bg-white border-slate-100 hover:border-[#6347f9]/30 hover:shadow-xl hover:shadow-purple-500/5'
                  }`}
              >
                <div className="p-5 md:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-lg font-bold ${expense.isLocked ? 'text-slate-500' : 'text-slate-900 group-hover:text-[#6347f9] transition-colors'}`}>
                          {expense.title}
                        </h3>
                        {expense.isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      {expense.description && (
                        <p className="text-sm text-slate-400 leading-relaxed max-w-md">{expense.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className={`text-xl font-black ${expense.isLocked ? 'text-slate-400' : 'text-slate-900'}`}>
                        {formatCurrency(expense.amount)}
                      </p>
                      <div className="flex items-center gap-2">
                        {canEditOrDelete(expense) && !expense.isLocked && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditExpense(expense)}
                              className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#6347f9]"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="h-8 w-8 p-0 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Người chi</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8 border border-white shadow-sm font-bold">
                            {payerInfo.profilePicture && <AvatarImage src={payerInfo.profilePicture} />}
                            <AvatarFallback className="text-xs bg-slate-100 text-[#6347f9]">
                              {payerInfo.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-slate-700">{payerInfo.name}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 border-l border-slate-100 pl-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chia sẻ cho</span>
                        <div className="flex items-center -space-x-2">
                          {participants.slice(0, 4).map((p, i) => (
                            <Avatar key={i} className="w-8 h-8 border-2 border-white shadow-sm font-bold">
                              {p.profilePicture && <AvatarImage src={p.profilePicture} />}
                              <AvatarFallback className="text-xs bg-slate-50 text-slate-400">
                                {p.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {participants.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-400 z-10">
                              +{participants.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-[#6347f9]" />
                        <span className="text-[10px] font-bold text-[#6347f9]">{expense.participants.length} người</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddExpenseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        tripId={tripId}
        onSuccess={() => {
          fetchExpenses();
          onExpenseChange?.();
        }}
      />

      <EditExpenseDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        expense={selectedExpense}
        tripId={tripId}
        onSuccess={() => {
          fetchExpenses();
          onExpenseChange?.();
        }}
      />
    </div>
  );
};
