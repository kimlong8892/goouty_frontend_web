import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { BankSearch } from '@/components/BankSearch.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { api } from '@/integrations/api/client.ts';
import { toast } from 'sonner';
import { usePWA } from '@/pwa/hooks/usePWA';
import {
  Camera,
  Settings,
  LogOut,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  User,
  Pencil,
  Shield,
  Globe,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { notificationService } from '@/services/notificationService';

interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  bankId?: string;
  bankNumber?: string;
  createdAt: string;
  updatedAt: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const showContent = useAnimateIn(false, 300);
  const { user, logout } = useAuth();
  const { isPWA } = usePWA();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notification States
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    bankId: '',
    bankNumber: '',
    address: 'Cà Mau, Vietnam' // Mock address as it's not in base profile yet
  });

  // Stats Mock
  const stats = {
    trips: 12,
    places: 28,
    rating: 4.9
  };

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
        setFormData(prev => ({
          ...prev,
          fullName: profileData.fullName || '',
          phoneNumber: profileData.phoneNumber || '',
          bankId: profileData.bankId || '',
          bankNumber: profileData.bankNumber || ''
        }));

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
      setFormData(prev => ({
        ...prev,
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        bankId: profile.bankId || '',
        bankNumber: profile.bankNumber || ''
      }));
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
    setPushEnabled(checked);
    try {
      // If turning ON, might need permission request logic here, keeping it simple for UI demo
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
      setPushEnabled(!checked); // revert on error
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c5dd3]"></div>
      </div>
    );
  }

  if (!profile) return null;

  const isMobileView = isPWA || (window.innerWidth < 768);

  // --- MOBILE / PWA LAYOUT ---
  if (isMobileView) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] pb-24">
        <AnimatedTransition show={showContent} animation="fade">
          {/* Header Section */}
          <div className="bg-white px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm border-b border-gray-100 flex flex-col items-center">
            <div className="relative mb-4 group">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 ring-1 ring-purple-100">
                {profile.profilePicture ? (
                  <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#6c5dd3] to-[#8c7df0] flex items-center justify-center text-3xl font-bold text-white uppercase">
                    {profile.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-[#6c5dd3] text-white p-2 rounded-full cursor-pointer shadow-lg transform translate-x-1/4 translate-y-1/4 active:scale-95 transition-transform">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
            <p className="text-gray-500 text-sm mt-1">{profile.email}</p>

            <div className="flex gap-2 mt-4">
              <Badge className="bg-purple-100 text-[#6c5dd3] hover:bg-purple-100 border-none font-semibold px-3 py-1">
                Thành viên Vàng
              </Badge>
              <Badge className="bg-green-100 text-green-600 hover:bg-green-100 border-none font-semibold px-3 py-1">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Đã xác thực
              </Badge>
            </div>

            <Button
              onClick={() => navigate('/profile/edit')}
              variant="outline"
              className="mt-6 rounded-full px-8 h-10 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 bg-white shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5 mr-2" /> Chỉnh sửa hồ sơ
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="mx-6 -mt-5 bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex justify-around items-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.trips}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Chuyến đi</div>
            </div>
            <div className="w-[1px] h-8 bg-gray-100"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.places}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Địa điểm</div>
            </div>
            <div className="w-[1px] h-8 bg-gray-100"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.rating}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đánh giá</div>
            </div>
          </div>

          {/* Menu Sections */}
          <div className="px-6 py-8 space-y-6">
            {/* Account Settings */}
            <div>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Tài khoản</h3>
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <MenuRow
                  icon={<User className="text-blue-500 w-5 h-5" />}
                  label="Thông tin cá nhân"
                  onClick={() => navigate('/profile/edit')}
                />
                <MenuRow
                  icon={<CreditCard className="text-green-500 w-5 h-5" />}
                  label="Thông tin thanh toán"
                  onClick={() => navigate('/profile/edit')}
                />
                <MenuRow
                  icon={<Shield className="text-purple-500 w-5 h-5" />}
                  label="Bảo mật & Mật khẩu"
                  onClick={() => { }}
                />
              </div>
            </div>

            {/* Application Settings */}
            <div>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Ứng dụng</h3>
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 rounded-xl text-yellow-600"><Bell className="w-5 h-5" /></div>
                    <span className="font-semibold text-gray-700">Thông báo đẩy</span>
                  </div>
                  <Switch checked={pushEnabled} onCheckedChange={handleTogglePush} className="data-[state=checked]:bg-[#6c5dd3]" />
                </div>
                <MenuRow
                  icon={<Globe className="text-sky-500 w-5 h-5" />}
                  label="Ngôn ngữ"
                  value="Tiếng Việt"
                  onClick={() => { }}
                />
              </div>
            </div>

            {/* Logout */}
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
      </div>
    );
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50/20 pt-4 pb-24 px-4">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* --- HEADER PROFILE CARD --- */}
          <div className="bg-white rounded-[32px] shadow-xl overflow-hidden relative group">
            {/* Cover Image */}
            <div className="h-48 md:h-64 bg-gradient-to-r from-violet-900 to-fuchsia-900 relative">
              <img
                src="https://images.unsplash.com/photo-1762090326569-f3c698bee480?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwYWJzdHJhY3QlMjB0cmF2ZWwlMjBsYW5kc2NhcGUlMjBncmFkaWVudCUyMHB1cnBsZXxlbnwxfHx8fDE3NjU4OTUzMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Cover"
                className="w-full h-full object-cover border-none"
              />        </div>

            <div className="px-6 md:px-10 pb-8 flex flex-col md:flex-row items-end md:items-center justify-between relative mt-[-60px] md:mt-[-40px]">
              <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full md:w-auto">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-[6px] border-white shadow-xl bg-white overflow-hidden relative">
                    {profile.profilePicture ? (
                      <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#f0f9ff] flex items-center justify-center text-4xl font-bold text-[#6c5dd3]">
                        {profile.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 bg-[#6c5dd3] text-white p-2 rounded-full cursor-pointer hover:bg-[#5b4ec2] shadow-md transition-all">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>

                {/* Name Info */}
                <div className="text-center md:text-left pt-2 md:pt-12">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h1 className="text-3xl font-bold text-slate-900">{profile.fullName}</h1>
                    <Badge variant="secondary" className="bg-sky-100 text-sky-600 hover:bg-sky-200 border-transparent rounded-md px-2 font-semibold text-[10px] uppercase tracking-wide">
                      Verified
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-medium mt-1">
                    <span>Travel Enthusiast</span>
                    <span>•</span>
                    <span>Việt Nam</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-8 md:mt-12 flex gap-8 md:gap-12 bg-slate-50/80 backdrop-blur-sm px-8 py-4 rounded-2xl border border-slate-100/50 shadow-sm mx-auto md:mx-0">
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-900">{stats.trips}</div>
                  <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Trips</div>
                </div>
                <div className="text-center border-l border-slate-200 pl-8">
                  <div className="text-2xl font-black text-slate-900">{stats.places}</div>
                  <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Places</div>
                </div>
                <div className="text-center border-l border-slate-200 pl-8">
                  <div className="text-2xl font-black text-slate-900 flex items-center justify-center gap-1">
                    {stats.rating}
                  </div>
                  <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* --- GRID CONTENT --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COLUMN: Personal Info */}
            <div className="lg:col-span-2">
              <Card className="rounded-[32px] border-none shadow-xl bg-white overflow-hidden h-full">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Thông tin cá nhân</h2>
                      <p className="text-slate-500 text-sm mt-1">Quản lý thông tin hồ sơ của bạn</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#6c5dd3]">
                      <Pencil className="w-5 h-5" />
                    </Button>
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
                          className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-[#6c5dd3]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-600 font-medium">
                          <Mail className="w-4 h-4" /> Email
                        </Label>
                        <Input
                          value={profile.email}
                          disabled
                          className="h-12 rounded-xl bg-slate-50/50 border-transparent text-slate-500"
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
                          className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-[#6c5dd3]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-600 font-medium">
                          <MapPin className="w-4 h-4" /> Địa chỉ
                        </Label>
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-[#6c5dd3]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold border-t pt-8 border-slate-100">
                        <CreditCard className="w-5 h-5 text-slate-400" /> Thông tin thanh toán
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ngân hàng</Label>
                          <BankSearch
                            value={formData.bankId}
                            onChange={(value) => setFormData({ ...formData, bankId: value })}
                            placeholder="Chọn ngân hàng"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số tài khoản</Label>
                          <Input
                            value={formData.bankNumber}
                            onChange={(e) => setFormData({ ...formData, bankNumber: e.target.value })}
                            className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-[#6c5dd3]"
                            placeholder="0000 0000 0000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

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
                      className="px-8 h-11 rounded-xl bg-[#6c5dd3] hover:bg-[#5b4ec2] text-white shadow-lg shadow-purple-200"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Widgets */}
            <div className="space-y-6">
              {/* Notifications */}
              <Card className="rounded-[24px] border-none shadow-lg overflow-hidden">
                <div className="bg-[#6c5dd3] px-6 py-4 flex items-center justify-between">
                  <div className="text-white font-bold flex items-center gap-2">
                    <Bell className="w-5 h-5" /> Cài đặt thông báo
                  </div>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Push Notifications</div>
                      <div className="text-xs text-slate-500 mt-1">Nhận thông báo về chuyến đi</div>
                    </div>
                    <Switch checked={pushEnabled} onCheckedChange={handleTogglePush} className="data-[state=checked]:bg-[#6c5dd3]" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">Email Updates</div>
                      <div className="text-xs text-slate-500 mt-1">Nhận tin tức khuyến mãi</div>
                    </div>
                    <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} className="data-[state=checked]:bg-[#6c5dd3]" />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="rounded-[24px] border-none shadow-lg overflow-hidden bg-white">
                <CardContent className="p-6">
                  <div className="font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <Shield className="w-5 h-5 text-[#6c5dd3]" /> Bảo mật
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-slate-100 hover:bg-slate-50 hover:text-[#6c5dd3] font-medium text-slate-600">
                      <Globe className="w-4 h-4 mr-3" /> Đổi mật khẩu
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-slate-100 hover:bg-slate-50 hover:text-[#6c5dd3] font-medium text-slate-600">
                      <CheckCircle2 className="w-4 h-4 mr-3" /> Xác thực 2 bước
                    </Button>
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

              {/* Membership Card */}
              <div className="rounded-[24px] bg-[#2e2b5e] p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="w-32 h-32 rotate-12" />
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center mb-4 text-yellow-400 border border-yellow-400/50">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Thành viên Vàng</h3>
                <p className="text-white/60 text-xs mb-6 mt-1">Bạn đã hoàn thành 10+ chuyến đi trong năm nay.</p>

                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <div className="bg-yellow-400 h-2 rounded-full w-[70%]" />
                </div>
                <div className="flex justify-end text-[10px] font-bold text-white/80">
                  700 / 1000 điểm
                </div>
              </div>

            </div>

          </div>
        </div>
      </AnimatedTransition>
    </div>
  );
};

// --- HELPER COMPONENTS ---
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
