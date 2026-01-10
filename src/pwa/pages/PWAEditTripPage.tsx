import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { api } from '@/lib/api.ts';
import { useGlobalToast } from '@/utils/globalToast';
import { UpdateTripRequest } from '@/lib/types.ts';
import { ProvinceSelector } from '@/components/ProvinceSelector.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { CalendarIcon, ChevronLeft, Camera } from 'lucide-react';
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
            navigate('/');
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
        <div className="min-h-screen bg-background flex flex-col relative text-foreground">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border/50">
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="p-2 -ml-2 text-foreground/80 hover:text-foreground active:scale-95 transition-transform rounded-full hover:bg-muted"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
                    Sửa chuyến đi
                </h1>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-6 pb-32 overflow-y-auto">
                <div className="w-full max-w-md mx-auto space-y-8">
                    {/* Cover Image Upload (Circular Style) */}
                    <div className="flex justify-center">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('edit-cover-image-upload')?.click()}>
                            <div className={cn(
                                "w-32 h-32 rounded-full overflow-hidden border-2 border-border shadow-md bg-secondary flex items-center justify-center transition-all duration-300 group-hover:border-primary/50",
                                (imagePreview || currentAvatar) ? "border-primary" : ""
                            )}>
                                {imagePreview || currentAvatar ? (
                                    <img
                                        src={imagePreview || currentAvatar || ''}
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
                                id="edit-cover-image-upload"
                            />
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        {/* Trip Name */}
                        <div className="space-y-2">
                            <Label htmlFor="tripName" className="text-muted-foreground text-sm font-medium ml-1">
                                Tên chuyến đi
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
                                    "h-12 rounded-xl bg-card border-input focus:ring-primary/20",
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
                                Điểm đến
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

                        {/* Start Date */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm font-medium ml-1">
                                Ngày đi
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal h-12 rounded-xl bg-card border-input hover:bg-card/80",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        initialFocus
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                </PopoverContent>
                            </Popover>
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
                                className="rounded-xl bg-card border-input resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50 pb-safe z-50">
                <Button
                    onClick={handleUpdateTrip}
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : null}
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
            </div>
        </div>
    );
};

export default PWAEditTripPage;
