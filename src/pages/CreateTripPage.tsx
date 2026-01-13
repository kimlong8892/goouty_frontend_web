import React, { useEffect, useState } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { CalendarIcon, ChevronRight, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '@/lib/api.ts';
import { useNavigate } from 'react-router-dom';
import { useGlobalToast } from '../utils/globalToast';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { CreateTripRequest, Trip } from '@/lib/types.ts';
import { ProvinceSelector } from '@/components/ProvinceSelector.tsx';
import { X, Image as ImageIcon, Camera } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

const CreateTripPage = () => {
  const { showToast } = useGlobalToast();
  const showContent = useAnimateIn(false, 300);
  const [tripName, setTripName] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    document.title = 'Tạo chuyến đi mới - Goouty';
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

    setErrors({});
    const newErrors: { [key: string]: string } = {};

    if (!tripName.trim()) {
      newErrors.tripName = 'Vui lòng nhập tên chuyến đi';
    }
    if (!provinceId.trim()) {
      newErrors.provinceId = 'Vui lòng chọn tỉnh thành';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) element.focus();
      showToast('Vui lòng kiểm tra lại thông tin', 'error');
      return;
    }

    setLoading(true);
    try {
      const tripData: CreateTripRequest = {
        title: tripName.trim(),
        provinceId: provinceId.trim(),
        description: description.trim() || undefined,
        ...(startDate && { startDate: startDate.toISOString() })
      };
      const trip = await api.post<Trip>('/trips', tripData);

      // Upload image if provided
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Kích thước ảnh không được vượt quá 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn file ảnh hợp lệ', 'error');
        return;
      }
      setCoverImage(file);
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

  return (
    <div className="min-h-screen pt-4 pb-12 px-4 bg-background transition-colors duration-300">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang kiểm tra đăng nhập...</p>
          </div>
        </div>
      ) : (
        <AnimatedTransition show={showContent} animation="slide-up">
          <div className="max-w-2xl mx-auto">
            {/* Header Section with Mascot */}
            <div className="text-center mb-8 relative">
              <div className="w-60 md:w-72 mx-auto mb-4">
                <img
                  src="/create_trip_mascot.png"
                  alt="Goouty Mascot"
                  className="w-full h-full object-contain drop-shadow-xl transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-primary uppercase tracking-wide">
                TẠO CHUYẾN ĐI MỚI
              </h1>
              <p className="text-slate-400 font-medium">
                Bắt đầu lập kế hoạch cho chuyến đi tuyệt vời của bạn
              </p>
            </div>

            {/* Form Card */}
            <Card className="rounded-[32px] border-border shadow-2xl bg-card overflow-hidden">
              <CardHeader className="text-center pt-8 pb-2">
                <CardTitle className="text-xl font-bold text-foreground">Thông tin chuyến đi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <div className="space-y-2">
                  <Label htmlFor="tripName" className="text-muted-foreground font-medium text-sm">
                    Tên chuyến đi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tripName"
                    placeholder="Ví dụ: Khám phá Đà Lạt cùng bạn bè"
                    value={tripName}
                    onChange={(e) => {
                      setTripName(e.target.value);
                      if (errors.tripName) setErrors(prev => ({ ...prev, tripName: '' }));
                    }}
                    className={cn(
                      "h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none",
                      errors.tripName && "border-red-500 focus:border-red-500 focus-visible:ring-red-500/20"
                    )}
                  />
                  {errors.tripName && <p className="text-sm text-red-500">{errors.tripName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provinceId" className="text-muted-foreground font-medium text-sm">
                    Tỉnh thành <span className="text-red-500">*</span>
                  </Label>
                  <ProvinceSelector
                    value={provinceId}
                    onChange={(value) => {
                      setProvinceId(value);
                      if (errors.provinceId) setErrors(prev => ({ ...prev, provinceId: '' }));
                    }}
                    placeholder="Chọn tỉnh thành"
                    error={!!errors.provinceId}
                    className="h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 hover:border-primary/50"
                  />
                  {errors.provinceId && <p className="text-sm text-red-500">{errors.provinceId}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground font-medium text-sm">
                    Ngày đi
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 bg-secondary border-border rounded-xl hover:bg-secondary/80 transition-all duration-200",
                          startDate ? "text-foreground hover:text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground/60"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {startDate ? (
                          format(startDate, "dd/MM/yyyy", { locale: vi })
                        ) : (
                          <span>Chọn ngày đi</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                      <Calendar
                        initialFocus
                        mode="single"
                        defaultMonth={startDate}
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="bg-card text-foreground"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="description" className="text-muted-foreground font-medium text-sm">Mô tả chuyến đi</Label>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Chia sẻ về chuyến đi này - điều gì khiến bạn hứng thú?"
                    value={description}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) setDescription(e.target.value);
                    }}
                    rows={4}
                    className="h-24 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none resize-none"
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    {description.length}/100
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground font-medium text-sm">
                    Ảnh đại diện chuyến đi
                  </Label>
                  {imagePreview ? (
                    <div className="relative group w-full h-48 rounded-xl overflow-hidden border border-border shadow-inner">
                      <img
                        src={imagePreview}
                        alt="Trip cover preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
                          onClick={() => document.getElementById('trip-avatar-upload')?.click()}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Thay đổi
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="rounded-full"
                          onClick={removeImage}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-secondary hover:bg-secondary/80 hover:border-primary/50 outline-none transition-all duration-300 cursor-pointer group shadow-inner"
                      onClick={() => document.getElementById('trip-avatar-upload')?.click()}
                    >
                      <div className="w-12 h-12 rounded-full bg-card shadow-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors mb-2">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Tải lên ảnh chuyến đi</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG tối đa 5MB</p>
                    </div>
                  )}
                  <input
                    id="trip-avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    onClick={() => navigate('/', { state: { scrollTo: 'templates' } })}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Sử dụng mẫu
                  </Button>
                  <Button
                    onClick={handleCreateTrip}

                    className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-primary/20 transition-all font-bold"
                    disabled={loading}
                  >
                    {loading ? (
                      'Đang tạo...'
                    ) : (
                      <>
                        Bắt đầu hành trình
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedTransition>
      )}
    </div>
  );
};

export default CreateTripPage;