// resources/js/layouts/AdminLayout.jsx

import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import {
  FiHome,
  FiBell,
  FiBriefcase,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
  FiUser,
  FiSearch,
  FiPlusCircle,
  FiUsers,
  FiBarChart2,
  FiDownload,
  FiMail,
  FiStar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAward,
  FiList,
  FiShield,
  FiKey,
  FiTrash2,
  FiUserCheck,
  FiUserPlus,
} from 'react-icons/fi';
import {
  MdCategory,
  MdWorkOutline,
} from "react-icons/md";
import { FaSearchLocation } from "react-icons/fa";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
// ✅ CMS ICONS
import { FaFileAlt, FaNewspaper, FaBriefcase as FaBriefcaseSolid, FaUsers, FaDatabase, FaCog, FaLayerGroup } from 'react-icons/fa';

const AdminLayout = ({ children }) => {
  const { url, props } = usePage();
  const { auth } = props;
  const user = auth?.user;
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const notificationMeta = props.notifications || { unread_count: 0, recent: [] };

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({
    adminJobs: false,
    adminApps: false,
    adminRoles: false,
    adminApplicants: false,
    cms: false, // ✅ CMS DROPDOWN STATE
  });

  // Get user's roles and permissions
  const userRoles = user?.roles || [];
  const userPermissions = user?.permissions || [];

  // ✅ FIX: Super Admin and Admin have ALL permissions
  const hasRole = (roleSlug) => {
    return userRoles.some(role => role.slug === roleSlug);
  };

  const hasPermission = (permissionSlug) => {
    // Super Admin and Admin have all permissions
    if (hasRole('super-admin') || hasRole('admin')) return true;
    return userPermissions?.includes(permissionSlug) || false;
  };

  const hasAnyPermission = (permissionSlugs) => {
    // Super Admin and Admin have all permissions
    if (hasRole('super-admin') || hasRole('admin')) return true;
    if (!permissionSlugs || permissionSlugs.length === 0) return false;
    return permissionSlugs.some(slug => hasPermission(slug));
  };

  // Determine primary role
  const primaryRole = useMemo(() => {
    if (hasRole('super-admin') || hasRole('admin')) return 'admin';
    if (hasRole('employer-admin') || hasRole('hr-manager') || hasRole('recruiter')) return 'employer';
    return 'admin';
  }, [userRoles]);

  const route = (name, params = {}) => {
    if (typeof window !== 'undefined' && window.route) {
      try {
        return window.route(name, params);
      } catch (e) {
        return '#';
      }
    }
    return '#';
  };

  // Normalize URL
  const normalizeUrl = (value) => {
    if (!value) return '';
    const absolute = typeof value === 'string' ? value : value.toString();
    const pathOnly = absolute.replace(/^https?:\/\/[^/]+/i, '');
    const withoutQueryOrHash = pathOnly.replace(/[?#].*$/, '');
    return withoutQueryOrHash.replace(/\/$/, '');
  };

  const normalizeUrlWithQuery = (value) => {
    if (!value) return '';
    const absolute = typeof value === 'string' ? value : value.toString();
    const withoutDomain = absolute.replace(/^https?:\/\/[^/]+/i, '');
    const withoutHash = withoutDomain.replace(/#.*$/, '');
    const parts = withoutHash.split('?');
    const normalizedPath = (parts[0] || '').replace(/\/$/, '');
    const query = parts.length > 1 ? `?${parts.slice(1).join('?')}` : '';
    return `${normalizedPath}${query}`;
  };

  const isPathActive = (path) => {
    if (!path || path === '#') return false;
    const normalizedUrl = normalizeUrl(url);
    const normalizedPath = normalizeUrl(path);

    // Special handling for CMS routes
    if (normalizedPath.includes('/backend/admin')) {
      // For CMS routes, check if the current URL starts with the path
      if (path === '/backend/admin' && normalizedUrl === '/backend/admin') {
        return true;
      }
      return normalizedUrl.startsWith(normalizedPath);
    }

    if (normalizedUrl === normalizedPath) return true;
    if (normalizedPath !== '/' && normalizedUrl.startsWith(normalizedPath)) return true;
    return false;
  };

  const isPathActiveWithQuery = (path) => {
    if (!path || path === '#') return false;
    return normalizeUrlWithQuery(url) === normalizeUrlWithQuery(path);
  };

  const isRouteActive = (routeName, params = {}, aliasPaths = [], options = {}) => {
    try {
      const routeUrl = route(routeName, params);
      if (routeUrl === '#') return false;
      const normalizedUrl = normalizeUrl(url);
      const normalizedRouteUrl = normalizeUrl(routeUrl);
      const normalizedAliases = (aliasPaths || []).filter(Boolean).map((path) => normalizeUrl(path));
      const normalizedExcludes = (options?.excludePaths || []).filter(Boolean).map((path) => normalizeUrl(path));

      if (normalizedExcludes.some((exclude) => normalizedUrl === exclude || normalizedUrl.startsWith(exclude))) {
        return false;
      }
      if (options?.exact) {
        return normalizedUrl === normalizedRouteUrl;
      }
      if (normalizedUrl === normalizedRouteUrl) return true;
      if (normalizedAliases.some((alias) => normalizedUrl === alias || normalizedUrl.startsWith(alias))) {
        return true;
      }
      if (normalizedRouteUrl !== '/' && normalizedUrl.startsWith(normalizedRouteUrl)) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const isDropdownActive = (subItems) => {
    return subItems?.some(subItem => {
      if (subItem.href && subItem.href !== '#') {
        return subItem.matchQuery ? isPathActiveWithQuery(subItem.href) : isPathActive(subItem.href);
      }
      if (subItem.routeName) {
        return isRouteActive(subItem.routeName, subItem.routeParams || {}, subItem.activeAliases || [], {
          exact: subItem.exact,
          excludePaths: subItem.activeExclude
        });
      }
      return false;
    });
  };

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  // Auto-expand menus based on current URL
  useEffect(() => {
    const shouldOpenJobs = url.includes('/listing') || url.includes('/locations') || url.includes('/categories') || url.includes('/statistics');
    const shouldOpenApps = url.includes('/applications') || url.includes('/apply');
    const shouldOpenRoles = url.includes('/roles');
    // Updated to match /backend/admin path
    const shouldOpenCMS = url.includes('/backend/admin');

    setOpenMenus((prev) => ({
      ...prev,
      adminJobs: prev.adminJobs || shouldOpenJobs,
      adminApps: prev.adminApps || shouldOpenApps,
      adminRoles: prev.adminRoles || shouldOpenRoles,
      cms: prev.cms || shouldOpenCMS,
    }));
  }, [url]);

  // Role-based color scheme
  const roleColors = {
    admin: {
      light: 'from-red-600 to-red-700',
      bg: 'bg-red-500',
      text: 'text-red-600',
      border: 'border-red-500',
      hover: 'hover:bg-red-50',
      active: 'bg-red-100 text-red-700',
    },
    employer: {
      light: 'from-blue-600 to-blue-700',
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-500',
      hover: 'hover:bg-blue-50',
      active: 'bg-blue-100 text-blue-700',
    },
  };

  const colors = roleColors[primaryRole] || roleColors.admin;

  const getPrimaryRoleName = () => {
    if (hasRole('super-admin')) return 'Super Administrator';
    if (hasRole('admin')) return 'Administrator';
    if (hasRole('employer-admin')) return 'Employer Admin';
    if (hasRole('hr-manager')) return 'HR Manager';
    if (hasRole('recruiter')) return 'Recruiter';
    return 'Staff';
  };

  // ==========================================
  // ADMIN/STAFF MENU ITEMS (WITH CMS)
  // ==========================================
  const menuItems = useMemo(() => {
    const items = [];

    // Dashboard
    if (hasPermission('dashboard.admin') || hasPermission('dashboard.employer')) {
      items.push({
        name: 'Dashboard',
        routeName: 'backend.dashboard',
        icon: FiHome,
        description: 'System overview',
      });
    }

    // Jobs Management Dropdown
    if (hasAnyPermission(['job.view.any', 'job.create', 'category.view', 'location.view', 'statistics.view'])) {
      const jobSubItems = [];

      if (hasPermission('job.view.any')) {
        jobSubItems.push({
          name: 'All Jobs',
          routeName: 'backend.listing.index',
          activeExclude: ['/backend/listing/create'],
          icon: FiList,
        });
      }

      if (hasPermission('job.create')) {
        jobSubItems.push({
          name: 'Create New Job',
          routeName: 'backend.listing.create',
          icon: FiPlusCircle,
          highlight: true,
        });
      }

      if (hasPermission('location.view')) {
        jobSubItems.push({
          name: 'Locations',
          routeName: 'backend.locations.index',
          icon: FaSearchLocation,
        });
      }

      if (hasPermission('category.view')) {
        jobSubItems.push({
          name: 'Categories',
          routeName: 'backend.categories.index',
          icon: MdCategory,
        });
      }

      if (hasPermission('statistics.view') || hasPermission('report.jobs')) {
        jobSubItems.push({
          name: 'Job Statistics',
          routeName: 'backend.statistics.index',
          icon: FiBarChart2,
          description: 'View job analytics',
        });
      }

      if (jobSubItems.length > 0) {
        items.push({
          name: 'Jobs Management',
          icon: FiBriefcase,
          isDropdown: true,
          dropdownKey: 'adminJobs',
          description: 'Manage all jobs',
          subItems: jobSubItems,
        });
      }
    }

    // Applicant Profiles
    if (hasAnyPermission(['profiles.view.any', 'applicant-profiles.manage'])) {
      items.push({
        name: 'Applicant Profiles',
        routeName: 'backend.applicant-profile.index',
        icon: FiUsers,
        description: 'Manage all applicant profiles',
      });
    }

    // Applications Dropdown
    if (hasAnyPermission(['application.view.any', 'application.shortlist', 'application.reject'])) {
      const appSubItems = [];

      if (hasPermission('application.view.any')) {
        appSubItems.push({
          name: 'All Applications',
          href: '/backend/applications',
          matchQuery: true,
          icon: FiUsers,
        });
        appSubItems.push({
          name: 'Pending',
          href: '/backend/applications?status=pending',
          matchQuery: true,
          icon: FiClock,
          badgeColor: 'bg-yellow-500',
        });
        appSubItems.push({
          name: 'Shortlisted',
          href: '/backend/applications?status=shortlisted',
          matchQuery: true,
          icon: FiStar,
          badgeColor: 'bg-green-500',
        });
        appSubItems.push({
          name: 'Rejected',
          href: '/backend/applications?status=rejected',
          matchQuery: true,
          icon: FiXCircle,
          badgeColor: 'bg-red-500',
        });
        appSubItems.push({
          name: 'Hired',
          href: '/backend/applications?status=hired',
          matchQuery: true,
          icon: FiAward,
          badgeColor: 'bg-purple-500',
        });
      }

      if (appSubItems.length > 0) {
        items.push({
          name: 'Applications',
          icon: FiFileText,
          isDropdown: true,
          dropdownKey: 'adminApps',
          description: 'All applications',
          subItems: appSubItems,
        });
      }
    }

    // Users Management
    if (hasAnyPermission(['user.view', 'user.create', 'user.edit'])) {
      items.push({
        name: 'Users Management',
        routeName: 'backend.users.index',
        icon: FiUsers,
        description: 'Manage platform users',
      });
    }

    // Roles & Permissions
    if (hasAnyPermission(['role.view', 'role.create', 'role.edit', 'role.delete'])) {
      const roleSubItems = [];

      if (hasPermission('role.view')) {
        roleSubItems.push({
          name: 'All Roles',
          routeName: 'backend.roles.index',
          icon: FiKey,
          exact: true,
        });
      }

      if (hasPermission('role.create')) {
        roleSubItems.push({
          name: 'Create Role',
          routeName: 'backend.roles.create',
          icon: FiPlusCircle,
        });
      }

      if (hasPermission('role.view')) {
        roleSubItems.push({
          name: 'Trashed Roles',
          routeName: 'backend.roles.trashed',
          icon: FiTrash2,
        });
      }

      if (roleSubItems.length > 0) {
        items.push({
          name: 'Roles & Permissions',
          icon: FiShield,
          isDropdown: true,
          dropdownKey: 'adminRoles',
          description: 'Manage roles & permissions',
          subItems: roleSubItems,
        });
      }
    }

    if (hasAnyPermission([
      'cms.dashboard', 'pages.view', 'pages.manage',
      'about.view', 'about.manage', 'blogs.view', 'blogs.manage',
      'programs.view', 'programs.manage', 'custom-sections.view', 'custom-sections.manage',
      'shared-data.view', 'shared-data.manage'
    ])) {
      const cmsSubItems = [];
      
      // Pages
      if (hasAnyPermission(['pages.view'])) {
        cmsSubItems.push({
          name: 'Pages',
          href: '/backend/admin/pages',
          icon: FaFileAlt,
        });
    
      }

      // Shared Data
      if (hasAnyPermission(['shared-data.view', 'shared-data.manage'])) {
        cmsSubItems.push({
          name: 'Shared Data',
          href: '/backend/admin/shared-data',
          icon: FaDatabase,
        });
      }

      if (cmsSubItems.length > 0) {
        items.push({
          name: 'CMS Management',
          icon: FaLayerGroup,
          isDropdown: true,
          dropdownKey: 'cms',
          description: 'Manage website content',
          subItems: cmsSubItems,
        });
      }
    }

    // Admin Settings
    if (hasPermission('admin_profile.edit') || hasPermission('admin_profile.update')) {
      items.push({
        name: 'Admin Settings',
        routeName: 'backend.admin-profile.edit',
        icon: FiSettings,
        description: 'Edit admin account settings',
      });
    }

    // Notifications - Shared
    if (hasPermission('notification.view')) {
      items.push({
        name: 'Notifications',
        routeName: 'backend.notifications.index',
        icon: FiBell,
        badgeCount: notificationMeta.unread_count,
        description: 'System alerts',
      });
    }

    return items;
  }, [notificationMeta.unread_count]);

  // Render sub menu item
  const renderSubMenuItem = (subItem) => {
    const isActiveSub = subItem.routeName
      ? isRouteActive(subItem.routeName, subItem.routeParams || {}, subItem.activeAliases || [], {
        exact: subItem.exact,
        excludePaths: subItem.activeExclude
      })
      : (subItem.matchQuery ? isPathActiveWithQuery(subItem.href) : isPathActive(subItem.href));

    return (
      <Link
        key={subItem.name}
        href={subItem.routeName ? route(subItem.routeName, subItem.routeParams || {}) : subItem.href}
        className={`
          flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 group relative
          ${isActiveSub
            ? `${colors.active} font-medium border-l-3 ${colors.border}`
            : 'text-gray-600 hover:bg-gray-50'
          }
          ${subItem.highlight ? 'bg-linear-to-r from-blue-50 to-blue-100' : ''}
        `}
      >
        {subItem.icon && (
          <subItem.icon className={`w-4 h-4 ${isActiveSub ? colors.text : 'text-gray-400 group-hover:text-gray-600'}`} />
        )}
        <span className="flex-1">{subItem.name}</span>
        {subItem.badgeColor && (
          <span className={`w-2 h-2 rounded-full ${subItem.badgeColor}`}></span>
        )}
        {isActiveSub && (
          <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`}></span>
        )}
      </Link>
    );
  };

  // Render menu item
  // Render menu item
  const renderMenuItem = (item) => {
    if (item.isDropdown) {
      const isOpen = openMenus[item.dropdownKey];
      const isDropdownItemActive = isDropdownActive(item.subItems);

      return (
        <div key={item.name} className="mb-1">
          <button
            onClick={() => toggleMenu(item.dropdownKey)}
            className={`
            w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group whitespace-nowrap
            ${isDropdownItemActive
                ? colors.active + ' font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
              }
          `}
            title={item.description}
          >
            <div className="flex items-center gap-3 min-w-0">
              <item.icon className={`w-5 h-5 shrink-0 ${isDropdownItemActive ? colors.text : 'text-gray-400 group-hover:text-gray-600'}`} />
              {!isCollapsed && <span className="font-medium truncate">{item.name}</span>}
            </div>
            {!isCollapsed && (
              isOpen ? (
                <FiChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isDropdownItemActive ? colors.text : ''}`} />
              ) : (
                <FiChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isDropdownItemActive ? colors.text : ''}`} />
              )
            )}
          </button>

          {isOpen && !isCollapsed && (
            <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
              {item.subItems.map((subItem) => renderSubMenuItem(subItem))}
            </div>
          )}
        </div>
      );
    }

    const isMenuItemActive = item.routeName
      ? isRouteActive(item.routeName, item.routeParams || {}, item.activeAliases || [], {
        exact: item.exact,
        excludePaths: item.activeExclude
      })
      : isPathActive(item.href);

    return (
      <Link
        key={item.name}
        href={item.routeName ? route(item.routeName, item.routeParams || {}) : item.href}
        className={`
        flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 mb-1 relative group whitespace-nowrap
        ${isMenuItemActive
            ? colors.active + ' font-semibold shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
          }
      `}
        title={item.description}
      >
        <item.icon className={`w-5 h-5 shrink-0 ${isMenuItemActive ? colors.text : 'text-gray-400 group-hover:text-gray-600'}`} />
        {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
        {!isCollapsed && item.badgeCount > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </span>
        )}
        {isMenuItemActive && !isCollapsed && (
          <span className={`absolute left-0 w-1 h-8 ${colors.bg} rounded-r-full shrink-0`}></span>
        )}
        {isMenuItemActive && isCollapsed && (
          <span className={`absolute right-0 w-1.5 h-1.5 rounded-full ${colors.bg} shrink-0`}></span>
        )}
      </Link>
    );
  };

  if (menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="p-6">
          {children}
        </main>
      </div>
    );
  }

  // ✅ REMOVED: console.log statements that were causing the error

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col shadow-xl transition-all duration-300 z-50`}>
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link href={route('home')} className="flex items-center gap-2 group">
              <div className={`w-8 h-8 bg-linear-to-br ${colors.light} rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200`}>
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
                {primaryRole === 'admin' ? 'Administration' : 'Employer Portal'}
              </p>
            </div>
          )}

          <div className="space-y-1">
            {menuItems.map((item) => renderMenuItem(item))}
          </div>

          {isCollapsed && userRoles.length > 0 && (
            <div className="mt-4 flex justify-center">
              <div className="relative group">
                <div className={`w-2 h-2 rounded-full ${colors.bg} cursor-help`}></div>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                  {userRoles.map(r => r.name).join(', ')}
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full bg-linear-to-br ${colors.light} flex items-center justify-center shadow-md`}>
                  <span className="text-white font-semibold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`}></span>
                    {getPrimaryRoleName()}
                  </p>
                </div>
              </div>

              <Link
                href={route('logout')}
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
              <div className={`w-10 h-10 rounded-full bg-linear-to-br ${colors.light} flex items-center justify-center shadow-md relative group`}>
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                  {userName}<br />
                  {getPrimaryRoleName()}
                </div>
              </div>
              <Link
                href={route('logout')}
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

export default AdminLayout;