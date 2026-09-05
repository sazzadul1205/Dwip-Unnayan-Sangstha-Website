// js/Sections/BannerSection/HomeBanner.jsx

// React
import React, { useState, useEffect, useRef, useCallback } from 'react';

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

// Generate placeholder image URL (inline SVG — avoids external placeholder services)
const getPlaceholderImage = (width = 1920, height = 600, text = 'Welcome') => {
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 12));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="50%" y="50%" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * HomeBanner Component with Auto-Slider
 * 
 * @param {Object} props
 * @param {Object} props.data - Banner data from API (from DynamicSectionRenderer)
 * @param {Object} props.bannerData - Banner data from API (direct prop)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.height - Height classes (default: 'h-64 sm:h-80 md:h-100 lg:h-150 xl:h-200 2xl:h-250')
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {number} props.slideInterval - Auto-slide interval in milliseconds (default: 5000)
 * 
 * @returns {JSX.Element} Rendered home banner with auto-slider
 */
const HomeBanner = ({
  data,
  bannerData,
  bgColor = '',
  height = 'h-100 sm:h-80 md:h-100 lg:h-150 xl:h-200 2xl:h-250',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  slideInterval = 5000,
}) => {
  // ============================================
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL
  // BEFORE ANY CONDITIONAL RETURNS
  // ============================================
  
  // State hooks
  const [imageError, setImageError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);

  // ============================================
  // RESOLVE DATA (before hooks that depend on it)
  // ============================================
  let resolvedData = data || bannerData;

  // If data has a nested 'data' property, use that
  if (resolvedData?.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  // ============================================
  // DESTRUCTURE DATA WITH FALLBACKS
  // ============================================
  const {
    background = {},
    overlay = {},
    content = {},
    buttons = []
  } = resolvedData || {};

  // Extract slides from background - support both single image and multiple slides
  let slides = [];

  if (Array.isArray(background.src)) {
    // Multiple slides
    slides = background.src.map((src, index) => ({
      src,
      alt: Array.isArray(background.alt) ? background.alt[index] : background.alt || `Slide ${index + 1}`,
    }));
  } else if (hasValue(background.src)) {
    // Single slide
    slides = [{
      src: background.src,
      alt: background.alt || 'Banner image',
    }];
  }

  // If no slides, use placeholder
  if (slides.length === 0) {
    slides = [{
      src: getPlaceholderImage(1920, 600, content?.title?.text || 'Welcome'),
      alt: 'Placeholder banner',
    }];
  }

  // Check if we have multiple slides
  const hasMultipleSlides = slides.length > 1;

  // ============================================
  // CALLBACKS AND EFFECTS (HOOKS)
  // ============================================

  // Handle slide change
  const goToSlide = useCallback((index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  // Go to next slide
  const goToNextSlide = useCallback(() => {
    if (!hasMultipleSlides) return;
    const nextIndex = (currentSlide + 1) % slides.length;
    goToSlide(nextIndex);
  }, [currentSlide, goToSlide, hasMultipleSlides, slides.length]);

  // Auto-slide timer effect
  useEffect(() => {
    if (!hasMultipleSlides) return;

    timerRef.current = setInterval(goToNextSlide, slideInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [goToNextSlide, hasMultipleSlides, slideInterval]);

  // Pause auto-slide on hover
  const handleMouseEnter = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hasMultipleSlides) {
      timerRef.current = setInterval(goToNextSlide, slideInterval);
    }
  }, [goToNextSlide, hasMultipleSlides, slideInterval]);

  // Handle image error for current slide
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // ============================================
  // EARLY RETURNS (NOW AFTER ALL HOOKS)
  // ============================================

  // EARLY RETURN - No data
  if (!hasValue(resolvedData)) {
    return null;
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Get current slide data
  const currentSlideData = slides[currentSlide] || slides[0];
  const imageSrc = imageError ? getPlaceholderImage(1920, 600, content?.title?.text || 'Welcome') : currentSlideData.src;
  const imageAlt = currentSlideData.alt || (content?.title?.text ? `${content.title.text} - Banner` : 'Home banner background');

  // Extract the first button (only use one button)
  const primaryButton = hasValue(buttons) && buttons.length > 0 ? buttons[0] : null;

  // Extract overlay settings
  const overlayConfig = overlay || {};

  // CHECK FOR CONTENT
  const hasAnyContent = hasValue(content?.tagline?.text) ||
    hasValue(content?.title?.text) ||
    hasValue(content?.description?.text) ||
    hasValue(buttons);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full flex justify-center overflow-hidden">
      <section
        id="banner"
        className={`relative w-[1920px] max-w-full ${height} overflow-hidden ${bgColor} ${sectionClassName}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* BACKGROUND IMAGE with fade transition */}
        <div className="absolute inset-0 w-full h-full">
          <img
            key={currentSlide}
            src={imageSrc}
            alt={imageAlt}
            className={`w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${isTransitioning ? 'opacity-80' : 'opacity-100'}`}
            onError={handleImageError}
          />
        </div>

        {/* OVERLAYS */}
        {/* Dark overlay */}
        {hasValue(overlayConfig.darkOverlay) && (
          <div className={`absolute inset-0 ${overlayConfig.darkOverlay}`} />
        )}

        {/* Gradient overlay */}
        {hasValue(overlayConfig.gradient) && (
          <div className={`absolute inset-0 ${overlayConfig.gradient}`} />
        )}

        {/* Responsive overlay - ensures text readability on all screens */}
        <div className="absolute inset-0 bg-black/40 sm:bg-black/30 md:bg-black/20 lg:bg-black/10" />

        {/* SLIDER DOTS - Only show if multiple slides */}
        {hasMultipleSlides && (
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'w-8 sm:w-10 h-2 sm:h-2.5 bg-[#009BE2]'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* CONTENT */}
        {hasAnyContent && (
          <div className={`absolute left-0 inset-0 flex items-center ${paddingX} ${paddingY}`}>
            <div className="w-full text-white space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
              {/* Tagline - small text above title */}
              {hasValue(content?.tagline?.text) && (
                <p className={`bricolage-grotesque ${content.tagline.className || ''} text-white text-center md:text-left text-[12px] sm:text-[14px] md:text-[18px] lg:text-[24px] xl:text-[30px] tracking-[1px] sm:tracking-[2px] md:tracking-[3px] lg:tracking-[4px]`}>
                  {content.tagline.text}
                </p>
              )}

              {/* Title - main heading */}
              {hasValue(content?.title?.text) && (
                <h1 className="bricolage-grotesque font-bold leading-tight text-[28px] sm:text-[36px] md:text-[48px] lg:text-[64px] xl:text-[80px] 2xl:text-[100px] text-center md:text-left w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75">
                  {content.title.text}
                </h1>
              )}

              {/* Description - supporting text */}
              {hasValue(content?.description?.text) && (
                <p className="bricolage-grotesque font-normal text-[13px] sm:text-[15px] md:text-[18px] lg:text-[22px] xl:text-[28px] 2xl:text-[30px] leading-tight text-center md:text-left text-white w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75 line-clamp-3 md:line-clamp-none">
                  {content.description.text}
                </p>
              )}

              {/* SINGLE CTA BUTTON - Only show primary button */}
              {primaryButton && (
                <div className='flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 pt-3 sm:pt-4 md:pt-5 lg:pt-6 xl:pt-7.5'>
                  <button
                    onClick={() => {
                      if (primaryButton.link) {
                        window.location.href = primaryButton.link;
                      }
                    }}
                    className={`capitalize font-600 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] px-4 sm:px-5 md:px-6 lg:px-7 xl:px-7.5 py-2.5 sm:py-3 md:py-3.5 lg:py-4 xl:py-5 bricolage-grotesque rounded-md inline-flex items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 group transition-all duration-300 w-full sm:w-auto bg-[#009BE2] text-white hover:bg-[#009BE2]/90 shadow-md hover:shadow-lg ${primaryButton.className || ''}`}
                  >
                    <span>{primaryButton.text}</span>
                    {/* Arrow icon - only shown if icon: true */}
                    {primaryButton.icon && (
                      <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
                    )}
                  </button>
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