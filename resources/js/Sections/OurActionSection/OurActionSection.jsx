// js/Sections/OurActionSection/OurActionSection.jsx

// React
import React, { useState } from 'react';

// Skeleton primitives
import { Skeleton, SkeletonText } from '../../Shared/Skeletons/SkeletonPrimitives';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Generate placeholder icon URL (inline SVG — avoids external placeholder services)
const getPlaceholderIcon = (text = 'Icon') => {
  const safeText = text
    .substring(0, 3)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="100%" height="100%" fill="#009BE2"/><text x="50%" y="50%" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// ============================================
// SKELETON: Single action card
// ============================================
const ActionSkeletonCard = () => (
  <div className="bg-[#FAFAFA] p-5 sm:p-6 md:p-7 lg:p-8 xl:p-10 2xl:p-12.5 rounded-xl">
    {/* Icon — 7→12.5 */}
    <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 xl:w-11 xl:h-11 2xl:w-12.5 2xl:h-12.5 rounded-md mb-2 sm:mb-3 md:mb-4 lg:mb-5" />

    {/* Title */}
    <Skeleton className="h-5 sm:h-5.5 md:h-6 lg:h-6.5 xl:h-7 w-3/5 mb-2 sm:mb-2.5 md:mb-3" />

    {/* Description — 3 lines */}
    <SkeletonText
      lines={3}
      lineClassName="h-3 sm:h-3.5 md:h-4 lg:h-4.5 xl:h-5"
    />
  </div>
);

// ============================================
// SKELETON: Full section (centered header + card grid)
// ============================================
const OurActionSkeleton = ({ count = 6 }) => (
  <>
    {/* Section header */}
    <div className="text-center">
      {/* Title */}
      <Skeleton className="h-8 sm:h-9 md:h-10 lg:h-11 xl:h-12 2xl:h-13 w-3/4 sm:w-1/2 mx-auto mb-2 sm:mb-3 md:mb-4" />
      {/* Description */}
      <div className="max-w-253 mx-auto px-4 sm:px-0">
        <Skeleton className="h-4 sm:h-4.5 md:h-5 lg:h-5.5 w-full mb-1.5" />
        <Skeleton className="h-4 sm:h-4.5 md:h-5 lg:h-5.5 w-2/3 mx-auto" />
      </div>
    </div>

    {/* Actions grid — matches real: 1 / 2 / 3 cols */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-7.5 pt-6 sm:pt-8 md:pt-10 lg:pt-12 xl:pt-12.5">
      {Array.from({ length: count }).map((_, i) => (
        <ActionSkeletonCard key={`action-skeleton-${i}`} />
      ))}
    </div>
  </>
);

/**
 * OurActionSection Component
 */
const OurActionSection = ({
  data,
  actionData,
  loading = false,               // ← NEW
  skeletonCount = 6,             // ← NEW
  bgColor = 'bg-[#F5F5F5]',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
}) => {
  const [iconErrors, setIconErrors] = useState({});

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <section
        id="our-action"
        className={`mx-auto ${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
      >
        <OurActionSkeleton count={skeletonCount} />
      </section>
    );
  }

  // ============================================
  // RESOLVE + NORMALIZE
  // ============================================
  let resolvedData = data || actionData;
  if (!hasValue(resolvedData)) return null;

  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  const { section = {}, actions = [] } = resolvedData;

  if (!hasValue(section.title) && !hasValue(section.description) && !hasValue(actions)) {
    return null;
  }

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const handleIconError = (actionId) => {
    setIconErrors((prev) => ({ ...prev, [actionId]: true }));
  };

  const getIconSrc = (action) => {
    if (iconErrors[action.id]) {
      return getPlaceholderIcon(action.title || 'Icon');
    }
    if (hasValue(action.icon)) return action.icon;
    return getPlaceholderIcon(action.title || 'Icon');
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id="our-action"
      className={`mx-auto ${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {(section.title || section.description) && (
        <div className="text-center">
          {section.title && (
            <h1 className="bricolage-grotesque font-700 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] 2xl:text-[48px] text-center text-[#080C14] pb-2 sm:pb-3 md:pb-4">
              {section.title}
            </h1>
          )}
          {section.description && (
            <p className="mx-auto font-400 text-center text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[19px] 2xl:text-[20px] max-w-253 text-[#515151] leading-relaxed px-4 sm:px-0">
              {section.description}
            </p>
          )}
        </div>
      )}

      {actions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-7.5 pt-6 sm:pt-8 md:pt-10 lg:pt-12 xl:pt-12.5">
          {actions.map((action) => (
            <div
              key={action.id}
              className="bg-[#FAFAFA] hover:bg-white p-5 sm:p-6 md:p-7 lg:p-8 xl:p-10 2xl:p-12.5 rounded-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer hover:shadow-[0_6px_12px_rgba(0,0,0,0.10)]"
            >
              <img
                src={getIconSrc(action)}
                alt={action.alt || action.title || 'Action icon'}
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 xl:w-11 xl:h-11 2xl:w-12.5 2xl:h-12.5 group-hover:scale-110 transition-transform duration-300 mb-2 sm:mb-3 md:mb-4 lg:mb-5"
                onError={() => handleIconError(action.id)}
              />
              {action.title && (
                <h3 className="bricolage-grotesque font-600 text-[18px] sm:text-[19px] md:text-[20px] lg:text-[22px] xl:text-[24px] text-[#080C14] mb-1.5 sm:mb-2 md:mb-2.5 lg:mb-3">
                  {action.title}
                </h3>
              )}
              {action.description && (
                <p className="font-400 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[17px] text-[#515151] leading-relaxed">
                  {action.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default OurActionSection;