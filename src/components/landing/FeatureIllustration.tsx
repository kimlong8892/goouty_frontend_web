
import React from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition.tsx';
import { cn } from '@/lib/utils.ts';
import { CustomIllustration } from './FeatureIllustrations/CustomIllustration.tsx';

interface FeatureIllustrationProps {
  featureIndex: number | null;
  className?: string;
}

export const FeatureIllustration: React.FC<FeatureIllustrationProps> = ({ featureIndex, className }) => {
  return (
    <AnimatedTransition 
      show={featureIndex !== null} 
      animation="scale" 
      duration={500}
      className={cn("w-full mb-12", className)}
    >
      {featureIndex !== null && (
        <CustomIllustration featureIndex={featureIndex} />
      )}
    </AnimatedTransition>
  );
};
