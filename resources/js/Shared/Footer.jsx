// resources/js/components/Footer.jsx

/**
 *
 * FOOTER - Site Footer Component
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
 */

// React
import { Link } from '@inertiajs/react';
import  { useState, useCallback, memo } from 'react';

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
  FaTelegram,
} from 'react-icons/fa6';
import ArrowIcon from './ArrowIcon';

/**
 * UTILITY: Check if value exists
 */
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * ICON MAPPING
 */
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

  // Aliases
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

  if (iconMap[iconName]) {
    return iconMap[iconName];
  }

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
 */
const Footer = ({
  footerData,
  storageUrl = '',
  defaultLogo = '/images/default-logo.png',
}) => {
  // ====
  // STATE
  // ====

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [logoError, setLogoError] = useState(false);

  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessageType, setSubmitMessageType] = useState('');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState({
    quickLinks: false,
    programs: false,
  });

  /**
   * Build image URL with storage path
   */
  const getImageSrc = useCallback(
    (imagePath) => {
      if (!imagePath) return null;

      if (
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
      ) {
        return imagePath;
      }

      if (imagePath.startsWith('/storage/')) {
        return imagePath;
      }

      if (imagePath.startsWith('/asset/')) {
        return imagePath;
      }

      if (storageUrl) {
        const cleanPath = imagePath.startsWith('/')
          ? imagePath.slice(1)
          : imagePath;

        return `${storageUrl}${cleanPath}`;
      }

      return imagePath;
    },
    [storageUrl],
  );

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
    setIsMobileMenuOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  /**
   * Handle newsletter subscription
   */
  const handleSubscribe = useCallback(
    async (e) => {
      e.preventDefault();

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
        const csrfToken =
          document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '';

        const response = await fetch('/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim() || null,
            source: 'footer',
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSubmitMessage(
            data.message ||
            'Successfully subscribed to our newsletter!',
          );

          setSubmitMessageType('success');
          setEmail('');
          setName('');
        } else {
          if (data.errors) {
            const errorMessages =
              Object.values(data.errors).flat();

            setSubmitMessage(
              errorMessages[0] ||
              'Subscription failed. Please check your email.',
            );
          } else {
            setSubmitMessage(
              data.message ||
              'Subscription failed. Please try again.',
            );
          }

          setSubmitMessageType('error');
        }
      } catch (error) {
        console.error(
          'Newsletter subscription error:',
          error,
        );

        setSubmitMessage(
          'Unable to subscribe at this time. Please try again later.',
        );

        setSubmitMessageType('error');
      } finally {
        setIsSubmitting(false);

        setTimeout(() => {
          setSubmitMessage('');
          setSubmitMessageType('');
        }, 5000);
      }
    },
    [email, name],
  );

  /**
   * Render link with icon
   */
  const renderLinkWithIcon = useCallback(
    (link, iconSrc, index) => {
      const iconUrl = getImageSrc(iconSrc);

      return (
        <li key={index} className="group flex min-w-0 items-center">
          {hasValue(iconSrc) && iconUrl && (
            <img
              src={iconUrl}
              alt=""
              className="mr-3 h-auto w-2.5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
              loading="lazy"
            />
          )}

          <Link
            href={link.url}
            className="cursor-pointer truncate text-[14px] font-400 text-white transition-colors hover:text-[#009BE2]"
          >
            {link.name}
          </Link>
        </li>
      );
    },
    [getImageSrc],
  );

  // ====
  // EARLY RETURN
  // ====

  if (!hasValue(footerData)) {
    return null;
  }

  // ====
  // DATA
  // ====

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
    OurProgramLinkIcon = '',
  } = footerData;

  // ====
  // CONTENT CHECKS
  // ====

  const hasLogo = hasValue(logo.src);
  const hasPrograms = hasValue(programs);
  const hasQuickLinks = hasValue(quickLinks);
  const hasDescription = hasValue(description);
  const hasSocialLinks = hasValue(socialLinks);
  const hasNewsletter = hasValue(newsletter.title);

  const hasAddress =
    hasValue(address.title) || hasValue(address.details);

  const hasContact =
    hasValue(contact.title) || hasValue(contact.numbers);

  const hasEmailInfo =
    hasValue(emailInfo.title) ||
    hasValue(emailInfo.addresses);

  const hasBottomFooter =
    hasValue(bottomFooter.copyright) ||
    hasValue(bottomFooter.links);

  if (
    !hasLogo &&
    !hasDescription &&
    !hasSocialLinks &&
    !hasAddress &&
    !hasContact &&
    !hasEmailInfo &&
    !hasQuickLinks &&
    !hasPrograms &&
    !hasNewsletter
  ) {
    return null;
  }

  // ====
  // COMPUTED VALUES
  // ====

  const logoUrl = logoError
    ? defaultLogo
    : getImageSrc(logo.src) || defaultLogo;

  const itemsPerColumn = hasPrograms
    ? Math.ceil(programs.length / 2)
    : 0;

  const firstProgramColumn = hasPrograms
    ? programs.slice(0, itemsPerColumn)
    : [];

  const secondProgramColumn = hasPrograms
    ? programs.slice(itemsPerColumn)
    : [];

  return (
    <footer className="overflow-hidden rounded-t-[40px] bg-[#080C14] px-4 pt-12 text-white sm:rounded-t-[50px] sm:px-8 sm:pt-16 md:rounded-t-[70px] md:px-12 md:pt-20 lg:rounded-t-[80px] lg:px-20 lg:pt-25 xl:rounded-t-[90px] xl:px-30 xl:pt-30 2xl:rounded-t-[100px] 2xl:px-50 2xl:pt-37.5">
      {/*  MAIN FOOTER */}
      <div className="mx-auto flex max-w-[1800px] flex-col gap-12 pb-12 sm:gap-14 sm:pb-16 md:gap-16 md:pb-20 lg:gap-20 lg:pb-24 xl:flex-row xl:gap-20 xl:pb-25 2xl:gap-40">
        {/* LEFT COLUMN */}
        <div className="w-full min-w-0 xl:w-[32%] xl:max-w-110 2xl:w-[30%] 2xl:max-w-120">
          {/* Logo */}
          {hasLogo && (
            <div className="flex justify-center xl:justify-start">
              <img
                src={logoUrl}
                alt={logo.alt || 'Footer Logo'}
                className={logo.className || 'h-auto w-20 object-contain sm:w-24 md:w-27.5'}
                loading="lazy"
                onError={handleLogoError}
              />
            </div>
          )}

          {/* Description */}
          {hasDescription && (
            <p className="pt-5 text-center text-sm leading-relaxed text-[#FFFFFF] sm:pt-6 sm:text-base md:pt-7.5 xl:text-left">
              {description}
            </p>
          )}

          {/* Social Links */}
          {hasSocialLinks && (
            <div className="flex flex-wrap justify-center gap-2 pt-5 sm:gap-3 sm:pt-6 md:gap-4 md:pt-7.5 xl:justify-start xl:gap-5" aria-label="Social media links">
              {socialLinks.map((social, index) => {
                const IconComponent = getIconComponent(social.iconName);

                if (!IconComponent) return null;

                return (
                  <div key={index} className="rounded-full border border-white p-1.5 transition-transform duration-200 hover:scale-110 hover:border-[#009BE2] sm:p-2">
                    <a
                      href={social.url}
                      className={`block text-lg text-white transition-colors duration-200 sm:text-xl md:text-2xl ${social.hoverColor || ''}`}
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

          {/* Address / Contact / Email */}
          {(hasAddress || hasContact || hasEmailInfo) && (
            <div className="space-y-4 pt-5 text-center sm:pt-6 md:space-y-5 md:pt-7.5 xl:text-left">
              {/* Address */}
              {hasAddress && (
                <div>
                  <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/50 sm:mb-2 md:text-sm">
                    {address.title || 'Address'}
                  </h2>

                  <address className="not-italic text-sm leading-relaxed text-white sm:text-base">
                    {address.details}
                  </address>
                </div>
              )}

              {/* Contact */}
              {hasContact && hasValue(contact.numbers) && (
                <div>
                  <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/50 sm:mb-2 md:text-sm">
                    {contact.title || 'Contact'}
                  </h2>

                  {contact.numbers.map((number, index) => (
                    <a
                      key={index}
                      href={`tel:${number.replace(/\D/g, '')}`}
                      className="mb-1 block text-sm text-white transition-colors hover:text-[#009BE2] sm:text-base"
                    >
                      {number}
                    </a>
                  ))}
                </div>
              )}

              {/* Email */}
              {hasEmailInfo && hasValue(emailInfo.addresses) && (
                <div>
                  <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/50 sm:mb-2 md:text-sm">
                    {emailInfo.title || 'Email'}
                  </h2>

                  {emailInfo.addresses.map((emailAddr, index) => (
                    <a
                      key={index}
                      href={`mailto:${emailAddr}`}
                      className="mb-1 block break-all text-sm text-white transition-colors hover:text-[#009BE2] sm:text-base"
                    >
                      {emailAddr}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}

        <div className="w-full min-w-0 xl:flex-1">
          {(hasQuickLinks || hasPrograms || hasNewsletter) && (
            <>
              {/* DESKTOP / TABLET LINK GRID */}

              {(hasQuickLinks || hasPrograms) && (
                <div className="hidden min-w-0 grid-cols-2 gap-8 md:grid lg:gap-10 xl:grid-cols-3 xl:gap-8 2xl:gap-12">
                  {/* Quick Links */}
                  {hasQuickLinks && (
                    <div className="min-w-0">
                      <h2 className="mb-4 text-lg font-bold text-white sm:text-xl md:mb-5 lg:text-[22px]">
                        Quick Links
                      </h2>

                      <ul className="space-y-2.5 md:space-y-3">
                        {quickLinks.map((link, index) =>
                          renderLinkWithIcon(link, quickLinkLinkIcon, index)
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Programs Column 1 */}
                  {hasPrograms && (
                    <div className="min-w-0">
                      <h2 className="mb-4 text-lg font-bold text-white sm:text-xl md:mb-5 lg:text-[22px]">
                        Our Programs
                      </h2>

                      <ul className="space-y-2.5 md:space-y-3">
                        {firstProgramColumn.map((program, index) =>
                          renderLinkWithIcon(program, OurProgramLinkIcon, index)
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Programs Column 2 */}
                  {hasPrograms && secondProgramColumn.length > 0 && (
                    <div className="min-w-0">
                      <h2 className="invisible pointer-events-none mb-4 text-lg font-bold sm:text-xl md:mb-5 lg:text-[22px]">
                        Our Programs
                      </h2>

                      <ul className="space-y-2.5 md:space-y-3">
                        {secondProgramColumn.map((program, index) =>
                          renderLinkWithIcon(
                            program,
                            OurProgramLinkIcon,
                            index + firstProgramColumn.length
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* MOBILE ACCORDION */}

              <div className="space-y-3 md:hidden">
                {/* Quick Links */}
                {hasQuickLinks && (
                  <div className="border-b border-gray-700">
                    <button
                      onClick={() => toggleMobileSection('quickLinks')}
                      className="flex w-full items-center justify-between py-3 text-base font-bold text-white transition-colors hover:text-[#009BE2]"
                      aria-expanded={isMobileMenuOpen.quickLinks}
                      aria-controls="quick-links-mobile"
                    >
                      Quick Links

                      <svg
                        className={`h-5 w-5 transition-transform duration-300 ${isMobileMenuOpen.quickLinks ? 'rotate-180' : ''}`}
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
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen.quickLinks ? 'mb-3 max-h-96' : 'max-h-0'}`}
                      role="region"
                    >
                      <ul className="space-y-2.5">
                        {quickLinks.map((link, index) =>
                          renderLinkWithIcon(link, quickLinkLinkIcon, index)
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Programs */}
                {hasPrograms && (
                  <div className="border-b border-gray-700">
                    <button
                      onClick={() => toggleMobileSection('programs')}
                      className="flex w-full items-center justify-between py-3 text-base font-bold text-white transition-colors hover:text-[#009BE2]"
                      aria-expanded={isMobileMenuOpen.programs}
                      aria-controls="programs-mobile"
                    >
                      Our Programs

                      <svg
                        className={`h-5 w-5 transition-transform duration-300 ${isMobileMenuOpen.programs ? 'rotate-180' : ''}`}
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
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen.programs ? 'mb-3 max-h-96' : 'max-h-0'}`}
                      role="region"
                    >
                      <ul className="space-y-2.5">
                        {programs.map((program, index) =>
                          renderLinkWithIcon(program, OurProgramLinkIcon, index)
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* NEWSLETTER */}

              {hasNewsletter && (
                <div className="mt-6 pt-6 sm:mt-8 sm:pt-8 md:mt-10 md:pt-10 xl:mt-12 xl:pt-12">
                  <h2 className="text-center text-xl font-bold text-white sm:text-2xl md:text-[24px] xl:text-left xl:text-[28px]">
                    {newsletter.title}
                  </h2>

                  <form onSubmit={handleSubscribe} className="space-y-3 pt-4 sm:pt-5" noValidate>
                    {/* Name */}
                    <div>
                      <label htmlFor="footer-name" className="block text-center text-sm text-gray-300 xl:text-left">
                        Your Name <span className="text-xs text-gray-500">(optional)</span>
                      </label>

                      <input
                        type="text"
                        id="footer-name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="mt-2 w-full rounded-md border border-gray-600 bg-[#080C14] px-3 py-2.5 text-sm text-white transition-all placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#009BE2] sm:px-4 sm:py-3 lg:text-base"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="footer-email" className="block text-center text-sm text-gray-300 xl:text-left">
                        Email Address <span className="text-red-400">*</span>
                      </label>

                      <div className="mt-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                        <input
                          type="email"
                          id="footer-email"
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={newsletter.placeholder || 'Enter your email address'}
                          className="min-w-0 flex-1 rounded-md border border-gray-600 bg-[#080C14] px-3 py-2.5 text-sm text-white transition-all placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#009BE2] sm:px-4 sm:py-3 lg:text-base"
                          required
                          disabled={isSubmitting}
                        />

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex min-w-30 shrink-0 items-center justify-center gap-2 rounded-md bg-[#009BE2] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#009BE2]/80 disabled:cursor-not-allowed disabled:bg-[#009BE2]/50 sm:px-6 sm:py-3 lg:text-base"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              <span>Subscribing...</span>
                            </>
                          ) : (
                            <>
                              {newsletter.buttonText || 'Subscribe'}
                              <ArrowIcon className="h-4 w-4 text-white" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Message */}
                    {submitMessage && (
                      <p
                        className={`mt-2 text-center text-sm xl:text-left ${submitMessageType === 'success' ? 'text-green-400' : 'text-red-400'}`}
                        role="status"
                      >
                        {submitMessage}
                      </p>
                    )}
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/*  BOTTOM FOOTER */}
      {hasBottomFooter && (
        <div className="mx-auto flex max-w-[1800px] flex-col items-center justify-between gap-4 py-6 sm:flex-row sm:py-8 lg:py-10">
          {/* Copyright */}
          {hasValue(bottomFooter.copyright) && (
            <p className="text-center text-[11px] font-400 text-white sm:text-left sm:text-[12px] lg:text-[14px]">
              {bottomFooter.copyright}
            </p>
          )}

          {/* Legal Links */}
          {hasValue(bottomFooter.links) && (
            <ul className="flex flex-wrap justify-center gap-3 text-[11px] font-400 text-white sm:gap-4 sm:text-[12px] lg:gap-8 lg:text-[14px]">
              {bottomFooter.links.map((link, index) => (
                <li key={index}>
                  <a href={link.url} className="cursor-pointer transition-colors duration-200 hover:text-[#009BE2]">
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </footer>
  );
};

export default memo(Footer);