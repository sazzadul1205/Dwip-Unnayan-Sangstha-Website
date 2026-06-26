/* eslint-disable import/order */
// resources/js/pages/Backend/CMS/Programs/Index.jsx

// React
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

// Icons
import {
  FaPlus, FaEdit, FaTrash, FaUndo, FaSpinner,
  FaToggleOn, FaToggleOff, FaStar, FaRegStar, FaSave, FaMagic, FaFileAlt,
  FaUpload, FaTimes, FaHashtag
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
    breadcrumb: '',
    full_content_html: '',
    image: '',
    bg_color: '#ffffff',
    link: '',
    display_order: 0,
    is_featured: false,
    is_active: true
  });

  // ============================================================
  // MODAL FUNCTIONS
  // ============================================================

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({
        ...item,
      });
    } else {
      setFormData(getFields());
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setDragActive(false);
    setUploading(false);
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

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      setFormData(prev => ({ ...prev, image: imageUrl }));
      setUploading(false);
    };
    reader.onerror = () => {
      setUploading(false);
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
      url = window.route('backend.cms.programs.update', { id: editingItem.id });
      method = 'put';
    } else {
      url = window.route('backend.cms.programs.store');
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
    const url = window.route('backend.cms.programs.toggle-status', { id: item.id });
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
        const url = window.route('backend.cms.programs.toggle-featured', { id: currentFeatured.id });
        router.post(url, {}, {
          preserveScroll: true,
          onSuccess: () => {
            const featureUrl = window.route('backend.cms.programs.toggle-featured', { id: item.id });
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
    const url = window.route('backend.cms.programs.toggle-featured', { id: item.id });
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
      title: 'Delete Program',
      text: `Are you sure you want to delete "${item.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const url = window.route('backend.cms.programs.destroy', { id: item.id });
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
        const url = window.route('backend.cms.programs.force-delete', { id: item.id });
        router.delete(url, {}, {
          preserveScroll: true,
        });
      }
    });
  };

  const confirmRestore = (item) => {
    Swal.fire({
      title: 'Restore Program',
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
        const url = window.route('backend.cms.programs.restore', { id: item.id });
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

  // Auto-generate breadcrumb when title changes
  useEffect(() => {
    if (formData.title && (!formData.breadcrumb || formData.breadcrumb === formData.title)) {
      setFormData(prev => ({
        ...prev,
        breadcrumb: formData.title
      }));
    }
  }, [formData.breadcrumb, formData.title]);

  // ============================================================
  // FILTERING
  // ============================================================

  const filteredItems = showDeleted
    ? items.filter(item => item.deleted_at !== null)
    : items.filter(item => item.deleted_at === null);

  const featuredCount = items.filter(item => item.is_featured && !item.deleted_at).length;

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Programs" />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
            <p className="text-sm text-gray-500">Manage programs and projects</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {showDeleted ? 'No deleted programs found' : 'No programs found'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isDeleted = item.deleted_at !== null;
                    const isFeatured = item.is_featured;

                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${isDeleted ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.image ? (
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
                                {item.breadcrumb || 'No breadcrumb'}
                              </div>
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
              <h2 className="text-xl font-bold">{editingItem ? 'Edit' : 'Create'} Program</h2>
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
                  placeholder="Enter program title"
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

              {/* Breadcrumb */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BREADCRUMB</label>
                <input
                  type="text"
                  value={formData.breadcrumb || ''}
                  onChange={(e) => setFormData({ ...formData, breadcrumb: e.target.value })}
                  placeholder="Breadcrumb text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-generated from title. You can manually edit it.</p>
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FULL CONTENT</label>
                <RichTextEditor
                  value={formData.full_content_html || ''}
                  onChange={(html) => setFormData({ ...formData, full_content_html: html })}
                  placeholder="Write your program content here..."
                  height="400px"
                />
              </div>

              {/* Image with Drag & Drop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IMAGE</label>
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
                        alt="Program image"
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
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Background Color & Link */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">LINK / URL</label>
                  <input
                    type="text"
                    value={formData.link || ''}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/programs/example"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Display Order */}
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