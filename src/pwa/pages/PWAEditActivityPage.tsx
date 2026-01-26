import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { api } from '@/integrations/api/client.ts';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { DATABASE_TYPES } from '@/integrations/api/types.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ChevronLeft, Clock, MapPin, AlignLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';

import { ActivityAvatarUpload } from '@/components/ActivityAvatarUpload.tsx';

const PWAEditActivityPage = () => {
    const { activityId } = useParams<{ activityId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { showToast } = useGlobalToast();
    const showContent = useAnimateIn(false, 300);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentImage, setCurrentImage] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        startTime: '',
        durationMin: 60,
        location: '',
        notes: '',
        important: false
    });
    const [errors, setErrors] = useState<{ title?: string; startTime?: string }>({});
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        document.title = 'Chỉnh sửa hoạt động - Goouty';
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [authLoading, isAuthenticated, navigate]);

    useEffect(() => {
        const fetchActivityData = async () => {
            if (!activityId) return;
            try {
                setLoading(true);
                // Directly using api.get instead of fetch from lib/api
                const data = await api.get<any>(`/activities/${activityId}`);

                // Handle different field names between UI and API
                let timeString = '';
                const startTimeValue = data.startTime || data.time_start || data.timeStart;
                if (startTimeValue) {
                    if (startTimeValue.includes('T')) {
                        timeString = startTimeValue.split('T')[1].substring(0, 5);
                    } else {
                        timeString = startTimeValue.substring(0, 5);
                    }
                }

                setFormData({
                    title: data.title || '',
                    startTime: timeString,
                    durationMin: data.durationMin || data.duration_min || 60,
                    location: data.location || '',
                    notes: data.notes || '',
                    important: data.important || data.pinned || false
                });

                if (data.avatar) {
                    setCurrentImage(data.avatar);
                }
            } catch (error: any) {
                console.error('Fetch activity error:', error);
                showToast('Không thể tải thông tin hoạt động', 'error');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated && activityId) {
            fetchActivityData();
        }
    }, [activityId, isAuthenticated, navigate]);

    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityId) return;

        if (!formData.title.trim()) {
            setErrors({ title: 'Vui lòng nhập tên hoạt động' });
            return;
        }

        if (!formData.startTime) {
            setErrors({ startTime: 'Vui lòng chọn giờ bắt đầu' });
            return;
        }

        setSaving(true);
        try {
            // Re-use logic from EditActivityDialog
            const updateData: any = {
                title: formData.title.trim(),
                startTime: formData.startTime ? `2025-09-15T${formData.startTime}:00.000Z` : undefined,
                durationMin: formData.durationMin,
                location: formData.location.trim() || undefined,
                notes: formData.notes.trim() || undefined,
                important: formData.important
            };

            // Remove undefined values to be clean
            Object.keys(updateData).forEach(key =>
                updateData[key] === undefined && delete updateData[key]
            );

            let payload: any = updateData;

            if (newAvatarFile) {
                const formDataObj = new FormData();
                Object.entries(updateData).forEach(([key, value]) => {
                    formDataObj.append(key, String(value));
                });
                formDataObj.append('avatar', newAvatarFile);
                payload = formDataObj;
            }

            await api.activities.update(activityId, payload);

            showToast('Đã cập nhật hoạt động thành công', 'success');
            navigate(-1);
        } catch (error: any) {
            console.error('Update activity error:', error);
            showToast(error.message || 'Không thể cập nhật hoạt động', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-full bg-background transition-colors duration-300 flex flex-col overflow-hidden">
            <AnimatedTransition show={showContent} animation="slide-up">
                {/* Header part of flex flow */}
                <div className="bg-background/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-border/50">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-secondary/80 text-foreground transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
                        Chỉnh sửa hoạt động
                    </h1>
                </div>

                {/* Content */}
                <div className="px-5 pt-6 pb-10 flex-1 overflow-y-auto">
                    <div className="flex-1 space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex justify-center mb-2">
                            <ActivityAvatarUpload
                                currentImage={currentImage}
                                onImageSelected={(file) => {
                                    setNewAvatarFile(file);
                                    // Preview is handled by the component
                                }}
                                size="lg"
                            />
                        </div>

                        {/* Title Input */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-[13px] text-muted-foreground font-medium pl-1 tracking-wider opacity-70">
                                Tên hoạt động <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                ref={titleRef}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="VD: Tham quan bảo tàng"
                                className={cn(
                                    "bg-card border-input shadow-sm rounded-xl h-14 px-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200",
                                    errors.title && "border-destructive focus-visible:ring-destructive/20"
                                )}
                            />
                            {errors.title && (
                                <p className="text-xs text-destructive ml-1">{errors.title}</p>
                            )}
                        </div>

                        {/* Start Time and Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime" className="text-[13px] text-muted-foreground font-medium pl-1 tracking-wider opacity-70">
                                    Giờ bắt đầu <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => {
                                            setFormData({ ...formData, startTime: e.target.value });
                                            if (errors.startTime) setErrors({ ...errors, startTime: undefined });
                                        }}
                                        className={cn(
                                            "bg-card border-input shadow-sm rounded-xl h-14 pl-12 pr-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200",
                                            errors.startTime && "border-destructive focus-visible:ring-destructive/20"
                                        )}
                                    />
                                </div>
                                {errors.startTime && (
                                    <p className="text-xs text-destructive ml-1">{errors.startTime}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="durationMin" className="text-[13px] text-muted-foreground font-medium pl-1 tracking-wider opacity-70">
                                    Phút
                                </Label>
                                <Input
                                    id="durationMin"
                                    type="number"
                                    value={formData.durationMin}
                                    onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 0 })}
                                    className="bg-card border-input shadow-sm rounded-xl h-14 px-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Location Input */}
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-[13px] text-muted-foreground font-medium pl-1 tracking-wider opacity-70">
                                Địa điểm
                            </Label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF4D4C]" />
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="VD: Thành phố Hồ Chí Minh"
                                    className="bg-card border-input shadow-sm rounded-xl h-14 pl-12 pr-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Notes Input */}
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-[13px] text-muted-foreground font-medium pl-1 tracking-wider opacity-70">
                                Ghi chú
                            </Label>
                            <div className="relative">
                                <AlignLeft className="absolute left-4 top-3 w-5 h-5 text-muted-foreground/60" />
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Ghi chú thêm về hoạt động..."
                                    rows={3}
                                    className="bg-card border-input shadow-sm rounded-xl pl-12 pr-4 py-3 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 resize-none"
                                />
                            </div>
                        </div>

                        {/* Important Checkbox */}
                        <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <Checkbox
                                id="important"
                                checked={formData.important}
                                onCheckedChange={(checked) => setFormData({ ...formData, important: !!checked })}
                                className="w-5 h-5 rounded-md border-primary/20 data-[state=checked]:bg-[#6347f9] data-[state=checked]:border-[#6347f9]"
                            />
                            <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => setFormData({ ...formData, important: !formData.important })}>
                                <Star className={cn("w-4 h-4 transition-colors", formData.important ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                                <Label htmlFor="important" className="text-sm font-semibold text-foreground cursor-pointer">Hoạt động quan trọng</Label>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Button */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50 pb-24 z-40">
                        <Button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="w-full h-14 rounded-xl bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                            ) : null}
                            {saving ? 'Đang cập nhật...' : 'Cập nhật'}
                        </Button>
                    </div>
                </div>
            </AnimatedTransition>
        </div>
    );
};

export default PWAEditActivityPage;
