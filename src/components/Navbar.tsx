import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plane, LogIn, Search, Upload, User, Settings, LogOut, Map, Plus, List, Users, MapPin, Home, Bell } from 'lucide-react';
import { useRippleEffect } from '@/lib/animations.ts';
import { cn } from '@/lib/utils.ts';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import AuthModal from '@/components/AuthModal.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { NotificationBell } from '@/components/notifications/NotificationBell';
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
                "relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                "hover:bg-primary/10 hover:text-primary",
                active ? "bg-primary/10 text-primary" : "text-foreground/80"
              )}
            >
              <span className={cn(
                "transition-all duration-300",
                active ? "text-primary" : "text-foreground/60"
              )}>
                {icon}
              </span>
              <span className="font-medium">{label}</span>
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
              "relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
              "bg-primary hover:bg-primary/90",
              "text-white font-medium shadow-md hover:shadow-lg",
              "overflow-hidden flex-shrink-0"
            )}
            onClick={(e) => {
              handleRipple(e);
              onClick();
            }}
          >
            <span className="text-white">
              {icon}
            </span>
            <span className="font-medium">{label}</span>
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
            "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300",
            "hover:bg-gray-100",
            "overflow-hidden flex-shrink-0",
            active ? "bg-gray-100" : "bg-transparent"
          )}
          onClick={(e) => {
            handleRipple(e);
            onClick();
          }}
        >
          <span className="transition-all duration-300 text-gray-600">
            {icon}
          </span>
          <span className="font-medium text-gray-700 text-sm">{label}</span>
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
            active ? "bg-primary/10 text-primary" : "text-foreground/80",
            isHighlighted && "bg-primary text-primary-foreground shadow-lg scale-105",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleClick}
        >
          <span className={cn(
            "transition-all duration-300 text-xl flex items-center justify-center",
            active ? "text-primary" : "text-foreground/60",
            isHighlighted && "text-primary-foreground"
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
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-primary">
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
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-primary">
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
        return '';
      case '/profile/edit':
        return '';
      case '/settings':
        return 'Cài đặt';
      case '/templates':
        return 'Mẫu chuyến đi';
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
    } else if (path === '/create-trip') {
      setActive('create-trip');
    } else if (path === '/templates') {
      setActive('templates');
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
  };

  const GooutySubmenu = [
    {
      to: '/',
      icon: <Home size={18} />,
      label: 'Trang chủ',
      id: 'home',
    },
    { to: '/create-trip', icon: <Plus size={18} />, label: 'Tạo chuyến đi', id: 'create-trip' },
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
          {/* Top header for Mobile/PWA - minimal with logo and actions */}
          <header className="sticky top-0 z-50 w-full px-4 py-2 bg-transparent border-b border-gray-200/50 mb-2">
            <nav className="flex items-center justify-between max-w-6xl mx-auto h-12">
              <div className="flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2">
                  <img src="/footer_badge_mascot.png" alt="Goouty" className="w-10 h-10 object-contain" />
                  {pageTitle && !isHomePage && (
                    <h1 className="text-lg font-bold text-gray-900 truncate max-w-[180px]">
                      {pageTitle}
                    </h1>
                  )}
                </Link>
              </div>

              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-8 h-8 rounded-full overflow-hidden border border-gray-200"
                    >
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </button>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" onClick={handleGoToAuth} className="text-primary font-semibold">
                    Đăng nhập
                  </Button>
                )}
              </div>
            </nav>
          </header>

          {/* Bottom Navigation for Mobile/PWA - Only show when authenticated */}
          {isAuthenticated && (
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#edeeff]/90 backdrop-blur-lg px-4 py-2 pb-8 border-t border-gray-200/50">
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
              "bg-white/80 backdrop-blur-md shadow-lg border border-gray-100/50"
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
                {/* Profile item with user info */}
                {isAuthenticated && user && (
                  <div
                    className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-[#f3f4f6] hover:bg-gray-200 transition-colors cursor-pointer"
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
                          <span className="text-sm font-semibold text-white">
                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 hidden md:inline">
                        {user?.fullName || 'User'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notification Bell */}
                {isAuthenticated && (
                  <div className="relative">
                    <NotificationBell />
                  </div>
                )}

                {isAuthenticated ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={logout}
                      >
                        <LogOut size={18} className="text-gray-600" />
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
          </div>
        </header>
      </TooltipProvider>

      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} />
    </>
  );
};

export default Navbar;