import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Calendar } from 'lucide-react';
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
  const dateRef = useRef<HTMLInputElement | null>(null);

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
      if (!focused) { dateRef.current?.focus(); focused = true; }
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Không thể chọn ngày trong quá khứ';
        if (!focused) { dateRef.current?.focus(); focused = true; }
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
            <Calendar className="w-5 h-5" />
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
              className={errors.title ? 'border-destructive focus-visible:ring-destructive' : undefined}
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
            />
          </div>
          <div>
            <Label htmlFor="date">Ngày <span className="text-destructive">*</span></Label>
            <Input
              id="date"
              type="date"
              ref={dateRef}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              aria-invalid={!!errors.date}
              className={errors.date ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
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