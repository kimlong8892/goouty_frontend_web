
import { useState, useEffect } from 'react';
import {
    BookOpen,
    Search,
    ArrowRight,
    Clock,
    User,
    ChevronRight,
    TrendingUp,
    MapPin,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Link } from 'react-router-dom';
import { useAnimateIn } from '@/lib/animations.ts';

const BlogCard = ({
    image,
    category,
    title,
    excerpt,
    author,
    date,
    readTime,
    delay = 0
}: {
    image: string,
    category: string,
    title: string,
    excerpt: string,
    author: string,
    date: string,
    readTime: string,
    delay?: number,
    key?: number | string
}) => {
    return (
        <div
            className="group flex flex-col glass-panel rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border border-primary/5"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="relative aspect-[16/10] overflow-hidden">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-primary text-xs font-bold uppercase tracking-wider">
                        {category}
                    </span>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {date}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {readTime}</span>
                </div>

                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                    {excerpt}
                </p>

                <div className="mt-auto pt-6 border-t border-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {author.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-foreground/80">{author}</span>
                    </div>
                    <Link to="#" className="text-primary font-bold text-sm flex items-center gap-1 group/link">
                        Đọc tiếp <ChevronRight size={16} className="transition-transform group-hover/link:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

const BlogPage = () => {
    const showContent = useAnimateIn(false, 300);
    const [activeCategory, setActiveCategory] = useState('Tất cả');

    const categories = ['Tất cả', 'Cẩm nang', 'Lịch trình', 'Tài chính', 'Địa điểm', 'Mẹo vặt'];

    const blogPosts = [
        {
            image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800",
            category: "Cẩm nang",
            title: "Cách lên kế hoạch chuyến đi nhóm mà không gây tranh cãi",
            excerpt: "Việc thống nhất lịch trình cho một nhóm đông người chưa bao giờ là dễ dàng. Hãy cùng khám phá 5 bí quyết giúp mọi người đều hài lòng.",
            author: "Hoàng Nguyễn",
            date: "10/01/2026",
            readTime: "8 phút",
            delay: 100
        },
        {
            image: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&q=80&w=800",
            category: "Tài chính",
            title: "Quản lý ngân sách du lịch: Chia tiền sao cho văn minh?",
            excerpt: "Vấn đề tiền bạc thường rất nhạy cảm. Goouty sẽ hướng dẫn bạn cách sử dụng công cụ quyết toán để mọi chi phí đều minh bạch.",
            author: "Linh Đan",
            date: "08/01/2026",
            readTime: "5 phút",
            delay: 200
        },
        {
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
            category: "Địa điểm",
            title: "Top 10 hòn đảo hoang sơ nhất Việt Nam cho năm 2026",
            excerpt: "Rời xa sự ồn ào của phố thị, hãy cùng Goouty khám phá những thiên đường biển đảo còn giữ nguyên nét tĩnh lặng.",
            author: "Minh Tú",
            date: "05/01/2026",
            readTime: "12 phút",
            delay: 300
        },
        {
            image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&q=80&w=800",
            category: "Mẹo vặt",
            title: "Gói hành trang gọn nhẹ cho chuyến đi trekking 3 ngày",
            excerpt: "Mang gì và bỏ gì? Bí quyết xếp hành lý tối ưu để bạn có thể thoải mái di chuyển trên những cung đường khó khăn nhất.",
            author: "Quốc Anh",
            date: "02/01/2026",
            readTime: "6 phút",
            delay: 400
        },
        {
            image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800",
            category: "Lịch trình",
            title: "Trải nghiệm camping tại Đà Lạt: Lịch trình 2 ngày 1 đêm",
            excerpt: "Đón bình minh trên đỉnh đồi và thưởng thức BBQ giữa rừng thông. Một kế hoạch chi tiết dành cho các tín đồ mê xê dịch.",
            author: "Hương Giang",
            date: "30/12/2025",
            readTime: "10 phút",
            delay: 500
        },
        {
            image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800",
            category: "Cẩm nang",
            title: "An toàn khi du lịch tự túc: Những điều không thể bỏ qua",
            excerpt: "Bảo mật thông tin, bảo quản tài sản và cách xử lý các tình huống khẩn cấp khi bạn đang ở một nơi xa lạ.",
            author: "Tuấn Trần",
            date: "28/12/2025",
            readTime: "7 phút",
            delay: 600
        }
    ];

    return (
        <div className="relative min-h-screen bg-background pb-24">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden -z-10">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-blob"></div>
                <div className="absolute bottom-0 left-[-5%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px] animate-blob animation-delay-2000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
                {/* Hero Section */}
                <div className="text-center mb-20 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                        <BookOpen size={16} />
                        <span>Blog / Travel Tips</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-foreground">
                        Cảm hứng <span className="text-primary">&</span> Cẩm nang
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Nơi chia sẻ những bí quyết du lịch, lịch trình độc bản và những câu chuyện truyền cảm hứng cho hành trình tiếp theo của bạn.
                    </p>
                </div>

                {/* Featured Search & Filter */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 animate-slide-up">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap border-2 ${activeCategory === cat
                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-transparent border-primary/10 text-muted-foreground hover:border-primary/30'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Tìm kiếm bài viết..."
                            className="pl-12 rounded-full border-primary/20 focus:border-primary h-12 bg-background/50 backdrop-blur-sm"
                        />
                    </div>
                </div>

                {/* Trending Post (Optional Premium Feature) */}
                <div className="mb-16 animate-fade-in animation-delay-500">
                    <div className="relative h-[400px] md:h-[500px] rounded-[2.5rem] overflow-hidden group shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&q=80&w=1600"
                            alt="Featured"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-16">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold">
                                    <TrendingUp size={14} /> NỔI BẬT
                                </span>
                                <span className="text-white/60 text-sm font-medium">10 phút đọc</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 max-w-3xl leading-tight">
                                Hành trình xuyên Việt: Lập kế hoạch từ A-Z cho chuyến đi để đời
                            </h2>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <Button size="lg" className="rounded-full px-8 h-12 text-base font-bold bg-primary hover:bg-primary/90">
                                    Đọc ngay <ArrowRight size={18} className="ml-2" />
                                </Button>
                                <div className="flex items-center gap-3 text-white/80">
                                    <MapPin size={18} className="text-primary" />
                                    <span className="text-sm font-medium">Tuyến đường: Hà Nội - Sài Gòn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {blogPosts.map((post, idx) => (
                        <BlogCard
                            key={idx}
                            image={post.image}
                            category={post.category}
                            title={post.title}
                            excerpt={post.excerpt}
                            author={post.author}
                            date={post.date}
                            readTime={post.readTime}
                            delay={post.delay}
                        />
                    ))}
                </div>

                {/* Load More / Pagination */}
                <div className="mt-20 text-center">
                    <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full px-12 h-14 text-lg font-bold border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all text-foreground"
                    >
                        Xem thêm bài viết
                    </Button>
                </div>

                {/* Newsletter CTA */}
                <div className="mt-32 relative py-20 px-8 md:px-16 rounded-[3rem] overflow-hidden border border-primary/10 shadow-xl bg-primary/5">
                    {/* Subtle Background Elements */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-[80px] -z-10"></div>

                    <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                            Đừng bỏ lỡ những cẩm nang hay nhất
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-white/90 font-medium">
                            Đăng ký nhận bản tin hàng tuần về mẹo vặt và những điểm đến mới nhất từ cộng đồng Goouty.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto pt-4 text-left">
                            <div className="relative flex-1 group">
                                <Input
                                    placeholder="Email của bạn..."
                                    className="rounded-full h-16 px-8 border-2 border-primary/10 bg-white/80 dark:bg-white/20 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/70 focus-visible:ring-2 focus-visible:ring-primary/50 backdrop-blur-md transition-all group-hover:bg-white dark:group-hover:bg-white/20 text-base"
                                />
                            </div>
                            <Button size="lg" className="rounded-full h-16 px-10 font-bold bg-primary text-white hover:bg-primary/90 hover:scale-105 transition-all shadow-xl shadow-primary/20">
                                Đăng ký ngay
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogPage;
