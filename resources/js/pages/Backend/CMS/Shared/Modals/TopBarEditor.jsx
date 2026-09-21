// resources/js/pages/Backend/CMS/Shared/Modals/TopBarEditor.jsx

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  FiFacebook, FiInstagram, FiLinkedin, FiYoutube, FiGithub, FiSearch, FiChevronDown, FiCheck,
} from 'react-icons/fi';
import {
  FaPlus, FaTrash, FaGlobe, FaPhone, FaEnvelope, FaClock,
  FaShareAlt, FaInfoCircle, FaGripVertical,
} from 'react-icons/fa';
import {
  FaXTwitter, FaTiktok, FaPinterest, FaWhatsapp, FaTelegram,
  FaDiscord, FaReddit, FaSnapchat, FaThreads,
} from 'react-icons/fa6';
import Swal from 'sweetalert2';

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
// REUSABLE: SEARCHABLE ICON PICKER
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
          {/* Search */}
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

          {/* List */}
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
                    className={`flex items-center gap-3 w-full px-3 py-2 text-left transition ${isActive ? 'bg-pink-50' : 'hover:bg-gray-50'
                      }`}
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
// MAIN EDITOR
// ============================================
export default function TopBarEditor({
  formData,
  updateFormData,
  addArrayItem,
  removeArrayItem,
  isLoading = false,
}) {
  const [uploading] = useState({});
  const isUploading = Object.values(uploading).some(s => s === true);
  const isDisabled = isLoading || isUploading;

  // ✅ Memoized so the reference stays stable across renders when the
  //    underlying `formData.socialLinks` value hasn't changed.
  //    This prevents `socialStats` (useMemo) from recomputing on every render
  //    and removes the exhaustive-deps warning.
  const socialLinks = useMemo(
    () => formData.socialLinks || [],
    [formData.socialLinks]
  );

  // ---------------------------------------------
  // SOCIAL LINK HANDLERS
  // ---------------------------------------------
  const handleAddSocialLink = () => {
    // Pick first icon not yet used, else default to Facebook
    const used = new Set(socialLinks.map(l => l.iconName));
    const available = SOCIAL_ICONS.find(i => !used.has(i.value)) || SOCIAL_ICONS[0];

    addArrayItem('socialLinks', {
      iconName: available.value,
      url: '',
      name: available.label,
      hoverColor: `hover:text-[${available.color}]`,
    });

    Swal.fire({
      icon: 'success',
      title: 'Added!',
      text: `New ${available.label} link added. Fill in the URL to make it visible.`,
      timer: 1600,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    });
  };

  const handleRemoveSocialLink = (index) => {
    const link = socialLinks[index] || {};
    Swal.fire({
      title: 'Remove Social Link?',
      html: `Remove "<strong>${link.name || 'this link'}</strong>" from social links?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    }).then((r) => {
      if (r.isConfirmed) removeArrayItem('socialLinks', index);
    });
  };

  const handleIconChange = (index, icon) => {
    updateFormData(`socialLinks.${index}.iconName`, icon.value);
    updateFormData(`socialLinks.${index}.name`, icon.label);
    updateFormData(`socialLinks.${index}.hoverColor`, `hover:text-[${icon.color}]`);
  };

  // ---------------------------------------------
  // STATS
  // ---------------------------------------------
  const socialStats = useMemo(() => {
    const active = socialLinks.filter(l => l.url && l.url.trim() !== '').length;
    return { total: socialLinks.length, active };
  }, [socialLinks]);

  return (
    <div className="space-y-8 w-full">

      {/* ============================================
          CONTACT INFO
          ============================================ */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaInfoCircle className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Contact Information</h3>
            <p className="text-xs text-gray-500">This info appears in the top bar of your website</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-blue-300 transition">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FaEnvelope className="text-blue-500" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.contactInfo?.email?.text || ''}
              onChange={(e) => updateFormData('contactInfo.email.text', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              placeholder="admin@example.com"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1.5">Displayed as a clickable mailto link</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-blue-300 transition">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FaPhone className="text-green-500" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.contactInfo?.phone?.text || ''}
              onChange={(e) => updateFormData('contactInfo.phone.text', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              placeholder="+880 1234 567890"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1.5">Displayed as a clickable tel link</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-blue-300 transition">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FaClock className="text-purple-500" />
              Business Hours
            </label>
            <input
              type="text"
              value={formData.contactInfo?.hours?.text || ''}
              onChange={(e) => updateFormData('contactInfo.hours.text', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              placeholder="Mon - Fri: 9:00 AM - 5:00 PM"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1.5">Shown next to the clock icon</p>
          </div>
        </div>
      </div>

      {/* ============================================
          LANGUAGES
          ============================================ */}
      <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaGlobe className="text-purple-600 text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Language Selector</h3>
              <p className="text-xs text-gray-500">Only languages with codes 'us' and 'bd' will appear</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => addArrayItem('languages', { code: '', name: '' })}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisabled}
          >
            <FaPlus size={14} />
            Add Language
          </button>
        </div>

        {(!formData.languages || formData.languages.length === 0) ? (
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
            <FaGlobe className="text-gray-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No languages added yet</p>
            <p className="text-xs text-gray-400">Click "Add Language" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.languages.map((lang, index) => {
              const isCodeValid = lang.code && ['us', 'bd', 'gb', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'cn', 'jp', 'kr', 'in'].includes(lang.code?.toLowerCase());
              const displayName = lang.name || lang.code || '??';
              const avatarLetters = displayName.slice(0, 2).toUpperCase();

              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-4 shadow-sm border transition ${isCodeValid ? 'border-green-200 hover:border-green-300' : 'border-yellow-200 hover:border-yellow-300'}`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${isCodeValid ? 'bg-purple-500' : 'bg-gray-400'}`}
                      title={displayName}
                    >
                      {avatarLetters}
                    </div>

                    <input
                      type="text"
                      value={lang.code || ''}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase();
                        updateFormData(`languages.${index}.code`, val);
                        const knownNames = {
                          us: 'English (US)', bd: 'Bengali (BD)', gb: 'English (UK)',
                          de: 'German', fr: 'French', es: 'Spanish', it: 'Italian',
                          pt: 'Portuguese', ru: 'Russian', cn: 'Chinese',
                          jp: 'Japanese', kr: 'Korean', in: 'Hindi',
                        };
                        if (knownNames[val] && !lang.name) {
                          updateFormData(`languages.${index}.name`, knownNames[val]);
                        }
                      }}
                      placeholder="Code"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none text-sm uppercase"
                      disabled={isDisabled}
                    />

                    <div className="flex-1 min-w-37.5">
                      <input
                        type="text"
                        value={lang.name || ''}
                        onChange={(e) => updateFormData(`languages.${index}.name`, e.target.value)}
                        placeholder="e.g., English (US)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none"
                        disabled={isDisabled}
                      />
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                      {lang.code && (
                        <span className={`text-xs px-2 py-1 rounded-full ${isCodeValid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {isCodeValid ? '✅ Will show' : '⚠️ Not shown'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          Swal.fire({
                            title: 'Remove Language?',
                            html: `Remove "<strong>${lang.name || 'this language'}</strong>"?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#dc2626',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'Yes, remove',
                            cancelButtonText: 'Cancel',
                          }).then(r => r.isConfirmed && removeArrayItem('languages', index));
                        }}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        disabled={isDisabled}
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>

                  {lang.code && !isCodeValid && (
                    <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                      <span>💡</span>
                      Only <strong>us</strong> and <strong>bd</strong> will appear. Others are stored but not shown.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================
          SOCIAL LINKS
          ============================================ */}
      <div className="bg-linear-to-r from-cyan-50 to-teal-50 rounded-xl p-6 border border-cyan-100">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <FaShareAlt className="text-cyan-600 text-lg" />
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
            onClick={handleAddSocialLink}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-xs text-gray-400 mb-4">Add Facebook, Twitter/X, LinkedIn, YouTube and more</p>
            <button
              type="button"
              onClick={handleAddSocialLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm"
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
                    {/* Drag handle (visual only) */}
                    <FaGripVertical className="text-gray-300 shrink-0 cursor-move" size={14} />

                    {/* Icon Picker */}
                    <IconPicker
                      value={link.iconName}
                      onChange={(icon) => handleIconChange(index, icon)}
                      disabled={isDisabled}
                    />

                    {/* URL */}
                    <div className="flex-1 min-w-45">
                      <input
                        type="url"
                        value={link.url || ''}
                        onChange={(e) => updateFormData(`socialLinks.${index}.url`, e.target.value)}
                        placeholder={`https://${iconConfig.label.toLowerCase().replace(/[^a-z]/g, '')}.com/yourpage`}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none ${hasUrl ? 'border-green-300' : 'border-gray-300'}`}
                        disabled={isDisabled}
                      />
                    </div>

                    {/* Label */}
                    <div className="min-w-25">
                      <input
                        type="text"
                        value={link.name || ''}
                        onChange={(e) => updateFormData(`socialLinks.${index}.name`, e.target.value)}
                        placeholder="Label"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none text-sm"
                        disabled={isDisabled}
                      />
                    </div>

                    {/* Status + Delete */}
                    <div className="flex items-center gap-3 ml-auto">
                      {hasUrl ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full whitespace-nowrap">🔗 Active</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full whitespace-nowrap">⏸ Hidden</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialLink(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        disabled={isDisabled}
                        title="Remove link"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Live preview */}
                  {hasUrl && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm">
                      <span className="text-xs text-gray-400">Preview:</span>
                      <span
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                        style={{ backgroundColor: `${iconConfig.color}10`, color: iconConfig.color }}
                      >
                        <IconComponent size={14} />
                        <span className="text-xs font-medium">{link.name || iconConfig.label}</span>
                      </span>
                      <span className="text-xs text-gray-400 truncate ml-1">→ {link.url}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick-add chips for unused icons */}
        {socialLinks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-cyan-200/60">
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
                      onClick={() => {
                        addArrayItem('socialLinks', {
                          iconName: icon.value,
                          url: '',
                          name: icon.label,
                          hoverColor: `hover:text-[${icon.color}]`,
                        });
                      }}
                      disabled={isDisabled}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 bg-white hover:border-cyan-400 hover:bg-cyan-50 transition text-xs text-gray-600 disabled:opacity-50"
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
    </div>
  );
}