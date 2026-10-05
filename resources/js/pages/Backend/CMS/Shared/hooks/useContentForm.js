import { useState, useCallback, useEffect } from 'react';
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

  useEffect(() => {
    if (initialData && Object.keys(errors).length > 0) {
      const flashErrors = (window.__INERTIA_LAZY_DATA || {}).props?.errors;
    }
  }, [initialData, errors]);

  const updateField = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    if (field === 'title' && !slugManuallyEdited) {
      setData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
  }, [errors, slugManuallyEdited]);

  const setSlugManually = useCallback((value) => {
    setSlugManuallyEdited(true);
    setData(prev => ({ ...prev, slug: value }));
  }, []);

  // ------- Tag management -------
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);

  const addTag = useCallback((tag) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return false;
    if (data.tags.includes(trimmedTag)) {
      showErrorToast('Duplicate Tag', `"${trimmedTag}" is already added.`);
      return false;
    }
    if (data.tags.length >= 10) {
      showErrorToast('Too Many Tags', 'You can add a maximum of 10 tags.');
      return false;
    }
    setData(prev => ({ ...prev, tags: [...prev.tags, trimmedTag] }));
    setTagInput('');
    setTagSuggestions([]);
    return true;
  }, [data.tags]);

  const removeTag = useCallback((tagToRemove) => {
    setData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  }, []);

  const handleTagInputChange = useCallback((e) => {
    const value = e.target.value;
    setTagInput(value);
    if (value.length > 0) {
      const filtered = COMMON_TAG_SUGGESTIONS.filter(
        tag => tag.toLowerCase().includes(value.toLowerCase()) && !data.tags.includes(tag)
      );
      setTagSuggestions(filtered.slice(0, 5));
    } else {
      setTagSuggestions([]);
    }
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

  // ------- Image management -------
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  }, []);

  const processImageFile = useCallback(async (file) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      showErrorToast('Invalid File', validationError);
      return;
    }

    setUploading(true);
    try {
      const base64 = await readAsBase64(file);
      setData(prev => ({ ...prev, image: base64 }));
      showSuccessToast('Image Uploaded', 'Image has been added successfully.');
    } catch {
      showErrorToast('Upload Failed', 'Failed to read the image file. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const removeImage = useCallback(() => {
    setData(prev => ({ ...prev, image: '' }));
    showSuccessToast('Image Removed', 'Image has been removed.');
  }, []);

  // ------- PDF management -------
  const [pdfUploading, setPdfUploading] = useState(false);

  const validatePdfFile = (file) => {
    if (file.type !== 'application/pdf') {
      return 'Please select a PDF file.';
    }
    if (file.size > 20 * 1024 * 1024) {
      return 'PDF size should be less than 20MB.';
    }
    return null;
  };

  const processPdfFile = useCallback(async (file) => {
    const validationError = validatePdfFile(file);
    if (validationError) {
      showErrorToast('Invalid File', validationError);
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
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processPdfFile(files[0]);
    }
  }, [processPdfFile]);

  const handlePdfFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      processPdfFile(file);
    }
    e.target.value = '';
  }, [processPdfFile]);

  const removePdf = useCallback(() => {
    setData(prev => ({ ...prev, pdf_url: '' }));
    showSuccessToast('PDF Removed', 'PDF has been removed.');
  }, []);

  // ------- Editor image tracking & cleanup -------
  const [uploadedEditorImages, setUploadedEditorImages] = useState([]);

  const addUploadedImage = useCallback((url) => {
    setUploadedEditorImages(prev => [...prev, url]);
  }, []);

  const deleteEditorImages = useCallback(async () => {
    if (uploadedEditorImages.length > 0) {
      try {
        const deleteUrl = typeof window !== 'undefined' && window.route
          ? window.route('admin.editor-image.delete')
          : '/admin/editor-image/delete';
        await axios.delete(deleteUrl, {
          data: { urls: uploadedEditorImages },
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        // Silent fail — images are orphaned but not blocking
      }
    }
    setUploadedEditorImages([]);
  }, [uploadedEditorImages]);

  // ------- Form submission -------
  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    setErrors({});

    const dataToSubmit = { ...data };

    if (dataToSubmit.slug && dataToSubmit.slug.trim() === '') {
      delete dataToSubmit.slug;
    }

    dataToSubmit.is_featured = !!dataToSubmit.is_featured;
    dataToSubmit.is_active = !!dataToSubmit.is_active;

    setIsSubmitting(true);

    const isEdit = !!initialData;
    const url = isEdit
      ? window.route(updateRoute, { id: initialData.id })
      : window.route(storeRoute);
    const method = isEdit ? 'put' : 'post';

    router[method](url, dataToSubmit, {
      preserveScroll: true,
      preserveState: {
        errors: true,
      },
      onSuccess: () => {
        setIsSubmitting(false);
        setUploadedEditorImages([]);
        const action = isEdit ? 'updated' : 'created';
        showSuccessToast(
          `${itemLabel} ${action}!`,
          `Your ${itemLabel.toLowerCase()} has been ${action === 'updated' ? 'updated' : 'created'} successfully.`
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
    if (uploadedEditorImages.length > 0) {
      deleteEditorImages();
    }
    router.visit(window.route(indexRoute), { preserveScroll: true });
  }, [indexRoute, deleteEditorImages]);

  // ------- Sync server-side validation errors into local state -------
  useEffect(() => {
    const errors = (window.__INERTIA_ERRORS || {})[indexRoute] ||
      (window.__INERTIA_ERRORS || {})[storeRoute] ||
      (window.__INERTIA_ERRORS || {})[updateRoute];
    if (errors && Object.keys(errors).length > 0) {
      setErrors(errors);
    }
  }, []);

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
