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
import { cn } from '@/lib/utils';

const PWATemplateDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useGlobalToast();
    const showContent = useAnimateIn(false, 300);
    const { isAuthenticated } = useAuth();

    const [template, setTemplate] = useState<DATABASE_TYPES.tripTemplates | null>(null);
    const [loading, setLoading] = useState(true);
    const [usingTemplate, setUsingTemplate] = useState(false);
    const [activeTab, setActiveTab] = useState('itinerary');
    const [expandedDayIds, setExpandedDayIds] = useState<string[]>([]);

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
        <div className="min-h-screen bg-[#f8f9fc] pb-[100px]">
            {/* HERO SECTION */}
            <div className="relative w-full h-[45vh] min-h-[360px]">
                {template.avatar ? (
                    <img
                        src={template.avatar}
                        alt={template.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-slate-300" />
                    </div>
                )}

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/20 to-transparent opacity-90" />

                {/* Back Button */}
                <div className="absolute top-4 left-4 z-50">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all border border-white/10 active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-12 left-0 w-full px-5">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {template.province && (
                            <Badge className="bg-[#6347f9] text-white border-none px-2.5 py-1 text-xs rounded-lg shadow-lg shadow-indigo-900/10">
                                <MapPin className="w-3 h-3 mr-1" /> {template.province.name}
                            </Badge>
                        )}
                        <Badge className="bg-white/10 text-white backdrop-blur-md border border-white/20 px-2.5 py-1 text-xs rounded-lg">
                            {getTotalDays()} Days
                        </Badge>
                        <Badge className="bg-white/10 text-white backdrop-blur-md border border-white/20 px-2.5 py-1 text-xs rounded-lg">
                            {getTotalActivities()} Activities
                        </Badge>
                    </div>

                    <h1 className="text-3xl font-black text-white mb-2.5 leading-[1.2] drop-shadow-sm">
                        {template.title}
                    </h1>

                    <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/30 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <Users className="w-3 h-3 text-white" />
                        </div>
                        Created by <span className="text-white font-bold">{template.user?.fullName || "Goouty"}</span>
                    </div>
                </div>
            </div>

            <AnimatedTransition show={showContent} animation="fade">
                <div className="px-4 -mt-6 relative z-10">
                    {/* Description Card */}
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 mb-6">
                        <h2 className="text-[#6347f9] text-lg font-bold mb-3 flex items-center gap-2">
                            Giới thiệu chuyến đi
                        </h2>
                        <p className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-line font-medium">
                            {template.description || "Chưa có mô tả chi tiết cho mẫu chuyến đi này."}
                        </p>
                    </div>

                    {/* Itinerary Section */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 px-1">Lịch trình chi tiết</h3>
                        <div className="space-y-4">
                            {(template.days || []).map((day, index) => {
                                const isExpanded = expandedDayIds.includes(day.id.toString());
                                return (
                                    <div key={day.id} className="relative">
                                        <div
                                            className="flex items-start gap-4 mb-3 cursor-pointer select-none active:scale-[0.99] transition-transform bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                                            onClick={() => toggleDay(day.id.toString())}
                                        >
                                            <div className={cn(
                                                "flex-shrink-0 rounded-full flex items-center justify-center font-bold shadow-sm transition-all w-9 h-9 text-sm",
                                                isExpanded ? "bg-[#6347f9] text-white shadow-indigo-200" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 pt-0.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className={cn(
                                                        "font-bold leading-tight text-[17px] transition-colors",
                                                        isExpanded ? "text-slate-900" : "text-slate-600"
                                                    )}>
                                                        {day.title}
                                                    </h3>
                                                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                                </div>
                                                {day.description && (
                                                    <p className="text-slate-500 mt-1 text-xs line-clamp-2 leading-relaxed">{day.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="pl-4 ml-4 border-l-2 border-dashed border-slate-200 space-y-3 pb-2 pt-1">
                                                {day.activities?.length > 0 ? (
                                                    day.activities.map((act) => (
                                                        <div key={act.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative group">
                                                            {/* Connector dot */}
                                                            <div className="absolute -left-[21px] top-6 w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-300" />

                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-[#6347f9] flex items-center justify-center">
                                                                    {getActivityIcon(act.title)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                                                        <h4 className="font-bold text-slate-900 text-[15px] leading-tight">{act.title}</h4>
                                                                        {act.startTime && (
                                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md flex-shrink-0">
                                                                                {act.startTime}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
                                                                        {act.location && (
                                                                            <span className="flex items-center gap-1">
                                                                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> <span className="truncate max-w-[150px]">{act.location}</span>
                                                                            </span>
                                                                        )}
                                                                        {act.durationMin && (
                                                                            <span className="flex items-center gap-1 flex-shrink-0">
                                                                                <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> {act.durationMin}p
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {act.notes && (
                                                                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
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
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 z-50 safe-area-bottom pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
        </div>
    );
};

export default PWATemplateDetailsPage;
