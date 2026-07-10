// resources/js/Shared/Navbar.jsx

/**
 * ============================================
 * NAVBAR - Main Navigation Component
 * ============================================
 * 
 * PURPOSE:
 * - Renders the main navigation bar with logo, links, and CTA
 * - Supports dropdown menus for nested navigation
 * - Responsive: Desktop horizontal, Mobile hamburger menu
 * - Active link highlighting based on current route
 * - Logo: 73×106px (width × height) - fixed, no floating
 * 
 * ============================================
 */

// React
import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';

// Icons
import { Menu, X, ChevronDown } from 'lucide-react';

// ============================================
// UTILITY: Check if value exists
// ============================================
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Navbar Component
 * 
 * @param {Object} props
 * @param {Object} props.navbarData - Navigation configuration data
 * @param {string} props.storageUrl - Base URL for image storage
 * @param {string} props.defaultLogo - Fallback logo URL
 * 
 * @returns {JSX.Element} Rendered navigation bar
 */
const Navbar = ({ navbarData, storageUrl = '', defaultLogo = '/images/default-logo.png' }) => {
  // ============================================
  // STATE
  // ============================================
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState({});

  // ============================================
  // ROUTE DETECTION
  // ============================================
  const { url } = usePage();
  const currentPath = url;

  const isActive = (href) => {
    if (!hasValue(href)) return false;
    if (href === '/') {
      return currentPath === href;
    }
    return currentPath.startsWith(href);
  };

  // ============================================
  // DROPDOWN TOGGLES
  // ============================================
  const toggleDropdown = (index) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleMobileDropdown = (index) => {
    setMobileDropdownOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [currentPath]);

  // ============================================
  // EARLY RETURN - No data
  // ============================================
  if (!hasValue(navbarData)) return null;

  // ============================================
  // DESTRUCTURE DATA
  // ============================================
  const {
    logo = {},
    navLinks = [],
    button = {},
    mobileMenu = {},
    dropdowns = []
  } = navbarData;

  const hasLogo = hasValue(logo.src);
  const hasNavLinks = hasValue(navLinks);
  const hasButton = hasValue(button.text) && hasValue(button.href);

  if (!hasLogo && !hasNavLinks && !hasButton) return null;

  // ============================================
  // HELPERS
  // ============================================
  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/asset/')) return imagePath;
    if (imagePath.startsWith('/storage/')) return imagePath;
    if (storageUrl) {
      const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
      return `${storageUrl}${cleanPath}`;
    }
    return imagePath;
  };

  const logoUrl = imageError ? defaultLogo : (getImageSrc(logo.src) || defaultLogo);

  // Handle image error - fallback to default
  const handleImageError = () => {
    setImageError(true);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-20">
      <div className="mx-auto px-5 md:px-25 py-5">
        <div className="flex justify-between items-center">

          {/* ============================================
              LOGO - Fixed dimensions 73×106px (no floating)
              ============================================ */}
          <div className="shrink-0">
            {hasLogo && (
              <Link href={logo.href || '/'} className="block">
                <img
                  src={logoUrl}
                  alt={logo.alt || 'Logo'}
                  className={logo.className || 'block'}
                  width={logo.width || 73}
                  height={logo.height || 106}
                  onError={handleImageError}
                  style={{
                    width: '73px',
                    height: '106.63px',
                    objectFit: 'contain',
                    display: 'block',
                    ...(logo.style || {})
                  }}
                />
              </Link>
            )}
          </div>

          {/* ============================================
              RIGHT SIDE - Nav Links + CTA + Hamburger
              ============================================ */}
          <div className="flex items-center gap-9">

            {/* DESKTOP NAVIGATION */}
            {hasNavLinks && (
              <ul className="hidden lg:flex items-center gap-9">
                {navLinks.map((link, index) => {
                  const active = isActive(link.href);
                  const hasDropdown = hasValue(link.dropdown) || hasValue(dropdowns[index]);

                  return (
                    <li key={link.name || index} className="relative">
                      {hasDropdown ? (
                        <div>
                          <button
                            onClick={() => toggleDropdown(index)}
                            className={`relative font-semibold transition-all duration-300 flex items-center gap-1 whitespace-nowrap ${active ? 'text-[#009BE2]' : 'text-black hover:text-[#009BE2]'}`}
                            aria-expanded={openDropdowns[index]}
                            aria-haspopup="true"
                          >
                            {link.name}
                            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openDropdowns[index] ? 'rotate-180' : ''}`} />
                          </button>

                          {openDropdowns[index] && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                              {(link.dropdown || dropdowns[index] || []).map((dropdownItem, idx) => (
                                <Link
                                  key={idx}
                                  href={dropdownItem.href}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#009BE2] hover:text-white transition-colors duration-200"
                                  onClick={() => setOpenDropdowns({})}
                                >
                                  {dropdownItem.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={link.href}
                          className={`relative font-semibold transition-all duration-300 text-[20px] group whitespace-nowrap ${active ? 'text-[#009BE2]' : 'text-black hover:text-[#009BE2]'}`}
                        >
                          {link.name}
                          <span className={`absolute bottom-0 left-0 h-0.5 bg-[#009BE2] transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* CTA BUTTON */}
            {hasButton && (
              <Link
                href={button.href}
                className="uppercase text-white text-[18px] font-semibold bg-[#009BE2] hover:bg-[#009BE2]/80 px-6 py-4 rounded-xl transition-colors duration-200"
              >
                {button.text}
              </Link>
            )}

            {/* HAMBURGER MENU BUTTON - Mobile */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={mobileMenu.className || "lg:hidden text-gray-700 hover:text-blue-600 focus:outline-none p-2"}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* ============================================
            MOBILE MENU - Slide Down
            ============================================ */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden
            ${isOpen ? 'max-h-screen opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
          role="menu"
        >
          <ul className="flex flex-col space-y-3 pb-4">
            {hasNavLinks && navLinks.map((link, index) => {
              const active = isActive(link.href);
              const hasDropdown = hasValue(link.dropdown) || hasValue(dropdowns[index]);

              return (
                <li key={link.name || index}>
                  {hasDropdown ? (
                    <div>
                      <button
                        onClick={() => toggleMobileDropdown(index)}
                        className={`flex items-center justify-between w-full font-medium transition-colors duration-200 py-2 ${active ? 'text-[#009BE2]' : 'text-black hover:text-[#009BE2]'
                          }`}
                        aria-expanded={mobileDropdownOpen[index]}
                      >
                        <span>{link.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mobileDropdownOpen[index] ? 'rotate-180' : ''
                          }`} />
                      </button>
                      {mobileDropdownOpen[index] && (
                        <div className="pl-4 mt-2 space-y-2 border-l-2 border-gray-200">
                          {(link.dropdown || dropdowns[index] || []).map((dropdownItem, idx) => (
                            <Link
                              key={idx}
                              href={dropdownItem.href}
                              className="block py-2 text-sm text-gray-600 hover:text-[#009BE2] transition-colors duration-200"
                              onClick={() => {
                                setIsOpen(false);
                                setMobileDropdownOpen({});
                              }}
                            >
                              {dropdownItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      className={`block font-medium transition-colors duration-200 py-2 ${active ? 'text-[#009BE2]' : 'text-black hover:text-[#009BE2]'
                        }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                      {active && (
                        <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[#009BE2]" />
                      )}
                    </Link>
                  )}
                </li>
              );
            })}

            {/* Mobile CTA Button */}
            {hasButton && (
              <li>
                <Link
                  href={button.href}
                  className="inline-block text-center w-full text-white bg-[#009BE2] hover:bg-[#009BE2]/80 px-6 py-2 rounded-lg transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {button.text}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;