// resources/js/components/Footer.jsx

/**
 * ============================================
 * FOOTER - Site Footer Component
 * ============================================
 * 
 * PURPOSE:
 * - Renders the website footer with all sections
 * - Provides navigation links, social media, and newsletter
 * - Responsive: Desktop grid layout, mobile accordion
 * 
 * SECTIONS:
 * 1. Left Column: Logo, description, social links, address/contact
 * 2. Right Column: Quick Links, Our Programs, Newsletter
 * 
 * DATA STRUCTURE:
 * {
 *   logo: { src, alt, className },
 *   description: string,
 *   socialLinks: [{ iconName, url, hoverColor }],
 *   address: { title, details },
 *   contact: { title, numbers: [] },
 *   email: { title, addresses: [] },
 *   quickLinks: [{ name, url }],
 *   programs: [{ name, url }],
 *   newsletter: { title, placeholder, buttonText },
 *   bottomFooter: { copyright, links: [{ text, url }] },
 *   quickLinkLinkIcon: string,
 *   OurProgramLinkIcon: string
 * }
 * 
 * ============================================
 */

// React
import { Link } from '@inertiajs/react';
import React, { useState, useCallback, memo } from 'react';

// Icons
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaXTwitter,
  FaYoutube,
  FaTiktok,
  FaPinterest,
  FaWhatsapp,
  FaTelegram
} from 'react-icons/fa6';

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
// ICON MAPPING - Extended with common social icons
// ============================================
const iconMap = {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaXTwitter,
  FaYoutube,
  FaTiktok,
  FaPinterest,
  FaWhatsapp,
  FaTelegram,
  // Aliases for common variations
  facebook: FaFacebook,
  instagram: FaInstagram,
  linkedin: FaLinkedin,
  twitter: FaXTwitter,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  pinterest: FaPinterest,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
};

/**
 * Helper: Get icon component by name
 */
