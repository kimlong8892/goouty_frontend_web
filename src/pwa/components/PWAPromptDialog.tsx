import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PWAPromptDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    actionLabel: string;
    onAction: () => void;
    variant?: 'green' | 'blue' | 'orange';
}

export const PWAPromptDialog = ({
    isOpen,
    onClose,
    title,
    message,
    actionLabel,
    onAction,
    variant = 'green'
}: PWAPromptDialogProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[85vw] w-[340px] p-0 border-none overflow-hidden rounded-[32px] bg-background shadow-2xl">
                <div className="relative p-8 flex flex-col items-center text-center">
                    {/* Illustration Container */}
                    <div className="w-40 h-40 mb-6 relative flex items-center justify-center">
                        {/* Background Decorative Circles */}
                        <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
                        <div className="absolute inset-4 bg-primary/10 rounded-full" />

                        {/* Icon/Illustration */}
                        <div className="relative w-24 h-24 bg-primary rounded-3xl rotate-12 flex items-center justify-center shadow-xl shadow-primary/20">
                            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center -rotate-12">
                                <AlertCircle className="w-10 h-10 text-white fill-white/10" />
                            </div>
                        </div>

                        {/* Small Floating Decoration */}
                        <div className="absolute bottom-4 right-4 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <span className="text-white text-xs font-bold">!</span>
                        </div>
                    </div>

                    {/* Text Content */}
                    <h2 className="text-xl font-extrabold text-foreground mb-3 tracking-tight">
                        {title}
                    </h2>
                    <p className="text-muted-foreground font-medium leading-relaxed mb-8 px-4 text-sm">
                        {message}
                    </p>

                    {/* Action Button */}
                    <Button
                        onClick={() => {
                            onAction();
                            onClose();
                        }}
                        className="w-full h-14 rounded-2xl font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transform active:scale-[0.98] transition-all"
                    >
                        {actionLabel}
                    </Button>

                    <button
                        onClick={onClose}
                        className="mt-4 text-sm font-semibold text-muted-foreground/60 hover:text-primary transition-colors"
                    >
                        Để sau nha
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
