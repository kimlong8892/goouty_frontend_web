import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { api } from '@/integrations/api/client.ts';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { cn } from '@/lib/utils.ts';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Users,
  Plus,
  ChevronRight,
  ChevronDown,
  Plane,
  Hotel,
  Camera,
  Car,
  MoreVertical,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';

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
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isPWA } = usePWA();
  const navigate = useNavigate();

  const [trips, setTrips] = useState<TripWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<TripWithMember | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Manual search trigger
  const handleManualSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  // Handle scroll for header style
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set page title
  useEffect(() => {
    document.title = 'Chuyến đi - Goouty';
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Reset trips when search changes
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // Reset state when search changes
    setTrips([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchTrips(true); // true = isInitialLoad
  }, [isAuthenticated, isLoading, user, searchTrigger]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, loadingMore]);

  // Load more trips when page changes (for infinite scroll)
  useEffect(() => {
    if (currentPage > 1 && hasMore && !loadingMore) {
      fetchTrips(false); // false = not initial load
    }
  }, [currentPage]);

  // Infinite scroll effect
  useEffect(() => {
    if (!isPWA) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

      // Load more when user scrolls to bottom (with 100px threshold)
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPWA, hasMore, loadingMore, handleLoadMore]);

  const fetchTrips = async (isInitialLoad: boolean = true) => {
    if (!user) return;

    // Show appropriate loading state
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await api.trips.getAll({
        search: searchQuery || undefined,
        page: currentPage,
        limit: 3
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

      // Update trips state
      if (isInitialLoad) {
        setTrips(tripsWithMembers);
      } else {
        setTrips(prev => [...prev, ...tripsWithMembers]);
      }

      // Update pagination state
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTripStatus = (startDate: string | undefined) => {
    if (!startDate) return 'planning';
    const today = new Date();
    const start = new Date(startDate);

    if (start < today) return 'completed';
    if (start.toDateString() === today.toDateString()) return 'ongoing';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500';
      case 'upcoming': return 'bg-green-500';
      case 'ongoing': return 'bg-orange-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Đang lập kế hoạch';
      case 'upcoming': return 'Sắp tới';
      case 'ongoing': return 'Đang diễn ra';
      case 'completed': return 'Đã hoàn thành';
      default: return 'Đang lập kế hoạch';
    }
  };

  const getTripIcon = (provinceName?: string) => {
    if (!provinceName) return <MapPin className="w-4 h-4" />;
    const dest = provinceName.toLowerCase();
    if (dest.includes('bay') || dest.includes('flight') || dest.includes('máy bay')) {
      return <Plane className="w-4 h-4" />;
    } else if (dest.includes('khách sạn') || dest.includes('hotel') || dest.includes('homestay')) {
      return <Hotel className="w-4 h-4" />;
    } else if (dest.includes('du lịch') || dest.includes('tour') || dest.includes('thăm quan')) {
      return <Camera className="w-4 h-4" />;
    } else {
      return <Car className="w-4 h-4" />;
    }
  };

  const handleTripClick = (trip: TripWithMember) => {
    navigate(`/trip/${trip.id}`);
  };

  const handleCreateTrip = () => {
    navigate('/create-trip');
  };

  const handleTripAction = async (action: string, trip: TripWithMember) => {
    if (!trip.id) return;

    if (action === 'delete') {
      setTripToDelete(trip);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteTrip = async () => {
    if (!tripToDelete?.id) return;

    try {
      await api.trips.delete(tripToDelete.id);
      showToast('Đã xóa chuyến đi thành công!', 'success');

      // Remove trip from local state
      setTrips(prev => prev.filter(trip => trip.id !== tripToDelete.id));

      // Close dialog
      setDeleteDialogOpen(false);
      setTripToDelete(null);
    } catch (error: any) {
      console.error('Delete trip error:', error);
      showToast(error.message || 'Không thể xóa chuyến đi', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 bg-background text-foreground">

      {/* Search - Fixed at top */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200 py-3 px-4 pt-[max(env(safe-area-inset-top),12px)]",
        isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
      )}>
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm chuyến đi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              className="pl-10 h-11 bg-card border-border focus:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm rounded-xl text-foreground placeholder:text-muted-foreground/60"
              disabled={searchLoading}
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer to account for fixed search bar */}
      <div className="h-28"></div>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-2 pb-6 text-center px-4">
        <img
          src="/my_trips_mascot.png"
          alt="My Trips Mascot"
          className="w-32 h-32 object-contain mb-2 drop-shadow-sm"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="text-2xl font-black text-primary uppercase tracking-wide mb-2 drop-shadow-sm text-center w-full">
          CHUYẾN ĐI CỦA TÔI
        </h1>
        <p className="text-muted-foreground font-bold text-sm">
          Quản lý và theo dõi tất cả chuyến đi
        </p>
      </div>

      {/* Trips Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      ) : searchLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Đang tìm kiếm...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {trips.map((trip) => {
              const status = getTripStatus(trip.startDate);
              // const statusColor = getStatusColor(status); // Not using status color for badge in new design for now unless requested
              // const statusLabel = getStatusLabel(status);

              return (
                <div
                  key={trip.id}
                  className="group relative rounded-[32px] overflow-hidden border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(108,93,211,0.15)] transition-all duration-500 bg-card h-[450px] w-full flex flex-col cursor-pointer"
                  onClick={() => handleTripClick(trip)}
                >
                  {/* Background Image - Full Cover */}
                  <div className="relative h-1/2 overflow-hidden bg-gray-100">
                    {trip.avatar ? (
                      <img
                        src={trip.avatar}
                        alt={trip.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Plane className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />

                    {/* Action Menu (Three Dots) - Top Right */}
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-all border border-white/20 active:scale-95 text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical size={20} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTripAction('delete', trip);
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa chuyến đi
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 bg-card p-6 flex flex-col justify-between relative -mt-6 rounded-t-[32px] z-10">
                    <div className="space-y-4">
                      {/* Title */}
                      <h3 className="font-bold text-lg text-foreground leading-snug line-clamp-2" title={trip.title}>
                        {trip.title}
                      </h3>

                      {/* Details */}
                      <div className="space-y-2">
                        {/* Location */}
                        <div className="flex items-center text-muted-foreground font-medium text-sm">
                          <MapPin size={16} className="mr-2 text-destructive" />
                          <span className="truncate">{trip.province?.name || 'Chưa xác định'}</span>
                        </div>

                        {/* Members */}
                        <div className="flex items-center text-muted-foreground font-medium text-sm">
                          <Users size={16} className="mr-2 text-primary" />
                          <span>{trip.member_count || 1} thành viên</span>
                        </div>

                        {/* Owner */}
                        <div className="flex items-center text-muted-foreground font-medium text-sm pt-1">
                          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-[10px] font-bold mr-2 overflow-hidden flex-shrink-0">
                            {trip.user?.profilePicture ? (
                              <img src={trip.user.profilePicture} alt="Owner" className="w-full h-full object-cover" />
                            ) : (
                              <span>{(trip.user?.fullName || 'A').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="truncate">Chủ chuyến đi: <span className="text-foreground font-medium">{trip.user?.fullName || 'Tôi'}</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold h-11 shadow-[0_4px_15px_rgba(108,93,211,0.3)] hover:shadow-[0_8px_25px_rgba(108,93,211,0.4)] transition-all active:scale-[0.98]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTripClick(trip);
                        }}
                      >
                        Xem chi tiết
                        <Eye className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Loading More Skeleton */}
          {loadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={`skeleton-${index}`} className="bg-card overflow-hidden border-border">
                  <div className="h-40 bg-secondary animate-pulse"></div>
                  <CardContent className="p-4">
                    <div className="h-6 bg-secondary rounded animate-pulse mb-3"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-secondary rounded animate-pulse"></div>
                      <div className="h-4 bg-secondary rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-secondary rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-secondary rounded-full animate-pulse mr-2"></div>
                        <div className="h-4 bg-secondary rounded animate-pulse w-20"></div>
                      </div>
                      <div className="h-8 bg-secondary rounded animate-pulse w-24"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {trips.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-full mb-4">
                <Plane className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {searchQuery ? 'Không tìm thấy chuyến đi' : 'Chưa có chuyến đi nào'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Thử tìm kiếm với từ khóa khác'
                  : 'Bắt đầu tạo chuyến đi đầu tiên của bạn'
                }
              </p>
              {!searchQuery && (
                <Button
                  onClick={handleCreateTrip}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo chuyến đi đầu tiên
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa chuyến đi</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa chuyến đi "{tripToDelete?.title}"?
              Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan bao gồm:
              <br />
              • Tất cả ngày và hoạt động
              <br />
              • Tất cả chi phí và thanh toán
              <br />
              • Danh sách thành viên
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
            <Button
              onClick={handleDeleteTrip}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
            >
              Xóa chuyến đi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PWATripListPage;
