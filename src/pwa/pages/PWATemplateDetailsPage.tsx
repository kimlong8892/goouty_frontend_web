import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Clock,
    Users,
    ChevronRight,
    ChevronLeft,
    Heart,
    Share2,
    Copy,
    Facebook,
    MessageCircle,
    MoreHorizontal,
    Check,
    Loader2,
    Utensils,
    Plane,
    Hotel,
    Camera,
    Car,
    ChevronDown,
} from 'lucide-react';
import { api } from '@/integrations/api/client';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { cn } from '@/lib/utils';

const PWATemplateDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useGlobalToast();
    const showContent = useAnimateIn(false, 300);
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation();

    const [template, setTemplate] = useState<DATABASE_TYPES.tripTemplates | null>(null);
    const [loading, setLoading] = useState(true);
    const [usingTemplate, setUsingTemplate] = useState(false);
    const [activeTab, setActiveTab] = useState('itinerary');
    const [expandedDayIds, setExpandedDayIds] = useState<string[]>([]);
    const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (id) {
            loadTemplateDetails();
            window.scrollTo(0, 0);
        }
    }, [id]);

    const loadTemplateDetails = async () => {
        try {
            setLoading(true);
            const response = await api.tripTemplates.getById(id!);
            setTemplate(response);
            if ((response as any).isWishlisted !== undefined) {
                setIsFavorite((response as any).isWishlisted);
            }
            if (response.days) {
                setExpandedDayIds(response.days.map(d => d.id.toString()));
            }
        } catch (error) {
            console.error('Error loading template details:', error);
            // navigate('/'); // Optional: redirect on error
        } finally {
            setLoading(false);
        }
    };

    const handleUseTemplate = async () => {
        if (!isAuthenticated) {
            showToast("Vui lòng đăng nhập để sử dụng mẫu này.", "warning");
            navigate('/auth');
            return;
        }

        if (!template) return;

        setUsingTemplate(true);
        try {
            const newTrip = await api.trips.createFromTemplate(template.id, template.title);
            showToast("Đã tạo chuyến đi từ mẫu thành công!", "success");
            navigate(`/trip/${newTrip.id}`);
        } catch (error) {
            showToast("Không thể tạo chuyến đi từ mẫu. Vui lòng thử lại.", "error");
        } finally {
            setUsingTemplate(false);
        }
    };

    const toggleDay = (dayId: string) => {
        setExpandedDayIds(prev =>
            prev.includes(dayId)
                ? prev.filter(id => id !== dayId)
                : [...prev, dayId]
        );
    };

    const getTotalDays = () => template?.days?.length || 0;
    const getTotalActivities = () => template?.days?.reduce((total, day) => total + (day.activities?.length || 0), 0) || 0;

    const getActivityIcon = (activityTitle: string) => {
        const title = activityTitle.toLowerCase();
        if (title.includes('airport') || title.includes('flight') || title.includes('plane') || title.includes('bay')) return <Plane className="w-5 h-5" />;
        if (title.includes('hotel') || title.includes('check-in') || title.includes('nghỉ')) return <Hotel className="w-5 h-5" />;
        if (title.includes('photo') || title.includes('camera') || title.includes('chụp')) return <Camera className="w-5 h-5" />;
        if (title.includes('car') || title.includes('drive') || title.includes('xe')) return <Car className="w-5 h-5" />;
        if (title.includes('eat') || title.includes('food') || title.includes('ăn') || title.includes('nhà hàng')) return <Utensils className="w-5 h-5" />;
        return <Clock className="w-5 h-5" />;
    };

    const formatTime = (timeString: string | null): string => {
        if (!timeString) return '';
        if (timeString.includes('T')) {
            try {
                const timePart = timeString.split('T')[1];
                return timePart.substring(0, 5);
            } catch (e) {
                const date = new Date(timeString);
                if (isNaN(date.getTime())) return timeString;
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
        }
        return timeString;
    };

    const displayPrice = template?.fee && template?.fee !== "0"
        ? template.fee.includes('VNĐ')
            ? template.fee
            : `${Number(template.fee).toLocaleString('vi-VN')} VNĐ`
        : "Chi phí linh hoạt";

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        toast.success("Đã sao chép liên kết!");
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: template?.title || 'Goouty Template',
                    text: template?.description || 'Khám phá lịch trình chuyến đi tuyệt vời này trên Goouty!',
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            handleCopyLink();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6347f9]"></div>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">Đang tải template...</p>
                </div>
            </div>
        );
    }

    if (!template) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pb-[200px]">
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md px-5 py-3 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-slate-900 dark:text-white active:scale-90 transition-transform"
                >
                    <ChevronLeft className="w-7 h-7" />
                </button>
                <div className="flex items-center gap-1">
                    <button
                        onClick={async () => {
                            if (!isAuthenticated) {
                                showToast("Vui lòng đăng nhập để lưu mẫu yêu thích.", "warning");
                                navigate('/auth');
                                return;
                            }
                            if (!template) return;
                            try {
                                if (isFavorite) {
                                    await api.tripTemplates.removeFromWishlist(template.id);
                                    showToast("Đã xóa khỏi yêu thích", "success");
                                } else {
                                    await api.tripTemplates.addToWishlist(template.id);
                                    showToast("Đã thêm vào yêu thích", "success");
                                }
                                setIsFavorite(!isFavorite);
                            } catch (e) {
                                showToast("Không thể cập nhật danh sách yêu thích", "error");
                            }
                        }}
                        className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-all",
                            isFavorite ? "text-red-500" : "text-slate-900 dark:text-white"
                        )}
                    >
                        <Heart className={cn("w-6 h-6", isFavorite && "fill-current")} />
                    </button>
                    <button
                        onClick={() => setIsShareSheetOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-slate-900 dark:text-white active:scale-90 transition-transform"
                    >
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* HERO IMAGE */}
            <div className="px-5 pt-2">
                <div className="relative w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/10 group">
                    {template.avatar ? (
                        <img
                            src={template.avatar}
                            alt={template.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Camera className="w-12 h-12 text-slate-300 dark:text-zinc-700" />
                        </div>
                    )}

                    {/* Dark Overlay Layer */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Badges Overlay */}
                    <div className="absolute bottom-6 left-6 flex flex-wrap gap-2 z-10">
                        <Badge className="bg-white/10 text-white backdrop-blur-md border border-white/20 px-3 py-1.5 text-sm font-bold rounded-xl">
                            {getTotalDays()} {t('date.days', 'Ngày')}
                        </Badge>
                        <Badge className="bg-white/10 text-white backdrop-blur-md border border-white/20 px-3 py-1.5 text-sm font-bold rounded-xl">
                            {getTotalActivities()} {t('trip.activities', 'Hoạt động')}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* CONTENT HEADER */}
            <div className="px-6 py-6">
                <div className="flex flex-wrap gap-2 mb-4">
                    {template.province && (
                        <Badge className="bg-[#6347f9]/10 text-[#6347f9] dark:bg-primary/20 dark:text-primary border-none px-3 py-1.5 text-xs font-bold rounded-xl">
                            <MapPin className="w-3.5 h-3.5 mr-1" /> {template.province.name}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-start gap-4">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight flex-1">
                            {template.title}
                        </h1>
                        <div className="flex flex-col items-end shrink-0 mt-1">
                            <div className="bg-[#6347f9]/10 dark:bg-primary/20 px-4 py-2.5 rounded-[1.25rem] border border-[#6347f9]/20 dark:border-primary/20 flex flex-col items-end shadow-sm">
                                <span className={cn(
                                    "text-[#6347f9] dark:text-primary font-black leading-none",
                                    displayPrice === "Chi phí linh hoạt" ? "text-xs uppercase tracking-widest text-center" : "text-lg"
                                )}>
                                    {displayPrice}
                                </span>
                                <span className="text-[#6347f9]/60 dark:text-primary/60 text-[9px] font-black uppercase tracking-widest mt-1">/ người</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                        {template.user?.avatar ? (
                            <img src={template.user.avatar} className="w-full h-full object-cover" />
                        ) : (
                            <Users className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500 leading-none mb-1">{t('template.createdBy', 'Tạo bởi')}</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{template.user?.fullName || "Goouty"}</p>
                    </div>
                </div>
            </div>

            <AnimatedTransition show={showContent} animation="fade">
                <div className="px-5 relative z-10">
                    {/* Description Card */}
                    <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-[2rem] p-6 border border-slate-100 dark:border-zinc-800 mb-8">
                        <h2 className="text-[#6347f9] dark:text-primary text-sm font-black uppercase tracking-widest mb-3">
                            Giới thiệu
                        </h2>
                        <p className="text-slate-600 dark:text-zinc-400 text-[15px] leading-relaxed whitespace-pre-line font-medium">
                            {template.description || "Chưa có mô tả chi tiết cho mẫu chuyến đi này."}
                        </p>
                    </div>

                    {/* Itinerary Section */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-4 px-1">Lịch trình chi tiết</h3>
                        <div className="space-y-4">
                            {(template.days || []).map((day, index) => {
                                const isExpanded = expandedDayIds.includes(day.id.toString());
                                return (
                                    <div key={day.id} className="relative">
                                        <div
                                            className={cn(
                                                "flex items-start gap-4 mb-3 cursor-pointer select-none active:scale-[0.98] transition-all rounded-3xl p-5 border",
                                                isExpanded
                                                    ? "bg-white dark:bg-zinc-900 border-indigo-100 dark:border-indigo-900/30 shadow-xl shadow-indigo-500/5"
                                                    : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm"
                                            )}
                                            onClick={() => toggleDay(day.id.toString())}
                                        >
                                            <div className={cn(
                                                "flex-shrink-0 rounded-2xl flex items-center justify-center font-black shadow-sm transition-all w-11 h-11 text-base",
                                                isExpanded ? "bg-[#6347f9] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className={cn(
                                                        "font-bold leading-tight text-[18px] transition-colors",
                                                        isExpanded ? "text-slate-900 dark:text-zinc-100" : "text-slate-700 dark:text-zinc-400"
                                                    )}>
                                                        {day.title}
                                                    </h3>
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                                        isExpanded ? "bg-indigo-50 dark:bg-indigo-900/30 text-[#6347f9]" : "text-slate-300"
                                                    )}>
                                                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                    </div>
                                                </div>
                                                {day.description && (
                                                    <p className="text-slate-500 dark:text-zinc-500 mt-1.5 text-xs line-clamp-2 md:line-clamp-none leading-relaxed font-medium">{day.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="pl-4 ml-4 border-l-2 border-dashed border-slate-200 dark:border-zinc-800 space-y-3 pb-2 pt-1">
                                                {day.activities?.length > 0 ? (
                                                    day.activities.map((act) => (
                                                        <div key={act.id} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 shadow-sm relative group">
                                                            {/* Connector dot */}
                                                            <div className="absolute -left-[21px] top-6 w-2.5 h-2.5 rounded-full bg-white dark:bg-zinc-900 border-2 border-indigo-300 dark:border-indigo-500" />

                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-[#6347f9] dark:text-primary flex items-center justify-center">
                                                                    {getActivityIcon(act.title)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                                                        <h4 className="font-bold text-slate-900 dark:text-zinc-100 text-[15px] leading-tight">{act.title}</h4>
                                                                        {act.startTime && (
                                                                            <span className="text-[10px] font-bold text-[#6347f9] dark:text-primary bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md flex-shrink-0">
                                                                                {formatTime(act.startTime)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-zinc-400 mb-2">
                                                                        {act.location && (
                                                                            <div
                                                                                className="flex flex-col gap-0.5 group/loc cursor-pointer"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    window.location.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location!)}`;
                                                                                }}
                                                                            >
                                                                                <span className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 group-hover/loc:text-primary transition-colors">
                                                                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-red-500" /> <span className="truncate max-w-[150px]">{act.location}</span>
                                                                                </span>
                                                                                <div className="flex items-center gap-1 ml-4 overflow-hidden">
                                                                                    <span className="text-[10px] text-primary font-bold hover:underline underline-offset-2 transition-all">
                                                                                        Xem trong bản đồ
                                                                                    </span>
                                                                                    <ChevronRight className="w-3 h-3 text-primary animate-pulse" />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {act.durationMin && (
                                                                            <span className="flex items-center gap-1 flex-shrink-0">
                                                                                <Clock className="w-3.5 h-3.5 flex-shrink-0 text-yellow-500" /> {act.durationMin}p
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {act.notes && (
                                                                        <p className="text-xs text-slate-500 dark:text-zinc-500 italic bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
                                                                            "{act.notes}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-xs text-slate-400 italic pl-2 py-2">Không có hoạt động.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Fixed Bottom Action for PWA */}
                <div className={cn(
                    "fixed left-0 w-full bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-all duration-300",
                    isAuthenticated ? "bottom-[85px] pb-4" : "bottom-0 pb-8 safe-area-bottom"
                )}>
                    <Button
                        size="lg"
                        className="w-full h-12 text-base font-bold bg-[#6347f9] hover:bg-[#5136db] shadow-lg shadow-indigo-200/50 rounded-xl active:scale-[0.98] transition-transform"
                        onClick={handleUseTemplate}
                        disabled={usingTemplate}
                    >
                        {usingTemplate ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tạo...
                            </>
                        ) : (
                            <>
                                Sử dụng Template này <ChevronRight className="w-5 h-5 ml-1" />
                            </>
                        )}
                    </Button>
                </div>
            </AnimatedTransition>

            {/* SHARE SHEET */}
            <Sheet open={isShareSheetOpen} onOpenChange={setIsShareSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-white dark:bg-zinc-900 overflow-hidden">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto mt-3 mb-2" />
                    <SheetHeader className="px-6 py-4 border-b border-slate-50 dark:border-zinc-800">
                        <SheetTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 justify-center">
                            Chia sẻ Template
                        </SheetTitle>
                        <SheetDescription className="text-center font-medium">
                            Chia sẻ lịch trình tuyệt vời này tới mọi người
                        </SheetDescription>
                    </SheetHeader>

                    <div className="p-8">
                        <div className="grid grid-cols-2 gap-8 mb-8 max-w-[280px] mx-auto">
                            <button
                                onClick={handleCopyLink}
                                className="flex flex-col items-center gap-3 active:scale-90 transition-transform"
                            >
                                <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-[1.25rem] flex items-center justify-center text-slate-600 dark:text-zinc-300 shadow-sm border border-slate-50 dark:border-zinc-700/50">
                                    {isCopied ? <Check className="w-7 h-7 text-green-500" /> : <Copy className="w-7 h-7" />}
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Sao chép</span>
                            </button>

                            <button
                                onClick={handleNativeShare}
                                className="flex flex-col items-center gap-3 active:scale-90 transition-transform"
                            >
                                <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-[1.25rem] flex items-center justify-center text-slate-600 dark:text-zinc-300 shadow-sm border border-slate-50 dark:border-zinc-700/50">
                                    <MoreHorizontal className="w-7 h-7" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Khác</span>
                            </button>
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-950/50 p-5 rounded-[1.5rem] border border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 leading-none">Template Link</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 truncate">{window.location.href}</p>
                            </div>
                            <button
                                onClick={handleCopyLink}
                                className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-700 text-[#6347f9] active:scale-90 transition-transform"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="h-8 safe-area-bottom" />
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default PWATemplateDetailsPage;
