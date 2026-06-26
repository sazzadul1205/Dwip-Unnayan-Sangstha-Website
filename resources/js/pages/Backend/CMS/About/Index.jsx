/* eslint-disable import/order */
// resources/js/pages/Backend/CMS/About/Index.jsx

// React
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

// Icons
import {
  FaPlus, FaEdit, FaTrash, FaUndo, FaSpinner,
  FaToggleOn, FaToggleOff, FaStar, FaRegStar, FaSave, FaMagic, FaFileAlt,
  FaUpload, FaTimes, FaTag, FaHashtag,
  FaInfoCircle, FaList, FaImage, // Changed from FaIcon to FaImage
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
  const [filterType, setFilterType] = useState('all'); // all, main, detail

  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const fileInputRef = useRef(null);
  const iconInputRef = useRef(null);

  // Tag input states
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);

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
    type: 'main',
    content: '',
    full_content: '',
    image: '',
    icon: '',
    bg_color: '#ffffff',
    btn_text: '',
    btn_link: '',
    display_order: 0,
    is_featured: false,
    tags: [],
    is_active: true
  });

  // Common tags suggestions
  const commonTags = [
    'Mission', 'Vision', 'Values', 'History', 'Team',
    'Impact', 'Achievements', 'Success Stories', 'Community',
    'Sustainability', 'Innovation', 'Empowerment', 'Leadership',
    'Partnership', 'Transparency', 'Excellence'
  ];

  // ============================================================
  // MODAL FUNCTIONS
  // ============================================================

  const openModal = (item = null) => {
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
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setTagInput('');
    setTagSuggestions([]);
    setDragActive(false);
    setUploadingImage(false);
    setUploadingIcon(false);
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
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
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

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      setFormData(prev => ({ ...prev, image: imageUrl }));
      setUploadingImage(false);
    };
    reader.onerror = () => {
      setUploadingImage(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read the image file',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  // ============================================================
  // ICON DRAG & DROP FUNCTIONS
  // ============================================================

  const handleIconDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      processIconFile(file);
    }
  };

  const handleIconSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processIconFile(file);
    }
    e.target.value = '';
  };

  const processIconFile = (file) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select an icon file (SVG, PNG, JPEG)',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Icon size should be less than 2MB',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setUploadingIcon(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const iconUrl = event.target.result;
      setFormData(prev => ({ ...prev, icon: iconUrl }));
      setUploadingIcon(false);
    };
    reader.onerror = () => {
      setUploadingIcon(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read the icon file',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
  };

  const removeIcon = () => {
    setFormData(prev => ({ ...prev, icon: '' }));
  };

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const data = { ...formData };

    // Remove slug if empty
    if (!data.slug || data.slug.trim() === '') {
      delete data.slug;
    }

    // Convert boolean values properly
    data.is_featured = data.is_featured ? true : false;
    data.is_active = data.is_active ? true : false;

    let url, method;

    if (editingItem) {
      url = window.route('backend.cms.about.update', { id: editingItem.id });
      method = 'put';
    } else {
      url = window.route('backend.cms.about.store');
      method = 'post';
    }

    router[method](url, data, {
      preserveScroll: true,
      onSuccess: () => {
        closeModal();
        setLoading(false);
        router.reload({ preserveScroll: true });
      },
      onError: (errors) => {
        console.error('Errors:', errors);
        setLoading(false);
        if (errors) {
          const errorMessages = Object.values(errors).flat().join('\n');
          Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: errorMessages || 'Please check your input and try again.',
            confirmButtonColor: '#3b82f6',
          });
        }
      },
    });
  };

  const toggleStatus = (item) => {
    setToggling(item.id);
    const url = window.route('backend.cms.about.toggle-status', { id: item.id });
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
    if (!item.is_featured) {
      setFeatureToggling(item.id);

      const otherFeatured = items.filter(b => b.is_featured && b.id !== item.id && !b.deleted_at);

      if (otherFeatured.length > 0) {
        const currentFeatured = otherFeatured[0];
        const url = window.route('backend.cms.about.toggle-featured', { id: currentFeatured.id });
        router.post(url, {}, {
          preserveScroll: true,
          onSuccess: () => {
            const featureUrl = window.route('backend.cms.about.toggle-featured', { id: item.id });
            router.post(featureUrl, {}, {
              preserveScroll: true,
              onSuccess: () => {
                setFeatureToggling(null);
                router.reload({ preserveScroll: true });
              },
              onError: () => setFeatureToggling(null),
            });
          },
          onError: () => setFeatureToggling(null),
        });
        return;
      }
    }

    setFeatureToggling(item.id);
    const url = window.route('backend.cms.about.toggle-featured', { id: item.id });
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
      title: 'Delete About Content',
      text: `Are you sure you want to delete "${item.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const url = window.route('backend.cms.about.destroy', { id: item.id });
        router.delete(url, {}, {
          preserveScroll: true,
        });
      }
    });
  };

  const confirmForceDelete = (item) => {
    Swal.fire({
      title: 'Permanently Delete',
      text: `Are you sure you want to permanently delete "${item.title}"? This cannot be undone.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, permanently delete!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const url = window.route('backend.cms.about.force-delete', { id: item.id });
        router.delete(url, {}, {
          preserveScroll: true,
        });
      }
    });
  };

  const confirmRestore = (item) => {
    Swal.fire({
      title: 'Restore About Content',
      text: `Are you sure you want to restore "${item.title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, restore it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsRestoring(true);
        const url = window.route('backend.cms.about.restore', { id: item.id });
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
      Swal.fire({ icon: 'success', title: 'Success', text: flash.success, timer: 2000, showConfirmButton: false });
    }
    if (flash?.error) {
      Swal.fire({ icon: 'error', title: 'Error', text: flash.error });
    }
  }, [flash]);

  // Auto-generate slug when title changes
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

  const getFilteredItems = () => {
    let filtered = showDeleted
      ? items.filter(item => item.deleted_at !== null)
      : items.filter(item => item.deleted_at === null);

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();
  const featuredCount = items.filter(item => item.is_featured && !item.deleted_at).length;

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const getTypeBadge = (type) => {
    if (type === 'main') {
      return {
        label: 'Main',
        color: 'bg-blue-100 text-blue-700',
        icon: <FaInfoCircle size={12} />
      };
    }
    return {
      label: 'Detail',
      color: 'bg-purple-100 text-purple-700',
      icon: <FaList size={12} />
    };
  };

  return (
    <AuthenticatedLayout>
      <Head title="CMS - About Content" />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">About Content</h1>
            <p className="text-sm text-gray-500">Manage about page content and details</p>
            <div className="flex gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Active: {items.filter(b => b.is_active && !b.deleted_at).length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Featured: {featuredCount} (max 1)
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Total: {items.length}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${showDeleted
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {showDeleted ? '📋 Show Active' : '🗑️ Show Deleted'}
            </button>
            <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
              <FaPlus size={14} /> Add New
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('main')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterType === 'main'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <span className="flex items-center gap-1">
              <FaInfoCircle size={12} /> Main Content
            </span>
          </button>
          <button
            onClick={() => setFilterType('detail')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterType === 'detail'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <span className="flex items-center gap-1">
              <FaList size={12} /> Detail Pages
            </span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      {showDeleted ? 'No deleted about content found' : 'No about content found'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isDeleted = item.deleted_at !== null;
                    const isFeatured = item.is_featured;
                    const typeInfo = getTypeBadge(item.type);

                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${isDeleted ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.icon ? (
                              <img
                                src={item.icon}
                                alt={item.title}
                                className="w-8 h-8 object-contain rounded-lg"
                              />
                            ) : item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-10 h-10 object-cover rounded-lg"
                              />
                            ) : (
                              <FaFileAlt className="text-blue-500" size={16} />
                            )}
                            <div>
                              <div className={`font-medium ${isDeleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {item.content || 'No content'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.icon}
                            {typeInfo.label}
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
                            <span className="text-xs text-red-500 font-medium">Deleted</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!isDeleted && (
                            <button
                              onClick={() => toggleFeatured(item)}
                              disabled={featureToggling === item.id}
                              className={`p-1.5 rounded-lg transition hover:bg-yellow-50 ${isFeatured ? 'text-yellow-500' : 'text-gray-300'}`}
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
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
                            <FaHashtag size={10} />
                            {item.display_order || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {isDeleted ? (
                            <>
                              <button
                                onClick={() => confirmRestore(item)}
                                disabled={isRestoring}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Restore"
                              >
                                <FaUndo size={16} />
                              </button>
                              <button
                                onClick={() => confirmForceDelete(item)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Force Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openModal(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => confirmDelete(item)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
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
          CREATE/EDIT MODAL
          ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit' : 'Create'} About Content</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ImCross size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TITLE</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Slug - Auto-generated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SLUG</label>
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
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                    title="Regenerate slug from title"
                  >
                    <FaMagic size={14} /> Regenerate
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Auto-generated from title. You can manually edit it.</p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TYPE</label>
                <select
                  value={formData.type || 'main'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="main">Main Content</option>
                  <option value="detail">Detail Page</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Main content appears on the main about page. Detail pages are separate pages.</p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CONTENT (Short Description)</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Brief description or summary"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FULL CONTENT</label>
                <RichTextEditor
                  value={formData.full_content || ''}
                  onChange={(html) => setFormData({ ...formData, full_content: html })}
                  placeholder="Write your full content here..."
                  height="400px"
                />
              </div>

              {/* Image with Drag & Drop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IMAGE</label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    } ${uploadingImage ? 'opacity-50' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {formData.image ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={formData.image}
                        alt="About image"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Image uploaded</p>
                        <p className="text-xs text-gray-400 truncate">
                          {formData.image.substring(0, 60)}...
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
                      <p className="text-sm">Drag & drop an image here, or click to browse</p>
                      <p className="text-xs mt-1">Supports JPEG, PNG, GIF, WebP, SVG (max 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Icon with Drag & Drop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICON</label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    } ${uploadingIcon ? 'opacity-50' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleIconDrop}
                >
                  {formData.icon ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={formData.icon}
                        alt="About icon"
                        className="w-12 h-12 object-contain rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Icon uploaded</p>
                        <p className="text-xs text-gray-400 truncate">
                          {formData.icon.substring(0, 60)}...
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeIcon}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <FaTimes size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                      <FaImage size={24} className="mb-2" />
                      <p className="text-sm">Drag & drop an icon here, or click to browse</p>
                      <p className="text-xs mt-1">Supports SVG, PNG, JPEG (max 2MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={iconInputRef}
                    accept="image/*"
                    onChange={handleIconSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingIcon}
                  />
                  {uploadingIcon && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Background Color & Button */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BACKGROUND COLOR</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.bg_color || '#ffffff'}
                      onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                      className="w-12 h-12 p-1 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.bg_color || ''}
                      onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                      placeholder="#ffffff"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DISPLAY ORDER</label>
                  <input
                    type="number"
                    value={formData.display_order || 0}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                  <p className="text-xs text-gray-400 mt-1">Lower numbers appear first.</p>
                </div>
              </div>

              {/* Button Text & Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BUTTON TEXT</label>
                  <input
                    type="text"
                    value={formData.btn_text || ''}
                    onChange={(e) => setFormData({ ...formData, btn_text: e.target.value })}
                    placeholder="Learn More"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BUTTON LINK</label>
                  <input
                    type="text"
                    value={formData.btn_link || ''}
                    onChange={(e) => setFormData({ ...formData, btn_link: e.target.value })}
                    placeholder="/about/details"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
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
                    {formData.is_active ? 'Active' : 'Inactive'}
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
                    {formData.is_featured ? '⭐ Featured' : 'Not Featured'}
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TAGS</label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 min-h-10.5">
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
                          className="hover:text-red-600 transition"
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
                      placeholder={formData.tags.length === 0 ? "Type tag and press Enter..." : ""}
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
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                  {loading ? <FaSpinner className="animate-spin" size={16} /> : <FaSave size={16} />}
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}