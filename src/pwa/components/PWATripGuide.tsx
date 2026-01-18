import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, MoreHorizontal, GripVertical, Check } from 'lucide-react';

interface PWATripGuideProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

export const PWATripGuide: React.FC<PWATripGuideProps> = ({ isOpen, onClose, onComplete }) => {
    // ... existing code ...

    const [step, setStep] = useState(0);

    // Reset step when reopening
    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen]);

    const steps = [
        {
            title: "Tùy chỉnh lịch trình",
            description: "Goouty cho phép bạn sắp xếp lại thứ tự ngày và hoạt động để phù hợp nhất với chuyến đi của bạn.",
            icon: (
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                    <GripVertical className="w-10 h-10 text-primary relative z-10" />
                </div>
            ),
        },
        {
            title: "Di chuyển ngày",
            description: "Nhấn giữ vào ngày để kéo thả, HOẶC nhấn tay vào ngày để chọn dấu 3 chấm (...) và chọn Trước/Sau.",
            icon: (
                <div className="flex flex-col items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50 w-full max-w-[240px]">
                    <div className="flex items-center gap-2 px-4 py-3 bg-background rounded-lg shadow-sm border w-full justify-between relative overflow-hidden">
                        <span className="font-bold text-sm">Ngày 2</span>
                        <div className="flex items-center gap-1">
                            <GripVertical className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                    </div>
                    {/* Floating Menu Simulation */}
                    <div className="absolute -right-4 bottom-8 bg-background p-2 rounded-lg shadow-lg border text-[10px] font-medium flex flex-col gap-1 z-20 animate-in zoom-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-1.5 p-1 rounded hover:bg-muted">
                            <ArrowUp className="w-3 h-3 text-primary rotate-[270deg]" /> Trước
                        </div>
                        <div className="flex items-center gap-1.5 p-1 rounded hover:bg-muted">
                            <ArrowDown className="w-3 h-3 text-primary rotate-[270deg]" /> Sau
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Di chuyển hoạt động",
            description: "Nhấn giữ vào (::) để kéo thả, HOẶC nhấn menu (...) ở góc phải hoạt động để chọn 'Chuyển lên/xuống'.",
            icon: (
                <div className="flex flex-col items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50 w-full max-w-[240px]">
                    <div className="flex items-center w-full gap-3 bg-background p-3 rounded-lg shadow-sm border relative">
                        <div className="absolute -left-1.5 p-1 bg-background rounded-full border shadow-sm z-10">
                            <GripVertical className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ml-1">
                            <span className="font-bold text-primary text-xs">09:00</span>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <div className="h-2 w-3/4 bg-muted-foreground/20 rounded-full" />
                            <div className="h-1.5 w-1/2 bg-muted-foreground/10 rounded-full" />
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* Floating Menu Activity */}
                    <div className="absolute right-0 bottom-4 bg-background p-2 rounded-lg shadow-lg border text-[10px] font-medium flex flex-col gap-1 z-20 animate-in zoom-in slide-in-from-right-2">
                        <div className="flex items-center gap-1.5 p-1 rounded hover:bg-muted">
                            <ArrowUp className="w-3 h-3 text-orange-500" /> Lên
                        </div>
                        <div className="flex items-center gap-1.5 p-1 rounded hover:bg-muted">
                            <ArrowDown className="w-3 h-3 text-orange-500" /> Xuống
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
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[85vw] w-[340px] rounded-[24px] p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-background flex flex-col">
                {/* Visual Header */}
                <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-8 h-[220px] flex justify-center items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 p-16 bg-blue-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 transform ml-4 transition-all duration-500 ease-out">
                        {steps[step].icon}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                    <DialogHeader className="space-y-3 mb-6">
                        <DialogTitle className="text-xl font-bold text-center leading-tight">
                            {steps[step].title}
                        </DialogTitle>
                        <DialogDescription className="text-center text-[15px] leading-relaxed text-muted-foreground/80">
                            {steps[step].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-auto space-y-6">
                        {/* Indicators */}
                        <div className="flex justify-center gap-2">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ease-out ${i === step ? 'w-8 bg-primary' : 'w-1.5 bg-muted-foreground/20'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            {step < steps.length - 1 ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        className="flex-1 rounded-xl h-12 text-muted-foreground font-medium hover:bg-transparent hover:text-foreground"
                                        onClick={onClose}
                                    >
                                        Bỏ qua
                                    </Button>
                                    <Button
                                        className="flex-[1.5] rounded-xl h-12 font-bold shadow-lg shadow-primary/20"
                                        onClick={handleNext}
                                    >
                                        Tiếp theo
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    className="w-full rounded-xl h-12 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 gap-2"
                                    onClick={() => {
                                        onComplete?.();
                                        onClose();
                                    }}
                                >
                                    <Check className="w-5 h-5" /> Đã hiểu
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
