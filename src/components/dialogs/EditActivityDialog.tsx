import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Edit } from 'lucide-react';
import { api } from '@/lib/api.ts';
import { toast } from 'sonner';
import { UpdateActivityRequest, Activity } from '@/lib/types.ts';

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

      const updatedActivity = await api.patch<Activity>(`/activities/${activity.id}`, updateData);

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Chỉnh sửa hoạt động
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Tên hoạt động *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Tham quan bảo tàng"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Giờ bắt đầu</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="durationMin">Thời lượng (phút)</Label>
              <Input
                id="durationMin"
                type="number"
                min="1"
                max="1440"
                value={formData.durationMin}
                onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 60 })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Địa điểm</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="VD: Thành phố Hồ Chí Minh"
            />
          </div>
          <div>
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ghi chú thêm về hoạt động..."
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="important"
              checked={formData.important}
              onCheckedChange={(checked) => setFormData({ ...formData, important: !!checked })}
            />
            <Label htmlFor="important">Đánh dấu là hoạt động quan trọng</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="hover:bg-transparent hover:text-primary hover:border-primary">
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};