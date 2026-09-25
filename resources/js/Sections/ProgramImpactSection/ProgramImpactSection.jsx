// js/Sections/ProgramImpactSection/ProgramImpactSection.jsx

// React
import React, { useState } from 'react';

// Skeleton primitives
import { Skeleton } from '../../Shared/Skeletons/SkeletonPrimitives';

import { hasValue, getPlaceholderImage } from '../../utils/sectionHelpers';



// ============================================
// SKELETON: Full section
// ============================================
const ProgramImpactSkeleton = ({ sdgCount = 6 }) => (
  <>
    {/* Carousel block — matches real: pb-6 → xl:pb-15, rounded, tall image */}
    <div className="w-full flex flex-col items-center pb-6 sm:pb-8 md:pb-10 lg:pb-12 xl:pb-15">
      <div className="w-full">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl">
          <Skeleton className="w-full h-48 sm:h-60 md:h-80 lg:h-120 xl:h-150 2xl:h-186.25 rounded-xl sm:rounded-2xl" />
        </div>
      </div>
    </div>

    {/* Title */}
    <Skeleton className="h-5 sm:h-5.5 md:h-6 lg:h-6.5 xl:h-7 2xl:h-8 w-1/2 sm:w-1/3 mb-3 sm:mb-4 md:mb-5 lg:mb-6" />

    {/* SDG grid — matches real: 2 / 3 / 4 / 5 / 6 cols */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7">
      {Array.from({ length: sdgCount }).map((_, i) => (
        <Skeleton
          key={`sdg-skeleton-${i}`}
          className="w-full h-auto aspect-square rounded-lg"
        />
      ))}
    </div>
  </>
);

/**
 * ProgramImpactSection Component
 */
const ProgramImpactSection = ({
  data,
  impactData,
  loading = false,               // ← NEW
  skeletonSdgCount = 6,          // ← NEW
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'program-impact',
}) => {
  const [index, setIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <section
        id={sectionId}
        className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
      >
        <ProgramImpactSkeleton sdgCount={skeletonSdgCount} />
      </section>
    );
  }

  // ============================================
  // RESOLVE + NORMALIZE
  // ============================================
  let resolvedData = data || impactData;
  if (!hasValue(resolvedData)) return null;

  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  const { section = {}, sdgImages = [] } = resolvedData;
  const images = section?.mainImage?.images || [];

  const hasImages = hasValue(images);
  const hasTitle = hasValue(section.title);
  const hasSdgImages = hasValue(sdgImages);

  if (!hasImages && !hasTitle && !hasSdgImages) return null;

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const handleImageError = (imageId) => {
    setImageErrors((prev) => ({ ...prev, [imageId]: true }));
  };

  const getImageSrc = (image, defaultText = 'Impact') => {
    if (imageErrors[image.id]) {
      return getPlaceholderImage(800, 600, image.alt || defaultText);
    }
    if (hasValue(image.src)) return image.src;
    return getPlaceholderImage(800, 600, image.alt || defaultText);
  };

  const getCarouselImageSrc = (imageUrl, idx) => {
    if (imageErrors[`carousel-${idx}`]) {
      return getPlaceholderImage(1200, 800, `Impact slide ${idx + 1}`);
    }
    if (hasValue(imageUrl)) return imageUrl;
    return getPlaceholderImage(1200, 800, `Impact slide ${idx + 1}`);
  };

  const goToSlide = (i) => setIndex(i);

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {/* Carousel */}
      {hasImages && (
        <div className="w-full flex flex-col items-center pb-6 sm:pb-8 md:pb-10 lg:pb-12 xl:pb-15">
          <div className="w-full">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl group">
              {hasValue(images[index]) && (
                <img
                  src={getCarouselImageSrc(images[index], index)}
                  alt={`Impact slide ${index + 1}`}
                  className="w-full h-48 sm:h-60 md:h-80 lg:h-120 xl:h-150 2xl:h-186.25 object-cover transition-all duration-500 group-hover:scale-105"
                  onError={() => handleImageError({ id: `carousel-${index}` })}
                />
              )}

              {images.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${i === index
                          ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-white'
                          : 'w-2 sm:w-2.5 h-1.5 sm:h-2 bg-white/50 hover:bg-white/70'
                        }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      {hasTitle && (
        <h1 className="text-[#080C14] text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] xl:text-[26px] 2xl:text-[28px] font-600 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
          {section.title}
        </h1>
      )}

      {/* SDG Grid */}
      {hasSdgImages && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7">
          {sdgImages.map((image) => (
            <img
              key={image.id}
              src={getImageSrc(image, 'SDG')}
              alt={image.alt || 'SDG'}
              className="w-full h-auto object-cover rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => image.link && (window.location.href = image.link)}
              onError={() => handleImageError(image)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProgramImpactSection;