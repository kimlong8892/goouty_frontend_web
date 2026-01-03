import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { api } from '@/lib/api.ts';
import { useGlobalToast } from '@/utils/globalToast';
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
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog.tsx';

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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<TripWithMember | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
  }, [isAuthenticated, isLoading, user, debouncedSearchQuery]);

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
      if (debouncedSearchQuery !== searchQuery) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await api.trips.getAll({
        search: debouncedSearchQuery || undefined,
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
    <div className="min-h-screen pb-20 px-4">

      {/* Search - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/50 py-3 px-4 shadow-sm pt-[max(env(safe-area-inset-top),12px)]">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm chuyến đi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-gray-50 border-gray-200 focus:border-primary focus:ring-primary/20 shadow-sm rounded-xl"
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
              const statusColor = getStatusColor(status);
              const statusLabel = getStatusLabel(status);

              return (
                <Card
                  key={trip.id}
                  className="bg-white hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-gray-200/50 hover:border-primary/30 hover:scale-[1.02] group"
                  onClick={() => handleTripClick(trip)}
                >
                  <div className="relative">
                    {/* Trip Avatar/Image */}
                    <div className="h-40 relative overflow-hidden">
                      {trip.avatar ? (
                        <img
                          src={trip.avatar}
                          alt={trip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-primary/20 via-accent/10 to-purple-100 flex items-center justify-center">
                          <Plane className="w-12 h-12 text-primary/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

                      {/* Location Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 backdrop-blur-sm text-primary border-primary/20 shadow-md">
                          {trip.province?.name || 'Chưa chọn tỉnh thành'}
                        </Badge>
                      </div>

                      {/* Three Dots Menu */}
                      <div className="absolute top-3 right-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md hover:scale-110 transition-all duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleTripAction('delete', trip)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa chuyến đi
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute bottom-3 right-3">
                        <Badge className={`${statusColor} text-white shadow-md backdrop-blur-sm`}>
                          {statusLabel}
                        </Badge>
                      </div>

                      {/* Trip Icon */}
                      <div className="absolute bottom-3 left-3">
                        <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                          {getTripIcon(trip.province?.name)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-bold text-base text-gray-900 mb-1 leading-snug group-hover:text-primary transition-colors duration-200">
                      {trip.title}
                    </h3>

                    {/* Trip Details */}
                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(trip.startDate)}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{trip.province?.name || 'Chưa chọn tỉnh thành'}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <div className="flex -space-x-2 mr-3">
                          {trip.members && trip.members.length > 0 ? (
                            trip.members.map((member: any, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden"
                                title={member.name}
                              >
                                {member.user?.profilePicture ? (
                                  <img
                                    src={member.user.profilePicture}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-medium text-gray-600">
                                    {member.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                              {trip.user?.profilePicture ? (
                                <img
                                  src={trip.user.profilePicture}
                                  alt={trip.user.fullName || 'Owner'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-medium text-gray-600">
                                  {(trip.user?.fullName || trip.user?.email || 'U').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Loading More Skeleton */}
          {loadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={`skeleton-${index}`} className="bg-white overflow-hidden">
                  <div className="h-40 bg-gray-200 animate-pulse"></div>
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse mr-2"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {trips.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Plane className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                {searchQuery ? 'Không tìm thấy chuyến đi' : 'Chưa có chuyến đi nào'}
              </h3>
              <p className="text-gray-600 mb-4">
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa chuyến đi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa chuyến đi "{tripToDelete?.title}"?
              Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan bao gồm:
              <br />
              • Tất cả ngày và hoạt động
              <br />
              • Tất cả chi phí và thanh toán
              <br />
              • Danh sách thành viên
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrip}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Xóa chuyến đi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PWATripListPage;
