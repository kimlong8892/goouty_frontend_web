import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, Loader2, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronLeft, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useGlobalToast } from '@/utils/globalToast';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePWA } from '@/pwa/hooks/usePWA';
import { useIsMobile } from '@/hooks/use-mobile';

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
    const { isPWA } = usePWA();
    const isMobile = useIsMobile();
    const isMobileView = isPWA || isMobile;

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
        <Dialog open={open} onOpenChange={handleOpenChange} modal={!isMobileView}>
            <DialogContent
                className={cn(
                    "bg-card border-border flex flex-col p-0 overflow-hidden outline-none",
                    isMobileView ? "h-[calc(100dvh-5rem)] top-0 translate-y-0 w-full max-w-none rounded-none border-none bg-background shadow-none" : "sm:max-w-[600px] max-h-[90vh] rounded-[32px]"
                )}
                hideClose={isMobileView}
                onInteractOutside={(e) => {
                    if (isMobileView) e.preventDefault();
                }}
            >
                {isMobileView && (
                    <style>{`
                        [data-radix-portal] > [data-state=open] { background-color: transparent !important; }
                    `}</style>
                )}
                {isMobileView ? (
                    <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md px-4 py-0.5 flex items-center justify-between min-h-[40px]">
                        <button
                            onClick={() => handleOpenChange(false)}
                            disabled={loading}
                            className="p-2 -ml-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-base font-black absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-foreground">
                            Tạo chuyến đi từ URL
                        </h1>
                        <div className="w-10"></div>
                    </div>
                ) : (
                    <DialogHeader className="p-8 pb-0">
                        <DialogTitle className="text-foreground flex items-center gap-2 text-2xl font-black italic">
                            <Link2 className="w-7 h-7 text-primary" />
                            Tạo chuyến đi từ URL
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-base mt-2">
                            Nhập URL từ Google Sheets, TikTok hoặc YouTube để tạo chuyến đi tự động
                        </DialogDescription>
                    </DialogHeader>
                )}

                <div
                    className={cn(
                        "flex-1 overflow-y-auto pt-2",
                        isMobileView ? "px-5 pb-32 overscroll-contain" : "px-8 py-6 custom-scrollbar"
                    )}
                    style={{ WebkitOverflowScrolling: 'touch' }}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    <div className={cn("w-full mx-auto space-y-6", isMobileView ? "max-w-md" : "")}>
                        {!isMobileView && (
                            <div className="bg-primary/5 border border-primary/10 rounded-[24px] p-6 space-y-3">
                                <p className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Hỗ trợ các loại URL:
                                </p>
                                <ul className="text-sm text-slate-600 space-y-2 ml-1">
                                    {['Google Sheets', 'TikTok', 'YouTube'].map(t => (
                                        <li key={t} className="flex items-center gap-2 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="url" className="text-muted-foreground text-sm font-bold ml-1">
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
                                        "h-14 rounded-[24px] bg-card dark:bg-slate-900/50 border-none shadow-sm focus:ring-primary/20 transition-all text-base px-5",
                                        isMobileView ? "" : "border border-border",
                                        error && "ring-1 ring-destructive"
                                    )}
                                    disabled={loading}
                                />
                                {error && <p className="text-xs text-destructive ml-1 font-bold">{error}</p>}
                            </div>

                            {isMobileView && (
                                <div className="bg-primary/5 rounded-[24px] p-6 space-y-4">
                                    <p className="text-base font-black text-foreground flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                                        Hỗ trợ các loại URL:
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {['Google Sheets', 'TikTok', 'YouTube'].map((type) => (
                                            <div key={type} className="flex items-center gap-3 text-[15px] text-muted-foreground bg-card/60 dark:bg-slate-900/40 p-3.5 rounded-[18px] font-bold tracking-tight">
                                                <div className="w-2 h-2 rounded-full bg-primary/30"></div>
                                                {type}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={cn(
                                "rounded-[24px] p-6 transition-all",
                                isMobileView ? "bg-amber-500/10 dark:bg-amber-500/5" : "bg-amber-500/10 border border-amber-500/20"
                            )}>
                                <p className={cn("text-[14px] leading-relaxed", isMobileView ? "text-amber-800 dark:text-amber-200 font-bold" : "text-amber-700 dark:text-amber-400 font-medium")}>
                                    <span className="font-black uppercase text-[12px] opacity-70">Lưu ý:</span> Sau khi gửi yêu cầu, bạn sẽ nhận được email thông báo trong vài phút khi chuyến đi được tạo thành công.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "w-full rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] text-white",
                                    isMobileView ? "h-12 text-base bg-primary shadow-primary/25" : "h-12 bg-primary hover:bg-primary/90"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Tạo chuyến đi'
                                )}
                            </Button>
                        </form>

                        <div className="space-y-6 pt-6">
                            <div className="flex items-center justify-between ml-1">
                                <h3 className="text-base font-black text-foreground">Lịch sử tạo gần đây</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={loadingPending}
                                    className="h-9 w-9 p-0 rounded-full hover:bg-background/80 transition-colors"
                                >
                                    <RefreshCw className={cn("h-4 w-4 text-muted-foreground", loadingPending && "animate-spin")} />
                                </Button>
                            </div>

                            {pendingTrips.length === 0 && !loadingPending ? (
                                <div className="text-center py-14 bg-card dark:bg-slate-900/50 rounded-[32px] border border-dashed border-border">
                                    <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-sm text-muted-foreground font-bold">Chưa có lịch sử tạo trip nào.</p>
                                </div>
                            ) : (
                                <div className="bg-card dark:bg-slate-900/50 rounded-[32px] shadow-sm border border-border overflow-hidden">
                                    {pendingTrips.map((item, index) => {
                                        const { icon: Icon, color, badge, label, spin } = getStatusInfo(item.status);
                                        return (
                                            <div key={item.id}>
                                                <div className="p-5 space-y-4 active:bg-muted/50 transition-all">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[14px] font-black truncate text-foreground tracking-tight" title={item.url}>
                                                                {item.url}
                                                            </p>
                                                            <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5 font-bold opacity-60">
                                                                <Clock className="w-3 h-3" />
                                                                {item.createdAt.replace('T', ' ').slice(0, 19).split(' ')[0].split('-').reverse().join('/') + ' ' + item.createdAt.replace('T', ' ').slice(0, 19).split(' ')[1]}
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className={cn("shrink-0 h-8 px-4 rounded-full font-black text-[10px] uppercase tracking-wider shadow-none", badge)}>
                                                            {spin && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                                                            {!spin && <Icon className="mr-1.5 h-3 w-3" />}
                                                            {label}
                                                        </Badge>
                                                    </div>
                                                    {item.error && (
                                                        <div className="bg-destructive/5 text-destructive text-[11px] font-bold p-3 px-4 rounded-xl border border-destructive/10 break-words flex items-start gap-2">
                                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                            Lỗi: {item.error}
                                                        </div>
                                                    )}
                                                </div>
                                                {index < pendingTrips.length - 1 && (
                                                    <div className="h-[1px] bg-border/50 mx-5" />
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
                                    className="w-full h-12 rounded-2xl text-muted-foreground text-xs hover:bg-card/80 font-black uppercase tracking-widest"
                                    onClick={handleLoadMore}
                                    disabled={loadingPending}
                                >
                                    {loadingPending ? 'Đang tải...' : 'Xem thêm lịch sử'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {!isMobileView && (
                    <DialogFooter className="p-8 pt-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            className="rounded-2xl w-full sm:w-auto px-8 h-12 font-black uppercase text-xs tracking-widest"
                        >
                            Đóng
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};
