
import { useState, useEffect } from 'react';
import {
    Map,
    Users,
    Wallet,
    ShieldCheck,
    Globe,
    Calendar,
    Compass,
    Heart,
    Zap,
    ArrowRight,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Link } from 'react-router-dom';
import { useAnimateIn } from '@/lib/animations.ts';

const FeatureCard = ({
    icon: Icon,
    title,
    description,
    delay = 0
}: {
    icon: any,
    title: string,
    description: string,
    delay?: number
}) => {
    return (
        <div
            className="p-8 glass-panel rounded-2xl h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group border border-primary/10"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
};

const AboutPage = () => {
    const showContent = useAnimateIn(false, 300);

    return (
        <div className="relative overflow-hidden min-h-screen bg-background">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-blob"></div>
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-accent/10 blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] rounded-full bg-primary/5 blur-[80px] animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10">
                {/* Hero Section */}
                <div className="flex flex-col items-center text-center mb-32">
                    <div className="max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8 animate-fade-in">
                            <Info size={16} />
                            <span>Giới thiệu về Goouty</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight text-foreground leading-[1.1]">
                            Người bạn đồng hành <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                                thông minh
                            </span> cho mọi hành trình
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-slide-up">
                            Goouty không chỉ là một ứng dụng du lịch. Chúng tôi là giải pháp toàn diện giúp bạn lên kế hoạch, quản lý tài chính nhóm và kết nối bạn bè trong mỗi chuyến đi.
                        </p>

                        <div className="flex justify-center animate-slide-up animation-delay-1000">
                            <Button size="lg" className="rounded-full px-12 h-14 text-lg font-bold shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105" asChild>
                                <Link to="/auth">Bắt đầu ngay <ArrowRight className="ml-2 w-5 h-5" /></Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Vision Section */}
                <div className="mb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2rem] blur-2xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 opacity-70"></div>
                            <div className="relative glass-panel rounded-[2rem] overflow-hidden aspect-[4/3] shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200"
                                    alt="Mountain View"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-10">
                                    <div className="text-white">
                                        <p className="text-lg font-medium opacity-90 mb-2">Sứ mệnh của chúng tôi</p>
                                        <h3 className="text-3xl font-bold">Xóa bỏ rào cản, <br />kết nối mọi đam mê.</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                                Tại sao chúng tôi xây dựng Goouty?
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Chúng tôi hiểu rằng việc tổ chức một chuyến đi nhóm thường đi kèm với những rắc rối: từ việc thống nhất lịch trình, quản lý chi phí đến việc chia sẻ thông tin.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Goouty ra đời để tối giản hóa mọi quy trình, giúp bạn tập trung vào điều quan trọng nhất: <strong>tận hưởng trải nghiệm và gắn kết với những người thân yêu.</strong>
                            </p>

                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Trải nghiệm khác biệt</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Công nghệ hiện đại giúp chuyến đi của bạn trở nên hoàn hảo hơn bao giờ hết.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Map}
                            title="Lập kế hoạch thông minh"
                            description="Tự động hóa lịch trình với các địa điểm gợi ý, tối ưu hóa thời gian di chuyển và sắp xếp khoa học."
                            delay={100}
                        />
                        <FeatureCard
                            icon={Users}
                            title="Gắn kết thành viên"
                            description="Dễ dàng mời bạn bè, thảo luận trực tiếp và cùng nhau đưa ra các quyết định cho chuyến đi."
                            delay={200}
                        />
                        <FeatureCard
                            icon={Wallet}
                            title="Minh bạch tài chính"
                            description="Hệ thống chi trả nhóm thông minh, tự động tính toán 'ai nợ ai' giúp tránh mọi hiểu lầm về tiền bạc."
                            delay={300}
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Bảo mật & Tin cậy"
                            description="Dữ liệu hành trình của bạn luôn được bảo vệ tuyệt đối và đồng bộ hóa tức thì trên mọi thiết bị."
                            delay={400}
                        />
                        <FeatureCard
                            icon={Globe}
                            title="Tiếp cận không giới hạn"
                            description="Hoạt động mượt mà ngay cả khi ngoại tuyến, giúp bạn luôn chủ động trong mọi hoàn cảnh."
                            delay={500}
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Trải nghiệm mượt mà"
                            description="Giao diện hiện đại, tốc độ phản hồi cực nhanh, mang lại cảm giác thoải mái khi sử dụng."
                            delay={600}
                        />
                    </div>
                </div>

                {/* Core Values Section */}
                <div className="relative py-24 px-8 md:px-16 rounded-[3rem] overflow-hidden mb-32">
                    <div className="absolute inset-0 bg-primary/5 -z-10"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -z-10 animate-pulse-slow"></div>

                    <div className="max-w-4xl mx-auto text-center space-y-12">
                        <div className="inline-flex p-3 rounded-2xl bg-primary text-white mb-4">
                            <Heart size={32} />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                            Chúng tôi tin rằng phần tuyệt vời nhất của một chuyến đi là người đi cùng bạn.
                        </h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Vì vậy, Goouty được xây dựng tập trung vào yếu tố con người. Chúng tôi không chỉ cung cấp bản đồ và dữ liệu, chúng tôi cung cấp phương tiện để bạn tạo ra những kỷ niệm không thể quên.
                        </p>

                        <div className="pt-8">
                            <Button size="lg" className="rounded-full px-12 h-14 text-lg font-bold shadow-xl shadow-primary/30" asChild>
                                <Link to="/auth">Gia nhập cộng đồng Goouty</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer info links if needed or just a simple close */}
                <div className="text-center">
                    <p className="text-muted-foreground">
                        © 2026 Goouty. Nâng tầm hành trình của bạn.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
