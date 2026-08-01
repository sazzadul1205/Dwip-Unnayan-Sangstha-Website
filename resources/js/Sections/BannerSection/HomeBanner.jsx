// js/Sections/BannerSection/HomeBanner.jsx

// React
import React, { useState } from 'react';

// Arrow Icon
import ArrowIcon from '../../Shared/ArrowIcon';

// Utility function for consistent value checking
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Generate placeholder image URL
const getPlaceholderImage = (width = 1920, height = 600, text = 'Welcome') => {
  return `https://via.placeholder.com/${width}x${height}/1a1a2e/FFFFFF?text=${encodeURIComponent(text)}`;
};

/**
 * HomeBanner Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Banner data from API (from DynamicSectionRenderer)
 * @param {Object} props.bannerData - Banner data from API (direct prop)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.height - Height classes (default: 'h-125 md:h-250')
 * @param {string} props.sectionClassName - Additional CSS classes
 * 
 * @returns {JSX.Element} Rendered home banner
 */
const HomeBanner = ({
  data,
  bannerData,
  bgColor = '',
  height = 'h-125 md:h-250',
  sectionClassName = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Use data prop if available, fallback to bannerData
  let resolvedData = data || bannerData;

  // EARLY RETURN - No data
  if (!hasValue(resolvedData)) {
    return null;
  }

  // EARLY RETURN - Data is not an object
  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  // DESTRUCTURE DATA WITH FALLBACKS
  const {
    background = {},
    overlay = {},
    content = {},
    buttons = []
  } = resolvedData;

  // CHECK FOR CONTENT
  const hasAnyContent = hasValue(content.tagline?.text) ||
    hasValue(content.title?.text) ||
    hasValue(content.description?.text) ||
    hasValue(buttons);

  // IMAGE HANDLING
  const hasBackground = hasValue(background.src);

  // Determine if we should use placeholder
  const usePlaceholder = !hasBackground || imageError;

  // Get image source
  const imageSrc = usePlaceholder
    ? getPlaceholderImage(1920, 600, content.title?.text || 'Welcome')
    : background.src;

  // Get image alt text
  const imageAlt = background.alt || (content.title?.text ? `${content.title.text} - Banner` : 'Home banner background');

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="w-full flex justify-center overflow-hidden">
      <section
        id="banner"
        className={`relative w-[1920px] max-w-full ${height} overflow-hidden ${bgColor} ${sectionClassName}`}
      >
        {/* BACKGROUND IMAGE */}
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover object-center md:object-cover"
          onError={handleImageError}
        />

        {/*  OVERLAYS */}
        {/* Dark overlay (e.g., 'bg-black/50') */}
        {hasValue(overlay.darkOverlay) && (
          <div className={`absolute inset-0 ${overlay.darkOverlay}`} />
        )}

        {/* Gradient overlay (e.g., 'bg-gradient-to-r from-black/80 to-transparent') */}
        {hasValue(overlay.gradient) && (
          <div className={`absolute inset-0 ${overlay.gradient}`} />
        )}

        {/* Mobile-only overlay - ensures text readability on small screens */}
        <div className="absolute inset-0 bg-black/40 md:hidden" />

        {/* CONTENT */}
        {hasAnyContent && (
          <div className="absolute left-0 md:left-5 inset-0 flex items-center p-5 md:p-12.5">
            <div className="w-full px-4 md:px-20 text-white space-y-3 md:space-y-5">

              {/* Tagline - small text above title */}
              {hasValue(content.tagline?.text) && (
                <p className={`bricolage-grotesque ${content.tagline.className || ''} text-white text-center md:text-left text-sm md:text-[30px] tracking-[2px] md:tracking-[4px]`}>
                  {content.tagline.text}
                </p>
              )}

              {/* Title - main heading */}
              {hasValue(content.title?.text) && (
                <h1 className="bricolage-grotesque font-bold leading-tight text-[32px] md:text-[100px] text-center md:text-left w-full md:w-215.75">
                  {content.title.text}
                </h1>
              )}

              {/* Description - supporting text */}
              {hasValue(content.description?.text) && (
                <p className="bricolage-grotesque font-normal text-[14px] md:text-[30px] leading-tight text-center md:text-left text-white w-full md:w-215.75 line-clamp-3 md:line-clamp-none">
                  {content.description.text}
                </p>
              )}

              {/* CTA Buttons */}
              {hasValue(buttons) && (
                <div className='flex flex-col sm:flex-row items-center gap-3 md:gap-6 pt-5 md:pt-7.5'>
                  {buttons.map((button) => (
                    <button
                      key={button.id || Math.random()}
                      onClick={() => {
                        if (button.link) {
                          window.location.href = button.link;
                        }
                      }}
                      className={`capitalize font-600 text-[14px] md:text-[18px] px-5 md:px-7.5 py-3 md:py-5 bricolage-grotesque rounded-md inline-flex items-center justify-center gap-2 md:gap-3 group transition-all duration-300 w-full sm:w-auto ${button.className || ''}`}
                    >
                      <span>{button.text}</span>
                      {/* Arrow icon - only shown if icon: true */}
                      {button.icon && (
                        <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 w-4 h-4 md:w-5 md:h-5" />
                      )}
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeBanner;