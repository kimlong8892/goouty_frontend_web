import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  Copy,
  Link2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Users
} from 'lucide-react';
import { api } from '@/lib/api';
import { ShareLink, Trip } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { envUtils } from '@/lib/env';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';

interface ShareLinkManagerProps {
  trip: Trip;
}

export function ShareLinkManager({ trip }: ShareLinkManagerProps) {
  const { user } = useAuth();
  const { isPWA } = usePWA();
  const isMobile = useIsMobile();
  const isMobileView = isPWA || isMobile;
  const queryClient = useQueryClient();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);

  const isOwner = user?.id === trip.userId;
  const hasActiveShareLink = trip.shareToken && trip.isPublic;

  // Hiển thị thông báo khi có share link sẵn
  useEffect(() => {
    if (hasActiveShareLink && isOwner) {
      const generatedLink = envUtils.generateTripShareLink(trip.id, trip.shareToken!);
      setShareLink({
        shareToken: trip.shareToken!,
        shareLink: generatedLink,
        tripId: trip.id
      });
    }
  }, [trip.shareToken, trip.isPublic, trip.id, isOwner]);

  // Generate share link mutation
  const generateShareLinkMutation = useMutation({
    mutationFn: () => api.post<ShareLink>(`/trips/${trip.id}/share`, {}),
    onSuccess: (data) => {
      setShareLink(data);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', trip.id] });
      toast.success('Link chia sẻ đã được tạo thành công!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo link chia sẻ';
      toast.error(errorMessage);
    },
  });

  // Revoke share link mutation
  const revokeShareLinkMutation = useMutation({
    mutationFn: () => api.delete(`/trips/${trip.id}/share`),
    onSuccess: () => {
      setShareLink(null);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', trip.id] });
      toast.success('Link chia sẻ đã được thu hồi!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi thu hồi link chia sẻ';
      toast.error(errorMessage);
    },
  });

  const handleGenerateShareLink = () => {
    generateShareLinkMutation.mutate();
  };

  const handleRevokeShareLink = () => {
    setRevokeConfirmOpen(true);
  };

  const confirmRevokeShareLink = () => {
    revokeShareLinkMutation.mutate();
    setRevokeConfirmOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link đã được sao chép vào clipboard!');
    }).catch(() => {
      toast.error('Không thể sao chép link');
    });
  };

  const currentShareLink = shareLink?.shareLink || (hasActiveShareLink && trip.shareToken
    ? envUtils.generateTripShareLink(trip.id, trip.shareToken)
    : null);

  if (!isOwner) {
    return null;
  }

  return (
    <div className={cn("space-y-6 animate-in fade-in duration-500", isMobileView && "space-y-4")}>
      <div className={cn(
        "flex justify-between gap-4 border-b border-gray-100 pb-6",
        isMobileView ? "flex-col pb-4" : "flex-row items-center"
      )}>
        <div>
          <h2 className={cn("font-bold text-gray-900 flex items-center gap-2", isMobileView ? "text-lg" : "text-2xl")}>
            <div className={cn("rounded-xl relative overflow-hidden group", isMobileView ? "p-1.5" : "p-2 bg-indigo-50")}>
              <Share2 className={cn("text-[#6c5dd3] relative z-10", isMobileView ? "w-5 h-5" : "w-6 h-6")} />
            </div>
            Chia sẻ
          </h2>
          {!isMobileView && <p className="text-gray-500 mt-1 text-sm font-medium">
            Quản lý quyền truy cập và mời bạn bè tham gia
          </p>}
        </div>
        <div className={cn(
          "flex items-center gap-3 rounded-xl",
          !isMobileView && "bg-gray-50/50 p-1.5 border border-gray-100"
        )}>
          {hasActiveShareLink ? (
            <Badge variant="secondary" className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-100 transition-colors gap-1.5 text-xs font-semibold rounded-lg">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              Công khai
            </Badge>
          ) : (
            <Badge variant="outline" className="px-3 py-1 bg-gray-50 text-gray-500 gap-1.5 text-xs font-semibold rounded-lg border-gray-200">
              <EyeOff className="w-3 h-3" />
              Riêng tư
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-8">
        {hasActiveShareLink || shareLink ? (
          <div className="space-y-6">
            <div className="relative overflow-hidden group rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-8 shadow-sm transition-all hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Share2 className="w-32 h-32 text-indigo-500 -rotate-12 transform translate-x-8 -translate-y-8" />
              </div>

              <div className="relative z-10 space-y-6">
                <div>
                  <h4 className={cn("font-bold text-gray-900 mb-1", isMobileView ? "text-base" : "text-lg")}>Liên kết chia sẻ</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Bất kỳ ai có liên kết này đều có thể xem và tham gia chuyến đi
                  </p>
                </div>

                {currentShareLink && (
                  <div className="flex flex-col gap-3">
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Link2 className="h-4 w-4 text-gray-400 group-hover/input:text-[#6c5dd3] transition-colors" />
                      </div>
                      <Input
                        value={currentShareLink}
                        readOnly
                        className="pl-10 h-11 bg-white border-gray-200 focus:border-[#6c5dd3] focus:ring-[#6c5dd3]/20 rounded-xl font-medium text-gray-600 transition-all text-[13px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="default"
                        className="flex-1 h-11 bg-[#6c5dd3] hover:bg-[#5b4ec2] text-white rounded-xl shadow-md transition-all font-semibold active:scale-95"
                        onClick={() => copyToClipboard(currentShareLink)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Sao chép
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-11 w-11 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-600 active:scale-95 transition-all"
                        onClick={() => window.open(currentShareLink, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRevokeShareLink}
                    disabled={revokeShareLinkMutation.isPending}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-3 -ml-3 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {revokeShareLinkMutation.isPending ? 'Đang thu hồi...' : 'Thu hồi liên kết này'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-gradient-to-b from-gray-50/50 to-transparent rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
              <Users className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có liên kết chia sẻ</h3>
            <p className="text-gray-500 mb-8 max-w-md text-center">
              Tạo liên kết để mời bạn bè, gia đình cùng tham gia lên kế hoạch cho chuyến đi tuyệt vời này
            </p>
            <Button
              size="lg"
              onClick={handleGenerateShareLink}
              disabled={generateShareLinkMutation.isPending}
              className="h-12 px-8 bg-[#6c5dd3] hover:bg-[#5b4ec2] text-white rounded-xl shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all duration-300 font-semibold"
            >
              {generateShareLinkMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <Share2 className="h-5 w-5 mr-2" />
                  Tạo liên kết chia sẻ
                </>
              )}
            </Button>
          </div>
        )}

        <div className={cn(
          "grid gap-4 pt-4",
          isMobileView ? "grid-cols-1" : "grid-cols-2"
        )}>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-[#6c5dd3]" />
              Tham gia
            </h4>
            <ul className="space-y-2">
              <li className="flex gap-2 text-xs text-slate-500">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                Có thể xem chi tiết chuyến đi
              </li>
              <li className="flex gap-2 text-xs text-slate-500">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                Yêu cầu tham gia làm thành viên
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm">
              <EyeOff className="w-4 h-4 text-orange-500" />
              Riêng tư
            </h4>
            <ul className="space-y-2">
              <li className="flex gap-2 text-xs text-slate-500">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                Tới quản lý thành viên
              </li>
              <li className="flex gap-2 text-xs text-slate-500">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                Thu hồi link bất cứ lúc nào
              </li>
            </ul>
          </div>
        </div>
      </div>

      <AlertDialog open={revokeConfirmOpen} onOpenChange={setRevokeConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-xl">
              <span className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-2">
                <Trash2 className="h-5 w-5 text-red-500" />
              </span>
              Thu hồi liên kết?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              <p className="text-gray-600">
                Hành động này sẽ vô hiệu hóa liên kết chia sẻ hiện tại. Những người chưa tham gia sẽ không thể truy cập được nữa.
              </p>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                  <EyeOff className="w-4 h-4" />
                  Lưu ý
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  Thành viên đã tham gia sẽ không bị ảnh hưởng.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900">
              Giữ lại thông tin
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeShareLink}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-200"
              disabled={revokeShareLinkMutation.isPending}
            >
              {revokeShareLinkMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thu hồi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
