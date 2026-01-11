import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { useNavigate } from 'react-router-dom';
import { useGlobalToast } from '../utils/globalToast';
import { api } from '@/lib/api';
import { Mail, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ForgotPasswordPage = () => {
    const { showToast } = useGlobalToast();
    const show = useAnimateIn(false, 250);
    const navigate = useNavigate();

    const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(50);
    const [showSuccess, setShowSuccess] = useState(false);

    const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'otp' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const handleSendEmail = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email) {
            showToast('Vui lòng nhập email của bạn', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/request-otp', { email });
            showToast('Mã OTP đã được gửi đến email của bạn.', 'success');
            setStep('otp');
            setTimer(50);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu.';
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) {
            otpRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs[index - 1].current?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const fullOtp = otp.join('');
        if (fullOtp.length < 4) {
            showToast('Vui lòng nhập đầy đủ mã OTP', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/verify-otp', {
                email,
                otp: fullOtp
            });
            showToast('Xác thực thành công!', 'success');
            setStep('reset');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (password.length < 6) {
            showToast('Mật khẩu mới yêu cầu tối thiểu 6 ký tự', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showToast('Mật khẩu nhập lại không khớp', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/change-password-otp', {
                email,
                otp: otp.join(''),
                newPassword: password
            });
            setShowSuccess(true);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu.';
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;
        setTimer(50);
        await api.post('/auth/request-otp', { email });
        showToast('Mã OTP đã được gửi lại.', 'success');
    };

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}s`;
    };

    const renderStepContent = () => {
        switch (step) {
            case 'email':
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black text-slate-900 mb-3">Quên mật khẩu?</h1>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Nhập email của bạn để chúng tôi gửi hướng dẫn đặt lại mật khẩu
                            </p>
                        </div>

                        <div className="flex justify-center mb-8">
                            <img src="/forgot_password_pwa.png" alt="Forgot Password" className="w-56 h-56 object-contain" />
                        </div>

                        <div className="space-y-4">
                            <div className="relative group">
                                <Label className="text-sm font-bold text-slate-700 mb-1.5 block ml-1">Địa chỉ Email</Label>
                                <div className="flex items-center bg-slate-50 border-2 border-transparent focus-within:border-[#6347f9] focus-within:bg-white rounded-2xl p-3.5 transition-all">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mr-3">
                                        <Mail size={18} className="text-[#6347f9]" />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        className="w-full bg-transparent border-none outline-none text-slate-900 font-semibold placeholder:text-slate-300"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleSendEmail}
                            disabled={isLoading || !email}
                            className="w-full h-14 rounded-2xl bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-lg shadow-lg shadow-purple-100 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? 'Đang gửi...' : 'Tiếp tục'}
                        </Button>

                        <div className="text-center">
                            <button onClick={() => navigate('/auth')} className="text-sm font-bold text-[#6347f9] hover:text-[#5136db] transition-colors">
                                Quay lại đăng nhập
                            </button>
                        </div>
                    </div>
                );
            case 'otp':
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black text-slate-900 mb-3">Nhập mã OTP</h1>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Mã xác thực đã được gửi đến <span className="text-slate-900 font-bold">{email}</span>
                            </p>
                        </div>

                        <div className="flex justify-center mb-8">
                            <img src="/otp_verification_pwa.png" alt="OTP Verification" className="w-56 h-56 object-contain" />
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between gap-4">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={otpRefs[index]}
                                        type="number"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-full h-16 bg-slate-50 border-2 border-transparent focus:border-[#6347f9] focus:bg-white rounded-2xl text-center text-2xl font-black text-slate-900 outline-none transition-all shadow-sm"
                                    />
                                ))}
                            </div>

                            <div className="text-center">
                                <button
                                    onClick={handleResendOtp}
                                    disabled={timer > 0}
                                    className={cn(
                                        "text-sm font-bold transition-all p-2 rounded-lg",
                                        timer > 0 ? "text-slate-300 cursor-not-allowed" : "text-[#6347f9] hover:bg-purple-50 active:bg-purple-100"
                                    )}
                                >
                                    Gửi lại mã {timer > 0 && <span className="ml-1 text-[#6347f9] font-mono">{formatTimer(timer)}</span>}
                                </button>
                            </div>
                        </div>

                        <Button
                            onClick={handleVerifyOtp}
                            disabled={isLoading || otp.join('').length < 4}
                            className="w-full h-14 rounded-2xl bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-lg shadow-lg shadow-purple-100 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? 'Đang xác thực...' : 'Xác thực'}
                        </Button>

                        <div className="text-center">
                            <button onClick={() => setStep('email')} className="flex items-center justify-center mx-auto text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                                <ArrowLeft size={16} className="mr-1.5" /> Thay đổi email
                            </button>
                        </div>
                    </div>
                );
            case 'reset':
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black text-slate-900 mb-3">Mật khẩu mới</h1>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn
                            </p>
                        </div>

                        <div className="flex justify-center mb-8">
                            <img src="/reset_password_pwa.png" alt="Reset Password" className="w-56 h-56 object-contain" />
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700 ml-1">Mật khẩu mới</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus-visible:ring-[#6347f9] px-5 font-semibold text-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6347f9] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700 ml-1">Xác nhận mật khẩu</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus-visible:ring-[#6347f9] px-5 font-semibold text-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6347f9] transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleResetPassword}
                            disabled={isLoading || !password || !confirmPassword || password.length < 6}
                            className="w-full h-14 rounded-2xl bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-lg shadow-lg shadow-purple-100 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen pt-12 pb-12 px-4 flex items-center justify-center bg-slate-50/50">
            <AnimatedTransition show={show} animation="slide-up" className="w-full max-w-[480px]">
                <Card className="p-8 md:p-10 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(99,71,249,0.15)] border-none bg-white relative overflow-hidden">
                    {/* Progress indicator */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50 flex">
                        <div
                            className="h-full bg-[#6347f9] transition-all duration-500 rounded-r-full"
                            style={{ width: step === 'email' ? '33.33%' : step === 'otp' ? '66.66%' : '100%' }}
                        />
                    </div>

                    {renderStepContent()}
                </Card>
            </AnimatedTransition>

            {/* Success Overly/Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" />

                    <Card className="relative w-full max-w-[440px] bg-white rounded-[40px] p-10 text-center animate-in zoom-in-95 duration-500 shadow-2xl">
                        <div className="flex justify-center mb-8">
                            <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-[#6347f9] opacity-10 rounded-full animate-ping" />
                                <div className="w-16 h-16 rounded-full bg-[#6347f9] flex items-center justify-center shadow-lg shadow-purple-200 relative z-10">
                                    <CheckCircle2 size={36} className="text-white" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 mb-4">Hoàn tất!</h2>
                        <p className="text-slate-500 text-lg mb-10 leading-relaxed">
                            Mật khẩu của bạn đã được cập nhật thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
                        </p>

                        <Button
                            onClick={() => navigate('/auth')}
                            className="w-full h-14 rounded-2xl bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-lg shadow-lg shadow-purple-100 transition-all active:scale-95"
                        >
                            Đăng nhập ngay
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ForgotPasswordPage;
