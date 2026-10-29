// resources/js/pages/Backend/CMS/Shared/Modals/TopBarEditor.jsx
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  FiFacebook, FiInstagram, FiLinkedin, FiYoutube, FiGithub,
  FiSearch, FiChevronDown, FiCheck,
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
import EditorSection from '../components/EditorSection';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 disabled:bg-slate-50 disabled:text-slate-500';
const inputSmallClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 disabled:bg-slate-50 disabled:text-slate-500';

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

// ─── Icon picker ───
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
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="flex w-full min-w-45 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${selected.color}15`, color: selected.color }}
        >
          <SelectedIcon size={15} />
        </span>
        <span className="flex-1 truncate text-sm text-slate-700">{selected.label}</span>
        <FiChevronDown
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          size={15}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <FiSearch
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={12}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons…"
                autoFocus
                className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No icons found</p>
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
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${icon.color}15`, color: icon.color }}
                    >
                      <Icon size={15} />
                    </span>
                    <span
                      className={`flex-1 text-sm ${isActive ? 'font-medium text-blue-700' : 'text-slate-700'
                        }`}
                    >
                      {icon.label}
                    </span>
                    {isActive && <FiCheck className="text-blue-600" size={13} />}
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

// ─── Main ───
export default function TopBarEditor({
  formData, updateFormData, addArrayItem, removeArrayItem, isLoading = false,
}) {
  const isDisabled = isLoading;
  const socialLinks = useMemo(() => formData.socialLinks || [], [formData.socialLinks]);

  const handleAddSocialLink = () => {
    const used = new Set(socialLinks.map((l) => l.iconName));
    const available = SOCIAL_ICONS.find((i) => !used.has(i.value)) || SOCIAL_ICONS[0];
    addArrayItem('socialLinks', {
      iconName: available.value, url: '', name: available.label,
      hoverColor: `hover:text-[${available.color}]`,
    });
    Swal.fire({
      icon: 'success', title: 'Added!',
      text: `New ${available.label} link added.`,
      timer: 1600, showConfirmButton: false,
      toast: true, position: 'top-end',
    });
  };

  const handleRemoveSocialLink = (index) => {
    const link = socialLinks[index] || {};
    Swal.fire({
      title: 'Remove Social Link?',
      html: `Remove "<strong>${link.name || 'this link'}</strong>"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove', cancelButtonText: 'Cancel',
    }).then((r) => { if (r.isConfirmed) removeArrayItem('socialLinks', index); });
  };

  const handleIconChange = (index, icon) => {
    updateFormData(`socialLinks.${index}.iconName`, icon.value);
    updateFormData(`socialLinks.${index}.name`, icon.label);
    updateFormData(`socialLinks.${index}.hoverColor`, `hover:text-[${icon.color}]`);
  };

  const socialStats = useMemo(() => {
    const active = socialLinks.filter((l) => l.url && l.url.trim() !== '').length;
    return { total: socialLinks.length, active };
  }, [socialLinks]);

  return (
    <div className="space-y-6 w-full">
      {/* CONTACT INFO */}
      <EditorSection
        icon={FaInfoCircle}
        title="Contact Information"
        description="This info appears in the top bar of your website"
        tone="blue"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              key: 'email', label: 'Email Address', Icon: FaEnvelope,
              placeholder: 'admin@example.com', type: 'email',
              hint: 'Displayed as a clickable mailto link'
            },
            {
              key: 'phone', label: 'Phone Number', Icon: FaPhone,
              placeholder: '+880 1234 567890', type: 'tel',
              hint: 'Displayed as a clickable tel link'
            },
            {
              key: 'hours', label: 'Business Hours', Icon: FaClock,
              placeholder: 'Mon–Fri: 9AM–5PM', type: 'text',
              hint: 'Shown next to the clock icon'
            },
          ].map(({ key, label, Icon, placeholder, type, hint }) => (
            <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Icon className="text-slate-400" size={12} /> {label}
              </label>
              <input
                type={type}
                value={formData.contactInfo?.[key]?.text || ''}
                onChange={(e) => updateFormData(`contactInfo.${key}.text`, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
                disabled={isDisabled}
              />
              <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
            </div>
          ))}
        </div>
      </EditorSection>

      {/* LANGUAGES */}
      <EditorSection
        icon={FaGlobe}
        title="Language Selector"
        description="Only languages with codes 'us' and 'bd' will appear in the top bar"
        tone="violet"
        action={
          <button type="button"
            onClick={() => addArrayItem('languages', { code: '', name: '' })}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDisabled}>
            <FaPlus size={11} /> Add Language
          </button>
        }
      >
        {(!formData.languages || formData.languages.length === 0) ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FaGlobe size={20} />
            </div>
            <p className="text-sm font-medium text-slate-600">No languages yet</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Click <span className="font-medium text-blue-600">Add Language</span> to start
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {formData.languages.map((lang, index) => {
              const isValid = lang.code &&
                ['us', 'bd', 'gb', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'cn', 'jp', 'kr', 'in']
                  .includes(lang.code?.toLowerCase());
              const displayName = lang.name || lang.code || '??';
              const avatar = displayName.slice(0, 2).toUpperCase();
              return (
                <div key={index}
                  className={`rounded-lg border bg-white p-3 transition ${isValid ? 'border-slate-200 hover:border-slate-300' : 'border-amber-200'
                    }`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${isValid ? 'bg-blue-600' : 'bg-slate-400'
                      }`} title={displayName}>
                      {avatar}
                    </div>
                    <input type="text" value={lang.code || ''}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase();
                        updateFormData(`languages.${index}.code`, val);
                        const known = {
                          us: 'English (US)', bd: 'Bengali (BD)', gb: 'English (UK)',
                          de: 'German', fr: 'French', es: 'Spanish', it: 'Italian',
                          pt: 'Portuguese', ru: 'Russian', cn: 'Chinese',
                          jp: 'Japanese', kr: 'Korean', in: 'Hindi',
                        };
                        if (known[val] && !lang.name) {
                          updateFormData(`languages.${index}.name`, known[val]);
                        }
                      }}
                      placeholder="Code"
                      className={`${inputSmallClass} w-20 uppercase`} disabled={isDisabled} />
                    <input type="text" value={lang.name || ''}
                      onChange={(e) => updateFormData(`languages.${index}.name`, e.target.value)}
                      placeholder="e.g., English (US)"
                      className={`${inputSmallClass} min-w-37.5 flex-1`} disabled={isDisabled} />
                    <div className="ml-auto flex items-center gap-2">
                      {lang.code && (
                        <span className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${isValid
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : 'bg-amber-50 text-amber-700 ring-amber-200'
                          }`}>
                          {isValid ? 'Will show' : 'Not shown'}
                        </span>
                      )}
                      <button type="button"
                        onClick={() => {
                          Swal.fire({
                            title: 'Remove Language?',
                            html: `Remove "<strong>${lang.name || 'this language'}</strong>"?`,
                            icon: 'warning', showCancelButton: true,
                            confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
                            confirmButtonText: 'Yes, remove', cancelButtonText: 'Cancel',
                          }).then((r) => r.isConfirmed && removeArrayItem('languages', index));
                        }}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        disabled={isDisabled} title="Remove">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                  {lang.code && !isValid && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                      <FaInfoCircle size={10} />
                      Only <strong>us</strong> and <strong>bd</strong> appear. Others are stored but hidden.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </EditorSection>

      {/* SOCIAL LINKS */}
      <EditorSection
        icon={FaShareAlt}
        title="Social Links"
        description={socialStats.total === 0
          ? 'No social links yet'
          : `${socialStats.active} of ${socialStats.total} active`}
        tone="cyan"
        action={
          <button type="button" onClick={handleAddSocialLink}
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
                    <FaGripVertical className="shrink-0 cursor-move text-slate-300" size={12} />
                    <IconPicker value={link.iconName}
                      onChange={(icon) => handleIconChange(index, icon)}
                      disabled={isDisabled} />
                    <input type="url" value={link.url || ''}
                      onChange={(e) => updateFormData(`socialLinks.${index}.url`, e.target.value)}
                      placeholder={`https://${iconConfig.label.toLowerCase().replace(/[^a-z]/g, '')}.com/yourpage`}
                      className={`${inputSmallClass} min-w-45 flex-1`} disabled={isDisabled} />
                    <input type="text" value={link.name || ''}
                      onChange={(e) => updateFormData(`socialLinks.${index}.name`, e.target.value)}
                      placeholder="Label"
                      className={`${inputSmallClass} min-w-25`} disabled={isDisabled} />
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${hasUrl
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-slate-100 text-slate-500 ring-slate-200'
                      }`}>
                      {hasUrl ? 'Active' : 'Hidden'}
                    </span>
                    <button type="button" onClick={() => handleRemoveSocialLink(index)}
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
                        <span className="text-xs font-medium">{link.name || iconConfig.label}</span>
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
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Quick add
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SOCIAL_ICONS.filter((i) => !socialLinks.some((l) => l.iconName === i.value))
                .slice(0, 8)
                .map((icon) => {
                  const Icon = icon.icon;
                  return (
                    <button key={icon.value} type="button"
                      onClick={() => addArrayItem('socialLinks', {
                        iconName: icon.value, url: '', name: icon.label,
                        hoverColor: `hover:text-[${icon.color}]`,
                      })}
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
    </div>
  );
}