// js/Sections/UpcomingEventsSection/UpcomingEventsSection.jsx

// Inertia
import React from 'react';
import { Link } from '@inertiajs/react';

// React Icons
import { CiLocationOn } from 'react-icons/ci';

// Shared
import ArrowIcon from '../../Shared/ArrowIcon';

// Skeleton primitives
import { Skeleton, SkeletonText } from '../../Shared/Skeletons/SkeletonPrimitives';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// ============================================
// SKELETON: Single event card
// ============================================
const EventSkeletonCard = () => (
  <div className="flex flex-col gap-4 rounded-2xl bg-[#F5F5F5] p-4 sm:gap-5 sm:p-5 md:flex-row">
    {/* Date block — matches real: white card, w-40→50 */}
    <div className="w-full shrink-0 rounded-2xl bg-white px-3 py-4 text-center sm:px-2 sm:py-6 md:w-40 md:min-w-40 lg:w-44 lg:min-w-44 lg:py-8 xl:w-48 xl:min-w-48 2xl:w-50 2xl:min-w-50">
      <div className="flex items-center justify-center gap-2 md:block">
        {/* Day */}
        <Skeleton className="h-9 sm:h-10 md:h-11 lg:h-12 2xl:h-13 w-14 sm:w-16 md:w-14 lg:w-16 2xl:w-18 mx-auto" />
        {/* Month */}
        <Skeleton className="h-8 sm:h-9 md:h-10 lg:h-11 2xl:h-12 w-16 sm:w-20 md:w-16 lg:w-20 2xl:w-22 mx-auto md:mt-1" />
      </div>
      {/* Weekday / time */}
      <Skeleton className="h-3 sm:h-3.5 lg:h-4 w-24 sm:w-28 mx-auto mt-2" />
    </div>

    {/* Details */}
    <div className="min-w-0 flex-1 p-2 sm:p-3 md:p-4 lg:p-5">
      {/* Location */}
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Skeleton className="h-4 w-4 rounded-full shrink-0" />
        <Skeleton className="h-3.5 w-32 sm:w-40" />
      </div>

      {/* Title (2 lines) */}
      <Skeleton className="h-6 sm:h-7 md:h-8 w-5/6 mb-2" />
      <Skeleton className="h-6 sm:h-7 md:h-8 w-3/5 mb-2.5 sm:mb-3" />

      {/* Description */}
      <SkeletonText lines={2} lineClassName="h-3.5 sm:h-4 lg:h-4.5" className="mb-2.5" />

      {/* View Event link */}
      <Skeleton className="h-4 w-28 sm:w-32" />
    </div>
  </div>
);

// ============================================
// SKELETON: Full section (left panel + N events)
// ============================================
const UpcomingEventsSkeleton = ({ eventCount = 3 }) => (
  <div className="flex flex-col gap-10 md:gap-12 xl:flex-row xl:justify-between xl:gap-16 2xl:gap-25">
    {/* Left panel */}
    <div className="w-full xl:w-[42%] xl:max-w-175 2xl:w-auto 2xl:min-w-150">
      <div className="flex flex-col">
        {/* Title (2 lines) */}
        <Skeleton className="h-9 sm:h-10 md:h-12 lg:h-13 xl:h-14 w-5/6 mb-3 sm:mb-4" />
        <Skeleton className="h-9 sm:h-10 md:h-12 lg:h-13 xl:h-14 w-3/5 mb-4 sm:mb-5 lg:mb-6" />

        {/* Description (2 lines) */}
        <SkeletonText lines={2} lineClassName="h-4 sm:h-4.5 lg:h-5" className="mb-5 lg:mb-6" />

        {/* Button */}
        <Skeleton className="h-12 sm:h-14 lg:h-15 w-40 sm:w-44 lg:w-48 rounded-md" />
      </div>

      {/* Image */}
      <Skeleton className="mt-8 sm:mt-10 lg:mt-15 w-full h-64 sm:h-80 md:h-100 lg:h-110 xl:h-120 2xl:h-139.25 rounded-2xl" />
    </div>

    {/* Right side — events list */}
    <div className="mt-0 w-full space-y-5 sm:space-y-6 lg:space-y-7.5 xl:w-[58%]">
      {Array.from({ length: eventCount }).map((_, i) => (
        <EventSkeletonCard key={`event-skeleton-${i}`} />
      ))}
    </div>
  </div>
);

