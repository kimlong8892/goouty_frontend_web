import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/integrations/api/client';

interface ProfilePictureUploadProps {
  currentImage?: string;
  onImageChange: (file: File) => void;
  onImageDelete?: () => void;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  showDeleteButton?: boolean;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImage,
  onImageChange,
  onImageDelete,
  userName,
  size = 'md',
  showDeleteButton = true
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
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 2MB for avatar)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 2MB');
      return;
    }

    // Validate file format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ định dạng JPEG, PNG, WebP');
      return;
    }

    try {
      setIsUploading(true);
      onImageChange(file);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật ảnh đại diện');
      console.error('Error uploading profile picture:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!onImageDelete) return;

    try {
      setIsDeleting(true);
      await onImageDelete();
      toast.success('Xóa ảnh đại diện thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa ảnh đại diện');
      console.error('Error deleting avatar:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} rounded-full bg-secondary flex items-center justify-center overflow-hidden mx-auto relative group border border-border/50 shadow-inner transition-colors duration-300`}>
        {currentImage ? (
          <img
            src={currentImage}
            alt={userName || 'Profile'}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'} font-bold text-muted-foreground`}>
            {userName?.charAt(0).toUpperCase() || 'U'}
          </span>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-full flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
            <button
              onClick={handleCameraClick}
              disabled={isUploading}
              className="bg-card text-foreground rounded-full p-2 hover:bg-secondary transition-colors disabled:opacity-50 shadow-lg border border-border"
              title="Thay đổi ảnh"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>

            {showDeleteButton && currentImage && onImageDelete && (
              <button
                onClick={handleDeleteAvatar}
                disabled={isDeleting}
                className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors disabled:opacity-50"
                title="Xóa ảnh"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-friendly buttons */}
      <div className="flex justify-center space-x-2 mt-2 md:hidden">
        <button
          onClick={handleCameraClick}
          disabled={isUploading}
          className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
          title="Thay đổi ảnh"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>

        {showDeleteButton && currentImage && onImageDelete && (
          <button
            onClick={handleDeleteAvatar}
            disabled={isDeleting}
            className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors disabled:opacity-50"
            title="Xóa ảnh"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
