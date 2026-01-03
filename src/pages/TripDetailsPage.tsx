import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
import {
  MapPin,
  Calendar,
  Users,
  Share2,
  Settings,
  Plus,
  Clock,
  DollarSign,
  ArrowLeft,
  Pin,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useGlobalToast } from '../utils/globalToast';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { api } from '@/integrations/api/client.ts';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { envUtils } from '@/lib/env';
import { Activity as LibActivity } from '@/lib/types';
import { AddDayDialog } from '@/components/dialogs/AddDayDialog.tsx';
import { EditDayDialog } from '@/components/dialogs/EditDayDialog.tsx';
import { AddActivityDialog } from '@/components/dialogs/AddActivityDialog.tsx';
import { EditActivityDialog } from '@/components/dialogs/EditActivityDialog.tsx';
import { AddExpenseDialog } from '@/components/dialogs/AddExpenseDialog.tsx';
import { TripMembers } from '@/components/TripMembers.tsx';
import { ShareLinkManager } from '@/components/ShareLinkManager.tsx';
import { ExpenseSection } from '@/components/expenses/ExpenseSection.tsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog.tsx';
import { EditTripDialog } from '@/components/dialogs/EditTripDialog.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// ... (Type definitions)
type ApiError = {
  message: string;
  status?: number;
  code?: string;
};

type ApiActivity = {
  id: number;
  title: string;
  startTime: string | null;
  durationMin: number;
  location: string;
  notes: string;
  important: boolean;
  dayId: number;
  pinned?: boolean;
  images?: any[];
};

type ApiDay = {
  id: number;
  title: string;
  date: string;
  tripId: number;
  activities: ApiActivity[];
};

type ApiTrip = DATABASE_TYPES.trips;

type TripDetails = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  provinceId?: string;
  province?: {
    id: string;
    name: string;
    code: number;
    divisionType: string;
    codename: string;
    phoneCode: number;
  };
  isPublic: boolean;
  userRole: 'owner' | 'member' | null;
  userId: string;
  slug?: string;
  shareToken?: string;
  members?: {
    id: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      profilePicture?: string;
    };
    role: string;
    status?: string;
  }[];
  memberCount?: number;
};

type Day = {
  id: string;
  title: string;
  date: string;
  tripId: string;
  orderIndex?: number;
  description?: string;
};

type Activity = {
  id: string;
  title: string;
  dayId: string;
  timeStart: string | null;
  durationMin?: number;
  location?: string;
  notes?: string;
  pinned?: boolean;
  orderIndex?: number;
  images?: { id: string; url: string; filename: string }[];
};

type Expense = {
  id: string;
  title: string;
  amount: string;
  date: string;
  paidBy: string;
  tripId: string;
  participants: string[];
  createdAt?: string;
};

