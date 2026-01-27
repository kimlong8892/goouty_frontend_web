import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { api } from '@/integrations/api/client.ts';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
    ChevronLeft,
    UserPlus,
    Mail
} from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { useQueryClient, useMutation } from '@tanstack/react-query';

const PWAInviteMemberPage = () => {
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { showToast } = useGlobalToast();
    const showContent = useAnimateIn(false, 300);
    const queryClient = useQueryClient();

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        document.title = 'Mời thành viên mới - Goouty';
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [authLoading, isAuthenticated, navigate]);

    const addMemberMutation = useMutation({
        mutationFn: (memberEmail: string) =>
            api.members.addToTrip(tripId!, memberEmail),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
            showToast('Đã gửi lời mời thành công!', 'success');
            navigate(-1);
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi lời mời';
            showToast(errorMessage, 'error');
            setLoading(false);
        },
    });

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!email.trim()) {
            setError('Vui lòng nhập email thành viên');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Email không hợp lệ');
            return;
        }

        setError('');
        setLoading(true);
        addMemberMutation.mutate(email);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background flex flex-col z-10 text-foreground overflow-hidden">
            <AnimatedTransition show={showContent} animation="slide-up">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border/50">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-foreground/80 hover:text-foreground active:scale-95 transition-transform rounded-full hover:bg-muted"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
                        Mời thành viên
                    </h1>
                </div>

                {/* Content */}
                <div className="flex-1 px-5 pt-10 pb-10 overflow-y-auto">
                    <div className="w-full max-w-md mx-auto space-y-10">

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-muted-foreground text-sm font-medium ml-1">
                                    Email người nhận <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError('');
                                        }}
                                        className={cn(
                                            "h-14 pl-12 rounded-2xl bg-card border-input focus:ring-primary/20 transition-all text-base",
                                            error && "border-destructive focus-visible:ring-destructive/20"
                                        )}
                                    />
                                </div>
                                {error && (
                                    <p className="text-xs text-destructive ml-1">{error}</p>
                                )}
                                <p className="text-xs text-muted-foreground px-1 pt-1 opacity-70 leading-relaxed">
                                    Họ sẽ nhận được thông báo và cần chấp nhận lời mời trước khi tham gia kế hoạch này cùng bạn.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button - Moved inside scrollable area */}
                        <div className="pt-4 flex justify-center pb-20">
                            <Button
                                onClick={() => handleSubmit()}
                                disabled={loading}
                                className="w-fit min-w-[200px] h-12 px-10 rounded-full text-base font-black bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_8px_25px_-5px_rgba(99,102,241,0.5)] active:scale-[0.96] transition-all duration-300 border-none relative overflow-hidden group"
                            >
                                <div className="flex items-center justify-center gap-2 relative z-10">
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Đang gửi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Gửi lời mời</span>
                                        </>
                                    )}
                                </div>
                                {/* Shine Effect Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] transition-transform pointer-events-none" />
                            </Button>
                        </div>
                    </div>
                </div>


            </AnimatedTransition>
        </div>
    );
};

export default PWAInviteMemberPage;
