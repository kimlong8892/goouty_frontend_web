import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';

import { BankSearch, BANKS } from '@/components/BankSearch.tsx';

import { useAuth } from '@/contexts/AuthContext.tsx';
import { api } from '@/integrations/api/client.ts';
import { toast } from 'sonner';
import { usePWA } from '@/pwa/hooks/usePWA';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload.tsx';
import { ChevronLeft, Pencil } from 'lucide-react';

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

const VIETQR_TEMPLATE = 'compact';

const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showContent = useAnimateIn(false, 300);
  const { user } = useAuth();
  const { isPWA } = usePWA();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(location.state?.mode === 'edit');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    bankId: '',
    bankNumber: ''
  });

  // Set page title
  useEffect(() => {
    document.title = isEditing ? 'Chỉnh sửa thông tin - Goouty' : 'Thông tin cá nhân - Goouty';
  }, [isEditing]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await api.get<UserProfile>('/users/profile');
        setProfile(data);
        setFormData({
          fullName: data.fullName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          bankId: data.bankId || '',
          bankNumber: data.bankNumber || ''
        });
      } catch (error: any) {
        toast.error('Không thể tải thông tin hồ sơ');
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updateData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        bankId: formData.bankId.trim() === '' ? null : formData.bankId || null,
        bankNumber: formData.bankNumber.trim() === '' ? null : formData.bankNumber || null
      };

      console.log('Updating profile with data:', updateData);
      const updatedProfile = await api.put<UserProfile>('/users/profile', updateData);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('Cập nhật thông tin thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật hồ sơ');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureChange = async (file: File) => {
    try {
      // Upload the file using new API
      const response = await api.users.uploadAvatar(file);

      // Update local profile state
      setProfile(prev => prev ? { ...prev, profilePicture: response.data.user.profilePicture } : null);
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật ảnh đại diện');
      console.error('Error uploading profile picture:', error);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      // Delete avatar using new API
      const response = await api.users.deleteAvatar();

      // Update local profile state
      setProfile(prev => prev ? { ...prev, profilePicture: null } : null);
      toast.success('Xóa ảnh đại diện thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa ảnh đại diện');
      console.error('Error deleting avatar:', error);
    }
  };

  const handleBack = () => {
    if (isEditing) {
      // Reset form data to profile data
      if (profile) {
        setFormData({
          fullName: profile.fullName || '',
          email: profile.email || '',
          phoneNumber: profile.phoneNumber || '',
          bankId: profile.bankId || '',
          bankNumber: profile.bankNumber || ''
        });
      }
      setIsEditing(false);
    } else {
      navigate('/profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-gray-500">Đang tải hồ sơ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <div className="text-center pt-20">
          <p className="text-gray-500">Không thể tải thông tin hồ sơ</p>
        </div>
      </div>
    );
  }

  // PWA Layout
  if (isPWA) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        <AnimatedTransition show={showContent} animation="slide-up">
          {/* Content */}
          <div>
            {isEditing ? (
              // EDIT MODE
              <>
                <div className="sticky top-0 z-50 flex-shrink-0 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-4">
                  <div className="flex items-center justify-between relative">
                    <button
                      onClick={handleBack}
                      className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-secondary/80 text-foreground transition-all active:scale-95 touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <h2 className="text-lg font-bold text-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max">
                      Chỉnh sửa thông tin
                    </h2>

                    <div className="w-8"></div> {/* Spacer for balance */}
                  </div>
                </div>

                <div className="px-5 py-6 flex flex-col min-h-[calc(100vh-80px)]">
                  <div className="flex-1">
                    <div className="text-center mb-10">
                      <ProfilePictureUpload
                        currentImage={profile.profilePicture}
                        onImageChange={handleProfilePictureChange}
                        onImageDelete={handleDeleteAvatar}
                        userName={profile.fullName}
                        size="lg"
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-base text-muted-foreground/80 font-normal pl-1">
                          Tên
                        </Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="bg-card border-border/60 shadow-sm rounded-xl h-14 px-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                          placeholder="Nhập tên của bạn"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base text-muted-foreground/80 font-normal pl-1">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="bg-card/50 border-border/60 rounded-xl h-14 px-4 text-muted-foreground/70"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-base text-muted-foreground/80 font-normal pl-1">
                          Số điện thoại
                        </Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setFormData({ ...formData, phoneNumber: value });
                          }}
                          className="bg-card border-border/60 shadow-sm rounded-xl h-14 px-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                          placeholder="Nhập số điện thoại"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base text-muted-foreground/80 font-normal pl-1">
                          Ngân hàng
                        </Label>
                        <div className="bg-card border border-border/60 shadow-sm rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                          <BankSearch
                            value={formData.bankId}
                            onChange={(value) => setFormData({ ...formData, bankId: value })}
                            placeholder="Tìm kiếm ngân hàng..."
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankNumber" className="text-base text-muted-foreground/80 font-normal pl-1">
                          Số tài khoản
                        </Label>
                        <Input
                          id="bankNumber"
                          type="tel"
                          value={formData.bankNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setFormData({ ...formData, bankNumber: value });
                          }}
                          className="bg-card border-border/60 shadow-sm rounded-xl h-14 px-4 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                          placeholder="Nhập số tài khoản"
                        />
                      </div>

                      {/* Live QR Code Preview */}
                      {formData.bankId && formData.bankNumber && (
                        <div className="mt-8 bg-white dark:bg-card border border-border/60 shadow-sm rounded-2xl p-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                          <p className="text-xs font-extra-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.15em] mb-6">Mã QR Chuyển khoản</p>
                          <div className="bg-white p-3 rounded-xl border border-gray-100 dark:border-border shadow-sm mb-4">
                            <img
                              src={`https://img.vietqr.io/image/${formData.bankId}-${formData.bankNumber}-${VIETQR_TEMPLATE}.png`}
                              alt="QR Chuyển khoản"
                              className="w-[180px] h-[180px] object-contain rounded-lg"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-foreground">
                            <span>{BANKS.find(b => b.code === formData.bankId)?.name || formData.bankId}</span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span>{formData.bankNumber}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sticky bottom-4 mt-10 z-10 w-full">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving || !formData.fullName.trim()}
                      className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Đang cập nhật...</span>
                        </div>
                      ) : (
                        'Cập nhật'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // VIEW MODE
              <div className="space-y-4 px-4 py-6 pb-24">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-border shadow-sm">
                    {profile.profilePicture ? (
                      <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#f0f9ff] flex items-center justify-center text-3xl font-bold text-primary">
                        {profile.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{profile.fullName}</h2>

                  {/* Edit Button below Name */}
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="mt-4 px-8 h-10 rounded-full border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/10 bg-white dark:bg-white/5 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Chỉnh sửa thông tin
                  </Button>
                </div>

                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden text-sm">
                  <div className="p-4 border-b border-border last:border-0 flex justify-between items-center bg-secondary/30 transition-colors">
                    <span className="text-muted-foreground font-medium">Email</span>
                    <span className="text-foreground font-medium max-w-[200px] truncate" title={profile.email}>{profile.email}</span>
                  </div>

                  <div className="p-4 border-b border-border last:border-0 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Số điện thoại</span>
                    <span className="text-foreground font-medium">{profile.phoneNumber || '---'}</span>
                  </div>
                  <div className="p-4 border-b border-border last:border-0 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Ngân hàng</span>
                    <span className="text-foreground font-medium">
                      {BANKS.find(b => b.code === profile.bankId)?.name || profile.bankId || '---'}
                    </span>
                  </div>
                  <div className="p-4 border-b border-border last:border-0 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Số tài khoản</span>
                    <span className="text-foreground font-medium">{profile.bankNumber || '---'}</span>
                  </div>
                </div>

                {profile.bankId && profile.bankNumber && (
                  <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col items-center mt-4">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Mã QR Chuyển khoản</p>
                    <div className="bg-white p-2 rounded-xl border border-border shadow-sm">
                      <img
                        src={`https://img.vietqr.io/image/${profile.bankId}-${profile.bankNumber}-${VIETQR_TEMPLATE}.png`}
                        alt="QR Chuyển khoản"
                        className="w-full max-w-[280px] h-auto rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      {BANKS.find(b => b.code === profile.bankId)?.name} - {profile.bankNumber}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </AnimatedTransition>
      </div>
    );
  }

  // WEB Layout
  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-16">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-3xl font-bold">{isEditing ? 'Chỉnh sửa thông tin' : 'Thông tin cá nhân'}</h1>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Pencil className="w-4 h-4" /> Chỉnh sửa
              </Button>
            )}
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border p-8">
            {isEditing ? (
              // WEB EDIT MODE
              <>
                <div className="text-center mb-8">
                  <ProfilePictureUpload
                    currentImage={profile.profilePicture}
                    onImageChange={handleProfilePictureChange}
                    onImageDelete={handleDeleteAvatar}
                    userName={profile.fullName}
                    size="lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-700 font-medium">Tên</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="h-12 bg-slate-50 border-gray-200 rounded-xl text-black focus:border-[#d2cdfe] hover:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200"
                        placeholder="Nhập tên của bạn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="h-12 bg-slate-50 border-gray-200 rounded-xl text-gray-500 focus:border-[#d2cdfe] hover:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-gray-700 font-medium">Số điện thoại</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({ ...formData, phoneNumber: value });
                        }}
                        className="h-12 bg-slate-50 border-gray-200 rounded-xl text-black focus:border-[#d2cdfe] hover:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200"
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Ngân hàng</Label>
                      <BankSearch
                        value={formData.bankId}
                        onChange={(value) => setFormData({ ...formData, bankId: value })}
                        placeholder="Tìm kiếm ngân hàng..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankNumber" className="text-gray-700 font-medium">Số tài khoản</Label>
                      <Input
                        id="bankNumber"
                        type="tel"
                        value={formData.bankNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({ ...formData, bankNumber: value });
                        }}
                        className="h-12 bg-slate-50 border-gray-200 rounded-xl text-black focus:border-[#d2cdfe] hover:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200"
                        placeholder="Nhập số tài khoản"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="h-11 rounded-xl border-border dark:border-gray-700 bg-transparent text-muted-foreground dark:text-slate-400 hover:bg-secondary dark:hover:bg-gray-800 hover:text-foreground dark:hover:text-white transition-all px-6"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving || !formData.fullName.trim()}
                    className="px-6 h-11 bg-primary hover:bg-primary/90"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </>
            ) : (
              // WEB VIEW MODE
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="col-span-1 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-gray-100 pb-8 lg:pb-0 lg:pr-12">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-slate-50 shadow-lg">
                    {profile.profilePicture ? (
                      <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#f0f9ff] flex items-center justify-center text-4xl font-bold text-primary">
                        {profile.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 text-center">{profile.fullName}</h2>
                  <p className="text-gray-500 text-center mt-1">{profile.email}</p>
                </div>

                <div className="col-span-1 lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                      <p className="text-lg font-medium text-gray-900 truncate" title={profile.email}>{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Số điện thoại</p>
                      <p className="text-lg font-medium text-gray-900">{profile.phoneNumber || '---'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Thành viên từ</p>
                      <p className="text-lg font-medium text-gray-900">{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-8">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                      Thông tin thanh toán
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Ngân hàng</p>
                        <p className="text-lg font-medium text-gray-900">
                          {BANKS.find(b => b.code === profile.bankId)?.name || profile.bankId || '---'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Số tài khoản</p>
                        <p className="text-lg font-medium text-gray-900">{profile.bankNumber || '---'}</p>
                      </div>
                    </div>
                  </div>

                  {profile.bankId && profile.bankNumber && (
                    <div className="mt-4 bg-slate-50 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <img
                          src={`https://img.vietqr.io/image/${profile.bankId}-${profile.bankNumber}-${VIETQR_TEMPLATE}.png`}
                          alt="QR Chuyển khoản"
                          className="w-48 h-auto"
                        />
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">QR Chuyển khoản nhanh</h3>
                        <p className="text-gray-500 text-sm max-w-xs mb-2">
                          Sử dụng ứng dụng ngân hàng của bạn để quét mã QR này và thực hiện chuyển khoản một cách nhanh chóng.
                        </p>
                        <p className="text-sm font-medium text-primary">
                          {BANKS.find(b => b.code === profile.bankId)?.name} - {profile.bankNumber}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default EditProfile;
