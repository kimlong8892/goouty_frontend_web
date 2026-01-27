import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    FileText,
    Sparkles,
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
    const [expandedDayIds, setExpandedDayIds] = useState<string[]>([]);
    const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    const [touchDelta, setTouchDelta] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [stableDayIndex, setStableDayIndex] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setStableDayIndex(selectedDayIndex), 500);
        return () => clearTimeout(timer);
    }, [selectedDayIndex]);

    // Swipe handling for days
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const touchEndY = useRef<number | null>(null);
    const minSwipeDistance = 50;
    const dayTabsScrollRef = useRef<HTMLDivElement>(null);

    const handleNextDay = () => {
        const total = (template?.days || []).length;
        if (selectedDayIndex < total - 1) {
            setSelectedDayIndex(prev => prev + 1);
        }
    };

    const handlePrevDay = () => {
        if (selectedDayIndex > 0) {
            setSelectedDayIndex(prev => prev - 1);
        }
    };

    const onTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = null;
        touchEndY.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
        setIsDragging(true);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !touchStartX.current) return;
        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;

        // Check if it's a vertical swipe to allow scrolling
        if (touchStartY.current) {
            const diffY = Math.abs(currentY - touchStartY.current);
            const diffX = Math.abs(currentX - touchStartX.current);
            if (diffY > diffX && diffY > 5) { // Sensitivity
                setIsDragging(false);
                setTouchDelta(0);
                return;
            }
        }

        let deltaX = currentX - touchStartX.current;
        const totalDays = (template?.days || []).length;

        // Rubber banding at edges
        if ((selectedDayIndex === 0 && deltaX > 0) || (selectedDayIndex === totalDays - 1 && deltaX < 0)) {
            deltaX = deltaX * 0.35;
        }

        setTouchDelta(deltaX);
        touchEndX.current = currentX;
    };

    const onTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const finalDelta = touchDelta;
        setTouchDelta(0);

        if (Math.abs(finalDelta) > minSwipeDistance) {
            if (finalDelta < 0) {
                handleNextDay();
            } else {
                handlePrevDay();
            }
        }

        touchStartX.current = null;
        touchStartY.current = null;
    };

    // Scroll active tab into view
    useEffect(() => {
        if (dayTabsScrollRef.current) {
            const activeTab = dayTabsScrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
            if (activeTab) {
                activeTab.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });
            }
        }
    }, [selectedDayIndex]);

    // Auto-hide navigation controls
    const [controlsVisible, setControlsVisible] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetControlsTimeout = () => {
        // Don't auto-hide if tutorial is showing
        if (showTutorial) return;

        setControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 500); // Fade out after 0.5 seconds of inactivity
    };

    // Check for tutorial on mount and template load
    useEffect(() => {
        if (template && (template.next || template.previous)) {
            const hasSeen = localStorage.getItem('pwa_template_nav_tutorial_seen');
            if (!hasSeen) {
                setShowTutorial(true);
                setControlsVisible(true);
                if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            }
        }
    }, [template]);

    const handleDismissTutorial = () => {
        localStorage.setItem('pwa_template_nav_tutorial_seen', 'true');
        setShowTutorial(false);
        resetControlsTimeout();
    };

    useEffect(() => {
        resetControlsTimeout();

        const handleActivity = () => resetControlsTimeout();

        window.addEventListener('scroll', handleActivity);
        window.addEventListener('touchstart', handleActivity);
        window.addEventListener('click', handleActivity);

        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            window.removeEventListener('click', handleActivity);
        };
    }, []);



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

            // Sort days by dayOrder
            if (response && response.days) {
                response.days.sort((a, b) => (a.dayOrder || 0) - (b.dayOrder || 0));
            }

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
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">Đang tải template...</p>
                </div>
            </div>
        );
    }

    if (!template) return null;

    return (
        <div
            className="min-h-screen bg-white dark:bg-[#0a0a0a] pb-[200px]"
        >
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



            {/* Tutorial Overlay */}
            {showTutorial && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center px-8 text-center animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-2xl max-w-sm border border-white/20">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ArrowLeft className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                            Điều hướng dễ dàng
                        </h3>
                        <p className="text-slate-600 dark:text-zinc-400 font-medium mb-6 leading-relaxed">
                            Sử dụng hai nút mũi tên ở cạnh màn hình để xem các mẫu chuyến đi khác một cách nhanh chóng.
                        </p>
                        <Button
                            onClick={handleDismissTutorial}
                            className="w-full h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary/90"
                        >
                            Đã hiểu
                        </Button>
                    </div>
                </div>
            )}

            {/* CONTENT HEADER */}
            <div className="px-6 py-6">
                <div className="flex flex-wrap gap-2 mb-4">
                    {template.province && (
                        <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-none px-3 py-1.5 text-xs font-bold rounded-xl">
                            <MapPin className="w-3.5 h-3.5 mr-1" /> {template.province.name}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-start gap-4">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight flex-1">
                            {template.title}
                        </h1>

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
                        <h2 className="text-primary dark:text-primary-foreground/80 text-sm font-black uppercase tracking-widest mb-3">
                            Giới thiệu
                        </h2>
                        <div className="relative">
                            <p className={cn(
                                "text-slate-600 dark:text-zinc-400 text-[15px] leading-relaxed whitespace-pre-line font-medium transition-all duration-300",
                                !isDescriptionExpanded && "line-clamp-3"
                            )}>
                                {template.description || "Chưa có mô tả chi tiết cho mẫu chuyến đi này."}
                            </p>
                            {template.description && (template.description.split('\n').length > 3 || template.description.length > 150) ? (
                                <button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="mt-2 text-slate-900 dark:text-white font-bold text-sm hover:underline flex items-center gap-1"
                                >
                                    {isDescriptionExpanded ? (
                                        <>Thu gọn <ChevronDown className="w-4 h-4 rotate-180" /></>
                                    ) : (
                                        <>Xem thêm <ChevronDown className="w-4 h-4" /></>
                                    )}
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Itinerary Section */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-6 px-1">Lịch trình chi tiết</h3>

                        {/* Day Selector */}
                        {(template.days || []).length > 1 && (
                            <div
                                className="overflow-x-auto no-scrollbar mb-4 sticky top-[64px] bg-white dark:bg-[#0a0a0a] z-30 py-2 -mx-5 px-2 border-b border-slate-100 dark:border-zinc-800"
                                onTouchStart={(e) => e.stopPropagation()}
                            >
                                <div
                                    ref={dayTabsScrollRef}
                                    className="flex gap-8 justify-start w-max min-w-full px-5"
                                >
                                    {(template.days || []).map((day, idx) => (
                                        <button
                                            key={day.id}
                                            onClick={() => setSelectedDayIndex(idx)}
                                            data-active={selectedDayIndex === idx}
                                            className={cn(
                                                "flex flex-col items-center min-w-[90px] py-3 px-3 rounded-2xl transition-all duration-300",
                                                selectedDayIndex === idx
                                                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary ring-1 ring-primary/20"
                                                    : "text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-900"
                                            )}
                                        >
                                            <span className="text-sm font-black">Ngày {idx + 1}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div
                            className="overflow-hidden relative"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            <div
                                className={cn(
                                    "flex w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] items-start",
                                    isDragging ? "duration-0" : ""
                                )}
                                style={{
                                    transform: `translateX(calc(${-selectedDayIndex * 100}% + ${touchDelta}px))`,
                                    willChange: 'transform'
                                } as any}
                            >
                                {(template.days || []).map((day, dIdx) => (
                                    <div
                                        key={day.id}
                                        className={cn(
                                            "w-full flex-shrink-0 px-1",
                                            dIdx !== selectedDayIndex && dIdx !== stableDayIndex && "h-0 overflow-hidden"
                                        )}
                                    >
                                        {/* Selected Day Title */}
                                        <div className="mb-5 px-1">
                                            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight text-center">
                                                {day.title || `Ngày ${dIdx + 1}`}
                                            </h4>
                                        </div>

                                        {/* Activities List for Day */}
                                        <div className="relative pl-8 pr-1">
                                            {day.activities && (day.activities || []).length > 0 ? (
                                                (day.activities || [])
                                                    .sort((a, b) => (a.activityOrder || 0) - (b.activityOrder || 0))
                                                    .map((act, idx, arr) => (
                                                        <div key={act.id} className="relative mb-8 last:mb-4">
                                                            {/* Timeline Line */}
                                                            {idx !== arr.length - 1 && (
                                                                <div className="absolute left-[-21px] top-10 bottom-[-32px] w-[2px] border-l-2 border-dashed border-slate-200 dark:border-zinc-800" />
                                                            )}

                                                            {/* Timeline Node - Sequence Number */}
                                                            <div className="absolute left-[-36px] top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs z-10 shadow-sm">
                                                                {idx + 1}
                                                            </div>

                                                            <div className="flex flex-col gap-2">
                                                                <div className="text-sm font-black text-slate-900 dark:text-zinc-100 ml-1">
                                                                    {formatTime(act.startTime) || "09:00"}
                                                                </div>

                                                                <div className="bg-white dark:bg-zinc-900/40 rounded-[2rem] border border-slate-100 dark:border-zinc-800 p-3 flex gap-4 shadow-sm active:scale-[0.98] transition-transform">
                                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                                                                        <img
                                                                            src={(act as any).avatar || "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=300&q=80"}
                                                                            alt={act.title}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                                                                        <h4 className="font-bold text-slate-900 dark:text-white text-[17px] leading-tight mb-1 whitespace-normal">{act.title}</h4>
                                                                        <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-2">
                                                                            {act.location && (
                                                                                <div
                                                                                    className="flex flex-col gap-0.5 group/loc cursor-pointer"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        window.location.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location!)}`;
                                                                                    }}
                                                                                >
                                                                                    <span className="flex items-start gap-1 text-slate-500 dark:text-zinc-400 group-hover/loc:text-primary transition-colors">
                                                                                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500" />
                                                                                        <span className="flex-1 whitespace-normal leading-relaxed">
                                                                                            {act.location}
                                                                                        </span>
                                                                                    </span>
                                                                                    <div className="flex items-center gap-1 ml-4 overflow-hidden">
                                                                                        <span className="text-[10px] text-primary dark:text-primary font-bold hover:underline underline-offset-2 transition-all">
                                                                                            Xem trong bản đồ
                                                                                        </span>
                                                                                        <ChevronRight className="w-3 h-3 text-primary dark:text-primary animate-pulse" />
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 dark:text-zinc-500">
                                                                            {act.durationMin ? (
                                                                                <span className="flex items-center gap-1 flex-shrink-0">
                                                                                    <Clock className="w-3.5 h-3.5 flex-shrink-0 text-yellow-500" /> {act.durationMin}p
                                                                                </span>
                                                                            ) : null}
                                                                        </div>

                                                                        {act.notes && (
                                                                            <div className="mt-2 pt-2 border-t border-slate-50 dark:border-zinc-800/50 flex gap-1.5 items-start w-full">
                                                                                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
                                                                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed italic whitespace-normal">
                                                                                    {act.notes}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                            ) : (
                                                <div className="text-center py-12 bg-slate-50 dark:bg-zinc-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-zinc-800 mb-8 mx-1">
                                                    <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                        <Calendar className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-500 dark:text-zinc-500 font-bold">Ngày này chưa có hoạt động.</p>
                                                    <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest">Hãy chọn ngày khác hoặc quay lại sau</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

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
                                className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-700 text-primary active:scale-90 transition-transform"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="h-8 safe-area-bottom" />
                </SheetContent>
            </Sheet>

            {createPortal(
                <>
                    {/* Full Screen Loading Overlay for Trip Creation */}
                    {usingTemplate && createPortal(
                        <div className="fixed inset-0 z-[10000] bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
                            <div className="flex flex-col items-center gap-4 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/20">
                                {/* Car Loader (Oto Goouty) */}
                                <div className="flex flex-col items-center mb-8">
                                    <div className="car-wrapper">
                                        <div className="smoke-container" style={{ left: '-10px' }}>
                                            <div className="smoke" style={{ animationDelay: '0s' }}></div>
                                            <div className="smoke" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <div className="car-body">
                                            <div className="car-top">
                                                <div className="car-window"></div>
                                            </div>
                                            <span className="car-goouty-text tracking-widest">Goouty</span>
                                            <div className="car-wheel wheel-1"></div>
                                            <div className="car-wheel wheel-2"></div>
                                        </div>
                                    </div>
                                    <div className="motorcycle-road w-32"></div>
                                </div>

                                <div className="flex flex-col items-center gap-1 text-center">
                                    <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Đang chuẩn bị</p>
                                    <p className="text-sm font-bold text-slate-500 dark:text-zinc-400 leading-relaxed">
                                        Chuyến đi của bạn sắp sẵn sàng<br />
                                        Đợi 1 chút nhé
                                    </p>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                    {/* Fixed Bottom Action for PWA */}
                    <div className={cn(
                        "fixed left-0 w-full px-5 z-[9997] pointer-events-none transition-all duration-500",
                        isAuthenticated ? "bottom-[95px]" : "bottom-12 pb-8 safe-area-bottom",
                        isShareSheetOpen ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0"
                    )}>
                        <div className="max-w-md mx-auto pointer-events-auto flex justify-center">
                            <Button
                                className="w-fit h-11 px-8 text-sm font-black bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_8px_25px_-5px_rgba(99,102,241,0.5)] rounded-full active:scale-[0.96] transition-all duration-300 border-none group relative overflow-hidden"
                                onClick={handleUseTemplate}
                                disabled={usingTemplate}
                            >
                                <div className="flex items-center justify-center gap-2 relative z-10">
                                    {usingTemplate ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> <span>Đang chuẩn bị...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 text-white/90" />
                                            <span>Sử dụng mẫu</span>
                                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </div>
                                {/* Shine Effect Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] transition-transform pointer-events-none" />
                            </Button>
                        </div>
                    </div>

                    {/* Navigation Arrows Overlay - Fixed true positioning via Portal */}
                    {template.previous && (
                        <button
                            onClick={() => navigate(`/pwa-template-details/${template.previous!.id}`)}
                            className={cn(
                                "fixed left-3 top-[50dvh] -translate-y-1/2 w-11 h-11 bg-white/90 dark:bg-zinc-800/50 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:border-primary dark:hover:border-primary active:scale-90 transition-all duration-500",
                                showTutorial ? "z-[9999] opacity-100 translate-x-0 ring-4 ring-primary/50 animate-pulse" : "z-[9999]",
                                !showTutorial && (controlsVisible ? "opacity-100 translate-x-0" : "opacity-30 -translate-x-1/2 hover:opacity-100 hover:translate-x-0")
                            )}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    {template.next && (
                        <button
                            onClick={() => navigate(`/pwa-template-details/${template.next!.id}`)}
                            className={cn(
                                "fixed right-3 top-[50dvh] -translate-y-1/2 w-11 h-11 bg-white/90 dark:bg-zinc-800/50 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:border-primary dark:hover:border-primary active:scale-90 transition-all duration-500",
                                showTutorial ? "z-[9999] opacity-100 translate-x-0 ring-4 ring-primary/50 animate-pulse" : "z-[9999]",
                                !showTutorial && (controlsVisible ? "opacity-100 translate-x-0" : "opacity-30 translate-x-1/2 hover:opacity-100 hover:translate-x-0")
                            )}
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    )}

                    {/* Tutorial Overlay */}
                    {showTutorial && (
                        <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center px-8 text-center animate-in fade-in duration-300">
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-2xl max-w-sm border border-white/20">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ArrowLeft className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                                    Điều hướng dễ dàng
                                </h3>
                                <p className="text-slate-600 dark:text-zinc-400 font-medium mb-6 leading-relaxed">
                                    Sử dụng hai nút mũi tên ở cạnh màn hình để xem các mẫu chuyến đi khác một cách nhanh chóng.
                                </p>
                                <Button
                                    onClick={handleDismissTutorial}
                                    className="w-full h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary/90"
                                >
                                    Đã hiểu
                                </Button>
                            </div>
                        </div>
                    )}
                </>,
                document.body
            )}
        </div>
    );
};

export default PWATemplateDetailsPage;
