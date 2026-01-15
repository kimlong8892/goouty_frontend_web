import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/integrations/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, User, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvitationDetails {
  id: string;
  tripId: string;
  invitedEmail: string;
  trip: {
    id: string;
    title: string;
    description?: string;
    startDate?: string;
    province?: {
      id: string;
      name: string;
    };
    user: {
      fullName?: string;
      email: string;
    };
  };
  inviter: {
    fullName?: string;
    email: string;
  };
  status: string;
}

const InviteAcceptPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, signup } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast.error('Token không hợp lệ');
      navigate('/');
      return;
    }

    // Skip if already loading or if invitation is already fetched
    if (invitation) {
      if (!authLoading) {
        if (isAuthenticated && !processing) {
          setShowAcceptConfirm(true);
        } else if (!isAuthenticated) {
          setShowSignupForm(true);
        }
      }
      return;
    }

    // Load invitation details
    (async () => {
      try {
        const invitationData = await api.members.getInvitationByToken(token);
        setInvitation(invitationData);
        setEmail(invitationData.invitedEmail || '');
        setLoadingInvitation(false);

        // Wait for auth to load
        if (authLoading) {
          return;
        }

        // If user is authenticated, show confirmation
        if (isAuthenticated) {
          setShowAcceptConfirm(true);
        } else {
          // Show signup form for unauthenticated users
          setShowSignupForm(true);
        }
      } catch (err: any) {
        const msg = err?.message || 'Không thể tải thông tin lời mời';
        toast.error(msg);
        setLoadingInvitation(false);
        setTimeout(() => navigate('/'), 2000);
      }
    })();
  }, [searchParams, navigate, isAuthenticated, authLoading]);

  const acceptInvitation = async (token: string) => {
    if (processing) return;
    setProcessing(true);
    try {
      const res = await api.members.acceptInvite(token);
      toast.success('Bạn đã tham gia chuyến đi thành công!');
      const tripId = res?.trip?.id;
      if (tripId) navigate(`/trip/${tripId}`);
      else navigate('/');
    } catch (err: any) {
      const msg = err?.message || 'Không thể chấp nhận lời mời';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await signup(email, password, fullName);
      if (error) {
        toast.error(error.message || 'Đăng ký thất bại');
        setProcessing(false);
        return;
      }

      // After successful signup, the user is authenticated. 
      // The useEffect will pick this up and show the confirmation screen
      // or we can just proceed if that was the "Register and Join" intent.
      // Given the button says "Register and join trip", we proceed.
      const token = searchParams.get('token');
      if (token) {
        toast.success('Đăng ký thành công! Đang tham gia chuyến đi...');
        await acceptInvitation(token);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Đăng ký thất bại');
      setProcessing(false);
    }
  };

  if (loadingInvitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải thông tin lời mời...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Lời mời không hợp lệ hoặc đã hết hạn</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSignupForm && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              Tham gia chuyến đi
            </CardTitle>
            <CardDescription>
              Bạn đã được mời tham gia chuyến đi <strong>"{invitation.trip.title}"</strong>
            </CardDescription>
            {invitation.inviter.fullName && (
              <CardDescription className="mt-2">
                Người mời: <strong>{invitation.inviter.fullName}</strong>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200 focus-visible:ring-primary"
                    required
                    disabled
                  />
                </div>
                <p className="text-xs text-slate-500">Email này đã được mời tham gia chuyến đi</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 rounded-xl border-slate-200 focus-visible:ring-primary"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">Mật khẩu tối thiểu 6 ký tự</p>
              </div>

              <Button
                type="submit"
                disabled={processing}
                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white h-11"
              >
                {processing ? 'Đang xử lý...' : 'Đăng ký và tham gia chuyến đi'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/auth', { state: { inviteToken: searchParams.get('token') } })}
                    className="text-primary hover:underline font-medium"
                  >
                    Đăng nhập
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showAcceptConfirm && isAuthenticated && invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md overflow-hidden border-none shadow-2xl">
          <div className="h-2 bg-primary"></div>
          <CardHeader className="text-center pt-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              Mời tham gia chuyến đi
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2 px-4">
              {invitation.inviter.fullName || 'Bạn'} đã được mời tham gia chuyến đi đầy thú vị cùng bạn bè.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
                <div>
                  <p className="text-sm text-slate-50 font-medium bg-primary/80 px-2 py-0.5 rounded-md inline-block mb-1">Tên chuyến đi</p>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{invitation.trip.title}</h3>
                </div>
              </div>

              {invitation.trip.province && (
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">📍</span>
                  {invitation.trip.province.name}
                </p>
              )}

              {invitation.trip.startDate && (
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">📅</span>
                  {new Date(invitation.trip.startDate).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  const token = searchParams.get('token');
                  if (token) acceptInvitation(token);
                }}
                disabled={processing}
                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý...
                  </div>
                ) : 'Chấp nhận tham gia'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                disabled={processing}
                className="w-full rounded-xl text-slate-500 hover:bg-slate-100 h-12 text-base font-medium transition-all"
              >
                Để sau
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If authenticated, show loading while loading invitation
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Đang chuẩn bị...</p>
      </div>
    </div>
  );
};

export default InviteAcceptPage;
