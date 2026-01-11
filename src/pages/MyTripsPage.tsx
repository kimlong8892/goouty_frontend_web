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
  ChevronRight,
  Check
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { useGlobalToast } from '../utils/globalToast';
import { api } from '@/lib/api.ts';
import { envUtils } from '@/lib/env';
import { usePWA } from '@/pwa/hooks/usePWA';
import { Trip, ShareLink, Province } from '@/lib/types.ts';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils';

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
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [trips, setTrips] = useState<TripWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalTrips, setTotalTrips] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Province filter state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [openProvinceFilter, setOpenProvinceFilter] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<TripWithMember | null>(null);
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Manual search trigger
  const handleManualSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  // Set page title
  useEffect(() => {
    document.title = 'Chuyến đi của tôi - Goouty';
  }, []);

  // Load provinces from our backend API
  useEffect(() => {
    const loadProvinces = async () => {
      setLoading(true);
      try {
        const provincesResponse = await api.provinces.getAll();
        setProvinces(provincesResponse);
      } catch (error) {
        console.error('Error loading provinces:', error);
        showToast('Không thể tải danh sách tỉnh thành', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadProvinces();
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
  }, [isAuthenticated, isLoading, navigate, user, searchTrigger, selectedProvince]);

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
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Determine if we assume we are doing client-side filtering (if backend doesn't support it)
      // We fetch a larger batch if filtering by province to ensure we get matches
      const isFilteringByProvince = selectedProvince !== 'all';
      const fetchLimit = isFilteringByProvince ? 100 : 9; // Use 9 for grid (3x3)

      // Lấy chuyến đi với tìm kiếm và phân trang
      const response = await api.trips.getAll({
        search: searchQuery || undefined,
        page: isFilteringByProvince ? 1 : currentPage, // Always start from page 1 if filtering client-side
        limit: fetchLimit,
        provinceId: selectedProvince !== 'all' ? selectedProvince : undefined
      });

      // Transform API response to match our component's expected format
      let tripsWithMembers: TripWithMember[] = response.trips.map((trip: any) => {
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

      // Client-side filtering as fallback if backend ignores provinceId
      if (isFilteringByProvince) {
        tripsWithMembers = tripsWithMembers.filter(t =>
          t.province?.id === selectedProvince || t.provinceId === selectedProvince
        );
      }

      // Update trips state
      if (isInitialLoad || isFilteringByProvince) {
        // If filtering, we replaced the whole list (since we fetched page 1 with high limit)
        setTrips(tripsWithMembers);
      } else {
        setTrips(prev => [...prev, ...tripsWithMembers]);
      }

      // Update pagination state
      if (isFilteringByProvince) {
        // If client side filtering, we assume we fetched enough. 
        // Improvement: could handle true pagination if we really wanted, but for My Trips this is usually safe.
        // If we got 'limit' results, there MIGHT be more, but with the filter applied, complex pagination is hard.
        // We'll trust the visual list for now.
        setHasMore(false); // Disable infinite scroll for filtered view for simplicity
      } else {
        setHasMore(response.pagination.page < response.pagination.totalPages);
        setTotalTrips(response.pagination.total);
      }
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
    <div className="min-h-screen pt-4 pb-12 px-4 bg-background">
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
              <div className="w-full h-48 relative mb-4 flex items-center justify-center overflow-hidden">
                {/* Speed Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="speed-streak w-24 top-[35%] right-0" style={{ animationDelay: '0s' }}></div>
                  <div className="speed-streak w-32 top-[50%] right-0" style={{ animationDelay: '0.2s' }}></div>
                  <div className="speed-streak w-20 top-[65%] right-0" style={{ animationDelay: '0.4s' }}></div>
                </div>

                <div className="w-48 h-48 relative z-10 animate-mascot-run">
                  <img
                    src="/my_trips_mascot.png"
                    alt="My Trips Mascot"
                    className="w-full h-full object-contain drop-shadow-xl"
                  />
                  {/* Exhaust Smoke */}
                  <div className="absolute bottom-10 left-6 pointer-events-none">
                    <div className="smoke-particle" style={{ animationDelay: '0s' }}></div>
                    <div className="smoke-particle" style={{ animationDelay: '0.3s' }}></div>
                    <div className="smoke-particle" style={{ animationDelay: '0.6s' }}></div>
                  </div>
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-black mb-3 text-primary uppercase tracking-wide">
                CHUYẾN ĐI CỦA TÔI
              </h1>
              <p className="text-muted-foreground font-medium text-lg mb-6">
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
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  className="pl-14 pr-10 bg-secondary border-border focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 h-12 rounded-xl text-foreground placeholder:font-normal"
                  disabled={searchLoading}
                />
                {searchLoading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
              </div>

              <div className="md:w-64">
                <Popover open={openProvinceFilter} onOpenChange={setOpenProvinceFilter}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openProvinceFilter}
                      className="w-full h-12 bg-secondary border-border rounded-xl focus:ring-2 focus:ring-primary/20 shadow-none text-base justify-between font-normal hover:bg-secondary hover:border-primary/50 text-muted-foreground hover:text-muted-foreground transition-all duration-200"
                    >
                      <div className="flex items-center truncate">
                        <MapPin className="w-5 h-5 mr-3 text-muted-foreground shrink-0" />
                        <span className={cn(selectedProvince === 'all' ? "" : "text-foreground font-normal")}>
                          {selectedProvince === 'all'
                            ? "Tất cả tỉnh thành"
                            : provinces.find((province) => province.id === selectedProvince)?.name || "Chọn tỉnh thành"}
                        </span>
                      </div>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 rounded-2xl border-border shadow-xl bg-card" align="end">
                    <Command>
                      <CommandInput placeholder="Tìm nhanh tỉnh thành..." />
                      <CommandList>
                        <CommandEmpty>Không tìm thấy tỉnh thành.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            className="data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                            onSelect={() => {
                              setSelectedProvince('all');
                              setOpenProvinceFilter(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProvince === 'all' ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Tất cả tỉnh thành
                          </CommandItem>
                          {provinces.map((province) => (
                            <CommandItem
                              key={province.id}
                              value={province.name}
                              className="data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                              onSelect={() => {
                                setSelectedProvince(province.id);
                                setOpenProvinceFilter(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedProvince === province.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {province.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                      className="group relative rounded-[32px] overflow-hidden border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(99,71,249,0.15)] transition-all duration-500 bg-card h-[450px] w-full flex flex-col cursor-pointer"
                      onClick={() => handleTripAction('view', trip)}
                    >
                      {/* Background Image - Full Cover */}
                      <div className="relative h-1/2 overflow-hidden bg-secondary">
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
                          <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <Plane className="w-16 h-16 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />

                        {/* Action Menu (Three Dots) - Top Right */}
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md hover:bg-white/40 dark:hover:bg-black/40 transition-all border border-white/20 dark:border-white/10 active:scale-95 text-white"
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
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <h3 className="font-bold text-lg text-foreground leading-snug line-clamp-2 text-left" title={trip.title}>
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
                            <div className="flex items-center text-muted-foreground font-medium text-sm">
                              <MapPin size={16} className="mr-2 text-red-500" />
                              <span className="truncate">{trip.province?.name || 'Chưa xác định'}</span>
                            </div>

                            {/* Members */}
                            <div className="flex items-center text-muted-foreground font-medium text-sm">
                              <Users size={16} className="mr-2 text-primary" />
                              <span>{trip.member_count || 1} thành viên</span>
                            </div>

                            {/* Owner */}
                            <div className="flex items-center text-muted-foreground font-medium text-sm pt-1">
                              <div className="w-5 h-5 rounded-full bg-[#00A58E] flex items-center justify-center text-white text-[10px] font-bold mr-2 overflow-hidden flex-shrink-0">
                                {(trip as any).user?.profilePicture ? (
                                  <img src={(trip as any).user.profilePicture} alt="Owner" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{(trip.user?.fullName || 'A').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="truncate">Chủ chuyến đi: <span className="text-foreground font-medium">{(trip as any).user?.fullName || 'Tôi'}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                          <Button
                            className="w-full rounded-2xl bg-[#6347f9] hover:bg-[#5136db] text-white text-sm font-bold h-11 shadow-[0_4px_15px_rgba(99,71,249,0.3)] hover:shadow-[0_8px_25px_rgba(99,71,249,0.4)] transition-all active:scale-[0.98]"
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
                      className="px-8 h-12 rounded-xl border-[#6347f9]/20 text-[#6347f9] hover:bg-[#6347f9]/5 font-medium"
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
                    <div className="w-16 h-1 bg-[#6347f9]/10 mx-auto rounded-full mb-4"></div>
                    <p className="text-slate-400 font-medium">Bạn đã xem hết danh sách</p>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {trips.length === 0 && !loading && !searchLoading && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-card rounded-full mb-6 shadow-md border border-border">
                  <MapPin className="w-10 h-10 text-primary/30" />
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
              className="rounded-xl hover:bg-transparent hover:text-primary hover:border-primary border-border bg-card text-foreground"
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
