// resources/js/pages/Backend/CMS/Shared/Modals/NavbarEditor.jsx

// React
import { useState, useEffect, useCallback, useRef } from 'react';

// Icons
import { FaPlus, FaTrash, FaUpload, FaSpinner, FaLink, FaImage } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';

// Sweetalert
import Swal from 'sweetalert2';

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

  const handlePageSelect = (index, pageSlug) => {
    const selectedPage = pages.find(p => p.slug === pageSlug);
    if (selectedPage) {
      updateFormData(`navLinks.${index}.name`, selectedPage.name || selectedPage.title || selectedPage.slug);

      // Home page should be "/", not "/home"
      const href = pageSlug === 'home' ? '/' : `/${pageSlug}`;
      updateFormData(`navLinks.${index}.href`, href);
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
    return (formData.navLinks || []).some(link =>
      (!link.name || link.name.trim() === '') ||
      (!link.href || link.href.trim() === '')
    );
  };

  // Check if home link exists
  const hasHomeLink = () => {
    return (formData.navLinks || []).some(link => link.href === '/');
  };

  // Count total links
  const totalLinks = (formData.navLinks || []).length;

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

  const handleRemoveLink = (index, link) => {
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
        removeArrayItem('navLinks', index);
      }
    });
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
                {totalLinks} links • {hasHome ? '🏠 Home page is set' : '⚠️ No home page set'}
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
            {formData.navLinks.map((link, index) => {
              const isHome = link.href === '/';
              const pageSlug = isHome ? 'home' : (link.href ? link.href.replace(/^\//, '') : '');

              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-4 shadow-sm border transition ${isHome ? 'border-blue-300 hover:border-blue-400' : 'border-gray-200 hover:border-green-300'
                    }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Page Dropdown */}
                    <div className="min-w-45 flex-1">
                      <select
                        value={pageSlug}
                        onChange={(e) => handlePageSelect(index, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition outline-none bg-white text-sm ${isHome ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                          }`}
                        disabled={isDisabled}
                      >
                        <option value="">-- Select Page --</option>
                        {loadingPages ? (
                          <option value="" disabled>⏳ Loading pages...</option>
                        ) : pageError ? (
                          <option value="" disabled>⚠️ Could not load pages</option>
                        ) : pages.length === 0 ? (
                          <option value="" disabled>No pages available</option>
                        ) : (
                          pages.map((page) => (
                            <option key={page.id || page.slug} value={page.slug}>
                              {page.slug === 'home' ? '🏠 Home' : `📄 ${page.name || page.title || page.slug}`}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Link Name */}
                    <div className="flex-1 min-w-30">
                      <input
                        type="text"
                        value={link.name || ''}
                        onChange={(e) => updateFormData(`navLinks.${index}.name`, e.target.value)}
                        placeholder="Link Name (e.g., About Us)"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition outline-none text-sm ${isHome ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                          }`}
                        disabled={isDisabled}
                      />
                    </div>

                    {/* URL */}
                    <div className="flex-1 min-w-30">
                      <input
                        type="text"
                        value={link.href || ''}
                        onChange={(e) => updateFormData(`navLinks.${index}.href`, e.target.value)}
                        placeholder="URL (e.g., /about)"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition outline-none text-sm ${isHome ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                          }`}
                        disabled={isDisabled}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 ml-auto">
                      {link.name && link.href && (
                        <span className={`text-xs px-2 py-1 rounded-full ${isHome ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-green-100 text-green-700'
                          }`}>
                          {isHome ? '🏠 Home' : '✅ Active'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(index, link)}
                        className={`p-2 rounded-lg transition ${isHome
                          ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50'
                          : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        disabled={isDisabled || isHome}
                        title={isHome ? 'Home page cannot be removed' : 'Remove link'}
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <span>💡</span>
          Links are shown in the order they appear here. Select <strong>🏠 Home</strong> from the dropdown to set the home page to <strong>/</strong>.
          <br />
          <span className="text-blue-600">🔒 Home page cannot be removed.</span>
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