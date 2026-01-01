import React from 'react';
import { X, Share, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';

interface InstallInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'ios' | 'android' | 'other';
}

export const InstallInstructionsModal: React.FC<InstallInstructionsModalProps> = ({
  isOpen,
  onClose,
  platform
}) => {
  if (!isOpen) return null;

  const getInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Cài đặt Goouty trên iPhone/iPad',
          steps: [
            {
              icon: <Share className="w-5 h-5 text-primary" />,
              text: 'Nhấn vào nút Share (hình vuông với mũi tên lên)'
            },
            {
              icon: <Plus className="w-5 h-5 text-green-600" />,
              text: 'Cuộn xuống và chọn "Thêm vào Màn hình chính"'
            },
            {
              icon: <Check className="w-5 h-5 text-purple-600" />,
              text: 'Nhấn "Thêm" ở góc trên bên phải'
            }
          ],
          note: 'Sau đó bạn có thể mở Goouty từ màn hình chính!'
        };
      case 'android':
        return {
          title: 'Cài đặt Goouty trên Android',
          steps: [
            {
              icon: <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center text-white text-xs font-bold">⋮</div>,
              text: 'Nhấn vào menu trình duyệt (3 chấm)'
            },
            {
              icon: <Plus className="w-5 h-5 text-green-600" />,
              text: 'Chọn "Thêm vào màn hình chính" hoặc "Cài đặt ứng dụng"'
            },
            {
              icon: <Check className="w-5 h-5 text-purple-600" />,
              text: 'Nhấn "Cài đặt" hoặc "Thêm"'
            }
          ],
          note: 'Sau đó bạn có thể mở Goouty từ màn hình chính!'
        };
      default:
        return {
          title: 'Cài đặt Goouty',
          steps: [
            {
              icon: <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center text-white text-xs font-bold">⋮</div>,
              text: 'Nhấn vào menu trình duyệt'
            },
            {
              icon: <Plus className="w-5 h-5 text-green-600" />,
              text: 'Tìm "Thêm vào màn hình chính" hoặc "Cài đặt ứng dụng"'
            },
            {
              icon: <Check className="w-5 h-5 text-purple-600" />,
              text: 'Nhấn để cài đặt'
            }
          ],
          note: 'Sau đó bạn có thể mở Goouty từ màn hình chính!'
        };
    }
  };

  const instructions = getInstructions();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-slide-up">
        {/* Header with Gradient */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/80 transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* App Icon with Gradient */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-xl relative">
              <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl"></div>
              <span className="text-white text-3xl font-bold relative z-10">G</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {instructions.title}
          </h2>
        </div>

        {/* Steps */}
        <div className="px-6 pb-4">
          <div className="space-y-5">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="w-7 h-7 bg-gradient-to-br from-primary to-primary/80 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">Bước {index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Note with Gradient Background */}
          <div className="mt-6 p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20">
            <p className="text-sm text-gray-800 text-center font-medium">
              ✨ {instructions.note}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
          >
            Đã hiểu
          </Button>
        </div>
      </div>
    </div>
  );
};
