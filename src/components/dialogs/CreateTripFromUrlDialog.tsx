import React, { useState } from 'react';
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
import { Link2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useGlobalToast } from '@/utils/globalToast';

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

            // Reset form and close dialog
            setUrl('');
            onOpenChange(false);
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-primary" />
                        Tạo chuyến đi từ URL
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Nhập URL từ Google Sheets, TikTok hoặc YouTube để tạo chuyến đi tự động
                    </DialogDescription>
                </DialogHeader>

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

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={loading}
                            className="rounded-xl"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-primary hover:bg-primary/90"
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
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
