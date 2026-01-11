import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, Heart, Map, Users, Wallet } from 'lucide-react';
import { usePWA } from '@/pwa/hooks/usePWA';
import { cn } from '@/lib/utils';

export const PWALandingScreen = () => {
    const navigate = useNavigate();
    const { isPWA } = usePWA();

    const handleStart = () => {
        navigate('/auth');
    };

    const features = [
        {
            icon: <Map className="w-5 h-5 text-[#7c66fd]" />,
            title: "Lên lịch trình",
            desc: "Tạo kế hoạch chi tiết từng ngày dễ dàng."
        },
        {
            icon: <Wallet className="w-5 h-5 text-[#7c66fd]" />,
            title: "Quản lý chi tiêu",
            desc: "Tự động chia tiền nhóm, minh bạch, rõ ràng."
        },
        {
            icon: <Users className="w-5 h-5 text-[#7c66fd]" />,
            title: "Mời bạn bè",
            desc: "Cùng nhau lên kế hoạch trong thời gian thực."
        }
    ];

    return (
        <div className={cn(
            "flex flex-col min-h-screen bg-slate-50 relative overflow-hidden",
            isPWA ? "pb-0" : "pb-20"
        )}>
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] right-[-20%] w-[80%] aspect-square bg-[#7c66fd]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-5%] left-[-20%] w-[60%] aspect-square bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6 relative z-10 text-center">
                <div className="w-56 h-56 mb-8 relative">
                    <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl animate-pulse" />
                    <img
                        src="https://pupil-sleep-11345349.figma.site/_assets/v11/8da9e20de4331dfe75eaaed992ce1fa360377f01.png"
                        alt="Goouty Mascot"
                        className="w-full h-full object-contain drop-shadow-2xl relative z-10 scale-110"
                    />
                </div>

                <h1 className="text-4xl font-black text-[#7c66fd] tracking-tight mb-3">
                    GOOUTY
                </h1>
                <p className="text-lg font-bold text-slate-800 mb-2 leading-tight">
                    Vi vu thả ga, không lo rắc rối
                </p>
                <p className="text-slate-500 text-sm max-w-[280px] mx-auto leading-relaxed">
                    Ứng dụng lên kế hoạch chuyến đi và chia sẻ chi phí nhóm hàng đầu dành cho bạn.
                </p>
            </div>

            {/* Features Grid */}
            <div className="px-6 pb-12 grid gap-4 relative z-10">
                {features.map((feature, idx) => (
                    <div
                        key={idx}
                        className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[#7c66fd]/10 flex items-center justify-center shrink-0">
                            {feature.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">{feature.title}</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">{feature.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer CTA */}
            <div className="px-6 pb-36 sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-10">
                <Button
                    onClick={handleStart}
                    className="w-full h-14 bg-[#7c66fd] hover:bg-[#6a54e5] text-white rounded-2xl text-base font-bold shadow-xl shadow-[#7c66fd]/20 group transition-all active:scale-[0.98]"
                >
                    Bắt đầu hành trình ngay
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
};
