// resources/js/layouts/AdminLayout.jsx

// IMPORTS
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback } from 'react';

// Icons
import { FaSearchLocation, FaLayerGroup, FaFileArchive, FaEnvelope, FaPaperPlane } from "react-icons/fa";
import {
  FiHome, FiBell, FiBriefcase, FiFileText, FiSettings, FiLogOut,
  FiChevronDown, FiChevronRight, FiPlusCircle, FiUsers, FiBarChart2,
  FiStar, FiClock, FiXCircle, FiAward, FiList, FiShield, FiKey, FiTrash2,
  FiMenu, FiX, FiUser, FiCode, FiImage,
} from 'react-icons/fi';
import { MdCategory } from "react-icons/md";

// MAIN COMPONENT
const AdminLayout = ({ children }) => {
  const { url, props } = usePage();
  const { auth } = props;
  const user = auth?.user;

  // STATE
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_sidebar_collapsed');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerAnimating, setIsDrawerAnimating] = useState(false);
  const [openMenus, setOpenMenus] = useState({
    adminJobs: false,
    adminApps: false,
    adminRoles: false,
    adminApplicants: false,
    adminNewsletter: false,
    adminUsers: false,
    cms: false,
  });

  useEffect(() => {
    try {
      localStorage.setItem('admin_sidebar_collapsed', JSON.stringify(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  // USER DATA
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const notificationMeta = props.notifications || { unread_count: 0, recent: [] };
  const userRoles = useMemo(() => user?.roles || [], [user]);
  const userPermissions = useMemo(() => user?.permissions || [], [user]);

  // PERMISSION HELPERS
  const hasRole = useMemo(() => (roleSlug) => userRoles.some(r => r.slug === roleSlug), [userRoles]);
  const hasPermission = useMemo(() => (permSlug) => {
    if (hasRole('super-admin') || hasRole('admin')) return true;
    return userPermissions?.includes(permSlug) || false;
  }, [hasRole, userPermissions]);

  const hasAnyPermission = useMemo(() => (permSlugs) => {
    if (hasRole('super-admin') || hasRole('admin')) return true;
    return permSlugs?.some(slug => hasPermission(slug)) || false;
  }, [hasRole, hasPermission]);

  // ROLE HELPERS
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

  // ROLE COLORS
  const roleColors = {
    admin: { light: 'from-red-600 to-red-700', bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500', hover: 'hover:bg-red-50', active: 'bg-red-100 text-red-700' },
    employer: { light: 'from-blue-600 to-blue-700', bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500', hover: 'hover:bg-blue-50', active: 'bg-blue-100 text-blue-700' },
  };
  const colors = roleColors[primaryRole] || roleColors.admin;

  // ROUTE HELPERS
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

  // MENU TOGGLES & AUTO-EXPAND
  const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));

  // Handle drawer open/close with animation
  const openDrawer = () => {
    setIsDrawerAnimating(true);
    setIsDrawerOpen(true);
    setTimeout(() => setIsDrawerAnimating(false), 50);
  };

  const closeDrawer = () => {
    setIsDrawerAnimating(true);
    setIsDrawerOpen(false);
    setTimeout(() => setIsDrawerAnimating(false), 350);
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isDrawerOpen]);

  // Auto-expand menus based on URL
  useEffect(() => {
    const isCmsPage =
      url.includes('/backend/cms/pages') ||
      url.includes('/backend/cms/sections') ||
      url.includes('/backend/cms/shared') ||
      url.includes('/backend/cms/blogs') ||
      url.includes('/backend/cms/programs') ||
      url.includes('/backend/cms/about') ||
      url.includes('/backend/cms/publications');

    const isSectionPage = url.match(/\/backend\/cms\/sections\/page\/\d+/);

    const shouldOpen = {
      adminJobs: url.includes('/backend/listing') || url.includes('/backend/locations') || url.includes('/backend/categories') || url.includes('/backend/statistics'),
      adminApps: url.includes('/backend/applications') || url.includes('/backend/apply'),
      adminRoles: url.includes('/backend/roles'),
      adminUsers: url.includes('/backend/users/jobseekers'),
      cms: isCmsPage || isSectionPage,
    };

    setOpenMenus(prev => ({
      ...prev,
      adminJobs: prev.adminJobs || shouldOpen.adminJobs,
      adminApps: prev.adminApps || shouldOpen.adminApps,
      adminRoles: prev.adminRoles || shouldOpen.adminRoles,
      adminUsers: prev.adminUsers || shouldOpen.adminUsers,
      cms: prev.cms || shouldOpen.cms,
    }));
  }, [url]);

  // MENU ITEMS
  const menuItems = useMemo(() => {
    const items = [];

    // Dashboard
    if (hasPermission('dashboard.admin') || hasPermission('dashboard.employer')) {
      items.push({
        name: 'Dashboard',
        routeName: 'backend.dashboard',
        icon: FiHome,
        description: 'System overview'
      });
    }

    // Jobs Management Dropdown
    if (hasAnyPermission(['job.view.any', 'job.create', 'category.view', 'location.view', 'statistics.view'])) {
      const subs = [];

      if (hasPermission('job.view.any')) {
        subs.push({
          name: 'All Jobs',
          routeName: 'backend.listing.index',
          activeExclude: ['/backend/listing/create'],
          icon: FiList
        });
      }

      if (hasPermission('job.create')) {
        subs.push({
          name: 'Create New Job',
          routeName: 'backend.listing.create',
          icon: FiPlusCircle,
          highlight: true
        });
      }

      if (hasPermission('location.view')) {
        subs.push({
          name: 'Locations',
          routeName: 'backend.locations.index',
          icon: FaSearchLocation
        });
      }

      if (hasPermission('category.view')) {
        subs.push({
          name: 'Categories',
          routeName: 'backend.categories.index',
          icon: MdCategory
        });
      }

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

    // Applicant Profiles
    if (hasAnyPermission(['profiles.view.any', 'applicant-profiles.manage'])) {
      items.push({
        name: 'Applicant Profiles',
        routeName: 'backend.applicant-profile.index',
        icon: FiUsers
      });
    }

    // Applications Dropdown
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

    // Users Management
    if (hasAnyPermission(['user.view', 'user.create', 'user.edit'])) {
      const subs = [];
      subs.push({
        name: 'All Users (Excl. Job Seekers)',
        routeName: 'backend.users.index',
        icon: FiUsers
      });
      if (hasPermission('user.view')) {
        subs.push({
          name: 'Job Seekers',
          routeName: 'backend.users.jobseekers',
          icon: FiBriefcase
        });
      }
      if (subs.length) items.push({
        name: 'Users Management',
        icon: FiUsers,
        isDropdown: true,
        dropdownKey: 'adminUsers',
        subItems: subs
      });
    }

    // Roles & Permissions
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

    // CMS Management
    if (hasAnyPermission([
      'pages.view',
      'shared-data.view',
      'blogs.view',
      'programs.view',
      'about.view',
      'publications.view',
    ])) {
      const subs = [];

      if (hasPermission('pages.view')) {
        subs.push({
          name: 'Pages',
          routeName: 'backend.cms.pages.index',
          icon: FiFileText,
          activeAliases: [
            '/backend/cms/sections',
            '/backend/cms/sections/page',
          ],
        });
      }

      if (hasPermission('shared-data.view')) {
        subs.push({
          name: 'Shared Data',
          routeName: 'backend.cms.shared.index',
          icon: FaLayerGroup,
        });
      }

      if (hasPermission('blogs.view')) {
        subs.push({
          name: 'Blogs',
          routeName: 'backend.cms.blogs.index',
          icon: FiFileText,
        });
      }

      if (hasPermission('programs.view')) {
        subs.push({
          name: 'Programs',
          routeName: 'backend.cms.programs.index',
          icon: FiBriefcase,
        });
      }

      if (hasPermission('about.view')) {
        subs.push({
          name: 'About',
          routeName: 'backend.cms.about.index',
          icon: FiUsers,
        });
      }

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

    // Newsletter
    if (hasAnyPermission(['newsletter.view', 'newsletter.manage'])) {
      const subs = [];

      subs.push({
        name: 'Subscribers',
        routeName: 'backend.newsletter.index',
        icon: FiUsers,
      });

      subs.push({
        name: 'Campaigns',
        routeName: 'backend.newsletter.campaigns.index',
        icon: FaPaperPlane,
      });

      if (hasPermission('newsletter.send')) {
        subs.push({
          name: 'New Campaign',
          routeName: 'backend.newsletter.campaigns.create',
          icon: FiPlusCircle,
        });
      }

      items.push({
        name: 'Newsletter',
        routeName: 'backend.newsletter.index',
        icon: FaEnvelope,
        isDropdown: true,
        dropdownKey: 'adminNewsletter',
        subItems: subs,
      });
    }

    // Email template editor (raw Blade files, no CMS involved)
    if (hasPermission('email_templates.view')) {
      items.push({
        name: 'Email Templates',
        routeName: 'backend.email-templates.index',
        icon: FiCode,
        description: 'Edit the HTML/CSS of every outgoing email',
      });
    }

    // Admin Settings
    if (hasPermission('admin_profile.edit') || hasPermission('admin_profile.update')) {
      items.push({
        name: 'Admin Settings',
        routeName: 'backend.admin-profile.edit',
        icon: FiSettings
      });
    }

    // Notifications
    if (hasPermission('notification.view')) {
      items.push({
        name: 'Notifications',
        routeName: 'backend.notifications.index',
        icon: FiBell,
        badgeCount: notificationMeta.unread_count
      });
    }

    // System Logs
    items.push({
      name: 'System Logs',
      routeName: 'backend.logs.index',
      icon: FiFileText,
      description: 'View system activity logs'
    });

    // Asset / image management — browse storage, spot unused files
    if (hasPermission('assets.view')) {
      items.push({
        name: 'Assets',
        routeName: 'backend.assets.index',
        icon: FiImage,
        description: 'Browse uploads and find unused images or files'
      });
    }

    // Audit Trail — who changed what, when
    if (hasPermission('audit.view')) {
      items.push({
        name: 'Audit Trail',
        routeName: 'backend.audit-logs.index',
        icon: FiShield,
        description: 'Every recorded change, with before/after values'
      });
    }

    // Backup Management
    if (hasPermission('backup.manage')) {
      items.push({
        name: 'Backup',
        routeName: 'backend.backup.index',
        icon: FaFileArchive
      });
    }

    return items;
  }, [hasAnyPermission, hasPermission, notificationMeta.unread_count]);

  // RENDER HELPERS

  // Collapsed-sidebar state. The flyout is positioned with `fixed` rather than
  // `absolute` on purpose: the nav is overflow-y-auto, and CSS forces the
  // horizontal axis to clip too, so an absolute panel would be cut off by the
  // scroll container. Measured from the trigger instead.
  const [flyout, setFlyout] = useState(null);

  const openFlyout = useCallback((key, trigger) => {
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();

    setFlyout({
      key,
      top: Math.min(Math.max(rect.top, 8), window.innerHeight - 80),
      left: rect.right + 8,
    });
  }, []);

  const closeFlyout = useCallback(() => setFlyout(null), []);

  // Any navigation, resize or Escape closes the flyout. Leaving it open across a
  // route change would leave a panel pointing at the previous page.
  useEffect(() => { closeFlyout(); }, [url, isCollapsed, closeFlyout]);

  useEffect(() => {
    if (!flyout) return undefined;

    const onKey = (e) => { if (e.key === 'Escape') closeFlyout(); };
    const onResize = () => closeFlyout();

    // The panel opens on hover and is deliberately not closed when the pointer
    // leaves the trigger, because the pointer has to cross the 8px gap to reach
    // it. A click anywhere else is the unambiguous way out.
    const onPointerDown = (e) => {
      if (!e.target.closest('[data-flyout-panel]') && !e.target.closest('[data-flyout-trigger]')) {
        closeFlyout();
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onResize);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
    };
  }, [flyout, closeFlyout]);

  const renderSubMenuItem = useCallback((sub, isMobile = false) => {
    const active = sub.routeName
      ? isRouteActive(sub.routeName, sub.routeParams || {}, sub.activeAliases || [], { exact: sub.exact, excludePaths: sub.activeExclude })
      : (sub.matchQuery ? isPathActiveWithQuery(sub.href) : isPathActive(sub.href));

    return (
      <Link
        key={sub.name}
        href={sub.routeName ? route(sub.routeName, sub.routeParams || {}) : sub.href}
        onClick={isMobile ? closeDrawer : undefined}
        className={`flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 group relative
          ${active ? `${colors.active} font-medium border-l-3 ${colors.border}` : 'text-gray-600 hover:bg-gray-50'}
          ${sub.highlight ? 'bg-linear-to-r from-blue-50 to-blue-100' : ''}`}
      >
        {sub.icon && <sub.icon className={`w-4 h-4 shrink-0 ${active ? colors.text : 'text-gray-400 group-hover:text-gray-600'}`} />}
        <span className="flex-1">{sub.name}</span>
        {active && <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />}
      </Link>
    );
  }, [colors, isPathActive, isPathActiveWithQuery, isRouteActive]);

  const renderFlyoutSubItems = useCallback((item) => (
    <div className="w-60 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {item.name}
      </p>
      <div className="space-y-0.5">
        {item.subItems.map((sub) => {
          const active = sub.routeName
            ? isRouteActive(sub.routeName, sub.routeParams || {}, sub.activeAliases || [], { exact: sub.exact, excludePaths: sub.activeExclude })
            : (sub.matchQuery ? isPathActiveWithQuery(sub.href) : isPathActive(sub.href));

          return (
            <Link
              key={sub.name}
              href={sub.routeName ? route(sub.routeName, sub.routeParams || {}) : sub.href}
              onClick={closeFlyout}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                active ? `${colors.active} font-medium` : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {sub.icon && <sub.icon className={`w-4 h-4 shrink-0 ${active ? colors.text : 'text-gray-400'}`} />}
              <span className="flex-1 truncate">{sub.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  ), [colors, isPathActive, isPathActiveWithQuery, isRouteActive, closeFlyout]);

  const renderMenuItem = useCallback((item, isMobile = false) => {
    // ---- COLLAPSED DESKTOP SIDEBAR ----
    // The rail is 5rem wide, so a full item row (px-4 + icon + label) cannot
    // fit. Each entry becomes a fixed-size square holding only its icon: the
    // label moves to a tooltip for flat items and to a flyout for dropdowns.
    if (isCollapsed && !isMobile) {
      const active = item.isDropdown
        ? isDropdownActive(item.subItems)
        : (item.routeName
          ? isRouteActive(item.routeName, item.routeParams || {}, item.activeAliases || [], { exact: item.exact, excludePaths: item.activeExclude })
          : isPathActive(item.href));

      const base = `group relative flex w-full h-11 items-center justify-center rounded-lg transition-colors ${
        active ? `${colors.active} ${colors.text}` : 'text-gray-500 hover:bg-gray-100'
      }`;

      const badge = item.badgeCount > 0 && (
        <span className={`absolute right-2 top-2 h-2 w-2 rounded-full ${colors.bg} ring-2 ring-white`} />
      );

      if (item.isDropdown) {
        const isFlyoutOpen = flyout?.key === item.dropdownKey;

        return (
          <div key={item.name} className="relative mb-1">
            <button
              type="button"
              data-flyout-trigger={item.dropdownKey}
              aria-expanded={isFlyoutOpen}
              aria-haspopup="true"
              title={item.name}
              onClick={(e) => (isFlyoutOpen ? closeFlyout() : openFlyout(item.dropdownKey, e.currentTarget))}
              onMouseEnter={(e) => openFlyout(item.dropdownKey, e.currentTarget)}
              className={base}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {active && <span className={`absolute left-0 h-6 w-1 ${colors.bg} rounded-r-full`} />}
              {badge}
            </button>
          </div>
        );
      }

      return (
        <Link
          key={item.name}
          href={item.routeName ? route(item.routeName, item.routeParams || {}) : item.href}
          title={item.name}
          className={`${base} mb-1`}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {active && <span className={`absolute left-0 h-6 w-1 ${colors.bg} rounded-r-full`} />}
          {badge}
        </Link>
      );
    }

    // ---- EXPANDED SIDEBAR AND MOBILE DRAWER ----
    if (item.isDropdown) {
      const open = openMenus[item.dropdownKey];
      const active = isDropdownActive(item.subItems);

      return (
        <div key={item.name} className="mb-1">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => toggleMenu(item.dropdownKey)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group
              ${active ? `${colors.active} font-semibold` : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <item.icon className={`w-5 h-5 shrink-0 ${active ? colors.text : 'text-gray-400'}`} />
              <span className="font-medium truncate">{item.name}</span>
            </div>
            <FiChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
              {item.subItems.map(sub => renderSubMenuItem(sub, isMobile))}
            </div>
          )}
        </div>
      );
    }

    const active = item.routeName
      ? isRouteActive(item.routeName, item.routeParams || {}, item.activeAliases || [], { exact: item.exact, excludePaths: item.activeExclude })
      : isPathActive(item.href);

    return (
      <Link
        key={item.name}
        href={item.routeName ? route(item.routeName, item.routeParams || {}) : item.href}
        onClick={isMobile ? closeDrawer : undefined}
        className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 mb-1 relative group
          ${active ? `${colors.active} font-semibold shadow-sm` : 'text-gray-700 hover:bg-gray-100'}`}
      >
        <item.icon className={`w-5 h-5 shrink-0 ${active ? colors.text : 'text-gray-400'}`} />
        <span className="flex-1 truncate">{item.name}</span>
        {item.badgeCount > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </span>
        )}
        {active && <span className={`absolute left-0 w-1 h-8 ${colors.bg} rounded-r-full`} />}
      </Link>
    );
  }, [isCollapsed, openMenus, colors, isDropdownActive, isRouteActive, isPathActive, renderSubMenuItem, flyout, openFlyout, closeFlyout]);

  // If no menu items, render children without sidebar
  if (menuItems.length === 0) {
    return <div className="min-h-screen bg-gray-50"><main className="p-6">{children}</main></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex-col shadow-xl transition-all duration-300 hidden lg:flex z-50 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className={`border-b border-gray-200 ${isCollapsed ? 'p-3 flex justify-center' : 'p-4'}`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            <Link href={route('home')} className={`flex items-center group ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
              <div className={`w-8 h-8 bg-linear-to-br ${colors.light} rounded-lg flex items-center justify-center shadow-md shrink-0`}>
                <FiUser className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && <span className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Staff Panel</span>}
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-300">
          {!isCollapsed && (
            <p className="px-4 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {primaryRole === 'admin' ? 'Administration' : 'Staff Portal'}
            </p>
          )}
          {/* Centre the squares in the 5rem rail so the icons sit on one axis. */}
          <div className={`space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {menuItems.map(item => renderMenuItem(item))}
          </div>
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
              <div className="flex items-center gap-3 mb-3 min-w-0">
                <div className={`w-10 h-10 rounded-full bg-linear-to-br ${colors.light} flex items-center justify-center shadow-md shrink-0`}>
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
              <Link
                href={route('logout')}
                method="post"
                as="button"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
              >
                <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
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
              <Link
                href={route('logout')}
                method="post"
                as="button"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                title="Logout"
              >
                <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ========== COLLAPSED-SIDEBAR FLYOUT ========== */}
      {/* Rendered outside the aside: the nav clips its overflow, and this panel
          has to escape it to sit beside the rail. */}
      {isCollapsed && flyout && (() => {
        const item = menuItems.find((i) => i.dropdownKey === flyout.key);

        return item?.isDropdown ? (
          <div
            role="menu"
            data-flyout-panel="true"
            style={{ top: flyout.top, left: flyout.left }}
            className="fixed z-[60] animate-flyout-in"
            onMouseLeave={closeFlyout}
          >
            {renderFlyoutSubItems(item)}
          </div>
        ) : null;
      })()}

      {/* ========== MOBILE BOTTOM DOCKER ========== */}
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
          <Link href={route('home')} className="flex items-center">
            <div className={`w-10 h-10 bg-linear-to-br ${colors.light} rounded-lg flex items-center justify-center shadow-md`}>
              <FiUser className="w-6 h-6 text-white" />
            </div>
          </Link>

          {/* Notification Bell */}
          <Link
            href={route('backend.notifications.index')}
            className="relative p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Notifications"
          >
            <FiBell className="w-6 h-6 text-gray-700" />
            {notificationMeta.unread_count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                {notificationMeta.unread_count > 99 ? '99+' : notificationMeta.unread_count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ========== MOBILE DRAWER ========== */}
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 z-150 lg:hidden transition-all duration-300 ease-out
            ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={closeDrawer}
          aria-hidden="true"
          style={{ transition: isDrawerAnimating ? 'opacity 0.3s ease-out' : 'none' }}
        />

        {/* Drawer */}
        <div
          className={`fixed left-0 top-0 h-full w-[min(20rem,85vw)] bg-white shadow-2xl z-160 lg:hidden
            transition-all duration-300 ease-out`}
          style={{
            transform: isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: isDrawerAnimating ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        >
          <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link href={route('home')} onClick={closeDrawer} className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 bg-linear-to-br ${colors.light} rounded-lg flex items-center justify-center shadow-md shrink-0`}>
                  <FiUser className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">Staff Panel</span>
              </Link>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Drawer Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <div className="px-4 mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {primaryRole === 'admin' ? 'Administration' : 'Staff Portal'}
                </p>
              </div>
              <div className="space-y-1">
                {menuItems.map((item, index) => (
                  <div
                    key={item.name}
                    className={`transition-all duration-300 ease-out
                      ${isDrawerOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                    style={{ transitionDelay: isDrawerOpen ? `${index * 50}ms` : '0ms' }}
                  >
                    {renderMenuItem(item, true)}
                  </div>
                ))}
              </div>
            </nav>

            {/* Drawer User Info */}
            <div
              className={`p-4 border-t border-gray-200 bg-gray-50 transition-all duration-400 ease-out
                ${isDrawerOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: isDrawerOpen ? '150ms' : '0ms' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full bg-linear-to-br ${colors.light} flex items-center justify-center shadow-md shrink-0`}>
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
              <Link
                href={route('logout')}
                method="post"
                as="button"
                onClick={closeDrawer}
                className="w-full mt-3 flex items-center justify-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
              >
                <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
                <span className="font-medium">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      </>

      {/* ========== MAIN CONTENT ========== */}
      <main
        className={`min-h-screen w-full min-w-0 transition-all duration-300 px-4 py-4 sm:px-6 sm:py-6 pb-24 lg:pb-6 text-black
          ${isCollapsed ? 'lg:ml-20 lg:w-[calc(100%-5rem)]' : 'lg:ml-64 lg:w-[calc(100%-16rem)]'}`}
      >
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;