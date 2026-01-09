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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card dark:bg-[#1c1e26] border-border dark:border-gray-800 text-foreground dark:text-white shadow-2xl rounded-[24px] sm:rounded-[32px] p-0 gap-0">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full">
          <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 space-y-0 bg-card dark:bg-[#1c1e26]">
            <Button
              type="button"
              variant="ghost"
              className="p-0 h-auto font-medium text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-transparent text-base sm:hidden"
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground dark:text-white">
              <Plus className="w-5 h-5 text-[#6347f9]" />
              <span>Thêm ngày mới</span>
            </DialogTitle>
            <Button
              type="submit"
              variant="ghost"
              disabled={loading}
              className="p-0 h-auto font-bold text-[#6347f9] hover:text-[#5136db] hover:bg-transparent disabled:text-gray-400 text-base sm:hidden"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
              )}
              Xong
            </Button>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-card dark:bg-[#1c1e26]">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-muted-foreground dark:text-slate-300 font-medium text-sm">
                Tiêu đề ngày <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                ref={titleRef}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Ngày 1 - Khám phá thành phố"
                aria-invalid={!!errors.title}
                className={cn(
                  "h-12 bg-secondary dark:bg-[#242731] border-border dark:border-gray-700 text-foreground dark:text-white placeholder:text-muted-foreground/60 dark:placeholder:text-slate-500 focus:border-[#6347f9] hover:border-[#6347f9] transition-colors rounded-xl outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  errors.title ? 'border-red-500 focus:border-red-500' : ''
                )}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-muted-foreground dark:text-slate-300 font-medium text-sm">Mô tả ngày</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về ngày này..."
                rows={3}
                className="bg-secondary dark:bg-[#242731] border-border dark:border-gray-700 text-foreground dark:text-white placeholder:text-muted-foreground/60 dark:placeholder:text-slate-500 focus:border-[#6347f9] hover:border-[#6347f9] transition-colors rounded-xl outline-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-muted-foreground dark:text-slate-300 font-medium text-sm">
                Ngày <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal bg-secondary dark:bg-[#242731] border-border dark:border-gray-700 rounded-xl hover:bg-secondary/80 dark:hover:bg-[#2d313d] text-foreground dark:text-white transition-all duration-200",
                      !formData.date ? "text-muted-foreground/60 dark:text-slate-500" : "text-foreground dark:text-white",
                      errors.date && "border-red-500 hover:border-red-500/80"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground dark:text-slate-400" />
                    {formData.date ? (
                      format(new Date(formData.date), "dd/MM/yyyy")
                    ) : (
                      <span>dd/mm/yyyy</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card dark:bg-[#1c1e26] border-border dark:border-gray-700" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                    initialFocus
                    className="bg-card dark:bg-[#1c1e26] text-foreground dark:text-white"
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>
          </div>

          <DialogFooter className="hidden sm:flex px-6 py-4 border-t border-gray-100 dark:border-gray-800 gap-3 bg-card dark:bg-[#1c1e26]">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-11 rounded-xl border-border dark:border-gray-700 bg-transparent text-muted-foreground dark:text-slate-400 hover:bg-secondary dark:hover:bg-gray-800 hover:text-foreground dark:hover:text-white transition-all px-6"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-11 rounded-xl bg-[#6347f9] hover:bg-[#5136db] text-white shadow-lg hover:shadow-[#6347f9]/20 transition-all font-bold px-6"
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
        </form>
      </DialogContent>
    </Dialog>
  );
};