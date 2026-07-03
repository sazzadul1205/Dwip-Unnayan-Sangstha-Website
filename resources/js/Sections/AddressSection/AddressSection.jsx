// js/Sections/AddressSection/AddressSection.jsx

"use client";

import React, { useState } from "react";
import { FaArrowRight } from "react-icons/fa6";

// Utility function to check if value exists (SAME as other sections)
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

const OfficeStar = ({ active }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 2L13.85 8.15L20 10L13.85 11.85L12 18L10.15 11.85L4 10L10.15 8.15L12 2Z"
      fill={active ? "#1396E8" : "#111827"}
    />
  </svg>
);

const BuildingIcon = ({ className = "", ...props }) => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 23 23"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M17.5425 0.714355H5.31388C3.18067 0.714355 1.44531 2.44971 1.44531 4.58293V11.6847C1.44531 13.8179 3.18067 15.5533 5.31388 15.5533H7.0246C7.92067 15.5533 8.76388 15.9426 9.35495 16.5926C6.63924 16.8865 4.08888 17.804 4.08888 19.3111C4.08888 21.1504 7.87031 22.1433 11.4282 22.1433C14.986 22.1433 18.7675 21.1508 18.7675 19.3111C18.7675 17.804 16.2167 16.8865 13.5014 16.5926C14.0928 15.9429 14.9357 15.5533 15.8317 15.5533H17.5425C19.6757 15.5533 21.411 13.8179 21.411 11.6847V4.58293C21.411 2.44971 19.6757 0.714355 17.5425 0.714355ZM18.0532 19.3108C18.0532 20.3126 15.3325 21.4286 11.4282 21.4286C7.52388 21.4286 4.80317 20.3126 4.80317 19.3108C4.80317 18.499 6.68174 17.5279 9.83353 17.2644L11.1189 19.4904C11.1828 19.6011 11.3007 19.669 11.4282 19.669C11.5557 19.669 11.6739 19.6011 11.7375 19.4904L13.0228 17.2644C16.1746 17.5279 18.0532 18.499 18.0532 19.3108ZM20.6967 11.6844C20.6967 13.4236 19.2817 14.8386 17.5425 14.8386H15.8317C14.4546 14.8386 13.1707 15.5797 12.4814 16.7729L11.4282 18.5972L10.375 16.7729C9.68567 15.5797 8.4021 14.8386 7.0246 14.8386H5.31388C3.5746 14.8386 2.1596 13.4236 2.1596 11.6844V4.58293C2.1596 2.84364 3.5746 1.42864 5.31388 1.42864H17.5425C19.2817 1.42864 20.6967 2.84364 20.6967 4.58293V11.6844Z"
      fill="#271E0B"
    />
    <path
      d="M16.8949 6.28211L12.3081 2.54318C12.0617 2.34246 11.7406 2.24032 11.437 2.24425C11.1103 2.24425 10.7949 2.34211 10.5485 2.54318L5.96169 6.28211C5.38205 6.75425 5.2949 7.61032 5.76705 8.18996C5.9599 8.42639 6.22347 8.58175 6.51776 8.64818V12.2642C6.51776 13.1607 7.24705 13.89 8.13919 13.89L9.04312 13.9014L14.7131 13.89C15.6099 13.89 16.3392 13.1607 16.3392 12.2642V8.64818C16.6335 8.58175 16.897 8.42604 17.0899 8.18996C17.562 7.61032 17.4745 6.75425 16.8949 6.28211ZM14.7131 13.1757L9.04705 13.1871L8.14383 13.1757C7.64133 13.1757 7.23205 12.7667 7.23205 12.2642V8.62282C7.39133 8.57175 7.54169 8.49282 7.6749 8.38425L11.4285 5.32496L15.182 8.38425C15.3153 8.49246 15.4656 8.57032 15.6249 8.62139V12.2639C15.6249 12.7664 15.2156 13.1757 14.7131 13.1757ZM16.536 7.73854C16.4285 7.87068 16.2749 7.95318 16.1035 7.97032C15.9317 7.98568 15.7653 7.93782 15.6335 7.83032L11.6542 4.58711C11.5885 4.53389 11.5085 4.50675 11.4285 4.50675C11.3485 4.50675 11.2685 4.53354 11.2028 4.58711L7.22347 7.83032C7.09169 7.93782 6.92455 7.98568 6.75347 7.97032C6.5824 7.95282 6.42848 7.87068 6.32098 7.73854C6.21312 7.60675 6.16383 7.43961 6.18098 7.26854C6.19812 7.09746 6.28062 6.94354 6.41276 6.83604L10.9995 3.09711C11.146 2.97782 11.306 2.95175 11.437 2.95854C11.5456 2.94854 11.7103 2.97746 11.857 3.09711L16.4438 6.83604C16.576 6.94354 16.6585 7.09711 16.6756 7.26854C16.6928 7.43996 16.6438 7.60675 16.536 7.73854Z"
      fill="#271E0B"
    />
  </svg>
);

