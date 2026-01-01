import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Loader2, MapPin, ChevronDown } from 'lucide-react';
import { TripTemplateCard } from './TripTemplateCard';
import { api } from '@/integrations/api/client';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { useToast } from '@/hooks/use-toast';

interface TripTemplatesSectionProps {
  onUseTemplate?: (template: DATABASE_TYPES.tripTemplates) => void;
  usingTemplate?: boolean;
}

export const TripTemplatesSection = ({ onUseTemplate, usingTemplate }: TripTemplatesSectionProps) => {
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
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Search and filter when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedProvince]);

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

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
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
        total: response.pagination?.total || prev.total + newTemplates.length,
        totalPages: response.pagination?.totalPages || prev.totalPages
      }));
    } catch (error) {
      console.error('Error loading more templates:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMoreTemplates = pagination.page < pagination.totalPages;
  const hasActiveFilters = searchTerm || (selectedProvince && selectedProvince !== 'all');

  if (loading && templates.length === 0) {
    return (
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="templates-section" className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-4 bg-gradient-to-r from-[#6c5dd3] to-[#8673f8] bg-clip-text text-transparent uppercase tracking-tight">
            KHÁM PHÁ TEMPLATES
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            Duyệt qua và sử dụng các kế hoạch chuyến đi có sẵn để bắt đầu hành trình của bạn ngay lập tức
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto">
            {/* Search */}
            <div className="flex-[2]">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-[#6c5dd3]" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 h-14 bg-white border-slate-200 rounded-[20px] focus-visible:ring-[#6c5dd3]/20 shadow-sm focus:shadow-md transition-all text-base"
                />
              </div>
            </div>

            {/* Province Filter */}
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger className="h-14 bg-white border-slate-200 rounded-[20px] focus:ring-[#6c5dd3]/20 shadow-sm text-base">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-slate-400" />
                    <SelectValue placeholder="Tất cả tỉnh thành" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 shadow-xl max-h-[300px]">
                  <SelectItem value="all" className="font-medium">Tất cả tỉnh thành</SelectItem>
                  {Array.isArray(provinces) && provinces.length > 0 ? (
                    provinces.map((province) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Đang tải...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {templates.length > 0 && (
          <div className="mb-8 flex items-center justify-center space-x-3">
            <div className="h-px w-8 bg-slate-200" />
            <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
              Hiển thị {templates.length} template{templates.length !== 1 ? 's' : ''}
              {pagination.total > templates.length && (
                <span className="ml-1 text-[#6c5dd3]">/ {pagination.total}</span>
              )}
            </p>
            <div className="h-px w-8 bg-slate-200" />
          </div>
        )}

        {/* Templates Grid */}
        {templates.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {templates.map((template) => (
                <TripTemplateCard
                  key={template.id}
                  template={template}
                  onUseTemplate={onUseTemplate}
                  usingTemplate={usingTemplate}
                />
              ))}
            </div>

            {/* Infinite Scroll Target */}
            {hasMoreTemplates && (
              <div ref={observerTarget} className="flex justify-center py-8">
                {loadingMore && (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#6c5dd3]" />
                    <span className="text-sm text-slate-500 font-medium">Đang tải thêm...</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Không tìm thấy template nào</h3>
                <p className="mb-4">
                  {hasActiveFilters
                    ? 'Thử thay đổi bộ lọc để tìm thấy nhiều template hơn.'
                    : 'Hiện tại chưa có template nào được chia sẻ công khai.'
                  }
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedProvince('all');
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
