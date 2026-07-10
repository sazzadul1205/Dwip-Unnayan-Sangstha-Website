// resources/js/pages/Backend/CMS/Shared/Modals/NavbarEditor.jsx

// React
import { useState, useEffect, useCallback, useRef } from 'react';

// Icons
import { FaTimes } from 'react-icons/fa';
import { FaPlus, FaTrash, FaUpload, FaSpinner } from 'react-icons/fa6';

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
  const [setLogoPreview] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);

  // Drag and drop
  const fileInputRef = useRef(null);

  // ============================================
  // FETCH PAGES with error handling
  // ============================================
  const fetchPages = useCallback(async () => {
    setLoadingPages(true);
    setPageError(null);

    try {
      // Use the correct route from web.php
      const response = await fetch('/data/pages.json');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle different data structures
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

      // User-friendly error message
      Swal.fire({
        icon: 'warning',
        title: 'Could Not Load Pages',
        text: 'You can still add custom links manually. Pages will load on refresh.',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoadingPages(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // ============================================
  // DRAG AND DROP HANDLERS
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please upload an image file (JPEG, PNG, GIF, WebP, SVG)'));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('Image size should be less than 5MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read the image file'));
      };
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
    e.target.value = ''; // Reset input
  };

  const uploadImage = async (file) => {
    setUploading(true);
    if (setIsLoading) setIsLoading(true);

    try {
      const imageUrl = await processImageFile(file);
      updateFormData('logo.src', imageUrl);
      setLogoPreview(imageUrl);

      // Success feedback
      Swal.fire({
        icon: 'success',
        title: 'Image Uploaded',
        text: 'Logo image uploaded successfully!',
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
      text: 'This action will remove the logo from the navbar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it',
    }).then((result) => {
      if (result.isConfirmed) {
        updateFormData('logo.src', '');
        setLogoPreview(null);
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
      updateFormData(`navLinks.${index}.href`, `/${selectedPage.slug}`);
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

  // ============================================
  // COMPUTED
  // ============================================
  const isDisabled = isLoading || uploading || loadingPages;
  const showDuplicateWarning = hasDuplicateLinks();
  const showEmptyWarning = hasEmptyLinks();

  return (
    <div className="space-y-4 w-full">
      {/* ============================================
          LOGO SECTION
          ============================================ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo
          <span className="text-xs text-gray-400 ml-2">(Recommended: PNG with transparent background)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Logo Image with Drag & Drop */}
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
                {formData.logo?.src ? (
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
                      {typeof formData.logo.src === 'string' && formData.logo.src.startsWith('data:image')
                        ? '📷 New image (will be saved)'
                        : formData.logo.src.length > 50
                          ? `📁 ${formData.logo.src.substring(0, 40)}...`
                          : `📁 ${formData.logo.src}`}
                    </span>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                      title="Remove logo"
                      disabled={isDisabled}
                    >
                      <FaTimes size={14} />
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
            <p className="text-xs text-gray-400 mt-1">
              Drag & drop or click to upload. Max 5MB. Supported: JPG, PNG, GIF, WebP, SVG
            </p>
          </div>

          {/* Logo Alt Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Logo Alt Text
              <span className="text-xs text-gray-400 ml-2">(for accessibility)</span>
            </label>
            <input
              type="text"
              value={formData.logo?.alt || ''}
              onChange={(e) => updateFormData('logo.alt', e.target.value)}
              placeholder="e.g., Company Logo"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1">
              Describes the logo for screen readers and SEO
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          NAVIGATION LINKS
          ============================================ */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Navigation Links</h3>
          <span className="text-xs text-gray-400">
            {(formData.navLinks || []).length} links
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Select existing pages from the dropdown, or enter custom links manually.
        </p>

        {/* Warning Messages */}
        {showDuplicateWarning && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            ⚠️ Duplicate links detected. Please ensure each link has a unique URL.
          </div>
        )}
        {showEmptyWarning && (
          <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
            ⚠️ Some links have empty name or URL fields. Please fill them in.
          </div>
        )}

        {(formData.navLinks || []).map((link, index) => (
          <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg w-full flex-wrap mb-2">
            {/* Page Dropdown */}
            <div className="flex-1 min-w-37.5">
              <select
                value={link.href ? link.href.replace(/^\//, '') : ''}
                onChange={(e) => handlePageSelect(index, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                      📄 {page.name || page.title || page.slug}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Link Name */}
            <input
              type="text"
              value={link.name || ''}
              onChange={(e) => updateFormData(`navLinks.${index}.name`, e.target.value)}
              placeholder="Link Name (e.g., About Us)"
              className="flex-1 min-w-30 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />

            {/* URL */}
            <input
              type="text"
              value={link.href || ''}
              onChange={(e) => updateFormData(`navLinks.${index}.href`, e.target.value)}
              placeholder="URL (e.g., /about)"
              className="flex-1 min-w-30 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />

            <button
              type="button"
              onClick={() => {
                Swal.fire({
                  title: 'Remove Link?',
                  text: `Remove "${link.name || 'this link'}" from navigation?`,
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#ef4444',
                  cancelButtonColor: '#6b7280',
                  confirmButtonText: 'Yes, remove',
                }).then((result) => {
                  if (result.isConfirmed) {
                    removeArrayItem('navLinks', index);
                  }
                });
              }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
              disabled={isDisabled}
            >
              <FaTrash size={14} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            addArrayItem('navLinks', { name: '', href: '/' });
          }}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium transition"
          disabled={isDisabled}
        >
          <FaPlus size={14} /> Add Navigation Link
        </button>

        <p className="text-xs text-gray-400 mt-1">
          💡 Tip: Links are shown in the order they appear here
        </p>
      </div>

      {/* ============================================
          CTA BUTTON
          ============================================ */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-lg mb-2">Call-to-Action Button</h3>
        <p className="text-xs text-gray-500 mb-3">
          The prominent button that appears on the right side of the navbar.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Button Text
              <span className="text-xs text-gray-400 ml-2">(e.g., "Donate Now")</span>
            </label>
            <input
              type="text"
              value={formData.button?.text || ''}
              onChange={(e) => updateFormData('button.text', e.target.value)}
              placeholder="Button text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Button URL
              <span className="text-xs text-gray-400 ml-2">(where it leads)</span>
            </label>
            <input
              type="text"
              value={formData.button?.href || ''}
              onChange={(e) => updateFormData('button.href', e.target.value)}
              placeholder="Button URL (e.g., /donate)"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          💡 Leave empty to hide the button
        </p>
      </div>
    </div>
  );
}