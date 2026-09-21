// js/Sections/HeroFigureSection/HeroFigureSection.jsx

// React
import React, { useState } from 'react';

// Components
import ArrowIcon from '../../Shared/ArrowIcon';

// Utils
import { hasValue, getPlaceholderImage, normalizeData, sanitizeHTML } from '../../utils/sectionHelpers';

// Skeleton primitives
import { Skeleton, SkeletonText } from '../../Shared/Skeletons/SkeletonPrimitives';

// ============================================
// SKELETON: Text block
// ============================================
const HeroTextSkeleton = () => (
  <div className="w-full lg:w-1/2 flex flex-col justify-between relative z-10">
    {/* Title */}
    <Skeleton className="h-8 sm:h-9 md:h-10 lg:h-11 xl:h-12 2xl:h-13 w-5/6 mb-2 sm:mb-3" />

    {/* HTML content — ~5 short lines */}
    <SkeletonText
      lines={5}
      lineClassName="h-3.5 sm:h-4 md:h-4.5 lg:h-5 xl:h-5.5"
      className="mb-4 sm:mb-5 md:mb-6"
    />

    {/* Button */}
    <Skeleton className="h-11 sm:h-12 lg:h-13 xl:h-14 w-36 sm:w-40 lg:w-44 rounded-md" />
  </div>
);

// ============================================
// SKELETON: Image block
// ============================================
const HeroImageSkeleton = () => (
  <div className="w-full lg:w-1/2 flex items-center mt-6 sm:mt-8 lg:mt-0 relative z-10">
    <Skeleton className="w-full h-full min-h-50 sm:min-h-62.5 md:min-h-75 lg:min-h-87.5 xl:min-h-100 2xl:min-h-112.5 rounded-2xl sm:rounded-3xl lg:rounded-4xl" />
  </div>
);

// ============================================
// SKELETON: Full section
// ============================================
const HeroFigureSkeleton = ({ isImageLeft = false }) => (
  <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-15 relative z-10">
    {isImageLeft ? (
      <>
        <HeroImageSkeleton />
        <HeroTextSkeleton />
      </>
    ) : (
      <>
        <HeroTextSkeleton />
        <HeroImageSkeleton />
      </>
    )}
  </div>
);

/**
 * HeroFigureSection Component
 */
const HeroFigureSection = ({
  data,
  heroData,
  loading = false,               // ← NEW
  sectionId = 'hero-figure',
  layout = 'text-left',
  bgColor = 'bg-white',
  bgImage = null,
  bgOverlay = null,
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
}) => {
  // ============================================
  // HOOKS
  // ============================================
  const [imageError, setImageError] = useState(false);

  const isImageLeft = layout === 'text-right';

  // ============================================
  // BACKGROUND STYLE (used in both loading + loaded)
  // ============================================
  const getBackgroundStyle = () => {
    if (hasValue(bgImage)) {
      return {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return {};
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <section
        id={sectionId}
        className={`relative ${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
        style={getBackgroundStyle()}
      >
        {hasValue(bgImage) && hasValue(bgOverlay) && (
          <div className={`absolute inset-0 ${bgOverlay}`} />
        )}
        <HeroFigureSkeleton isImageLeft={isImageLeft} />
      </section>
    );
  }

  // ============================================
  // RESOLVE DATA
  // ============================================
  let resolvedData = data || heroData;

  if (!hasValue(resolvedData)) {
    console.warn('HeroFigureSection: No data provided');
    return null;
  }

  resolvedData = normalizeData(resolvedData);

  const { section = {}, content = {}, image = {}, btn = {} } = resolvedData;

  const hasTitle = hasValue(section?.title);
  const hasContent = hasValue(content?.html);
  const hasButton = hasValue(btn?.text) && hasValue(btn?.link);
  const hasImage = hasValue(image?.src);

  const hasAnyContent = hasTitle || hasContent || hasButton || hasImage;
  if (!hasAnyContent) return null;

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const usePlaceholder = !hasImage || imageError;
  const imageSrc = usePlaceholder
    ? getPlaceholderImage(800, 600, section.title || 'Hero Image')
    : image.src;
  const imageAlt = image.alt || section.title || 'Section image';

  const handleImageError = () => setImageError(true);

  // ============================================
  // HELPERS
  // ============================================
  const renderHTML = (htmlString) => {
    const sanitized = sanitizeHTML(htmlString);
    return { __html: sanitized };
  };

  // ============================================
  // SUB-COMPONENTS
  // ============================================
  const TextContent = () => (
    <div className="w-full lg:w-1/2 flex flex-col justify-between relative z-10">
      {hasTitle && (
        <h1 className="bricolage-grotesque font-700 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] 2xl:text-[48px] text-black pb-2 sm:pb-3">
          {section.title}
        </h1>
      )}

      {hasContent && (
        <div
          className="bricolage-grotesque text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[19px] 2xl:text-[20px] text-[#333333] leading-snug overflow-hidden"
          style={{ wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={renderHTML(content.html)}
        />
      )}

      {hasButton && (
        <div className="pt-4 sm:pt-5 md:pt-6 lg:pt-7 xl:pt-8">
          <button
            onClick={() => (window.location.href = btn.link)}
            className="bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-4 sm:px-5 lg:px-6 xl:px-7 py-2.5 sm:py-3 lg:py-3.5 xl:py-4 font-600 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] inline-flex items-center gap-2 sm:gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300"
          >
            <span>{btn.text}</span>
            <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
          </button>
        </div>
      )}
    </div>
  );

  const ImageComponent = () => (
    <div className="w-full lg:w-1/2 flex items-center mt-6 sm:mt-8 lg:mt-0 relative z-10">
      <div className="w-full h-full min-h-50 sm:min-h-62.5 md:min-h-75 lg:min-h-87.5 xl:min-h-100 2xl:min-h-112.5">
        <img
          src={imageSrc}
          alt={imageAlt}
          className={
            image.className ||
            'w-full h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'
          }
          onError={handleImageError}
        />
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`relative ${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
      style={getBackgroundStyle()}
    >
      {hasValue(bgImage) && hasValue(bgOverlay) && (
        <div className={`absolute inset-0 ${bgOverlay}`} />
      )}

      <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-15 relative z-10">
        {isImageLeft ? (
          <>
            <ImageComponent />
            <TextContent />
          </>
        ) : (
          <>
            <TextContent />
            <ImageComponent />
          </>
        )}
      </div>
    </section>
  );
};

export default HeroFigureSection;