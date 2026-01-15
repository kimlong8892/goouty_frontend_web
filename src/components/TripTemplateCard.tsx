import { Button } from '@/components/ui/button';
import { MapPin, Star, Heart, ChevronRight, Loader2 } from 'lucide-react';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '@/pwa/hooks/usePWA';
import { api } from '@/integrations/api/client';
import { cn } from '@/lib/utils';

import { useAuth } from '@/contexts/AuthContext';

interface TripTemplateCardProps {
  template: DATABASE_TYPES.tripTemplates;
  onUseTemplate?: (template: DATABASE_TYPES.tripTemplates) => void;
  usingTemplate?: boolean;
  onWishlistUpdate?: (templateId: string, isWishlisted: boolean) => void;
}

export const TripTemplateCard = ({ template, onUseTemplate, usingTemplate, onWishlistUpdate }: TripTemplateCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isPWA } = usePWA();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(template.isWishlisted || false);
  const [isWishlisting, setIsWishlisting] = useState(false);

  // Sync state if template prop changes (e.g. after search/fetch)
  useEffect(() => {
    setIsFavorite(template.isWishlisted || false);
  }, [template.isWishlisted]);

  const handleViewDetails = () => {
    if (isPWA) {
      navigate(`/pwa-template-details/${template.id}`);
    } else {
      navigate(`/template/${template.id}`);
    }
  };

  const handleUseTemplate = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when using template
    if (onUseTemplate) {
      onUseTemplate(template);
      return;
    }

    setIsLoading(true);
    try {
      const newTrip = await api.trips.createFromTemplate(template.id, template.title);
      toast({
        title: "Trip created successfully!",
        description: "Your trip has been created from the template.",
      });
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error creating trip from template:', error);
      toast({
        title: "Error",
        description: "Failed to create trip from template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Dummy data for design match since API might not return these yet
  const rating = 5.0;
  const reviewCount = "6k";
  const displayPrice = template.fee && Number(template.fee) > 0
    ? `Từ ${Number(template.fee).toLocaleString('vi-VN')}đ`
    : "Linh hoạt";

  return (
    <div
      className="group relative rounded-[32px] overflow-hidden border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(108,93,211,0.15)] transition-all duration-500 bg-card h-[420px] w-full flex flex-col cursor-pointer"
      onClick={handleViewDetails}
    >
      {/* Background Image - Full Cover */}
      <div className="relative h-1/2 overflow-hidden">
        <img
          src={template.avatar || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60"}
          alt={template.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60";
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

        {/* Favorite Button */}
        <button
          className={cn(
            "absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all border active:scale-95 disabled:opacity-50",
            isFavorite
              ? "bg-red-500/20 border-red-500/50"
              : "bg-white/20 border-white/20 hover:bg-white/40"
          )}
          onClick={async (e) => {
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
                toast({
                  title: "Đã thêm vào yêu thích",
                  description: `Đã thêm "${template.title}" vào danh sách của bạn.`,
                });
              } else {
                await api.tripTemplates.removeFromWishlist(template.id);
                toast({
                  title: "Đã xóa khỏi yêu thích",
                  description: `Đã xóa "${template.title}" khỏi danh sách của bạn.`,
                });
              }
              setIsFavorite(newFavoriteStatus);
              if (onWishlistUpdate) {
                onWishlistUpdate(template.id, newFavoriteStatus);
              }
            } catch (error) {
              console.error('Error toggling wishlist:', error);
              toast({
                title: "Lỗi",
                description: "Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.",
                variant: "destructive",
              });
            } finally {
              setIsWishlisting(false);
            }
          }}
          disabled={isWishlisting}
        >
          {isWishlisting ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <Heart
              size={20}
              className={isFavorite ? "fill-red-500 text-red-500" : "text-white"}
            />
          )}
        </button>
      </div>

      {/* Content Card */}
      <div className="flex-1 bg-card p-6 flex flex-col justify-between relative -mt-6 rounded-t-[32px] z-10">
        <div>
          {/* Header: Title & Price */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <h3 className="font-bold text-base text-foreground flex-1 leading-snug" title={template.title}>
              {template.title}
            </h3>
            <div className="flex flex-col items-end shrink-0">
              <div className="bg-primary/10 dark:bg-primary/20 px-3 py-2 rounded-2xl border border-primary/10 flex flex-col items-end shadow-sm backdrop-blur-sm">
                <span className={cn(
                  "text-primary font-black leading-none",
                  displayPrice === "Linh hoạt" ? "text-xs text-center font-bold" : "text-xs"
                )}>
                  {displayPrice}
                </span>
                {displayPrice !== "Linh hoạt" && (
                  <span className="text-primary/60 text-[9px] font-extrabold uppercase tracking-widest mt-1">/ người</span>
                )}
              </div>
            </div>
          </div>

          {/* Location & Rating row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-muted-foreground font-medium text-sm">
              <MapPin size={16} className="mr-1.5 text-red-500" />
              <span className="truncate max-w-[120px]">{template.province?.name || "Vietnam"}</span>
            </div>

            <div className="flex items-center bg-secondary/50 px-2 py-0.5 rounded-full">
              <Star size={14} className="fill-yellow-400 text-yellow-400 mr-1" />
              <span className="font-bold text-muted-foreground text-xs">{rating}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-2xl border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-secondary text-sm font-bold h-12 transition-all active:scale-[0.98] bg-card"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
          >
            Xem chi tiết
          </Button>

          <Button
            size="lg"
            className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm font-bold h-12 shadow-[0_4px_15px_rgba(108,93,211,0.3)] hover:shadow-[0_8px_25px_rgba(108,93,211,0.4)] transition-all active:scale-[0.98]"
            onClick={handleUseTemplate}
            disabled={isLoading || usingTemplate}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <div className="flex items-center justify-center w-full">
                Bắt đầu
                <ChevronRight size={16} className="ml-1" />
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
