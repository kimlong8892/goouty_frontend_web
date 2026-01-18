import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ExperienceReview } from '@/components/ExperienceReview';
import { usePWA } from '@/pwa/hooks/usePWA';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { MessageSquare, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const FeedbackPrompter = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const { isPWA } = usePWA();
    const { user } = useAuth();

    useEffect(() => {
        const checkBackendStatus = async () => {
            if (user?.id && !localStorage.getItem('goouty_feedback_submitted')) {
                try {
                    const res = await api.ratings.getAll({ userId: user.id, limit: 5 });
                    const hasMyReview = res.data?.some(r => r.userId === user.id);
                    if (hasMyReview) {
                        localStorage.setItem('goouty_feedback_submitted', 'true');
                        setShowPrompt(false);
                    }
                } catch (e) {
                    console.error("Failed to check feedback status", e);
                }
            }
        };

        checkBackendStatus();
    }, [user]);

    useEffect(() => {
        // Check if already submitted
        const hasSubmitted = localStorage.getItem('goouty_feedback_submitted');
        if (hasSubmitted) return;

        const interval = setInterval(() => {
            // Check again inside interval in case it changed in another tab (optional but good)
            if (localStorage.getItem('goouty_feedback_submitted')) {
                setShowPrompt(false);
                return;
            }

            setShowPrompt(prev => {
                if (prev || showForm) return prev;
                return true;
            });
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [showForm]);

    const handleOpenForm = () => {
        setShowPrompt(false);
        setShowForm(true);
    };

    return (
        <>
            {/* Small Prompt in the Corner */}
            {showPrompt && (
                <div
                    className={cn(
                        "fixed z-[60] flex items-center gap-3 p-4 bg-background/80 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-2xl cursor-pointer hover:border-primary/50 hover:shadow-primary/20 transition-all group animate-in fade-in slide-in-from-bottom-5 duration-700",
                        isPWA ? "bottom-24 right-4 left-4 sm:left-auto sm:w-[320px]" : "bottom-24 right-8 w-[370px] p-5 gap-3"
                    )}
                    style={{
                        animation: 'floating 3s ease-in-out infinite',
                    }}
                    onClick={handleOpenForm}
                >
                    <style>{`
                        @keyframes floating {
                            0% { transform: translateY(0px); }
                            50% { transform: translateY(-10px); }
                            100% { transform: translateY(0px); }
                        }
                    `}</style>
                    <div className={cn(
                        "flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform relative",
                        !isPWA && "w-14 h-14"
                    )}>
                        <MessageSquare className={cn("w-6 h-6", !isPWA && "w-7 h-7")} />
                        <Heart className={cn("w-3 h-3 absolute top-2 right-2 fill-primary animate-pulse", !isPWA && "w-4 h-4 top-3 right-3")} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <h4 className={cn(
                            "font-bold text-sm text-foreground group-hover:text-primary transition-colors",
                            isPWA ? "truncate" : "text-base"
                        )}>
                            Bạn thấy ứng dụng thế nào?
                        </h4>
                        <p className={cn(
                            "text-xs text-muted-foreground",
                            isPWA ? "line-clamp-2" : "text-sm font-medium"
                        )}>
                            Nhấn để gửi ý kiến đóng góp cho Goouty nhé! ✨
                        </p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPrompt(false);
                        }}
                        className="p-1 hover:bg-secondary rounded-lg transition-colors group/close"
                    >
                        <X className="w-4 h-4 text-muted-foreground group-hover/close:rotate-90 transition-transform" />
                    </button>

                    {/* Subtle shimmer effect */}
                    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                    </div>
                </div>
            )}

            {/* Full Feedback Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className={cn(
                    "p-0 overflow-hidden rounded-[32px] border-none shadow-2xl transition-all duration-300",
                    isPWA ? "w-[90%] max-w-[340px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : "sm:max-w-[500px]"
                )}>
                    <div className={cn("p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar", isPWA && "p-5 pt-7")}>
                        <DialogHeader className={cn("mb-5", isPWA && "mb-3")}>
                            <DialogTitle className={cn("text-2xl font-black text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent", isPWA && "text-lg")}>
                                Góp ý cho Goouty
                            </DialogTitle>
                            <DialogDescription className={cn("text-center text-muted-foreground font-medium", isPWA && "text-xs")}>
                                Chúng mình rất muốn biết cảm nhận của bạn để hoàn thiện hơn.
                            </DialogDescription>
                        </DialogHeader>

                        <ExperienceReview
                            isPWA={isPWA}
                            onSuccess={() => {
                                localStorage.setItem('goouty_feedback_submitted', 'true');
                                setShowForm(false);
                                setShowPrompt(false);
                            }}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
