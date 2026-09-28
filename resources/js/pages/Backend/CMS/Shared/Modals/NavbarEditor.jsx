// resources/js/pages/Backend/CMS/Shared/Modals/NavbarEditor.jsx

// React
import { useState, useEffect, useCallback, useRef } from 'react';

// Icons
import { FaPlus, FaTrash, FaUpload, FaSpinner, FaLink, FaImage, FaChevronDown, FaChevronRight, FaSitemap } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';

// Sweetalert
import Swal from 'sweetalert2';

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
const getLinkChildren = (link, index, depth, legacyDropdowns) => {
  const children = link?.children;
  if (Array.isArray(children) && children.length > 0) return children;

  if (Array.isArray(link?.dropdown) && link.dropdown.length > 0) return link.dropdown;

  const legacy = Array.isArray(legacyDropdowns) ? legacyDropdowns[index] : null;
  if (depth === 0 && Array.isArray(legacy) && legacy.length > 0) return legacy;

  return [];
};

/**
 * Dotted form path where a link's sub-menu items must be written.
 * Existing legacy `dropdowns[index]` containers keep being used so no stored
 * data is lost; every new container is `link.children`.
 */
const getChildrenPath = (link, linkPath, index, depth, legacyDropdowns) => {
  if (depth === 0) {
    const children = link?.children;
    if (Array.isArray(children) && children.length > 0) return `${linkPath}.children`;
    if (Array.isArray(link?.dropdown) && link.dropdown.length > 0) return `${linkPath}.dropdown`;

    const legacy = Array.isArray(legacyDropdowns) ? legacyDropdowns[index] : null;
    if (Array.isArray(legacy) && legacy.length > 0) return `dropdowns.${index}`;
  }

  return `${linkPath}.children`;
};

/** Count every nested sub-item (at any depth). */
const countAllSubLinks = (links, legacyDropdowns = []) => {
  if (!Array.isArray(links)) return 0;

  return links.reduce((total, link, index) => {
    const children = getLinkChildren(link, index, 0, legacyDropdowns);
    return total + children.length + countAllSubLinks(children);
  }, 0);
};

/** True when any link (at any depth) is missing its name or URL. */
const linksHaveEmptyFields = (links, legacyDropdowns = []) => {
  if (!Array.isArray(links)) return false;

  return links.some((link, index) => {
    const name = typeof link?.name === 'string' ? link.name.trim() : '';
    const href = typeof link?.href === 'string' ? link.href.trim() : '';

    if (name === '' || href === '') return true;

    return linksHaveEmptyFields(getLinkChildren(link, index, 0, legacyDropdowns));
  });
};

