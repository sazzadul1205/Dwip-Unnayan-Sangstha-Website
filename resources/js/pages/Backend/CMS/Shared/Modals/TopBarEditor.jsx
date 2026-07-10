// resources/js/pages/Backend/CMS/Shared/Modals/TopBarEditor.jsx

// react
import { useState } from 'react';

// icons
import { FaTimes } from 'react-icons/fa';
import { FaPlus, FaTrash } from 'react-icons/fa6';

// sweetalert
import Swal from 'sweetalert2';

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

  // --- DRAG & DROP HANDLERS ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Generic image upload handler for contact icons
  const handleContactImageUpload = (field, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select an image file (JPEG, PNG, GIF, WebP, SVG)',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Image size should be less than 5MB',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setUploading(prev => ({ ...prev, [field]: true }));
    if (setIsLoading) setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      // Update the specific field with base64
      updateFormData(`contactInfo.${field}.icon`, imageUrl);
      setUploading(prev => ({ ...prev, [field]: false }));
      if (setIsLoading) setIsLoading(false);
    };
    reader.onerror = () => {
      setUploading(prev => ({ ...prev, [field]: false }));
      if (setIsLoading) setIsLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read the image file',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop for contact icons
  const handleContactDrop = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleContactImageUpload(field, files[0]);
    }
  };

  // Handle file input for contact icons
  const handleContactFileSelect = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    handleContactImageUpload(field, file);
    e.target.value = ''; // Reset input
  };

  // Remove contact icon
  const removeContactIcon = (field) => {
    Swal.fire({
      title: 'Remove Icon?',
      text: 'This will remove the icon from this contact field.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it',
    }).then((result) => {
      if (result.isConfirmed) {
        updateFormData(`contactInfo.${field}.icon`, '');
      }
    });
  };

  // --- Language flag handlers ---
  const handleLangDrop = (e, langIndex) => {
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

      setUploading(prev => ({ ...prev, [`lang_${langIndex}`]: true }));
      if (setIsLoading) setIsLoading(true);

      const reader = new FileReader();
      reader.onload = (event) => {
        updateFormData(`languages.${langIndex}.flag`, event.target.result);
        setUploading(prev => ({ ...prev, [`lang_${langIndex}`]: false }));
        if (setIsLoading) setIsLoading(false);
      };
      reader.onerror = () => {
        setUploading(prev => ({ ...prev, [`lang_${langIndex}`]: false }));
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

  const handleLangFileSelect = (e, langIndex) => {
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

    setUploading(prev => ({ ...prev, [`lang_${langIndex}`]: true }));
    if (setIsLoading) setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      updateFormData(`languages.${langIndex}.flag`, event.target.result);
      setUploading(prev => ({ ...prev, [`lang_${langIndex}`]: false }));
      if (setIsLoading) setIsLoading(false);
    };
    reader.onerror = () => {
      setUploading(prev => ({ ...prev, [`lang_${langIndex}`]: false }));
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

  // ImageUploadField component for cleaner code
  const ImageUploadField = ({
    field,
    label,
    currentValue,
    uploadKey,
    iconPreview = false
  }) => {
    const isUploadingField = uploading[uploadKey] || false;
    const hasImage = currentValue && currentValue.trim().length > 0;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleContactDrop(e, field)}
        >
          <div className="flex items-center gap-2 min-h-10">
            {hasImage ? (
              <div className="flex items-center gap-2 w-full">
                {iconPreview ? (
                  <img
                    src={currentValue}
                    alt={label}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <img
                    src={currentValue}
                    alt={label}
                    className="w-8 h-6 object-cover rounded"
                  />
                )}
                <span className="text-xs text-gray-500 truncate flex-1">
                  {currentValue.startsWith('data:image')
                    ? '📷 New image (will be uploaded)'
                    : `📁 ${currentValue.substring(0, 30)}${currentValue.length > 30 ? '...' : ''}`}
                </span>
                <button
                  type="button"
                  onClick={() => removeContactIcon(field)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition shrink-0"
                  title="Remove image"
                  disabled={isLoading || isUploadingField}
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full text-gray-400 py-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Drop image or click to browse</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleContactFileSelect(e, field)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading || isUploadingField}
            />
          </div>
          {isUploadingField && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-4 w-full">
      <h3 className="font-semibold text-lg">Contact Info</h3>

      {/* Contact Info with Image Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="text"
            value={formData.contactInfo?.email?.text || ''}
            onChange={(e) => updateFormData('contactInfo.email.text', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="admin@example.com"
            disabled={isLoading || isUploading}
          />
          <ImageUploadField
            field="email"
            label="Email Icon"
            currentValue={formData.contactInfo?.email?.icon || ''}
            uploadKey="email_icon"
            iconPreview={true}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="text"
            value={formData.contactInfo?.phone?.text || ''}
            onChange={(e) => updateFormData('contactInfo.phone.text', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="+880 1234 567890"
            disabled={isLoading || isUploading}
          />
          <ImageUploadField
            field="phone"
            label="Phone Icon"
            currentValue={formData.contactInfo?.phone?.icon || ''}
            uploadKey="phone_icon"
            iconPreview={true}
          />
        </div>

        {/* Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Hours</label>
          <input
            type="text"
            value={formData.contactInfo?.hours?.text || ''}
            onChange={(e) => updateFormData('contactInfo.hours.text', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="Mon - Fri: 9:00 AM - 5:00 PM"
            disabled={isLoading || isUploading}
          />
          <ImageUploadField
            field="hours"
            label="Hours Icon"
            currentValue={formData.contactInfo?.hours?.icon || ''}
            uploadKey="hours_icon"
            iconPreview={true}
          />
        </div>
      </div>

      {/* ============================================
          LANGUAGES SECTION
          ============================================ */}
      <h3 className="font-semibold text-lg pt-4">Languages</h3>
      <p className="text-xs text-gray-500 mb-2">Add languages for the language selector (only 'us' and 'bd' will be shown)</p>

      {(formData.languages || []).map((lang, index) => (
        <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg w-full flex-wrap">
          <input
            type="text"
            value={lang.code || ''}
            onChange={(e) => updateFormData(`languages.${index}.code`, e.target.value)}
            placeholder="Code (us, bd)"
            className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isUploading}
          />
          <input
            type="text"
            value={lang.name || ''}
            onChange={(e) => updateFormData(`languages.${index}.name`, e.target.value)}
            placeholder="Language Name"
            className="flex-1 min-w-25 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isUploading}
          />

          {/* Flag upload field */}
          <div className="flex-1 min-w-37.5 relative">
            <div
              className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleLangDrop(e, index)}
            >
              <div className="flex items-center gap-2 min-h-10">
                {lang.flag ? (
                  <div className="flex items-center gap-2 w-full">
                    <img
                      src={lang.flag}
                      alt={lang.name || 'Flag'}
                      className="w-8 h-6 object-cover rounded"
                    />
                    <span className="text-xs text-gray-500 truncate flex-1">
                      {typeof lang.flag === 'string' && lang.flag.startsWith('data:image')
                        ? '📷 New image (will be uploaded)'
                        : `📁 ${lang.flag.substring(0, 30)}${lang.flag.length > 30 ? '...' : ''}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFlag(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition shrink-0"
                      title="Remove flag"
                      disabled={isLoading || isUploading}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full text-gray-400 py-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Drop flag or click to browse</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLangFileSelect(e, index)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isLoading || isUploading}
                />
              </div>
              {uploading[`lang_${index}`] && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              Swal.fire({
                title: 'Remove Language?',
                text: `Remove "${lang.name || 'this language'}" from the list?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, remove',
              }).then((result) => {
                if (result.isConfirmed) {
                  removeArrayItem('languages', index);
                }
              });
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
            disabled={isLoading || isUploading}
          >
            <FaTrash size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => addArrayItem('languages', { code: '', name: '', flag: '' })}
        className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        disabled={isLoading || isUploading}
      >
        <FaPlus size={14} /> Add Language
      </button>

      {/* ============================================
          SOCIAL LINKS SECTION
          ============================================ */}
      <h3 className="font-semibold text-lg pt-4">Social Links</h3>
      <p className="text-xs text-gray-500 mb-2">Edit social links (leave URL empty to hide)</p>

      {(formData.socialLinks || []).map((link, index) => (
        <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg w-full flex-wrap">
          <input
            type="text"
            value={link.iconName || ''}
            className="w-32 px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            disabled={true}
            readOnly
          />
          <input
            type="text"
            value={link.url || ''}
            onChange={(e) => updateFormData(`socialLinks.${index}.url`, e.target.value)}
            placeholder="URL (leave empty to hide)"
            className="flex-1 min-w-37.5 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isUploading}
          />
          <input
            type="text"
            value={link.name || ''}
            onChange={(e) => updateFormData(`socialLinks.${index}.name`, e.target.value)}
            placeholder="Name"
            className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isUploading}
          />
          <input
            type="text"
            value={link.hoverColor || ''}
            onChange={(e) => updateFormData(`socialLinks.${index}.hoverColor`, e.target.value)}
            placeholder="Hover Color"
            className="w-40 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isUploading}
          />
          <button
            type="button"
            onClick={() => {
              Swal.fire({
                title: 'Remove Social Link?',
                text: `Remove "${link.name || 'this social link'}" from the list?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, remove',
              }).then((result) => {
                if (result.isConfirmed) {
                  removeArrayItem('socialLinks', index);
                }
              });
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
            disabled={isLoading || isUploading}
          >
            <FaTrash size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => addArrayItem('socialLinks', { iconName: 'FaFacebook', url: '', name: '', hoverColor: 'hover:text-[#009BE2]' })}
        className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        disabled={isLoading || isUploading}
      >
        <FaPlus size={14} /> Add Social Link
      </button>

      {/* ============================================
          USER MENU - Note section
          ============================================ */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-lg">User Menu</h3>
        <p className="text-xs text-gray-500 mb-2">
          User menu is automatically configured based on authentication state.
          Guest users see Login/Register, authenticated users see Dashboard/Logout.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          💡 The user menu is automatically managed by the application. No manual configuration needed.
        </div>
      </div>
    </div>
  );
}