// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/ProgramImpactEditor.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaTrash, FaPlus, FaUpload, FaTimes, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { TextField } from './shared/Fields';

// ===== CONSTANTS =====
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ProgramImpactEditor = ({ section, hasData, onDataChange }) => {
  // ===== STATE MANAGEMENT =====
  const getInitialData = useCallback(() => {
    const data = section?.data?.data || section?.data || {};
    return {
      section: { title: '', mainImage: { images: [] } },
      sdgImages: [],
      ...data
    };
  }, [section]);

  const [formData, setFormData] = useState(getInitialData);
  const [isDirty, setIsDirty] = useState(false);

  // Track image changes for deletion
  const [imageChanges, setImageChanges] = useState({
    main: {},
    sdg: {}
  });

  // ✅ Track old image paths for deletion when saving
  const [oldImagePaths, setOldImagePaths] = useState({
    main: {},
    sdg: {}
  });

  const [uploadingImages, setUploadingImages] = useState({
    main: {},
    sdg: {}
  });
  const [imageErrors, setImageErrors] = useState({
    main: {},
    sdg: {}
  });

  // ===== EFFECTS =====
  // Reset when section changes
  useEffect(() => {
    setFormData(getInitialData());
    setIsDirty(false);
    setImageChanges({ main: {}, sdg: {} });
    setOldImagePaths({ main: {}, sdg: {} });
    setUploadingImages({ main: {}, sdg: {} });
    setImageErrors({ main: {}, sdg: {} });
  }, [section, getInitialData]);

  // Notify parent of changes
  useEffect(() => {
    if (isDirty && onDataChange) {
      // ✅ Include old image paths in the data change
      const dataToSend = {
        ...formData,
        _oldImagePaths: oldImagePaths,
        _imageChanges: imageChanges
      };
      onDataChange(dataToSend);
    }
  }, [formData, isDirty, oldImagePaths, imageChanges, onDataChange]);

  // ===== HELPER FUNCTIONS =====
  const updateField = useCallback((path, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    setIsDirty(true);
  }, []);

  const updateArrayItem = useCallback((path, index, field, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;

      for (let i = 0; i < keys.length; i++) {
        if (i === keys.length - 1) {
          if (!current[keys[i]]) current[keys[i]] = [];
          if (!current[keys[i]][index]) current[keys[i]][index] = {};
          if (field === '') {
            current[keys[i]][index] = value;
          } else {
            current[keys[i]][index][field] = value;
          }
        } else {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
      }
      return newData;
    });
    setIsDirty(true);
  }, []);

  const addArrayItem = useCallback((path, template = {}) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      const lastKey = keys[keys.length - 1];
      if (!Array.isArray(current[lastKey])) current[lastKey] = [];
      const newId = Math.max(0, ...current[lastKey].map(item => item.id || 0)) + 1;
      current[lastKey].push({ ...template, id: newId });
      return newData;
    });
    setIsDirty(true);
  }, []);

  const removeArrayItem = useCallback((path, index) => {
    const keys = path.split('.');

    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      const lastKey = keys[keys.length - 1];
      if (Array.isArray(current[lastKey])) {
        current[lastKey].splice(index, 1);
      }
      return newData;
    });
    setIsDirty(true);
  }, []);

  // ===== IMAGE PROCESSING =====
  const validateImageFile = useCallback((file) => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file (JPEG, PNG, GIF, WebP, SVG)';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `Image size should be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  }, []);

  const processImageFile = useCallback((file, type, index, updateFn) => {
    const error = validateImageFile(file);
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: error,
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // ✅ Track old image before replacing
    if (type === 'main') {
      const items = formData.section?.mainImage?.images || [];
      if (items[index] && !imageChanges.main[index]) {
        setOldImagePaths(prev => ({
          ...prev,
          main: { ...prev.main, [index]: items[index] }
        }));
        setImageChanges(prev => ({
          ...prev,
          main: { ...prev.main, [index]: true }
        }));
      }
    } else if (type === 'sdg') {
      const items = formData.sdgImages || [];
      if (items[index]?.src && !imageChanges.sdg[index]) {
        setOldImagePaths(prev => ({
          ...prev,
          sdg: { ...prev.sdg, [index]: items[index].src }
        }));
        setImageChanges(prev => ({
          ...prev,
          sdg: { ...prev.sdg, [index]: true }
        }));
      }
    }

    // Set uploading state
    setUploadingImages(prev => ({
      ...prev,
      [type]: { ...prev[type], [index]: true }
    }));
    setImageErrors(prev => ({
      ...prev,
      [type]: { ...prev[type], [index]: null }
    }));

    // Read and convert image
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      updateFn(imageUrl);
      setUploadingImages(prev => ({
        ...prev,
        [type]: { ...prev[type], [index]: false }
      }));
    };
    reader.onerror = () => {
      setUploadingImages(prev => ({
        ...prev,
        [type]: { ...prev[type], [index]: false }
      }));
      setImageErrors(prev => ({
        ...prev,
        [type]: { ...prev[type], [index]: 'Failed to read image file' }
      }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read the image file',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
  }, [formData, imageChanges, validateImageFile]);

  // ===== MAIN IMAGE HANDLERS =====
  const handleMainImageDrop = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processImageFile(
        files[0],
        'main',
        index,
        (imageUrl) => {
          const updatedImages = [...(formData.section?.mainImage?.images || [])];
          updatedImages[index] = imageUrl;
          updateField('section.mainImage.images', updatedImages);
        }
      );
    }
  }, [processImageFile, formData, updateField]);

  const handleMainImageSelect = useCallback((e, index) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(
        file,
        'main',
        index,
        (imageUrl) => {
          const updatedImages = [...(formData.section?.mainImage?.images || [])];
          updatedImages[index] = imageUrl;
          updateField('section.mainImage.images', updatedImages);
        }
      );
    }
    e.target.value = '';
  }, [processImageFile, formData, updateField]);

  const removeMainImage = useCallback((index) => {
    const items = formData.section?.mainImage?.images || [];
    if (items[index]) {
      // ✅ Track old image for deletion
      setOldImagePaths(prev => ({
        ...prev,
        main: { ...prev.main, [index]: items[index] }
      }));
      setImageChanges(prev => ({
        ...prev,
        main: { ...prev.main, [index]: true }
      }));
    }
    const newImages = items.filter((_, i) => i !== index);
    updateField('section.mainImage.images', newImages);
  }, [formData, updateField]);

  // ===== SDG IMAGE HANDLERS =====
  const handleSdgImageDrop = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processImageFile(
        files[0],
        'sdg',
        index,
        (imageUrl) => updateArrayItem('sdgImages', index, 'src', imageUrl)
      );
    }
  }, [processImageFile, updateArrayItem]);

  const handleSdgImageSelect = useCallback((e, index) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(
        file,
        'sdg',
        index,
        (imageUrl) => updateArrayItem('sdgImages', index, 'src', imageUrl)
      );
    }
    e.target.value = '';
  }, [processImageFile, updateArrayItem]);

  const removeSdgImage = useCallback((index) => {
    const items = formData.sdgImages || [];
    if (items[index]?.src) {
      // ✅ Track old image for deletion
      setOldImagePaths(prev => ({
        ...prev,
        sdg: { ...prev.sdg, [index]: items[index].src }
      }));
      setImageChanges(prev => ({
        ...prev,
        sdg: { ...prev.sdg, [index]: true }
      }));
    }
    removeArrayItem('sdgImages', index);
  }, [formData.sdgImages, removeArrayItem]);

  // ===== DISPLAY HELPERS =====
  const getDisplayPath = useCallback((src) => {
    if (!src) return '';
    const srcStr = String(src);
    if (srcStr.startsWith('data:image')) {
      return '📤 New image (will be uploaded)';
    }
    if (srcStr.length > 50) {
      return `${srcStr.substring(0, 50)}...`;
    }
    return srcStr;
  }, []);

  // ✅ Helper to show old image deletion status
  const getImageStatus = useCallback((type, index) => {
    const changed = imageChanges[type]?.[index];
    const oldPath = oldImagePaths[type]?.[index];

    if (changed && oldPath) {
      return {
        isChanged: true,
        oldPath,
        message: `🗑️ Will delete: ${getDisplayPath(oldPath)}`
      };
    }
    return { isChanged: false, oldPath: null, message: null };
  }, [imageChanges, oldImagePaths, getDisplayPath]);

  const renderUploadArea = useCallback(({
    image,
    index,
    onDrop,
    onSelect,
    onRemove,
    isUploading,
    hasError,
    errorMessage,
    isMain = false
  }) => {
    const imageSrc = isMain ? image : image?.src;
    const altText = isMain ? `Main image ${index + 1}` : image?.alt || 'SDG Image';
    const status = getImageStatus(isMain ? 'main' : 'sdg', index);

    return (
      <div
        className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${isUploading ? 'opacity-50' :
            hasError ? 'border-red-500 bg-red-50' :
              'border-gray-300 hover:border-gray-400'
          }`}
        onDragEnter={(e) => e.preventDefault()}
        onDragLeave={(e) => e.preventDefault()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {imageSrc ? (
          <div className="relative">
            <img
              src={imageSrc}
              alt={altText}
              className="w-full h-24 object-cover rounded"
              onError={(e) => {
                e.target.src = '';
                e.target.alt = 'Image failed to load';
                setImageErrors(prev => ({
                  ...prev,
                  [isMain ? 'main' : 'sdg']: {
                    ...prev[isMain ? 'main' : 'sdg'],
                    [index]: 'Image failed to load'
                  }
                }));
              }}
            />
            <div className="absolute top-1 right-1 flex gap-1">
              <button
                type="button"
                onClick={onRemove}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                disabled={isUploading}
              >
                <FaTimes size={10} />
              </button>
            </div>
            <div className="mt-1">
              <span className="text-xs text-gray-500 truncate block">
                {getDisplayPath(imageSrc)}
              </span>
              {/* ✅ Show old image deletion status */}
              {status.isChanged && (
                <span className="text-xs text-red-400 block">
                  {status.message}
                </span>
              )}
              {hasError && (
                <span className="text-xs text-red-500 block">{errorMessage}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-gray-400">
            <FaUpload size={20} className="mb-1" />
            <span className="text-xs">Drop image or click</span>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={onSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
            <FaSpinner className="animate-spin h-6 w-6 text-blue-600" />
          </div>
        )}
      </div>
    );
  }, [getDisplayPath, getImageStatus]);

  // ===== COMPUTED VALUES =====
  const mainImages = useMemo(() => formData.section?.mainImage?.images || [], [formData]);
  const sdgImages = useMemo(() => formData.sdgImages || [], [formData]);
  const hasDataToEdit = useMemo(() =>
    hasData && formData && Object.keys(formData).length > 0,
    [hasData, formData]
  );

  // ✅ Count images marked for deletion
  const imagesToDelete = useMemo(() => {
    const mainCount = Object.keys(oldImagePaths.main).length;
    const sdgCount = Object.keys(oldImagePaths.sdg).length;
    return mainCount + sdgCount;
  }, [oldImagePaths]);

  // ===== EMPTY STATE =====
  if (!hasDataToEdit) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Program Impact Data</h3>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No data available to edit</p>
          <p className="text-xs mt-1">Data will appear here once the section has content</p>
          <p className="text-xs mt-2 text-blue-500">💡 Click "Save Changes" to create the initial data structure</p>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Dirty State Indicator */}
      {isDirty && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 flex items-center gap-2">
          <span>⚠️</span> Unsaved changes - click "Save Changes" to apply
          {imagesToDelete > 0 && (
            <span className="ml-2 text-red-500">
              • {imagesToDelete} image{imagesToDelete > 1 ? 's' : ''} will be deleted
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Edit Program Impact Data</h3>
        <div className="flex items-center gap-3">
          {imagesToDelete > 0 && (
            <span className="text-xs text-red-500">
              🗑️ {imagesToDelete} image{imagesToDelete > 1 ? 's' : ''} to delete
            </span>
          )}
          <span className="text-xs text-gray-400">
            {isDirty ? '📝 Modified' : '✓ Saved'}
          </span>
        </div>
      </div>

      {/* ===== SECTION TITLE ===== */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Section Content</h4>
        <TextField
          label="Title"
          value={formData.section?.title || ''}
          onChange={(e) => updateField('section.title', e.target.value)}
          placeholder="Program Impact and SDGs"
        />
      </div>

      {/* ===== MAIN IMAGES ===== */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">
            Main Images ({mainImages.length})
          </h4>
          <span className="text-xs text-gray-400">
            Max 5MB each • Drag & drop to upload
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mainImages.map((image, index) => (
            <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-2">
              {renderUploadArea({
                image,
                index,
                isMain: true,
                onDrop: (e) => handleMainImageDrop(e, index),
                onSelect: (e) => handleMainImageSelect(e, index),
                onRemove: () => removeMainImage(index),
                isUploading: uploadingImages.main[index],
                hasError: !!imageErrors.main[index],
                errorMessage: imageErrors.main[index]
              })}
            </div>
          ))}
        </div>

        {mainImages.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
            No main images added. Drag & drop images to upload.
          </div>
        )}
      </div>

      {/* ===== SDG IMAGES ===== */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">
            SDG Images ({sdgImages.length})
          </h4>
          <button
            type="button"
            onClick={() => addArrayItem('sdgImages', { src: '', alt: '' })}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition"
          >
            <FaPlus size={12} /> Add SDG Image
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sdgImages.map((sdg, index) => (
            <div key={sdg.id || index} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              {/* SDG header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">SDG #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSdgImage(index)}
                  className="text-xs text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                  disabled={uploadingImages.sdg[index]}
                >
                  <FaTrash size={12} />
                </button>
              </div>

              {/* Upload Area */}
              {renderUploadArea({
                image: sdg,
                index,
                isMain: false,
                onDrop: (e) => handleSdgImageDrop(e, index),
                onSelect: (e) => handleSdgImageSelect(e, index),
                onRemove: () => {
                  if (sdg.src) {
                    setOldImagePaths(prev => ({
                      ...prev,
                      sdg: { ...prev.sdg, [index]: sdg.src }
                    }));
                    setImageChanges(prev => ({
                      ...prev,
                      sdg: { ...prev.sdg, [index]: true }
                    }));
                  }
                  updateArrayItem('sdgImages', index, 'src', '');
                },
                isUploading: uploadingImages.sdg[index],
                hasError: !!imageErrors.sdg[index],
                errorMessage: imageErrors.sdg[index]
              })}

              {/* Alt Text */}
              <TextField
                label="Alt Text"
                value={sdg.alt || ''}
                onChange={(e) => updateArrayItem('sdgImages', index, 'alt', e.target.value)}
                placeholder="No Poverty"
                className="mt-2"
              />
            </div>
          ))}
        </div>

        {sdgImages.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
            No SDG images added. Click "Add SDG Image" to create one.
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
            <span className="text-gray-500">Has Data:</span>
            <span className={`ml-2 font-medium ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
              {hasData ? '✓ Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Main Images:</span>
            <span className="ml-2 font-medium text-gray-700">{mainImages.length}</span>
          </div>
          <div>
            <span className="text-gray-500">SDG Images:</span>
            <span className="ml-2 font-medium text-gray-700">{sdgImages.length}</span>
          </div>
          {imagesToDelete > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">Images to Delete:</span>
              <span className="ml-2 font-medium text-red-500">{imagesToDelete}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramImpactEditor;