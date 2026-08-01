// resources/js/pages/Backend/CMS/Shared/Modals/TopBarEditor.jsx

// React
import { useState } from 'react';

// React Icons
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiGithub, FiExternalLink } from 'react-icons/fi';
import { FaPlus, FaTrash, FaGlobe, FaPhone, FaEnvelope, FaClock, FaShareAlt, FaInfoCircle } from 'react-icons/fa';

// SweetAlert2
import Swal from 'sweetalert2';

// Available social icons with their display names
const SOCIAL_ICONS = [
  { value: 'FaFacebook', label: 'Facebook', icon: FiFacebook, color: '#1877F2' },
  { value: 'FaTwitter', label: 'Twitter', icon: FiTwitter, color: '#1DA1F2' },
  { value: 'FaInstagram', label: 'Instagram', icon: FiInstagram, color: '#E4405F' },
  { value: 'FaLinkedin', label: 'LinkedIn', icon: FiLinkedin, color: '#0A66C2' },
  { value: 'FaYoutube', label: 'YouTube', icon: FiYoutube, color: '#FF0000' },
  { value: 'FaGithub', label: 'GitHub', icon: FiGithub, color: '#181717' },
];

export default function TopBarEditor({
  formData,
  updateFormData,
  addArrayItem,
  removeArrayItem,
  isLoading = false,
  setIsLoading = null
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState({});
  const isUploading = Object.values(uploading).some(status => status === true);

  // ============================================
  // FLAG UPLOAD HANDLERS
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

  const handleFlagDrop = (e, langIndex) => {
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

      setUploading(prev => ({ ...prev, [`flag_${langIndex}`]: true }));
      if (setIsLoading) setIsLoading(true);

      const reader = new FileReader();
      reader.onload = (event) => {
        updateFormData(`languages.${langIndex}.flag`, event.target.result);
        setUploading(prev => ({ ...prev, [`flag_${langIndex}`]: false }));
        if (setIsLoading) setIsLoading(false);
      };
      reader.onerror = () => {
        setUploading(prev => ({ ...prev, [`flag_${langIndex}`]: false }));
        if (setIsLoading) setIsLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to read the image file',
          confirmButtonColor: '#3b82f6',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFlagFileSelect = (e, langIndex) => {
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

    setUploading(prev => ({ ...prev, [`flag_${langIndex}`]: true }));
    if (setIsLoading) setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      updateFormData(`languages.${langIndex}.flag`, event.target.result);
      setUploading(prev => ({ ...prev, [`flag_${langIndex}`]: false }));
      if (setIsLoading) setIsLoading(false);
    };
    reader.onerror = () => {
      setUploading(prev => ({ ...prev, [`flag_${langIndex}`]: false }));
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

  const removeFlag = (index) => {
    Swal.fire({
      title: 'Remove Flag?',
      text: 'This will remove the flag image for this language.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it',
    }).then((result) => {
      if (result.isConfirmed) {
        updateFormData(`languages.${index}.flag`, '');
      }
    });
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-8 w-full">

      {/* ============================================
          CONTACT INFO SECTION (Text Only - No Images)
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
          {/* Email */}
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
              disabled={isLoading || isUploading}
            />
            <p className="text-xs text-gray-400 mt-1.5">Displayed as a clickable mailto link</p>
          </div>

          {/* Phone */}
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
              disabled={isLoading || isUploading}
            />
            <p className="text-xs text-gray-400 mt-1.5">Displayed as a clickable tel link</p>
          </div>

          {/* Hours */}
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
              disabled={isLoading || isUploading}
            />
            <p className="text-xs text-gray-400 mt-1.5">Shown next to the clock icon</p>
          </div>
        </div>
      </div>

      {/* ============================================
          LANGUAGES SECTION (With Flag Upload)
          ============================================ */}
      <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaGlobe className="text-purple-600 text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Language Selector</h3>
              <p className="text-xs text-gray-500">Only languages with codes 'us' and 'bd' will appear in the selector</p>
            </div>
          </div>
          <button
            type="button"
            disabled={true}
            // disabled={isLoading || isUploading}
            onClick={() => addArrayItem('languages', { code: '', name: '', flag: '' })}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              const hasFlag = lang.flag && lang.flag.trim().length > 0;

              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-4 shadow-sm border transition ${isCodeValid ? 'border-green-200 hover:border-green-300' : 'border-yellow-200 hover:border-yellow-300'
                    }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Flag Upload */}
                    <div className="relative">
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={(e) => handleFlagDrop(e, index)}
                      >
                        <div className="flex items-center gap-2 min-h-10">
                          {hasFlag ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={lang.flag}
                                alt={lang.name || 'Flag'}
                                className="w-10 h-7 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => removeFlag(index)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition shrink-0"
                                title="Remove flag"
                                disabled={isLoading || isUploading}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400 py-1 px-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs">Drop flag</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFlagFileSelect(e, index)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isLoading || isUploading}
                          />
                        </div>
                        {uploading[`flag_${index}`] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Code */}
                    <div className="min-w-20">
                      <input
                        type="text"
                        value={lang.code || ''}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase();
                          updateFormData(`languages.${index}.code`, val);
                          // Auto-populate name if it matches a known language
                          const knownNames = {
                            us: 'English (US)',
                            bd: 'Bengali (BD)',
                            gb: 'English (UK)',
                            de: 'German',
                            fr: 'French',
                            es: 'Spanish',
                            it: 'Italian',
                            pt: 'Portuguese',
                            ru: 'Russian',
                            cn: 'Chinese',
                            jp: 'Japanese',
                            kr: 'Korean',
                            in: 'Hindi',
                          };
                          if (knownNames[val] && !lang.name) {
                            updateFormData(`languages.${index}.name`, knownNames[val]);
                          }
                        }}
                        placeholder="Code"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none text-sm uppercase"
                        disabled={isLoading || isUploading}
                      />
                    </div>

                    {/* Language Name */}
                    <div className="flex-1 min-w-37.5">
                      <input
                        type="text"
                        value={lang.name || ''}
                        onChange={(e) => updateFormData(`languages.${index}.name`, e.target.value)}
                        placeholder="e.g., English (US)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none"
                        disabled={isLoading || isUploading}
                      />
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-4 ml-auto">
                      {hasFlag && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          📷 Flag
                        </span>
                      )}
                      {lang.code && (
                        <span className={`text-xs px-2 py-1 rounded-full ${isCodeValid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {isCodeValid ? '✅ Will show' : '⚠️ Not shown'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          Swal.fire({
                            title: 'Remove Language?',
                            html: `Remove "<strong>${lang.name || 'this language'}</strong>" from the selector?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#dc2626',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'Yes, remove',
                            cancelButtonText: 'Cancel',
                          }).then((result) => {
                            if (result.isConfirmed) {
                              removeArrayItem('languages', index);
                            }
                          });
                        }}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        disabled={isLoading || isUploading}
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Help text */}
                  {lang.code && !isCodeValid && (
                    <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                      <span>💡</span>
                      Only <strong>us</strong> and <strong>bd</strong> will appear in the selector. Other codes are stored but not shown.
                    </p>
                  )}
                  {!hasFlag && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <span>📷</span>
                      Upload a flag image for this language (optional)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================
          SOCIAL LINKS SECTION (Unchanged)
          ============================================ */}
      <div className="bg-linear-to-r from-cyan-50 to-teal-50 rounded-xl p-6 border border-cyan-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <FaShareAlt className="text-cyan-600 text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Social Links</h3>
              <p className="text-xs text-gray-500">Leave URL empty to hide the social icon</p>
            </div>
          </div>
          {/* <button
            type="button"
            onClick={() => addArrayItem('socialLinks', {
              iconName: 'FaFacebook',
              url: '',
              name: 'Facebook',
              hoverColor: 'hover:text-[#1877F2]'
            })}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={true}
          // disabled={isLoading || isUploading}
          >
            <FaPlus size={14} />
            Add Social Link
          </button> */}
        </div>

        {(!formData.socialLinks || formData.socialLinks.length === 0) ? (
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
            <FaShareAlt className="text-gray-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No social links added</p>
            <p className="text-xs text-gray-400">Click "Add Social Link" to connect your social media</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.socialLinks.map((link, index) => {
              const iconConfig = SOCIAL_ICONS.find(i => i.value === link.iconName);
              const IconComponent = iconConfig?.icon || FiExternalLink;
              const hasUrl = link.url && link.url.trim() !== '';

              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-4 shadow-sm border transition ${hasUrl ? 'border-green-200 hover:border-green-300' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Icon Preview */}
                    {/* <div className="flex items-center gap-3 min-w-30">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasUrl ? 'bg-cyan-50' : 'bg-gray-50'
                        }`}>
                        <IconComponent className={`text-xl ${hasUrl ? 'text-cyan-600' : 'text-gray-300'}`} />
                      </div>
                      <select
                        value={link.iconName || 'FaFacebook'}
                        onChange={(e) => updateFormData(`socialLinks.${index}.iconName`, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none bg-white text-sm"
                        disabled={isLoading || isUploading}
                      >
                        {SOCIAL_ICONS.map(icon => (
                          <option key={icon.value} value={icon.value}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div> */}

                    {/* URL */}
                    <div className="flex-1 min-w-45">
                      <input
                        type="url"
                        value={link.url || ''}
                        onChange={(e) => updateFormData(`socialLinks.${index}.url`, e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none ${hasUrl ? 'border-green-300' : 'border-gray-300'
                          }`}
                        disabled={isLoading || isUploading}
                      />
                    </div>

                    {/* Name */}
                    <div className="min-w-25">
                      <input
                        type="text"
                        value={link.name || ''}
                        onChange={(e) => updateFormData(`socialLinks.${index}.name`, e.target.value)}
                        placeholder="Label"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none text-sm"
                        disabled={isLoading || isUploading}
                      />
                    </div>

                    {/* Hover Color */}
                    {/* <div className="min-w-25">
                      <input
                        type="text"
                        value={link.hoverColor || ''}
                        onChange={(e) => updateFormData(`socialLinks.${index}.hoverColor`, e.target.value)}
                        placeholder="hover:text-[#color]"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none text-sm font-mono"
                        disabled={isLoading || isUploading}
                      />
                    </div> */}

                    {/* Actions */}
                    {/* <div className="flex items-center gap-3 ml-auto">
                      {hasUrl ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">🔗 Active</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">⏸ Hidden</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          Swal.fire({
                            title: 'Remove Social Link?',
                            html: `Remove "<strong>${link.name || 'this link'}</strong>" from social links?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#dc2626',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'Yes, remove',
                            cancelButtonText: 'Cancel',
                          }).then((result) => {
                            if (result.isConfirmed) {
                              removeArrayItem('socialLinks', index);
                            }
                          });
                        }}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        disabled={isLoading || isUploading}
                      >
                        <FaTrash size={16} />
                      </button>
                    </div> */}
                  </div>

                  {/* Preview of how it will look */}
                  {hasUrl && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm">
                      <span className="text-xs text-gray-400">Preview:</span>
                      <a
                        href="#"
                        className={`text-gray-600 transition ${link.hoverColor || 'hover:text-cyan-600'} flex items-center gap-1`}
                        onClick={(e) => e.preventDefault()}
                      >
                        <IconComponent size={14} />
                        {link.name || 'Link'}
                      </a>
                      <span className="text-xs text-gray-400 ml-2">→ {link.url}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}