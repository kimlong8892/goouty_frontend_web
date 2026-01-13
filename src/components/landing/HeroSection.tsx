import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PWAInstallButton } from '@/pwa/components/PWAInstallButton';

interface HeroSectionProps {
  showTitle: boolean;
}

export const HeroSection = ({
  showTitle
}: HeroSectionProps) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Scroll to templates section
    const templatesSection = document.getElementById('templates-section');
    if (templatesSection) {
      templatesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="py-8 md:py-12">
      <AnimatedTransition show={showTitle} animation="slide-up" duration={600}>
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center max-w-6xl mx-auto px-4">
          {/* Left Column - Text Content */}
          <div className="text-left space-y-6">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-primary">
              <span className="block mb-3">VI VU THẢ GA,</span>
              <span className="block mb-3">KHÔNG LO RẮC</span>
              <span className="block">RỐI.</span>
            </h1>

            {/* Subheading */}
            <div className="space-y-4">
              <p className="text-lg font-medium text-foreground">
                Nền tảng 2 trong 1
              </p>

              {/* Feature List */}
              <ul className="space-y-2 text-base md:text-lg text-muted-foreground font-medium">
                <li className="flex items-center gap-3">
                  <span className="text-2xl leading-none text-foreground">•</span>
                  <span>Quản lý lịch trình và chi phí nhóm.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-2xl leading-none text-foreground">•</span>
                  <span>Chia sẻ dễ dàng qua một đường link duy nhất.</span>
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="pt-6 flex flex-wrap gap-4">
              <Button
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-white font-semibold pl-6 pr-4 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                Bắt đầu hành trình <ChevronRight size={18} />
              </Button>

              <PWAInstallButton
                variant="outline"
                className="border-primary/20 hover:bg-primary/5 text-primary font-semibold px-6 py-6 text-base rounded-xl"
              />
            </div>
          </div>

          {/* Right Column - Mascot Image */}
          <div className="flex justify-center items-center">
            <div className="relative w-full max-w-lg aspect-[4/5] overflow-hidden rounded-3xl">
              <img
                src="/hero_mascot.png"
                alt="Goouty Mascot"
                className="w-full h-full object-cover scale-[1.15] transform origin-center transition-transform duration-700 hover:scale-[1.2]"
                onError={(e) => {
                  // Fallback if image doesn't load
                  const target = e.currentTarget;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </AnimatedTransition>
    </div>
  );
};