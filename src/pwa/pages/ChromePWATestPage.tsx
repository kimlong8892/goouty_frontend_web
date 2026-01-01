import React from 'react';
import { ChromePWAStatus } from '@/pwa/components/ChromePWAStatus.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Chrome, Download, Smartphone, Monitor, Star, Zap, Wifi } from 'lucide-react';
import { usePWA } from '@/pwa/hooks/usePWA';

const ChromePWATestPage: React.FC = () => {
  const { isPWA } = usePWA();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl mb-4 shadow-xl relative">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl"></div>
            <Chrome className="w-10 h-10 text-white relative z-10" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-3">
            Goouty Chrome PWA Test
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Kiểm tra và trải nghiệm các tính năng PWA được tối ưu hóa cho Chrome
          </p>
        </div>

        {/* PWA Status Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <ChromePWAStatus />

          <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                PWA Features Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-gray-200/50">
                  <span className="font-semibold text-gray-700">Service Worker</span>
                  <Badge variant={navigator.serviceWorker ? 'default' : 'destructive'} className="shadow-sm">
                    {navigator.serviceWorker ? 'Active' : 'Not Available'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-gray-200/50">
                  <span className="font-semibold text-gray-700">Push Notifications</span>
                  <Badge variant={'PushManager' in window ? 'default' : 'destructive'} className="shadow-sm">
                    {'PushManager' in window ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-gray-200/50">
                  <span className="font-semibold text-gray-700">Background Sync</span>
                  <Badge variant={'BackgroundSyncManager' in window ? 'default' : 'destructive'} className="shadow-sm">
                    {'BackgroundSyncManager' in window ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-gray-200/50">
                  <span className="font-semibold text-gray-700">File System Access</span>
                  <Badge variant={'FileSystemAccess' in window ? 'default' : 'destructive'} className="shadow-sm">
                    {'FileSystemAccess' in window ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Installation Instructions */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-600" />
              Hướng dẫn cài đặt Chrome PWA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                  <Smartphone className="w-4 h-4 text-primary" />
                  Trên Mobile Chrome
                </h4>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li>1. Mở Chrome trên điện thoại</li>
                  <li>2. Truy cập trang web Goouty</li>
                  <li>3. Nhấn vào menu (⋮) ở góc phải</li>
                  <li>4. Chọn "Cài đặt ứng dụng"</li>
                  <li>5. Xác nhận cài đặt</li>
                </ol>
              </div>

              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                  <Monitor className="w-4 h-4 text-primary" />
                  Trên Desktop Chrome
                </h4>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li>1. Mở Chrome trên máy tính</li>
                  <li>2. Truy cập trang web Goouty</li>
                  <li>3. Nhấn vào biểu tượng cài đặt trong thanh địa chỉ</li>
                  <li>4. Chọn "Cài đặt Goouty"</li>
                  <li>5. Xác nhận cài đặt</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Features */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              Test PWA Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                onClick={() => {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      alert(`Service Workers: ${registrations.length}`);
                    });
                  }
                }}
              >
                <Wifi className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">Test Service Worker</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                onClick={() => {
                  if ('Notification' in window) {
                    Notification.requestPermission().then(permission => {
                      alert(`Notification Permission: ${permission}`);
                    });
                  }
                }}
              >
                <Zap className="w-6 h-6 text-accent" />
                <span className="text-sm font-medium">Test Notifications</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                onClick={() => {
                  if ('share' in navigator) {
                    navigator.share({
                      title: 'Goouty PWA',
                      text: 'Check out this amazing travel planning app!',
                      url: window.location.href
                    }).catch(console.error);
                  } else {
                    alert('Web Share API not supported');
                  }
                }}
              >
                <Download className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium">Test Share API</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg">
          <CardHeader>
            <CardTitle>Trạng thái hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-gray-200/50">
                <div className="text-3xl font-bold mb-2">
                  {isPWA ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-700 font-medium">PWA Installed</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-gray-200/50">
                <div className="text-3xl font-bold mb-2">
                  ✅
                </div>
                <div className="text-sm text-gray-700 font-medium">Always Connected</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-gray-200/50">
                <div className="text-3xl font-bold mb-2">
                  {navigator.serviceWorker ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-700 font-medium">Service Worker</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-gray-200/50">
                <div className="text-3xl font-bold mb-2">
                  {'PushManager' in window ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-700 font-medium">Push API</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChromePWATestPage;
