import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';

export const PWALandingScreen = () => {
    const navigate = useNavigate();
    const { isPWA } = usePWA();
    const [step, setStep] = useState(0); // 0: Landing, 1-4: Onboarding steps

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
        } else {
            navigate('/auth');
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleStart = () => {
        // Start the onboarding flow
        setStep(1);
    };

    const handleLogin = () => {
        navigate('/auth');
    };

    // Lock body scroll and set theme color
    useEffect(() => {
        // Theme color logic
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const originalColor = metaThemeColor?.getAttribute('content') || '#edeeff';

        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#ffffff');
        }

        // Lock body scroll
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // Prevent bounce on iOS
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';

        return () => {
            // Revert changes
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', originalColor);
            }
            document.body.style.overflow = originalOverflow;
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, []);

    const onboardingSteps = [
        {
            title: "Khám phá mẫu chuyến đi",
            desc: "Tham khảo hàng ngàn lịch trình mẫu từ cộng đồng và áp dụng ngay cho chuyến đi của bạn.",
            image: "/onboarding_templates_new.png"
        },
        {
            title: "Tạo chuyến đi từ URL",
            desc: "Chỉ cần dán link từ Google Sheet, TikTok hay YouTube, Goouty sẽ tự động tạo lịch trình.",
            image: "/onboarding_url_new.png"
        },
        {
            title: "Lên lịch trình chi tiết",
            desc: "Sắp xếp điểm đến, thời gian biểu thông minh và dễ dàng chỉnh sửa chỉ với kéo thả.",
            image: "/onboarding_itinerary_new.png"
        },
        {
            title: "Quản lý chi tiêu minh bạch",
            desc: "Tự động chia tiền nhóm, quét hóa đơn và xóa tan nỗi lo 'ai nợ ai' sau mỗi chuyến đi.",
            image: "/onboarding_expenses_new.png"
        }
    ];

    // Landing Screen (Step 0)
    if (step === 0) {
        return (
            <div className={cn(
                "fixed inset-0 h-[100dvh] w-full bg-white flex flex-col overflow-hidden touch-none overscroll-none z-50",
            )}>
                {/* Top Section - Text & Clouds */}
                <div className="flex-1 px-8 pt-20 relative z-30 text-center flex flex-col items-center">
                    {/* Decorative & Branding Elements - Moved DOWN to ensure top status bar area is clean white */}
                    {/* Large top-right purple blur - Pushed down */}
                    <div className="absolute top-[10%] right-[-30%] w-[100%] aspect-square bg-[#7c66fd]/10 rounded-full blur-[80px] pointer-events-none opacity-60" />
                    {/* Small bottom-left blue/purple blur */}
                    <div className="absolute bottom-[20%] left-[-20%] w-[80%] aspect-square bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

                    <h1 className="text-4xl sm:text-5xl font-black text-[#2D2A4A] leading-[1.15] tracking-tight relative z-20 mb-3 drop-shadow-sm">
                        <span className="block text-[#7c66fd]">Vi vu thả ga,</span>
                        <span className="block">không lo rắc rối</span>
                    </h1>

                    <p className="text-[#6E6B80] font-medium text-base max-w-[320px] leading-relaxed relative z-20">
                        Lên kế hoạch & chia tiền nhóm cực chill.
                    </p>
                </div>

                {/* Middle Section - Illustration blended into white */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-full max-w-[380px] aspect-square z-10 flex items-center justify-center pointer-events-none">
                    <div className="relative w-full h-full animate-in fade-in zoom-in duration-700">
                        {/* Glow behind the backpack */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#7c66fd]/20 rounded-full blur-3xl" />
                        <img
                            src="/trip_split_money_white.png"
                            alt="Trip and Expenses Illustration"
                            className="w-full h-full object-contain scale-110 mix-blend-multiply"
                        />
                    </div>
                </div>

                {/* Bottom Section - Actions */}
                <div className="absolute bottom-0 left-0 right-0 h-[25%] flex flex-col justify-end px-6 pb-12 z-50 pointer-events-auto">
                    {/* Gradient Fade for seamless blend from white to transparent */}
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none -z-10" />

                    <div className="flex flex-col gap-4 items-center w-full">
                        <Button
                            onClick={handleStart}
                            className="w-full h-14 bg-[#7c66fd] hover:bg-[#6c56e0] text-white rounded-[20px] text-base font-bold shadow-xl shadow-[#7c66fd]/25 group transition-all active:scale-[0.98] cursor-pointer"
                        >
                            BẮT ĐẦU HÀNH TRÌNH
                            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform opacity-90" />
                        </Button>

                        <button
                            onClick={handleLogin}
                            className="text-[#7c66fd] text-sm font-bold hover:text-[#6c56e0] transition-colors py-2 px-4 rounded-xl hover:bg-[#7c66fd]/5 cursor-pointer relative z-50"
                        >
                            TÔI ĐÃ CÓ TÀI KHOẢN
                        </button>

                        {/* PWA Home Indicator Spacer */}
                        <div className="h-4" />
                    </div>
                </div>
            </div>
        );
    }

    // Onboarding Steps (Step 1-4)
    const currentStepData = onboardingSteps[step - 1];

    return (
        <div className="fixed inset-0 h-[100dvh] w-full bg-[#FAFAFA] flex flex-col overflow-hidden touch-none overscroll-none z-50">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#F5F3FF] via-[#FDFBFF] to-[#F1F0F9] -z-20" />
            <div className="absolute top-[-10%] right-[-20%] w-[70vw] h-[70vw] bg-[#7c66fd]/5 rounded-full blur-[100px] -z-20" />
            <div className="absolute bottom-[-10%] left-[-20%] w-[80vw] h-[80vw] bg-[#7c66fd]/5 rounded-full blur-[100px] -z-20" />

            {/* Header / Nav */}
            <div className="absolute top-0 left-0 right-0 p-6 pt-8 flex justify-between items-center z-50 pointer-events-auto">
                <button
                    onClick={handleBack}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white/50 active:scale-95 transition-all text-[#2D2A4A]"
                >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                </button>

                {/* Modern Step Indicators */}
                <div className="flex gap-2 p-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white/40">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-500 ease-out",
                                i === step
                                    ? "w-6 bg-[#7c66fd] shadow-sm shadow-purple-500/30"
                                    : "w-1.5 bg-[#7c66fd]/20"
                            )}
                        />
                    ))}
                </div>
                <div className="w-10" /> {/* Spacer for balance */}
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col items-center justify-start px-6 text-center pt-24 pb-4">
                {/* Text Content */}
                <div
                    key={`text-${step}`}
                    className="mb-6 space-y-3 animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-both shrink-0"
                >
                    <h2 className="text-2xl sm:text-3xl font-black text-[#2D2A4A] leading-tight px-4">
                        {currentStepData.title}
                    </h2>
                    <p className="text-[#6E6B80] font-medium text-sm sm:text-base leading-relaxed max-w-[320px] mx-auto">
                        {currentStepData.desc}
                    </p>
                </div>

                {/* Real UI Screenshot */}
                <div className="w-full flex-1 min-h-0 flex items-center justify-center relative px-4 pb-2">
                    <div
                        key={`img-${step}`}
                        className="relative h-full max-h-[55vh] w-auto aspect-[9/19] rounded-[32px] overflow-hidden shadow-2xl border-[6px] border-white ring-1 ring-black/5 animate-in slide-in-from-right-16 zoom-in-95 fade-in duration-700"
                    >
                        <div className="w-full h-full bg-white overflow-hidden relative flex items-center justify-center">
                            <img
                                src={currentStepData.image}
                                alt="Feature Preview"
                                className="w-full h-full object-contain"
                            />
                            {/* Glossy Reflection Overlay */}
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none opacity-50" />
                        </div>
                    </div>

                    {/* Decorative Blob behind */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-[#7c66fd]/10 rounded-full blur-[80px] -z-10" />
                </div>
            </div>

            {/* Footer Action - Fixed to bottom to prevent being pushed off-screen */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-12 w-full pointer-events-auto z-50 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/90 to-transparent pt-12">
                <Button
                    onClick={handleNext}
                    className="w-full h-14 bg-[#7c66fd] hover:bg-[#6c56e0] text-white rounded-[24px] text-base font-bold shadow-xl shadow-[#7c66fd]/25 group transition-all active:scale-[0.98] border border-white/20 cursor-pointer"
                >
                    {step === 4 ? "BẮT ĐẦU NGAY" : "TIẾP TỤC"}
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform opacity-90" />
                </Button>
            </div>
        </div>
    );
};
