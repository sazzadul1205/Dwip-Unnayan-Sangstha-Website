// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/FollowUsEditor.jsx

import React, { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaTwitter, FaGlobe } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { TextField, SelectField } from './shared/Fields';

const FollowUsEditor = ({ section, hasData, onDataChange }) => {
  // ===== STATE MANAGEMENT =====
  // Get initial data - it's an array of social media links
  const initialData = section?.data?.data || section?.data || [];
  const [formData, setFormData] = useState(Array.isArray(initialData) ? initialData : []);

  // Notify parent component when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // ===== ICON OPTIONS =====
  // Available social media icons with their corresponding React icons
  const iconOptions = [
    { value: 'facebook', label: 'Facebook', icon: <FaFacebook className="text-blue-600" size={18} /> },
    { value: 'instagram', label: 'Instagram', icon: <FaInstagram className="text-pink-600" size={18} /> },
    { value: 'linkedin', label: 'LinkedIn', icon: <FaLinkedin className="text-blue-700" size={18} /> },
    { value: 'youtube', label: 'YouTube', icon: <FaYoutube className="text-red-600" size={18} /> },
    { value: 'twitter', label: 'X (Twitter)', icon: <FaTwitter className="text-gray-700" size={18} /> },
    { value: 'globe', label: 'Website', icon: <FaGlobe className="text-gray-600" size={18} /> },
  ];

  // ===== HELPER FUNCTIONS =====

  // Update a field in a specific social link
  const updateArrayItem = (index, field, value) => {
    const newData = [...formData];
    if (!newData[index]) newData[index] = {};
    newData[index][field] = value;
    setFormData(newData);
  };

  // ===== SOCIAL LINK FUNCTIONS =====

  // Add a new social link with default values
  const addLink = () => {
    const newData = [...formData];
    newData.push({
      icon: 'facebook', // Default to Facebook
      label: '',
      url: '#'
    });
    setFormData(newData);
  };

  // Remove a social link with confirmation dialog
  const removeLink = (index) => {
    Swal.fire({
      title: 'Remove Social Link',
      text: `Are you sure you want to remove "${formData[index]?.label || 'this link'}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const newData = [...formData];
        newData.splice(index, 1);
        setFormData(newData);
      }
    });
  };

  // ===== ICON HELPERS =====

  // Get the React icon component for a given icon name
  const getIconPreview = (iconName) => {
    const option = iconOptions.find(opt => opt.value === iconName);
    return option ? option.icon : <FaGlobe className="text-gray-400" size={18} />;
  };

  // Get the display label for a given icon name
  const getIconLabel = (iconName) => {
    const option = iconOptions.find(opt => opt.value === iconName);
    return option ? option.label : iconName;
  };

  // ===== EMPTY STATE =====
  // Show message when no social links exist
  if (!hasData || !formData || formData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Follow Us Data</h3>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No social links added</p>
          <p className="text-xs mt-1">Click "Add Social Link" to create one</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={addLink}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <FaPlus size={14} />
            Add Social Link
          </button>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">

      {/* Header with link count and add button */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Edit Follow Us Data ({formData.length} links)</h3>
        <button
          type="button"
          onClick={addLink}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium"
        >
          <FaPlus size={12} />
          Add Social Link
        </button>
      </div>

      {/* ===== LIST OF SOCIAL LINKS ===== */}
      <div className="space-y-3">
        {formData.map((link, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">

            {/* Link header with index, icon preview, and remove button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Link #{index + 1}</span>
                {/* Show icon preview */}
                <span className="text-sm">
                  {getIconPreview(link.icon)}
                </span>
                {/* Show icon label */}
                <span className="text-xs text-gray-600">
                  {getIconLabel(link.icon)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeLink(index)}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <FaTrash size={12} /> Remove
              </button>
            </div>

            {/* ===== LINK FIELDS (3 columns on desktop) ===== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Icon selector dropdown */}
              <SelectField
                label="Icon"
                value={link.icon || 'facebook'}
                onChange={(e) => updateArrayItem(index, 'icon', e.target.value)}
                options={iconOptions.map(opt => ({ value: opt.value, label: opt.label }))}
              />
              {/* Label field */}
              <TextField
                label="Label"
                value={link.label || ''}
                onChange={(e) => updateArrayItem(index, 'label', e.target.value)}
                placeholder="Facebook"
              />
              {/* URL field */}
              <TextField
                label="URL"
                value={link.url || ''}
                onChange={(e) => updateArrayItem(index, 'url', e.target.value)}
                placeholder="https://facebook.com/your-page"
              />
            </div>

            {/* ===== LINK PREVIEW ===== */}
            {/* Shows a preview of the link as it would appear on the site */}
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Preview:</span>
                {/* Icon preview */}
                <span className="text-sm">
                  {getIconPreview(link.icon)}
                </span>
                {/* Label preview */}
                <span className="font-medium text-gray-700">
                  {link.label || 'Untitled'}
                </span>
                {/* URL preview - clickable if valid */}
                {link.url && link.url !== '#' && (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate max-w-48"
                  >
                    {link.url}
                  </a>
                )}
                {/* Show if no URL is set */}
                {(!link.url || link.url === '#') && (
                  <span className="text-gray-400">(no URL set)</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== DATA INFORMATION ===== */}
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
            <span className="text-gray-500">Total Links:</span>
            <span className="ml-2 text-gray-700 font-mono">{formData.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowUsEditor;