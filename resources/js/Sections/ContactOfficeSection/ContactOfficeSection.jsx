// js/Sections/ContactOfficeSection/ContactOfficeSection.jsx

// React
import React from 'react';

// Icons
import { FaGraduationCap } from 'react-icons/fa';

// Utility function to check if value exists (SAME as other sections)
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * ContactOfficeSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Contact office data from API (from DynamicSectionRenderer)
 * @param {Object} props.officesData - Contact office data from API (direct prop - legacy)
 * @param {Array} props.offices - Offices array (direct prop - legacy)
 * @param {string} props.title - Section title (default: "Our Offices")
 * @param {string} props.orgName - Organization name (default: "Dwip Unnayan Songstha (DUS)")
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'contact-offices')
 * 
 * @returns {JSX.Element} Rendered contact office section
 */
const ContactOfficeSection = ({
  data,           // From DynamicSectionRenderer
  officesData,    // Direct prop (legacy support)
  offices,        // Direct prop (legacy support)
  title = "Our Offices",
  orgName = "Dwip Unnayan Songstha (DUS)",
  bgColor = 'bg-white',
  paddingY = 'py-10 sm:py-14 lg:py-37.5',
  paddingX = 'px-4 sm:px-6 lg:px-50',
  sectionClassName = '',
  sectionId = 'contact-offices',
}) => {
  // ============================================
  // RESOLVE DATA
  // ============================================
  // Use data prop if available, fallback to officesData or offices
  let resolvedData = data || officesData || offices;
  
  // ============================================
  // EARLY RETURN - No data
  // ============================================
  if (!hasValue(resolvedData)) {
    return null;
  }

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  let officesArray = [];

  // Case 1: Data is directly an array of offices
  if (Array.isArray(resolvedData)) {
    officesArray = resolvedData;
  } else {
    // Case 2: Data is an object
    // Check if the data is wrapped in a 'data' property
    if (resolvedData.data && typeof resolvedData.data === 'object') {
      // If data.data is an array, use it directly
      if (Array.isArray(resolvedData.data)) {
        officesArray = resolvedData.data;
      } else {
        // If data.data is an object, use the data property
        resolvedData = resolvedData.data;
      }
    }

    // If we haven't found offices yet, try other properties
    if (officesArray.length === 0) {
      // Case 3: Data has an offices property
      if (Array.isArray(resolvedData.offices)) {
        officesArray = resolvedData.offices;
      } else if (Array.isArray(resolvedData.officeData)) {
        officesArray = resolvedData.officeData;
      } else if (Array.isArray(resolvedData)) {
        officesArray = resolvedData;
      } else {
        // Try to find any array property that might be offices
        let foundOffices = false;
        for (const key in resolvedData) {
          if (Array.isArray(resolvedData[key]) && resolvedData[key].length > 0) {
            const firstItem = resolvedData[key][0];
            if (firstItem && (firstItem.address || firstItem.phones || firstItem.emails || firstItem.title)) {
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

  // ============================================
  // EARLY RETURN - No offices
  // ============================================
  if (!hasValue(officesArray) || officesArray.length === 0) {
    console.warn('ContactOfficeSection - No offices to display');
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`${bgColor} ${sectionClassName}`}
    >
      <div className={`mx-auto ${paddingX} ${paddingY}`}>
        {/* Section Title */}
        {hasValue(title) && (
          <h2 className="text-[#1D2566] font-bold text-[28px] sm:text-[32px] lg:text-[36px] leading-tight pb-6 sm:pb-8 lg:pb-12.5 text-center sm:text-left">
            {title}
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {officesArray.map((office, index) => (
            <div
              key={office.title || index}
              className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 md:p-10 lg:p-12.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <FaGraduationCap className="text-4xl text-black" />

              {/* Office Title */}
              {hasValue(office.title) && (
                <h3 className="text-[22px] sm:text-[24px] font-bold text-[#080C14] pt-5">
                  {office.title}
                </h3>
              )}

              <div className="space-y-2 text-[14px] sm:text-[15px] leading-relaxed text-[#444] mt-3">
                {/* Organization Name */}
                {hasValue(orgName) && (
                  <p className="font-semibold text-[#333333]">{orgName}</p>
                )}

                {/* Address */}
                {hasValue(office.address) && (
                  <p className="flex gap-2">
                    <span className="font-semibold text-[#333333] shrink-0">Address:</span>
                    <span>{office.address}</span>
                  </p>
                )}

                {/* Phone Numbers */}
                {hasValue(office.phones) && (
                  <p className="flex gap-2 flex-wrap">
                    <span className="font-semibold text-[#333333] shrink-0">Phone:</span>
                    <span>{office.phones}</span>
                  </p>
                )}

                {/* Emails */}
                {hasValue(office.emails) && office.emails.length > 0 && (
                  <p className="flex gap-2 flex-wrap">
                    <span className="font-semibold text-[#333333] shrink-0">E-mail:</span>
                    <span>
                      {office.emails.map((email, idx) => (
                        <span key={idx}>
                          {idx > 0 && <span>, </span>}
                          <a
                            href={`mailto:${email}`}
                            className="text-[#444] hover:text-[#009BE2] transition-colors"
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