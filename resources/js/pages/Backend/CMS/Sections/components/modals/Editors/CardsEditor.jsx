// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/CardsEditor.jsx

// React
import React, { useState, useEffect } from 'react';

// Icons
import { FaTrash, FaPlus, FaImage, FaTimes } from 'react-icons/fa';

// Sweetalert
import Swal from 'sweetalert2';

// Shared Components
import { TextField, SelectField } from './shared/Fields';

const CardsEditor = ({ section, hasData, onDataChange }) => {
  // ===== STATE MANAGEMENT =====
  // Main form data
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);

  // Track image changes for deletion tracking
  const [imageChanges, setImageChanges] = useState({});
  const [oldImagePaths, setOldImagePaths] = useState({});
  const [uploadingImage, setUploadingImage] = useState({});

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

  // Update a field in an array item
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

  // Update nested fields inside array items (e.g., image.src inside a card)
  const updateNestedArrayItem = (path, index, subField, field, value) => {
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        if (!current[keys[i]]) current[keys[i]] = [];
        if (!current[keys[i]][index]) current[keys[i]][index] = {};
        if (!current[keys[i]][index][subField]) current[keys[i]][index][subField] = {};
        current[keys[i]][index][subField][field] = value;
      } else {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
    }
    setFormData(newData);
  };

  // ===== ARRAY MANAGEMENT FUNCTIONS =====

  // Add a new card with default values
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

    // Generate unique ID for the new card
    const newId = `card-${Date.now()}`;
    current[lastKey].push({
      ...template,
      id: newId,
      image: { src: '', alt: '', className: 'mx-auto object-contain' },
      bgColor: 'bg-[#F5F5F5]',
      cardBgColor: 'bg-white'
    });
    setFormData(newData);
  };

  // Remove a card and track its image for deletion
  const removeArrayItem = (path, index) => {
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    // Store old image path before removal (for deletion tracking)
    const items = formData.cards || [];
    if (items[index]?.image?.src) {
      setOldImagePaths(prev => ({
        ...prev,
        [index]: items[index].image.src
      }));
      setImageChanges(prev => ({ ...prev, [index]: true }));
    }

    // Traverse to the parent of the array
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    // Remove the item at the specified index
    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current[lastKey])) {
      current[lastKey].splice(index, 1);
    }
    setFormData(newData);
  };

  // ===== IMAGE HANDLING FUNCTIONS =====

  // Handle image drop from drag & drop
  const handleImageDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processImageFile(files[0], index);
    }
  };

  // Handle image selection via file input
  const handleImageSelect = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file, index);
    }
    e.target.value = '';
  };

  // Process and upload the image file
  const processImageFile = (file, index) => {
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Image size should be less than 5MB',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Store old image path if it exists
    const items = formData.cards || [];
    if (items[index]?.image?.src && !imageChanges[index]) {
      setOldImagePaths(prev => ({
        ...prev,
        [index]: items[index].image.src
      }));
    }

    // Read and convert image to base64
    setUploadingImage(prev => ({ ...prev, [index]: true }));
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      updateNestedArrayItem('cards', index, 'image', 'src', imageUrl);
      setImageChanges(prev => ({ ...prev, [index]: true }));
      setUploadingImage(prev => ({ ...prev, [index]: false }));
    };
    reader.onerror = () => {
      setUploadingImage(prev => ({ ...prev, [index]: false }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read the image file',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove image from a card
  const removeImage = (index) => {
    const items = formData.cards || [];
    if (items[index]?.image?.src) {
      setOldImagePaths(prev => ({
        ...prev,
        [index]: items[index].image.src
      }));
    }
    updateNestedArrayItem('cards', index, 'image', 'src', '');
    setImageChanges(prev => ({ ...prev, [index]: true }));
  };

  // Display path for image (shows if it's new or existing)
  const getDisplayPath = (src) => {
    if (!src) return '';
    if (src.startsWith('data:image')) {
      return 'New image (will be uploaded)';
    }
    return src;
  };

  // ===== COLOR OPTIONS =====
  // Options for section background color
  const bgColorOptions = [
    { value: 'bg-[#F5F5F5]', label: 'Light Gray' },
    { value: 'bg-white', label: 'White' },
    { value: 'bg-gray-50', label: 'Gray 50' },
    { value: 'bg-gray-100', label: 'Gray 100' },
    { value: 'bg-blue-50', label: 'Blue 50' },
    { value: 'bg-green-50', label: 'Green 50' },
    { value: 'bg-purple-50', label: 'Purple 50' },
    { value: 'bg-yellow-50', label: 'Yellow 50' },
    { value: 'bg-red-50', label: 'Red 50' },
    { value: 'bg-indigo-50', label: 'Indigo 50' },
    { value: 'bg-pink-50', label: 'Pink 50' },
    { value: 'bg-orange-50', label: 'Orange 50' },
    { value: 'bg-teal-50', label: 'Teal 50' },
  ];

  // Options for card background color
  const cardBgColorOptions = [
    { value: 'bg-white', label: 'White' },
    { value: 'bg-gray-50', label: 'Gray 50' },
    { value: 'bg-gray-100', label: 'Gray 100' },
    { value: 'bg-blue-50', label: 'Blue 50' },
    { value: 'bg-green-50', label: 'Green 50' },
    { value: 'bg-purple-50', label: 'Purple 50' },
    { value: 'bg-yellow-50', label: 'Yellow 50' },
    { value: 'bg-red-50', label: 'Red 50' },
    { value: 'bg-indigo-50', label: 'Indigo 50' },
    { value: 'bg-pink-50', label: 'Pink 50' },
    { value: 'bg-orange-50', label: 'Orange 50' },
    { value: 'bg-teal-50', label: 'Teal 50' },
    { value: 'bg-transparent', label: 'Transparent' },
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

  const cards = formData.cards || [];

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Cards Data</h3>

      {/* ===== SECTION CONTENT ===== */}
      {/* Section title field */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Section Content</h4>
        <TextField
          label="Title"
          value={formData.section?.title || ''}
          onChange={(e) => updateField('section.title', e.target.value)}
          placeholder="Cards Section"
        />
      </div>

      {/* ===== CARDS LIST ===== */}
      <div>
        {/* Header with card count and add button */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">Cards ({cards.length})</h4>
          <button
            type="button"
            onClick={() => addArrayItem('cards', {
              id: `card-${Date.now()}`,
              title: '',
              buttonText: '',
              buttonLink: '',
            })}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FaPlus size={12} /> Add Card
          </button>
        </div>

        {/* Loop through each card */}
        <div className="space-y-4">
          {cards.map((card, index) => (
            <div key={card.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">

              {/* Card header with index and remove button */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Card #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeArrayItem('cards', index)}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <FaTrash size={12} /> Remove
                </button>
              </div>

              {/* ===== CARD FIELDS (2 columns on desktop) ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* ===== LEFT COLUMN: IMAGE ===== */}
                <div>
                  <label className="block text-xs text-gray-400 mb-0.5">Card Image</label>

                  {/* Drag & drop image upload area */}
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-3 transition-all ${uploadingImage[index] ? 'opacity-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    onDragEnter={(e) => e.preventDefault()}
                    onDragLeave={(e) => e.preventDefault()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleImageDrop(e, index)}
                  >
                    {/* Show image preview if exists */}
                    {card.image?.src ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={card.image.src}
                          alt={card.image?.alt || 'Card image'}
                          className="w-20 h-16 object-contain rounded border border-gray-200"
                        />
                        <span className="text-xs text-gray-500 truncate flex-1">
                          {getDisplayPath(card.image.src)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ) : (
                      // Empty state for image upload
                      <div className="flex items-center gap-3 text-gray-400">
                        <FaImage size={18} />
                        <span className="text-sm">Drop image or click to browse</span>
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, index)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingImage[index]}
                    />

                    {/* Loading spinner */}
                    {uploadingImage[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* Show old image deletion notice */}
                  {imageChanges[index] && oldImagePaths[index] && (
                    <div className="mt-1 text-xs text-gray-400">
                      <span className="text-red-500">🗑️</span> Old image will be deleted: {oldImagePaths[index]}
                    </div>
                  )}

                  {/* Image alt text and class name */}
                  <div className="mt-2 space-y-2">
                    <TextField
                      label="Image Alt Text"
                      value={card.image?.alt || ''}
                      onChange={(e) => updateNestedArrayItem('cards', index, 'image', 'alt', e.target.value)}
                      placeholder="Operational Areas"
                    />
                    <TextField
                      label="Image Class Name"
                      value={card.image?.className || ''}
                      onChange={(e) => updateNestedArrayItem('cards', index, 'image', 'className', e.target.value)}
                      placeholder="mx-auto object-contain"
                    />
                  </div>
                </div>

                {/* ===== RIGHT COLUMN: CARD FIELDS ===== */}
                <div className="space-y-2">
                  {/* Card ID */}
                  <TextField
                    label="Card ID"
                    value={card.id || ''}
                    onChange={(e) => updateArrayItem('cards', index, 'id', e.target.value)}
                    placeholder="operational-areas"
                  />
                  {/* Card Title */}
                  <TextField
                    label="Title"
                    value={card.title || ''}
                    onChange={(e) => updateArrayItem('cards', index, 'title', e.target.value)}
                    placeholder="Operational Areas"
                  />
                  {/* Button Text */}
                  <TextField
                    label="Button Text"
                    value={card.buttonText || ''}
                    onChange={(e) => updateArrayItem('cards', index, 'buttonText', e.target.value)}
                    placeholder="Explore Our Areas of Operation"
                  />
                  {/* Button Link */}
                  <TextField
                    label="Button Link"
                    value={card.buttonLink || ''}
                    onChange={(e) => updateArrayItem('cards', index, 'buttonLink', e.target.value)}
                    placeholder="/about/operational-areas"
                  />

                  {/* Color pickers for section and card backgrounds */}
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField
                      label="Section BG"
                      value={card.bgColor || 'bg-[#F5F5F5]'}
                      onChange={(e) => updateArrayItem('cards', index, 'bgColor', e.target.value)}
                      options={bgColorOptions}
                    />
                    <SelectField
                      label="Card BG"
                      value={card.cardBgColor || 'bg-white'}
                      onChange={(e) => updateArrayItem('cards', index, 'cardBgColor', e.target.value)}
                      options={cardBgColorOptions}
                    />
                  </div>
                </div>
              </div>

              {/* ===== COLOR PREVIEW ===== */}
              {/* Shows preview of selected colors and image */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Section:</span>
                  <div
                    className={`w-8 h-6 rounded border border-gray-200 ${card.bgColor || 'bg-[#F5F5F5]'}`}
                    title={card.bgColor || 'bg-[#F5F5F5]'}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Card:</span>
                  <div
                    className={`w-8 h-6 rounded border border-gray-200 ${card.cardBgColor || 'bg-white'}`}
                    title={card.cardBgColor || 'bg-white'}
                  />
                </div>
                {card.image?.src && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Image:</span>
                    <span className="text-xs text-gray-500 truncate max-w-32">
                      {card.image.src.substring(0, 30)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Show empty state when no cards exist */}
        {cards.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            No cards added. Click "Add Card" to create one.
          </div>
        )}
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

export default CardsEditor;