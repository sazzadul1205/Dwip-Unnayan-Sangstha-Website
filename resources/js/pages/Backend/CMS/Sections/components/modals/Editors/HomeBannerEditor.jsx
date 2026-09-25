// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/HomeBannerEditor.jsx

// React
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Icons
import { FaTrash, FaPlus, FaImage, FaArrowLeft, FaArrowRight, FaCopy } from 'react-icons/fa';

// Sweetalert
import Swal from 'sweetalert2';

// Shared Components
import ImageUpload from './shared/ImageUpload';
import { TextField, SelectField } from './shared/Fields';

const MAX_SLIDES = 10;
const MAX_BUTTONS = 2;

const DEFAULT_OVERLAY = {
  darkOverlay: 'bg-black/40 lg:bg-black/50',
  gradient: '',
};

const DEFAULT_CONTENT = {
  tagline: { text: '', className: 'uppercase tracking-[4px] font-semibold' },
  title: { text: '', className: 'font-bold leading-tight' },
  description: { text: '', className: 'font-normal leading-tight' },
};

const createEmptySlide = (index) => ({
  id: `slide_${Date.now()}_${index}`,
  src: '',
  alt: `Slide ${index + 1}`,
  overlay: { ...DEFAULT_OVERLAY },
  content: JSON.parse(JSON.stringify(DEFAULT_CONTENT)),
  buttons: [],
});

const createEmptyButton = () => ({
  text: '',
  link: '',
  icon: true,
  className: '',
});

