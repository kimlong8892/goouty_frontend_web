import { Toaster } from "@/components/ui/toaster.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext.tsx";
import { ThemeProvider } from "@/contexts/ThemeContext.tsx";
import { NotificationCountProvider } from "@/contexts/NotificationCountContext.tsx";
import { PWASimpleLoading } from "@/pwa/components/PWASimpleLoading.tsx";
import { useAppLoading } from "@/hooks/useAppLoading.ts";
import { cn } from "@/lib/utils.ts";
import { usePWA } from "@/pwa/hooks/usePWA";
import { PWANotificationToast } from "@/pwa/components/PWANotificationToast.tsx";
import { PWAAlertNotification } from "@/pwa/components/PWAAlertNotification.tsx";
import { PWANotificationProvider, usePWANotificationContext } from "@/pwa/contexts/PWANotificationContext.tsx";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt.tsx";
import { ScrollToTopButton } from "@/components/ScrollToTopButton.tsx";
import Index from "./pages/Index.tsx";
import CreateTripPage from "./pages/CreateTripPage.tsx";
import PWACreateTripPage from "@/pwa/pages/PWACreateTripPage.tsx";
import PWAEditTripPage from "@/pwa/pages/PWAEditTripPage.tsx";
import TemplateDetailsPage from "./pages/TemplateDetailsPage.tsx";
import PWATemplateDetailsPage from "@/pwa/pages/PWATemplateDetailsPage.tsx";


import MyTripsPage from "./pages/MyTripsPage.tsx";
import PWATripListPage from "@/pwa/pages/PWATripListPage.tsx";
import TripDetailsPage from "./pages/TripDetailsPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import Profile from "./pages/Profile.tsx";
import EditProfile from "./pages/EditProfile.tsx";
import Settings from "./pages/Settings.tsx";
import NotificationsPage from "./pages/NotificationsPage.tsx";
import Navbar from "./components/Navbar.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { Footer } from "./components/landing/Footer.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import GoogleCallbackPage from "./pages/GoogleCallbackPage.tsx";
import { JoinTripPage } from "./pages/JoinTripPage.tsx";
import ChromePWATestPage from "@/pwa/pages/ChromePWATestPage.tsx";
import InviteAcceptPage from "./pages/InviteAcceptPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";

import { queryClient } from "@/lib/queryClient";

// Page transition wrapper
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="transition-opacity duration-300 animate-fade-in">
      {children}
    </div>
  );
};

// Authentication Guard Component
const AuthGuard = ({ children, forceWebAuth = false }: { children: React.ReactNode; forceWebAuth?: boolean }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isPWA } = usePWA();
  const location = useLocation();

  // Still loading auth, show loading
  if (isLoading) {
    return <PWASimpleLoading />;
  }

  // If (it's PWA) OR (it's web but we explicitly want to force auth)
  if (isPWA || forceWebAuth) {
    if (!isAuthenticated) {
      // Encode the current location including search params to redirect back after login
      const from = location.pathname + location.search;
      return <Navigate to="/auth" state={{ from }} replace />;
    }
  }

  // If not PWA and not forced, or if authenticated, render children
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthGuard>
            <PageTransition>
              <Index />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/create-trip"
        element={
          <AuthGuard forceWebAuth>
            <PageTransition>
              <CreateTripPage />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/pwa-create-trip"
        element={
          <AuthGuard>
            <PageTransition>
              <PWACreateTripPage />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/pwa-edit-trip/:id"
        element={
          <AuthGuard>
            <PageTransition>
              <PWAEditTripPage />
            </PageTransition>
          </AuthGuard>
        }
      />


      <Route
        path="/my-trips"
        element={
          <AuthGuard forceWebAuth>
            <PageTransition>
              <MyTripsPage />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/pwa-trips"
        element={
          <AuthGuard>
            <PageTransition>
              <PWATripListPage />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/trip/:id"
        element={
          <AuthGuard forceWebAuth>
            <PageTransition>
              <TripDetailsPage />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/trip/:id/:shareToken"
        element={
          <PageTransition>
            <JoinTripPage />
          </PageTransition>
        }
      />
      <Route
        path="/invite"
        element={
          <PageTransition>
            <InviteAcceptPage />
          </PageTransition>
        }
      />
      <Route
        path="/auth"
        element={
          <PageTransition>
            <AuthPage />
          </PageTransition>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PageTransition>
            <ForgotPasswordPage />
          </PageTransition>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PageTransition>
            <ResetPasswordPage />
          </PageTransition>
        }
      />
      <Route
        path="/auth/google/callback"
        element={
          <PageTransition>
            <GoogleCallbackPage />
          </PageTransition>
        }
      />
      <Route
        path="/profile"
        element={
          <AuthGuard forceWebAuth>
            <PageTransition>
              <Profile />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <AuthGuard forceWebAuth>
            <PageTransition>
              <EditProfile />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/notifications"
        element={
          <AuthGuard forceWebAuth>
            <PageTransition>
              <NotificationsPage />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthGuard forceWebAuth>
            <PageTransition>
              <Settings />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/chrome-pwa-test"
        element={
          <PageTransition>
            <ChromePWATestPage />
          </PageTransition>
        }
      />
      <Route
        path="/template/:id"
        element={
          <AuthGuard forceWebAuth>
            <PageTransition>
              <TemplateDetailsPage />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="/pwa-template-details/:id"
        element={
          <AuthGuard>
            <PageTransition>
              <PWATemplateDetailsPage />
            </PageTransition>
          </AuthGuard>
        }
      />
      <Route
        path="*"
        element={
          <PageTransition>
            <NotFound />
          </PageTransition>
        }
      />
    </Routes>
  );
};

const AppContent = () => {
  const { isLoading, isPWA } = useAppLoading();
  const { isPWA: isPWAMode } = usePWA();

  // Only show loading screen for PWA
  if (isLoading && isPWA) {
    return <PWASimpleLoading />;
  }

  // Show app for both web and PWA after loading
  return (
    <>
      <BrowserRouter>
        <AppContentWithRouter isPWAMode={isPWAMode} />
      </BrowserRouter>

      {/* PWA Notification Toast - positioned at bottom */}
      <PWANotificationToast />
    </>
  );
};

const AppContentWithRouter = ({ isPWAMode }: { isPWAMode: boolean }) => {
  const isMobile = useIsMobile();
  const isMobileView = isPWAMode || isMobile;
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className={cn(
      "min-h-screen flex flex-col animate-fade-in bg-[#edeeff]",
      isMobileView ? "pb-24 min-h-dvh" : "" // Add bottom padding and dynamic viewport height for Mobile/PWA
    )}>
      {/* PWA Alert Notification - positioned above navbar */}
      <PWAAlertNotification />
      <Navbar />
      <main className="flex-1">
        <AppRoutes />
      </main>
      {/* Only show Footer if not in Mobile/PWA mode */}
      {!isMobileView && (
        <>
          <Footer />
          <ScrollToTopButton />
        </>
      )}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <NotificationCountProvider>
          <PWANotificationProvider>
            <TooltipProvider delayDuration={100}>
              <Toaster />
              <Sonner />
              <AppContent />
              <PWAInstallPrompt />
            </TooltipProvider>
          </PWANotificationProvider>
        </NotificationCountProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;