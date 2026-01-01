import React, { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { toast } from 'sonner';
import { api } from '@/lib/api.ts';

interface TripAvatarUploadProps {
  tripId: string;
  currentAvatar?: string;
  onAvatarChange?: (avatarUrl: string) => void;
  onAvatarDelete?: () => void;
  tripTitle?: string;
  size?: 'sm' | 'md' | 'lg';
  showDeleteButton?: boolean;
  disabled?: boolean;
}

export const TripAvatarUpload: React.FC<TripAvatarUploadProps> = ({
  tripId,
  currentAvatar,
  onAvatarChange,
  onAvatarDelete,
  tripTitle,
  size = 'md',
  showDeleteButton = true,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB for trip avatar)
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

    try {
      setIsUploading(true);
      const response = await api.trips.uploadAvatar(tripId, file);
      
      if (response.success && onAvatarChange) {
        onAvatarChange(response.data.url);
        toast.success('Cập nhật ảnh đại diện chuyến đi thành công');
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật ảnh đại diện');
      console.error('Error uploading trip avatar:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!onAvatarDelete) return;
    
    try {
      setIsDeleting(true);
      const response = await api.trips.deleteAvatar(tripId);
      
      if (response.success) {
        onAvatarDelete();
        toast.success('Xóa ảnh đại diện chuyến đi thành công');
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi xóa ảnh đại diện');
      console.error('Error deleting trip avatar:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCameraClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative inline-block">
      {/* Avatar Display */}
      <div className={`${sizeClasses[size]} relative rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 group`}>
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt={tripTitle ? `Ảnh đại diện ${tripTitle}` : 'Trip avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <Camera className={`${iconSizes[size]} text-gray-400`} />
          </div>
        )}

        {/* Overlay on hover */}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCameraClick}
              disabled={isUploading}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 hover:bg-white"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Delete button */}
        {currentAvatar && showDeleteButton && !disabled && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDeleteAvatar}
            disabled={isDeleting}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload status */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="bg-white rounded-lg p-3 flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-700">Đang tải lên...</span>
          </div>
        </div>
      )}
    </div>
  );
};