// ============================================
// RECURSIVE NAV LINK ROW (sub-menus at any depth)
// ============================================
const NavLinkEditor = ({
  link,
  index,
  parentPath,
  depth = 0,
  isDisabled,
  pages,
  loadingPages,
  pageError,
  legacyDropdowns,
  onUpdateField,
  onPageSelect,
  onAddChild,
  onRemove,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const linkPath = `${parentPath}.${index}`;
  const children = getLinkChildren(link, index, depth, legacyDropdowns);
  const childrenPath = getChildrenPath(link, linkPath, index, depth, legacyDropdowns);

  const isHome = depth === 0 && link?.href === '/';
  const pageSlug = link?.href ? (link.href === '/' ? 'home' : link.href.replace(/^\//, '')) : '';
  const inputClass = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition outline-none text-sm ${
    isHome ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
  }`;

  return (
    <div className={depth === 0 ? '' : 'mt-1.5'}>
      <div
        className={`rounded-lg p-3 border transition ${
          depth === 0
            ? isHome
              ? 'bg-white shadow-sm border-blue-300 hover:border-blue-400'
              : 'bg-white shadow-sm border-gray-200 hover:border-green-300'
            : 'bg-white/90 border-gray-200 hover:border-green-300'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {depth > 0 && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Sub {depth}
            </span>
          )}

          {/* Page Dropdown */}
          <div className="min-w-40 flex-1">
            <select
              value={pageSlug}
              onChange={(e) => onPageSelect(linkPath, e.target.value)}
              className={inputClass}
              disabled={isDisabled}
            >
              <option value="">-- Select Page --</option>
              {loadingPages && <option value="" disabled>Loading pages...</option>}
              {pageError && <option value="" disabled>Could not load pages</option>}
              {!loadingPages && !pageError && pages.length === 0 && (
                <option value="" disabled>No pages available</option>
              )}
              {!loadingPages && !pageError && pages.map((page) => (
                <option key={page.id || page.slug} value={page.slug}>
                  {page.slug === 'home' ? 'Home' : `Page: ${page.name || page.title || page.slug}`}
                </option>
              ))}
            </select>
          </div>

          {/* Link Name */}
          <div className="flex-1 min-w-30">
            <input
              type="text"
              value={link?.name || ''}
              onChange={(e) => onUpdateField(`${linkPath}.name`, e.target.value)}
              placeholder="Link Name (e.g., About Us)"
              className={inputClass}
              disabled={isDisabled}
            />
          </div>

          {/* URL */}
          <div className="flex-1 min-w-30">
            <input
              type="text"
              value={link?.href || ''}
              onChange={(e) => onUpdateField(`${linkPath}.href`, e.target.value)}
              placeholder="URL (e.g., /about)"
              className={inputClass}
              disabled={isDisabled}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            {children.length > 0 && (
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition"
                title={collapsed ? 'Show sub-items' : 'Hide sub-items'}
              >
                {collapsed ? <FaChevronRight size={13} /> : <FaChevronDown size={13} />}
              </button>
            )}

            {link?.name && link?.href && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isHome ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-green-100 text-green-700'
                }`}
              >
                {isHome ? 'Home' : 'Active'}
              </span>
            )}

            <button
              type="button"
              onClick={() => onAddChild(childrenPath)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 transition"
              disabled={isDisabled}
              title="Add a sub-menu item inside this link"
            >
              <FaPlus size={11} />
              Sub-item
            </button>

            <button
              type="button"
              onClick={() => onRemove(parentPath, index, link, depth)}
              className={`p-2 rounded-lg transition ${
                isHome
                  ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50'
                  : 'text-red-400 hover:text-red-600 hover:bg-red-50'
              }`}
              disabled={isDisabled || isHome}
              title={isHome ? 'Home page cannot be removed' : 'Remove link'}
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>
        {children.length > 0 && (
          <p className="mt-2 text-[11px] text-green-600 flex items-center gap-1">
            <FaSitemap size={11} />
            {children.length} sub-item{children.length > 1 ? 's' : ''} inside this menu
            {collapsed ? ' (hidden)' : ''}
          </p>
        )}
      </div>
      {/* Nested sub-items */}
      {children.length > 0 && !collapsed && (
        <div className="ml-3 sm:ml-6 mt-1 pl-3 border-l-2 border-green-200 space-y-1">
          {children.map((child, childIndex) => (
            <NavLinkEditor
              key={child?._tempId || `${linkPath}-${childIndex}`}
              link={child}
              index={childIndex}
              parentPath={childrenPath}
              depth={depth + 1}
              isDisabled={isDisabled}
              pages={pages}
              loadingPages={loadingPages}
              pageError={pageError}
              legacyDropdowns={legacyDropdowns}
              onUpdateField={onUpdateField}
              onPageSelect={onPageSelect}
              onAddChild={onAddChild}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function NavbarEditor({
  formData,
  updateFormData,
  addArrayItem,
  removeArrayItem,
  isLoading = false,
  setIsLoading = null
}) {
  // ============================================
  // STATE
  // ============================================
  const [pages, setPages] = useState([]);
  const [pageError, setPageError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const fileInputRef = useRef(null);

  // ============================================
  // FETCH PAGES
  // ============================================
  const fetchPages = useCallback(async () => {
    setLoadingPages(true);
    setPageError(null);

    try {
      const response = await fetch('/data/pages.json');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      let pagesData = [];
      if (Array.isArray(data)) {
        pagesData = data;
      } else if (data.data && Array.isArray(data.data)) {
        pagesData = data.data;
      } else if (data.pages && Array.isArray(data.pages)) {
        pagesData = data.pages;
      } else if (data.items && Array.isArray(data.items)) {
        pagesData = data.items;
      }

      // Filter out pages with "-details" suffix
      const filteredPages = pagesData.filter(page =>
        page.slug && !page.slug.endsWith('-details')
      );

      setPages(filteredPages);
    } catch (error) {
      console.error('Error fetching pages:', error);
      setPageError(error.message);
    } finally {
      setLoadingPages(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // ============================================
  // LOGO UPLOAD HANDLERS
  // ============================================

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please upload an image file (JPEG, PNG, GIF, WebP, SVG)'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('Image size should be less than 5MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = () => reject(new Error('Failed to read the image file'));
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (!files || !files[0]) return;
    await uploadImage(files[0]);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
    e.target.value = '';
  };

  const uploadImage = async (file) => {
    setUploading(true);
    if (setIsLoading) setIsLoading(true);

    try {
      const imageUrl = await processImageFile(file);
      updateFormData('logo.src', imageUrl);

      Swal.fire({
        icon: 'success',
        title: 'Uploaded!',
        text: 'Logo image uploaded successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message || 'Could not upload image. Please try again.',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setUploading(false);
      if (setIsLoading) setIsLoading(false);
    }
  };

  const removeLogo = () => {
    Swal.fire({
      title: 'Remove Logo?',
      text: 'This will remove the logo from the navbar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it',
    }).then((result) => {
      if (result.isConfirmed) {
        updateFormData('logo.src', '');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  // ============================================
  // PAGE SELECTION
  // ============================================

  const handlePageSelect = (linkPath, pageSlug) => {
    const selectedPage = pages.find(p => p.slug === pageSlug);
    if (selectedPage) {
      updateFormData(`${linkPath}.name`, selectedPage.name || selectedPage.title || selectedPage.slug);

      // Home page should be "/", not "/home"
      const href = pageSlug === 'home' ? '/' : `/${pageSlug}`;
      updateFormData(`${linkPath}.href`, href);
    }
  };

  // ============================================
  // VALIDATION
  // ============================================

  const hasDuplicateLinks = () => {
    const hrefs = (formData.navLinks || [])
      .map(link => link.href)
      .filter(href => href && href.trim() !== '');
    return new Set(hrefs).size !== hrefs.length;
  };

  const hasEmptyLinks = () => {
    // Validates every level of the menu tree (sub-items included).
    return linksHaveEmptyFields(formData.navLinks || [], formData.dropdowns || []);
  };

  // Check if home link exists
  const hasHomeLink = () => {
    return (formData.navLinks || []).some(link => link.href === '/');
  };

  // Count total links (top level + every nested sub-item)
  const totalLinks = (formData.navLinks || []).length;
  const totalSubLinks = countAllSubLinks(formData.navLinks || [], formData.dropdowns || []);

  // ============================================
  // COMPUTED
  // ============================================

  const isDisabled = isLoading || uploading || loadingPages;
  const showDuplicateWarning = hasDuplicateLinks();
  const showEmptyWarning = hasEmptyLinks();
  const hasLogo = formData.logo?.src && formData.logo.src.trim().length > 0;
  const hasHome = hasHomeLink();

  // ============================================
  // HANDLE REMOVE WITH HOME PROTECTION
  // ============================================

  const handleRemoveLink = (arrayPath, index, link, depth = 0) => {
    // Sub-menu items can always be removed
    if (depth > 0) {
      removeArrayItem(arrayPath, index);
      return;
    }

    // Check if this is the home link
    if (link.href === '/') {
      Swal.fire({
        title: 'Cannot Remove Home Page',
        text: 'The home page link is required for the navigation menu.',
        icon: 'warning',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Got it',
      });
      return;
    }

    // Check if this is the last link and there's no home link
    if (totalLinks <= 1 && !hasHome) {
      Swal.fire({
        title: 'Cannot Remove Last Link',
        text: 'You must have at least one navigation link. Please add another link first.',
        icon: 'warning',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Got it',
      });
      return;
    }

    Swal.fire({
      title: 'Remove Link?',
      html: `Remove "<strong>${link.name || 'this link'}</strong>" from navigation?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        removeArrayItem(arrayPath, index);
      }
    });
  };

  // ============================================
  // ADD SUB-MENU ITEM (works at any depth)
  // ============================================
  const handleAddChild = (childrenPath) => {
    addArrayItem(childrenPath, { name: '', href: '' });
  };

  return (
    <div className="space-y-8 w-full">

      {/* ============================================
          LOGO SECTION
          ============================================ */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaImage className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Logo</h3>
            <p className="text-xs text-gray-500">Upload your brand logo for the navbar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Logo Upload */}
          <div className="relative">
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                } ${uploading ? 'opacity-50' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex items-center gap-3 min-h-16">
                {hasLogo ? (
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={formData.logo.src}
                      alt={formData.logo?.alt || 'Logo preview'}
                      className="w-16 h-16 object-contain rounded border"
                      onError={(e) => {
                        e.target.src = '/images/placeholder-logo.png';
                      }}
                    />
                    <span className="text-xs text-gray-500 truncate flex-1">
                      Logo uploaded
                    </span>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                      title="Remove logo"
                      disabled={isDisabled}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-full text-gray-400 py-2">
                    <FaUpload size={20} className="shrink-0" />
                    <span className="text-sm">Drop logo or click to browse</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isDisabled}
                />
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaSpinner className="animate-spin text-blue-600" size={24} />
                    <span className="text-sm text-gray-600">Uploading...</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Max 5MB. Supported: JPG, PNG, GIF, WebP, SVG
            </p>
          </div>

          {/* Logo Alt Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Alt Text
              <span className="text-xs text-gray-400 ml-2">(for accessibility)</span>
            </label>
            <input
              type="text"
              value={formData.logo?.alt || ''}
              onChange={(e) => updateFormData('logo.alt', e.target.value)}
              placeholder="e.g., Company Logo"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Describes the logo for screen readers and SEO
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          NAVIGATION LINKS SECTION
          ============================================ */}
      <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaLink className="text-green-600 text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Navigation Links</h3>
              <p className="text-xs text-gray-500">
                {totalLinks} links • {totalSubLinks} sub-item{totalSubLinks === 1 ? '' : 's'} • {hasHome ? '🏠 Home page is set' : '⚠️ No home page set'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => addArrayItem('navLinks', { name: '', href: '/' })}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
            disabled={isDisabled}
          >
            <FaPlus size={14} />
            Add Link
          </button>
        </div>

        {/* Warning Messages */}
        {showDuplicateWarning && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
            <span>⚠️</span>
            Duplicate links detected. Please ensure each link has a unique URL.
          </div>
        )}
        {showEmptyWarning && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 flex items-center gap-2">
            <span>⚠️</span>
            Some links have empty name or URL fields. Please fill them in.
          </div>
        )}

        {(!formData.navLinks || formData.navLinks.length === 0) ? (
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
            <FaLink className="text-gray-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No navigation links added yet</p>
            <p className="text-xs text-gray-400">Click "Add Link" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.navLinks.map((link, index) => (
              <NavLinkEditor
                key={link?._tempId || `nav-${index}`}
                link={link}
                index={index}
                parentPath="navLinks"
                depth={0}
                isDisabled={isDisabled}
                pages={pages}
                loadingPages={loadingPages}
                pageError={pageError}
                legacyDropdowns={formData.dropdowns || []}
                onUpdateField={updateFormData}
                onPageSelect={handlePageSelect}
                onAddChild={handleAddChild}
                onRemove={handleRemoveLink}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 space-y-1">
          <span className="block">
            💡 Links are shown in the order they appear here. Select <strong>🏠 Home</strong> from the dropdown to set the home page to <strong>/</strong>.
          </span>
          <span className="block text-green-600">
            🧩 Click <strong>Sub-item</strong> on any link to nest a sub-menu inside it. Sub-menus can be nested as deep as you need.
          </span>
          <span className="block text-blue-600">🔒 Home page cannot be removed.</span>
        </p>
      </div>

      {/* ============================================
          CTA BUTTON SECTION
          ============================================ */}
      <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <FiExternalLink className="text-orange-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Call-to-Action Button</h3>
            <p className="text-xs text-gray-500">The prominent button on the right side of the navbar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button Text
              <span className="text-xs text-gray-400 ml-2">(e.g., "Donate Now")</span>
            </label>
            <input
              type="text"
              value={formData.button?.text || ''}
              onChange={(e) => updateFormData('button.text', e.target.value)}
              placeholder="Button text"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button URL
              <span className="text-xs text-gray-400 ml-2">(where it leads)</span>
            </label>
            <input
              type="text"
              value={formData.button?.href || ''}
              onChange={(e) => updateFormData('button.href', e.target.value)}
              placeholder="/donate"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}