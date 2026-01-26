import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link2, FileSpreadsheet, Youtube, Music, Check, Sparkles, Clipboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PWACreateTripFromUrlGuideProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

export const PWACreateTripFromUrlGuide: React.FC<PWACreateTripFromUrlGuideProps> = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen]);

    const steps = [
        {
            title: "Tạo chuyến đi siêu tốc",
            description: "Chỉ cần dán URL từ nền tảng yêu thích, Goouty AI sẽ tự động lên lịch trình chi tiết cho bạn!",
            icon: (
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                    <Sparkles className="w-12 h-12 text-primary relative z-10 fill-primary/20" />
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg rotate-12">
                        <Link2 className="w-5 h-5" />
                    </div>
                </div>
            ),
        },
        {
            title: "Hỗ trợ đa nền tảng",
            description: "Goouty hỗ trợ link từ Google Sheets, TikTok (video review) và YouTube (vlog du lịch).",
            icon: (
                <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                            <FileSpreadsheet className="w-7 h-7 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Sheets</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 -mt-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 relative z-10 scale-110">
                            <Music className="w-8 h-8 text-black dark:text-white" />
                        </div>
                        <span className="text-[10px] font-bold">TikTok</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                            <Youtube className="w-7 h-7 text-red-500" />
                        </div>
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">YouTube</span>
                    </div>
                </div>
            )
        },
        {
            title: "Thử ngay nào!",
            description: "Copy đường link bạn muốn và dán vào ô nhập liệu để bắt đầu tạo chuyến đi trong mơ.",
            icon: (
                <div className="flex flex-col items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50 w-full max-w-[240px]">
                    <div className="flex items-center w-full gap-3 bg-background p-3 rounded-lg shadow-sm border relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Clipboard className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1.5 text-left overflow-hidden">
                            <div className="flex items-center gap-1.5">
                                <Music className="w-3 h-3 text-pink-500" />
                                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">tiktok.com/...</div>
                            </div>
                            <div className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-bounce">
                                <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
            onComplete?.();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] w-[340px] rounded-[32px] p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-card flex flex-col pointer-events-auto duration-500 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-10 sm:max-w-[340px]">
                <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                    {/* Visual Header */}
                    <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-10 h-[220px] flex justify-center items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-20 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 p-16 bg-blue-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 transform scale-110">
                            {steps[step].icon}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex flex-col flex-1">
                        <DialogHeader className="space-y-4 mb-8">
                            <DialogTitle className="text-2xl font-black text-center leading-tight tracking-tight uppercase transition-all duration-300">
                                {steps[step].title}
                            </DialogTitle>
                            <DialogDescription className="text-center text-base leading-relaxed text-slate-500 dark:text-muted-foreground font-medium">
                                {steps[step].description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-auto space-y-8">
                            {/* Indicators */}
                            <div className="flex justify-center gap-2.5">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1.5 rounded-full transition-all duration-500 ease-in-out",
                                            i === step ? 'w-10 bg-primary' : 'w-2 bg-slate-200 dark:bg-white/10'
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                {step < steps.length - 1 ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            className="flex-1 rounded-2xl h-14 text-slate-400 font-bold hover:bg-transparent hover:text-slate-600 transition-colors uppercase tracking-wider text-xs"
                                            onClick={onClose}
                                        >
                                            Bỏ qua
                                        </Button>
                                        <Button
                                            className="flex-[1.8] rounded-2xl h-14 font-black shadow-[0_10px_20px_-5px_rgba(var(--primary-rgb),0.3)] bg-primary text-white hover:bg-primary/90 transition-all uppercase tracking-wider text-xs active:scale-95 duration-200"
                                            onClick={handleNext}
                                        >
                                            Tiếp theo
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        className="w-full rounded-2xl h-14 font-black bg-primary text-white shadow-[0_10px_20px_-5px_rgba(var(--primary-rgb),0.3)] hover:bg-primary/90 transition-all gap-2 uppercase tracking-wider text-sm active:scale-95 duration-200"
                                        onClick={handleNext}
                                    >
                                        <Check className="w-5 h-5 stroke-[3]" /> Thử ngay
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
