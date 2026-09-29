// js/Shared/Navbar/Navbar

import { useState, useEffect, useRef, memo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';

// Components
import ArrowIcon from '../ArrowIcon';
import { hasValue } from '../../utils/sectionHelpers';


// ============================================
// SUB-MENU HELPERS
// ============================================

/**
 * Resolve the sub-menu items of a nav link.
 *
 * Supported shapes (in order of preference):
 *   1. `link.children`     – modern shape, unlimited nesting
 *   2. `link.dropdown`     – legacy single level dropdown
 *   3. `dropdowns[index]`  – legacy top-level dropdown map
 */
const resolveChildren = (link, index, dropdowns = []) => {
  if (!link) return [];

  if (Array.isArray(link.children) && link.children.length > 0) return link.children;
  if (Array.isArray(link.dropdown) && link.dropdown.length > 0) return link.dropdown;

  const legacy = Array.isArray(dropdowns) ? dropdowns[index] : null;
  if (Array.isArray(legacy) && legacy.length > 0) return legacy;

  return [];
};

/**
 * A link/parent counts as active when it – or any of its descendants – matches
 * the current URL.
 */
const isLinkActive = (link, isActive, dropdowns = [], index = 0) => {
  if (isActive(link?.href)) return true;

  return resolveChildren(link, index, dropdowns).some((child) =>
    isLinkActive(child, isActive, [], 0)
  );
};

// ============================================
// DESKTOP: RECURSIVE NAV ITEM (unlimited nesting)
// ============================================

// Grace period before a hovered panel closes, so the pointer can cross the
// gap between the trigger and the panel without dismissing it.
const CLOSE_DELAY = 160;

const DesktopNavItem = ({
  link,
  index,
  dropdowns = [],
  level = 0,
  isActive,
  isLastTopLevel = false,
}) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const itemRef = useRef(null);

  const children = resolveChildren(link, index, dropdowns);
  const isNested = level > 0;
  const active = isLinkActive(link, isActive, dropdowns, index);

  const cancelPendingClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleEnter = () => {
    cancelPendingClose();
    setOpen(true);
  };

  const handleLeave = () => {
    cancelPendingClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  // Never leave a timer running after the item unmounts.
  useEffect(() => cancelPendingClose, []);

  // Escape closes the panel; a click anywhere outside closes it too, so a
  // hover panel cannot stay pinned open after the pointer has left.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        cancelPendingClose();
        setOpen(false);
      }
    };
    const handlePointerDown = (event) => {
      if (itemRef.current && !itemRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  // ---- Leaf item ----
  if (children.length === 0) {
    return (
      <li className="relative uppercase" ref={itemRef}>
        <Link
          href={hasValue(link.href) ? link.href : '#'}
          className={
            isNested
              ? `flex items-center w-full px-4 py-2 text-sm normal-case transition-colors duration-200 ${
                  active ? 'bg-[#009BE2] text-white' : 'text-gray-700 hover:bg-[#009BE2] hover:text-white'
                }`
              : `relative group whitespace-nowrap font-semibold transition-all duration-300 ${
                  active ? 'text-[#009BE2]' : 'text-gray-800 hover:text-[#009BE2]'
                } text-sm xl:text-base 2xl:text-[20px]`
          }
        >
          {link.name}
          {!isNested && (
            <span
              className={`absolute -bottom-2 left-1/2 h-0.5 rounded-full bg-[#009BE2]
                transition-all duration-300 ease-out
                ${active ? 'w-full -translate-x-1/2' : 'w-0 -translate-x-1/2 group-hover:w-full'}`}
            />
          )}
        </Link>
      </li>
    );
  }

  // ---- Item with sub-menu ----
  // Top level: rendered exactly like a leaf link, so a parent that has sub
  // pages is visually and behaviourally identical to a standalone page. The
  // panel is opened by hover (and by keyboard focus), not by a separate button.
  // It stays mounted so it can fade in from its origin instead of popping.
  const panel = (
    <div
      className={`absolute w-56 z-60 transition-all duration-200 ease-out ${
        isNested
          ? 'origin-top-left top-0 left-full pl-1'
          : isLastTopLevel
            ? // The final top-level item sits closest to the CTA, so its
              // panel hangs off the right edge to stay on screen.
              'origin-top-right top-full right-0 pt-2'
            : 'origin-top top-full left-1/2 -translate-x-1/2 pt-2'
      } ${
        open
          ? 'visible opacity-100 scale-100'
          : 'invisible opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <ul className="bg-white rounded-lg shadow-lg border border-gray-100 py-2">
        {children.map((child, childIndex) => (
          <DesktopNavItem
            key={child?._tempId || `${index}-${childIndex}`}
            link={child}
            index={childIndex}
            // Legacy `dropdowns` map only ever applies to the first level.
            dropdowns={isNested ? [] : dropdowns}
            level={level + 1}
            isActive={isActive}
            isLastTopLevel={isNested && childIndex === children.length - 1}
          />
        ))}
      </ul>
    </div>
  );

  if (!isNested) {
    return (
      <li
        ref={itemRef}
        className="relative uppercase"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <Link
          href={hasValue(link.href) ? link.href : '#'}
          onFocus={handleEnter}
          onBlur={handleLeave}
          aria-expanded={open}
          aria-haspopup="true"
          className={`relative group flex items-center gap-1 whitespace-nowrap font-semibold transition-all duration-300 ${
            active ? 'text-[#009BE2]' : 'text-gray-800 hover:text-[#009BE2]'
          } text-sm xl:text-base 2xl:text-[20px]`}
        >
          {link.name}
          <span
            className={`absolute -bottom-2 left-1/2 h-0.5 rounded-full bg-[#009BE2]
              transition-all duration-300 ease-out
              ${active ? 'w-full -translate-x-1/2' : 'w-0 -translate-x-1/2 group-hover:w-full'}`}
          />
        </Link>
        {panel}
      </li>
    );
  }

  // Nested sub-parent: stays a button, since it only ever opens a deeper panel.
  return (
    <li
      ref={itemRef}
      className="relative uppercase"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center justify-between gap-2 w-full px-4 py-2 text-sm normal-case transition-colors duration-200 ${
          open || active ? 'bg-[#009BE2] text-white' : 'text-gray-700 hover:bg-[#009BE2] hover:text-white'
        }`}
      >
        <span className="truncate">{link.name}</span>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
      </button>

      {panel}
    </li>
  );
};

// ============================================
// MOBILE: RECURSIVE NAV ITEM (accordion, unlimited nesting)
// ============================================
const MobileNavItem = ({ link, index, dropdowns = [], level = 0, isActive, onNavigate }) => {
  const [open, setOpen] = useState(false);

  const children = resolveChildren(link, index, dropdowns);
  const active = isLinkActive(link, isActive, dropdowns, index);
  const indent = { paddingLeft: `${level * 16 + 8}px` };

  // ---- Leaf item ----
  if (children.length === 0) {
    return (
      <li>
        <Link
          href={hasValue(link.href) ? link.href : '#'}
          onClick={onNavigate}
          style={indent}
          className={`block font-medium transition-colors duration-200 py-2 px-2 rounded-lg hover:bg-gray-50 ${
            active ? 'text-[#009BE2] bg-blue-50/50' : 'text-black hover:text-[#009BE2]'
          }`}
        >
          {link.name}
          {active && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[#009BE2]" />}
        </Link>
      </li>
    );
  }

  // ---- Item with sub-menu ----
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        style={indent}
        className={`flex items-center justify-between w-full font-medium transition-colors duration-200 py-2 px-2 rounded-lg hover:bg-gray-50 ${
          active ? 'text-[#009BE2]' : 'text-black hover:text-[#009BE2]'
        }`}
      >
        <span className="text-left">{link.name}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul className="mt-1 space-y-1 border-l-2 border-[#009BE2]/30 ml-2">
          {children.map((child, childIndex) => (
            <MobileNavItem
              key={child?._tempId || `${index}-${childIndex}`}
              link={child}
              index={childIndex}
              // Legacy `dropdowns` map only ever applies to the first level.
              dropdowns={level === 0 ? dropdowns : []}
              level={level + 1}
              isActive={isActive}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const Navbar = ({ navbarData, storageUrl = '', defaultLogo = '/images/default-logo.png' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [menuResetKey, setMenuResetKey] = useState(0);

  const { url } = usePage();
  const currentPath = url;

  const isActive = (href) => {
    if (!hasValue(href)) return false;
    if (href === '/') return currentPath === href;
    return currentPath.startsWith(href);
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
    // Remount the mobile list so every expanded accordion collapses again.
    setMenuResetKey((prev) => prev + 1);
  };

  useEffect(() => {
    setIsOpen(false);
    setMenuResetKey((prev) => prev + 1);
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
                {navLinks.map((link, index) => (
                  <DesktopNavItem
                    key={link?._tempId || link?.name || index}
                    link={link}
                    index={index}
                    dropdowns={dropdowns}
                    isActive={isActive}
                    isLastTopLevel={index === navLinks.length - 1}
                  />
                ))}
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
            <ul key={menuResetKey} className="flex flex-col space-y-1 sm:space-y-2 pb-3 sm:pb-4">
              {hasNavLinks && navLinks.map((link, index) => (
                <MobileNavItem
                  key={link?._tempId || link?.name || index}
                  link={link}
                  index={index}
                  dropdowns={dropdowns}
                  path={`m-${index}`}
                  isActive={isActive}
                  onNavigate={closeMobileMenu}
                />
              ))}

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

export default memo(Navbar);