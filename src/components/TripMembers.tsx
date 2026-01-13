import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Crown, Trash2, Mail, UserPlus, Check, X, Clock, Send } from 'lucide-react';
import { api } from '@/integrations/api/client';
import { TripMember, AddMemberRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';

interface TripMembersProps {
  tripId: string;
  tripOwnerId: string;
  onCountChange?: (count: number) => void;
}

export function TripMembers({ tripId, tripOwnerId, onCountChange }: TripMembersProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPWA } = usePWA();
  const isMobile = useIsMobile();
  const isMobileView = isPWA || isMobile;
  const queryClient = useQueryClient();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [isDeleteMemberOpen, setIsDeleteMemberOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);

  const isOwner = user?.id === tripOwnerId;

  // Fetch trip members
  const {
    data: members,
    isLoading,
    error,
  } = useQuery<TripMember[]>({
    queryKey: ['trip-members', tripId],
    queryFn: () => api.members.getByTrip(tripId),
  });

  // Notify parent when member list changes
  React.useEffect(() => {
    if (members && onCountChange) {
      const otherAcceptedCount = members.filter(m => m && m.user?.id !== tripOwnerId && (m.status === 'accepted' || !m.status)).length;
      onCountChange(otherAcceptedCount + 1);
    }
  }, [members, onCountChange]);

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (data: AddMemberRequest) =>
      api.members.addToTrip(tripId, data.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
      setIsAddMemberOpen(false);
      setMemberEmail('');
      toast.success('Đã gửi lời mời thành công!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi lời mời';
      toast.error(errorMessage);
    },
  });

  // Accept invite mutation
  const acceptInviteMutation = useMutation({
    mutationFn: (memberId: string) => {
      return api.members.acceptInviteByMemberId(tripId, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
      toast.success('Đã chấp nhận lời mời!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi chấp nhận lời mời';
      toast.error(errorMessage);
    },
  });

  // Reject invite mutation (remove pending member)
  const rejectInviteMutation = useMutation({
    mutationFn: (memberId: string) => {
      return api.members.removeFromTrip(tripId, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
      toast.success('Đã từ chối lời mời');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi từ chối lời mời';
      toast.error(errorMessage);
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: (memberId: string) => {
      return api.members.resendInvitation(tripId, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
      toast.success('Đã gửi lại lời mời thành công!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi lại lời mời';
      toast.error(errorMessage);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/trips/${tripId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
      toast.success('Thành viên đã được xóa thành công!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa thành viên';
      toast.error(errorMessage);
    },
  });

  const handleAddMember = () => {
    if (!memberEmail.trim()) {
      toast.error('Vui lòng nhập email thành viên');
      return;
    }

    addMemberMutation.mutate({
      email: memberEmail,
    });
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setIsDeleteMemberOpen(true);
  };

  const confirmDeleteMember = () => {
    if (memberToDelete) {
      removeMemberMutation.mutate(memberToDelete.id);
      setIsDeleteMemberOpen(false);
      setMemberToDelete(null);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Có lỗi xảy ra khi tải danh sách thành viên
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", isMobileView && "space-y-4")}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className={cn("font-bold text-slate-900 dark:text-slate-50", isMobileView ? "text-lg" : "text-xl")}>
            Thành viên
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {(members?.filter(m => m && m.user?.id !== tripOwnerId && (m.status === 'accepted' || !m.status)).length || 0) + 1} người
          </p>
        </div>
        {isOwner && (
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
              <Button
                size={isMobileView ? "sm" : "default"}
                onClick={(e) => {
                  if (isPWA) {
                    e.preventDefault();
                    navigate(`/pwa-invite-member/${tripId}`);
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition-all hover:shadow-lg h-10 px-4"
              >
                {isMobileView ? <UserPlus className="h-5 w-5" /> : <Plus className="h-5 w-5 mr-2" />}
                {!isMobileView && "Thêm thành viên"}
              </Button>
            </DialogTrigger>
            <DialogContent className={cn("max-w-md", isMobileView ? "w-[95%] rounded-3xl" : "rounded-2xl")}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-primary">Mời thành viên mới</DialogTitle>
                <DialogDescription>
                  Nhập email của người bạn muốn mời. Họ sẽ nhận được thông báo và cần chấp nhận lời mời trước khi tham gia.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-slate-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus-visible:ring-primary"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddMemberOpen(false)}
                  disabled={addMemberMutation.isPending}
                  className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleAddMember}
                  disabled={addMemberMutation.isPending}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-white"
                >
                  {addMemberMutation.isPending ? 'Đang gửi...' : 'Gửi lời mời'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Member List */}
      <div className="grid gap-4">
        {/* Pending Invitations Section */}
        {members?.some(m => m && m.status === 'pending') && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lời mời đang chờ
            </h4>
            {members
              .filter(m => m && m.status === 'pending')
              .map((member) => {
                const isCurrentUser = member.user.id === user?.id;

                return (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20",
                      isMobileView && "p-3 gap-3"
                    )}
                  >
                    <Avatar className={cn("border-2 border-amber-300 dark:border-amber-800 shadow-sm", isMobileView ? "w-12 h-12" : "w-16 h-16")}>
                      <AvatarImage src={member.user.profilePicture} />
                      <AvatarFallback className={cn("bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold", isMobileView ? "text-sm" : "text-base")}>
                        {getInitials(member.user.fullName, member.user.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={cn("font-bold text-slate-900 dark:text-slate-100 truncate", isMobileView ? "text-base" : "text-lg")}>
                            {member.user.fullName || member.user.email.split('@')[0]}
                          </span>
                          {isCurrentUser && (
                            <span className="text-slate-400 font-medium text-[11px] flex-shrink-0">(bạn)</span>
                          )}
                        </div>
                        <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 border-0 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-none h-5">
                          <Clock className="h-3 w-3 mr-1" />
                          Đang chờ
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[12px] min-w-0">
                          <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          <span className="truncate">{member.user.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions for pending invitations */}
                    {isCurrentUser && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => acceptInviteMutation.mutate(member.id)}
                          disabled={acceptInviteMutation.isPending}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full h-10 w-10 transition-colors"
                          title="Chấp nhận"
                        >
                          <Check className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn từ chối lời mời này?')) {
                              rejectInviteMutation.mutate(member.id);
                            }
                          }}
                          disabled={rejectInviteMutation.isPending}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full h-10 w-10 transition-colors"
                          title="Từ chối"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    )
                    }
                    {isOwner && !isCurrentUser && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => resendInvitationMutation.mutate(member.id)}
                          disabled={resendInvitationMutation.isPending}
                          className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full h-10 w-10 transition-colors"
                          title="Gửi lại lời mời"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id, member.user.fullName || member.user.email)}
                          disabled={removeMemberMutation.isPending}
                          className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full h-10 w-10 transition-colors"
                          title="Hủy lời mời"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Accepted Members Section */}
        {members?.some(m => m && (m.status === 'accepted' || !m.status)) && (
          <div className="space-y-3">
            {members?.some(m => m && m.status === 'pending') && (
              <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Thành viên</h4>
            )}
            {members
              .filter(m => m && (m.status === 'accepted' || !m.status))
              .map((member) => {
                const isCurrentUser = member.user.id === user?.id;
                const isTripOwner = member.user.id === tripOwnerId;

                return (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border border-slate-100 dark:border-indigo-500/20 bg-white dark:bg-indigo-500/10 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-md transition-all duration-300",
                      isMobileView && "p-3 gap-3"
                    )}
                  >
                    <Avatar className={cn("border-2 border-white dark:border-slate-800 shadow-sm", isMobileView ? "w-12 h-12" : "w-16 h-16")}>
                      <AvatarImage src={member.user.profilePicture} />
                      <AvatarFallback className={cn("bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold", isMobileView ? "text-sm" : "text-base")}>
                        {getInitials(member.user.fullName, member.user.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={cn("font-bold text-slate-900 dark:text-slate-100 truncate", isMobileView ? "text-base" : "text-lg")}>
                            {member.user.fullName || member.user.email.split('@')[0]}
                          </span>
                          {isCurrentUser && (
                            <span className="text-slate-400 font-medium text-[11px] flex-shrink-0">(bạn)</span>
                          )}
                        </div>
                        {isTripOwner && (
                          <Badge className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-0 rounded-md px-1.5 py-0 text-[10px] font-bold shadow-none h-5">
                            <Crown className="h-3 w-3 mr-1" />
                            Chủ
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[12px] min-w-0">
                          <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          <span className="truncate">{member.user.email}</span>
                        </div>
                        {!isMobileView && member.joinedAt && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            Tham gia: {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {isOwner && member.user.id !== tripOwnerId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id, member.user.fullName || member.user.email)}
                        disabled={removeMemberMutation.isPending}
                        className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full h-10 w-10 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {(!members || members.length === 0) && (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-900 dark:text-slate-200 font-medium mb-1">Chưa có thành viên nào</p>
            {isOwner && (
              <p className="text-slate-500 dark:text-slate-400 text-sm">Hãy mời bạn bè để cùng lên kế hoạch nhé!</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDeleteMemberOpen} onOpenChange={setIsDeleteMemberOpen}>
        <DialogContent className="rounded-2xl bg-white dark:bg-[#1a1a2e] border-none shadow-2xl max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Xác nhận xóa thành viên</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 mt-2">
              Bạn có chắc chắn muốn xóa thành viên "{memberToDelete?.name}"? Họ sẽ không còn truy cập được vào chuyến đi này nữa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-3 mt-6 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteMemberOpen(false)}
              className="flex-1 sm:flex-none rounded-xl bg-white dark:bg-slate-800 text-primary dark:text-slate-200 hover:bg-primary/5 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 hover:border-primary/20 font-bold transition-all h-11"
            >
              Hủy
            </Button>
            <Button
              onClick={confirmDeleteMember}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-primary/20 h-11"
            >
              Xóa người này
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
