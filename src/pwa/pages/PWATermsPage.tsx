import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    FileText,
    ShieldCheck,
    Scale,
    UserCheck,
    Lock,
    AlertCircle,
    Clock
} from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { useAnimateIn } from '@/lib/animations.ts';

const PWATermsPage = () => {
    const navigate = useNavigate();
    const showContent = useAnimateIn(false, 300);

    useEffect(() => {
        document.title = 'Điều khoản sử dụng - Goouty';
    }, []);

    const sections = [
        {
            icon: UserCheck,
            title: "1. Tài khoản người dùng",
            content: [
                "Khi đăng ký tài khoản Goouty, bạn cam kết cung cấp thông tin chính xác và chịu trách nhiệm bảo mật mật khẩu của mình.",
                "Mỗi người dùng chỉ nên sở hữu một tài khoản duy nhất để đảm bảo tính minh bạch trong các giao dịch tài chính nhóm."
            ]
        },
        {
            icon: Scale,
            title: "2. Quy tắc ứng xử",
            content: [
                "Goouty khuyến khích sự văn minh. Nghiêm cấm mọi hành vi chia sẻ nội dung đồi trụy, thù địch hoặc vi phạm pháp luật trên các nền tảng của chúng tôi.",
                "Khi sử dụng tính năng mời bạn bè, hãy chắc chắn rằng bạn có sự đồng ý của họ."
            ]
        },
        {
            icon: ShieldCheck,
            title: "3. Quản lý Tài chính & Thanh toán",
            content: [
                "Goouty cung cấp công cụ tính toán nợ và chi phí nhóm. Chúng tôi không giữ tiền của người dùng; mọi giao dịch chuyển tiền thực tế được thực hiện qua các ngân hàng hoặc ví điện tử bên ngoài.",
                "Người dùng tự chịu trách nhiệm về tính chính xác của dữ liệu chi tiêu nhập vào hệ thống."
            ]
        },
        {
            icon: Lock,
            title: "4. Bảo vệ dữ liệu",
            content: [
                "Hành trình và dữ liệu cá nhân của bạn được mã hóa an toàn. Chúng tôi không bán thông tin của bạn cho bên thứ ba.",
                "Dữ liệu của bạn được sử dụng để cá nhân hóa trải nghiệm và cải thiện chất lượng dịch vụ."
            ]
        },
        {
            icon: AlertCircle,
            title: "5. Giới hạn trách nhiệm",
            content: [
                "Goouty cố gắng đảm bảo nền tảng hoạt động 24/7, nhưng không chịu trách nhiệm cho các gián đoạn do lỗi đường truyền hoặc sự cố bất khả kháng.",
                "Chúng tôi không chịu trách nhiệm cho các tranh chấp phát sinh giữa các cá nhân trong chuyến đi."
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
                        Điều khoản sử dụng
                    </h1>
                    <div className="w-10"></div>
                </div>

                {/* Content */}
                <div className="flex-1 px-5 pt-8 pb-32">
                    <div className="max-w-md mx-auto space-y-8">
                        {/* Intro */}
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
                                <FileText size={32} />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Quyền lợi & Trách nhiệm</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Để mang lại trải nghiệm tốt nhất và an toàn cho tất cả người dùng, Goouty thiết lập các quy tắc và cam kết minh bạch dưới đây.
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
                                © 2026 Goouty. Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận các điều khoản này.
                            </p>
                        </div>
                    </div>
                </div>
            </AnimatedTransition>
        </div>
    );
};

export default PWATermsPage;
