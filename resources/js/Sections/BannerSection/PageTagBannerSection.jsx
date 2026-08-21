// js/Sections/BannerSection/PageTagBannerSection.jsx

// React
import React, { useState } from 'react';

// Utility function
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Generate placeholder image URL
const getPlaceholderImage = (width = 1920, height = 600, text = 'Gallery Banner') => {
  return `https://via.placeholder.com/${width}x${height}/1a1a2e/FFFFFF?text=${encodeURIComponent(text)}`;
};

/**
 * PageTagBannerSection Component
 * Extends Page Banner with tag functionality
 * 
 * @param {Object} props
 * @param {Object} props.data - Banner data from API (from DynamicSectionRenderer)
 * @param {Object} props.bannerData - Banner data from API (direct prop)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.height - Height classes (default: 'h-64 sm:h-80 md:h-100 lg:h-120 xl:h-135 2xl:h-147.25')
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'page-tag-banner')
 * @param {Array} props.tags - Array of tag objects { label, color } or strings
 * @param {string} props.activeTag - Currently active tag
 * @param {string} props.tagTitle - Title override for the banner
 * 
 * @returns {JSX.Element} Rendered page tag banner section
 */
const PageTagBannerSection = ({
  data,
  bannerData,
  bgColor = '',
  height = 'h-64 sm:h-80 md:h-100 lg:h-120 xl:h-135 2xl:h-147.25',
  paddingY = '',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'page-tag-banner',
  tags = [],
  activeTag = '',
  tagTitle = '',
}) => {
  // ============================================
  // HOOKS MUST BE CALLED AT THE TOP LEVEL
  // ============================================
  const [imageError, setImageError] = useState(false);

  // ============================================
  // RESOLVE DATA
  // ============================================
  let resolvedData = data || bannerData;

  if (!hasValue(resolvedData)) {
    return null;
  }

  // Check if data is wrapped
  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  // ============================================
  // SAFE DESTRUCTURING WITH FALLBACKS
  // ============================================
  const {
    background = {},
    overlay = {},
    content = {},
  } = resolvedData;

  const title = content.title || {};

  // ============================================
  // EXTRACT TAG DATA
  // ============================================
  const galleryTags = tags.length > 0 ? tags : (resolvedData.tags || []);
  const galleryActiveTag = activeTag || resolvedData.activeTag || (galleryTags[0]?.label || galleryTags[0] || '');
  const galleryTitle = tagTitle || resolvedData.tagTitle || title.text || 'Photo Gallery';

  // ============================================
  // DOT COLORS - FALLBACK COLORS
  // ============================================
  const defaultColors = [
    '#009BE2', '#FF6B6B', '#4ECDC4', '#FFE66D', '#6C5CE7',
    '#FD79A8', '#00B894', '#FDCB6E', '#E17055', '#0984E3',
    '#A29BFE', '#55EFC4', '#F8A5C2', '#74B9FF', '#FF7675'
  ];

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasTitle = hasValue(galleryTitle);
  const hasBackground = hasValue(background.src);
  const hasOverlays = hasValue(overlay.darkOverlay) || hasValue(overlay.gradient);
  const hasTags = galleryTags.length > 0;

  const hasAnyContent = hasTitle || hasBackground || hasOverlays || hasTags;

  if (!hasAnyContent) {
    return null;
  }

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const usePlaceholder = !hasBackground || imageError;
  const imageSrc = usePlaceholder
    ? getPlaceholderImage(1920, 600, galleryTitle)
    : background.src;
  const imageAlt = background.alt || (galleryTitle ? `${galleryTitle} - Banner` : 'Gallery banner background');

  const handleImageError = () => {
    setImageError(true);
  };

  // ============================================
  // HELPER: Extract hex color from various formats
  // ============================================
  const extractColorValue = (color) => {
    if (!color) return null;

    // If it's already a hex color (starts with #)
    if (typeof color === 'string' && color.startsWith('#')) {
      return color;
    }

    // If it's a Tailwind class like "bg-[#FDCB6E]"
    if (typeof color === 'string' && color.includes('bg-[')) {
      const match = color.match(/bg-\[(#[^\]]+)\]/);
      if (match) {
        return match[1];
      }
    }

    // If it's a Tailwind class like "bg-[#FDCB6E]" with other text
    if (typeof color === 'string') {
      const match = color.match(/#[0-9a-fA-F]{6}/);
      if (match) {
        return match[0];
      }
    }

    // If it's a color name or other format, return as-is
    return color;
  };

  // ============================================
  // RENDER TAGS - OPTIMIZED
  // ============================================
  const renderTags = () => {
    if (!hasTags) return null;

    return (
      <div className="pt-3 sm:pt-4 md:pt-5 max-w-232.5 flex flex-wrap gap-2 sm:gap-3 md:gap-4">
        {galleryTags.map((tag, index) => {
          // Handle both string and object formats
          const tagLabel = typeof tag === 'string' ? tag : tag.label;
          const rawColor = typeof tag === 'object' && tag.color
            ? tag.color
            : defaultColors[index % defaultColors.length];
          const tagColor = extractColorValue(rawColor) || defaultColors[index % defaultColors.length];
          const isActive = tagLabel === galleryActiveTag;

          return (
            <button
              key={index}
              className={`
                group flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4.5 md:px-5.5 py-1.5 sm:py-2 md:py-2.75 rounded-lg font-semibold text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px]
                transition-all duration-300 cursor-pointer
                ${isActive
                  ? 'bg-[#009BE2] text-white hover:bg-[#0080C4]'
                  : 'bg-white/90 text-black hover:bg-[#009BE2] hover:text-white'
                }
                shadow-md hover:shadow-lg
              `}
            >
              <span
                className={`
                  w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 shrink-0
                  ${isActive ? 'bg-white' : ''}
                  group-hover:bg-white
                `}
                style={!isActive ? { backgroundColor: tagColor } : { backgroundColor: tagColor }}
              />
              <span>{tagLabel}</span>
            </button>
          );
        })}
      </div>
    );
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
        className="w-full h-full object-cover object-center"
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

      {/* Responsive overlay for text readability */}
      <div className="absolute inset-0 bg-black/30 sm:bg-black/20 md:bg-black/10 lg:bg-black/5" />

      {/* Content */}
      <div className="absolute left-0 inset-0 flex items-center p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12.5">
        <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 xl:px-20 text-white space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
          {/* Title */}
          {hasTitle && (
            <h1 className="bricolage-grotesque font-bold leading-tight text-[28px] sm:text-[36px] md:text-[48px] lg:text-[64px] xl:text-[80px] 2xl:text-[100px] text-center md:text-left w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75">
              {galleryTitle}
            </h1>
          )}

          {/* Tags */}
          {renderTags()}
        </div>
      </div>
    </section>
  );
};

export default PageTagBannerSection;