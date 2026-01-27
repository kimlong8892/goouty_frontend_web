import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { api } from '@/integrations/api/client.ts';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils.ts';

const PWAEditDayPage = () => {
    const { dayId } = useParams<{ dayId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { showToast } = useGlobalToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: ''
    });
    const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        document.title = 'Chỉnh sửa ngày - Goouty';
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
            return;
        }

        const fetchDayDetails = async () => {
            if (!dayId) return;
            try {
                setLoading(true);
                // We need to get the day details. Since there isn't a direct getDayById in the api client 
                // we might need to find it from the trip or use a generic get if available.
                // Looking at api client, it has days.getByTrip but not getById.
                // However, the backend usually supports /days/:id.
                // Let's check if the api.get can be used.
                const dayData = await api.get<any>(`/days/${dayId}`);
                if (dayData) {
                    setFormData({
                        title: dayData.title || '',
                        description: dayData.description || '',
                        date: dayData.date ? format(new Date(dayData.date), 'yyyy-MM-dd') : ''
                    });
                }
            } catch (error) {
                console.error('Error fetching day details:', error);
                showToast('Không thể tải thông tin ngày', 'error');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        fetchDayDetails();
    }, [authLoading, isAuthenticated, navigate, dayId]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!dayId) return;

        const newErrors: { title?: string; date?: string } = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Vui lòng nhập tiêu đề ngày';
        }
        if (!formData.date) {
            newErrors.date = 'Vui lòng chọn ngày';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setSaving(true);
        try {
            await api.days.update(dayId, {
                title: formData.title.trim(),
                description: formData.description.trim() || undefined,
                date: formData.date
            });

            showToast('Cập nhật ngày thành công', 'success');
            navigate(-1);
        } catch (error: any) {
            console.error('Update day error:', error);
            showToast(error.message || 'Không thể cập nhật ngày', 'error');
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
        <div className="h-full bg-background flex flex-col relative text-foreground overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border/50">
                <button
                    onClick={() => navigate(-1)}
                    disabled={saving}
                    className="p-2 -ml-2 text-foreground/80 hover:text-foreground active:scale-95 transition-transform rounded-full hover:bg-muted"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    Chỉnh sửa ngày
                </h1>
                <div className="w-10"></div>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-6 pb-10 overflow-y-auto">
                <div className="w-full max-w-md mx-auto space-y-6">
                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-[13px] text-muted-foreground font-medium pl-1 tracking-wider opacity-70">
                            Tiêu đề ngày <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            ref={titleRef}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="VD: Khám phá thành phố"
                            className={cn(
                                "h-14 rounded-xl bg-card border-input focus:ring-primary/20 transition-all px-4 text-base",
                                errors.title && "border-destructive focus-visible:ring-destructive/20"
                            )}
                        />
                        {errors.title && (
                            <p className="text-xs text-destructive ml-1">{errors.title}</p>
                        )}
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-[13px] text-muted-foreground font-medium pl-1 tracking-wider opacity-70">
                            Mô tả (tùy chọn)
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Mô tả chi tiết về ngày này..."
                            rows={4}
                            className="resize-none rounded-xl bg-card border-input px-4 py-3 text-base focus:ring-primary/20 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Button */}
            <div className="p-4 bg-background border-t border-border/50 pb-24 z-40">
                <Button
                    onClick={() => handleSubmit()}
                    disabled={saving}
                    className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                >
                    {saving ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    ) : null}
                    {saving ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
            </div>
        </div>
    );
};

export default PWAEditDayPage;
