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
        <div className="min-h-screen bg-[#edeeff]">
            {/* HERO SECTION */}
            <div className="relative w-full h-[40vh] min-h-[350px] lg:h-[450px] group">
                {template.avatar ? (
                    <img
                        src={template.avatar}
                        alt={template.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <Camera className="w-16 h-16 text-slate-300" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/40 to-transparent opacity-90" />

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 pl-3 pr-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/10 active:scale-95 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Quay lại</span>
                    </button>
                </div>


                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 w-full pb-24 pt-24 bg-gradient-to-t from-[#f8f9fc] via-transparent to-transparent">
                    {/* This gradient blends the image into the background color if needed, but we used negative margin instead typically. 
                        Let's stick to the design: The text is ON the image. 
                        The 'Giới thiệu' card is below.
                    */}
                </div>

                <div className="absolute bottom-16 left-0 w-full px-4 lg:px-0">
                    <div className="max-w-6xl mx-auto">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {template.province && (
                                <Badge className="bg-[#6347f9] hover:bg-[#5136db] text-white border-none px-3 py-1.5 text-sm rounded-lg shadow-lg shadow-indigo-900/20">
                                    <MapPin className="w-3.5 h-3.5 mr-1.5" /> {template.province.name}
                                </Badge>
                            )}
                            <Badge className="bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 px-3 py-1.5 text-sm rounded-lg">
                                {getTotalDays()} Days
                            </Badge>
                            <Badge className="bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 px-3 py-1.5 text-sm rounded-lg">
                                {getTotalActivities()} Activities
                            </Badge>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-black text-white mb-4 leading-[1.1] tracking-tight drop-shadow-sm max-w-4xl">
                            {template.title}
                        </h1>

                        {/* Creator */}
                        <div className="flex items-center gap-2.5 text-white/90 font-medium text-base">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                <Users className="w-4 h-4 text-white" />
                            </div>
                            Created by <span className="text-white font-bold">{template.user?.fullName || "Goouty Official"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="max-w-6xl mx-auto px-4 lg:px-0 -mt-8 relative z-10 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description Card */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-[#6347f9] text-xl font-bold mb-4 flex items-center gap-2">
                                Giới thiệu chuyến đi
                            </h2>
                            <p className="text-slate-600 leading-relaxed font-medium text-lg whitespace-pre-line">
                                {template.description || "Chưa có mô tả chi tiết cho mẫu chuyến đi này."}
                            </p>
                        </div>

                        {/* Itinerary Section */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-900">Lịch trình chi tiết</h3>
                            </div>

                            <div className="space-y-6">
                                {(template.days || []).map((day, index) => {
                                    const isExpanded = expandedDayIds.includes(day.id.toString());
                                    return (
                                        <div key={day.id} className="relative pl-8 md:pl-0">
                                            {/* Desktop Timeline Line */}
                                            <div className="hidden md:block absolute left-[19px] top-10 bottom-0 w-[2px] bg-slate-100" />

                                            <div
                                                className={cn(
                                                    "group/day relative bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300",
                                                    isExpanded ? "shadow-md ring-1 ring-[#6347f9]/10" : "hover:shadow-sm"
                                                )}
                                            >
                                                {/* Day Header */}
                                                <div
                                                    className="flex items-start gap-4 p-5 cursor-pointer select-none bg-white"
                                                    onClick={() => toggleDay(day.id.toString())}
                                                >
                                                    <div className={cn(
                                                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all z-10",
                                                        isExpanded ? "bg-[#6347f9] text-white shadow-lg shadow-indigo-200" : "bg-slate-100 text-slate-500 group-hover/day:bg-slate-200"
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 pt-1">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className={cn(
                                                                "text-xl font-bold message-heading transition-colors",
                                                                isExpanded ? "text-slate-900" : "text-slate-600"
                                                            )}>
                                                                {day.title}
                                                            </h3>
                                                            {isExpanded
                                                                ? <ChevronDown className="w-5 h-5 text-slate-400" />
                                                                : <ChevronRight className="w-5 h-5 text-slate-400" />
                                                            }
                                                        </div>
                                                        {day.description && (
                                                            <p className="text-slate-500 text-sm mt-1">{day.description}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Day Activities */}
                                                {isExpanded && (
                                                    <div className="px-5 pb-5 pt-0 space-y-3">
                                                        <div className="h-px w-full bg-slate-50 mb-4" />
                                                        {day.activities?.length > 0 ? (
                                                            day.activities.map((act) => (
                                                                <div
                                                                    key={act.id}
                                                                    className="flex gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group/act"
                                                                >
                                                                    <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-white text-[#6347f9] shadow-sm flex items-center justify-center border border-indigo-100">
                                                                        {getActivityIcon(act.title)}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-start justify-between">
                                                                            <h4 className="font-semibold text-slate-900">{act.title}</h4>
                                                                            {act.startTime && (
                                                                                <span className="text-xs font-bold text-[#6347f9] bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                                                                                    {act.startTime}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                                                                            {act.location && (
                                                                                <span className="flex items-center gap-1.5">
                                                                                    <MapPin className="w-3.5 h-3.5 text-red-500" /> {act.location}
                                                                                </span>
                                                                            )}
                                                                            {act.durationMin && (
                                                                                <span className="flex items-center gap-1.5">
                                                                                    <Clock className="w-3.5 h-3.5 text-yellow-500" /> {act.durationMin} phút
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {act.notes && (
                                                                            <p className="mt-2 text-sm text-slate-500 italic">
                                                                                "{act.notes}"
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-center py-6 text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-xl">
                                                                Chưa có hoạt động nào cho ngày này
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                                {/* Decorative bg blob */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6347f9]/10 rounded-full blur-2xl" />

                                <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10">Sẵn sàng đi chưa?</h3>
                                <p className="text-slate-500 mb-8 leading-relaxed relative z-10">
                                    Sử dụng mẫu này để tạo ngay chuyến đi của riêng bạn và tùy chỉnh theo ý thích.
                                </p>

                                <Button
                                    onClick={handleUseTemplate}
                                    disabled={usingTemplate}
                                    className="w-full h-14 text-lg rounded-xl bg-[#6347f9] hover:bg-[#5136db] text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:-translate-y-0.5"
                                >
                                    {usingTemplate ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tạo...
                                        </>
                                    ) : (
                                        <div className="flex items-center">
                                            Sử dụng Template này <ChevronRight className="w-5 h-5 ml-2" />
                                        </div>
                                    )}
                                </Button>
                            </div>

                            <div className="mt-6 flex flex-col gap-4">
                                {/* Additional info cards could go here */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Footer Action */}
            {
                isMobileView && (
                    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 z-50 safe-area-bottom pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
                )
            }
        </div >
    );
};

export default TripTemplateDetailPage;