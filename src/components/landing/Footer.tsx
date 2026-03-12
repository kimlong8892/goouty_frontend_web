import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    Map,
    Split,
    FileText,
    Info,
    BookOpen,
    Shield,
    HelpCircle,
    MessageCircle, // For Feedback/Zalo
    Cookie,
    Mail
} from 'lucide-react';

export const Footer = () => {
    const currentYear = new Date().getFullYear();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleFeedbackClick = () => {
        if (!isAuthenticated) {
            localStorage.setItem('open_feedback_after_login', 'true');
            window.scrollTo(0, 0);
            navigate('/auth');
        } else {
            window.dispatchEvent(new CustomEvent('open-feedback-form'));
        }
    };

    return (
        <footer className="bg-secondary/50 border-t border-border pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-20 mb-16">

                    {/* 1. Brand / App */}
                    <div className="flex flex-col items-start">
                        <Link to="/" className="inline-block group">
                            <img
                                src="https://pupil-sleep-11345349.figma.site/_assets/v11/8da9e20de4331dfe75eaaed992ce1fa360377f01.png"
                                alt="Goouty"
                                className="w-64 h-auto -mt-24 object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>

                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs -mt-4 mb-8 text-left">
                            Nền tảng lập kế hoạch và quản lý chuyến đi thông minh. Kết nối bạn bè, chia sẻ trải nghiệm và minh bạch tài chính.
                        </p>

                        <div className="space-y-3 w-full flex flex-col items-start">
                            <div className="text-sm font-semibold text-foreground dark:text-white">Tải ứng dụng (Sắp ra mắt)</div>
                            <div className="flex gap-3">
                                {/* App Store */}
                                <img
                                    src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                                    alt="Download on the App Store"
                                    className="h-9 w-auto cursor-not-allowed opacity-60 hover:opacity-100 transition-opacity"
                                />
                                {/* Google Play */}
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                                    alt="Get it on Google Play"
                                    className="h-9 w-auto cursor-not-allowed opacity-60 hover:opacity-100 transition-opacity"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Goouty (Company) */}
                    <div className="flex flex-col space-y-4 items-start">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Goouty</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link to="/about" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <Info className="w-4 h-4" />
                                    <span>Giới thiệu Goouty</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <BookOpen className="w-4 h-4" />
                                    <span>Blog / Travel Tips</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <FileText className="w-4 h-4" />
                                    <span>Điều khoản sử dụng</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <Shield className="w-4 h-4" />
                                    <span>Chính sách bảo mật</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <HelpCircle className="w-4 h-4" />
                                    <span>Câu hỏi thường gặp</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 3. Utilities */}
                    <div className="flex flex-col space-y-4 items-start">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Tiện ích</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link to="/create-trip" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <Map className="w-4 h-4" />
                                    <span>Lập kế hoạch</span>
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <Split className="w-4 h-4" />
                                    <span>Chia hóa đơn</span>
                                </div>
                            </li>
                            <li>
                                <div className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <FileText className="w-4 h-4" />
                                    <span>Mẫu chuyến đi</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* 4. Contact */}
                    <div className="flex flex-col space-y-4 items-start">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Liên hệ</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex flex-col space-y-1 items-start">
                                <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4" /> Trung tâm trợ giúp
                                </span>
                                <div className="flex flex-col gap-2 pl-6 mt-1">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <img
                                            src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
                                            alt="Zalo"
                                            className="w-4 h-4 object-contain"
                                        />
                                        <span>0949226378</span>
                                    </div>
                                    <a href="mailto:Hi@goouty.com" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
                                        <img
                                            src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                                            alt="Gmail"
                                            className="w-4 h-4 object-contain"
                                        />
                                        <span>Hi@goouty.com</span>
                                    </a>
                                </div>
                            </li>
                            <li>
                                <button
                                    onClick={handleFeedbackClick}
                                    className="flex items-center gap-2 hover:text-primary transition-colors text-sm text-left"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Góp ý / Báo lỗi</span>
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* 5. Socials */}
                    <div className="flex flex-col space-y-4 items-start">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Kết nối</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <a href="https://www.tiktok.com/@hi.goouty" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <img
                                        src="https://www.vectorlogo.zone/logos/tiktok/tiktok-icon.svg"
                                        alt="TikTok"
                                        className="w-6 h-6 object-contain"
                                    />
                                    <span>TikTok</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.threads.net/@hi.goouty" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/9/9d/Threads_%28app%29_logo.svg"
                                        alt="Threads"
                                        className="w-6 h-6 object-contain dark:invert"
                                    />
                                    <span>Threads</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.instagram.com/hi.goouty" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg"
                                        alt="Instagram"
                                        className="w-6 h-6 object-contain"
                                    />
                                    <span>Instagram</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.facebook.com/hii.goouty" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg"
                                        alt="Facebook"
                                        className="w-6 h-6 object-contain"
                                    />
                                    <span>Facebook</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-500">
                        © {currentYear} Goouty. All rights reserved.
                    </div>

                    <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors">
                        <Cookie className="w-4 h-4" />
                        <span>Cookie settings</span>
                    </button>
                </div>
            </div>
        </footer>
    );
};
