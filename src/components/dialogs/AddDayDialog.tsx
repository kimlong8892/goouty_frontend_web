import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { format } from 'date-fns';
import { cn } from '@/lib/utils.ts';
import { api } from '@/lib/api.ts';
import { toast } from 'sonner';
import { CreateDayRequest, Day } from '@/lib/types.ts';

interface AddDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  onSuccess: () => void;
}

export const AddDayDialog: React.FC<AddDayDialogProps> = ({
  open,
  onOpenChange,
  tripId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // store date-only string
    date: ''
  });

  // Lỗi inline cho form
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});

  // Refs để focus input đầu tiên bị lỗi
  const titleRef = useRef<HTMLInputElement | null>(null);
  // const dateRef = useRef<HTMLInputElement | null>(null); // Removed dateRef as it's not applicable to Popover trigger directly

  const resetForm = () => {
    setFormData({ title: '', description: '', date: '' });
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
      <DialogContent className="[&>button]:hidden sm:[&>button]:flex p-0 gap-0 sm:max-w-md w-full rounded-2xl sm:rounded-[32px] overflow-hidden border-border dark:bg-card dark:shadow-2xl">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full">
          <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-border space-y-0 text-center sm:text-left dark:bg-card">
            <Button
              type="button"
              variant="ghost"
              className="p-0 h-auto font-medium text-muted-foreground hover:text-gray-900 hover:bg-transparent text-base sm:hidden"
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold dark:text-foreground">
              {/* Icon only on mobile or both? Keep as is, maybe remove icon on desktop if needed, but keeping it is fine */}
              <CalendarIcon className="w-5 h-5 sm:hidden" />
              <Plus className="w-5 h-5 hidden sm:block text-[#6347f9]" />
              <span className="sm:hidden">Thêm ngày mới</span>
              <span className="hidden sm:inline">Thêm ngày mới</span>
            </DialogTitle>
            <Button
              type="submit"
              variant="ghost"
              disabled={loading}
              className="p-0 h-auto font-bold text-primary hover:text-primary/80 hover:bg-transparent disabled:text-gray-400 text-base sm:hidden"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
              )}
              Xong
            </Button>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-4 dark:bg-card">
            <div>
              <Label htmlFor="title" className="dark:text-muted-foreground font-medium text-sm">Tiêu đề ngày <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                ref={titleRef}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Ngày 1 - Khám phá thành phố"
                aria-invalid={!!errors.title}
                className={cn(
                  "h-12 rounded-xl dark:bg-secondary dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground/60 focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none",
                  errors.title ? 'border-destructive focus-visible:ring-destructive' : ''
                )}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description" className="dark:text-muted-foreground font-medium text-sm">Mô tả ngày</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về ngày này..."
                rows={2}
                className="h-24 rounded-xl dark:bg-secondary dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground/60 focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none resize-none"
              />
            </div>
            <div>
              <Label htmlFor="date" className="dark:text-muted-foreground font-medium text-sm">Ngày <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 dark:bg-secondary dark:border-border rounded-xl hover:bg-white dark:hover:bg-secondary/80 dark:text-foreground transition-all duration-200",
                      !formData.date && "text-muted-foreground dark:text-muted-foreground/60",
                      errors.date && "border-destructive hover:border-destructive/80"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 dark:text-muted-foreground" />
                    {formData.date ? (
                      format(new Date(formData.date), "dd/MM/yyyy")
                    ) : (
                      <span>dd/mm/yyyy</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-card dark:border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="mt-1 text-xs text-destructive">{errors.date}</p>
              )}
            </div>
          </div>

          <DialogFooter className="hidden sm:flex px-6 py-4 border-t border-gray-100 dark:border-border gap-2 dark:bg-card">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1 rounded-xl h-12 dark:border-border dark:bg-transparent dark:text-muted-foreground dark:hover:bg-secondary dark:hover:text-foreground transition-all"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl h-12 bg-primary dark:bg-[#6347f9] dark:hover:bg-[#5136db] dark:text-white dark:shadow-lg dark:hover:shadow-[#6347f9]/20 transition-all font-bold"
              disabled={loading}
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              )}
              Thêm ngày
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};