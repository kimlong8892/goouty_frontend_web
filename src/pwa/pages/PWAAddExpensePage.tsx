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
    Wallet,
    Scan,
    Upload,
    Camera
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
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';

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
    const [realTripId, setRealTripId] = useState<string | null>(null);
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
    const [isScanning, setIsScanning] = useState(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isInitialized = useRef<boolean>(false);

    useEffect(() => {
        document.title = 'Thêm chi phí mới - Goouty';
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [authLoading, isAuthenticated, navigate]);

    // Fetch members when tripId changes
    useEffect(() => {
        const fetchMembers = async () => {
            if (!tripId) return;
            try {
                setMembersLoading(true);

                // First, ensure we have the real numeric trip ID (in case slug was used)
                const tripData = await api.trips.getById(tripId);
                const actualId = tripData.id.toString();
                setRealTripId(actualId);

                const data = await api.members.getByTrip(actualId);
                // Allow owner or accepted members
                const acceptedMembers = data.filter((m: any) => m && (m.status === 'accepted' || !m.status || m.role === 'owner'));

                // Ensure current user is present for PWA UX
                if (user && !acceptedMembers.find(m => m.user.id.toString() === user.id.toString())) {
                    acceptedMembers.unshift({
                        id: `current-user-${user.id}`,
                        user: {
                            id: user.id.toString(),
                            email: user.email || '',
                            fullName: user.fullName || 'Bạn',
                            profilePicture: (user as any).profilePicture || ''
                        },
                        role: 'owner',
                        status: 'accepted'
                    } as any);
                }

                setMembers(acceptedMembers);
            } catch (error: any) {
                console.error('Fetch members error:', error);
                showToast('Không thể tải danh sách thành viên', 'error');
            } finally {
                setMembersLoading(false);
            }
        };

        if (isAuthenticated && tripId) {
            fetchMembers();
        }
    }, [tripId, isAuthenticated, user?.id]);

    // Initialize form data when members or initialData change
    useEffect(() => {
        if (!tripId || membersLoading || isInitialized.current) return;

        // Wait for members to load
        if (members.length === 0) {
            if (!membersLoading) {
                // No members found even after loading
            } else {
                return;
            }
        }

        // Default initialization
        const currentUserMember = user ? members.find((m: any) => m.user.id.toString() === user.id.toString()) : null;
        const defaultPayerId = currentUserMember ? currentUserMember.user.id.toString() : (members[0]?.user.id.toString() || '');
        const allMemberIds = members.map(m => m.user.id.toString());

        setFormData({
            title: initialData?.title || '',
            amount: initialData?.amount || '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            payerId: defaultPayerId,
            participantIds: allMemberIds
        });
        setAmountByUserId({});
        setSplitMethod('equal');
        isInitialized.current = true;
    }, [tripId, members, membersLoading, user, initialData]);


    useEffect(() => {
        const total = Number(formData.amount || '0');
        const ids = formData.participantIds;
        if (ids.length === 0 || !total) return;

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
                tripId: realTripId || tripId,
                amounts: rawAmounts
            });

            showToast('Đã thêm chi phí thành công', 'success');
            navigate(-1);
        } catch (error: any) {
            console.error('Add expense error:', error);
            showToast(error.message || 'Không thể thêm chi phí', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleScanInvoice = () => {
        cameraInputRef.current?.click();
    };

    const processFile = async (file: File) => {
        try {
            setIsScanning(true);
            const result = await api.ai.processBill(file);

            if (result.success) {
                toast.success('Xử lý hóa đơn thành công!');
                setFormData(prev => ({
                    ...prev,
                    title: result.data.name || prev.title,
                    amount: result.data.total.toString() || prev.amount
                }));
            }
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Không thể xử lý hóa đơn';
            toast.error(message);
        } finally {
            setIsScanning(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const selectedPayer = members.find(m => m.user.id.toString() === formData.payerId);

    return (
        <div className="fixed inset-0 bg-background flex flex-col z-10 text-foreground overflow-hidden">
            <AnimatedTransition show={showContent} animation="slide-up" className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md px-4 py-0.5 flex items-center justify-between min-h-[40px]">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all outline-none"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-base font-black absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-slate-900 dark:text-white">
                        Thêm chi phí
                    </h1>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="p-2 text-primary active:scale-95 transition-all outline-none"
                            >
                                <Scan className="w-6 h-6" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] border-border dark:bg-slate-900 shadow-2xl z-[100]">
                            <DropdownMenuItem
                                onClick={() => cameraInputRef.current?.click()}
                                className="rounded-xl py-3 px-3 focus:bg-primary/5 cursor-pointer transition-all flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-bold text-sm">Chụp hóa đơn</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-xl py-3 px-3 focus:bg-primary/5 cursor-pointer transition-all flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-bold text-sm">Tải lên hóa đơn</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Content - Removed pb-48 as footer is no longer fixed */}
                <div className="flex-1 px-5 pt-4 pb-10 overflow-y-auto scrolling-touch">
                    <div className="w-full max-w-md mx-auto space-y-6 text-foreground">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-muted-foreground text-sm font-bold ml-1">
                                Tên chi phí <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="Ví dụ: Ăn tối tại Đà Lạt"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={cn(
                                    "h-14 rounded-[20px] bg-card dark:bg-slate-900/50 border-none shadow-sm focus:ring-primary/20 transition-all text-base px-5",
                                    errors.title && "ring-1 ring-destructive"
                                )}
                            />
                            {errors.title && (
                                <p className="text-xs text-destructive ml-1">{errors.title}</p>
                            )}
                        </div>

                        {/* Amount and Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-muted-foreground text-sm font-bold ml-1">
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
                                            "h-14 rounded-[20px] bg-card dark:bg-slate-900/50 border-none shadow-sm focus:ring-primary/20 transition-all font-black pr-12 text-base px-5",
                                            errors.amount && "ring-1 ring-destructive"
                                        )}
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground italic">đ</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-muted-foreground text-sm font-bold ml-1">
                                    Ngày chi <span className="text-red-500">*</span>
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full h-14 justify-start text-left font-bold rounded-[20px] bg-card dark:bg-slate-900/50 border-none shadow-sm hover:bg-card/80 transition-all text-base px-5",
                                                !formData.date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 opacity-30 text-primary" />
                                            {formData.date ? format(new Date(formData.date + 'T00:00:00'), "dd/MM/yyyy") : "Chọn ngày"}
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
                            <Label className="text-muted-foreground text-sm font-bold ml-1">Người trả tiền</Label>
                            <Select value={formData.payerId} onValueChange={(v) => setFormData({ ...formData, payerId: v })}>
                                <SelectTrigger className={cn(
                                    "h-16 rounded-[20px] bg-card dark:bg-slate-900/50 border-none shadow-sm focus:ring-primary/20 transition-all text-base px-4 [&>span]:flex [&>span]:items-center",
                                    errors.payerId && "ring-1 ring-destructive"
                                )}>
                                    {selectedPayer ? (
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8 shrink-0 ring-2 ring-primary/5">
                                                <AvatarImage src={selectedPayer.user.profilePicture} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                                                    {selectedPayer.user.fullName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-bold text-foreground">
                                                {selectedPayer.user.fullName} {user?.id.toString() === selectedPayer.user.id.toString() && '(bạn)'}
                                            </span>
                                        </div>
                                    ) : (
                                        <SelectValue placeholder="Chọn người trả" />
                                    )}
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl z-50 p-2">
                                    {members.length === 0 && membersLoading ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground animate-pulse font-medium">Đang tải thành viên...</div>
                                    ) : members.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground font-medium">Không tìm thấy thành viên</div>
                                    ) : (
                                        members.map((m) => (
                                            <SelectItem key={m.user.id} value={m.user.id.toString()} className="rounded-xl py-3 px-3 m-1 focus:bg-primary/5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8 shrink-0">
                                                        <AvatarImage src={m.user.profilePicture} />
                                                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                                            {m.user.fullName.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-bold text-foreground">{m.user.fullName} {user?.id.toString() === m.user.id.toString() && '(bạn)'}</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-sm font-bold ml-1">Người cùng tham gia</Label>
                            <div className="bg-card dark:bg-slate-900/50 rounded-[24px] shadow-sm overflow-hidden divide-y divide-border/50 border border-border/50">
                                {membersLoading && members.length === 0 ? (
                                    <div className="h-20 flex items-center justify-center bg-muted/30 rounded-2xl animate-pulse">
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : members.map((m) => (
                                    <label
                                        key={m.user.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 cursor-pointer transition-all active:bg-muted",
                                            formData.participantIds.includes(m.user.id.toString()) ? "bg-primary/[0.04]" : "bg-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="w-10 h-10 shrink-0 border-2 border-border/50 shadow-sm">
                                                <AvatarImage src={m.user.profilePicture} />
                                                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold uppercase">
                                                    {m.user.fullName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-black text-foreground tracking-tight">
                                                {m.user.fullName} {user?.id.toString() === m.user.id.toString() && '(bạn)'}
                                            </span>
                                        </div>
                                        <Checkbox
                                            checked={formData.participantIds.includes(m.user.id.toString())}
                                            onCheckedChange={() => toggleParticipant(m.user.id.toString())}
                                            className="rounded-full h-7 w-7 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shadow-inner"
                                        />
                                    </label>
                                ))}
                                {members.length === 0 && !membersLoading && (
                                    <div className="p-8 text-center bg-transparent italic text-xs text-muted-foreground font-medium">Không tìm thấy thành viên để tham gia</div>
                                )}
                            </div>
                        </div>

                        {/* Allocation Section (Hidden if only 1 participant) */}
                        {formData.participantIds.length > 1 && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2 mb-1 ml-1 text-primary">
                                    <Info className="w-4 h-4" />
                                    <Label className="text-sm font-bold">Chia chi tiết</Label>
                                </div>
                                <div className="bg-card dark:bg-slate-900/50 rounded-[24px] overflow-hidden shadow-sm divide-y divide-border/50">
                                    {formData.participantIds.map((pid) => {
                                        const m = members.find(mm => mm.user.id === pid);
                                        if (!m) return null;
                                        return (
                                            <div key={pid} className="flex items-center justify-between p-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-7 h-7 shrink-0">
                                                        <AvatarImage src={m.user.profilePicture} />
                                                        <AvatarFallback className="text-[10px] font-bold uppercase bg-muted text-muted-foreground">{m.user.fullName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-black text-muted-foreground truncate max-w-[120px]">{m.user.fullName}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-muted/50 px-4 py-2 rounded-xl ring-1 ring-border focus-within:ring-primary/30 transition-all">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        className="w-20 text-right text-xs font-black text-primary border-none bg-transparent focus:ring-0 p-0"
                                                        value={(amountByUserId[pid] ?? '').toString()}
                                                        onChange={(e) => {
                                                            const digits = e.target.value.replace(/[^0-9]/g, '');
                                                            setAmountByUserId(prev => ({ ...prev, [pid]: Number(digits || '0').toLocaleString('vi-VN') }));
                                                        }}
                                                    />
                                                    <span className="text-[10px] font-black text-primary/60 italic">đ</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.allocations && <p className="text-[10px] text-destructive font-black text-right pr-2 uppercase italic">{errors.allocations}</p>}
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-muted-foreground text-sm font-bold ml-1">
                                Mô tả chi tiết (tùy chọn)
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Ăn tối, quà cáp, tiền vé..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="min-h-[120px] rounded-[24px] bg-card dark:bg-slate-900/50 border-none shadow-sm resize-none transition-all px-5 py-4 text-base"
                            />
                        </div>
                    </div>
                </div>

                {/* Global Scanning Overlay */}
                {isScanning && createPortal(
                    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center animate-fade-in bg-slate-950/40 backdrop-blur-sm">
                        <div className="bg-card p-10 rounded-[48px] shadow-2xl flex flex-col items-center gap-8 border border-border animate-slide-up mx-6 max-w-[400px]">
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

                <input
                    type="file"
                    ref={cameraInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            processFile(file);
                        }
                        if (e.target) e.target.value = '';
                    }}
                />

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            processFile(file);
                        }
                        if (e.target) e.target.value = '';
                    }}
                />

                {/* Bottom Navbar & Action Button - Use flex instead of fixed to prevent covering content */}
                <div className="p-4 bg-background border-t border-border/50 pb-24 z-40">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2" />
                        ) : null}
                        {loading ? 'Đang lưu...' : 'Thêm chi phí'}
                    </Button>
                </div>
            </AnimatedTransition>
        </div>
    );
};

export default PWAAddExpensePage;
