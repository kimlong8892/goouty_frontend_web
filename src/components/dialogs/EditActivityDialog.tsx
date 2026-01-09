import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Edit } from 'lucide-react';
import { api } from '@/lib/api.ts';
import { toast } from 'sonner';
import { UpdateActivityRequest, Activity } from '@/lib/types.ts';
import { cn } from '@/lib/utils.ts';
import { X } from 'lucide-react';

import { usePWA } from '@/pwa/hooks/usePWA.ts';

interface EditActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity;
  onSuccess: () => void;
}

export const EditActivityDialog: React.FC<EditActivityDialogProps> = ({
  open,
  onOpenChange,
  activity,
  onSuccess
}) => {
  const { isPWA } = usePWA();
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

  useEffect(() => {
    if (activity && open) {
      // Extract time from startTime if it exists
      let timeString = '';
      if (activity.startTime) {
        if (activity.startTime.includes('T')) {
          try {
            timeString = activity.startTime.split('T')[1].substring(0, 5);
          } catch (e) {
            const date = new Date(activity.startTime);
            if (!isNaN(date.getTime())) {
              timeString = date.toTimeString().slice(0, 5);
            }
          }
        } else {
          timeString = activity.startTime;
        }
      }

      setFormData({
        title: activity.title || '',
        startTime: timeString,
        durationMin: activity.durationMin || 60,
        location: activity.location || '',
        notes: activity.notes || '',
        important: activity.important || false
      });
    }
  }, [activity, open]);


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
      // Create update data according to backend DTO
      const updateData: UpdateActivityRequest = {
        title: formData.title.trim(),
        startTime: formData.startTime ? `2025-09-15T${formData.startTime}:00.000Z` : undefined,
        durationMin: formData.durationMin,
        location: formData.location.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        important: formData.important
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key =>
        updateData[key as keyof UpdateActivityRequest] === undefined && delete updateData[key as keyof UpdateActivityRequest]
      );

      await api.patch<Activity>(`/activities/${activity.id}`, updateData);

      toast.success('Đã cập nhật hoạt động thành công');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Update activity error:', error);
      toast.error(error.message || 'Không thể cập nhật hoạt động');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose={isPWA}
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card dark:bg-[#1c1e26] border-border dark:border-gray-800 text-foreground dark:text-white shadow-2xl rounded-[24px] sm:rounded-[32px] p-0 gap-0"
      >
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
              <Edit className="w-5 h-5 text-[#6347f9]" />
              <span>Chỉnh sửa hoạt động</span>
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

          <div className="p-6 space-y-6 bg-card dark:bg-[#1c1e26]">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-muted-foreground dark:text-slate-300 font-medium text-sm">
                Tên hoạt động <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Tham quan bảo tàng"
                className="h-12 bg-secondary dark:bg-[#242731] border-border dark:border-gray-700 text-foreground dark:text-white placeholder:text-muted-foreground/60 dark:placeholder:text-slate-500 focus:border-[#6347f9] hover:border-[#6347f9] transition-colors rounded-xl outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-muted-foreground dark:text-slate-300 font-medium text-sm">Giờ bắt đầu</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="h-12 bg-secondary dark:bg-[#242731] border-border dark:border-gray-700 text-foreground dark:text-white focus:border-[#6347f9] hover:border-[#6347f9] transition-colors rounded-xl outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMin" className="text-muted-foreground dark:text-slate-300 font-medium text-sm">Thời lượng (phút)</Label>
                <Input
                  id="durationMin"
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.durationMin}
                  onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 0 })}
                  className="h-12 bg-secondary dark:bg-[#242731] border-border dark:border-gray-700 text-foreground dark:text-white focus:border-[#6347f9] hover:border-[#6347f9] transition-colors rounded-xl outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-muted-foreground dark:text-slate-300 font-medium text-sm">Địa điểm</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="VD: Thành phố Hồ Chí Minh"
                className="h-12 bg-secondary dark:bg-[#242731] border-border dark:border-gray-700 text-foreground dark:text-white placeholder:text-muted-foreground/60 dark:placeholder:text-slate-500 focus:border-[#6347f9] hover:border-[#6347f9] transition-colors rounded-xl outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-muted-foreground dark:text-slate-300 font-medium text-sm">Ghi chú</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ghi chú thêm về hoạt động..."
                rows={3}
                className="bg-secondary dark:bg-[#242731] border-border dark:border-gray-700 text-foreground dark:text-white placeholder:text-muted-foreground/60 dark:placeholder:text-slate-500 focus:border-[#6347f9] hover:border-[#6347f9] transition-colors rounded-xl outline-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="important"
                checked={formData.important}
                onCheckedChange={(checked) => setFormData({ ...formData, important: !!checked })}
                className="rounded-md border-border dark:data-[state=checked]:bg-[#6347f9] dark:data-[state=checked]:border-[#6347f9]"
              />
              <Label htmlFor="important" className="text-sm font-medium text-foreground dark:text-white cursor-pointer">Đánh dấu là hoạt động quan trọng</Label>
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
                  Đang cập nhật...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};