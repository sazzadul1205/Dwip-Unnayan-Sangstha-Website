// js/Sections/OurProgramsSection/OurProgramsSection.jsx

// React
import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";

// Arrow Icon
import ArrowIcon from "../../Shared/ArrowIcon";

// Skeleton primitives
import { Skeleton, SkeletonText } from '../../Shared/Skeletons/SkeletonPrimitives';

// Utils
import { hasValue, getPlaceholderImage, normalizeData, sanitizeHTML } from '../../utils/sectionHelpers';

// ============================================
// DEFAULT SECTION DATA
// ============================================
const DEFAULT_SECTION = {
  title: 'Our Programs',
  description: 'Explore our impactful programs that are transforming lives in coastal communities',
  button: {
    text: 'View All Programs',
    link: '/projects-programs',
  },
};

// ============================================
// SKELETON: Single sticky program card
// ============================================
const ProgramSkeletonCard = ({ index = 0 }) => (
  <div
    className="sticky top-20 sm:top-22 md:top-24 lg:top-25 w-full"
    style={{ zIndex: index + 1 }}
  >
    <div className="flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-8 md:gap-10 lg:gap-15 xl:gap-20 2xl:gap-25 p-5 sm:p-6 md:p-8 lg:p-12 xl:p-20 2xl:p-25 rounded-3xl min-h-162.5 lg:min-h-0 bg-white shadow-lg">
      {/* Left Content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center">
        {/* Title — matches real: 22→46px, 3 lines max */}
        <Skeleton className="h-7 sm:h-8 md:h-9 lg:h-11 xl:h-12 2xl:h-14 w-4/5 mb-3 sm:mb-4 md:mb-5" />
        <Skeleton className="h-7 sm:h-8 md:h-9 lg:h-11 xl:h-12 2xl:h-14 w-3/5 mb-4 sm:mb-5 md:mb-6 lg:mb-7" />

        {/* Description — 5 short lines */}
        <SkeletonText
          lines={5}
          lineClassName="h-4 sm:h-4.5 md:h-5 lg:h-5.5 xl:h-6"
          className="mb-4 sm:mb-5 md:mb-6"
        />

        {/* Read more link */}
        <Skeleton className="h-5 sm:h-5.5 md:h-6 lg:h-6.5 w-32 sm:w-36 md:w-40" />
      </div>

      {/* Right Image */}
      <div className="w-full lg:w-1/2">
        <Skeleton
          className="w-full h-60 sm:h-75 md:h-85 lg:h-100 xl:h-120 2xl:h-150 rounded-3xl"
        />
      </div>
    </div>
  </div>
);

// ============================================
// SKELETON: Header + tall scroll container with N stacked cards
// Container height matches real: filteredPrograms.length * 100vh
// ============================================
const ProgramSkeletonStack = ({ count = 3 }) => (
  <>
    {/* Header skeleton */}
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-8 sm:pb-10 lg:pb-15 gap-5">
      <div className="max-w-250 w-full">
        {/* Title */}
        <Skeleton className="h-8 sm:h-9 md:h-10 lg:h-11 xl:h-12 2xl:h-14 w-3/5 sm:w-2/5 mb-3 sm:mb-4 lg:mb-5" />
        {/* Description */}
        <SkeletonText lines={2} lineClassName="h-4 sm:h-4.5 md:h-5" />
      </div>
      {/* Button */}
      <Skeleton className="h-12 sm:h-14 lg:h-16 xl:h-17 2xl:h-18 w-40 sm:w-48 lg:w-56 rounded-md shrink-0" />
    </div>

    {/* Scroll stack — height matches real layout */}
    <div
      className="relative mt-12 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-28 2xl:mt-32"
      style={{ height: `${count * 100}vh` }}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProgramSkeletonCard key={`program-skeleton-${index}`} index={index} />
      ))}
    </div>

    {/* Bottom spacer — matches real component */}
    <div className="h-12 sm:h-16 md:h-20 lg:h-25 xl:h-30 2xl:h-50" />
  </>
);

/**
 * OurProgramsSection Component
 */
