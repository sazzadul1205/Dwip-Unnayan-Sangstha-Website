// js/Sections/FollowUSSection/FollowUSSection.jsx

// React
import React from 'react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

// Utility function to check if value exists (SAME as other sections)
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Icon mapping object for server-side data
const iconMapping = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  youtube: FaYoutube,
  twitter: FaXTwitter,
  x: FaXTwitter,
};

/**
 * FollowUSSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Follow us data from API (from DynamicSectionRenderer)
 * @param {Object} props.followData - Follow us data from API (direct prop - legacy)
 * @param {Array} props.socialItems - Social items array (direct prop - legacy)
 * @param {string} props.title - Section title (default: "Follow Us")
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'follow-us')
 * 
 * @returns {JSX.Element} Rendered follow us section
 */
const FollowUSSection = ({
  data,           // From DynamicSectionRenderer
  followData,     // Direct prop (legacy support)
  socialItems = [],
  title = "Follow Us",
  bgColor = 'bg-white',
  paddingY = 'py-10 sm:py-14 lg:py-37.5',
  paddingX = 'px-4 sm:px-6 lg:px-8 xl:px-50',
  sectionClassName = '',
  sectionId = 'follow-us',
}) => {
  // ============================================
  // RESOLVE DATA
  // ============================================
  // Use data prop if available, fallback to followData or socialItems
  let resolvedData = data || followData;

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  let socialItemsArray = socialItems;
  let resolvedTitle = title;

  if (hasValue(resolvedData)) {
    // Check if the data is wrapped in a 'data' property
    if (resolvedData.data && typeof resolvedData.data === 'object') {
      resolvedData = resolvedData.data;
    }

    // If resolvedData is an array, use it as social items
    if (Array.isArray(resolvedData)) {
      socialItemsArray = resolvedData;
    } else if (typeof resolvedData === 'object') {
      // If resolvedData is an object with social items
      if (Array.isArray(resolvedData.socialItems)) {
        socialItemsArray = resolvedData.socialItems;
      } else if (Array.isArray(resolvedData.items)) {
        socialItemsArray = resolvedData.items;
      } else if (Array.isArray(resolvedData.social)) {
        socialItemsArray = resolvedData.social;
      }

      // Extract title if available
      if (hasValue(resolvedData.title)) {
        resolvedTitle = resolvedData.title;
      }
    }
  }

  // ============================================
  // EARLY RETURN - No data
  // ============================================
  if (!hasValue(socialItemsArray) || socialItemsArray.length === 0) {
    return null;
  }

  // ============================================
  // HELPERS
  // ============================================
  // Render function to get icon component
  const renderIcon = (iconName) => {
    const IconComponent = iconMapping[iconName?.toLowerCase()];
    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found in mapping`);
      return null;
    }
    return <IconComponent className="text-[66px]" />;
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`${bgColor} ${sectionClassName}`}
    >
      <div className={`${paddingX} ${paddingY}`}>
        {hasValue(resolvedTitle) && (
          <h2 className="text-[#1D2566] font-bold text-[28px] sm:text-[32px] lg:text-[36px] leading-tight pb-6 sm:pb-8 lg:pb-12.5 text-center sm:text-left">
            {resolvedTitle}
          </h2>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border border-[#EFEFEF] bg-white rounded-lg overflow-hidden">
          {socialItemsArray.map((item, index) => (
            <a
              key={item.label || index}
              href={item.url || '#'}
              target={item.url?.startsWith('http') ? '_blank' : '_self'}
              rel={item.url?.startsWith('http') ? 'noopener noreferrer' : ''}
              aria-label={item.label}
              className={`flex items-center justify-center py-12 sm:py-16 lg:py-22.5 px-4 sm:px-6 lg:px-30 text-[#1D2566] transition-all duration-300 hover:bg-[#F7F8FC] hover:scale-105 ${index !== socialItemsArray.length - 1 &&
                (index % 2 === 0 || (index % 2 === 1 && index < socialItemsArray.length - 1))
                ? 'border-r border-[#EFEFEF]'
                : ''
                } ${index < socialItemsArray.length - 2 && index % 2 === 0
                  ? 'border-b border-[#EFEFEF] md:border-b-0'
                  : index < socialItemsArray.length - 1 && index % 2 === 1 && socialItemsArray.length > 2
                    ? 'border-b border-[#EFEFEF] md:border-b-0'
                    : ''
                } ${index % 2 === 1 && index !== socialItemsArray.length - 1
                  ? 'border-r-0 sm:border-r md:border-r border-[#EFEFEF]'
                  : ''
                }`}
            >
              {renderIcon(item.icon)}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FollowUSSection;