import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGlobalToast } from '../utils/globalToast';
import { api } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
    const { showToast } = useGlobalToast();
    const show = useAnimateIn(false, 250);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            showToast('Token không hợp lệ', 'error');
            navigate('/auth');
        }
    }, [token, navigate, showToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || password.length < 6) {
            showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', { token, newPassword: password });
            showToast('Đặt lại mật khẩu thành công. Vui lòng đăng nhập.', 'success');
            setTimeout(() => navigate('/auth'), 2000);
        } catch (error) {
            showToast('Token hết hạn hoặc không hợp lệ', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 flex items-start md:items-center justify-center">
            <AnimatedTransition show={show} animation="slide-up" className="w-full">
                <Card className="max-w-md mx-auto w-full p-8 md:p-12 rounded-[32px] overflow-hidden shadow-2xl border-none bg-white">
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-black text-primary mb-2 uppercase">Đặt lại mật khẩu</h1>
                        <p className="text-slate-500 font-medium">Nhập mật khẩu mới của bạn</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-600 font-medium">Mật khẩu mới</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:border-primary focus:bg-white outline-none transition-colors duration-200 px-4 pr-12"
                                    placeholder="Nhập mật khẩu mới"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </Button>

                        <div className="text-center">
                            <Button type="button" variant="link" onClick={() => navigate('/auth')} className="text-primary">Quay lại đăng nhập</Button>
                        </div>
                    </form>
                </Card>
            </AnimatedTransition>
        </div>
    );
};

export default ResetPasswordPage;
