import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { api } from '@/integrations/api/client.ts';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { cn } from '@/lib/utils.ts';
import {
  Search,
  MapPin,
  Users,
  Bell,
  Navigation,
  Loader2,
  Calendar,
  SlidersHorizontal,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar.tsx';
import { useNotificationCountContext } from '@/contexts/NotificationCountContext';
import { useTranslation } from 'react-i18next';
import { DATABASE_TYPES } from '@/integrations/api/types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Add CSS to hide scrollbar
const style = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

type TripWithMember = {
  id: string;
  title: string;
  provinceId?: string;
  province?: {
    id: string;
    name: string;
    code: number;
    divisionType: string;
    codename: string;
    phoneCode: number;
  };
  startDate: string;
  description?: string;
  avatar?: string;
  userId: string;
  shareToken?: string;
  isPublic?: boolean;
  user?: {
    id: string;
    email: string;
    fullName?: string;
    profilePicture?: string;
  };
  members?: { name: string; is_creator: boolean }[];
  member_count?: number;
  user_role?: 'owner' | 'member';
};

const PWATripListPage = () => {
  const { showToast } = useGlobalToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isPWA } = usePWA();
  const navigate = useNavigate();
  const { t } = useTranslation();
  // const { unreadCount } = useNotificationCountContext(); // Removed unused context

  const [trips, setTrips] = useState<TripWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter States
  const [provinces, setProvinces] = useState<DATABASE_TYPES.provinces[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [provinceSearchQuery, setProvinceSearchQuery] = useState('');

  // Ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading]);

  // Set page title
  useEffect(() => {
    document.title = 'Chuyến đi - Goouty';
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load provinces
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await api.provinces.getAll();
        setProvinces(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Error loading provinces:', error);
      }
    };
    loadProvinces();
  }, []);

  // Initial fetch and Filter change refetch
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    // Reset and fetch when filters change
    setTrips([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchTrips(true);
  }, [isAuthenticated, authLoading, user, selectedProvince, selectedDate]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) { // Avoid search on initial load being called twice
        setTrips([]);
        setCurrentPage(1);
        setHasMore(true);
        fetchTrips(true);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      setCurrentPage(prev => prev + 1);
      fetchTrips(false);
    }
  };

  const fetchTrips = async (isInitialLoad: boolean = true) => {
    if (!user) return;

    if (isInitialLoad) {
      if (!trips.length) setLoading(true);
      else setSearchLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const pageToFetch = isInitialLoad ? 1 : currentPage + 1;
      const response = await api.trips.getAll({
        search: searchQuery || undefined,
        provinceId: selectedProvince !== 'all' ? selectedProvince : undefined,
        startDate: selectedDate || undefined,
        page: pageToFetch,
        limit: 10
      });

      const tripsWithMembers: TripWithMember[] = response.trips.map((trip: any) => {
        const isOwner = trip.userId === user.id;
        const userRole = isOwner ? 'owner' : 'member';
        const otherAcceptedCount = trip.members?.filter((m: any) => m && m.userId !== trip.userId && (m.status === 'accepted' || !m.status)).length || 0;
        const memberCount = otherAcceptedCount + 1;

        return {
          ...trip,
          user_role: userRole,
          member_count: memberCount,
          members: trip.members?.map((member: any) => ({
            name: member.user?.fullName || member.user?.email || 'Member',
            is_creator: member.userId === trip.userId,
            user: member.user
          })) || [],
          isPublic: !!trip.shareToken,
          name: trip.title,
          start_date: trip.startDate,
          is_public: !!trip.shareToken,
          slug: trip.id.toString(),
          user: trip.user ? {
            ...trip.user,
            profilePicture: trip.user.profilePicture
          } : trip.user
        };
      });

      if (isInitialLoad) {
        setTrips(tripsWithMembers);
        setCurrentPage(1);
      } else {
        setTrips(prev => [...prev, ...tripsWithMembers]);
        setCurrentPage(pageToFetch);
      }

      setHasMore(response.pagination.page < response.pagination.totalPages);
    } catch (error: any) {
      console.error('Fetch trips error:', error);
      showToast(error.message || 'Không thể tải danh sách chuyến đi', 'error');
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setLoadingMore(false);
    }
  };

  const handleTripClick = (trip: TripWithMember) => {
    navigate(`/trip/${trip.id}`);
  };

  const handleCreateTrip = () => {
    navigate('/create-trip');
  };

  const clearFilters = () => {
    setSelectedProvince('all');
    setSelectedDate('');
    setSearchQuery('');
  };

  if (loading && !searchLoading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Đang tải chuyến đi...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = selectedProvince !== 'all' || selectedDate !== '';

  return (
    <div className="w-full max-w-7xl mx-auto bg-background text-foreground pb-24 min-h-screen">
      <style>{style}</style>

      {/* Header Section */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarImage src={user?.profilePicture} alt={user?.fullName || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {(user?.fullName || 'G').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm font-medium flex items-center gap-1">
                {t('common.greeting', { defaultValue: 'Xin chào' })}, {user?.fullName?.split(' ')[0] || t('common.guest', { defaultValue: 'Bạn' })} <span className="animate-wave">👋</span>
              </span>
              <h1 className="text-xl font-bold text-foreground leading-tight">
                Đây là những chuyến đi của bạn
              </h1>
            </div>
          </div>

          {/* Notification Button Removed */}
        </div>
      </div>

      {/* Sticky Top Search Bar & Filter Button */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2 mb-4">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm chuyến đi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-12 bg-secondary/50 border-none rounded-full text-base placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium w-full"
            />
            {searchLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}
          </div>

          <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DrawerTrigger asChild>
              <Button
                className={cn(
                  "h-12 w-12 rounded-full p-0 flex items-center justify-center shrink-0 transition-all",
                  hasActiveFilters
                    ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                    : "bg-secondary/50 text-foreground hover:bg-secondary/80"
                )}
              >
                <SlidersHorizontal className="w-5 h-5" />
                {hasActiveFilters && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh] p-0 rounded-t-[32px]">
              <div className="mx-auto w-12 h-1.5 bg-muted rounded-full my-4" />
              <DrawerHeader className="px-6 text-left">
                <DrawerTitle className="text-2xl font-bold">Bộ lọc tìm kiếm</DrawerTitle>
              </DrawerHeader>

              <div className="px-6 pb-8 overflow-y-auto max-h-[60vh] no-scrollbar space-y-6">
                {/* Date Filter */}
                {/* Date Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Thời gian khởi hành</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-12 rounded-xl justify-start text-left font-normal bg-secondary/50 border-none hover:bg-primary/10 hover:text-primary",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? format(new Date(selectedDate), "dd/MM/yyyy") : <span>Chọn ngày...</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate ? new Date(selectedDate) : undefined}
                        onSelect={(date) => setSelectedDate(date ? format(date, "yyyy-MM-dd") : "")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>


                {/* Province Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Điểm đến (Tỉnh/Thành)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm tỉnh thành..."
                      className="pl-10 h-11 bg-muted/50 border-none rounded-xl"
                      value={provinceSearchQuery}
                      onChange={(e) => setProvinceSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto pr-1">
                    <button
                      onClick={() => setSelectedProvince('all')}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl transition-all",
                        selectedProvince === 'all' ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/50 text-foreground font-medium"
                      )}
                    >
                      <span>Tất cả</span>
                      {selectedProvince === 'all' && <Check className="w-5 h-5" />}
                    </button>
                    {provinces
                      .filter(p => p.name.toLowerCase().includes(provinceSearchQuery.toLowerCase()))
                      .map((province) => (
                        <button
                          key={province.id}
                          onClick={() => setSelectedProvince(province.id)}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 rounded-xl transition-all",
                            selectedProvince === province.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/50 text-foreground font-medium"
                          )}
                        >
                          <span>{province.name}</span>
                          {selectedProvince === province.id && <Check className="w-5 h-5" />}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <DrawerFooter className="px-6 pb-8 pt-2">
                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-bold border-none bg-secondary hover:bg-primary/20 hover:text-primary transition-colors"
                    onClick={clearFilters}
                  >
                    Đặt lại
                  </Button>
                  <DrawerClose asChild>
                    <Button className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white">
                      Áp dụng
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Trips Masonry Grid */}
      {
        trips.length === 0 && !loading ? (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/50 rounded-full mb-4">
              <MapPin className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">
              {searchQuery ? 'Không tìm thấy chuyến đi' : 'Chưa có chuyến đi nào'}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {searchQuery
                ? 'Thử tìm kiếm với từ khóa khác xem sao'
                : 'Hãy bắt đầu hành trình mới của bạn ngay hôm nay!'
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={handleCreateTrip}
                className="bg-primary text-primary-foreground font-bold rounded-full px-6 shadow-xl shadow-primary/20"
              >
                Tạo chuyến đi đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex gap-4 px-4">
              {/* Column 1 */}
              <div className="flex-1 flex flex-col gap-4">
                {trips.map((trip, index) => {
                  if (index % 2 !== 0) return null;
                  return (
                    <TripMasonryCard
                      key={trip.id}
                      trip={trip}
                      index={index}
                      onClick={handleTripClick}
                    />
                  );
                })}
              </div>
              {/* Column 2 */}
              <div className="flex-1 flex flex-col gap-4">
                {trips.map((trip, index) => {
                  if (index % 2 === 0) return null;
                  return (
                    <TripMasonryCard
                      key={trip.id}
                      trip={trip}
                      index={index}
                      onClick={handleTripClick}
                    />
                  );
                })}
              </div>
            </div>

            {/* Infinite Scroll Sentinel */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-6 min-h-[60px]">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
            )}
          </>
        )
      }

      {/* End of results */}
      {
        !hasMore && trips.length > 0 && (
          <div className="text-center py-8">
            <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest">
              — Đã hiển thị hết danh sách —
            </p>
          </div>
        )
      }

    </div >
  );
};

// Inline Masonry Card Component for Trips
const TripMasonryCard: React.FC<{ trip: TripWithMember; index: number; onClick: (trip: TripWithMember) => void }> = ({ trip, index, onClick }) => {
  // Pattern: Row 1 (T, S), Row 2 (S, T)
  const isTall = index % 4 === 0 || index % 4 === 3;

  return (
    <div
      className="flex flex-col cursor-pointer w-full group overflow-hidden rounded-[24px] border border-border/40 shadow-sm"
      onClick={() => onClick(trip)}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted",
          isTall ? "aspect-[3/4]" : "aspect-[4/3]"
        )}
        style={{ aspectRatio: isTall ? '3/4' : '4/3' }}
      >
        <img
          src={trip.avatar || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop&q=60"}
          alt={trip.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop&q=60";
          }}
        />

        {/* Location Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full text-white text-[10px] font-bold max-w-[calc(100%-24px)]">
          <Navigation size={10} className="fill-white shrink-0" />
          <span className="truncate">{trip.province?.name || "Chưa xác định"}</span>
        </div>

        {/* Status Badge (formerly Role Badge) */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border border-white/20 bg-black/40 text-white">
          {trip.startDate ? new Date(trip.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'Planning'}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 p-3 bg-[#EBE8FF] dark:bg-[#1A1825] rounded-b-[24px] -mt-1 pt-4 flex-1">
        <h3 className="text-foreground font-bold text-sm leading-tight">
          {trip.title}
        </h3>

        <div className="flex items-center gap-1.5 mt-auto">
          <span className="text-[10px] text-muted-foreground/70">
            bởi <span className="text-foreground font-semibold">{trip.user?.fullName || 'Ẩn danh'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] text-muted-foreground font-medium">
            {trip.member_count}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PWATripListPage;
