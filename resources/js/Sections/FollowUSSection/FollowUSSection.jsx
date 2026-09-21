// js/Sections/FollowUSSection/FollowUSSection.jsx

// React
import React from 'react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

// Skeleton primitives
import { Skeleton } from '../../Shared/Skeletons/SkeletonPrimitives';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Icon mapping
const iconMapping = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  youtube: FaYoutube,
  twitter: FaXTwitter,
  x: FaXTwitter,
};

// ============================================
// SKELETON: Single social cell
// Matches real cell padding + border rules
// ============================================
const SocialSkeletonCell = ({ isLast, index, total }) => (
  <div
    className={`
      flex items-center justify-center
      py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 2xl:py-22.5
      px-4 sm:px-6 lg:px-20 xl:px-25 2xl:px-30
      ${!isLast && 'border-r border-[#EFEFEF]'}
      ${index < total - 2 && 'border-b border-[#EFEFEF]'}
      ${(index === 2 || index === 3) && 'sm:border-b-0 md:border-b'}
      ${index === 4 && 'md:border-b-0'}
    `}
    aria-busy="true"
  >
    <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-16.5 lg:h-16.5 rounded-md" />
  </div>
);

// ============================================
// SKELETON: Full section
// ============================================
const FollowUSSkeleton = ({ count = 5, hasTitle = true }) => (
  <>
    {hasTitle && (
      <Skeleton className="h-7 sm:h-8 md:h-9 lg:h-10 xl:h-11 w-40 sm:w-48 md:w-56 mb-4 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-12.5" />
    )}

    {/* Grid — matches real: 2 / 3 / 5 cols */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border border-[#EFEFEF] bg-white rounded-lg overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <SocialSkeletonCell
          key={`social-skeleton-${i}`}
          index={i}
          total={count}
          isLast={i === count - 1}
        />
      ))}
    </div>
  </>
);

/**
 * FollowUSSection Component
 */
const FollowUSSection = ({
  data,
  followData,
  socialItems = [],
  loading = false,               // ← NEW
  skeletonCount = 5,             // ← NEW
  title = 'Follow Us',
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'follow-us',
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
        <div className={`${paddingX} ${paddingY}`}>
          <FollowUSSkeleton count={skeletonCount} hasTitle={hasValue(title)} />
        </div>
      </section>
    );
  }

  // ============================================
  // RESOLVE DATA
  // ============================================
  let resolvedData = data || followData;

  let socialItemsArray = socialItems;
  let resolvedTitle = title;

  if (hasValue(resolvedData)) {
    if (resolvedData.data && typeof resolvedData.data === 'object') {
      resolvedData = resolvedData.data;
    }

    if (Array.isArray(resolvedData)) {
      socialItemsArray = resolvedData;
    } else if (typeof resolvedData === 'object') {
      if (Array.isArray(resolvedData.socialItems)) {
        socialItemsArray = resolvedData.socialItems;
      } else if (Array.isArray(resolvedData.items)) {
        socialItemsArray = resolvedData.items;
      } else if (Array.isArray(resolvedData.social)) {
        socialItemsArray = resolvedData.social;
      }

      if (hasValue(resolvedData.title)) {
        resolvedTitle = resolvedData.title;
      }
    }
  }

  if (!hasValue(socialItemsArray) || socialItemsArray.length === 0) {
    return null;
  }

  // ============================================
  // HELPERS
  // ============================================
  const renderIcon = (iconName) => {
    const IconComponent = iconMapping[iconName?.toLowerCase()];
    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found in mapping`);
      return null;
    }
    return (
      <IconComponent className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-16.5 lg:h-16.5" />
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <section id={sectionId} className={`${bgColor} ${sectionClassName}`}>
      <div className={`${paddingX} ${paddingY}`}>
        {hasValue(resolvedTitle) && (
          <h2 className="text-[#1D2566] font-bold text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] leading-tight pb-4 sm:pb-6 md:pb-8 lg:pb-10 xl:pb-12.5 text-center sm:text-left">
            {resolvedTitle}
          </h2>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border border-[#EFEFEF] bg-white rounded-lg overflow-hidden">
          {socialItemsArray.map((item, index) => {
            const isLastItem = index === socialItemsArray.length - 1;

            return (
              <a
                key={item.label || index}
                href={item.url || '#'}
                target={item.url?.startsWith('http') ? '_blank' : '_self'}
                rel={item.url?.startsWith('http') ? 'noopener noreferrer' : ''}
                aria-label={item.label}
                className={`
                  flex items-center justify-center 
                  py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 2xl:py-22.5 
                  px-4 sm:px-6 lg:px-20 xl:px-25 2xl:px-30 
                  text-[#1D2566] transition-all duration-300 hover:bg-[#F7F8FC] hover:scale-105
                  ${!isLastItem && 'border-r border-[#EFEFEF]'}
                  ${index < socialItemsArray.length - 2 && 'border-b border-[#EFEFEF]'}
                  ${(index === 2 || index === 3) && 'sm:border-b-0 md:border-b'}
                  ${index === 4 && 'md:border-b-0'}
                `}
              >
                {renderIcon(item.icon)}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FollowUSSection;