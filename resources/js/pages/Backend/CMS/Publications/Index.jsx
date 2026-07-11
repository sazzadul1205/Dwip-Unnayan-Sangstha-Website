/* eslint-disable no-undef */
// resources/js/pages/Backend/CMS/Publications/Index.jsx

// React
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Icons
import {
  FaPlus, FaEdit, FaTrash, FaUndo, FaSpinner,
  FaToggleOn, FaToggleOff, FaStar, FaRegStar, FaSave, FaMagic, FaFileAlt,
  FaUpload, FaTimes, FaTag, FaEye, FaFilePdf, FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import { ImCross } from "react-icons/im";

// SweetAlert
import Swal from 'sweetalert2';

// Layout
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import RichTextEditor from '../../../../components/RichTextEditor/RichTextEditor';

export default function Index({ items }) {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const { flash } = usePage().props;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Loading states
  const [loading, setLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [featureToggling, setFeatureToggling] = useState(null);

  // Filter states
  const [showDeleted, setShowDeleted] = useState(false);

  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);
  const [pdfDragActive, setPdfDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Tag input states
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);

  // Track editor images uploaded
  const [uploadedEditorImages, setUploadedEditorImages] = useState([]);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const generateSlug = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const getFields = () => ({
    slug: '',
    title: '',
    excerpt: '',
    full_content: '',
    image: '',
    pdf_url: '',
    date: new Date().toISOString().split('T')[0],
    author: '',
    read_time: '3 minutes',
    tags: [],
    category: '',
    views: 0,
    is_featured: false,
    is_active: true
  });

  // Common tags suggestions
  const commonTags = [
    'Climate Change', 'Agriculture', 'Sustainability', 'Renewable Energy',
    'Biodiversity', 'Conservation', 'Disaster Management', 'Water Resources',
    'Urbanization', 'Education', 'Healthcare', 'Technology',
    'Innovation', 'Community Development', 'Empowerment', 'Microfinance',
    'Youth', 'Women Empowerment', 'Social Impact', 'Research'
  ];

  // ============================================================
  // MODAL FUNCTIONS
  // ============================================================

  const openModal = (item = null) => {
    setValidationErrors({});
    setEditingItem(item);
    if (item) {
      setFormData({
        ...item,
        tags: Array.isArray(item.tags) ? item.tags : (item.tags ? item.tags.split(',') : [])
      });
    } else {
      setFormData(getFields());
    }
    setTagInput('');
    setTagSuggestions([]);
    setUploadedEditorImages([]);
    setShowModal(true);
  };

  const closeModal = (isSubmitSuccess = false) => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setTagInput('');
    setTagSuggestions([]);
    setDragActive(false);
    setPdfDragActive(false);
    setUploading(false);
    setUploadingPdf(false);
    setValidationErrors({});

    if (!isSubmitSuccess && uploadedEditorImages.length > 0) {
      deleteEditorImages(uploadedEditorImages);
      setUploadedEditorImages([]);
    } else if (isSubmitSuccess) {
      setUploadedEditorImages([]);
    }
  };

  const deleteEditorImages = async (urls) => {
    try {
      await axios.delete(route('admin.editor-image.delete'), {
        data: { urls },
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to delete editor images:', error);
    }
  };

  const addUploadedImage = (url) => {
    setUploadedEditorImages(prev => [...prev, url]);
  };

  // ============================================================
  // TAG FUNCTIONS
  // ============================================================

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (formData.tags.includes(trimmedTag)) {
      Swal.fire({
        icon: 'warning',
        title: 'Duplicate Tag',
        text: `"${trimmedTag}" is already added.`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, trimmedTag]
    }));
    setTagInput('');
    setTagSuggestions([]);
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);

    if (value.length > 0) {
      const filtered = commonTags.filter(tag =>
        tag.toLowerCase().includes(value.toLowerCase()) &&
        !formData.tags.includes(tag)
      );
      setTagSuggestions(filtered.slice(0, 5));
    } else {
      setTagSuggestions([]);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && tagInput === '' && formData.tags.length > 0) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  // ============================================================
  // IMAGE DRAG & DROP FUNCTIONS
  // ============================================================

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      processImageFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const processImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please select an image file (JPEG, PNG, GIF, WebP, SVG)',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Image size should be less than 5MB',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      setFormData(prev => ({ ...prev, image: imageUrl }));
      setUploading(false);

      Swal.fire({
        icon: 'success',
        title: 'Image Uploaded',
        text: 'Image has been added successfully.',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    };
    reader.onerror = () => {
      setUploading(false);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Failed to read the image file. Please try again.',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    Swal.fire({
      icon: 'info',
      title: 'Image Removed',
      text: 'Image has been removed.',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  // ============================================================
  // PDF DRAG & DROP FUNCTIONS
  // ============================================================

  const handlePdfDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setPdfDragActive(true);
    } else if (e.type === "dragleave") {
      setPdfDragActive(false);
    }
  };

  const handlePdfDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPdfDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      processPdfFile(file);
    }
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processPdfFile(file);
    }
    e.target.value = '';
  };

  const processPdfFile = (file) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please select a PDF file.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'PDF size should be less than 20MB',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setUploadingPdf(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const pdfData = event.target.result;
      setFormData(prev => ({ ...prev, pdf_url: pdfData }));
      setUploadingPdf(false);

      Swal.fire({
        icon: 'success',
        title: 'PDF Uploaded',
        text: 'PDF file has been added successfully.',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    };
    reader.onerror = () => {
      setUploadingPdf(false);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Failed to read the PDF file. Please try again.',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
  };

  const removePdf = () => {
    setFormData(prev => ({ ...prev, pdf_url: '' }));
    Swal.fire({
      icon: 'info',
      title: 'PDF Removed',
      text: 'PDF file has been removed.',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  // ============================================================
  // FORM VALIDATION
  // ============================================================

  const validateForm = () => {
    const errors = {};

    if (!formData.title || formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long.';
    }

    if (formData.title && formData.title.length > 255) {
      errors.title = 'Title cannot exceed 255 characters.';
    }

    if (formData.slug && formData.slug.length > 255) {
      errors.slug = 'Slug cannot exceed 255 characters.';
    }

    if (formData.category && formData.category.length > 255) {
      errors.category = 'Category cannot exceed 255 characters.';
    }

    if (formData.author && formData.author.length > 255) {
      errors.author = 'Author cannot exceed 255 characters.';
    }

    if (formData.read_time && formData.read_time.length > 255) {
      errors.read_time = 'Read time cannot exceed 255 characters.';
    }

    if (formData.views && (formData.views < 0)) {
      errors.views = 'Views must be a positive number.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fix the highlighted fields before submitting.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setLoading(true);

    const data = { ...formData };

    if (!data.slug || data.slug.trim() === '') {
      delete data.slug;
    }

    data.is_featured = data.is_featured ? true : false;
    data.is_active = data.is_active ? true : false;
    data.views = parseInt(data.views) || 0;

    let url, method;

    if (editingItem) {
      url = window.route('backend.cms.publications.update', { id: editingItem.id });
      method = 'put';
    } else {
      url = window.route('backend.cms.publications.store');
      method = 'post';
    }

    router[method](url, data, {
      preserveScroll: true,
      onSuccess: () => {
        closeModal(true);
        setLoading(false);
        router.reload({ preserveScroll: true });

        Swal.fire({
          icon: 'success',
          title: editingItem ? 'Publication Updated!' : 'Publication Created!',
          text: editingItem ? 'Your publication has been updated successfully.' : 'Your publication has been created successfully.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      onError: (errors) => {
        console.error('Errors:', errors);
        setLoading(false);

        if (errors) {
          const errorMessages = Object.entries(errors).map(([field, messages]) => {
            const msgs = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgs.join(', ')}`;
          }).join('\n');

          Swal.fire({
            icon: 'error',
            title: 'Submission Error',
            text: errorMessages || 'Please check your input and try again.',
            confirmButtonColor: '#3b82f6',
          });

          setValidationErrors(errors);
        }
      },
    });
  };

  const toggleStatus = (item) => {
    setToggling(item.id);
    const url = window.route('backend.cms.publications.toggle-status', { id: item.id });
    router.post(url, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setToggling(null);
        router.reload({ preserveScroll: true });
      },
      onError: (errors) => {
        setToggling(null);
        console.error('Toggle status error:', errors);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to toggle status. Please try again.',
          confirmButtonColor: '#3b82f6',
        });
      },
    });
  };

  const toggleFeatured = (item) => {
    setFeatureToggling(item.id);
    const url = window.route('backend.cms.publications.toggle-featured', { id: item.id });
    router.post(url, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setFeatureToggling(null);
        router.reload({ preserveScroll: true });
      },
      onError: (errors) => {
        setFeatureToggling(null);
        console.error('Toggle featured error:', errors);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to toggle featured status. Please try again.',
          confirmButtonColor: '#3b82f6',
        });
      },
    });
  };

  const confirmDelete = (item) => {
    Swal.fire({
      title: 'Delete Publication',
      html: `Are you sure you want to delete <strong>"${item.title}"</strong>?<br><br><span style="color: #6b7280; font-size: 0.9rem;">This will move it to trash. You can restore it later.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const url = window.route('backend.cms.publications.destroy', { id: item.id });
        router.delete(url, {}, {
          preserveScroll: true,
          onError: (errors) => {
            console.error('Delete error:', errors);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete publication. Please try again.',
              confirmButtonColor: '#3b82f6',
            });
          },
        });
      }
    });
  };

  const confirmForceDelete = (item) => {
    Swal.fire({
      title: '⚠️ Permanently Delete?',
      html: `Are you sure you want to permanently delete <strong>"${item.title}"</strong>?<br><br><span style="color: #d33; font-weight: bold;">This action cannot be undone!</span><br><span style="color: #6b7280; font-size: 0.9rem;">All associated content, images, and PDF files will be removed.</span>`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, permanently delete!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const url = window.route('backend.cms.publications.force-delete', { id: item.id });
        router.delete(url, {}, {
          preserveScroll: true,
          onError: (errors) => {
            console.error('Force delete error:', errors);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to permanently delete publication. Please try again.',
              confirmButtonColor: '#3b82f6',
            });
          },
        });
      }
    });
  };

  const confirmRestore = (item) => {
    Swal.fire({
      title: 'Restore Publication',
      html: `Are you sure you want to restore <strong>"${item.title}"</strong> from trash?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, restore it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsRestoring(true);
        const url = window.route('backend.cms.publications.restore', { id: item.id });
        router.post(url, {}, {
          preserveScroll: true,
          onSuccess: () => {
            setIsRestoring(false);
            router.reload({ preserveScroll: true });
          },
          onError: (errors) => {
            setIsRestoring(false);
            console.error('Restore error:', errors);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to restore publication. Please try again.',
              confirmButtonColor: '#3b82f6',
            });
          },
        });
      }
    });
  };

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    if (flash?.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: flash.success,
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
    if (flash?.error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: flash.error,
        confirmButtonColor: '#3b82f6',
      });
    }
  }, [flash]);

  useEffect(() => {
    if (formData.title && (!formData.slug || formData.slug === generateSlug(formData.title))) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.title)
      }));
    }
  }, [formData.slug, formData.title]);

  // ============================================================
  // FILTERING
  // ============================================================

  const filteredItems = showDeleted
    ? items.filter(item => item.deleted_at !== null)
    : items.filter(item => item.deleted_at === null);

  const featuredCount = items.filter(item => item.is_featured && !item.deleted_at).length;

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Publications" />

      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📄 Publications</h1>
            <p className="text-sm text-gray-500">Manage publications and research papers</p>
            <div className="flex gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Active: {items.filter(b => b.is_active && !b.deleted_at).length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                Featured: {featuredCount} (max 1)
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Total: {items.length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Trash: {items.filter(b => b.deleted_at !== null).length}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 cursor-pointer ${showDeleted
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {showDeleted ? '📋 Show Active' : '🗑️ Trash'}
            </button>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-md hover:shadow-lg cursor-pointer"
            >
              <FaPlus size={14} /> Add New
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      {showDeleted ? '🗑️ No deleted publications found' : '📄 No publications found'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isDeleted = item.deleted_at !== null;
                    const isFeatured = item.is_featured;

                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${isDeleted ? 'bg-red-50/50' : ''}`}>
                        <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-10 h-10 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : item.pdf_url ? (
                              <FaFilePdf className="text-red-500" size={20} />
                            ) : (
                              <FaFileAlt className="text-blue-500" size={16} />
                            )}
                            <div>
                              <div className={`font-medium ${isDeleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {item.author ? `By ${item.author}` : 'No author'} • {item.date || 'No date'}
                              </div>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                  {item.tags.length > 2 && (
                                    <span className="text-xs text-gray-400">+{item.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            {item.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {!isDeleted ? (
                            <button
                              onClick={() => toggleStatus(item)}
                              disabled={toggling === item.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${item.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                } ${toggling === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {toggling === item.id ? (
                                <FaSpinner className="animate-spin" size={14} />
                              ) : item.is_active ? (
                                <FaToggleOn size={16} className="text-green-600" />
                              ) : (
                                <FaToggleOff size={16} className="text-gray-500" />
                              )}
                              {item.is_active ? 'Active' : 'Inactive'}
                            </button>
                          ) : (
                            <span className="text-xs text-red-500 font-medium">
                              <span className="inline-block mr-1">🗑️</span> Deleted
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!isDeleted && (
                            <button
                              onClick={() => toggleFeatured(item)}
                              disabled={featureToggling === item.id}
                              className={`p-1.5 rounded-lg transition hover:bg-yellow-50 cursor-pointer ${isFeatured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                                } ${featureToggling === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={isFeatured ? 'Remove featured' : 'Make featured'}
                            >
                              {featureToggling === item.id ? (
                                <FaSpinner className="animate-spin" size={14} />
                              ) : isFeatured ? (
                                <FaStar size={18} />
                              ) : (
                                <FaRegStar size={18} />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                            <FaEye size={14} className="text-gray-400" />
                            {item.views || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {isDeleted ? (
                            <>
                              <button
                                onClick={() => confirmRestore(item)}
                                disabled={isRestoring}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                                title="Restore"
                              >
                                <FaUndo size={16} />
                              </button>
                              <button
                                onClick={() => confirmForceDelete(item)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Permanently Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openModal(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => confirmDelete(item)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Move to Trash"
                              >
                                <FaTrash size={16} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================
          CREATE/EDIT MODAL WITH ERROR HANDLING
          ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold">
                  {editingItem ? '✏️ Edit Publication' : '📄 Create New Publication'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingItem ? 'Update your publication details' : 'Fill in the details to create a new publication'}
                </p>
              </div>
              <button
                onClick={() => closeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                <ImCross size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TITLE <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (validationErrors.title) {
                      setValidationErrors({ ...validationErrors, title: null });
                    }
                  }}
                  placeholder="Enter publication title"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  required
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={12} /> {validationErrors.title}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SLUG <span className="text-gray-400 text-xs">(optional - auto-generated)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, slug: e.target.value });
                      if (validationErrors.slug) {
                        setValidationErrors({ ...validationErrors, slug: null });
                      }
                    }}
                    placeholder="Auto-generated from title"
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.slug ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, slug: generateSlug(formData.title || '') })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2 shrink-0 cursor-pointer"
                    title="Generate slug from title"
                  >
                    <FaMagic size={14} /> Generate
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <FaInfoCircle className="text-gray-400" size={12} />
                  <p className="text-xs text-gray-400">Auto-generated from title. You can manually edit it.</p>
                </div>
                {validationErrors.slug && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={12} /> {validationErrors.slug}
                  </p>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EXCERPT <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  value={formData.excerpt || ''}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary of the publication"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FULL CONTENT <span className="text-gray-400 text-xs">(Rich text editor)</span>
                </label>
                <RichTextEditor
                  value={formData.full_content || ''}
                  onChange={(html) => setFormData({ ...formData, full_content: html })}
                  placeholder="Write your publication content here..."
                  height="400px"
                  onImageUploaded={addUploadedImage}
                />
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <FaInfoCircle size={12} /> Upload images directly into the editor. They will be stored in the editor-images folder.
                </p>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IMAGE <span className="text-gray-400 text-xs">(optional - max 5MB)</span>
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    } ${uploading ? 'opacity-50' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {formData.image ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={formData.image}
                        alt="Publication image"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 font-medium">Image uploaded</p>
                        <p className="text-xs text-gray-400 truncate">
                          {formData.image.substring(0, 60)}...
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" /> Ready to upload
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      >
                        <FaTimes size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                      <FaUpload size={32} className="mb-2" />
                      <p className="text-sm font-medium text-gray-600">Drag & drop an image here</p>
                      <p className="text-xs mt-1">or click to browse</p>
                      <p className="text-xs mt-2 text-gray-400">
                        Supports JPEG, PNG, GIF, WebP, SVG (max 5MB)
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        <span className="text-sm text-gray-600">Uploading image...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PDF Upload with Drag & Drop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF FILE <span className="text-gray-400 text-xs">(optional - max 20MB)</span>
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${pdfDragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    } ${uploadingPdf ? 'opacity-50' : ''}`}
                  onDragEnter={handlePdfDrag}
                  onDragLeave={handlePdfDrag}
                  onDragOver={handlePdfDrag}
                  onDrop={handlePdfDrop}
                >
                  {formData.pdf_url ? (
                    <div className="flex items-center gap-4">
                      <FaFilePdf size={40} className="text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 font-medium">PDF uploaded</p>
                        <p className="text-xs text-gray-400 truncate">
                          {formData.pdf_url.startsWith('data:application/pdf')
                            ? `PDF file (${Math.round(formData.pdf_url.length / 1024)} KB)`
                            : formData.pdf_url}
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" /> Ready to upload
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removePdf}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      >
                        <FaTimes size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                      <FaFilePdf size={40} className="mb-2 text-red-400" />
                      <p className="text-sm font-medium text-gray-600">Drag & drop a PDF here</p>
                      <p className="text-xs mt-1">or click to browse</p>
                      <p className="text-xs mt-2 text-gray-400">
                        Supports PDF files (max 20MB)
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={pdfInputRef}
                    accept=".pdf,application/pdf"
                    onChange={handlePdfSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingPdf}
                  />
                  {uploadingPdf && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        <span className="text-sm text-gray-600">Uploading PDF...</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <FaInfoCircle size={12} /> Upload a PDF file. It will be available for download on the frontend.
                </p>
              </div>

              {/* Author, Date, Read Time & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AUTHOR <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, author: e.target.value });
                      if (validationErrors.author) {
                        setValidationErrors({ ...validationErrors, author: null });
                      }
                    }}
                    placeholder="Author name"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.author ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.author && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaExclamationTriangle size={12} /> {validationErrors.author}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CATEGORY <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      if (validationErrors.category) {
                        setValidationErrors({ ...validationErrors, category: null });
                      }
                    }}
                    placeholder="Climate Change, Agriculture, etc."
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.category && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaExclamationTriangle size={12} /> {validationErrors.category}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DATE</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    READ TIME <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.read_time || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, read_time: e.target.value });
                      if (validationErrors.read_time) {
                        setValidationErrors({ ...validationErrors, read_time: null });
                      }
                    }}
                    placeholder="3 minutes"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.read_time ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.read_time && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaExclamationTriangle size={12} /> {validationErrors.read_time}
                    </p>
                  )}
                </div>
              </div>

              {/* Views */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VIEWS <span className="text-gray-400 text-xs">(initial view count)</span>
                </label>
                <input
                  type="number"
                  value={formData.views || 0}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, views: value === '' ? 0 : parseInt(value, 10) || 0 });
                    if (validationErrors.views) {
                      setValidationErrors({ ...validationErrors, views: null });
                    }
                  }}
                  placeholder="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.views ? 'border-red-500' : 'border-gray-300'
                    }`}
                  min="0"
                />
                {validationErrors.views && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={12} /> {validationErrors.views}
                  </p>
                )}
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${formData.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {formData.is_active ? '✅ Active' : '⛔ Inactive'}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Featured:</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${formData.is_featured
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {formData.is_featured ? '⭐ Featured' : '☆ Not Featured'}
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TAGS <span className="text-gray-400 text-xs">(press Enter to add)</span>
                </label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 min-h-10.5 transition">
                    {formData.tags && formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        <FaTag size={10} />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-600 transition ml-0.5"
                        >
                          <FaTimes size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagKeyDown}
                      placeholder={formData.tags.length === 0 ? "Type a tag and press Enter..." : ""}
                      className="flex-1 min-w-30 border-0 outline-none text-sm bg-transparent"
                    />
                  </div>

                  {/* Suggestions */}
                  {tagSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                      {tagSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => addTag(suggestion)}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition flex items-center gap-2"
                        >
                          <FaTag size={10} className="text-gray-400" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a tag. Click the X to remove.</p>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => closeModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" size={16} />
                      {editingItem ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FaSave size={16} />
                      {editingItem ? 'Update Publication' : 'Create Publication'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}