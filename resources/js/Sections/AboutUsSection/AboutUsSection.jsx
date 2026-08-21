// js/Sections/AboutUsSection/AboutUsSection.jsx

// React
import React, { useState } from 'react';

// Arrow Icon
import ArrowIcon from '../../Shared/ArrowIcon';

// Shared utilities
import { hasValue, getPlaceholderImage, normalizeData } from '../../utils/sectionHelpers';

/**
 * AboutUsSection Component
 */
const AboutUsSection = ({
  data,
  aboutUsData,
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
}) => {
  // ============================================
  // HOOKS
  // ============================================
  const [imageError, setImageError] = useState(false);

  // ============================================
  // PROCESS DATA
  // ============================================
  let resolvedData = data || aboutUsData;

  if (!hasValue(resolvedData)) {
    return null;
  }

  // Normalize data structure
  resolvedData = normalizeData(resolvedData);

  // ============================================
  // SAFE DESTRUCTURING WITH DEFAULTS
  // ============================================
  const {
    section = {},
    mission = {},
    impact = {},
    image = {}
  } = resolvedData;

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasAnyContent = hasValue(section.title) ||
    hasValue(section.description) ||
    hasValue(section.button?.text) ||
    hasValue(mission.title) ||
    hasValue(mission.items) ||
    hasValue(impact.title) ||
    hasValue(impact.stats) ||
    hasValue(image.src);

  if (!hasAnyContent) {
    return null;
  }

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const usePlaceholder = !hasValue(image.src) || imageError;

  const imageSrc = usePlaceholder
    ? getPlaceholderImage(800, 600, section.title || 'About Us')
    : image.src;

  const imageAlt = image.alt || (section.title ? `${section.title} - About Us` : 'About us image');

  const handleImageError = () => {
    setImageError(true);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id='about-us'
      className={`flex flex-col lg:flex-row justify-between items-stretch ${bgColor} gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-15 ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {/* Left Section - Text Content */}
      <div className='w-full lg:w-1/2 flex flex-col justify-between space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 xl:space-y-15'>

        {/* About Section */}
        {(hasValue(section.title) || hasValue(section.description) || hasValue(section.button?.text)) && (
          <div>
            {hasValue(section.title) && (
              <h1 className='bricolage-grotesque font-800 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] 2xl:text-[48px] text-black pb-3 sm:pb-4 lg:pb-5 xl:pb-6'>
                {section.title}
              </h1>
            )}

            {hasValue(section.description) && (
              <p className='bricolage-grotesque font-400 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[19px] 2xl:text-[20px] text-[#515151] leading-snug pb-4 sm:pb-5 lg:pb-6 xl:pb-7.5'>
                {section.description}
              </p>
            )}

            {hasValue(section.button?.text) && (
              <button
                onClick={() => {
                  if (section.button?.link) {
                    window.location.href = section.button.link;
                  }
                }}
                className='bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-4 sm:px-5 lg:px-6 xl:px-7 py-2.5 sm:py-3 lg:py-3.5 xl:py-4 font-600 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] inline-flex items-center gap-2 sm:gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300'
              >
                <span>{section.button.text}</span>
                <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </button>
            )}
          </div>
        )}

        {/* Mission Section */}
        {(hasValue(mission.title) || hasValue(mission.items)) && (
          <div>
            {hasValue(mission.title) && (
              <h1 className='bricolage-grotesque font-600 text-[18px] sm:text-[19px] md:text-[20px] lg:text-[22px] xl:text-[24px] text-[#080C14] pb-3 sm:pb-4 lg:pb-5 xl:pb-6'>
                {mission.title}
              </h1>
            )}

            {hasValue(mission.items) && (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-3.5 lg:gap-4 xl:gap-5'>
                {mission.items.map((item) => (
                  <div key={item.id} className='bg-[#F5F5F5] flex p-3.5 sm:p-4 md:p-5 lg:p-6 rounded-xl gap-3 sm:gap-4 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
                    {item.icon && (
                      <img
                        src={item.icon}
                        alt={item.alt || item.title || "Mission icon"}
                        className='w-5 h-5 sm:w-6 sm:h-6 md:w-6.5 md:h-6.5 lg:w-7.5 lg:h-7.5 group-hover:scale-110 transition-transform duration-300 shrink-0 mt-0.5'
                      />
                    )}
                    <div>
                      {item.title && (
                        <h3 className='bricolage-grotesque font-600 text-[16px] sm:text-[17px] md:text-[18px] lg:text-[19px] xl:text-[20px] text-[#080C14] mb-0.5 sm:mb-1 lg:mb-2'>
                          {item.title}
                        </h3>
                      )}
                      {item.description && (
                        <p className='bricolage-grotesque font-400 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] text-[#515151] leading-relaxed'>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Impact Section */}
        {(hasValue(impact.title) || hasValue(impact.stats)) && (
          <div>
            {hasValue(impact.title) && (
              <h1 className='bricolage-grotesque font-600 text-[18px] sm:text-[19px] md:text-[20px] lg:text-[22px] xl:text-[24px] text-[#080C14] pb-3 sm:pb-4 lg:pb-5 xl:pb-6'>
                {impact.title}
              </h1>
            )}

            {hasValue(impact.stats) && (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 rounded-md'>
                {impact.stats.map((stat) => (
                  <div key={stat.id} className='bg-[#F5F5F5] py-4 sm:py-5 md:py-6 lg:py-7 xl:py-7.5 rounded-xl group hover:bg-[#009BE2] transition-all duration-300 hover:-translate-y-1 cursor-default'>
                    {(hasValue(stat.value) || hasValue(stat.suffix)) && (
                      <h3 className='flex items-end font-600 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] 2xl:text-[50px] text-[#080C14] text-center justify-center group-hover:text-white transition-colors duration-300'>
                        {stat.value}
                        {stat.suffix && (
                          <span className='text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] xl:text-[16px] pb-1 sm:pb-1.5 md:pb-2 lg:pb-2.5 xl:pb-3 group-hover:text-white transition-colors duration-300 cursor-default'>
                            {stat.suffix}
                          </span>
                        )}
                      </h3>
                    )}
                    {hasValue(stat.label) && (
                      <p className='font-600 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] text-[#080C14] text-center justify-center group-hover:text-white transition-colors duration-300'>
                        {stat.label}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section - Image */}
      <div className='w-full lg:w-1/2 flex items-center mt-6 sm:mt-8 lg:mt-0'>
        <div className='w-full h-full min-h-62.5 sm:min-h-75 md:min-h-87.5 lg:min-h-100 xl:min-h-112.5 2xl:min-h-125'>
          <img
            src={imageSrc}
            alt={imageAlt}
            className={`${image.className || ''} w-full h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl`}
            onError={handleImageError}
          />
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;