import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/integrations/api/client.ts';

interface EditDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: {
    id: string;
    title: string;
    description?: string;
    date: string;
  } | null;
  onSuccess: () => void;
}

export const EditDayDialog: React.FC<EditDayDialogProps> = ({ open, onOpenChange, day, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
  });

  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
  const titleRef = useRef<HTMLInputElement | null>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (day && open) {
      const buildLocalDate = (iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      setFormData({
        title: day.title || '',
        description: day.description || '',
        // date-only (YYYY-MM-DD) in local time to avoid timezone shift
        date: buildLocalDate(day.date),
      });
      setErrors({});
    }
  }, [day, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { title?: string; date?: string } = {};
    let focused = false;
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề ngày';
      if (!focused) { titleRef.current?.focus(); focused = true; }
    }
    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày';
      if (!focused) { dateRef.current?.focus(); focused = true; }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !day) return;

    setLoading(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        // normalize to midnight
        date: new Date(`${formData.date}T00:00:00`).toISOString(),
      };

      await api.days.update(day.id, payload);
      toast.success('Đã cập nhật ngày');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Không thể cập nhật ngày');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Chỉnh sửa ngày
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="title">Tiêu đề ngày <span className="text-destructive">*</span></Label>
            <Input id="title" ref={titleRef} value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              aria-invalid={!!errors.title}
              className={errors.title ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="description">Mô tả ngày</Label>
            <Textarea id="description" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="date">Ngày <span className="text-destructive">*</span></Label>
            <Input id="date" type="date" ref={dateRef} value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              aria-invalid={!!errors.date}
              className={errors.date ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="hover:bg-transparent hover:text-primary hover:border-primary">Hủy</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDayDialog;

