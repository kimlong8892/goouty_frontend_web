import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Calendar as CalendarIcon } from 'lucide-react';
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Thêm ngày mới
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="title">Tiêu đề ngày <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              ref={titleRef}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Ngày 1 - Khám phá thành phố"
              aria-invalid={!!errors.title}
              className={errors.title ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-0 focus-visible:ring-offset-0'}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title}</p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Mô tả ngày</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết về ngày này..."
              rows={2}
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div>
            <Label htmlFor="date">Ngày <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 hover:bg-white hover:text-slate-900",
                    !formData.date && "text-muted-foreground",
                    errors.date && "border-destructive hover:border-destructive/80"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? (
                    format(new Date(formData.date), "dd/MM/yyyy")
                  ) : (
                    <span>dd/mm/yyyy</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang thêm...' : 'Thêm ngày'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};