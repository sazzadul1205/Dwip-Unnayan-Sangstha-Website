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
  paddingY = 'py-10 sm:py-15 md:py-25 lg:py-37.5',
  paddingX = 'px-5 sm:px-10 md:px-20 lg:px-50',
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
        <h1 className='bricolage-grotesque font-700 text-[32px] sm:text-[36px] lg:text-[40px] text-black pb-2'>
          {section.title}
        </h1>
      )}

      {hasContent && (
        <div className="relative">
          <div
            className='bricolage-grotesque text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug overflow-hidden'
            style={{
              maxHeight: '730px',
              display: '-webkit-box',
              WebkitLineClamp: 'unset',
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word'
            }}
            dangerouslySetInnerHTML={renderHTML(content.html)}
          />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white to-transparent pointer-events-none" />
        </div>
      )}

      {hasButton && (
        <div className='pt-8'>
          <button
            onClick={() => window.location.href = btn.link}
            className='bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-4 py-3 sm:px-5 sm:py-3.5 lg:p-4 font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300'
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
    <div className='w-full lg:w-1/2 flex mt-8 lg:mt-0 relative z-10'>
      <img
        src={imageSrc}
        alt={imageAlt}
        className={image.className || 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'}
        onError={handleImageError}
      />
    </div>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`relative ${bgColor} ${paddingY} ${paddingX} ${sectionClassName}`}
      style={getBackgroundStyle()}
    >
      {hasValue(bgImage) && hasValue(bgOverlay) && (
        <div className={`absolute inset-0 ${bgOverlay}`} />
      )}

      <div className="flex flex-col lg:flex-row justify-between items-stretch gap-8 lg:gap-15 relative z-10">
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