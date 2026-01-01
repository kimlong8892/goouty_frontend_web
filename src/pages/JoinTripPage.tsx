import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Plane,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import { JoinTripRequest, TripMember } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function JoinTripPage() {
  const { id, shareToken } = useParams<{ id: string; shareToken: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [joinedTrip, setJoinedTrip] = useState<TripMember | null>(null);

  // Join trip mutation
  const joinTripMutation = useMutation({
    mutationFn: (data: JoinTripRequest) => api.post<TripMember>('/trips/join', data),
    onSuccess: (data) => {
      setJoinedTrip(data);
      toast.success('Bạn đã tham gia chuyến đi thành công!');
      setTimeout(() => {
        navigate(`/trip/${data.tripId}`);
      }, 3000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tham gia chuyến đi';
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    // Wait for auth loading to complete before checking authentication
    if (isLoading) return;
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/auth', { 
        state: { 
          from: `/trip/${id}/${shareToken}`,
          message: 'Vui lòng đăng nhập để tham gia chuyến đi'
        } 
      });
      return;
    }
  }, [isAuthenticated, isLoading, navigate, id, shareToken]);

  const handleJoinTrip = () => {
    if (!shareToken) {
      toast.error('Link chia sẻ không hợp lệ');
      return;
    }

    joinTripMutation.mutate({ shareToken });
  };

  const handleGoBack = () => {
    navigate('/my-trips');
  };

  const handleGoToTrip = () => {
    if (joinedTrip) {
      navigate(`/trip/${joinedTrip.tripId}`);
    }
  };

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Đang kiểm tra xác thực...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show redirect message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Đang chuyển hướng đến trang đăng nhập...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joinedTrip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-900">
              Tham gia thành công! 🎉
            </CardTitle>
            <CardDescription>
              Bạn đã trở thành thành viên của chuyến đi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-3 mb-3">
                <img src="/goouty-logo.svg" alt="Goouty Logo" className="h-5 w-5 object-contain" />
                <h3 className="font-semibold">{joinedTrip.trip?.title || 'Chuyến đi'}</h3>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{joinedTrip.trip?.destination || 'Đang cập nhật...'}</span>
                </div>
                {joinedTrip.trip?.startDate && joinedTrip.trip?.endDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(joinedTrip.trip.startDate), 'dd/MM/yyyy', { locale: vi })} - {' '}
                      {format(new Date(joinedTrip.trip.endDate), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                )}
                {null}
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Bạn sẽ được chuyển đến trang chi tiết chuyến đi trong giây lát...
              </p>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleGoBack} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Về danh sách
                </Button>
                <Button onClick={handleGoToTrip} className="flex-1">
                  Xem chuyến đi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            <img src="/goouty-logo.svg" alt="Goouty Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl">
            Tham gia chuyến đi
          </CardTitle>
          <CardDescription>
            Bạn được mời tham gia một chuyến đi thú vị
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {joinTripMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Có lỗi xảy ra</h4>
                  <p className="text-sm text-red-700 mt-1">
                    {(joinTripMutation.error as any)?.response?.data?.message || 
                     'Không thể tham gia chuyến đi. Vui lòng thử lại.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">
                  Thông tin tham gia
                </h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Bạn sẽ trở thành thành viên của chuyến đi</li>
                  <li>• Có thể xem và tương tác với lịch trình</li>
                  <li>• Nhận thông báo về các hoạt động mới</li>
                  <li>• Tham gia thảo luận với các thành viên khác</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <span>Đăng nhập với tài khoản:</span>
              <Badge variant="secondary">{user?.email}</Badge>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                disabled={joinTripMutation.isPending}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Hủy bỏ
              </Button>
              <Button 
                onClick={handleJoinTrip}
                disabled={joinTripMutation.isPending}
                className="flex-1"
              >
                {joinTripMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tham gia...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Tham gia chuyến đi
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
