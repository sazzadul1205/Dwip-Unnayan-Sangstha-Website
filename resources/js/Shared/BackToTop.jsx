// resources/js/Shared/BackToTop.jsx

// React
import React, { useState, useEffect, useCallback } from 'react';

// Icons
import { FaArrowUp } from 'react-icons/fa6';

/**
 * BackToTop Component
 * A floating button that appears when scrolling down and smoothly scrolls to top
 * 
 * @param {Object} props
 * @param {number} props.threshold - Scroll threshold in pixels before showing button (default: 300)
 * @param {string} props.position - Position classes (default: 'bottom-8 right-8')
 * @param {string} props.size - Size of the button (default: 'w-12 h-12')
 * @param {string} props.bgColor - Background color (default: 'bg-[#009BE2]')
 * @param {string} props.hoverColor - Hover background color (default: 'hover:bg-[#0080C4]')
 * @param {string} props.iconColor - Icon color (default: 'text-white')
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.scrollDuration - Scroll animation duration in ms (default: 500)
 * 
 * @returns {JSX.Element} Rendered back to top button
 */
const BackToTop = ({
  threshold = 300,
  position = 'bottom-2 md:bottom-8 right-2 md:right-8',
  size = 'w-12 h-12',
  bgColor = 'bg-[#009BE2]',
  hoverColor = 'hover:bg-[#0080C4]',
  iconColor = 'text-white',
  className = '',
  scrollDuration = 500,
}) => {
  // ============================================
  // STATE
  // ============================================
  const [isVisible, setIsVisible] = useState(false);

  // ============================================
  // HANDLER: Scroll to top with smooth animation
  // ============================================
  const scrollToTop = useCallback(() => {
    const start = window.pageYOffset || document.documentElement.scrollTop;
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / scrollDuration, 1);

      // Ease in-out cubic function
      const easeInOut = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const scrollPosition = start * (1 - easeInOut(progress));

      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto',
      });

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'auto',
        });
      }
    };

    requestAnimationFrame(animateScroll);
  }, [scrollDuration]);

  // ============================================
  // EFFECT: Listen for scroll events
  // ============================================
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollY > threshold);
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  // ============================================
  // RENDER
  // ============================================
  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className={` fixed ${position} ${size}  ${bgColor} ${hoverColor} rounded-full shadow-lg  flex items-center justify-center transition-all duration-300  hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#009BE2] focus:ring-offset-2 z-50
        ${className}
      `}
      aria-label="Back to top"
      title="Back to top"
    >
      <FaArrowUp className={`${iconColor} text-lg sm:text-xl`} />

      {/* Ripple effect on hover */}
      <span className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
    </button>
  );
};

export default BackToTop;