// resources/js/pages/Backend/CMS/Section/components/modals/Editors/AboutUsEditor.jsx

import React, { useCallback } from 'react';
import { FaPlus } from 'react-icons/fa';
import ImageUpload from './shared/ImageUpload';
import ArrayManager from './shared/ArrayManager';
import { useImageUpload } from './shared/useImageUpload';
import { useSectionEditor } from './shared/useSectionEditor';
import { TextField, TextAreaField } from './shared/Fields';

// Move MissionItemRenderer outside the component as a separate component
const MissionItemRenderer = ({ item, index, onUpdateItem }) => {
  // Each mission item has its own image upload state
  const iconUpload = useImageUpload(item.icon || '');

  const handleIconChange = useCallback((src) => {
    iconUpload.handleImageChange(src);
    onUpdateItem(index, 'icon', src);
  }, [iconUpload, onUpdateItem, index]);

  const handleIconRemove = useCallback(() => {
    iconUpload.handleImageRemove();
    onUpdateItem(index, 'icon', '');
  }, [iconUpload, onUpdateItem, index]);

  const handleFieldChange = useCallback((field, value) => {
    onUpdateItem(index, field, value);
  }, [onUpdateItem, index]);

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      {/* Icon Upload with Drag & Drop */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Icon Image
        </label>
        <ImageUpload
          imageSrc={iconUpload.imageSrc}
          onImageChange={handleIconChange}
          onImageRemove={handleIconRemove}
          oldImagePath={iconUpload.oldImagePath}
          imageChanged={iconUpload.imageChanged}
          uploadPath="/storage/AboutUs/mission-icons/"
          isUploading={iconUpload.isUploading}
          uploadError={iconUpload.uploadError}
          dropzoneText="Drop mission icon here or click to upload"
          acceptedFileTypes="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
          maxFileSize={2}
          previewClassName="w-16 h-16 object-contain rounded-lg"
        />
        <p className="text-xs text-gray-400 mt-1">Recommended: SVG or PNG, max 2MB</p>
      </div>

      <TextField
        label="Icon URL (or use upload above)"
        value={item.icon || ''}
        onChange={(e) => handleFieldChange('icon', e.target.value)}
        placeholder="https://example.com/icon.svg"
      />

      <TextField
        label="Title"
        value={item.title || ''}
        onChange={(e) => handleFieldChange('title', e.target.value)}
        placeholder="Mission title"
      />

      <TextAreaField
        label="Description"
        value={item.description || ''}
        onChange={(e) => handleFieldChange('description', e.target.value)}
        placeholder="Mission description"
        rows={2}
      />

      <TextField
        label="Alt Text"
        value={item.alt || ''}
        onChange={(e) => handleFieldChange('alt', e.target.value)}
        placeholder="Icon alt text"
      />
    </div>
  );
};

// Separate component for Stats renderer
const StatRenderer = ({ stat, index, onUpdateItem }) => {
  const handleFieldChange = useCallback((field, value) => {
    onUpdateItem(index, field, value);
  }, [onUpdateItem, index]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <TextField
        label="Value"
        value={stat.value || ''}
        onChange={(e) => handleFieldChange('value', e.target.value)}
        placeholder="20"
      />
      <TextField
        label="Suffix"
        value={stat.suffix || ''}
        onChange={(e) => handleFieldChange('suffix', e.target.value)}
        placeholder="+"
      />
      <TextField
        label="Label"
        value={stat.label || ''}
        onChange={(e) => handleFieldChange('label', e.target.value)}
        placeholder="Years of Service"
      />
    </div>
  );
};