/**
 * UpcomingEventsSection Component
 */
const UpcomingEventsSection = ({
  data,
  eventsData,
  loading = false,               // ← NEW
  skeletonEventCount = 3,        // ← NEW
  bgColor = 'bg-[#FFFFFF]',
  paddingY = 'py-12 sm:py-16 md:py-25 lg:py-30 xl:py-37.5',
  paddingX = 'px-5 sm:px-10 md:px-16 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
}) => {
  // Resolve data from multiple sources
  let resolvedData = data || eventsData || {};

  if (
    resolvedData &&
    resolvedData.data &&
    typeof resolvedData.data === 'object'
  ) {
    resolvedData = resolvedData.data;
  }

  const {
    section = {},
    image = {},
    events = [],
  } = resolvedData || {};

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <section
        id="upcoming-events"
        className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
      >
        <UpcomingEventsSkeleton eventCount={skeletonEventCount} />
      </section>
    );
  }

  // ============================================
  // EARLY RETURN — No data
  // ============================================
  if (!hasValue(resolvedData)) return null;

  const hasEvents = hasValue(events);
  const hasImage = hasValue(image.src);
  const hasTitle = hasValue(section.title);
  const hasButton = hasValue(section.button?.text);
  const hasDescription = hasValue(section.description);

  const hasAnyContent =
    hasTitle || hasDescription || hasButton || hasImage || hasEvents;

  if (!hasAnyContent) return null;

  const validEvents = events.filter(
    (event) =>
      hasValue(event.title) ||
      hasValue(event.description) ||
      hasValue(event.location)
  );

  const hasValidEvents = validEvents.length > 0;

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id="upcoming-events"
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      <div className="flex flex-col gap-10 md:gap-12 xl:flex-row xl:justify-between xl:gap-16 2xl:gap-25">
        {/* Left Section */}
        {(hasTitle || hasDescription || hasButton || hasImage) && (
          <div className="w-full xl:w-[42%] xl:max-w-175 2xl:w-auto 2xl:min-w-150">
            <div className="flex flex-col">
              {hasTitle && (
                <h1 className="bricolage-grotesque text-[32px] font-800 leading-tight text-[#080C14] sm:text-[38px] md:text-[44px] lg:text-[48px] xl:text-[50px]">
                  {section.title}
                </h1>
              )}

              {hasDescription && (
                <p className="mt-3 text-[16px] font-400 leading-relaxed text-[#515151] sm:mt-4 sm:text-[18px] lg:mt-5 lg:text-[20px]">
                  {section.description}
                </p>
              )}

              {hasButton && (
                <Link
                  href={section.button?.link || '#'}
                  className="bricolage-grotesque mt-5 inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-md border border-[#009BE2] px-5 py-3 text-[14px] font-600 text-[#009BE2] transition-all duration-300 hover:bg-[#009BE2] hover:text-white sm:mt-6 sm:gap-3 sm:px-6 sm:py-4 sm:text-[15px] lg:mt-7.5 lg:px-7.5 lg:py-5 lg:text-[16px]"
                >
                  {section.button.text}
                  <ArrowIcon className="transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              )}
            </div>

            {hasImage && (
              <img
                src={image.src}
                alt={image.alt || 'Upcoming events'}
                className={`${image.className || ''} mt-8 h-auto w-full rounded-2xl object-cover sm:mt-10 lg:mt-15 xl:h-120 2xl:h-139.25`}
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* Right Section — Events */}
        {hasValidEvents && (
          <div className="mt-0 w-full space-y-5 sm:space-y-6 lg:space-y-7.5 xl:w-[58%]">
            {validEvents.map((event) => {
              const hasEventDate = hasValue(event.date);
              const hasEventLocation = hasValue(event.location);
              const hasEventTitle = hasValue(event.title);
              const hasEventDescription = hasValue(event.description);
              const hasEventLink = hasValue(event.link);

              return (
                <div
                  key={event.id}
                  className="group flex cursor-pointer flex-col gap-4 rounded-2xl bg-[#F5F5F5] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:gap-5 sm:p-5 md:flex-row"
                  onClick={() => {
                    if (hasEventLink) window.location.href = event.link;
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && hasEventLink) {
                      window.location.href = event.link;
                    }
                  }}
                >
                  {hasEventDate && (
                    <div className="w-full shrink-0 rounded-2xl bg-[#FFFFFF] px-3 py-4 text-center transition-colors duration-300 group-hover:bg-[#009BE2] sm:px-2 sm:py-6 md:w-40 md:min-w-40 lg:w-44 lg:min-w-44 lg:py-8 xl:w-48 xl:min-w-48 2xl:w-50 2xl:min-w-50">
                      <div className="flex items-center justify-center gap-2 md:block">
                        {hasValue(event.date.day) && (
                          <h3 className="text-[36px] font-800 leading-none text-[#080C14] transition-colors duration-300 group-hover:text-white sm:text-[42px] md:text-[44px] lg:text-[48px] 2xl:text-[50px]">
                            {event.date.day}
                          </h3>
                        )}

                        {hasValue(event.date.month) && (
                          <h4 className="text-[30px] font-800 leading-tight text-[#080C14] transition-colors duration-300 group-hover:text-white sm:text-[38px] md:text-[42px] lg:text-[46px] 2xl:text-[50px]">
                            {event.date.month}
                          </h4>
                        )}
                      </div>

                      {(hasValue(event.date.weekday) || hasValue(event.date.time)) && (
                        <p className="mt-1 text-[12px] font-400 text-[#524B48] transition-colors duration-300 group-hover:text-white/90 sm:text-[14px] lg:text-[16px]">
                          {hasValue(event.date.weekday) && <span>{event.date.weekday}</span>}
                          {hasValue(event.date.weekday) && hasValue(event.date.time) && (
                            <span> . </span>
                          )}
                          {hasValue(event.date.time) && <span>{event.date.time}</span>}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 p-2 sm:p-3 md:p-4 lg:p-5">
                    {hasEventLocation && (
                      <label className="mb-1 flex items-center gap-1.5 text-[12px] font-400 text-[#524B48] sm:mb-2 sm:text-[14px] lg:text-[16px]">
                        <CiLocationOn className="shrink-0 text-[14px] text-[#009BE2] sm:text-[16px]" />
                        <span className="truncate">{event.location}</span>
                      </label>
                    )}

                    {hasEventTitle && (
                      <h3 className="mb-2 line-clamp-2 text-[20px] font-600 leading-tight text-[#080C14] sm:mb-2.5 sm:text-[24px] md:text-[28px] lg:text-[30px] xl:text-[32px] xl:leading-10">
                        {event.title}
                      </h3>
                    )}

                    {hasEventDescription && (
                      <p className="mb-2 line-clamp-2 text-[14px] font-400 text-[#524B48] sm:mb-2.5 sm:text-[16px] lg:text-[18px]">
                        {event.description}
                      </p>
                    )}

                    <Link
                      href={event.link || '#'}
                      className="bricolage-grotesque inline-flex items-center gap-2 whitespace-nowrap text-[14px] font-600 text-[#009BE2] transition-all duration-300 hover:text-[#009BE2]/70 sm:gap-3 sm:text-[15px] lg:text-[16px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Event
                      <ArrowIcon className="transition-all duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingEventsSection;