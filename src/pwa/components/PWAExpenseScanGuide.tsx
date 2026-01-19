import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Scan, Camera, Upload, Check, Zap, ReceiptText } from 'lucide-react';

interface PWAExpenseScanGuideProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

export const PWAExpenseScanGuide: React.FC<PWAExpenseScanGuideProps> = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen]);

    const steps = [
        {
            title: "Trợ lý AI quét hóa đơn",
            description: "Tiết kiệm thời gian nhập liệu! Goouty sử dụng AI để tự động trích xuất thông tin từ hóa đơn của bạn.",
            icon: (
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                    <Zap className="w-12 h-12 text-primary relative z-10 fill-primary" />
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-lg shadow-lg rotate-12">
                        <Scan className="w-5 h-5" />
                    </div>
                </div>
            ),
        },
        {
            title: "Cách thực hiện",
            description: "Nhấn nút 'Quét HĐ', sau đó chọn 'Tải lên' từ thư viện hoặc 'Chụp ảnh' trực tiếp từ camera.",
            icon: (
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 shadow-sm">
                        <Upload className="w-8 h-8 text-primary" />
                        <span className="text-[10px] font-bold uppercase">Tải lên</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 shadow-sm scale-110 shadow-primary/20 border-primary/50">
                        <Camera className="w-8 h-8 text-primary" />
                        <span className="text-[10px] font-bold uppercase text-primary">Chụp ảnh</span>
                    </div>
                </div>
            )
        },
        {
            title: "Kết quả tức thì",
            description: "Thông tin về tên chi phí, số tiền sẽ được AI tự động điền. Bạn chỉ cần kiểm tra lại và Lưu là xong!",
            icon: (
                <div className="flex flex-col items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50 w-full max-w-[240px]">
                    <div className="flex items-center w-full gap-3 bg-background p-3 rounded-lg shadow-sm border relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <ReceiptText className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 space-y-1.5 text-left">
                            <div className="text-[11px] font-bold text-slate-900 dark:text-white">Bữa trưa phở...</div>
                            <div className="text-[13px] font-black text-primary">150.000đ</div>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
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
                                        className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${i === step ? 'w-10 bg-primary' : 'w-2 bg-slate-200 dark:bg-white/10'
                                            }`}
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
                                        onClick={() => {
                                            onComplete?.();
                                            onClose();
                                        }}
                                    >
                                        <Check className="w-5 h-5 stroke-[3]" /> Khám phá ngay
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
