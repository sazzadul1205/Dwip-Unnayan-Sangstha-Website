// js/Sections/CardsSection/CardsSection.jsx

// React
import React, { useState } from 'react';

// Components
import ArrowIcon from '../../Shared/ArrowIcon';

// Utility function to check if value exists (SAME as other sections)
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Generate placeholder image URL (inline SVG — avoids external placeholder services)
const getPlaceholderImage = (width = 400, height = 300, text = 'Card Image') => {
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 12));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#E0E7FF"/><text x="50%" y="50%" fill="#1E3A8A" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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
 * @param {string} props.gap - Gap between cards (default: 'gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-15 2xl:gap-25')
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'cards')
 * 
 * @returns {JSX.Element} Rendered cards section
 */
const CardsSection = ({
  data,           // From DynamicSectionRenderer
  cardsData,      // Direct prop (legacy support)
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  gap = 'gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-15 2xl:gap-25',
  sectionClassName = '',
  sectionId = 'cards',
}) => {
  // ============================================
  // HOOKS - Must be called at the top level
  // ============================================
  const [imageErrors, setImageErrors] = useState({});

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
  // IMAGE HANDLING
  // ============================================
  const handleImageError = (cardId) => {
    setImageErrors(prev => ({ ...prev, [cardId]: true }));
  };

  const getImageSrc = (card) => {
    if (imageErrors[card.id]) {
      return getPlaceholderImage(400, 300, card.title || 'Card Image');
    }
    if (hasValue(card.image?.src)) {
      return card.image.src;
    }
    return getPlaceholderImage(400, 300, card.title || 'Card Image');
  };

  const getImageAlt = (card) => {
    return card.image?.alt || card.title || 'Card image';
  };

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
          <div className={`${card.bgColor || 'bg-white'} w-full rounded-xl sm:rounded-2xl px-4 sm:px-6 md:px-8 lg:px-12 xl:px-15 2xl:px-17 py-5 sm:py-6 md:py-8 lg:py-10 xl:py-12.5 flex flex-col h-full`}>

            {/* Image Container - Centered vertically */}
            <div className='flex-1 flex items-center justify-center min-h-40 sm:min-h-48 md:min-h-56 lg:min-h-64 xl:min-h-75 2xl:min-h-87.5'>
              <img
                src={getImageSrc(card)}
                alt={getImageAlt(card)}
                className={`${card.image?.className || ''} max-w-full max-h-full object-contain w-auto h-auto`}
                loading="lazy"
                onError={() => handleImageError(card.id)}
              />
            </div>

            {/* Bottom Card - Always at bottom */}
            {(hasValue(card.title) || hasValue(card.buttonText)) && (
              <div className={`${card.cardBgColor || 'bg-white'} w-full rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 2xl:p-12.5 mt-4 sm:mt-5 md:mt-6 lg:mt-7.5 flex flex-col justify-between min-h-40 sm:min-h-48 md:min-h-56 lg:min-h-62.5`}>

                {/* Card Title */}
                {hasValue(card.title) && (
                  <h1 className='text-black font-700 text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] xl:text-[36px] 2xl:text-[40px] leading-tight'>
                    {card.title}
                  </h1>
                )}

                {/* Card Button */}
                {hasValue(card.buttonText) && hasValue(card.buttonLink) && (
                  <div className='pt-2 sm:pt-3 md:pt-4 lg:pt-5 xl:pt-6'>
                    <button
                      onClick={() => window.location.href = card.buttonLink}
                      className='bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-4.5 md:py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 font-600 text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] xl:text-[16px] inline-flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300'
                    >
                      <span>{card.buttonText}</span>
                      <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
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