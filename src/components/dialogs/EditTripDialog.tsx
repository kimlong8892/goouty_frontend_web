import React, { useState, useEffect, useRef } from 'react';
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
import { CalendarIcon, MapPin, Edit, Loader2, Camera, X } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '@/lib/api';
import { Trip } from '@/lib/types';
import { ProvinceSelector } from '@/components/ProvinceSelector.tsx';
import { useAuth } from '@/contexts/AuthContext';

interface EditTripDialogProps {
  trip: Trip;
  children: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditTripDialog({ trip, children, onSuccess, open: controlledOpen, onOpenChange: controlledOnOpenChange }: EditTripDialogProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  const [tripName, setTripName] = useState(trip.title);
  const [provinceId, setProvinceId] = useState(trip.provinceId || '');
  const [description, setDescription] = useState(trip.description || '');
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    return trip.startDate ? new Date(trip.startDate) : undefined;
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [currentAvatar, setCurrentAvatar] = useState(trip.avatar || '');
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
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
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      setStartDate(trip.startDate ? new Date(trip.startDate) : undefined);
      setErrors({});
    }
  }, [open, trip]);

  const handleAvatarFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Validate file format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ định dạng JPEG, PNG, WebP, GIF');
      return;
    }

    setSelectedAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatarFile = () => {
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = '';
    }
  };

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

    try {
      // Upload avatar first if a new file is selected
      if (selectedAvatarFile) {
        try {
          await api.trips.uploadAvatar(trip.id, selectedAvatarFile);
        } catch (error: any) {
          toast.error('Không thể tải lên ảnh đại diện: ' + (error.message || 'Lỗi không xác định'));
          return;
        }
      }

      // Update trip information
      const updateData = {
        title: tripName.trim(),
        provinceId: provinceId.trim(),
        description: description.trim() || undefined,
        ...(startDate && { startDate: startDate.toISOString() })
      };

      updateTripMutation.mutate(updateData);
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi cập nhật chuyến đi');
    }
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
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 group">
                {(avatarPreview || currentAvatar) ? (
                  <img
                    src={avatarPreview || currentAvatar || ''}
                    alt={trip.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                {/* Overlay on hover */}
                {!updateTripMutation.isPending && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 hover:bg-white"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Remove button */}
                {(avatarPreview || (currentAvatar && !selectedAvatarFile)) && !updateTripMutation.isPending && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveAvatarFile}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}

                {/* Hidden file input */}
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarFileSelect}
                  className="hidden"
                  disabled={updateTripMutation.isPending}
                />
              </div>
            </div>
            {selectedAvatarFile && (
              <p className="text-xs text-center text-gray-500">
                Ảnh mới sẽ được cập nhật khi bấm "Cập nhật"
              </p>
            )}
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

          {/* Start Date Picker */}
          <div className="space-y-2">
            <Label>
              Ngày đi
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "dd/MM/yyyy", { locale: vi })
                  ) : (
                    <span>Chọn ngày đi</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  defaultMonth={startDate}
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
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
