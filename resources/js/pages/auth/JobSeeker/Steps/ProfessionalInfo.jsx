// pages/auth/Steps/ProfessionalInfo.jsx
import { useState, useRef, useEffect } from 'react';
import {
  FaBriefcase, FaPlus, FaTimes, FaLink, FaCheck,
  FaLinkedin, FaGithub, FaTwitter, FaFacebook, FaYoutube,
  FaMedium, FaDev, FaStackOverflow, FaGlobe,
} from 'react-icons/fa';
import { MdWorkOutline } from 'react-icons/md';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10', border: 'border-[#0A66C2]/20', placeholder: 'https://linkedin.com/in/username' },
  { id: 'github', name: 'GitHub', icon: FaGithub, color: 'text-gray-900', bg: 'bg-gray-900/10', border: 'border-gray-900/20', placeholder: 'https://github.com/username' },
  { id: 'twitter', name: 'Twitter', icon: FaTwitter, color: 'text-[#1DA1F2]', bg: 'bg-[#1DA1F2]/10', border: 'border-[#1DA1F2]/20', placeholder: 'https://twitter.com/username' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10', border: 'border-[#1877F2]/20', placeholder: 'https://facebook.com/username' },
  { id: 'youtube', name: 'YouTube', icon: FaYoutube, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10', border: 'border-[#FF0000]/20', placeholder: 'https://youtube.com/@username' },
  { id: 'medium', name: 'Medium', icon: FaMedium, color: 'text-gray-900', bg: 'bg-gray-900/10', border: 'border-gray-900/20', placeholder: 'https://medium.com/@username' },
  { id: 'devto', name: 'Dev.to', icon: FaDev, color: 'text-gray-900', bg: 'bg-gray-900/10', border: 'border-gray-900/20', placeholder: 'https://dev.to/username' },
  { id: 'stackoverflow', name: 'Stack Overflow', icon: FaStackOverflow, color: 'text-[#F48024]', bg: 'bg-[#F48024]/10', border: 'border-[#F48024]/20', placeholder: 'https://stackoverflow.com/users/…' },
  { id: 'portfolio', name: 'Portfolio', icon: FaGlobe, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', placeholder: 'https://your-site.com' },
];

const ProfessionalInfo = ({ data, setData }) => {
  const [openPicker, setOpenPicker] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const urlInputRef = useRef(null);
  const pickerRef = useRef(null);

  const socialLinks = data.social_links || {};
  const inputCls = "w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1.5";

  // Close picker on outside click
  useEffect(() => {
    if (!openPicker) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpenPicker(false);
        setSelectedPlatform('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openPicker]);

  // Focus URL input once a platform is picked
  useEffect(() => {
    if (selectedPlatform && urlInputRef.current) urlInputRef.current.focus();
  }, [selectedPlatform]);

  const addSocialLink = () => {
    if (!selectedPlatform || !socialUrl.trim()) return;
    setData('social_links', { ...socialLinks, [selectedPlatform]: socialUrl.trim() });
    setSelectedPlatform('');
    setSocialUrl('');
    setOpenPicker(false);
  };

  const removeSocialLink = (id) => {
    const next = { ...socialLinks };
    delete next[id];
    setData('social_links', next);
  };

  const getPlatform = (id) => PLATFORMS.find((p) => p.id === id) || { name: id, icon: FaLink, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };

  const selectedMeta = selectedPlatform ? PLATFORMS.find((p) => p.id === selectedPlatform) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2 bg-blue-50 rounded-lg">
          <FaBriefcase className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">Professional Information</h2>
          <p className="text-xs text-gray-500">All fields are optional</p>
        </div>
      </div>

      {/* Two field grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Years of experience</label>
          <select
            value={data.experience_years ?? ''}
            onChange={(e) => setData('experience_years', e.target.value)}
            className={inputCls}
          >
            <option value="">Select</option>
            {[...Array(31).keys()].map((y) => (
              <option key={y} value={y}>
                {y === 0 ? 'Fresher' : `${y} year${y > 1 ? 's' : ''}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>
            <span className="inline-flex items-center gap-1.5">
              <MdWorkOutline className="h-3.5 w-3.5 text-gray-400" />
              Current job title
            </span>
          </label>
          <input
            type="text"
            value={data.current_job_title || ''}
            onChange={(e) => setData('current_job_title', e.target.value)}
            className={inputCls}
            placeholder="e.g., Software Engineer"
          />
        </div>
      </div>

      {/* Social links */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-gray-600 inline-flex items-center gap-1.5">
            <FaLink className="h-3 w-3 text-gray-400" />
            Social links
          </label>
          {Object.keys(socialLinks).length > 0 && (
            <span className="text-xs text-gray-400 tabular-nums">
              {Object.keys(socialLinks).length} added
            </span>
          )}
        </div>

        {/* Chips of added links */}
        {Object.keys(socialLinks).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(socialLinks).map(([id, url]) => {
              const p = getPlatform(id);
              const Icon = p.icon;
              return (
                <div
                  key={id}
                  className={`group inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1 ${p.bg} border ${p.border} rounded-full text-xs transition`}
                >
                  <span className={`flex items-center justify-center h-5 w-5 rounded-full bg-white ${p.color}`}>
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-gray-900 max-w-35 truncate font-medium"
                  >
                    {p.name}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeSocialLink(id)}
                    className="ml-0.5 p-0.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-full transition"
                    aria-label={`Remove ${p.name}`}
                  >
                    <FaTimes className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add link trigger */}
        {!openPicker ? (
          <button
            type="button"
            onClick={() => setOpenPicker(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 transition"
          >
            <FaPlus className="h-3 w-3" />
            Add social link
          </button>
        ) : (
          <div ref={pickerRef} className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
            {/* Platform grid */}
            {!selectedPlatform ? (
              <div className="p-3">
                <p className="text-[11px] font-medium text-gray-500 mb-2">
                  Choose a platform
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const already = !!socialLinks[p.id];
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={already}
                        onClick={() => setSelectedPlatform(p.id)}
                        className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs font-medium transition ${already
                            ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            : `border-gray-200 text-gray-700 hover:${p.bg} hover:${p.border} hover:-translate-y-px`
                          }`}
                        title={already ? 'Already added' : p.name}
                      >
                        <Icon className={`h-4 w-4 ${already ? 'text-gray-300' : p.color}`} />
                        <span className="truncate max-w-full">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenPicker(false)}
                  className="mt-2 w-full text-center text-[11px] text-gray-400 hover:text-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              /* URL input step */
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center justify-center h-7 w-7 rounded-lg ${selectedMeta.bg} ${selectedMeta.color}`}>
                    <selectedMeta.icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">{selectedMeta.name}</p>
                    <p className="text-[10px] text-gray-400">Paste your profile URL</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform('')}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition"
                  >
                    Change
                  </button>
                </div>

                <input
                  ref={urlInputRef}
                  type="url"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addSocialLink(); }
                    if (e.key === 'Escape') { setSelectedPlatform(''); setSocialUrl(''); }
                  }}
                  placeholder={selectedMeta.placeholder}
                  className={inputCls}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addSocialLink}
                    disabled={!socialUrl.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                  >
                    <FaCheck className="h-2.5 w-2.5" />
                    Save link
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedPlatform(''); setSocialUrl(''); setOpenPicker(false); }}
                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty hint */}
        {Object.keys(socialLinks).length === 0 && !openPicker && (
          <p className="text-[11px] text-gray-400 text-center mt-3">
            Add LinkedIn, GitHub, portfolio or any other profile
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfessionalInfo;