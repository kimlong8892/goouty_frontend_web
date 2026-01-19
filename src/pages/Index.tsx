import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimateIn } from '@/lib/animations.ts';
import { HeroSection } from '@/components/landing/HeroSection.tsx';

import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { TripTemplatesSection } from '@/components/TripTemplatesSection.tsx';
import { PWATripTemplatesList } from '@/pwa/components/PWATripTemplatesList.tsx';
import { LoadingScreen } from '@/components/landing/LoadingScreen.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { api } from '@/integrations/api/client';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useGlobalToast } from '@/utils/globalToast.ts';
import { PWALandingScreen } from '@/pwa/components/PWALandingScreen.tsx';

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [usingTemplate, setUsingTemplate] = useState(false);
  const showHero = useAnimateIn(false, 300);
  const { isPWA } = usePWA();
  const isMobile = useIsMobile();
  const isMobileView = isPWA || isMobile;
  const navigate = useNavigate();
  const { showToast } = useGlobalToast();
  const { isAuthenticated } = useAuth(); // Get auth state

  const handleUseTemplate = async (template: DATABASE_TYPES.tripTemplates) => {
    if (!isAuthenticated) {
      showToast("Vui lòng đăng nhập để sử dụng mẫu này.", "warning");
      navigate('/auth');
      return;
    }

    setUsingTemplate(true);
    try {
      const newTrip = await api.trips.createFromTemplate(template.id, template.title);
      showToast("Đã tạo chuyến đi từ mẫu thành công!", "success");
      // Navigate to the new trip's detail page
      navigate(`/trip/${newTrip.id}`);
    } catch (error) {
      console.error('Error creating trip from template:', error);
      showToast("Không thể tạo chuyến đi từ mẫu. Vui lòng thử lại.", "error");
    } finally {
      setUsingTemplate(false);
    }
  };

  useEffect(() => {
    document.title = 'Goouty - Lên kế hoạch chuyến đi, chia tiền nhóm, không rắc rối';

    // Don't add home-page class in PWA mode to allow scrolling
    // The home-page class prevents scrolling which we don't want for trip templates list
    setLoading(false); // Ensure loading is false

    // Cleanup function
    return () => {
      // No cleanup needed since we're not adding any classes
    };
  }, [isMobileView]);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {isMobileView ? (
        // Mobile/PWA Mode
        !isAuthenticated ? (
          <PWALandingScreen />
        ) : (
          <PWATripTemplatesList
            onUseTemplate={handleUseTemplate}
            usingTemplate={usingTemplate}
          />
        )
      ) : (
        // Web Mode: Show hero + trip templates section
        <>
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
            <div className="flex flex-col h-full">
              <HeroSection showTitle={showHero} />
            </div>
          </div>

          {/* Trip Templates Section */}
          <TripTemplatesSection onUseTemplate={handleUseTemplate} usingTemplate={usingTemplate} />


        </>
      )}
    </div>
  );
};

export default Index;
