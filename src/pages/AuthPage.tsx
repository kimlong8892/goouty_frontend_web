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
import { Eye, EyeOff } from 'lucide-react';

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

const AuthPage = () => {
  const { showToast } = useGlobalToast();
  const show = useAnimateIn(false, 250);
  const { isAuthenticated, login, signup, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
        navigate('/my-trips');
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
              <h1 className="text-[44px] font-black text-[#6347f9] mb-3 uppercase tracking-tight leading-tight font-sans">
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
                    className="w-full h-[56px] rounded-2xl border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-accent hover:text-accent-foreground dark:text-foreground font-bold gap-3 text-base shadow-sm transition-all"
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
                    <Label htmlFor="fullname" className="text-slate-400 dark:text-muted-foreground text-sm font-bold ml-1">Name</Label>
                    <Input
                      id="fullname"
                      type="text"
                      className="h-[56px] rounded-2xl bg-[#f3f4f6] dark:bg-secondary dark:text-foreground border-none focus:ring-2 focus:ring-[#6347f9]/20 transition-all px-5 text-base font-medium placeholder:text-slate-400 dark:placeholder:text-muted-foreground"
                      placeholder="Shane Watson"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-400 dark:text-muted-foreground text-sm font-bold ml-1">
                    {mode === 'signup' ? 'Email Address' : 'Địa chỉ email'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="h-[56px] rounded-2xl bg-[#f3f4f6] dark:bg-secondary dark:text-foreground border-none focus:ring-2 focus:ring-[#6347f9]/20 transition-all px-5 text-base font-medium placeholder:text-slate-400 dark:placeholder:text-muted-foreground"
                    placeholder={mode === 'signup' ? "shane.watson@example.com" : "Nhập địa chỉ email của bạn"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-400 dark:text-muted-foreground text-sm font-bold ml-1">
                    {mode === 'signup' ? 'Password' : 'Mật khẩu'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="h-[56px] rounded-2xl bg-[#f3f4f6] dark:bg-secondary dark:text-foreground border-none focus:ring-2 focus:ring-[#6347f9]/20 outline-none transition-colors duration-200 px-5 pr-12 text-base font-medium placeholder:text-slate-400 dark:placeholder:text-muted-foreground"
                      placeholder={mode === 'signup' ? "••••••••" : "Nhập mật khẩu"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted-foreground hover:text-[#6347f9] transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {mode === 'login' && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-[18px] h-[18px] rounded border-slate-300 dark:border-border text-[#6347f9] focus:ring-[#6347f9] cursor-pointer accent-[#6347f9]"
                      />
                      <span className="text-[14px] text-slate-600 dark:text-muted-foreground font-bold group-hover:text-slate-800 dark:group-hover:text-foreground transition-colors">Ghi nhớ tài khoản</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-[14px] font-bold text-[#6347f9] hover:text-[#5136db] transition-colors"
                    >
                      Quên mật khẩu
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-[58px] rounded-2xl bg-[#6347f9] hover:bg-[#5136db] text-white font-extrabold text-lg shadow-lg shadow-purple-200 dark:shadow-none transition-all duration-300 mt-4 active:scale-[0.98]"
                >
                  {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </Button>
              </form>

              <div className="pt-4 text-center">
                <p className="text-slate-600 dark:text-muted-foreground font-bold text-[15px]">
                  {mode === 'login' ? 'Bạn không có tài khoản? ' : 'Bạn đã có tài khoản? '}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-[#6347f9] font-black hover:underline underline-offset-4"
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
