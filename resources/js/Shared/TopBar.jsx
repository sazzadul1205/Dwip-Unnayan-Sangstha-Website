// resources/js/components/TopBar.jsx

/**
 * ============================================
 * TOP BAR - Utility Bar Component
 * ============================================
 * 
 * PURPOSE:
 * - Renders the top utility bar with contact info, language selector, search, and user menu
 * - Provides quick access to key actions
 * - Responsive: Desktop expanded, Mobile hamburger menu
 * 
 * SECTIONS:
 * 1. Contact Info: Email, Phone, Hours
 * 2. Language Selector: Switch between English and Bengali
 * 3. Search: Expandable search bar
 * 4. User Menu: Login/Register or Dashboard/Logout
 * 5. Social Links: Facebook, Instagram, LinkedIn, Twitter/X
 * 
 * DATA STRUCTURE:
 * {
 *   contactInfo: {
 *     email: { text, icon, alt },
 *     phone: { text, icon, alt },
 *     hours: { text, icon, alt }
 *   },
 *   languages: [{ code, name, flag }],
 *   socialLinks: [{ id, iconName, url, name, hoverColor }],
 *   userMenu: {
 *     guest: [{ label, route, type }],
 *     authenticated: [{ label, route, type, action, divider }]
 *   }
 * }
 * 
 * FEATURES:
 * - Language persistence via localStorage
 * - Click outside to close dropdowns
 * - Expandable search with animation
 * - User authentication state handling
 * 
 * ============================================
 */

// Icons - Import all needed icons
import { FiSearch } from "react-icons/fi";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { FaFacebook, FaInstagram, FaLinkedin, FaXTwitter, FaUser } from "react-icons/fa6";

// React
import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

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

// ============================================
// ICON MAPPING
// ============================================
const iconMap = {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaXTwitter
};

/**
 * TopBar Component
 * 
 * @param {Object} props
 * @param {Object} props.topBarData - Top bar configuration data
 * @param {string} props.storageUrl - Base URL for image storage
 * 
 * @returns {JSX.Element} Rendered top bar
 */
