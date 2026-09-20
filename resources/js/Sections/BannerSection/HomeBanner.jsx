// resources/js/Sections/BannerSection/HomeBanner.jsx

// React
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Arrow Icon
import ArrowIcon from '../../Shared/ArrowIcon';

const MAX_SLIDES = 10;
const MAX_BUTTONS = 2;
const DEFAULT_INTERVAL = 5000;

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

const getPlaceholderImage = (width = 1920, height = 600, text = 'Welcome') => {
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 12));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="50%" y="50%" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const EMPTY_CONTENT = {
  tagline: { text: '', className: 'uppercase tracking-[4px] font-semibold' },
  title: { text: '', className: 'font-bold leading-tight' },
  description: { text: '', className: 'font-normal leading-tight' },
};

/**
 * HomeBanner — full carousel.
 * Expected data shape:
 *   {
 *     slideInterval: number,   // ms
 *     slides: [
 *       {
 *         id, src, alt,
 *         overlay: { darkOverlay, gradient },
 *         content: { tagline{text,className}, title{...}, description{...} },
 *         buttons: [{ text, link, icon, className }, ...max 2]
 *       }, ...max 10
 *     ]
 *   }
 */
const HomeBanner = ({
  data,
  bannerData,
  bgColor = '',
  height = 'h-100 sm:h-80 md:h-100 lg:h-150 xl:h-200 2xl:h-250',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  slideInterval: slideIntervalProp,
}) => {
  
  // ===== RESOLVE DATA =====
  let resolvedData = data || bannerData;
  if (resolvedData?.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  const slides = useMemo(() => {
    const list = Array.isArray(resolvedData?.slides) ? resolvedData.slides : [];
    return list.slice(0, MAX_SLIDES).map((s, i) => ({
      id: s.id || `slide_${i}`,
      src: s.src || '',
      alt: s.alt || `Slide ${i + 1}`,
      overlay: {
        darkOverlay: s.overlay?.darkOverlay ?? '',
        gradient: s.overlay?.gradient ?? '',
      },
      content: {
        tagline: { ...EMPTY_CONTENT.tagline, ...(s.content?.tagline || {}) },
        title: { ...EMPTY_CONTENT.title, ...(s.content?.title || {}) },
        description: { ...EMPTY_CONTENT.description, ...(s.content?.description || {}) },
      },
      buttons: Array.isArray(s.buttons) ? s.buttons.slice(0, MAX_BUTTONS) : [],
    }));
  }, [resolvedData]);

  const slideInterval = useMemo(() => {
    const candidate = slideIntervalProp ?? resolvedData?.slideInterval ?? DEFAULT_INTERVAL;
    const num = Number(candidate);
    return Number.isFinite(num) && num > 0 ? num : DEFAULT_INTERVAL;
  }, [slideIntervalProp, resolvedData?.slideInterval]);

  const hasMultipleSlides = slides.length > 1;

  // ===== HOOKS =====
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (currentSlide >= slides.length) setCurrentSlide(0);
  }, [slides.length, currentSlide]);

  const goToSlide = useCallback((index) => {
    if (slides.length === 0) return;
    setCurrentSlide(((index % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!hasMultipleSlides || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, slideInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasMultipleSlides, isPaused, slideInterval, slides.length]);

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  if (!hasValue(resolvedData) || slides.length === 0) {
    return null;
  }

  // ===== RENDER =====
  return (
    <div className="w-full flex justify-center overflow-hidden">
      <section
        id="banner"
        className={`relative w-full max-w-[1920px] ${height} overflow-hidden ${bgColor} ${sectionClassName}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* SLIDES LAYER */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            const imageSrc = slide.src || getPlaceholderImage(1920, 600, slide.content?.title?.text || 'Welcome');
            const imageAlt = slide.alt || slide.content?.title?.text || `Slide ${index + 1}`;
            const primaryButton = slide.buttons[0] || null;
            const secondaryButton = slide.buttons[1] || null;

            return (
              <div
                key={slide.id || index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                aria-hidden={!isActive}
              >
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="w-full h-full object-cover object-center"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                </div>

                {hasValue(slide.overlay?.darkOverlay) && (
                  <div className={`absolute inset-0 ${slide.overlay.darkOverlay}`} />
                )}
                {hasValue(slide.overlay?.gradient) && (
                  <div className={`absolute inset-0 ${slide.overlay.gradient}`} />
                )}

                <div className="absolute inset-0 bg-black/40 sm:bg-black/30 md:bg-black/20 lg:bg-black/10" />

                <div className={`absolute inset-0 flex items-center ${paddingX} ${paddingY}`}>
                  <div className="w-full text-white space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
                    {hasValue(slide.content?.tagline?.text) && (
                      <p className={`bricolage-grotesque ${slide.content.tagline.className || ''} text-white text-center md:text-left text-[12px] sm:text-[14px] md:text-[18px] lg:text-[24px] xl:text-[30px] tracking-[1px] sm:tracking-[2px] md:tracking-[3px] lg:tracking-[4px]`}>
                        {slide.content.tagline.text}
                      </p>
                    )}

                    {hasValue(slide.content?.title?.text) && (
                      <h1 className="bricolage-grotesque font-bold leading-tight text-[28px] sm:text-[36px] md:text-[48px] lg:text-[64px] xl:text-[80px] 2xl:text-[100px] text-center md:text-left w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75">
                        {slide.content.title.text}
                      </h1>
                    )}

                    {hasValue(slide.content?.description?.text) && (
                      <p className="bricolage-grotesque font-normal text-[13px] sm:text-[15px] md:text-[18px] lg:text-[22px] xl:text-[28px] 2xl:text-[30px] leading-tight text-center md:text-left text-white w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75 line-clamp-3 md:line-clamp-none">
                        {slide.content.description.text}
                      </p>
                    )}

                    {(primaryButton || secondaryButton) && (
                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 pt-3 sm:pt-4 md:pt-5 lg:pt-6 xl:pt-7.5">
                        {primaryButton && (
                          <button
                            type="button"
                            onClick={() => {
                              if (primaryButton.link) window.location.href = primaryButton.link;
                            }}
                            className={`capitalize font-600 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] px-4 sm:px-5 md:px-6 lg:px-7 xl:px-7.5 py-2.5 sm:py-3 md:py-3.5 lg:py-4 xl:py-5 bricolage-grotesque rounded-md inline-flex items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 group transition-all duration-300 w-full sm:w-auto bg-[#009BE2] text-white hover:bg-[#009BE2]/90 shadow-md hover:shadow-lg ${primaryButton.className || ''}`}
                          >
                            <span>{primaryButton.text}</span>
                            {primaryButton.icon && (
                              <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
                            )}
                          </button>
                        )}

                        {secondaryButton && (
                          <button
                            type="button"
                            onClick={() => {
                              if (secondaryButton.link) window.location.href = secondaryButton.link;
                            }}
                            className={`capitalize font-600 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] px-4 sm:px-5 md:px-6 lg:px-7 xl:px-7.5 py-2.5 sm:py-3 md:py-3.5 lg:py-4 xl:py-5 bricolage-grotesque rounded-md inline-flex items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 group transition-all duration-300 w-full sm:w-auto bg-white/90 lg:bg-white text-black hover:bg-white shadow-md hover:shadow-lg ${secondaryButton.className || ''}`}
                          >
                            <span>{secondaryButton.text}</span>
                            {secondaryButton.icon && (
                              <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DOTS */}
        {hasMultipleSlides && (
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${index === currentSlide
                    ? 'w-8 sm:w-10 h-2 sm:h-2.5 bg-[#009BE2]'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeBanner;