
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

    // Refs for values used in event listeners to avoid re-binding
    const startPointRef = useRef<number>(0);
    const pullChangeRef = useRef<number>(0);
    const isDraggingRef = useRef<boolean>(false);

    // Constants
    const PULL_THRESHOLD = 80;
    const MAX_PULL = 160;

    useEffect(() => {
        // Only active in PWA mode
        if (!isPWA) return;

        const handleTouchStart = (e: TouchEvent) => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            if (scrollTop <= 5) { // Allow small margin
                startPointRef.current = e.targetTouches[0].clientY;
                isDraggingRef.current = true;
            } else {
                startPointRef.current = 0;
                isDraggingRef.current = false;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDraggingRef.current) return;

            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const currentY = e.targetTouches[0].clientY;
            const startY = startPointRef.current;

            // Only if we are at top
            if (scrollTop <= 0 && startY > 0) {
                const pullY = currentY - startY;

                // If pulling down
                if (pullY > 0) {
                    // Add resistance formula
                    const newPull = Math.min(pullY * 0.4, MAX_PULL);

                    // Only update state if meaningful change to avoid react render thrashing
                    if (Math.abs(newPull - pullChangeRef.current) > 1) {
                        pullChangeRef.current = newPull;
                        setPullChange(newPull);
                        setIsDragging(true); // Helper for UI transition
                    }

                    // Prevent native scroll/refresh ONLY if we are actively pulling custom refresh
                    // This prevents the address bar from weirdly jumping or native rubber band conflict
                    if (e.cancelable && newPull > 10) {
                        e.preventDefault();
                    }
                } else {
                    // Pushing up (normal scroll)
                    pullChangeRef.current = 0;
                    setPullChange(0);
                }
            } else {
                // Scrolled down, reset
                pullChangeRef.current = 0;
                setPullChange(0);
                isDraggingRef.current = false;
            }
        };

        const handleTouchEnd = () => {
            const currentPull = pullChangeRef.current;
            isDraggingRef.current = false;
            setIsDragging(false);

            if (currentPull > PULL_THRESHOLD) {
                setRefreshing(true);
                // Force reset visual lightly to indicate loading position
                setPullChange(PULL_THRESHOLD);

                // Trigger reload after a brief visual confirmation
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                // Reset
                setPullChange(0);
                pullChangeRef.current = 0;
            }

            startPointRef.current = 0;
        };

        const root = document;
        // Passive: false needed for preventDefault
        root.addEventListener('touchstart', handleTouchStart, { passive: true });
        root.addEventListener('touchmove', handleTouchMove, { passive: false });
        root.addEventListener('touchend', handleTouchEnd);

        return () => {
            root.removeEventListener('touchstart', handleTouchStart);
            root.removeEventListener('touchmove', handleTouchMove);
            root.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPWA]);

    if (!isPWA) return <>{children}</>;

    return (
        <div
            className="min-h-screen relative"
            style={{
                transform: `translateY(${refreshing ? PULL_THRESHOLD : pullChange}px)`,
                // Instant transition when dragging, smooth when releasing
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
        >
            {/* Loading Indicator */}
            <div
                className="fixed left-0 w-full flex justify-center items-center pointer-events-none z-50"
                style={{
                    top: -60, // Start hidden above
                    height: 60,
                    opacity: Math.min(pullChange / (PULL_THRESHOLD * 0.8), 1),
                    // Rotate based on pull amount
                    transform: `rotate(${pullChange * 3}deg)`
                }}
            >
                <div className="bg-white dark:bg-zinc-800 shadow-lg rounded-full p-2.5 border border-border/50">
                    <svg
                        className={`w-5 h-5 text-primary ${refreshing ? 'animate-spin' : ''}`}
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

            {children}
        </div>
    );
};
