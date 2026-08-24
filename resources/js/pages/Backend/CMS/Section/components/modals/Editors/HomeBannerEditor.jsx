// resources/js/pages/Backend/CMS/Section/components/modals/Editors/HomeBannerEditor.jsx

// React
import React, { useState, useEffect } from 'react';

// Icons
import { FaTrash, FaPlus } from 'react-icons/fa';

// Sweetalert
import Swal from 'sweetalert2';

// Shared Components
import ImageUpload from './shared/ImageUpload';
import { TextField, SelectField } from './shared/Fields';
import { useImageUpload } from './shared/useImageUpload';

const HomeBannerEditor = ({ section, hasData, onDataChange }) => {
  // ===== STATE MANAGEMENT =====
  // Get initial data from section prop
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);

  // Custom hook to handle image upload functionality
  const image = useImageUpload(initialData?.background?.src || '');

  // Notify parent when form data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // ===== HELPER FUNCTIONS =====

  // Update nested object fields using dot notation (e.g., 'background.src')
  const updateField = (path, value) => {
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setFormData(newData);
  };

  // Update a field in a button array item
  const updateArrayItem = (path, index, field, value) => {
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        if (!current[keys[i]]) current[keys[i]] = [];
        if (!current[keys[i]][index]) current[keys[i]][index] = {};
        current[keys[i]][index] = { ...current[keys[i]][index], [field]: value };
      } else {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
    }
    setFormData(newData);
  };

  // ===== BUTTON MANAGEMENT FUNCTIONS =====

  // Add a new button (max 2)
  const addArrayItem = (path, template = {}) => {
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    // Traverse to the parent of the array
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (!Array.isArray(current[lastKey])) current[lastKey] = [];

    // Enforce maximum 2 buttons
    if (current[lastKey].length >= 2) {
      Swal.fire({
        icon: 'warning',
        title: 'Maximum 2 Buttons',
        text: 'You can only have up to 2 buttons in this section.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Generate unique ID for the new button
    const newId = Math.max(0, ...current[lastKey].map(item => item.id || 0)) + 1;
    current[lastKey].push({ ...template, id: newId });
    setFormData(newData);
  };

  // Remove a button by index
  const removeArrayItem = (path, index) => {
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    // Traverse to the parent of the array
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current[lastKey])) {
      current[lastKey].splice(index, 1);
    }
    setFormData(newData);
  };

  // ===== OPTIONS =====
  // Overlay options for the banner background
  const overlayOptions = [
    { value: 'bg-black/40 lg:bg-black/50', label: 'Light Dark Overlay' },
    { value: 'bg-black/60 lg:bg-black/70', label: 'Medium Dark Overlay' },
    { value: 'bg-black/80 lg:bg-black/90', label: 'Heavy Dark Overlay' },
    { value: 'bg-linear-to-r from-black/85 via-black/10 to-transparent', label: 'Gradient Left to Right' },
    { value: 'bg-linear-to-l from-black/85 via-black/10 to-transparent', label: 'Gradient Right to Left' },
    { value: 'bg-linear-to-t from-black/85 via-black/10 to-transparent', label: 'Gradient Bottom to Top' },
    { value: 'bg-linear-to-b from-black/85 via-black/10 to-transparent', label: 'Gradient Top to Bottom' },
  ];

  // Gradient options for the banner
  const gradientOptions = [
    { value: 'bg-linear-to-r from-black/85 via-black/10 to-transparent', label: 'Left to Right' },
    { value: 'bg-linear-to-l from-black/85 via-black/10 to-transparent', label: 'Right to Left' },
    { value: 'bg-linear-to-t from-black/85 via-black/10 to-transparent', label: 'Bottom to Top' },
    { value: 'bg-linear-to-b from-black/85 via-black/10 to-transparent', label: 'Top to Bottom' },
    { value: '', label: 'None' },
  ];

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Data</h3>

      {/* <!-- ===== BACKGROUND IMAGE ===== --> */}
      {/* Upload and manage the banner background image */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Background Image</h4>
        <ImageUpload
          imageSrc={image.imageSrc}
          onImageChange={(src) => {
            image.handleImageChange(src);
            updateField('background.src', src);
          }}
          onImageRemove={() => {
            image.handleImageRemove();
            updateField('background.src', '');
          }}
          oldImagePath={image.oldImagePath}
          imageChanged={image.imageChanged}
          uploadPath="/storage/Banner/"
        />
      </div>

      {/* <!-- ===== ALT TEXT ===== --> */}
      <TextField
        label="Alt Text"
        value={formData.background?.alt || ''}
        onChange={(e) => updateField('background.alt', e.target.value)}
        placeholder="Alt text for image"
        className="mb-4"
      />

      {/* <!-- ===== OVERLAY SETTINGS ===== --> */}
      {/* Configure the overlay/gradient on the banner */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Overlay Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Dark Overlay selector */}
          <SelectField
            label="Dark Overlay"
            value={formData.overlay?.darkOverlay || ''}
            onChange={(e) => updateField('overlay.darkOverlay', e.target.value)}
            options={overlayOptions}
          />
          {/* Gradient selector */}
          <SelectField
            label="Gradient"
            value={formData.overlay?.gradient || ''}
            onChange={(e) => updateField('overlay.gradient', e.target.value)}
            options={gradientOptions}
          />
        </div>
        {/* Show live preview of the selected overlay */}
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

      {/* <!-- ===== CONTENT SECTION ===== --> */}
      {/* Tagline, Title, and Description with fixed class names */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Content</h4>

        {/* <!-- ===== TAGLINE ===== --> */}
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

        {/* <!-- ===== TITLE ===== --> */}
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

        {/* <!-- ===== DESCRIPTION ===== --> */}
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

      {/* <!-- ===== BUTTONS SECTION ===== --> */}
      {/* Manage up to 2 call-to-action buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">Buttons (Max 2)</h4>
          <button
            type="button"
            onClick={() => addArrayItem('buttons', { text: '', variant: 'primary', className: '', icon: true })}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FaPlus size={12} /> Add Button
          </button>
        </div>

        {/* Loop through buttons */}
        {(formData.buttons || []).map((button, index) => (
          <div key={button.id || index} className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {/* Button header with remove button */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">Button #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeArrayItem('buttons', index)}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <FaTrash size={12} /> Remove
              </button>
            </div>
            {/* Button fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextField
                label="Text"
                value={button.text || ''}
                onChange={(e) => updateArrayItem('buttons', index, 'text', e.target.value)}
                placeholder="Button text"
              />
              <TextField
                label="Variant"
                value={button.variant || ''}
                onChange={(e) => updateArrayItem('buttons', index, 'variant', e.target.value)}
                placeholder="primary / secondary"
              />
              <div className="md:col-span-2">
                <TextField
                  label="Class Name"
                  value={button.className || ''}
                  onChange={(e) => updateArrayItem('buttons', index, 'className', e.target.value)}
                  placeholder="CSS classes"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Empty state - no buttons */}
        {(!formData.buttons || formData.buttons.length === 0) && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No buttons added. Click "Add Button" to create one (max 2).
          </div>
        )}

        {/* Max reached message */}
        {(formData.buttons || []).length >= 2 && (
          <div className="text-center text-xs text-yellow-600 mt-1">
            Maximum of 2 buttons reached.
          </div>
        )}
      </div>

      {/* <!-- ===== DATA INFORMATION ===== --> */}
      {/* Display metadata about the section */}
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