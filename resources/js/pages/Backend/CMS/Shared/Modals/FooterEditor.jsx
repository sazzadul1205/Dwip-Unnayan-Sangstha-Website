// resources/js/pages/Backend/CMS/Shared/Modals/FooterEditor.jsx

// React
import { useState, useEffect, useCallback, useRef } from 'react';

// Sweetalert
import Swal from 'sweetalert2';

// Icons
import { FaTimes } from 'react-icons/fa';
import { FaPlus, FaTrash, FaUpload, FaSpinner } from 'react-icons/fa6';

// ============================================
// CONSTANTS
// ============================================
const SOCIAL_ICON_OPTIONS = [
  { value: 'FaFacebook', label: 'Facebook' },
  { value: 'FaInstagram', label: 'Instagram' },
  { value: 'FaLinkedin', label: 'LinkedIn' },
  { value: 'FaXTwitter', label: 'X (Twitter)' },
  { value: 'FaYoutube', label: 'YouTube' },
  { value: 'FaTiktok', label: 'TikTok' },
  { value: 'FaPinterest', label: 'Pinterest' },
  { value: 'FaWhatsapp', label: 'WhatsApp' },
  { value: 'FaTelegram', label: 'Telegram' },
];

const HOVER_COLOR_OPTIONS = [
  { value: 'hover:text-[#009BE2]', label: 'Blue (#009BE2)' },
  { value: 'hover:text-blue-400', label: 'Light Blue' },
  { value: 'hover:text-blue-600', label: 'Dark Blue' },
  { value: 'hover:text-pink-400', label: 'Pink' },
  { value: 'hover:text-red-400', label: 'Red' },
  { value: 'hover:text-green-400', label: 'Green' },
  { value: 'hover:text-yellow-400', label: 'Yellow' },
  { value: 'hover:text-purple-400', label: 'Purple' },
  { value: 'hover:text-orange-400', label: 'Orange' },
  { value: 'hover:text-gray-300', label: 'Light Gray' },
];