const HomeBannerEditor = ({ section, hasData, onDataChange }) => {
  // ===== STATE MANAGEMENT =====
  const initialData = section?.data?.data || section?.data || {};

  const [slides, setSlides] = useState(() => {
    const existing = Array.isArray(initialData.slides) ? initialData.slides : [];
    return existing.slice(0, MAX_SLIDES).map((s, i) => ({
      ...createEmptySlide(i),
      ...s,
      overlay: { ...DEFAULT_OVERLAY, ...(s.overlay || {}) },
      content: {
        tagline: { ...DEFAULT_CONTENT.tagline, ...(s.content?.tagline || {}) },
        title: { ...DEFAULT_CONTENT.title, ...(s.content?.title || {}) },
        description: { ...DEFAULT_CONTENT.description, ...(s.content?.description || {}) },
      },
      buttons: Array.isArray(s.buttons) ? s.buttons.slice(0, MAX_BUTTONS) : [],
    }));
  });

  const [slideInterval, setSlideInterval] = useState(initialData?.slideInterval ?? 5000);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // ===== EFFECTS =====
  useEffect(() => {
    if (onDataChange) {
      onDataChange({ slides, slideInterval });
    }
  }, [slides, slideInterval, onDataChange]);

  useEffect(() => {
    if (activeSlideIndex >= slides.length) {
      setActiveSlideIndex(Math.max(0, slides.length - 1));
    }
    if (previewIndex >= slides.length) {
      setPreviewIndex(Math.max(0, slides.length - 1));
    }
  }, [slides.length, activeSlideIndex, previewIndex]);

  // ===== SLIDE MANAGEMENT =====
  const addSlide = useCallback(() => {
    if (slides.length >= MAX_SLIDES) {
      Swal.fire({
        icon: 'warning',
        title: `Maximum ${MAX_SLIDES} Slides`,
        text: `You can only have up to ${MAX_SLIDES} slides in this banner.`,
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    const updated = [...slides, createEmptySlide(slides.length)];
    setSlides(updated);
    setActiveSlideIndex(updated.length - 1);
    setPreviewIndex(updated.length - 1);
  }, [slides]);

  const duplicateSlide = useCallback((index) => {
    if (slides.length >= MAX_SLIDES) {
      Swal.fire({
        icon: 'warning',
        title: `Maximum ${MAX_SLIDES} Slides`,
        text: `You can only have up to ${MAX_SLIDES} slides in this banner.`,
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    const clone = {
      ...JSON.parse(JSON.stringify(slides[index])),
      id: `slide_${Date.now()}_${index}`,
      alt: `${slides[index].alt || 'Slide'} (copy)`,
    };
    const updated = [...slides];
    updated.splice(index + 1, 0, clone);
    setSlides(updated);
    setActiveSlideIndex(index + 1);
    setPreviewIndex(index + 1);
  }, [slides]);

  const removeSlide = useCallback((index) => {
    if (slides.length <= 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Remove',
        text: 'You need at least one slide.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    const updated = slides.filter((_, i) => i !== index);
    setSlides(updated);
    setActiveSlideIndex(Math.min(activeSlideIndex, updated.length - 1));
    setPreviewIndex(Math.min(previewIndex, updated.length - 1));
  }, [slides, activeSlideIndex, previewIndex]);

  // ===== SLIDE FIELD UPDATERS =====
  const updateSlide = useCallback((index, updater) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] =
        typeof updater === 'function' ? updater(updated[index]) : { ...updated[index], ...updater };
      return updated;
    });
  }, []);

  const updateSlideField = useCallback((index, path, value) => {
    updateSlide(index, (slide) => {
      const keys = path.split('.');
      const clone = JSON.parse(JSON.stringify(slide));
      let cur = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return clone;
    });
  }, [updateSlide]);

  // ===== BUTTON MANAGEMENT =====
  const addButton = useCallback((slideIndex) => {
    updateSlide(slideIndex, (slide) => {
      const buttons = Array.isArray(slide.buttons) ? [...slide.buttons] : [];
      if (buttons.length >= MAX_BUTTONS) {
        Swal.fire({
          icon: 'warning',
          title: `Maximum ${MAX_BUTTONS} Buttons`,
          text: `Each slide can have up to ${MAX_BUTTONS} buttons.`,
          confirmButtonColor: '#3b82f6',
        });
        return slide;
      }
      buttons.push(createEmptyButton());
      return { ...slide, buttons };
    });
  }, [updateSlide]);

  const removeButton = useCallback((slideIndex, buttonIndex) => {
    updateSlide(slideIndex, (slide) => ({
      ...slide,
      buttons: (slide.buttons || []).filter((_, i) => i !== buttonIndex),
    }));
  }, [updateSlide]);

  const updateButtonField = useCallback((slideIndex, buttonIndex, field, value) => {
    updateSlide(slideIndex, (slide) => {
      const buttons = [...(slide.buttons || [])];
      buttons[buttonIndex] = { ...buttons[buttonIndex], [field]: value };
      return { ...slide, buttons };
    });
  }, [updateSlide]);

  // ===== NAVIGATION =====
  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setPreviewIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setPreviewIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // ===== OPTIONS =====
  const overlayOptions = useMemo(() => [
    { value: 'bg-black/40 lg:bg-black/50', label: 'Light Dark Overlay' },
    { value: 'bg-black/60 lg:bg-black/70', label: 'Medium Dark Overlay' },
    { value: 'bg-black/80 lg:bg-black/90', label: 'Heavy Dark Overlay' },
    { value: 'bg-gradient-to-r from-black/85 via-black/10 to-transparent', label: 'Gradient Left to Right' },
    { value: 'bg-gradient-to-l from-black/85 via-black/10 to-transparent', label: 'Gradient Right to Left' },
    { value: 'bg-gradient-to-t from-black/85 via-black/10 to-transparent', label: 'Gradient Bottom to Top' },
    { value: 'bg-gradient-to-b from-black/85 via-black/10 to-transparent', label: 'Gradient Top to Bottom' },
    { value: '', label: 'None' },
  ], []);

  const gradientOptions = useMemo(() => [
    { value: 'bg-gradient-to-r from-black/85 via-black/10 to-transparent', label: 'Left to Right' },
    { value: 'bg-gradient-to-l from-black/85 via-black/10 to-transparent', label: 'Right to Left' },
    { value: 'bg-gradient-to-t from-black/85 via-black/10 to-transparent', label: 'Bottom to Top' },
    { value: 'bg-gradient-to-b from-black/85 via-black/10 to-transparent', label: 'Top to Bottom' },
    { value: '', label: 'None' },
  ], []);

  const intervalOptions = useMemo(() => [
    { value: 3000, label: '3 seconds (Fast)' },
    { value: 4000, label: '4 seconds' },
    { value: 5000, label: '5 seconds (Default)' },
    { value: 6000, label: '6 seconds' },
    { value: 8000, label: '8 seconds' },
    { value: 10000, label: '10 seconds (Slow)' },
    { value: 15000, label: '15 seconds' },
  ], []);

  // ===== RENDER HELPERS =====
  const renderSlidePreview = () => {
    const slide = slides[previewIndex];
    if (!slide?.src) {
      return (
        <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
          <div className="text-center">
            <FaImage className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <span className="text-sm">No image selected</span>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={slide.src}
          alt={slide.alt || `Slide ${previewIndex + 1}`}
          className="w-full h-full object-cover"
        />
        {slide.overlay?.darkOverlay && (
          <div className={`absolute inset-0 ${slide.overlay.darkOverlay}`} />
        )}
        {slide.overlay?.gradient && (
          <div className={`absolute inset-0 ${slide.overlay.gradient}`} />
        )}
        <div className="absolute inset-0 flex flex-col justify-center px-4 text-white">
          {slide.content?.tagline?.text && (
            <p className="text-[10px] uppercase tracking-widest opacity-90">
              {slide.content.tagline.text}
            </p>
          )}
          {slide.content?.title?.text && (
            <h3 className="text-sm font-bold leading-tight line-clamp-2">
              {slide.content.title.text}
            </h3>
          )}
          {slide.content?.description?.text && (
            <p className="text-[10px] leading-tight line-clamp-2 opacity-90">
              {slide.content.description.text}
            </p>
          )}
          {slide.buttons?.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {slide.buttons.map(
                (b, i) =>
                  b.text && (
                    <span
                      key={i}
                      className={`text-[9px] px-2 py-0.5 rounded ${i === 0 ? 'bg-[#009BE2] text-white' : 'bg-white/90 text-black'
                        }`}
                    >
                      {b.text}
                    </span>
                  )
              )}
            </div>
          )}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <FaArrowLeft size={10} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <FaArrowRight size={10} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPreviewIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === previewIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                    }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // ===== MAIN RENDER =====
  const activeSlide = slides[activeSlideIndex];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Edit Banner Carousel</h3>
        <span className="text-xs text-gray-400">
          {slides.length} / {MAX_SLIDES} slides
        </span>
      </div>

      {/* ===== CAROUSEL SETTINGS ===== */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <SelectField
          label="Autoplay Speed"
          value={slideInterval}
          onChange={(e) => setSlideInterval(Number(e.target.value))}
          options={intervalOptions}
        />
        <p className="text-xs text-gray-400 mt-1">
          Time each slide stays visible before transitioning.
        </p>
      </div>

      {/* ===== SLIDE LIST ===== */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">Slides</h4>
          <button
            type="button"
            onClick={addSlide}
            disabled={slides.length >= MAX_SLIDES}
            className={`text-xs flex items-center gap-1 ${slides.length >= MAX_SLIDES
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700'
              }`}
          >
            <FaPlus size={12} /> Add Slide
          </button>
        </div>

        {slides.length > 0 && renderSlidePreview()}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {slides.map((slide, index) => (
            <button
              key={slide.id || index}
              type="button"
              onClick={() => setActiveSlideIndex(index)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${activeSlideIndex === index
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}
            >
              Slide #{index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* ===== ACTIVE SLIDE EDITOR ===== */}
      {activeSlide && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">
              Editing Slide #{activeSlideIndex + 1}
            </h4>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => duplicateSlide(activeSlideIndex)}
                disabled={slides.length >= MAX_SLIDES}
                className={`text-xs flex items-center gap-1 ${slides.length >= MAX_SLIDES
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                <FaCopy size={11} /> Duplicate
              </button>
              <button
                type="button"
                onClick={() => removeSlide(activeSlideIndex)}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <FaTrash size={12} /> Remove
              </button>
            </div>
          </div>

          {/* --- SLIDE IMAGE --- */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-500 mb-2">Slide Image</h5>
            <ImageUpload
              imageSrc={activeSlide.src || ''}
              onImageChange={(src) => updateSlideField(activeSlideIndex, 'src', src)}
              onImageRemove={() => updateSlideField(activeSlideIndex, 'src', '')}
              oldImagePath=""
              imageChanged={false}
              uploadPath="/storage/Banner/"
              label="Banner Image"
            />
            <div className="mt-2">
              <TextField
                label="Alt Text"
                value={activeSlide.alt || ''}
                onChange={(e) => updateSlideField(activeSlideIndex, 'alt', e.target.value)}
                placeholder="Describe this banner image"
              />
            </div>
          </div>

          {/* --- OVERLAY --- */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-500 mb-2">Overlay</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectField
                label="Dark Overlay"
                value={activeSlide.overlay?.darkOverlay || ''}
                onChange={(e) => updateSlideField(activeSlideIndex, 'overlay.darkOverlay', e.target.value)}
                options={overlayOptions}
              />
              <SelectField
                label="Gradient"
                value={activeSlide.overlay?.gradient || ''}
                onChange={(e) => updateSlideField(activeSlideIndex, 'overlay.gradient', e.target.value)}
                options={gradientOptions}
              />
            </div>
          </div>

          {/* --- CONTENT --- */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-500 mb-2">Content</h5>

            <div className="mb-3">
              <h6 className="text-xs font-medium text-gray-500 mb-1">Tagline</h6>
              <div className="space-y-2">
                <TextField
                  label="Text"
                  value={activeSlide.content?.tagline?.text || ''}
                  onChange={(e) => updateSlideField(activeSlideIndex, 'content.tagline.text', e.target.value)}
                  placeholder="Tagline text"
                />
                <TextField
                  label="Class Name"
                  value={activeSlide.content?.tagline?.className || ''}
                  onChange={(e) => updateSlideField(activeSlideIndex, 'content.tagline.className', e.target.value)}
                  placeholder="CSS classes"
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="mb-3">
              <h6 className="text-xs font-medium text-gray-500 mb-1">Title</h6>
              <div className="space-y-2">
                <TextField
                  label="Text"
                  value={activeSlide.content?.title?.text || ''}
                  onChange={(e) => updateSlideField(activeSlideIndex, 'content.title.text', e.target.value)}
                  placeholder="Title text"
                />
                <TextField
                  label="Class Name"
                  value={activeSlide.content?.title?.className || ''}
                  onChange={(e) => updateSlideField(activeSlideIndex, 'content.title.className', e.target.value)}
                  placeholder="CSS classes"
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div>
              <h6 className="text-xs font-medium text-gray-500 mb-1">Description</h6>
              <div className="space-y-2">
                <textarea
                  value={activeSlide.content?.description?.text || ''}
                  onChange={(e) => updateSlideField(activeSlideIndex, 'content.description.text', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Description text"
                />
                <TextField
                  label="Class Name"
                  value={activeSlide.content?.description?.className || ''}
                  onChange={(e) => updateSlideField(activeSlideIndex, 'content.description.className', e.target.value)}
                  placeholder="CSS classes"
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* --- BUTTONS (MAX 2) --- */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-medium text-gray-500">
                Buttons (max {MAX_BUTTONS})
              </h5>
              <button
                type="button"
                onClick={() => addButton(activeSlideIndex)}
                disabled={(activeSlide.buttons?.length || 0) >= MAX_BUTTONS}
                className={`text-xs flex items-center gap-1 ${(activeSlide.buttons?.length || 0) >= MAX_BUTTONS
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700'
                  }`}
              >
                <FaPlus size={11} /> Add Button
              </button>
            </div>

            {(activeSlide.buttons?.length || 0) === 0 && (
              <p className="text-xs text-gray-400 italic py-2">
                No buttons. Click "Add Button" to create one.
              </p>
            )}

            <div className="space-y-3">
              {(activeSlide.buttons || []).map((btn, bIdx) => (
                <div key={bIdx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">
                      Button #{bIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeButton(activeSlideIndex, bIdx)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <FaTrash size={11} /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <TextField
                      label="Text"
                      value={btn.text || ''}
                      onChange={(e) => updateButtonField(activeSlideIndex, bIdx, 'text', e.target.value)}
                      placeholder="Button text"
                    />
                    <TextField
                      label="Link"
                      value={btn.link || ''}
                      onChange={(e) => updateButtonField(activeSlideIndex, bIdx, 'link', e.target.value)}
                      placeholder="/about or https://..."
                    />
                    <div className="md:col-span-2">
                      <TextField
                        label="Additional Class Name"
                        value={btn.className || ''}
                        onChange={(e) => updateButtonField(activeSlideIndex, bIdx, 'className', e.target.value)}
                        placeholder="Additional CSS classes"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`btn-icon-${activeSlideIndex}-${bIdx}`}
                        checked={!!btn.icon}
                        onChange={(e) => updateButtonField(activeSlideIndex, bIdx, 'icon', e.target.checked)}
                        className="rounded"
                      />
                      <label
                        htmlFor={`btn-icon-${activeSlideIndex}-${bIdx}`}
                        className="text-xs text-gray-600"
                      >
                        Show arrow icon
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== DATA INFORMATION ===== */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Section ID:</span>
            <span className="ml-2 text-gray-700 font-mono">{section.id}</span>
          </div>
          <div>
            <span className="text-gray-500">Data Table:</span>
            <span className="ml-2 text-gray-700 font-mono">{section.data_table || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-500">Data Key:</span>
            <span className="ml-2 text-gray-700 font-mono">{section.data_key || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-500">Has Data:</span>
            <span className={`ml-2 font-medium ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
              {hasData ? '✓ Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeBannerEditor;