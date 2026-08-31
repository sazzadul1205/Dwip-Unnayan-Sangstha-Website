// resources/js/pages/Backend/CMS/Section/components/modals/Editors/LegalEditor.jsx

// React
import React, { useState, useEffect } from 'react';

// Shared Components
import ImageUpload from './shared/ImageUpload';
import { TextField, SelectField } from './shared/Fields';
import { useImageUpload } from './shared/useImageUpload';

const LegalEditor = ({ section, hasData, onDataChange }) => {
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
  // Overlay options for the legal section background
  const overlayOptions = [
    { value: 'bg-black/30', label: 'Light Dark Overlay' },
    { value: 'bg-black/40', label: 'Medium Dark Overlay' },
    { value: 'bg-black/50', label: 'Standard Dark Overlay' },
    { value: 'bg-black/60', label: 'Dark Overlay' },
    { value: 'bg-black/70', label: 'Heavy Dark Overlay' },
    { value: 'bg-black/80', label: 'Very Heavy Dark Overlay' },
    { value: 'bg-linear-to-r from-black/85 via-black/10 to-transparent', label: 'Gradient Left to Right' },
    { value: 'bg-linear-to-l from-black/85 via-black/10 to-transparent', label: 'Gradient Right to Left' },
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
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Legal Section Data</h3>

      {/* <!-- ===== BACKGROUND IMAGE ===== --> */}
      {/* Upload and manage the background image for the legal section */}
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
          uploadPath="/storage/AboutUs/"
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
      {/* Configure the dark overlay or gradient on the background */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Overlay Settings</h4>
        <SelectField
          label="Dark Overlay"
          value={formData.overlay?.darkOverlay || ''}
          onChange={(e) => updateField('overlay.darkOverlay', e.target.value)}
          options={overlayOptions}
        />
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

      {/* <!-- ===== TEXT BOX CONTENT ===== --> */}
      {/* Title lines, button text, and button link for the legal section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Text Box Content</h4>
        <div className="space-y-3">
          {/* Title Line 1 - Main title */}
          <TextField
            label="Title Line 1"
            value={formData.textBox?.title || ''}
            onChange={(e) => updateField('textBox.title', e.target.value)}
            placeholder="Legal Status and Org."
          />
          {/* Title Line 2 - Subtitle */}
          <TextField
            label="Title Line 2"
            value={formData.textBox?.titleLine2 || ''}
            onChange={(e) => updateField('textBox.titleLine2', e.target.value)}
            placeholder="Affiliations"
          />
          {/* Button fields - side by side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              label="Button Text"
              value={formData.textBox?.buttonText || ''}
              onChange={(e) => updateField('textBox.buttonText', e.target.value)}
              placeholder="Learn More Affiliations"
            />
            <TextField
              label="Button Link"
              value={formData.textBox?.buttonLink || ''}
              onChange={(e) => updateField('textBox.buttonLink', e.target.value)}
              placeholder="/about/legal-affiliations"
            />
          </div>
        </div>
      </div>

      {/* <!-- ===== PREVIEW SECTION ===== --> */}
      {/* Shows a preview of the current data for quick reference */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Preview</h4>
        <div className="space-y-2">
          {/* Title preview - combines both lines if available */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Title:</span>
            <span className="text-sm text-gray-700 font-medium">
              {formData.textBox?.title || 'Not set'}
              {formData.textBox?.titleLine2 && ` - ${formData.textBox.titleLine2}`}
            </span>
          </div>
          {/* Button preview with link */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Button:</span>
            <span className="text-sm text-blue-600">
              {formData.textBox?.buttonText || 'Not set'}
            </span>
            {formData.textBox?.buttonLink && (
              <span className="text-xs text-gray-400">
                → {formData.textBox.buttonLink}
              </span>
            )}
          </div>
          {/* Overlay preview */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Overlay:</span>
            <span className="text-xs text-gray-600 font-mono">
              {formData.overlay?.darkOverlay || 'None'}
            </span>
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

export default LegalEditor;