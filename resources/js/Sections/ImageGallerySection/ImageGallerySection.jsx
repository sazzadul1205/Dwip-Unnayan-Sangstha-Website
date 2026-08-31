// js/Sections/ImageGallerySection/ImageGallerySection.jsx

import { useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { usePage, router } from '@inertiajs/react';

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
  const { url } = usePage();
  const currentQuery = new URLSearchParams(url.split('?')[1] || '');
  const filterTag = currentQuery.get('tag') || '';

  const [visibleCount, setVisibleCount] = useState(imagesPerPage);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [thumbnailRect, setThumbnailRect] = useState(null);
  const [modalImageStyle, setModalImageStyle] = useState({});
  const [backdropOpacity, setBackdropOpacity] = useState(0);
  const modalImageRef = useRef(null);

  // Resolve data
  let resolvedData = galleryData || data || {};
  if (Array.isArray(resolvedData)) {
    resolvedData = { images: resolvedData };
  } else if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  let resolvedImages = [];
  let resolvedSectionTitle = sectionTitle;
  let resolvedImageCountLabel = imageCountLabel;

  if (resolvedData) {
    if (Array.isArray(resolvedData.images)) resolvedImages = resolvedData.images;
    else if (Array.isArray(resolvedData)) resolvedImages = resolvedData;
    else if (Array.isArray(resolvedData.items)) resolvedImages = resolvedData.items;
    else if (Array.isArray(resolvedData.gallery)) resolvedImages = resolvedData.gallery;
    else if (Array.isArray(resolvedData.photos)) resolvedImages = resolvedData.photos;

    if (resolvedData.sectionTitle) resolvedSectionTitle = resolvedData.sectionTitle;
    else if (resolvedData.title) resolvedSectionTitle = resolvedData.title;

    if (resolvedData.imageCountLabel) resolvedImageCountLabel = resolvedData.imageCountLabel;
  }

  // ─── FILTER IMAGES BY TAG ───────────────────────────────
  const getImageTag = (image) => {
    return image.tag || image.tags || '';
  };

  const filteredImages = filterTag
    ? resolvedImages.filter(img => {
      const tag = getImageTag(img).toLowerCase();
      return tag.includes(filterTag.toLowerCase());
    })
    : resolvedImages;

  const hasFilteredImages = filteredImages.length > 0;

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(imagesPerPage);
  }, [filterTag, imagesPerPage]);

  // Image helpers
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

  // ─── MODAL HANDLERS (only used when there are images) ────
  // We'll conditionally render the modal only if there are images.

  const openModal = (e, index) => {
    const imgElement = e.currentTarget.querySelector('img');
    if (!imgElement) return;
    const rect = imgElement.getBoundingClientRect();
    setThumbnailRect(rect);
    setSelectedIndex(index);
    setModalOpen(true);
  };

  const closeModal = useCallback(() => {
    if (thumbnailRect) {
      const { left, top, width, height } = thumbnailRect;
      setModalImageStyle({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: 'none',
        opacity: 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      });
      setBackdropOpacity(0);
    }
    setTimeout(() => {
      setModalOpen(false);
      setThumbnailRect(null);
      setSelectedIndex(null);
      setModalImageStyle({});
    }, 300);
  }, [thumbnailRect]);

  const showPrev = useCallback((e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredImages.length - 1));
  }, [filteredImages.length]);

  const showNext = useCallback((e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev < filteredImages.length - 1 ? prev + 1 : 0));
  }, [filteredImages.length]);

  // Keyboard events
  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') showPrev(e);
      if (e.key === 'ArrowRight') showNext(e);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalOpen, closeModal, showPrev, showNext]);

  // ─── ANIMATE MODAL ENTRANCE ─────────────────────────────
  useLayoutEffect(() => {
    if (!modalOpen || !thumbnailRect) return;

    const { left, top, width, height } = thumbnailRect;

    setModalImageStyle({
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      transform: 'none',
      opacity: 1,
      transition: 'none',
    });

    if (modalImageRef.current) {
      void modalImageRef.current.offsetHeight; // force reflow
    }

    requestAnimationFrame(() => {
      setModalImageStyle({
        position: 'fixed',
        left: '50%',
        top: '50%',
        width: 'auto',
        height: 'auto',
        maxWidth: '95vw',
        maxHeight: '95vh',
        transform: 'translate(-50%, -50%)',
        opacity: 1,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      });
      setBackdropOpacity(1);
    });
  }, [modalOpen, thumbnailRect]);

  // If there are no images at all, return null
  if (resolvedImages.length === 0) {
    return null;
  }

  // ─── RENDER ──────────────────────────────────────────────

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + imagesPerLoad, filteredImages.length));
  };
  const isAllVisible = visibleCount >= filteredImages.length;
  const visibleImages = filteredImages.slice(0, visibleCount);

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
            {filterTag && (
              <span className="ml-2 text-sm font-normal text-[#2781BD]">
                (filtered: {filterTag})
              </span>
            )}
          </h3>
          <div className="bg-[#EAF6FF] px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg">
            <p className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[16px] font-normal text-[#2781BD]">
              {resolvedImageCountLabel}: {filteredImages.length}
            </p>
          </div>
        </div>

        {/* ─── FALLBACK: No images for this tag ────────────── */}
        {!hasFilteredImages ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h4 className="text-xl sm:text-2xl font-semibold text-gray-700">
              No images found
            </h4>
            <p className="text-gray-500 mt-2 max-w-md">
              We couldn't find any images related to the tag "{filterTag}". Try selecting a different tag or view all images.
            </p>
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.delete('tag');
                router.get(`${window.location.pathname  }?${  params.toString()}`, {}, {
                  preserveState: true,
                  preserveScroll: true,
                  replace: true,
                });
              }}
              className="mt-4 px-6 py-2 bg-[#2781BD] text-white rounded-lg hover:bg-[#1e6a9e] transition-colors"
            >
              View All Images
            </button>
          </div>
        ) : (
          <>
            {/* Image Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7.5">
              {visibleImages.map((image, index) => {
                const imageId = image.id || index;
                const imageSrc = getImageSrc(image, index);
                const imageAlt = getImageAlt(image, index);
                const tag = getImageTag(image);

                return (
                  <div
                    key={imageId}
                    className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer relative group"
                    onClick={(e) => openModal(e, index)}
                  >
                    <img
                      src={imageSrc}
                      alt={imageAlt}
                      className="w-full h-48 sm:h-52 md:h-60 lg:h-80 xl:h-90 2xl:h-100 object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={() => handleImageError(imageId)}
                    />
                    {tag && (
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] sm:text-xs px-2 py-1 rounded-full max-w-[80%] truncate">
                        {tag}
                      </div>
                    )}
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
          </>
        )}
      </div>

      {/* ─── LIGHTBOX MODAL ─────────────────────────────────── */}
      {modalOpen && hasFilteredImages && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'black',
            opacity: backdropOpacity,
            transition: 'opacity 0.4s ease',
          }}
          onClick={closeModal}
        >
          {/* Subtle radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 70%)',
            }}
          />

          {/* Navigation arrows */}
          <button
            onClick={showPrev}
            className="absolute left-2 sm:left-6 text-white text-4xl hover:opacity-70 px-2 z-10"
            aria-label="Previous image"
            style={{ opacity: backdropOpacity }}
          >
            &#8249;
          </button>
          <button
            onClick={showNext}
            className="absolute right-2 sm:right-6 text-white text-4xl hover:opacity-70 px-2 z-10"
            aria-label="Next image"
            style={{ opacity: backdropOpacity }}
          >
            &#8250;
          </button>

          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-3xl leading-none hover:opacity-70 z-10"
            aria-label="Close"
            style={{ opacity: backdropOpacity }}
          >
            &times;
          </button>

          {/* Animated image container */}
          <div
            ref={modalImageRef}
            style={{
              ...modalImageStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedIndex !== null && (
              <img
                src={getImageSrc(filteredImages[selectedIndex], selectedIndex)}
                alt={getImageAlt(filteredImages[selectedIndex], selectedIndex)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              />
            )}
          </div>

          {/* Image counter and tag */}
          {selectedIndex !== null && (
            <div
              className="absolute bottom-4 sm:bottom-6 text-white/70 text-sm z-10 text-center"
              style={{ opacity: backdropOpacity }}
            >
              <p>{selectedIndex + 1} / {filteredImages.length}</p>
              {getImageTag(filteredImages[selectedIndex]) && (
                <p className="mt-1 text-xs bg-white/20 inline-block px-3 py-1 rounded-full">
                  {getImageTag(filteredImages[selectedIndex])}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ImageGallerySection;