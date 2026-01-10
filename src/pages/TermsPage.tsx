import React from 'react';
import {
    FileText,
    ShieldCheck,
    Scale,
    UserCheck,
    Lock,
    AlertCircle,
    HelpCircle,
    Clock,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Link } from 'react-router-dom';
import { useAnimateIn } from '@/lib/animations.ts';

const TermsSection = ({
    icon: Icon,
    title,
    content,
    delay = 0
}: {
    icon: any,
    title: string,
    content: React.ReactNode,
    delay?: number
}) => {
    return (
        <div
            className="glass-panel p-8 rounded-[2rem] border border-primary/5 hover:border-primary/20 transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon size={24} />
                </div>
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-foreground">{title}</h3>
                    <div className="text-muted-foreground leading-relaxed space-y-3">
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TermsPage = () => {
    const showContent = useAnimateIn(false, 300);

    return (
        <div className="relative min-h-screen bg-background pb-24 overflow-hidden">
            {/* Background Ornaments */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-blob"></div>
                <div className="absolute bottom-[20%] right-[-5%] w-[35%] h-[35%] rounded-full bg-accent/5 blur-[100px] animate-blob animation-delay-2000"></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 relative z-10">
                {/* Header */}
                <div className="text-center mb-20 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                        <FileText size={16} />
                        <span>Điều khoản sử dụng</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tight text-foreground leading-tight">
                        Quyền lợi <span className="text-primary">&</span> Trách nhiệm
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Để mang lại trải nghiệm tốt nhất và an toàn cho tất cả người dùng, Goouty thiết lập các quy tắc và cam kết minh bạch dưới đây.
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Clock size={16} />
                        <span>Cập nhật lần cuối: 10 tháng 01, 2026</span>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-8 mb-20">
                    <TermsSection
                        icon={UserCheck}
                        title="1. Tài khoản người dùng"
                        delay={100}
                        content={
                            <>
                                <p>Khi đăng ký tài khoản Goouty, bạn cam kết cung cấp thông tin chính xác và chịu trách nhiệm bảo mật mật khẩu của mình.</p>
                                <p>Mỗi người dùng chỉ nên sở hữu một tài khoản duy nhất để đảm bảo tính minh bạch trong các giao dịch tài chính nhóm.</p>
                            </>
                        }
                    />

                    <TermsSection
                        icon={Scale}
                        title="2. Quy tắc ứng xử"
                        delay={200}
                        content={
                            <>
                                <p>Goouty khuyến khích sự văn minh. Nghiêm cấm mọi hành vi chia sẻ nội dung đồi trụy, thù địch hoặc vi phạm pháp luật trên các nền tảng của chúng tôi.</p>
                                <p>Khi sử dụng tính năng mời bạn bè, hãy chắc chắn rằng bạn có sự đồng ý của họ.</p>
                            </>
                        }
                    />

                    <TermsSection
                        icon={ShieldCheck}
                        title="3. Quản lý Tài chính & Thanh toán"
                        delay={300}
                        content={
                            <>
                                <p>Goouty cung cấp công cụ tính toán nợ và chi phí nhóm. Chúng tôi không giữ tiền của người dùng; mọi giao dịch chuyển tiền thực tế được thực hiện qua các ngân hàng hoặc ví điện tử bên ngoài.</p>
                                <p>Người dùng tự chịu trách nhiệm về tính chính xác của dữ liệu chi tiêu nhập vào hệ thống.</p>
                            </>
                        }
                    />

                    <TermsSection
                        icon={Lock}
                        title="4. Bảo vệ dữ liệu"
                        delay={400}
                        content={
                            <>
                                <p>Hành trình và dữ liệu cá nhân của bạn được mã hóa an toàn. Chúng tôi không bán thông tin của bạn cho bên thứ ba.</p>
                                <p>Vui lòng tham khảo thêm <Link to="/privacy" className="text-primary font-bold hover:underline">Chính sách Bảo mật</Link> của chúng tôi.</p>
                            </>
                        }
                    />

                    <TermsSection
                        icon={AlertCircle}
                        title="5. Giới hạn trách nhiệm"
                        delay={500}
                        content={
                            <>
                                <p>Goouty cố gắng đảm bảo nền tảng hoạt động 24/7, nhưng không chịu trách nhiệm cho các gián đoạn do lỗi đường truyền hoặc sự cố bất khả kháng.</p>
                                <p>Chúng tôi không chịu trách nhiệm cho các tranh chấp phát sinh giữa các cá nhân trong chuyến đi.</p>
                            </>
                        }
                    />
                </div>

                {/* FAQ CTA */}
                <div className="glass-panel p-10 rounded-[3rem] bg-gradient-to-br from-primary/5 to-accent/5 text-center space-y-6">
                    <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                        <HelpCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Bạn vẫn còn thắc mắc?</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Nếu có bất kỳ điều khoản nào chưa rõ, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi 24/7.
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="rounded-full px-8 h-12 font-bold" asChild>
                            <Link to="/contact">Gửi hỗ trợ</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-full px-8 h-12 font-bold border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all text-foreground" asChild>
                            <Link to="/">Quay về Trang chủ</Link>
                        </Button>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="mt-16 text-center text-sm text-muted-foreground">
                    © 2026 Goouty. Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận các điều khoản này.
                </p>
            </div>
        </div>
    );
};

export default TermsPage;
