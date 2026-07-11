/* eslint-disable no-undef */
// resources/js/pages/Backend/CMS/Blogs/Index.jsx

// React
import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

// API
import axios from 'axios';

// Icons
import {
  FaPlus, FaEdit, FaTrash, FaUndo, FaSpinner,
  FaToggleOn, FaToggleOff, FaStar, FaRegStar, FaSave, FaMagic, FaFileAlt,
  FaUpload, FaTimes, FaTag, FaExclamationTriangle, FaInfoCircle,
  FaCheck, FaClock
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
  const [searchTerm, setSearchTerm] = useState('');

  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Tag input states
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
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
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    author: '',
    read_time: 5,
    tags: [],
    is_featured: false,
    is_active: true
  });

  // Common tags suggestions
  const commonTags = [
    'Technology', 'Innovation', 'Future', 'Education', 'Health',
    'Sustainability', 'Community', 'Development', 'Empowerment',
    'Climate', 'Agriculture', 'Microfinance', 'Women Empowerment',
    'Youth', 'Leadership', 'Social Impact', 'Charity', 'Volunteer',
    'Entrepreneurship', 'Digital', 'Environment', 'Equality'
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
    setUploading(false);
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

    // Check for duplicate
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

    // Limit tags to 10
    if (formData.tags.length >= 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Too Many Tags',
        text: 'You can add a maximum of 10 tags.',
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
    // Validate file type
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

    // Validate file size (5MB)
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

      // Success feedback
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
      text: 'Image has been removed from the blog post.',
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

    if (formData.excerpt && formData.excerpt.length > 500) {
      errors.excerpt = 'Excerpt cannot exceed 500 characters.';
    }

    if (formData.read_time && (formData.read_time < 1 || formData.read_time > 60)) {
      errors.read_time = 'Read time must be between 1 and 60 minutes.';
    }

    if (formData.tags && formData.tags.length > 10) {
      errors.tags = 'You can add a maximum of 10 tags.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
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

    let url, method;

    if (editingItem) {
      url = window.route('backend.cms.blogs.update', { id: editingItem.id });
      method = 'put';
    } else {
      url = window.route('backend.cms.blogs.store');
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
          title: editingItem ? 'Blog Updated!' : 'Blog Created!',
          text: editingItem ? 'Your blog post has been updated successfully.' : 'Your blog post has been created successfully.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      onError: (errors) => {
        console.error('Errors:', errors);
        setLoading(false);

        // Show validation errors
        if (errors) {
          const errorMessages = Object.values(errors).flat().join('\n');
          Swal.fire({
            icon: 'error',
            title: 'Submission Error',
            text: errorMessages || 'Please check your input and try again.',
            confirmButtonColor: '#3b82f6',
          });
        }
      },
    });
  };

  const toggleStatus = (item) => {
    setToggling(item.id);
    const url = window.route('backend.cms.blogs.toggle-status', { id: item.id });
    router.post(url, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setToggling(null);
        router.reload({ preserveScroll: true });
      },
      onError: () => setToggling(null),
    });
  };

  const toggleFeatured = (item) => {
    setFeatureToggling(item.id);
    const url = window.route('backend.cms.blogs.toggle-featured', { id: item.id });
    router.post(url, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setFeatureToggling(null);
        router.reload({ preserveScroll: true });
      },
      onError: () => setFeatureToggling(null),
    });
  };

  const confirmDelete = (item) => {
    Swal.fire({
      title: 'Move to Trash?',
      text: `Are you sure you want to move "${item.title}" to trash?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, move to trash',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const url = window.route('backend.cms.blogs.destroy', { id: item.id });
        router.delete(url, {}, {
          preserveScroll: true,
        });
      }
    });
  };

  const confirmForceDelete = (item) => {
    Swal.fire({
      title: '⚠️ Permanently Delete?',
      text: `Are you sure you want to permanently delete "${item.title}"? This action cannot be undone and will remove all associated content.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete permanently',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const url = window.route('backend.cms.blogs.force-delete', { id: item.id });
        router.delete(url, {}, {
          preserveScroll: true,
        });
      }
    });
  };

  const confirmRestore = (item) => {
    Swal.fire({
      title: 'Restore Blog?',
      text: `Are you sure you want to restore "${item.title}" from trash?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, restore it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsRestoring(true);
        const url = window.route('backend.cms.blogs.restore', { id: item.id });
        router.post(url, {}, {
          preserveScroll: true,
          onSuccess: () => setIsRestoring(false),
          onError: () => setIsRestoring(false),
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

  const filteredItems = items
    .filter(item => showDeleted ? item.deleted_at !== null : item.deleted_at === null)
    .filter(item => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return item.title.toLowerCase().includes(search) ||
        item.author?.toLowerCase().includes(search) ||
        item.tags?.some(tag => tag.toLowerCase().includes(search));
    });

  const featuredCount = items.filter(item => item.is_featured && !item.deleted_at).length;

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Blogs" />

      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📝 Blog Posts</h1>
            <p className="text-sm text-gray-500">Manage your blog content</p>
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
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              <FaPlus size={14} /> New Blog
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {showDeleted ? '🗑️ No blogs in trash' : '📝 No blogs found'}
                      {searchTerm && ' matching your search'}
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
                            <FaFileAlt className={`${isDeleted ? 'text-gray-400' : 'text-blue-500'}`} size={16} />
                            <div>
                              <div className={`font-medium ${isDeleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {item.excerpt || 'No excerpt'}
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
                          {!isDeleted ? (
                            <button
                              onClick={() => toggleStatus(item)}
                              disabled={toggling === item.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${item.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
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
                              <FaClock className="inline mr-1" size={12} />
                              Deleted
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!isDeleted && (
                            <button
                              onClick={() => toggleFeatured(item)}
                              disabled={featureToggling === item.id}
                              className={`p-1.5 rounded-lg transition hover:bg-yellow-50 cursor-pointer ${isFeatured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                                }`}
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
                        <td className="px-6 py-4 text-sm text-gray-500">{item.date || '-'}</td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {isDeleted ? (
                            <>
                              <button
                                onClick={() => confirmRestore(item)}
                                disabled={isRestoring}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition cursor-pointer"
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
          CREATE/EDIT MODAL - IMPROVED
          ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold">
                  {editingItem ? '✏️ Edit Blog' : '📝 Create New Blog'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingItem ? 'Update your blog post content' : 'Fill in the details to create a new blog post'}
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
                  placeholder="Enter a compelling title for your blog post"
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
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Auto-generated from title"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, slug: generateSlug(formData.title || '') })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2 shrink-0"
                    title="Generate slug from title"
                  >
                    <FaMagic size={14} /> Generate
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <FaInfoCircle className="text-gray-400" size={12} />
                  <p className="text-xs text-gray-400">Auto-generated from title. You can manually edit it.</p>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EXCERPT <span className="text-gray-400 text-xs">(max 500 characters)</span>
                </label>
                <textarea
                  value={formData.excerpt || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, excerpt: e.target.value });
                    if (validationErrors.excerpt) {
                      setValidationErrors({ ...validationErrors, excerpt: null });
                    }
                  }}
                  placeholder="Write a brief summary of your blog post..."
                  rows={2}
                  maxLength={500}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.excerpt ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Brief summary shown in listings</span>
                  <span className={`text-xs ${(formData.excerpt || '').length > 450 ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {(formData.excerpt || '').length}/500
                  </span>
                </div>
                {validationErrors.excerpt && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={12} /> {validationErrors.excerpt}
                  </p>
                )}
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FULL CONTENT <span className="text-gray-400 text-xs">(Rich text editor)</span>
                </label>
                <RichTextEditor
                  value={formData.full_content || ''}
                  onChange={(html) => setFormData({ ...formData, full_content: html })}
                  placeholder="Write your blog content here... Use the toolbar to format text, add images, and more."
                  height="400px"
                  onImageUploaded={addUploadedImage}
                />
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <FaInfoCircle size={12} /> Upload images directly into the editor. They will be stored in the editor-images folder.
                </p>
              </div>

              {/* Image with Drag & Drop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FEATURED IMAGE <span className="text-gray-400 text-xs">(optional)</span>
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
                        alt="Blog featured image"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 font-medium">Image uploaded</p>
                        <p className="text-xs text-gray-400 truncate">
                          {formData.image.substring(0, 60)}...
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                          <FaCheck size={10} /> Ready to upload
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
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

              {/* Author & Date & Read Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AUTHOR <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author || ''}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PUBLISH DATE <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g., June 6, 2023"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Read Time - Fixed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    READ TIME <span className="text-gray-400 text-xs">(minutes)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.read_time || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, read_time: value === '' ? '' : parseInt(value, 10) });
                        if (validationErrors.read_time) {
                          setValidationErrors({ ...validationErrors, read_time: null });
                        }
                      }}
                      placeholder="Enter minutes (e.g., 5)"
                      min="1"
                      max="60"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.read_time ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">minutes</span>
                  </div>
                  {validationErrors.read_time && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaExclamationTriangle size={12} /> {validationErrors.read_time}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${formData.is_active
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${formData.is_featured
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {formData.is_featured ? '⭐ Featured' : '☆ Not Featured'}
                  </button>
                </div>
              </div>

              {/* Tags - Improved */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TAGS <span className="text-gray-400 text-xs">(max 10 tags)</span>
                </label>
                <div className="relative">
                  <div className={`flex flex-wrap gap-2 p-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 min-h-10.5 transition ${validationErrors.tags ? 'border-red-500' : 'border-gray-300'
                    }`}>
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

                  {validationErrors.tags && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaExclamationTriangle size={12} /> {validationErrors.tags}
                    </p>
                  )}

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
                <div className="flex items-center gap-2 mt-1">
                  <FaInfoCircle className="text-gray-400" size={12} />
                  <p className="text-xs text-gray-400">
                    Press Enter or comma to add a tag. Click the X to remove.
                    {formData.tags && formData.tags.length > 0 && ` (${formData.tags.length}/10)`}
                  </p>
                </div>
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
                      {editingItem ? 'Update Blog' : 'Create Blog'}
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