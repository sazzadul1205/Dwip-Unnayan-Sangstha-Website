// resources/js/Components/Sidebar.jsx (Updated version)

// React
import { useState, useEffect, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';

// Icons
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

const Sidebar = () => {
  const { url, props } = usePage();
  const { auth } = props;
  const notificationMeta = props.notifications || { unread_count: 0, recent: [] };

  // Get user and their roles/permissions
  const user = auth?.user;
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';

  // Get user's roles from the authenticated user
  const userRoles = user?.roles || [];
  const userPermissions = user?.permissions || [];

  // Check if user has specific role
  const hasRole = (roleSlug) => {
    return userRoles.some(role => role.slug === roleSlug);
  };

  // Check if user has specific permission
  const hasPermission = (permissionSlug) => {
    return userPermissions?.includes(permissionSlug) || false;
  };

  // Check if user has ANY of the given permissions
  const hasAnyPermission = (permissionSlugs) => {
    if (!permissionSlugs || permissionSlugs.length === 0) return false;
    return permissionSlugs.some(slug => hasPermission(slug));
  };

  // Check if user has ALL of the given permissions
  const hasAllPermissions = (permissionSlugs) => {
    if (!permissionSlugs || permissionSlugs.length === 0) return true;
    return permissionSlugs.every(slug => hasPermission(slug));
  };

  // Determine primary role for UI theming
  const primaryRole = useMemo(() => {
    if (hasRole('super-admin') || hasRole('admin')) return 'admin';
    if (hasRole('employer-admin') || hasRole('hr-manager') || hasRole('recruiter')) return 'employer';
    if (hasRole('job-seeker')) return 'job_seeker';
    return 'job_seeker';
  }, [userRoles]);

  // State to track open menus
  const [openMenus, setOpenMenus] = useState({
    jobs: false,
    applications: false,
    employerJobs: false,
    employerApps: false,
    adminJobs: false,
    adminApps: false,
    adminRoles: false,
    adminApplicants: false,
  });

  // State for collapsed sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-expand menus based on current URL
  useEffect(() => {
    const shouldOpenJobs = url.includes('/listing') || url.includes('/locations') || url.includes('/categories') || url.includes('/statistics');
    const shouldOpenApplications = url.includes('/applications') || url.includes('/apply');
    const shouldOpenRoles = url.includes('/roles');
    const shouldOpenApplicants = url.includes('/applicant-profiles');

    setOpenMenus((prev) => ({
      ...prev,
      jobs: prev.jobs || shouldOpenJobs,
      employerJobs: prev.employerJobs || shouldOpenJobs,
      adminJobs: prev.adminJobs || shouldOpenJobs,
      applications: prev.applications || shouldOpenApplications,
      employerApps: prev.employerApps || shouldOpenApplications,
      adminApps: prev.adminApps || shouldOpenApplications,
      adminRoles: prev.adminRoles || shouldOpenRoles,
      adminApplicants: prev.adminApplicants || shouldOpenApplicants,
    }));
  }, [url]);

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

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

  // Helper function to normalize URL
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

  const isRouteActive = (routeName, params = {}, aliasPaths = [], options = {}) => {
    try {
      const routeUrl = route(routeName, params);
      if (routeUrl === '#') return false;

      const normalizedUrl = normalizeUrl(url);
      const normalizedRouteUrl = normalizeUrl(routeUrl);
      const normalizedAliases = (aliasPaths || [])
        .filter(Boolean)
        .map((path) => normalizeUrl(path));
      const normalizedExcludes = (options?.excludePaths || [])
        .filter(Boolean)
        .map((path) => normalizeUrl(path));

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

  const isPathActive = (path) => {
    if (!path || path === '#') return false;
    const normalizedUrl = normalizeUrl(url);
    const normalizedPath = normalizeUrl(path);
    if (normalizedUrl === normalizedPath) return true;
    if (normalizedPath !== '/' && normalizedUrl.startsWith(normalizedPath)) return true;
    return false;
  };

  const isPathActiveWithQuery = (path) => {
    if (!path || path === '#') return false;
    return normalizeUrlWithQuery(url) === normalizeUrlWithQuery(path);
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

  // ==========================================
  // JOB SEEKER MENU (Role: job-seeker)
  // ==========================================
  const jobSeekerItems = useMemo(() => {
    const items = [];

    // Dashboard - available to all job seekers
    if (hasPermission('dashboard.job_seeker')) {
      items.push({
        name: 'Dashboard',
        routeName: 'dashboard',
        icon: FiHome,
        description: 'Overview & stats',
      });
    }

    // Browse Jobs
    if (hasPermission('job.view.any')) {
      items.push({
        name: 'Browse Jobs',
        routeName: 'backend.public-jobs.index',
        icon: FiSearch,
        description: 'Find your next role',
      });
    }

    // My Profile
    if (hasAnyPermission(['profile.view.own', 'profile.edit.own'])) {
      items.push({
        name: 'My Profile',
        routeName: 'backend.applicant.profile.show',
        routeParams: {},
        activeAliases: [],
        icon: FiUser,
        description: 'View & edit profile',
      });
    }

    // My Applications
    if (hasPermission('application.view.own')) {
      items.push({
        name: 'My Applications',
        routeName: 'backend.apply.index',
        icon: FiFileText,
        description: 'Track applications',
      });
    }

    // Notifications
    if (hasPermission('notification.view')) {
      items.push({
        name: 'Notifications',
        routeName: 'backend.notifications.index',
        icon: FiBell,
        badgeCount: notificationMeta.unread_count,
        description: 'Updates & alerts',
      });
    }

    return items;
  }, [user?.id, notificationMeta.unread_count]);

  // ==========================================
  // EMPLOYER MENU (Roles: employer-admin, hr-manager, recruiter)
  // ==========================================
  const employerItems = useMemo(() => {
    const items = [];

    // Dashboard
    if (hasPermission('dashboard.employer')) {
      items.push({
        name: 'Dashboard',
        routeName: 'dashboard',
        icon: FiHome,
        description: 'Overview & analytics',
      });
    }

    // Job Listings Dropdown
    if (hasAnyPermission(['job.create', 'job.view.own', 'job.edit.own'])) {
      const jobSubItems = [];

      if (hasAnyPermission(['job.view.own', 'job.view.any'])) {
        jobSubItems.push({
          name: 'All Jobs',
          routeName: 'backend.listing.index',
          activeExclude: ['/backend/listing/create'],
          icon: FiList,
          description: 'View all listings',
        });
      }

      if (hasPermission('job.create')) {
        jobSubItems.push({
          name: 'Create New Job',
          routeName: 'backend.listing.create',
          icon: FiPlusCircle,
          description: 'Post a new job',
          highlight: true,
        });
      }

      if (hasPermission('job.view.own')) {
        jobSubItems.push({
          name: 'Active Jobs',
          routeName: 'backend.listing.index',
          routeParams: { status: 'active' },
          icon: FiCheckCircle,
        });
        jobSubItems.push({
          name: 'Inactive Jobs',
          routeName: 'backend.listing.index',
          routeParams: { status: 'inactive' },
          icon: FiClock,
        });
      }

      if (jobSubItems.length > 0) {
        items.push({
          name: 'Job Listings',
          icon: FiBriefcase,
          isDropdown: true,
          dropdownKey: 'employerJobs',
          description: 'Manage job posts',
          subItems: jobSubItems,
        });
      }
    }

    // Applications Dropdown
    if (hasAnyPermission(['application.view.for_own_jobs', 'application.view.any'])) {
      const appSubItems = [];

      if (hasAnyPermission(['application.view.for_own_jobs', 'application.view.any'])) {
        appSubItems.push({
          name: 'All Applications',
          href: '/backend/applications',
          matchQuery: true,
          icon: FiUsers,
          description: 'View all candidates',
        });
      }

      if (hasPermission('application.view.for_own_jobs')) {
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
          dropdownKey: 'employerApps',
          description: 'Review candidates',
          subItems: appSubItems,
        });
      }
    }

    // Company Profile
    if (hasPermission('profile.edit.own')) {
      items.push({
        name: 'Company Profile',
        routeName: 'backend.employer.profile.edit',
        icon: HiOutlineBuildingOffice2,
        description: 'Company settings',
      });
    }

    // Notifications
    if (hasPermission('notification.view')) {
      items.push({
        name: 'Notifications',
        routeName: 'backend.notifications.index',
        icon: FiBell,
        badgeCount: notificationMeta.unread_count,
        description: 'Updates & alerts',
      });
    }

    return items;
  }, [notificationMeta.unread_count]);

  // ==========================================
  // ADMIN MENU (Roles: super-admin, admin)
  // ==========================================
  const adminItems = useMemo(() => {
    const items = [];

    // Dashboard
    if (hasPermission('dashboard.admin')) {
      items.push({
        name: 'Dashboard',
        routeName: 'dashboard',
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

      // Statistics - Job Statistics
      if (hasPermission('statistics.view') || hasPermission('report.jobs')) {
        jobSubItems.push({
          name: 'Job Statistics',
          routeName: 'backend.statistics.index',
          icon: FiBarChart2,
          description: 'View job analytics and reports',
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

    // Applicant Profiles - Single Link
    if (hasPermission('profile.view.any')) {
      items.push({
        name: 'Applicant Profiles',
        routeName: 'backend.applicant-profile.index',
        icon: FiUser,
        description: 'Manage applicant profiles',
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
      }

      if (hasPermission('application.view.any')) {
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

    // Users Management Link
    if (hasAnyPermission(['user.view', 'user.create', 'user.edit'])) {
      items.push({
        name: 'Users Management',
        routeName: 'backend.users.index',
        icon: FiUsers,
        description: 'Manage platform users',
      });
    }

    // Roles & Permissions Dropdown
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

    // Admin Profile (Edit Profile)
    if (hasPermission('profile.edit.own')) {
      items.push({
        name: 'My Profile',
        routeName: 'backend.admin-profile.edit',
        icon: FiSettings,
        description: 'Edit your profile',
      });
    }

    // Notifications
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

  // Get menu items based on user's roles and permissions
  const menuItems = useMemo(() => {
    // Super Admin and Admin get admin menu
    if (hasRole('super-admin') || hasRole('admin')) {
      return adminItems;
    }
    // Employer roles get employer menu
    if (hasRole('employer-admin') || hasRole('hr-manager') || hasRole('recruiter')) {
      return employerItems;
    }
    // Job Seeker role
    if (hasRole('job-seeker')) {
      return jobSeekerItems;
    }
    // Default fallback - check if user has any permission at all
    if (userPermissions && userPermissions.length > 0) {
      // Try to determine based on permissions
      if (userPermissions.some(p => p.includes('admin') || p.includes('user.view'))) {
        return adminItems;
      }
      if (userPermissions.some(p => p.includes('employer') || p.includes('job.create'))) {
        return employerItems;
      }
      return jobSeekerItems;
    }
    return [];
  }, [hasRole, userPermissions, adminItems, employerItems, jobSeekerItems]);

  // Role-based color scheme
  const roleColors = {
    admin: {
      light: 'from-red-600 to-red-700',
      dark: 'dark:from-red-500 dark:to-red-600',
      bg: 'bg-red-500',
      text: 'text-red-600',
      border: 'border-red-500',
      hover: 'hover:bg-red-50',
      active: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    employer: {
      light: 'from-blue-600 to-blue-700',
      dark: 'dark:from-blue-500 dark:to-blue-600',
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-500',
      hover: 'hover:bg-blue-50',
      active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    job_seeker: {
      light: 'from-green-600 to-green-700',
      dark: 'dark:from-green-500 dark:to-green-600',
      bg: 'bg-green-500',
      text: 'text-green-600',
      border: 'border-green-500',
      hover: 'hover:bg-green-50',
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
  };

  const colors = roleColors[primaryRole] || roleColors.job_seeker;

  const getPrimaryRoleName = () => {
    if (hasRole('super-admin')) return 'Super Administrator';
    if (hasRole('admin')) return 'Administrator';
    if (hasRole('employer-admin')) return 'Employer Admin';
    if (hasRole('hr-manager')) return 'HR Manager';
    if (hasRole('recruiter')) return 'Recruiter';
    if (hasRole('job-seeker')) return 'Job Seeker';
    return 'User';
  };

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
            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
          }
          ${subItem.highlight ? 'bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30' : ''}
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
  const renderMenuItem = (item) => {
    if (item.isDropdown) {
      const isOpen = openMenus[item.dropdownKey];
      const isDropdownItemActive = isDropdownActive(item.subItems);

      return (
        <div key={item.name} className="mb-1">
          <button
            onClick={() => toggleMenu(item.dropdownKey)}
            className={`
              w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group
              ${isDropdownItemActive
                ? colors.active + ' font-semibold'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }
            `}
            title={item.description}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${isDropdownItemActive ? colors.text : 'text-gray-400 group-hover:text-gray-600'}`} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </div>
            {!isCollapsed && (
              isOpen ? (
                <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownItemActive ? colors.text : ''}`} />
              ) : (
                <FiChevronRight className={`w-4 h-4 transition-transform duration-200 ${isDropdownItemActive ? colors.text : ''}`} />
              )
            )}
          </button>

          {isOpen && !isCollapsed && (
            <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
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
          flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 mb-1 relative group
          ${isMenuItemActive
            ? colors.active + ' font-semibold shadow-sm'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }
        `}
        title={item.description}
      >
        <item.icon className={`w-5 h-5 ${isMenuItemActive ? colors.text : 'text-gray-400 group-hover:text-gray-600'}`} />
        {!isCollapsed && <span className="flex-1">{item.name}</span>}
        {!isCollapsed && item.badgeCount > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </span>
        )}
        {isMenuItemActive && !isCollapsed && (
          <span className={`absolute left-0 w-1 h-8 ${colors.bg} rounded-r-full`}></span>
        )}
        {isMenuItemActive && isCollapsed && (
          <span className={`absolute right-0 w-1.5 h-1.5 rounded-full ${colors.bg}`}></span>
        )}
      </Link>
    );
  };

  // If user has no menu items, show nothing
  if (menuItems.length === 0) {
    return null;
  }

  return (
    <aside className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-xl transition-all duration-300 z-50`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <Link href={route('home')} className="flex items-center gap-2 group">
            <div className={`w-8 h-8 bg-linear-to-br ${colors.light} ${colors.dark} rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200`}>
              <FiBriefcase className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                JobMatch
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <FiChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {!isCollapsed && (
          <div className="px-4 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {primaryRole === 'admin' ? 'Administration' : primaryRole === 'employer' ? 'Employer Portal' : 'Job Seeker'}
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full bg-linear-to-br ${colors.light} ${colors.dark} flex items-center justify-center shadow-md`}>
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`}></span>
                  {getPrimaryRoleName()}
                </p>
                {userRoles.length > 1 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                    +{userRoles.slice(1).map(r => r.name).join(', ')}
                  </p>
                )}
              </div>
            </div>

            <Link
              href={route('logout')}
              method="post"
              as="button"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
            >
              <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Logout</span>
            </Link>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-linear-to-br ${colors.light} ${colors.dark} flex items-center justify-center shadow-md relative group`}>
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
              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
              title="Logout"
            >
              <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
