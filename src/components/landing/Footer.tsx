
export const Footer = () => {
    return (
        <footer className="bg-[#E5E7FD] py-16 mt-auto">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* Left Section: Logo & Description */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                        {/* Logo Badge */}
                        <div className="flex-shrink-0">
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-2xl border-4 border-white/50 transform hover:scale-105 transition-transform duration-300">
                                <img
                                    src="/footer_badge_mascot.png"
                                    alt="Goouty Badge"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4 max-w-sm">
                            <h2 className="text-4xl font-black text-[#5e4ee6] tracking-tight uppercase">GOOUTY</h2>
                            <div className="space-y-4 text-slate-800 text-sm md:text-base font-medium leading-relaxed opacity-90">
                                <p>Lên kế hoạch chuyến đi, chia tiền nhóm, không rắc rối.</p>
                                <p>Goouty giúp bạn tìm kiếm thông minh, quản lý lịch trình và minh bạch tài chính cho mọi chuyến đi cùng bạn bè.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Section: Features List */}
                    <div className="flex justify-center md:justify-start md:pl-20">
                        <div className="text-left">
                            <h3 className="text-[#7262e8] font-semibold mb-6 text-lg">Tính năng</h3>
                            <ul className="space-y-4 text-slate-800 font-medium text-sm md:text-base">
                                <li className="hover:text-[#5e4ee6] transition-colors cursor-default">Lập kế hoạch chuyến đi (Smart Planner).</li>
                                <li className="hover:text-[#5e4ee6] transition-colors cursor-default">Công cụ chia tiền nhóm (Split Bills).</li>
                                <li className="hover:text-[#5e4ee6] transition-colors cursor-default">Thư viện mẫu lịch trình (Templates).</li>
                                <li className="hover:text-[#5e4ee6] transition-colors cursor-default">Tìm kiếm địa điểm (Smart Search).</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
};
