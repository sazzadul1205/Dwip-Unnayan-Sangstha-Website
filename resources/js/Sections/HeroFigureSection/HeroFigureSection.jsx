// js/Sections/HeroFigureSection/HeroFigureSection.jsx

// React
import React from 'react';

// Components
import ArrowIcon from '../../components/Shared/ArrowIcon';

// Utility function to check if value exists (SAME as other sections)
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * HeroFigureSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Hero Figure data from API (from DynamicSectionRenderer)
 * @param {Object} props.heroData - Hero Figure data from API (direct prop - legacy)
 * @param {string} props.sectionId - Section ID (default: 'hero-figure')
 * @param {string} props.layout - Layout direction ('text-left' or 'text-right')
 * @param {string} props.bgColor - Customizable background color
 * @param {string} props.bgImage - Customizable background image
 * @param {string} props.bgOverlay - Customizable overlay for background image
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * 
 * @returns {JSX.Element} Rendered hero figure section
 */
const HeroFigureSection = ({
  data,           // From DynamicSectionRenderer
  heroData,       // Direct prop (legacy support)
  sectionId = 'hero-figure',
  layout = 'text-left',   // 'text-left' or 'text-right'
  bgColor = 'bg-white',   // Customizable background color
  bgImage = null,         // Customizable background image
  bgOverlay = null,       // Customizable overlay for background image
  paddingY = 'py-10 sm:py-15 md:py-25 lg:py-37.5',
  paddingX = 'px-5 sm:px-10 md:px-20 lg:px-50',
  sectionClassName = '',
}) => {
  // ============================================
  // RESOLVE DATA
  // ============================================
  // Use data prop if available, fallback to heroData
  let resolvedData = data || heroData;

  // ============================================
  // EARLY RETURN - No data
  // ============================================
  if (!hasValue(resolvedData)) {
    console.warn('HeroFigureSection: No data provided');
    return null;
  }

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  // Check if the data is wrapped in a 'data' property
  // This happens when the API returns { id, page_slug, section_key, data: { ... } }
  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

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
  // HELPERS
  // ============================================
  // Function to render HTML content safely
  const renderHTML = (htmlString) => {
    return { __html: htmlString };
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
      {/* Only render section title if it exists */}
      {hasTitle && (
        <h1 className='bricolage-grotesque font-700 text-[32px] sm:text-[36px] lg:text-[40px] text-black pb-2'>
          {section.title}
        </h1>
      )}

      {/* Render HTML content with 730px max height and ellipsis */}
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
          {/* Ellipsis indicator - Only show if content overflows */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white to-transparent pointer-events-none" />
        </div>
      )}

      {/* Render button if btn exists */}
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
    hasImage && (
      <div className='w-full lg:w-1/2 flex mt-8 lg:mt-0 relative z-10'>
        <img
          src={image.src}
          alt={image.alt || 'Section image'}
          className={image.className || 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'}
        />
      </div>
    )
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
      {/* Background overlay if bgImage is provided */}
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