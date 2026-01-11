import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md w-full animate-fade-in">
        <h1 className="text-8xl font-black text-primary mb-2 opacity-20">404</h1>
        <div className="-mt-12 relative z-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Rất tiếc! Không tìm thấy trang</h2>
          <p className="text-gray-600 mb-8">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
            <br />
            Hệ thống sẽ tự động đưa bạn về trang chủ sau <span className="font-bold text-primary">{countdown}</span> giây...
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
          >
            Quay lại trang chủ ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
