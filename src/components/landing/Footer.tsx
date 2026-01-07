
import React from 'react';
import { Link } from 'react-router-dom';
import {
    Map,
    Split,
    FileText,
    Info,
    BookOpen,
    Shield,
    HelpCircle,
    MessageCircle, // For Feedback/Zalo
    Facebook,
    Instagram,
    Video, // Placeholder for TikTok
    Cookie
} from 'lucide-react';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#dfe0ff] border-t border-gray-100/50 pt-16 pb-8">
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

                        <p className="text-gray-500 text-sm leading-relaxed max-w-xs -mt-4 mb-8 text-left">
                            Nền tảng lập kế hoạch và quản lý chuyến đi thông minh. Kết nối bạn bè, chia sẻ trải nghiệm và minh bạch tài chính.
                        </p>

                        <div className="space-y-3 w-full flex flex-col items-start">
                            <div className="text-sm font-semibold text-gray-900">Tải ứng dụng (Sắp ra mắt)</div>
                            <div className="flex gap-3">
                                {/* App Store Placeholder */}
                                <div className="h-10 px-4 rounded-lg bg-black text-white flex items-center gap-2 cursor-not-allowed opacity-60">
                                    <span className="text-xs font-bold">App Store</span>
                                </div>
                                {/* Google Play Placeholder */}
                                <div className="h-10 px-4 rounded-lg bg-black text-white flex items-center gap-2 cursor-not-allowed opacity-60">
                                    <span className="text-xs font-bold">Google Play</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Goouty (Company) */}
                    <div className="flex flex-col space-y-4 items-start">
                        <h3 className="font-bold text-gray-900 text-lg">Goouty</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
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
                        <h3 className="font-bold text-gray-900 text-lg">Tiện ích</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li>
                                <Link to="/create-trip" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <Map className="w-4 h-4" />
                                    <span>Smart Planner</span>
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center gap-2 text-gray-400 cursor-not-allowed" title="Sắp ra mắt">
                                    <Split className="w-4 h-4" />
                                    <span>Split Bills (Coming Soon)</span>
                                </div>
                            </li>
                            <li>
                                <div className="flex items-center gap-2 text-gray-400 cursor-not-allowed" title="Sắp ra mắt">
                                    <FileText className="w-4 h-4" />
                                    <span>Templates Library (Coming Soon)</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* 4. Contact */}
                    <div className="flex flex-col space-y-4 items-start">
                        <h3 className="font-bold text-gray-900 text-lg">Liên hệ</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex flex-col space-y-1 items-start">
                                <span className="font-medium text-gray-900 flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4" /> Trung tâm trợ giúp
                                </span>
                                <span className="pl-6 text-gray-500">Zalo: 0949226378</span>
                                <a href="mailto:Hi@goouty.com" className="pl-6 text-gray-500 hover:text-primary transition-colors">
                                    Mail: Hi@goouty.com
                                </a>
                            </li>
                            <li>
                                <a href="https://forms.gle/placeholder" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Góp ý / Báo lỗi</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* 5. Socials */}
                    <div className="flex flex-col space-y-4 items-start">
                        <h3 className="font-bold text-gray-900 text-lg">Kết nối</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li>
                                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <Video className="w-4 h-4" />
                                    <span>TikTok</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <Instagram className="w-4 h-4" />
                                    <span>Instagram</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <Facebook className="w-4 h-4" />
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
