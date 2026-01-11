import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useGlobalToast } from '@/utils/globalToast';

const PWAForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { showToast } = useGlobalToast();
    const show = useAnimateIn(false, 250);
    const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(50);
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

    const handleSendEmail = async () => {
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
            const message = error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;
        setTimer(50);
        await handleSendEmail();
    };

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}s`;
    };

    const renderEmailStep = () => (
        <>
            {/* Title Section */}
            <div className="mb-6">
                <h1 className="text-[32px] font-bold text-slate-900 leading-tight mb-3">Quên mật khẩu</h1>
                <p className="text-[#94A3B8] text-base font-normal leading-relaxed">
                    Nhập email của bạn để chúng tôi gửi hướng dẫn đặt lại mật khẩu
                </p>
            </div>

            {/* Illustration Area */}
            <div className="flex justify-center mb-8">
                <div className="relative w-full aspect-square max-w-[280px]">
                    <img
                        src="/forgot_password_pwa.png"
                        alt="Minh họa Quên mật khẩu"
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Input Card */}
            <div className="space-y-4 mb-10">
                <div
                    className={cn(
                        "flex items-center gap-3 p-3.5 rounded-[24px] border-2 transition-all duration-300",
                        "border-[#6347f9] bg-white shadow-[0_10px_25px_-5px_rgba(99,71,249,0.1)]"
                    )}
                >
                    <div className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center border transition-colors duration-300 bg-[#6347f9] border-transparent shrink-0"
                    )}>
                        <Mail
                            size={18}
                            className="text-white"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#94A3B8] font-medium mb-0.5">Gửi OTP qua Email</p>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-transparent border-none p-0 text-slate-900 font-semibold text-sm focus:ring-0 placeholder:text-slate-200 outline-none shadow-none"
                        />
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-auto">
                <Button
                    onClick={handleSendEmail}
                    disabled={isLoading || !email}
                    className="w-full h-[60px] rounded-[20px] bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-lg shadow-[0_10px_20px_-5px_rgba(99,71,249,0.3)] transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none"
                >
                    {isLoading ? 'Đang gửi...' : 'Tiếp tục'}
                </Button>
            </div>
        </>
    );

    const renderOtpStep = () => (
        <>
            {/* Title Section */}
            <div className="mb-6">
                <h1 className="text-[32px] font-bold text-slate-900 leading-tight mb-2">Nhập mã OTP</h1>
                <p className="text-[#94A3B8] text-sm leading-relaxed">
                    Mã xác thực đã được gửi đến {email}
                </p>
            </div>

            {/* OTP Input Section */}
            <div className="mb-6">
                <div className="flex justify-between gap-3 mb-4">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={otpRefs[index]}
                            type="number"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-full h-[70px] bg-white border-2 border-[#F1F5F9] rounded-[16px] text-center text-3xl font-bold text-slate-900 focus:border-[#6347f9] focus:outline-none transition-all"
                        />
                    ))}
                </div>
                <div className="text-right">
                    <button
                        onClick={handleResendOtp}
                        disabled={timer > 0}
                        className={cn(
                            "text-sm font-medium transition-colors",
                            timer > 0 ? "text-slate-300 pointer-events-none" : "text-[#6347f9]"
                        )}
                    >
                        Gửi lại mã <span className="text-[#6347f9]">{timer > 0 ? formatTimer(timer) : ''}</span>
                    </button>
                </div>
            </div>

            {/* Illustration Area */}
            <div className="flex justify-center mb-8 flex-1 items-center">
                <div className="relative w-full aspect-square max-w-[280px]">
                    <img
                        src="/otp_verification_pwa.png"
                        alt="Minh họa xác thực OTP"
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-8">
                <Button
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otp.join('').length < 4}
                    className="w-full h-[60px] rounded-[20px] bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-lg shadow-[0_10px_20px_-5px_rgba(99,71,249,0.3)] transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none"
                >
                    {isLoading ? 'Đang xác thực...' : 'Gửi'}
                </Button>
            </div>
        </>
    );

    const renderResetStep = () => (
        <>
            {/* Title Section */}
            <div className="mb-6">
                <h1 className="text-[32px] font-bold text-slate-900 leading-tight mb-2">Mật khẩu mới</h1>
                <p className="text-[#94A3B8] text-sm leading-relaxed">
                    Vui lòng nhập mật khẩu mới của bạn
                </p>
            </div>

            {/* Multi-input Form */}
            <div className="space-y-6 flex-1">
                <div className="space-y-2">
                    <Label className="text-slate-600 font-medium ml-1">Mật khẩu</Label>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-14 rounded-2xl border-slate-100 bg-white pr-12 focus-visible:ring-[#6347f9]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-600 font-medium ml-1">Nhập lại mật khẩu</Label>
                    <div className="relative">
                        <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-14 rounded-2xl border-slate-100 bg-white pr-12 focus-visible:ring-[#6347f9]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {/* Illustration Area */}
                <div className="flex justify-center pt-4">
                    <div className="relative w-full aspect-square max-w-[260px]">
                        <img
                            src="/reset_password_pwa.png"
                            alt="Minh họa đổi mật khẩu"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-8">
                <Button
                    onClick={handleResetPassword}
                    disabled={isLoading || !password || !confirmPassword}
                    className="w-full h-[60px] rounded-[20px] bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-lg shadow-[0_10px_20px_-5px_rgba(99,71,249,0.3)] transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none"
                >
                    {isLoading ? 'Đang cập nhật...' : 'Xác nhận'}
                </Button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-white flex flex-col px-6 pt-4 pb-8 overflow-hidden relative">
            <AnimatedTransition show={show} animation="slide-up">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => {
                            if (step === 'otp') setStep('email');
                            else if (step === 'reset') setStep('otp');
                            else navigate(-1);
                        }}
                        className="w-10 h-10 flex items-center justify-start -ml-1 transition-transform active:scale-95"
                    >
                        <ArrowLeft size={24} className="text-slate-900" />
                    </button>
                </div>

                {step === 'email' ? renderEmailStep() : step === 'otp' ? renderOtpStep() : renderResetStep()}
            </AnimatedTransition>

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => navigate('/auth')}
                    />

                    {/* Content */}
                    <div className="relative w-full bg-white rounded-t-[40px] px-8 pt-10 pb-12 animate-in slide-in-from-bottom duration-500 text-center">
                        <div className="flex justify-center mb-8">
                            <div className="relative">
                                {/* Outer circles */}
                                <div className="absolute inset-0 -m-4 bg-purple-50 rounded-full blur-xl opacity-50 animate-pulse" />
                                <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center relative">
                                    <div className="w-16 h-16 rounded-full bg-[#6347f9] flex items-center justify-center shadow-lg shadow-purple-200">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-[28px] font-bold text-slate-900 mb-3">Cập nhật mật khẩu thành công!</h2>
                        <p className="text-[#94A3B8] text-base mb-10 leading-relaxed font-medium">
                            Mật khẩu của bạn đã được thay đổi thành công. Hãy quay lại để đăng nhập.
                        </p>

                        <Button
                            onClick={() => navigate('/auth')}
                            className="w-full h-14 rounded-2xl bg-[#6347f9] hover:bg-[#5136db] text-white font-bold text-base shadow-lg shadow-purple-100"
                        >
                            Quay lại đăng nhập
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PWAForgotPasswordPage;
