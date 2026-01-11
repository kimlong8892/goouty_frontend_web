import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Info,
    Heart,
    Map,
    Users,
    Wallet,
    ShieldCheck,
    Globe,
    Zap
} from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';

const PWAAboutPage = () => {
    const navigate = useNavigate();
    const showContent = useAnimateIn(false, 300);

    useEffect(() => {
        document.title = 'Giới thiệu về Goouty';
    }, []);

    const features = [
        {
            icon: Map,
            title: "Lập kế hoạch thông minh",
            description: "Tối ưu hóa lịch trình và sắp xếp địa điểm khoa học."
        },
        {
            icon: Users,
            title: "Gắn kết thành viên",
            description: "Dễ dàng mời bạn bè và thảo luận trực tiếp."
        },
        {
            icon: Wallet,
            title: "Minh bạch tài chính",
            description: "Hệ thống chi trả nhóm tự động tính toán 'ai nợ ai'."
        },
        {
            icon: ShieldCheck,
            title: "Bảo mật & Tin cậy",
            description: "Dữ liệu được bảo vệ tuyệt đối và đồng bộ tức thì."
        },
        {
            icon: Globe,
            title: "Tiếp cận không giới hạn",
            description: "Hoạt động mượt mà ngay cả khi ngoại tuyến."
        },
        {
            icon: Zap,
            title: "Trải nghiệm mượt mà",
            description: "Giao diện hiện đại, tốc độ phản hồi cực nhanh."
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col text-foreground">
            <AnimatedTransition show={showContent} animation="slide-up">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border/50">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-foreground/80 hover:text-foreground active:scale-95 transition-transform rounded-full hover:bg-muted"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2 truncate max-w-[200px]">
                        Về Goouty
                    </h1>
                    <div className="w-10"></div>
                </div>

                {/* Content */}
                <div className="flex-1 px-5 pt-8 pb-32">
                    <div className="max-w-md mx-auto space-y-12">
                        {/* Hero */}
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto animate-pulse-slow">
                                <Info size={40} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black tracking-tight leading-tight">
                                    Người bạn đồng hành <br />
                                    <span className="text-primary">thông minh</span>
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Goouty không chỉ là ứng dụng du lịch. Chúng tôi là giải pháp toàn diện giúp bạn lên kế hoạch, quản lý tài chính nhóm và kết nối bạn bè.
                                </p>
                            </div>
                        </div>

                        {/* Mission */}
                        <div className="bg-primary/5 rounded-[2.5rem] p-8 space-y-4">
                            <div className="w-12 h-12 bg-white dark:bg-card rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                <Heart size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Sứ mệnh của chúng tôi</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Xóa bỏ rào cản, kết nối mọi đam mê. Goouty ra đời để tối giản hóa mọi quy trình, giúp bạn tập trung vào việc tận hưởng trải nghiệm.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold px-1">Trải nghiệm khác biệt</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {features.map((feature, idx) => (
                                    <div key={idx} className="bg-card border border-border/50 p-6 rounded-3xl flex gap-4 transition-all hover:border-primary/30">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                            <feature.icon size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold">{feature.title}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-10 border-t border-border/50">
                            <p className="text-sm text-muted-foreground">
                                © 2026 Goouty. Nâng tầm hành trình của bạn.
                            </p>
                        </div>
                    </div>
                </div>
            </AnimatedTransition>
        </div>
    );
};

export default PWAAboutPage;
