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
        <div className="min-h-screen bg-slate-50 pb-[160px]">
            {/* Mobile Sticky Header */}
            <div className="sticky top-0 z-[60] bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900 truncate">
                        {template.title}
                    </h1>
                </div>
            </div>

            <AnimatedTransition show={showContent} animation="fade">
                <div className="px-4 py-6">
                    {/* Header Info */}
                    <div className="mb-6">
                        <div className="flex gap-2 mb-3 flex-wrap">
                            {template.province && (
                                <Badge className="bg-[#6347f9] text-white border-none px-2.5 py-0.5 text-xs rounded-md">
                                    <MapPin className="w-3 h-3 mr-1" /> {template.province.name}
                                </Badge>
                            )}
                            <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-200 px-2.5 py-0.5 text-xs rounded-md">
                                {getTotalDays()} Ngày
                            </Badge>
                            <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-200 px-2.5 py-0.5 text-xs rounded-md">
                                {getTotalActivities()} Hoạt động
                            </Badge>
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
                            {template.title}
                        </h1>

                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                            <Users className="w-4 h-4" />
                            <span>Tạo bởi <span className="font-semibold text-slate-700">{template.user?.fullName || "Goouty Official"}</span></span>
                        </div>

                        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-4">
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                    {template.description || "Chưa có mô tả chi tiết cho mẫu chuyến đi này."}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs & Itinerary */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start bg-transparent p-0 mb-4 border-b border-gray-200 pb-px gap-4 overflow-x-auto">
                            <TabsTrigger
                                value="itinerary"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6347f9] data-[state=active]:text-[#6347f9] bg-transparent px-0 pb-2 font-bold text-slate-500 data-[state=active]:shadow-none transition-none"
                            >
                                Lịch trình
                            </TabsTrigger>
                            <TabsTrigger
                                value="info"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6347f9] data-[state=active]:text-[#6347f9] bg-transparent px-0 pb-2 font-bold text-slate-500 data-[state=active]:shadow-none transition-none"
                            >
                                Thông tin
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="itinerary" className="mt-0 space-y-4">
                            {(template.days || []).map((day, index) => {
                                const isExpanded = expandedDayIds.includes(day.id.toString());
                                return (
                                    <div key={day.id} className="relative">
                                        <div
                                            className="flex items-start gap-3 mb-3 cursor-pointer select-none active:bg-slate-100 rounded-lg p-2 -mx-2 transition-colors"
                                            onClick={() => toggleDay(day.id.toString())}
                                        >
                                            <div className={cn(
                                                "flex-shrink-0 rounded-full flex items-center justify-center font-bold shadow-sm transition-all w-8 h-8 text-sm",
                                                isExpanded ? "bg-[#6347f9] text-white" : "bg-slate-200 text-slate-500"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 pt-0.5">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn(
                                                        "font-bold leading-tight text-base transition-colors",
                                                        isExpanded ? "text-slate-900" : "text-slate-600"
                                                    )}>
                                                        {day.title}
                                                    </h3>
                                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                                </div>
                                                {day.description && (
                                                    <p className="text-slate-500 mt-0.5 text-xs line-clamp-1">{day.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="pl-4 ml-4 border-l-2 border-slate-100 space-y-3 pb-2">
                                                {day.activities?.length > 0 ? (
                                                    day.activities.map((act) => (
                                                        <div key={act.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-indigo-50 text-[#6347f9] flex items-center justify-center">
                                                                    {getActivityIcon(act.title)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                                        <h4 className="font-semibold text-slate-900 text-[15px] leading-tight">{act.title}</h4>
                                                                        {act.startTime && (
                                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                                                                {act.startTime}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                                                        {act.location && (
                                                                            <span className="flex items-center gap-1 truncate">
                                                                                <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{act.location}</span>
                                                                            </span>
                                                                        )}
                                                                        {act.durationMin && (
                                                                            <span className="flex items-center gap-1 flex-shrink-0">
                                                                                <Clock className="w-3 h-3" /> {act.durationMin}p
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {act.notes && (
                                                                        <p className="mt-2 text-xs text-slate-400 italic bg-slate-50 p-2 rounded border border-slate-50">
                                                                            "{act.notes}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-xs text-slate-400 italic pl-2">Không có hoạt động.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </TabsContent>

                        <TabsContent value="info">
                            <div className="text-center py-8 text-slate-400 text-sm italic">
                                Thông tin bổ sung sẽ hiển thị ở đây.
                            </div>
                        </TabsContent>
                    </Tabs>

                </div>

                {/* Fixed Bottom Action for PWA */}
                <div className="fixed bottom-[80px] left-0 right-0 px-4 py-2 z-[40]">
                    <Button
                        size="lg"
                        className="w-full h-12 text-base font-bold bg-[#6347f9] hover:bg-[#5136db] shadow-xl shadow-indigo-200/50 rounded-xl active:scale-[0.98] transition-transform"
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