export default function FooterEditor({
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
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState(null);
  const fileInputRef = useRef(null);

  // ============================================
  // FETCH NAVIGATION ITEMS
  // ============================================
  const fetchNavItems = useCallback(async () => {
    setLoadingItems(true);
    setItemsError(null);

    try {
      const response = await fetch('/data/navigation.json');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle different response structures
      let items = [];
      if (data.items && Array.isArray(data.items)) {
        items = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      } else if (Array.isArray(data)) {
        items = data;
      }

      setNavItems(items);
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      setItemsError(error.message);

      Swal.fire({
        icon: 'warning',
        title: 'Could Not Load Navigation Items',
        text: 'You can still enter custom links manually. Items will load on refresh.',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchNavItems();
  }, [fetchNavItems]);

  // ============================================
  // LOGO HANDLING
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
        title: 'Image Uploaded',
        text: 'Footer logo uploaded successfully!',
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
      text: 'This will remove the logo from the footer.',
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
  // ITEM SELECTION HELPERS
  // ============================================
  const getDropdownItems = useCallback(() => {
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
  }, [navItems]);

  const handleItemSelect = useCallback((type, index, itemSlug) => {
    const selectedItem = navItems.find(item => item.slug === itemSlug);
    if (selectedItem) {
      updateFormData(`${type}.${index}.name`, selectedItem.name);
      updateFormData(`${type}.${index}.url`, selectedItem.url);
    }
  }, [navItems, updateFormData]);

  // ============================================
  // CONTACT NUMBER HANDLING
  // ============================================
  const addContactNumber = () => {
    const currentNumbers = formData.contact?.numbers || [];
    updateFormData('contact.numbers', [...currentNumbers, '']);
  };

  const removeContactNumber = (index) => {
    const currentNumbers = formData.contact?.numbers || [];
    if (currentNumbers.length <= 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Remove',
        text: 'You need at least one contact number.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    const newNumbers = currentNumbers.filter((_, i) => i !== index);
    updateFormData('contact.numbers', newNumbers);
  };

  const updateContactNumber = (index, value) => {
    const currentNumbers = formData.contact?.numbers || [];
    const newNumbers = [...currentNumbers];
    newNumbers[index] = value;
    updateFormData('contact.numbers', newNumbers);
  };

  // ============================================
  // SOCIAL LINK HANDLING
  // ============================================
  const addSocialLink = () => {
    addArrayItem('socialLinks', {
      iconName: 'FaFacebook',
      url: '',
      hoverColor: 'hover:text-[#009BE2]',
      ariaLabel: ''
    });
  };

  // ============================================
  // BOTTOM FOOTER LINK HANDLING
  // ============================================
  const addBottomLink = () => {
    const currentLinks = formData.bottomFooter?.links || [];
    updateFormData('bottomFooter.links', [...currentLinks, { text: '', url: '/' }]);
  };

  const removeBottomLink = (index) => {
    const currentLinks = formData.bottomFooter?.links || [];
    const newLinks = currentLinks.filter((_, i) => i !== index);
    updateFormData('bottomFooter.links', newLinks);
  };

  const updateBottomLink = (index, field, value) => {
    const currentLinks = formData.bottomFooter?.links || [];
    const newLinks = [...currentLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    updateFormData('bottomFooter.links', newLinks);
  };

  // ============================================
  // EMAIL ADDRESS HANDLING
  // ============================================
  const addEmailAddress = () => {
    const currentAddresses = formData.email?.addresses || [];
    updateFormData('email.addresses', [...currentAddresses, '']);
  };

  const removeEmailAddress = (index) => {
    const currentAddresses = formData.email?.addresses || [];
    if (currentAddresses.length <= 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Remove',
        text: 'You need at least one email address.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    const newAddresses = currentAddresses.filter((_, i) => i !== index);
    updateFormData('email.addresses', newAddresses);
  };

  const updateEmailAddress = (index, value) => {
    const currentAddresses = formData.email?.addresses || [];
    const newAddresses = [...currentAddresses];
    newAddresses[index] = value;
    updateFormData('email.addresses', newAddresses);
  };

  // ============================================
  // COMPUTED
  // ============================================
  const isDisabled = isLoading || uploading || loadingItems;
  const dropdownItems = getDropdownItems();
  const hasDuplicateLinks = (items) => {
    if (!items || !Array.isArray(items)) return false;
    const urls = items.map(item => item.url).filter(url => url && url.trim() !== '');
    return new Set(urls).size !== urls.length;
  };

  const quickLinksHaveDuplicates = hasDuplicateLinks(formData.quickLinks);
  const programsHaveDuplicates = hasDuplicateLinks(formData.programs);

  // ============================================
  // RENDER
  // ============================================
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
                      alt={formData.logo?.alt || 'Footer Logo preview'}
                      className="w-16 h-16 object-contain rounded border"
                      onError={(e) => {
                        e.target.src = '/images/placeholder-logo.png';
                      }}
                    />
                    <span className="text-xs text-gray-500 truncate flex-1">
                      {typeof formData.logo.src === 'string' && formData.logo.src.startsWith('data:image')
                        ? '📷 New image (will be saved)'
                        : `📁 ${formData.logo.src.length > 40 ? `${formData.logo.src.substring(0, 40)  }...` : formData.logo.src}`}
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1">
              Describes the logo for screen readers and SEO
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          DESCRIPTION
          ============================================ */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Footer Description
          <span className="text-xs text-gray-400 ml-2">(optional)</span>
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateFormData('description', e.target.value)}
          rows={3}
          placeholder="Brief description of your organization..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isDisabled}
        />
      </div>

      {/* ============================================
          ADDRESS
          ============================================ */}
      <div>
        <h3 className="font-semibold text-lg pt-2">Address & Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-2">
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
      </div>

      {/* ============================================
          CONTACT NUMBERS
          ============================================ */}
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

      {/* ============================================
          EMAIL ADDRESSES
          ============================================ */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Section Title</label>
            <input
              type="text"
              value={formData.email?.title || ''}
              onChange={(e) => updateFormData('email.title', e.target.value)}
              placeholder="e.g., Email"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Addresses</label>
            <div className="space-y-2">
              {(formData.email?.addresses || []).map((address, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="email"
                    value={address || ''}
                    onChange={(e) => updateEmailAddress(index, e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isDisabled}
                  />
                  <button
                    type="button"
                    onClick={() => removeEmailAddress(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                    disabled={isDisabled || (formData.email?.addresses || []).length <= 1}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addEmailAddress}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm"
                disabled={isDisabled}
              >
                <FaPlus size={14} /> Add Email Address
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          SOCIAL LINKS
          ============================================ */}
      <div>
        <h3 className="font-semibold text-lg pt-2">Social Links</h3>
        <p className="text-xs text-gray-500 mb-2">Add social media links for your organization</p>

        {(formData.socialLinks || []).map((link, index) => (
          <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg w-full flex-wrap mb-2">
            <div className="flex-1 min-w-30">
              <select
                value={link.iconName || 'FaFacebook'}
                onChange={(e) => updateFormData(`socialLinks.${index}.iconName`, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isDisabled}
              >
                {SOCIAL_ICON_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={link.url || ''}
              onChange={(e) => updateFormData(`socialLinks.${index}.url`, e.target.value)}
              placeholder="URL (e.g., https://facebook.com/yourpage)"
              className="flex-1 min-w-37.5 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
            <div className="min-w-32.5">
              <select
                value={link.hoverColor || 'hover:text-[#009BE2]'}
                onChange={(e) => updateFormData(`socialLinks.${index}.hoverColor`, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isDisabled}
              >
                {HOVER_COLOR_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => removeArrayItem('socialLinks', index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
              disabled={isDisabled}
            >
              <FaTrash size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addSocialLink}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          disabled={isDisabled}
        >
          <FaPlus size={14} /> Add Social Link
        </button>
      </div>

      {/* ============================================
          QUICK LINKS
          ============================================ */}
      <div>
        <h3 className="font-semibold text-lg pt-2">Quick Links</h3>
        <p className="text-xs text-gray-500 mb-2">Select pages from dropdown or enter custom links</p>

        {quickLinksHaveDuplicates && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            ⚠️ Duplicate URLs detected in Quick Links. Please ensure each link has a unique URL.
          </div>
        )}

        {(formData.quickLinks || []).map((link, index) => (
          <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg w-full flex-wrap mb-2">
            <div className="flex-1 min-w-37.5">
              <select
                value={link.url ? link.url.replace(/^\//, '').split('/').pop() || '' : ''}
                onChange={(e) => handleItemSelect('quickLinks', index, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isDisabled}
              >
                <option value="">-- Select Page/Program --</option>
                {loadingItems ? (
                  <option value="" disabled>⏳ Loading...</option>
                ) : itemsError ? (
                  <option value="" disabled>⚠️ Could not load</option>
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
            <input
              type="text"
              value={link.name || ''}
              onChange={(e) => updateFormData(`quickLinks.${index}.name`, e.target.value)}
              placeholder="Link Name"
              className="flex-1 min-w-25 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
            <input
              type="text"
              value={link.url || ''}
              onChange={(e) => updateFormData(`quickLinks.${index}.url`, e.target.value)}
              placeholder="URL"
              className="flex-1 min-w-25 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
      </div>

      {/* ============================================
          PROGRAMS
          ============================================ */}
      <div>
        <h3 className="font-semibold text-lg pt-2">Programs</h3>
        <p className="text-xs text-gray-500 mb-2">Select programs from dropdown or enter custom links</p>

        {programsHaveDuplicates && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            ⚠️ Duplicate URLs detected in Programs. Please ensure each link has a unique URL.
          </div>
        )}

        {(formData.programs || []).map((program, index) => (
          <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg w-full flex-wrap mb-2">
            <div className="flex-1 min-w-37.5">
              <select
                value={program.url ? program.url.replace(/^\//, '').split('/').pop() || '' : ''}
                onChange={(e) => handleItemSelect('programs', index, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isDisabled}
              >
                <option value="">-- Select Program --</option>
                {loadingItems ? (
                  <option value="" disabled>⏳ Loading...</option>
                ) : itemsError ? (
                  <option value="" disabled>⚠️ Could not load</option>
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
            <input
              type="text"
              value={program.name || ''}
              onChange={(e) => updateFormData(`programs.${index}.name`, e.target.value)}
              placeholder="Program Name"
              className="flex-1 min-w-25 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
            <input
              type="text"
              value={program.url || ''}
              onChange={(e) => updateFormData(`programs.${index}.url`, e.target.value)}
              placeholder="URL"
              className="flex-1 min-w-25 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
      </div>

      {/* ============================================
          NEWSLETTER
          ============================================ */}
      <div>
        <h3 className="font-semibold text-lg pt-2">Newsletter</h3>
        <p className="text-xs text-gray-500 mb-2">Configure the newsletter subscription section</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
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
        </div>
      </div>

      {/* ============================================
          BOTTOM FOOTER
          ============================================ */}
      <div>
        <h3 className="font-semibold text-lg pt-2">Bottom Footer</h3>
        <p className="text-xs text-gray-500 mb-2">Copyright and legal links</p>

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

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700">Legal Links</label>
          <p className="text-xs text-gray-400 mb-2">Links like Privacy Policy, Terms of Service, etc.</p>

          {(formData.bottomFooter?.links || []).map((link, index) => (
            <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg w-full flex-wrap mb-2">
              <input
                type="text"
                value={link.text || ''}
                onChange={(e) => updateBottomLink(index, 'text', e.target.value)}
                placeholder="Link Text"
                className="flex-1 min-w-25 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isDisabled}
              />
              <input
                type="text"
                value={link.url || ''}
                onChange={(e) => updateBottomLink(index, 'url', e.target.value)}
                placeholder="URL"
                className="flex-1 min-w-25 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isDisabled}
              />
              <button
                type="button"
                onClick={() => removeBottomLink(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                disabled={isDisabled}
              >
                <FaTrash size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addBottomLink}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            disabled={isDisabled}
          >
            <FaPlus size={14} /> Add Legal Link
          </button>
        </div>
      </div>

      {/* ============================================
          ICON IMAGES (for bullet points)
          ============================================ */}
      <div>
        <h3 className="font-semibold text-lg pt-2">Link Icons</h3>
        <p className="text-xs text-gray-500 mb-2">Small icons shown next to links (optional)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quick Link Icon URL</label>
            <input
              type="text"
              value={formData.quickLinkLinkIcon || ''}
              onChange={(e) => updateFormData('quickLinkLinkIcon', e.target.value)}
              placeholder="/storage/images/arrow-icon.png"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1">Image path for quick link bullet icons</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Program Link Icon URL</label>
            <input
              type="text"
              value={formData.OurProgramLinkIcon || ''}
              onChange={(e) => updateFormData('OurProgramLinkIcon', e.target.value)}
              placeholder="/storage/images/program-icon.png"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1">Image path for program link bullet icons</p>
          </div>
        </div>
      </div>
    </div>
  );
}