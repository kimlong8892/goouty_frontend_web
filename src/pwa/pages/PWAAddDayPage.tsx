import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { api } from '@/lib/api.ts';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { CreateDayRequest, Day } from '@/lib/types.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { format } from 'date-fns';
import { cn } from '@/lib/utils.ts';

const PWAAddDayPage = () => {
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { isPWA } = usePWA();
    const { showToast } = useGlobalToast();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: ''
    });
    const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        document.title = 'Thêm ngày mới - Goouty';
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [authLoading, isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tripId) return;

        const newErrors: { title?: string; date?: string } = {};
        let focused = false;

        if (!formData.title.trim()) {
            newErrors.title = 'Vui lòng nhập tiêu đề ngày';
            if (!focused) { titleRef.current?.focus(); focused = true; }
        }

        if (!formData.date) {
            newErrors.date = 'Vui lòng chọn ngày';
        } else {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                newErrors.date = 'Không thể chọn ngày trong quá khứ';
            }
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setLoading(true);
        try {
            const dayData: CreateDayRequest = {
                title: formData.title.trim(),
                description: formData.description.trim() || undefined,
                date: new Date(`${formData.date}T00:00:00`).toISOString(),
                tripId: tripId
            };

            await api.post<Day>('/days', dayData);

            showToast('Đã thêm ngày thành công', 'success');
            navigate(-1);
        } catch (error: any) {
            console.error('Add day error:', error);
            showToast(error.message || 'Không thể thêm ngày', 'error');
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
                    Thêm ngày mới
                </h1>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-6 pb-32 overflow-y-auto">
                <div className="space-y-6">

                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-muted-foreground font-medium text-sm ml-1">
                            Tiêu đề ngày <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            ref={titleRef}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="VD: Ngày 1 - Khám phá thành phố"
                            className={cn(
                                "h-12 rounded-xl bg-card border-input focus:ring-primary/20 transition-all",
                                errors.title && "border-destructive focus-visible:ring-destructive/20"
                            )}
                        />
                        {errors.title && (
                            <p className="text-xs text-destructive ml-1">{errors.title}</p>
                        )}
                    </div>

                    {/* Date Input */}
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-muted-foreground font-medium text-sm ml-1">
                            Ngày <span className="text-red-500">*</span>
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant="outline"
                                    className={cn(
                                        "w-full h-12 justify-start text-left font-normal rounded-xl bg-card border-input hover:bg-card/80 transition-all",
                                        !formData.date && "text-muted-foreground",
                                        errors.date && "border-destructive text-destructive"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
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
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.date && (
                            <p className="text-xs text-destructive ml-1">{errors.date}</p>
                        )}
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-muted-foreground font-medium text-sm ml-1">
                            Mô tả (tùy chọn)
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Mô tả chi tiết về ngày này..."
                            rows={3}
                            className="resize-none rounded-xl bg-card border-input"
                        />
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
                    {loading ? 'Đang thêm...' : 'Thêm ngày'}
                </Button>
            </div>
        </div>
    );
};

export default PWAAddDayPage;
