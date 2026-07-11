// resources/js/pages/Backend/CMS/Section/components/modals/Editors/shared/ImageUpload.jsx

import React, { useState, useCallback, useRef } from 'react';
import { FaUpload, FaTimes, FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';

const ImageUpload = ({
  imageSrc,
  onImageChange,
  onImageRemove,
  oldImagePath = '',
  imageChanged = false,
  uploadPath = '/storage/',
  label = 'Image',
  className = 'w-24 h-20 object-cover rounded-lg',
  maxSize = 5 * 1024 * 1024,
  acceptTypes = 'image/*',
  isUploading = false,
  uploadError = null,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef(null);

  // Define processFile BEFORE it's used in callbacks
  const processFile = useCallback((file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: `Please select an image file (JPEG, PNG, GIF, WebP, SVG)`,
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: `Image size should be less than ${maxSize / (1024 * 1024)}MB`,
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Read the file
    const reader = new FileReader();
    reader.onload = (event) => {
      onImageChange(event.target.result);
    };
    reader.onerror = () => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read the image file',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
  }, [maxSize, onImageChange]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  }, [processFile]);

  const getDisplayPath = useCallback((src) => {
    if (!src) return '';
    if (src.startsWith('data:image')) {
      return '📤 New image (will be uploaded)';
    }
    if (src.length > 50) {
      return `${src.substring(0, 50)}...`;
    }
    return src;
  }, []);

  const handleImageError = useCallback(() => {
    setPreviewError(true);
  }, []);

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${dragActive ? 'border-blue-500 bg-blue-50' :
          uploadError ? 'border-red-500 bg-red-50' :
            'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {imageSrc ? (
          <div className="flex items-center gap-4">
            {!previewError ? (
              <img
                src={imageSrc}
                alt="Uploaded image"
                className={className}
                onError={handleImageError}
              />
            ) : (
              <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-400`}>
                <FaUpload size={24} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 font-medium">Image uploaded</p>
              <p className="text-xs text-gray-400 truncate">
                {getDisplayPath(imageSrc)}
              </p>
              {imageChanged && oldImagePath && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Old image will be deleted on save: {getDisplayPath(oldImagePath)}
                </p>
              )}
              {uploadError && (
                <p className="text-xs text-red-500 mt-1">
                  ❌ {uploadError}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onImageRemove}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
              disabled={isUploading}
            >
              <FaTimes size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <FaUpload size={32} className="mb-2" />
            <p className="text-sm font-medium">Drag & drop an image here, or click to browse</p>
            <p className="text-xs mt-1">Supports JPEG, PNG, GIF, WebP, SVG (max {maxSize / (1024 * 1024)}MB)</p>
            <p className="text-xs text-blue-500 mt-2">
              📁 Image will be saved to {uploadPath}
            </p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept={acceptTypes}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        {/* Show uploading indicator */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;