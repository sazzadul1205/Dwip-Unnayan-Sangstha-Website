// resources/js/layouts/JobSeekerLayout.jsx

// React
import { useState } from 'react';
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
} from 'react-icons/fi';

const JobSeekerLayout = ({ children }) => {
  const { props } = usePage();
  const { auth } = props;
  const user = auth?.user;
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const notificationMeta = props.notifications || { unread_count: 0, recent: [] };

  // States for sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // Check if current route matches using Ziggy
  const isRouteActive = (routeName, params = {}) => {
    try {
      if (typeof window !== 'undefined' && window.route) {
        return window.route().current(routeName, params);
      }
      return false;
    } catch (e) {
      console.warn(`Route '${routeName}' error:`, e.message);
      return false;
    }
  };

  // Job Seeker Menu Items with actual route names from your Laravel app
  const menuItems = [
    {
      name: 'Dashboard',
      routeName: 'backend.dashboard', // ✅ This exists in your routes
      icon: FiHome,
      description: 'Overview & stats',
    },
    {
      name: 'Browse Jobs',
      routeName: 'backend.public-jobs.index', // ✅ This exists - shows public jobs list
      icon: FiSearch,
      description: 'Find your next role',
    },
    {
      name: 'My Profile',
      routeName: 'backend.applicant.profile.show', // ✅ This exists
      icon: FiUser,
      description: 'View & edit profile',
      routeParams: { id: user?.applicantProfile?.id || null }, // Will need user's profile ID
    },
    {
      name: 'My Applications',
      routeName: 'backend.apply.index', // ✅ This exists
      icon: FiFileText,
      description: 'Track applications',
    },
    {
      name: 'Notifications',
      routeName: 'backend.notifications.index', // ✅ This exists
      icon: FiBell,
      badgeCount: notificationMeta.unread_count,
      description: 'Updates & alerts',
    },
  ];

  // Render menu item
  const renderMenuItem = (item) => {
    // Generate the route URL using Ziggy
    const href = safeRoute(item.routeName, item.routeParams || {});
    const isActive = isRouteActive(item.routeName, item.routeParams || {});

    // Don't render if route doesn't exist or is invalid
    if (href === '#') {
      return null;
    }

    return (
      <Link
        key={item.name}
        href={href}
        className={`
          flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 mb-1 relative group
          ${isActive
            ? 'bg-green-100 text-green-700 font-semibold shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        title={item.description}
      >
        {/* Icon */}
        <item.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`} />

        {/* Name */}
        {!isCollapsed && <span className="flex-1">{item.name}</span>}

        {/* Badge */}
        {!isCollapsed && item.badgeCount > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </span>
        )}

        {/* Active indicator */}
        {isActive && !isCollapsed && (
          <span className="absolute left-0 w-1 h-8 bg-green-500 rounded-r-full" />
        )}

        {/* Collapsed active indicator */}
        {isActive && isCollapsed && (
          <span className="absolute right-0 w-1.5 h-1.5 rounded-full bg-green-500" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col shadow-xl transition-all duration-300 z-50`}>
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link href={safeRoute('home') || '/'} className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-linear-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                <FiBriefcase className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  JobMatch
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <FiChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
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
            {menuItems.map((item) => renderMenuItem(item))}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
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
                <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">Logout</span>
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center shadow-md relative group">
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                  {userName}<br />
                  Job Seeker
                </div>
              </div>
              <Link
                href={safeRoute('logout')}
                method="post"
                as="button"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                title="Logout"
              >
                <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 p-6 mx-auto text-black ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  );
};

export default JobSeekerLayout;