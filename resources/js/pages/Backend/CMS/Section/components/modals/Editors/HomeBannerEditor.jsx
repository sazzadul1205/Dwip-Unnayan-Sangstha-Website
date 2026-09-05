// resources/js/pages/Backend/CMS/Section/components/modals/Editors/HomeBannerEditor.jsx

// React
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Icons
import { FaTrash, FaPlus, FaImage, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

// Sweetalert
import Swal from 'sweetalert2';

// Shared Components
import ImageUpload from './shared/ImageUpload';
import { TextField, SelectField } from './shared/Fields';

const HomeBannerEditor = ({ section, hasData, onDataChange }) => {
  // ===== STATE MANAGEMENT =====
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);
  const [slideImages, setSlideImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  // ===== EFFECTS =====
  // Initialize slide images from background data
  useEffect(() => {
    const bgSrc = formData?.background?.src || [];
    const bgAlt = formData?.background?.alt || [];

    if (Array.isArray(bgSrc) && bgSrc.length > 0) {
      const slides = bgSrc.map((src, index) => ({
        src: src || '',
        alt: Array.isArray(bgAlt) ? (bgAlt[index] || '') : (bgAlt || ''),
        id: index,
      }));
      setSlideImages(slides);
    } else if (bgSrc && typeof bgSrc === 'string') {
      setSlideImages([{
        src: bgSrc,
        alt: bgAlt || '',
        id: 0,
      }]);
    } else {
      setSlideImages([]);
    }
  }, [formData?.background?.src, formData?.background?.alt]);

  // Notify parent when form data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // ===== HELPER FUNCTIONS =====

  // Update nested object fields using dot notation
  const updateField = useCallback((path, value) => {
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setFormData(newData);
  }, [formData]);

  // Update background images array
  const updateBackgroundImages = useCallback((newImages) => {
    const srcs = newImages.map(img => img.src);
    const alts = newImages.map(img => img.alt);

    updateField('background.src', srcs);
    updateField('background.alt', alts);
    setSlideImages(newImages);

    // Reset preview index if it's out of bounds
    if (previewIndex >= newImages.length) {
      setPreviewIndex(Math.max(0, newImages.length - 1));
    }
  }, [updateField, previewIndex]);

  // ===== SLIDE MANAGEMENT =====

  // Add a new slide image
  const addSlideImage = useCallback(() => {
    if (slideImages.length >= 5) {
      Swal.fire({
        icon: 'warning',
        title: 'Maximum 5 Slides',
        text: 'You can only have up to 5 slides in this section.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const newSlide = {
      src: '',
      alt: `Slide ${slideImages.length + 1}`,
      id: Date.now(),
    };

    const updatedSlides = [...slideImages, newSlide];
    updateBackgroundImages(updatedSlides);
    setPreviewIndex(updatedSlides.length - 1);
  }, [slideImages, updateBackgroundImages]);

  // Remove a slide image
  const removeSlideImage = useCallback((index) => {
    if (slideImages.length <= 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Remove',
        text: 'You need at least one slide.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const updatedSlides = slideImages.filter((_, i) => i !== index);
    updateBackgroundImages(updatedSlides);

    if (previewIndex >= updatedSlides.length) {
      setPreviewIndex(updatedSlides.length - 1);
    }
  }, [slideImages, updateBackgroundImages, previewIndex]);

  // Update slide image source
  const updateSlideSrc = useCallback((index, src) => {
    const updatedSlides = [...slideImages];
    updatedSlides[index].src = src;
    updateBackgroundImages(updatedSlides);
  }, [slideImages, updateBackgroundImages]);

  // Update slide alt text
  const updateSlideAlt = useCallback((index, alt) => {
    const updatedSlides = [...slideImages];
    updatedSlides[index].alt = alt;
    updateBackgroundImages(updatedSlides);
  }, [slideImages, updateBackgroundImages]);

  // Navigate preview
  const prevSlide = useCallback(() => {
    if (slideImages.length === 0) return;
    setPreviewIndex((prev) => (prev - 1 + slideImages.length) % slideImages.length);
  }, [slideImages.length]);

  const nextSlide = useCallback(() => {
    if (slideImages.length === 0) return;
    setPreviewIndex((prev) => (prev + 1) % slideImages.length);
  }, [slideImages.length]);

  // ===== OPTIONS =====
  const overlayOptions = useMemo(() => [
    { value: 'bg-black/40 lg:bg-black/50', label: 'Light Dark Overlay' },
    { value: 'bg-black/60 lg:bg-black/70', label: 'Medium Dark Overlay' },
    { value: 'bg-black/80 lg:bg-black/90', label: 'Heavy Dark Overlay' },
    { value: 'bg-linear-to-r from-black/85 via-black/10 to-transparent', label: 'Gradient Left to Right' },
    { value: 'bg-linear-to-l from-black/85 via-black/10 to-transparent', label: 'Gradient Right to Left' },
    { value: 'bg-linear-to-t from-black/85 via-black/10 to-transparent', label: 'Gradient Bottom to Top' },
    { value: 'bg-linear-to-b from-black/85 via-black/10 to-transparent', label: 'Gradient Top to Bottom' },
  ], []);

  const gradientOptions = useMemo(() => [
    { value: 'bg-linear-to-r from-black/85 via-black/10 to-transparent', label: 'Left to Right' },
    { value: 'bg-linear-to-l from-black/85 via-black/10 to-transparent', label: 'Right to Left' },
    { value: 'bg-linear-to-t from-black/85 via-black/10 to-transparent', label: 'Bottom to Top' },
    { value: 'bg-linear-to-b from-black/85 via-black/10 to-transparent', label: 'Top to Bottom' },
    { value: '', label: 'None' },
  ], []);

  // ===== RENDER HELPERS =====

  // Render slide preview
  const renderSlidePreview = useCallback(() => {
    if (slideImages.length === 0 || !slideImages[previewIndex]?.src) {
      return (
        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
          <div className="text-center">
            <FaImage className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <span className="text-sm">No image selected</span>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={slideImages[previewIndex].src}
          alt={slideImages[previewIndex].alt || `Slide ${previewIndex + 1}`}
          className="w-full h-full object-cover"
        />
        {slideImages.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <FaArrowLeft size={12} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <FaArrowRight size={12} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {slideImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPreviewIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === previewIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                    }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }, [slideImages, previewIndex, prevSlide, nextSlide]);

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Data</h3>

      {/* ===== SLIDER IMAGES ===== */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">Slider Images (Max 5)</h4>
          <div className="flex gap-2">
            <span className="text-xs text-gray-400">
              {slideImages.length} / 5 slides
            </span>
            <button
              type="button"
              onClick={addSlideImage}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <FaPlus size={12} /> Add Slide
            </button>
          </div>
        </div>

        {/* Slide Preview */}
        {slideImages.length > 0 && renderSlidePreview()}

        {/* Slide Images List */}
        <div className="space-y-3 mt-3 max-h-80 overflow-y-auto">
          {slideImages.map((slide, index) => (
            <div
              key={slide.id || index}
              className={`p-3 rounded-lg border transition-colors ${index === previewIndex
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-200'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">
                  Slide #{index + 1}
                  {index === previewIndex && (
                    <span className="ml-2 text-blue-500 text-[10px] font-semibold">(Previewing)</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removeSlideImage(index)}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <FaTrash size={12} /> Remove
                </button>
              </div>

              <div className="space-y-2">
                <ImageUpload
                  imageSrc={slide.src || ''}
                  onImageChange={(src) => updateSlideSrc(index, src)}
                  onImageRemove={() => updateSlideSrc(index, '')}
                  oldImagePath=""
                  imageChanged={false}
                  uploadPath="/storage/Banner/"
                  label="Slide Image"
                />

                <TextField
                  label="Alt Text"
                  value={slide.alt || ''}
                  onChange={(e) => updateSlideAlt(index, e.target.value)}
                  placeholder={`Alt text for slide ${index + 1}`}
                />
              </div>
            </div>
          ))}
        </div>

        {slideImages.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No slides added. Click "Add Slide" to create one (max 5).
          </div>
        )}

        {slideImages.length >= 5 && (
          <div className="text-center text-xs text-yellow-600 mt-1">
            Maximum of 5 slides reached.
          </div>
        )}
      </div>

      {/* ===== OVERLAY SETTINGS ===== */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Overlay Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SelectField
            label="Dark Overlay"
            value={formData.overlay?.darkOverlay || ''}
            onChange={(e) => updateField('overlay.darkOverlay', e.target.value)}
            options={overlayOptions}
          />
          <SelectField
            label="Gradient"
            value={formData.overlay?.gradient || ''}
            onChange={(e) => updateField('overlay.gradient', e.target.value)}
            options={gradientOptions}
          />
        </div>
        {formData.overlay?.darkOverlay && (
          <div className="mt-2">
            <div
              className={`w-full h-8 rounded-lg ${formData.overlay.darkOverlay}`}
              style={{
                backgroundImage: formData.overlay.darkOverlay.includes('gradient')
                  ? formData.overlay.darkOverlay.replace(/^bg-/, '')
                  : undefined,
                backgroundColor: formData.overlay.darkOverlay.includes('bg-') && !formData.overlay.darkOverlay.includes('gradient')
                  ? formData.overlay.darkOverlay.replace(/^bg-/, '').replace(/\s/g, '')
                  : undefined,
                minHeight: '32px'
              }}
            />
            <span className="text-xs text-gray-400 mt-1 block">Preview</span>
          </div>
        )}
      </div>

      {/* ===== CONTENT SECTION ===== */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Content</h4>

        {/* Tagline */}
        <div className="mb-3">
          <h5 className="text-xs font-medium text-gray-500 mb-1">Tagline</h5>
          <div className="space-y-2">
            <TextField
              label="Text"
              value={formData.content?.tagline?.text || ''}
              onChange={(e) => updateField('content.tagline.text', e.target.value)}
              placeholder="Tagline text"
            />
            <TextField
              label="Class Name (Fixed)"
              value={formData.content?.tagline?.className || 'uppercase tracking-[4px] font-semibold'}
              onChange={(e) => updateField('content.tagline.className', e.target.value)}
              placeholder="CSS classes"
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-400 -mt-1">Fixed class name - edit if needed</p>
          </div>
        </div>

        {/* Title */}
        <div className="mb-3">
          <h5 className="text-xs font-medium text-gray-500 mb-1">Title</h5>
          <div className="space-y-2">
            <TextField
              label="Text"
              value={formData.content?.title?.text || ''}
              onChange={(e) => updateField('content.title.text', e.target.value)}
              placeholder="Title text"
            />
            <TextField
              label="Class Name (Fixed)"
              value={formData.content?.title?.className || 'font-bold leading-tight'}
              onChange={(e) => updateField('content.title.className', e.target.value)}
              placeholder="CSS classes"
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-400 -mt-1">Fixed class name - edit if needed</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h5 className="text-xs font-medium text-gray-500 mb-1">Description</h5>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-400 mb-0.5">Text</label>
              <textarea
                value={formData.content?.description?.text || ''}
                onChange={(e) => updateField('content.description.text', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Description text"
              />
            </div>
            <TextField
              label="Class Name (Fixed)"
              value={formData.content?.description?.className || 'font-normal leading-tight'}
              onChange={(e) => updateField('content.description.className', e.target.value)}
              placeholder="CSS classes"
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-400 -mt-1">Fixed class name - edit if needed</p>
          </div>
        </div>
      </div>

      {/* ===== SINGLE BUTTON ===== */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Call to Action Button</h4>
        <p className="text-xs text-gray-400 mb-2">Only the first button will be displayed with a blue theme</p>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              label="Button Text"
              value={formData.buttons?.[0]?.text || ''}
              onChange={(e) => {
                const newButtons = [...(formData.buttons || [])];
                if (newButtons.length === 0) {
                  newButtons.push({ text: '', link: '', icon: true, className: '' });
                }
                newButtons[0].text = e.target.value;
                updateField('buttons', newButtons);
              }}
              placeholder="Button text"
            />
            <TextField
              label="Button Link"
              value={formData.buttons?.[0]?.link || ''}
              onChange={(e) => {
                const newButtons = [...(formData.buttons || [])];
                if (newButtons.length === 0) {
                  newButtons.push({ text: '', link: '', icon: true, className: '' });
                }
                newButtons[0].link = e.target.value;
                updateField('buttons', newButtons);
              }}
              placeholder="/about or https://example.com"
            />
            <div className="md:col-span-2">
              <TextField
                label="Additional Class Name"
                value={formData.buttons?.[0]?.className || ''}
                onChange={(e) => {
                  const newButtons = [...(formData.buttons || [])];
                  if (newButtons.length === 0) {
                    newButtons.push({ text: '', link: '', icon: true, className: '' });
                  }
                  newButtons[0].className = e.target.value;
                  updateField('buttons', newButtons);
                }}
                placeholder="Additional CSS classes"
              />
            </div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-600">
              💡 The button will be displayed with: <span className="font-semibold">blue background (#009BE2)</span> with white text and hover effects
            </p>
          </div>
        </div>
      </div>

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