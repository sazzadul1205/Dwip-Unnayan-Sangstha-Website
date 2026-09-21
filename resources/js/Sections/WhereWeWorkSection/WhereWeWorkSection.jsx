// js/Sections/WhereWeWorkSection/WhereWeWorkSection.jsx

import { useState } from 'react';

// Skeleton primitives
import { Skeleton } from '../../Shared/Skeletons/SkeletonPrimitives';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Generate placeholder image URL (inline SVG — avoids external placeholder services)
const getPlaceholderImage = (width = 800, height = 600, text = 'Where We Work') => {
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 12));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#009BE2"/><text x="50%" y="50%" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// ============================================
// SKELETON: Single stat card
// ============================================
const StatSkeletonCard = () => (
  <div className="bg-[#F5F5F5] text-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 rounded-xl">
    {/* Icon */}
    <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 xl:w-13 xl:h-13 2xl:w-15 2xl:h-15 rounded-md mx-auto mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-7.5" />

    {/* Value */}
    <Skeleton className="h-8 sm:h-9 md:h-10 lg:h-11 xl:h-12 2xl:h-13 w-20 sm:w-24 md:w-28 mx-auto mb-2 sm:mb-3" />

    {/* Label */}
    <Skeleton className="h-3.5 sm:h-4 md:h-4.5 lg:h-5 w-4/5 mx-auto mb-1" />
    <Skeleton className="h-3.5 sm:h-4 md:h-4.5 lg:h-5 w-3/5 mx-auto" />
  </div>
);

// ============================================
// SKELETON: Full section (text side + image side)
// ============================================
const WhereWeWorkSkeleton = ({
  statCount = 4,
  gridCols = 'grid-cols-1 sm:grid-cols-2',
}) => (
  <div className="flex flex-col lg:flex-row justify-between gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-15 2xl:gap-20">
    {/* Left side */}
    <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 xl:space-y-12.5">
      {/* Title — 2 short lines */}
      <Skeleton className="h-8 sm:h-9 md:h-10 lg:h-11 xl:h-12 2xl:h-13 w-5/6" />

      {/* Stats grid */}
      <div className={`grid ${gridCols} gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7`}>
        {Array.from({ length: statCount }).map((_, i) => (
          <StatSkeletonCard key={`stat-skeleton-${i}`} />
        ))}
      </div>
    </div>

    {/* Right side — image */}
    <div className="w-full lg:w-1/2 flex items-center mt-6 sm:mt-8 lg:mt-0">
      <Skeleton className="w-full h-full min-h-62.5 sm:min-h-75 md:min-h-87.5 lg:min-h-100 xl:min-h-112.5 2xl:min-h-125 rounded-2xl sm:rounded-3xl lg:rounded-4xl" />
    </div>
  </div>
);

/**
 * WhereWeWorkSection Component
 */
const WhereWeWorkSection = ({
  data,
  workData,
  loading = false,               // ← NEW
  skeletonStatCount = 4,         // ← NEW
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
}) => {
  const [imageErrors, setImageErrors] = useState({});

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    // Skeleton grid mirrors real: 2 cols when >= 4 stats, 1 col otherwise
    const gridCols =
      skeletonStatCount >= 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';

    return (
      <section
        id="where-we-work"
        className={`flex flex-col lg:flex-row justify-between ${bgColor} gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-15 2xl:gap-20 ${paddingX} ${paddingY} ${sectionClassName}`}
      >
        <WhereWeWorkSkeleton statCount={skeletonStatCount} gridCols={gridCols} />
      </section>
    );
  }

  // ============================================
  // RESOLVE + NORMALIZE
  // ============================================
  let resolvedData = data || workData;
  if (!hasValue(resolvedData)) return null;

  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  const { section = {}, stats = [], image = {} } = resolvedData;

  if (!section.title && !stats.length && !image.src) return null;

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const handleImageError = (imageId) => {
    setImageErrors((prev) => ({ ...prev, [imageId]: true }));
  };

  const getImageSrc = (imageData, defaultText = 'Where We Work') => {
    if (imageErrors[imageData.id || 'main']) {
      return getPlaceholderImage(800, 600, imageData.alt || defaultText);
    }
    if (hasValue(imageData.src)) return imageData.src;
    return getPlaceholderImage(800, 600, imageData.alt || defaultText);
  };

  const getIconSrc = (stat) => {
    if (imageErrors[`icon-${stat.id}`]) {
      return getPlaceholderImage(60, 60, stat.label || 'Icon');
    }
    if (hasValue(stat.icon)) return stat.icon;
    return getPlaceholderImage(60, 60, stat.label || 'Icon');
  };

  // ============================================
  // GRID COLS
  // ============================================
  const getGridCols = () => {
    if (stats.length <= 3) return 'grid-cols-1';
    return 'grid-cols-1 sm:grid-cols-2';
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id="where-we-work"
      className={`flex flex-col lg:flex-row justify-between ${bgColor} gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-15 2xl:gap-20 ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {(section.title || stats.length > 0) && (
        <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 xl:space-y-12.5">
          {section.title && (
            <h1 className="bricolage-grotesque font-700 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] 2xl:text-[48px] text-[#080C14] leading-tight">
              {section.title}
            </h1>
          )}

          {stats.length > 0 && (
            <div className={`grid ${getGridCols()} gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7`}>
              {stats.map((stat) => (
                <div
                  key={stat.id}
                  className="bg-[#F5F5F5] text-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group cursor-pointer"
                >
                  <img
                    src={getIconSrc(stat)}
                    alt={stat.alt || stat.label || 'Statistic icon'}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 xl:w-13 xl:h-13 2xl:w-15 2xl:h-15 mx-auto mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-7.5 group-hover:scale-110 transition-transform duration-300"
                    onError={() => handleImageError({ id: `icon-${stat.id}` })}
                  />
                  {stat.value && (
                    <h3 className="bricolage-grotesque font-600 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] 2xl:text-[50px] text-[#080C14] leading-tight">
                      {stat.value}
                    </h3>
                  )}
                  {stat.label && (
                    <p className="font-600 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[17px] text-[#080C14] max-w-63.75 mx-auto leading-relaxed px-2">
                      {stat.label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="w-full lg:w-1/2 flex items-center mt-6 sm:mt-8 lg:mt-0">
        <div className="w-full h-full min-h-62.5 sm:min-h-75 md:min-h-87.5 lg:min-h-100 xl:min-h-112.5 2xl:min-h-125">
          <img
            src={getImageSrc(image)}
            alt={image.alt || 'Where we work image'}
            className={`${image.className || ''} w-full h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl`}
            onError={() => handleImageError({ id: 'main' })}
          />
        </div>
      </div>
    </section>
  );
};

export default WhereWeWorkSection;