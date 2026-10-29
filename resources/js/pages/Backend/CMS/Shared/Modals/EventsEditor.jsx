// resources/js/pages/Backend/CMS/Shared/Modals/EventsEditor.jsx
import { useState } from 'react';
import {
  FaPlus, FaTrash, FaUpload, FaImage, FaRegCalendarAlt,
  FaMapMarkerAlt, FaInfoCircle, FaLink, FaSpinner, FaTimes,
} from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import Swal from 'sweetalert2';
import EditorSection from '../components/EditorSection';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 disabled:bg-slate-50 disabled:text-slate-500';
const inputSmallClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 disabled:bg-slate-50 disabled:text-slate-500';
const labelClass = 'block text-sm font-medium text-slate-700';
const labelSmallClass = 'block text-xs font-medium text-slate-500';
const hintClass = 'mt-1.5 flex items-center gap-1.5 text-xs text-slate-400';

const MAX_EVENTS = 3;

export default function EventsEditor({
  formData, updateFormData, removeArrayItem,
  isLoading = false, setIsLoading = null,
}) {
  const [uploading, setUploading] = useState({});
  const [dragActive, setDragActive] = useState({});
  const [sectionUploading, setSectionUploading] = useState(false);
  const [sectionDragActive, setSectionDragActive] = useState(false);

  const isUploading = Object.values(uploading).some((s) => s === true) || sectionUploading;
  const isDisabled = isLoading || isUploading;
  const totalEvents = (formData.events || []).length;
  const isAtMax = totalEvents >= MAX_EVENTS;

  // ---- Section image ----
  const handleSectionDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setSectionDragActive(true);
    else if (e.type === 'dragleave') setSectionDragActive(false);
  };

  const handleSectionDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setSectionDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) processSectionImage(files[0]);
  };

  const handleSectionFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) processSectionImage(file);
    e.target.value = '';
  };

  const processSectionImage = (file) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error', title: 'Invalid File',
        text: 'Please select an image file (JPEG, PNG, GIF, WebP, SVG)', confirmButtonColor: '#3b82f6'
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error', title: 'File Too Large',
        text: 'Image size should be less than 5MB', confirmButtonColor: '#3b82f6'
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
        icon: 'error', title: 'Error',
        text: 'Failed to read the image file', confirmButtonColor: '#3b82f6'
      });
    };
    reader.readAsDataURL(file);
  };

  const removeSectionImage = () => {
    Swal.fire({
      title: 'Remove Section Image?',
      text: 'This will remove the section image from the left side.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
    }).then((r) => { if (r.isConfirmed) updateFormData('image.src', ''); });
  };

  // ---- Event images ----
  const handleDrag = (e, index) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover')
      setDragActive((prev) => ({ ...prev, [index]: true }));
    else if (e.type === 'dragleave')
      setDragActive((prev) => ({ ...prev, [index]: false }));
  };

  const handleDrop = (e, index) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [index]: false }));
    const files = e.dataTransfer.files;
    if (files && files[0]) processEventImage(files[0], index);
  };

  const handleFileSelect = (e, index) => {
    const file = e.target.files[0];
    if (file) processEventImage(file, index);
    e.target.value = '';
  };

  const processEventImage = (file, index) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error', title: 'Invalid File',
        text: 'Please select an image file (JPEG, PNG, GIF, WebP, SVG)', confirmButtonColor: '#3b82f6'
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error', title: 'File Too Large',
        text: 'Image size should be less than 5MB', confirmButtonColor: '#3b82f6'
      });
      return;
    }
    setUploading((prev) => ({ ...prev, [index]: true }));
    if (setIsLoading) setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      updateFormData(`events.${index}.image`, event.target.result);
      setUploading((prev) => ({ ...prev, [index]: false }));
      if (setIsLoading) setIsLoading(false);
    };
    reader.onerror = () => {
      setUploading((prev) => ({ ...prev, [index]: false }));
      if (setIsLoading) setIsLoading(false);
      Swal.fire({
        icon: 'error', title: 'Error',
        text: 'Failed to read the image file', confirmButtonColor: '#3b82f6'
      });
    };
    reader.readAsDataURL(file);
  };

  const removeEventImage = (index) => {
    Swal.fire({
      title: 'Remove Image?',
      text: 'This will remove the image from this event.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
    }).then((r) => { if (r.isConfirmed) updateFormData(`events.${index}.image`, ''); });
  };

  const handleRemoveEvent = (index, event) => {
    Swal.fire({
      title: 'Remove Event?',
      html: `Remove "<strong>${event.title || 'this event'}</strong>" from the list?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove', cancelButtonText: 'Cancel',
    }).then((r) => { if (r.isConfirmed) removeArrayItem('events', index); });
  };

  const handleAddEvent = () => {
    if (isAtMax) {
      Swal.fire({
        icon: 'warning', title: 'Maximum Events Reached',
        text: `You can only have ${MAX_EVENTS} events. Please remove one first.`,
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    const newEvent = {
      id: Date.now(), image: '',
      date: { day: '', month: '', weekday: '', time: '' },
      location: '', title: '', description: '', link: '/events/',
    };
    updateFormData('events', [newEvent, ...(formData.events || [])]);
  };

  return (
    <div className="space-y-6 w-full">
      {/* SECTION IMAGE */}
      <EditorSection
        icon={FaImage}
        title="Section Image"
        description="Optional image displayed on the left side of the events section"
        tone="blue"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div
              className={`relative rounded-lg border-2 border-dashed p-4 transition-all ${sectionDragActive
                  ? 'border-blue-500 bg-blue-50/60'
                  : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                } ${sectionUploading ? 'pointer-events-none opacity-60' : ''}`}
              onDragEnter={handleSectionDrag}
              onDragLeave={handleSectionDrag}
              onDragOver={handleSectionDrag}
              onDrop={handleSectionDrop}
            >
              <div className="flex min-h-16 items-center gap-3">
                {formData.image?.src ? (
                  <div className="flex w-full items-center gap-3">
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-[#080C14] p-1">
                      <img src={formData.image.src} alt={formData.image?.alt || 'Section image'}
                        className="max-h-full max-w-full object-contain" />
                    </div>
                    <span className="flex-1 truncate text-xs text-slate-500">Image uploaded</span>
                    <button type="button" onClick={removeSectionImage} disabled={isDisabled}
                      className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full items-center gap-3 py-2 text-slate-400">
                    <FaUpload size={16} className="shrink-0" />
                    <span className="text-sm">Drop image or click to browse</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleSectionFileSelect}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0" disabled={isDisabled} />
              </div>
              {sectionUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FaSpinner className="animate-spin text-blue-600" size={16} /> Uploading…
                  </div>
                </div>
              )}
            </div>
            <p className={hintClass}>Max 5MB. Supported: JPG, PNG, GIF, WebP, SVG</p>
          </div>
          <div>
            <label className={labelClass}>
              Image Alt Text
              <span className="ml-2 text-xs font-normal text-slate-400">(accessibility)</span>
            </label>
            <input type="text" value={formData.image?.alt || ''}
              onChange={(e) => updateFormData('image.alt', e.target.value)}
              placeholder="Descriptive alt text for accessibility"
              className={`${inputClass} mt-1.5`} disabled={isDisabled} />
            <p className={hintClass}>Describes the image for screen readers and SEO</p>
          </div>
        </div>
      </EditorSection>

      {/* SECTION CONFIGURATION */}
      <EditorSection
        icon={FaInfoCircle}
        title="Section Configuration"
        description="Configure the title and description for your events section"
        tone="emerald"
      >
        <div>
          <label className={labelClass}>
            Section Title
            <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <input type="text" value={formData.section?.title || ''}
            onChange={(e) => updateFormData('section.title', e.target.value)}
            placeholder="Upcoming Events"
            className={`${inputClass} mt-1.5`} disabled={isDisabled} />
        </div>
        <div>
          <label className={labelClass}>
            Section Description
            <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <textarea value={formData.section?.description || ''}
            onChange={(e) => updateFormData('section.description', e.target.value)}
            rows={2} placeholder="Brief description of your events section"
            className={`${inputClass} mt-1.5 resize-y`} disabled={isDisabled} />
        </div>
      </EditorSection>

      {/* BUTTON CONFIGURATION */}
      <EditorSection
        icon={FiExternalLink}
        title="Section Button"
        description="The button that appears below the section description"
        tone="orange"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Button Text
              <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <input type="text" value={formData.section?.button?.text || ''}
              onChange={(e) => updateFormData('section.button.text', e.target.value)}
              placeholder="View All Events"
              className={`${inputClass} mt-1.5`} disabled={isDisabled} />
          </div>
          <div>
            <label className={labelClass}>
              Button Link
              <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <input type="text" value={formData.section?.button?.link || ''}
              onChange={(e) => updateFormData('section.button.link', e.target.value)}
              placeholder="/events"
              className={`${inputClass} mt-1.5`} disabled={isDisabled} />
          </div>
        </div>
      </EditorSection>

      {/* EVENTS LIST */}
      <EditorSection
        icon={FaRegCalendarAlt}
        title="Events"
        description={`${totalEvents} ${totalEvents === 1 ? 'event' : 'events'} • Max ${MAX_EVENTS} • New events appear at the top`}
        tone="cyan"
        action={
          <button type="button" onClick={handleAddEvent}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDisabled || isAtMax}>
            <FaPlus size={11} /> Add Event
          </button>
        }
      >
        {isAtMax && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <FaInfoCircle className="mt-0.5 shrink-0 text-amber-500" size={12} />
            Maximum {MAX_EVENTS} events reached. Remove an existing event to add a new one.
          </div>
        )}

        {totalEvents === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FaRegCalendarAlt size={20} />
            </div>
            <p className="text-sm font-medium text-slate-600">No events yet</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Click <span className="font-medium text-blue-600">Add Event</span> to start
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(formData.events || []).map((event, index) => (
              <div key={event.id || index}
                className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      {index + 1}
                    </span>
                    Event
                  </span>
                  <button type="button" onClick={() => handleRemoveEvent(index, event)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    disabled={isDisabled} title="Remove event">
                    <FaTrash size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Event Image */}
                  <div>
                    <label className={labelSmallClass}>Event Image</label>
                    <div
                      className={`relative mt-1 rounded-lg border-2 border-dashed p-3 transition-all ${dragActive[index]
                          ? 'border-blue-500 bg-blue-50/60'
                          : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                        } ${uploading[index] ? 'pointer-events-none opacity-60' : ''}`}
                      onDragEnter={(e) => handleDrag(e, index)}
                      onDragLeave={(e) => handleDrag(e, index)}
                      onDragOver={(e) => handleDrag(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="flex min-h-14 items-center gap-3">
                        {event.image ? (
                          <div className="flex w-full items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-[#080C14] p-1">
                              <img src={event.image} alt={event.title || 'Event image'}
                                className="max-h-full max-w-full object-contain" />
                            </div>
                            <span className="flex-1 truncate text-xs text-slate-500">Image uploaded</span>
                            <button type="button" onClick={() => removeEventImage(index)}
                              disabled={isDisabled}
                              className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                              <FaTimes size={11} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex w-full items-center gap-3 py-1 text-slate-400">
                            <FaUpload size={14} className="shrink-0" />
                            <span className="text-xs">Drop image or click to browse</span>
                          </div>
                        )}
                        <input type="file" accept="image/*"
                          onChange={(e) => handleFileSelect(e, index)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          disabled={isDisabled} />
                      </div>
                      {uploading[index] && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <FaSpinner className="animate-spin text-blue-600" size={14} /> Uploading…
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className={labelSmallClass}>Event Date</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <input type="text" value={event.date?.day || ''}
                        onChange={(e) => updateFormData(`events.${index}.date.day`, e.target.value)}
                        placeholder="Day" className={inputSmallClass} disabled={isDisabled} />
                      <input type="text" value={event.date?.month || ''}
                        onChange={(e) => updateFormData(`events.${index}.date.month`, e.target.value)}
                        placeholder="Month" className={inputSmallClass} disabled={isDisabled} />
                      <input type="text" value={event.date?.weekday || ''}
                        onChange={(e) => updateFormData(`events.${index}.date.weekday`, e.target.value)}
                        placeholder="Weekday" className={inputSmallClass} disabled={isDisabled} />
                      <input type="text" value={event.date?.time || ''}
                        onChange={(e) => updateFormData(`events.${index}.date.time`, e.target.value)}
                        placeholder="Time" className={inputSmallClass} disabled={isDisabled} />
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className={`${labelSmallClass} flex items-center gap-1`}>
                    <FaMapMarkerAlt size={10} className="text-slate-400" /> Location
                  </label>
                  <input type="text" value={event.location || ''}
                    onChange={(e) => updateFormData(`events.${index}.location`, e.target.value)}
                    placeholder="Location (e.g., Conference Center)"
                    className={`${inputSmallClass} mt-1`} disabled={isDisabled} />
                </div>

                <div className="mt-3">
                  <label className={labelSmallClass}>
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={event.title || ''}
                    onChange={(e) => updateFormData(`events.${index}.title`, e.target.value)}
                    placeholder="Event Title"
                    className={`${inputSmallClass} mt-1`} disabled={isDisabled} />
                </div>

                <div className="mt-3">
                  <label className={labelSmallClass}>Description</label>
                  <textarea value={event.description || ''}
                    onChange={(e) => updateFormData(`events.${index}.description`, e.target.value)}
                    placeholder="Event Description" rows={2}
                    className={`${inputSmallClass} mt-1 resize-y`} disabled={isDisabled} />
                </div>

                <div className="mt-3">
                  <label className={`${labelSmallClass} flex items-center gap-1`}>
                    <FaLink size={10} className="text-slate-400" /> Event Link
                  </label>
                  <input type="text" value={event.link || ''}
                    onChange={(e) => updateFormData(`events.${index}.link`, e.target.value)}
                    placeholder="/events/2024/event-name"
                    className={`${inputSmallClass} mt-1`} disabled={isDisabled} />
                </div>

                {event.title && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Preview
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        {event.image && (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-[#080C14] p-1">
                            <img src={event.image} alt={event.title}
                              className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-800">{event.title}</div>
                          {event.date?.day && event.date?.month && (
                            <div className="text-xs text-slate-500">
                              {event.date.month} {event.date.day}
                              {event.date.time && ` · ${event.date.time}`}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1 truncate text-xs text-slate-400">
                              <FaMapMarkerAlt size={9} /> {event.location}
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

        <p className={hintClass}>
          <FaInfoCircle size={10} /> Maximum {MAX_EVENTS} events. New events appear at the top.
        </p>
      </EditorSection>
    </div>
  );
}