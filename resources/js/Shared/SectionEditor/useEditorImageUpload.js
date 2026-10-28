// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/useEditorImageUpload.js
//
// Uploads images to THIS server (storage/app/public/editor-images) and hands
// back a public URL, so code sections never need an external image host.

import { useCallback, useState } from 'react';
import axios from 'axios';

const UPLOAD_ENDPOINT_NAME = 'backend.cms.upload-editor-image';
const DELETE_ENDPOINT_NAME = 'backend.cms.editor-image.delete';

const FALLBACK_UPLOAD_ENDPOINT = '/backend/cms/upload-editor-image';
const FALLBACK_DELETE_ENDPOINT = '/backend/cms/editor-image';

export const MAX_EDITOR_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Mirrors EditorImageUploadController::$allowedMimeTypes minus SVG.
 *
 * SVG is deliberately excluded: it is stored byte-for-byte and served from the
 * application origin, so an embedded <script> would run in this site's context
 * when the file is opened directly. `img` rendering is sanitised by DOMPurify,
 * direct navigation is not.
 *
 * Keeping this list in step with the server list means the UI never accepts a
 * file the endpoint would reject with a 422.
 */
const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
];

/** Single source of truth for the <input type="file"> accept attribute. */
export const EDITOR_IMAGE_ACCEPT = ACCEPTED_MIME_TYPES.join(',');

export const EDITOR_IMAGE_ACCEPT_LABEL = 'JPEG, PNG, GIF, WebP, BMP or TIFF';

export const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** "my-photo.png" -> "my-photo" (used as the default alt text). */
const stripExtension = (name = '') => name.replace(/\.[^.]+$/, '');

/** Turn a stored URL back into a friendly name. */
export const nameFromUrl = (url = '') => {
  const file = url.split('/').pop() || '';

  return stripExtension(decodeURIComponent(file)) || 'image';
};

/** Prefer the Ziggy-generated URL, fall back to the literal route path. */
const resolveEndpoint = (routeName, fallback) => {
  if (typeof window !== 'undefined' && typeof window.route === 'function') {
    try {
      return window.route(routeName);
    } catch {
      // Route not exposed to this bundle — use the literal path below.
    }
  }

  return fallback;
};

const resolveUploadEndpoint = () =>
  resolveEndpoint(UPLOAD_ENDPOINT_NAME, FALLBACK_UPLOAD_ENDPOINT);

const resolveDeleteEndpoint = () =>
  resolveEndpoint(DELETE_ENDPOINT_NAME, FALLBACK_DELETE_ENDPOINT);

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsDataURL(file);
  });

/**
 * Uploads one or many images and keeps a session library of what was stored.
 *
 * Returns:
 *   library      – [{ url, name, size }] uploaded during this session
 *   isUploading  – boolean
 *   uploadError  – string | null
 *   uploadFiles  – (FileList|File[]) => Promise<[{ url, name, size }]>
 *   deleteAsset  – (url) => Promise<void>   also drops it from the library
 *   resetError   – () => void
 */
export const useEditorImageUpload = ({ maxBytes = MAX_EDITOR_IMAGE_BYTES } = {}) => {
  const [library, setLibrary] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const uploadFile = useCallback(
    async (file) => {
      if (!file) throw new Error('No file selected.');

      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        throw new Error(`"${file.name}" is not a supported image (${EDITOR_IMAGE_ACCEPT_LABEL}).`);
      }
      if (file.size > maxBytes) {
        throw new Error(`"${file.name}" is ${formatBytes(file.size)} — the limit is ${formatBytes(maxBytes)}.`);
      }

      const base64 = await readAsDataUrl(file);
      const { data } = await axios.post(
        resolveUploadEndpoint(),
        { image: base64 },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const url = data?.url;
      if (!url) {
        const reason = typeof data?.error === 'string' ? data.error : 'the server returned no image URL';
        throw new Error(`Upload failed: ${reason}.`);
      }

      return { url, name: stripExtension(file.name), size: file.size };
    },
    [maxBytes]
  );

  const uploadFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []);
      if (files.length === 0) return [];

      setIsUploading(true);
      setUploadError(null);

      try {
        const results = [];
        const errors = [];

        for (const file of files) {
          try {
            // Sequential on purpose: keeps the server rate limiter happy.
            results.push(await uploadFile(file));
          } catch (err) {
            errors.push(err.message || 'Unknown upload error.');
          }
        }

        if (results.length > 0) {
          setLibrary((prev) => {
            const merged = [...prev, ...results];
            const seen = new Set();

            return merged.filter((asset) => {
              if (seen.has(asset.url)) return false;
              seen.add(asset.url);
              return true;
            });
          });
        }

        setUploadError(errors.length > 0 ? errors.join('\n') : null);

        return results;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile]
  );

  /**
   * Delete a stored file for real. Dropping the entry from React state alone
   * would leave the file on disk forever, because nothing else reclaims it.
   */
  const deleteAsset = useCallback(async (url) => {
    if (!url) return;

    setLibrary((prev) => prev.filter((asset) => asset.url !== url));

    try {
      await axios.delete(resolveDeleteEndpoint(), {
        data: { urls: [url] },
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      // The entry is already gone from the library; surface the failure so the
      // admin knows the file may still be on disk.
      const reason = err?.response?.data?.error || err?.message || 'Unknown error.';
      setUploadError(`Could not delete ${nameFromUrl(url)}: ${reason}`);
    }
  }, []);

  const resetError = useCallback(() => setUploadError(null), []);

  return {
    library,
    isUploading,
    uploadError,
    uploadFiles,
    deleteAsset,
    resetError,
  };
};