import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, Loader2, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useGlobalToast } from '@/utils/globalToast';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CreateTripFromUrlDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CreateTripFromUrlDialog: React.FC<CreateTripFromUrlDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { showToast } = useGlobalToast();

    // Pending trips state
    const [pendingTrips, setPendingTrips] = useState<DATABASE_TYPES.pendingTrips[]>([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const LIMIT = 5;

    const fetchPendingTrips = async (pageNum: number, isRefresh = false) => {
        try {
            setLoadingPending(true);
            const response = await api.trips.getPending({ page: pageNum, limit: LIMIT });

            if (isRefresh || pageNum === 1) {
                setPendingTrips(response.data);
            } else {
                setPendingTrips(prev => [...prev, ...response.data]);
            }

            setHasMore(response.pagination.page < response.pagination.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch pending trips:', error);
        } finally {
            setLoadingPending(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchPendingTrips(1, true);
        }
    }, [open]);

    const handleLoadMore = () => {
        if (!loadingPending && hasMore) {
            fetchPendingTrips(page + 1);
        }
    };

    const handleRefresh = () => {
        fetchPendingTrips(1, true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            setError('Vui lòng nhập URL');
            return;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            setError('URL không hợp lệ');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.trips.createFromUrl(url);

            showToast(
                'Yêu cầu đã được gửi! Bạn sẽ nhận được email thông báo trong vài phút.',
                'success'
            );

            // Reset form
            setUrl('');
            // Refresh list
            fetchPendingTrips(1, true);
        } catch (err: any) {
            console.error('Create trip from URL error:', err);
            setError(err.message || 'Có lỗi xảy ra khi tạo chuyến đi từ URL');
            showToast(err.message || 'Có lỗi xảy ra khi tạo chuyến đi từ URL', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!loading) {
            if (!newOpen) {
                setUrl('');
                setError('');
            }
            onOpenChange(newOpen);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PENDING':
                return { icon: Clock, color: 'text-yellow-500', badge: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20', label: 'Đang chờ' };
            case 'PROCESSING':
                return { icon: Loader2, color: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20', label: 'Đang xử lý', spin: true };
            case 'COMPLETED':
                return { icon: CheckCircle, color: 'text-green-500', badge: 'bg-green-500/10 text-green-500 hover:bg-green-500/20', label: 'Hoàn thành' };
            case 'FAILED':
                return { icon: XCircle, color: 'text-red-500', badge: 'bg-red-500/10 text-red-500 hover:bg-red-500/20', label: 'Thất bại' };
            default:
                return { icon: AlertCircle, color: 'text-gray-500', badge: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20', label: status };
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-primary" />
                        Tạo chuyến đi từ URL
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Nhập URL từ Google Sheets, TikTok hoặc YouTube để tạo chuyến đi tự động
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-1">
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="url" className="text-muted-foreground font-medium text-sm">
                                URL <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="url"
                                type="url"
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    if (error) setError('');
                                }}
                                className={cn(
                                    "h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground/60",
                                    error && "border-red-500 focus-visible:ring-red-500/20"
                                )}
                                disabled={loading}
                            />
                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-medium text-foreground">Hỗ trợ các loại URL:</p>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    Google Sheets
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    TikTok
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    YouTube
                                </li>
                            </ul>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                <strong>Lưu ý:</strong> Sau khi gửi yêu cầu, bạn sẽ nhận được email thông báo trong vài phút khi chuyến đi được tạo thành công.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-primary hover:bg-primary/90 h-12"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Tạo chuyến đi'
                            )}
                        </Button>
                    </form>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground">Lịch sử tạo gần đây</h3>
                            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loadingPending}>
                                <RefreshCw className={cn("h-4 w-4", loadingPending && "animate-spin")} />
                            </Button>
                        </div>

                        {pendingTrips.length === 0 && !loadingPending ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Chưa có lịch sử tạo trip nào.</p>
                        ) : (
                            <div className="space-y-3">
                                {pendingTrips.map((item) => {
                                    const { icon: Icon, color, badge, label, spin } = getStatusInfo(item.status);
                                    return (
                                        <div key={item.id} className="bg-secondary/50 rounded-xl p-3 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate text-foreground" title={item.url}>
                                                        {item.url}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {item.createdAt.replace('T', ' ').slice(0, 19).split(' ')[0].split('-').reverse().join('/') + ' ' + item.createdAt.replace('T', ' ').slice(0, 19).split(' ')[1]}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary" className={cn("shrink-0", badge)}>
                                                    {spin && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                                    {!spin && <Icon className="mr-1 h-3 w-3" />}
                                                    {label}
                                                </Badge>
                                            </div>
                                            {item.error && (
                                                <div className="bg-red-500/10 text-red-500 text-xs p-2 rounded-lg break-words">
                                                    Lỗi: {item.error}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {hasMore && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground text-xs"
                                onClick={handleLoadMore}
                                disabled={loadingPending}
                            >
                                {loadingPending ? 'Đang tải...' : 'Tải thêm'}
                            </Button>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        className="rounded-xl w-full sm:w-auto"
                    >
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
