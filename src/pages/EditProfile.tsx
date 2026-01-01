import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { BankSearch } from '@/components/BankSearch.tsx';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { api } from '@/integrations/api/client.ts';
import { toast } from 'sonner';
import { usePWA } from '@/pwa/hooks/usePWA';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload.tsx';

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

const EditProfile = () => {
  const navigate = useNavigate();
  const showContent = useAnimateIn(false, 300);
  const { user } = useAuth();
  const { isPWA } = usePWA();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    bankId: '',
    bankNumber: ''
  });
  
  // Set page title
  useEffect(() => {
    document.title = 'Chỉnh sửa thông tin - Goouty';
  }, []);

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
      navigate('/profile');
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
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
      <div className="min-h-screen bg-white">
        <AnimatedTransition show={showContent} animation="slide-up">
          {/* Header */}
          <div className="fixed top-0 left-0 right-0 z-10 bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <button 
                onClick={() => navigate('/profile')}
                className="text-gray-600 font-medium hover:text-gray-800 transition-colors"
              >
                Hủy
              </button>
              <h1 className="text-lg font-semibold text-black">Chỉnh sửa thông tin</h1>
              <button 
                onClick={handleSaveProfile}
                disabled={saving || !formData.fullName.trim()}
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors disabled:opacity-50"
              >
                Xong
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-4 py-6 pt-20">
            {/* Profile Picture */}
            <div className="text-center mb-8">
              <ProfilePictureUpload
                currentImage={profile.profilePicture}
                onImageChange={handleProfilePictureChange}
                onImageDelete={handleDeleteAvatar}
                userName={profile.fullName}
                size="lg"
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-black font-semibold">Tên</Label>
                <Input 
                  id="fullName" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="bg-gray-100 border-gray-300 rounded-lg h-12 text-black"
                  placeholder="Nhập tên của bạn"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black font-semibold">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100 border-gray-300 rounded-lg h-12 text-gray-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-black font-semibold">Số điện thoại</Label>
                <Input 
                  id="phoneNumber" 
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    // Chỉ cho phép nhập số
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({...formData, phoneNumber: value});
                  }}
                  className="bg-gray-100 border-gray-300 rounded-lg h-12 text-black"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-black font-semibold">Ngân hàng</Label>
                <BankSearch
                  value={formData.bankId}
                  onChange={(value) => setFormData({ ...formData, bankId: value })}
                  placeholder="Tìm kiếm ngân hàng..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankNumber" className="text-black font-semibold">Số tài khoản</Label>
                <Input
                  id="bankNumber"
                  type="tel"
                  value={formData.bankNumber}
                  onChange={(e) => {
                    // Chỉ cho phép nhập số
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({...formData, bankNumber: value});
                  }}
                  className="bg-gray-100 border-gray-300 rounded-lg h-12 text-black"
                  placeholder="Nhập số tài khoản"
                />
              </div>
            </div>
          </div>
        </AnimatedTransition>
      </div>
    );
  }

  // WEB Layout (original design)
  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-16">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-8">Chỉnh sửa thông tin</h1>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {/* Profile Picture */}
            <div className="text-center mb-8">
              <ProfilePictureUpload
                currentImage={profile.profilePicture}
                onImageChange={handleProfilePictureChange}
                onImageDelete={handleDeleteAvatar}
                userName={profile.fullName}
                size="lg"
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-700 font-medium">Tên</Label>
                <Input 
                  id="fullName" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="h-12"
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
                  className="h-12 bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-gray-700 font-medium">Số điện thoại</Label>
                <Input 
                  id="phoneNumber" 
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    // Chỉ cho phép nhập số
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({...formData, phoneNumber: value});
                  }}
                  className="h-12"
                  placeholder="Nhập số điện thoại"
                />
              </div>

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
                    // Chỉ cho phép nhập số
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({...formData, bankNumber: value});
                  }}
                  className="h-12"
                  placeholder="Nhập số tài khoản"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8">
              <Button 
                variant="outline"
                onClick={() => navigate('/profile')}
                className="px-6"
              >
                Hủy
              </Button>
              <Button 
                onClick={handleSaveProfile}
                disabled={saving || !formData.fullName.trim()}
                className="px-6"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default EditProfile;
