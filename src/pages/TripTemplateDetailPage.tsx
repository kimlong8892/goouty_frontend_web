import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Plane,
  Hotel,
  Camera,
  Car,
  ChevronRight,
  Loader2,
  Utensils,
} from 'lucide-react';
import { api } from '@/integrations/api/client';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { useAuth } from '@/contexts/AuthContext.tsx';

const TripTemplateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useGlobalToast();
  const showContent = useAnimateIn(false, 300);
  const { isAuthenticated } = useAuth(); // Get auth state

  const [template, setTemplate] = useState<DATABASE_TYPES.tripTemplates | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingTemplate, setUsingTemplate] = useState(false);

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
    } catch (error) {
      console.error('Error loading template details:', error);
      // Removed generic error toast to avoid blocking UI for guests if API fails silently
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
      // Navigate to the new trip's detail page
      navigate(`/trip/${newTrip.id}`);
    } catch (error) {
      showToast("Không thể tạo chuyến đi từ mẫu. Vui lòng thử lại.", "error");
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6c5dd3]"></div>
          <p className="text-slate-500 font-medium">Đang tải template...</p>
        </div>
      </div>
    );
  }

  if (!template) return null; // Redirected in catch

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <AnimatedTransition show={showContent} animation="fade">

        {/* --- HERO HEADER --- */}
        <div className="relative h-[450px] w-full group overflow-hidden">
          {/* Background Image */}
          <img
            src={template.avatar || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"}
            alt={template.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

          {/* Back Button */}
          <div className="absolute top-6 left-6 z-20 md:top-8 md:left-8">
            <Button
              variant="secondary"
              className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-none shadow-lg px-4"
              onClick={() => navigate('/templates')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
            </Button>
          </div>

          {/* Title Content */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-20">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap gap-3 mb-4">
                {template.province && (
                  <Badge className="bg-[#6c5dd3] hover:bg-[#5b4ec2] text-white border-none px-3 py-1 text-sm">
                    <MapPin className="w-3 h-3 mr-1" /> {template.province.name}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-white/10 text-white backdrop-blur border-white/20 px-3 py-1 text-sm">
                  {getTotalDays()} Days
                </Badge>
                <Badge variant="outline" className="bg-white/10 text-white backdrop-blur border-white/20 px-3 py-1 text-sm">
                  {getTotalActivities()} Activities
                </Badge>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight shadow-sm drop-shadow-md">
                {template.title}
              </h1>

              <div className="flex items-center gap-2 text-white/80 font-medium">
                <Users className="w-4 h-4" />
                <span>Created by <span className="text-white font-bold">{template.user?.fullName || "Goouty Official"}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-30 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Itinerary & Details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description Card */}
            <Card className="rounded-[32px] border-none shadow-xl bg-white overflow-hidden">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-[#6c5dd3] mb-4 flex items-center gap-2">
                  Giới thiệu chuyến đi
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">
                  {template.description || "Chưa có mô tả chi tiết cho mẫu chuyến đi này."}
                </p>
              </CardContent>
            </Card>

            {/* Itinerary Timeline */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-bold text-slate-800">Lịch trình chi tiết</h2>
                <Badge variant="secondary" className="bg-slate-200 text-slate-600 hover:bg-slate-300">
                  Preview
                </Badge>
              </div>

              {template.days?.map((day, idx) => (
                <Card key={day.id} className="rounded-[24px] overflow-hidden border-none shadow-md group hover:shadow-lg transition-shadow bg-white">
                  {/* Day Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-white p-5 border-b border-purple-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#6c5dd3] text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-200">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{day.title}</h3>
                      {day.description && <p className="text-sm text-slate-500 line-clamp-1">{day.description}</p>}
                    </div>
                  </div>

                  {/* Activities List */}
                  <div className="p-2 space-y-1 bg-white">
                    {day.activities?.length > 0 ? (
                      day.activities.map((act) => (
                        <div key={act.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-[#6c5dd3] flex items-center justify-center">
                            {getActivityIcon(act.title)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-slate-900 text-base">{act.title}</h4>
                              {act.startTime && (
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                                  {act.startTime}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                              {act.location && (
                                <span className="flex items-center gap-1 hover:text-[#6c5dd3] transition-colors">
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
                              <p className="text-sm text-slate-400 mt-2 bg-slate-50 p-2 rounded-lg italic border border-slate-100">
                                "{act.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 italic">
                        Không có hoạt động nào trong ngày này.
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Sidebar Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-8">

              {/* Action Card */}
              <Card className="rounded-[32px] border-none shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#6c5dd3] to-purple-400" />
                <CardContent className="p-8 pt-10 text-center">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Sẵn sàng đi chưa?</h3>
                  <p className="text-slate-500 mb-8">
                    Sử dụng mẫu này để tạo ngay chuyến đi của riêng bạn và tùy chỉnh theo ý thích.
                  </p>

                  <Button
                    onClick={handleUseTemplate}
                    disabled={usingTemplate}
                    className="w-full h-14 rounded-2xl bg-[#6c5dd3] hover:bg-[#5b4ec2] text-white font-bold text-lg shadow-xl hover:shadow-purple-300 transition-all duration-300 transform hover:-translate-y-1"
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
                </CardContent>
              </Card>

              {/* Mascot Illustration */}
              <div className="hidden lg:flex justify-center">
                <img
                  src="/create_trip_mascot.png"
                  alt="Mascot"
                  className="w-48 opacity-90 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />
              </div>

            </div>
          </div>

        </div>

      </AnimatedTransition>
    </div>
  );
};

export default TripTemplateDetailPage;
