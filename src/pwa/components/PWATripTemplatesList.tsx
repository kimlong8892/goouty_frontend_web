import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { api } from '@/integrations/api/client';
import { TripTemplateCard } from '@/components/TripTemplateCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, MapPin } from 'lucide-react';
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

  // Search and filter when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasSearched) {
        handleSearch();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedProvince, hasSearched]);


  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load provinces
      const provincesResponse = await api.provinces.getAll();
      setProvinces(Array.isArray(provincesResponse) ? provincesResponse : []);


      // Load templates
      const templatesResponse = await api.tripTemplates.getPublic({
        page: 1,
        limit: pagination.limit
      });
      setTemplates(Array.isArray(templatesResponse.templates) ? templatesResponse.templates : []);
      setPagination(templatesResponse.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });

    } catch (error) {
      console.error('Error loading initial data:', error);
      setTemplates([]);
      setProvinces([]);
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


      {/* Search and Filter - Sticky at top */}

      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 pt-[max(env(safe-area-inset-top),12px)] pb-2 px-4 transition-all duration-200",
        isScrolled && "bg-white/95 backdrop-blur-md border-b border-gray-100/50 shadow-sm"
      )}>
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex gap-2">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('template.searchTemplates')}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-11 bg-white shadow-sm border-gray-100 focus:border-primary focus:ring-primary/20 rounded-xl text-base"
              />
            </div>

            {/* Filter Button */}
            <Drawer open={isProvinceDrawerOpen} onOpenChange={setIsProvinceDrawerOpen}>
              <DrawerTrigger asChild>
                <Button
                  size="icon"
                  className={cn(
                    "h-11 w-11 rounded-xl shadow-sm shrink-0",
                    selectedProvince !== 'all' ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-100"
                  )}
                >
                  <Filter className="w-5 h-5" />
                  {selectedProvince !== 'all' && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-0" />
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="border-b pb-4">
                  <DrawerTitle className="text-center">Chọn tỉnh thành</DrawerTitle>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm nhanh tỉnh thành..."
                      value={provinceSearchQuery}
                      onChange={(e) => setProvinceSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-none rounded-xl"
                    />
                  </div>
                </DrawerHeader>
                <div className="overflow-y-auto py-2 px-2 flex-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between h-12 rounded-xl px-4 hover:bg-primary hover:text-primary-foreground",
                      selectedProvince === 'all' && "bg-primary/5 text-primary font-bold"
                    )}
                    onClick={() => handleProvinceChange('all')}
                  >
                    <span>{t('template.allProvinces')}</span>
                    {selectedProvince === 'all' && <Check className="w-4 h-4" />}
                  </Button>
                  <div className="h-px bg-gray-100 my-1 mx-4" />
                  {filteredProvincesList.map((province) => (
                    <Button
                      key={province.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-between h-12 rounded-xl px-4 font-normal hover:bg-primary hover:text-primary-foreground",
                        selectedProvince === province.id && "bg-primary/5 text-primary font-bold"
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

      {/* Header */}
      <div className="mb-8 mt-4 animate-fade-in px-2">
        <h1 className="text-2xl font-bold text-center mb-2">{t('template.templates')}</h1>
        <p className="text-muted-foreground text-center mb-4">
          {t('template.description')}
        </p>
        <div className="flex justify-center">
          <PWAInstallButton
            variant="outline"
            className="rounded-full border-primary/20 hover:bg-primary/5 text-primary"
          />
        </div>
      </div>

      {/* Results summary if filtering */}
      {hasActiveFilters && templates.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-2">
          <p className="text-sm font-medium text-gray-500">
            {t('template.templatesFound', { count: templates.length })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-primary hover:bg-primary/5 h-8 font-semibold"
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
