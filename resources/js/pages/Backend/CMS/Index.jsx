/* eslint-disable no-undef */
// resources/js/pages/Backend/CMS/Index.jsx

// React
import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Icons
import {
  FaPlus, FaEdit, FaTrash, FaUndo, FaSpinner,
  FaLock, FaUnlock, FaHome, FaInfoCircle, FaCogs,
  FaEnvelope, FaBlog, FaUsers, FaFileAlt, FaToggleOn, FaToggleOff,
  FaSync, FaExclamationTriangle,
  FaSave,
} from 'react-icons/fa';
import { ImCross } from "react-icons/im";
import { BsStack } from "react-icons/bs";

// SweetAlert
import Swal from 'sweetalert2';

export default function Index({ items, protectedPages = [] }) {
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

  // Filter states
  const [showDeleted, setShowDeleted] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  /**
   * Generate a URL-friendly slug from a string
   */
  const generateSlug = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  /**
   * Get icon based on page slug
   */
  const getIcon = (slug) => {
    if (slug === 'home') return <FaHome className="text-blue-600" />;
    if (slug === 'about') return <FaInfoCircle className="text-green-600" />;
    if (slug === 'services') return <FaCogs className="text-purple-600" />;
    if (slug === 'contact') return <FaEnvelope className="text-red-600" />;
    if (slug === 'blog') return <FaBlog className="text-orange-600" />;
    if (slug === 'programs') return <FaUsers className="text-indigo-600" />;
    if (slug?.endsWith('-details')) return <FaFileAlt className="text-teal-600" />;
    return <FaFileAlt className="text-gray-400" />;
  };

  /**
   * Check if a page is protected
   */
  const isProtected = (item) => {
    if (!item) return false;
    if (item.slug?.endsWith('-details')) return true;
    return protectedPages.includes(item.slug);
  };

  /**
   * Check if a page is a sub-page
   */
  const isSubPage = (slug) => {
    return slug?.endsWith('-details') || false;
  };

  /**
   * Get parent slug from sub-page slug
   */
  const getParentSlug = (slug) => {
    if (!slug || !slug.endsWith('-details')) return null;
    return slug.replace('-details', '');
  };

  /**
   * Get default form fields
   */
  const getFields = () => ({
    slug: '',
    name: '',
    title: '',
    description: '',
    is_active: true
  });

  /**
   * Handle name change - auto-generate slug
   */
  const handleNameChange = (e) => {
    const name = e.target.value;
    const autoSlug = generateSlug(name);
    const currentSlug = formData.slug || '';

    const shouldAutoUpdate = !editingItem ||
      (editingItem && currentSlug === generateSlug(editingItem.name || ''));

    setFormData({
      ...formData,
      name,
      slug: shouldAutoUpdate ? autoSlug : currentSlug
    });

    if (validationErrors.name) {
      setValidationErrors({ ...validationErrors, name: null });
    }
  };

  /**
   * Handle manual slug change
   */
  const handleSlugChange = (e) => {
    setFormData({
      ...formData,
      slug: e.target.value
    });
    if (validationErrors.slug) {
      setValidationErrors({ ...validationErrors, slug: null });
    }
  };

  /**
   * Regenerate slug from current name
   */
  const regenerateSlug = () => {
    if (formData.name) {
      setFormData({
        ...formData,
        slug: generateSlug(formData.name)
      });
      if (validationErrors.slug) {
        setValidationErrors({ ...validationErrors, slug: null });
      }
    }
  };

  // ============================================================
  // FORM VALIDATION
  // ============================================================

  const validateForm = () => {
    const errors = {};

    if (!formData.name || formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters long.';
    }

    if (formData.name && formData.name.length > 255) {
      errors.name = 'Name cannot exceed 255 characters.';
    }

    if (!formData.slug || formData.slug.trim().length < 3) {
      errors.slug = 'Slug must be at least 3 characters long.';
    }

    if (formData.slug && formData.slug.length > 255) {
      errors.slug = 'Slug cannot exceed 255 characters.';
    }

    if (formData.title && formData.title.length > 255) {
      errors.title = 'Title cannot exceed 255 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================
  // MODAL FUNCTIONS
  // ============================================================

  const openModal = (item = null) => {
    setValidationErrors({});
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData(getFields());
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setValidationErrors({});
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

    // Ensure boolean values
    data.is_active = data.is_active ? true : false;

    const url = editingItem
      ? route('backend.cms.pages.update', editingItem.id)
      : route('backend.cms.pages.store');
    const method = editingItem ? 'put' : 'post';

    router[method](url, data, {
      preserveScroll: true,
      onSuccess: () => {
        closeModal();
        setLoading(false);
        router.reload({ preserveScroll: true });

        Swal.fire({
          icon: 'success',
          title: editingItem ? 'Page Updated!' : 'Page Created!',
          text: editingItem ? 'Your page has been updated successfully.' : 'Your page has been created successfully.',
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
    if (isProtected(item)) {
      Swal.fire({
        icon: 'warning',
        title: 'Protected Page',
        text: 'This page is protected and cannot be deactivated.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setToggling(item.id);
    router.post(route('backend.cms.pages.toggle-status', item.id), {}, {
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

  const confirmDelete = (item) => {
    if (isProtected(item)) {
      Swal.fire({
        icon: 'warning',
        title: 'Protected Page',
        text: 'This page is protected and cannot be deleted.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Page',
      html: `Are you sure you want to delete <strong>"${item.name || item.slug}"</strong>?<br><br><span style="color: #6b7280; font-size: 0.9rem;">This will move it to trash. You can restore it later.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('backend.cms.pages.destroy', item.id), {}, {
          preserveScroll: true,
          onError: (errors) => {
            console.error('Delete error:', errors);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete page. Please try again.',
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
      html: `Are you sure you want to permanently delete <strong>"${item.name || item.slug}"</strong>?<br><br><span style="color: #d33; font-weight: bold;">This action cannot be undone!</span>`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, permanently delete!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('backend.cms.pages.force-delete', item.id), {}, {
          preserveScroll: true,
          onError: (errors) => {
            console.error('Force delete error:', errors);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to permanently delete page. Please try again.',
              confirmButtonColor: '#3b82f6',
            });
          },
        });
      }
    });
  };

  const confirmRestore = (item) => {
    Swal.fire({
      title: 'Restore Page',
      html: `Are you sure you want to restore <strong>"${item.name || item.slug}"</strong> from trash?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, restore it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsRestoring(true);
        router.post(route('backend.cms.pages.restore', item.id), {}, {
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
              text: 'Failed to restore page. Please try again.',
              confirmButtonColor: '#3b82f6',
            });
          },
        });
      }
    });
  };

  /**
   * Format value for table display
   */
  const formatValue = (item, key) => {
    if (item[key] === null || item[key] === undefined) return '-';
    if (key === 'created_at' || key === 'updated_at') {
      return new Date(item[key]).toLocaleDateString();
    }
    return String(item[key]).substring(0, 50);
  };

  // ============================================================
  // SORTING & FILTERING
  // ============================================================

  const getSortedItems = () => {
    const parents = items.filter(item => !isSubPage(item.slug));
    const subs = items.filter(item => isSubPage(item.slug));

    const subMap = {};
    subs.forEach(sub => {
      const parentSlug = getParentSlug(sub.slug);
      if (!subMap[parentSlug]) {
        subMap[parentSlug] = [];
      }
      subMap[parentSlug].push(sub);
    });

    const sorted = [];
    parents.forEach(parent => {
      sorted.push(parent);
      const parentSubs = subMap[parent.slug] || [];
      parentSubs.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      sorted.push(...parentSubs);
    });

    const orphanSubs = subs.filter(sub => {
      const parentSlug = getParentSlug(sub.slug);
      return !items.some(item => item.slug === parentSlug);
    });
    sorted.push(...orphanSubs);

    return sorted;
  };

  const filteredItems = () => {
    const sorted = getSortedItems();
    return showDeleted
      ? sorted.filter(item => item.deleted_at !== null)
      : sorted.filter(item => item.deleted_at === null);
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

  // ============================================================
  // RENDER
  // ============================================================

  const sortedFilteredItems = filteredItems();

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Pages" />

      <div className="p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📄 Pages</h1>
            <p className="text-sm text-gray-500">Manage page content</p>
            <div className="flex gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Active: {items.filter(p => p.is_active && !p.deleted_at).length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                Protected: {items.filter(p => isProtected(p) && !p.deleted_at).length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Total: {items.length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Trash: {items.filter(p => p.deleted_at !== null).length}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protected</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedFilteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      {showDeleted ? '🗑️ No deleted pages found' : '📄 No pages found'}
                    </td>
                  </tr>
                ) : (
                  sortedFilteredItems.map((item, idx) => {
                    const isDeleted = item.deleted_at !== null;
                    const protectedPage = isProtected(item);
                    const subPage = isSubPage(item.slug);
                    const parentSlug = getParentSlug(item.slug);
                    const parentExists = items.some(p => p.slug === parentSlug && !isSubPage(p.slug));

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 ${isDeleted ? 'bg-red-50/50' : ''} ${subPage && parentExists ? 'border-l-4 border-teal-300' : ''}`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getIcon(item.slug)}
                            <span className={`text-sm ${subPage && parentExists ? 'text-gray-700 pl-4' : 'text-gray-900 font-medium'}`}>
                              {subPage && parentExists && <span className="text-gray-400 mr-2">↳</span>}
                              {item.name || '-'}
                            </span>
                            {subPage && parentExists && (
                              <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded ml-1">sub</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.slug || '-'}</td>
                        <td className="px-6 py-4">
                          {!isDeleted ? (
                            <button
                              onClick={() => toggleStatus(item)}
                              disabled={toggling === item.id || protectedPage}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${item.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                } ${protectedPage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              title={protectedPage ? 'Protected page cannot be deactivated' : item.is_active ? 'Click to deactivate' : 'Click to activate'}
                            >
                              {toggling === item.id ? (
                                <FaSpinner className="animate-spin" size={14} />
                              ) : item.is_active ? (
                                <FaToggleOn size={18} className="text-green-600" />
                              ) : (
                                <FaToggleOff size={18} className="text-gray-500" />
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
                          {protectedPage ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                              <FaLock size={10} /> Protected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">
                              <FaUnlock size={10} /> Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatValue(item, 'created_at')}</td>
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
                              <Link
                                href={route('backend.cms.sections.page.sections', item.id)}
                                className="p-2 rounded-lg transition text-yellow-600 hover:bg-yellow-50 cursor-pointer hover:scale-110"
                                title="Manage Sections"
                              >
                                <BsStack size={16} />
                              </Link>
                              <button
                                onClick={() => openModal(item)}
                                className={`p-2 rounded-lg transition ${protectedPage
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-blue-600 hover:bg-blue-50 cursor-pointer hover:scale-110'
                                  }`}
                                title={protectedPage ? 'Protected page cannot be edited' : 'Edit'}
                                disabled={protectedPage}
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => confirmDelete(item)}
                                className={`p-2 rounded-lg transition ${protectedPage
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-600 hover:bg-red-50 cursor-pointer hover:scale-110'
                                  }`}
                                title={protectedPage ? 'Protected page cannot be deleted' : 'Move to Trash'}
                                disabled={protectedPage}
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold">
                  {editingItem ? '✏️ Edit Page' : '📄 Create New Page'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingItem ? 'Update your page details' : 'Fill in the details to create a new page'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                <ImCross size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={handleNameChange}
                  placeholder="Enter page name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  required
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={12} /> {validationErrors.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Slug will be auto-generated from the name</p>
              </div>

              {/* Slug Field with Regenerate Button */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SLUG <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={handleSlugChange}
                    placeholder="Auto-generated from name"
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.slug ? 'border-red-500' : 'border-gray-300'
                      }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={regenerateSlug}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2 shrink-0 cursor-pointer"
                    title="Regenerate slug from name"
                  >
                    <FaSync size={14} />
                    Regenerate
                  </button>
                </div>
                {validationErrors.slug && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={12} /> {validationErrors.slug}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {formData.name ? `Generated: ${generateSlug(formData.name)}` : 'Enter a name to generate slug'}
                  </span>
                  {editingItem && formData.slug !== generateSlug(formData.name) && formData.slug && (
                    <span className="text-xs text-yellow-600">⚠️ Manual override</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">You can manually edit the slug or click regenerate</p>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TITLE <span className="text-gray-400 text-xs">(optional)</span>
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
                  placeholder="Enter page title"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${validationErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={12} /> {validationErrors.title}
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DESCRIPTION <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter page description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Active Status Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ACTIVE</label>
                <select
                  value={formData.is_active ? '1' : '0'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={editingItem && isProtected(editingItem)}
                >
                  <option value="1">✅ Active</option>
                  <option value="0">⛔ Inactive</option>
                </select>
                {editingItem && isProtected(editingItem) && (
                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <FaLock size={10} /> Protected pages cannot be deactivated
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
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
                      {editingItem ? 'Update Page' : 'Create Page'}
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