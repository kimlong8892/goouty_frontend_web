import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { api } from '@/integrations/api/client';
import { TripTemplateCard } from '@/components/TripTemplateCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, MapPin, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PWAInstallButton } from './PWAInstallButton';
import { cn } from '@/lib/utils.ts';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Filter, Check, SlidersHorizontal, Bell, Map as MapIcon, Coffee, Utensils, ShoppingBag, FerrisWheel } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationCountContext } from '@/contexts/NotificationCountContext';
import { PWAMasonryCard } from './PWAMasonryCard';

// Add CSS to hide scrollbar
const style = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

interface PWATripTemplatesListProps {
  onUseTemplate?: (template: DATABASE_TYPES.tripTemplates) => void;
  usingTemplate?: boolean;
}

export const PWATripTemplatesList = ({ onUseTemplate, usingTemplate }: PWATripTemplatesListProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { unreadCount } = useNotificationCountContext();
  const [templates, setTemplates] = useState<DATABASE_TYPES.tripTemplates[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [provinces, setProvinces] = useState<DATABASE_TYPES.provinces[]>([]);
  const [isProvinceDrawerOpen, setIsProvinceDrawerOpen] = useState(false);
  const [provinceSearchQuery, setProvinceSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { toast } = useToast();
  const hasMoreTemplates = pagination.page < pagination.totalPages;
  const hasActiveFilters = searchTerm || (selectedProvince && selectedProvince !== 'all');
  const [restoreScrollY, setRestoreScrollY] = useState<number | null>(null);

  // Ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreTemplates && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMoreTemplates, loadingMore]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Load initial data
  useEffect(() => {
    loadInitialData();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter when province changes (keep automatic for dropdowns)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasSearched) {
        handleSearch();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedProvince, hasSearched]);


  // Save state on unmount
  useEffect(() => {
    return () => {
      const scrollY = window.scrollY;
      sessionStorage.setItem('pwa_templates_scroll_y', scrollY.toString());
      sessionStorage.setItem('pwa_templates_pagination', JSON.stringify(pagination));
    };
  }, [pagination]);

  // Handle scroll restoration
  useEffect(() => {
    if (restoreScrollY !== null && templates.length > 0) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: restoreScrollY,
          behavior: 'auto'
        });

        setTimeout(() => {
          // Retry if execution context wasn't ready
          if (Math.abs(window.scrollY - restoreScrollY) > 50) {
            window.scrollTo({
              top: restoreScrollY,
              behavior: 'auto'
            });
          }
          setRestoreScrollY(null);
          sessionStorage.removeItem('pwa_templates_scroll_y');
          sessionStorage.removeItem('pwa_templates_pagination');
        }, 100);
      });
    }
  }, [templates, restoreScrollY]);

  // Load initial data with potential restoration
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load provinces independently
      try {
        const provincesResponse = await api.provinces.getAll();
        setProvinces(Array.isArray(provincesResponse) ? provincesResponse : []);
      } catch (provinceError) {
        console.error('Error loading provinces:', provinceError);
        // Don't fail the whole initialization if only provinces fail, 
        // but templates might still load.
      }

      // Check for saved state
      const savedPaginationStr = sessionStorage.getItem('pwa_templates_pagination');
      const savedScrollYStr = sessionStorage.getItem('pwa_templates_scroll_y');

      let initialLimit = pagination.limit;
      let initialPage = 1;

      if (savedPaginationStr) {
        const savedPagination = JSON.parse(savedPaginationStr);
        if (savedPagination.page > 1) {
          initialPage = savedPagination.page;
          initialLimit = savedPagination.page * savedPagination.limit;
        }
      }

      // Load templates
      try {
        const templatesResponse = await api.tripTemplates.getPublic({
          page: 1,
          limit: initialLimit
        });

        setTemplates(Array.isArray(templatesResponse.templates) ? templatesResponse.templates : []);

        setPagination({
          ...templatesResponse.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 },
          page: initialPage,
          limit: pagination.limit
        });
      } catch (templateError) {
        console.error('Error loading templates:', templateError);
        setTemplates([]);
      }

      // Restore Scroll
      if (savedScrollYStr) {
        setRestoreScrollY(parseInt(savedScrollYStr));
      }

    } catch (error) {
      console.error('General error in loadInitialData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await api.tripTemplates.getPublic({
        search: searchTerm || undefined,
        provinceId: selectedProvince !== 'all' ? selectedProvince : undefined,
        page: 1,
        limit: pagination.limit
      });

      setTemplates(Array.isArray(response.templates) ? response.templates : []);
      setPagination(response.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error searching templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || pagination.page >= pagination.totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = pagination.page + 1;
      const response = await api.tripTemplates.getPublic({
        search: searchTerm || undefined,
        provinceId: selectedProvince !== 'all' ? selectedProvince : undefined,
        page: nextPage,
        limit: pagination.limit
      });

      const newTemplates = Array.isArray(response.templates) ? response.templates : [];
      setTemplates(prev => [...prev, ...newTemplates]);
      setPagination(prev => ({
        ...prev,
        page: nextPage,
        total: response.pagination?.total || prev.total,
        totalPages: response.pagination?.totalPages || prev.totalPages,
      }));
    } catch (error) {
      console.error('Error loading more templates:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setHasSearched(true);
  };

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setHasSearched(true);
    setIsProvinceDrawerOpen(false);
    setProvinceSearchQuery('');
  };

  const filteredProvincesList = provinces.filter(p =>
    p.name.toLowerCase().includes(provinceSearchQuery.toLowerCase())
  );



  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProvince('all');
    setHasSearched(false);
    loadInitialData();
  };



  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t('template.loadingTemplates')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto bg-background text-foreground pb-20">
      <style>{style}</style>

      {/* Profile and Notification Header - Restored */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarImage src={user?.profilePicture} alt={user?.fullName || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {(user?.fullName || 'G').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm font-medium flex items-center gap-1">
                {t('common.greeting', { defaultValue: 'Xin chào' })}, {user?.fullName?.split(' ')[0] || t('common.guest', { defaultValue: 'Bạn' })} <span className="animate-wave">👋</span>
              </span>
              <h1 className="text-xl font-bold text-foreground leading-tight">
                {t('template.whereToGo', { defaultValue: 'Where do you want to go?' })}
              </h1>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-border bg-card shadow-sm relative group hover:bg-secondary transition-all"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="w-6 h-6 text-foreground group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-card shadow-sm animate-[pulse_2s_infinite]" />
            )}
          </Button>
        </div>
      </div>

      {/* Sticky Top Search Bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-5 h-5" />
          <Input
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-12 pr-4 h-12 bg-secondary/50 border-none rounded-full text-base placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium"
          />
        </div>
      </div>

      <div className="px-4">
        {/* Near You Header */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <h2 className="text-2xl font-bold text-foreground">Mẫu chuyến đi</h2>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide no-scrollbar -mx-4 px-4">
          {[
            { id: 'all', name: 'Tất cả', icon: null },
            { id: 'food', name: 'Ăn uống', icon: <Utensils size={16} /> },
            { id: 'coffee', name: 'Cà phê', icon: <Coffee size={16} /> },
            { id: 'shopping', name: 'Mua sắm', icon: <ShoppingBag size={16} /> },
            { id: 'attractions', name: 'Tham quan', icon: <FerrisWheel size={16} /> }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>
      </div>


      {/* Results summary if filtering */}
      {hasActiveFilters && templates.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t('template.templatesFound', { count: templates.length })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-primary hover:bg-primary/10 h-8 font-semibold"
          >
            {t('common.clearFilters')}
          </Button>
        </div>
      )}

      {/* Templates Grid */}
      {selectedCategory !== 'all' ? (
        <div className="text-center py-20 px-4">
          <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Sắp ra mắt</h3>
          <p className="text-muted-foreground text-sm max-w-[240px] mx-auto">
            Chưa có mẫu chuyến đi nào cho danh mục này. Hãy quay lại sau nhé!
          </p>
          <Button
            variant="link"
            className="mt-4 text-primary font-bold"
            onClick={() => setSelectedCategory('all')}
          >
            Quay lại tất cả
          </Button>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('template.noTemplates')}</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? t('template.noTemplatesDescription')
              : t('template.noTemplatesAvailable')
            }
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              {t('common.clearFilters')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-4 px-4">
            {/* Column 1: Indices 0, 1, 2... but we want to stagger them */}
            <div className="flex-1 flex flex-col gap-4">
              {templates.map((template, index) => {
                // Column 1 gets indices 0, 2, 4...
                if (index % 2 !== 0) return null;
                return (
                  <PWAMasonryCard
                    key={template.id}
                    template={template}
                    index={index}
                  />
                );
              })}
            </div>
            {/* Column 2: Indices 1, 3, 5... */}
            <div className="flex-1 flex flex-col gap-4">
              {templates.map((template, index) => {
                // Column 2 gets indices 1, 3, 5...
                if (index % 2 === 0) return null;
                return (
                  <PWAMasonryCard
                    key={template.id}
                    template={template}
                    index={index}
                  />
                );
              })}
            </div>
          </div>

          {/* Infinite Scroll Sentinel */}
          {hasMoreTemplates && (
            <div ref={loadMoreRef} className="flex justify-center py-6 min-h-[60px]">
              {loadingMore && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>{t('common.loadingMore')}</span>
                </div>
              )}
            </div>
          )}

          {/* End of results */}
          {!hasMoreTemplates && templates.length > 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {t('common.endOfList')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
