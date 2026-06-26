// resources/js/pages/Backend/CMS/Shared/Modals/NavbarEditor.jsx

import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa6';
import Swal from 'sweetalert2';

export default function NavbarEditor({
  formData,
  updateFormData,
  addArrayItem,
  removeArrayItem,
  isLoading = false,
  setIsLoading = null
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);

  // Fetch pages on mount
  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = () => {
    setLoadingPages(true);

    fetch('/data/pages.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        

        // Handle different data structures
        let pagesData = [];
        if (Array.isArray(data)) {
          pagesData = data;
        } else if (data.pages && Array.isArray(data.pages)) {
          pagesData = data.pages;
        } else if (data.data && Array.isArray(data.data)) {
          pagesData = data.data;
        }

        

        // Filter out pages with "-details" suffix
        const filteredPages = pagesData.filter(page =>
          page.slug && !page.slug.endsWith('-details')
        );

        

        setPages(filteredPages);
        setLoadingPages(false);
      })
      .catch(error => {
        console.error('Error fetching pages:', error);
        setLoadingPages(false);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Pages',
          text: 'Could not fetch pages. Please refresh and try again.',
          confirmButtonColor: '#3b82f6',
        });
      });
  };

  // Handle drag and drop for logo image
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];

      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File',
          text: 'Please drop an image file (JPEG, PNG, GIF, WebP, SVG)',
          confirmButtonColor: '#3b82f6',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Image size should be less than 5MB',
          confirmButtonColor: '#3b82f6',
        });
        return;
      }

      setUploading(true);
      if (setIsLoading) setIsLoading(true);

      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target.result;
          updateFormData('logo.src', imageUrl);
          setUploading(false);
          if (setIsLoading) setIsLoading(false);
        };
        reader.onerror = () => {
          setUploading(false);
          if (setIsLoading) setIsLoading(false);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to read the image file',
            confirmButtonColor: '#3b82f6',
          });
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error uploading image:', error);
        setUploading(false);
        if (setIsLoading) setIsLoading(false);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select an image file (JPEG, PNG, GIF, WebP, SVG)',
        confirmButtonColor: '#3b82f6',
      });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Image size should be less than 5MB',
        confirmButtonColor: '#3b82f6',
      });
      e.target.value = '';
      return;
    }

    setUploading(true);
    if (setIsLoading) setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      updateFormData('logo.src', imageUrl);
      setUploading(false);
      if (setIsLoading) setIsLoading(false);
    };
    reader.onerror = () => {
      setUploading(false);
      if (setIsLoading) setIsLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read the image file',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeLogo = () => {
    updateFormData('logo.src', '');
  };

  // Handle page selection from dropdown
  const handlePageSelect = (index, pageSlug) => {
    const selectedPage = pages.find(p => p.slug === pageSlug);
    if (selectedPage) {
      updateFormData(`navLinks.${index}.name`, selectedPage.name);
      updateFormData(`navLinks.${index}.href`, `/${selectedPage.slug}`);
    }
  };

  const isDisabled = isLoading || uploading || loadingPages;

  return (
    <div className="space-y-4 w-full">
      {/* Logo Section with Drag and Drop */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Logo Image with Drag & Drop */}
          <div className="relative">
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex items-center gap-3">
                {formData.logo?.src ? (
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={formData.logo.src}
                      alt={formData.logo?.alt || 'Logo'}
                      className="w-16 h-16 object-contain rounded border"
                    />
                    <span className="text-xs text-gray-500 truncate flex-1">
                      {typeof formData.logo.src === 'string' && formData.logo.src.startsWith('data:image')
                        ? 'New image (will be uploaded)'
                        : `${formData.logo.src.substring(0, 40)  }...`}
                    </span>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                      title="Remove logo"
                      disabled={isDisabled}
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-full text-gray-400">
                    <FaUpload size={20} />
                    <span className="text-sm">Drop logo image or click to browse</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isDisabled}
                />
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              )}
            </div>
          </div>

          {/* Logo Alt Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo Alt Text</label>
            <input
              type="text"
              value={formData.logo?.alt || ''}
              onChange={(e) => updateFormData('logo.alt', e.target.value)}
              placeholder="Logo alt text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* Navigation Links with Page Dropdown */}
      <h3 className="font-semibold text-lg pt-4">Navigation Links</h3>
      <p className="text-xs text-gray-500 mb-2">Select pages from dropdown or enter custom links</p>

      {(formData.navLinks || []).map((link, index) => (
        <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg w-full flex-wrap">
          {/* Page Dropdown */}
          <div className="flex-1 min-w-37.5">
            <select
              value={link.href ? link.href.replace('/', '') : ''}
              onChange={(e) => handlePageSelect(index, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={isDisabled}
            >
              <option value="">-- Select Page --</option>
              {loadingPages ? (
                <option value="" disabled>Loading pages...</option>
              ) : pages.length === 0 ? (
                <option value="" disabled>No pages available</option>
              ) : (
                pages.map((page) => (
                  <option key={page.id} value={page.slug}>
                    {page.name} ({page.slug})
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
            placeholder="Link Name"
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
            onClick={() => removeArrayItem('navLinks', index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
            disabled={isDisabled}
          >
            <FaTrash size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => addArrayItem('navLinks', { name: '', href: '/' })}
        className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        disabled={isDisabled}
      >
        <FaPlus size={14} /> Add Nav Link
      </button>

      {/* CTA Button */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700">CTA Button Text</label>
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
          <label className="block text-sm font-medium text-gray-700">CTA Button URL</label>
          <input
            type="text"
            value={formData.button?.href || ''}
            onChange={(e) => updateFormData('button.href', e.target.value)}
            placeholder="Button URL"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />
        </div>
      </div>
    </div>
  );
}