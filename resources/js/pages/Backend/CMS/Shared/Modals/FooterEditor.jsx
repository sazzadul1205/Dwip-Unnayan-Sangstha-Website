// resources/js/pages/Backend/CMS/Shared/Modals/FooterEditor.jsx

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  FaPlus, FaTrash, FaUpload, FaSpinner, FaImage, FaLink, FaPhone,
  FaAddressCard, FaShareAlt, FaCopyright, FaIcons
} from 'react-icons/fa';
import {
  FiFacebook, FiGithub, FiInstagram, FiLinkedin,
  FiYoutube, FiSearch, FiChevronDown, FiCheck, FiX,
} from 'react-icons/fi';
import {
  FaXTwitter, FaTiktok, FaPinterest, FaWhatsapp, FaTelegram,
  FaDiscord, FaReddit, FaSnapchat, FaThreads
} from 'react-icons/fa6';

// ============================================
// AVAILABLE SOCIAL ICONS
// ============================================
const SOCIAL_ICONS = [
  { value: 'FaFacebook', label: 'Facebook', icon: FiFacebook, color: '#1877F2' },
  { value: 'FaXTwitter', label: 'X (Twitter)', icon: FaXTwitter, color: '#000000' },
  { value: 'FaInstagram', label: 'Instagram', icon: FiInstagram, color: '#E4405F' },
  { value: 'FaLinkedin', label: 'LinkedIn', icon: FiLinkedin, color: '#0A66C2' },
  { value: 'FaYoutube', label: 'YouTube', icon: FiYoutube, color: '#FF0000' },
  { value: 'FaTiktok', label: 'TikTok', icon: FaTiktok, color: '#000000' },
  { value: 'FaPinterest', label: 'Pinterest', icon: FaPinterest, color: '#BD081C' },
  { value: 'FaWhatsapp', label: 'WhatsApp', icon: FaWhatsapp, color: '#25D366' },
  { value: 'FaTelegram', label: 'Telegram', icon: FaTelegram, color: '#26A5E4' },
  { value: 'FaDiscord', label: 'Discord', icon: FaDiscord, color: '#5865F2' },
  { value: 'FaReddit', label: 'Reddit', icon: FaReddit, color: '#FF4500' },
  { value: 'FaSnapchat', label: 'Snapchat', icon: FaSnapchat, color: '#FFFC00' },
  { value: 'FaThreads', label: 'Threads', icon: FaThreads, color: '#000000' },
  { value: 'FaGithub', label: 'GitHub', icon: FiGithub, color: '#181717' },
];

