// resources/js/Sections/UpcomingEventsSection/UpcomingEventsSection.jsx

import React from 'react';
import { Link } from '@inertiajs/react';
import { CiLocationOn } from "react-icons/ci";

// Update this path to match your actual ArrowIcon location
import ArrowIcon from '../../components/Shared/ArrowIcon';

/**
 * Utility function to check if value exists
 */
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * UpcomingEventsSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Events data from API (from DynamicSectionRenderer)
 * @param {Object} props.eventsData - Events data from API (direct prop)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * 
 * @returns {JSX.Element} Rendered upcoming events section
 */
const UpcomingEventsSection = ({
  data,           // From DynamicSectionRenderer
  eventsData,     // Direct prop (legacy support)
  bgColor = 'bg-[#FFFFFF]',
  paddingY = 'py-12 sm:py-16 md:py-25 lg:py-37.5',
  paddingX = 'px-5 sm:px-10 md:px-20 lg:px-50',
  sectionClassName = '',
}) => {
  // ============================================
  // RESOLVE DATA
  // ============================================
  // Try multiple sources for the data
  let resolvedData = data || eventsData || {};

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  // Check if the data is wrapped in a 'data' property
  // This happens when the API returns { id, page_slug, section_key, data: { ... } }
  if (resolvedData && resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  // If resolvedData is still empty, try to check if it has the expected structure
  if (resolvedData && typeof resolvedData === 'object' && !hasValue(resolvedData)) {
    console.warn('UpcomingEventsSection - No data found, checking if data is in a different location');

    // Sometimes the data might be directly in the props as the component name
    // Check if the data is actually in the events prop directly
    if (data && typeof data === 'object' && Object.keys(data).length === 0) {
      console.warn('UpcomingEventsSection - data prop is empty object, this might indicate the data is being passed incorrectly');
    }
  }

  // ============================================
  // EARLY RETURN - No data
  // ============================================
  if (!hasValue(resolvedData)) {
    console.warn('UpcomingEventsSection - No valid data found, returning null');
    return null;
  }

  // ============================================
  // SAFE DESTRUCTURING WITH DEFAULTS
  // ============================================
  const { section = {}, image = {}, events = [] } = resolvedData;

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasTitle = hasValue(section.title);
  const hasDescription = hasValue(section.description);
  const hasButton = hasValue(section.button?.text);
  const hasImage = hasValue(image.src);
  const hasEvents = hasValue(events);
  const hasAnyContent = hasTitle || hasDescription || hasButton || hasImage || hasEvents;

  if (!hasAnyContent) {
    console.warn('UpcomingEventsSection - No content found, returning null');
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section id='upcoming-events' className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}>
      <div className='flex flex-col lg:flex-row justify-between gap-8 lg:gap-25'>
        {/* Left Section */}
        {(hasTitle || hasDescription || hasButton || hasImage) && (
          <div className='w-full lg:min-w-150 lg:w-auto'>
            <div className='gap-6'>
              {hasTitle && (
                <h1 className='bricolage-grotesque font-800 text-[32px] sm:text-[38px] md:text-[44px] lg:text-[50px] text-[#080C14] leading-tight'>
                  {section.title}
                </h1>
              )}
              {hasDescription && (
                <p className='text-[#515151] font-400 text-[16px] sm:text-[18px] lg:text-[20px] mt-3 sm:mt-4 lg:mt-5 leading-relaxed'>
                  {section.description}
                </p>
              )}
              {hasButton && (
                <Link
                  href={section.button?.link || '#'}
                  className="bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-5 sm:px-6 lg:px-7.5 py-3 sm:py-4 lg:py-5 font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center gap-2 sm:gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300 whitespace-nowrap mt-5 sm:mt-6 lg:mt-7.5"
                >
                  {section.button.text}
                  <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </Link>
              )}
            </div>
            {hasImage && (
              <img
                src={image.src}
                alt={image.alt || "Upcoming events"}
                className={`${image.className || ''} mt-8 sm:mt-10 lg:mt-15 rounded-2xl w-full h-auto lg:h-139.25 object-cover`}
              />
            )}
          </div>
        )}

        {/* Right Section - Events */}
        {hasEvents && (
          <div className='w-full space-y-5 sm:space-y-6 lg:space-y-7.5 mt-8 lg:mt-0'>
            {events.map((event) => (
              <div
                key={event.id}
                className='bg-[#F5F5F5] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 sm:gap-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer'
                onClick={() => {
                  if (event.link) {
                    window.location.href = event.link;
                  }
                }}
              >
                {hasValue(event.date) && (
                  <div className='w-full sm:w-46 bg-[#FFFFFF] rounded-2xl py-5 sm:py-8 px-2 text-center sm:min-w-50 group-hover:bg-[#009BE2] transition-colors duration-300'>
                    {hasValue(event.date.day) && (
                      <h3 className='text-[#080C14] font-800 text-[36px] sm:text-[44px] lg:text-[50px] group-hover:text-white transition-colors duration-300'>
                        {event.date.day}
                      </h3>
                    )}
                    {hasValue(event.date.month) && (
                      <h4 className='text-[#080C14] font-800 text-[36px] sm:text-[44px] lg:text-[50px] leading-tight group-hover:text-white transition-colors duration-300'>
                        {event.date.month}
                      </h4>
                    )}
                    {(hasValue(event.date.weekday) || hasValue(event.date.dayNumber) || hasValue(event.date.time)) && (
                      <p className='text-[#524B48] font-400 text-[12px] sm:text-[14px] lg:text-[16px] group-hover:text-white/90 transition-colors duration-300'>
                        {event.date.weekday && <span>{event.date.weekday}</span>}
                        {event.date.weekday && event.date.dayNumber && <span> . </span>}
                        {event.date.dayNumber && <span>{event.date.dayNumber}</span>}
                        {event.date.time && (
                          <>
                            {(event.date.weekday || event.date.dayNumber) && <span> </span>}
                            <span>{event.date.time}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}
                <div className='w-full p-3 sm:p-5'>
                  {hasValue(event.location) && (
                    <label className='flex items-center gap-1.5 text-[#524B48] font-400 text-[12px] sm:text-[14px] lg:text-[16px] mb-1 sm:mb-2'>
                      <CiLocationOn className="text-[#009BE2] text-[14px] sm:text-[16px]" />
                      {event.location}
                    </label>
                  )}
                  {hasValue(event.title) && (
                    <h3 className='text-[#080C14] font-600 text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] leading-tight sm:leading-10 line-clamp-2 mb-2 sm:mb-2.5'>
                      {event.title}
                    </h3>
                  )}
                  {hasValue(event.description) && (
                    <p className='text-[#524B48] font-400 text-[14px] sm:text-[16px] lg:text-[18px] mb-2 sm:mb-2.5 line-clamp-2'>
                      {event.description}
                    </p>
                  )}
                  <Link
                    href={event.link || '#'}
                    className="bricolage-grotesque text-[#009BE2] font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center gap-2 sm:gap-3 group/btn hover:text-[#009BE2]/70 transition-all duration-300 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Event
                    <ArrowIcon className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all duration-300" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingEventsSection;