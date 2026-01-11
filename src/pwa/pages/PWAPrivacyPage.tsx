import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Shield,
    Lock,
    Eye,
    Database,
    UserCheck,
    Clock
} from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';

const PWAPrivacyPage = () => {
    const navigate = useNavigate();
    const showContent = useAnimateIn(false, 300);

    useEffect(() => {
        document.title = 'Chính sách bảo mật - Goouty';
    }, []);

    const sections = [
        {
            icon: Database,
            title: "1. Thu thập thông tin",
            content: [
                "Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký tài khoản (email, họ tên) và dữ liệu khi bạn sử dụng dịch vụ (kế hoạch chuyến đi, chi phí).",
                "Thông tin thiết bị và địa chỉ IP cũng được thu thập tự động để đảm bảo an ninh hệ thống."
            ]
        },
        {
            icon: Lock,
            title: "2. Bảo mật dữ liệu",
            content: [
                "Mọi dữ liệu nhạy cảm của bạn đều được mã hóa theo tiêu chuẩn công nghiệp.",
                "Chúng tôi áp dụng các biện pháp bảo mật hiện đại để ngăn chặn truy cập trái phép, thay đổi hoặc phá hủy thông tin của bạn."
            ]
        },
        {
            icon: Eye,
            title: "3. Sử dụng thông tin",
            content: [
                "Thông tin của bạn được sử dụng để cung cấp và cải thiện dịch vụ Goouty, xử lý các giao dịch và gửi thông báo liên quan đến chuyến đi.",
                "Chúng tôi cam kết KHÔNG bán, cho thuê hoặc chia sẻ dữ liệu cá nhân của bạn với bất kỳ bên thứ ba nào vì mục đích quảng cáo."
            ]
        },
        {
            icon: UserCheck,
            title: "4. Quyền của bạn",
            content: [
                "Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân của mình bất kỳ lúc nào thông qua phần cài đặt hồ sơ.",
                "Bạn có thể từ chối nhận thông báo đẩy hoặc email marketing từ chúng tôi."
            ]
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
                        Chính sách bảo mật
                    </h1>
                    <div className="w-10"></div>
                </div>

                {/* Content */}
                <div className="flex-1 px-5 pt-8 pb-32">
                    <div className="max-w-md mx-auto space-y-8">
                        {/* Intro */}
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
                                <Shield size={32} />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Quyền riêng tư của bạn</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Goouty cam kết bảo vệ thông tin cá nhân và tôn trọng quyền riêng tư của mỗi thành viên trong cộng đồng du lịch của chúng tôi.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <Clock size={14} />
                                <span>Cập nhật: 10/01/2026</span>
                            </div>
                        </div>

                        {/* Sections */}
                        <div className="space-y-10">
                            {sections.map((section, idx) => (
                                <div key={idx} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                            <section.icon size={20} />
                                        </div>
                                        <h3 className="font-bold text-lg">{section.title}</h3>
                                    </div>
                                    <div className="space-y-3 pl-1">
                                        {section.content.map((p, pIdx) => (
                                            <p key={pIdx} className="text-muted-foreground leading-relaxed text-[15px]">
                                                {p}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Note */}
                        <div className="pt-10 text-center">
                            <p className="text-xs text-muted-foreground/60 leading-relaxed italic">
                                © 2026 Goouty. Chúng tôi coi trọng sự tin tưởng của bạn.
                            </p>
                        </div>
                    </div>
                </div>
            </AnimatedTransition>
        </div>
    );
};

export default PWAPrivacyPage;