const AboutUsEditor = ({ section, hasData, onDataChange }) => {
  // Use the base editor hook - MUST be called before any conditional returns
  const {
    formData,
    updateField,
    updateArrayItem,
    addArrayItem,
    removeArrayItem,
    isDirty
  } = useSectionEditor(section, {}, onDataChange);

  // Custom hook to handle main image upload - MUST be called before any conditional returns
  const image = useImageUpload(formData?.image?.src || '');

  // Handle main image changes with useCallback to prevent re-renders
  const handleImageChange = useCallback((src) => {
    image.handleImageChange(src);
    updateField('image.src', src);
  }, [image, updateField]);

  const handleImageRemove = useCallback(() => {
    image.handleImageRemove();
    updateField('image.src', '');
  }, [image, updateField]);

  // Wrapper functions for array item updates
  const handleMissionItemUpdate = useCallback((index, field, value) => {
    updateArrayItem('mission.items', index, field, value);
  }, [updateArrayItem]);

  const handleStatUpdate = useCallback((index, field, value) => {
    updateArrayItem('impact.stats', index, field, value);
  }, [updateArrayItem]);

  // Empty state - Now safe to have conditional return after all hooks
  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center py-8 text-gray-400">
        <p className="text-sm">No data available to edit</p>
        <p className="text-xs mt-1">Click "Save Changes" to create the initial data structure</p>
      </div>
    );
  }

  const missionItems = formData.mission?.items || [];
  const impactStats = formData.impact?.stats || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {isDirty && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          ⚠️ Unsaved changes - click "Save Changes" to apply
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit About Us Data</h3>

      {/* Section Content */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Section Content</h4>
        <div className="space-y-3">
          <TextField
            label="Title"
            value={formData.section?.title || ''}
            onChange={(e) => updateField('section.title', e.target.value)}
            placeholder="About us"
          />
          <TextAreaField
            label="Description"
            value={formData.section?.description || ''}
            onChange={(e) => updateField('section.description', e.target.value)}
            placeholder="Description about the organization"
            rows={3}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              label="Button Text"
              value={formData.section?.button?.text || ''}
              onChange={(e) => updateField('section.button.text', e.target.value)}
              placeholder="More about us"
            />
            <TextField
              label="Button Link"
              value={formData.section?.button?.link || ''}
              onChange={(e) => updateField('section.button.link', e.target.value)}
              placeholder="/about"
            />
          </div>
        </div>
      </div>

      {/* Mission Items with Icon Upload */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">Mission Items ({missionItems.length})</h4>
          <button
            type="button"
            onClick={() => addArrayItem('mission.items', { icon: '', title: '', description: '', alt: '' })}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FaPlus size={12} /> Add Mission Item
          </button>
        </div>

        <TextField
          label="Mission Section Title"
          value={formData.mission?.title || ''}
          onChange={(e) => updateField('mission.title', e.target.value)}
          placeholder="The mission of our organization"
        />

        <ArrayManager
          items={missionItems}
          onAdd={() => addArrayItem('mission.items', { icon: '', title: '', description: '', alt: '' })}
          onRemove={(index) => removeArrayItem('mission.items', index)}
          itemLabel="Mission Item"
          addLabel="Add Mission Item"
          renderItem={(item, index) => (
            <MissionItemRenderer
              key={index}
              item={item}
              index={index}
              onUpdateItem={handleMissionItemUpdate}
              onRemoveItem={(idx) => removeArrayItem('mission.items', idx)}
            />
          )}
        />
      </div>

      {/* Impact Stats */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">Impact Stats ({impactStats.length})</h4>
          <button
            type="button"
            onClick={() => addArrayItem('impact.stats', { value: '', suffix: '', label: '' })}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FaPlus size={12} /> Add Stat
          </button>
        </div>

        <TextField
          label="Impact Section Title"
          value={formData.impact?.title || ''}
          onChange={(e) => updateField('impact.title', e.target.value)}
          placeholder="Impact In Numbers"
        />

        <ArrayManager
          items={impactStats}
          onAdd={() => addArrayItem('impact.stats', { value: '', suffix: '', label: '' })}
          onRemove={(index) => removeArrayItem('impact.stats', index)}
          itemLabel="Stat"
          addLabel="Add Stat"
          renderItem={(stat, index) => (
            <StatRenderer
              key={index}
              stat={stat}
              index={index}
              onUpdateItem={handleStatUpdate}
            />
          )}
        />
      </div>

      {/* Main Image */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Main Image</h4>
        <ImageUpload
          imageSrc={image.imageSrc}
          onImageChange={handleImageChange}
          onImageRemove={handleImageRemove}
          oldImagePath={image.oldImagePath}
          imageChanged={image.imageChanged}
          uploadPath="/storage/AboutUs/"
          isUploading={image.isUploading}
          uploadError={image.uploadError}
        />
        <TextField
          label="Image Alt Text"
          value={formData.image?.alt || ''}
          onChange={(e) => updateField('image.alt', e.target.value)}
          placeholder="About Us Image"
          className="mt-2"
        />
      </div>

      {/* Data Information */}
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
          <div>
            <span className="text-gray-500">Modified:</span>
            <span className={`ml-2 font-medium ${isDirty ? 'text-yellow-600' : 'text-green-600'}`}>
              {isDirty ? '⚠️ Unsaved' : '✓ Saved'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsEditor;