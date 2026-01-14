import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Calendar as CalendarIcon, Plus, ChevronLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { format } from 'date-fns';
import { cn } from '@/lib/utils.ts';
import { api } from '@/lib/api.ts';
import { toast } from 'sonner';
import { CreateDayRequest, Day } from '@/lib/types.ts';

import { usePWA } from '@/pwa/hooks/usePWA.ts';

interface AddDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  startDate?: string;
  onSuccess: () => void;
}

export const AddDayDialog: React.FC<AddDayDialogProps> = ({
  open,
  onOpenChange,
  tripId,
  startDate,
  onSuccess
}) => {
  const { isPWA } = usePWA();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // store date-only string
    date: startDate ? format(new Date(startDate), 'yyyy-MM-dd') : ''
  });

  // Lỗi inline cho form
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});

  // Refs để focus input đầu tiên bị lỗi
  const titleRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: startDate ? format(new Date(startDate), 'yyyy-MM-dd') : ''
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Inline validate + focus
    const newErrors: { title?: string; date?: string } = {};
    let focused = false;

    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề ngày';
      if (!focused) { titleRef.current?.focus(); focused = true; }
    }

    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Không thể chọn ngày trong quá khứ';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      // Create day data according to backend DTO
      const dayData: CreateDayRequest = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        // send ISO at midnight local for date-only
        date: new Date(`${formData.date}T00:00:00`).toISOString(),
        tripId: tripId
      };

      const newDay = await api.post<Day>('/days', dayData);

      toast.success('Đã thêm ngày thành công');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Add day error:', error);
      toast.error(error.message || 'Không thể thêm ngày');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose={isPWA}
        className={cn(
          "bg-card text-foreground gap-0 shadow-2xl p-0 focus:outline-none duration-0", // Added duration-0 to disable conflicting animations
          !isPWA && "max-w-2xl max-h-[90vh] overflow-y-auto border border-border sm:rounded-[32px]",
          isPWA && [
            "fixed inset-0 z-50 w-full h-full max-w-none max-h-none rounded-none border-none bg-background flex flex-col",
            // Crucial overrides to fight DialogContent default styling
            "top-0 left-0 translate-x-0 translate-y-0",
            "data-[state=open]:slide-in-from-bottom-0 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0",
            "data-[state=closed]:slide-out-to-bottom-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0"
          ]
        )}
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full relative">

          {/* Header */}
          <div className={cn(
            "flex items-center justify-between transition-all",
            isPWA
              ? "sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border/50"
              : "px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-card dark:bg-[#1c1e26]"
          )}>
            {isPWA ? (
              // PWA Header
              <>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="p-2 -ml-2 text-foreground/80 hover:text-foreground active:scale-95 transition-transform rounded-full hover:bg-muted"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Thêm ngày mới
                  </DialogTitle>
                </div>
                <div className="w-10"></div> {/* Spacer */}
              </>
            ) : (
              // Desktop Header
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="p-0 h-auto font-medium text-muted-foreground hover:text-foreground hover:bg-transparent text-base sm:hidden"
                  onClick={() => handleOpenChange(false)}
                >
                  Hủy
                </Button>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground dark:text-white">
                  <Plus className="w-5 h-5 text-primary" />
                  <span>Thêm ngày mới</span>
                </DialogTitle>
                <div className="sm:hidden w-8"></div>
              </>
            )}
          </div>

          {/* Content */}
          <div className={cn(
            "space-y-6 flex-1 overflow-y-auto",
            isPWA ? "px-5 py-6 pb-32" : "p-6 bg-card dark:bg-[#1c1e26]"
          )}>

            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-muted-foreground font-medium text-sm ml-1">
                Tiêu đề ngày <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                ref={titleRef}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Ngày 1 - Khám phá thành phố"
                className={cn(
                  "h-12 bg-card border-input focus:ring-primary/20 rounded-xl transition-all",
                  isPWA ? "bg-card border-input" : "bg-secondary dark:bg-[#242731] border-border dark:border-gray-700",
                  errors.title && "border-red-500 focus-visible:ring-red-500/20"
                )}
              />
              {errors.title && (
                <p className="text-sm text-red-500 ml-1">{errors.title}</p>
              )}
            </div>

            {/* Date Input */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-muted-foreground font-medium text-sm ml-1">
                Ngày <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal rounded-xl transition-all",
                      isPWA ? "bg-card border-input" : "bg-secondary dark:bg-[#242731] border-border dark:border-gray-700",
                      !formData.date ? "text-muted-foreground" : "text-foreground",
                      errors.date && "border-red-500 text-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {formData.date ? (
                      format(new Date(formData.date), "dd/MM/yyyy")
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-red-500 ml-1">{errors.date}</p>
              )}
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-muted-foreground font-medium text-sm ml-1">
                Mô tả (tùy chọn)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về ngày này..."
                rows={3}
                className={cn(
                  "rounded-xl resize-none transition-all outline-none",
                  isPWA ? "bg-card border-input" : "bg-secondary dark:bg-[#242731] border-border dark:border-gray-700"
                )}
              />
            </div>

          </div>

          {/* Footer */}
          {isPWA ? (
            // PWA Sticky Footer
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50 pb-safe z-50">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                ) : null}
                {loading ? 'Đang thêm...' : 'Thêm ngày'}
              </Button>
            </div>
          ) : (
            // Desktop Footer
            <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 gap-3 bg-card dark:bg-[#1c1e26] sm:flex hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="h-11 rounded-xl border-border px-6"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg px-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  'Thêm ngày'
                )}
              </Button>
            </DialogFooter>
          )}

        </form>
      </DialogContent>
    </Dialog>
  );
};