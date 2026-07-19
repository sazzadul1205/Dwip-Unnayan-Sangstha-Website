// resources/js/layouts/AdminLayout.jsx

// ============================================================
// IMPORTS
// ============================================================

// React
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback } from 'react';

// Icons
import { FaSearchLocation, FaLayerGroup, FaImage } from "react-icons/fa";
import {
  FiHome, FiBell, FiBriefcase, FiFileText, FiSettings, FiLogOut,
  FiChevronDown, FiChevronRight, FiPlusCircle, FiUsers, FiBarChart2,
  FiStar, FiClock, FiXCircle, FiAward, FiList, FiShield, FiKey, FiTrash2,
} from 'react-icons/fi';
import { MdCategory } from "react-icons/md";

// ============================================================
// MAIN COMPONENT
// ============================================================
const AdminLayout = ({ children }) => {
  const { url, props } = usePage();
  const { auth } = props;
  const user = auth?.user;

  // ============================================================
  // STATE
  // ============================================================
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({
    adminJobs: false,
    adminApps: false,
    adminRoles: false,
    adminApplicants: false,
    cms: false,
  });

  // ============================================================
  // USER DATA
  // ============================================================
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const notificationMeta = props.notifications || { unread_count: 0, recent: [] };
  const userRoles = useMemo(() => user?.roles || [], [user]);
  const userPermissions = useMemo(() => user?.permissions || [], [user]);

  // ============================================================
  // PERMISSION HELPERS
  // ============================================================
  const hasRole = useMemo(() => (roleSlug) => userRoles.some(r => r.slug === roleSlug), [userRoles]);
  const hasPermission = useMemo(() => (permSlug) => {
    if (hasRole('super-admin') || hasRole('admin')) return true;
    return userPermissions?.includes(permSlug) || false;
  }, [hasRole, userPermissions]);

  const hasAnyPermission = useMemo(() => (permSlugs) => {
    if (hasRole('super-admin') || hasRole('admin')) return true;
    return permSlugs?.some(slug => hasPermission(slug)) || false;
  }, [hasRole, hasPermission]);

  // ============================================================
  // ROLE HELPERS
  // ============================================================
  const primaryRole = useMemo(() => {
    if (hasRole('super-admin') || hasRole('admin')) return 'admin';
    if (hasRole('employer-admin') || hasRole('hr-manager') || hasRole('recruiter')) return 'employer';
    return 'admin';
  }, [hasRole]);

  const getPrimaryRoleName = useCallback(() => {
    if (hasRole('super-admin')) return 'Super Administrator';
    if (hasRole('admin')) return 'Administrator';
    if (hasRole('employer-admin')) return 'Employer Admin';
    if (hasRole('hr-manager')) return 'HR Manager';
    if (hasRole('recruiter')) return 'Recruiter';
    return 'Staff';
  }, [hasRole]);

  // ============================================================
  // ROLE COLORS
  // ============================================================
  const roleColors = {
    admin: { light: 'from-red-600 to-red-700', bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500', hover: 'hover:bg-red-50', active: 'bg-red-100 text-red-700' },
    employer: { light: 'from-blue-600 to-blue-700', bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500', hover: 'hover:bg-blue-50', active: 'bg-blue-100 text-blue-700' },
  };
  const colors = roleColors[primaryRole] || roleColors.admin;

  // ============================================================
  // ROUTE HELPERS
  // ============================================================
  const route = (name, params = {}) => {
    if (typeof window !== 'undefined' && window.route) {
      try { return window.route(name, params); } catch (e) { console.error(e); return '#'; }
    }
    return '#';
  };

  const normalizeUrl = useCallback((value) => {
    if (!value) return '';
    const pathOnly = value.toString().replace(/^https?:\/\/[^/]+/i, '');
    return pathOnly.replace(/[?#].*$/, '').replace(/\/$/, '');
  }, []);

  const normalizeUrlWithQuery = useCallback((value) => {
    if (!value) return '';
    const withoutDomain = value.toString().replace(/^https?:\/\/[^/]+/i, '');
    const withoutHash = withoutDomain.replace(/#.*$/, '');
    const parts = withoutHash.split('?');
    const path = (parts[0] || '').replace(/\/$/, '');
    const query = parts.length > 1 ? `?${parts.slice(1).join('?')}` : '';
    return `${path}${query}`;
  }, []);

  const isPathActive = useCallback((path) => {
    if (!path || path === '#') return false;
    const normUrl = normalizeUrl(url);
    const normPath = normalizeUrl(path);
    if (path === '/backend/admin' && normUrl === '/backend/admin') return true;
    if (normUrl === normPath) return true;
    return normPath !== '/' && normUrl.startsWith(normPath);
  }, [url, normalizeUrl]);

  const isPathActiveWithQuery = useCallback((path) => {
    if (!path || path === '#') return false;
    return normalizeUrlWithQuery(url) === normalizeUrlWithQuery(path);
  }, [url, normalizeUrlWithQuery]);

  const isRouteActive = useCallback((routeName, params = {}, aliasPaths = [], options = {}) => {
    try {
      const routeUrl = route(routeName, params);
      if (routeUrl === '#') return false;
      const normUrl = normalizeUrl(url);
      const normRoute = normalizeUrl(routeUrl);
      const normAliases = (aliasPaths || []).filter(Boolean).map(p => normalizeUrl(p));
      const normExcludes = (options?.excludePaths || []).filter(Boolean).map(p => normalizeUrl(p));
      if (normExcludes.some(e => normUrl === e || normUrl.startsWith(e))) return false;
      if (options?.exact) return normUrl === normRoute;
      if (normUrl === normRoute) return true;
      if (normAliases.some(a => normUrl === a || normUrl.startsWith(a))) return true;
      return normRoute !== '/' && normUrl.startsWith(normRoute);
    } catch (e) { console.error(e); return false; }
  }, [url, normalizeUrl]);

  const isDropdownActive = useCallback((subItems) => {
    return subItems?.some(sub => {
      if (sub.href && sub.href !== '#') return sub.matchQuery ? isPathActiveWithQuery(sub.href) : isPathActive(sub.href);
      if (sub.routeName) return isRouteActive(sub.routeName, sub.routeParams || {}, sub.activeAliases || [], {
        exact: sub.exact, excludePaths: sub.activeExclude
      });
      return false;
    });
  }, [isPathActive, isPathActiveWithQuery, isRouteActive]);

  // ============================================================
  // MENU TOGGLES & AUTO-EXPAND
  // ============================================================
  const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));

  // Enhanced auto-expand with better CMS detection
  useEffect(() => {
    const isCmsPage =
      url.includes('/backend/cms/pages') ||
      url.includes('/backend/cms/sections') ||
      url.includes('/backend/cms/shared') ||
      url.includes('/backend/cms/blogs') ||
      url.includes('/backend/cms/programs') ||
      url.includes('/backend/cms/about') ||
      url.includes('/backend/cms/publications');

    // Also check for specific section page pattern: /backend/cms/sections/page/{id}
    const isSectionPage = url.match(/\/backend\/cms\/sections\/page\/\d+/);

    const shouldOpen = {
      adminJobs: url.includes('/backend/listing') || url.includes('/backend/locations') || url.includes('/backend/categories') || url.includes('/backend/statistics'),
      adminApps: url.includes('/backend/applications') || url.includes('/backend/apply'),
      adminRoles: url.includes('/backend/roles'),
      cms: isCmsPage || isSectionPage,
    };

    setOpenMenus(prev => ({
      ...prev,
      adminJobs: prev.adminJobs || shouldOpen.adminJobs,
      adminApps: prev.adminApps || shouldOpen.adminApps,
      adminRoles: prev.adminRoles || shouldOpen.adminRoles,
      cms: prev.cms || shouldOpen.cms,
    }));
  }, [url]);

  // ============================================================
  // MENU ITEMS
  // ============================================================
  const menuItems = useMemo(() => {
    const items = [];

    // Dashboard - URL: /dashboard
    if (hasPermission('dashboard.admin') || hasPermission('dashboard.employer')) {
      items.push({
        name: 'Dashboard',
        routeName: 'backend.dashboard',
        icon: FiHome,
        description: 'System overview'
      });
    }

    // Jobs Management Dropdown - URL: /backend/listing/*
    if (hasAnyPermission(['job.view.any', 'job.create', 'category.view', 'location.view', 'statistics.view'])) {
      const subs = [];

      // All Jobs - URL: /backend/listing
      if (hasPermission('job.view.any')) {
        subs.push({
          name: 'All Jobs',
          routeName: 'backend.listing.index',
          activeExclude: ['/backend/listing/create'],
          icon: FiList
        });
      }

      // Create New Job - URL: /backend/listing/create
      if (hasPermission('job.create')) {
        subs.push({
          name: 'Create New Job',
          routeName: 'backend.listing.create',
          icon: FiPlusCircle,
          highlight: true
        });
      }

      // Locations - URL: /backend/locations
      if (hasPermission('location.view')) {
        subs.push({
          name: 'Locations',
          routeName: 'backend.locations.index',
          icon: FaSearchLocation
        });
      }

      // Categories - URL: /backend/categories
      if (hasPermission('category.view')) {
        subs.push({
          name: 'Categories',
          routeName: 'backend.categories.index',
          icon: MdCategory
        });
      }

      // Job Statistics - URL: /backend/statistics
      if (hasPermission('statistics.view') || hasPermission('report.jobs')) {
        subs.push({
          name: 'Job Statistics',
          routeName: 'backend.statistics.index',
          icon: FiBarChart2
        });
      }

      if (subs.length) {
        items.push({
          name: 'Jobs Management',
          icon: FiBriefcase,
          isDropdown: true,
          dropdownKey: 'adminJobs',
          subItems: subs
        });
      }
    }

    // Applicant Profiles - URL: /backend/applicant-profiles
    if (hasAnyPermission(['profiles.view.any', 'applicant-profiles.manage'])) {
      items.push({
        name: 'Applicant Profiles',
        routeName: 'backend.applicant-profile.index',
        icon: FiUsers
      });
    }

    // Applications Dropdown - URL: /backend/applications
    if (hasAnyPermission(['application.view.any', 'application.shortlist', 'application.reject'])) {
      const subs = [];
      if (hasPermission('application.view.any')) {
        subs.push({ name: 'All Applications', href: '/backend/applications', matchQuery: true, icon: FiUsers });
        subs.push({ name: 'Pending', href: '/backend/applications?status=pending', matchQuery: true, icon: FiClock });
        subs.push({ name: 'Shortlisted', href: '/backend/applications?status=shortlisted', matchQuery: true, icon: FiStar });
        subs.push({ name: 'Rejected', href: '/backend/applications?status=rejected', matchQuery: true, icon: FiXCircle });
        subs.push({ name: 'Hired', href: '/backend/applications?status=hired', matchQuery: true, icon: FiAward });
      }
      if (subs.length) items.push({
        name: 'Applications',
        icon: FiFileText,
        isDropdown: true,
        dropdownKey: 'adminApps',
        subItems: subs
      });
    }

    // Users Management - URL: /backend/users
    if (hasAnyPermission(['user.view', 'user.create', 'user.edit'])) {
      items.push({
        name: 'Users Management',
        routeName: 'backend.users.index',
        icon: FiUsers
      });
    }

    // Roles & Permissions - URL: /backend/roles/*
    if (hasAnyPermission(['role.view', 'role.create', 'role.edit', 'role.delete'])) {
      const subs = [];
      if (hasPermission('role.view')) subs.push({
        name: 'All Roles',
        routeName: 'backend.roles.index',
        icon: FiKey,
        exact: true
      });
      if (hasPermission('role.create')) subs.push({
        name: 'Create Role',
        routeName: 'backend.roles.create',
        icon: FiPlusCircle
      });
      if (hasPermission('role.view')) subs.push({
        name: 'Trashed Roles',
        routeName: 'backend.roles.trashed',
        icon: FiTrash2
      });
      if (subs.length) items.push({
        name: 'Roles & Permissions',
        icon: FiShield,
        isDropdown: true,
        dropdownKey: 'adminRoles',
        subItems: subs
      });
    }

    // CMS Management - URL: /backend/cms/*
    if (hasAnyPermission([
      'pages.view',
      'shared-data.view',
      'blogs.view',
      'programs.view',
      'about.view',
      'publications.view',
    ])) {
      const subs = [];

      // Pages - URL: /backend/cms/pages
      // Add activeAliases to detect section pages too!
      if (hasPermission('pages.view')) {
        subs.push({
          name: 'Pages',
          routeName: 'backend.cms.pages.index',
          icon: FiFileText,
          activeAliases: [
            '/backend/cms/sections',      // Any sections page
            '/backend/cms/sections/page', // Sections for a specific page
          ],
        });
      }

      // Shared Data - URL: /backend/cms/shared
      if (hasPermission('shared-data.view')) {
        subs.push({
          name: 'Shared Data',
          routeName: 'backend.cms.shared.index',
          icon: FaLayerGroup,
        });
      }

      // Blogs - URL: /backend/cms/blogs
      if (hasPermission('blogs.view')) {
        subs.push({
          name: 'Blogs',
          routeName: 'backend.cms.blogs.index',
          icon: FiFileText,
        });
      }

      // Programs - URL: /backend/cms/programs
      if (hasPermission('programs.view')) {
        subs.push({
          name: 'Programs',
          routeName: 'backend.cms.programs.index',
          icon: FiBriefcase,
        });
      }

      // About - URL: /backend/cms/about
      if (hasPermission('about.view')) {
        subs.push({
          name: 'About',
          routeName: 'backend.cms.about.index',
          icon: FiUsers,
        });
      }

      // Publications - URL: /backend/cms/publications
      if (hasPermission('publications.view')) {
        subs.push({
          name: 'Publications',
          routeName: 'backend.cms.publications.index',
          icon: FiFileText,
        });
      }

      if (subs.length) {
        items.push({
          name: 'CMS Management',
          icon: FaLayerGroup,
          isDropdown: true,
          dropdownKey: 'cms',
          subItems: subs,
        });
      }
    }

    // Site Icon - URL: /backend/icon
    if (hasPermission('icon.manage')) {
      items.push({
        name: 'Site Icon',
        routeName: 'backend.icon.index',
        icon: FaImage
      });
    }

    // Admin Settings - URL: /backend/admin-profile
    if (hasPermission('admin_profile.edit') || hasPermission('admin_profile.update')) {
      items.push({
        name: 'Admin Settings',
        routeName: 'backend.admin-profile.edit',
        icon: FiSettings
      });
    }

    // Notifications - URL: /backend/notifications
    if (hasPermission('notification.view')) {
      items.push({
        name: 'Notifications',
        routeName: 'backend.notifications.index',
        icon: FiBell,
        badgeCount: notificationMeta.unread_count
      });
    }

    return items;
  }, [hasAnyPermission, hasPermission, notificationMeta.unread_count]);

  // Effect to auto-expand CMS menu when active
  useEffect(() => {
    const cmsMenu = menuItems.find(item => item.dropdownKey === 'cms');

    setOpenMenus(prev => ({
      ...prev,
      cms: prev.cms || (cmsMenu && isDropdownActive(cmsMenu.subItems)),
    }));
  }, [url, menuItems, isDropdownActive]);

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  const renderSubMenuItem = useCallback((sub) => {
    const active = sub.routeName
      ? isRouteActive(sub.routeName, sub.routeParams || {}, sub.activeAliases || [], { exact: sub.exact, excludePaths: sub.activeExclude })
      : (sub.matchQuery ? isPathActiveWithQuery(sub.href) : isPathActive(sub.href));

    return (
      <Link key={sub.name} href={sub.routeName ? route(sub.routeName, sub.routeParams || {}) : sub.href}
        className={`flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 group relative
          ${active ? `${colors.active} font-medium border-l-3 ${colors.border}` : 'text-gray-600 hover:bg-gray-50'}
          ${sub.highlight ? 'bg-linear-to-r from-blue-50 to-blue-100' : ''}`}
      >
        {sub.icon && <sub.icon className={`w-4 h-4 ${active ? colors.text : 'text-gray-400 group-hover:text-gray-600'}`} />}
        <span className="flex-1">{sub.name}</span>
        {active && <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />}
      </Link>
    );
  }, [colors, isPathActive, isPathActiveWithQuery, isRouteActive]);

  const renderMenuItem = useCallback((item) => {
    if (item.isDropdown) {
      const open = openMenus[item.dropdownKey];
      const active = isDropdownActive(item.subItems);
      return (
        <div key={item.name} className="mb-1">
          <button onClick={() => toggleMenu(item.dropdownKey)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group
              ${active ? `${colors.active} font-semibold` : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${active ? colors.text : 'text-gray-400'}`} />
              {!isCollapsed && <span className="font-medium truncate">{item.name}</span>}
            </div>
            {!isCollapsed && (open ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />)}
          </button>
          {open && !isCollapsed && (
            <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
              {item.subItems.map(sub => renderSubMenuItem(sub))}
            </div>
          )}
        </div>
      );
    }

    const active = item.routeName
      ? isRouteActive(item.routeName, item.routeParams || {}, item.activeAliases || [], { exact: item.exact, excludePaths: item.activeExclude })
      : isPathActive(item.href);

    return (
      <Link key={item.name} href={item.routeName ? route(item.routeName, item.routeParams || {}) : item.href}
        className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 mb-1 relative group
          ${active ? `${colors.active} font-semibold shadow-sm` : 'text-gray-700 hover:bg-gray-100'}`}
      >
        <item.icon className={`w-5 h-5 ${active ? colors.text : 'text-gray-400'}`} />
        {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
        {!isCollapsed && item.badgeCount > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </span>
        )}
        {active && !isCollapsed && <span className={`absolute left-0 w-1 h-8 ${colors.bg} rounded-r-full`} />}
        {active && isCollapsed && <span className={`absolute right-0 w-1.5 h-1.5 rounded-full ${colors.bg}`} />}
      </Link>
    );
  }, [openMenus, isCollapsed, colors, isDropdownActive, renderSubMenuItem, isRouteActive, isPathActive]);

  // ============================================================
  // RENDER
  // ============================================================
  if (menuItems.length === 0) {
    return <div className="min-h-screen bg-gray-50"><main className="p-6">{children}</main></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col shadow-xl transition-all duration-300 z-50`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link href={route('home')} className="flex items-center gap-2 group">
              <div className={`w-8 h-8 bg-linear-to-br ${colors.light} rounded-lg flex items-center justify-center shadow-md`}>
                <FiBriefcase className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && <span className="text-xl font-bold text-gray-900">JobMatch</span>}
            </Link>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-lg hover:bg-gray-100">
              <FiChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {!isCollapsed && <p className="px-4 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{primaryRole === 'admin' ? 'Administration' : 'Employer Portal'}</p>}
          <div className="space-y-1">{menuItems.map(item => renderMenuItem(item))}</div>
          {isCollapsed && userRoles.length > 0 && (
            <div className="mt-4 flex justify-center">
              <div className="relative group">
                <div className={`w-2 h-2 rounded-full ${colors.bg} cursor-help`} />
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
                  <span className="text-white font-semibold text-sm">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                    {getPrimaryRoleName()}
                  </p>
                </div>
              </div>
              <Link href={route('logout')} method="post" as="button"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
              >
                <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Logout</span>
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-linear-to-br ${colors.light} flex items-center justify-center shadow-md relative group`}>
                <span className="text-white font-semibold text-sm">{userName.charAt(0).toUpperCase()}</span>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                  {userName}<br />{getPrimaryRoleName()}
                </div>
              </div>
              <Link href={route('logout')} method="post" as="button"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group" title="Logout"
              >
                <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
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