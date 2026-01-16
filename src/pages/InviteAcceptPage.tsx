import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/integrations/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, User, Lock, MapPin, Calendar, Users, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="dark:text-slate-300">Đang tải thông tin lời mời...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 dark:text-red-400">Lời mời không hợp lệ hoặc đã hết hạn</p>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="text-center">
            <div className="p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <img src="/footer_badge_mascot.png" alt="Goouty Logo" className="w-full h-full object-contain" />
            </div>
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
                    className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus-visible:ring-primary"
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
                    value={email || invitation.invitedEmail}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus-visible:ring-primary"
                    required
                    disabled
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Email này đã được mời tham gia chuyến đi</p>
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
                    className="pl-10 pr-10 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus-visible:ring-primary"
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Mật khẩu tối thiểu 6 ký tự</p>
              </div>

              <Button
                type="submit"
                disabled={processing}
                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white h-11"
              >
                {processing ? 'Đang xử lý...' : 'Đăng ký và tham gia chuyến đi'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="text-center">
            <div className="p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <img src="/footer_badge_mascot.png" alt="Goouty Logo" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-2xl">
              Tham gia chuyến đi
            </CardTitle>
            <CardDescription>
              Bạn được mời tham gia một chuyến đi thú vị
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800">
              <div className="flex items-center space-x-3 mb-3">
                <img src="/footer_badge_mascot.png" alt="Goouty Logo" className="h-5 w-5 object-contain" />
                <h3 className="font-semibold dark:text-white">{invitation.trip.title}</h3>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground dark:text-slate-400">
                {invitation.trip.province && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{invitation.trip.province.name}</span>
                  </div>
                )}
                {invitation.trip.startDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      {format(new Date(invitation.trip.startDate), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>Mời bởi: {invitation.inviter.fullName || invitation.inviter.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Thông tin tham gia
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                    <li>• Bạn sẽ trở thành thành viên của chuyến đi</li>
                    <li>• Có thể xem và tương tác với lịch trình</li>
                    <li>• Nhận thông báo về các hoạt động mới</li>
                    <li>• Tham gia thảo luận với các thành viên khác</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <span>Tham gia với tài khoản:</span>
                <Badge variant="secondary" className="font-medium text-primary dark:bg-slate-800 dark:text-indigo-300">
                  {email || invitation.invitedEmail}
                </Badge>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={processing}
                  className="flex-1 rounded-xl h-11 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Hủy bỏ
                </Button>
                <Button
                  onClick={() => {
                    const token = searchParams.get('token');
                    if (token) acceptInvitation(token);
                  }}
                  disabled={processing}
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white h-11 shadow-lg shadow-primary/20"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tham gia...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Tham gia ngay
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If authenticated, show loading while loading invitation
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="dark:text-slate-300">Đang chuẩn bị...</p>
      </div>
    </div>
  );
};

export default InviteAcceptPage;
