import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface PullToRefreshWrapperProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  isAr: boolean;
}

export const PullToRefreshWrapper: React.FC<PullToRefreshWrapperProps> = ({
  children,
  onRefresh,
  isAr,
}) => {
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 75;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull to refresh when scrolled at the very top of container
    if (containerRef.current && containerRef.current.scrollTop <= 5 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      // Apply rubber-band resistance
      const resistedDistance = Math.min(100, Math.pow(diff, 0.85));
      setPullDistance(resistedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // hold at active indicator position

      try {
        await Promise.resolve(onRefresh());
        // Small delay for satisfying animation
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (err) {
        console.error('Refresh error:', err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const triggerManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
      await new Promise((resolve) => setTimeout(resolve, 800));
    } finally {
      setIsRefreshing(false);
    }
  };

  const planeProgress = Math.min(1, pullDistance / PULL_THRESHOLD);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full flex-1 flex flex-col"
    >
      {/* Custom Airplane Pull-to-Refresh Indicator */}
      <AnimatePresence>
        {(pullDistance > 10 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ height: `${pullDistance}px` }}
            className="flex items-center justify-center overflow-hidden transition-all duration-75"
          >
            <div className="bg-slate-900 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2.5 border border-slate-700 text-xs font-bold">
              {isRefreshing ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      x: [0, 8, -8, 0],
                      y: [-2, 2, -2],
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    <Plane className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                  <span className="text-slate-200">
                    {isAr ? 'جاري تحديث البيانات والرحلات اللحظية...' : 'Updating live flights & orders...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    style={{ transform: `rotate(${planeProgress * 45}deg) scale(${0.8 + planeProgress * 0.4})` }}
                    className="transition-transform duration-100"
                  >
                    <Plane className={`w-4 h-4 ${pullDistance >= PULL_THRESHOLD ? 'text-emerald-400' : 'text-brand-400'}`} />
                  </div>
                  <span className="text-slate-300">
                    {pullDistance >= PULL_THRESHOLD
                      ? (isAr ? 'أفلت للتحديث 🚀' : 'Release to refresh 🚀')
                      : (isAr ? 'اسحب للأسفل للتحديث' : 'Pull down to refresh')}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
