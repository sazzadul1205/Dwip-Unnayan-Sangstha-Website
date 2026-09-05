// js/Sections/StoriesSection/StoriesSection.jsx

// React
import React, { useRef, useEffect, useState, useCallback } from 'react';

// Arrow Icon
import ArrowIcon from '../../Shared/ArrowIcon';

// Axios
import axios from 'axios';

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
 * Fetches blog posts from the API and displays them as stories.
 * Title and subtitle are controlled by the section config.
 * 
 * @param {Object} props
 * @param {Object} props.data - Section data containing title/subtitle and API config
 * @param {Object} props.storiesData - Legacy stories data (deprecated)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.apiEndpoint - API endpoint for fetching blogs (default: '/api/blogs')
 * @param {number} props.limit - Number of stories to show (default: 10)
 * 
 * @returns {JSX.Element} Rendered stories section
 */
const StoriesSection = ({
  data,           // From DynamicSectionRenderer
  storiesData,    // Legacy prop (deprecated)
  bgColor = 'bg-[#F5F5F5]',
  paddingY = 'py-12 sm:py-16 md:py-25 lg:py-37.5',
  sectionClassName = '',
  apiEndpoint = '/api/blogs',
  limit = 10,
}) => {
  // ============================================
  // HOOKS
  // ============================================
  const scrollContainerRef = useRef(null);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const isDraggingRef = useRef(false);

  const [dragging, setDragging] = useState(false);
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================
  // RESOLVE SECTION DATA
  // ============================================
  // Use data prop if available, fallback to storiesData
  let resolvedData = data || storiesData || {};

  // Check if data is wrapped in a 'data' property
  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  const {
    section = {},
    limit: configLimit,
    apiEndpoint: configApiEndpoint,
  } = resolvedData;

  // Use config values or fallback to props
  const effectiveLimit = configLimit || limit;
  const effectiveApiEndpoint = configApiEndpoint || apiEndpoint;

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasTitle = hasValue(section.title);
  const hasDescription = hasValue(section.description);

  // ============================================
  // FETCH STORIES FROM API
  // ============================================
  const fetchStories = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await axios.get(effectiveApiEndpoint, {
        params: {
          limit: effectiveLimit,
          format: 'react', // Get data in React-friendly format
        }
      });

      // Handle different response structures
      let blogs = [];

      if (response.data?.data?.data) {
        // Paginated response: { data: { data: [...], meta: {...} } }
        blogs = response.data.data.data;
      } else if (response.data?.data) {
        // Simple response: { data: [...] }
        blogs = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        blogs = response.data;
      } else if (response.data?.blogs) {
        // Nested blogs property
        blogs = response.data.blogs;
      }

      // Transform blogs to stories format
      const transformedStories = blogs.map((blog) => ({
        id: blog.id,
        image: blog.image || blog.featured_image || blog.thumbnail || '',
        title: blog.title || '',
        description: blog.excerpt || blog.description || '',
        date: blog.date || blog.published_at || blog.created_at || '',
        link: blog.link || `/blog/${blog.slug}`,
        slug: blog.slug,
        // Keep original blog data
        _blog: blog,
      }));

      setStories(transformedStories);
    } catch (err) {
      console.error('Failed to fetch stories:', err);

      // Fallback to legacy stories data if available
      if (resolvedData.stories && Array.isArray(resolvedData.stories)) {
        setStories(resolvedData.stories);
      }
    } finally {
      setIsLoading(false);
    }
  }, [effectiveApiEndpoint, effectiveLimit, resolvedData.stories]);

  // ============================================
  // FETCH ON MOUNT
  // ============================================
  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

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
  }, [isLoading]);

  // ============================================
  // HELPER: Determine gradient colors based on bgColor
  // ============================================
  const getGradientClass = (direction) => {
    const gradientMap = {
      'bg-[#F5F5F5]': {
        left: 'from-[#F5F5F5]',
        right: 'to-[#F5F5F5]'
      },
      'bg-white': {
        left: 'from-white',
        right: 'to-white'
      },
      'bg-gray-50': {
        left: 'from-gray-50',
        right: 'to-gray-50'
      },
      'bg-gray-100': {
        left: 'from-gray-100',
        right: 'to-gray-100'
      }
    };

    if (gradientMap[bgColor]) {
      return direction === 'left'
        ? gradientMap[bgColor].left
        : gradientMap[bgColor].right;
    }

    const colorMatch = bgColor.match(/bg-\[(#[0-9a-fA-F]+)\]/);
    if (colorMatch) {
      const color = colorMatch[1];
      return direction === 'left' ? `from-[${color}]` : `to-[${color}]`;
    }

    return direction === 'left' ? 'from-[#F5F5F5]' : 'to-[#F5F5F5]';
  };

  const leftGradientClass = getGradientClass('left');
  const rightGradientClass = getGradientClass('right');

  // ============================================
  // RENDER STATES
  // ============================================

  // Loading state
  if (isLoading) {
    return (
      <section className={`${bgColor} ${paddingY} ${sectionClassName}`}>
        <div className="text-center mx-auto px-5 sm:px-10 md:px-20 lg:px-50">
          {hasTitle && (
            <h3 className='bricolage-grotesque font-extrabold text-[32px] sm:text-[38px] md:text-[44px] lg:text-[50px] text-center text-[#080C14] pb-3 sm:pb-4 lg:pb-5'>
              {section.title}
            </h3>
          )}
          {hasDescription && (
            <p className='bricolage-grotesque font-400 text-[16px] sm:text-[18px] lg:text-[20px] mx-auto max-w-200 text-center text-[#515151] pb-8 sm:pb-10 lg:pb-15'>
              {section.description}
            </p>
          )}
        </div>
        <div data-frontend-loader="true" className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009BE2]" />
        </div>
      </section>
    );
  }

  // No stories state
  if (!isLoading && stories.length === 0) {
    return (
      <section className={`${bgColor} ${paddingY} ${sectionClassName}`}>
        <div className="text-center mx-auto px-5 sm:px-10 md:px-20 lg:px-50">
          {hasTitle && (
            <h3 className='bricolage-grotesque font-extrabold text-[32px] sm:text-[38px] md:text-[44px] lg:text-[50px] text-center text-[#080C14] pb-3 sm:pb-4 lg:pb-5'>
              {section.title}
            </h3>
          )}
          {hasDescription && (
            <p className='bricolage-grotesque font-400 text-[16px] sm:text-[18px] lg:text-[20px] mx-auto max-w-200 text-center text-[#515151] pb-8 sm:pb-10 lg:pb-15'>
              {section.description}
            </p>
          )}
        </div>
        <div className="text-center text-gray-400 py-10">
          <p className="text-lg">No stories available at the moment.</p>
          <p className="text-sm mt-2">Check back later for updates.</p>
        </div>
      </section>
    );
  }

  // ============================================
  // RENDER - With stories
  // ============================================
  return (
    <section
      id='stories'
      className={`${bgColor} ${paddingY} ${sectionClassName}`}
    >
      {/* Section Header */}
      {(hasTitle || hasDescription) && (
        <div className="text-center mx-auto px-5 sm:px-10 md:px-20 lg:px-50">
          {hasTitle && (
            <h3 className='bricolage-grotesque font-extrabold text-[32px] sm:text-[38px] md:text-[44px] lg:text-[50px] text-center text-[#080C14] pb-3 sm:pb-4 lg:pb-5'>
              {section.title}
            </h3>
          )}

          {hasDescription && (
            <p className='bricolage-grotesque font-400 text-[16px] sm:text-[18px] lg:text-[20px] mx-auto max-w-200 text-center text-[#515151] pb-8 sm:pb-10 lg:pb-15'>
              {section.description}
            </p>
          )}
        </div>
      )}

      {/* Stories Scroll Container */}
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
        {stories.map((story) => {
          // Format date
          let displayDate = story.date;
          if (displayDate && typeof displayDate === 'string') {
            try {
              const d = new Date(displayDate);
              if (!isNaN(d.getTime())) {
                displayDate = d.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }
            } catch (e) {
              console.error('Error formatting date:', e);
            }
          }

          return (
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
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = '/images/placeholder-image.jpg';
                  }}
                />
              )}

              <div className='p-3 sm:p-4 lg:p-5'>
                {/* Story Date */}
                {hasValue(displayDate) && (
                  <span className='text-[#009BE2] font-400 text-[12px] sm:text-[14px] lg:text-[16px] pb-1 sm:pb-2 block'>
                    {displayDate}
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
                {hasValue(story.link) && (
                  <a
                    href={story.link}
                    className="bricolage-grotesque text-[#009BE2] font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center gap-2 sm:gap-3 group hover:text-[#009BE2]/70 transition-all duration-300 whitespace-nowrap"
                  >
                    Read More
                    <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll hint indicator */}
      {stories.length > 0 && (
        <div className="relative mt-5 pointer-events-none hidden md:block">
          <div
            className={`absolute left-0 top-0 bottom-0 w-8 sm:w-10 lg:w-12 bg-linear-to-r ${leftGradientClass} to-transparent`}
          />
          <div
            className={`absolute right-0 top-0 bottom-0 w-8 sm:w-10 lg:w-12 bg-linear-to-l ${rightGradientClass} from-transparent`}
          />
        </div>
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