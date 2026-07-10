// resources/js/pages/Backend/CMS/Shared/Modals/EventsEditor.jsx

import { useState } from 'react';
import { FaPlus, FaTrash, FaUpload, FaXmark } from 'react-icons/fa6';
import Swal from 'sweetalert2';

export default function EventsEditor({
  formData,
  updateFormData,
  addArrayItem,
  removeArrayItem,
  isLoading = false,
  setIsLoading = null
}) {

  // States
  const [uploading, setUploading] = useState({});
  const [dragActive, setDragActive] = useState({});
  const [sectionUploading, setSectionUploading] = useState(false);
  const [sectionDragActive, setSectionDragActive] = useState(false);

  // Check if any upload is in progress
  const isUploading = Object.values(uploading).some(status => status === true) || sectionUploading;

  // Check if any upload is in progress
  const isDisabled = isLoading || isUploading;

  // ==================== EVENT IMAGE HANDLERS ====================

  // Handle drag and drop for images
  const handleDrag = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [index]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [index]: false }));
    }
  };

  // Handle drag and drop for images
  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [index]: false }));

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      processEventImage(file, index);
    }
  };

  // Handle file selection
  const handleFileSelect = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      processEventImage(file, index);
    }
    e.target.value = '';
  };

  // Process image file
  const processEventImage = (file, index) => {

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

    // Start uploading
    setUploading(prev => ({ ...prev, [index]: true }));
    if (setIsLoading) setIsLoading(true);

    // Read image
    const reader = new FileReader();

    // Handle image load
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      updateFormData(`events.${index}.image`, imageUrl);
      setUploading(prev => ({ ...prev, [index]: false }));
      if (setIsLoading) setIsLoading(false);
    };

    // Handle image error
    reader.onerror = () => {
      setUploading(prev => ({ ...prev, [index]: false }));
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

  // Remove image
  const removeEventImage = (index) => {
    Swal.fire({
      title: 'Remove Image?',
      text: 'This will remove the image from this event.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
    }).then((result) => {
      if (result.isConfirmed) {
        updateFormData(`events.${index}.image`, '');
      }
    });
  };

  // ==================== SECTION IMAGE HANDLERS ====================
  // Handle drag and drop for images
  const handleSectionDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setSectionDragActive(true);
    } else if (e.type === "dragleave") {
      setSectionDragActive(false);
    }
  };

  // Handle drag and drop for images
  const handleSectionDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSectionDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      processSectionImage(file);
    }
  };

  // Handle file selection
  const handleSectionFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processSectionImage(file);
    }
    e.target.value = '';
  };

  // Process image file
  const processSectionImage = (file) => {

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

    // Start uploading
    setSectionUploading(true);
    if (setIsLoading) setIsLoading(true);

    // Read image
    const reader = new FileReader();

    // Handle image load
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      updateFormData('image.src', imageUrl);
      setSectionUploading(false);
      if (setIsLoading) setIsLoading(false);
    };

    // Handle image error
    reader.onerror = () => {
      setSectionUploading(false);
      if (setIsLoading) setIsLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read the image file',
        confirmButtonColor: '#3b82f6',
      });
    };

    // Read image
    reader.readAsDataURL(file);
  };

  // Remove image
  const removeSectionImage = () => {
    Swal.fire({
      title: 'Remove Section Image?',
      text: 'This will remove the section image from the left side.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
    }).then((result) => {
      if (result.isConfirmed) {
        updateFormData('image.src', '');
      }
    });
  };

  // ==================== EVENT HANDLERS ====================
  // Handle drag and drop for images
  const handleRemoveEvent = (index, event) => {
    Swal.fire({
      title: 'Remove Event?',
      text: `Remove "${event.title || 'this event'}" from the list?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
    }).then((result) => {
      if (result.isConfirmed) {
        removeArrayItem('events', index);
      }
    });
  };

  // Get display name
  const getDisplayName = (src) => {
    if (!src) return '';
    if (src.startsWith('data:image')) {
      return '📷 New image (will be uploaded)';
    }
    return `📁 ${src.split('/').pop()}`;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4 w-full">
      {/* ============================================================
          SECTION IMAGE
          ============================================================ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Image (Left Side)
          <span className="text-xs text-gray-400 ml-2">(optional)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div>
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${sectionDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                } ${sectionUploading ? 'opacity-50' : ''}`}
              onDragEnter={handleSectionDrag}
              onDragLeave={handleSectionDrag}
              onDragOver={handleSectionDrag}
              onDrop={handleSectionDrop}
            >
              <div className="flex items-center gap-3 min-h-16">
                {formData.image?.src ? (
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={formData.image.src}
                      alt={formData.image?.alt || 'Section image'}
                      className="w-20 h-16 object-cover rounded border border-gray-200"
                    />
                    <span className="text-xs text-gray-500 truncate flex-1">
                      {getDisplayName(formData.image.src)}
                    </span>
                    <button
                      type="button"
                      onClick={removeSectionImage}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition shrink-0"
                      disabled={isDisabled}
                    >
                      <FaXmark size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-full text-gray-400 py-2">
                    <FaUpload size={20} className="shrink-0" />
                    <span className="text-sm">Drop section image or click to browse</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSectionFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isDisabled}
                />
              </div>
              {sectionUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Drag & drop or click to upload. Max 5MB. Supported: JPG, PNG, GIF, WebP, SVG
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Image Alt Text</label>
            <input
              type="text"
              value={formData.image?.alt || ''}
              onChange={(e) => updateFormData('image.alt', e.target.value)}
              placeholder="Descriptive alt text for accessibility"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1">
              Describes the image for screen readers and SEO
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          SECTION CONFIGURATION
          ============================================================ */}
      <div>
        <h3 className="font-semibold text-lg pt-2">Section Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Section Title
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.section?.title || ''}
              onChange={(e) => updateFormData('section.title', e.target.value)}
              placeholder="Upcoming Events"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Section Description
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <textarea
              value={formData.section?.description || ''}
              onChange={(e) => updateFormData('section.description', e.target.value)}
              rows={2}
              placeholder="Brief description of your events section"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* ============================================================
          BUTTON CONFIGURATION
          ============================================================ */}
      <div>
        <h3 className="font-semibold text-lg pt-2">Section Button</h3>
        <p className="text-xs text-gray-500 mb-2">The button that appears below the section description</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Button Text
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.section?.button?.text || ''}
              onChange={(e) => updateFormData('section.button.text', e.target.value)}
              placeholder="View All Events"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Button Link
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.section?.button?.link || ''}
              onChange={(e) => updateFormData('section.button.link', e.target.value)}
              placeholder="/events"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* ============================================================
          EVENTS LIST
          ============================================================ */}
      <div>
        <h3 className="font-semibold text-lg pt-2">
          Events
          <span className="text-xs text-gray-400 ml-2">
            {(formData.events || []).length} events
          </span>
        </h3>
        <p className="text-xs text-gray-500 mb-2">Add events to display in the upcoming events section</p>

        {(formData.events || []).map((event, index) => (
          <div key={event.id || index} className="bg-gray-50 p-4 rounded-lg space-y-3 border-l-4 border-green-300 w-full mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Event #{index + 1}</span>
              <button
                type="button"
                onClick={() => handleRemoveEvent(index, event)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                disabled={isDisabled}
              >
                <FaTrash size={14} />
              </button>
            </div>

            {/* Event Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Image</label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-3 transition-all ${dragActive[index] ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  } ${uploading[index] ? 'opacity-50' : ''}`}
                onDragEnter={(e) => handleDrag(e, index)}
                onDragLeave={(e) => handleDrag(e, index)}
                onDragOver={(e) => handleDrag(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="flex items-center gap-3 min-h-14">
                  {event.image ? (
                    <div className="flex items-center gap-3 w-full">
                      <img
                        src={event.image}
                        alt={event.title || 'Event image'}
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                      />
                      <span className="text-xs text-gray-500 truncate flex-1">
                        {getDisplayName(event.image)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEventImage(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition shrink-0"
                        disabled={isDisabled}
                      >
                        <FaXmark size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 w-full text-gray-400 py-1">
                      <FaUpload size={18} className="shrink-0" />
                      <span className="text-sm">Drop image or click to browse</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, index)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isDisabled}
                  />
                </div>
                {uploading[index] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                <input
                  type="text"
                  value={event.date?.day || ''}
                  onChange={(e) => updateFormData(`events.${index}.date.day`, e.target.value)}
                  placeholder="Day (e.g., 15)"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isDisabled}
                />
                <input
                  type="text"
                  value={event.date?.month || ''}
                  onChange={(e) => updateFormData(`events.${index}.date.month`, e.target.value)}
                  placeholder="Month (e.g., June)"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isDisabled}
                />
                <input
                  type="text"
                  value={event.date?.weekday || ''}
                  onChange={(e) => updateFormData(`events.${index}.date.weekday`, e.target.value)}
                  placeholder="Weekday (e.g., Monday)"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isDisabled}
                />
                <input
                  type="text"
                  value={event.date?.time || ''}
                  onChange={(e) => updateFormData(`events.${index}.date.time`, e.target.value)}
                  placeholder="Time (e.g., 10:00 AM)"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isDisabled}
                />
              </div>
            </div>

            {/* Event Details */}
            <input
              type="text"
              value={event.location || ''}
              onChange={(e) => updateFormData(`events.${index}.location`, e.target.value)}
              placeholder="Location (e.g., Conference Center)"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />

            <input
              type="text"
              value={event.title || ''}
              onChange={(e) => updateFormData(`events.${index}.title`, e.target.value)}
              placeholder="Event Title"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />

            <textarea
              value={event.description || ''}
              onChange={(e) => updateFormData(`events.${index}.description`, e.target.value)}
              placeholder="Event Description"
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />

            <input
              type="text"
              value={event.link || ''}
              onChange={(e) => updateFormData(`events.${index}.link`, e.target.value)}
              placeholder="Event Link URL (e.g., /events/2024/event-name)"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isDisabled}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => addArrayItem('events', {
            id: Date.now(),
            image: '',
            date: { day: '', month: '', weekday: '', time: '' },
            location: '',
            title: '',
            description: '',
            link: '/events/'
          })}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors"
          disabled={isDisabled}
        >
          <FaPlus size={14} /> Add Event
        </button>
      </div>
    </div>
  );
}