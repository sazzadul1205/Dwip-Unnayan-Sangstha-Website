// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/CodeImageUpload.jsx
//
// Drop-in image picker for the raw HTML / CSS code boxes.
// Uploads go to THIS server (POST backend/cms/upload-editor-image) so a code
// section never needs an externally hosted image URL.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaCheck,
  FaCloudUploadAlt,
  FaCode,
  FaHdd,
  FaImage,
  FaSpinner,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';
import {
  EDITOR_IMAGE_ACCEPT,
  EDITOR_IMAGE_ACCEPT_LABEL,
  MAX_EDITOR_IMAGE_BYTES,
  formatBytes,
  nameFromUrl,
  useEditorImageUpload,
} from './useEditorImageUpload';

const STORAGE_HINT = '/storage/editor-images';

/** An asset that already lives in the saved HTML must not be deletable from the session list. */
const isStoredEverywhere = (url, existingImages) => existingImages.includes(url);

/**
 * Normalise both sources (session uploads + images already present in the
 * code) into a single { url, name } list.
 */
const mergeAssets = (sessionAssets, existingUrls) => {
  const assets = [];
  const seen = new Set();

  const push = (url, name) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    assets.push({ url, name });
  };

  existingUrls.forEach((url) => push(url, nameFromUrl(url)));
  sessionAssets.forEach((asset) => push(asset.url, asset.name));

  return assets;
};

const CodeImageUpload = ({
  onInsertImage,
  onInsertCssBackground,
  onUploaded,
  existingImages = [],
  disabled = false,
  maxBytes = MAX_EDITOR_IMAGE_BYTES,
  buttonLabel = 'Insert image',
}) => {
  const [open, setOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState('');
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);

  const { library, isUploading, uploadError, uploadFiles, deleteAsset, resetError } =
    useEditorImageUpload({ maxBytes });

  const assets = useMemo(
    () => mergeAssets(library, existingImages),
    [library, existingImages]
  );

  // Close the panel on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!panelRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleFiles = useCallback(
    async (files) => {
      const uploaded = await uploadFiles(files);

      // Tell the parent about every new file so it can reclaim them if this
      // editing session is abandoned without saving.
      if (onUploaded && uploaded.length > 0) {
        onUploaded(uploaded.map((asset) => asset.url));
      }

      if (uploaded.length === 1) onInsertImage?.(uploaded[0]);
    },
    [onInsertImage, onUploaded, uploadFiles]
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      if (disabled || isUploading) return;
      handleFiles(event.dataTransfer?.files);
    },
    [disabled, handleFiles, isUploading]
  );

  const handleFileSelect = useCallback(
    (event) => {
      handleFiles(event.target.files);
      event.target.value = '';
    },
    [handleFiles]
  );

  const copyUrl = useCallback(async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(''), 1500);
    } catch {
      setCopiedUrl('');
    }
  }, []);

  const toggle = () => {
    resetError();
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        title="Upload an image to this server and insert it into your markup"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
          open
            ? 'bg-blue-600 text-white'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <FaImage size={11} />
        {buttonLabel}
        {assets.length > 0 && (
          <span
            className={`ml-0.5 rounded-full px-1.5 text-[10px] ${
              open ? 'bg-white/25 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {assets.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 w-[22rem] max-w-[calc(100vw-3rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
          {/* ---- Header ---- */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h4 className="text-xs font-semibold text-gray-700">Image library</h4>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                <FaHdd size={10} className="text-blue-500" />
                Stored on this server in <span className="font-mono">{STORAGE_HINT}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              title="Close"
            >
              <FaTimes size={12} />
            </button>
          </div>

          {/* ---- Dropzone ---- */}
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-4 text-center transition ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
            } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            {isUploading ? (
              <>
                <FaSpinner className="mb-1.5 animate-spin text-blue-600" size={20} />
                <span className="text-xs font-medium text-blue-700">Uploading to the server…</span>
              </>
            ) : (
              <>
                <FaCloudUploadAlt className="mb-1.5 text-blue-500" size={20} />
                <span className="text-xs font-medium text-gray-700">
                  Drop an image here or{' '}
                  <span className="text-blue-600 underline">browse</span>
                </span>
                <span className="mt-0.5 text-[10px] text-gray-400">
                  {EDITOR_IMAGE_ACCEPT_LABEL} · max {formatBytes(maxBytes)} · single click inserts it
                </span>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={EDITOR_IMAGE_ACCEPT}
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploadError && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] leading-relaxed whitespace-pre-line text-red-600">
              {uploadError}
            </p>
          )}

          {/* ---- Existing + newly uploaded assets ---- */}
          {assets.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Available images
                </span>
                <span className="text-[10px] text-gray-400">Click to insert</span>
              </div>

              <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto pr-0.5">
                {assets.map((asset) => (
                  <div
                    key={asset.url}
                    className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <button
                      type="button"
                      onClick={() => onInsertImage?.(asset)}
                      title={`Insert ${asset.name} into the HTML box`}
                      className="block w-full"
                    >
                      <img
                        src={asset.url}
                        alt={asset.name}
                        loading="lazy"
                        className="h-14 w-full object-cover transition group-hover:scale-105"
                      />
                    </button>

                    <span className="block truncate bg-white px-1 py-0.5 text-[9px] text-gray-400">
                      {asset.name}
                    </span>

                    {/* Row of quick actions */}
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-0.5 bg-black/55 p-0.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => copyUrl(asset.url)}
                        title="Copy the stored URL"
                        className="flex-1 rounded p-0.5 text-white transition hover:bg-black/40"
                      >
                        {copiedUrl === asset.url ? <FaCheck size={10} /> : <FaCode size={10} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onInsertCssBackground?.(asset)}
                        title="Insert as a CSS background"
                        className="flex-1 rounded p-0.5 text-white transition hover:bg-black/40"
                      >
                        <FaImage size={10} />
                      </button>
                      {!isStoredEverywhere(asset.url, existingImages) && (
                        <button
                          type="button"
                          onClick={() => deleteAsset(asset.url)}
                          title="Delete this file from the server"
                          className="flex-1 rounded p-0.5 text-red-200 transition hover:bg-black/40"
                        >
                          <FaTrash size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-1.5 text-[10px] leading-relaxed text-gray-400">
                Hover a thumbnail to copy its URL, use it as a CSS background, or delete the file from
                the server.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeImageUpload;