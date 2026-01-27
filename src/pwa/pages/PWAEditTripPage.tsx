import React, { useEffect, useState } from 'react';
import { DateRange } from "react-day-picker";
import { useNavigate, useParams } from 'react-router-dom';
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
    const [date, setDate] = useState<DateRange | undefined>();
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
                setDate({
                    from: new Date(trip.startDate),
                    to: trip.endDate ? new Date(trip.endDate) : undefined
                });
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
            newErrors.destination = 'Vui lòng chọn điểm đến';
        }

        if (!date?.from) {
            newErrors.date = 'Vui lòng chọn ngày bắt đầu - ngày kết thúc';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
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

            const tripData: any = {
                title: tripName.trim(),
                provinceId: destination.trim(),
                description: description.trim() || undefined,
                startDate: date?.from ? date.from.toISOString() : undefined,
                endDate: date?.to ? date.to.toISOString() : undefined
            };

            await api.trips.update(id, tripData);
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
                    Sửa chuyến đi
                </h1>
                <div className="w-10"></div>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-6 pb-10 overflow-y-auto">
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

                        {/* Date Range Picker */}
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
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground">
                                                            {format(date.from, "dd/MM/yyyy", { locale: vi })}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs">→</span>
                                                        <span className="font-semibold text-foreground">
                                                            {format(date.to || date.from, "dd/MM/yyyy", { locale: vi })}
                                                        </span>
                                                    </div>
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
                                className="rounded-xl bg-card border-input resize-none"
                            />
                        </div>

                        {/* Save Button - Moved inside scrollable area */}
                        <div className="pt-1 flex justify-center pb-20">
                            <Button
                                onClick={handleUpdateTrip}
                                disabled={loading}
                                className="w-fit min-w-[200px] h-12 px-10 rounded-full text-base font-black bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_8px_25px_-5px_rgba(99,102,241,0.5)] active:scale-[0.96] transition-all duration-300 border-none relative overflow-hidden group"
                            >
                                <div className="flex items-center justify-center gap-2 relative z-10">
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Đang lưu...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Lưu thay đổi</span>
                                        </>
                                    )}
                                </div>
                                {/* Shine Effect Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] transition-transform pointer-events-none" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default PWAEditTripPage;
