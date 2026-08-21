// js/Sections/ContactReachSection/ContactReachSection.jsx

// React
import React, { useState } from 'react';

// Components
import ArrowIcon from '../../Shared/ArrowIcon';

// Utility function to check if value exists (SAME as other sections)
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Generate placeholder image URL
const getPlaceholderImage = (width = 800, height = 600, text = 'Contact Us') => {
  return `https://via.placeholder.com/${width}x${height}/1500FF/FFFFFF?text=${encodeURIComponent(text)}`;
};

/**
 * ContactReachSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Contact reach data from API (from DynamicSectionRenderer)
 * @param {Object} props.reachData - Contact reach data from API (direct prop - legacy)
 * @param {string} props.image - Image URL (direct prop - legacy)
 * @param {string} props.title - Section title (default: "Reach out to us today!")
 * @param {string} props.buttonText - Submit button text (default: "Submit Message")
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'contact-reach')
 * 
 * @returns {JSX.Element} Rendered contact reach section
 */
const ContactReachSection = ({
  data,           // From DynamicSectionRenderer
  reachData,      // Direct prop (legacy support)
  image,          // Direct prop (legacy support)
  title = "Reach out to us today!",
  buttonText = "Submit Message",
  bgColor = 'bg-[#F5F5F5]',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'contact-reach',
}) => {
  // ============================================
  // HOOKS - Must be called at the top level
  // ============================================
  const [imageError, setImageError] = useState(false);

  // ============================================
  // RESOLVE DATA
  // ============================================
  // Use data prop if available, fallback to reachData or direct image prop
  let resolvedData = data || reachData;

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  let resolvedImage = image;
  let resolvedTitle = title;
  let resolvedButtonText = buttonText;

  if (hasValue(resolvedData)) {
    // Check if the data is wrapped in a 'data' property
    if (resolvedData.data && typeof resolvedData.data === 'object') {
      resolvedData = resolvedData.data;
    }

    // Extract values from resolved data
    if (hasValue(resolvedData.image)) {
      resolvedImage = resolvedData.image;
    }
    if (hasValue(resolvedData.title)) {
      resolvedTitle = resolvedData.title;
    }
    if (hasValue(resolvedData.buttonText)) {
      resolvedButtonText = resolvedData.buttonText;
    }
  }

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const hasImage = hasValue(resolvedImage);
  const usePlaceholder = !hasImage || imageError;

  // Get image source
  const imageSrc = usePlaceholder
    ? getPlaceholderImage(800, 600, resolvedTitle || 'Contact Us')
    : resolvedImage;

  // Get image alt text
  const imageAlt = 'Contact Reach';

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // ============================================
  // INPUT CLASS NAME
  // ============================================
  const inputClassName =
    'mt-1.5 sm:mt-2 w-full rounded-xl border border-[#D6DCEF] bg-white px-4 sm:px-5 py-3 sm:py-4 text-[14px] sm:text-[15px] md:text-[16px] text-[#080C14] outline-none transition-colors placeholder:text-[#A6B0D1] focus:border-[#009BE2]';

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`text-black flex flex-col lg:flex-row justify-center items-stretch ${bgColor} ${sectionClassName}`}
    >
      {/* Left Image Section - Full height on desktop */}
      <div className=' w-full lg:w-1/2 relative min-h-50 sm:min-h-62.5 md:min-h-75 lg:min-h-100 xl:min-h-125'>
        <img
          src={imageSrc}
          alt={imageAlt}
          className='w-full h-full object-cover lg:max-h-none max-h-64 sm:max-h-80 md:max-h-100'
          onError={handleImageError}
        />
        {/* Gradient Overlay */}
        <div className='absolute inset-0 bg-linear-to-b from-[#1500FF] via-[#6F07E5] to-[#F10A0A] opacity-40 sm:opacity-50' />
      </div>

      {/* Right Section */}
      <div className={`w-full lg:w-1/2 ${paddingX} ${paddingY}`}>
        {hasValue(resolvedTitle) && (
          <h3 className='font-bold text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] text-center lg:text-left'>
            {resolvedTitle}
          </h3>
        )}

        <form className="space-y-4 sm:space-y-5 md:space-y-6 pt-4 sm:pt-5 md:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <label className="block">
              <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">First Name</span>
              <input type="text" name="first_name" placeholder="First Name" className={inputClassName} />
            </label>

            <label className="block">
              <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">Last Name</span>
              <input type="text" name="last_name" placeholder="Last Name" className={inputClassName} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <label className="block">
              <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">Work Email</span>
              <input type="email" name="email" placeholder="name@company.com" className={inputClassName} />
            </label>

            <label className="block">
              <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">Phone Number</span>
              <input type="tel" name="phone" placeholder="+ (country code) number" className={inputClassName} />
            </label>
          </div>

          <label className="block">
            <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">Subject</span>
            <input type="text" name="subject" placeholder="Subject" className={inputClassName} />
          </label>

          <label className="block">
            <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">Your Message</span>
            <textarea
              name="message"
              placeholder="Enter Your Message"
              rows={6}
              className={`${inputClassName} min-h-40 sm:min-h-44 md:min-h-48 lg:min-h-52.5 resize-none`}
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#0999DC] px-5 sm:px-6 py-3.5 sm:py-4 md:py-5 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] font-semibold text-white transition-colors hover:bg-[#0789C6] flex items-center justify-center gap-2"
          >
            <span>{resolvedButtonText}</span>
            <ArrowIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactReachSection;