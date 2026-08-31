// resources/js/Sections/UpcomingEventsSection/UpcomingEventsSection.jsx

// Inertia
import React from 'react';
import { Link } from '@inertiajs/react';

// React Icons
import { CiLocationOn } from 'react-icons/ci';

// Shared
import ArrowIcon from '../../Shared/ArrowIcon';

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
 */
const UpcomingEventsSection = ({
  data,
  eventsData,
  bgColor = 'bg-[#FFFFFF]',
  paddingY = 'py-12 sm:py-16 md:py-25 lg:py-30 xl:py-37.5',
  paddingX = 'px-5 sm:px-10 md:px-16 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
}) => {
  // Resolve data from multiple sources
  let resolvedData = data || eventsData || {};

  // Normalize data structure
  if (
    resolvedData &&
    resolvedData.data &&
    typeof resolvedData.data === 'object'
  ) {
    resolvedData = resolvedData.data;
  }

  // Early return if no data
  if (!hasValue(resolvedData)) {
    return null;
  }

  // Section data
  const {
    section = {},
    image = {},
    events = [],
  } = resolvedData;

  // Content checks
  const hasEvents = hasValue(events);
  const hasImage = hasValue(image.src);
  const hasTitle = hasValue(section.title);
  const hasButton = hasValue(section.button?.text);
  const hasDescription = hasValue(section.description);

  const hasAnyContent =
    hasTitle ||
    hasDescription ||
    hasButton ||
    hasImage ||
    hasEvents;

  // If no content, don't render the section
  if (!hasAnyContent) {
    return null;
  }

  // Filter out events that have no meaningful content
  const validEvents = events.filter(
    (event) =>
      hasValue(event.title) ||
      hasValue(event.description) ||
      hasValue(event.location),
  );

  const hasValidEvents = validEvents.length > 0;

  return (
    <section
      id="upcoming-events"
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      <div className="flex flex-col gap-10 md:gap-12 xl:flex-row xl:justify-between xl:gap-16 2xl:gap-25">
        {/* =========================================================
                    Left Section
                ========================================================== */}
        {(hasTitle ||
          hasDescription ||
          hasButton ||
          hasImage) && (
            <div className="w-full xl:w-[42%] xl:max-w-175 2xl:w-auto 2xl:min-w-150">
              <div className="flex flex-col">
                {/* Title */}
                {hasTitle && (
                  <h1 className="bricolage-grotesque text-[32px] font-800 leading-tight text-[#080C14] sm:text-[38px] md:text-[44px] lg:text-[48px] xl:text-[50px]">
                    {section.title}
                  </h1>
                )}

                {/* Description */}
                {hasDescription && (
                  <p className="mt-3 text-[16px] font-400 leading-relaxed text-[#515151] sm:mt-4 sm:text-[18px] lg:mt-5 lg:text-[20px]">
                    {section.description}
                  </p>
                )}

                {/* Button */}
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

              {/* Image */}
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

        {/* =========================================================
                    Right Section - Events
                ========================================================== */}
        {hasValidEvents && (
          <div className="mt-0 w-full space-y-5 sm:space-y-6 lg:space-y-7.5 xl:w-[58%]">
            {validEvents.map((event) => {
              const hasEventDate = hasValue(event.date);
              const hasEventLocation = hasValue(event.location);
              const hasEventTitle = hasValue(event.title);
              const hasEventDescription = hasValue(
                event.description,
              );
              const hasEventLink = hasValue(event.link);

              return (
                <div
                  key={event.id}
                  className="group flex cursor-pointer flex-col gap-4 rounded-2xl bg-[#F5F5F5] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:gap-5 sm:p-5 md:flex-row"
                  onClick={() => {
                    if (hasEventLink) {
                      window.location.href = event.link;
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      hasEventLink
                    ) {
                      window.location.href =
                        event.link;
                    }
                  }}
                >
                  {/* =================================================
                                        Event Date
                                    ================================================== */}
                  {hasEventDate && (
                    <div className="w-full shrink-0 rounded-2xl bg-[#FFFFFF] px-3 py-4 text-center transition-colors duration-300 group-hover:bg-[#009BE2] sm:px-2 sm:py-6 md:w-40 md:min-w-40 lg:w-44 lg:min-w-44 lg:py-8 xl:w-48 xl:min-w-48 2xl:w-50 2xl:min-w-50">
                      {/* Date */}
                      <div className="flex items-center justify-center gap-2 md:block">
                        {/* Day */}
                        {hasValue(
                          event.date.day,
                        ) && (
                            <h3 className="text-[36px] font-800 leading-none text-[#080C14] transition-colors duration-300 group-hover:text-white sm:text-[42px] md:text-[44px] lg:text-[48px] 2xl:text-[50px]">
                              {event.date.day}
                            </h3>
                          )}

                        {/* Month */}
                        {hasValue(
                          event.date.month,
                        ) && (
                            <h4 className="text-[30px] font-800 leading-tight text-[#080C14] transition-colors duration-300 group-hover:text-white sm:text-[38px] md:text-[42px] lg:text-[46px] 2xl:text-[50px]">
                              {event.date.month}
                            </h4>
                          )}
                      </div>

                      {/* Weekday / Time */}
                      {(hasValue(
                        event.date.weekday,
                      ) ||
                        hasValue(
                          event.date.time,
                        )) && (
                          <p className="mt-1 text-[12px] font-400 text-[#524B48] transition-colors duration-300 group-hover:text-white/90 sm:text-[14px] lg:text-[16px]">
                            {hasValue(
                              event.date.weekday,
                            ) && (
                                <span>
                                  {
                                    event.date
                                      .weekday
                                  }
                                </span>
                              )}

                            {hasValue(
                              event.date.weekday,
                            ) &&
                              hasValue(
                                event.date.time,
                              ) && (
                                <span>
                                  {' '}
                                  .{' '}
                                </span>
                              )}

                            {hasValue(
                              event.date.time,
                            ) && (
                                <span>
                                  {
                                    event.date
                                      .time
                                  }
                                </span>
                              )}
                          </p>
                        )}
                    </div>
                  )}

                  {/* =================================================
                                        Event Details
                                    ================================================== */}
                  <div className="min-w-0 flex-1 p-2 sm:p-3 md:p-4 lg:p-5">
                    {/* Location */}
                    {hasEventLocation && (
                      <label className="mb-1 flex items-center gap-1.5 text-[12px] font-400 text-[#524B48] sm:mb-2 sm:text-[14px] lg:text-[16px]">
                        <CiLocationOn className="shrink-0 text-[14px] text-[#009BE2] sm:text-[16px]" />

                        <span className="truncate">
                          {event.location}
                        </span>
                      </label>
                    )}

                    {/* Title */}
                    {hasEventTitle && (
                      <h3 className="mb-2 line-clamp-2 text-[20px] font-600 leading-tight text-[#080C14] sm:mb-2.5 sm:text-[24px] md:text-[28px] lg:text-[30px] xl:text-[32px] xl:leading-10">
                        {event.title}
                      </h3>
                    )}

                    {/* Description */}
                    {hasEventDescription && (
                      <p className="mb-2 line-clamp-2 text-[14px] font-400 text-[#524B48] sm:mb-2.5 sm:text-[16px] lg:text-[18px]">
                        {event.description}
                      </p>
                    )}

                    {/* View Event */}
                    <Link
                      href={event.link || '#'}
                      className="bricolage-grotesque inline-flex items-center gap-2 whitespace-nowrap text-[14px] font-600 text-[#009BE2] transition-all duration-300 hover:text-[#009BE2]/70 sm:gap-3 sm:text-[15px] lg:text-[16px]"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
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