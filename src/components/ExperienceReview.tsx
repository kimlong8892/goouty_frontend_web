import React, { useState } from 'react';
import { Star, MessageSquare, Send, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ExperienceReviewProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    isPWA?: boolean;
}

export const ExperienceReview = ({ onSuccess, onCancel, isPWA = false }: ExperienceReviewProps) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Vui lòng chọn mức độ hài lòng của bạn');
            return;
        }
        if (!feedback.trim()) {
            toast.error('Vui lòng để lại ý kiến đóng góp của bạn');
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSuccess(true);
            toast.success('Cảm ơn bạn đã đóng góp ý kiến!');
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 2000);
        } catch (error) {
            toast.error('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">Gửi đánh giá thành công!</h3>
                    <p className="text-muted-foreground max-w-[280px] mx-auto">
                        Cảm ơn bạn đã dành thời gian quý báu để góp ý. Goouty sẽ luôn nỗ lực để mang lại trải nghiệm tốt nhất.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8 py-4">
                <div className="space-y-4 text-center">
                    <Label className="text-lg font-bold text-foreground block">
                        Bạn cảm thấy thế nào về Goouty?
                    </Label>
                    <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                                className="p-1 transition-all active:scale-90"
                            >
                                <Star
                                    className={cn(
                                        "w-10 h-10 transition-colors duration-200",
                                        (hoveredRating || rating) >= star
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground/30"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {rating === 1 && "Rất không hài lòng"}
                        {rating === 2 && "Không hài lòng"}
                        {rating === 3 && "Bình thường"}
                        {rating === 4 && "Hài lòng"}
                        {rating === 5 && "Rất hài lòng"}
                        {rating === 0 && "Chọn mức độ hài lòng"}
                    </p>
                </div>

                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Ý kiến đóng góp của bạn
                    </Label>
                    <Textarea
                        placeholder="Chia sẻ trải nghiệm của bạn hoặc góp ý để chúng mình cải thiện nhé..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-[120px] rounded-2xl bg-secondary/30 border-border focus:border-primary/50 resize-none text-base p-4"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                            className="flex-1 h-12 rounded-full font-bold hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
                        >
                            Hủy
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isSubmitting || rating === 0 || !feedback.trim()}
                        className="flex-[2] h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Đang gửi...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Send className="w-4 h-4" />
                                <span>Gửi đánh giá</span>
                            </div>
                        )}
                    </Button>
                </div>
            </form>

            <div className="pt-6 border-t border-border/50">
                <h3 className="font-bold text-lg mb-4 text-foreground">Đánh giá gần đây</h3>
                <div className="space-y-4">
                    {MOCK_REVIEWS.map((review) => (
                        <div key={review.id} className="bg-secondary/20 p-4 rounded-2xl space-y-2">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={review.user.avatar} />
                                    <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="font-medium text-sm text-foreground">{review.user.name}</div>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={cn(
                                                    "w-3 h-3 transition-colors",
                                                    s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground">{review.createdAt}</span>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
                        </div>
                    ))}
                </div>
                <Button variant="ghost" className="w-full mt-4 text-primary font-medium hover:text-primary hover:bg-primary/10 rounded-xl h-12">
                    Xem thêm nhận xét
                </Button>
            </div>
        </div>
    );
};

const MOCK_REVIEWS = [
    {
        id: 1,
        user: { name: "Nguyễn Văn A", avatar: "https://i.pravatar.cc/150?u=1" },
        rating: 5,
        comment: "Ứng dụng rất tuyệt vời, giúp mình lên kế hoạch chuyến đi dễ dàng hơn hẳn!",
        createdAt: "2 giờ trước"
    },
    {
        id: 2,
        user: { name: "Trần Thị B", avatar: "https://i.pravatar.cc/150?u=2" },
        rating: 4,
        comment: "Giao diện đẹp, dễ sử dụng. Tuy nhiên cần thêm tính năng chia sẻ lịch trình chi tiết hơn.",
        createdAt: "1 ngày trước"
    },
    {
        id: 3,
        user: { name: "Lê Văn C" },
        rating: 5,
        comment: "Rất thích tính năng gợi ý địa điểm, rất hữu ích cho người không biết đi đâu như mình.",
        createdAt: "2 ngày trước"
    },
    {
        id: 4,
        user: { name: "Phạm Thị D", avatar: "https://i.pravatar.cc/150?u=4" },
        rating: 4,
        comment: "Trải nghiệm mượt mà, ít lỗi. Mong đội ngũ phát triển thêm nhiều mẫu chuyến đi hơn nữa.",
        createdAt: "3 ngày trước"
    },
    {
        id: 5,
        user: { name: "Hoàng Văn E" },
        rating: 5,
        comment: "Tuyệt vời! 10 điểm cho chất lượng.",
        createdAt: "5 ngày trước"
    }
];
