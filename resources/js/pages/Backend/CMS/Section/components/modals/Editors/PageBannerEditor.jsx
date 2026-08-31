// resources/js/pages/Backend/CMS/Section/components/modals/Editors/PageBannerEditor.jsx

import React, { useState, useEffect } from 'react';
import ImageUpload from './shared/ImageUpload';
import { TextField, SelectField } from './shared/Fields';
import { useImageUpload } from './shared/useImageUpload';

const PageBannerEditor = ({ section, hasData, onDataChange }) => {
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

  // ===== EMPTY STATE =====
  // Show message when no data exists
  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center py-8 text-gray-400">
        <p className="text-sm">No data available to edit</p>
        <p className="text-xs mt-1">Data will appear here once the section has content</p>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Page Banner Data</h3>

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
      {/* Title and Description with fixed class names */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Content</h4>

        {/* <!-- ===== TITLE ===== --> */}
        <div className="mb-3">
          <h5 className="text-xs font-medium text-gray-500 mb-1">Title</h5>
          <div className="space-y-2">
            <TextField
              label="Text"
              value={formData.content?.title?.text || ''}
              onChange={(e) => updateField('content.title.text', e.target.value)}
              placeholder="About Us"
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
            <TextField
              label="Text"
              value={formData.content?.description?.text || ''}
              onChange={(e) => updateField('content.description.text', e.target.value)}
              placeholder="Our mission is to help all the people in need"
            />
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

export default PageBannerEditor;