// ============================================
// SEARCHABLE ICON PICKER (shared with TopBarEditor style)
// ============================================
function IconPicker({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = useMemo(
    () => SOCIAL_ICONS.find(i => i.value === value) || SOCIAL_ICONS[0],
    [value]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return SOCIAL_ICONS;
    const q = search.toLowerCase();
    return SOCIAL_ICONS.filter(
      i => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const SelectedIcon = selected.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="flex items-center gap-2 w-full min-w-45 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition outline-none disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${selected.color}15`, color: selected.color }}
        >
          <SelectedIcon size={16} />
        </span>
        <span className="flex-1 text-left text-sm text-gray-700 truncate">
          {selected.label}
        </span>
        <FiChevronDown
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons..."
                autoFocus
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No icons found</p>
            ) : (
              filtered.map((icon) => {
                const Icon = icon.icon;
                const isActive = icon.value === value;
                return (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => {
                      onChange(icon);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2 text-left transition ${isActive ? 'bg-pink-50' : 'hover:bg-gray-50'}`}
                  >
                    <span
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${icon.color}15`, color: icon.color }}
                    >
                      <Icon size={16} />
                    </span>
                    <span className={`text-sm flex-1 ${isActive ? 'text-pink-600 font-medium' : 'text-gray-700'}`}>
                      {icon.label}
                    </span>
                    {isActive && <FiCheck className="text-pink-600" size={14} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
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
  const [itemsError, setItemsError] = useState(null);

  const fileInputRef = useRef(null);
  const quickLinkIconInputRef = useRef(null);
  const programLinkIconInputRef = useRef(null);

  // ✅ Memoized so the reference stays stable across renders when the
  //    underlying `formData.socialLinks` value hasn't changed.
  //    This prevents `socialStats` (useMemo) from recomputing on every render
  //    and removes the exhaustive-deps warning.
  const socialLinks = useMemo(
    () => formData.socialLinks || [],
    [formData.socialLinks]
  );

  // ---------------------------------------------
  // FETCH NAVIGATION ITEMS
  // ---------------------------------------------
  const fetchNavItems = useCallback(async () => {
    setLoadingItems(true);
    setItemsError(null);
    try {
      const response = await fetch('/data/navigation.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();

      let items = [];
      if (data.items && Array.isArray(data.items)) items = data.items;
      else if (data.data && Array.isArray(data.data)) items = data.data;
      else if (Array.isArray(data)) items = data;

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

  // ---------------------------------------------
  // LOGO HANDLING
  // ---------------------------------------------
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
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
        text: 'Footer logo uploaded successfully.',
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
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  // ---------------------------------------------
  // LINK ICON HANDLING
  // ---------------------------------------------
  const handleLinkIconDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(type === 'quick' ? 'quick' : 'program');
  };

  const handleLinkIconDrop = async (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (!files || !files[0]) return;
    await uploadLinkIcon(files[0], type);
  };

  const handleLinkIconFileSelect = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadLinkIcon(file, type);
    e.target.value = '';
  };

  const uploadLinkIcon = async (file, type) => {
    setUploading(true);
    if (setIsLoading) setIsLoading(true);
    try {
      const imageUrl = await processImageFile(file);
      const fieldName = type === 'quick' ? 'quickLinkLinkIcon' : 'OurProgramLinkIcon';
      updateFormData(fieldName, imageUrl);
      Swal.fire({
        icon: 'success',
        title: 'Icon Uploaded',
        text: `${type === 'quick' ? 'Quick Link' : 'Program'} icon uploaded successfully!`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message || 'Could not upload icon. Please try again.',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setUploading(false);
      if (setIsLoading) setIsLoading(false);
    }
  };

  const removeLinkIcon = (type) => {
    const iconName = type === 'quick' ? 'Quick Link Icon' : 'Program Link Icon';
    const fieldName = type === 'quick' ? 'quickLinkLinkIcon' : 'OurProgramLinkIcon';
    Swal.fire({
      title: `Remove ${iconName}?`,
      text: `This will remove the ${iconName.toLowerCase()} from the footer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it',
    }).then((result) => {
      if (result.isConfirmed) {
        updateFormData(fieldName, '');
        if (type === 'quick' && quickLinkIconInputRef.current) quickLinkIconInputRef.current.value = '';
        if (type === 'program' && programLinkIconInputRef.current) programLinkIconInputRef.current.value = '';
      }
    });
  };

  // ---------------------------------------------
  // SOCIAL LINK HANDLERS
  // ---------------------------------------------
  const addSocialLink = (presetIcon = null) => {
    const used = new Set(socialLinks.map(l => l.iconName));
    const icon = presetIcon || SOCIAL_ICONS.find(i => !used.has(i.value)) || SOCIAL_ICONS[0];
    updateFormData('socialLinks', [
      ...socialLinks,
      {
        iconName: icon.value,
        url: '',
        name: icon.label,
        ariaLabel: icon.label,
        hoverColor: `hover:text-[${icon.color}]`,
      },
    ]);
  };

  const removeSocialLink = (index) => {
    const link = socialLinks[index] || {};
    Swal.fire({
      title: 'Remove Social Link?',
      html: `Remove "<strong>${link.name || link.ariaLabel || 'this link'}</strong>" from social links?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        updateFormData('socialLinks', socialLinks.filter((_, i) => i !== index));
      }
    });
  };

  const handleSocialIconChange = (index, icon) => {
    updateFormData(`socialLinks.${index}.iconName`, icon.value);
    updateFormData(`socialLinks.${index}.name`, icon.label);
    updateFormData(`socialLinks.${index}.ariaLabel`, icon.label);
    updateFormData(`socialLinks.${index}.hoverColor`, `hover:text-[${icon.color}]`);
  };

  // ---------------------------------------------
  // ITEM SELECTION
  // ---------------------------------------------
  const getDropdownItems = useCallback(() => {
    const items = [];
    const pages = navItems.filter(item => item.type === 'page');
    const programs = navItems.filter(item => item.type === 'program');

    if (pages.length > 0) {
      items.push({ type: 'header', label: '📄 Pages', key: 'header-pages' });
      pages.forEach(page => items.push({ ...page, key: `page-${page.id}` }));
    }
    if (programs.length > 0) {
      items.push({ type: 'header', label: '📁 Programs', key: 'header-programs' });
      programs.forEach(program => items.push({ ...program, key: `program-${program.id}` }));
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

  // ---------------------------------------------
  // CONTACT / EMAIL / BOTTOM LINKS
  // ---------------------------------------------
  const addContactNumber = () => {
    const currentNumbers = formData.contact?.numbers || [];
    updateFormData('contact.numbers', [...currentNumbers, '']);
  };

  const removeContactNumber = (index) => {
    const currentNumbers = formData.contact?.numbers || [];
    if (currentNumbers.length <= 1) {
      Swal.fire({ icon: 'warning', title: 'Cannot Remove', text: 'You need at least one contact number.', confirmButtonColor: '#3b82f6' });
      return;
    }
    updateFormData('contact.numbers', currentNumbers.filter((_, i) => i !== index));
  };

  const updateContactNumber = (index, value) => {
    const currentNumbers = formData.contact?.numbers || [];
    const newNumbers = [...currentNumbers];
    newNumbers[index] = value;
    updateFormData('contact.numbers', newNumbers);
  };

  const addBottomLink = () => {
    const currentLinks = formData.bottomFooter?.links || [];
    updateFormData('bottomFooter.links', [...currentLinks, { text: '', url: '/' }]);
  };

  const removeBottomLink = (index) => {
    const currentLinks = formData.bottomFooter?.links || [];
    updateFormData('bottomFooter.links', currentLinks.filter((_, i) => i !== index));
  };

  const updateBottomLink = (index, field, value) => {
    const currentLinks = formData.bottomFooter?.links || [];
    const newLinks = [...currentLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    updateFormData('bottomFooter.links', newLinks);
  };

  const addEmailAddress = () => {
    const currentAddresses = formData.email?.addresses || [];
    updateFormData('email.addresses', [...currentAddresses, '']);
  };

  const removeEmailAddress = (index) => {
    const currentAddresses = formData.email?.addresses || [];
    if (currentAddresses.length <= 1) {
      Swal.fire({ icon: 'warning', title: 'Cannot Remove', text: 'You need at least one email address.', confirmButtonColor: '#3b82f6' });
      return;
    }
    updateFormData('email.addresses', currentAddresses.filter((_, i) => i !== index));
  };

  const updateEmailAddress = (index, value) => {
    const currentAddresses = formData.email?.addresses || [];
    const newAddresses = [...currentAddresses];
    newAddresses[index] = value;
    updateFormData('email.addresses', newAddresses);
  };

  // ---------------------------------------------
  // COMPUTED
  // ---------------------------------------------
  const isDisabled = isLoading || uploading || loadingItems;
  const dropdownItems = getDropdownItems();

  const hasDuplicateLinks = (items) => {
    if (!items || !Array.isArray(items)) return false;
    const urls = items.map(item => item.url).filter(url => url && url.trim() !== '');
    return new Set(urls).size !== urls.length;
  };

  const quickLinksHaveDuplicates = hasDuplicateLinks(formData.quickLinks);
  const programsHaveDuplicates = hasDuplicateLinks(formData.programs);
  const hasLogo = formData.logo?.src && formData.logo.src.trim().length > 0;

  const socialStats = useMemo(() => {
    const active = socialLinks.filter(l => l.url && l.url.trim() !== '').length;
    return { total: socialLinks.length, active };
  }, [socialLinks]);

  return (
    <div className="space-y-8 w-full">

      {/* ============================================
          LOGO
          ============================================ */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaImage className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Footer Logo</h3>
            <p className="text-xs text-gray-500">Upload your brand logo for the footer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Image
              <span className="text-xs text-gray-400 ml-2">(PNG with transparent background recommended)</span>
            </label>
            <div className="relative">
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${dragActive === true ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'} ${uploading ? 'opacity-50' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex items-center gap-3 min-h-16">
                  {hasLogo ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-16 h-16 rounded border border-gray-600 bg-[#080C14] flex items-center justify-center p-1 shrink-0">
                        <img
                          src={formData.logo.src}
                          alt={formData.logo?.alt || 'Logo preview'}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { e.target.src = '/images/placeholder-logo.png'; }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 truncate flex-1">Logo uploaded</span>
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                        title="Remove logo"
                        disabled={isDisabled}
                      >
                        <FiX className="w-4 h-4" />
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
              <p className="text-xs text-gray-400 mt-1.5">Max 5MB. Supported: JPG, PNG, GIF, WebP, SVG</p>
            </div>
          </div>

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
            <p className="text-xs text-gray-400 mt-1.5">Describes the logo for screen readers and SEO</p>
          </div>
        </div>
      </div>

      {/* ============================================
          DESCRIPTION
          ============================================ */}
      <div className="bg-linear-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FaAddressCard className="text-gray-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Footer Description</h3>
            <p className="text-xs text-gray-500">Brief description of your organization</p>
          </div>
        </div>

        <textarea
          value={formData.description || ''}
          onChange={(e) => updateFormData('description', e.target.value)}
          rows={3}
          placeholder="Brief description of your organization..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
          disabled={isDisabled}
        />
      </div>

      {/* ============================================
          ADDRESS & CONTACT
          ============================================ */}
      <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <FaAddressCard className="text-green-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Address & Contact</h3>
            <p className="text-xs text-gray-500">Physical address and contact information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address Title</label>
            <input
              type="text"
              value={formData.address?.title || ''}
              onChange={(e) => updateFormData('address.title', e.target.value)}
              placeholder="e.g., Address"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address Details</label>
            <input
              type="text"
              value={formData.address?.details || ''}
              onChange={(e) => updateFormData('address.details', e.target.value)}
              placeholder="Full address"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* ============================================
          CONTACT & EMAIL
          ============================================ */}
      <div className="bg-linear-to-r from-cyan-50 to-teal-50 rounded-xl p-6 border border-cyan-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <FaPhone className="text-cyan-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Contact & Email</h3>
            <p className="text-xs text-gray-500">Phone numbers and email addresses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Title</label>
            <input
              type="text"
              value={formData.contact?.title || ''}
              onChange={(e) => updateFormData('contact.title', e.target.value)}
              placeholder="e.g., Call, Contact, Phone"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none mb-3"
              disabled={isDisabled}
            />
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Numbers</label>
            <div className="space-y-2">
              {(formData.contact?.numbers || []).map((number, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={number || ''}
                    onChange={(e) => updateContactNumber(index, e.target.value)}
                    placeholder="Enter phone number"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none"
                    disabled={isDisabled}
                  />
                  <button
                    type="button"
                    onClick={() => removeContactNumber(index)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                    disabled={isDisabled || (formData.contact?.numbers || []).length <= 1}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addContactNumber}
                className="text-cyan-600 hover:text-cyan-700 flex items-center gap-2 text-sm font-medium"
                disabled={isDisabled}
              >
                <FaPlus size={14} /> Add Phone Number
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Section Title</label>
            <input
              type="text"
              value={formData.email?.title || ''}
              onChange={(e) => updateFormData('email.title', e.target.value)}
              placeholder="e.g., Email"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none mb-3"
              disabled={isDisabled}
            />
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Addresses</label>
            <div className="space-y-2">
              {(formData.email?.addresses || []).map((address, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="email"
                    value={address || ''}
                    onChange={(e) => updateEmailAddress(index, e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none"
                    disabled={isDisabled}
                  />
                  <button
                    type="button"
                    onClick={() => removeEmailAddress(index)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                    disabled={isDisabled || (formData.email?.addresses || []).length <= 1}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addEmailAddress}
                className="text-cyan-600 hover:text-cyan-700 flex items-center gap-2 text-sm font-medium"
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
      <div className="bg-linear-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <FaShareAlt className="text-pink-600 text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Social Links</h3>
              <p className="text-xs text-gray-500">
                {socialStats.total === 0
                  ? 'No social links yet'
                  : `${socialStats.active} of ${socialStats.total} active`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => addSocialLink()}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisabled}
          >
            <FaPlus size={14} />
            Add Social Link
          </button>
        </div>

        {socialLinks.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
            <FaShareAlt className="text-gray-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No social links added yet</p>
            <p className="text-xs text-gray-400 mb-4">Connect Facebook, X (Twitter), LinkedIn, YouTube and more</p>
            <button
              type="button"
              onClick={() => addSocialLink()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm"
              disabled={isDisabled}
            >
              <FaPlus size={12} />
              Add Your First Link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {socialLinks.map((link, index) => {
              const iconConfig = SOCIAL_ICONS.find(i => i.value === link.iconName) || SOCIAL_ICONS[0];
              const IconComponent = iconConfig.icon;
              const hasUrl = link.url && link.url.trim() !== '';

              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-4 shadow-sm border transition ${hasUrl ? 'border-green-200 hover:border-green-300' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <IconPicker
                      value={link.iconName}
                      onChange={(icon) => handleSocialIconChange(index, icon)}
                      disabled={isDisabled}
                    />

                    <div className="flex-1 min-w-45">
                      <input
                        type="url"
                        value={link.url || ''}
                        onChange={(e) => updateFormData(`socialLinks.${index}.url`, e.target.value)}
                        placeholder={`https://${iconConfig.label.toLowerCase().replace(/[^a-z]/g, '')}.com/yourpage`}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition outline-none ${hasUrl ? 'border-green-300' : 'border-gray-300'}`}
                        disabled={isDisabled}
                      />
                    </div>

                    <div className="min-w-25">
                      <input
                        type="text"
                        value={link.ariaLabel || link.name || ''}
                        onChange={(e) => {
                          updateFormData(`socialLinks.${index}.ariaLabel`, e.target.value);
                          updateFormData(`socialLinks.${index}.name`, e.target.value);
                        }}
                        placeholder="Label"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition outline-none text-sm"
                        disabled={isDisabled}
                      />
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      {hasUrl ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full whitespace-nowrap">🔗 Active</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full whitespace-nowrap">⏸ Hidden</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        disabled={isDisabled}
                        title="Remove link"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>

                  {hasUrl && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm">
                      <span className="text-xs text-gray-400">Preview:</span>
                      <span
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                        style={{ backgroundColor: `${iconConfig.color}10`, color: iconConfig.color }}
                      >
                        <IconComponent size={14} />
                        <span className="text-xs font-medium">{link.name || link.ariaLabel || iconConfig.label}</span>
                      </span>
                      <span className="text-xs text-gray-400 truncate ml-1">→ {link.url}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-pink-200/60">
            <p className="text-xs text-gray-500 mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_ICONS
                .filter(icon => !socialLinks.some(l => l.iconName === icon.value))
                .slice(0, 8)
                .map((icon) => {
                  const Icon = icon.icon;
                  return (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => addSocialLink(icon)}
                      disabled={isDisabled}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 bg-white hover:border-pink-400 hover:bg-pink-50 transition text-xs text-gray-600 disabled:opacity-50"
                      title={`Add ${icon.label}`}
                    >
                      <span style={{ color: icon.color }}>
                        <Icon size={12} />
                      </span>
                      {icon.label}
                      <FaPlus size={8} className="text-gray-400" />
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          QUICK LINKS & PROGRAMS
          ============================================ */}
      <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <FaLink className="text-orange-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Quick Links & Programs</h3>
            <p className="text-xs text-gray-500">
              {(formData.quickLinks || []).length} quick links • {(formData.programs || []).length} programs
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* QUICK LINKS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-700">Quick Links</h4>
              <button
                type="button"
                onClick={() => addArrayItem('quickLinks', { name: '', url: '/' })}
                className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm font-medium"
                disabled={isDisabled}
              >
                <FaPlus size={12} /> Add Quick Link
              </button>
            </div>

            {quickLinksHaveDuplicates && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
                <span>⚠️</span>
                Duplicate URLs detected. Please ensure each link has a unique URL.
              </div>
            )}

            {(formData.quickLinks || []).length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
                <p className="text-gray-400 text-sm">No quick links added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(formData.quickLinks || []).map((link, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:border-orange-300 transition">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex-1 min-w-37.5">
                        <select
                          value={link.url ? link.url.replace(/^\//, '').split('/').pop() || '' : ''}
                          onChange={(e) => handleItemSelect('quickLinks', index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none bg-white text-sm"
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
                      <div className="flex-1 min-w-25">
                        <input
                          type="text"
                          value={link.name || ''}
                          onChange={(e) => updateFormData(`quickLinks.${index}.name`, e.target.value)}
                          placeholder="Link Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none text-sm"
                          disabled={isDisabled}
                        />
                      </div>
                      <div className="flex-1 min-w-25">
                        <input
                          type="text"
                          value={link.url || ''}
                          onChange={(e) => updateFormData(`quickLinks.${index}.url`, e.target.value)}
                          placeholder="URL"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none text-sm"
                          disabled={isDisabled}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('quickLinks', index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        disabled={isDisabled}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PROGRAMS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-700">Programs</h4>
              <button
                type="button"
                onClick={() => addArrayItem('programs', { name: '', url: '/' })}
                className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm font-medium"
                disabled={isDisabled}
              >
                <FaPlus size={12} /> Add Program
              </button>
            </div>

            {programsHaveDuplicates && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
                <span>⚠️</span>
                Duplicate URLs detected. Please ensure each program has a unique URL.
              </div>
            )}

            {(formData.programs || []).length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
                <p className="text-gray-400 text-sm">No programs added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(formData.programs || []).map((program, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:border-orange-300 transition">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex-1 min-w-37.5">
                        <select
                          value={program.url ? program.url.replace(/^\//, '').split('/').pop() || '' : ''}
                          onChange={(e) => handleItemSelect('programs', index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none bg-white text-sm"
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
                      <div className="flex-1 min-w-25">
                        <input
                          type="text"
                          value={program.name || ''}
                          onChange={(e) => updateFormData(`programs.${index}.name`, e.target.value)}
                          placeholder="Program Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none text-sm"
                          disabled={isDisabled}
                        />
                      </div>
                      <div className="flex-1 min-w-25">
                        <input
                          type="text"
                          value={program.url || ''}
                          onChange={(e) => updateFormData(`programs.${index}.url`, e.target.value)}
                          placeholder="URL"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none text-sm"
                          disabled={isDisabled}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('programs', index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        disabled={isDisabled}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          BOTTOM FOOTER
          ============================================ */}
      <div className="bg-linear-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FaCopyright className="text-gray-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Bottom Footer</h3>
            <p className="text-xs text-gray-500">Copyright and legal links</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Text</label>
            <input
              type="text"
              value={formData.bottomFooter?.copyright || ''}
              onChange={(e) => updateFormData('bottomFooter.copyright', e.target.value)}
              placeholder="© 2024 Your Organization. All rights reserved."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Legal Links</label>
              <button
                type="button"
                onClick={addBottomLink}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                disabled={isDisabled}
              >
                <FaPlus size={12} /> Add Legal Link
              </button>
            </div>

            {(formData.bottomFooter?.links || []).length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
                <p className="text-gray-400 text-sm">No legal links added yet</p>
                <p className="text-xs text-gray-400">Add Privacy Policy, Terms of Service, etc.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(formData.bottomFooter?.links || []).map((link, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:border-blue-300 transition">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex-1 min-w-25">
                        <input
                          type="text"
                          value={link.text || ''}
                          onChange={(e) => updateBottomLink(index, 'text', e.target.value)}
                          placeholder="Link Text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none text-sm"
                          disabled={isDisabled}
                        />
                      </div>
                      <div className="flex-1 min-w-25">
                        <input
                          type="text"
                          value={link.url || ''}
                          onChange={(e) => updateBottomLink(index, 'url', e.target.value)}
                          placeholder="URL"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none text-sm"
                          disabled={isDisabled}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBottomLink(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        disabled={isDisabled}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          LINK ICONS
          ============================================ */}
      <div className="bg-linear-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FaIcons className="text-purple-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Link Icons</h3>
            <p className="text-xs text-gray-500">Small icons shown next to links (optional)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Link Icon
              <span className="text-xs text-gray-400 ml-2">(Optional)</span>
            </label>
            <div className="relative">
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${dragActive === 'quick' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'} ${uploading ? 'opacity-50' : ''}`}
                onDragEnter={(e) => handleLinkIconDrag(e, 'quick')}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                onDragOver={(e) => handleLinkIconDrag(e, 'quick')}
                onDrop={(e) => handleLinkIconDrop(e, 'quick')}
              >
                <div className="flex items-center gap-3 min-h-16">
                  {formData.quickLinkLinkIcon ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-12 h-12 rounded border border-gray-600 bg-[#080C14] flex items-center justify-center p-1 shrink-0">
                        <img
                          src={formData.quickLinkLinkIcon}
                          alt="Quick Link Icon"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { e.target.src = '/images/placeholder-icon.png'; }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 truncate flex-1">Icon uploaded</span>
                      <button
                        type="button"
                        onClick={() => removeLinkIcon('quick')}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                        title="Remove icon"
                        disabled={isDisabled}
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 w-full text-gray-400 py-2">
                      <FaUpload size={20} className="shrink-0" />
                      <span className="text-sm">Drop icon or click to browse</span>
                    </div>
                  )}
                  <input
                    ref={quickLinkIconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLinkIconFileSelect(e, 'quick')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isDisabled}
                  />
                </div>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaSpinner className="animate-spin text-purple-600" size={20} />
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Max 5MB. Supported: JPG, PNG, GIF, WebP, SVG</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Link Icon
              <span className="text-xs text-gray-400 ml-2">(Optional)</span>
            </label>
            <div className="relative">
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${dragActive === 'program' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'} ${uploading ? 'opacity-50' : ''}`}
                onDragEnter={(e) => handleLinkIconDrag(e, 'program')}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                onDragOver={(e) => handleLinkIconDrag(e, 'program')}
                onDrop={(e) => handleLinkIconDrop(e, 'program')}
              >
                <div className="flex items-center gap-3 min-h-16">
                  {formData.OurProgramLinkIcon ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-12 h-12 rounded border border-gray-600 bg-[#080C14] flex items-center justify-center p-1 shrink-0">
                        <img
                          src={formData.OurProgramLinkIcon}
                          alt="Program Link Icon"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { e.target.src = '/images/placeholder-icon.png'; }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 truncate flex-1">Icon uploaded</span>
                      <button
                        type="button"
                        onClick={() => removeLinkIcon('program')}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                        title="Remove icon"
                        disabled={isDisabled}
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 w-full text-gray-400 py-2">
                      <FaUpload size={20} className="shrink-0" />
                      <span className="text-sm">Drop icon or click to browse</span>
                    </div>
                  )}
                  <input
                    ref={programLinkIconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLinkIconFileSelect(e, 'program')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isDisabled}
                  />
                </div>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaSpinner className="animate-spin text-purple-600" size={20} />
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Max 5MB. Supported: JPG, PNG, GIF, WebP, SVG</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}