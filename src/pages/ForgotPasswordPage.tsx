import React, { useState } from 'react';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { useNavigate } from 'react-router-dom';
import { useGlobalToast } from '../utils/globalToast';
import { api } from '@/lib/api';

const ForgotPasswordPage = () => {
    const { showToast } = useGlobalToast();
    const show = useAnimateIn(false, 250);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            showToast('Vui lòng nhập email', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            showToast('Link đặt lại mật khẩu đã được gửi đến email của bạn.', 'success');
            setTimeout(() => navigate('/auth'), 3000);
        } catch (error: any) {
            if (error.response?.status === 404) {
                showToast('Email không tồn tại trong hệ thống', 'error');
            } else {
                showToast(error.response?.data?.message || 'Có lỗi xảy ra', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 flex items-start md:items-center justify-center bg-gradient-to-b from-purple-50 via-blue-50/30 to-purple-50/50">
            <AnimatedTransition show={show} animation="slide-up" className="w-full">
                <Card className="max-w-md mx-auto w-full p-8 md:p-12 rounded-[32px] overflow-hidden shadow-2xl border-none bg-white">
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-black text-[#6c5dd3] mb-2 uppercase">Quên mật khẩu</h1>
                        <p className="text-slate-500 font-medium">Nhập email để nhận link đặt lại mật khẩu</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-600 font-medium">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                className="h-12 rounded-xl bg-slate-50 border-transparent focus:border-[#6c5dd3] focus:bg-white transition-all px-4"
                                placeholder="Nhập email của bạn"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-[#6c5dd3] hover:bg-[#5b4ec2] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            {isLoading ? 'Đang gửi...' : 'Gửi link'}
                        </Button>

                        <div className="text-center">
                            <Button type="button" variant="link" onClick={() => navigate('/auth')} className="text-[#6c5dd3]">Quay lại đăng nhập</Button>
                        </div>
                    </form>
                </Card>
            </AnimatedTransition>
        </div>
    );
};

export default ForgotPasswordPage;
