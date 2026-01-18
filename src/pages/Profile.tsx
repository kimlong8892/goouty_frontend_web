import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { BankSearch, BANKS } from '@/components/BankSearch.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { api } from '@/integrations/api/client.ts';
import { toast } from 'sonner';
import { usePWA } from '@/pwa/hooks/usePWA';
import {
  Camera,
  Settings,
  LogOut,
  Mail,
  Phone,
  CreditCard,
  User,
  Pencil,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Layout,
  Info,
  Star
} from 'lucide-react';
import { ExperienceReview } from '@/components/ExperienceReview.tsx';
import { notificationService } from '@/services/notificationService';
import NotificationSettings from '@/components/NotificationSettings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  bankId?: string;
  bankNumber?: string;
  hasPassword?: boolean; // True if user has password, false if registered via Google
  tripsCount?: number;
  placesCount?: number;
  createdAt: string;
  updatedAt: string;
}

const VIETQR_TEMPLATE = 'compact';

const Profile = () => {
  const navigate = useNavigate();
  const showContent = useAnimateIn(false, 300);
  const [subPage, setSubPage] = useState<'settings' | 'change-password' | 'review' | null>(null);
  const { user, logout } = useAuth();
  const { isPWA } = usePWA();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    bankId: '',
    bankNumber: '',
  });

  useEffect(() => {
    document.title = 'Hồ sơ cá nhân - Goouty';
  }, []);

  // Fetch Profile & Notifications
  useEffect(() => {
    const initData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const profileData = await api.get<UserProfile>('/users/profile');
        setProfile(profileData);
        setFormData({
          fullName: profileData.fullName || '',
          phoneNumber: profileData.phoneNumber || '',
          bankId: profileData.bankId || '',
          bankNumber: profileData.bankNumber || ''
        });

        // Load notification settings
        try {
          const prefs = await notificationService.getNotificationPreferences();
          setPushEnabled((prefs as any).notificationsEnabled);
        } catch (e) {
          console.error("Failed to load notif prefs", e);
        }

      } catch (error) {
        toast.error('Không thể tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [user, isPWA]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updateData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        bankId: formData.bankId?.trim() === '' ? null : formData.bankId || null,
        bankNumber: formData.bankNumber?.trim() === '' ? null : formData.bankNumber || null
      };

      const updatedProfile = await api.put<UserProfile>('/users/profile', updateData);
      setProfile(updatedProfile);
      toast.success('Đã cập nhật hồ sơ thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        bankId: profile.bankId || '',
        bankNumber: profile.bankNumber || ''
      });
      toast.info('Đã hủy thay đổi');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const response = await api.users.uploadAvatar(file);
      setProfile(prev => prev ? { ...prev, profilePicture: response.data.user.profilePicture } : null);
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (error) {
      toast.error('Lỗi khi tải ảnh lên');
    }
  };

  const handleTogglePush = async (checked: boolean) => {
    // Chỉ cho phép bật thông báo trong PWA
    if (!isPWA) {
      toast.error('Thông báo chỉ khả dụng trong PWA');
      return;
    }

    setPushEnabled(checked);
    try {
      if (checked) {
        const granted = await notificationService.requestPermission();
        if (granted.granted) {
          await notificationService.subscribeToPush();
        } else {
          setPushEnabled(false);
          return;
        }
      }
      await notificationService.updateNotificationPreferences({ notificationsEnabled: checked });
      toast.success(checked ? 'Đã bật thông báo' : 'Đã tắt thông báo');
    } catch (e) {
      toast.error("Không thể cập nhật cài đặt thông báo");
      setPushEnabled(!checked);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    try {
      setChangingPassword(true);
      await api.users.changePassword(passwordForm);
      toast.success('Đổi mật khẩu thành công');
      setIsPasswordDialogOpen(false);
      if (subPage === 'change-password') {
        setSubPage('settings');
      }
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) return null;

  const isMobileView = isPWA || (window.innerWidth < 768);


  if (isMobileView) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Main PWA Profile View */}
        <AnimatedTransition show={showContent && !subPage} animation="fade">
          <div className="text-center pb-8 pt-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Goouty v2.4.0 (PWA)</p>
          </div>
          <div className={`${subPage ? 'hidden' : 'block'}`}>
            <div className="px-6 space-y-8">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-white/10 shadow-sm shrink-0">
                  {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground uppercase">
                      {profile.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground truncate">{profile.fullName}</h2>
                  <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                </div>
                <Button
                  onClick={() => navigate('/profile/edit', { state: { mode: 'edit' } })}
                  size="icon"
                  className="h-10 w-10 bg-primary hover:bg-primary/90 text-white rounded-[12px] shadow-sm shrink-0 border-none"
                >
                  <Pencil className="w-5 h-5" />
                </Button>
              </div>

              {/* Menu Sections */}
              <div className="space-y-6">
                {/* Group 1 */}


                {/* Group 2 */}
                <div className="space-y-2">
                  <div
                    onClick={() => setSubPage('settings')}
                    className="flex items-center justify-between py-2 cursor-pointer active:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-foreground shrink-0">
                        <Settings className="w-5 h-5" />
                      </div>
                      <span className="text-base font-medium text-foreground">Cài đặt</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-foreground shrink-0">
                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </div>
                      <span className="text-base font-medium text-foreground">Chế độ tối</span>
                    </div>
                    <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                  </div>
                </div>

                {/* Group 3 */}
                <div className="space-y-2">
                  <div
                    onClick={() => navigate('/pwa-privacy')}
                    className="flex items-center justify-between py-2 cursor-pointer active:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-foreground shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <span className="text-base font-medium text-foreground">Chính sách bảo mật</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div
                    onClick={() => navigate('/pwa-terms')}
                    className="flex items-center justify-between py-2 cursor-pointer active:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-foreground shrink-0">
                        <Layout className="w-5 h-5" />
                      </div>
                      <span className="text-base font-medium text-foreground">Điều khoản sử dụng</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div
                    onClick={() => navigate('/pwa-about')}
                    className="flex items-center justify-between py-2 cursor-pointer active:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-foreground shrink-0">
                        <Info className="w-5 h-5" />
                      </div>
                      <span className="text-base font-medium text-foreground">Giới thiệu về Goouty</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div
                    onClick={() => setSubPage('review')}
                    className="flex items-center justify-between py-2 cursor-pointer active:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-foreground shrink-0">
                        <Star className="w-5 h-5 text-yellow-500" />
                      </div>
                      <span className="text-base font-medium text-foreground">Đánh giá trải nghiệm</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Logout */}
                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 w-full py-2 group active:opacity-70 transition-opacity"
                  >
                    <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="text-base font-medium text-red-500">Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AnimatedTransition>

        {/* Sub-page: Settings */}
        <AnimatedTransition show={subPage === 'settings'} animation="slide-up">
          <div className={`fixed inset-0 bg-background z-50 overflow-y-auto ${subPage === 'settings' ? 'block' : 'hidden'}`}>
            <div className="px-6 pt-12 pb-6 flex items-center gap-4 border-b border-border/40">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSubPage(null)}
                className="-ml-2 hover:bg-transparent"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </Button>
              <h2 className="text-2xl font-bold text-foreground">Cài đặt</h2>
            </div>

            <div className="p-6 space-y-6">
              <div
                onClick={() => {
                  if (isPWA) {
                    navigate('/pwa-change-password');
                  } else {
                    setSubPage('change-password');
                  }
                }}
                className="flex items-center justify-between py-2 cursor-pointer active:opacity-70"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-foreground shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-base font-medium text-foreground">Đổi mật khẩu</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Notification Toggle */}
              {isPWA && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-foreground shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <span className="text-base font-medium text-foreground">Thông báo</span>
                  </div>
                  <Switch checked={pushEnabled} onCheckedChange={handleTogglePush} />
                </div>
              )}
            </div>
          </div>
        </AnimatedTransition>

        {/* Sub-page: Experience Review */}
        <AnimatedTransition show={subPage === 'review'} animation="slide-up">
          <div className={`fixed inset-0 bg-background z-50 overflow-y-auto ${subPage === 'review' ? 'block' : 'hidden'}`}>
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-4">
              <div className="flex items-center justify-between relative">
                <button
                  type="button"
                  onClick={() => setSubPage(null)}
                  className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-secondary/80 text-foreground transition-all active:scale-95 touch-manipulation"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <h2 className="text-lg font-bold text-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max">
                  Đánh giá trải nghiệm
                </h2>

                <div className="w-8"></div>
              </div>
            </div>

            <div className="px-6 py-6">
              <ExperienceReview
                isPWA={true}
                onSuccess={() => setSubPage(null)}
                onCancel={() => setSubPage(null)}
              />
            </div>
          </div>
        </AnimatedTransition>

        {/* Sub-page: Change Password (Web only, PWA uses separate page) */}
        {!isPWA && (
          <AnimatedTransition show={subPage === 'change-password'} animation="slide-up">
            <div className={`fixed inset-0 bg-background z-[60] overflow-y-auto ${subPage === 'change-password' ? 'block' : 'hidden'}`}>
              <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-4">
                <div className="flex items-center justify-between relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSubPage('settings');
                      resetPasswordForm();
                    }}
                    className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-secondary/80 text-foreground transition-all active:scale-95 touch-manipulation"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <h2 className="text-lg font-bold text-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max">
                    Đổi mật khẩu
                  </h2>

                  <div className="w-8"></div>
                </div>
              </div>

              <div className="px-5 py-6 flex flex-col min-h-[calc(100vh-80px)]">
                <form onSubmit={handleChangePassword} className="flex-1 flex flex-col">
                  <div className="flex-1 space-y-6">
                    {profile?.hasPassword && (
                      <div className="space-y-2">
                        <Label className="text-base text-muted-foreground/80 font-normal pl-1">Mật khẩu hiện tại</Label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            required
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            autoComplete="current-password"
                            autoCorrect="off"
                            autoCapitalize="off"
                            className="bg-card border-border/60 shadow-sm rounded-xl h-14 px-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2"
                          >
                            {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    )}
                    {!profile?.hasPassword && (
                      <div className="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">i</div>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
                          Tài khoản của bạn đăng nhập qua Google. Bạn có thể đặt mật khẩu mới để đăng nhập bằng email.
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-base text-muted-foreground/80 font-normal pl-1">Mật khẩu mới</Label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          className="bg-card border-border/60 shadow-sm rounded-xl h-14 px-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base text-muted-foreground/80 font-normal pl-1">Xác nhận mật khẩu mới</Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          className="bg-card border-border/60 shadow-sm rounded-xl h-14 px-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-4 mt-10 z-10 w-full">
                    <Button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                    >
                      {changingPassword ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Đang cập nhật...</span>
                        </div>
                      ) : (
                        'Cập nhật'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </AnimatedTransition>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-4 pb-24 px-4">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Card */}
          <div className="bg-card rounded-[32px] shadow-xl overflow-hidden relative group">
            <div className="h-48 md:h-64 bg-gradient-to-r from-violet-900 to-fuchsia-900 relative">
              <img
                src="https://images.unsplash.com/photo-1762090326569-f3c698bee480?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwYWJzdHJhY3QlMjB0cmF2ZWwlMjBsYW5kc2NhcGUlMjBncmFkaWVudCUyMHB1cnBsZXxlbnwxfHx8fDE3NjU4OTUzMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Cover"
                className="w-full h-full object-cover border-none"
              />
            </div>

            <div className="px-6 md:px-10 pb-8 flex flex-col md:flex-row items-end md:items-center justify-between relative mt-[-60px] md:mt-0">
              <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full md:w-auto">
                <div className="relative md:-mt-16">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-[6px] border-card shadow-xl bg-card overflow-hidden relative">
                    {profile.profilePicture ? (
                      <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-4xl font-bold text-primary">
                        {profile.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 shadow-md transition-all">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>

                <div className="text-center md:text-left pt-2 md:pt-4">
                  <h1 className="text-3xl font-bold text-foreground">{profile.fullName}</h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground font-medium mt-1">
                    <span>Việt Nam</span>
                  </div>
                </div>
              </div>

              {/* Stats Card - Right */}
              <div className="bg-card rounded-2xl shadow-xl border border-border px-6 py-3 flex items-center gap-5 z-10 md:mt-8">
                <div className="text-center">
                  <div className="text-xl font-black text-foreground">{profile.tripsCount ?? 0}</div>
                  <div className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">CHUYẾN ĐI</div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="text-center">
                  <div className="text-xl font-black text-foreground">{profile.placesCount ?? 0}</div>
                  <div className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">ĐỊA ĐIỂM</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="rounded-[32px] border-none shadow-xl bg-card overflow-hidden h-full">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Thông tin cá nhân</h2>
                      <p className="text-muted-foreground text-sm mt-1">Quản lý thông tin hồ sơ của bạn</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-muted-foreground font-medium">
                          <User className="w-4 h-4" /> Họ và tên <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="h-12 rounded-xl bg-secondary/50 border-border focus:border-primary/50 hover:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-muted-foreground font-medium">
                          <Mail className="w-4 h-4" /> Email
                        </Label>
                        <Input
                          value={profile.email}
                          disabled
                          className="h-12 rounded-xl bg-secondary/50 border-border opacity-70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-muted-foreground font-medium">
                          <Phone className="w-4 h-4" /> Số điện thoại
                        </Label>
                        <Input
                          placeholder="+84 909 123 456"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          className="h-12 rounded-xl bg-secondary/50 border-border focus:border-primary/50 hover:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-muted-foreground font-medium">
                          <CreditCard className="w-4 h-4" /> Ngân hàng
                        </Label>
                        <BankSearch
                          value={formData.bankId}
                          onChange={(value) => setFormData({ ...formData, bankId: value })}
                          placeholder="Chọn ngân hàng"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-muted-foreground font-medium">
                          <CreditCard className="w-4 h-4" /> Số tài khoản
                        </Label>
                        <Input
                          placeholder="Số tài khoản ngân hàng"
                          value={formData.bankNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setFormData({ ...formData, bankNumber: value })
                          }}
                          className="h-12 rounded-xl bg-secondary/50 border-border focus:border-primary/50 hover:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>


                  </div>

                  {formData.bankId && formData.bankNumber && (
                    <div className="mt-8 bg-secondary/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8 border border-border">
                      <div className="p-2 bg-card rounded-xl shadow-sm">
                        <img
                          src={`https://img.vietqr.io/image/${formData.bankId}-${formData.bankNumber}-${VIETQR_TEMPLATE}.png`}
                          alt="QR Chuyển khoản"
                          className="w-40 h-auto"
                        />
                      </div>
                      <div className="text-center md:text-left flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1">QR Chuyển khoản</h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          Quét mã để chuyển khoản nhanh cho <strong>{formData.fullName}</strong>
                        </p>
                        <div className="flex flex-col gap-1">
                          <div className="bg-card px-3 py-2 rounded-lg border border-border inline-block w-fit">
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mr-2">NGÂN HÀNG</span>
                            <span className="text-foreground font-semibold">{BANKS.find(b => b.code === formData.bankId)?.name || formData.bankId}</span>
                          </div>
                          <div className="bg-card px-3 py-2 rounded-lg border border-border inline-block w-fit">
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mr-2">SỐ TÀI KHOẢN</span>
                            <span className="text-foreground font-semibold">{formData.bankNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="h-11 rounded-xl border-border dark:border-gray-700 bg-transparent text-muted-foreground dark:text-slate-400 hover:bg-secondary dark:hover:bg-gray-800 hover:text-foreground dark:hover:text-white transition-all px-6"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-8 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Notification Settings - chỉ hiển thị trong PWA */}
              {isPWA && <NotificationSettings />}

              <Card className="rounded-[24px] border-none shadow-lg overflow-hidden bg-card">
                <CardContent className="p-6">
                  <div className="font-bold text-foreground flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" /> Cài đặt hiển thị
                    </div>
                    <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                  </div>
                  <p className="text-sm text-muted-foreground">Chuyển đổi giữa chế độ sáng và tối để bảo vệ mắt của bạn.</p>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-none shadow-lg overflow-hidden bg-card">
                <CardContent className="p-6">
                  <div className="font-bold text-foreground flex items-center gap-2 mb-6">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" /> Thư viện & Lưu trữ
                  </div>
                  <div className="space-y-4">
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/wishlist')}
                      className="group w-full justify-start h-16 rounded-[24px] bg-secondary hover:bg-secondary/80 text-foreground hover:text-primary font-bold border-none transition-all pl-6"
                    >
                      <Heart className="w-5 h-5 mr-4 text-red-500 group-hover:scale-110 transition-transform" /> Danh sách yêu thích
                    </Button>

                    <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="group w-full justify-start h-16 rounded-[24px] bg-secondary hover:bg-secondary/80 text-foreground hover:text-primary font-bold border-none transition-all pl-6"
                        >
                          <Star className="w-5 h-5 mr-4 text-yellow-500 group-hover:scale-110 transition-transform fill-yellow-500" /> Đánh giá trải nghiệm
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] rounded-[32px] max-h-[90vh] overflow-y-auto w-full">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-center">Đánh giá & Góp ý</DialogTitle>
                        </DialogHeader>
                        <ExperienceReview
                          onSuccess={() => setIsReviewDialogOpen(false)}
                          onCancel={() => setIsReviewDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-none shadow-lg overflow-hidden bg-card">
                <CardContent className="p-6">
                  <div className="font-bold text-foreground flex items-center gap-2 mb-6">
                    <Shield className="w-5 h-5 text-primary" /> Bảo mật
                  </div>
                  <div className="space-y-4">
                    <Dialog
                      open={isPasswordDialogOpen}
                      onOpenChange={(open) => {
                        setIsPasswordDialogOpen(open);
                        if (!open) resetPasswordForm();
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="group w-full justify-start h-16 rounded-[24px] bg-secondary hover:bg-secondary/80 text-foreground hover:text-primary font-bold border-none transition-all pl-6">
                          <Lock className="w-5 h-5 mr-4 text-gray-500 group-hover:text-primary transition-colors" /> Đổi mật khẩu
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Đổi mật khẩu</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
                          {profile?.hasPassword && (
                            <div className="space-y-2">
                              <Label>Mật khẩu hiện tại</Label>
                              <div className="relative">
                                <Input
                                  type={showCurrentPassword ? "text" : "password"}
                                  required
                                  value={passwordForm.currentPassword}
                                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                  className="h-12 rounded-xl border border-border bg-card hover:border-primary/50 focus:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors duration-200 pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                              </div>
                            </div>
                          )}
                          {!profile?.hasPassword && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                              <p className="text-sm text-blue-800">
                                <strong>Lưu ý:</strong> Tài khoản của bạn đăng nhập qua Google. Bạn có thể đặt mật khẩu để đăng nhập bằng email.
                              </p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Mật khẩu mới</Label>
                            <div className="relative">
                              <Input
                                type={showNewPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="h-12 rounded-xl border border-border bg-card hover:border-primary/50 focus:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors duration-200 pr-12"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Xác nhận mật khẩu mới</Label>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="h-12 rounded-xl border border-border bg-card hover:border-primary/50 focus:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors duration-200 pr-12"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>
                          <DialogFooter className="pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsPasswordDialogOpen(false);
                                resetPasswordForm();
                              }}
                              className="hover:bg-transparent hover:text-primary hover:border-primary"
                            >
                              Hủy
                            </Button>
                            <Button
                              type="submit"
                              disabled={changingPassword}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="group w-full justify-start h-16 rounded-[24px] bg-[#fff0f0] hover:bg-[#ffe4e4] dark:bg-red-500/10 dark:hover:bg-red-500/20 text-foreground hover:text-red-500 font-bold transition-all pl-6"
                    >
                      <LogOut className="w-5 h-5 mr-4 text-foreground group-hover:text-red-500 transition-colors" /> Đăng xuất thiết bị
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AnimatedTransition>
    </div>
  );
};

const MenuRow = ({ icon, label, onClick, value }: { icon: React.ReactNode, label: string, onClick: () => void, value?: string }) => (
  <button
    onClick={onClick}
    className="w-full p-4 flex items-center justify-between border-b border-border active:bg-secondary transition-colors last:border-0"
  >
    <div className="flex items-center gap-3 text-sm">
      <div className="p-2 bg-secondary rounded-xl">{icon}</div>
      <span className="font-semibold text-foreground">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs text-muted-foreground font-medium">{value}</span>}
      <Settings className="w-4 h-4 text-muted-foreground transform rotate-[-90deg]" />
    </div>
  </button>
);

export default Profile;
