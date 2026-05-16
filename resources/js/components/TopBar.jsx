// resources/js/components/TopBar.jsx

// Icons
import { FiSearch } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { FaFacebook, FaInstagram, FaLinkedin, FaUser } from "react-icons/fa6";

// React
import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

const TopBar = ({ topBarData }) => {
  // Get auth from usePage
  const { auth } = usePage().props;
  const user = auth?.user;

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState({
    code: 'us',
    name: 'English',
    flag: '/images/Flags/united-states.png'
  });

  // Refs
  const langRef = useRef(null);
  const userRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        if (!searchQuery) {
          setIsSearchExpanded(false);
        }
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    // console.log('Selected language:', language);
    setIsLangDropdownOpen(false);
    // You can add additional logic here for language change
    // For example: change app locale, RTL support, etc.
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // console.log('Searching for:', searchQuery);
    // Implement search logic
    router.get('/search', { q: searchQuery });
    setIsSearchExpanded(false);
    setSearchQuery('');
  };

  const handleLogout = () => {
    router.post('/logout');
  };

  return (
    <>
      {/* Desktop Top Bar - Hidden on mobile */}
      <div className='hidden lg:flex justify-between items-center px-10 py-3 bg-[#080C14] relative z-50'>
        {/* Left - Contact Info */}
        <div className='flex items-center space-x-6'>
          <div className='flex items-center space-x-2'>
            <img src={topBarData.contactInfo.email.icon} alt={topBarData.contactInfo.email.alt} className="w-4 h-4" />
            <a href={`mailto:${topBarData.contactInfo.email.text}`} className='text-white text-sm hover:text-[#009BE2] transition-colors'>
              {topBarData.contactInfo.email.text}
            </a>
          </div>

          <div className='flex items-center space-x-2'>
            <img src={topBarData.contactInfo.phone.icon} alt={topBarData.contactInfo.phone.alt} className="w-4 h-4" />
            <a href={`tel:${topBarData.contactInfo.phone.text.replace(/\s/g, '')}`} className='text-white text-sm hover:text-[#009BE2] transition-colors'>
              {topBarData.contactInfo.phone.text}
            </a>
          </div>

          <div className='flex items-center space-x-2'>
            <img src={topBarData.contactInfo.hours.icon} alt={topBarData.contactInfo.hours.alt} className="w-4 h-4" />
            <p className='text-white text-sm'>{topBarData.contactInfo.hours.text}</p>
          </div>
        </div>

        {/* Right - Social Media Section */}
        <div className="flex items-center gap-3 space-x-4">
          {/* Language Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => {
                setIsLangDropdownOpen(!isLangDropdownOpen);
                setIsUserDropdownOpen(false);
              }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="Select language"
            >
              <img src={selectedLanguage.flag} alt={selectedLanguage.name} className="w-5 h-5" />
              {isLangDropdownOpen ? <FaAngleUp className="text-white transition-transform duration-200" /> : <FaAngleDown className="text-white transition-transform duration-200" />}
            </button>

            {/* Language Dropdown Menu with Animation */}
            <div
              className={`absolute top-full mt-2 right-0 bg-white rounded-md shadow-lg py-2 w-40 z-50 transition-all duration-300 origin-top-right
                ${isLangDropdownOpen
                  ? 'opacity-100 scale-100 visible'
                  : 'opacity-0 scale-95 invisible'}`}
            >
              {topBarData.languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang)}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left transition-colors duration-150 ${selectedLanguage.code === lang.code ? 'bg-blue-50' : ''
                    }`}
                >
                  <img src={lang.flag} alt={lang.name} className="w-5 h-5" />
                  <span className={`text-sm ${selectedLanguage.code === lang.code ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                    {lang.name}
                  </span>
                  {selectedLanguage.code === lang.code && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Vertical Line */}
          <div className="w-px h-5 bg-gray-600"></div>

          {/* Expandable Search with Animation */}
          <div className="relative" ref={searchRef}>
            <div className="overflow-hidden">
              <div
                className={`transition-all duration-300 ease-in-out
                  ${isSearchExpanded ? 'w-64 opacity-100' : 'w-6 opacity-100'}`}
              >
                {isSearchExpanded ? (
                  <form onSubmit={handleSearchSubmit} className="flex items-center animate-slideIn">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={topBarData.search.placeholder}
                      className="px-3 py-1 rounded-l-md text-sm focus:outline-none text-white focus:ring-1 focus:ring-[#009BE2] w-full"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-[#009BE2] px-3 py-1 rounded-r-md hover:bg-[#009BE2]/80 transition-colors duration-200"
                    >
                      <FiSearch className="text-white text-sm" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsSearchExpanded(true)}
                    className="flex items-center hover:opacity-80 transition-opacity duration-200"
                    aria-label="Search"
                  >
                    <FiSearch className="text-xl text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Vertical Line */}
          <div className="w-px h-5 bg-gray-600"></div>

          {/* User Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => {
                setIsUserDropdownOpen(!isUserDropdownOpen);
                setIsLangDropdownOpen(false);
              }}
              className="flex items-center hover:opacity-80 transition-opacity duration-200"
              aria-label="User menu"
            >
              <FaUser className="text-xl text-white" />
            </button>

            {/* User Dropdown Menu with Animation */}
            <div
              className={`absolute top-full mt-2 right-0 bg-white rounded-md shadow-lg py-2 w-48 z-50 transition-all duration-300 origin-top-right
                ${isUserDropdownOpen
                  ? 'opacity-100 scale-100 visible'
                  : 'opacity-0 scale-95 invisible'}`}
            >
              {user ? (
                // Authenticated User Menu
                <>
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  {topBarData.userMenu.authenticated.map((item, index) => (
                    item.divider ? (
                      <div key={index} className="border-t border-gray-200 my-1"></div>
                    ) : item.type === 'link' ? (
                      <Link
                        key={index}
                        href={route(item.route)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
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
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors duration-150"
                      >
                        {item.label}
                      </button>
                    ) : null
                  ))}
                </>
              ) : (
                // Guest User Menu
                topBarData.userMenu.guest.map((item) => (
                  <Link
                    key={item.label}
                    href={route(item.route)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Vertical Line */}
          <div className="w-px h-5 bg-gray-600"></div>

          {/* Social Icons with Hover Animation */}
          {topBarData.socialLinks.map((social) => {
            const IconComponent = social.icon;
            return (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xl text-white ${social.hoverColor} transition-all duration-200 hover:scale-110`}
                aria-label={social.name}
              >
                <IconComponent />
              </a>
            );
          })}
        </div>
      </div>

      {/* Mobile Top Bar - Visible only on mobile */}
      <div className='lg:hidden bg-[#080C14] px-4 py-2 relative z-50'>
        {/* Mobile Header with Logo and Menu Button */}
        <div className='flex justify-between items-center'>
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/images/Icon.svg"
              alt="DUS Logo"
              className="h-8 w-auto"
            />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white focus:outline-none"
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
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="space-y-4 pb-4">
            {/* Contact Info - Mobile */}
            <div className="space-y-3">
              <a href={`mailto:${topBarData.contactInfo.email.text}`} className="flex items-center gap-2 text-white text-sm hover:text-[#009BE2] transition-colors">
                <img src={topBarData.contactInfo.email.icon} alt={topBarData.contactInfo.email.alt} className="w-4 h-4" />
                <span>{topBarData.contactInfo.email.text}</span>
              </a>

              <a href={`tel:${topBarData.contactInfo.phone.text.replace(/\s/g, '')}`} className="flex items-center gap-2 text-white text-sm hover:text-[#009BE2] transition-colors">
                <img src={topBarData.contactInfo.phone.icon} alt={topBarData.contactInfo.phone.alt} className="w-4 h-4" />
                <span>{topBarData.contactInfo.phone.text}</span>
              </a>

              <div className="flex items-center gap-2 text-white text-sm">
                <img src={topBarData.contactInfo.hours.icon} alt={topBarData.contactInfo.hours.alt} className="w-4 h-4" />
                <span>{topBarData.contactInfo.hours.text}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700"></div>

            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={topBarData.search.placeholder}
                className="flex-1 px-3 py-2 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-[#009BE2] bg-white"
              />
              <button
                type="submit"
                className="bg-[#009BE2] px-3 py-2 rounded-r-md hover:bg-[#009BE2]/80 transition-colors duration-200"
              >
                <FiSearch className="text-white text-sm" />
              </button>
            </form>

            {/* Divider */}
            <div className="border-t border-gray-700"></div>

            {/* Mobile Language Selector */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Language</span>
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center gap-2"
                >
                  <img src={selectedLanguage.flag} alt={selectedLanguage.name} className="w-5 h-5" />
                  <span className="text-white text-sm">{selectedLanguage.name}</span>
                  {isLangDropdownOpen ? <FaAngleUp className="text-white" /> : <FaAngleDown className="text-white" />}
                </button>
              </div>

              {isLangDropdownOpen && (
                <div className="mt-2 bg-white rounded-md shadow-lg py-2">
                  {topBarData.languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left transition-colors duration-150 ${selectedLanguage.code === lang.code ? 'bg-blue-50' : ''
                        }`}
                    >
                      <img src={lang.flag} alt={lang.name} className="w-5 h-5" />
                      <span className={`text-sm ${selectedLanguage.code === lang.code ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                        {lang.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700"></div>

            {/* Mobile User Menu */}
            <div>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 text-white text-sm w-full"
              >
                <FaUser className="text-white" />
                <span>Account</span>
                {isUserDropdownOpen ? <FaAngleUp className="text-white ml-auto" /> : <FaAngleDown className="text-white ml-auto" />}
              </button>

              {isUserDropdownOpen && (
                <div className="mt-2 bg-white rounded-md shadow-lg py-2">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {topBarData.userMenu.authenticated.map((item, index) => (
                        item.divider ? (
                          <div key={index} className="border-t border-gray-200 my-1"></div>
                        ) : item.type === 'link' ? (
                          <Link
                            key={index}
                            href={route(item.route)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            {item.label}
                          </Link>
                        ) : item.type === 'button' && item.action === 'logout' ? (
                          <button
                            key={index}
                            onClick={() => {
                              handleLogout();
                              setIsUserDropdownOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            {item.label}
                          </button>
                        ) : null
                      ))}
                    </>
                  ) : (
                    topBarData.userMenu.guest.map((item) => (
                      <Link
                        key={item.label}
                        href={route(item.route)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {item.label}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700"></div>

            {/* Mobile Social Icons */}
            <div className="flex justify-center gap-4">
              {topBarData.socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-white text-xl ${social.hoverColor} transition-all duration-200`}
                    aria-label={social.name}
                  >
                    <IconComponent />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animation keyframes */}
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