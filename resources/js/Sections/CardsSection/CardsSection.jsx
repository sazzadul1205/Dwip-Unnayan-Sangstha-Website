// js/Sections/CardsSection/CardsSection.jsx

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
 * CardsSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Cards data from API (from DynamicSectionRenderer)
 * @param {Object} props.cardsData - Cards data from API (direct prop - legacy)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.gap - Gap between cards (default: 'gap-6 sm:gap-8 md:gap-12 lg:gap-25')
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'cards')
 * 
 * @returns {JSX.Element} Rendered cards section
 */
const CardsSection = ({
  data,           // From DynamicSectionRenderer
  cardsData,      // Direct prop (legacy support)
  bgColor = 'bg-white',
  paddingY = 'py-8 sm:py-12 md:py-20 lg:py-37.5',
  paddingX = 'px-4 sm:px-8 md:px-16 lg:px-50',
  gap = 'gap-6 sm:gap-8 md:gap-12 lg:gap-25',
  sectionClassName = '',
  sectionId = 'cards',
}) => {
  // ============================================
  // RESOLVE DATA
  // ============================================
  // Use data prop if available, fallback to cardsData
  let resolvedData = data || cardsData;

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
  const { cards = [] } = resolvedData;

  // ============================================
  // CHECK FOR CARDS
  // ============================================
  const hasCards = hasValue(cards);

  if (!hasCards) {
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`flex flex-col lg:flex-row justify-between ${bgColor} ${gap} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {cards.map((card) => (
        <div key={card.id} className='w-full lg:w-1/2 flex'>
          <div className={`${card.bgColor || 'bg-white'} w-full rounded-xl sm:rounded-2xl px-4 sm:px-8 md:px-12 lg:px-17 py-6 sm:py-8 md:py-10 lg:py-12.5 flex flex-col`}>

            {/* Image Container with fixed height and centering */}
            {hasValue(card.image?.src) && (
              <div className='flex items-center justify-center min-h-50 sm:min-h-62.5 md:min-h-75 lg:min-h-87.5 xl:min-h-110'>
                <img
                  src={card.image.src}
                  alt={card.image.alt || card.title || 'Card image'}
                  className={`${card.image.className || ''} max-w-full max-h-full object-contain w-auto h-auto`}
                  loading="lazy"
                />
              </div>
            )}

            {/* Bottom Card - Always at bottom with consistent height */}
            {(hasValue(card.title) || hasValue(card.buttonText)) && (
              <div className={`${card.cardBgColor || 'bg-white'} w-full rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12.5 mt-4 sm:mt-5 md:mt-6 lg:mt-7.5 flex flex-col justify-between min-h-50 sm:min-h-62.5 md:min-h-70 lg:min-h-62.5`}>

                {/* Card Title */}
                {hasValue(card.title) && (
                  <h1 className='font-700 text-2xl sm:text-3xl md:text-4xl lg:text-[40px] leading-tight'>
                    {card.title}
                  </h1>
                )}

                {/* Card Button */}
                {hasValue(card.buttonText) && hasValue(card.buttonLink) && (
                  <div className='pt-3 sm:pt-4 md:pt-5 lg:pt-6'>
                    <button
                      onClick={() => window.location.href = card.buttonLink}
                      className='bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 lg:px-6 lg:py-3.5 xl:p-4 font-600 text-xs sm:text-sm md:text-base lg:text-[16px] inline-flex items-center gap-2 sm:gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300'
                    >
                      <span>{card.buttonText}</span>
                      <ArrowIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
};

export default CardsSection;