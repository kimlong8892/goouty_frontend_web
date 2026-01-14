
import React, { useEffect, useRef, useState } from 'react';
import { usePWA } from '@/pwa/hooks/usePWA';

interface PWAPullToRefreshProps {
    children: React.ReactNode;
}

export const PWAPullToRefresh = ({ children }: PWAPullToRefreshProps) => {
    const { isPWA } = usePWA();
    const [pullChange, setPullChange] = useState<number>(0);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const startPointRef = useRef<number>(0);
    const pullChangeRef = useRef<number>(0);
    const isDraggingRef = useRef<boolean>(false);

    const PULL_THRESHOLD = 80;
    const MAX_PULL = 150;

    useEffect(() => {
        if (!isPWA) return;

        const handleTouchStart = (e: TouchEvent) => {
            // Only trigger if at the very top
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            if (scrollTop <= 1) {
                startPointRef.current = e.targetTouches[0].clientY;
                isDraggingRef.current = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDraggingRef.current || refreshing) return;

            const currentY = e.targetTouches[0].clientY;
            const pullY = currentY - startPointRef.current;

            if (pullY > 0) {
                // Logarithmic resistance
                const newPull = Math.min(pullY * 0.4, MAX_PULL);

                pullChangeRef.current = newPull;
                setPullChange(newPull);
                setIsDragging(true);

                // Prevent browser rubber-banding/native refresh
                if (e.cancelable && newPull > 5) {
                    e.preventDefault();
                }
            } else {
                // We are swiping up, reset
                if (pullChangeRef.current !== 0) {
                    pullChangeRef.current = 0;
                    setPullChange(0);
                    setIsDragging(false);
                }
            }
        };

        const handleTouchEnd = () => {
            if (!isDraggingRef.current) return;

            const currentPull = pullChangeRef.current;
            isDraggingRef.current = false;
            setIsDragging(false);

            if (currentPull > PULL_THRESHOLD) {
                setRefreshing(true);
                setPullChange(PULL_THRESHOLD);

                setTimeout(() => {
                    window.location.reload();
                }, 600);
            } else {
                setPullChange(0);
                pullChangeRef.current = 0;
            }
        };

        const root = document;
        root.addEventListener('touchstart', handleTouchStart, { passive: true });
        root.addEventListener('touchmove', handleTouchMove, { passive: false });
        root.addEventListener('touchend', handleTouchEnd);

        return () => {
            root.removeEventListener('touchstart', handleTouchStart);
            root.removeEventListener('touchmove', handleTouchMove);
            root.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPWA, refreshing]);

    if (!isPWA) return <>{children}</>;

    return (
        <div className="relative overflow-visible flex-1 flex flex-col">
            {/* Loading Indicator Area */}
            <div
                className="absolute left-0 w-full flex justify-center pointer-events-none z-[100]"
                style={{
                    top: -50,
                    transform: `translateY(${Math.min(pullChange, MAX_PULL)}px)`,
                    opacity: Math.min(pullChange / 40, 1),
                    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                <div className="bg-white dark:bg-zinc-800 shadow-xl rounded-full p-2.5 border border-primary/20 backdrop-blur-md">
                    <svg
                        className={`w-6 h-6 text-primary ${refreshing ? 'animate-spin' : ''}`}
                        style={{ transform: !refreshing ? `rotate(${pullChange * 3}deg)` : 'none' }}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                </div>
            </div>

            {/* Content wrapper */}
            <div
                className="flex-1 flex flex-col"
                style={{
                    transform: `translateY(${refreshing ? PULL_THRESHOLD : pullChange}px)`,
                    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                {children}
            </div>
        </div>
    );
};
