import React, { useEffect, useState } from 'react';
import { DateRange } from "react-day-picker";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { api } from '@/integrations/api/client.ts';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { DATABASE_TYPES } from '@/integrations/api/types.ts';
import { ProvinceSelector } from '@/components/ProvinceSelector.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { CalendarIcon, ChevronLeft, Camera, X, Link2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils.ts';
import { CreateTripFromUrlDialog } from '@/components/dialogs/CreateTripFromUrlDialog.tsx';


const PWACreateTripPage = () => {
  const { showToast } = useGlobalToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isPWA } = usePWA();
  const navigate = useNavigate();

  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<DateRange | undefined>();
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showUrlDialog, setShowUrlDialog] = useState(false);


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
      newErrors.destination = 'Vui lòng chọn điểm đến';
    }

    if (!date?.from) {
      newErrors.date = 'Vui lòng chọn ngày bắt đầu - ngày kết thúc';
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

      return;
    }

    setLoading(true);
    try {
      const tripData: any = {
        title: tripName.trim(),
        provinceId: destination.trim() || undefined,
        description: description.trim() || undefined,
        startDate: date?.from ? date.from.toISOString() : undefined,
        endDate: date?.to ? date.to.toISOString() : undefined
      };

      const trip = await api.trips.create(tripData);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-10 text-foreground overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md px-4 py-0.5 flex items-center justify-between min-h-[40px]">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all outline-none"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-black absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-foreground">
          Tạo chuyến đi
        </h1>
        <button
          onClick={() => setShowUrlDialog(true)}
          className="p-2 -mr-2 text-primary hover:text-primary/80 active:scale-95 transition-all outline-none"
        >
          <Link2 className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-10 overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-8">

          {/* Cover Image Upload (Circular Style) */}
          <div className="flex justify-center">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('cover-image-upload')?.click()}>
              <div className={cn(
                "w-32 h-32 rounded-full overflow-hidden border-2 border-border shadow-md bg-secondary flex items-center justify-center transition-all duration-300 group-hover:border-primary/50",
                imagePreview ? "border-primary" : ""
              )}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Trip cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors opacity-50" />
                )}
              </div>

              <div className="absolute bottom-0 right-1 bg-background rounded-full p-2 border border-border shadow-sm text-primary">
                <Camera className="w-4 h-4" />
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="cover-image-upload"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">

            {/* Trip Name */}
            <div className="space-y-2">
              <Label htmlFor="tripName" className="text-muted-foreground text-sm font-medium ml-1">
                Tên chuyến đi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tripName"
                placeholder="Ví dụ: Khám phá Đà Lạt"
                value={tripName}
                onChange={(e) => {
                  setTripName(e.target.value);
                  if (errors.tripName) setErrors(p => ({ ...p, tripName: '' }));
                }}
                className={cn(
                  "h-12 rounded-xl bg-card border-input focus:ring-primary/20 transition-all text-base",
                  errors.tripName && "border-destructive focus-visible:ring-destructive/20"
                )}
              />
              {errors.tripName && (
                <p className="text-xs text-destructive ml-1">{errors.tripName}</p>
              )}
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-muted-foreground text-sm font-medium ml-1">
                Điểm đến <span className="text-red-500">*</span>
              </Label>
              <ProvinceSelector
                value={destination}
                onChange={(value) => {
                  setDestination(value);
                  if (errors.destination) setErrors(p => ({ ...p, destination: '' }));
                }}
                placeholder="Chọn điểm đến"
                error={!!errors.destination}
                className="h-12 rounded-xl bg-card border-input"
              />
              {errors.destination && (
                <p className="text-xs text-destructive ml-1">{errors.destination}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm font-medium ml-1">
                Ngày bắt đầu - ngày kết thúc <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-14 rounded-xl bg-card border-input hover:bg-card/80 transition-all",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        {date?.from ? (
                          date.to ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {format(date.from, "dd/MM/yyyy", { locale: vi })}
                              </span>
                              <span className="text-muted-foreground text-xs">→</span>
                              <span className="font-semibold text-foreground">
                                {format(date.to, "dd/MM/yyyy", { locale: vi })}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold text-foreground">
                              {format(date.from, "dd/MM/yyyy", { locale: vi })}
                            </span>
                          )
                        ) : (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-foreground font-medium">Chọn ngày</span>
                            <span className="text-xs text-muted-foreground">Chạm để chọn lịch trình</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    numberOfMonths={1}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-xs text-destructive ml-1">{errors.date}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-muted-foreground text-sm font-medium ml-1">
                Mô tả (tùy chọn)
              </Label>
              <Textarea
                id="description"
                placeholder="Mô tả chuyến đi này..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="min-h-[100px] rounded-xl bg-card border-input resize-none transition-all text-base"
              />
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Button - Positioned above PWA Navbar */}
      <div className="p-4 bg-background border-t border-border/50 pb-24 z-40">
        <Button
          onClick={handleCreateTrip}
          disabled={loading}
          className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/25 text-white active:scale-[0.98] transition-all"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          {loading ? "Đang tạo..." : "Tạo chuyến đi"}
        </Button>
      </div>

      {/* Create from URL Dialog */}
      <CreateTripFromUrlDialog
        open={showUrlDialog}
        onOpenChange={setShowUrlDialog}
      />
    </div>
  );
};

export default PWACreateTripPage;

