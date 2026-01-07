import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Plus, X, Calendar as CalendarIcon, User, Users, Wallet, DollarSign } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '@/integrations/api/client.ts';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';

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

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  onSuccess: () => void;
}

export const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({
  open,
  onOpenChange,
  tripId,
  onSuccess
}) => {
  const { user } = useAuth();
  const { isPWA } = usePWA();
  const isMobile = useIsMobile();
  const isMobileView = isPWA || isMobile;
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    payerId: '',
    participantIds: [] as string[]
  });
  const [amountByUserId, setAmountByUserId] = useState<Record<string, string>>({});
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      const data = await api.members.getByTrip(tripId);
      // Chỉ lấy những thành viên đã accepted để đưa vào chi phí
      setMembers(data.filter((m: any) => m && (m.status === 'accepted' || !m.status)));
    } catch (error: any) {
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, tripId]);

  useEffect(() => {
    if (open && user && members.length > 0) {
      const currentUserMember = members.find(m => m.user.id === user.id.toString());
      if (currentUserMember) {
        setFormData(prev => ({
          ...prev,
          payerId: currentUserMember.user.id,
          participantIds: [currentUserMember.user.id]
        }));
      } else if (members.length > 0) {
        setFormData(prev => ({
          ...prev,
          payerId: members[0].user.id,
          participantIds: [members[0].user.id]
        }));
      }
    }
  }, [open, user, members]);

  useEffect(() => {
    const total = Number(formData.amount || '0');
    const ids = formData.participantIds;
    if (!open || ids.length === 0 || !total) return;

    if (splitMethod === 'equal') {
      const totalInt = total;
      const n = ids.length;
      const base = Math.floor(totalInt / n);
      let remainder = totalInt - base * n;
      const next: Record<string, string> = {};
      ids.forEach((id) => {
        if (remainder > 0) {
          remainder -= 1;
          next[id] = (base + 1).toLocaleString('vi-VN');
        } else {
          next[id] = base.toLocaleString('vi-VN');
        }
      });
      setAmountByUserId(next);
      return;
    }
  }, [open, formData.participantIds.join('|'), formData.amount, splitMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tên chi phí';
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = 'Số tiền không hợp lệ';
    if (!formData.payerId) newErrors.payerId = 'Vui lòng chọn người trả';
    if (formData.participantIds.length === 0) newErrors.participants = 'Vui lòng chọn người tham gia';

    if (formData.participantIds.length > 1) {
      const total = Number(formData.amount || '0');
      const rawAmounts = formData.participantIds.map(id => Number((amountByUserId[id] || '0').toString().replace(/[^0-9]/g, '')));
      const sum = rawAmounts.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - total) > 1) {
        newErrors.allocations = `Tổng phân bổ phải bằng ${total.toLocaleString('vi-VN')}`;
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const rawAmounts = formData.participantIds.length === 1
        ? [Number(formData.amount)]
        : formData.participantIds.map(id => Number((amountByUserId[id] || '0').toString().replace(/[^0-9]/g, '')));

      await api.expenses.create({
        ...formData,
        amount: parseFloat(formData.amount),
        tripId,
        amounts: rawAmounts
      });

      toast.success('Đã thêm chi phí thành công');
      onOpenChange(false);
      onSuccess();
      // Reset form
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        payerId: '',
        participantIds: []
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thêm chi phí');
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(userId)
        ? prev.participantIds.filter(id => id !== userId)
        : [...prev.participantIds, userId]
    }));
  };

  const formatCurrencyInput = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    const num = Number(digits || '0');
    return num.toLocaleString('vi-VN');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-md bg-white rounded-[32px] border-none shadow-2xl p-0 overflow-hidden flex flex-col",
        isMobileView ? "h-full w-full max-w-none rounded-none" : "max-h-[90vh]"
      )}>
        <DialogHeader className={cn("p-6 pb-2 flex-shrink-0", isMobileView && "px-4 pt-4")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6347f9]/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#6347f9]" />
            </div>
            <DialogTitle className={cn("font-bold text-slate-900", isMobileView ? "text-lg" : "text-xl")}>
              Thêm chi phí
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={cn("flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar", isMobileView ? "px-4" : "px-8")}>
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên chi phí</Label>
              <Input
                id="title"
                className={cn(
                  "h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#6347f9] font-bold text-slate-900",
                  errors.title ? 'border-red-500' : ''
                )}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Ăn tối, Tiền phòng..."
              />
              {errors.title && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mô tả</Label>
              <Input
                id="description"
                className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#6347f9] font-medium text-slate-700"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ghi chú thêm (không bắt buộc)"
              />
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 text-center sm:text-left">
                <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block sm:inline">Số tiền (VNĐ)</Label>
                <Input
                  className={cn(
                    "h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#6347f9] font-black text-slate-900",
                    errors.amount ? 'border-red-500' : ''
                  )}
                  value={formatCurrencyInput(formData.amount)}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block sm:inline">Ngày</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-bold rounded-xl border-slate-200 focus:ring-2 focus:ring-[#6347f9] hover:bg-transparent hover:text-slate-900 px-3",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                      {formData.date ? (
                        format(new Date(formData.date + 'T00:00:00'), "dd/MM/yyyy")
                      ) : (
                        <span>Chọn ngày</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date + 'T00:00:00') : undefined}
                      onSelect={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Payer */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Người trả</Label>
              <Select value={formData.payerId} onValueChange={(v) => setFormData({ ...formData, payerId: v })}>
                <SelectTrigger className={cn(
                  "h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#6347f9] font-bold text-slate-700",
                  errors.payerId ? 'border-red-500' : ''
                )}>
                  <SelectValue placeholder="Chọn người trả" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[250px]">
                  {members.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id.toString()} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={m.user.profilePicture} />
                          <AvatarFallback className="text-[8px] bg-slate-100 text-slate-500 uppercase font-bold">{(m.user.fullName || m.user.email).charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold">{m.user.fullName || m.user.email} {user?.id === m.user.id && '(bạn)'}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Participants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tham gia</Label>
                {errors.participants && <span className="text-[10px] text-red-500 font-bold uppercase">{errors.participants}</span>}
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-1 max-h-[160px] overflow-y-auto space-y-0.5 shadow-inner custom-scrollbar">
                {members.map((m) => (
                  <label key={m.user.id} className="flex items-center justify-between p-2.5 hover:bg-white rounded-xl cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 font-bold border-2 border-white shadow-sm ring-1 ring-slate-100">
                        <AvatarImage src={m.user.profilePicture} />
                        <AvatarFallback className="bg-white text-[#6347f9]">{(m.user.fullName || m.user.email).charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{m.user.fullName || m.user.email} {user?.id === m.user.id && '(bạn)'}</span>
                    </div>
                    <Checkbox
                      checked={formData.participantIds.includes(m.user.id.toString())}
                      onCheckedChange={() => toggleParticipant(m.user.id.toString())}
                      className="rounded-full h-5 w-5 border-slate-200 data-[state=checked]:bg-[#6347f9] data-[state=checked]:border-[#6347f9] transition-all"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Allocation */}
            {formData.participantIds.length > 1 && (
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Phân bổ chi phí</Label>
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-50">
                  <div className="max-h-[180px] overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                    {formData.participantIds.map((pid) => {
                      const m = members.find(mm => mm.user.id === pid);
                      if (!m) return null;
                      return (
                        <div key={pid} className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 border-2 border-white shadow-sm">
                              <AvatarImage src={m.user.profilePicture} />
                              <AvatarFallback className="text-[8px] bg-slate-50 text-slate-400 uppercase">{(m.user.fullName || m.user.email).charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-slate-600 truncate max-w-[100px]">{m.user.fullName || m.user.email}</span>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-28 h-8 text-right pr-3 text-xs font-black text-[#6347f9] border-none focus:ring-1 focus:ring-purple-200 rounded-lg bg-slate-50/50"
                            value={(amountByUserId[pid] ?? '').toString()}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/[^0-9]/g, '');
                              setAmountByUserId(prev => ({ ...prev, [pid]: Number(digits || '0').toLocaleString('vi-VN') }));
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                {errors.allocations && <p className="text-[10px] text-red-500 font-bold text-right mr-1">{errors.allocations}</p>}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className={cn("p-6 pt-2 border-t border-slate-50 bg-white flex-shrink-0", isMobileView && "px-4 pb-4")}>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-[2] h-12 rounded-2xl bg-[#6347f9] hover:bg-[#5136db] text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-purple-200 transition-all active:scale-[0.98] disabled:opacity-50"
              disabled={loading || membersLoading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Thêm chi phí'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};