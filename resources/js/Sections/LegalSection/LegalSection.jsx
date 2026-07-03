// js/Sections/LegalSection/LegalSection.jsx

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
 * LegalSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Legal data from API (from DynamicSectionRenderer)
 * @param {Object} props.legalData - Legal data from API (direct prop - legacy)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.height - Height classes (default: 'h-125 md:h-147.25')
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'legal')
 * 
 * @returns {JSX.Element} Rendered legal section
 */
const LegalSection = ({
  data,           // From DynamicSectionRenderer
  legalData,      // Direct prop (legacy support)
  bgColor = '',
  height = 'h-125 md:h-147.25',
  paddingY = '',
  paddingX = '',
  sectionClassName = '',
  sectionId = 'legal',
}) => {
  // ============================================
  // RESOLVE DATA
  // ============================================
  // Use data prop if available, fallback to legalData
  let resolvedData = data || legalData;

  // ============================================
  // EARLY RETURN - No data
  // ============================================
  if (!hasValue(resolvedData)) {
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
    background = {},
    overlay = {},
    textBox = {}
  } = resolvedData;

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasBackground = hasValue(background.src);
  const hasOverlay = hasValue(overlay.darkOverlay);
  const hasTitle = hasValue(textBox.title) || hasValue(textBox.titleLine2);
  const hasButton = hasValue(textBox.buttonText) && hasValue(textBox.buttonLink);

  const hasAnyContent = hasBackground || hasOverlay || hasTitle || hasButton;

  if (!hasAnyContent) {
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`relative w-full ${height} overflow-hidden ${bgColor} ${paddingY} ${paddingX} ${sectionClassName}`}
    >
      {/* Background Image - Only render if src exists */}
      {hasValue(background.src) && (
        <img
          src={background.src}
          alt={background.alt || 'Legal background'}
          className="w-full h-full object-cover object-center md:object-cover"
        />
      )}

      {/* Dark Overlay - Only render if darkOverlay class exists */}
      {hasValue(overlay.darkOverlay) && (
        <div className={`absolute inset-0 ${overlay.darkOverlay}`} />
      )}

      {/* Additional overlay for mobile to ensure text readability */}
      <div className="absolute inset-0 bg-black/40 md:hidden" />

      {/* White Box Text - Positioned at bottom right - Only show if there's content */}
      {(hasTitle || hasButton) && (
        <div className="absolute bottom-5 right-5 md:bottom-10 lg:bottom-12.5 md:right-10 lg:right-50 bg-white/90 backdrop-blur-sm p-6 md:p-8 lg:p-12.5 w-[calc(100%-2.5rem)] md:w-auto lg:w-182.5 h-auto lg:h-75 shadow-lg rounded-lg">

          {/* Title */}
          {(hasValue(textBox.title) || hasValue(textBox.titleLine2)) && (
            <h3 className="text-black font-700 text-2xl md:text-3xl lg:text-[40px] bricolage-grotesque leading-tight">
              {hasValue(textBox.title) && <span>{textBox.title}</span>}
              {hasValue(textBox.title) && hasValue(textBox.titleLine2) && <br />}
              {hasValue(textBox.titleLine2) && <span>{textBox.titleLine2}</span>}
            </h3>
          )}

          {/* Button */}
          {hasValue(textBox.buttonText) && hasValue(textBox.buttonLink) && (
            <div className='pt-6 md:pt-7 lg:pt-9'>
              <button
                onClick={() => window.location.href = textBox.buttonLink}
                className='bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-4 py-3 sm:px-5 sm:py-3.5 lg:p-4 font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300'
              >
                <span>{textBox.buttonText}</span>
                <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default LegalSection;