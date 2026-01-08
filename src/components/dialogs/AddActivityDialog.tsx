import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api.ts';
import { toast } from 'sonner';
import { CreateActivityRequest, Activity } from '@/lib/types.ts';
import { cn } from '@/lib/utils.ts';
import { X } from 'lucide-react';

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayId: string;
  onSuccess: () => void;
}

export const AddActivityDialog: React.FC<AddActivityDialogProps> = ({
  open,
  onOpenChange,
  dayId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    durationMin: 60,
    location: '',
    notes: '',
    important: false
  });

  const resetForm = () => {
    setFormData({
      title: '',
      startTime: '',
      durationMin: 60,
      location: '',
      notes: '',
      important: false
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

    // Validation
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên hoạt động');
      return;
    }

    if (formData.durationMin < 1 || formData.durationMin > 1440) {
      toast.error('Thời lượng phải từ 1 đến 1440 phút');
      return;
    }

    setLoading(true);
    try {
      // Create activity data according to backend DTO
      const activityData: CreateActivityRequest = {
        title: formData.title.trim(),
        startTime: formData.startTime ? `2025-09-15T${formData.startTime}:00.000Z` : undefined,
        durationMin: formData.durationMin,
        location: formData.location.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        important: formData.important,
        dayId: dayId
      };

      const newActivity = await api.post<Activity>('/activities', activityData);

      toast.success('Đã thêm hoạt động thành công');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Add activity error:', error);
      toast.error(error.message || 'Không thể thêm hoạt động');
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
              className="p-0 h-auto font-medium text-muted-foreground hover:text-foreground hover:bg-transparent text-base sm:hidden"
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold dark:text-foreground">
              <Plus className="w-5 h-5 text-[#6347f9]" />
              <span>Thêm hoạt động</span>
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
              <Label htmlFor="title" className="dark:text-muted-foreground font-medium text-sm">
                Tên hoạt động <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Tham quan bảo tàng"
                className="h-12 rounded-xl dark:bg-secondary dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground/60 focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="dark:text-muted-foreground font-medium text-sm">Giờ bắt đầu</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="h-12 rounded-xl dark:bg-secondary dark:border-border dark:text-foreground focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMin" className="dark:text-muted-foreground font-medium text-sm">Thời lượng (phút)</Label>
                <Input
                  id="durationMin"
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.durationMin}
                  onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 0 })}
                  className="h-12 rounded-xl dark:bg-secondary dark:border-border dark:text-foreground focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="dark:text-muted-foreground font-medium text-sm">Địa điểm</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="VD: Thành phố Hồ Chí Minh"
                className="h-12 rounded-xl dark:bg-secondary dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground/60 focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="dark:text-muted-foreground font-medium text-sm">Ghi chú</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ghi chú thêm về hoạt động..."
                rows={3}
                className="h-24 rounded-xl dark:bg-secondary dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground/60 focus:border-primary/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200 outline-none resize-none"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="important"
                checked={formData.important}
                onCheckedChange={(checked) => setFormData({ ...formData, important: !!checked })}
                className="rounded-md border-border dark:data-[state=checked]:bg-[#6347f9] dark:data-[state=checked]:border-[#6347f9]"
              />
              <Label htmlFor="important" className="text-sm font-medium dark:text-foreground cursor-pointer">Đánh dấu là hoạt động quan trọng</Label>
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
              Thêm hoạt động
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};