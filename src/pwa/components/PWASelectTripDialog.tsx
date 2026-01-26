import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Calendar, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/integrations/api/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PWASelectTripDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (tripId: string) => void;
}

export const PWASelectTripDialog = ({
    isOpen,
    onClose,
    onSelect
}: PWASelectTripDialogProps) => {
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchTrips = async () => {
                setLoading(true);
                try {
                    const response = await api.trips.getAll({ limit: 50 });
                    setTrips(response.trips || []);
                } catch (error) {
                    console.error('Failed to fetch trips:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchTrips();
        }
    }, [isOpen]);

    const filteredTrips = trips.filter(trip =>
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.province?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] w-[380px] p-0 border border-border/50 overflow-hidden rounded-[32px] bg-card shadow-2xl flex flex-col max-h-[85vh]">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight text-center">
                        Chọn chuyến đi
                    </DialogTitle>
                    <p className="text-muted-foreground text-sm text-center mt-1">
                        Chọn chuyến đi bạn muốn thêm chi phí
                    </p>
                </DialogHeader>

                <div className="px-6 py-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Tìm kiếm chuyến đi..."
                            className="pl-10 h-11 bg-secondary/50 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 no-scrollbar max-h-[220px]">
                    {loading ? (
                        <div className="py-20 text-center space-y-3">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Đang tải...</p>
                        </div>
                    ) : filteredTrips.length > 0 ? (
                        filteredTrips.map((trip) => (
                            <button
                                key={trip.id}
                                onClick={() => {
                                    onSelect(trip.id);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 active:bg-primary/10 transition-all border border-transparent hover:border-primary/10 group text-left"
                            >
                                <div className="w-14 h-14 rounded-[20px] overflow-hidden bg-muted flex-shrink-0">
                                    <img
                                        src={trip.avatar || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&auto=format&fit=crop&q=60"}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        alt=""
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-foreground truncate mb-1">
                                        {trip.title}
                                    </h4>
                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-primary" />
                                            {trip.province?.name || 'Chưa xác định'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-primary" />
                                            {trip.startDate ? format(new Date(trip.startDate), "dd/MM") : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Check className="w-4 h-4 text-primary" />
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-sm text-muted-foreground font-medium">Không tìm thấy chuyến đi nào</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
