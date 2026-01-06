import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Clock,
    Users,
    ChevronRight,
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
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';

const TripTemplateDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useGlobalToast();
    const showContent = useAnimateIn(false, 300);
    const { isAuthenticated } = useAuth();
    const { isPWA } = usePWA();
    const isMobile = useIsMobile();
    const isMobileView = isPWA || isMobile;

    const [template, setTemplate] = useState<DATABASE_TYPES.tripTemplates | null>(null);
    const [loading, setLoading] = useState(true);
    const [usingTemplate, setUsingTemplate] = useState(false);
    const [activeTab, setActiveTab] = useState('itinerary');
    const [expandedDayIds, setExpandedDayIds] = useState<string[]>([]);

    useEffect(() => {
        if (id) {
            loadTemplateDetails();
        }
    }, [id]);

    const loadTemplateDetails = async () => {
        try {
            setLoading(true);
            const response = await api.tripTemplates.getById(id!);
            setTemplate(response);
            // Expand all days by default
            if (response.days) {
                setExpandedDayIds(response.days.map(d => d.id.toString()));
            }
        } catch (error) {
            console.error('Error loading template details:', error);
            navigate('/templates');
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6347f9]"></div>
                    <p className="text-slate-500 font-medium">Đang tải template...</p>
                </div>
            </div>
        );
    }

    if (!template) return null;

    return (
        <div className={cn(
            "min-h-screen bg-white",
            isMobileView ? "pt-0 pb-24" : "pt-4 pb-20 px-4"
        )}>
            {/* Mobile Sticky Header */}
            {isMobileView && (
                <div className="sticky top-0 z-[60] bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <button
                            onClick={() => navigate('/templates')}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        <h1 className="text-lg font-bold text-slate-900 truncate">
                            {template.title}
                        </h1>
                    </div>
                </div>
            )}

            <AnimatedTransition show={showContent} animation="slide-up">
                <div className={cn("max-w-6xl mx-auto", isMobileView && "px-4 pt-6")}>

                    {/* Header Section */}
                    <div className={cn("mb-8", isMobileView && "mb-6")}>
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {template.province && (
                                <Badge className="bg-[#6347f9] hover:bg-[#5136db] text-white border-none px-3 py-1 font-medium rounded-md">
                                    <MapPin className="w-3 h-3 mr-1" /> {template.province.name}
                                </Badge>
                            )}
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-md">
                                {getTotalDays()} Ngày
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-md">
                                {getTotalActivities()} Hoạt động
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3 mb-4 group">
                            {!isMobileView && (
                                <button
                                    onClick={() => navigate('/templates')}
                                    className="p-2 -ml-12 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                                    title="Quay lại"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                            )}
                            <h1 className={cn(
                                "font-black text-slate-800 tracking-tight leading-tight",
                                isMobileView ? "text-2xl" : "text-3xl md:text-5xl"
                            )}>
                                {template.title}
                            </h1>
                        </div>

                        <div className={cn(
                            "flex flex-wrap items-center gap-y-3 gap-x-6 text-slate-500 font-medium text-sm mb-4",
                            isMobileView && "gap-x-4"
                        )}>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span>Tạo bởi <span className="text-slate-900 font-semibold">{template.user?.fullName || "Goouty Official"}</span></span>
                            </div>
                        </div>

                        <div className={cn(
                            "bg-white shadow-sm border border-gray-100/50 mb-8 w-full",
                            isMobileView ? "rounded-2xl px-5 py-4 bg-slate-50" : "rounded-3xl px-8 py-5"
                        )}>
                            <p className={cn(
                                "text-slate-700 leading-relaxed font-medium whitespace-pre-line",
                                isMobileView ? "text-base" : "text-lg"
                            )}>
                                {template.description || "Chưa có mô tả chi tiết cho mẫu chuyến đi này."}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: Tabs & Content */}
                        <div className="lg:col-span-2">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <div className={cn(
                                    "sticky top-[60px] z-50 mb-6 w-full -mx-4 px-4 bg-white/95 backdrop-blur-sm",
                                    !isMobileView && "relative top-0 mx-0 px-0 bg-transparent"
                                )}>
                                    <TabsList className={cn(
                                        "bg-transparent h-auto p-0 gap-3 flex w-full justify-start border-b border-gray-100 pb-2",
                                    )}>
                                        <TabsTrigger
                                            value="itinerary"
                                            className={cn(
                                                "rounded-full h-auto font-semibold data-[state=active]:bg-[#6347f9] data-[state=active]:text-white data-[state=active]:shadow-md bg-white text-slate-600 shadow-sm border border-transparent hover:bg-slate-50 transition-all active:scale-95 px-6 py-2.5",
                                            )}
                                        >
                                            <Clock className="mr-2 w-4 h-4" />
                                            Lịch trình
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="info"
                                            className={cn(
                                                "rounded-full h-auto font-semibold data-[state=active]:bg-[#6347f9] data-[state=active]:text-white data-[state=active]:shadow-md bg-white text-slate-600 shadow-sm border border-transparent hover:bg-slate-50 transition-all active:scale-95 px-6 py-2.5",
                                            )}
                                        >
                                            <Utensils className="mr-2 w-4 h-4" />
                                            Thông tin
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="itinerary" className="mt-0 space-y-8">
                                    {(template.days || []).map((day, index) => {
                                        const isExpanded = expandedDayIds.includes(day.id.toString());
                                        return (
                                            <div key={day.id} className="relative">
                                                {/* Day Header - Accordion Style */}
                                                <div
                                                    className={cn(
                                                        "flex items-start gap-3 mb-4 cursor-pointer select-none group/header hover:bg-slate-50/80 rounded-xl transition-colors",
                                                        isMobileView ? "p-2 -mx-2" : "p-3 -mx-3"
                                                    )}
                                                    onClick={() => toggleDay(day.id.toString())}
                                                >
                                                    <div className={cn(
                                                        "flex-shrink-0 rounded-full flex items-center justify-center font-bold shadow-sm transition-all",
                                                        isMobileView ? "w-8 h-8 text-base" : "w-10 h-10 text-lg",
                                                        isExpanded ? "bg-[#6347f9] text-white" : "bg-slate-200 text-slate-500"
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 pt-1">
                                                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className={cn(
                                                                    "font-bold leading-tight transition-colors",
                                                                    isExpanded ? "text-slate-900" : "text-slate-600",
                                                                    isMobileView ? "text-lg" : "text-xl"
                                                                )}>
                                                                    {day.title}
                                                                </h3>
                                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                                            </div>
                                                        </div>
                                                        {day.description && (
                                                            <p className="text-slate-500 mt-1 pl-0 text-sm leading-snug">{day.description}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Day Activities */}
                                                {isExpanded && (
                                                    <div className={cn(
                                                        "border-l-2 border-slate-100 space-y-4 pb-4 animate-in slide-in-from-top-2 duration-300",
                                                        isMobileView ? "pl-4 ml-4" : "pl-5 ml-5"
                                                    )}>
                                                        {day.activities?.length > 0 ? (
                                                            day.activities.map((act) => (
                                                                <div
                                                                    key={act.id}
                                                                    className={cn(
                                                                        "group bg-white border rounded-2xl transition-all duration-200 p-4",
                                                                        "border-slate-200 hover:border-purple-200 hover:shadow-sm"
                                                                    )}
                                                                >
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-[#6347f9] flex items-center justify-center">
                                                                            {getActivityIcon(act.title)}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <h4 className="font-semibold text-slate-900 text-base">{act.title}</h4>
                                                                                {act.startTime && (
                                                                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                                                                                        {act.startTime}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                                                                                {act.location && (
                                                                                    <span className="flex items-center gap-1 hover:text-[#6347f9] transition-colors">
                                                                                        <MapPin className="w-3 h-3" /> {act.location}
                                                                                    </span>
                                                                                )}
                                                                                {act.durationMin && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Clock className="w-3 h-3" /> {act.durationMin} phút
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {act.notes && (
                                                                                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-sm italic text-slate-500 border border-slate-100">
                                                                                    "{act.notes}"
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 text-sm italic">
                                                                Chưa có hoạt động nào cho ngày này.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </TabsContent>

                                <TabsContent value="info">
                                    <Card className="border-none shadow-sm bg-slate-50">
                                        <CardContent className="p-6">
                                            <p className="text-slate-500 italic text-center">
                                                Thông tin bổ sung về chuyến đi, hướng dẫn hoặc lưu ý sẽ hiển thị ở đây.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* RIGHT COLUMN: Sidebar Actions (Desktop) */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <Card className="rounded-[32px] border-none shadow-xl overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#6347f9] to-purple-400" />
                                    <CardContent className="p-8">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Bạn thích lịch trình này?</h3>
                                        <p className="text-slate-500 mb-6 text-sm">
                                            Biến nó thành chuyến đi của bạn ngay lập tức và tùy chỉnh theo ý muốn.
                                        </p>

                                        <Button
                                            onClick={handleUseTemplate}
                                            disabled={usingTemplate}
                                            className="w-full h-12 rounded-xl bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-base shadow-lg hover:shadow-purple-200 transition-all"
                                        >
                                            {usingTemplate ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tạo...
                                                </>
                                            ) : (
                                                <>
                                                    Sử dụng Template này
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Floating Action Button */}
                {isMobileView && (
                    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 z-50 safe-area-bottom pb-8">
                        <Button
                            onClick={handleUseTemplate}
                            disabled={usingTemplate}
                            className="w-full h-12 rounded-xl bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-base shadow-lg"
                        >
                            {usingTemplate ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tạo...
                                </>
                            ) : (
                                <>
                                    Sử dụng Template này
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </AnimatedTransition>
        </div>
    );
};

export default TripTemplateDetailPage;