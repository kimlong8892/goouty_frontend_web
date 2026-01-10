import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plane, LogIn, Search, Upload, User, Settings, LogOut, Map, Plus, List, Users, MapPin, Home, Bell, CloudOff } from 'lucide-react';
import { useRippleEffect } from '@/lib/animations.ts';
import { cn } from '@/lib/utils.ts';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import AuthModal from '@/components/AuthModal.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SyncStatus } from '@/components/SyncStatus.tsx';
import { useOfflineStatus } from '@/lib/offline/OfflineManager';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu.tsx";
import { TooltipProvider } from '@/components/ui/tooltip.tsx';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { PWAInstallButton } from '@/pwa/components/PWAInstallButton';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  hasSubmenu?: boolean;
  children?: React.ReactNode;
  isPWAMode?: boolean;
  isPrimary?: boolean;
}

const NavItem = ({ to, icon, label, active, onClick, hasSubmenu, children, isPWAMode, isPrimary }: NavItemProps) => {
  const handleRipple = useRippleEffect();

  if (hasSubmenu) {
    return (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={cn(
                "relative flex items-center gap-3 px-5 py-3 rounded-lg transition-all duration-300",
                "hover:bg-primary/10 hover:text-primary text-base",
                active ? "bg-primary/10 text-primary" : "text-foreground/80"
              )}
            >
              <span className={cn(
                "transition-all duration-300",
                active ? "text-primary" : "text-foreground/60"
              )}>
                {icon}
              </span>
              <span className="font-semibold">{label}</span>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[200px] gap-1 p-2">
                {children}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  }

  // Primary button style (purple gradient for Trang chủ)
  if (isPrimary) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={to}
            className={cn(
              "relative flex items-center gap-2.5 px-6 py-2.5 rounded-full transition-all duration-300",
              "bg-[#6347f9] hover:bg-[#5136db]",
              "text-white font-bold shadow-md hover:shadow-lg",
              "overflow-hidden flex-shrink-0 text-base"
            )}
            onClick={(e) => {
              handleRipple(e);
              onClick();
            }}
          >
            <span className="text-white">
              {icon}
            </span>
            <span>{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          className={cn(
            "relative flex items-center gap-2.5 px-5 py-2.5 rounded-lg transition-all duration-300 group",
            "hover:bg-primary/10 dark:hover:bg-white/10",
            "overflow-hidden flex-shrink-0",
            active ? "bg-primary/10 dark:bg-white/10" : "bg-transparent text-base"
          )}
          onClick={(e) => {
            handleRipple(e);
            onClick();
          }}
        >
          <span className="transition-all duration-300 text-gray-500 group-hover:text-primary dark:text-slate-400 dark:group-hover:text-white">
            {icon}
          </span>
          <span className="font-semibold text-gray-700 group-hover:text-primary dark:text-slate-300 dark:group-hover:text-white transition-colors">{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const PWANavItem = ({ to, icon, label, active, onClick, isHighlighted, disabled }: NavItemProps & { isHighlighted?: boolean, disabled?: boolean }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={disabled ? '#' : to}
          className={cn(
            "relative flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-300",
            "hover:bg-primary/10 hover:text-primary",
            "overflow-hidden flex-shrink-0 min-w-0",
            active ? "bg-primary text-primary-foreground" : "text-foreground/80",
            isHighlighted && "shadow-lg scale-105",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleClick}
        >
          <span className={cn(
            "transition-all duration-300 text-xl flex items-center justify-center",
            active ? "text-primary-foreground" : "text-foreground/60",
            isHighlighted && active && "text-primary-foreground"
          )}>
            {icon}
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const SubMenuItem = ({ to, icon, label, active, onClick }: NavItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-300",
        active ? "bg-primary/10 text-primary" : ""
      )}
      onClick={onClick}
    >
      <span className={cn(
        "transition-all duration-300",
        active ? "text-primary" : "text-foreground/60"
      )}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

const ProfileNavItem = ({ user, active, onClick, isPWAMode }: { user: any, active: boolean, onClick: () => void, isPWAMode?: boolean }) => {
  if (isPWAMode) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/profile"
            className={cn(
              "relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-accent/50",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={onClick}
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center overflow-hidden",
              active ? "bg-white/20" : "bg-primary/10"
            )}>
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={cn(
                  "text-xs font-medium",
                  active ? "text-white" : "text-primary"
                )}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Hồ sơ</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{user?.fullName || 'Hồ sơ'}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      to="/profile"
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-accent/50",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center overflow-hidden",
          active ? "bg-white/20" : "bg-primary/10"
        )}>
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={cn(
              "text-xs font-medium",
              active ? "text-white" : "text-primary"
            )}>
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        {/* Hide name on mobile, show only on md and larger screens */}
        <span className="hidden md:inline text-xs font-medium" style={{ whiteSpace: 'nowrap' }}>{user?.fullName || 'Hồ sơ'}</span>
      </div>
    </Link>
  );
};

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, logout, user, isLoading } = useAuth();
  const { isOnline, pendingCount } = useOfflineStatus();
  const { isPWA } = usePWA();
  const isMobile = useIsMobile();
  const isMobileView = isPWA || isMobile;

  // Get current page title based on location
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/my-trips':
        return 'Chuyến đi của tôi';
      case '/pwa-trips':
        return 'Chuyến đi của tôi';
      case '/create-trip':
        return 'Tạo chuyến đi';
      case '/notifications':
        return 'Thông báo';
      case '/profile':
        return 'Trang cá nhân';
      case '/profile/edit':
        return '';
      case '/settings':
        return 'Cài đặt';

      default:
        return '';
    }
  };

  const pageTitle = getPageTitle();
  const isHomePage = location.pathname === '/';

  const handleGoToAuth = () => {
    navigate('/auth');
  };

  const handleOpenAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Auto-detect active menu based on current URL
  useEffect(() => {
    const path = location.pathname;

    if (path === '/') {
      setActive('home');
    } else if (path === '/my-trips') {
      setActive('my-trips');
    } else if (path === '/pwa-trips') {
      setActive('pwa-trips');
    } else if (path === '/profile') {
      setActive('profile');
    } else if (path === '/settings') {
      setActive('settings');
    } else if (path === '/create-trip' || path === '/pwa-create-trip') {
      setActive('create-trip');

    } else if (path === '/auth') {
      setActive('login');
    }
    else {
      // For trip details pages, keep current active or default to home
      setActive(prev => prev || 'home');
    }
  }, [location.pathname]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;

      if (!isPWA) {
        // Web: Only handle top nav scroll effect
        setIsScrolled(scrollTop > 10);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPWA]);

  const handleNavItemClick = (id: string) => {
    setActive(id);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const GooutySubmenu = [
    {
      to: '/',
      icon: <Home size={18} />,
      label: 'Trang chủ',
      id: 'home',
    },
    ...(isAuthenticated ? [{ to: '/create-trip', icon: <Plus size={18} />, label: 'Tạo chuyến đi', id: 'create-trip' }] : []),
  ];

  const authNavItems = [
    { to: '/my-trips', icon: <List size={20} />, label: 'Chuyến đi của tôi', id: 'my-trips' },
  ];

  // PWA Navigation Items
  const pwaNavItems = [
    { to: '/', icon: <Home size={24} />, label: 'Trang chủ', id: 'home' },
    { to: '/pwa-trips', icon: <List size={24} />, label: 'Chuyến đi của tôi', id: 'pwa-trips' },
    { to: '/pwa-create-trip', icon: <Plus size={24} />, label: 'Tạo', id: 'create-trip', isHighlighted: true },
    { to: '/notifications', icon: <Bell size={24} />, label: 'Thông báo', id: 'notifications' },
    { to: '/profile', icon: user?.profilePicture ? <img src={user.profilePicture} alt="Avatar" className="w-6 h-6 rounded-full" /> : <User size={24} />, label: 'Hồ sơ', id: 'profile' },
  ];

  const navItems = isAuthenticated ? authNavItems : [];

  // Mobile & PWA Navigation
  if (isMobileView) {
    return (
      <>
        <TooltipProvider>
          {/* Top header for Mobile/PWA - removed for cleaner UI */}

          {/* Top banner for offline status on mobile */}
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 z-[60] bg-destructive text-destructive-foreground text-[10px] py-1 text-center font-bold shadow-md animate-in fade-in slide-in-from-top duration-300">
              Bạn đang ngoại tuyến
            </div>
          )}


          {/* Bottom Navigation for Mobile/PWA - Only show when authenticated */}
          {isAuthenticated && (
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg px-4 py-2 pb-8 border-t border-border/50">
              <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
                <div className="pointer-events-auto">
                  {/* Removed SyncStatus icon from PWA nav as requested */}
                </div>
              </div>
              <div className="flex items-center justify-around max-w-6xl mx-auto">
                {pwaNavItems.map((item) => (
                  <PWANavItem
                    key={item.id}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    active={active === item.id}
                    onClick={() => handleNavItemClick(item.id)}
                    isHighlighted={item.isHighlighted}
                  />
                ))}
              </div>
            </nav>
          )}
        </TooltipProvider>

        <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} />
      </>
    );
  }

  // Web Navigation (original)
  return (
    <>
      <TooltipProvider>
        <header className="sticky top-0 z-50 w-full py-4 bg-transparent">
          <div className="max-w-7xl mx-auto px-4">
            <nav className={cn(
              "flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300",
              "bg-card/80 backdrop-blur-md shadow-lg border border-border/50"
            )}>
              {/* Left side - Logo and main nav */}
              <div className="flex items-center gap-3">
                {/* Goouty menu items - displayed directly */}
                {GooutySubmenu.map((item: any) => (
                  <NavItem
                    key={item.id}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    active={active === item.id}
                    onClick={() => handleNavItemClick(item.id)}
                    isPrimary={active === item.id}
                  />
                ))}

                {/* Other nav items */}
                {navItems.map((item) => (
                  <NavItem
                    key={item.id}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    active={active === item.id}
                    onClick={() => handleNavItemClick(item.id)}
                    isPrimary={active === item.id}
                  />
                ))}
              </div>

              {/* Right side - User actions */}
              <div className="flex items-center gap-3">
                {/* PWA Install Button */}
                <PWAInstallButton
                  variant="outline"
                  className="hidden md:flex rounded-full border-primary/20 hover:bg-primary/5 text-primary"
                />

                {/* Profile item with user info */}
                {isAuthenticated && user && (
                  <div
                    className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
                    onClick={() => {
                      handleNavItemClick('profile');
                      navigate('/profile');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center overflow-hidden">
                        {user?.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-primary-foreground">
                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-foreground hidden md:inline">
                        {user?.fullName || 'User'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Sync Status - Removed as requested to use the offline banner instead */}
                {/* {isAuthenticated && <SyncStatus />} */}

                {/* Notification Bell */}
                {isAuthenticated && (
                  <div className="relative">
                    <NotificationBell />
                  </div>
                )}

                <ThemeToggle />

                {isAuthenticated ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 rounded-lg hover:bg-primary hover:text-primary-foreground group transition-colors"
                        onClick={() => {
                          logout();
                          navigate('/auth');
                        }}
                      >
                        <LogOut size={18} className="text-gray-600 group-hover:text-primary-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Đăng xuất</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                        onClick={handleGoToAuth}
                      >
                        <LogIn size={18} className="mr-2" />
                        Đăng nhập
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Đăng nhập</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </nav>

            {/* Offline Banner for Web View */}
            {!isOnline && (
              <div className="mt-4 mx-auto max-w-fit px-6 py-1.5 rounded-full bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-xs font-bold shadow-lg animate-in slide-in-from-top duration-300 flex items-center gap-2">
                <CloudOff size={14} />
                Bạn đang ngoại tuyến. Các thay đổi sẽ được đồng bộ khi có mạng.
              </div>
            )}
          </div>
        </header>
      </TooltipProvider>

      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} />
    </>
  );
};

export default Navbar;