import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button';
import { Search, Loader2, MapPin, ChevronDown, Check } from 'lucide-react';
import { TripTemplateCard } from './TripTemplateCard';
import { api } from '@/integrations/api/client';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const [open, setOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const { toast } = useToast();
  const [restoreScrollY, setRestoreScrollY] = useState<number | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);



  // Handle scroll from navigation state
  const location = useLocation();

  useEffect(() => {
    // Check if we need to scroll to templates section
    // Only try to scroll if we are not loading, because the element might not exist yet
    if (!loading && location.state && (location.state as any)?.scrollTo === 'templates') {
      const element = document.getElementById('templates-section');
      if (element) {
        // Add a small delay to ensure DOM is ready and layout is stable
        setTimeout(() => {
          const headerOffset = 100; // Adjust this value based on your actual header height
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Optional: clear state to prevent scrolling again on re-render
          // We use reset state so we don't clear it immediately if re-renders happen quickly
          window.history.replaceState({}, document.title);
        }, 100);
      }
    }
  }, [location, loading]);

  // Search and filter when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedProvince]);


  // Save state on unmount
  useEffect(() => {
    return () => {
      const scrollY = window.scrollY;
      sessionStorage.setItem('web_templates_scroll_y', scrollY.toString());
      sessionStorage.setItem('web_templates_pagination', JSON.stringify(pagination));
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
          if (Math.abs(window.scrollY - restoreScrollY) > 50) {
            window.scrollTo({
              top: restoreScrollY,
              behavior: 'auto'
            });
          }
          setRestoreScrollY(null);
          sessionStorage.removeItem('web_templates_scroll_y');
          sessionStorage.removeItem('web_templates_pagination');
        }, 100);
      });
    }
  }, [templates, restoreScrollY]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load provinces
      const provincesResponse = await api.provinces.getAll();
      setProvinces(Array.isArray(provincesResponse) ? provincesResponse : []);

      // Check for saved state
      const savedPaginationStr = sessionStorage.getItem('web_templates_pagination');
      const savedScrollYStr = sessionStorage.getItem('web_templates_scroll_y');

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

      // Restore Scroll
      if (savedScrollYStr) {
        setRestoreScrollY(parseInt(savedScrollYStr));
      }

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
          <h2 className="text-3xl md:text-5xl font-black mb-4 bg-gradient-to-r from-[#6347f9] to-[#8673f8] bg-clip-text text-transparent uppercase tracking-tight">
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
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-[#6347f9]" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 pr-10 bg-slate-50 border-gray-200 focus:border-[#d2cdfe] hover:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200 h-12 rounded-xl"
                />
              </div>
            </div>

            {/* Province Filter */}
            <div className="flex-1 min-w-[200px]">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full h-12 bg-slate-50 border-gray-200 rounded-xl focus:ring-0 shadow-none text-base justify-between font-normal hover:bg-slate-50 hover:border-[#d2cdfe] text-slate-500 hover:text-slate-500 transition-colors duration-200"
                  >
                    <div className="flex items-center truncate">
                      <MapPin className="w-5 h-5 mr-3 text-slate-400 shrink-0" />
                      <span className={cn(selectedProvince === 'all' ? "" : "text-black")}>
                        {selectedProvince === 'all'
                          ? "Tất cả tỉnh thành"
                          : provinces.find((province) => province.id === selectedProvince)?.name || "Chọn tỉnh thành"}
                      </span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 rounded-2xl border-slate-200 shadow-xl" align="end">
                  <Command>
                    <CommandInput placeholder="Tìm nhanh tỉnh thành..." />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy tỉnh thành.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          className="data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                          onSelect={() => {
                            setSelectedProvince('all');
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProvince === 'all' ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Tất cả tỉnh thành
                        </CommandItem>
                        {Array.isArray(provinces) && provinces.map((province) => (
                          <CommandItem
                            key={province.id}
                            value={province.name}
                            className="data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                            onSelect={() => {
                              setSelectedProvince(province.id);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProvince === province.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {province.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                <span className="ml-1 text-[#6347f9]">/ {pagination.total}</span>
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

            {/* Load More Button */}
            {hasMoreTemplates && (
              <div className="flex justify-center py-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="h-12 px-8 rounded-full border-2 border-[#6347f9] text-[#6347f9] hover:bg-[#6347f9] hover:text-white transition-all font-bold min-w-[200px]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Đang tải thêm...
                    </>
                  ) : (
                    <>
                      Tải thêm template
                      <ChevronDown className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
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
