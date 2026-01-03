import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { api } from '@/lib/api.ts';
import { useGlobalToast } from '@/utils/globalToast';
import { CreateTripRequest, Trip } from '@/lib/types.ts';
import { ProvinceSelector } from '@/components/ProvinceSelector.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { CalendarIcon, ArrowLeft, Check, Upload, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const PWACreateTripPage = () => {
  const { showToast } = useGlobalToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isPWA } = usePWA();
  const navigate = useNavigate();

  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    document.title = 'Tạo chuyến đi - Goouty';
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleCreateTrip = async () => {
    if (!user) {
      showToast('Bạn cần đăng nhập để tạo chuyến đi', 'error');
      return;
    }

    // Clear previous errors
    setErrors({});

    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!tripName.trim()) {
      newErrors.tripName = 'Vui lòng nhập tên chuyến đi';
    }

    if (!destination.trim()) {
      newErrors.destination = 'Vui lòng nhập điểm đến';
    }


    // If there are errors, set them and focus on first error
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Focus on first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
      }

      showToast('Vui lòng kiểm tra lại thông tin', 'error');
      return;
    }

    setLoading(true);
    try {
      const tripData: CreateTripRequest = {
        title: tripName.trim(),
        provinceId: destination.trim() || undefined,
        description: description.trim() || undefined,
        ...(startDate && { startDate: startDate.toISOString() })
      };

      const trip = await api.post<Trip>('/trips', tripData);

      // Upload avatar if provided
      if (coverImage) {
        try {
          await api.trips.uploadAvatar(trip.id, coverImage);
        } catch (error: any) {
          console.error('Upload avatar error:', error);
          showToast('Tạo chuyến đi thành công nhưng không thể tải lên ảnh đại diện', 'warning');
        }
      }

      showToast('Tạo chuyến đi thành công!', 'success');
      navigate(`/trip/${trip.id}`);
    } catch (error: any) {
      console.error('Create trip error:', error);
      showToast(error.message || 'Có lỗi xảy ra khi tạo chuyến đi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Kích thước ảnh không được vượt quá 5MB', 'error');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn file ảnh hợp lệ', 'error');
        return;
      }

      setCoverImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCoverImage(null);
    setImagePreview(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)'
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 flex-shrink-0 bg-white border-b border-gray-200/50 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex items-center text-muted-foreground hover:text-gray-900 disabled:opacity-50 transition-colors text-lg font-medium active:scale-95 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Hủy
          </button>

          <h2 className="text-lg font-bold text-gray-900">Tạo chuyến đi</h2>

          <button
            onClick={handleCreateTrip}
            disabled={loading}
            className="flex items-center text-primary hover:text-primary/80 disabled:text-gray-400 transition-colors font-bold text-lg active:scale-95 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            ) : null}
            Xong
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Form Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-200/50 space-y-4">
          {/* Trip Name Section */}
          <div className="space-y-2">
            <Label htmlFor="tripName" className="text-sm font-semibold text-gray-700">
              Tên chuyến đi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tripName"
              placeholder="Ví dụ: Khám phá Đà Lạt cùng bạn bè"
              value={tripName}
              onChange={(e) => {
                setTripName(e.target.value);
                if (errors.tripName) {
                  setErrors(prev => ({ ...prev, tripName: '' }));
                }
              }}
              className={`w-full text-base transition-all duration-200 ${errors.tripName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-primary focus:ring-primary/20'}`}
            />
            {errors.tripName && (
              <p className="text-sm text-red-500 animate-fade-in">{errors.tripName}</p>
            )}
          </div>

          {/* Destination Section */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-sm font-semibold text-gray-700">
              Điểm đến <span className="text-red-500">*</span>
            </Label>
            <ProvinceSelector
              value={destination}
              onChange={(value) => {
                setDestination(value);
                if (errors.destination) {
                  setErrors(prev => ({ ...prev, destination: '' }));
                }
              }}
              placeholder="Ví dụ: Đà Lạt, Lâm Đồng"
              error={!!errors.destination}
            />
            {errors.destination && (
              <p className="text-sm text-red-500 animate-fade-in">{errors.destination}</p>
            )}
          </div>

          {/* Start Date Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Ngày đi
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-12 text-base transition-all duration-200 border-gray-200 hover:border-primary/50 focus:border-primary"
                >
                  <CalendarIcon className="mr-3 h-5 w-5 text-gray-400" />
                  {startDate ? (
                    format(startDate, "dd/MM/yyyy", { locale: vi })
                  ) : (
                    <span className="text-gray-500">Chọn ngày đi</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 max-h-[80vh] overflow-y-auto"
                align="start"
                side="bottom"
                sideOffset={4}
                avoidCollisions={true}
                collisionPadding={16}
              >
                <Calendar
                  initialFocus
                  mode="single"
                  defaultMonth={startDate}
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Mô tả chuyến đi
            </Label>
            <Textarea
              id="description"
              placeholder="Chia sẻ về chuyến đi này - điều gì khiến bạn hứng thú?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-base border-gray-200 focus:border-primary focus:ring-primary/20 resize-none transition-all duration-200"
            />
          </div>

          {/* Cover Image Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Ảnh đại diện chuyến đi
            </Label>

            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Trip cover preview"
                  className="w-full h-32 object-cover rounded-xl border border-gray-200 shadow-sm"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-110"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="cover-image-upload"
                />
                <label
                  htmlFor="cover-image-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Tải lên ảnh đại diện</p>
                    <p className="text-xs text-gray-500">PNG, JPG tối đa 5MB</p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWACreateTripPage;
