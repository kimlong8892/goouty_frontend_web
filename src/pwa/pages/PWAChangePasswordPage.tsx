import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA.ts';
import { api } from '@/integrations/api/client.ts';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
    ChevronLeft,
    Eye,
    EyeOff,
    Lock
} from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';

const PWAChangePasswordPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { showToast } = useGlobalToast();
    const showContent = useAnimateIn(false, 300);

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [changingPassword, setChangingPassword] = useState(false);

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        document.title = 'Đổi mật khẩu - Goouty';
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [authLoading, isAuthenticated, navigate]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.get('/users/profile');
                setProfile(data);
            } catch (error) {
                console.error('Fetch profile error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchProfile();
        }
    }, [isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            showToast('Mật khẩu mới và xác nhận mật khẩu không khớp', 'error');
            return;
        }

        if (formData.newPassword.length < 6) {
            showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
            return;
        }

        try {
            setChangingPassword(true);
            await api.users.changePassword(formData);
            showToast('Đổi mật khẩu thành công', 'success');
            navigate(-1);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Không thể đổi mật khẩu', 'error');
        } finally {
            setChangingPassword(false);
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
                        Đổi mật khẩu
                    </h1>
                </div>

                {/* Content */}
                <div className="flex-1 px-5 pt-6 pb-10 overflow-y-auto">
                    <div className="w-full max-w-md mx-auto space-y-8">

                        {!profile?.hasPassword && (
                            <div className="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">i</div>
                                <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
                                    Tài khoản của bạn đăng nhập qua Google. Bạn có thể đặt mật khẩu mới để đăng nhập bằng email.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {profile?.hasPassword && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-sm font-medium ml-1">Mật khẩu hiện tại</Label>
                                    <div className="relative">
                                        <Input
                                            type={showCurrentPassword ? "text" : "password"}
                                            required
                                            value={formData.currentPassword}
                                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                            className="h-14 rounded-2xl bg-card border-input focus:ring-primary/20 transition-all text-base pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        >
                                            {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm font-medium ml-1">Mật khẩu mới</Label>
                                <div className="relative">
                                    <Input
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        minLength={6}
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        className="h-14 rounded-2xl bg-card border-input focus:ring-primary/20 transition-all text-base pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    >
                                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm font-medium ml-1">Xác nhận mật khẩu mới</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="h-14 rounded-2xl bg-card border-input focus:ring-primary/20 transition-all text-base pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Bottom Button - Positioned above PWA Navbar */}
                <div className="p-4 bg-background border-t border-border/50 pb-24 z-40">
                    <Button
                        onClick={handleSubmit}
                        disabled={changingPassword || !formData.newPassword || !formData.confirmPassword}
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-white font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
                    >
                        {changingPassword ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        ) : null}
                        {changingPassword ? 'Đang cập nhật...' : 'Cập nhật'}
                    </Button>
                </div>
            </AnimatedTransition>
        </div>
    );
};

export default PWAChangePasswordPage;
