import React from 'react';

interface ISkeletonProps {
  className?: string;
}

/**
 * Base skeleton element with shimmer animation
 */
const Skeleton: React.FC<ISkeletonProps> = ({ className = '' }) => (
  <div className={`bg-nz-elevated animate-pulse rounded ${className}`} aria-hidden="true" />
);

/**
 * Featured card skeleton — matches FeaturedCard dimensions (320px tall)
 */
export const FeaturedCardSkeleton: React.FC = () => (
  <div
    className="relative h-[320px] rounded-[22px] overflow-hidden bg-nz-surface"
    aria-label="Loading..."
  >
    <Skeleton className="absolute inset-0 rounded-none" />
    <div className="absolute top-3 left-3">
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
      <Skeleton className="w-20 h-3 mb-2 rounded" />
      <Skeleton className="w-3/4 h-9 mb-2 rounded" />
      <Skeleton className="w-1/3 h-4 rounded" />
    </div>
  </div>
);

/**
 * Tile card skeleton — matches TileCard dimensions (200px wide)
 */
export const TileCardSkeleton: React.FC = () => (
  <div
    className="w-[200px] shrink-0 bg-nz-surface border border-nz-border rounded-[18px] overflow-hidden"
    aria-label="Loading..."
  >
    <Skeleton className="h-[144px] rounded-none" />
    <div className="px-3 py-2.5">
      <Skeleton className="w-3/4 h-4 mb-2 rounded" />
      <Skeleton className="w-1/2 h-3 mb-1 rounded" />
      <Skeleton className="w-1/3 h-3 rounded" />
    </div>
  </div>
);

/**
 * Row card skeleton — matches RowCard dimensions
 */
export const RowCardSkeleton: React.FC = () => (
  <div
    className="flex items-center gap-3 bg-nz-surface border border-nz-border rounded-[18px] p-3"
    aria-label="Loading..."
  >
    <Skeleton className="shrink-0 w-[92px] h-[92px] rounded-[12px]" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <Skeleton className="w-14 h-5 rounded-full" />
        <Skeleton className="w-12 h-3 rounded" />
      </div>
      <Skeleton className="w-3/4 h-4 mb-1 rounded" />
      <Skeleton className="w-1/2 h-3 rounded" />
    </div>
    <Skeleton className="shrink-0 w-8 h-8 rounded-full" />
  </div>
);

/**
 * Generate multiple skeleton cards for loading states
 */
export const SkeletonList: React.FC<{
  variant: 'featured' | 'tile' | 'row';
  count?: number;
}> = ({ variant, count = 3 }) => {
  const components = {
    featured: FeaturedCardSkeleton,
    tile: TileCardSkeleton,
    row: RowCardSkeleton,
  };
  const Component = components[variant];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
};

/**
 * Listing detail page skeleton
 */
export const ListingDetailSkeleton: React.FC = () => (
  <div className="h-full overflow-y-auto bg-nz-bg">
    <div className="max-w-3xl mx-auto">
      {/* Hero image */}
      <Skeleton className="w-full aspect-[16/10] rounded-none" />
      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        {/* Action buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export default Skeleton;
