import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Search, X } from 'lucide-react';
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
  darkMode?: boolean;
}

export function ProvinceSelector({
  value,
  onChange,
  placeholder = "Chọn tỉnh thành",
  className,
  error = false,
  darkMode = false
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
        const provincesResponse = await api.provinces.getAll();
        setProvinces(provincesResponse);
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
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <MapPin className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 transition-colors",
          darkMode ? "text-muted-foreground" : "text-muted-foreground"
        )} />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={selectedProvince ? selectedProvince.name : searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className={cn(
            "pl-10 pr-20 h-12 w-full border-border focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 outline-none transition-all duration-200 rounded-xl",
            darkMode ? "bg-secondary text-foreground" : "bg-secondary text-foreground",
            className
          )}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center pr-1 gap-1">
          {selectedProvince && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
              onClick={handleClear}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform text-muted-foreground",
              isOpen ? "rotate-180" : ""
            )} />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className={cn(
          "absolute z-[5000] w-full mt-2 border border-border rounded-2xl shadow-2xl max-h-[50vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 bg-card",
          darkMode ? "bg-card" : "bg-card"
        )}>
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
            <div className="max-h-[40vh] overflow-y-auto custom-scrollbar">
              {filteredProvinces.length > 0 ? (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider bg-muted/30 border-b border-border">
                    {searchQuery ? `Kết quả cho "${searchQuery}"` : "Danh sách tỉnh thành"} ({filteredProvinces.length})
                  </div>

                  {filteredProvinces.map((province) => (
                    <button
                      key={province.id}
                      type="button"
                      className={cn(
                        "w-full px-4 py-3 text-left text-sm transition-all flex items-center justify-between group",
                        darkMode
                          ? "hover:bg-primary/20 focus:bg-primary/20 text-foreground"
                          : "hover:bg-primary/10 focus:bg-primary/10 text-foreground"
                      )}
                      onClick={() => handleProvinceSelect(province)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{province.name}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 bg-muted px-2 py-0.5 rounded">
                        {province.divisionType}
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <div className="mb-2 flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Search className="h-6 w-6 opacity-20" />
                    </div>
                  </div>
                  <div className="font-medium">Không tìm thấy tỉnh thành nào</div>
                  <div className="text-xs opacity-60">Thử tìm kiếm với từ khóa khác</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
