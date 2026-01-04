import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/integrations/api/client';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { Button } from '@/components/ui/button';
import {
    MapPin,
    ArrowLeft,
    Loader2,
    User,
    Clock,
    Calendar,
    Plane,
    Hotel,
    Camera,
    Car,
    Utensils,
    ChevronRight,
    Users
} from 'lucide-react';
import { useGlobalToast } from '@/utils/globalToast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';

const PWATemplateDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useGlobalToast();
    const { isAuthenticated } = useAuth();
    const showContent = useAnimateIn(false, 300);

    const [template, setTemplate] = useState<DATABASE_TYPES.tripTemplates | null>(null);
    const [loading, setLoading] = useState(true);
    const [usingTemplate, setUsingTemplate] = useState(false);

    useEffect(() => {
        fetchTemplate();
        // Scroll to top
        window.scrollTo(0, 0);
    }, [id]);

    const fetchTemplate = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await api.tripTemplates.getById(id);
            setTemplate(data);
        } catch (error) {
            console.error('Error fetching template:', error);
            // navigate('/');
            // Removed generic error toast to avoid blocking UI for guests if API fails silently
        } finally {
            setLoading(false);
        }
    };

    const handleUseTemplate = async () => {
        if (!isAuthenticated) {
            showToast('Vui lòng đăng nhập để sử dụng mẫu này', 'warning');
            navigate('/auth');
            return;
        }
        if (!template) return;

        setUsingTemplate(true);
        try {
            const newTrip = await api.trips.createFromTemplate(template.id, template.title);
            showToast('Đã tạo chuyến đi thành công!', 'success');
            navigate(`/trip/${newTrip.id}`);
        } catch (error) {
            console.error('Error creating trip from template:', error);
            showToast('Không thể tạo chuyến đi. Vui lòng thử lại.', 'error');
        } finally {
            setUsingTemplate(false);
        }
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
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
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
            <AnimatedTransition show={showContent} animation="fade">

                {/* --- HERO HEADER --- */}
                <div className="relative h-[380px] w-full group overflow-hidden">
                    {/* Background Image */}
                    <img
                        src={template.avatar || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"}
                        alt={template.title}
                        className="w-full h-full object-cover transition-transform duration-700"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                    {/* Back Button */}
                    <div className="absolute top-4 left-4 z-20">
                        <Button
                            variant="secondary"
                            className="rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border-none h-10 w-10 p-0 shadow-lg"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Title Content */}
                    <div className="absolute bottom-0 left-0 w-full p-5 z-20">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {template.province && (
                                <Badge className="bg-[#6347f9] hover:bg-[#5136db] text-white border-none px-2.5 py-0.5 text-xs">
                                    <MapPin className="w-3 h-3 mr-1" /> {template.province.name}
                                </Badge>
                            )}
                            <Badge variant="outline" className="bg-white/10 text-white backdrop-blur border-white/20 px-2.5 py-0.5 text-xs">
                                {getTotalDays()} Days
                            </Badge>
                            <Badge variant="outline" className="bg-white/10 text-white backdrop-blur border-white/20 px-2.5 py-0.5 text-xs">
                                {getTotalActivities()} Activities
                            </Badge>
                        </div>

                        <h1 className="text-3xl font-black text-white mb-3 leading-tight shadow-sm drop-shadow-md line-clamp-2">
                            {template.title}
                        </h1>

                        <div className="flex items-center gap-2 text-white/80 font-medium text-sm">
                            <Users className="w-4 h-4" />
                            <span>Created by <span className="text-white font-bold">{template.user?.fullName || "Goouty Official"}</span></span>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-6">
                    {/* Description Card */}
                    <Card className="rounded-[24px] border-none shadow-sm bg-white overflow-hidden mb-8">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold text-[#6347f9] mb-3 flex items-center gap-2">
                                Giới thiệu chuyến đi
                            </h2>
                            <p className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-line">
                                {template.description || "Chưa có mô tả chi tiết cho mẫu chuyến đi này."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Itinerary Timeline */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xl font-bold text-slate-800">Lịch trình chi tiết</h2>
                        </div>

                        {template.days?.map((day, idx) => (
                            <Card key={day.id} className="rounded-[20px] overflow-hidden border-none shadow-sm group bg-white">
                                {/* Day Header */}
                                <div className="bg-gradient-to-r from-purple-50 to-white p-4 border-b border-purple-50 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#6347f9] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-purple-200 shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base text-slate-900 line-clamp-1">{day.title}</h3>
                                    </div>
                                </div>

                                {/* Activities List */}
                                <div className="p-2 space-y-1 bg-white">
                                    {day.activities && day.activities.length > 0 ? (
                                        day.activities
                                            .sort((a, b) => a.activityOrder - b.activityOrder)
                                            .map((act) => (
                                                <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                                    <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-[#6347f9] flex items-center justify-center">
                                                        {getActivityIcon(act.title)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className="font-semibold text-slate-900 text-[15px] leading-tight">{act.title}</h4>
                                                            {act.startTime && (
                                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                                                    {new Date(act.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                                            {act.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" /> <span className="truncate max-w-[150px]">{act.location}</span>
                                                                </span>
                                                            )}
                                                            {act.durationMin && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> {act.durationMin}p
                                                                </span>
                                                            )}
                                                        </div>

                                                        {act.notes && (
                                                            <p className="text-xs text-slate-400 mt-2 bg-slate-50 p-2 rounded-lg italic border border-slate-100 line-clamp-2">
                                                                "{act.notes}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="p-6 text-center text-slate-400 italic text-sm">
                                            Không có hoạt động nào.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Fixed Bottom Action */}
                <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-[40] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
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
