import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { api } from '@/integrations/api/client.ts';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import {
    ChevronLeft,
    Calendar as CalendarIcon,
    Plus,
    Info,
    DollarSign,
    Users,
    Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';

interface Member {
    id: string;
    user: {
        id: string;
        email: string;
        fullName: string;
        profilePicture?: string;
    };
    role: string;
    status: string;
}

const PWAAddExpensePage = () => {
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { showToast } = useGlobalToast();
    const showContent = useAnimateIn(false, 300);
    const initialData = location.state?.initialData;

    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
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

    useEffect(() => {
        document.title = 'Thêm chi phí mới - Goouty';
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [authLoading, isAuthenticated, navigate]);

    useEffect(() => {
        const draftKey = `expense_draft_${tripId}`;
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
            try {
                const { formData: savedForm, amountByUserId: savedAmounts, splitMethod: savedSplit } = JSON.parse(savedDraft);
                if (savedForm) {
                    setFormData(prev => ({ ...prev, ...savedForm }));
                }
                if (savedAmounts) {
                    setAmountByUserId(savedAmounts);
                }
                if (savedSplit) {
                    setSplitMethod(savedSplit);
                }
            } catch (e) {
                console.error('Error parsing draft:', e);
            }
        }
    }, [tripId]);

    useEffect(() => {
        if (tripId) {
            const draftKey = `expense_draft_${tripId}`;
            const dataToSave = {
                formData,
                amountByUserId,
                splitMethod
            };
            localStorage.setItem(draftKey, JSON.stringify(dataToSave));
        }
    }, [formData, amountByUserId, splitMethod, tripId]);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!tripId) return;
            try {
                setMembersLoading(true);
                const data = await api.members.getByTrip(tripId);
                const acceptedMembers = data.filter((m: any) => m && (m.status === 'accepted' || !m.status));
                setMembers(acceptedMembers);

                // Only set default payer if not already set (e.g. from draft)
                setFormData(prev => {
                    if (prev.payerId && prev.participantIds.length > 0) return prev;

                    if (user && acceptedMembers.length > 0) {
                        const currentUserMember = acceptedMembers.find((m: any) => m.user.id === user.id.toString());
                        if (currentUserMember) {
                            return {
                                ...prev,
                                payerId: currentUserMember.user.id,
                                participantIds: [currentUserMember.user.id]
                            };
                        } else {
                            return {
                                ...prev,
                                payerId: acceptedMembers[0].user.id,
                                participantIds: [acceptedMembers[0].user.id]
                            };
                        }
                    }
                    return prev;
                });
            } catch (error: any) {
                console.error('Fetch members error:', error);
                showToast('Không thể tải danh sách thành viên', 'error');
            } finally {
                setMembersLoading(false);
            }
        };

        if (isAuthenticated && tripId) {
            fetchMembers();

            // Completely clear all fields
            setFormData({
                title: initialData?.title || '',
                amount: initialData?.amount || '',
                date: '',
                description: '',
                payerId: '',
                participantIds: [] as string[]
            });
            setAmountByUserId({});
            setSplitMethod('equal');
        }
    }, [tripId, isAuthenticated, user, initialData]);

    useEffect(() => {
        // Skip auto-calculation if we just loaded a draft that has specific amounts
        // We can detect this if amountByUserId is populated but we haven't touched anything yet?
        // Actually, the dependency array [formData.participantIds, formData.amount, splitMethod] handles changes.
        // If we load from draft, formData and amountByUserId are set. 
        // We need to ensure we don't overwrite the loaded amountByUserId with a fresh 'equal' split calculation 
        // unless the user triggers it.
        // Simple heuristic: If amountByUserId is empty, it's safe to calc. 
        // If it's not empty, we assume it's correct (either from draft or user edit).
        // But if user changes amount, we DO want to recalc.

        // Better: this effect runs when amount changes. If we load draft, amount changes. 
        // We probably need to allow this effect to run, but if we loaded a draft with 'equal' split, 
        // the calculation will just reproduce the same result.
        // If we loaded a 'custom' split (which we didn't save explicitly in splitMethod state yet, wait),
        // we should save splitMethod too?
        // The component doesn't have splitMethod persistence in my proposed code. I should add `splitMethod` to saved state.

        const total = Number(formData.amount || '0');
        const ids = formData.participantIds;
        if (ids.length === 0 || !total) return;

        // Only auto-distribute if we are in 'equal' mode
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
            // Only update if different to avoid loops or overwriting manual tweaks that shouldn't happen in equal mode
            /* 
               Actually, for simplicity, let's just let it run. 
               If the draft had 'equal' split resulting values, this will calculate the same values.
            */
            setAmountByUserId(next);
        }
    }, [formData.participantIds.join('|'), formData.amount, splitMethod]);

    const formatCurrencyInput = (raw: string) => {
        if (!raw) return '';
        const digits = raw.replace(/[^0-9]/g, '');
        const num = Number(digits || '0');
        if (num === 0) return '';
        return num.toLocaleString('vi-VN');
    };

    const toggleParticipant = (userId: string) => {
        setFormData(prev => ({
            ...prev,
            participantIds: prev.participantIds.includes(userId)
                ? prev.participantIds.filter(id => id !== userId)
                : [...prev.participantIds, userId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tripId) return;

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
        if (Object.keys(newErrors).length > 0) {
            return;
        }

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

            showToast('Đã thêm chi phí thành công', 'success');
            // Clear draft
            const draftKey = `expense_draft_${tripId}`;
            localStorage.removeItem(draftKey);

            navigate(-1);
        } catch (error: any) {
            console.error('Add expense error:', error);
            showToast(error.message || 'Không thể thêm chi phí', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || membersLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-full bg-background flex flex-col relative text-foreground overflow-hidden">
            <AnimatedTransition show={showContent} animation="slide-up">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border/50">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-foreground/80 hover:text-foreground active:scale-95 transition-transform rounded-full hover:bg-muted"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
                        Thêm chi phí
                    </h1>
                </div>

                {/* Content */}
                <div className="flex-1 px-5 pt-6 pb-10 overflow-y-auto">
                    <div className="w-full max-w-md mx-auto space-y-8">


                        {/* Form Fields */}
                        <div className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-muted-foreground text-sm font-medium ml-1">
                                    Tên chi phí <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="Ví dụ: Ăn tối tại Đà Lạt"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={cn(
                                        "h-14 rounded-2xl bg-card border-input focus:ring-primary/20 transition-all text-base",
                                        errors.title && "border-destructive focus-visible:ring-destructive/20"
                                    )}
                                />
                                {errors.title && (
                                    <p className="text-xs text-destructive ml-1">{errors.title}</p>
                                )}
                            </div>

                            {/* Amount and Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-muted-foreground text-sm font-medium ml-1">
                                        Số tiền <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="amount"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={formatCurrencyInput(formData.amount)}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/[^0-9]/g, '') })}
                                            className={cn(
                                                "h-14 rounded-2xl bg-card border-input focus:ring-primary/20 transition-all font-bold pr-12 text-base",
                                                errors.amount && "border-destructive focus-visible:ring-destructive/20"
                                            )}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">đ</span>
                                    </div>
                                    {errors.amount && (
                                        <p className="text-xs text-destructive ml-1">{errors.amount}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date" className="text-muted-foreground text-sm font-medium ml-1">
                                        Ngày chi <span className="text-red-500">*</span>
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full h-14 justify-start text-left font-normal rounded-2xl bg-card border-input hover:bg-card/80 transition-all text-base",
                                                    !formData.date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                                {formData.date ? format(new Date(formData.date + 'T00:00:00'), "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
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
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm font-medium ml-1">Người trả tiền</Label>
                                <Select value={formData.payerId} onValueChange={(v) => setFormData({ ...formData, payerId: v })}>
                                    <SelectTrigger className={cn(
                                        "h-14 rounded-2xl bg-card border-input focus:ring-primary/20 transition-all text-base [&>span]:flex [&>span]:items-center [&>span]:line-clamp-none",
                                        errors.payerId && "border-destructive focus-visible:ring-destructive/20"
                                    )}>
                                        <SelectValue placeholder="Chọn người trả" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border bg-popover shadow-xl z-50">
                                        {members.map((m) => (
                                            <SelectItem key={m.user.id} value={m.user.id.toString()} className="rounded-xl py-3 px-3 m-1">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8 shrink-0 ring-2 ring-primary/10">
                                                        <AvatarImage src={m.user.profilePicture} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                                            {(m.user.fullName || m.user.email).charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-semibold">{m.user.fullName || m.user.email} {user?.id === m.user.id && '(bạn)'}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Participants */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between ml-1">
                                    <Label className="text-muted-foreground text-sm font-medium">Người cùng tham gia</Label>
                                    {errors.participants && <span className="text-[10px] text-destructive font-bold uppercase">{errors.participants}</span>}
                                </div>
                                <div className="bg-card/50 border border-input rounded-2xl p-2 max-h-[220px] overflow-y-auto space-y-1 custom-scrollbar ring-1 ring-border/5">
                                    {members.map((m) => (
                                        <label key={m.user.id} className="flex items-center justify-between p-3 hover:bg-primary/5 rounded-2xl cursor-pointer transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-9 h-9 shrink-0 border-2 border-background shadow-sm ring-1 ring-input">
                                                    <AvatarImage src={m.user.profilePicture} />
                                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                                                        {(m.user.fullName || m.user.email).charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-semibold text-foreground/90">{m.user.fullName || m.user.email}</span>
                                            </div>
                                            <Checkbox
                                                checked={formData.participantIds.includes(m.user.id.toString())}
                                                onCheckedChange={() => toggleParticipant(m.user.id.toString())}
                                                className="rounded-full h-6 w-6 border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Allocation details if multiple participants */}
                            {formData.participantIds.length > 1 && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Info className="w-3.5 h-3.5 text-primary" />
                                        <Label className="text-muted-foreground text-sm font-medium">Chia tiền chi tiết</Label>
                                    </div>
                                    <div className="bg-card border border-input rounded-2xl overflow-hidden shadow-sm">
                                        <div className="max-h-[200px] overflow-y-auto divide-y divide-border custom-scrollbar">
                                            {formData.participantIds.map((pid) => {
                                                const m = members.find(mm => mm.user.id === pid);
                                                if (!m) return null;
                                                return (
                                                    <div key={pid} className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="w-7 h-7 shrink-0 ring-1 ring-input">
                                                                <AvatarImage src={m.user.profilePicture} />
                                                                <AvatarFallback className="text-[10px] font-bold uppercase bg-muted">
                                                                    {(m.user.fullName || m.user.email).charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-xs font-bold text-foreground/70 truncate max-w-[120px]">{m.user.fullName || m.user.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-xl border border-input/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                className="w-24 text-right text-xs font-black text-primary border-none bg-transparent focus:ring-0 p-0"
                                                                value={(amountByUserId[pid] ?? '').toString()}
                                                                onChange={(e) => {
                                                                    const digits = e.target.value.replace(/[^0-9]/g, '');
                                                                    setAmountByUserId(prev => ({ ...prev, [pid]: Number(digits || '0').toLocaleString('vi-VN') }));
                                                                }}
                                                            />
                                                            <span className="text-[10px] font-black text-primary">đ</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {errors.allocations && <p className="text-[10px] text-destructive font-black text-right pr-2 uppercase">{errors.allocations}</p>}
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-muted-foreground text-sm font-medium ml-1">
                                    Mô tả chi tiết (tùy chọn)
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Ăn tối, quà cáp, tiền vé..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="min-h-[100px] rounded-xl bg-card border-input resize-none transition-all px-4 py-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Button - Positioned above PWA Navbar */}
                <div className="p-4 bg-background border-t border-border/50 pb-safe z-40">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-white font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        ) : null}
                        {loading ? 'Đang lưu...' : 'Thêm chi phí'}
                    </Button>
                </div>
            </AnimatedTransition>
        </div>
    );
};

export default PWAAddExpensePage;
