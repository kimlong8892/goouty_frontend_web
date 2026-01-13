import { DATABASE_TYPES } from '@/integrations/api/types';
import { MapPin, Star, Heart, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '@/integrations/api/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface PWAMasonryCardProps {
    template: DATABASE_TYPES.tripTemplates;
    index: number;
}

export const PWAMasonryCard = ({ template, index }: PWAMasonryCardProps) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isFavorite, setIsFavorite] = useState(template.isWishlisted || false);
    const [isWishlisting, setIsWishlisting] = useState(false);

    // Sync state if template prop changes
    useEffect(() => {
        setIsFavorite(template.isWishlisted || false);
    }, [template.isWishlisted]);

    const handleViewDetails = () => {
        navigate(`/pwa-template-details/${template.id}`);
    };

    const handleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập để lưu mẫu yêu thích.",
                variant: "destructive",
            });
            navigate('/auth');
            return;
        }

        if (isWishlisting) return;

        setIsWishlisting(true);
        const newFavoriteStatus = !isFavorite;
        try {
            if (newFavoriteStatus) {
                await api.tripTemplates.addToWishlist(template.id);
            } else {
                await api.tripTemplates.removeFromWishlist(template.id);
            }
            setIsFavorite(newFavoriteStatus);
        } catch (error) {
            console.error('Error toggling wishlist:', error);
        } finally {
            setIsWishlisting(false);
        }
    };

    // Staggered height based on index or title length to simulate masonry if not using a real masonry layout
    // In the image, some cards are taller than others.
    // Pattern: Row 1 (T, S), Row 2 (S, T)
    // index % 4: 0 -> T, 1 -> S, 2 -> S, 3 -> T
    const isTall = index % 4 === 0 || index % 4 === 3;

    return (
        <div
            className="flex flex-col cursor-pointer w-full group overflow-hidden rounded-[24px] border border-border/40 shadow-sm"
            onClick={handleViewDetails}
        >
            <div
                className={cn(
                    "relative w-full overflow-hidden bg-muted",
                    isTall ? "aspect-[3/4]" : "aspect-[4/3]"
                )}
                style={{ aspectRatio: isTall ? '3/4' : '4/3' }}
            >
                <img
                    src={template.avatar || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60"}
                    alt={template.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Distance Overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-white text-[10px] font-medium">
                    <MapPin size={10} className="fill-white" />
                    <span>{(template.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100 / 10).toFixed(1)}km</span>
                </div>

                {/* Favorite Button */}
                <button
                    onClick={handleFavorite}
                    disabled={isWishlisting}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm border border-white/20 active:scale-90 transition-all"
                >
                    {isWishlisting ? (
                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : (
                        <Heart
                            size={16}
                            className={cn(
                                isFavorite ? "fill-[#ff4d4d] text-[#ff4d4d]" : "text-white"
                            )}
                        />
                    )}
                </button>
            </div>

            <div className="flex flex-col gap-1.5 p-3 bg-[#EBE8FF] dark:bg-[#1A1825] rounded-b-[24px] -mt-1 pt-4">
                <h3 className="text-foreground font-bold text-sm leading-tight">
                    {template.title}
                </h3>

                <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-[#ffcc00] text-[#ffcc00]" />
                    <span className="text-[12px] font-bold text-foreground/90">4.5</span>
                    <span className="text-[11px] text-muted-foreground/70 font-medium">(chưa có đánh giá)</span>
                </div>

                <span className="text-[12px] font-semibold text-primary">
                    {template.fee && template.fee !== "0"
                        ? `Từ ${Number(template.fee).toLocaleString('vi-VN')}đ/người`
                        : "Linh hoạt"}
                </span>
            </div>
        </div>
    );
};
