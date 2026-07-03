// js/Sections/WhereWeWorkSection/WhereWeWorkSection.jsx

import React from 'react';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * WhereWeWorkSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Where We Work data from API (from DynamicSectionRenderer)
 * @param {Object} props.workData - Where We Work data from API (direct prop)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * 
 * @returns {JSX.Element} Rendered where we work section
 */
const WhereWeWorkSection = ({
  data,           // From DynamicSectionRenderer
  workData,       // Direct prop (legacy support)
  bgColor = 'bg-white',
  paddingY = 'py-10 sm:py-15 md:py-25 lg:py-37.5',
  paddingX = 'px-5 sm:px-10 md:px-20 lg:px-50',
  sectionClassName = '',
}) => {
  // Use data prop if available, fallback to workData
  let resolvedData = data || workData;

  // ============================================
  // EARLY RETURN - No data
  // ============================================
  if (!hasValue(resolvedData)) return null;

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
  const { section = {}, stats = [], image = {} } = resolvedData;

  // ============================================
  // EARLY RETURN - No content
  // ============================================
  if (!section.title && !stats.length && !image.src) return null;

  // ============================================
  // HELPER: Determine grid columns based on number of stats
  // ============================================
  const getGridCols = () => {
    if (stats.length <= 3) {
      return 'grid-cols-1'; // Single column for 3 or fewer stats
    }
    return 'grid-cols-1 sm:grid-cols-2'; // 2 columns for 4+ stats on tablet and up
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id='where-we-work'
      className={`flex flex-col lg:flex-row justify-between ${bgColor} gap-8 lg:gap-15 ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {/* Left Section - Text Content */}
      {(section.title || stats.length > 0) && (
        <div className='w-full lg:w-1/2 flex flex-col justify-between space-y-8 lg:space-y-12.5'>

          {/* Section Title */}
          {section.title && (
            <h1 className='bricolage-grotesque font-700 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] text-[#080C14]'>
              {section.title}
            </h1>
          )}

          {/* Stats Grid - Dynamic columns based on stats count */}
          {stats.length > 0 && (
            <div className={`grid ${getGridCols()} gap-4 sm:gap-5 lg:gap-6`}>
              {stats.map((stat) => (
                <div
                  key={stat.id}
                  className='bg-[#F5F5F5] text-center p-5 sm:p-6 md:p-7 lg:p-8 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group cursor-pointer'
                >
                  {stat.icon && (
                    <img
                      src={stat.icon}
                      alt={stat.alt || stat.label || "Statistic icon"}
                      className='w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 lg:w-15 lg:h-15 mx-auto mb-4 sm:mb-5 md:mb-6 lg:mb-7.5 group-hover:scale-110 transition-transform duration-300'
                    />
                  )}
                  {stat.value && (
                    <h3 className='bricolage-grotesque font-600 text-[32px] sm:text-[38px] md:text-[44px] lg:text-[50px] text-[#080C14] leading-tight'>
                      {stat.value}
                    </h3>
                  )}
                  {stat.label && (
                    <p className='font-600 text-[14px] sm:text-[15px] lg:text-[16px] text-[#080C14] max-w-63.75 mx-auto leading-relaxed px-2'>
                      {stat.label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right Section - Image */}
      {image.src && (
        <div className='w-full lg:w-1/2 flex mt-8 lg:mt-0'>
          <img
            src={image.src}
            alt={image.alt || "Where we work image"}
            className={`${image.className || ''} w-full h-auto lg:h-232.5 object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl`}
          />
        </div>
      )}
    </section>
  );
};

export default WhereWeWorkSection;