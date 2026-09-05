// resources/js/components/TopBar.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { FiSearch } from "react-icons/fi";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { FaFacebook, FaInstagram, FaLinkedin, FaXTwitter, FaUser } from "react-icons/fa6";
import createContactImage from '../utils/createContactImage';

// SVG Icons
const EmailIcon = () => (
  <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.75 0H0.749998C0.551088 0 0.360318 0.079018 0.219668 0.21967C0.079018 0.360322 0 0.55109 0 0.75V13.5C0 13.8978 0.158035 14.2794 0.439338 14.5607C0.720648 14.842 1.10218 15 1.5 15H18C18.3978 15 18.7794 14.842 19.0607 14.5607C19.342 14.2794 19.5 13.8978 19.5 13.5V0.75C19.5 0.55109 19.421 0.360322 19.2803 0.21967C19.1397 0.079018 18.9489 0 18.75 0ZM7.00406 7.5L1.5 12.5447V2.45531L7.00406 7.5ZM8.11406 8.51719L9.23909 9.5531C9.37739 9.6801 9.55839 9.7506 9.74629 9.7506C9.93409 9.7506 10.1151 9.6801 10.2534 9.5531L11.3784 8.51719L16.8159 13.5H2.67844L8.11406 8.51719ZM12.4959 7.5L18 2.45438V12.5456L12.4959 7.5Z" fill="white" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.02035 1.04461C9.04071 0.96846 9.07589 0.89707 9.12385 0.83452C9.17182 0.77198 9.23164 0.71949 9.2999 0.68007C9.36815 0.64065 9.44351 0.61506 9.52166 0.60477C9.59981 0.59448 9.67919 0.59969 9.75539 0.6201C10.8677 0.91032 11.8825 1.4918 12.6954 2.30465C13.5082 3.1175 14.0897 4.13234 14.3799 5.24465C14.4003 5.32078 14.4055 5.40019 14.3952 5.47834C14.385 5.55649 14.3594 5.63185 14.3199 5.70011C14.2805 5.76836 14.228 5.82819 14.1655 5.87615C14.1029 5.92412 14.0316 5.95929 13.9554 5.97966C13.9047 5.99297 13.8526 5.99977 13.8002 5.99991C13.668 5.99995 13.5396 5.95638 13.4348 5.87596C13.3299 5.79554 13.2546 5.68277 13.2204 5.55515C12.9838 4.647 12.5093 3.81837 11.8458 3.15471C11.1822 2.49105 10.3537 2.01637 9.4456 1.77962C9.36939 1.75933 9.29792 1.72422 9.23529 1.67628C9.17265 1.62835 9.12009 1.56854 9.08059 1.50028C9.04109 1.43201 9.01544 1.35663 9.0051 1.27844C8.99477 1.20025 8.99995 1.12079 9.02035 1.04461ZM8.84559 4.17964C9.87989 4.45564 10.5444 5.1209 10.8204 6.15516C10.8546 6.28278 10.9299 6.39555 11.0347 6.47597C11.1396 6.55638 11.268 6.59995 11.4001 6.59991C11.4525 6.59978 11.5047 6.59297 11.5554 6.57966C11.6315 6.5593 11.7029 6.52412 11.7655 6.47616C11.828 6.42819 11.8805 6.36837 11.9199 6.30011C11.9593 6.23186 11.9849 6.1565 11.9952 6.07835C12.0055 6.0002 12.0003 5.92079 11.9799 5.84465C11.5959 4.40764 10.5924 3.40413 9.15535 3.02013C9.00159 2.97905 8.83781 3.00074 8.70004 3.08042C8.56227 3.1601 8.46179 3.29125 8.42071 3.44501C8.37964 3.59877 8.40133 3.76255 8.48101 3.90032C8.56069 4.03809 8.69183 4.13856 8.84559 4.17964ZM14.2779 10.0844L10.7446 8.50118L10.7349 8.49668C10.5514 8.41823 10.3514 8.38674 10.1527 8.40508C9.95399 8.42341 9.76309 8.49098 9.5971 8.60168C9.57756 8.61459 9.55878 8.62861 9.54085 8.64368L7.71533 10.1999C6.55882 9.6382 5.36481 8.45318 4.80306 7.31167L6.36157 5.4584C6.37657 5.43965 6.39082 5.4209 6.40432 5.40065C6.51264 5.23513 6.57836 5.04539 6.59564 4.84832C6.61291 4.65126 6.5812 4.45298 6.50332 4.27114V4.26214L4.91556 0.72286C4.81261 0.485302 4.6356 0.287412 4.41094 0.158729C4.18629 0.0300451 3.92604 -0.0225309 3.66904 0.00884805C2.65276 0.14258 1.71991 0.64168 1.04472 1.41293C0.369526 2.18419 -0.00183121 3.17485 6.7902e-06 4.19989C6.7902e-06 10.1549 4.84506 15 10.8001 15C11.8252 15.0018 12.8158 14.6305 13.5871 13.9553C14.3583 13.2801 14.8574 12.3472 14.9912 11.331C15.0226 11.0741 14.9701 10.8139 14.8416 10.5892C14.713 10.3646 14.5153 10.1875 14.2779 10.0844Z" fill="white" />
  </svg>
);

const HoursIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 0.893262C11.0055 1.47383 11.842 2.30695 12.4265 3.31013C13.0111 4.31331 13.3236 5.45178 13.333 6.61282C13.3423 7.77387 13.0483 8.91723 12.48 9.92973C11.9117 10.9422 11.0888 11.7887 10.0928 12.3855C9.09683 12.9822 7.96224 13.3085 6.8014 13.332C5.64055 13.3555 4.4937 13.0754 3.47437 12.5194C2.45504 11.9635 1.59858 11.1509 0.989778 10.1623C0.380975 9.1736 0.0409395 8.04307 0.00333341 6.8826L0 6.66659L0.00333341 6.45059C0.0406688 5.29926 0.375698 4.17724 0.97576 3.19392C1.57582 2.21061 2.42044 1.39956 3.42726 0.83985C4.43409 0.280137 5.56876 -0.00914052 6.72067 0.000220164C7.87258 0.00958085 9.0024 0.31726 10 0.893262ZM6.66667 2.66659C6.50338 2.66662 6.34577 2.72657 6.22375 2.83507C6.10173 2.94358 6.02377 3.09309 6.00467 3.25526L6 3.33326V6.66659L6.006 6.75393C6.0212 6.86959 6.06649 6.97925 6.13733 7.07193L6.19533 7.1386L8.19533 9.1386L8.258 9.19326C8.37492 9.28397 8.51869 9.33321 8.66667 9.33321C8.81464 9.33321 8.95842 9.28397 9.07533 9.19326L9.138 9.13793L9.19333 9.07526C9.28404 8.95835 9.33328 8.81457 9.33328 8.6666C9.33328 8.51862 9.28404 8.37484 9.19333 8.25793L9.138 8.19526L7.33333 6.38993V3.33326L7.32867 3.25526C7.30956 3.09309 7.2316 2.94358 7.10958 2.83507C6.98756 2.72657 6.82996 2.66662 6.66667 2.66659Z" fill="white" />
  </svg>
);

// UTILITY
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// ICON MAPPING
const iconMap = {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaXTwitter
};

