import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Province } from '@/lib/types';
import { api } from '@/lib/api';

interface ProvinceSelectorProps {
  value: string; // This will be the province ID
  onChange: (provinceId: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function ProvinceSelector({
  value,
  onChange,
  placeholder = "Chọn tỉnh thành",
  className,
  error = false
}: ProvinceSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load provinces from our backend API
  useEffect(() => {
    const loadProvinces = async () => {
      setLoading(true);
      try {
        const response = await api.get<{ data: Province[] }>('/provinces?limit=100');
        setProvinces(response.data);
      } catch (error) {
        console.error('Error loading provinces:', error);
        toast.error('Không thể tải danh sách tỉnh thành');
      } finally {
        setLoading(false);
      }
    };

    loadProvinces();
  }, []);

  // Find selected province when value changes
  useEffect(() => {
    if (value && provinces.length > 0) {
      const province = provinces.find(p => p.id === value);
      setSelectedProvince(province || null);
    } else {
      setSelectedProvince(null);
    }
  }, [value, provinces]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter provinces based on search query
  const filteredProvinces = provinces.filter(province =>
    province.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle province selection
  const handleProvinceSelect = (province: Province) => {
    onChange(province.id);
    setSelectedProvince(province);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);

    // Always show dropdown when typing
    if (newValue.trim()) {
      setIsOpen(true);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // Clear selection
  const handleClear = () => {
    onChange('');
    setSelectedProvince(null);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={selectedProvince ? selectedProvince.name : searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10 border-gray-200 focus:border-[#d2cdfe] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors duration-200",
            error ? 'border-red-500 focus:border-red-500' : '',
            className
          )}
        />
        <div className="absolute right-1 top-1 flex items-center">
          {selectedProvince && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-transparent mr-1"
              onClick={handleClear}
            >
              <span className="text-xs">×</span>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-transparent"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isOpen ? "rotate-180" : ""
            )} />
          </Button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[50vh] overflow-hidden">
          {/* Loading state */}
          {loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Đang tải danh sách tỉnh thành...</span>
              </div>
            </div>
          )}

          {/* Provinces list */}
          {!loading && (
            <div className="max-h-[40vh] overflow-y-auto">
              {filteredProvinces.length > 0 ? (
                <>
                  {/* Show all provinces when no search query */}
                  {!searchQuery && (
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-gray-50 border-b">
                      Danh sách tỉnh thành ({provinces.length})
                    </div>
                  )}

                  {/* Show filtered results when searching */}
                  {searchQuery && (
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-blue-50 border-b">
                      Kết quả tìm kiếm cho "{searchQuery}" ({filteredProvinces.length})
                    </div>
                  )}

                  {filteredProvinces.map((province) => (
                    <button
                      key={province.id}
                      type="button"
                      className="w-full px-3 py-3 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors touch-manipulation"
                      onClick={() => handleProvinceSelect(province)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{province.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {province.divisionType}
                        </span>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery ? (
                    <div className="space-y-2">
                      <div>Không tìm thấy tỉnh thành nào</div>
                      <div className="text-xs">Thử tìm kiếm với từ khóa khác</div>
                    </div>
                  ) : (
                    'Không có dữ liệu'
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
