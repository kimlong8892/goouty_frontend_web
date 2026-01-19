import { checkAndClearCache } from "@/utils/versionCheck";
import { Toaster } from "@/components/ui/toaster.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext.tsx";
import { ThemeProvider } from "@/contexts/ThemeContext.tsx";
import { NotificationCountProvider } from "@/contexts/NotificationCountContext.tsx";
import { PWASimpleLoading } from "@/pwa/components/PWASimpleLoading.tsx";
import { useAppLoading } from "@/hooks/useAppLoading.ts";
import { cn } from "@/lib/utils.ts";
import { usePWA } from "@/pwa/hooks/usePWA";
import { PWAPullToRefresh } from "@/pwa/components/PWAPullToRefresh.tsx";
import { PWANotificationToast } from "@/pwa/components/PWANotificationToast.tsx";
import { PWAAlertNotification } from "@/pwa/components/PWAAlertNotification.tsx";
import { PWANotificationProvider, usePWANotificationContext } from "@/pwa/contexts/PWANotificationContext.tsx";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt.tsx";
import { ScrollToTopButton } from "@/components/ScrollToTopButton.tsx";
import { FeedbackPrompter } from "@/components/common/FeedbackPrompter.tsx";
// Lazy load pages
const Index = lazy(() => import("./pages/Index.tsx"));
const CreateTripPage = lazy(() => import("./pages/CreateTripPage.tsx"));
const PWACreateTripPage = lazy(() => import("@/pwa/pages/PWACreateTripPage.tsx"));
const PWAEditTripPage = lazy(() => import("@/pwa/pages/PWAEditTripPage.tsx"));
const PWAAddDayPage = lazy(() => import("@/pwa/pages/PWAAddDayPage.tsx"));
const PWAEditDayPage = lazy(() => import("@/pwa/pages/PWAEditDayPage.tsx"));
const PWAAddActivityPage = lazy(() => import("@/pwa/pages/PWAAddActivityPage.tsx"));
const PWAEditActivityPage = lazy(() => import("@/pwa/pages/PWAEditActivityPage.tsx"));
const PWAAddExpensePage = lazy(() => import("@/pwa/pages/PWAAddExpensePage.tsx"));
const PWAInviteMemberPage = lazy(() => import("@/pwa/pages/PWAInviteMemberPage.tsx"));
const PWAChangePasswordPage = lazy(() => import("@/pwa/pages/PWAChangePasswordPage.tsx"));
const TemplateDetailsPage = lazy(() => import("./pages/TemplateDetailsPage.tsx"));
const PWATemplateDetailsPage = lazy(() => import("@/pwa/pages/PWATemplateDetailsPage.tsx"));
const PWAWishlistPage = lazy(() => import("@/pwa/pages/PWAWishlistPage.tsx"));
const WishlistPage = lazy(() => import("./pages/WishlistPage.tsx"));
const PWAForgotPasswordPage = lazy(() => import("@/pwa/pages/PWAForgotPasswordPage.tsx"));
const PWATermsPage = lazy(() => import("@/pwa/pages/PWATermsPage.tsx"));
const PWAPrivacyPage = lazy(() => import("@/pwa/pages/PWAPrivacyPage.tsx"));
const PWAAboutPage = lazy(() => import("@/pwa/pages/PWAAboutPage.tsx"));
const MyTripsPage = lazy(() => import("./pages/MyTripsPage.tsx"));
const PWATripListPage = lazy(() => import("@/pwa/pages/PWATripListPage.tsx"));
const TripDetailsPage = lazy(() => import("./pages/TripDetailsPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const EditProfile = lazy(() => import("./pages/EditProfile.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage.tsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));
const GoogleCallbackPage = lazy(() => import("./pages/GoogleCallbackPage.tsx"));
const JoinTripPage = lazy(() => import("./pages/JoinTripPage.tsx").then(m => ({ default: m.JoinTripPage })));
const ChromePWATestPage = lazy(() => import("@/pwa/pages/ChromePWATestPage.tsx"));
const InviteAcceptPage = lazy(() => import("./pages/InviteAcceptPage.tsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.tsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.tsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const BlogPage = lazy(() => import("./pages/BlogPage.tsx"));
const TermsPage = lazy(() => import("./pages/TermsPage.tsx"));

import Navbar from "./components/Navbar.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { Footer } from "./components/landing/Footer.tsx";

import { queryClient } from "@/lib/queryClient";

// Page transition wrapper
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  useEffect(() => {
    // Check if we should skip scroll to top (e.g. when returning from an edit page)
    if ((location.state as any)?.skipScrollTop) return;
    window.scrollTo(0, 0);
  }, [location.pathname, location.state]);

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
  // But allow the root path ('/') in PWA mode so users can see the Landing Screen
  if ((isPWA && location.pathname !== '/') || forceWebAuth) {
    if (!isAuthenticated) {
      // Encode the current location including search params to redirect back after login
      const from = location.pathname + location.search;
      return <Navigate to="/auth" state={{ from }} replace />;
    }
  }

  // If not PWA and not forced, or if authenticated, render children
  return <>{children}</>;
};

const WishlistRoute = () => {
  const { isPWA } = usePWA();
  return isPWA ? <PWAWishlistPage /> : <WishlistPage />;
};

const ForgotPasswordRoute = () => {
  const { isPWA } = usePWA();
  return isPWA ? <PWAForgotPasswordPage /> : <ForgotPasswordPage />;
};


const AppRoutes = () => {
  return (
    <Suspense fallback={<PWASimpleLoading />}>
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
          path="/pwa-add-day/:tripId"
          element={
            <AuthGuard>
              <PageTransition>
                <PWAAddDayPage />
              </PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/pwa-edit-day/:dayId"
          element={
            <AuthGuard>
              <PageTransition>
                <PWAEditDayPage />
              </PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/pwa-add-activity/:dayId"
          element={
            <AuthGuard>
              <PageTransition>
                <PWAAddActivityPage />
              </PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/pwa-edit-activity/:activityId"
          element={
            <AuthGuard>
              <PageTransition>
                <PWAEditActivityPage />
              </PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/pwa-add-expense/:tripId"
          element={
            <AuthGuard>
              <PageTransition>
                <PWAAddExpensePage />
              </PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/pwa-invite-member/:tripId"
          element={
            <AuthGuard>
              <PageTransition>
                <PWAInviteMemberPage />
              </PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/pwa-change-password"
          element={
            <AuthGuard>
              <PageTransition>
                <PWAChangePasswordPage />
              </PageTransition>
            </AuthGuard>
          }
        />
        <Route
          path="/pwa-terms"
          element={
            <PageTransition>
              <PWATermsPage />
            </PageTransition>
          }
        />
        <Route
          path="/pwa-privacy"
          element={
            <PageTransition>
              <PWAPrivacyPage />
            </PageTransition>
          }
        />
        <Route
          path="/pwa-about"
          element={
            <PageTransition>
              <PWAAboutPage />
            </PageTransition>
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
              <ForgotPasswordRoute />
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
          path="/wishlist"
          element={
            <AuthGuard forceWebAuth>
              <PageTransition>
                <WishlistRoute />
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
          path="/blog"
          element={
            <PageTransition>
              <BlogPage />
            </PageTransition>
          }
        />
        <Route
          path="/terms"
          element={
            <PageTransition>
              <TermsPage />
            </PageTransition>
          }
        />
        <Route
          path="/about"
          element={
            <PageTransition>
              <AboutPage />
            </PageTransition>
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
    </Suspense>
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
      "min-h-screen flex flex-col animate-fade-in bg-background",
      isMobileView ? "pb-24 min-h-dvh" : "" // Add bottom padding and dynamic viewport height for Mobile/PWA
    )}>
      {/* PWA Alert Notification - positioned above navbar */}
      <PWAAlertNotification />
      <Navbar />
      <PWAPullToRefresh>
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
      </PWAPullToRefresh>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    checkAndClearCache();
  }, []);

  return (
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
                <FeedbackPrompter />
              </TooltipProvider>
            </PWANotificationProvider>
          </NotificationCountProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;