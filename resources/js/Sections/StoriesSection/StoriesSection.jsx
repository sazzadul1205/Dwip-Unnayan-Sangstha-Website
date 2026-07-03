// js/Sections/StoriesSection/StoriesSection.jsx

// React
import React, { useRef, useEffect, useState } from 'react';

// Arrow Icon
import ArrowIcon from '../../components/Shared/ArrowIcon';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * StoriesSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Stories data from API (from DynamicSectionRenderer)
 * @param {Object} props.storiesData - Stories data from API (direct prop)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * 
 * @returns {JSX.Element} Rendered stories section
 */
const StoriesSection = ({
  data,           // From DynamicSectionRenderer
  storiesData,    // Direct prop (legacy support)
  bgColor = 'bg-[#F5F5F5]',
  paddingY = 'py-12 sm:py-16 md:py-25 lg:py-37.5',
  sectionClassName = '',
}) => {
  // ============================================
  // HOOKS - Must be called unconditionally
  // ============================================
  // Refs for DOM elements and drag state
  const scrollContainerRef = useRef(null);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const isDraggingRef = useRef(false);

  // State only for cursor styling (triggers re-render)
  const [dragging, setDragging] = useState(false);

  // ============================================
  // RESOLVE DATA
  // ============================================
  // Use data prop if available, fallback to storiesData
  let resolvedData = data || storiesData;

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  // Check if the data is wrapped in a 'data' property
  // This happens when the API returns { id, page_slug, section_key, data: { ... } }
  if (resolvedData && resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  // ============================================
  // SAFE DESTRUCTURING WITH DEFAULTS
  // ============================================
  const {
    section = {},
    stories = []
  } = resolvedData || {};

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasTitle = hasValue(section.title);
  const hasDescription = hasValue(section.description);
  const hasStories = hasValue(stories);

  const hasAnyContent = hasTitle || hasDescription || hasStories;

  // ============================================
  // EFFECT: Set up drag-to-scroll event listeners
  // ============================================
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // --- Mouse Event Handlers ---
    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      setDragging(true);

      startX.current = e.pageX - container.offsetLeft;
      scrollLeftStart.current = container.scrollLeft;
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      container.scrollLeft = scrollLeftStart.current - walk;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      setDragging(false);
    };

    const onMouseLeave = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setDragging(false);
      }
    };

    // --- Touch Event Handlers ---
    const onTouchStart = (e) => {
      if (e.touches.length) {
        isDraggingRef.current = true;
        setDragging(true);
        startX.current = e.touches[0].pageX - container.offsetLeft;
        scrollLeftStart.current = container.scrollLeft;
      }
    };

    const onTouchMove = (e) => {
      if (!isDraggingRef.current || !e.touches.length) return;
      e.preventDefault();
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      container.scrollLeft = scrollLeftStart.current - walk;
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      setDragging(false);
    };

    // --- Attach Event Listeners ---
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);

    // --- Cleanup ---
    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // ============================================
  // EARLY RETURN - No data or content
  // ============================================
  // Move early returns after all hooks
  if (!hasValue(resolvedData) || !hasAnyContent) {
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id='stories'
      className={`${bgColor} ${paddingY} ${sectionClassName}`}
    >
      {/* Section Header - Only show if title or description exists */}
      {(hasTitle || hasDescription) && (
        <div className="text-center mx-auto px-5 sm:px-10 md:px-20 lg:px-50">
          {/* Section Title */}
          {hasTitle && (
            <h3 className='bricolage-grotesque font-extrabold text-[32px] sm:text-[38px] md:text-[44px] lg:text-[50px] text-center text-[#080C14] pb-3 sm:pb-4 lg:pb-5'>
              {section.title}
            </h3>
          )}

          {/* Section Description */}
          {hasDescription && (
            <p className='bricolage-grotesque font-400 text-[16px] sm:text-[18px] lg:text-[20px] mx-auto max-w-200 text-center text-[#515151] pb-8 sm:pb-10 lg:pb-15'>
              {section.description}
            </p>
          )}
        </div>
      )}

      {/* Stories Scroll Container - Only show if stories exist */}
      {hasStories && (
        <>
          <div
            ref={scrollContainerRef}
            className={`
              flex overflow-x-auto gap-5 sm:gap-8 lg:gap-10 px-5 sm:px-10 md:px-20 lg:px-50 scroll-smooth w-full
              ${dragging ? 'cursor-grabbing select-none' : 'cursor-grab'}
              hide-scrollbar
            `}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {stories.map((story) => (
              <div
                key={story.id}
                className='bg-[#FFFFFF] p-4 sm:p-5 lg:p-7.5 w-70 sm:w-[320px] md:w-100 lg:w-137.5 rounded-xl shrink-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1'
              >
                {/* Story Image */}
                {hasValue(story.image) && (
                  <img
                    src={story.image}
                    alt={story.title || "Story image"}
                    className='h-48 sm:h-56 md:h-72 lg:h-86.75 rounded-2xl mx-auto object-cover w-full'
                  />
                )}

                <div className='p-3 sm:p-4 lg:p-5'>
                  {/* Story Date */}
                  {hasValue(story.date) && (
                    <span className='text-[#009BE2] font-400 text-[12px] sm:text-[14px] lg:text-[16px] pb-1 sm:pb-2 block'>
                      {story.date}
                    </span>
                  )}

                  {/* Story Title */}
                  {hasValue(story.title) && (
                    <h3 className='text-[#080C14] font-600 text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] leading-snug mb-3 sm:mb-4 lg:mb-5 line-clamp-2'>
                      {story.title}
                    </h3>
                  )}

                  {/* Story Description */}
                  {hasValue(story.description) && (
                    <p className="bricolage-grotesque font-400 text-[14px] sm:text-[16px] lg:text-[20px] text-[#524B48] leading-relaxed line-clamp-4 sm:line-clamp-5 mb-3 sm:mb-4 lg:mb-5">
                      {story.description}
                    </p>
                  )}

                  {/* Read More Button */}
                  <button
                    onClick={() => {
                      if (story.link) {
                        window.location.href = story.link;
                      }
                    }}
                    className="bricolage-grotesque text-[#009BE2] font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center gap-2 sm:gap-3 group hover:text-[#009BE2]/70 transition-all duration-300 whitespace-nowrap"
                  >
                    Read More
                    <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll hint indicator - Only show if there are stories */}
          <div className="relative mt-5 pointer-events-none hidden md:block">
            <div className={`absolute left-0 top-0 bottom-0 w-8 sm:w-10 lg:w-12 bg-linear-to-r from-${bgColor.replace('bg-', '')} to-transparent`} />
            <div className={`absolute right-0 top-0 bottom-0 w-8 sm:w-10 lg:w-12 bg-linear-to-l from-${bgColor.replace('bg-', '')} to-transparent`} />
          </div>
        </>
      )}

      {/* Hide scrollbar globally for this component */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default StoriesSection;