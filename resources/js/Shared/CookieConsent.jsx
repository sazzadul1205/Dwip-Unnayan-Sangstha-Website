// resources/js/Shared/CookieConsent.jsx

// React
import React, { useState, useEffect, useCallback } from 'react';

// Icons
import { FaCookie, FaTimes } from 'react-icons/fa';

/**
 * CookieConsent Component
 * Shows a cookie consent banner with accept/decline options
 * Persists user choice using cookies
 * 
 * @param {Object} props
 * @param {string} props.position - Position of the banner (default: 'bottom-0')
 * @param {string} props.theme - Color theme (default: 'dark')
 * @param {number} props.expiryDays - Cookie expiry in days (default: 365)
 * @param {string} props.cookieName - Name of the consent cookie (default: 'cookie_consent')
 * @param {string} props.privacyPolicyUrl - URL to privacy policy (default: '/privacy-policy')
 * @param {string} props.className - Additional CSS classes
 * 
 * @returns {JSX.Element} Rendered cookie consent banner
 */
const CookieConsent = ({
  position = 'bottom-0',
  theme = 'dark',
  expiryDays = 365,
  cookieName = 'cookie_consent',
  privacyPolicyUrl = '/privacy-policy',
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // ============================================
  // HELPERS: Cookie Management
  // ============================================

  /**
   * Get cookie value by name
   */
  const getCookie = useCallback((name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }, []);

  /**
   * Set cookie with expiry
   */
  const setCookie = useCallback((name, value, days) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
  }, []);

  // ============================================
  // CHECK CONSENT STATUS
  // ============================================
  const checkConsent = useCallback(() => {
    const consent = getCookie(cookieName);

    if (consent === 'accepted') {
      // User has accepted - hide banner
      setIsVisible(false);
      return true;
    } else if (consent === 'declined') {
      // User has declined - hide banner
      setIsVisible(false);
      return false;
    } else {
      // No consent cookie found - show banner
      setIsVisible(true);
      return false;
    }
  }, [getCookie, cookieName]);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle Accept
   */
  const handleAccept = useCallback(() => {
    // Set cookie with acceptance
    setCookie(cookieName, 'accepted', expiryDays);

    // Trigger animation before hiding
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
    }, 300);
  }, [setCookie, cookieName, expiryDays]);

  /**
   * Handle Decline
   */
  const handleDecline = useCallback(() => {
    // Set cookie with decline (shorter expiry - 30 days)
    setCookie(cookieName, 'declined', 30);

    // Trigger animation before hiding
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
    }, 300);
  }, [setCookie, cookieName]);

  /**
   * Handle Close (temporary dismiss)
   */
  const handleClose = useCallback(() => {
    // Don't set cookie, just hide temporarily
    // Will show again on next page load
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
    }, 300);
  }, []);

  // ============================================
  // EFFECT: Initialize on mount
  // ============================================
  useEffect(() => {
    checkConsent();
  }, [checkConsent]);

  // ============================================
  // EFFECT: Re-check when page becomes visible
  // ============================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkConsent();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkConsent]);

  // ============================================
  // RENDER
  // ============================================
  if (!isVisible) {
    return null;
  }

  // Theme classes
  const themeClasses = {
    dark: {
      bg: 'bg-[#1a1a2e]',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      border: 'border-gray-700',
      buttonPrimary: 'bg-[#009BE2] hover:bg-[#0080C4] text-white',
      buttonSecondary: 'bg-transparent hover:bg-white/10 text-white border border-white/20',
      link: 'text-[#009BE2] hover:text-[#0080C4]',
    },
    light: {
      bg: 'bg-white',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      border: 'border-gray-200',
      buttonPrimary: 'bg-[#009BE2] hover:bg-[#0080C4] text-white',
      buttonSecondary: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300',
      link: 'text-[#009BE2] hover:text-[#0080C4]',
    },
  };

  const currentTheme = themeClasses[theme] || themeClasses.dark;

  return (
    <div
      className={`
        fixed left-0 right-0 ${position} z-9999
        transition-all duration-300 ease-in-out
        ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
        ${className}
      `}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className={`
        mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8
        ${currentTheme.bg} ${currentTheme.text}
        border-t ${currentTheme.border}
        shadow-2xl
      `}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Content */}
          <div className="flex-1 flex items-start gap-3">
            {/* Cookie Icon */}
            <div className="shrink-00 mt-1">
              <FaCookie className="text-2xl text-[#009BE2]" />
            </div>

            {/* Text */}
            <div className="space-y-1">
              <h3 className={`text-base font-semibold ${currentTheme.text}`}>
                🍪 We use cookies
              </h3>
              <p className={`text-sm ${currentTheme.textSecondary} max-w-2xl`}>
                We use cookies to enhance your browsing experience, serve personalized content,
                and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                <a
                  href={privacyPolicyUrl}
                  className={`ml-1 font-medium underline-offset-2 hover:underline ${currentTheme.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={handleDecline}
              className={`
                px-4 py-2.5 text-sm font-medium rounded-lg
                transition-all duration-200
                ${currentTheme.buttonSecondary}
                whitespace-nowrap
              `}
            >
              Decline
            </button>

            <button
              onClick={handleAccept}
              className={`
                px-6 py-2.5 text-sm font-medium rounded-lg
                transition-all duration-200
                ${currentTheme.buttonPrimary}
                whitespace-nowrap
                shadow-md hover:shadow-lg
              `}
            >
              Accept All
            </button>

            {/* Close button - temporary dismiss */}
            <button
              onClick={handleClose}
              className={`
                p-2 rounded-lg
                transition-all duration-200
                hover:bg-white/10
                text-gray-400 hover:text-gray-200
                shrink-0
              `}
              aria-label="Close cookie banner"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;