const OurProgramsSection = ({
  data,
  programsData,
  loading = false,               // ← NEW
  skeletonCount = 3,             // ← NEW: how many stacked skeleton cards
  limit,
  showFeatured,
  showHeader = true,
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
}) => {
  // ============================================
  // HOOKS
  // ============================================
  const [visibleCards, setVisibleCards] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const cardsRef = useRef([]);

  // ============================================
  // RESOLVE DATA
  // ============================================
  const { programs, section } = useMemo(() => {
    let resolvedData = data || programsData;

    if (!hasValue(resolvedData)) {
      return { programs: [], section: { ...DEFAULT_SECTION } };
    }

    resolvedData = normalizeData(resolvedData);

    let programs = [];
    let section = { ...DEFAULT_SECTION };

    if (Array.isArray(resolvedData)) {
      programs = resolvedData;
    } else if (resolvedData.programs && Array.isArray(resolvedData.programs)) {
      programs = resolvedData.programs;
      section = { ...DEFAULT_SECTION, ...(resolvedData.section || {}) };
    } else {
      const arrayKeys = Object.keys(resolvedData).filter((key) =>
        Array.isArray(resolvedData[key])
      );
      if (arrayKeys.length > 0) {
        programs = resolvedData[arrayKeys[0]];
        section = { ...DEFAULT_SECTION, ...(resolvedData.section || {}) };
      }
    }

    return { programs, section };
  }, [data, programsData]);

  // ============================================
  // APPLY FILTERS
  // ============================================
  const filteredPrograms = useMemo(() => {
    let filtered = [...programs];

    if (showFeatured === true || showFeatured === 'true') {
      filtered = filtered.filter(
        (program) => program.is_featured === true || program.is_featured === 1
      );
    }

    if (limit && parseInt(limit) > 0) {
      filtered = filtered.slice(0, parseInt(limit));
    }

    return filtered;
  }, [programs, showFeatured, limit]);

  // ============================================
  // HELPERS
  // ============================================
  const stripHtmlTags = useCallback((html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }, []);

  const truncateHtml = useCallback(
    (html, maxLines = 9) => {
      if (!html) return '';
      const plainText = stripHtmlTags(html);
      const words = plainText.split(' ');
      const wordsPerLine = 20;
      const maxWords = maxLines * wordsPerLine;
      if (words.length <= maxWords) return html;

      let truncatedText = words.slice(0, maxWords).join(' ');
      truncatedText = `${truncatedText}...`;

      return `<p class="font-400 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[19px] 2xl:text-[20px] text-[#524B48] leading-relaxed line-clamp-6 sm:line-clamp-7 md:line-clamp-8 lg:line-clamp-9 xl:line-clamp-10 2xl:line-clamp-11">${truncatedText}</p>`;
    },
    [stripHtmlTags]
  );

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const handleImageError = useCallback((programId) => {
    setImageErrors((prev) => ({ ...prev, [programId]: true }));
  }, []);

  const getImageSrc = useCallback(
    (program) => {
      if (imageErrors[program.id]) {
        return getPlaceholderImage(800, 600, program.title || 'Program');
      }
      if (hasValue(program.image)) return program.image;
      return getPlaceholderImage(800, 600, program.title || 'Program');
    },
    [imageErrors]
  );

  // ============================================
  // EFFECT: IntersectionObserver for card visibility
  // ============================================
  useEffect(() => {
    if (loading) return; // don't observe skeletons

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardId = parseInt(entry.target.getAttribute('data-id'));
          if (entry.isIntersecting) {
            setVisibleCards((prev) =>
              prev.includes(cardId) ? prev : [...prev, cardId]
            );
          }
        });
      },
      { threshold: 0.25 }
    );

    const currentCards = cardsRef.current;
    currentCards.forEach((card) => card && observer.observe(card));

    return () => observer.disconnect();
  }, [filteredPrograms, loading]);

  // ============================================
  // RENDER FLAGS
  // ============================================
  const hasTitle = hasValue(section.title);
  const hasDescription = hasValue(section.description);
  const hasButton = hasValue(section.button?.text);
  const shouldShowHeader = showHeader && (hasTitle || hasDescription || hasButton);
  const hasPrograms = hasValue(filteredPrograms);

  // ============================================
  // LOADING STATE — SKELETON
  // ============================================
  if (loading) {
    return (
      <section
        id="our-programs"
        className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
      >
        <ProgramSkeletonStack count={skeletonCount} />
      </section>
    );
  }

  // ============================================
  // EARLY RETURN — No content
  // ============================================
  if (!shouldShowHeader && !hasPrograms) {
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id="our-programs"
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {/* Header */}
      {shouldShowHeader && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-8 sm:pb-10 lg:pb-15 gap-5">
          {(hasTitle || hasDescription) && (
            <div className="max-w-250">
              {hasTitle && (
                <h1 className="bricolage-grotesque font-700 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] 2xl:text-[48px] text-[#080C14] pb-3 sm:pb-4 lg:pb-5">
                  {section.title}
                </h1>
              )}
              {hasDescription && (
                <p className="font-400 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[19px] 2xl:text-[20px] text-[#515151]">
                  {section.description}
                </p>
              )}
            </div>
          )}
          {hasButton && (
            <button
              onClick={() => {
                if (section.button?.link) {
                  window.location.href = section.button.link;
                }
              }}
              className="bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-5 sm:px-6 lg:px-7.5 xl:px-8 2xl:px-10 py-3 sm:py-4 lg:py-5 font-600 text-[14px] sm:text-[15px] lg:text-[16px] xl:text-[17px] 2xl:text-[18px] inline-flex items-center gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300 whitespace-nowrap"
            >
              {section.button.text}
              <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
            </button>
          )}
        </div>
      )}

      {/* Programs */}
      {hasPrograms && (
        <>
          <div
            className={`relative ${shouldShowHeader ? "mt-12 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-28 2xl:mt-32" : ""
              }`}
            style={{ height: `${filteredPrograms.length * 100}vh` }}
          >
            {filteredPrograms.map((program, index) => {
              if (!hasValue(program) && !program.title && !program.description) {
                return null;
              }

              const descriptionHtml =
                program.full_content_html || program.description || '';

              const maxLines = 9;
              const truncatedDescription = truncateHtml(descriptionHtml, maxLines);

              return (
                <div
                  key={program.id || index}
                  ref={(el) => (cardsRef.current[index] = el)}
                  data-id={program.id || index}
                  className={`sticky top-20 sm:top-22 md:top-24 lg:top-25 w-full transition-all duration-700 ease-out ${visibleCards.includes(program.id || index)
                      ? "translate-y-0 opacity-100"
                      : "translate-y-16 opacity-0"
                    }`}
                  style={{ zIndex: index + 1 }}
                >
                  <div
                    className="flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-8 md:gap-10 lg:gap-15 xl:gap-20 2xl:gap-25 p-5 sm:p-6 md:p-8 lg:p-12 xl:p-20 2xl:p-25 rounded-3xl min-h-162.5 lg:min-h-0 shadow-lg"
                    style={{ backgroundColor: program.bg_color || '#ffffff' }}
                  >
                    {/* Left Content */}
                    <div className="w-full lg:w-1/2 flex flex-col justify-center">
                      {hasValue(program.title) && (
                        <h3 className="bricolage-grotesque font-600 text-[22px] sm:text-[26px] md:text-[30px] lg:text-[36px] xl:text-[40px] 2xl:text-[46px] text-[#080C14] leading-tight mb-3 sm:mb-4 md:mb-5">
                          {program.title.split('<br />').map((line, idx) => (
                            <React.Fragment key={idx}>
                              {line}
                              {idx !== program.title.split('<br />').length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </h3>
                      )}
                      {hasValue(descriptionHtml) && (
                        <div
                          className="bricolage-grotesque font-400 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[19px] 2xl:text-[20px] text-[#524B48] leading-relaxed line-clamp-5 sm:line-clamp-6 md:line-clamp-7 lg:line-clamp-8 xl:line-clamp-5 2xl:line-clamp-10"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHTML(truncatedDescription),
                          }}
                        />
                      )}
                      {hasValue(program.link) && (
                        <button
                          onClick={() => (window.location.href = program.link)}
                          className="mt-4 sm:mt-5 md:mt-6 bricolage-grotesque flex items-center gap-2 font-500 lg:font-600 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[19px] 2xl:text-[20px] text-[#009BE2] group hover:text-[#080C14] transition-colors duration-300 w-fit"
                        >
                          Read more
                          <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                        </button>
                      )}
                    </div>

                    {/* Right Image */}
                    <div className="w-full lg:w-1/2">
                      <img
                        src={getImageSrc(program)}
                        alt={program.title || 'Program image'}
                        className="w-full h-60 sm:h-75 md:h-85 lg:h-100 xl:h-120 2xl:h-150 object-cover rounded-3xl hover:scale-105 transition-transform duration-300"
                        onError={() => handleImageError(program.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-12 sm:h-16 md:h-20 lg:h-25 xl:h-30 2xl:h-50" />
        </>
      )}
    </section>
  );
};

export default OurProgramsSection;