const getIconComponent = (iconName) => {
  if (!iconName) return null;
  // Try direct match first, then case-insensitive match
  if (iconMap[iconName]) return iconMap[iconName];

  // Try case-insensitive match
  const lowerName = iconName.toLowerCase();
  for (const [key, value] of Object.entries(iconMap)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  return null;
};

/**
 * Footer Component
 * 
 * @param {Object} props
 * @param {Object} props.footerData - Footer configuration data
 * @param {string} props.storageUrl - Base URL for image storage
 * @param {string} props.defaultLogo - Fallback logo URL
 * 
 * @returns {JSX.Element} Rendered footer
 */
const Footer = ({ footerData, storageUrl = '', defaultLogo = '/images/default-logo.png' }) => {
  // ============================================
  // STATE - All hooks must be called unconditionally
  // ============================================
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitMessageType, setSubmitMessageType] = useState(''); // 'success' | 'error'
  const [logoError, setLogoError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState({
    quickLinks: false,
    programs: false
  });

  // ============================================
  // HOOKS - All useCallback must be called before early return
  // ============================================

  /**
   * Build image URL with storage path
   */
  const getImageSrc = useCallback((imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/storage/')) {
      return imagePath;
    }
    if (imagePath.startsWith('/asset/')) {
      return imagePath;
    }
    if (storageUrl) {
      const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
      return `${storageUrl}${cleanPath}`;
    }
    return imagePath;
  }, [storageUrl]);

  /**
   * Handle logo image error
   */
  const handleLogoError = useCallback(() => {
    setLogoError(true);
  }, []);

  /**
   * Toggle mobile accordion sections
   */
  const toggleMobileSection = useCallback((section) => {
    setIsMobileMenuOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  /**
   * Handle newsletter subscription
   */
  const handleSubscribe = useCallback(async (e) => {
    e.preventDefault();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setSubmitMessage('Please enter a valid email address');
      setSubmitMessageType('error');
      setTimeout(() => {
        setSubmitMessage('');
        setSubmitMessageType('');
      }, 4000);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitMessageType('');

    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitMessage('Successfully subscribed to our newsletter! 🎉');
        setSubmitMessageType('success');
        setEmail('');
      } else {
        const data = await response.json().catch(() => ({}));
        setSubmitMessage(data.message || 'Subscription failed. Please try again.');
        setSubmitMessageType('error');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setSubmitMessage('Unable to subscribe at this time. Please try again later.');
      setSubmitMessageType('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSubmitMessage('');
        setSubmitMessageType('');
      }, 5000);
    }
  }, [email]);

  /**
   * Render link with icon
   */
  const renderLinkWithIcon = useCallback((link, iconSrc, index) => {
    const iconUrl = getImageSrc(iconSrc);
    return (
      <li key={index} className='flex items-center group'>
        {hasValue(iconSrc) && iconUrl && (
          <img
            src={iconUrl}
            alt=""
            className='mr-3 w-2.5 h-auto opacity-70 group-hover:opacity-100 transition-opacity'
            aria-hidden="true"
            loading="lazy"
          />
        )}
        <Link
          href={link.url}
          className="hover:text-[#009BE2] transition-colors cursor-pointer text-white font-400 text-[14px]"
        >
          {link.name}
        </Link>
      </li>
    );
  }, [getImageSrc]);

  // ============================================
  // EARLY RETURN - After all hooks
  // ============================================
  if (!hasValue(footerData)) return null;

  // ============================================
  // DESTRUCTURE DATA
  // ============================================
  const {
    logo = {},
    description = '',
    socialLinks = [],
    address = {},
    contact = {},
    email: emailInfo = {},
    quickLinks = [],
    programs = [],
    newsletter = {},
    bottomFooter = {},
    quickLinkLinkIcon = '',
    OurProgramLinkIcon = ''
  } = footerData;

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasLogo = hasValue(logo.src);
  const hasDescription = hasValue(description);
  const hasSocialLinks = hasValue(socialLinks);
  const hasAddress = hasValue(address.title) || hasValue(address.details);
  const hasContact = hasValue(contact.title) || hasValue(contact.numbers);
  const hasEmailInfo = hasValue(emailInfo.title) || hasValue(emailInfo.addresses);
  const hasQuickLinks = hasValue(quickLinks);
  const hasPrograms = hasValue(programs);
  const hasNewsletter = hasValue(newsletter.title);
  const hasBottomFooter = hasValue(bottomFooter.copyright) || hasValue(bottomFooter.links);

  // If no content, don't render anything
  if (!hasLogo && !hasDescription && !hasSocialLinks && !hasAddress &&
    !hasContact && !hasEmailInfo && !hasQuickLinks && !hasPrograms && !hasNewsletter) {
    return null;
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const logoUrl = logoError ? defaultLogo : (getImageSrc(logo.src) || defaultLogo);
  const itemsPerColumn = hasPrograms ? Math.ceil(programs.length / 2) : 0;
  const firstProgramColumn = hasPrograms ? programs.slice(0, itemsPerColumn) : [];
  const secondProgramColumn = hasPrograms ? programs.slice(itemsPerColumn) : [];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div>
      {/* Main Footer */}
      <footer className='bg-[#080C14] rounded-t-2xl lg:rounded-t-4xl' role="contentinfo">
        <div className='mx-auto flex flex-col lg:flex-row px-5 lg:px-50 pt-10 lg:pt-37.5 gap-8 lg:gap-50'>

          {/* ============================================
              LEFT COLUMN - Logo, Description, Social, Contact
              ============================================ */}
          <div className='w-full lg:w-1/3'>
            {/* Logo */}
            {hasLogo && (
              <div className="flex justify-center lg:justify-start">
                <img
                  src={logoUrl}
                  alt={logo.alt || 'Footer Logo'}
                  className={logo.className || 'h-auto w-auto'}
                  loading="lazy"
                  onError={handleLogoError}
                />
              </div>
            )}

            {/* Description */}
            {hasDescription && (
              <p className='pt-5 text-center lg:text-left text-xs lg:text-sm leading-relaxed text-gray-300 px-4 lg:px-0'>
                {description}
              </p>
            )}

            {/* Social Links */}
            {hasSocialLinks && (
              <div
                className='pt-5 flex justify-center lg:justify-start gap-3 lg:gap-5 flex-wrap'
                aria-label="Social media links"
              >
                {socialLinks.map((social, index) => {
                  const IconComponent = getIconComponent(social.iconName);
                  if (!IconComponent) return null;

                  return (
                    <div
                      key={index}
                      className='border border-white rounded-full p-2 transition-transform duration-200 hover:scale-110 hover:border-[#009BE2]'
                    >
                      <a
                        href={social.url}
                        className={`text-xl lg:text-2xl text-white ${social.hoverColor || ''} transition-colors duration-200 block`}
                        aria-label={social.ariaLabel || `${social.iconName || 'Social'} link`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconComponent />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Address, Contact, Email */}
            {(hasAddress || hasContact || hasEmailInfo) && (
              <div className='max-w-full lg:max-w-125 pt-5 space-y-4 text-center lg:text-left'>
                {/* Address */}
                {hasAddress && (
                  <div>
                    <h2 className='text-gray-400 font-semibold mb-2 text-xs lg:text-sm uppercase tracking-wide'>
                      {address.title || 'Address'}
                    </h2>
                    <address className="not-italic text-gray-300 text-xs lg:text-sm leading-relaxed">
                      {address.details}
                    </address>
                  </div>
                )}

                {/* Contact Numbers */}
                {hasContact && hasValue(contact.numbers) && (
                  <div>
                    <h2 className='text-gray-400 font-semibold mb-2 text-xs lg:text-sm uppercase tracking-wide'>
                      {contact.title || 'Contact'}
                    </h2>
                    {contact.numbers.map((number, index) => (
                      <a
                        key={index}
                        href={`tel:${number.replace(/\D/g, '')}`}
                        className="block text-gray-300 hover:text-white transition-colors text-xs lg:text-sm mb-1"
                      >
                        {number}
                      </a>
                    ))}
                  </div>
                )}

                {/* Email Addresses */}
                {hasEmailInfo && hasValue(emailInfo.addresses) && (
                  <div>
                    <h2 className='text-gray-400 font-semibold mb-2 text-xs lg:text-sm uppercase tracking-wide'>
                      {emailInfo.title || 'Email'}
                    </h2>
                    {emailInfo.addresses.map((emailAddr, index) => (
                      <a
                        key={index}
                        href={`mailto:${emailAddr}`}
                        className="block text-gray-300 hover:text-white transition-colors break-all text-xs lg:text-sm mb-1"
                      >
                        {emailAddr}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================
              RIGHT COLUMN - Quick Links, Programs, Newsletter
              ============================================ */}
          {(hasQuickLinks || hasPrograms || hasNewsletter) && (
            <div className='w-full lg:w-2/3'>

              {/* DESKTOP: Grid layout for links */}
              {(hasQuickLinks || hasPrograms) && (
                <div className='hidden md:grid md:grid-cols-3 gap-8'>

                  {/* Quick Links */}
                  {hasQuickLinks && (
                    <div>
                      <h2 className='text-white text-xl lg:text-[22px] font-bold mb-5'>Quick Links</h2>
                      <ul className='space-y-3'>
                        {quickLinks.map((link, index) => renderLinkWithIcon(link, quickLinkLinkIcon, index))}
                      </ul>
                    </div>
                  )}

                  {/* Programs - Column 1 */}
                  {hasPrograms && (
                    <div>
                      <h2 className='text-white text-xl lg:text-[22px] font-bold mb-5'>Our Programs</h2>
                      <ul className='space-y-3'>
                        {firstProgramColumn.map((program, index) => renderLinkWithIcon(program, OurProgramLinkIcon, index))}
                      </ul>
                    </div>
                  )}

                  {/* Programs - Column 2 (hidden title for alignment) */}
                  {hasPrograms && secondProgramColumn.length > 0 && (
                    <div>
                      <h2 className='text-xl lg:text-[22px] font-bold mb-5 opacity-0 pointer-events-none invisible'>
                        Our Programs
                      </h2>
                      <ul className='space-y-3'>
                        {secondProgramColumn.map((program, index) => renderLinkWithIcon(program, OurProgramLinkIcon, index + firstProgramColumn.length))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================
                  MOBILE: Accordion for links
                  ============================================ */}
              <div className='md:hidden space-y-4'>
                {/* Quick Links Accordion */}
                {hasQuickLinks && (
                  <div className="border-b border-gray-700">
                    <button
                      onClick={() => toggleMobileSection('quickLinks')}
                      className="flex justify-between items-center w-full py-4 text-white font-bold text-lg hover:text-[#009BE2] transition-colors"
                      aria-expanded={isMobileMenuOpen.quickLinks}
                      aria-controls="quick-links-mobile"
                    >
                      Quick Links
                      <svg
                        className={`w-5 h-5 transition-transform duration-300 ${isMobileMenuOpen.quickLinks ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      id="quick-links-mobile"
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen.quickLinks ? 'max-h-96 mb-4' : 'max-h-0'}`}
                      role="region"
                    >
                      <ul className='space-y-3'>
                        {quickLinks.map((link, index) => renderLinkWithIcon(link, quickLinkLinkIcon, index))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Programs Accordion */}
                {hasPrograms && (
                  <div className="border-b border-gray-700">
                    <button
                      onClick={() => toggleMobileSection('programs')}
                      className="flex justify-between items-center w-full py-4 text-white font-bold text-lg hover:text-[#009BE2] transition-colors"
                      aria-expanded={isMobileMenuOpen.programs}
                      aria-controls="programs-mobile"
                    >
                      Our Programs
                      <svg
                        className={`w-5 h-5 transition-transform duration-300 ${isMobileMenuOpen.programs ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      id="programs-mobile"
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen.programs ? 'max-h-96 mb-4' : 'max-h-0'}`}
                      role="region"
                    >
                      <ul className='space-y-3'>
                        {programs.map((program, index) => renderLinkWithIcon(program, OurProgramLinkIcon, index))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================
                  NEWSLETTER SECTION
                  ============================================ */}
              {hasNewsletter && (
                <div className='pt-10 mt-5 border-t border-gray-700'>
                  <h2 className='text-xl lg:text-[28px] font-bold text-white text-center lg:text-left'>
                    {newsletter.title}
                  </h2>

                  <form onSubmit={handleSubscribe} className='space-y-3 pt-5' noValidate>
                    <label htmlFor="footer-email" className="text-gray-300 text-sm block text-center lg:text-left">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2'>
                      <input
                        type="email"
                        id="footer-email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={newsletter.placeholder || 'Enter your email address'}
                        className="flex-1 py-3 px-4 bg-[#080C14] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#009BE2] focus:border-transparent transition-all text-white placeholder:text-gray-500 text-sm lg:text-base"
                        required
                        aria-label="Email address for newsletter subscription"
                        aria-describedby={submitMessage ? "newsletter-message" : undefined}
                        disabled={isSubmitting}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#009BE2] hover:bg-[#009BE2]/80 disabled:bg-[#009BE2]/50 disabled:cursor-not-allowed px-6 py-3 rounded-md font-semibold text-white transition-all duration-200 text-sm lg:text-base flex items-center justify-center gap-2 min-w-30"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Subscribing...
                          </>
                        ) : (
                          newsletter.buttonText || 'Subscribe'
                        )}
                      </button>
                    </div>
                    {submitMessage && (
                      <p
                        id="newsletter-message"
                        className={`text-sm mt-2 text-center lg:text-left ${submitMessageType === 'success' ? 'text-green-400' : 'text-red-400'
                          }`}
                        role="status"
                      >
                        {submitMessage}
                      </p>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </footer>

      {/* ============================================
          BOTTOM FOOTER - Copyright & Legal Links
          ============================================ */}
      {hasBottomFooter && (
        <div className='bg-[#080C14] border-t border-[#090C40] px-5 lg:px-50 py-6'>
          <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
            {/* Copyright */}
            {hasValue(bottomFooter.copyright) && (
              <p className='text-white text-[12px] lg:text-[14px] font-400 text-center sm:text-left'>
                {bottomFooter.copyright}
              </p>
            )}

            {/* Legal Links */}
            {hasValue(bottomFooter.links) && (
              <ul className='flex flex-wrap justify-center gap-4 lg:gap-8 text-white text-[12px] lg:text-[14px] font-400'>
                {bottomFooter.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      className='hover:text-[#009BE2] cursor-pointer transition-colors duration-200'
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(Footer);