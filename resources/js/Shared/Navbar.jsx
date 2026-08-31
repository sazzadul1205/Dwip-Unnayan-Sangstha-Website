// resources/js/Shared/Navbar.jsx

import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X, ChevronDown } from 'lucide-react';
import ArrowIcon from './ArrowIcon';

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

const Navbar = ({ navbarData, storageUrl = '', defaultLogo = '/images/default-logo.png' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState({});

  const { url } = usePage();
  const currentPath = url;

  const isActive = (href) => {
    if (!hasValue(href)) return false;
    if (href === '/') return currentPath === href;
    return currentPath.startsWith(href);
  };

  const toggleDropdown = (index) => {
    setOpenDropdowns(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleMobileDropdown = (index) => {
    setMobileDropdownOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    setIsOpen(false);
  }, [currentPath]);

  if (!hasValue(navbarData)) return null;

  const { logo = {}, navLinks = [], button = {}, mobileMenu = {}, dropdowns = [] } = navbarData;

  const hasLogo = hasValue(logo.src);
  const hasNavLinks = hasValue(navLinks);
  const hasButton = hasValue(button.text) && hasValue(button.href);

  if (!hasLogo && !hasNavLinks && !hasButton) return null;

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

  const handleImageError = () => setImageError(true);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-20">
      <div className="mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 2xl:px-25 py-3 sm:py-4 md:py-5">
        <div className="flex justify-between items-center">

          {/* LOGO - always left */}
          <div className="shrink-0">
            {hasLogo && (
              <Link href={logo.href || '/'} className="block">
                <img
                  src={logoUrl}
                  alt={logo.alt || 'Logo'}
                  className={logo.className || ''}
                  width={logo.width || 73}
                  height={logo.height || 106}
                  onError={handleImageError}
                  style={{
                    width: '73px',
                    height: 'auto',
                    maxHeight: '106px',
                    objectFit: 'contain',
                    display: 'block',
                    ...(logo.style || {})
                  }}
                />
              </Link>
            )}
          </div>

          {/* DESKTOP: navigation + CTA + mobile toggle - all on the right */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-9 ml-auto">
            {/* Navigation Links */}
            {hasNavLinks && (
              <ul className="flex items-center gap-4 xl:gap-6 2xl:gap-9">
                {navLinks.map((link, index) => {
                  const active = isActive(link.href);
                  const hasDropdown = hasValue(link.dropdown) || hasValue(dropdowns[index]);

                  return (
                    <li key={link.name || index} className="relative uppercase">
                      {hasDropdown ? (
                        <div>
                          <button
                            onClick={() => toggleDropdown(index)}
                            className={`relative flex items-center gap-1 whitespace-nowrap font-semibold transition-all duration-300
                              ${active ? "text-[#009BE2]" : "text-black hover:text-[#009BE2]"}
                              text-sm xl:text-base 2xl:text-lg`}
                          >
                            {link.name}
                            <ChevronDown
                              className={`w-3 h-3 transition-transform duration-300 ${openDropdowns[index] ? "rotate-180" : ""}`}
                            />
                          </button>

                          {openDropdowns[index] && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-60">
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
                          className={`relative group whitespace-nowrap font-semibold transition-all duration-300
                            ${active ? "text-[#009BE2]" : "text-gray-800 hover:text-[#009BE2]"}
                            text-sm xl:text-base 2xl:text-[20px]`}
                        >
                          {link.name}
                          <span
                            className={`absolute -bottom-2 left-1/2 h-0.5 rounded-full bg-[#009BE2]
                              transition-all duration-300 ease-out
                              ${active ? "w-full -translate-x-1/2" : "w-0 -translate-x-1/2 group-hover:w-full"}`}
                          />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Right side: CTA + mobile toggle */}
            <div className="flex items-center gap-3 sm:gap-4 xl:gap-6 2xl:gap-9">
              {hasButton && (
                <Link
                  href={button.href}
                  className="hidden sm:inline-block uppercase rounded-xl bg-[#009BE2] text-white font-semibold hover:bg-[#009BE2]/80
                    px-3 py-1.5 text-xs
                    sm:px-4 sm:py-2 sm:text-sm
                    xl:px-5 xl:py-3 xl:text-base
                    2xl:px-6 2xl:py-4 2xl:text-[18px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 hover:shadow::"
                >
                  <div className='flex items-center gap-3' >
                    {button.text}
                    <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </div>
                </Link>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                className={mobileMenu.className || "lg:hidden p-2 text-gray-700 hover:text-[#009BE2] transition-colors duration-200"}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* MOBILE: same as before, displayed only on small screens */}
          <div className="flex lg:hidden items-center gap-3 sm:gap-4">
            {hasButton && (
              <Link
                href={button.href}
                className="hidden sm:inline-block uppercase rounded-xl bg-[#009BE2] text-white font-semibold transition-colors duration-200 hover:bg-[#009BE2]/80
                  px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
              >
                {button.text}
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={mobileMenu.className || "p-2 text-gray-700 hover:text-[#009BE2] transition-colors duration-200"}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU - unchanged, slides down */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden
            ${isOpen ? 'max-h-[80vh] opacity-100 mt-3 sm:mt-4' : 'max-h-0 opacity-0'}`}
          role="menu"
        >
          <div className="border-t border-gray-100 pt-3 sm:pt-4">
            <ul className="flex flex-col space-y-1 sm:space-y-2 pb-3 sm:pb-4">
              {hasNavLinks && navLinks.map((link, index) => {
                const active = isActive(link.href);
                const hasDropdown = hasValue(link.dropdown) || hasValue(dropdowns[index]);

                return (
                  <li key={link.name || index}>
                    {hasDropdown ? (
                      <div>
                        <button
                          onClick={() => toggleMobileDropdown(index)}
                          className={`flex items-center justify-between w-full font-medium transition-colors duration-200 py-2 px-2 rounded-lg hover:bg-gray-50 ${active ? 'text-[#009BE2]' : 'text-black hover:text-[#009BE2]'}`}
                          aria-expanded={mobileDropdownOpen[index]}
                        >
                          <span>{link.name}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mobileDropdownOpen[index] ? 'rotate-180' : ''}`} />
                        </button>
                        {mobileDropdownOpen[index] && (
                          <div className="pl-4 mt-1 space-y-1 border-l-2 border-[#009BE2]/30 ml-2">
                            {(link.dropdown || dropdowns[index] || []).map((dropdownItem, idx) => (
                              <Link
                                key={idx}
                                href={dropdownItem.href}
                                className="block py-2 px-2 text-sm text-gray-600 hover:text-[#009BE2] hover:bg-gray-50 rounded-lg transition-colors duration-200"
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
                        className={`block font-medium transition-colors duration-200 py-2 px-2 rounded-lg hover:bg-gray-50 ${active ? 'text-[#009BE2] bg-blue-50/50' : 'text-black hover:text-[#009BE2]'}`}
                        onClick={() => setIsOpen(false)}
                      >
                        {link.name}
                        {active && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[#009BE2]" />}
                      </Link>
                    )}
                  </li>
                );
              })}

              {hasButton && (
                <li className="pt-2">
                  <Link
                    href={button.href}
                    className="inline-block text-center w-full text-white bg-[#009BE2] hover:bg-[#009BE2]/80 px-4 py-2.5 rounded-lg transition-colors duration-200 font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {button.text}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;