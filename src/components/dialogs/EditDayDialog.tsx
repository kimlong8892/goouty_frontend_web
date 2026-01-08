import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/integrations/api/client.ts';
import { cn } from '@/lib/utils.ts';
import { Plus } from 'lucide-react';

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
      <DialogContent className="[&>button]:hidden sm:[&>button]:flex p-0 gap-0 sm:max-w-md w-full rounded-2xl sm:rounded-[32px] overflow-hidden border-border dark:bg-card dark:shadow-2xl">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full">
          <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-border space-y-0 text-center sm:text-left dark:bg-card">
            <Button
              type="button"
              variant="ghost"
              className="p-0 h-auto font-medium text-muted-foreground hover:text-foreground hover:bg-transparent text-base sm:hidden"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold dark:text-foreground">
              <Calendar className="w-5 h-5 text-[#6347f9]" />
              <span>Chỉnh sửa ngày</span>
            </DialogTitle>
            <Button
              type="submit"
              variant="ghost"
              disabled={loading}
              className="p-0 h-auto font-bold text-[#6347f9] hover:text-[#5136db] hover:bg-transparent disabled:text-gray-400 text-base sm:hidden"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#6347f9] mr-2" />
              )}
              Xong
            </Button>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-4 dark:bg-card">
            <div className="space-y-2">
              <Label htmlFor="title" className="dark:text-muted-foreground font-medium text-sm">Tiêu đề ngày <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                ref={titleRef}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                aria-invalid={!!errors.title}
                className={cn(
                  "h-12 rounded-xl dark:bg-secondary dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground/60 focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none",
                  errors.title ? 'border-destructive focus-visible:ring-destructive' : ''
                )}
              />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="dark:text-muted-foreground font-medium text-sm">Mô tả ngày</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="h-24 rounded-xl dark:bg-secondary dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground/60 focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="dark:text-muted-foreground font-medium text-sm">Ngày <span className="text-destructive">*</span></Label>
              <Input
                id="date"
                type="date"
                ref={dateRef}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                aria-invalid={!!errors.date}
                className={cn(
                  "h-12 rounded-xl dark:bg-secondary dark:border-border dark:text-foreground focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none block w-full",
                  errors.date ? 'border-destructive focus-visible:ring-destructive' : ''
                )}
              />
              {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date}</p>}
            </div>
          </div>

          <DialogFooter className="hidden sm:flex px-6 py-4 border-t border-gray-100 dark:border-border gap-2 dark:bg-card">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDayDialog;

