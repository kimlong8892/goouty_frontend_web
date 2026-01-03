import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

interface Bank {
  code: string;
  name: string;
}

interface BankSearchProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export const BANKS: Bank[] = [
  { code: 'ICB', name: 'VietinBank' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'MB', name: 'MBBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'MSB', name: 'MSB' },
  { code: 'LPB', name: 'LienVietPostBank' },
  { code: 'VCCB', name: 'VietCapitalBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'SEAB', name: 'SeABank' },
  { code: 'VBA', name: 'Agribank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'BAB', name: 'BacABank' },
  { code: 'PBVN', name: 'PublicBank' },
  { code: 'OCB', name: 'OCB' },
  { code: 'KLB', name: 'KienLongBank' },
  { code: 'NAB', name: 'NamABank' },
  { code: 'SHB', name: 'SHB' },
  { code: 'EIB', name: 'Eximbank' },
  { code: 'SCB', name: 'SCB' },
  { code: 'GPB', name: 'GPBank' },
  { code: 'ABB', name: 'AnBinhBank' },
  { code: 'VAB', name: 'VietABank' },
  { code: 'PGB', name: 'PGBank' },
  { code: 'VTB', name: 'VietBank' },
  { code: 'NCB', name: 'NCB' },
];

export const BankSearch: React.FC<BankSearchProps> = ({
  value,
  onChange,
  placeholder = "Tìm kiếm ngân hàng...",
  label,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter banks based on search term
  const filteredBanks = BANKS.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Set selected bank when value changes
  useEffect(() => {
    if (value) {
      const bank = BANKS.find(b => b.code === value);
      setSelectedBank(bank || null);
      setSearchTerm(bank ? bank.name : '');
    } else {
      setSelectedBank(null);
      setSearchTerm('');
    }
  }, [value]);

  // Handle bank selection
  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    setSearchTerm(bank.name);
    onChange(bank.code);
    setIsOpen(false);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(true);

    // If user clears the input, clear selection
    if (!term) {
      setSelectedBank(null);
      onChange('');
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset search term to selected bank name if user didn't select anything
        if (selectedBank) {
          setSearchTerm(selectedBank.name);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedBank]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedBank) {
        setSearchTerm(selectedBank.name);
      }
    }
  };

  // Handle clear selection
  const handleClear = () => {
    setSelectedBank(null);
    setSearchTerm('');
    onChange('');
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10 pr-10"
          />
          {selectedBank ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <ChevronDown
              className={cn(
                "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          )}
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {filteredBanks.length > 0 ? (
              filteredBanks.map((bank) => (
                <div
                  key={bank.code}
                  className={cn(
                    "px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between",
                    selectedBank?.code === bank.code && "bg-blue-50"
                  )}
                  onClick={() => handleBankSelect(bank)}
                >
                  <div>
                    <div className="font-medium">{bank.name}</div>
                    <div className="text-sm text-muted-foreground">{bank.code}</div>
                  </div>
                  {selectedBank?.code === bank.code && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-muted-foreground">
                Không tìm thấy ngân hàng nào
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
