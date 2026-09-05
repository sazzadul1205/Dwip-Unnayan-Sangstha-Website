// js/Sections/HeroFigureSection/HeroFigureSection.jsx

// React
import React, { useState } from 'react';

// Components
import ArrowIcon from '../../Shared/ArrowIcon';

// Utils
import { hasValue, getPlaceholderImage, normalizeData, sanitizeHTML } from '../../utils/sectionHelpers';

/**
 * HeroFigureSection Component
 */
const HeroFigureSection = ({
  data,
  heroData,
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

  // ============================================
  // RESOLVE DATA
  // ============================================
  let resolvedData = data || heroData;

  if (!hasValue(resolvedData)) {
    console.warn('HeroFigureSection: No data provided');
    return null;
  }

  // Normalize data structure
  resolvedData = normalizeData(resolvedData);

  // ============================================
  // SAFE DESTRUCTURING WITH DEFAULTS
  // ============================================
  const {
    section = {},
    content = {},
    image = {},
    btn = {}
  } = resolvedData;

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasTitle = hasValue(section?.title);
  const hasContent = hasValue(content?.html);
  const hasButton = hasValue(btn?.text) && hasValue(btn?.link);
  const hasImage = hasValue(image?.src);

  const hasAnyContent = hasTitle || hasContent || hasButton || hasImage;

  if (!hasAnyContent) {
    return null;
  }

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const usePlaceholder = !hasImage || imageError;

  const imageSrc = usePlaceholder
    ? getPlaceholderImage(800, 600, section.title || 'Hero Image')
    : image.src;

  const imageAlt = image.alt || section.title || 'Section image';

  const handleImageError = () => {
    setImageError(true);
  };

  // ============================================
  // HELPERS
  // ============================================
  // Function to render HTML content safely
  const renderHTML = (htmlString) => {
    // Sanitize HTML content
    const sanitized = sanitizeHTML(htmlString);
    return { __html: sanitized };
  };

  // Determine image position based on layout
  const isImageLeft = layout === 'text-right';

  // Generate background style
  const getBackgroundStyle = () => {
    if (hasValue(bgImage)) {
      return {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return {};
  };

  // ============================================
  // SUB-COMPONENTS
  // ============================================
  // Text content component
  const TextContent = () => (
    <div className='w-full lg:w-1/2 flex flex-col justify-between relative z-10'>
      {hasTitle && (
        <h1 className='bricolage-grotesque font-700 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] 2xl:text-[48px] text-black pb-2 sm:pb-3'>
          {section.title}
        </h1>
      )}

      {hasContent && (
        <div
          className='bricolage-grotesque text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[19px] 2xl:text-[20px] text-[#333333] leading-snug overflow-hidden'
          style={{
            wordBreak: 'break-word'
          }}
          dangerouslySetInnerHTML={renderHTML(content.html)}
        />
      )}

      {hasButton && (
        <div className='pt-4 sm:pt-5 md:pt-6 lg:pt-7 xl:pt-8'>
          <button
            onClick={() => window.location.href = btn.link}
            className='bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-4 sm:px-5 lg:px-6 xl:px-7 py-2.5 sm:py-3 lg:py-3.5 xl:py-4 font-600 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] inline-flex items-center gap-2 sm:gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300'
          >
            <span>{btn.text}</span>
            <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
          </button>
        </div>
      )}
    </div>
  );

  // Image component
  const ImageComponent = () => (
    <div className='w-full lg:w-1/2 flex items-center mt-6 sm:mt-8 lg:mt-0 relative z-10'>
      <div className='w-full h-full min-h-50 sm:min-h-62.5 md:min-h-75 lg:min-h-87.5 xl:min-h-100 2xl:min-h-112.5'>
        <img
          src={imageSrc}
          alt={imageAlt}
          className={image.className || 'w-full h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'}
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