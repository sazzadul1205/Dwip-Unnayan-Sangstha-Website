import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
  generateSlug,
  COMMON_TAG_SUGGESTIONS,
  readAsBase64,
  validateImageFile,
  showSuccessToast,
  showErrorToast,
  normalizeTags,
} from '../utils/contentFormUtils';

const PDF_MAX_BYTES = 20 * 1024 * 1024;

export const useContentForm = ({
  initialData = null,
  indexRoute,
  storeRoute,
  updateRoute,
  itemLabel = 'item',
}) => {
  const [data, setData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        tags: normalizeTags(initialData.tags),
        image: initialData.image || '',
        is_featured: !!initialData.is_featured,
        is_active: initialData.is_active !== undefined ? !!initialData.is_active : true,
      };
    }
    return {
      title: '',
      slug: '',
      excerpt: '',
      full_content: '',
      image: '',
      tags: [],
      is_featured: false,
      is_active: true,
    };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const updateField = useCallback((field, value) => {
    setData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !slugManuallyEdited) {
        next.slug = generateSlug(value);
      }
      return next;
    });
    setErrors(prev => (prev[field] ? { ...prev, [field]: null } : prev));
  }, [slugManuallyEdited]);

  const setSlugManually = useCallback((value) => {
    setSlugManuallyEdited(true);
    setData(prev => ({ ...prev, slug: value }));
  }, []);

  // Tags
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);

  const addTag = useCallback((tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return false;
    if (data.tags.includes(trimmed)) {
      showErrorToast('Duplicate Tag', `"${trimmed}" is already added.`);
      return false;
    }
    if (data.tags.length >= 10) {
      showErrorToast('Too Many Tags', 'You can add a maximum of 10 tags.');
      return false;
    }
    setData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
    setTagInput('');
    setTagSuggestions([]);
    return true;
  }, [data.tags]);

  const removeTag = useCallback((tagToRemove) => {
    setData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  }, []);

  const handleTagInputChange = useCallback((e) => {
    const value = e.target.value;
    setTagInput(value);
    setTagSuggestions(
      value
        ? COMMON_TAG_SUGGESTIONS
            .filter(t => t.toLowerCase().includes(value.toLowerCase()) && !data.tags.includes(t))
            .slice(0, 5)
        : []
    );
  }, [data.tags]);

  const handleTagKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && data.tags.length > 0) {
      removeTag(data.tags[data.tags.length - 1]);
    }
  }, [tagInput, addTag, removeTag, data.tags]);

  // File uploads
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processImageFile = useCallback(async (file, field = 'image') => {
    const validationError = validateImageFile(file);
    if (validationError) {
      showErrorToast('Invalid File', validationError);
      return;
    }
    setUploading(true);
    try {
      const base64 = await readAsBase64(file);
      setData(prev => ({ ...prev, [field]: base64 }));
      showSuccessToast('Image Uploaded', 'Image has been added successfully.');
    } catch {
      showErrorToast('Upload Failed', 'Failed to read the image file. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e, field = 'image') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file, field);
  }, [processImageFile]);

  const handleFileSelect = useCallback((e, field = 'image') => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file, field);
    e.target.value = '';
  }, [processImageFile]);

  const removeImage = useCallback((field = 'image') => {
    setData(prev => ({ ...prev, [field]: '' }));
    showSuccessToast('Image Removed', 'Image has been removed.');
  }, []);

  // PDF
  const processPdfFile = useCallback(async (file) => {
    if (file.type !== 'application/pdf') {
      showErrorToast('Invalid File', 'Please select a PDF file.');
      return;
    }
    if (file.size > PDF_MAX_BYTES) {
      showErrorToast('File Too Large', 'PDF size should be less than 20MB.');
      return;
    }
    setPdfUploading(true);
    try {
      const base64 = await readAsBase64(file);
      setData(prev => ({ ...prev, pdf_url: base64 }));
      showSuccessToast('PDF Uploaded', 'PDF has been added successfully.');
    } catch {
      showErrorToast('Upload Failed', 'Failed to read the PDF file. Please try again.');
    } finally {
      setPdfUploading(false);
    }
  }, []);

  const handlePdfDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processPdfFile(file);
  }, [processPdfFile]);

  const handlePdfFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) processPdfFile(file);
    e.target.value = '';
  }, [processPdfFile]);

  const removePdf = useCallback(() => {
    setData(prev => ({ ...prev, pdf_url: '' }));
    showSuccessToast('PDF Removed', 'PDF has been removed.');
  }, []);

  // Editor image tracking & cleanup
  const [uploadedEditorImages, setUploadedEditorImages] = useState([]);

  const addUploadedImage = useCallback((url) => {
    setUploadedEditorImages(prev => [...prev, url]);
  }, []);

  const deleteEditorImages = useCallback(async () => {
    if (uploadedEditorImages.length === 0) return;
    try {
      const url = typeof window !== 'undefined' && window.route
        ? window.route('admin.editor-image.delete')
        : '/admin/editor-image/delete';
      await axios.delete(url, {
        data: { urls: uploadedEditorImages },
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // Silent fail — orphaned images are non-blocking
    }
    setUploadedEditorImages([]);
  }, [uploadedEditorImages]);

  // Submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setErrors({});

    const payload = { ...data };
    if (payload.slug && payload.slug.trim() === '') delete payload.slug;
    payload.is_featured = !!payload.is_featured;
    payload.is_active = !!payload.is_active;

    setIsSubmitting(true);
    const isEdit = !!initialData;
    const url = isEdit
      ? window.route(updateRoute, { id: initialData.id })
      : window.route(storeRoute);

    router[isEdit ? 'put' : 'post'](url, payload, {
      preserveScroll: true,
      preserveState: { errors: true },
      onSuccess: () => {
        setIsSubmitting(false);
        setUploadedEditorImages([]);
        const action = isEdit ? 'updated' : 'created';
        showSuccessToast(
          `${itemLabel} ${action}!`,
          `Your ${itemLabel.toLowerCase()} has been ${action} successfully.`
        );
        router.visit(window.route(indexRoute), { preserveScroll: true });
      },
      onError: (serverErrors) => {
        setIsSubmitting(false);
        if (serverErrors) {
          setErrors(serverErrors);
          const messages = Object.values(serverErrors).flat().join('\n');
          showErrorToast('Submission Error', messages || 'Please check your input and try again.');
        }
      },
    });
  }, [data, initialData, indexRoute, storeRoute, updateRoute, itemLabel]);

  const handleCancel = useCallback(() => {
    if (uploadedEditorImages.length > 0) deleteEditorImages();
    router.visit(window.route(indexRoute), { preserveScroll: true });
  }, [indexRoute, deleteEditorImages, uploadedEditorImages]);

  return {
    data,
    errors,
    isSubmitting,
    dragActive,
    uploading,
    pdfUploading,
    tagInput,
    tagSuggestions,
    uploadedEditorImages,
    addTag,
    addUploadedImage,
    removeTag,
    handleTagInputChange,
    handleTagKeyDown,
    handleDrag,
    handleDrop,
    handleFileSelect,
    processImageFile,
    removeImage,
    handlePdfDrop,
    handlePdfFileSelect,
    processPdfFile,
    removePdf,
    handleSubmit,
    handleCancel,
    updateField,
    setSlugManually,
    deleteEditorImages,
    setData,
  };
};

export default useContentForm;