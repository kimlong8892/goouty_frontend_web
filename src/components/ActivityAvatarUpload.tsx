import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { toast } from 'sonner';
import { api } from '@/lib/api.ts';

interface ActivityAvatarUploadProps {
    activityId?: string;
    currentImage?: string;
    onImageChange?: (imageUrl: string) => void;
    onImageSelected?: (file: File | null) => void;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
}

export const ActivityAvatarUpload: React.FC<ActivityAvatarUploadProps> = ({
    activityId,
    currentImage,
    onImageChange,
    onImageSelected,
    size = 'md',
    disabled = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);

    useEffect(() => {
        setPreviewUrl(currentImage || null);
    }, [currentImage]);

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

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước file không được vượt quá 5MB');
            return;
        }

        // Create local preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // If no activityId, just pass the file to parent (Deferred upload)
        if (!activityId) {
            onImageSelected?.(file);
            return;
        }

        // If activityId exists, upload immediately
        try {
            setIsUploading(true);
            const response = await api.activities.uploadImage(activityId, file);

            if (response.success) {
                if (onImageChange) {
                    onImageChange(response.data.url);
                }
                toast.success('Cập nhật ảnh hoạt động thành công');
            }
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra khi cập nhật ảnh');
            console.error('Error uploading activity image:', error);
            // Revert preview on error
            setPreviewUrl(currentImage || null);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const clearImage = () => {
        if (activityId) {
            // Ideally call delete API if exists, or just clear locally if we want to remove linkage
            // For now just clear preview and notify parent
        }
        setPreviewUrl(null);
        onImageSelected?.(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleContainerClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div
                className={`${sizeClasses[size]} relative rounded-xl overflow-hidden bg-secondary dark:bg-[#242731] border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#6347f9] cursor-pointer transition-colors group`}
                onClick={handleContainerClick}
            >
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="Activity cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground dark:text-slate-400">
                        <Camera className={`${iconSizes[size]}`} />
                        {size !== 'sm' && <span className="text-[10px]">Upload</span>}
                    </div>
                )}

                {/* Loading Overlay */}
                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                )}

                {/* Hover Overlay */}
                {!isUploading && !disabled && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="text-white h-6 w-6" />
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />
        </div>
    );
};
