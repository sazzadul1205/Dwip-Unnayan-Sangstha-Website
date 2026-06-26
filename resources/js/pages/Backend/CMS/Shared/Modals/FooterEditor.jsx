// resources/js/pages/Backend/CMS/Shared/Modals/FooterEditor.jsx

import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa6';
import Swal from 'sweetalert2';

export default function FooterEditor({
  formData,
  updateFormData,
  addArrayItem,
  removeArrayItem,
  isLoading = false,
  setIsLoading = null
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Fetch navigation items on mount
  useEffect(() => {
    fetchNavItems();
  }, []);

  const fetchNavItems = () => {
    setLoadingItems(true);

    fetch('/data/navigation.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        
        setNavItems(data.items || []);
        setLoadingItems(false);
      })
      .catch(error => {
        console.error('Error fetching navigation items:', error);
        setLoadingItems(false);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Navigation Items',
          text: 'Could not fetch pages and programs. Please refresh and try again.',
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

  // Handle item selection for Quick Links
  const handleQuickLinkSelect = (index, itemSlug) => {
    const selectedItem = navItems.find(item => item.slug === itemSlug);
    if (selectedItem) {
      updateFormData(`quickLinks.${index}.name`, selectedItem.name);
      updateFormData(`quickLinks.${index}.url`, selectedItem.url);
    }
  };

  // Handle item selection for Programs
  const handleProgramSelect = (index, itemSlug) => {
    const selectedItem = navItems.find(item => item.slug === itemSlug);
    if (selectedItem) {
      updateFormData(`programs.${index}.name`, selectedItem.name);
      updateFormData(`programs.${index}.url`, selectedItem.url);
    }
  };

  // Handle contact number operations
  const addContactNumber = () => {
    const currentNumbers = formData.contact?.numbers || [];
    updateFormData('contact.numbers', [...currentNumbers, '']);
  };

  const removeContactNumber = (index) => {
    const currentNumbers = formData.contact?.numbers || [];
    const newNumbers = currentNumbers.filter((_, i) => i !== index);
    updateFormData('contact.numbers', newNumbers);
  };

  const updateContactNumber = (index, value) => {
    const currentNumbers = formData.contact?.numbers || [];
    const newNumbers = [...currentNumbers];
    newNumbers[index] = value;
    updateFormData('contact.numbers', newNumbers);
  };

  const isDisabled = isLoading || uploading || loadingItems;

  // Group items by type for dropdown - FIXED: Use unique keys
  const getDropdownItems = () => {
    const items = [];

    const pages = navItems.filter(item => item.type === 'page');
    const programs = navItems.filter(item => item.type === 'program');

    if (pages.length > 0) {
      items.push({ type: 'header', label: '📄 Pages', key: 'header-pages' });
      pages.forEach(page => {
        items.push({ ...page, key: `page-${page.id}` });
      });
    }

    if (programs.length > 0) {
      items.push({ type: 'header', label: '📁 Programs', key: 'header-programs' });
      programs.forEach(program => {
        items.push({ ...program, key: `program-${program.id}` });
      });
    }

    return items;
  };

  const dropdownItems = getDropdownItems();

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
                      alt={formData.logo?.alt || 'Footer Logo'}
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

      <div>
        <label className="block text-sm font-medium text-gray-700">Footer Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateFormData('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isDisabled}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700">Address Title</label>
          <input
            type="text"
            value={formData.address?.title || ''}
            onChange={(e) => updateFormData('address.title', e.target.value)}
            placeholder="e.g., Address"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address Details</label>
          <input
            type="text"
            value={formData.address?.details || ''}
            onChange={(e) => updateFormData('address.details', e.target.value)}
            placeholder="Full address"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />
        </div>
      </div>

      {/* Contact Section with Individual Number Fields */}
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Title</label>
            <input
              type="text"
              value={formData.contact?.title || ''}
              onChange={(e) => updateFormData('contact.title', e.target.value)}
              placeholder="e.g., Call, Contact, Phone"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Numbers</label>
            <div className="space-y-2">
              {(formData.contact?.numbers || []).map((number, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={number || ''}
                    onChange={(e) => updateContactNumber(index, e.target.value)}
                    placeholder="Enter phone number"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isDisabled}
                  />
                  <button
                    type="button"
                    onClick={() => removeContactNumber(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                    disabled={isDisabled || (formData.contact?.numbers || []).length <= 1}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addContactNumber}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm"
                disabled={isDisabled}
              >
                <FaPlus size={14} /> Add Phone Number
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links with Dropdown */}
      <h3 className="font-semibold text-lg pt-4">Quick Links</h3>
      <p className="text-xs text-gray-500 mb-2">Select pages/programs from dropdown or enter custom links</p>

      {(formData.quickLinks || []).map((link, index) => (
        <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg w-full flex-wrap">
          {/* Dropdown for Quick Links */}
          <div className="flex-1 min-w-37.5">
            <select
              value={link.url ? link.url.replace(/^\//, '').split('/').pop() : ''}
              onChange={(e) => handleQuickLinkSelect(index, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={isDisabled}
            >
              <option value="">-- Select Page or Program --</option>
              {loadingItems ? (
                <option value="" disabled>Loading items...</option>
              ) : dropdownItems.length === 0 ? (
                <option value="" disabled>No items available</option>
              ) : (
                dropdownItems.map((item) => {
                  if (item.type === 'header') {
                    return (
                      <option key={item.key} value="" disabled className="font-bold text-gray-700 bg-gray-100">
                        {item.label}
                      </option>
                    );
                  }
                  return (
                    <option key={item.key} value={item.slug}>
                      {item.name}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Link Name */}
          <input
            type="text"
            value={link.name || ''}
            onChange={(e) => updateFormData(`quickLinks.${index}.name`, e.target.value)}
            placeholder="Link Name"
            className="flex-1 min-w-30 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />

          {/* URL */}
          <input
            type="text"
            value={link.url || ''}
            onChange={(e) => updateFormData(`quickLinks.${index}.url`, e.target.value)}
            placeholder="URL"
            className="flex-1 min-w-30 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />

          <button
            type="button"
            onClick={() => removeArrayItem('quickLinks', index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
            disabled={isDisabled}
          >
            <FaTrash size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => addArrayItem('quickLinks', { name: '', url: '/' })}
        className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        disabled={isDisabled}
      >
        <FaPlus size={14} /> Add Quick Link
      </button>

      {/* Programs with Dropdown */}
      <h3 className="font-semibold text-lg pt-4">Programs</h3>
      <p className="text-xs text-gray-500 mb-2">Select programs from dropdown or enter custom links</p>

      {(formData.programs || []).map((program, index) => (
        <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg w-full flex-wrap">
          {/* Dropdown for Programs */}
          <div className="flex-1 min-w-37.5">
            <select
              value={program.url ? program.url.replace(/^\//, '').split('/').pop() : ''}
              onChange={(e) => handleProgramSelect(index, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={isDisabled}
            >
              <option value="">-- Select Program --</option>
              {loadingItems ? (
                <option value="" disabled>Loading items...</option>
              ) : dropdownItems.length === 0 ? (
                <option value="" disabled>No items available</option>
              ) : (
                dropdownItems.map((item) => {
                  if (item.type === 'header') {
                    return (
                      <option key={item.key} value="" disabled className="font-bold text-gray-700 bg-gray-100">
                        {item.label}
                      </option>
                    );
                  }
                  return (
                    <option key={item.key} value={item.slug}>
                      {item.name}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Program Name */}
          <input
            type="text"
            value={program.name || ''}
            onChange={(e) => updateFormData(`programs.${index}.name`, e.target.value)}
            placeholder="Program Name"
            className="flex-1 min-w-30 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />

          {/* URL */}
          <input
            type="text"
            value={program.url || ''}
            onChange={(e) => updateFormData(`programs.${index}.url`, e.target.value)}
            placeholder="URL"
            className="flex-1 min-w-30 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />

          <button
            type="button"
            onClick={() => removeArrayItem('programs', index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
            disabled={isDisabled}
          >
            <FaTrash size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => addArrayItem('programs', { name: '', url: '/' })}
        className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        disabled={isDisabled}
      >
        <FaPlus size={14} /> Add Program
      </button>

      {/* Newsletter */}
      <h3 className="font-semibold text-lg pt-4">Newsletter</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700">Newsletter Title</label>
          <input
            type="text"
            value={formData.newsletter?.title || ''}
            onChange={(e) => updateFormData('newsletter.title', e.target.value)}
            placeholder="Subscribe to Our Newsletter"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Button Text</label>
          <input
            type="text"
            value={formData.newsletter?.buttonText || ''}
            onChange={(e) => updateFormData('newsletter.buttonText', e.target.value)}
            placeholder="Subscribe"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isDisabled}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Placeholder</label>
        <input
          type="text"
          value={formData.newsletter?.placeholder || ''}
          onChange={(e) => updateFormData('newsletter.placeholder', e.target.value)}
          placeholder="Enter your email address"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isDisabled}
        />
      </div>

      {/* Bottom Footer */}
      <h3 className="font-semibold text-lg pt-4">Bottom Footer</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">Copyright Text</label>
        <input
          type="text"
          value={formData.bottomFooter?.copyright || ''}
          onChange={(e) => updateFormData('bottomFooter.copyright', e.target.value)}
          placeholder="© 2024 Your Organization. All rights reserved."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isDisabled}
        />
      </div>
    </div>
  );
}