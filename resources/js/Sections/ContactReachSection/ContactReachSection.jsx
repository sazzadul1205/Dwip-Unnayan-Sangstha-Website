// js/Sections/ContactReachSection/ContactReachSection.jsx

// React
import React, { useState } from 'react';

// Components
import ArrowIcon from '../../Shared/ArrowIcon';

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

// Generate placeholder image URL (inline SVG)
const getPlaceholderImage = (width = 800, height = 600, text = 'Contact Us') => {
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 12));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#1500FF"/><text x="50%" y="50%" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// ============================================
// SKELETON: Form field
// ============================================
const FormFieldSkeleton = ({ multiline = false }) => (
  <div className="block">
    {/* Label */}
    <Skeleton className="h-4 sm:h-4.5 md:h-5 lg:h-5.5 w-24 sm:w-28 mb-2" />
    {/* Input / textarea */}
    <Skeleton
      className={`w-full rounded-xl ${multiline
          ? 'h-40 sm:h-44 md:h-48 lg:h-52.5'
          : 'h-11 sm:h-12 md:h-13'
        }`}
    />
  </div>
);

// ============================================
// SKELETON: Full section (image side + form side)
// ============================================
const ContactReachSkeleton = () => (
  <>
    {/* Left image block — matches real min-h chain */}
    <div className="w-full lg:w-1/2 relative min-h-50 sm:min-h-62.5 md:min-h-75 lg:min-h-100 xl:min-h-125">
      <Skeleton
        className="w-full h-full max-h-64 sm:max-h-80 md:max-h-100 lg:max-h-none rounded-none"
        rounded="rounded-none"
      />
    </div>

    {/* Right form side */}
    <div className="w-full lg:w-1/2 px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50 py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5">
      {/* Title */}
      <Skeleton className="h-7 sm:h-8 md:h-9 lg:h-10 xl:h-11 2xl:h-12 w-3/4 sm:w-2/3 lg:w-1/2 mb-4 sm:mb-5 md:mb-6" />

      <div className="space-y-4 sm:space-y-5 md:space-y-6 pt-4 sm:pt-5 md:pt-6">
        {/* Row: First / Last name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>

        {/* Row: Email / Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>

        {/* Subject */}
        <FormFieldSkeleton />

        {/* Message (multiline) */}
        <FormFieldSkeleton multiline />

        {/* Submit button */}
        <Skeleton className="w-full h-13 sm:h-14 md:h-15 lg:h-16 rounded-xl" />
      </div>
    </div>
  </>
);

/**
 * ContactReachSection Component
 */
const ContactReachSection = ({
  data,
  reachData,
  image,
  loading = false,               // ← NEW
  title = 'Reach out to us today!',
  buttonText = 'Submit Message',
  bgColor = 'bg-[#F5F5F5]',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'contact-reach',
}) => {
  const [imageError, setImageError] = useState(false);

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <section
        id={sectionId}
        className={`text-black flex flex-col lg:flex-row justify-center items-stretch ${bgColor} ${sectionClassName}`}
      >
        <ContactReachSkeleton />
      </section>
    );
  }

  // ============================================
  // RESOLVE DATA
  // ============================================
  let resolvedData = data || reachData;

  let resolvedImage = image;
  let resolvedTitle = title;
  let resolvedButtonText = buttonText;

  if (hasValue(resolvedData)) {
    if (resolvedData.data && typeof resolvedData.data === 'object') {
      resolvedData = resolvedData.data;
    }

    if (hasValue(resolvedData.image)) resolvedImage = resolvedData.image;
    if (hasValue(resolvedData.title)) resolvedTitle = resolvedData.title;
    if (hasValue(resolvedData.buttonText)) resolvedButtonText = resolvedData.buttonText;
  }

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const hasImage = hasValue(resolvedImage);
  const usePlaceholder = !hasImage || imageError;

  const imageSrc = usePlaceholder
    ? getPlaceholderImage(800, 600, resolvedTitle || 'Contact Us')
    : resolvedImage;

  const imageAlt = 'Contact Reach';
  const handleImageError = () => setImageError(true);

  // ============================================
  // INPUT STYLES
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
      {/* Left Image Section */}
      <div className="w-full lg:w-1/2 relative min-h-50 sm:min-h-62.5 md:min-h-75 lg:min-h-100 xl:min-h-125">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover lg:max-h-none max-h-64 sm:max-h-80 md:max-h-100"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#1500FF] via-[#6F07E5] to-[#F10A0A] opacity-40 sm:opacity-50" />
      </div>

      {/* Right Section */}
      <div className={`w-full lg:w-1/2 ${paddingX} ${paddingY}`}>
        {hasValue(resolvedTitle) && (
          <h3 className="font-bold text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] text-center lg:text-left">
            {resolvedTitle}
          </h3>
        )}

        <form className="space-y-4 sm:space-y-5 md:space-y-6 pt-4 sm:pt-5 md:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <label className="block">
              <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">
                First Name
              </span>
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                className={inputClassName}
              />
            </label>

            <label className="block">
              <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">
                Last Name
              </span>
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                className={inputClassName}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <label className="block">
              <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">
                Work Email
              </span>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                className={inputClassName}
              />
            </label>

            <label className="block">
              <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">
                Phone Number
              </span>
              <input
                type="tel"
                name="phone"
                placeholder="+ (country code) number"
                className={inputClassName}
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">
              Subject
            </span>
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="block text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#080C14]">
              Your Message
            </span>
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