const TripDetailsPage = () => {
  const { showToast } = useGlobalToast();
  const showContent = useAnimateIn(false, 300);
  const { isPWA } = usePWA();
  const isMobile = useIsMobile();
  const isMobileView = isPWA || isMobile;
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const allowedTabs = ['itinerary', 'expenses', 'members', 'share'] as const;
  const initialTabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    initialTabParam && allowedTabs.includes(initialTabParam as any) ? (initialTabParam as string) : 'itinerary'
  );
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<Day[]>([]);
  const [activitiesByDay, setActivitiesByDay] = useState<Record<string, Activity[]>>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [apiData, setApiData] = useState<ApiTrip | null>(null);

  // State for collapsible days (default empty = all collapsed)
  const [expandedDayIds, setExpandedDayIds] = useState<string[]>([]);
  const [showAddDay, setShowAddDay] = useState(false);

  const toggleDay = (dayId: string) => {
    setExpandedDayIds(prev =>
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  // Dialog states
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showEditDay, setShowEditDay] = useState(false);
  const [editingDay, setEditingDay] = useState<Day | null>(null);
  const [showEditActivity, setShowEditActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LibActivity | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editTripDialogOpen, setEditTripDialogOpen] = useState(false);

  const { id } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Write tab to URL on change
  useEffect(() => {
    const current = searchParams.get('tab');
    if (current !== activeTab) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeTab);
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  useEffect(() => {
    if (trip) {
      document.title = `${trip.name} - Goouty`;
    } else {
      document.title = 'Chi tiết chuyến đi - Goouty';
    }
  }, [trip]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (id && user) {
      fetchTripDetails();
    }
  }, [id, isAuthenticated, authLoading, navigate, user]);

  useEffect(() => {
    if (trip?.userRole !== 'owner' && activeTab === 'share') {
      setActiveTab('itinerary');
    }
  }, [trip?.userRole, activeTab]);

  // Check for edit query param and open dialog
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam === 'true' && trip && trip.userRole === 'owner') {
      setEditTripDialogOpen(true);
      // Remove edit param from URL
      const next = new URLSearchParams(searchParams);
      next.delete('edit');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, trip, setSearchParams]);

  const fetchDaysAndActivities = async () => {
    if (!id || !apiData) return;

    try {
      const tripData = await api.trips.getById(id!);
      setApiData(tripData);

      const transformedDays: Day[] = tripData.days.map(apiDay => ({
        id: apiDay.id.toString(),
        title: apiDay.title,
        date: apiDay.date,
        tripId: tripData.id,
        description: (apiDay as any).description || undefined,
      }));

      setDays(transformedDays);

      const activitiesByDayMap: Record<string, Activity[]> = {};
      tripData.days.forEach(day => {
        const dayId = day.id.toString();
        activitiesByDayMap[dayId] = (day.activities || []).map(activity => ({
          id: activity.id.toString(),
          title: activity.title,
          dayId: dayId,
          timeStart: activity.startTime,
          durationMin: activity.durationMin,
          location: activity.location,
          notes: activity.notes,
          pinned: activity.important,
          important: activity.important,
          images: (activity as any).images?.map((image: any) => ({
            id: image.id.toString(),
            url: image.url,
            filename: image.filename
          }))
        }));
      });

      setActivitiesByDay(activitiesByDayMap);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showToast(apiError.message || 'Không thể tải lịch trình', 'error');
    }
  };


  const fetchTripDetails = async () => {
    if (!user || !id) return;

    if (!id || typeof id !== 'string' || id === 'NaN' || id === 'undefined') {
      console.error('Invalid trip ID:', id);
      showToast('ID chuyến đi không hợp lệ', 'error');
      navigate('/trips');
      return;
    }

    setLoading(true);
    try {
      const [tripData, membersData] = await Promise.all([
        api.trips.getById(id),
        api.members.getByTrip(id)
      ]);

      setApiData(tripData);

      const isOwner = tripData.userId === user.id;
      const isMember = membersData.some(member => member.user.id === user.id);

      const transformedTrip: TripDetails = {
        id: tripData.id,
        name: tripData.title,
        description: tripData.description,
        startDate: tripData.startDate,
        provinceId: tripData.provinceId,
        province: tripData.province,
        isPublic: tripData.isPublic || false,
        userRole: isOwner ? 'owner' : (isMember ? 'member' : null),
        userId: tripData.userId,
        slug: tripData.id,
        shareToken: tripData.shareToken,
        members: membersData,
        memberCount: (membersData?.filter(m => m && m.user?.id !== tripData.userId && (m.status === 'accepted' || !m.status)).length || 0) + 1
      };

      setTrip(transformedTrip);

      if (tripData.days) {
        const transformedDays: Day[] = tripData.days.map(apiDay => ({
          id: apiDay.id.toString(),
          title: apiDay.title,
          date: apiDay.date,
          tripId: tripData.id,
          description: (apiDay as any).description || undefined,
        }));

        setDays(transformedDays);

        const activitiesByDayMap: Record<string, Activity[]> = {};
        tripData.days.forEach(day => {
          const dayId = day.id.toString();
          activitiesByDayMap[dayId] = (day.activities || []).map(activity => ({
            id: activity.id.toString(),
            title: activity.title,
            dayId: dayId,
            timeStart: activity.startTime,
            durationMin: activity.durationMin,
            location: activity.location,
            notes: activity.notes,
            pinned: activity.important,
            important: activity.important,
            images: (activity as any).images?.map((image: any) => ({
              id: image.id.toString(),
              url: image.url,
              filename: image.filename
            }))
          }));
        });

        setActivitiesByDay(activitiesByDayMap);
      }

      setExpenses([]);

    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Trip fetch error:', apiError);

      if (apiError.status === 404) {
        showToast('Chuyến đi không tồn tại', 'error');
        navigate('/my-trips');
      } else if (apiError.status === 403) {
        showToast('Bạn không có quyền truy cập chuyến đi này', 'error');
        navigate('/my-trips');
      } else if (apiError.status === 401) {
        showToast('Phiên đăng nhập đã hết hạn', 'error');
        navigate('/auth');
      } else {
        showToast(apiError.message || 'Không thể tải thông tin chuyến đi. Đang thử lại...', 'error');
        setTimeout(() => {
          if (user && id) {
            fetchTripDetails();
          }
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Bạn có chắc muốn xóa hoạt động này?')) return;

    try {
      setActivitiesByDay(prev => {
        const newActivitiesByDay = { ...prev };
        for (const dayId in newActivitiesByDay) {
          newActivitiesByDay[dayId] = newActivitiesByDay[dayId].filter(
            activity => activity.id !== activityId
          );
        }
        return newActivitiesByDay;
      });

      showToast('Đã xóa hoạt động', 'success');
    } catch (error: unknown) {
      showToast('Không thể xóa hoạt động', 'error');
    }
  };

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return '';
    const date = new Date(timeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  };

  const getStatus = (startDate: string | null) => {
    if (!startDate) return 'planning';
    const today = new Date();
    const start = new Date(startDate);

    if (start < today) return 'completed';
    if (start.toDateString() === today.toDateString()) return 'ongoing';
    return 'upcoming';
  };

  const statusColors = {
    planning: 'bg-blue-100 text-blue-700 border-transparent',
    upcoming: 'bg-green-100 text-green-700 border-transparent',
    ongoing: 'bg-orange-100 text-orange-700 border-transparent',
    completed: 'bg-gray-100 text-gray-700 border-transparent'
  };

  const statusLabels = {
    planning: 'Đang lập kế hoạch',
    upcoming: 'Sắp tới',
    ongoing: 'Đang diễn ra',
    completed: 'Đã hoàn thành'
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6347f9]"></div>
      </div>
    );
  }

  if (!trip) return null;

  const status = getStatus(trip.startDate);

  return (
    <div className={cn(
      "min-h-screen",
      isMobileView ? "pt-0 pb-20" : "pt-4 pb-20 px-4"
    )}>
      {/* Mobile Sticky Header */}
      {isMobileView && (
        <div className="sticky top-0 z-[60] bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 truncate">
              {trip.name}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {trip.userRole === 'owner' && (
              <button
                onClick={() => navigate(`/pwa-edit-trip/${id}`)}
                className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
              >
                <Edit className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      )}

      <AnimatedTransition show={showContent} animation="slide-up">
        <div className={cn("max-w-6xl mx-auto", isMobileView && "px-4 pt-6")}>
          {/* Header Section */}
          <div className={cn("mb-8", isMobileView && "mb-6")}>
            <div className="flex gap-2 mb-4">
              <Badge className={cn(
                "rounded-md hover:bg-opacity-80 px-3 py-1 font-medium border-0",
                statusColors[status as keyof typeof statusColors]
              )}>
                {statusLabels[status as keyof typeof statusLabels]}
              </Badge>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
                {trip.userRole === 'owner'
                  ? `Chủ chuyến đi (${trip.memberCount || 1})`
                  : `Thành viên (${trip.memberCount || 1})`}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mb-4 group">
              {!isMobileView && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-12 rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                  title="Quay lại"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              <h1 className={cn(
                "font-black text-slate-800 tracking-tight leading-tight",
                isMobileView ? "text-2xl" : "text-3xl md:text-5xl"
              )}>
                {trip.name}
              </h1>
              {trip.userRole === 'owner' && !isMobileView && (
                <EditTripDialog
                  trip={{
                    ...trip as any,
                    title: trip.name,
                  }}
                  onSuccess={fetchTripDetails}
                  open={editTripDialogOpen}
                  onOpenChange={setEditTripDialogOpen}
                >
                  <button className="text-slate-400 hover:text-[#6347f9] transition-colors p-1">
                    <Edit className="w-5 h-5" />
                  </button>
                </EditTripDialog>
              )}
            </div>

            <div className={cn(
              "flex flex-wrap items-center gap-y-3 gap-x-6 text-slate-500 font-medium text-sm mb-4",
              isMobileView && "gap-x-4"
            )}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#6347f9]" />
                <span>{formatDate(trip.startDate)}</span>
              </div>
              {trip.province && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FF4D4C]" />
                  <span>{trip.province.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{trip.memberCount || 1} người</span>
              </div>
            </div>

            {trip.description && (
              <div className={cn(
                "bg-white shadow-sm border border-gray-100/50 mb-8 w-full",
                isMobileView ? "rounded-full px-6 py-4" : "rounded-full px-8 py-5"
              )}>
                <p className={cn(
                  "text-slate-700 leading-relaxed font-semibold",
                  isMobileView ? "text-base" : "text-lg"
                )}>
                  {trip.description}
                </p>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className={cn(
              "sticky top-[60px] z-50 mb-8 w-full -mx-4 px-4 py-2 bg-white",
              !isMobileView && "relative top-0 mx-0 px-0 bg-transparent"
            )}>
              <TabsList className={cn(
                "bg-transparent h-auto p-0 gap-3 flex w-full overflow-x-auto scrollbar-hide pb-2",
                isMobileView ? "justify-start" : "justify-between"
              )}>
                <TabsTrigger
                  value="itinerary"
                  className={cn(
                    "rounded-full h-auto font-semibold data-[state=active]:bg-[#6347f9] data-[state=active]:text-white data-[state=active]:shadow-md bg-white text-slate-600 shadow-sm border border-transparent hover:bg-white/80 transition-all active:scale-95",
                    isMobileView
                      ? "whitespace-nowrap px-6 py-3.5 text-base"
                      : "flex-1 px-8 py-4 text-base"
                  )}
                >
                  <Clock className="mr-2 w-5 h-5" />
                  Lịch trình
                </TabsTrigger>
                <TabsTrigger
                  value="expenses"
                  className={cn(
                    "rounded-full h-auto font-semibold data-[state=active]:bg-[#6347f9] data-[state=active]:text-white data-[state=active]:shadow-md bg-white text-slate-600 shadow-sm border border-transparent hover:bg-white/80 transition-all active:scale-95",
                    isMobileView
                      ? "whitespace-nowrap px-6 py-3.5 text-base"
                      : "flex-1 px-8 py-4 text-base"
                  )}
                >
                  <DollarSign className="mr-2 w-5 h-5" />
                  Chi phí
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className={cn(
                    "rounded-full h-auto font-semibold data-[state=active]:bg-[#6347f9] data-[state=active]:text-white data-[state=active]:shadow-md bg-white text-slate-600 shadow-sm border border-transparent hover:bg-white/80 transition-all active:scale-95",
                    isMobileView
                      ? "whitespace-nowrap px-6 py-3.5 text-base"
                      : "flex-1 px-8 py-4 text-base"
                  )}
                >
                  <Users className="mr-2 w-5 h-5" />
                  Thành viên ({trip.memberCount || 1})
                </TabsTrigger>
                {trip.userRole === 'owner' && (
                  <TabsTrigger
                    value="share"
                    className={cn(
                      "rounded-full h-auto font-semibold data-[state=active]:bg-[#6347f9] data-[state=active]:text-white data-[state=active]:shadow-md bg-white text-slate-600 shadow-sm border border-transparent hover:bg-white/80 transition-all active:scale-95",
                      isMobileView
                        ? "whitespace-nowrap px-6 py-3.5 text-base"
                        : "flex-1 px-8 py-4 text-base"
                    )}
                  >
                    <Share2 className="mr-2 w-5 h-5" />
                    Chia sẻ
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="itinerary" className="mt-0">
              <Card className={cn(
                "border-none shadow-xl bg-white overflow-hidden",
                isMobileView ? "rounded-3xl" : "rounded-[32px]"
              )}>
                <CardHeader className={cn(
                  "flex flex-row items-center justify-between",
                  isMobileView ? "px-5 pt-6 pb-2" : "px-8 pt-8 pb-4"
                )}>
                  <div>
                    <h2 className={cn(
                      "font-bold text-slate-900 mb-1",
                      isMobileView ? "text-xl" : "text-2xl"
                    )}>Lịch trình</h2>
                    {!isMobileView && <p className="text-slate-500 font-medium">Chi tiết hoạt động từng ngày cho chuyến đi này</p>}
                  </div>
                  <Button
                    onClick={() => setShowAddDay(true)}
                    size={isMobileView ? "sm" : "default"}
                    className="rounded-xl bg-[#6347f9] hover:bg-[#5136db] text-white shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Thêm ngày
                  </Button>
                </CardHeader>

                <CardContent className={cn(
                  "pb-12",
                  isMobileView ? "px-5" : "px-8"
                )}>
                  {days.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-indigo-300" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Chưa có lịch trình</h3>
                      <p className="text-slate-500 mb-6">Hãy bắt đầu thêm ngày đầu tiên cho chuyến đi của bạn</p>
                      <Button onClick={() => setShowAddDay(true)} className="rounded-xl bg-[#6347f9] hover:bg-[#5136db]">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm ngày đầu tiên
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-10 relative">
                      {days.map((day, index) => {
                        const isExpanded = expandedDayIds.includes(day.id);
                        return (
                          <div key={day.id} className="relative">
                            <div className={cn(
                              "flex items-start gap-3 mb-4 cursor-pointer select-none group/header hover:bg-slate-50/50 rounded-xl transition-colors",
                              isMobileView ? "p-1 -mx-1" : "p-2 -mx-2"
                            )}
                              onClick={() => toggleDay(day.id)}
                            >
                              <div className={cn(
                                "flex-shrink-0 rounded-full flex items-center justify-center font-bold shadow-sm transition-all",
                                isMobileView ? "w-8 h-8 text-base" : "w-10 h-10 text-lg",
                                isExpanded ? "bg-[#6347f9] text-white" : "bg-slate-200 text-slate-500"
                              )}>
                                {index + 1}
                              </div>
                              <div className="flex-1 pt-0.5">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <h3 className={cn(
                                    "font-bold leading-tight transition-colors",
                                    isExpanded ? "text-slate-900" : "text-slate-600",
                                    isMobileView ? "text-lg" : "text-xl"
                                  )}>
                                    {day.title}
                                  </h3>

                                  <div className="flex items-center gap-1">
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}

                                    <div onClick={(e) => e.stopPropagation()}>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-400 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                          <DropdownMenuItem onClick={() => { setEditingDay(day); setShowEditDay(true); }}>
                                            <Edit className="w-4 h-4 mr-2" /> Chỉnh sửa ngày
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>

                                  <Badge variant="outline" className="text-slate-500 font-normal bg-slate-50 border-slate-200 ml-auto md:ml-0">
                                    {formatDate(day.date)}
                                  </Badge>
                                </div>
                                {day.description && (
                                  <p className="text-slate-500 mt-1 pl-1 text-[13px] leading-snug">{day.description}</p>
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className={cn(
                                "border-l-2 border-slate-100 space-y-4 pb-8 animate-in slide-in-from-top-2 duration-300",
                                isMobileView ? "pl-3 ml-3" : "pl-5 ml-5"
                              )}>
                                {(!activitiesByDay[day.id] || activitiesByDay[day.id].length === 0) ? (
                                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 text-sm italic">
                                    Chưa có hoạt động nào cho ngày này
                                  </div>
                                ) : (
                                  activitiesByDay[day.id].map((activity) => (
                                    <div
                                      key={activity.id}
                                      className={cn(
                                        "group bg-white border rounded-2xl transition-all duration-200",
                                        isMobileView ? "p-4" : "p-5",
                                        activity.pinned ? "border-purple-200 shadow-sm ring-1 ring-purple-100" : "border-slate-200 hover:border-purple-200",
                                        !isMobileView && "hover:shadow-md"
                                      )}
                                    >
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-2 flex-1 min-w-0">
                                          <div className="flex items-start justify-between">
                                            <h4 className={cn(
                                              "font-bold text-slate-800 break-words",
                                              isMobileView ? "text-base" : "text-lg"
                                            )}>{activity.title}</h4>

                                            {isMobileView && (
                                              <div className="flex items-center -mt-1 ml-1">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-slate-400 hover:text-purple-600 active:bg-purple-50 rounded-full"
                                                  onClick={() => {
                                                    setEditingActivity({
                                                      id: activity.id,
                                                      title: activity.title,
                                                      startTime: activity.timeStart || undefined,
                                                      durationMin: activity.durationMin,
                                                      location: activity.location,
                                                      notes: activity.notes,
                                                      important: activity.pinned || false,
                                                      dayId: activity.dayId,
                                                      images: activity.images
                                                    } as any);
                                                    setShowEditActivity(true);
                                                  }}
                                                >
                                                  <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-slate-400 hover:text-red-500 active:bg-red-50 rounded-full"
                                                  onClick={() => handleDeleteActivity(activity.id)}
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>

                                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                                            {activity.pinned && (
                                              <Badge className="bg-[#6347f9] text-white hover:bg-[#5136db] rounded-md px-2 py-0.5 border-0">
                                                Quan trọng
                                              </Badge>
                                            )}

                                            {activity.timeStart && (
                                              <div className="flex items-center text-slate-700 bg-slate-50 px-2 py-1 rounded-md">
                                                <Clock className="w-3 h-3 mr-1 text-[#6347f9]" />
                                                {formatTime(activity.timeStart)}
                                                {activity.durationMin && <span className="text-slate-400 mx-1">|</span>}
                                                {activity.durationMin && <span>{activity.durationMin}p</span>}
                                              </div>
                                            )}

                                            {activity.location && (
                                              <div className="flex items-center truncate max-w-[200px]">
                                                <MapPin className="w-3 h-3 mr-1 text-[#FF4D4C]" />
                                                <span className="truncate">{activity.location}</span>
                                              </div>
                                            )}
                                          </div>

                                          {activity.notes && (
                                            <div className="pt-2 text-slate-600 text-[13px] leading-relaxed bg-slate-50/50 p-2.5 rounded-xl mt-2 border border-slate-100/50">
                                              {activity.notes}
                                            </div>
                                          )}
                                        </div>

                                        {!isMobileView && (
                                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-full"
                                              onClick={() => {
                                                setEditingActivity({
                                                  id: activity.id,
                                                  title: activity.title,
                                                  startTime: activity.timeStart || undefined,
                                                  durationMin: activity.durationMin,
                                                  location: activity.location,
                                                  notes: activity.notes,
                                                  important: activity.pinned || false,
                                                  dayId: activity.dayId,
                                                  images: activity.images
                                                } as any);
                                                setShowEditActivity(true);
                                              }}
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                              onClick={() => handleDeleteActivity(activity.id)}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}

                                <Button
                                  variant="outline"
                                  onClick={() => { setSelectedDayId(day.id); setShowAddActivity(true); }}
                                  className="w-full border-2 border-dashed border-slate-200 hover:border-purple-300 text-slate-400 hover:text-purple-600 hover:bg-purple-50/50 h-12 rounded-2xl font-medium transition-all"
                                >
                                  <Plus className="w-4 h-4 mr-2" /> Thêm hoạt động
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenses" className="mt-0">
              <Card className={cn(
                "border-none shadow-xl bg-white overflow-hidden min-h-[500px]",
                isMobileView ? "rounded-3xl" : "rounded-[32px]"
              )}>
                <CardContent className={isMobileView ? "p-4" : "p-8"}>
                  <ExpenseSection
                    tripId={id || ''}
                    isOwner={trip?.userRole === 'owner'}
                    isMember={trip?.userRole === 'member'}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              <Card className={cn(
                "border-none shadow-xl bg-white overflow-hidden min-h-[500px]",
                isMobileView ? "rounded-3xl" : "rounded-[32px]"
              )}>
                <CardContent className={isMobileView ? "p-4" : "p-8"}>
                  <TripMembers
                    tripId={id || ''}
                    tripOwnerId={trip.userId}
                    onCountChange={(count) => setTrip((prev) => prev ? { ...prev, memberCount: count } : prev)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="share" className="mt-0">
              <Card className={cn(
                "border-none shadow-xl bg-white overflow-hidden min-h-[500px]",
                isMobileView ? "rounded-3xl" : "rounded-[32px]"
              )}>
                <CardContent className={isMobileView ? "p-4" : "p-8"}>
                  <ShareLinkManager trip={{
                    id: trip.id,
                    title: trip.name,
                    provinceId: trip.provinceId || '',
                    province: trip.province,
                    startDate: trip.startDate,
                    description: trip.description,
                    userId: trip.userId,
                    shareToken: trip.shareToken,
                    isPublic: trip.isPublic
                  }} />
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

        </div>
      </AnimatedTransition>

      <AddDayDialog
        open={showAddDay}
        onOpenChange={setShowAddDay}
        tripId={id || ''}
        onSuccess={fetchDaysAndActivities}
      />
      <AddActivityDialog
        open={showAddActivity}
        onOpenChange={setShowAddActivity}
        dayId={selectedDayId}
        onSuccess={fetchDaysAndActivities}
      />
      {editingDay && (
        <EditDayDialog
          open={showEditDay}
          onOpenChange={(open) => {
            setShowEditDay(open);
            if (!open) setEditingDay(null);
          }}
          day={{
            id: editingDay.id,
            title: editingDay.title,
            date: editingDay.date,
            description: editingDay.description,
          }}
          onSuccess={fetchDaysAndActivities}
        />
      )}
      {editingActivity && (
        <EditActivityDialog
          open={showEditActivity}
          onOpenChange={(open) => {
            setShowEditActivity(open);
            if (!open) setEditingActivity(null);
          }}
          onSuccess={fetchDaysAndActivities}
          activity={editingActivity}
        />
      )}
    </div>
  );
};

export default TripDetailsPage;