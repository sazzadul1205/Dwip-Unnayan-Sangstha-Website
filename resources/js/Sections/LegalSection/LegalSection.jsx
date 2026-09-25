// js/Sections/LegalSection/LegalSection.jsx

// React
import React, { useState } from 'react';

// Components
import ArrowIcon from '../../Shared/ArrowIcon';

// Skeleton primitives
import { Skeleton } from '../../Shared/Skeletons/SkeletonPrimitives';

import { hasValue, getPlaceholderImage } from '../../utils/sectionHelpers';



// ============================================
// SKELETON: Full Legal section
// ============================================
const LegalSkeleton = () => (
  <>
    {/* Background image block */}
    <Skeleton
      className="w-full h-full absolute inset-0"
      rounded="rounded-none"
    />

    {/* White text box — matches real positioning */}
    <div className="absolute bottom-5 right-5 md:bottom-10 lg:bottom-12.5 md:right-10 lg:right-50 bg-white/90 backdrop-blur-sm p-6 md:p-8 lg:p-12.5 w-[calc(100%-2.5rem)] md:w-auto lg:w-182.5 h-auto lg:h-75 shadow-lg rounded-lg">
      {/* Title — 2 lines with different widths */}
      <Skeleton className="h-7 sm:h-8 md:h-9 lg:h-10 w-5/6 mb-2" />
      <Skeleton className="h-7 sm:h-8 md:h-9 lg:h-10 w-2/3" />

      {/* Button */}
      <div className="pt-6 md:pt-7 lg:pt-9">
        <Skeleton className="h-11 sm:h-12 md:h-13 lg:h-14 w-36 sm:w-40 lg:w-44 rounded-md" />
      </div>
    </div>
  </>
);

/**
 * LegalSection Component
 */
const LegalSection = ({
  data,
  legalData,
  loading = false,               // ← NEW
  bgColor = '',
  height = 'h-125 md:h-147.25',
  paddingY = '',
  paddingX = '',
  sectionClassName = '',
  sectionId = 'legal',
}) => {
  const [imageError, setImageError] = useState(false);

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <section
        id={sectionId}
        className={`relative w-full ${height} overflow-hidden ${bgColor} ${paddingY} ${paddingX} ${sectionClassName}`}
      >
        <LegalSkeleton />
      </section>
    );
  }

  // ============================================
  // RESOLVE + NORMALIZE
  // ============================================
  let resolvedData = data || legalData;
  if (!hasValue(resolvedData)) return null;

  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  const { background = {}, overlay = {}, textBox = {} } = resolvedData;

  const hasBackground = hasValue(background.src);
  const hasOverlay = hasValue(overlay.darkOverlay);
  const hasTitle = hasValue(textBox.title) || hasValue(textBox.titleLine2);
  const hasButton = hasValue(textBox.buttonText) && hasValue(textBox.buttonLink);

  const hasAnyContent = hasBackground || hasOverlay || hasTitle || hasButton;
  if (!hasAnyContent) return null;

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const usePlaceholder = !hasBackground || imageError;

  const imageSrc = usePlaceholder
    ? getPlaceholderImage(1920, 600, textBox.title || 'Legal', '#1a1a2e', '#FFFFFF')
    : background.src;

  const imageAlt =
    background.alt ||
    (textBox.title ? `${textBox.title} - Legal` : 'Legal background');

  const handleImageError = () => setImageError(true);

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`relative w-full ${height} overflow-hidden ${bgColor} ${paddingY} ${paddingX} ${sectionClassName}`}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-full h-full object-cover object-center md:object-cover"
        onError={handleImageError}
      />

      {hasValue(overlay.darkOverlay) && (
        <div className={`absolute inset-0 ${overlay.darkOverlay}`} />
      )}

      <div className="absolute inset-0 bg-black/40 md:hidden" />

      {(hasTitle || hasButton) && (
        <div className="absolute bottom-5 right-5 md:bottom-10 lg:bottom-12.5 md:right-10 lg:right-50 bg-white/90 backdrop-blur-sm p-6 md:p-8 lg:p-12.5 w-[calc(100%-2.5rem)] md:w-auto lg:w-182.5 h-auto lg:h-75 shadow-lg rounded-lg">
          {(hasValue(textBox.title) || hasValue(textBox.titleLine2)) && (
            <h3 className="text-black font-700 text-2xl md:text-3xl lg:text-[40px] bricolage-grotesque leading-tight">
              {hasValue(textBox.title) && <span>{textBox.title}</span>}
              {hasValue(textBox.title) && hasValue(textBox.titleLine2) && <br />}
              {hasValue(textBox.titleLine2) && <span>{textBox.titleLine2}</span>}
            </h3>
          )}

          {hasValue(textBox.buttonText) && hasValue(textBox.buttonLink) && (
            <div className="pt-6 md:pt-7 lg:pt-9">
              <button
                onClick={() => (window.location.href = textBox.buttonLink)}
                className="bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-4 py-3 sm:px-5 sm:py-3.5 lg:p-4 font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300"
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