const TopBar = ({ topBarData, storageUrl }) => {
  // ============================================
  // AUTH - Get from Inertia usePage
  // ============================================
  const { auth } = usePage().props;
  const user = auth?.user;

  // ============================================
  // STATE - All hooks must be called unconditionally
  // ============================================
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs for click-outside detection
  const langRef = useRef(null);
  const userRef = useRef(null);
  const searchRef = useRef(null);

  // ============================================
  // DESTRUCTURE DATA - With safe defaults
  // ============================================
  const {
    contactInfo = {},
    languages = [],
    socialLinks = [],
    userMenu = {}
  } = topBarData || {};

  // ============================================
  // LANGUAGE SELECTION
  // ============================================

  /**
   * Get initial language from localStorage or defaults
   * - Check localStorage for saved preference
   * - If not found, use English (us) as default
   * - Only shows 'us' and 'bd' languages
   */
  const languagesToShow = (languages || []).filter(lang =>
    lang.code === 'us' || lang.code === 'bd'
  );

  const getInitialLanguage = () => {
    try {
      const savedLang = localStorage.getItem('selectedLanguage');
      if (savedLang) {
        const parsedLang = JSON.parse(savedLang);
        const existsInData = languagesToShow.find(lang => lang.code === parsedLang.code);
        if (existsInData) return parsedLang;
      }
    } catch (error) {
      console.error('Error loading language from localStorage:', error);
    }

    const englishLang = languagesToShow.find(lang => lang.code === 'us');
    return englishLang || languagesToShow[0] || {
      code: 'us',
      name: 'English',
      flag: `${storageUrl || ''}/images/Flags/united-states.png`
    };
  };

  const [selectedLanguage, setSelectedLanguage] = useState(getInitialLanguage);

  // ============================================
  // USER MENU - Default if not provided
  // ============================================
  const defaultUserMenu = {
    guest: [
      { label: 'Login', route: 'login', type: 'link' },
      { label: 'Register', route: 'register', type: 'link' }
    ],
    authenticated: [
      { divider: true },
      { label: 'Dashboard', route: 'backend.dashboard', type: 'link' },
      { label: 'Logout', type: 'button', action: 'logout' }
    ]
  };

  const finalUserMenu = hasValue(userMenu) ? userMenu : defaultUserMenu;

  // ============================================
  // CLICK OUTSIDE DETECTION - useEffect must be unconditional
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close search if clicked outside and no query
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        if (!searchQuery) {
          setIsSearchExpanded(false);
        }
      }
      // Close language dropdown
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
      // Close user dropdown
      if (userRef.current && !userRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle language selection
   * - Updates state
   * - Saves to localStorage
   * - Dispatches custom event for other components
   */
  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    localStorage.setItem('selectedLanguage', JSON.stringify(language));
    setIsLangDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
  };

  /**
   * Handle search submission
   * - Navigates to search results page
   * - Closes search and clears query
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.get('/search', { q: searchQuery });
    setIsSearchExpanded(false);
    setSearchQuery('');
  };

  /**
   * Handle logout
   * - POST to logout endpoint
   */
  const handleLogout = () => {
    router.post('/logout');
  };

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Build image URL with storage path
   */
  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (storageUrl) return `${storageUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    return imagePath;
  };

  // ============================================
  // EARLY RETURN - AFTER all hooks have been called
  // ============================================
  // Check for content - moved after all hooks
  const hasContactInfo = hasValue(contactInfo.email?.text) ||
    hasValue(contactInfo.phone?.text) ||
    hasValue(contactInfo.hours?.text);

  const hasSocialLinks = hasValue(socialLinks);
  const hasLanguages = hasValue(languagesToShow);

  // Early return after all hooks have been called
  if (!hasValue(topBarData) || (!hasContactInfo && !hasSocialLinks && !hasLanguages)) {
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      {/* ============================================
          DESKTOP TOP BAR - FIXED FOR LAPTOP
          ============================================ */}
      <div className='hidden lg:flex justify-between items-center px-8 xl:px-16 2xl:px-24 py-3 bg-[#080C14] relative z-50 border-b border-white/5'>

        {/* Left Side - Contact Info */}
        {hasContactInfo && (
          <div className='flex items-center space-x-4 xl:space-x-6'>
            {hasValue(contactInfo.email?.text) && (
              <div className='flex items-center space-x-2'>
                {hasValue(contactInfo.email?.icon) && (
                  <img
                    src={getImageSrc(contactInfo.email.icon)}
                    alt={contactInfo.email.alt || 'Email'}
                    className="w-4 h-4 opacity-80"
                  />
                )}
                <a
                  href={`mailto:${contactInfo.email.text}`}
                  className='text-white/90 text-[14px] xl:text-[15px] font-normal hover:text-[#009BE2] transition-colors duration-200'
                >
                  {contactInfo.email.text}
                </a>
              </div>
            )}

            {hasValue(contactInfo.email?.text) && hasValue(contactInfo.phone?.text) && (
              <div className="bg-white/10 h-5 w-px hidden sm:block" />
            )}

            {hasValue(contactInfo.phone?.text) && (
              <div className='flex items-center space-x-2'>
                {hasValue(contactInfo.phone?.icon) && (
                  <img
                    src={getImageSrc(contactInfo.phone.icon)}
                    alt={contactInfo.phone.alt || 'Phone'}
                    className="w-4 h-4 opacity-80"
                  />
                )}
                <a href={`tel:${contactInfo.phone.text.replace(/\s/g, '')}`}
                  className='text-white/90 text-[14px] xl:text-[15px] font-normal hover:text-[#009BE2] transition-colors duration-200'>
                  {contactInfo.phone.text}
                </a>
              </div>
            )}

            {(hasValue(contactInfo.phone?.text) || hasValue(contactInfo.email?.text)) && hasValue(contactInfo.hours?.text) && (
              <div className="bg-white/10 h-5 w-px hidden sm:block" />
            )}

            {hasValue(contactInfo.hours?.text) && (
              <div className='flex items-center space-x-2'>
                {hasValue(contactInfo.hours?.icon) && (
                  <img
                    src={getImageSrc(contactInfo.hours.icon)}
                    alt={contactInfo.hours.alt || 'Hours'}
                    className="w-4 h-4 opacity-80"
                  />
                )}
                <p className='text-white/80 text-[14px] xl:text-[15px] font-normal'>{contactInfo.hours.text}</p>
              </div>
            )}
          </div>
        )}

        {/* Right Side - Language, Search, User, Social */}
        <div className="flex items-center gap-2 xl:gap-4">

          {/* LANGUAGE SELECTOR */}
          {hasLanguages && (
            <div className="relative" ref={langRef}>
              <button
                onClick={() => {
                  setIsLangDropdownOpen(!isLangDropdownOpen);
                  setIsUserDropdownOpen(false);
                }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
                aria-label="Select language"
              >
                {hasValue(selectedLanguage?.flag) && (
                  <img
                    src={getImageSrc(selectedLanguage.flag)}
                    alt={selectedLanguage.name}
                    className="w-5 h-5 rounded-sm"
                  />
                )}
                <span className="text-white/90 text-sm font-medium hidden md:inline">
                  {selectedLanguage.name}
                </span>
                {isLangDropdownOpen ?
                  <FaAngleUp className="text-white/70 text-xs transition-transform duration-200" /> :
                  <FaAngleDown className="text-white/70 text-xs transition-transform duration-200" />
                }
              </button>

              {/* Language Dropdown */}
              <div
                className={`absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl py-2 w-40 z-50 transition-all duration-200 origin-top-right
                  ${isLangDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
              >
                {languagesToShow.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left transition-colors duration-150 cursor-pointer ${selectedLanguage.code === lang.code ? 'bg-blue-50' : ''
                      }`}
                  >
                    <img
                      src={getImageSrc(lang.flag)}
                      alt={lang.name}
                      className="w-5 h-5 rounded-sm"
                    />
                    <span className={`text-sm ${selectedLanguage.code === lang.code ? 'text-[#009BE2] font-medium' : 'text-gray-700'}`}>
                      {lang.name}
                    </span>
                    {selectedLanguage.code === lang.code && (
                      <span className="ml-auto text-[#009BE2]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {hasLanguages && (hasSocialLinks || hasContactInfo) && (
            <div className="w-px h-5 bg-white/10 hidden sm:block" />
          )}

          {/* SEARCH */}
          <div className="relative" ref={searchRef}>
            <div className="overflow-hidden">
              <div className={`transition-all duration-300 ease-in-out ${isSearchExpanded ? 'w-48 xl:w-64 opacity-100' : 'w-8 opacity-100'
                }`}>
                {isSearchExpanded ? (
                  <form onSubmit={handleSearchSubmit} className="flex items-center animate-slideIn">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="px-3 py-1.5 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-[#009BE2] w-full bg-white/10 text-white placeholder-white/50"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-[#009BE2] px-3 py-1.5 rounded-r-md hover:bg-[#009BE2]/80 transition-colors duration-200 cursor-pointer"
                    >
                      <FiSearch className="text-white text-sm" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsSearchExpanded(true)}
                    className="flex items-center justify-center hover:opacity-80 transition-opacity duration-200 cursor-pointer w-8 h-8 rounded-full hover:bg-white/5"
                    aria-label="Search"
                  >
                    <FiSearch className="text-xl text-white/90" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-white/10 hidden sm:block" />

          {/* USER MENU */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => {
                setIsUserDropdownOpen(!isUserDropdownOpen);
                setIsLangDropdownOpen(false);
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5 transition-colors duration-200 cursor-pointer"
              aria-label="User menu"
            >
              <FaUser className="text-lg text-white/90" />
            </button>

            {/* User Dropdown */}
            <div
              className={`absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl py-2 w-48 z-50 transition-all duration-200 origin-top-right
                ${isUserDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
            >
              {user ? (
                // Authenticated User
                <>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  {finalUserMenu.authenticated?.map((item, index) => (
                    item.divider ? (
                      <div key={index} className="border-t border-gray-100 my-1" />
                    ) : item.type === 'link' ? (
                      <Link
                        key={index}
                        href={route(item.route)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ) : item.type === 'button' && item.action === 'logout' ? (
                      <button
                        key={index}
                        onClick={() => {
                          handleLogout();
                          setIsUserDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors duration-150"
                      >
                        {item.label}
                      </button>
                    ) : null
                  ))}
                </>
              ) : (
                // Guest User
                finalUserMenu.guest?.map((item) => (
                  <Link
                    key={item.label}
                    href={route(item.route)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Divider before social links */}
          {hasSocialLinks && <div className="w-px h-5 bg-white/10 hidden sm:block" />}

          {/* SOCIAL LINKS */}
          {hasSocialLinks && (
            <div className="flex items-center gap-2 xl:gap-3">
              {socialLinks.map((social) => {
                const IconComponent = iconMap[social.iconName];
                if (!IconComponent) return null;
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-white/80 text-lg xl:text-xl ${social.hoverColor || ''} transition-all duration-200 hover:scale-110 hover:text-white`}
                    aria-label={social.name}
                  >
                    <IconComponent />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          MOBILE TOP BAR
          ============================================ */}
      <div className='lg:hidden bg-[#080C14] px-4 py-2 relative z-50 border-b border-white/5'>
        <div className='flex justify-between items-center'>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white/90 focus:outline-none p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-3">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="text-white/90 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
            >
              <FiSearch className="text-xl" />
            </button>

            {/* Mobile User Icon */}
            <Link href={user ? route('backend.dashboard') : route('login')} className="text-white/90 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200">
              <FaUser className="text-lg" />
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar (expanded) */}
        {isSearchExpanded && (
          <form onSubmit={handleSearchSubmit} className="flex items-center mt-3 animate-slideIn">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 px-3 py-2 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-[#009BE2] bg-white/10 text-white placeholder-white/50"
              autoFocus
            />
            <button
              type="submit"
              className="bg-[#009BE2] px-3 py-2 rounded-r-md hover:bg-[#009BE2]/80 transition-colors duration-200"
            >
              <FiSearch className="text-white text-sm" />
            </button>
          </form>
        )}

        {/* Mobile Menu Content - Slide Down */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-150 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="space-y-4 pb-4">
            {/* Contact Info */}
            {hasContactInfo && (
              <div className="space-y-3 p-2">
                {hasValue(contactInfo.email?.text) && (
                  <a href={`mailto:${contactInfo.email.text}`}
                    className="flex items-center gap-2 text-white/90 text-sm hover:text-[#009BE2] transition-colors duration-200">
                    {hasValue(contactInfo.email?.icon) && (
                      <img
                        src={getImageSrc(contactInfo.email.icon)}
                        alt={contactInfo.email.alt || 'Email'}
                        className="w-4 h-4 opacity-80"
                      />
                    )}
                    <span>{contactInfo.email.text}</span>
                  </a>
                )}

                {hasValue(contactInfo.phone?.text) && (
                  <a href={`tel:${contactInfo.phone.text.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 text-white/90 text-sm hover:text-[#009BE2] transition-colors duration-200">
                    {hasValue(contactInfo.phone?.icon) && (
                      <img
                        src={getImageSrc(contactInfo.phone.icon)}
                        alt={contactInfo.phone.alt || 'Phone'}
                        className="w-4 h-4 opacity-80"
                      />
                    )}
                    <span>{contactInfo.phone.text}</span>
                  </a>
                )}

                {hasValue(contactInfo.hours?.text) && (
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    {hasValue(contactInfo.hours?.icon) && (
                      <img
                        src={getImageSrc(contactInfo.hours.icon)}
                        alt={contactInfo.hours.alt || 'Hours'}
                        className="w-4 h-4 opacity-80"
                      />
                    )}
                    <span>{contactInfo.hours.text}</span>
                  </div>
                )}
              </div>
            )}

            {hasContactInfo && <div className="border-t border-white/10" />}

            {/* Language Selector */}
            {hasLanguages && (
              <>
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/90 text-sm font-medium">Language</span>
                    <button
                      onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
                    >
                      <img
                        src={getImageSrc(selectedLanguage.flag)}
                        alt={selectedLanguage.name}
                        className="w-5 h-5 rounded-sm"
                      />
                      <span className="text-white/90 text-sm">{selectedLanguage.name}</span>
                      {isLangDropdownOpen ?
                        <FaAngleUp className="text-white/70 text-xs" /> :
                        <FaAngleDown className="text-white/70 text-xs" />
                      }
                    </button>
                  </div>

                  {isLangDropdownOpen && (
                    <div className="mt-2 bg-white rounded-lg shadow-xl py-2">
                      {languagesToShow.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageSelect(lang)}
                          className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left transition-colors duration-150 ${selectedLanguage.code === lang.code ? 'bg-blue-50' : ''
                            }`}
                        >
                          <img
                            src={getImageSrc(lang.flag)}
                            alt={lang.name}
                            className="w-5 h-5 rounded-sm"
                          />
                          <span className={`text-sm ${selectedLanguage.code === lang.code ? 'text-[#009BE2] font-medium' : 'text-gray-700'}`}>
                            {lang.name}
                          </span>
                          {selectedLanguage.code === lang.code && (
                            <span className="ml-auto text-[#009BE2]">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10" />
              </>
            )}

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="p-2">
                <div className="flex justify-center gap-4">
                  {socialLinks.map((social) => {
                    const IconComponent = iconMap[social.iconName];
                    if (!IconComponent) return null;
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-white/80 text-xl ${social.hoverColor || ''} transition-all duration-200 hover:text-white hover:scale-110`}
                        aria-label={social.name}
                      >
                        <IconComponent />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          INLINE STYLES - Search Animation
          ============================================ */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default TopBar;