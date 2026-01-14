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
  Camera,
  DollarSign,
  ArrowLeft,
  Pin,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Copy
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { EditTripDialog } from '@/components/dialogs/EditTripDialog.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PWATripItinerary } from '@/pwa/components/PWATripItinerary.tsx';

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
  avatar?: string | null;
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
  avatar?: string | null;
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
  avatar?: string;
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Scroll direction logic for hiding/showing tabs
  const [isTabsVisible, setIsTabsVisible] = useState(true);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    if (!isMobileView) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Scroll down -> hide
      if (currentScrollY > lastScrollY.current + 5 && currentScrollY > 60) {
        setIsTabsVisible(false);
      }
      // Scroll up -> show
      else if (currentScrollY < lastScrollY.current - 5) {
        setIsTabsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileView]);

  // State for collapsible days (default empty = all collapsed)
  const [expandedDayIds, setExpandedDayIds] = useState<string[]>([]);
  const [draggedActivity, setDraggedActivity] = useState<{ id: string, dayId: string } | null>(null);
  const [dragOverActivityId, setDragOverActivityId] = useState<string | null>(null);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);
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
  const [deleteActivityDialogOpen, setDeleteActivityDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [duplicateActivityData, setDuplicateActivityData] = useState<Activity | null>(null);

  const { id } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Write tab to URL on change - optimized to prevent unnecessary updates
  useEffect(() => {
    const currentParam = searchParams.get('tab');
    if (activeTab && currentParam !== activeTab) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeTab);
      // Only update if searchParams actually change
      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next, { replace: true });
      }
    }
  }, [activeTab]); // Only depend on activeTab change to sync to URL

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
      setExpandedDayIds(transformedDays.map(day => day.id));

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
          })),
          avatar: (activity as any).avatar || undefined
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
        memberCount: (membersData?.filter(m => m && m.user?.id !== tripData.userId && (m.status === 'accepted' || !m.status)).length || 0) + 1,
        avatar: tripData.avatar,
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
        setExpandedDayIds(transformedDays.map(day => day.id));

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
            })),
            avatar: (activity as any).avatar || undefined
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
        navigate('/');
      } else if (apiError.status === 403) {
        showToast('Bạn không có quyền truy cập chuyến đi này', 'error');
        navigate('/');
      } else if (apiError.status === 401) {
        showToast('Phiên đăng nhập đã hết hạn', 'error');
        navigate('/auth');
      } else {
        // Stop the silent retry loop which looks like a "refresh"
        showToast(apiError.message || 'Không thể tải thông tin chuyến đi.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const openDeleteActivityDialog = (activity: Activity) => {
    setActivityToDelete(activity);
    setDeleteActivityDialogOpen(true);
  };

  const handleConfirmDeleteActivity = async () => {
    if (!activityToDelete) return;

    try {
      await api.activities.delete(activityToDelete.id);

      setActivitiesByDay(prev => {
        const newActivitiesByDay = { ...prev };
        for (const dayId in newActivitiesByDay) {
          newActivitiesByDay[dayId] = newActivitiesByDay[dayId].filter(
            activity => activity.id !== activityToDelete.id
          );
        }
        return newActivitiesByDay;
      });

      showToast('Đã xóa hoạt động', 'success');
      setDeleteActivityDialogOpen(false);
      setActivityToDelete(null);
    } catch (error: unknown) {
      showToast('Không thể xóa hoạt động', 'error');
    }
  };


  const handleDuplicateActivity = (activityId: string) => {
    // Find activity and its day/index to get fresh info and position
    let sourceActivity: any = null;
    let dayId: string = '';

    for (const dId in activitiesByDay) {
      const found = activitiesByDay[dId].find(a => a.id === activityId);
      if (found) {
        sourceActivity = found;
        dayId = dId;
        break;
      }
    }

    if (!sourceActivity) {
      showToast('Không tìm thấy hoạt động để sao chép', 'error');
      return;
    }

    if (isPWA) {
      navigate(`/pwa-add-activity/${dayId}`, { state: { initialData: sourceActivity } });
    } else {
      setSelectedDayId(dayId);
      setDuplicateActivityData(sourceActivity);
      setShowAddActivity(true);
    }
  };

  const handleDragStart = (e: React.DragEvent, activityId: string, dayId: string) => {
    setDraggedActivity({ id: activityId, dayId });
    e.dataTransfer.setData('activityId', activityId);
    e.dataTransfer.setData('dayId', dayId);
    e.dataTransfer.effectAllowed = 'move';

    // Add a visual cue
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, activityId: string, dayId: string) => {
    e.preventDefault();
    if (draggedActivity && draggedActivity.dayId === dayId) {
      setDragOverActivityId(activityId);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedActivity(null);
    setDragOverActivityId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetActivityId: string, targetDayId: string) => {
    e.preventDefault();
    if (!draggedActivity || draggedActivity.dayId !== targetDayId || draggedActivity.id === targetActivityId) {
      return;
    }

    const dayActivities = [...activitiesByDay[targetDayId]];
    const draggedIndex = dayActivities.findIndex(a => a.id === draggedActivity.id);
    const targetIndex = dayActivities.findIndex(a => a.id === targetActivityId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Reorder locally
      const [removed] = dayActivities.splice(draggedIndex, 1);
      dayActivities.splice(targetIndex, 0, removed);

      // Update local state immediately for snappy feel
      setActivitiesByDay(prev => ({
        ...prev,
        [targetDayId]: dayActivities
      }));

      // Highlight the moved item
      setJustDroppedId(draggedActivity.id);
      setTimeout(() => setJustDroppedId(null), 2500);

      // Prepare API call
      try {
        const reorderData = dayActivities.map((activity, index) => ({
          id: activity.id,
          sortOrder: index
        }));

        await api.activities.reorder(reorderData);
      } catch (error) {
        showToast('Không thể sắp xếp lại hoạt động', 'error');
        // Optionally revert state if API fails
        fetchDaysAndActivities();
      }
    }
  };

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return '';
    // If it's a full ISO string like "2025-09-15T22:00:00.000Z"
    // we want to extract the time part directly to avoid timezone conversion
    if (timeString.includes('T')) {
      try {
        const timePart = timeString.split('T')[1];
        return timePart.substring(0, 5); // HH:mm
      } catch (e) {
        // Fallback to standard behavior if parsing fails
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return timeString;
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }
    // If it's already in "HH:mm" format or other format without 'T'
    return timeString;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trip) return null;

  const status = getStatus(trip.startDate);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sticky Header */}
      {isMobileView && (
        <div className="sticky top-0 z-[60] bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between support-backdrop-blur">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-secondary active:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground truncate">
              {trip.name}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {trip.userRole === 'owner' && (
              <button
                onClick={() => navigate(`/pwa-edit-trip/${id}`)}
                className="p-2 rounded-full hover:bg-secondary active:bg-secondary"
              >
                <Edit className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      <AnimatedTransition show={showContent} animation="slide-up">
        {/* HERO SECTION */}
        <div className="relative w-full h-[40vh] min-h-[350px] lg:h-[450px] group">
          {trip.avatar ? (
            <img
              src={trip.avatar}
              alt={trip.name}
              className="w-full h-full object-cover transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <Camera className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/40 to-transparent opacity-90" />

          {/* Back Button (Desktop) */}
          {!isMobileView && (
            <div className="absolute top-6 left-6 z-20">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 pl-3 pr-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/10 active:scale-95 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            </div>
          )}

          {/* Content Overlay */}
          <div className="absolute bottom-16 left-0 w-full px-4 lg:px-0">
            <div className="max-w-6xl mx-auto">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className={cn(
                  "border-none px-3 py-1.5 text-sm rounded-lg shadow-lg",
                  statusColors[status as keyof typeof statusColors]
                )}>
                  {statusLabels[status as keyof typeof statusLabels]}
                </Badge>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3 mb-4 group">
                <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-black text-white leading-tight tracking-tight drop-shadow-sm max-w-4xl">
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
                    <button className="text-white/70 hover:text-white transition-colors p-1 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-sm ml-2">
                      <Edit className="w-6 h-6 p-1" />
                    </button>
                  </EditTripDialog>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-white/90 font-medium text-base">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white" />
                  <span>{formatDate(trip.startDate)}</span>
                </div>
                {trip.province && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#FF4D4C]" />
                    <span>{trip.province.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>{trip.memberCount || 1} người</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT CONTAINER */}
        <div className="max-w-6xl mx-auto px-4 lg:px-0 -mt-8 relative z-10 pb-20">
          {/* Description Card */}
          <div className="bg-card rounded-[2rem] p-8 shadow-sm border border-border mb-8">
            <h2 className="text-primary text-xl font-bold mb-4 flex items-center gap-2">
              Giới thiệu chuyến đi
            </h2>
            <div className="relative">
              <p className={cn(
                "text-muted-foreground leading-relaxed font-medium text-lg whitespace-pre-line transition-all duration-300",
                !isDescriptionExpanded && "line-clamp-3"
              )}>
                {trip.description || "Chưa có mô tả chi tiết cho chuyến đi này."}
              </p>
              {trip.description && trip.description.split('\n').length > 3 || (trip.description?.length || 0) > 150 ? (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-2 text-primary font-bold text-sm hover:underline flex items-center gap-1"
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


          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className={cn(
              "z-30 mb-8 transition-[top] duration-300",
              isMobileView
                ? cn("sticky -mx-4 w-[calc(100%+2rem)]", isTabsVisible ? "top-[60px]" : "top-[-100px]")
                : "relative top-0 mx-0 bg-transparent z-0",
              isPWA ? "bg-background/95 backdrop-blur-md border-b border-border/10" : ""
            )}>
              <div className={cn("overflow-x-auto scrollbar-hide px-4", isPWA ? "py-4" : "py-2")}>
                <TabsList className={cn(
                  "h-auto p-0 flex flex-nowrap items-center",
                  isMobileView ? "justify-start gap-2 w-max min-w-full" : "justify-between gap-3 w-full",
                  isPWA ? "bg-secondary/40 dark:bg-secondary/35 p-1.5 rounded-full" : "bg-transparent pb-2"
                )}>
                  <TabsTrigger
                    value="itinerary"
                    className={cn(
                      "rounded-full h-auto font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md bg-white dark:bg-secondary dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground text-slate-600 dark:text-foreground shadow-sm border border-transparent hover:bg-white/80 dark:hover:bg-secondary/80 transition-all active:scale-95",
                      isMobileView
                        ? cn("whitespace-nowrap", isPWA ? "px-5 py-2.5 text-sm" : "px-6 py-3.5 text-base")
                        : "flex-1 px-8 py-4 text-base"
                    )}
                  >
                    <Clock className="mr-2 w-5 h-5" />
                    Lịch trình
                  </TabsTrigger>
                  <TabsTrigger
                    value="expenses"
                    className={cn(
                      "rounded-full h-auto font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md bg-white dark:bg-secondary dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground text-slate-600 dark:text-foreground shadow-sm border border-transparent hover:bg-white/80 dark:hover:bg-secondary/80 transition-all active:scale-95",
                      isMobileView
                        ? cn("whitespace-nowrap", isPWA ? "px-5 py-2.5 text-sm" : "px-6 py-3.5 text-base")
                        : "flex-1 px-8 py-4 text-base"
                    )}
                  >
                    <DollarSign className="mr-2 w-5 h-5" />
                    Chi phí
                  </TabsTrigger>
                  <TabsTrigger
                    value="members"
                    className={cn(
                      "rounded-full h-auto font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md bg-white dark:bg-secondary dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground text-slate-600 dark:text-foreground shadow-sm border border-transparent hover:bg-white/80 dark:hover:bg-secondary/80 transition-all active:scale-95",
                      isMobileView
                        ? cn("whitespace-nowrap", isPWA ? "px-5 py-2.5 text-sm" : "px-6 py-3.5 text-base")
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
                        "rounded-full h-auto font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md bg-white dark:bg-secondary dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground text-slate-600 dark:text-foreground shadow-sm border border-transparent hover:bg-white/80 dark:hover:bg-secondary/80 transition-all active:scale-95",
                        isMobileView
                          ? cn("whitespace-nowrap", isPWA ? "px-5 py-2.5 text-sm" : "px-6 py-3.5 text-base")
                          : "flex-1 px-8 py-4 text-base"
                      )}
                    >
                      <Share2 className="mr-2 w-5 h-5" />
                      Chia sẻ
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </div>

            <TabsContent value="itinerary" className="mt-0">
              {isPWA ? (
                <PWATripItinerary
                  days={days}
                  activitiesByDay={activitiesByDay}
                  isTabsVisible={isTabsVisible}
                  onAddDay={() => {
                    if (id) navigate(`/pwa-add-day/${id}`);
                    else setShowAddDay(true);
                  }}
                  onEditDay={(dayId) => navigate(`/pwa-edit-day/${dayId}`)}
                  onAddActivity={(dayId) => navigate(`/pwa-add-activity/${dayId}`)}
                  onEditActivity={(activityId) => navigate(`/pwa-edit-activity/${activityId}`)}
                  onDuplicateActivity={handleDuplicateActivity}
                  onDeleteActivity={openDeleteActivityDialog}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  draggedActivity={draggedActivity}
                  dragOverActivityId={dragOverActivityId}
                  justDroppedId={justDroppedId}
                  isOwner={trip.userRole === 'owner'}
                />
              ) : (
                <Card className={cn(
                  "border-none shadow-xl bg-card overflow-hidden text-card-foreground",
                  isMobileView ? "rounded-3xl" : "rounded-[32px]"
                )}>
                  <CardHeader className={cn(
                    "flex flex-row items-center justify-between",
                    isMobileView ? "px-5 pt-6 pb-2" : "px-8 pt-8 pb-4"
                  )}>
                    <div>
                      <h2 className={cn(
                        "font-bold text-foreground mb-1",
                        isMobileView ? "text-xl" : "text-2xl"
                      )}>Lịch trình</h2>
                      {!isMobileView && <p className="text-muted-foreground font-medium">Chi tiết hoạt động từng ngày cho chuyến đi này</p>}
                    </div>
                    <Button
                      onClick={() => {
                        if (isMobileView && id) {
                          navigate(`/pwa-add-day/${id}`);
                        } else {
                          setShowAddDay(true);
                        }
                      }}
                      size={isMobileView ? "sm" : "default"}
                      className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg"
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
                      <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-secondary/30">
                        <div className="flex justify-center mb-4">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-primary/40" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có lịch trình</h3>
                        <p className="text-muted-foreground mb-6">Hãy bắt đầu thêm ngày đầu tiên cho chuyến đi của bạn</p>
                        <Button onClick={() => setShowAddDay(true)} className="rounded-xl bg-primary hover:bg-primary/90">
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
                                "flex items-start gap-3 mb-4 cursor-pointer select-none group/header hover:bg-secondary rounded-xl transition-colors",
                                isMobileView ? "p-1 -mx-1" : "p-2 -mx-2"
                              )}
                                onClick={() => toggleDay(day.id)}
                              >
                                <div className={cn(
                                  "flex-shrink-0 rounded-full flex items-center justify-center font-bold shadow-sm transition-all",
                                  isMobileView ? "w-8 h-8 text-base" : "w-10 h-10 text-lg",
                                  isExpanded ? "bg-primary text-primary-foreground dark:shadow-[0_0_15px_rgba(99,71,249,0.7)]" : "bg-secondary text-muted-foreground"
                                )}>
                                  {index + 1}
                                </div>
                                <div className="flex-1 pt-0.5">
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <h3 className={cn(
                                      "font-bold leading-tight transition-colors",
                                      isExpanded ? "text-foreground" : "text-muted-foreground",
                                      isMobileView ? "text-lg" : "text-xl"
                                    )}>
                                      {day.title}
                                    </h3>

                                    <div className="flex items-center gap-1">
                                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground/50" /> : <ChevronRight className="w-4 h-4 text-muted-foreground/50" />}

                                      <div onClick={(e) => e.stopPropagation()}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={cn(
                                            "h-8 w-8 p-0 rounded-full hover:bg-secondary text-primary bg-primary/10",
                                            isMobileView ? "opacity-100" : "opacity-0 group-hover/header:opacity-100 transition-opacity"
                                          )}
                                          onClick={() => {
                                            if (isMobileView) {
                                              navigate(`/pwa-edit-day/${day.id}`);
                                            } else {
                                              setEditingDay(day);
                                              setShowEditDay(true);
                                            }
                                          }}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    <Badge variant="outline" className="text-primary font-normal bg-secondary border-border ml-auto md:ml-0">
                                      {formatDate(day.date)}
                                    </Badge>
                                  </div>
                                  {day.description && (
                                    <p className="text-muted-foreground mt-1 pl-1 text-[13px] leading-snug">{day.description}</p>
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className={cn(
                                  "border-l-2 border-border/50 space-y-4 pb-8 animate-in slide-in-from-top-2 duration-300",
                                  isMobileView ? "pl-3 ml-3" : "pl-5 ml-5"
                                )}>
                                  {(!activitiesByDay[day.id] || activitiesByDay[day.id].length === 0) ? (
                                    <div className="p-4 rounded-2xl border border-dashed border-border bg-secondary/20 text-muted-foreground text-sm italic text-center">
                                      Chưa có hoạt động nào cho ngày này
                                    </div>
                                  ) : (
                                    activitiesByDay[day.id].map((activity) => (
                                      <div
                                        key={activity.id}
                                        draggable={trip.userRole === 'owner'}
                                        onDragStart={(e) => handleDragStart(e, activity.id, day.id)}
                                        onDragOver={(e) => handleDragOver(e, activity.id, day.id)}
                                        onDragEnd={handleDragEnd}
                                        onDrop={(e) => handleDrop(e, activity.id, day.id)}
                                        className={cn(
                                          "group bg-card border border-border rounded-2xl transition-all duration-300 relative select-none hover:border-primary/30",
                                          isMobileView ? "p-4" : "p-5",
                                          !isMobileView && "hover:shadow-md",
                                          draggedActivity?.id === activity.id && "opacity-40",
                                          dragOverActivityId === activity.id && "border-primary border-t-4",
                                          justDroppedId === activity.id && "ring-2 ring-primary/40 bg-primary/[0.03] border-primary/50 scale-[1.01] shadow-lg z-20",
                                          trip.userRole === 'owner' && "cursor-grab active:cursor-grabbing"
                                        )}
                                      >
                                        <div className="flex justify-between items-start gap-3">
                                          {trip.userRole === 'owner' && (
                                            <div className="pt-1.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors flex-shrink-0">
                                              <GripVertical className="w-5 h-5" />
                                            </div>
                                          )}

                                          {/* Activity Image */}
                                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-border">
                                            <img
                                              src={activity.avatar || "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=400&auto=format&fit=crop"}
                                              alt={activity.title}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>

                                          <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                              <h4 className={cn(
                                                "font-bold text-foreground break-words",
                                                isMobileView ? "text-base" : "text-lg"
                                              )}>{activity.title}</h4>

                                              {isMobileView && (
                                                <div className="flex items-center -mt-1 ml-1" onClick={(e) => e.stopPropagation()}>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-purple-600 active:bg-purple-50 rounded-full"
                                                    onClick={() => {
                                                      if (isMobileView) {
                                                        navigate(`/pwa-edit-activity/${activity.id}`);
                                                      } else {
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
                                                      }
                                                    }}
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-primary active:bg-primary/10 rounded-full"
                                                    title="Chấp nhận"
                                                    onClick={() => handleDuplicateActivity(activity.id)}
                                                  >
                                                    <Copy className="w-4 h-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 active:bg-red-50 rounded-full"
                                                    onClick={() => openDeleteActivityDialog(activity)}
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                                              {activity.pinned && (
                                                <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-2 py-0.5 border-0">
                                                  Quan trọng
                                                </Badge>
                                              )}

                                              {activity.timeStart && (
                                                <div className="flex items-center text-foreground bg-secondary px-2 py-1 rounded-md">
                                                  <Clock className="w-3 h-3 mr-1 text-primary" />
                                                  {formatTime(activity.timeStart)}
                                                  {activity.durationMin && <span className="text-muted-foreground/50 mx-1">|</span>}
                                                  {activity.durationMin && <span>{activity.durationMin}p</span>}
                                                </div>
                                              )}

                                              {activity.location && (
                                                <div
                                                  className="flex flex-col gap-0.5 group/loc cursor-pointer"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location!)}`;
                                                    if (isPWA) {
                                                      window.location.href = url;
                                                    } else {
                                                      window.open(url, '_blank');
                                                    }
                                                  }}
                                                >
                                                  <div className="flex items-start">
                                                    <MapPin className="w-3 h-3 mr-1 text-[#FF4D4C] mt-0.5 flex-shrink-0" />
                                                    <span className="text-slate-600 dark:text-slate-400 group-hover/loc:text-primary transition-colors">{activity.location}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1 ml-4 overflow-hidden">
                                                    <span className="text-[10px] text-primary font-bold hover:underline underline-offset-2 transition-all">
                                                      Xem trong bản đồ
                                                    </span>
                                                    <ChevronRight className="w-3 h-3 text-primary animate-pulse" />
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {activity.notes && (
                                              <div className="pt-2 text-muted-foreground text-[13px] leading-relaxed bg-secondary/50 p-2.5 rounded-xl mt-2 border border-border/50">
                                                {activity.notes}
                                              </div>
                                            )}
                                          </div>

                                          {!isMobileView && (
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-full transition-colors"
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
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-full transition-colors"
                                                title="Sao chép"
                                                onClick={() => handleDuplicateActivity(activity.id)}
                                              >
                                                <Copy className="w-4 h-4" />
                                              </Button>

                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-full transition-colors"
                                                onClick={() => openDeleteActivityDialog(activity)}
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
                                    onClick={() => {
                                      if (isMobileView) {
                                        navigate(`/pwa-add-activity/${day.id}`);
                                      } else {
                                        setSelectedDayId(day.id);
                                        setShowAddActivity(true);
                                      }
                                    }}

                                    className="w-full border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary hover:bg-primary/5 h-12 rounded-2xl font-medium transition-all"
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
              )}
            </TabsContent>

            <TabsContent value="expenses" className="mt-0">
              <Card className={cn(
                "border-none shadow-xl bg-card overflow-hidden min-h-[500px]",
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
                "border-none shadow-xl bg-card overflow-hidden min-h-[500px]",
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
                "border-none shadow-xl bg-card overflow-hidden min-h-[500px]",
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
      </AnimatedTransition >

      {/* Delete Activity Dialog */}
      < Dialog open={deleteActivityDialogOpen} onOpenChange={setDeleteActivityDialogOpen} >
        <DialogContent className="rounded-2xl bg-white dark:bg-[#1a1a2e] border-none shadow-2xl max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Xác nhận xóa hoạt động</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 mt-2">
              Bạn có chắc chắn muốn xóa hoạt động "{activityToDelete?.title}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-3 mt-6 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteActivityDialogOpen(false)}
              className="flex-1 sm:flex-none rounded-xl bg-background text-primary hover:bg-secondary border-border font-bold transition-all h-11"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmDeleteActivity}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-primary/20 h-11"
            >
              Xóa hoạt động
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      <AddDayDialog
        open={showAddDay}
        onOpenChange={setShowAddDay}
        tripId={id || ''}
        startDate={days.length === 0 ? trip.startDate : undefined}
        onSuccess={fetchDaysAndActivities}
      />
      <AddActivityDialog
        open={showAddActivity}
        onOpenChange={(open) => {
          setShowAddActivity(open);
          if (!open) {
            setDuplicateActivityData(null);
          }
        }}
        dayId={selectedDayId}
        onSuccess={fetchDaysAndActivities}
        initialData={duplicateActivityData}
      />
      {
        editingDay && (
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
        )
      }
      {
        editingActivity && (
          <EditActivityDialog
            open={showEditActivity}
            onOpenChange={(open) => {
              setShowEditActivity(open);
              if (!open) setEditingActivity(null);
            }}
            onSuccess={fetchDaysAndActivities}
            activity={editingActivity}
          />
        )
      }
    </div >
  );
};

export default TripDetailsPage;