const TopBar = ({ topBarData }) => {
  const { auth } = usePage().props;
  const user = auth?.user;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for generated contact images
  const [emailImageHtml, setEmailImageHtml] = useState(null);
  const [phoneImageHtml, setPhoneImageHtml] = useState(null);

  const langRef = useRef(null);
  const userRef = useRef(null);
  const searchRef = useRef(null);

  const {
    contactInfo = {},
    languages = [],
    socialLinks = [],
    userMenu = {}
  } = topBarData || {};

  // Filter languages to only show 'us' and 'bd'
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
      name: 'English'
    };
  };

  const [selectedLanguage, setSelectedLanguage] = useState(getInitialLanguage);

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

  // Generate contact images using createContactImage
  useEffect(() => {
    // Generate email image
    if (contactInfo.email?.text) {
      try {
        const emailLink = createContactImage({
          type: 'email',
          value: contactInfo.email.text,
          alt: 'Email us',
          fontSize: 14,
          fontFamily: 'Arial',
          textColor: '#FFFFFF',
          backgroundColor: 'transparent',
          padding: 0,
        });
        // Extract the image element HTML
        const imgElement = emailLink.querySelector('img');
        if (imgElement) {
          setEmailImageHtml(imgElement.outerHTML);
        } else {
          setEmailImageHtml(null);
        }
      } catch (error) {
        console.error('Error creating email image:', error);
        setEmailImageHtml(null);
      }
    } else {
      setEmailImageHtml(null);
    }

    // Generate phone image
    if (contactInfo.phone?.text) {
      try {
        const phoneLink = createContactImage({
          type: 'phone',
          value: contactInfo.phone.text,
          alt: 'Call us',
          fontSize: 14,
          fontFamily: 'Arial',
          textColor: '#FFFFFF',
          backgroundColor: 'transparent',
          padding: 0,
        });
        // Extract the image element HTML
        const imgElement = phoneLink.querySelector('img');
        if (imgElement) {
          setPhoneImageHtml(imgElement.outerHTML);
        } else {
          setPhoneImageHtml(null);
        }
      } catch (error) {
        console.error('Error creating phone image:', error);
        setPhoneImageHtml(null);
      }
    } else {
      setPhoneImageHtml(null);
    }
  }, [contactInfo]);

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
    localStorage.setItem('selectedLanguage', JSON.stringify(language));
    setIsLangDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.get('/search', { q: searchQuery });
    setIsSearchExpanded(false);
    setSearchQuery('');
  };

  const handleLogout = () => {
    router.post('/logout');
  };

  const hasContactInfo = hasValue(contactInfo.email?.text) ||
    hasValue(contactInfo.phone?.text) ||
    hasValue(contactInfo.hours?.text);

  const hasSocialLinks = hasValue(socialLinks);
  const hasLanguages = hasValue(languagesToShow);

  if (!hasValue(topBarData) || (!hasContactInfo && !hasSocialLinks && !hasLanguages)) {
    return null;
  }

  // Get avatar letters for selected language
  const avatarLetters = (selectedLanguage?.name || selectedLanguage?.code || 'EN').slice(0, 2).toUpperCase();

  return (
    <>
      {/* DESKTOP TOP BAR */}
      <div className='hidden lg:flex justify-between items-center px-8 xl:px-16 2xl:px-25 py-4.75 bg-[#080C14] relative border-b border-white/5 z-40'>

        {/* Left Side - Contact Info */}
        {hasContactInfo && (
          <div className='flex items-center space-x-4 xl:space-x-5'>
            {hasValue(contactInfo.email?.text) && (
              <div className='flex items-center space-x-2'>
                <EmailIcon />
                {emailImageHtml ? (
                  <a
                    href={`mailto:${contactInfo.email.text}`}
                    className="hover:opacity-80 transition-opacity duration-200 inline-block"
                    dangerouslySetInnerHTML={{ __html: emailImageHtml }}
                  />
                ) : (
                  <a
                    href={`mailto:${contactInfo.email.text}`}
                    className='text-white/90 text-[10px] xl:text-[16px] font-normal hover:text-[#009BE2] transition-colors duration-200'
                  >
                    {contactInfo.email.text}
                  </a>
                )}
              </div>
            )}

            {hasValue(contactInfo.email?.text) && hasValue(contactInfo.phone?.text) && (
              <div className="bg-white/20 h-3.75 w-px hidden sm:block" />
            )}

            {hasValue(contactInfo.phone?.text) && (
              <div className='flex items-center space-x-2'>
                <PhoneIcon />
                {phoneImageHtml ? (
                  <a
                    href={`tel:${contactInfo.phone.text.replace(/\s/g, '')}`}
                    className="hover:opacity-80 transition-opacity duration-200 inline-block"
                    dangerouslySetInnerHTML={{ __html: phoneImageHtml }}
                  />
                ) : (
                  <a
                    href={`tel:${contactInfo.phone.text.replace(/\s/g, '')}`}
                    className='text-white/90 text-[10px] xl:text-[16px] font-normal hover:text-[#009BE2] transition-colors duration-200'
                  >
                    {contactInfo.phone.text}
                  </a>
                )}
              </div>
            )}

            {(hasValue(contactInfo.phone?.text) || hasValue(contactInfo.email?.text)) && hasValue(contactInfo.hours?.text) && (
              <div className="bg-white/20 h-3.75 w-px hidden sm:block" />
            )}

            {hasValue(contactInfo.hours?.text) && (
              <div className='flex items-center space-x-2'>
                <HoursIcon />
                <p className='text-white/80 text-[10px] xl:text-[16px] font-normal'>{contactInfo.hours.text}</p>
              </div>
            )}
          </div>
        )}

        {/* Right Side - Language, Search, User, Social */}
        <div className='flex items-center space-x-4 xl:space-x-5'>

          {/* LANGUAGE SELECTOR - With Avatar */}
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
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {avatarLetters}
                </div>
                {isLangDropdownOpen ?
                  <FaAngleUp className="text-white/70 text-xs transition-transform duration-200" /> :
                  <FaAngleDown className="text-white/70 text-xs transition-transform duration-200" />
                }
              </button>

              {/* Language Dropdown */}
              <div
                className={`absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl py-2 w-48 transition-all duration-200 origin-top-right z-100
                  ${isLangDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
              >
                {languagesToShow.map((lang) => {
                  const langAvatar = (lang.name || lang.code || '??').slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-50 w-full text-left transition-colors duration-150 cursor-pointer ${selectedLanguage.code === lang.code ? 'bg-purple-50' : ''
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${selectedLanguage.code === lang.code ? 'bg-purple-600' : 'bg-gray-400'
                        }`}>
                        {langAvatar}
                      </div>
                      <span className={`text-sm ${selectedLanguage.code === lang.code ? 'text-purple-600 font-medium' : 'text-gray-700'}`}>
                        {lang.name}
                      </span>
                      {selectedLanguage.code === lang.code && (
                        <span className="ml-auto text-purple-600">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          {hasLanguages && (hasSocialLinks || hasContactInfo) && (
            <div className="bg-white/20 h-3.75 w-px hidden sm:block" />
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
          <div className="bg-white/20 h-3.75 w-px hidden sm:block" />

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
              className={`absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl py-2 w-48 transition-all duration-200 origin-top-right z-100
                ${isUserDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
            >
              {user ? (
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
          {hasSocialLinks && <div className="bg-white/20 h-3.75 w-px hidden sm:block" />}

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
                    className={`text-white/80 text-lg xl:text-xl px-2.5 ${social.hoverColor || ''} transition-all duration-200 hover:scale-110 hover:text-white`}
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

      {/* MOBILE TOP BAR */}
      <div className='lg:hidden bg-[#080C14] px-4 py-2 relative border-b border-white/5 z-40'>
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

        {/* Mobile Search Bar */}
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

        {/* Mobile Menu Content */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-150 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="space-y-4 pb-4">
            {/* Contact Info */}
            {hasContactInfo && (
              <div className="space-y-3 p-2">
                {hasValue(contactInfo.email?.text) && (
                  <div className="flex items-center gap-2">
                    <EmailIcon />
                    {emailImageHtml ? (
                      <a
                        href={`mailto:${contactInfo.email.text}`}
                        className="hover:opacity-80 transition-opacity duration-200 inline-block"
                        dangerouslySetInnerHTML={{ __html: emailImageHtml }}
                      />
                    ) : (
                      <a
                        href={`mailto:${contactInfo.email.text}`}
                        className="text-white/90 text-sm hover:text-[#009BE2] transition-colors duration-200"
                      >
                        {contactInfo.email.text}
                      </a>
                    )}
                  </div>
                )}

                {hasValue(contactInfo.phone?.text) && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon />
                    {phoneImageHtml ? (
                      <a
                        href={`tel:${contactInfo.phone.text.replace(/\s/g, '')}`}
                        className="hover:opacity-80 transition-opacity duration-200 inline-block"
                        dangerouslySetInnerHTML={{ __html: phoneImageHtml }}
                      />
                    ) : (
                      <a
                        href={`tel:${contactInfo.phone.text.replace(/\s/g, '')}`}
                        className="text-white/90 text-sm hover:text-[#009BE2] transition-colors duration-200"
                      >
                        {contactInfo.phone.text}
                      </a>
                    )}
                  </div>
                )}

                {hasValue(contactInfo.hours?.text) && (
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <HoursIcon />
                    <span>{contactInfo.hours.text}</span>
                  </div>
                )}
              </div>
            )}

            {hasContactInfo && <div className="border-t border-white/10" />}

            {/* Language Selector - Mobile with Avatar */}
            {hasLanguages && (
              <>
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/90 text-sm font-medium">Language</span>
                    <button
                      onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {avatarLetters}
                      </div>
                      <span className="text-white/90 text-sm">{selectedLanguage.name}</span>
                      {isLangDropdownOpen ?
                        <FaAngleUp className="text-white/70 text-xs" /> :
                        <FaAngleDown className="text-white/70 text-xs" />
                      }
                    </button>
                  </div>

                  {isLangDropdownOpen && (
                    <div className="mt-2 bg-white rounded-lg shadow-xl py-2 z-100 relative">
                      {languagesToShow.map((lang) => {
                        const langAvatar = (lang.name || lang.code || '??').slice(0, 2).toUpperCase();
                        return (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang)}
                            className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-50 w-full text-left transition-colors duration-150 ${selectedLanguage.code === lang.code ? 'bg-purple-50' : ''
                              }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${selectedLanguage.code === lang.code ? 'bg-purple-600' : 'bg-gray-400'
                              }`}>
                              {langAvatar}
                            </div>
                            <span className={`text-sm ${selectedLanguage.code === lang.code ? 'text-purple-600 font-medium' : 'text-gray-700'}`}>
                              {lang.name}
                            </span>
                            {selectedLanguage.code === lang.code && (
                              <span className="ml-auto text-purple-600">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10" />
              </>
            )}

            {/* Social Links - Mobile */}
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

      {/* INLINE STYLES */}
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
        
        /* Style for contact images */
        .topbar-contact-image {
          display: inline-block;
          vertical-align: middle;
        }
      `}</style>
    </>
  );
};

export default TopBar;