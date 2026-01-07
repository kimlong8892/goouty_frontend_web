import React, { useState, useEffect } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  MapPin,
  Calendar,
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Share2,
  Trash2,
  ChevronDown,
  Loader2,
  Eye,
  Plane,
  Heart,
  ChevronRight
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { useGlobalToast } from '../utils/globalToast';
import { api } from '@/lib/api.ts';
import { envUtils } from '@/lib/env';
import { usePWA } from '@/pwa/hooks/usePWA';
import { Trip, ShareLink } from '@/lib/types.ts';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Using Trip from types.ts, extending it for local needs
type LocalTrip = Trip & {
  isPublic?: boolean;
  status?: string;
};

type TripWithMember = LocalTrip & {
  avatar?: string;
  members?: { name: string; is_creator: boolean }[];
  member_count?: number;
  user_role?: 'owner' | 'member';
};

const MyTripsPage = () => {
  const { showToast } = useGlobalToast();
  const showContent = useAnimateIn(false, 300);
  const { isPWA } = usePWA();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [trips, setTrips] = useState<TripWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalTrips, setTotalTrips] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<TripWithMember | null>(null);
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Set page title
  useEffect(() => {
    document.title = 'Chuyến đi của tôi - Goouty';
  }, []);

  // Reset trips when search changes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (isLoading) return; // Don't fetch trips while loading

    // Reset state when search changes
    setTrips([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchTrips(true); // true = isInitialLoad
  }, [isAuthenticated, isLoading, navigate, user, debouncedSearchQuery]);

  // Load more trips when page changes (for infinite scroll)
  useEffect(() => {
    if (currentPage > 1 && hasMore && !loadingMore) {
      fetchTrips(false); // false = not initial load
    }
  }, [currentPage]);

  const fetchTrips = async (isInitialLoad: boolean = true) => {
    if (!user) return;

    // Show appropriate loading state
    if (isInitialLoad) {
      if (debouncedSearchQuery !== searchQuery) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
    } else {
      setLoadingMore(true);
    }

    try {
      // Lấy chuyến đi với tìm kiếm và phân trang
      const response = await api.trips.getAll({
        search: debouncedSearchQuery || undefined,
        page: currentPage,
        limit: 6 // Increased limit for grid view
      });

      // Transform API response to match our component's expected format
      const tripsWithMembers: TripWithMember[] = response.trips.map((trip: any) => {
        // Xác định vai trò của user trong chuyến đi
        const isOwner = trip.userId === user.id;
        const userRole = isOwner ? 'owner' : 'member';

        // Tính số lượng thành viên (luôn bao gồm chủ chuyến đi + các thành viên đã accepted khác)
        const otherAcceptedCount = trip.members?.filter((m: any) => m && m.userId !== trip.userId && (m.status === 'accepted' || !m.status)).length || 0;
        const memberCount = otherAcceptedCount + 1;

        return {
          ...trip,
          user_role: userRole,
          member_count: memberCount,
          members: [
            {
              name: trip.user?.fullName || trip.user?.email || 'User',
              is_creator: true
            },
            ...(trip.members?.map((member: any) => ({
              name: member.user?.fullName || member.user?.email || 'Member',
              is_creator: false
            })) || [])
          ],
          isPublic: !!trip.shareToken,
          // Map API fields to component expected fields
          name: trip.title,
          start_date: trip.startDate,
          is_public: !!trip.shareToken,
          slug: trip.id.toString(),
          // Ensure user object is preserved with profilePicture
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
      setTotalTrips(response.pagination.total);
    } catch (error: any) {
      console.error('Fetch trips error:', error);
      showToast(error.message || 'Không thể tải danh sách chuyến đi', 'error');
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setLoadingMore(false);
    }
  };


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleTripAction = async (action: string, trip: TripWithMember) => {
    if (!trip.id) return;

    if (action === 'view') {
      navigate(`/trip/${trip.id}`);

    } else if (action === 'delete') {
      openDeleteDialog(trip);
    }
  };

  const handleDeleteTrip = async () => {
    if (!tripToDelete?.id) return;

    try {
      await api.trips.delete(tripToDelete.id);
      showToast('Đã xóa chuyến đi thành công!', 'success');

      // Remove trip from local state
      setTrips(prev => prev.filter(trip => trip.id !== tripToDelete.id));

      // Update total count
      setTotalTrips(prev => prev - 1);

      // Close dialog
      setDeleteDialogOpen(false);
      setTripToDelete(null);
    } catch (error: any) {
      console.error('Delete trip error:', error);
      showToast(error.message || 'Không thể xóa chuyến đi', 'error');
    }
  };

  const openDeleteDialog = (trip: TripWithMember) => {
    setTripToDelete(trip);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen pt-4 pb-12 px-4">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#6347f9]" />
            <p className="text-muted-foreground">Đang kiểm tra đăng nhập...</p>
          </div>
        </div>
      ) : (
        <AnimatedTransition show={showContent} animation="slide-up">
          <div className="max-w-6xl mx-auto">
            {/* Header Section with Mascot */}
            <div className="text-center mb-10 relative">
              <div className="w-48 h-48 mx-auto mb-4">
                <img
                  src="/my_trips_mascot.png"
                  alt="My Trips Mascot"
                  className="w-full h-full object-contain drop-shadow-xl transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h1 className="text-3xl md:text-5xl font-black mb-3 text-[#6347f9] uppercase tracking-wide">
                CHUYẾN ĐI CỦA TÔI
              </h1>
              <p className="text-slate-600 font-medium text-lg mb-6">
                Quản lý và theo dõi tất cả chuyến đi
              </p>

              <Button
                onClick={() => navigate('/create-trip')}
                className="h-12 px-8 rounded-xl bg-[#6347f9] hover:bg-[#5136db] text-white shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tạo chuyến đi
              </Button>
            </div>


            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-12 max-w-4xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-11 h-12 bg-white border-slate-200 rounded-2xl focus-visible:ring-purple-500/20"
                  disabled={searchLoading}
                />
                {searchLoading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
              </div>

              <div className="md:w-64">
                <Select defaultValue="all">
                  <SelectTrigger className="h-12 bg-white border-slate-200 rounded-2xl focus:ring-purple-500/20">
                    <MapPin className="w-5 h-5 mr-2 text-slate-400" />
                    <SelectValue placeholder="Tất cả tỉnh thành" select-none />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="all">Tất cả tỉnh thành</SelectItem>
                    {/* Add more filter options if needed */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Trips Grid */}
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#6347f9]" />
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            ) : searchLoading ? (
              <div className="text-center py-16">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#6347f9]" />
                <p className="text-muted-foreground">Đang tìm kiếm...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {trips.map((trip) => (
                    <div
                      key={trip.id}
                      className="group relative rounded-[32px] overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(108,93,211,0.15)] transition-all duration-500 bg-white h-[450px] w-full flex flex-col cursor-pointer"
                      onClick={() => handleTripAction('view', trip)}
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
                      <div className="flex-1 bg-white p-6 flex flex-col justify-between relative -mt-6 rounded-t-[32px] z-10">
                        <div className="space-y-4">
                          {/* Title */}
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <h3 className="font-bold text-lg text-slate-900 leading-snug line-clamp-2 cursor-help text-left" title={trip.title}>
                                  {trip.title}
                                </h3>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-[300px] break-words">{trip.title}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Details */}
                          <div className="space-y-2">
                            {/* Location */}
                            <div className="flex items-center text-slate-500 font-medium text-sm">
                              <MapPin size={16} className="mr-2 text-[#6347f9]" />
                              <span className="truncate">{trip.province?.name || 'Chưa xác định'}</span>
                            </div>

                            {/* Members */}
                            <div className="flex items-center text-slate-500 font-medium text-sm">
                              <Users size={16} className="mr-2 text-red-500" />
                              <span>{trip.member_count || 1} thành viên</span>
                            </div>

                            {/* Owner */}
                            <div className="flex items-center text-slate-500 font-medium text-sm pt-1">
                              <div className="w-5 h-5 rounded-full bg-[#00A58E] flex items-center justify-center text-white text-[10px] font-bold mr-2 overflow-hidden flex-shrink-0">
                                {(trip as any).user?.profilePicture ? (
                                  <img src={(trip as any).user.profilePicture} alt="Owner" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{(trip.user?.fullName || 'A').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="truncate">Chủ chuyến đi: <span className="text-slate-900 font-medium">{(trip as any).user?.fullName || 'Tôi'}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                          <Button
                            className="w-full rounded-2xl bg-[#6347f9] hover:bg-[#5136db] text-white text-sm font-bold h-11 shadow-[0_4px_15px_rgba(108,93,211,0.3)] hover:shadow-[0_8px_25px_rgba(108,93,211,0.4)] transition-all active:scale-[0.98]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTripAction('view', trip);
                            }}
                          >
                            Xem chi tiết
                            <Eye className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex flex-col items-center py-12">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-8 h-12 rounded-xl border-purple-200 text-[#6347f9] hover:bg-purple-50 font-medium"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang tải thêm...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Xem thêm chuyến đi
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* End of results */}
                {!hasMore && trips.length > 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-1 bg-purple-100 mx-auto rounded-full mb-4"></div>
                    <p className="text-slate-400 font-medium">Bạn đã xem hết danh sách</p>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {trips.length === 0 && !loading && !searchLoading && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-md">
                  <MapPin className="w-10 h-10 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">
                  {searchQuery ? 'Không tìm thấy chuyến đi' : 'Chưa có chuyến đi nào'}
                </h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Thử tìm kiếm với từ khóa khác'
                    : 'Bắt đầu tạo chuyến đi đầu tiên của bạn để lưu giữ những kỷ niệm tuyệt vời.'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/create-trip')} className="h-12 px-8 rounded-xl bg-[#6347f9] hover:bg-[#5136db] text-white font-semibold">
                    <Plus className="w-5 h-5 mr-2" />
                    Tạo chuyến đi đầu tiên
                  </Button>
                )}
              </div>
            )}
          </div>
        </AnimatedTransition>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa chuyến đi</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa chuyến đi "{tripToDelete?.title}"?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl hover:bg-transparent hover:text-primary hover:border-primary border-slate-200"
            >
              Hủy
            </Button>
            <Button
              onClick={handleDeleteTrip}
              className="bg-[#6347f9] hover:bg-[#5136db] rounded-xl text-white"
            >
              Xóa chuyến đi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyTripsPage;
