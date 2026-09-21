// js/Sections/BannerSection/PageBannerSection.jsx

import React, { useState } from 'react';

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

// Generate placeholder image URL (inline SVG)
const getPlaceholderImage = (width = 1920, height = 600, text = 'Banner') => {
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 12));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="50%" y="50%" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// ============================================
// SKELETON: Full PageBanner
// ============================================
const PageBannerSkeleton = ({ paddingX, paddingY }) => (
  <>
    {/* Background image — matches real: covers entire section */}
    <Skeleton
      className="w-full h-full absolute inset-0"
      rounded="rounded-none"
    />

    {/* Dark overlay — mirrors real stack */}
    <div className="absolute inset-0 bg-black/40 sm:bg-black/30 md:bg-black/20 lg:bg-black/10" />

    {/* Text content — left-aligned like real */}
    <div className={`absolute left-0 inset-0 flex items-center ${paddingX} ${paddingY}`}>
      <div className="w-full text-white space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
        {/* Title — 2 lines, matches real max-w breakpoints */}
        <div className="w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75">
          <Skeleton
            className="h-7 sm:h-9 md:h-12 lg:h-16 xl:h-20 2xl:h-25 w-5/6 mb-3"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          />
          <Skeleton
            className="h-7 sm:h-9 md:h-12 lg:h-16 xl:h-20 2xl:h-25 w-3/5"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          />
        </div>

        {/* Description — 2 lines */}
        <div className="w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75">
          <Skeleton
            className="h-3.5 sm:h-4 md:h-5 lg:h-6 xl:h-7 2xl:h-8 w-5/6 mb-2"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          />
          <Skeleton
            className="h-3.5 sm:h-4 md:h-5 lg:h-6 xl:h-7 2xl:h-8 w-2/3"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          />
        </div>
      </div>
    </div>
  </>
);

const PageBannerSection = ({
  data,
  bannerData,
  pageBannerSection,
  loading = false,               // ← NEW
  bgColor = '',
  height = 'h-56 sm:h-64 md:h-80 lg:h-96 xl:h-110 2xl:h-120',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'page-banner',
}) => {
  const [imageError, setImageError] = useState(false);

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="w-full flex justify-center overflow-hidden">
        <section
          id={sectionId}
          className={`relative w-[1920px] max-w-full ${height} overflow-hidden ${bgColor} ${sectionClassName}`}
        >
          <PageBannerSkeleton paddingX={paddingX} paddingY={paddingY} />
        </section>
      </div>
    );
  }

  // ============================================
  // RESOLVE DATA
  // ============================================
  let resolvedData = data || bannerData || pageBannerSection;

  if (resolvedData?.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  const { background = {}, overlay = {}, content = {} } = resolvedData || {};

  const title = content.title || {};
  const description = content.description || {};

  const hasTitle = hasValue(title.text);
  const hasDescription = hasValue(description.text);
  const hasBackground = hasValue(background.src);

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const usePlaceholder = !hasBackground || imageError;
  const imageSrc = usePlaceholder
    ? getPlaceholderImage(1920, 600, title.text || 'Page Banner')
    : background.src;
  const imageAlt =
    background.alt ||
    (title.text ? `${title.text} - Banner` : 'Page banner background');

  const handleImageError = () => setImageError(true);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="w-full flex justify-center overflow-hidden">
      <section
        id={sectionId}
        className={`relative w-[1920px] max-w-full ${height} overflow-hidden ${bgColor} ${sectionClassName}`}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover object-center"
          onError={handleImageError}
        />

        {hasValue(overlay.darkOverlay) && (
          <div className={`absolute inset-0 ${overlay.darkOverlay}`} />
        )}
        {hasValue(overlay.gradient) && (
          <div className={`absolute inset-0 ${overlay.gradient}`} />
        )}
        <div className="absolute inset-0 bg-black/40 sm:bg-black/30 md:bg-black/20 lg:bg-black/10" />

        {(hasTitle || hasDescription) && (
          <div className={`absolute left-0 inset-0 flex items-center ${paddingX} ${paddingY}`}>
            <div className="w-full text-white space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
              {hasTitle && (
                <h1
                  className={`bricolage-grotesque font-bold leading-tight text-[28px] sm:text-[36px] md:text-[48px] lg:text-[64px] xl:text-[80px] 2xl:text-[100px] text-center md:text-left w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75 ${title.className || ''}`}
                >
                  {title.text}
                </h1>
              )}
              {hasDescription && (
                <p
                  className={`bricolage-grotesque font-normal text-[13px] sm:text-[15px] md:text-[18px] lg:text-[22px] xl:text-[28px] 2xl:text-[30px] leading-tight text-center md:text-left text-white w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75 line-clamp-3 md:line-clamp-none ${description.className || ''}`}
                >
                  {description.text}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default PageBannerSection;