/**
 * AddressSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Address data from API (from DynamicSectionRenderer)
 * @param {Object} props.addressData - Address data from API (direct prop - legacy)
 * @param {Array} props.officesLocation - Offices location array (direct prop - legacy)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'address-section')
 * 
 * @returns {JSX.Element} Rendered address section
 */
const AddressSection = ({
  data,           // From DynamicSectionRenderer
  addressData,    // Direct prop (legacy support)
  officesLocation,
  bgColor = 'bg-[#F5F5F5]',
  paddingY = 'py-10 sm:py-14 lg:py-37.5',
  paddingX = 'px-4 sm:px-6 lg:px-50',
  sectionClassName = '',
  sectionId = 'address-section',
}) => {
  // ============================================
  // HOOKS - Must be called before any conditional returns
  // ============================================
  // Initialize with empty array, will be updated after data resolution
  const [activeOffice, setActiveOffice] = useState(null);

  // ============================================
  // RESOLVE DATA
  // ============================================
  // Use data prop if available, fallback to addressData or officesLocation
  let resolvedData = data || addressData;

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  let officesArray = officesLocation || [];

  if (hasValue(resolvedData)) {
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
      // If resolvedData is an array, use it as offices
      if (Array.isArray(resolvedData)) {
        officesArray = resolvedData;
      } else if (typeof resolvedData === 'object') {
        // Check for various property names that might contain offices
        if (Array.isArray(resolvedData.officesLocation)) {
          officesArray = resolvedData.officesLocation;
        } else if (Array.isArray(resolvedData.offices)) {
          officesArray = resolvedData.offices;
        } else if (Array.isArray(resolvedData.locations)) {
          officesArray = resolvedData.locations;
        } else {
          // Try to find any array property that might be offices
          let foundOffices = false;
          for (const key in resolvedData) {
            if (Array.isArray(resolvedData[key]) && resolvedData[key].length > 0) {
              const firstItem = resolvedData[key][0];
              if (firstItem && (firstItem.label || firstItem.address || firstItem.mapUrl)) {
                officesArray = resolvedData[key];
                foundOffices = true;
                break;
              }
            }
          }
          if (!foundOffices) {
            console.warn('AddressSection - No offices array found in data');
          }
        }
      }
    }
  }

  // ============================================
  // UPDATE ACTIVE OFFICE
  // ============================================
  // Set active office to first item if not already set
  if (hasValue(officesArray) && officesArray.length > 0 && activeOffice === null) {
    setActiveOffice(officesArray[0]);
  }

  // ============================================
  // EARLY RETURN - No data
  // ============================================
  if (!hasValue(officesArray) || officesArray.length === 0) {
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {/* Tabs */}
      <div className="max-w-200 mx-auto rounded-[18px] bg-white p-4">
        <div className="flex flex-wrap justify-between gap-3">
          {officesArray.map((office) => (
            <button
              key={office.id}
              onClick={() => setActiveOffice(office)}
              className={`flex items-center justify-center gap-2 sm:gap-3 rounded-2xl px-4 sm:px-5 py-3 sm:py-5 text-[16px] sm:text-[18px] md:text-[24px] font-semibold transition-all shrink-0 cursor-pointer ${activeOffice?.id === office.id
                ? 'bg-[#FAFAFA] text-[#1396E8]'
                : 'bg-white text-[#111827] hover:bg-gray-50'
                }`}
            >
              <OfficeStar active={activeOffice?.id === office.id} />
              <span>{office.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Map */}
      <div className="relative pt-12">
        <div className="w-full max-w-380 mx-auto rounded-2xl overflow-hidden shadow-lg">
          {hasValue(activeOffice?.mapUrl) && (
            <iframe
              src={activeOffice.mapUrl}
              className="w-full h-100 md:h-228.75 border-0"
              loading="lazy"
              allowFullScreen
              title={`${activeOffice.label} Location Map`}
            />
          )}
        </div>

        {/* Dynamic Address Card */}
        {hasValue(activeOffice?.address) && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-[90%] md:w-192.5 z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-white py-6 px-7 rounded-2xl shadow-xl">
              <div className='bg-[#F4F8FF] rounded-full p-3.5 shrink-0'>
                <BuildingIcon />
              </div>

              <div className="flex-1 w-full">
                <h3 className="font-semibold text-[12px] uppercase tracking-wide text-gray-500 mb-1">
                  Address
                </h3>
                <p className="text-[#009BE2] text-[16px] md:text-[20px] font-medium wrap-break-word">
                  {activeOffice.address}
                </p>
              </div>

              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(activeOffice.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 hover:translate-x-1 transition-transform"
              >
                <FaArrowRight className="text-[#C2C2C2] hover:text-[#009BE2] transition-colors text-xl" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AddressSection;