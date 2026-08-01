// resources/js/pages/Backend/CMS/Shared/Modals/EventsEditor.jsx

import { useState } from 'react';
import { FaPlus, FaTrash, FaUpload, FaImage, FaCalendar, FaMapMarkerAlt, FaInfoCircle, FaLink } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function EventsEditor({
  formData,
  updateFormData,
  removeArrayItem,
  isLoading = false,
  setIsLoading = null
}) {

  // States
  const [uploading, setUploading] = useState({});
  const [dragActive, setDragActive] = useState({});
  const [sectionUploading, setSectionUploading] = useState(false);
  const [sectionDragActive, setSectionDragActive] = useState(false);

  // Max events limit
  const MAX_EVENTS = 3;

  // Check if any upload is in progress
  const isUploading = Object.values(uploading).some(status => status === true) || sectionUploading;
  const isDisabled = isLoading || isUploading;
  const totalEvents = (formData.events || []).length;
  const isAtMax = totalEvents >= MAX_EVENTS;

  // ==================== EVENT IMAGE HANDLERS ====================

  const handleDrag = (e, index) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [index]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(prev => ({ ...prev, [index]: false }));

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processEventImage(files[0], index);
    }
  };

  const handleFileSelect = (e, index) => {
    const file = e.target.files[0];

    if (file) {
      processEventImage(file, index);
    }

    e.target.value = '';
  };

  const processEventImage = (file, index) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select an image file (JPEG, PNG, GIF, WebP, SVG)',
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

    setUploading(prev => ({ ...prev, [index]: true }));
    if (setIsLoading) setIsLoading(true);

    const reader = new FileReader();

    reader.onload = (event) => {
      updateFormData(`events.${index}.image`, event.target.result);

      setUploading(prev => ({ ...prev, [index]: false }));
      if (setIsLoading) setIsLoading(false);
    };

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

  const handleSectionDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setSectionDragActive(true);
    } else if (e.type === "dragleave") {
      setSectionDragActive(false);
    }
  };

  const handleSectionDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setSectionDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processSectionImage(files[0]);
    }
  };

  const handleSectionFileSelect = (e) => {
    const file = e.target.files[0];

    if (file) {
      processSectionImage(file);
    }

    e.target.value = '';
  };

  const processSectionImage = (file) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select an image file (JPEG, PNG, GIF, WebP, SVG)',
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

    setSectionUploading(true);
    if (setIsLoading) setIsLoading(true);

    const reader = new FileReader();

    reader.onload = (event) => {
      updateFormData('image.src', event.target.result);

      setSectionUploading(false);
      if (setIsLoading) setIsLoading(false);
    };

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

    reader.readAsDataURL(file);
  };

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

  // ==================== EVENT ACTIONS ====================

  const handleRemoveEvent = (index, event) => {
    Swal.fire({
      title: 'Remove Event?',
      html: `Remove "<strong>${event.title || 'this event'}</strong>" from the list?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        removeArrayItem('events', index);
      }
    });
  };

  // ==================== ADD EVENT AT TOP ====================

  const handleAddEvent = () => {
    // Check if max limit reached
    if (isAtMax) {
      Swal.fire({
        icon: 'warning',
        title: 'Maximum Events Reached',
        text: `You can only have ${MAX_EVENTS} events at a time. Please remove an existing event before adding a new one.`,
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const newEvent = {
      id: Date.now(),
      image: '',
      date: { day: '', month: '', weekday: '', time: '' },
      location: '',
      title: '',
      description: '',
      link: '/events/'
    };
    const currentEvents = formData.events || [];
    // Add to the beginning of the array
    const updatedEvents = [newEvent, ...currentEvents];
    updateFormData('events', updatedEvents);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-8 w-full">

      {/* SECTION IMAGE */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaImage className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Section Image</h3>
            <p className="text-xs text-gray-500">Optional image displayed on the left side of the events section</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="w-20 h-16 rounded border border-gray-200 bg-[#080C14] flex items-center justify-center p-1 shrink-0">
                      <img
                        src={formData.image.src}
                        alt={formData.image?.alt || 'Section image'}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className="text-xs text-gray-500 truncate flex-1">
                      Image uploaded
                    </span>
                    <button
                      type="button"
                      onClick={removeSectionImage}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition shrink-0"
                      disabled={isDisabled}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    <span className="text-sm text-gray-600">Uploading...</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Max 5MB. Supported: JPG, PNG, GIF, WebP, SVG
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Alt Text
              <span className="text-xs text-gray-400 ml-2">(for accessibility)</span>
            </label>
            <input
              type="text"
              value={formData.image?.alt || ''}
              onChange={(e) => updateFormData('image.alt', e.target.value)}
              placeholder="Descriptive alt text for accessibility"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Describes the image for screen readers and SEO
            </p>
          </div>
        </div>
      </div>

      {/* SECTION CONFIGURATION */}
      <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <FaInfoCircle className="text-green-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Section Configuration</h3>
            <p className="text-xs text-gray-500">Configure the title and description for your events section</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Title
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.section?.title || ''}
              onChange={(e) => updateFormData('section.title', e.target.value)}
              placeholder="Upcoming Events"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Description
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <textarea
              value={formData.section?.description || ''}
              onChange={(e) => updateFormData('section.description', e.target.value)}
              rows={2}
              placeholder="Brief description of your events section"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition outline-none resize-y"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* BUTTON CONFIGURATION */}
      <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <FiExternalLink className="text-orange-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Section Button</h3>
            <p className="text-xs text-gray-500">The button that appears below the section description</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button Text
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.section?.button?.text || ''}
              onChange={(e) => updateFormData('section.button.text', e.target.value)}
              placeholder="View All Events"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button Link
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.section?.button?.link || ''}
              onChange={(e) => updateFormData('section.button.link', e.target.value)}
              placeholder="/events"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* EVENTS LIST */}
      <div className="bg-linear-to-r from-cyan-50 to-teal-50 rounded-xl p-6 border border-cyan-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <FaCalendar className="text-cyan-600 text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Events</h3>
              <p className="text-xs text-gray-500">
                {totalEvents} {totalEvents === 1 ? 'event' : 'events'} • Max {MAX_EVENTS} • New events appear at the top
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddEvent}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm ${isAtMax || isDisabled
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-cyan-600 text-white hover:bg-cyan-700'
              }`}
            disabled={isDisabled || isAtMax}
          >
            <FaPlus size={14} />
            Add Event
          </button>
        </div>

        {/* Max limit warning */}
        {isAtMax && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
            <span>⚠️</span>
            Maximum {MAX_EVENTS} events reached. Remove an existing event to add a new one.
          </div>
        )}

        {totalEvents === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
            <FaCalendar className="text-gray-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No events added yet</p>
            <p className="text-xs text-gray-400">Click "Add Event" to start building your events section</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(formData.events || []).map((event, index) => (
              <div
                key={event.id || index}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-cyan-300 transition"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    Event
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(index, event)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                    disabled={isDisabled}
                  >
                    <FaTrash size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Event Image */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Event Image</label>
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-3 transition-all ${dragActive[index] ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 hover:border-gray-400'
                        } ${uploading[index] ? 'opacity-50' : ''}`}
                      onDragEnter={(e) => handleDrag(e, index)}
                      onDragLeave={(e) => handleDrag(e, index)}
                      onDragOver={(e) => handleDrag(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="flex items-center gap-3 min-h-14">
                        {event.image ? (
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-16 h-16 rounded border border-gray-200 bg-[#080C14] flex items-center justify-center p-1 shrink-0">
                              <img
                                src={event.image}
                                alt={event.title || 'Event image'}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <span className="text-xs text-gray-500 truncate flex-1">
                              Image uploaded
                            </span>
                            <button
                              type="button"
                              onClick={() => removeEventImage(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition shrink-0"
                              disabled={isDisabled}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 w-full text-gray-400 py-1">
                            <FaUpload size={16} className="shrink-0" />
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
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600" />
                            <span className="text-xs text-gray-600">Uploading...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Event Date</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={event.date?.day || ''}
                        onChange={(e) => updateFormData(`events.${index}.date.day`, e.target.value)}
                        placeholder="Day"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none text-sm"
                        disabled={isDisabled}
                      />
                      <input
                        type="text"
                        value={event.date?.month || ''}
                        onChange={(e) => updateFormData(`events.${index}.date.month`, e.target.value)}
                        placeholder="Month"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none text-sm"
                        disabled={isDisabled}
                      />
                      <input
                        type="text"
                        value={event.date?.weekday || ''}
                        onChange={(e) => updateFormData(`events.${index}.date.weekday`, e.target.value)}
                        placeholder="Weekday"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none text-sm"
                        disabled={isDisabled}
                      />
                      <input
                        type="text"
                        value={event.date?.time || ''}
                        onChange={(e) => updateFormData(`events.${index}.date.time`, e.target.value)}
                        placeholder="Time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none text-sm"
                        disabled={isDisabled}
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    <FaMapMarkerAlt className="inline mr-1 text-gray-400" size={12} />
                    Location
                  </label>
                  <input
                    type="text"
                    value={event.location || ''}
                    onChange={(e) => updateFormData(`events.${index}.location`, e.target.value)}
                    placeholder="Location (e.g., Conference Center)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none text-sm"
                    disabled={isDisabled}
                  />
                </div>

                {/* Title */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={event.title || ''}
                    onChange={(e) => updateFormData(`events.${index}.title`, e.target.value)}
                    placeholder="Event Title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none text-sm"
                    disabled={isDisabled}
                  />
                </div>

                {/* Description */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea
                    value={event.description || ''}
                    onChange={(e) => updateFormData(`events.${index}.description`, e.target.value)}
                    placeholder="Event Description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none resize-y text-sm"
                    disabled={isDisabled}
                  />
                </div>

                {/* Link */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    <FaLink className="inline mr-1 text-gray-400" size={12} />
                    Event Link
                  </label>
                  <input
                    type="text"
                    value={event.link || ''}
                    onChange={(e) => updateFormData(`events.${index}.link`, e.target.value)}
                    placeholder="/events/2024/event-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition outline-none text-sm"
                    disabled={isDisabled}
                  />
                </div>

                {/* Preview */}
                {event.title && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-400 mb-2">Preview:</div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {event.image && (
                          <div className="w-12 h-12 rounded border border-gray-200 bg-[#080C14] flex items-center justify-center p-1 shrink-0">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-sm truncate">
                            {event.title}
                          </div>
                          {event.date?.day && event.date?.month && (
                            <div className="text-xs text-gray-500">
                              {event.date.month} {event.date.day}
                              {event.date.time && ` • ${event.date.time}`}
                            </div>
                          )}
                          {event.location && (
                            <div className="text-xs text-gray-400 truncate">
                              📍 {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <span>💡</span>
          Maximum {MAX_EVENTS} events allowed. New events appear at the top.
        </p>
      </div>
    </div>
  );
}