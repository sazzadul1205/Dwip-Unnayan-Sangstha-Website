// resources/js/layouts/JobSeekerLayout.jsx

// React
import { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';

// Icons
import {
  FiHome,
  FiUser,
  FiFileText,
  FiBell,
  FiSearch,
  FiBriefcase,
  FiLogOut,
  FiChevronRight,
  FiMenu,
  FiSettings,
  FiX,
} from 'react-icons/fi';

const JobSeekerLayout = ({ children }) => {
  const { props, url } = usePage();
  const { auth } = props;
  const user = auth?.user;

  const userName = user?.name || 'User';
  const userEmail = user?.email || '';

  const notificationMeta = props.notifications || {
    unread_count: 0,
    recent: [],
  };

  // States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDrawerAnimating, setIsDrawerAnimating] = useState(false);

  // Refs
  const settingsRef = useRef(null);
  const drawerRef = useRef(null);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target)
      ) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  // Handle drawer open/close with animation
  const openDrawer = () => {
    setIsDrawerAnimating(true);
    setIsDrawerOpen(true);
    // Allow time for the DOM to update before triggering the animation
    setTimeout(() => {
      setIsDrawerAnimating(false);
    }, 50);
  };

  const closeDrawer = () => {
    setIsDrawerAnimating(true);
    setIsDrawerOpen(false);
    // Allow time for the animation to complete
    setTimeout(() => {
      setIsDrawerAnimating(false);
    }, 350);
  };

  // Safe route helper
  const safeRoute = (name, params = {}) => {
    try {
      if (typeof window !== 'undefined' && window.route) {
        return window.route(name, params);
      }

      return '#';
    } catch (e) {
      console.warn(`Route '${name}' error:`, e.message);
      return '#';
    }
  };

  // Route active detection
  const isRouteActive = (routeName) => {
    try {
      if (typeof window !== 'undefined' && window.route) {
        const currentRouteName = window.route().current();

        if (currentRouteName === routeName) {
          return true;
        }

        if (
          currentRouteName &&
          currentRouteName.startsWith(`${routeName}.`)
        ) {
          return true;
        }

        const specialCases = {
          'backend.applicant.profile.show':
            'backend.applicant.profile.',
          'backend.apply.index': 'backend.apply.',
          'backend.notifications.index': 'backend.notifications.',
          'public.jobs.index': 'public.jobs.',
          'backend.seeker.jobs.index': 'backend.seeker.jobs.',
        };

        for (const [key, prefix] of Object.entries(specialCases)) {
          if (
            routeName === key &&
            currentRouteName &&
            currentRouteName.startsWith(prefix)
          ) {
            return true;
          }
        }

        if (
          routeName === 'public.jobs.index' ||
          routeName === 'backend.seeker.jobs.index'
        ) {
          if (url.includes('/backend/seeker/jobs')) {
            return true;
          }

          if (
            url.includes('/jobs') &&
            !url.includes('/backend/')
          ) {
            return true;
          }
        }

        return false;
      }

      return false;
    } catch (e) {
      console.warn(`Route '${routeName}' error:`, e.message);
      return false;
    }
  };

  // Menu items
  const menuItems = [
    {
      name: 'Dashboard',
      routeName: 'backend.dashboard',
      icon: FiHome,
      description: 'Overview & stats',
    },
    {
      name: 'Browse Jobs',
      routeName: 'public.jobs.index',
      icon: FiSearch,
      description: 'Find your next role',
    },
    {
      name: 'My Profile',
      routeName: 'backend.applicant.profile.show',
      icon: FiUser,
      description: 'View & edit profile',
      routeParams: {
        id: user?.applicantProfile?.id || null,
      },
    },
    {
      name: 'My Applications',
      routeName: 'backend.apply.index',
      icon: FiFileText,
      description: 'Track applications',
    },
    {
      name: 'Notifications',
      routeName: 'backend.notifications.index',
      icon: FiBell,
      badgeCount: notificationMeta.unread_count,
      description: 'Updates & alerts',
    },
  ];

  // Render menu item
  const renderMenuItem = (item, shouldCloseDrawer = false) => {
    const href = safeRoute(
      item.routeName,
      item.routeParams || {}
    );

    const isActive = isRouteActive(item.routeName);

    if (href === '#') {
      return null;
    }

    return (
      <Link
        key={item.name}
        href={href}
        prefetch
        onClick={shouldCloseDrawer ? closeDrawer : undefined}
        className={`
          flex items-center gap-3
          px-4 py-2.5
          text-sm rounded-lg
          transition-all duration-200
          mb-1 relative group
          ${isActive
            ? 'bg-green-100 text-green-700 font-semibold shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        title={item.description}
      >
        <item.icon
          className={`
            w-5 h-5 shrink-0
            ${isActive
              ? 'text-green-600'
              : 'text-gray-400 group-hover:text-gray-600'
            }
          `}
        />

        <span className="flex-1 truncate">
          {item.name}
        </span>

        {item.badgeCount > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {item.badgeCount > 99
              ? '99+'
              : item.badgeCount}
          </span>
        )}

        {isActive && (
          <span className="absolute left-0 w-1 h-8 bg-green-500 rounded-r-full" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* DESKTOP SIDEBAR */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex-col shadow-xl transition-all duration-300 hidden lg:flex z-50 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={safeRoute('home') || '/'}
              prefetch
              className="flex items-center gap-2 group min-w-0"
            >
              <div className="w-8 h-8 shrink-0 bg-linear-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                <FiBriefcase className="w-5 h-5 text-white" />
              </div>

              {!isCollapsed && (
                <span className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                  Seeker Panel
                </span>
              )}
            </Link>

            <button
              onClick={() =>
                setIsCollapsed(!isCollapsed)
              }
              className="p-1.5 shrink-0 rounded-lg hover:bg-gray-100 transition-colors"
              title={
                isCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
              aria-label={
                isCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
            >
              <FiChevronRight
                className={`
                  w-4 h-4
                  text-gray-500
                  transition-transform
                  duration-300
                  ${isCollapsed
                    ? ''
                    : 'rotate-180'
                  }
                `}
              />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-300">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Job Seeker
              </p>
            </div>
          )}

          <div className="space-y-1">
            {menuItems.map((item) =>
              renderMenuItem(item)
            )}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-sm">
                    {userName
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {userName}
                  </p>

                  <p className="text-xs text-gray-500 truncate">
                    {userEmail}
                  </p>

                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-green-500" />
                    Job Seeker
                  </p>
                </div>
              </div>

              <Link
                href={safeRoute('logout')}
                method="post"
                as="button"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
              >
                <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200 shrink-0" />

                <span className="font-medium">
                  Logout
                </span>
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center shadow-md relative group">
                <span className="text-white font-semibold text-sm">
                  {userName
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-60">
                  {userName}
                  <br />
                  Job Seeker
                </div>
              </div>

              <Link
                href={safeRoute('logout')}
                method="post"
                as="button"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                title="Logout"
                aria-label="Logout"
              >
                <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM DOCKER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg lg:hidden z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2">
          {/* Burger Menu */}
          <button
            onClick={openDrawer}
            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Open navigation menu"
          >
            <FiMenu className="w-6 h-6 text-gray-700" />
          </button>

          {/* Center Logo */}
          <Link
            href={safeRoute('home') || '/'}
            prefetch
            className="flex items-center"
          >
            <div className="w-10 h-10 bg-linear-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md">
              <FiBriefcase className="w-6 h-6 text-white" />
            </div>
          </Link>

          {/* Settings */}
          <div
            className="relative"
            ref={settingsRef}
          >
            <button
              onClick={() =>
                setIsSettingsOpen(
                  !isSettingsOpen
                )
              }
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Settings"
              aria-expanded={isSettingsOpen}
            >
              <FiSettings className="w-6 h-6 text-gray-700" />
            </button>

            {/* Drop-up menu */}
            {isSettingsOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-100 py-1 overflow-hidden z-200">
                <Link
                  href={safeRoute(
                    'backend.applicant.profile.show',
                    {
                      id:
                        user
                          ?.applicantProfile
                          ?.id ||
                        null,
                    }
                  )}
                  prefetch
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setIsSettingsOpen(
                      false
                    )
                  }
                >
                  <FiUser className="w-4 h-4 shrink-0" />
                  <span>Profile</span>
                </Link>

                <Link
                  href={safeRoute('logout')}
                  method="post"
                  as="button"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  onClick={() =>
                    setIsSettingsOpen(
                      false
                    )
                  }
                >
                  <FiLogOut className="w-4 h-4 shrink-0" />
                  <span>Logout</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <>
        {/* Backdrop - Fade in/out */}
        <div
          className={`
            fixed inset-0 bg-black/50 z-150 lg:hidden
            transition-all duration-300 ease-out
            ${isDrawerOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
            }
          `}
          onClick={closeDrawer}
          aria-hidden="true"
          style={{
            transition: isDrawerAnimating
              ? 'opacity 0.3s ease-out'
              : 'none',
          }}
        />

        {/* Drawer - Slide in/out */}
        <div
          ref={drawerRef}
          className={`
            fixed left-0 top-0 h-full w-[min(18rem,85vw)] bg-white shadow-2xl z-160 lg:hidden
            transition-all duration-300 ease-out
          `}
          style={{
            transform: isDrawerOpen
              ? 'translateX(0)'
              : 'translateX(-100%)',
            transition: isDrawerAnimating
              ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'none',
          }}
        >
          <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link
                href={
                  safeRoute('home') ||
                  '/'
                }
                onClick={closeDrawer}
                className="flex items-center gap-2 min-w-0"
              >
                <div className="w-8 h-8 shrink-0 bg-linear-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md">
                  <FiBriefcase className="w-5 h-5 text-white" />
                </div>

                <span className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                  Job Seeker Panel
                </span>
              </Link>

              <button
                onClick={closeDrawer}
                className="p-1.5 shrink-0 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Drawer Navigation - Items slide in with stagger */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <div className="px-4 mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Job Seeker
                </p>
              </div>

              <div className="space-y-1">
                {menuItems.map((item, index) => (
                  <div
                    key={item.name}
                    className={`
                      transition-all duration-300 ease-out
                      ${isDrawerOpen
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-8'
                      }
                    `}
                    style={{
                      transitionDelay: isDrawerOpen
                        ? `${index * 50}ms`
                        : '0ms',
                    }}
                  >
                    {renderMenuItem(item, true)}
                  </div>
                ))}
              </div>
            </nav>

            {/* Drawer User Info - Slides in from bottom */}
            <div
              className={`p-4 border-t border-gray-200 bg-gray-50 transition-all duration-400 ease-out ${isDrawerOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                transitionDelay: isDrawerOpen
                  ? '150ms'
                  : '0ms',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-sm">
                    {userName
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {userName}
                  </p>

                  <p className="text-xs text-gray-500 truncate">
                    {userEmail}
                  </p>

                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-green-500" />
                    Job Seeker
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* MAIN CONTENT */}
      <main
        className={`min-h-screen w-full min-w-0 transition-all duration-300 px-4 py-4 sm:px-6 sm:py-6 pb-24 lg:pb-6 text-black ${isCollapsed ? 'lg:ml-20 lg:w-[calc(100%-5rem)]' : 'lg:ml-64 lg:w-[calc(100%-16rem)]'}`}
      >
        {children}
      </main>
    </div>
  );
};

export default JobSeekerLayout;