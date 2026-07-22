// js/Sections/BannerSection/PageBannerSection.jsx

// React
import React, { useState } from 'react';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Generate placeholder image URL
const getPlaceholderImage = (width = 1920, height = 600, text = 'Banner') => {
  return `https://via.placeholder.com/${width}x${height}/1a1a2e/FFFFFF?text=${encodeURIComponent(text)}`;
};

/**
 * PageBannerSection Component
 */
const PageBannerSection = ({
  data,
  bannerData,
  pageBannerSection, // ← ADD THIS - the prop name from DynamicSectionRenderer
  bgColor = '',
  height = 'h-64 md:h-80 lg:h-96',
  paddingY = '',
  paddingX = '',
  sectionClassName = '',
  sectionId = 'page-banner',
}) => {
  // ============================================
  // HOOKS MUST BE CALLED AT THE TOP LEVEL
  // ============================================
  const [imageError, setImageError] = useState(false);

  // ============================================
  // RESOLVE DATA - Check all possible prop names
  // ============================================
  let resolvedData = data || bannerData || pageBannerSection;

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  // Check if the data is wrapped in a 'data' property
  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  // ============================================
  // SAFE DESTRUCTURING WITH DEFAULTS
  // ============================================
  const {
    background = {},
    overlay = {},
    content = {},
  } = resolvedData;

  const title = content.title || {};
  const description = content.description || {};

  // ============================================
  // CHECK FOR CONTENT - DECLARE ALL VARIABLES FIRST
  // ============================================
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

  const imageAlt = background.alt || (title.text ? `${title.text} - Banner` : 'Page banner background');

  const handleImageError = () => {
    setImageError(true);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`relative w-full ${height} overflow-hidden ${bgColor} ${paddingY} ${paddingX} ${sectionClassName}`}
    >
      {/* Background Image */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-full h-full object-cover object-center md:object-cover"
        onError={handleImageError}
      />

      {/* Dark Overlay */}
      {hasValue(overlay.darkOverlay) && (
        <div className={`absolute inset-0 ${overlay.darkOverlay}`} />
      )}

      {/* Left Dark Gradient */}
      {hasValue(overlay.gradient) && (
        <div className={`absolute inset-0 ${overlay.gradient}`} />
      )}

      {/* Additional overlay for mobile */}
      <div className="absolute inset-0 bg-black/40 md:hidden" />

      {/* Content */}
      {(hasTitle || hasDescription) && (
        <div className="absolute left-0 md:left-10 inset-0 flex items-center p-5 md:p-12.5">
          <div className="w-full px-4 md:px-20 text-white space-y-3 md:space-y-5">
            {hasTitle && (
              <h1 className={`bricolage-grotesque font-bold leading-tight text-[32px] md:text-[100px] text-center md:text-left w-full md:w-215.75 ${title.className || ''}`}>
                {title.text}
              </h1>
            )}

            {hasDescription && (
              <p className={`bricolage-grotesque font-normal text-[14px] md:text-[30px] leading-tight text-center md:text-left text-white w-full md:w-215.75 line-clamp-3 md:line-clamp-none ${description.className || ''}`}>
                {description.text}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default PageBannerSection;