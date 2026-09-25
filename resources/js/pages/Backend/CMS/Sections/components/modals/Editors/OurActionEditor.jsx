// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/OurActionEditor.jsx

// React
import React, { useState, useEffect } from 'react';

// Icons
import { FaTrash, FaPlus, FaUpload, FaTimes } from 'react-icons/fa';

// Sweetalert
import Swal from 'sweetalert2';

// Shared Components
import { TextField, TextAreaField } from './shared/Fields';

const OurActionEditor = ({ section, hasData, onDataChange }) => {
  // ===== STATE MANAGEMENT =====
  // Get initial data from section prop
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);

  // Track icon changes for deletion tracking
  const [iconChanges, setIconChanges] = useState({});
  const [oldIconPaths, setOldIconPaths] = useState({});
  const [uploadingIcon, setUploadingIcon] = useState({});

  // Notify parent when form data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // ===== HELPER FUNCTIONS =====

  // Update nested object fields using dot notation (e.g., 'section.title')
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

  // Update a field in an action item
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

  // ===== ARRAY MANAGEMENT FUNCTIONS =====

  // Add a new action item with default values
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

    // Generate unique ID for the new item
    const newId = Math.max(0, ...current[lastKey].map(item => item.id || 0)) + 1;
    current[lastKey].push({ ...template, id: newId });
    setFormData(newData);
  };

  // Remove an action item and track its icon for deletion
  const removeArrayItem = (path, index) => {
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    // Store old icon path before removal (for deletion tracking)
    const items = formData.actions || [];
    if (items[index]?.icon) {
      setOldIconPaths(prev => ({
        ...prev,
        [index]: items[index].icon
      }));
      setIconChanges(prev => ({ ...prev, [index]: true }));
    }

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

  // ===== ICON HANDLING FUNCTIONS =====

  // Handle icon drop from drag & drop
  const handleIconDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      processIconFile(file, index);
    }
  };

  // Handle icon selection via file input
  const handleIconSelect = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      processIconFile(file, index);
    }
    e.target.value = '';
  };

  // Process and upload the icon file
  const processIconFile = (file, index) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select an image file (JPEG, PNG, GIF, WebP, SVG)',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Validate file size (max 2MB for icons)
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Icon size should be less than 2MB',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Store old icon path if it exists
    const items = formData.actions || [];
    if (items[index]?.icon && !iconChanges[index]) {
      setOldIconPaths(prev => ({
        ...prev,
        [index]: items[index].icon
      }));
    }

    // Read and convert icon to base64
    setUploadingIcon(prev => ({ ...prev, [index]: true }));
    const reader = new FileReader();
    reader.onload = (event) => {
      const iconUrl = event.target.result;
      updateArrayItem('actions', index, 'icon', iconUrl);
      setIconChanges(prev => ({ ...prev, [index]: true }));
      setUploadingIcon(prev => ({ ...prev, [index]: false }));
    };
    reader.onerror = () => {
      setUploadingIcon(prev => ({ ...prev, [index]: false }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read the icon file',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove icon from an action item
  const removeIcon = (index) => {
    const items = formData.actions || [];
    if (items[index]?.icon) {
      setOldIconPaths(prev => ({
        ...prev,
        [index]: items[index].icon
      }));
    }
    updateArrayItem('actions', index, 'icon', '');
    setIconChanges(prev => ({ ...prev, [index]: true }));
  };

  // Display path for icon (shows if it's new or existing)
  const getDisplayPath = (src) => {
    if (!src) return '';
    if (src.startsWith('data:image')) {
      return 'New icon (will be uploaded)';
    }
    return src;
  };

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

  const actions = formData.actions || [];

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Our Actions Data</h3>

      {/* <!-- ===== SECTION CONTENT ===== --> */}
      {/* Title and description for the actions section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Section Content</h4>
        <div className="space-y-3">
          <TextField
            label="Title"
            value={formData.section?.title || ''}
            onChange={(e) => updateField('section.title', e.target.value)}
            placeholder="Our Actions for Social Change"
          />
          <TextAreaField
            label="Description"
            value={formData.section?.description || ''}
            onChange={(e) => updateField('section.description', e.target.value)}
            placeholder="Description of the actions"
            rows={2}
          />
        </div>
      </div>

      {/* <!-- ===== ACTION ITEMS ===== --> */}
      {/* List of action items with icon, title, description, and alt text */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">Action Items ({actions.length})</h4>
          <button
            type="button"
            onClick={() => addArrayItem('actions', { id: Date.now(), icon: '', title: '', description: '', alt: '' })}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FaPlus size={12} /> Add Action Item
          </button>
        </div>

        {/* Loop through each action item */}
        <div className="space-y-3">
          {actions.map((item, index) => (
            <div key={item.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">

              {/* Item header with index and remove button */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Item #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeArrayItem('actions', index)}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <FaTrash size={12} /> Remove
                </button>
              </div>

              {/* <!-- ===== ITEM FIELDS (2 columns on desktop) ===== --> */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {/* <!-- ===== LEFT COLUMN: ICON ===== --> */}
                <div>
                  <label className="block text-xs text-gray-400 mb-0.5">Icon</label>

                  {/* Drag & drop icon upload area */}
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-3 transition-all ${uploadingIcon[index] ? 'opacity-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    onDragEnter={(e) => e.preventDefault()}
                    onDragLeave={(e) => e.preventDefault()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleIconDrop(e, index)}
                  >
                    {/* Show icon preview if exists */}
                    {item.icon ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={item.icon}
                          alt={item.alt || 'Icon'}
                          className="w-12 h-12 object-contain rounded border border-gray-200"
                        />
                        <span className="text-xs text-gray-500 truncate flex-1">
                          {getDisplayPath(item.icon)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeIcon(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ) : (
                      // Empty state for icon upload
                      <div className="flex items-center gap-3 text-gray-400">
                        <FaUpload size={18} />
                        <span className="text-sm">Drop icon or click to browse</span>
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleIconSelect(e, index)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingIcon[index]}
                    />

                    {/* Loading spinner */}
                    {uploadingIcon[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* Show old icon deletion notice */}
                  {iconChanges[index] && oldIconPaths[index] && (
                    <div className="mt-1 text-xs text-gray-400">
                      <span className="text-red-500">🗑️</span> Old icon will be deleted: {oldIconPaths[index]}
                    </div>
                  )}
                </div>

                {/* <!-- ===== RIGHT COLUMN: FIELDS ===== --> */}
                <div className="space-y-2">
                  {/* Title */}
                  <TextField
                    label="Title"
                    value={item.title || ''}
                    onChange={(e) => updateArrayItem('actions', index, 'title', e.target.value)}
                    placeholder="Education"
                  />
                  {/* Description */}
                  <TextField
                    label="Description"
                    value={item.description || ''}
                    onChange={(e) => updateArrayItem('actions', index, 'description', e.target.value)}
                    placeholder="Description of the action"
                  />
                  {/* Alt Text for icon */}
                  <TextField
                    label="Alt Text"
                    value={item.alt || ''}
                    onChange={(e) => updateArrayItem('actions', index, 'alt', e.target.value)}
                    placeholder="Education Icon"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state - no action items */}
        {actions.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            No action items added. Click "Add Action Item" to create one.
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

export default OurActionEditor;