import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { api } from '@/integrations/api/client';
import { TripTemplateCard } from '@/components/TripTemplateCard';
import { Loader2, Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const TemplatesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<DATABASE_TYPES.tripTemplates[]>([]);
  const [provinces, setProvinces] = useState<DATABASE_TYPES.provinces[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12, // Increased limit for desktop grid
    total: 0,
    totalPages: 0
  });
  const [hasSearched, setHasSearched] = useState(false);
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
  }, [hasMoreTemplates, loadingMore]);

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
      setPagination(templatesResponse.pagination || { page: 1, limit: pagination.limit, total: 0, totalPages: 0 });

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
      setPagination(response.pagination || { page: 1, limit: pagination.limit, total: 0, totalPages: 0 });
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

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Khám phá mẫu chuyến đi
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
              Hàng trăm lịch trình du lịch được tuyển chọn từ cộng đồng và chuyên gia.
              Chọn một mẫu ưng ý và bắt đầu chuyến đi của bạn ngay hôm nay.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto min-w-0">
            {/* Search Input */}
            <div className="relative w-full sm:w-[320px] xl:w-[360px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-[#6347f9]" />
              <Input
                placeholder={t('template.searchTemplates') || "Tìm điểm đến, tên mẫu..."}
                className="pl-12 h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-[#6347f9] focus:ring-4 focus:ring-[#6347f9]/10 font-medium text-base transition-all hover:bg-white" // hover:bg-white to override some defaults
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Province Select */}
            <div className="w-full sm:w-[260px]">
              <Select value={selectedProvince} onValueChange={handleProvinceChange}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm font-medium text-base focus:ring-4 focus:ring-[#6347f9]/10 focus:border-[#6347f9] transition-all">
                  <div className="flex items-center gap-2.5 truncate text-slate-700">
                    <MapPin className={cn("w-5 h-5", selectedProvince !== 'all' ? "text-[#6347f9]" : "text-slate-400")} />
                    <SelectValue placeholder="Tất cả tỉnh thành" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] rounded-xl shadow-xl border-slate-100">
                  <SelectItem value="all" className="font-semibold py-3">Tất cả tỉnh thành</SelectItem>
                  {provinces.map(p => (
                    <SelectItem key={p.id} value={p.id} className="py-2.5 cursor-pointer">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
            <span className="text-slate-500 font-medium">
              {templates.length > 0 ? `Tìm thấy ${templates.length} kết quả` : 'Không tìm thấy kết quả nào'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-[#6347f9] hover:bg-[#6347f9]/10 hover:text-[#5136db] px-3 rounded-full font-bold text-sm h-8"
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}

        {/* Content Area */}
        {loading && templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse">
            <Loader2 className="w-10 h-10 text-[#6347f9] animate-spin mb-4" />
            <p className="text-slate-400 font-medium">{t('template.loadingTemplates') || "Đang tải mẫu..."}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('template.noTemplates') || "Không tìm thấy mẫu nào"}</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              {hasActiveFilters
                ? t('template.noTemplatesDescription') || "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn"
                : t('template.loadingTemplates') || "Hiện chưa có mẫu chuyến đi nào."
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} className="rounded-xl bg-[#6347f9] hover:bg-[#5136db] px-8 h-12 text-base font-bold shadow-lg shadow-indigo-500/20">
                {t('common.clearFilters') || "Xóa bộ lọc"}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-8">
              {templates.map((template) => (
                <div key={template.id} className="w-full">
                  <TripTemplateCard
                    template={template}
                  />
                </div>
              ))}
            </div>

            {/* Infinite Scroll Sentinel */}
            {hasMoreTemplates && (
              <div ref={loadMoreRef} className="flex justify-center py-12">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-[#6347f9] bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-bold text-sm">{t('common.loadingMore') || "Đang tải thêm..."}</span>
                  </div>
                )}
              </div>
            )}

            {!hasMoreTemplates && templates.length > 0 && (
              <div className="flex justify-center mt-12 mb-8">
                <span className="text-slate-400 font-medium text-sm border-t border-slate-200 pt-6 px-12">
                  {t('common.endOfList') || "Đã hiển thị tất cả kết quả"}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;