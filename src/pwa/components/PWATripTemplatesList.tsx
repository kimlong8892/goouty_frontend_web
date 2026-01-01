import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { api } from '@/integrations/api/client';
import { TripTemplateCard } from '@/components/TripTemplateCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PWATripTemplatesListProps {
  onUseTemplate?: (template: DATABASE_TYPES.tripTemplates) => void;
  usingTemplate?: boolean;
}

export const PWATripTemplatesList = ({ onUseTemplate, usingTemplate }: PWATripTemplatesListProps) => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<DATABASE_TYPES.tripTemplates[]>([]);
  const [provinces, setProvinces] = useState<DATABASE_TYPES.provinces[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  // Ref for infinite scroll
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
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

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && pagination.page < pagination.totalPages) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [loadingMore, pagination.page, pagination.totalPages]);

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
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProvince('all');
    setHasSearched(false);
    loadInitialData();
  };

  const hasMoreTemplates = pagination.page < pagination.totalPages;
  const hasActiveFilters = searchTerm || (selectedProvince && selectedProvince !== 'all');

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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">{t('template.templates')}</h1>
        <p className="text-muted-foreground text-center">
          {t('template.description')}
        </p>
      </div>

      {/* Search and Filter - Sticky */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 mb-6 pb-4 pt-2">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('template.searchTemplates')}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProvince} onValueChange={handleProvinceChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('template.allProvinces')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('template.allProvinces')}</SelectItem>
                {provinces.map((province) => (
                  <SelectItem key={province.id} value={province.id}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('template.templatesFound', { count: templates.length })}
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {t('common.clearFilters')}
              </Button>
            </div>
          )}
        </div>
      </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {templates.map((template) => (
              <TripTemplateCard
                key={template.id}
                template={template}
                onUseTemplate={onUseTemplate}
                usingTemplate={usingTemplate}
              />
            ))}
          </div>

          {/* Loading indicator for infinite scroll */}
          {hasMoreTemplates && (
            <div ref={loadingRef} className="flex justify-center py-4">
              {loadingMore ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm text-muted-foreground">{t('common.loadingMore')}</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {t('common.scrollToLoadMore')}
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
