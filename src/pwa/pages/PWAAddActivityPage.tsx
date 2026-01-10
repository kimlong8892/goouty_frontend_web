import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { api } from '@/lib/api.ts';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { CreateActivityRequest, Activity } from '@/lib/types.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

const PWAAddActivityPage = () => {
    const { dayId } = useParams<{ dayId: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { isPWA } = usePWA();
    const { showToast } = useGlobalToast();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        startTime: '',
        durationMin: 60,
        location: '',
        notes: '',
        important: false
    });

    useEffect(() => {
        document.title = 'Thêm hoạt động - Goouty';
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [authLoading, isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dayId) return;

        // Validation
        if (!formData.title.trim()) {
            showToast('Vui lòng nhập tên hoạt động', 'error');
            return;
        }

        if (formData.durationMin < 1 || formData.durationMin > 1440) {
            showToast('Thời lượng phải từ 1 đến 1440 phút', 'error');
            return;
        }

        setLoading(true);
        try {
            const activityData: CreateActivityRequest = {
                title: formData.title.trim(),
                startTime: formData.startTime ? `2025-09-15T${formData.startTime}:00.000Z` : undefined,
                durationMin: formData.durationMin,
                location: formData.location.trim() || undefined,
                notes: formData.notes.trim() || undefined,
                important: formData.important,
                dayId: dayId
            };

            await api.post<Activity>('/activities', activityData);

            showToast('Đã thêm hoạt động thành công', 'success');
            navigate(-1);
        } catch (error: any) {
            console.error('Add activity error:', error);
            showToast(error.message || 'Không thể thêm hoạt động', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col relative text-foreground">
            {/* PWA Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border/50">
                <button
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    className="p-2 -ml-2 text-foreground/80 hover:text-foreground active:scale-95 transition-transform rounded-full hover:bg-muted"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
                    Thêm hoạt động
                </h1>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-6 pb-32 overflow-y-auto">
                <div className="space-y-6">

                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-muted-foreground font-medium text-sm ml-1">
                            Tên hoạt động <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="VD: Tham quan bảo tàng"
                            className="h-12 rounded-xl bg-card border-input focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Start Time and Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime" className="text-muted-foreground font-medium text-sm ml-1">
                                Giờ bắt đầu
                            </Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="h-12 rounded-xl bg-card border-input focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="durationMin" className="text-muted-foreground font-medium text-sm ml-1">
                                Thời lượng (phút)
                            </Label>
                            <Input
                                id="durationMin"
                                type="number"
                                min="1"
                                max="1440"
                                value={formData.durationMin}
                                onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 0 })}
                                className="h-12 rounded-xl bg-card border-input focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Location Input */}
                    <div className="space-y-2">
                        <Label htmlFor="location" className="text-muted-foreground font-medium text-sm ml-1">
                            Địa điểm
                        </Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="VD: Thành phố Hồ Chí Minh"
                            className="h-12 rounded-xl bg-card border-input focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Notes Input */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-muted-foreground font-medium text-sm ml-1">
                            Ghi chú
                        </Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Ghi chú thêm về hoạt động..."
                            rows={3}
                            className="resize-none rounded-xl bg-card border-input"
                        />
                    </div>

                    {/* Important Checkbox */}
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="important"
                            checked={formData.important}
                            onCheckedChange={(checked) => setFormData({ ...formData, important: !!checked })}
                            className="rounded-md"
                        />
                        <Label htmlFor="important" className="text-sm font-medium cursor-pointer">
                            Đánh dấu là hoạt động quan trọng
                        </Label>
                    </div>

                </div>
            </div>

            {/* Sticky Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50 pb-safe z-50">
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    ) : null}
                    {loading ? 'Đang thêm...' : 'Thêm hoạt động'}
                </Button>
            </div>
        </div>
    );
};

export default PWAAddActivityPage;
