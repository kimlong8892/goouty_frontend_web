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
import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { format } from 'date-fns';
import { cn } from '@/lib/utils.ts';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';

const PWAEditDayPage = () => {
    const { dayId } = useParams<{ dayId: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { isPWA } = usePWA();
    const { showToast } = useGlobalToast();
    const showContent = useAnimateIn(false, 300);

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
        }
    }, [authLoading, isAuthenticated, navigate]);

    useEffect(() => {
        const fetchDayData = async () => {
            if (!dayId) return;
            try {
                setLoading(true);
                // Directly using api.get instead of fetch from lib/api
                const data = await api.get<any>(`/days/${dayId}`);
                setFormData({
                    title: data.title,
                    description: data.description || '',
                    date: data.date ? format(new Date(data.date), 'yyyy-MM-dd') : ''
                });
            } catch (error: any) {
                console.error('Fetch day error:', error);
                showToast('Không thể tải thông tin ngày', 'error');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated && dayId) {
            fetchDayData();
        }
    }, [dayId, isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            const dayData = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                date: new Date(`${formData.date}T00:00:00`).toISOString(),
            };

            await api.days.update(dayId, dayData);

            showToast('Đã cập nhật ngày thành công', 'success');
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
        <div className="min-h-screen bg-background transition-colors duration-300">
            <AnimatedTransition show={showContent} animation="slide-up">
                {/* PWA Header */}
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-border/50">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-secondary/80 text-foreground transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
                        Chỉnh sửa ngày
                    </h1>
                </div>

                {/* Content */}
                <div className="px-5 py-6 flex flex-col min-h-[calc(100vh-80px)]">
                    <div className="flex-1 space-y-6">
                        {/* Title Input */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-[13px] text-muted-foreground font-medium pl-1 uppercase tracking-wider opacity-70">
                                Tiêu đề ngày
                            </Label>
                            <Input
                                id="title"
                                ref={titleRef}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="VD: Ngày 1 - Khám phá thành phố"
                                className={cn(
                                    "bg-card border-input shadow-sm rounded-xl h-14 px-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200",
                                    errors.title && "border-destructive focus-visible:ring-destructive/20"
                                )}
                            />
                            {errors.title && (
                                <p className="text-xs text-destructive ml-1">{errors.title}</p>
                            )}
                        </div>

                        {/* Date Input */}
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-[13px] text-muted-foreground font-medium pl-1 uppercase tracking-wider opacity-70">
                                Ngày
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant="outline"
                                        className={cn(
                                            "w-full h-14 justify-start text-left font-normal rounded-xl bg-card border-input shadow-sm hover:bg-card/80 transition-all px-4 text-base",
                                            !formData.date && "text-muted-foreground",
                                            errors.date && "border-destructive text-destructive"
                                        )}
                                    >
                                        <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                                        {formData.date ? (
                                            format(new Date(formData.date), "dd/MM/yyyy")
                                        ) : (
                                            "Chọn ngày"
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.date ? new Date(formData.date) : undefined}
                                        onSelect={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.date && (
                                <p className="text-xs text-destructive ml-1">{errors.date}</p>
                            )}
                        </div>

                        {/* Description Input */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[13px] text-muted-foreground font-medium pl-1 uppercase tracking-wider opacity-70">
                                Mô tả (tùy chọn)
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Mô tả chi tiết về ngày này..."
                                rows={4}
                                className="resize-none rounded-xl bg-card border-input shadow-sm px-4 py-3 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Sticky Bottom Button */}
                    <div className="sticky bottom-20 mt-10 z-10 w-full">
                        <Button
                            onClick={handleSubmit}
                            disabled={saving || !formData.title.trim()}
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

export default PWAEditDayPage;
