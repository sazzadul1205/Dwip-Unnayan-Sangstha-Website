// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/ContactReachEditor.jsx

// React
import React, { useState, useEffect } from 'react';

// Shared Components
import { TextField } from './shared/Fields';
import ImageUpload from './shared/ImageUpload';
import { useImageUpload } from './shared/useImageUpload';

const ContactReachEditor = ({ section, hasData, onDataChange }) => {
  // ===== STATE MANAGEMENT =====
  // Get initial data from section prop
  const initialData = section?.data?.data || section?.data || {};

  // State to hold all form data
  const [formData, setFormData] = useState(initialData);

  // Custom hook to handle image upload functionality
  const image = useImageUpload(initialData?.image || '');

  // Notify parent component when form data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // ===== HELPER FUNCTIONS =====

  // Update top-level fields (e.g., title, buttonText, image)
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ===== EMPTY STATE =====
  // Show message when no data exists
  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Contact Reach Data</h3>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No data available to edit</p>
          <p className="text-xs mt-1">Data will appear here once the section has content</p>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Contact Reach Data</h3>

      {/* ===== IMAGE SECTION ===== */}
      {/* Upload and manage the main image for the contact reach section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Image</h4>
        <ImageUpload
          imageSrc={image.imageSrc}
          onImageChange={(src) => {
            image.handleImageChange(src);
            updateField('image', src);
          }}
          onImageRemove={() => {
            image.handleImageRemove();
            updateField('image', '');
          }}
          oldImagePath={image.oldImagePath}
          imageChanged={image.imageChanged}
          uploadPath="/storage/ContactUs/"
        />
      </div>

      {/* ===== CONTENT SECTION ===== */}
      {/* Text fields for title and button text */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Content</h4>
        <div className="space-y-3">
          <TextField
            label="Title"
            value={formData.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Reach out to us today!"
          />
          <TextField
            label="Button Text"
            value={formData.buttonText || ''}
            onChange={(e) => updateField('buttonText', e.target.value)}
            placeholder="Submit Message"
          />
        </div>
      </div>

      {/* ===== PREVIEW SECTION ===== */}
      {/* Shows a preview of the current data for quick reference */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Preview</h4>
        <div className="space-y-2">
          {/* Title preview */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Title:</span>
            <span className="text-sm text-gray-700 font-medium">
              {formData.title || 'Not set'}
            </span>
          </div>
          {/* Button text preview */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Button:</span>
            <span className="text-sm text-blue-600">
              {formData.buttonText || 'Not set'}
            </span>
          </div>
          {/* Image preview */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Image:</span>
            <span className="text-sm text-gray-500 truncate max-w-48">
              {formData.image ? (formData.image.startsWith('data:image') ? 'New image' : formData.image) : 'No image'}
            </span>
          </div>
        </div>
      </div>

      {/* ===== DATA INFORMATION ===== */}
      {/* Display metadata about the section for reference */}
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

export default ContactReachEditor;