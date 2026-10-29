// resources/js/pages/Backend/CMS/Shared/Modals/FooterEditor.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  FaPlus, FaTrash, FaUpload, FaSpinner, FaImage, FaLink,
  FaPhone, FaAddressCard, FaShareAlt, FaCopyright, FaTimes,
  FaInfoCircle,
} from 'react-icons/fa';
import {
  FiFacebook, FiGithub, FiInstagram, FiLinkedin,
  FiYoutube, FiSearch, FiChevronDown, FiCheck,
} from 'react-icons/fi';
import {
  FaXTwitter, FaTiktok, FaPinterest, FaWhatsapp, FaTelegram,
  FaDiscord, FaReddit, FaSnapchat, FaThreads,
} from 'react-icons/fa6';
import EditorSection from '../components/EditorSection';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 disabled:bg-slate-50 disabled:text-slate-500';
const inputSmallClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 disabled:bg-slate-50 disabled:text-slate-500';
const labelClass = 'block text-sm font-medium text-slate-700';
const hintClass = 'mt-1.5 text-xs text-slate-400';

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

// ─── IconPicker ───
function IconPicker({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = useMemo(
    () => SOCIAL_ICONS.find((i) => i.value === value) || SOCIAL_ICONS[0],
    [value]
  );
  const filtered = useMemo(() => {
    if (!search.trim()) return SOCIAL_ICONS;
    const q = search.toLowerCase();
    return SOCIAL_ICONS.filter(
      (i) => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false); setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const SelectedIcon = selected.icon;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="flex w-full min-w-45 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${selected.color}15`, color: selected.color }}>
          <SelectedIcon size={15} />
        </span>
        <span className="flex-1 truncate text-sm text-slate-700">{selected.label}</span>
        <FiChevronDown className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} size={15} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons…" autoFocus
                className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No icons found</p>
            ) : filtered.map((icon) => {
              const Icon = icon.icon;
              const active = icon.value === value;
              return (
                <button key={icon.value} type="button"
                  onClick={() => { onChange(icon); setOpen(false); setSearch(''); }}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${icon.color}15`, color: icon.color }}>
                    <Icon size={15} />
                  </span>
                  <span className={`flex-1 text-sm ${active ? 'font-medium text-blue-700' : 'text-slate-700'}`}>
                    {icon.label}
                  </span>
                  {active && <FiCheck className="text-blue-600" size={13} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ───
export default function FooterEditor({
  formData, updateFormData, addArrayItem, removeArrayItem,
  isLoading = false, setIsLoading = null,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState(null);

  const fileInputRef = useRef(null);
  const quickLinkIconInputRef = useRef(null);
  const programLinkIconInputRef = useRef(null);

  const socialLinks = useMemo(() => formData.socialLinks || [], [formData.socialLinks]);

  // Fetch nav items
  const fetchNavItems = useCallback(async () => {
    setLoadingItems(true); setItemsError(null);
    try {
      const res = await fetch('/data/navigation.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      let items = [];
      if (data.items && Array.isArray(data.items)) items = data.items;
      else if (data.data && Array.isArray(data.data)) items = data.data;
      else if (Array.isArray(data)) items = data;
      setNavItems(items);
    } catch (err) {
      setItemsError(err.message);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => { fetchNavItems(); }, [fetchNavItems]);

  // Image helpers
  const processImageFile = (file) => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file')); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image must be less than 5MB')); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const uploadImage = async (file) => {
    setUploading(true);
    if (setIsLoading) setIsLoading(true);
    try {
      const imageUrl = await processImageFile(file);
      updateFormData('logo.src', imageUrl);
      Swal.fire({
        icon: 'success', title: 'Uploaded!', text: 'Footer logo uploaded.',
        timer: 1500, showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Upload Failed', text: err.message,
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setUploading(false);
      if (setIsLoading) setIsLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) await uploadImage(files[0]);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
    e.target.value = '';
  };

  const removeLogo = () => {
    Swal.fire({
      title: 'Remove Logo?', text: 'This will remove the logo.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
    }).then((r) => {
      if (r.isConfirmed) {
        updateFormData('logo.src', '');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  // Link icon handlers
  const uploadLinkIcon = async (file, type) => {
    setUploading(true);
    if (setIsLoading) setIsLoading(true);
    try {
      const imageUrl = await processImageFile(file);
      const fieldName = type === 'quick' ? 'quickLinkLinkIcon' : 'OurProgramLinkIcon';
      updateFormData(fieldName, imageUrl);
      Swal.fire({
        icon: 'success', title: 'Icon Uploaded',
        text: `${type === 'quick' ? 'Quick Link' : 'Program'} icon uploaded.`,
        timer: 1500, showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Upload Failed', text: err.message,
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setUploading(false);
      if (setIsLoading) setIsLoading(false);
    }
  };

  const handleLinkIconFileSelect = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadLinkIcon(file, type);
    e.target.value = '';
  };

  const removeLinkIcon = (type) => {
    const iconName = type === 'quick' ? 'Quick Link Icon' : 'Program Link Icon';
    const fieldName = type === 'quick' ? 'quickLinkLinkIcon' : 'OurProgramLinkIcon';
    Swal.fire({
      title: `Remove ${iconName}?`, text: `This will remove it.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
    }).then((r) => {
      if (r.isConfirmed) {
        updateFormData(fieldName, '');
        if (type === 'quick' && quickLinkIconInputRef.current) quickLinkIconInputRef.current.value = '';
        if (type === 'program' && programLinkIconInputRef.current) programLinkIconInputRef.current.value = '';
      }
    });
  };

  // Social
  const addSocialLink = (presetIcon = null) => {
    const used = new Set(socialLinks.map((l) => l.iconName));
    const icon = presetIcon || SOCIAL_ICONS.find((i) => !used.has(i.value)) || SOCIAL_ICONS[0];
    updateFormData('socialLinks', [...socialLinks, {
      iconName: icon.value, url: '', name: icon.label, ariaLabel: icon.label,
      hoverColor: `hover:text-[${icon.color}]`,
    }]);
  };

  const removeSocialLink = (index) => {
    const link = socialLinks[index] || {};
    Swal.fire({
      title: 'Remove Social Link?',
      html: `Remove "<strong>${link.name || link.ariaLabel || 'this link'}</strong>"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove', cancelButtonText: 'Cancel',
    }).then((r) => {
      if (r.isConfirmed) updateFormData('socialLinks', socialLinks.filter((_, i) => i !== index));
    });
  };

  const handleSocialIconChange = (index, icon) => {
    updateFormData(`socialLinks.${index}.iconName`, icon.value);
    updateFormData(`socialLinks.${index}.name`, icon.label);
    updateFormData(`socialLinks.${index}.ariaLabel`, icon.label);
    updateFormData(`socialLinks.${index}.hoverColor`, `hover:text-[${icon.color}]`);
  };

  // Nav item selection
  const getDropdownItems = useCallback(() => {
    const items = [];
    const pages = navItems.filter((i) => i.type === 'page');
    const programs = navItems.filter((i) => i.type === 'program');
    if (pages.length) {
      items.push({ type: 'header', label: 'Pages', key: 'header-pages' });
      pages.forEach((p) => items.push({ ...p, key: `page-${p.id}` }));
    }
    if (programs.length) {
      items.push({ type: 'header', label: 'Programs', key: 'header-programs' });
      programs.forEach((p) => items.push({ ...p, key: `program-${p.id}` }));
    }
    return items;
  }, [navItems]);

  const handleItemSelect = useCallback((type, index, itemSlug) => {
    const selectedItem = navItems.find((i) => i.slug === itemSlug);
    if (selectedItem) {
      updateFormData(`${type}.${index}.name`, selectedItem.name);
      updateFormData(`${type}.${index}.url`, selectedItem.url);
    }
  }, [navItems, updateFormData]);

  // Contact / Email / Bottom links
  const addContactNumber = () => {
    updateFormData('contact.numbers', [...(formData.contact?.numbers || []), '']);
  };
  const removeContactNumber = (index) => {
    const nums = formData.contact?.numbers || [];
    if (nums.length <= 1) {
      Swal.fire({
        icon: 'warning', title: 'Cannot Remove',
        text: 'You need at least one contact number.', confirmButtonColor: '#3b82f6'
      });
      return;
    }
    updateFormData('contact.numbers', nums.filter((_, i) => i !== index));
  };
  const updateContactNumber = (index, value) => {
    const nums = [...(formData.contact?.numbers || [])];
    nums[index] = value;
    updateFormData('contact.numbers', nums);
  };

  const addEmailAddress = () => {
    updateFormData('email.addresses', [...(formData.email?.addresses || []), '']);
  };
  const removeEmailAddress = (index) => {
    const addrs = formData.email?.addresses || [];
    if (addrs.length <= 1) {
      Swal.fire({
        icon: 'warning', title: 'Cannot Remove',
        text: 'You need at least one email.', confirmButtonColor: '#3b82f6'
      });
      return;
    }
    updateFormData('email.addresses', addrs.filter((_, i) => i !== index));
  };
  const updateEmailAddress = (index, value) => {
    const addrs = [...(formData.email?.addresses || [])];
    addrs[index] = value;
    updateFormData('email.addresses', addrs);
  };

  const addBottomLink = () => {
    updateFormData('bottomFooter.links', [...(formData.bottomFooter?.links || []), { text: '', url: '/' }]);
  };
  const removeBottomLink = (index) => {
    updateFormData('bottomFooter.links', (formData.bottomFooter?.links || []).filter((_, i) => i !== index));
  };
  const updateBottomLink = (index, field, value) => {
    const links = [...(formData.bottomFooter?.links || [])];
    links[index] = { ...links[index], [field]: value };
    updateFormData('bottomFooter.links', links);
  };

  const isDisabled = isLoading || uploading || loadingItems;
  const dropdownItems = getDropdownItems();
  const hasDuplicateLinks = (items) => {
    if (!items || !Array.isArray(items)) return false;
    const urls = items.map((i) => i.url).filter((u) => u && u.trim() !== '');
    return new Set(urls).size !== urls.length;
  };
  const hasLogo = formData.logo?.src && formData.logo.src.trim().length > 0;

  const socialStats = useMemo(() => {
    const active = socialLinks.filter((l) => l.url && l.url.trim() !== '').length;
    return { total: socialLinks.length, active };
  }, [socialLinks]);

  return (
    <div className="space-y-6 w-full">
      {/* LOGO */}
      <EditorSection icon={FaImage} title="Footer Logo"
        description="Upload your brand logo for the footer" tone="blue">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Logo Image</label>
            <div className="mt-1.5">
              <div
                className={`relative rounded-lg border-2 border-dashed p-4 transition-all ${dragActive ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                  } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag}
                onDragOver={handleDrag} onDrop={handleDrop}>
                <div className="flex min-h-16 items-center gap-3">
                  {hasLogo ? (
                    <div className="flex w-full items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-[#080C14] p-1">
                        <img src={formData.logo.src} alt={formData.logo?.alt || 'Logo'}
                          className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="flex-1 truncate text-xs text-slate-500">Logo uploaded</span>
                      <button type="button" onClick={removeLogo} disabled={isDisabled}
                        className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex w-full items-center gap-3 py-2 text-slate-400">
                      <FaUpload size={16} className="shrink-0" />
                      <span className="text-sm">Drop logo or click to browse</span>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    disabled={isDisabled} />
                </div>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FaSpinner className="animate-spin text-blue-600" size={16} /> Uploading…
                    </div>
                  </div>
                )}
              </div>
              <p className={hintClass}>Max 5MB · JPG, PNG, GIF, WebP, SVG</p>
            </div>
          </div>
          <div>
            <label className={labelClass}>
              Logo Alt Text
              <span className="ml-2 text-xs font-normal text-slate-400">(accessibility)</span>
            </label>
            <input type="text" value={formData.logo?.alt || ''}
              onChange={(e) => updateFormData('logo.alt', e.target.value)}
              placeholder="e.g., Company Logo"
              className={`${inputClass} mt-1.5`} disabled={isDisabled} />
            <p className={hintClass}>Describes the logo for screen readers and SEO</p>
          </div>
        </div>
      </EditorSection>

      {/* DESCRIPTION */}
      <EditorSection icon={FaAddressCard} title="Footer Description"
        description="Brief description of your organization" tone="slate">
        <textarea value={formData.description || ''}
          onChange={(e) => updateFormData('description', e.target.value)}
          rows={3} placeholder="Brief description of your organization…"
          className={`${inputClass} resize-y`} disabled={isDisabled} />
      </EditorSection>

      {/* ADDRESS */}
      <EditorSection icon={FaAddressCard} title="Address"
        description="Physical address of your organization" tone="emerald">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Address Title</label>
            <input type="text" value={formData.address?.title || ''}
              onChange={(e) => updateFormData('address.title', e.target.value)}
              placeholder="e.g., Address"
              className={`${inputClass} mt-1.5`} disabled={isDisabled} />
          </div>
          <div>
            <label className={labelClass}>Address Details</label>
            <input type="text" value={formData.address?.details || ''}
              onChange={(e) => updateFormData('address.details', e.target.value)}
              placeholder="Full address"
              className={`${inputClass} mt-1.5`} disabled={isDisabled} />
          </div>
        </div>
      </EditorSection>

      {/* CONTACT & EMAIL */}
      <EditorSection icon={FaPhone} title="Contact & Email"
        description="Phone numbers and email addresses" tone="cyan">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className={labelClass}>Contact Title</label>
            <input type="text" value={formData.contact?.title || ''}
              onChange={(e) => updateFormData('contact.title', e.target.value)}
              placeholder="e.g., Call us"
              className={`${inputClass} mb-3 mt-1.5`} disabled={isDisabled} />
            <label className={`${labelClass} mb-2`}>Phone Numbers</label>
            <div className="space-y-2">
              {(formData.contact?.numbers || []).map((number, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="text" value={number || ''}
                    onChange={(e) => updateContactNumber(index, e.target.value)}
                    placeholder="Enter phone number"
                    className={inputSmallClass} disabled={isDisabled} />
                  <button type="button" onClick={() => removeContactNumber(index)}
                    className="shrink-0 rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    disabled={isDisabled || (formData.contact?.numbers || []).length <= 1}>
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addContactNumber}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                disabled={isDisabled}>
                <FaPlus size={10} /> Add Phone Number
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Email Title</label>
            <input type="text" value={formData.email?.title || ''}
              onChange={(e) => updateFormData('email.title', e.target.value)}
              placeholder="e.g., Email"
              className={`${inputClass} mb-3 mt-1.5`} disabled={isDisabled} />
            <label className={`${labelClass} mb-2`}>Email Addresses</label>
            <div className="space-y-2">
              {(formData.email?.addresses || []).map((address, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="email" value={address || ''}
                    onChange={(e) => updateEmailAddress(index, e.target.value)}
                    placeholder="Enter email address"
                    className={inputSmallClass} disabled={isDisabled} />
                  <button type="button" onClick={() => removeEmailAddress(index)}
                    className="shrink-0 rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    disabled={isDisabled || (formData.email?.addresses || []).length <= 1}>
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addEmailAddress}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                disabled={isDisabled}>
                <FaPlus size={10} /> Add Email Address
              </button>
            </div>
          </div>
        </div>
      </EditorSection>

      {/* SOCIAL LINKS */}
      <EditorSection
        icon={FaShareAlt}
        title="Social Links"
        description={socialStats.total === 0
          ? 'No social links yet'
          : `${socialStats.active} of ${socialStats.total} active`}
        tone="violet"
        action={
          <button type="button" onClick={() => addSocialLink()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDisabled}>
            <FaPlus size={11} /> Add Social Link
          </button>
        }
      >
        {socialLinks.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FaShareAlt size={20} />
            </div>
            <p className="text-sm font-medium text-slate-600">No social links yet</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Click <span className="font-medium text-blue-600">Add Social Link</span> to start
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {socialLinks.map((link, index) => {
              const iconConfig = SOCIAL_ICONS.find((i) => i.value === link.iconName) || SOCIAL_ICONS[0];
              const IconComponent = iconConfig.icon;
              const hasUrl = link.url && link.url.trim() !== '';
              return (
                <div key={index}
                  className={`rounded-lg border bg-white p-3 transition ${hasUrl ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200'
                    }`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <IconPicker value={link.iconName}
                      onChange={(icon) => handleSocialIconChange(index, icon)}
                      disabled={isDisabled} />
                    <input type="url" value={link.url || ''}
                      onChange={(e) => updateFormData(`socialLinks.${index}.url`, e.target.value)}
                      placeholder={`https://${iconConfig.label.toLowerCase().replace(/[^a-z]/g, '')}.com/yourpage`}
                      className={`${inputSmallClass} min-w-45 flex-1`} disabled={isDisabled} />
                    <input type="text" value={link.ariaLabel || link.name || ''}
                      onChange={(e) => {
                        updateFormData(`socialLinks.${index}.ariaLabel`, e.target.value);
                        updateFormData(`socialLinks.${index}.name`, e.target.value);
                      }}
                      placeholder="Label"
                      className={`${inputSmallClass} min-w-25`} disabled={isDisabled} />
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${hasUrl ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'
                      }`}>
                      {hasUrl ? 'Active' : 'Hidden'}
                    </span>
                    <button type="button" onClick={() => removeSocialLink(index)}
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      disabled={isDisabled} title="Remove">
                      <FaTrash size={12} />
                    </button>
                  </div>
                  {hasUrl && (
                    <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 text-xs">
                      <span className="text-slate-400">Preview:</span>
                      <span className="flex items-center gap-1.5 rounded-md px-2 py-1"
                        style={{ backgroundColor: `${iconConfig.color}10`, color: iconConfig.color }}>
                        <IconComponent size={12} />
                        <span className="text-xs font-medium">{link.name || link.ariaLabel || iconConfig.label}</span>
                      </span>
                      <span className="ml-1 truncate text-slate-400">→ {link.url}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {SOCIAL_ICONS.filter((i) => !socialLinks.some((l) => l.iconName === i.value))
                .slice(0, 8)
                .map((icon) => {
                  const Icon = icon.icon;
                  return (
                    <button key={icon.value} type="button" onClick={() => addSocialLink(icon)}
                      disabled={isDisabled}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                      title={`Add ${icon.label}`}>
                      <span style={{ color: icon.color }}><Icon size={11} /></span>
                      {icon.label}
                      <FaPlus size={7} className="text-slate-400" />
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </EditorSection>

      {/* QUICK LINKS & PROGRAMS */}
      <EditorSection
        icon={FaLink}
        title="Quick Links & Programs"
        description={`${(formData.quickLinks || []).length} quick links · ${(formData.programs || []).length} programs`}
        tone="orange"
      >
        <div className="space-y-6">
          {/* Quick Links */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Quick Links</h4>
              <button type="button"
                onClick={() => addArrayItem('quickLinks', { name: '', url: '/' })}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700"
                disabled={isDisabled}>
                <FaPlus size={9} /> Add Quick Link
              </button>
            </div>
            {hasDuplicateLinks(formData.quickLinks) && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <FaInfoCircle className="mt-0.5 shrink-0 text-amber-500" size={10} />
                Duplicate URLs detected.
              </div>
            )}
            {(formData.quickLinks || []).length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 py-6 text-center">
                <p className="text-sm text-slate-400">No quick links yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(formData.quickLinks || []).map((link, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-slate-300">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-37.5 flex-1">
                        <select
                          value={link.url ? link.url.replace(/^\//, '').split('/').pop() || '' : ''}
                          onChange={(e) => handleItemSelect('quickLinks', index, e.target.value)}
                          className={`${inputSmallClass} bg-white`} disabled={isDisabled}>
                          <option value="">— Select Page/Program —</option>
                          {loadingItems ? (
                            <option value="" disabled>Loading…</option>
                          ) : itemsError ? (
                            <option value="" disabled>Could not load</option>
                          ) : dropdownItems.length === 0 ? (
                            <option value="" disabled>No items available</option>
                          ) : (
                            dropdownItems.map((item) =>
                              item.type === 'header' ? (
                                <option key={item.key} value="" disabled>{item.label}</option>
                              ) : (
                                <option key={item.key} value={item.slug}>{item.name}</option>
                              )
                            )
                          )}
                        </select>
                      </div>
                      <input type="text" value={link.name || ''}
                        onChange={(e) => updateFormData(`quickLinks.${index}.name`, e.target.value)}
                        placeholder="Link Name"
                        className={`${inputSmallClass} min-w-25 flex-1`} disabled={isDisabled} />
                      <input type="text" value={link.url || ''}
                        onChange={(e) => updateFormData(`quickLinks.${index}.url`, e.target.value)}
                        placeholder="URL"
                        className={`${inputSmallClass} min-w-25 flex-1`} disabled={isDisabled} />
                      <button type="button" onClick={() => removeArrayItem('quickLinks', index)}
                        className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        disabled={isDisabled}>
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Programs */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Programs</h4>
              <button type="button"
                onClick={() => addArrayItem('programs', { name: '', url: '/' })}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700"
                disabled={isDisabled}>
                <FaPlus size={9} /> Add Program
              </button>
            </div>
            {hasDuplicateLinks(formData.programs) && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <FaInfoCircle className="mt-0.5 shrink-0 text-amber-500" size={10} />
                Duplicate URLs detected.
              </div>
            )}
            {(formData.programs || []).length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 py-6 text-center">
                <p className="text-sm text-slate-400">No programs yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(formData.programs || []).map((program, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-slate-300">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-37.5 flex-1">
                        <select
                          value={program.url ? program.url.replace(/^\//, '').split('/').pop() || '' : ''}
                          onChange={(e) => handleItemSelect('programs', index, e.target.value)}
                          className={`${inputSmallClass} bg-white`} disabled={isDisabled}>
                          <option value="">— Select Program —</option>
                          {loadingItems ? (
                            <option value="" disabled>Loading…</option>
                          ) : itemsError ? (
                            <option value="" disabled>Could not load</option>
                          ) : dropdownItems.length === 0 ? (
                            <option value="" disabled>No items available</option>
                          ) : (
                            dropdownItems.map((item) =>
                              item.type === 'header' ? (
                                <option key={item.key} value="" disabled>{item.label}</option>
                              ) : (
                                <option key={item.key} value={item.slug}>{item.name}</option>
                              )
                            )
                          )}
                        </select>
                      </div>
                      <input type="text" value={program.name || ''}
                        onChange={(e) => updateFormData(`programs.${index}.name`, e.target.value)}
                        placeholder="Program Name"
                        className={`${inputSmallClass} min-w-25 flex-1`} disabled={isDisabled} />
                      <input type="text" value={program.url || ''}
                        onChange={(e) => updateFormData(`programs.${index}.url`, e.target.value)}
                        placeholder="URL"
                        className={`${inputSmallClass} min-w-25 flex-1`} disabled={isDisabled} />
                      <button type="button" onClick={() => removeArrayItem('programs', index)}
                        className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        disabled={isDisabled}>
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </EditorSection>

      {/* BOTTOM FOOTER */}
      <EditorSection icon={FaCopyright} title="Bottom Footer"
        description="Copyright and legal links" tone="slate">
        <div>
          <label className={labelClass}>Copyright Text</label>
          <input type="text" value={formData.bottomFooter?.copyright || ''}
            onChange={(e) => updateFormData('bottomFooter.copyright', e.target.value)}
            placeholder="© 2024 Your Organization. All rights reserved."
            className={`${inputClass} mt-1.5`} disabled={isDisabled} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className={labelClass}>Legal Links</label>
            <button type="button" onClick={addBottomLink}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700"
              disabled={isDisabled}>
              <FaPlus size={9} /> Add Legal Link
            </button>
          </div>
          {(formData.bottomFooter?.links || []).length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 py-6 text-center">
              <p className="text-sm text-slate-400">No legal links yet</p>
              <p className="mt-0.5 text-xs text-slate-400">Add Privacy Policy, Terms, etc.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(formData.bottomFooter?.links || []).map((link, index) => (
                <div key={index} className="rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-slate-300">
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="text" value={link.text || ''}
                      onChange={(e) => updateBottomLink(index, 'text', e.target.value)}
                      placeholder="Link Text"
                      className={`${inputSmallClass} min-w-25 flex-1`} disabled={isDisabled} />
                    <input type="text" value={link.url || ''}
                      onChange={(e) => updateBottomLink(index, 'url', e.target.value)}
                      placeholder="URL"
                      className={`${inputSmallClass} min-w-25 flex-1`} disabled={isDisabled} />
                    <button type="button" onClick={() => removeBottomLink(index)}
                      className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      disabled={isDisabled}>
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </EditorSection>

      {/* LINK ICONS */}
      <EditorSection icon={FaLink} title="Link Icons"
        description="Small icons shown next to links (optional)" tone="violet">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              type: 'quick', label: 'Quick Link Icon', ref: quickLinkIconInputRef,
              value: formData.quickLinkLinkIcon
            },
            {
              type: 'program', label: 'Program Link Icon', ref: programLinkIconInputRef,
              value: formData.OurProgramLinkIcon
            },
          ].map(({ type, label, ref, value }) => (
            <div key={type}>
              <label className={labelClass}>
                {label}
                <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative mt-1.5">
                <div
                  className={`relative rounded-lg border-2 border-dashed p-3 transition-all ${uploading ? 'pointer-events-none opacity-60' : ''
                    } border-slate-200 bg-slate-50/40 hover:border-slate-300`}>
                  <div className="flex min-h-14 items-center gap-3">
                    {value ? (
                      <div className="flex w-full items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-[#080C14] p-1">
                          <img src={value} alt={label} className="max-h-full max-w-full object-contain" />
                        </div>
                        <span className="flex-1 truncate text-xs text-slate-500">Icon uploaded</span>
                        <button type="button" onClick={() => removeLinkIcon(type)}
                          className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          disabled={isDisabled}>
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex w-full items-center gap-3 py-2 text-slate-400">
                        <FaUpload size={14} className="shrink-0" />
                        <span className="text-sm">Drop icon or click to browse</span>
                      </div>
                    )}
                    <input ref={ref} type="file" accept="image/*"
                      onChange={(e) => handleLinkIconFileSelect(e, type)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      disabled={isDisabled} />
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FaSpinner className="animate-spin text-blue-600" size={14} /> Uploading…
                      </div>
                    </div>
                  )}
                </div>
                <p className={hintClass}>Max 5MB · JPG, PNG, GIF, WebP, SVG</p>
              </div>
            </div>
          ))}
        </div>
      </EditorSection>
    </div>
  );
}