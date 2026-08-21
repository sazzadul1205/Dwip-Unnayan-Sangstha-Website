// js/Sections/ProgramImpactSection/ProgramImpactSection.jsx

// React
import React, { useState } from 'react';

// Utility function to check if value exists (SAME as other sections)
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Generate placeholder image URL
const getPlaceholderImage = (width = 800, height = 600, text = 'Impact') => {
  return `https://via.placeholder.com/${width}x${height}/009BE2/FFFFFF?text=${encodeURIComponent(text)}`;
};

/**
 * ProgramImpactSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Program Impact data from API (from DynamicSectionRenderer)
 * @param {Object} props.impactData - Program Impact data from API (direct prop)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'program-impact')
 * 
 * @returns {JSX.Element} Rendered program impact section
 */
const ProgramImpactSection = ({
  data,           // From DynamicSectionRenderer
  impactData,     // Direct prop (legacy support)
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'program-impact',
}) => {
  // ============================================
  // HOOKS - Must be called before any conditional returns
  // ============================================
  const [index, setIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  // ============================================
  // RESOLVE DATA
  // ============================================
  // Use data prop if available, fallback to impactData
  let resolvedData = data || impactData;

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
  const { section = {}, sdgImages = [] } = resolvedData;
  const images = section?.mainImage?.images || [];

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasImages = hasValue(images);
  const hasTitle = hasValue(section.title);
  const hasSdgImages = hasValue(sdgImages);

  // Early return if no content
  if (!hasImages && !hasTitle && !hasSdgImages) return null;

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const handleImageError = (imageId) => {
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
  };

  const getImageSrc = (image, defaultText = 'Impact') => {
    if (imageErrors[image.id]) {
      return getPlaceholderImage(800, 600, image.alt || defaultText);
    }
    if (hasValue(image.src)) {
      return image.src;
    }
    return getPlaceholderImage(800, 600, image.alt || defaultText);
  };

  const getCarouselImageSrc = (imageUrl, index) => {
    if (imageErrors[`carousel-${index}`]) {
      return getPlaceholderImage(1200, 800, `Impact slide ${index + 1}`);
    }
    if (hasValue(imageUrl)) {
      return imageUrl;
    }
    return getPlaceholderImage(1200, 800, `Impact slide ${index + 1}`);
  };

  // ============================================
  // HELPER: Go to slide
  // ============================================
  const goToSlide = (i) => setIndex(i);

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {/* Carousel - Only show if images exist */}
      {hasImages && (
        <div className="w-full flex flex-col items-center pb-6 sm:pb-8 md:pb-10 lg:pb-12 xl:pb-15">
          <div className="w-full">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl group">
              {hasValue(images[index]) && (
                <img
                  src={getCarouselImageSrc(images[index], index)}
                  alt={`Impact slide ${index + 1}`}
                  className="w-full h-48 sm:h-60 md:h-80 lg:h-120 xl:h-150 2xl:h-186.25 object-cover transition-all duration-500 group-hover:scale-105"
                  onError={() => handleImageError({ id: `carousel-${index}` })}
                />
              )}

              {/* Dots - Only show if more than 1 image */}
              {images.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${i === index
                        ? "w-6 sm:w-8 h-1.5 sm:h-2 bg-white"
                        : "w-2 sm:w-2.5 h-1.5 sm:h-2 bg-white/50 hover:bg-white/70"
                        }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Title - Only show if exists */}
      {hasTitle && (
        <h1 className='text-[#080C14] text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] xl:text-[26px] 2xl:text-[28px] font-600 mb-3 sm:mb-4 md:mb-5 lg:mb-6'>
          {section.title}
        </h1>
      )}

      {/* SDG Grid - Only show if images exist */}
      {hasSdgImages && (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7'>
          {sdgImages.map((image) => (
            <img
              key={image.id}
              src={getImageSrc(image, 'SDG')}
              alt={image.alt || "SDG"}
              className='w-full h-auto object-cover rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer'
              onClick={() => image.link && (window.location.href = image.link)}
              onError={() => handleImageError(image)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProgramImpactSection;