import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Edit3, X, Calendar as CalendarIcon, User, Users, Wallet, Check, ChevronLeft, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '@/integrations/api/client.ts';
import { DATABASE_TYPES } from '@/integrations/api/types.ts';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
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

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: DATABASE_TYPES.expenses | null;
  tripId: string;
  onSuccess: () => void;
}

export const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({
  open,
  onOpenChange,
  expense,
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
    date: '',
    description: '',
    payerId: '',
    participantIds: [] as string[]
  });
  const [amountByUserId, setAmountByUserId] = useState<Record<string, string>>({});
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');

  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      const data = await api.members.getByTrip(tripId);
      // Chỉ lấy những thành viên đã accepted để đưa vào chi phí (sync with AddExpenseDialog)
      setMembers(data.filter((m: any) => m && (m.status === 'accepted' || !m.status)));
    } catch (error: any) {
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (expense && open) {
      const payerId = expense.payerId?.toString() || '';
      const participantIds = expense.participants?.map(p => p.user.id.toString()) || [];

      setFormData({
        title: expense.title,
        amount: expense.amount.toString(),
        date: expense.date.split('T')[0],
        description: expense.description || '',
        payerId: payerId,
        participantIds: participantIds
      });

      if (expense.participants && expense.participants.length > 0) {
        const amounts = expense.participants.map(p => (p as any).amount || 0);
        const firstAmount = amounts[0];
        const allEqual = amounts.every(amount => amount === firstAmount);

        if (allEqual) {
          setSplitMethod('equal');
        } else {
          setSplitMethod('custom');
          const amountMap: Record<string, string> = {};
          expense.participants.forEach(p => {
            amountMap[p.user.id.toString()] = ((p as any).amount || 0).toLocaleString('vi-VN');
          });
          setAmountByUserId(amountMap);
        }
      } else {
        setSplitMethod('equal');
        setAmountByUserId({});
      }
    }
  }, [expense, open]);

  // Ensure payerId is still set correctly once members are loaded
  // This handles the timing issue where Select might clear its value if options are not yet available
  useEffect(() => {
    if (open && expense && members.length > 0 && !formData.payerId) {
      setFormData(prev => ({
        ...prev,
        payerId: expense.payerId.toString()
      }));
    }
  }, [members, open, expense]);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, tripId]);

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
    if (!expense) return;

    if (!formData.title.trim() || !formData.amount || !formData.payerId) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (formData.participantIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người tham gia');
      return;
    }

    const total = Number(formData.amount || '0');
    const rawAmounts = formData.participantIds.map(id => Number((amountByUserId[id] || '0').toString().replace(/[^0-9]/g, '')));
    const sum = rawAmounts.reduce((a, b) => a + b, 0);

    if (Math.abs(sum - total) > 1) { // allow for small rounding differences in VND
      toast.error(`Tổng phân bổ (${sum.toLocaleString('vi-VN')}) phải bằng số tiền (${total.toLocaleString('vi-VN')})`);
      return;
    }

    setLoading(true);
    try {
      await api.expenses.update(expense.id, {
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
        payerId: formData.payerId,
        participantIds: formData.participantIds,
        amounts: rawAmounts
      });

      toast.success('Đã cập nhật chi phí thành công');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật chi phí');
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
    if (!raw) return '';
    const digits = raw.replace(/[^0-9]/g, '');
    const num = Number(digits || '0');
    if (num === 0) return '';
    return num.toLocaleString('vi-VN');
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-md bg-white dark:bg-card rounded-[32px] border-none shadow-2xl p-0 overflow-hidden flex flex-col z-[3100]",
        isMobileView ? "h-full w-full max-w-none rounded-none [&>button]:hidden bg-background dark:bg-background" : "max-h-[90vh]"
      )}>
        {isMobileView ? (
          <div className="sticky top-0 z-50 bg-background px-4 py-3 flex items-center justify-between border-b border-border/50">
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all outline-none"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-base font-black absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-slate-900 dark:text-white">
              Chỉnh sửa chi phí
            </h1>
            <div className="w-10"></div>
          </div>
        ) : (
          <DialogHeader className={cn("p-6 pb-2 flex-shrink-0", isMobileView && "px-4 pt-4")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className={cn("font-bold text-slate-900 dark:text-foreground", isMobileView ? "text-lg" : "text-xl")}>
                Chỉnh sửa chi phí
              </DialogTitle>
            </div>
          </DialogHeader>
        )}

        <form onSubmit={handleSubmit} className={cn("flex-1 overflow-y-auto py-4 custom-scrollbar", isMobileView ? "px-5 pt-6 pb-32" : "px-8 space-y-6")}>
          <div className={cn(isMobileView ? "w-full max-w-md mx-auto space-y-6" : "space-y-4")}>
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className={cn(
                "font-medium ml-1",
                isMobileView ? "text-muted-foreground text-sm" : "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground"
              )}>
                Tên chi phí <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                className={cn(
                  "rounded-xl border-slate-200 dark:border-border bg-white dark:bg-secondary focus:ring-2 focus:ring-primary font-bold text-slate-900 dark:text-foreground transition-all",
                  isMobileView ? "h-14 rounded-2xl bg-card border-input focus:ring-primary/20 text-base" : "h-12"
                )}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={isMobileView ? "Ví dụ: Ăn tối tại Đà Lạt" : "VD: Khách sạn, Tiền xăng..."}
              />
            </div>

            {/* Description is now lower in AddExpensePage, let's keep it here for now or move it to end */}

            {/* Amount and Date */}
            <div className={cn("grid gap-4", isMobileView ? "grid-cols-2" : "grid-cols-2 gap-3")}>
              <div className="space-y-2">
                <Label htmlFor="amount" className={cn(
                  "font-medium ml-1",
                  isMobileView ? "text-muted-foreground text-sm" : "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground"
                )}>
                  Số tiền (VNĐ) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    inputMode="numeric"
                    className={cn(
                      "rounded-xl border-slate-200 dark:border-border bg-white dark:bg-secondary focus:ring-2 focus:ring-primary font-black text-slate-900 dark:text-foreground transition-all",
                      isMobileView ? "h-14 rounded-2xl bg-card border-input focus:ring-primary/20 pr-12 text-base" : "h-12"
                    )}
                    value={formatCurrencyInput(formData.amount)}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="0"
                  />
                  {isMobileView && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">đ</span>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className={cn(
                  "font-medium ml-1",
                  isMobileView ? "text-muted-foreground text-sm" : "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground"
                )}>
                  Ngày <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left rounded-xl border-slate-200 dark:border-border bg-white dark:bg-secondary focus:ring-2 focus:ring-primary hover:bg-transparent hover:text-slate-900 dark:hover:text-foreground px-3 transition-all",
                        isMobileView ? "h-14 rounded-2xl bg-card border-input hover:bg-card/80 text-base font-normal" : "h-12 font-bold",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className={cn("mr-2 h-4 w-4 text-slate-500", isMobileView && "opacity-50")} />
                      {formData.date ? (
                        format(new Date(formData.date + 'T00:00:00'), "dd/MM/yyyy", isMobileView ? { locale: vi } : undefined)
                      ) : (
                        <span>Chọn ngày</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[4000]" align="start">
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
            <div className="space-y-2">
              <Label className={cn(
                "font-medium ml-1",
                isMobileView ? "text-muted-foreground text-sm" : "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground"
              )}>Người trả tiền</Label>
              <Select value={formData.payerId} onValueChange={(v) => setFormData({ ...formData, payerId: v })}>
                <SelectTrigger className={cn(
                  "rounded-xl border-slate-200 dark:border-border bg-white dark:bg-secondary text-slate-700 dark:text-foreground transition-all",
                  isMobileView ? "h-14 rounded-2xl bg-card border-input focus:ring-primary/20 text-base font-medium" : "h-12 font-bold"
                )}>
                  <SelectValue placeholder="Chọn người trả" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 dark:border-border bg-white dark:bg-popover shadow-xl z-[4000]">
                  {members.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id.toString()} className="rounded-xl py-3 px-3 m-1">
                      <div className="flex items-center gap-3">
                        <Avatar className={cn("shrink-0", isMobileView ? "w-8 h-8 ring-2 ring-primary/10" : "w-5 h-5")}>
                          <AvatarImage src={m.user.profilePicture} />
                          <AvatarFallback className={cn("bg-primary/10 text-primary font-bold uppercase", isMobileView ? "text-[10px]" : "text-[8px]")}>
                            {(m.user.fullName || m.user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={cn("font-semibold", isMobileView ? "text-sm" : "text-xs")}>{m.user.fullName || m.user.email} {user?.id === m.user.id && '(bạn)'}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Participants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <Label className={cn(
                  "font-medium",
                  isMobileView ? "text-muted-foreground text-sm" : "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground"
                )}>Người cùng tham gia</Label>
                <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {formData.participantIds.length} người
                </span>
              </div>
              <div className={cn(
                "border rounded-2xl p-2 overflow-y-auto space-y-1 custom-scrollbar transition-all",
                isMobileView ? "bg-card/50 border-input max-h-[220px] ring-1 ring-border/5" : "bg-slate-50/50 dark:bg-secondary/30 border-slate-100 dark:border-border max-h-[160px] p-1 space-y-0.5 shadow-inner"
              )}>
                {members.map((m) => (
                  <label key={m.user.id} className={cn(
                    "flex items-center justify-between hover:bg-primary/5 rounded-2xl cursor-pointer transition-all group",
                    isMobileView ? "p-3" : "p-2.5"
                  )}>
                    <div className="flex items-center gap-3">
                      <Avatar className={cn(
                        "shrink-0 font-bold border-2 border-white dark:border-border shadow-sm ring-1 ring-slate-100 dark:ring-border",
                        isMobileView ? "w-9 h-9" : "w-8 h-8"
                      )}>
                        <AvatarImage src={m.user.profilePicture} />
                        <AvatarFallback className="bg-white dark:bg-secondary text-primary">{(m.user.fullName || m.user.email).charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className={cn("font-semibold text-foreground/90 transition-colors", isMobileView ? "text-sm" : "text-xs")}>{m.user.fullName || m.user.email} {user?.id === m.user.id && '(bạn)'}</span>
                    </div>
                    <Checkbox
                      checked={formData.participantIds.includes(m.user.id.toString())}
                      onCheckedChange={() => toggleParticipant(m.user.id.toString())}
                      className={cn(
                        "rounded-full border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all",
                        isMobileView ? "h-6 w-6" : "h-5 w-5"
                      )}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Allocation */}
            {formData.participantIds.length > 1 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  {isMobileView && <Info className="w-3.5 h-3.5 text-primary" />}
                  <Label className={cn(
                    "font-medium ml-1",
                    isMobileView ? "text-muted-foreground text-sm" : "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground"
                  )}>Chia tiền chi tiết</Label>
                </div>
                <div className={cn(
                  "border rounded-2xl overflow-hidden shadow-sm transition-all",
                  isMobileView ? "bg-card border-input" : "bg-white dark:bg-card border-slate-100 dark:border-border ring-1 ring-slate-50 dark:ring-border"
                )}>
                  <div className={cn(
                    "overflow-y-auto divide-y custom-scrollbar",
                    isMobileView ? "max-h-[200px] divide-border" : "max-h-[180px] divide-slate-50 dark:divide-border"
                  )}>
                    {formData.participantIds.map((pid) => {
                      const m = members.find(mm => mm.user.id === pid);
                      if (!m) return null;
                      return (
                        <div key={pid} className={cn(
                          "flex items-center justify-between hover:bg-primary/5 transition-colors",
                          isMobileView ? "p-4" : "p-3.5"
                        )}>
                          <div className="flex items-center gap-3">
                            <Avatar className={cn(
                              "shrink-0 border-2 border-white dark:border-border shadow-sm",
                              isMobileView ? "w-7 h-7 ring-1 ring-input" : "w-6 h-6"
                            )}>
                              <AvatarImage src={m.user.profilePicture} />
                              <AvatarFallback className={cn("font-bold uppercase", isMobileView ? "text-[10px] bg-muted" : "text-[8px] bg-slate-50 dark:bg-secondary text-slate-400 dark:text-muted-foreground")}>
                                {(m.user.fullName || m.user.email).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className={cn("font-bold text-foreground/70 truncate", isMobileView ? "text-xs max-w-[120px]" : "text-xs max-w-[100px]")}>{m.user.fullName || m.user.email}</span>
                          </div>
                          <div className={cn(
                            "flex items-center transition-all",
                            isMobileView ? "gap-1.5 bg-muted/50 px-3 py-1.5 rounded-xl border border-input/50 focus-within:ring-1 focus-within:ring-primary/30" : ""
                          )}>
                            <input
                              type="text"
                              inputMode="numeric"
                              className={cn(
                                "text-right font-black text-primary border-none focus:ring-0 p-0 transition-all",
                                isMobileView ? "w-24 text-xs bg-transparent" : "w-28 h-8 pr-3 text-xs rounded-lg bg-slate-50/50 dark:bg-secondary/50 dark:placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/20"
                              )}
                              value={(amountByUserId[pid] ?? '').toString()}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/[^0-9]/g, '');
                                setAmountByUserId(prev => ({ ...prev, [pid]: Number(digits || '0').toLocaleString('vi-VN') }));
                              }}
                            />
                            {isMobileView && <span className="text-[10px] font-black text-primary">đ</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="px-1 flex justify-between items-center">
                  <span className={cn(
                    "font-bold uppercase tracking-widest leading-none",
                    isMobileView ? "text-[10px] text-muted-foreground" : "text-[10px] text-slate-400 dark:text-muted-foreground"
                  )}>Tổng phải bằng:</span>
                  <span className={cn(
                    "font-black leading-none",
                    isMobileView ? "text-xs text-primary" : "text-[10px] text-slate-900 dark:text-foreground"
                  )}>{formatCurrencyInput(formData.amount)} VNĐ</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className={cn(
                "font-medium ml-1",
                isMobileView ? "text-muted-foreground text-sm" : "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground"
              )}>
                Mô tả chi tiết (tùy chọn)
              </Label>
              {isMobileView ? (
                <Textarea
                  id="description"
                  placeholder="Ăn tối, quà cáp, tiền vé..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="min-h-[100px] rounded-2xl bg-card border-input resize-none transition-all px-4 py-3 text-base dark:bg-secondary"
                />
              ) : (
                <Input
                  id="description"
                  className="h-12 rounded-xl border-slate-200 dark:border-border bg-white dark:bg-secondary focus:ring-2 focus:ring-primary font-medium text-slate-700 dark:text-foreground/90"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập ghi chú thêm..."
                />
              )}
            </div>

            {/* Bottom Button inside scroll area for PWA */}
            {isMobileView && (
              <div className="pt-2 flex justify-center pb-20">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || membersLoading}
                  className="w-fit min-w-[200px] h-12 px-10 rounded-full text-base font-black bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_8px_25px_-5px_rgba(99,102,241,0.5)] active:scale-[0.96] transition-all duration-300 border-none relative overflow-hidden group"
                >
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <span>Lưu thay đổi</span>
                      </>
                    )}
                  </div>
                  {/* Shine Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] transition-transform pointer-events-none" />
                </Button>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        {!isMobileView && (
          <div className={cn("p-6 pt-2 border-t border-slate-50 dark:border-border bg-white dark:bg-card flex-shrink-0")}>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-muted-foreground hover:text-primary hover:bg-transparent border border-transparent hover:border-primary transition-all"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-[2] h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
                disabled={loading || membersLoading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Cập nhật chi phí'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog >
  );
};
