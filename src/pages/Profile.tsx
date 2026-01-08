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
  Lock
} from 'lucide-react';
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
  const { user, logout } = useAuth();
  const { isPWA } = usePWA();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
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
  }, [user]);

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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6347f9]"></div>
      </div>
    );
  }

  if (!profile) return null;

  const isMobileView = isPWA || (window.innerWidth < 768);

  if (isMobileView) {
    return (
      <div className="min-h-screen pb-24">
        <AnimatedTransition show={showContent} animation="fade">
          {/* Header Section */}
          <div className="bg-white px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm border-b border-gray-100 flex flex-col items-center">
            <div className="relative mb-4 group">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 ring-1 ring-purple-100">
                {profile.profilePicture ? (
                  <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#6347f9] to-[#8c7df0] flex items-center justify-center text-3xl font-bold text-white uppercase">
                    {profile.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-[#6347f9] text-white p-2 rounded-full cursor-pointer shadow-lg transform translate-x-1/4 translate-y-1/4 active:scale-95 transition-transform">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
            <p className="text-gray-500 text-sm mt-1">{profile.email}</p>

            {/* Stats Card - Mobile */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-3 flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{profile.tripsCount ?? 0}</div>
                <div className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">CHUYẾN ĐI</div>
              </div>
              <div className="w-px h-6 bg-gray-100"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{profile.placesCount ?? 0}</div>
                <div className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">ĐỊA ĐIỂM</div>
              </div>
            </div>

            <Button
              onClick={() => navigate('/profile/edit', { state: { mode: 'edit' } })}
              variant="outline"
              className="mt-6 rounded-full px-8 h-10 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 bg-white shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5 mr-2" /> Chỉnh sửa hồ sơ
            </Button>
          </div>

          {/* Menu Sections */}
          <div className="px-6 py-8 space-y-6">
            <div>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Tài khoản</h3>
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <MenuRow
                  icon={<User className="text-blue-500 w-5 h-5" />}
                  label="Thông tin cá nhân"
                  onClick={() => navigate('/profile/edit')}
                />

              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Ứng dụng</h3>
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                {/* Notification Settings - chỉ hiển thị trong PWA */}
                {isPWA && (
                  <div className="p-4 border-b border-gray-50">
                    <NotificationSettings showCard={false} />
                  </div>
                )}

                {/* Mobile Change Password */}
                <button
                  onClick={() => setIsPasswordDialogOpen(true)}
                  className="w-full p-4 flex items-center justify-between active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><Lock className="w-5 h-5" /></div>
                    <span className="font-semibold text-gray-700">Đổi mật khẩu</span>
                  </div>
                  <Settings className="w-4 h-4 text-gray-300 transform rotate-[-90deg]" />
                </button>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full h-14 rounded-2xl bg-white border border-red-50 text-red-500 font-bold flex items-center justify-center gap-2 mt-4 active:bg-red-50 shadow-sm"
            >
              <LogOut className="w-5 h-5" /> Đăng xuất tài khoản
            </Button>

            <div className="text-center pb-8 pt-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Goouty v2.4.0 (PWA)</p>
            </div>
          </div>
        </AnimatedTransition>

        {/* Change Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="w-screen h-screen max-w-full m-0 rounded-none border-none p-0 gap-0 [&>button]:hidden flex flex-col bg-[#F7F7FF]">
            <form onSubmit={handleChangePassword} className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsPasswordDialogOpen(false)}
                  className="text-gray-500 text-base font-normal h-auto p-0 hover:bg-transparent"
                >
                  Hủy
                </Button>
                <DialogTitle className="text-lg font-bold">Đổi mật khẩu</DialogTitle>
                <Button
                  type="submit"
                  disabled={changingPassword}
                  variant="ghost"
                  className="text-[#6347f9] text-base font-bold h-auto p-0 hover:bg-transparent hover:text-[#5136db]"
                >
                  {changingPassword ? '...' : 'Xong'}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                  {profile?.hasPassword && (
                    <div className="space-y-2">
                      <Label>Mật khẩu hiện tại</Label>
                      <Input
                        type="password"
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="h-12 rounded-xl border border-gray-200 bg-white focus:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors duration-200"
                      />
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
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="h-12 rounded-xl border border-gray-200 bg-white focus:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Xác nhận mật khẩu mới</Label>
                    <Input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="h-12 rounded-xl border border-gray-200 bg-white focus:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors duration-200"
                    />
                  </div>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-4 pb-24 px-4">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Card */}
          <div className="bg-white rounded-[32px] shadow-xl overflow-hidden relative group">
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
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-[6px] border-white shadow-xl bg-white overflow-hidden relative">
                    {profile.profilePicture ? (
                      <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#f0f9ff] flex items-center justify-center text-4xl font-bold text-[#6347f9]">
                        {profile.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 bg-[#6347f9] text-white p-2 rounded-full cursor-pointer hover:bg-[#5136db] shadow-md transition-all">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>

                <div className="text-center md:text-left pt-2 md:pt-4">
                  <h1 className="text-3xl font-bold text-slate-900">{profile.fullName}</h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-medium mt-1">
                    <span>Việt Nam</span>
                  </div>
                </div>
              </div>

              {/* Stats Card - Right */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-50 px-6 py-3 flex items-center gap-5 z-10 md:mt-8">
                <div className="text-center">
                  <div className="text-xl font-black text-slate-900">{profile.tripsCount ?? 0}</div>
                  <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">CHUYẾN ĐI</div>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div className="text-center">
                  <div className="text-xl font-black text-slate-900">{profile.placesCount ?? 0}</div>
                  <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">ĐỊA ĐIỂM</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="rounded-[32px] border-none shadow-xl bg-white overflow-hidden h-full">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Thông tin cá nhân</h2>
                      <p className="text-slate-500 text-sm mt-1">Quản lý thông tin hồ sơ của bạn</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-600 font-medium">
                          <User className="w-4 h-4" /> Họ và tên <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="h-12 rounded-xl bg-slate-50 border-gray-200 focus:border-[#d2cdfe] hover:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-600 font-medium">
                          <Mail className="w-4 h-4" /> Email
                        </Label>
                        <Input
                          value={profile.email}
                          disabled
                          className="h-12 rounded-xl bg-slate-50 border-gray-200 focus:border-[#d2cdfe] hover:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-600 font-medium">
                          <Phone className="w-4 h-4" /> Số điện thoại
                        </Label>
                        <Input
                          placeholder="+84 909 123 456"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          className="h-12 rounded-xl bg-slate-50 border-gray-200 focus:border-[#d2cdfe] hover:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-600 font-medium">
                          <CreditCard className="w-4 h-4" /> Ngân hàng
                        </Label>
                        <BankSearch
                          value={formData.bankId}
                          onChange={(value) => setFormData({ ...formData, bankId: value })}
                          placeholder="Chọn ngân hàng"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-600 font-medium">
                          <CreditCard className="w-4 h-4" /> Số tài khoản
                        </Label>
                        <Input
                          placeholder="Số tài khoản ngân hàng"
                          value={formData.bankNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setFormData({ ...formData, bankNumber: value })
                          }}
                          className="h-12 rounded-xl bg-slate-50 border-gray-200 focus:border-[#d2cdfe] hover:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>


                  </div>

                  {formData.bankId && formData.bankNumber && (
                    <div className="mt-8 bg-slate-50 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8 border border-slate-100">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <img
                          src={`https://img.vietqr.io/image/${formData.bankId}-${formData.bankNumber}-${VIETQR_TEMPLATE}.png`}
                          alt="QR Chuyển khoản"
                          className="w-40 h-auto"
                        />
                      </div>
                      <div className="text-center md:text-left flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">QR Chuyển khoản</h3>
                        <p className="text-slate-500 text-sm mb-3">
                          Quét mã để chuyển khoản nhanh cho <strong>{formData.fullName}</strong>
                        </p>
                        <div className="flex flex-col gap-1">
                          <div className="bg-white px-3 py-2 rounded-lg border border-slate-100 inline-block w-fit">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">NGÂN HÀNG</span>
                            <span className="text-slate-700 font-semibold">{BANKS.find(b => b.code === formData.bankId)?.name || formData.bankId}</span>
                          </div>
                          <div className="bg-white px-3 py-2 rounded-lg border border-slate-100 inline-block w-fit">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">SỐ TÀI KHOẢN</span>
                            <span className="text-slate-700 font-semibold">{formData.bankNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-100">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="px-6 h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-8 h-11 rounded-xl bg-[#6347f9] hover:bg-[#5136db] text-white shadow-lg shadow-purple-200"
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

              <Card className="rounded-[24px] border-none shadow-lg overflow-hidden bg-white">
                <CardContent className="p-6">
                  <div className="font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <Shield className="w-5 h-5 text-[#6347f9]" /> Bảo mật
                  </div>
                  <div className="space-y-2">
                    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-slate-100 hover:bg-slate-50 hover:text-[#6347f9] font-medium text-slate-600">
                          <Lock className="w-4 h-4 mr-3" /> Đổi mật khẩu
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
                              <Input
                                type="password"
                                required
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="h-12 rounded-xl border border-gray-200 bg-white hover:border-[#d2cdfe] focus:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors duration-200"
                              />
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
                            <Input
                              type="password"
                              required
                              minLength={6}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              className="h-12 rounded-xl border border-gray-200 bg-white hover:border-[#d2cdfe] focus:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors duration-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Xác nhận mật khẩu mới</Label>
                            <Input
                              type="password"
                              required
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                              className="h-12 rounded-xl border border-gray-200 bg-white hover:border-[#d2cdfe] focus:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors duration-200"
                            />
                          </div>
                          <DialogFooter className="pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsPasswordDialogOpen(false)}
                              className="hover:bg-transparent hover:text-primary hover:border-primary"
                            >
                              Hủy
                            </Button>
                            <Button
                              type="submit"
                              disabled={changingPassword}
                              className="bg-[#6347f9] hover:bg-[#5136db]"
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
                      className="w-full justify-start h-12 rounded-xl hover:bg-red-50 text-red-500 font-medium hover:text-red-600 mt-2"
                    >
                      <LogOut className="w-4 h-4 mr-3" /> Đăng xuất thiết bị
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AnimatedTransition >
    </div >
  );
};

const MenuRow = ({ icon, label, onClick, value }: { icon: React.ReactNode, label: string, onClick: () => void, value?: string }) => (
  <button
    onClick={onClick}
    className="w-full p-4 flex items-center justify-between border-b border-gray-50 active:bg-gray-50 transition-colors last:border-0"
  >
    <div className="flex items-center gap-3 text-sm">
      <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
      <span className="font-semibold text-gray-700">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs text-gray-400 font-medium">{value}</span>}
      <Settings className="w-4 h-4 text-gray-300 transform rotate-[-90deg]" />
    </div>
  </button>
);

export default Profile;
