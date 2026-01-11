import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { api } from '@/integrations/api/client.ts';
import { TripTemplateCard } from '@/components/TripTemplateCard.tsx';
import { DATABASE_TYPES } from '@/integrations/api/types';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';
import { useAuth } from '@/contexts/AuthContext.tsx';

const WishlistPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const showContent = useAnimateIn(false, 300);
    const [templates, setTemplates] = useState<DATABASE_TYPES.tripTemplates[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        document.title = 'Mẫu đã lưu - Goouty';
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
            return;
        }

        if (isAuthenticated) {
            loadWishlist();
        }
    }, [isAuthenticated, authLoading]);

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
            setTemplates(prev => prev.filter(t => t.id !== templateId));
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.province?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-4 pb-20 px-4 bg-background">
            <AnimatedTransition show={showContent} animation="slide-up">
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/profile')}
                                className="rounded-full hover:bg-secondary"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-3">
                                    DANH SÁCH YÊU THÍCH
                                </h1>
                                <p className="text-muted-foreground font-medium mt-1">
                                    Khám phá lại các hành trình bạn đã yêu thích
                                </p>
                            </div>
                        </div>

                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                className="pl-12 bg-secondary border-none focus-visible:ring-2 focus-visible:ring-primary/20 h-12 rounded-2xl"
                                placeholder="Tìm trong danh sách..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-[420px] rounded-[32px] bg-secondary/50 animate-pulse border border-border" />
                            ))}
                        </div>
                    ) : filteredTemplates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredTemplates.map((template) => (
                                <TripTemplateCard
                                    key={template.id}
                                    template={{ ...template, isWishlisted: true }}
                                    onWishlistUpdate={handleWishlistUpdate}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="rounded-[40px] border-dashed border-2 border-border bg-card/50 overflow-hidden">
                            <CardContent className="py-24 flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 animate-bounce">
                                    <Heart className="w-12 h-12 text-red-500 fill-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-3">
                                    {searchTerm ? 'Không tìm thấy mẫu phù hợp' : 'Chưa có mẫu nào được lưu'}
                                </h2>
                                <p className="text-muted-foreground max-w-md mb-10 text-lg">
                                    {searchTerm
                                        ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.'
                                        : 'Hãy khám phá các mẫu chuyến đi tuyệt vời và nhấn icon trái tim để có thể xem lại tại đây nhé!'
                                    }
                                </p>
                                <div className="flex gap-4">
                                    {searchTerm && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setSearchTerm('')}
                                            className="rounded-full px-8 h-12 border-primary text-primary hover:bg-primary/5 font-bold"
                                        >
                                            Xóa tìm kiếm
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => navigate('/')}
                                        className="rounded-full px-10 h-12 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20"
                                    >
                                        Khám phá ngay
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </AnimatedTransition>
        </div>
    );
};

export default WishlistPage;
