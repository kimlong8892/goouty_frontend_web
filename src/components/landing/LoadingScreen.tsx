
export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="text-center">
        {/* Logo with pulse animation */}
        <div className="mb-6 animate-pulse">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4">
            <img src="/footer_badge_mascot.png" alt="Goouty Mascot" className="w-24 h-24 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Goouty</h1>
          <p className="text-gray-600">Lên kế hoạch chuyến đi, chia tiền nhóm</p>
        </div>

        {/* Loading spinner */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 text-sm animate-pulse">Đang tải...</p>
        </div>
      </div>
    </div>
  );
};
