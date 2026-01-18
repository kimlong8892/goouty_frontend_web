import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Chrome, Download, Smartphone, Monitor, Star, CheckCircle, Zap } from 'lucide-react';
import { usePWA } from '@/pwa/hooks/usePWA';

export const ChromePWAStatus: React.FC = () => {
  const { isPWA } = usePWA();
  const [isChrome, setIsChrome] = useState(false);
  const [chromeVersion, setChromeVersion] = useState<string>('');
  const [pwaFeatures, setPwaFeatures] = useState<string[]>([]);

  useEffect(() => {
    // Detect Chrome browser and version
    const userAgent = navigator.userAgent;
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    
    if (chromeMatch) {
      setIsChrome(true);
      setChromeVersion(chromeMatch[1]);
    }

    // Check PWA features support
    const features = [];
    
    if ('serviceWorker' in navigator) {
      features.push('Service Worker');
    }
    
    if ('PushManager' in window) {
      features.push('Push Notifications');
    }
    
    if ('BackgroundSyncManager' in window) {
      features.push('Background Sync');
    }
    
    if ('PeriodicBackgroundSyncManager' in window) {
      features.push('Periodic Sync');
    }
    
    if ('FileSystemAccess' in window) {
      features.push('File System Access');
    }
    
    if ('WebShare' in navigator) {
      features.push('Web Share API');
    }
    
    if ('Clipboard' in navigator) {
      features.push('Clipboard API');
    }
    
    setPwaFeatures(features);
  }, []);

  if (!isChrome) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Chrome className="w-5 h-5 text-blue-600" />
          Chrome PWA Status
          <Badge variant="secondary" className="ml-auto">
            v{chromeVersion}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Installation Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {isPWA ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Download className="w-5 h-5 text-blue-600" />
            )}
            <span className="font-medium">
              {isPWA ? 'Đã cài đặt' : 'Chưa cài đặt'}
            </span>
          </div>
          {isPWA && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Star className="w-3 h-3 mr-1" />
              PWA Active
            </Badge>
          )}
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            <span className="font-medium">
              Always Connected
            </span>
          </div>
          <Badge variant="default">
            Connected
          </Badge>
        </div>

        {/* Supported Features */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Tính năng được hỗ trợ
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {pwaFeatures.map((feature) => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Platform Support */}
        <div>
          <h4 className="font-medium mb-2">Hỗ trợ nền tảng</h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Mobile</span>
            </div>
            <div className="flex items-center gap-1">
              <Monitor className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Desktop</span>
            </div>
            <div className="flex items-center gap-1">
              <Chrome className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Chrome</span>
            </div>
          </div>
        </div>

        {/* Chrome-specific benefits */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Lợi ích Chrome PWA</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Cài đặt nhanh từ thanh địa chỉ</li>
            <li>• Truy cập nhanh và tiện lợi</li>
            <li>• Thông báo push real-time</li>
            <li>• Trải nghiệm như ứng dụng native</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
