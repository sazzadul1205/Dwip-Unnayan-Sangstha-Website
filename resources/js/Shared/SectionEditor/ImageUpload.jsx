// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/ImageUpload.jsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FaUpload, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

const ImageUpload = ({
  imageSrc,
  onImageChange,
  onImageRemove,
  oldImagePath = '',
  imageChanged = false,
  label = 'Image',
  className = 'h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200',
  maxSize = 5 * 1024 * 1024,
  acceptTypes = 'image/*',
  isUploading = false,
  uploadError = null,
  dropzoneText = 'Drop an image or click to browse',
  acceptedFileTypes = 'JPEG, PNG, GIF, WebP, SVG',
  maxFileSize = 5,
  previewClassName = null,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { setPreviewError(false); }, [imageSrc]);

  const processFile = useCallback((file) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error', title: 'Invalid file',
        text: 'Please select an image file.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    if (file.size > maxSize) {
      Swal.fire({
        icon: 'error', title: 'File too large',
        text: `Image size must be under ${maxSize / (1024 * 1024)}MB.`,
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => onImageChange(event.target.result);
    reader.onerror = () => Swal.fire({
      icon: 'error', title: 'Error',
      text: 'Failed to read the image file.',
      confirmButtonColor: '#3b82f6',
    });
    reader.readAsDataURL(file);
  }, [maxSize, onImageChange]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const displayPath = (src) => {
    if (!src) return '';
    if (src.startsWith('data:image')) return 'New image (pending upload)';
    return src.length > 55 ? `${src.substring(0, 55)}…` : src;
  };

  const previewClass = previewClassName || className;

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      )}
      <div
        className={`relative rounded-lg border-2 border-dashed p-3 transition-all ${dragActive
            ? 'border-blue-500 bg-blue-50/60'
            : uploadError
              ? 'border-red-300 bg-red-50/40'
              : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
          } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {imageSrc ? (
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {!previewError ? (
                <img
                  src={imageSrc}
                  alt="Uploaded"
                  className={previewClass}
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className={`${previewClass} flex items-center justify-center bg-slate-100 text-slate-400`}>
                  <FaUpload size={18} />
                </div>
              )}
              <span className="absolute -right-1 -top-1 rounded-full bg-emerald-500 p-0.5 text-white ring-2 ring-white">
                <FaCheckCircle size={10} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-700">Image ready</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">{displayPath(imageSrc)}</p>
              {imageChanged && oldImagePath && (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600">
                  <FaExclamationCircle size={9} /> Old image removed on save
                </p>
              )}
              {uploadError && (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-red-600">
                  <FaExclamationCircle size={9} /> {uploadError}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onImageRemove}
              disabled={isUploading}
              className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              aria-label="Remove image"
            >
              <FaTimes size={12} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
            <div className="rounded-full bg-blue-100 p-2.5 text-blue-600">
              <FaUpload size={14} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">{dropzoneText}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {acceptedFileTypes} · max {maxFileSize}MB
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileSelect}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={isUploading}
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              Uploading…
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;