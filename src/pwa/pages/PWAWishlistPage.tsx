import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/integrations/api/client';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { PWAMasonryCard } from '../components/PWAMasonryCard';

// Add CSS to hide scrollbar
const style = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const PWAWishlistPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [templates, setTemplates] = useState<DATABASE_TYPES.tripTemplates[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            loadWishlist();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const loadWishlist = async () => {
        try {
            setLoading(true);
            const response = await api.tripTemplates.getWishlist();
            setTemplates(Array.isArray(response.templates) ? response.templates : []);
        } catch (error) {
            console.error('Error loading wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWishlistUpdate = (templateId: string, isWishlisted: boolean) => {
        if (!isWishlisted) {
            // Remove from list if un-wishlisted
            setTemplates(prev => prev.filter(t => t.id !== templateId));
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <style>{style}</style>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-border/40">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="rounded-full hover:bg-secondary"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-bold ml-2">Danh sách yêu thích</h1>
            </div>

            {/* Content */}
            <div className="p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Đang tải danh sách...</p>
                    </div>
                ) : templates.length > 0 ? (
                    <div className="flex gap-4">
                        {/* Column 1: Indices 0, 2, 4... */}
                        <div className="flex-1 flex flex-col gap-4">
                            {templates.map((template, index) => {
                                if (index % 2 !== 0) return null;
                                return (
                                    <PWAMasonryCard
                                        key={template.id}
                                        template={{ ...template, isWishlisted: true }}
                                        index={index}
                                        onWishlistToggle={handleWishlistUpdate}
                                    />
                                );
                            })}
                        </div>
                        {/* Column 2: Indices 1, 3, 5... */}
                        <div className="flex-1 flex flex-col gap-4">
                            {templates.map((template, index) => {
                                if (index % 2 === 0) return null;
                                return (
                                    <PWAMasonryCard
                                        key={template.id}
                                        template={{ ...template, isWishlisted: true }}
                                        index={index}
                                        onWishlistToggle={handleWishlistUpdate}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-8">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <Heart className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Chưa có mẫu nào được lưu</h2>
                        <p className="text-muted-foreground mb-8 text-sm">
                            Hãy khám phá các mẫu chuyến đi tuyệt vời và nhấn icon trái tim để lưu lại nhé!
                        </p>
                        <Button
                            onClick={() => navigate('/')}
                            className="rounded-full px-8 bg-primary hover:bg-primary/90 font-bold"
                        >
                            Khám phá ngay
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PWAWishlistPage;
