import { Button } from '@/components/ui/button';
import { MapPin, Star, Heart, ChevronRight, Loader2 } from 'lucide-react';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '@/pwa/hooks/usePWA';
import { api } from '@/integrations/api/client';

interface TripTemplateCardProps {
  template: DATABASE_TYPES.tripTemplates;
  onUseTemplate?: (template: DATABASE_TYPES.tripTemplates) => void;
  usingTemplate?: boolean;
}

export const TripTemplateCard = ({ template, onUseTemplate, usingTemplate }: TripTemplateCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isPWA } = usePWA();

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
  const price = "1.200.000 VNĐ";

  return (
    <div
      className="group relative rounded-[32px] overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(108,93,211,0.15)] transition-all duration-500 bg-white h-[420px] w-full flex flex-col cursor-pointer"
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
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-all border border-white/20 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
        >
          <Heart
            size={20}
            className={isFavorite ? "fill-red-500 text-red-500" : "text-white"}
          />
        </button>
      </div>

      {/* Content Card */}
      <div className="flex-1 bg-white p-6 flex flex-col justify-between relative -mt-6 rounded-t-[32px] z-10">
        <div>
          {/* Header: Title & Price */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-base text-slate-900 pr-2 flex-1 leading-snug" title={template.title}>
              {template.title}
            </h3>
            <div className="flex flex-col items-end">
              <span className="text-[#6347f9] font-black text-lg">{price}</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">/ người</span>
            </div>
          </div>

          {/* Location & Rating row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-slate-500 font-medium text-sm">
              <MapPin size={16} className="mr-1.5 text-red-500" />
              <span className="truncate max-w-[120px]">{template.province?.name || "Vietnam"}</span>
            </div>

            <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded-full">
              <Star size={14} className="fill-yellow-400 text-yellow-400 mr-1" />
              <span className="font-bold text-yellow-700 text-xs">{rating}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-2xl border-slate-200 text-slate-600 hover:border-[#6347f9] hover:text-[#6347f9] hover:bg-slate-50 text-sm font-bold h-12 transition-all active:scale-[0.98]"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
          >
            Xem chi tiết
          </Button>

          <Button
            size="lg"
            className="flex-1 rounded-2xl bg-[#6347f9] hover:bg-[#5136db] text-white text-sm font-bold h-12 shadow-[0_4px_15px_rgba(108,93,211,0.3)] hover:shadow-[0_8px_25px_rgba(108,93,211,0.4)] transition-all active:scale-[0.98]"
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
