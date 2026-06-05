// pages/About/BannerSection/BannerSection.jsx

// React
import React from 'react';

const BannerSection = ({ bannerData, sectionId }) => {
  // Check if bannerData exists
  if (!bannerData) {
    return null;
  }

  // Safely access nested properties with fallbacks
  const background = bannerData.background || {};
  const overlay = bannerData.overlay || {};
  const content = bannerData.content || {};
  const title = content.title || {};
  const description = content.description || {};

  return (
    <section
      id={sectionId}
      className="relative w-full h-125 md:h-147.25 overflow-hidden"
    >
      {/* Background Image - Only render if src exists */}
      {background.src && (
        <img
          src={background.src}
          alt={background.alt || 'Banner background'}
          className="w-full h-full object-cover object-center md:object-cover"
        />
      )}

      {/* Dark Overlay */}
      {overlay.darkOverlay && (
        <div className={`absolute inset-0 ${overlay.darkOverlay}`}></div>
      )}

      {/* Left Dark Gradient - Responsive gradient strength */}
      {overlay.gradient && (
        <div className={`absolute inset-0 ${overlay.gradient}`}></div>
      )}

      {/* Additional overlay for mobile to ensure text readability */}
      <div className="absolute inset-0 bg-black/40 md:hidden"></div>

      {/* Content - Only render if there's content to show */}
      {(title.text || description.text) && (
        <div className="absolute left-0 md:left-5 inset-0 flex items-center p-5 md:p-12.5">
          <div className="w-full px-4 md:px-20 text-white space-y-3 md:space-y-5">

            {/* Title - Only render if text exists */}
            {title.text && (
              <h1 className={`bricolage-grotesque font-bold leading-tight text-[32px] md:text-[100px] text-center md:text-left w-full md:w-215.75 ${title.className || ''}`}>
                {title.text}
              </h1>
            )}

            {/* Description - Only render if text exists */}
            {description.text && (
              <p className={`bricolage-grotesque font-normal text-[14px] md:text-[30px] leading-tight text-center md:text-left text-white w-full md:w-215.75 line-clamp-3 md:line-clamp-none ${description.className || ''}`}>
                {description.text}
              </p>
            )}

          </div>
        </div>
      )}
    </section>
  );
};

export default BannerSection;