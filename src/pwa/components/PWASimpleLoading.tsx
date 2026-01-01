import React from 'react';

export const PWASimpleLoading: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center overflow-hidden">
      {/* Background Blobs removed for cleaner look */}

      <div className="text-center relative z-10 px-6">
        {/* Logo with Pulse Animation */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-28 h-28 mb-6 relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow"></div>
            <img
              src="/footer_badge_mascot.png"
              alt="Goouty Mascot"
              className="w-28 h-28 object-contain drop-shadow-2xl relative z-10 animate-float"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-3">
            Goouty
          </h1>
          <p className="text-muted-foreground text-base">
            Lên kế hoạch chuyến đi, chia tiền nhóm
          </p>
        </div>

        {/* Modern Spinner */}
        <div className="flex flex-col items-center justify-center gap-4 animate-slide-up animation-delay-1000">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20"></div>
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-transparent border-t-primary absolute inset-0"></div>
          </div>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">
            Đang tải...
          </p>
        </div>
      </div>
    </div>
  );
};
