import React from 'react';

interface SkeletonProps {
  className?: string;
  radius?: number;
}

export function Skeleton({ className, radius = 8 }: SkeletonProps) {
  return <div className={['shimmer', className ?? ''].join(' ')} style={{ borderRadius: radius }} />;
}

/** Skeleton that mirrors a root screen: hero card, stat trio, list rows. */
export function ScreenSkeleton() {
  return (
    <div className="space-y-8">
      <div className="px-4">
        <Skeleton className="h-[132px] w-full" radius={12} />
      </div>
      <div className="flex gap-2 px-4">
        {[0, 1, 2].map((i) =>
        <Skeleton key={i} className="h-[74px] flex-1" radius={12} />
        )}
      </div>
      <div className="px-4">
        <Skeleton className="mb-2 h-[13px] w-[120px]" radius={4} />
        <div className="space-y-[1px] overflow-hidden rounded-card border border-cardborder bg-card p-4">
          {[0, 1, 2].map((i) =>
          <div key={i} className="flex items-center gap-3 py-[10px]">
              <Skeleton className="h-[16px] flex-1" radius={4} />
              <Skeleton className="h-[16px] w-[52px]" radius={4} />
            </div>
          )}
        </div>
      </div>
    </div>);

}