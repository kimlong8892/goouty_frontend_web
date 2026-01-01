import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Edit, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '@/lib/api';
import { Trip } from '@/lib/types';
import { ProvinceSelector } from '@/components/ProvinceSelector.tsx';
import { TripAvatarUpload } from '@/components/TripAvatarUpload.tsx';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from 'react-day-picker';

interface EditTripDialogProps {
  trip: Trip;
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function EditTripDialog({ trip, children, onSuccess }: EditTripDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tripName, setTripName] = useState(trip.title);
  const [provinceId, setProvinceId] = useState(trip.provinceId || '');
  const [description, setDescription] = useState(trip.description || '');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = trip.startDate ? new Date(trip.startDate) : undefined;
    const to = trip.endDate ? new Date(trip.endDate) : undefined;
    return from || to ? { from, to } : undefined;
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [currentAvatar, setCurrentAvatar] = useState(trip.avatar || '');
  const queryClient = useQueryClient();

  // Check if current user is the trip owner
  const isOwner = user?.id === trip.userId;

  // Don't render if user is not the owner
  if (!isOwner) {
    return null;
  }

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTripName(trip.title);
      setProvinceId(trip.provinceId || '');
      setDescription(trip.description || '');
      setCurrentAvatar(trip.avatar || '');
      const from = trip.startDate ? new Date(trip.startDate) : undefined;
      const to = trip.endDate ? new Date(trip.endDate) : undefined;
      setDateRange(from || to ? { from, to } : undefined);
      setErrors({});
    }
  }, [open, trip]);

  const updateTripMutation = useMutation({
    mutationFn: (data: any) => api.put(`/trips/${trip.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', trip.id] });
      toast.success('Cập nhật chuyến đi thành công!');
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chuyến đi';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});

    // Validation
    const newErrors: {[key: string]: string} = {};

    if (!tripName.trim()) {
      newErrors.tripName = 'Vui lòng nhập tên chuyến đi';
    }

    if (!provinceId.trim()) {
      newErrors.provinceId = 'Vui lòng chọn tỉnh thành';
    }

    if (dateRange?.from && dateRange?.to && dateRange.from > dateRange.to) {
      newErrors.dateRange = 'Ngày bắt đầu phải trước ngày kết thúc';
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
      
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    const updateData = {
      title: tripName.trim(),
      provinceId: provinceId.trim(),
      description: description.trim() || undefined,
      ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
      ...(dateRange?.to && { endDate: dateRange.to.toISOString() })
    };

    updateTripMutation.mutate(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Chỉnh sửa chuyến đi</span>
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cho chuyến đi "{trip.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Trip Avatar Upload */}
          <div className="space-y-2">
            <Label>Ảnh đại diện chuyến đi</Label>
            <div className="flex justify-center">
              <TripAvatarUpload
                tripId={trip.id}
                currentAvatar={currentAvatar}
                onAvatarChange={setCurrentAvatar}
                onAvatarDelete={() => setCurrentAvatar('')}
                tripTitle={trip.title}
                size="lg"
                showDeleteButton={true}
                disabled={updateTripMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tripName">
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
              className={errors.tripName ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.tripName && (
              <p className="text-sm text-red-500">{errors.tripName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="provinceId">
              Tỉnh thành <span className="text-red-500">*</span>
            </Label>
            <ProvinceSelector
              value={provinceId}
              onChange={(value) => {
                setProvinceId(value);
                if (errors.provinceId) {
                  setErrors(prev => ({ ...prev, provinceId: '' }));
                }
              }}
              placeholder="Chọn tỉnh thành"
              error={!!errors.provinceId}
            />
            {errors.provinceId && (
              <p className="text-sm text-red-500">{errors.provinceId}</p>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="space-y-2">
            <Label>
              Thời gian chuyến đi
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${errors.dateRange ? 'border-red-500' : ''}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: vi })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: vi })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: vi })
                    )
                  ) : (
                    <span>Chọn thời gian chuyến đi</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    if (errors.dateRange) {
                      setErrors(prev => ({ ...prev, dateRange: '' }));
                    }
                  }}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
            {errors.dateRange && (
              <p className="text-sm text-red-500">{errors.dateRange}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chuyến đi</Label>
            <Textarea
              id="description"
              placeholder="Chia sẻ về chuyến đi này - điều gì khiến bạn hứng thú?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={updateTripMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateTripMutation.isPending}
          >
            {updateTripMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Cập nhật
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
