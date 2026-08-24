// resources/js/pages/Backend/CMS/Section/components/modals/Editors/PageTagBannerEditor.jsx

// React
import React, { useState, useEffect } from 'react';

// Icons
import { FaTrash, FaPlus } from 'react-icons/fa';

// Shared Components
import ImageUpload from './shared/ImageUpload';
import { TextField, SelectField } from './shared/Fields';
import { useImageUpload } from './shared/useImageUpload';

const PageTagBannerEditor = ({ section, hasData, onDataChange }) => {
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

  // Update nested object fields using dot notation
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

  // Update a field in a tag array item
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

  // ===== TAG MANAGEMENT FUNCTIONS =====

  // Add a new tag
  const addTag = () => {
    const newData = { ...formData };
    if (!newData.tags) newData.tags = [];
    newData.tags.push({ label: '', color: '#009BE2' });
    setFormData(newData);
  };

  // Remove a tag
  const removeTag = (index) => {
    const newData = { ...formData };
    if (newData.tags) {
      newData.tags.splice(index, 1);
      setFormData(newData);
    }
  };

  // ===== OVERLAY OPTIONS =====
  const overlayOptions = [
    { value: 'bg-black/40 lg:bg-black/50', label: 'Light Dark Overlay' },
    { value: 'bg-black/60 lg:bg-black/70', label: 'Medium Dark Overlay' },
    { value: 'bg-black/80 lg:bg-black/90', label: 'Heavy Dark Overlay' },
    { value: 'bg-linear-to-r from-black/85 via-black/10 to-transparent', label: 'Gradient Left to Right' },
    { value: 'bg-linear-to-l from-black/85 via-black/10 to-transparent', label: 'Gradient Right to Left' },
    { value: 'bg-linear-to-t from-black/85 via-black/10 to-transparent', label: 'Gradient Bottom to Top' },
    { value: 'bg-linear-to-b from-black/85 via-black/10 to-transparent', label: 'Gradient Top to Bottom' },
  ];

  const gradientOptions = [
    { value: 'bg-linear-to-r from-black/85 via-black/10 to-transparent', label: 'Left to Right' },
    { value: 'bg-linear-to-l from-black/85 via-black/10 to-transparent', label: 'Right to Left' },
    { value: 'bg-linear-to-t from-black/85 via-black/10 to-transparent', label: 'Bottom to Top' },
    { value: 'bg-linear-to-b from-black/85 via-black/10 to-transparent', label: 'Top to Bottom' },
    { value: '', label: 'None' },
  ];

  // ===== COLOR OPTIONS FOR TAGS =====
  const colorOptions = [
    { value: '#009BE2', label: 'Blue' },
    { value: '#FF6B6B', label: 'Red' },
    { value: '#4ECDC4', label: 'Teal' },
    { value: '#FFE66D', label: 'Yellow' },
    { value: '#6C5CE7', label: 'Purple' },
    { value: '#FD79A8', label: 'Pink' },
    { value: '#00B894', label: 'Green' },
    { value: '#FDCB6E', label: 'Gold' },
    { value: '#E17055', label: 'Orange' },
    { value: '#0984E3', label: 'Dark Blue' },
    { value: '#A29BFE', label: 'Lavender' },
    { value: '#55EFC4', label: 'Mint' },
    { value: '#F8A5C2', label: 'Rose' },
    { value: '#74B9FF', label: 'Light Blue' },
    { value: '#FF7675', label: 'Coral' },
  ];

  // ===== EMPTY STATE =====
  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Page Tag Banner Data</h3>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No data available to edit</p>
          <p className="text-xs mt-1">Data will appear here once the section has content</p>
        </div>
      </div>
    );
  }

  const tags = formData.tags || [];

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Page Tag Banner Data</h3>

      {/* ===== BACKGROUND IMAGE ===== */}
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

      {/* ===== ALT TEXT ===== */}
      <TextField
        label="Alt Text"
        value={formData.background?.alt || ''}
        onChange={(e) => updateField('background.alt', e.target.value)}
        placeholder="Alt text for image"
        className="mb-4"
      />

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

      {/* ===== TITLE ===== */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Banner Content</h4>
        <TextField
          label="Tag Title"
          value={formData.tagTitle || ''}
          onChange={(e) => updateField('tagTitle', e.target.value)}
          placeholder="Photo Gallery"
        />
        <p className="text-xs text-gray-400 mt-1">Main title displayed on the banner</p>
      </div>

      {/* ===== TAGS SECTION ===== */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">Tags</h4>
          <button
            type="button"
            onClick={addTag}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FaPlus size={12} /> Add Tag
          </button>
        </div>

        {/* Active Tag Selection */}
        {tags.length > 0 && (
          <div className="mb-3">
            <SelectField
              label="Active Tag"
              value={formData.activeTag || tags[0]?.label || ''}
              onChange={(e) => updateField('activeTag', e.target.value)}
              options={tags.map(tag => ({ value: tag.label, label: tag.label || 'Untitled' }))}
            />
            <p className="text-xs text-gray-400 mt-1">The tag that will be highlighted by default</p>
          </div>
        )}

        {/* Tags List */}
        <div className="space-y-3">
          {tags.map((tag, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Tag #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <FaTrash size={12} /> Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tag Label */}
                <TextField
                  label="Label"
                  value={tag.label || ''}
                  onChange={(e) => updateArrayItem('tags', index, 'label', e.target.value)}
                  placeholder="DUS in action"
                />

                {/* Tag Color - Using color picker with dropdown options */}

                {/* Tag Color - Using color picker with dropdown options */}
                <div>
                  <label className="block text-xs text-gray-400 mb-0.5">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tag.color || '#009BE2'}
                      onChange={(e) => updateArrayItem('tags', index, 'color', e.target.value)}
                      className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <select
                      value={tag.color || '#009BE2'}
                      onChange={(e) => updateArrayItem('tags', index, 'color', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                    >
                      {colorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tag Preview */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Preview:</span>
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold"
                    style={{
                      backgroundColor: tag.color || '#009BE2',
                      color: '#FFFFFF'
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    {tag.label || 'Tag'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tags.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            No tags added. Click "Add Tag" to create one.
          </div>
        )}
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
            <span className="text-gray-500">Total Tags:</span>
            <span className="ml-2 text-gray-700 font-mono">{tags.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageTagBannerEditor;