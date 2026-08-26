// js/Sections/ImageGallerySection/ImageGallerySection.jsx

import React, { useCallback, useEffect, useState } from 'react';

// Generate placeholder image URL
const getPlaceholderImage = (width = 485, height = 400, text = 'Gallery Image') => {
  return `https://via.placeholder.com/${width}x${height}/EAEAEA/999999?text=${encodeURIComponent(text)}`;
};

const ImageGallerySection = ({
  data,
  galleryData,
  sectionTitle = 'Gallery',
  imageCountLabel = 'Image Count',
  imagesPerPage = 9,
  imagesPerLoad = 6,
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'image-gallery-section',
}) => {
  const [visibleCount, setVisibleCount] = useState(imagesPerPage);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(null);

  // ============================================
  // RESOLVE DATA - FIXED
  // ============================================
  let resolvedData = galleryData || data || {};

  // If resolvedData is an array, use it directly
  if (Array.isArray(resolvedData)) {
    // It's already an array of images
    resolvedData = { images: resolvedData };
  }
  // If resolvedData has a 'data' property (from nested structure)
  else if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  // ============================================
  // NORMALIZE DATA STRUCTURE - FIXED
  // ============================================
  let resolvedImages = [];
  let resolvedSectionTitle = sectionTitle;
  let resolvedImageCountLabel = imageCountLabel;

  // Try to extract images from various possible locations
  if (resolvedData) {
    // Direct images array
    if (Array.isArray(resolvedData.images)) {
      resolvedImages = resolvedData.images;
    }
    // Data is the images array itself
    else if (Array.isArray(resolvedData)) {
      resolvedImages = resolvedData;
    }
    // Items array
    else if (Array.isArray(resolvedData.items)) {
      resolvedImages = resolvedData.items;
    }
    // Gallery array
    else if (Array.isArray(resolvedData.gallery)) {
      resolvedImages = resolvedData.gallery;
    }
    // Photos array
    else if (Array.isArray(resolvedData.photos)) {
      resolvedImages = resolvedData.photos;
    }

    // Extract section title
    if (resolvedData.sectionTitle) {
      resolvedSectionTitle = resolvedData.sectionTitle;
    } else if (resolvedData.title) {
      resolvedSectionTitle = resolvedData.title;
    }

    // Extract image count label
    if (resolvedData.imageCountLabel) {
      resolvedImageCountLabel = resolvedData.imageCountLabel;
    }
  }

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasImages = resolvedImages.length > 0;

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const handleImageError = (imageId) => {
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
  };

  const getImageSrc = (image, index) => {
    const imageId = image.id || index;
    if (imageErrors[imageId]) {
      const title = image.title || image.caption || `Gallery image ${index + 1}`;
      return getPlaceholderImage(485, 400, title);
    }
    const src = image.src || image.url || image.image || image;
    if (typeof src === 'string' && src.trim().length > 0) {
      return src;
    }
    return getPlaceholderImage(485, 400, image.title || image.caption || `Gallery image ${index + 1}`);
  };

  const getImageAlt = (image, index) => {
    return image.alt || image.title || image.caption || `Gallery image ${index + 1}`;
  };

  // ============================================
  // MODAL / LIGHTBOX HANDLING
  // ============================================
  const closeModal = useCallback(() => setSelectedIndex(null), []);

  const showPrev = useCallback((e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : resolvedImages.length - 1));
  }, [resolvedImages.length]);

  const showNext = useCallback((e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev < resolvedImages.length - 1 ? prev + 1 : 0));
  }, [resolvedImages.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') showPrev(e);
      if (e.key === 'ArrowRight') showNext(e);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, resolvedImages.length, showPrev, showNext, closeModal]);

  if (!hasImages) {
    return null;
  }

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + imagesPerLoad, resolvedImages.length));
  };

  const isAllVisible = visibleCount >= resolvedImages.length;
  const visibleImages = resolvedImages.slice(0, visibleCount);

  return (
    <section
      id={sectionId}
      className={`${bgColor} ${paddingY} ${paddingX} ${sectionClassName}`}
    >
      <div className="mx-auto space-y-5 sm:space-y-6 md:space-y-7.5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4">
          <h3 className="text-[#171D38] text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] font-semibold">
            {resolvedSectionTitle}
          </h3>
          <div className="bg-[#EAF6FF] px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg">
            <p className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[16px] font-normal text-[#2781BD]">
              {resolvedImageCountLabel}: {resolvedImages.length}
            </p>
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7.5">
          {visibleImages.map((image, index) => {
            const imageId = image.id || index;
            const imageSrc = getImageSrc(image, index);
            const imageAlt = getImageAlt(image, index);

            return (
              <div
                key={imageId}
                className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                onClick={() => setSelectedIndex(index)}
              >
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="w-full h-48 sm:h-52 md:h-60 lg:h-80 xl:h-90 2xl:h-100 object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={() => handleImageError(imageId)}
                />
              </div>
            );
          })}
        </div>

        {/* Show More Button */}
        {!isAllVisible && (
          <div className="flex justify-center pt-2 sm:pt-3 md:pt-4">
            <button
              onClick={handleShowMore}
              className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 lg:py-3.75 border border-[#2781BD] rounded-lg text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] font-semibold text-[#2781BD] hover:bg-[#2781BD] hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Show More
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-8"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-3xl leading-none hover:opacity-70"
            aria-label="Close"
          >
            &times;
          </button>

          <button
            onClick={showPrev}
            className="absolute left-2 sm:left-6 text-white text-4xl hover:opacity-70 px-2"
            aria-label="Previous image"
          >
            &#8249;
          </button>

          <img
            src={getImageSrc(resolvedImages[selectedIndex], selectedIndex)}
            alt={getImageAlt(resolvedImages[selectedIndex], selectedIndex)}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={showNext}
            className="absolute right-2 sm:right-6 text-white text-4xl hover:opacity-70 px-2"
            aria-label="Next image"
          >
            &#8250;
          </button>

          <p className="absolute bottom-4 sm:bottom-6 text-white/70 text-sm">
            {selectedIndex + 1} / {resolvedImages.length}
          </p>
        </div>
      )}
    </section>
  );
};

export default ImageGallerySection;
