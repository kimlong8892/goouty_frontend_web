import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useGlobalToast } from '../utils/globalToast';
import { Eye, EyeOff, Apple } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';

// Google Icon Component
const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const GooutyLogo = () => (
  <div className="flex flex-col items-center">
    <div className="w-32 h-32 relative">
      <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full"></div>
      <img
        src="https://pupil-sleep-11345349.figma.site/_assets/v11/8da9e20de4331dfe75eaaed992ce1fa360377f01.png"
        alt="Goouty Logo"
        className="w-full h-full object-contain relative z-10 animate-float"
      />
    </div>
  </div>
);

const AuthPage = () => {
  const { showToast } = useGlobalToast();
  const show = useAnimateIn(false, 250);
  const { isAuthenticated, login, signup, loginWithGoogle } = useAuth();
  const isMobile = useIsMobile();
  const { isPWA } = usePWA();
  const isPWAView = isPWA || isMobile;

  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [showResendConfirmation, setShowResendConfirmation] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const inviteToken = (location.state as any)?.inviteToken;
  const fromPath = (location.state as any)?.from;

  useEffect(() => {
    document.title = mode === 'login' ? 'Đăng nhập - Goouty' : 'Đăng ký - Goouty';
  }, [mode]);

  useEffect(() => {
    if (isAuthenticated) {
      if (inviteToken) {
        navigate(`/invite?token=${inviteToken}`);
      } else if (fromPath) {
        navigate(fromPath);
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, navigate, inviteToken, fromPath]);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      showToast(`Đăng nhập Google thất bại: ${decodeURIComponent(error)}`, 'error');
      navigate('/auth', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Vui lòng nhập email và mật khẩu', 'error');
      return;
    }

    if (mode === 'login') {
      const { error } = await login(email, password);
      if (error) {
        let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
        if (error.message) {
          if (error.message.includes('Email hoặc mật khẩu không đúng') || error.message.includes('Invalid credentials')) {
            errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại thông tin đăng nhập.';
          } else if (error.message.includes('sử dụng Google') || error.message.includes('social login')) {
            errorMessage = 'Tài khoản này chỉ có thể đăng nhập bằng Google. Vui lòng sử dụng nút đăng nhập Google.';
          } else if (error.message.includes('email hợp lệ') || error.message.includes('valid email')) {
            errorMessage = 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.';
          } else if (error.message.includes('not confirmed')) {
            errorMessage = 'Tài khoản chưa được xác nhận. Vui lòng kiểm tra email để xác nhận tài khoản.';
            setShowResendConfirmation(true);
          } else {
            errorMessage = error.message;
          }
        }
        showToast(errorMessage, 'error');
      } else {
        showToast('Đăng nhập thành công! Đang chuyển hướng...', 'success');
      }
    } else {
      if (!fullName) {
        showToast('Vui lòng nhập họ tên', 'error');
        return;
      }
      const { error } = await signup(email, password, fullName);
      if (error) {
        let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
        if (error.message) {
          if (error.message.includes('Email đã tồn tại') || error.message.includes('already exists')) {
            errorMessage = 'Email này đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.';
          } else if (error.message.includes('email hợp lệ') || error.message.includes('valid email')) {
            errorMessage = 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.';
          } else if (error.message.includes('mật khẩu') || error.message.includes('password')) {
            errorMessage = error.message;
          } else {
            errorMessage = error.message;
          }
        }
        showToast(errorMessage, 'error');
      } else {
        showToast('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.', 'success');
        setMode('login');
      }
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await loginWithGoogle();
    if (error) showToast(`Đăng nhập Google thất bại: ${error}`, 'error');
  };

  if (isPWAView) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col">
        <AnimatedTransition show={show} animation="slide-up">
          <div className="flex flex-col items-center mt-8 mb-10">
            <GooutyLogo />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-[28px] font-extrabold text-foreground mb-2">
              {mode === 'login' ? "Đăng nhập ngay!" : "Bắt đầu ngay!"}
            </h1>
            <p className="text-slate-400 text-base font-medium">
              Nhập thông tin bên dưới để tiếp tục
            </p>
          </div>

          <div className="mb-8">
            <Button
              variant="outline"
              className="w-full h-14 rounded-xl border border-border flex items-center justify-center gap-3 text-base font-semibold hover:bg-secondary transition-colors bg-card"
              onClick={handleGoogleLogin}
            >
              <GoogleIcon size={22} />
              Đăng nhập với Google
            </Button>
          </div>

          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <span className="relative bg-background px-4 text-muted-foreground text-sm font-medium">
              Hoặc đăng nhập bằng
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
            {mode === 'signup' && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground text-sm font-medium px-1">Họ và tên</Label>
                <Input
                  className="h-14 rounded-xl border border-border px-4 text-base focus-visible:ring-0 focus-visible:border-primary bg-card transition-all placeholder:text-muted-foreground/50"
                  placeholder="Nhập họ tên của bạn"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-sm font-medium px-1">Địa chỉ Email</Label>
              <Input
                type="email"
                className="h-14 rounded-xl border border-border px-4 text-base focus-visible:ring-0 focus-visible:border-primary bg-card transition-all placeholder:text-muted-foreground/50"
                placeholder="Nhập địa chỉ email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-sm font-medium px-1">Mật khẩu</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  className="h-14 rounded-xl border border-border px-4 pr-12 text-base focus-visible:ring-0 focus-visible:border-primary bg-card transition-all placeholder:text-muted-foreground/50 w-full"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm font-medium text-primary"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={!email || !password}
              className={`h-14 rounded-xl font-bold text-lg border-none mt-4 transition-all duration-300 ${!email || !password
                ? 'bg-secondary text-muted-foreground opacity-100'
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                }`}
            >
              {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </Button>

            <div className="mt-auto py-8 text-center">
              <p className="text-foreground font-medium text-sm">
                {mode === 'login' ? "Bạn chưa có tài khoản? " : "Bạn đã có tài khoản? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-primary font-bold"
                >
                  {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
                </button>
              </p>
            </div>
          </form>
        </AnimatedTransition>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 flex flex-col items-center justify-center">
      <AnimatedTransition show={show} animation="slide-up" className="w-full max-w-[1000px]">
        <Card className="w-full grid grid-cols-1 md:grid-cols-2 rounded-[40px] overflow-hidden shadow-[0_12px_40px_rgb(0,0,0,0.06)] border-none bg-white dark:bg-card p-6 md:p-8">

          {/* Mascot Image Section */}
          <div className={`hidden md:block ${mode === 'signup' ? 'md:order-2' : 'md:order-1'} self-center`}>
            <div className="aspect-square w-full overflow-hidden rounded-[32px] bg-[#f8f9fa] dark:bg-secondary">
              <img
                src="/auth_mascot.png"
                alt="Goouty Mascot"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Form Content */}
          <div className={`p-6 md:p-8 lg:p-10 flex flex-col justify-center ${mode === 'signup' ? 'md:order-1' : 'md:order-2'}`}>
            <div className={`mb-10 ${mode === 'login' ? 'md:text-left' : ''}`}>
              <h1 className="text-[44px] font-black text-primary mb-3 uppercase tracking-tight leading-tight font-sans">
                {mode === 'login' ? 'Đăng nhập' : 'ĐĂNG KÝ'}
              </h1>
              <p className="text-slate-600 dark:text-muted-foreground font-semibold text-lg">
                Cùng Goouty lập kế hoạch chuyến đi
              </p>
            </div>

            <div className="space-y-6">
              {/* Google Login */}
              {mode === 'login' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full h-[56px] rounded-2xl border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-primary hover:text-accent-foreground dark:hover:text-primary-foreground dark:text-foreground font-bold gap-3 text-base shadow-sm transition-all"
                    onClick={handleGoogleLogin}
                  >
                    <GoogleIcon size={24} />
                    Google
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-100 dark:border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white dark:bg-card px-4 text-slate-400 dark:text-muted-foreground font-bold">Hoặc</span>
                    </div>
                  </div>
                </>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name - Signup Only */}
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="fullname" className="text-slate-400 dark:text-muted-foreground text-sm font-bold ml-1">Họ và tên</Label>
                    <Input
                      id="fullname"
                      type="text"
                      className="h-[56px] rounded-2xl bg-[#f3f4f6] dark:bg-secondary dark:text-foreground border-none focus:ring-2 focus:ring-primary/20 transition-all px-5 text-base font-medium placeholder:text-slate-400 dark:placeholder:text-muted-foreground"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-400 dark:text-muted-foreground text-sm font-bold ml-1">
                    Địa chỉ email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="h-[56px] rounded-2xl bg-[#f3f4f6] dark:bg-secondary dark:text-foreground border-none focus:ring-2 focus:ring-primary/20 transition-all px-5 text-base font-medium placeholder:text-slate-400 dark:placeholder:text-muted-foreground"
                    placeholder={mode === 'signup' ? "nguyenvan.a@example.com" : "Nhập địa chỉ email của bạn"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-400 dark:text-muted-foreground text-sm font-bold ml-1">
                    Mật khẩu
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="h-[56px] rounded-2xl bg-[#f3f4f6] dark:bg-secondary dark:text-foreground border-none focus:ring-2 focus:ring-primary/20 outline-none transition-colors duration-200 px-5 pr-12 text-base font-medium placeholder:text-slate-400 dark:placeholder:text-muted-foreground"
                      placeholder={mode === 'signup' ? "••••••••" : "Nhập mật khẩu"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {mode === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-[14px] font-bold text-primary hover:text-primary/90 transition-colors"
                    >
                      Quên mật khẩu
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-[58px] rounded-2xl bg-primary hover:bg-primary/90 text-white font-extrabold text-lg shadow-lg shadow-primary/20 dark:shadow-none transition-all duration-300 mt-4 active:scale-[0.98]"
                >
                  {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </Button>
              </form>

              <div className="pt-4 text-center">
                <p className="text-slate-600 dark:text-muted-foreground font-bold text-[15px]">
                  {mode === 'login' ? 'Bạn không có tài khoản? ' : 'Bạn đã có tài khoản? '}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-primary font-black hover:underline underline-offset-4"
                  >
                    {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedTransition>
    </div>
  );
};

export default AuthPage;
