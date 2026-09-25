// js/Sections/ContactOfficeSection/ContactOfficeSection.jsx

// React
import React from 'react';

// Icons
import { FaGraduationCap } from 'react-icons/fa';

// Skeleton primitives
import { Skeleton, SkeletonText } from '../../Shared/Skeletons/SkeletonPrimitives';

import { hasValue } from '../../utils/sectionHelpers';


// ============================================
// SKELETON: Single office card
// ============================================
const OfficeSkeletonCard = () => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12.5 shadow-sm">
    {/* Icon — 3xl → 4xl */}
    <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-md" />

    {/* Title */}
    <Skeleton className="h-5 sm:h-5.5 md:h-6 lg:h-6.5 w-2/3 mt-4 sm:mt-5 mb-3 sm:mb-4" />

    {/* Org name */}
    <Skeleton className="h-3.5 sm:h-4 w-3/4 mb-2" />

    {/* Address (2 lines) */}
    <SkeletonText
      lines={2}
      lineClassName="h-3.5 sm:h-4"
      className="mb-2"
    />

    {/* Phone */}
    <Skeleton className="h-3.5 sm:h-4 w-1/2 mb-2" />

    {/* Email */}
    <Skeleton className="h-3.5 sm:h-4 w-2/3" />
  </div>
);

// ============================================
// SKELETON: Full section (title + card grid)
// ============================================
const ContactOfficeSkeleton = ({ count = 3, hasTitle = true }) => (
  <>
    {/* Section Title */}
    {hasTitle && (
      <Skeleton className="h-7 sm:h-8 md:h-9 lg:h-10 xl:h-11 w-56 sm:w-64 md:w-72 mb-4 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-12.5" />
    )}

    {/* Cards grid — matches real: 1 / 2 / 3 cols */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <OfficeSkeletonCard key={`office-skeleton-${i}`} />
      ))}
    </div>
  </>
);

/**
 * ContactOfficeSection Component
 */
const ContactOfficeSection = ({
  data,
  officesData,
  offices,
  loading = false,               // ← NEW
  skeletonCount = 3,             // ← NEW
  title = 'Our Offices',
  orgName = 'Dwip Unnayan Songstha (DUS)',
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'contact-offices',
}) => {
  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <section
        id={sectionId}
        className={`${bgColor} ${sectionClassName}`}
      >
        <div className={`mx-auto ${paddingX} ${paddingY}`}>
          <ContactOfficeSkeleton
            count={skeletonCount}
            hasTitle={hasValue(title)}
          />
        </div>
      </section>
    );
  }

  // ============================================
  // RESOLVE DATA
  // ============================================
  let resolvedData = data || officesData || offices;
  if (!hasValue(resolvedData)) return null;

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  let officesArray = [];

  if (Array.isArray(resolvedData)) {
    officesArray = resolvedData;
  } else {
    if (resolvedData.data && typeof resolvedData.data === 'object') {
      if (Array.isArray(resolvedData.data)) {
        officesArray = resolvedData.data;
      } else {
        resolvedData = resolvedData.data;
      }
    }

    if (officesArray.length === 0) {
      if (Array.isArray(resolvedData.offices)) {
        officesArray = resolvedData.offices;
      } else if (Array.isArray(resolvedData.officeData)) {
        officesArray = resolvedData.officeData;
      } else {
        let foundOffices = false;
        for (const key in resolvedData) {
          if (Array.isArray(resolvedData[key]) && resolvedData[key].length > 0) {
            const firstItem = resolvedData[key][0];
            if (
              firstItem &&
              (firstItem.address ||
                firstItem.phones ||
                firstItem.emails ||
                firstItem.title)
            ) {
              officesArray = resolvedData[key];
              foundOffices = true;
              break;
            }
          }
        }
        if (!foundOffices) {
          console.warn('ContactOfficeSection - No offices array found in data');
        }
      }
    }
  }

  if (!hasValue(officesArray) || officesArray.length === 0) {
    console.warn('ContactOfficeSection - No offices to display');
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section id={sectionId} className={`${bgColor} ${sectionClassName}`}>
      <div className={`mx-auto ${paddingX} ${paddingY}`}>
        {hasValue(title) && (
          <h2 className="text-[#1D2566] font-bold text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] leading-tight pb-4 sm:pb-6 md:pb-8 lg:pb-10 xl:pb-12.5 text-center sm:text-left">
            {title}
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
          {officesArray.map((office, index) => (
            <div
              key={office.title || index}
              className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <FaGraduationCap className="text-3xl sm:text-4xl text-black" />

              {hasValue(office.title) && (
                <h3 className="text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] font-bold text-[#080C14] pt-4 sm:pt-5">
                  {office.title}
                </h3>
              )}

              <div className="space-y-1.5 sm:space-y-2 text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed text-[#444] mt-2 sm:mt-3">
                {hasValue(orgName) && (
                  <p className="font-semibold text-[#333333]">{orgName}</p>
                )}

                {hasValue(office.address) && (
                  <p className="flex flex-col sm:flex-row gap-0.5 sm:gap-2">
                    <span className="font-semibold text-[#333333] shrink-0">Address:</span>
                    <span>{office.address}</span>
                  </p>
                )}

                {hasValue(office.phones) && (
                  <p className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 flex-wrap">
                    <span className="font-semibold text-[#333333] shrink-0">Phone:</span>
                    <span>{office.phones}</span>
                  </p>
                )}

                {hasValue(office.emails) && office.emails.length > 0 && (
                  <p className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 flex-wrap">
                    <span className="font-semibold text-[#333333] shrink-0">E-mail:</span>
                    <span>
                      {office.emails.map((email, idx) => (
                        <span key={idx}>
                          {idx > 0 && <span>, </span>}
                          <a
                            href={`mailto:${email}`}
                            className="text-[#444] hover:text-[#009BE2] transition-colors break-all"
                          >
                            {email}
                          </a>
                        </span>
                      ))}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactOfficeSection;