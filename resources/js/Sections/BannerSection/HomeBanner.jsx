// resources/js/Sections/BannerSection/HomeBanner.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ArrowIcon from '../../Shared/ArrowIcon';
import { Skeleton } from '../../Shared/Skeletons/SkeletonPrimitives';
import ImagePreloader from '../../Shared/ImagePreloader';
import { useImagePreload } from '../../hooks/useImagePreloader';

import { hasValue, getPlaceholderImage } from '../../utils/sectionHelpers';

const MAX_SLIDES = 10;
const MAX_BUTTONS = 2;
const DEFAULT_INTERVAL = 5000;



const EMPTY_CONTENT = {
  tagline: { text: '', className: 'uppercase tracking-[4px] font-semibold' },
  title: { text: '', className: 'font-bold leading-tight' },
  description: { text: '', className: 'font-normal leading-tight' },
};

const HomeBannerSkeleton = ({ paddingX, paddingY, showDots = true }) => (
  <>
    <Skeleton className="w-full h-full absolute inset-0" rounded="rounded-none" style={{ background: 'rgba(255,255,255,0.08)' }} />
    <div className="absolute inset-0 bg-black/40 sm:bg-black/30 md:bg-black/20 lg:bg-black/10" />
    <div className={`absolute inset-0 flex items-center ${paddingX} ${paddingY}`}>
      <div className="w-full text-white space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
        <div className="flex justify-center md:justify-start">
          <Skeleton className="h-3 sm:h-4 md:h-5 lg:h-6 xl:h-7 2xl:h-8 w-32 sm:w-40 md:w-52 lg:w-64 rounded-md" style={{ background: 'rgba(255,255,255,0.25)' }} />
        </div>
        <div className="w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75 mx-auto md:mx-0">
          <Skeleton className="h-7 sm:h-9 md:h-12 lg:h-16 xl:h-20 2xl:h-25 w-5/6 mb-3 mx-auto md:mx-0" style={{ background: 'rgba(255,255,255,0.25)' }} />
          <Skeleton className="h-7 sm:h-9 md:h-12 lg:h-16 xl:h-20 2xl:h-25 w-3/5 mx-auto md:mx-0" style={{ background: 'rgba(255,255,255,0.25)' }} />
        </div>
        <div className="w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75 mx-auto md:mx-0">
          <Skeleton className="h-3.5 sm:h-4 md:h-5 lg:h-6 xl:h-7 2xl:h-8 w-5/6 mb-2 mx-auto md:mx-0" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <Skeleton className="h-3.5 sm:h-4 md:h-5 lg:h-6 xl:h-7 2xl:h-8 w-2/3 mx-auto md:mx-0" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 pt-3 sm:pt-4 md:pt-5 lg:pt-6 xl:pt-7.5">
          <Skeleton className="h-11 sm:h-12 md:h-13 lg:h-14 xl:h-15 w-full sm:w-36 md:w-40 lg:w-44 rounded-md" style={{ background: 'rgba(0,155,226,0.85)' }} />
          <Skeleton className="h-11 sm:h-12 md:h-13 lg:h-14 xl:h-15 w-full sm:w-36 md:w-40 lg:w-44 rounded-md" style={{ background: 'rgba(255,255,255,0.9)' }} />
        </div>
      </div>
    </div>
    {showDots && (
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10 left-1/2 transform -translate-x-1/2 z-10 flex gap-1.5 sm:gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={`dot-skeleton-${i}`} className={i === 0 ? 'w-8 sm:w-10 h-2 sm:h-2.5 rounded-full' : 'w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full'} style={{ background: 'rgba(255,255,255,0.5)' }} />
        ))}
      </div>
    )}
  </>
);

const HomeBanner = ({
  data,
  bannerData,
  loading = false,
  bgColor = '',
  height = 'h-100 sm:h-80 md:h-100 lg:h-150 xl:h-200 2xl:h-250',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  slideInterval: slideIntervalProp,
}) => {
  let resolvedData = data || bannerData;
  if (resolvedData?.data && typeof resolvedData.data === 'object') resolvedData = resolvedData.data;

  const slides = useMemo(() => {
    const list = Array.isArray(resolvedData?.slides) ? resolvedData.slides : [];
    return list.slice(0, MAX_SLIDES).map((s, i) => ({
      id: s.id || `slide_${i}`,
      src: s.src || '',
      alt: s.alt || `Slide ${i + 1}`,
      overlay: { darkOverlay: s.overlay?.darkOverlay ?? '', gradient: s.overlay?.gradient ?? '' },
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

  // Preload all slide images (first one cached eagerly by the img itself)
  const slideUrls = useMemo(() => slides.map((s) => s.src).filter(Boolean), [slides]);
  useImagePreload(slideUrls);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (currentSlide >= slides.length) setCurrentSlide(0);
  }, [slides.length, currentSlide]);

  const goToSlide = useCallback(
    (index) => {
      if (slides.length === 0) return;
      setCurrentSlide(((index % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    if (!hasMultipleSlides || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, slideInterval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hasMultipleSlides, isPaused, slideInterval, slides.length]);

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  if (loading) {
    return (
      <div className="w-full flex justify-center overflow-hidden">
        <section id="banner" className={`relative w-full max-w-[1920px] ${height} overflow-hidden ${bgColor} ${sectionClassName}`}>
          <HomeBannerSkeleton paddingX={paddingX} paddingY={paddingY} />
        </section>
      </div>
    );
  }

  if (!hasValue(resolvedData) || slides.length === 0) return null;

  return (
    <div className="w-full flex justify-center overflow-hidden">
      <section
        id="banner"
        className={`relative w-full max-w-[1920px] ${height} overflow-hidden ${bgColor} ${sectionClassName}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute inset-0">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            const imageSrc = slide.src || getPlaceholderImage(1920, 600, slide.content?.title?.text || 'Welcome', '#1a1a2e', '#FFFFFF');
            const imageAlt = slide.alt || slide.content?.title?.text || `Slide ${index + 1}`;
            const primaryButton = slide.buttons[0] || null;
            const secondaryButton = slide.buttons[1] || null;

            return (
              <div
                key={slide.id || index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                aria-hidden={!isActive}
              >
                {/* ✅ ImagePreloader in place of raw <img> */}
                <ImagePreloader
                  src={imageSrc}
                  alt={imageAlt}
                  wrapperClassName="absolute inset-0 w-full h-full"
                  className="w-full h-full object-cover object-center"
                  skeletonClassName="bg-white/10"
                  eager={index === 0}
                  priority={index === 0}
                  draggable={false}
                />

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
                            onClick={() => { if (primaryButton.link) window.location.href = primaryButton.link; }}
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
                            onClick={() => { if (secondaryButton.link) window.location.href = secondaryButton.link; }}
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

        {hasMultipleSlides && (
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10 left-1/2 transform -translate-x-1/2 z-10 flex gap-1.5 sm:gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${index === currentSlide ? 'w-8 sm:w-10 h-2 sm:h-2.5 bg-[#009BE2]' : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80'}`}
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