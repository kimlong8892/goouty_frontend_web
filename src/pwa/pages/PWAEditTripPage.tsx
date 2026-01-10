import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { api } from '@/lib/api.ts';
import { useGlobalToast } from '@/utils/globalToast';
import { UpdateTripRequest, Trip } from '@/lib/types.ts';
import { ProvinceSelector } from '@/components/ProvinceSelector.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { CalendarIcon, X, Image as ImageIcon, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils.ts';

const PWAEditTripPage = () => {
    const { id } = useParams<{ id: string }>();
    const { showToast } = useGlobalToast();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { isPWA } = usePWA();
    const navigate = useNavigate();

    const [tripName, setTripName] = useState('');
    const [destination, setDestination] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        document.title = 'Chỉnh sửa chuyến đi - Goouty';
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
            return;
        }
        fetchTripDetails();
    }, [id, authLoading, isAuthenticated]);

    const fetchTripDetails = async () => {
        if (!id) return;
        try {
            setInitialLoading(true);
            const trip = await api.trips.getById(id);
            setTripName(trip.title);
            setDestination(trip.provinceId || '');
            setDescription(trip.description || '');
            setCurrentAvatar(trip.avatar || null);
            if (trip.startDate) {
                setStartDate(new Date(trip.startDate));
            }
        } catch (error: any) {
            console.error('Fetch trip error:', error);
            showToast('Không thể tải thông tin chuyến đi', 'error');
            navigate('/pwa-trips');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleUpdateTrip = async () => {
        if (!user || !id) return;

        setErrors({});
        const newErrors: { [key: string]: string } = {};

        if (!tripName.trim()) {
            newErrors.tripName = 'Vui lòng nhập tên chuyến đi';
        }
        if (!destination.trim()) {
            newErrors.destination = 'Vui lòng chọn tỉnh thành';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Vui lòng kiểm tra lại thông tin', 'error');
            return;
        }

        setLoading(true);
        try {
            // Upload avatar first if a new file is selected
            if (coverImage) {
                try {
                    await api.trips.uploadAvatar(id, coverImage);
                } catch (error: any) {
                    console.error('Upload avatar error:', error);
                    showToast('Không thể tải lên ảnh đại diện', 'error');
                    setLoading(false);
                    return;
                }
            }

            const tripData: UpdateTripRequest = {
                title: tripName.trim(),
                provinceId: destination.trim(),
                description: description.trim() || undefined,
                ...(startDate && { startDate: startDate.toISOString() })
            };

            await api.put(`/trips/${id}`, tripData);
            showToast('Cập nhật chuyến đi thành công!', 'success');
            navigate(`/trip/${id}`);
        } catch (error: any) {
            console.error('Update trip error:', error);
            showToast(error.message || 'Có lỗi xảy ra khi cập nhật chuyến đi', 'error');
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
        if (!coverImage && currentAvatar) {
            // Option to remove existing avatar could be added here if backend supports it
            // For now, we just don't upload a new one.
        }
    };

    if (authLoading || initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex flex-col bg-background transition-colors duration-300"
            style={{
                minHeight: '100dvh',
                paddingTop: 'env(safe-area-inset-top)'
            }}
        >
            {/* Header */}
            <div className="sticky top-0 z-50 flex-shrink-0 bg-card border-b border-border px-4 py-4 shadow-md">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex items-center text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors text-lg font-medium active:scale-95 touch-manipulation"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        Hủy
                    </button>

                    <h2 className="text-lg font-bold text-foreground">Sửa chuyến đi</h2>

                    <button
                        onClick={handleUpdateTrip}
                        disabled={loading}
                        className="flex items-center text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors font-bold text-lg active:scale-95 touch-manipulation"
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
            <div className="flex-1 overflow-y-auto px-4 py-6">
                {/* Form Section */}
                <div className="bg-card rounded-2xl p-6 shadow-2xl border border-border space-y-5">
                    {/* Trip Name Section */}
                    <div className="space-y-2">
                        <Label htmlFor="tripName" className="text-sm font-semibold text-muted-foreground">
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
                                "w-full h-12 text-base bg-secondary border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none",
                                errors.tripName && "border-red-500 focus:border-red-500 focus-visible:ring-red-500/20"
                            )}
                        />
                        {errors.tripName && (
                            <p className="text-sm text-red-500 animate-fade-in">{errors.tripName}</p>
                        )}
                    </div>

                    {/* Destination Section */}
                    <div className="space-y-2">
                        <Label htmlFor="destination" className="text-sm font-semibold text-muted-foreground">
                            Điểm đến <span className="text-red-500">*</span>
                        </Label>
                        <ProvinceSelector
                            value={destination}
                            onChange={(value) => {
                                setDestination(value);
                                if (errors.destination) setErrors(prev => ({ ...prev, destination: '' }));
                            }}
                            placeholder="Ví dụ: Đà Lạt, Lâm Đồng"
                            error={!!errors.destination}
                            className="w-full h-12 bg-secondary text-foreground border-border placeholder:text-muted-foreground/60 focus:border-primary/50"
                        />
                        {errors.destination && (
                            <p className="text-sm text-red-500 animate-fade-in">{errors.destination}</p>
                        )}
                    </div>

                    {/* Start Date Section */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-muted-foreground">
                            Ngày đi
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal h-12 text-base bg-secondary border-border hover:bg-secondary/80 transition-all duration-200",
                                        startDate ? "text-foreground hover:text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground/60"
                                    )}
                                >
                                    <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                                    {startDate ? (
                                        format(startDate, "dd/MM/yyyy", { locale: vi })
                                    ) : (
                                        <span>Chọn ngày đi</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0 bg-card border-border shadow-xl"
                                align="start"
                                side="bottom"
                                sideOffset={4}
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
                                    className="bg-card text-foreground"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-muted-foreground">
                            Mô tả chuyến đi
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Chia sẻ về chuyến đi này - điều gì khiến bạn hứng thú?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full text-base bg-secondary text-foreground border-border placeholder:text-muted-foreground/60 focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 resize-none outline-none transition-all duration-200"
                        />
                    </div>

                    {/* Trip Avatar Section */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-muted-foreground">
                            Ảnh đại diện chuyến đi
                        </Label>

                        {imagePreview || currentAvatar ? (
                            <div className="relative group">
                                <img
                                    src={imagePreview || currentAvatar || ''}
                                    alt="Trip cover preview"
                                    className="w-full h-40 object-cover rounded-xl border border-border shadow-lg"
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button
                                        onClick={() => document.getElementById('edit-cover-image-upload')?.click()}
                                        className="p-2 bg-white/20 text-white hover:bg-white/30 rounded-full shadow-lg backdrop-blur-sm transition-all active:scale-90"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                    {imagePreview && (
                                        <button
                                            onClick={removeImage}
                                            className="p-2 bg-destructive/90 text-destructive-foreground rounded-full shadow-lg hover:bg-destructive transition-all active:scale-90"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div
                                className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-secondary hover:bg-secondary/80 hover:border-primary/50 outline-none transition-all duration-300 cursor-pointer group shadow-inner"
                                onClick={() => document.getElementById('edit-cover-image-upload')?.click()}
                            >
                                <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg text-muted-foreground group-hover:text-primary transition-colors">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-semibold text-muted-foreground">Tải lên ảnh đại diện</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG tối đa 5MB</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="edit-cover-image-upload"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PWAEditTripPage;
