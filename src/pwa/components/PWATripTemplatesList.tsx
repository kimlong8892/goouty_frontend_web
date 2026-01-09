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
import { Filter, Check } from 'lucide-react';

interface PWATripTemplatesListProps {
  onUseTemplate?: (template: DATABASE_TYPES.tripTemplates) => void;
  usingTemplate?: boolean;
}

export const PWATripTemplatesList = ({ onUseTemplate, usingTemplate }: PWATripTemplatesListProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<DATABASE_TYPES.tripTemplates[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-background text-foreground">


      {/* Search and Filter - Sticky at top */}

      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 pt-[max(env(safe-area-inset-top),12px)] pb-2 px-4 transition-all duration-200",
        isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
      )}>
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex gap-2">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('template.searchTemplates')}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-11 bg-card shadow-sm border-border focus:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl text-base text-foreground placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Filter Button */}
            <Drawer open={isProvinceDrawerOpen} onOpenChange={setIsProvinceDrawerOpen}>
              <DrawerTrigger asChild>
                <Button
                  size="icon"
                  className={cn(
                    "h-11 w-11 rounded-xl shadow-sm shrink-0",
                    selectedProvince !== 'all'
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-card text-muted-foreground border border-border hover:bg-secondary hover:text-primary"
                  )}
                >
                  <Filter className="w-5 h-5" />
                  {selectedProvince !== 'all' && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background ring-0" />
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh] bg-card border-t border-border">
                <DrawerHeader className="border-b border-border pb-4">
                  <DrawerTitle className="text-center text-foreground">Chọn tỉnh thành</DrawerTitle>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Tìm nhanh tỉnh thành..."
                      value={provinceSearchQuery}
                      onChange={(e) => setProvinceSearchQuery(e.target.value)}
                      className="pl-10 pr-4 bg-secondary border-border focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 h-11 rounded-xl text-foreground transition-all duration-200"
                    />
                  </div>
                </DrawerHeader>
                <div className="overflow-y-auto py-2 px-2 flex-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between h-12 rounded-xl px-4 hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200",
                      selectedProvince === 'all' && "bg-primary/10 text-primary font-bold"
                    )}
                    onClick={() => handleProvinceChange('all')}
                  >
                    <span>{t('template.allProvinces')}</span>
                    {selectedProvince === 'all' && <Check className="w-4 h-4" />}
                  </Button>
                  <div className="h-px bg-border my-1 mx-4" />
                  {filteredProvincesList.map((province) => (
                    <Button
                      key={province.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-between h-12 rounded-xl px-4 font-normal hover:bg-primary hover:text-primary-foreground",
                        selectedProvince === province.id && "bg-primary/10 text-primary font-bold"
                      )}
                      onClick={() => handleProvinceChange(province.id)}
                    >
                      <span>{province.name}</span>
                      {selectedProvince === province.id && <Check className="w-4 h-4" />}
                    </Button>
                  ))}
                  {filteredProvincesList.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      Không tìm thấy tỉnh thành nào
                    </div>
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[max(calc(env(safe-area-inset-top)+60px),70px)]"></div>

      {/* Hero Section - Custom UI */}
      <div className="flex flex-col items-center justify-center pt-2 pb-6 text-center px-4 animate-fade-in">
        <h1 className="text-2xl font-black text-[#6347f9] uppercase tracking-wide mb-3 leading-tight drop-shadow-sm w-full">
          VI VU THẢ GA,<br />KHÔNG LO RẮC RỐI.
        </h1>

        <div className="space-y-1 mb-4">
          <p className="text-muted-foreground font-bold text-sm">
            Nền tảng 2 trong 1
          </p>
          <ul className="text-muted-foreground font-bold text-sm list-none space-y-1">
            <li>• Quản lý lịch trình và Chi phí nhóm.</li>
            <li>• Chia sẻ dễ dàng qua một đường link duy nhất.</li>
          </ul>
        </div>

        <Button
          onClick={() => navigate('/create-trip')}
          className="mb-6 rounded-full bg-[#6347f9] hover:bg-[#5136db] text-white font-bold h-10 px-6 shadow-[0_4px_14px_0_rgba(99,71,249,0.39)] hover:shadow-[0_6px_20px_rgba(99,71,249,0.23)] hover:scale-[1.02] transition-all"
        >
          Bắt đầu hành trình <ChevronRight className="w-4 h-4 ml-1" />
        </Button>


      </div>

      {/* Services Section - KHÁM PHÁ TEMPLATES */}
      <div className="text-center px-4 mb-8 animate-fade-in delay-100">
        <h2 className="text-2xl font-black text-[#6347f9] uppercase tracking-wide mb-3 drop-shadow-sm">
          KHÁM PHÁ TEMPLATES
        </h2>
        <p className="text-muted-foreground font-bold text-sm leading-relaxed max-w-xs mx-auto">
          Duyệt qua và sử dụng các kế hoạch chuyến đi có sẵn để bắt đầu hành trình của bạn ngay lập tức
        </p>
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
      {templates.length === 0 ? (
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
          <div className="grid grid-cols-1 gap-6 mb-8 px-2">
            {templates.map((template) => (
              <TripTemplateCard
                key={template.id}
                template={template}
                onUseTemplate={onUseTemplate}
                usingTemplate={usingTemplate}
              />
            ))}
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
