/* eslint-disable no-undef */
/* eslint-disable import/order */
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
  FaSync,
} from 'react-icons/fa';
import { ImCross } from "react-icons/im";
import { BsStack } from "react-icons/bs";

// SweetAlert
import Swal from 'sweetalert2';

export default function Index({ items, protectedPages = [] }) {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const { flash } = usePage().props; // Flash messages from server

  // Modal states
  const [showModal, setShowModal] = useState(false); // Create/Edit modal visibility
  const [editingItem, setEditingItem] = useState(null); // Item being edited (null = create mode)
  const [formData, setFormData] = useState({}); // Form data for create/edit

  // Loading states
  const [loading, setLoading] = useState(false); // Submit loading state
  const [isRestoring, setIsRestoring] = useState(false); // Restore loading state
  const [toggling, setToggling] = useState(null); // ID of item being toggled

  // Filter states
  const [showDeleted, setShowDeleted] = useState(false); // Toggle showing deleted items

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  /**
   * Generate a URL-friendly slug from a string
   * Converts to lowercase, replaces spaces with hyphens, removes special chars
   */
  const generateSlug = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  /**
   * Get icon based on page slug
   * Returns appropriate React Icon component
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
   * Check if a page is protected (cannot be deleted or deactivated)
   * Protected pages: predefined list + pages ending with "-details"
   */
  const isProtected = (item) => {
    if (!item) return false;
    if (item.slug?.endsWith('-details')) return true;
    return protectedPages.includes(item.slug);
  };

  /**
   * Check if a page is a sub-page (ends with "-details")
   */
  const isSubPage = (slug) => {
    return slug?.endsWith('-details') || false;
  };

  /**
   * Get parent slug from sub-page slug
   * Example: "blog-details" -> "blog"
   */
  const getParentSlug = (slug) => {
    if (!slug || !slug.endsWith('-details')) return null;
    return slug.replace('-details', '');
  };

  /**
   * Get default form fields for creating a new page
   */
  const getFields = () => ({
    slug: '',
    name: '',
    title: '',
    description: '',
    is_active: true
  });

  /**
   * Handle name change - auto-generate slug from name
   * Only auto-generate if slug is empty or was auto-generated
   */
  const handleNameChange = (e) => {
    const name = e.target.value;
    // Check if slug was manually edited by comparing with auto-generated slug
    const autoSlug = generateSlug(name);
    const currentSlug = formData.slug || '';

    // Only auto-update slug if:
    // 1. Creating new item (no editingItem)
    // 2. OR editing but slug matches the old auto-generated slug
    const shouldAutoUpdate = !editingItem ||
      (editingItem && currentSlug === generateSlug(editingItem.name || ''));

    setFormData({
      ...formData,
      name,
      slug: shouldAutoUpdate ? autoSlug : currentSlug
    });
  };

  /**
   * Handle manual slug change - user is taking control of slug
   */
  const handleSlugChange = (e) => {
    setFormData({
      ...formData,
      slug: e.target.value
    });
  };

  /**
   * Regenerate slug from current name (manual refresh)
   */
  const regenerateSlug = () => {
    if (formData.name) {
      setFormData({
        ...formData,
        slug: generateSlug(formData.name)
      });
    }
  };

  // ============================================================
  // MODAL FUNCTIONS
  // ============================================================

  /**
   * Open modal for creating or editing a page
   * @param {Object|null} item - Page to edit, or null for create mode
   */
  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      // Edit mode - populate form with existing data
      setFormData({ ...item });
    } else {
      // Create mode - use default empty fields
      setFormData(getFields());
    }
    setShowModal(true);
  };

  /**
   * Close the modal and reset state
   */
  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  /**
   * Handle form submission for create/update
   * Submits data via Inertia router
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Clean up the data before sending
    const data = { ...formData };

    // Remove slug if it's empty - let controller handle it
    if (!data.slug || data.slug.trim() === '') {
      delete data.slug;
    }

    // Determine URL and method based on mode (create or edit)
    const url = editingItem ? route('backend.cms.pages.update', editingItem.id) : route('backend.cms.pages.store');
    const method = editingItem ? 'put' : 'post';

    router[method](url, { ...data }, {
      preserveScroll: true,
      onSuccess: () => { closeModal(); setLoading(false); },
      onError: () => setLoading(false),
    });
  };

  /**
   * Toggle page status (active/inactive)
   * Protected pages cannot be toggled
   */
  const toggleStatus = (item) => {
    // Check if page is protected
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

    // Send toggle request
    router.post(route('backend.cms.pages.toggle-status', item.id), {}, {
      preserveScroll: true,
      onSuccess: () => {
        setToggling(null);
        router.reload({ preserveScroll: true });
      },
      onError: () => setToggling(null),
    });
  };

  /**
   * Confirm deletion with SweetAlert
   * Protected pages cannot be deleted
   */
  const confirmDelete = (item) => {
    // Check if page is protected
    if (isProtected(item)) {
      Swal.fire({
        icon: 'warning',
        title: 'Protected Page',
        text: 'This page is protected and cannot be deleted.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Show confirmation dialog
    Swal.fire({
      title: 'Delete Page',
      text: `Are you sure you want to delete "${item.name || item.slug}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Send delete request
        router.delete(route('backend.cms.pages.destroy', item.id), {}, {
          preserveScroll: true,
        });
      }
    });
  };

  /**
   * Confirm permanent deletion with SweetAlert
   * This cannot be undone
   */
  const confirmForceDelete = (item) => {
    Swal.fire({
      title: 'Permanently Delete',
      text: `Are you sure you want to permanently delete "${item.name || item.slug}"? This cannot be undone.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, permanently delete!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('backend.cms.pages.force-delete', item.id), {}, {
          preserveScroll: true,
        });
      }
    });
  };

  /**
   * Confirm restore with SweetAlert
   * Restores a soft-deleted page
   */
  const confirmRestore = (item) => {
    Swal.fire({
      title: 'Restore Page',
      text: `Are you sure you want to restore "${item.name || item.slug}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, restore it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsRestoring(true);
        router.post(route('backend.cms.pages.restore', item.id), {}, {
          preserveScroll: true,
          onSuccess: () => setIsRestoring(false),
          onError: () => setIsRestoring(false),
        });
      }
    });
  };

  /**
   * Format value for table display
   * Handles dates, booleans, and truncates long strings
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

  /**
   * Sort items with sub-pages appearing directly after their parent
   * Example: blog -> blog-details -> services -> services-details
   */
  const getSortedItems = () => {
    // Separate parents and sub-pages
    const parents = items.filter(item => !isSubPage(item.slug));
    const subs = items.filter(item => isSubPage(item.slug));

    // Group sub-pages by parent slug
    const subMap = {};
    subs.forEach(sub => {
      const parentSlug = getParentSlug(sub.slug);
      if (!subMap[parentSlug]) {
        subMap[parentSlug] = [];
      }
      subMap[parentSlug].push(sub);
    });

    // Build sorted list: parent followed by its sub-pages
    const sorted = [];
    parents.forEach(parent => {
      sorted.push(parent);
      const parentSubs = subMap[parent.slug] || [];
      // Sort sub-pages by display_order if available
      parentSubs.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      sorted.push(...parentSubs);
    });

    // Add orphan sub-pages (no parent found)
    const orphanSubs = subs.filter(sub => {
      const parentSlug = getParentSlug(sub.slug);
      return !items.some(item => item.slug === parentSlug);
    });
    sorted.push(...orphanSubs);

    return sorted;
  };

  /**
   * Filter items based on showDeleted toggle
   * Returns either active items or deleted items
   */
  const filteredItems = () => {
    const sorted = getSortedItems();
    return showDeleted
      ? sorted.filter(item => item.deleted_at !== null) // Show only deleted
      : sorted.filter(item => item.deleted_at === null); // Show only active
  };

  // ============================================================
  // EFFECTS
  // ============================================================

  /**
   * Show flash messages from server using SweetAlert
   * Displays success or error messages
   */
  useEffect(() => {
    if (flash?.success) {
      Swal.fire({ icon: 'success', title: 'Success', text: flash.success, timer: 2000, showConfirmButton: false });
    }
    if (flash?.error) {
      Swal.fire({ icon: 'error', title: 'Error', text: flash.error });
    }
  }, [flash]);

  // ============================================================
  // RENDER
  // ============================================================

  const sortedFilteredItems = filteredItems();

  return (
    <AuthenticatedLayout>
      {/* Page Head */}
      <Head title="CMS - Pages" />

      <div className="p-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
            <p className="text-sm text-gray-500">Manage page content</p>
          </div>
          <div className="flex gap-3">
            {/* Toggle Deleted/Active Button */}
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${showDeleted
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {showDeleted ? '📋 Show Active' : '🗑️ Show Deleted'}
            </button>
            {/* Add New Page Button */}
            <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
              <FaPlus size={14} /> Add New
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Table Header */}
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

              {/* Table Body */}
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedFilteredItems.length === 0 ? (
                  // Empty state
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      {showDeleted ? 'No deleted pages found' : 'No pages found'}
                    </td>
                  </tr>
                ) : (
                  // Loop through items and render rows
                  sortedFilteredItems.map((item, idx) => {
                    const isDeleted = item.deleted_at !== null;
                    const protectedPage = isProtected(item);
                    const subPage = isSubPage(item.slug);
                    const parentSlug = getParentSlug(item.slug);
                    const parentExists = items.some(p => p.slug === parentSlug && !isSubPage(p.slug));

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 ${isDeleted ? 'bg-red-50' : ''} ${subPage && parentExists ? 'border-l-4 border-teal-300' : ''}`}
                      >
                        {/* Index Number */}
                        <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>

                        {/* Page Name with Icon */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getIcon(item.slug)}
                            <span className={`text-sm ${subPage && parentExists ? 'text-gray-700 pl-4' : 'text-gray-900 font-medium'}`}>
                              {subPage && parentExists && <span className="text-gray-400 mr-2">↳</span>}
                              {item.name || '-'}
                            </span>
                            {/* Sub-page badge */}
                            {subPage && parentExists && (
                              <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded ml-1">sub</span>
                            )}
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="px-6 py-4 text-sm text-gray-900">{item.slug || '-'}</td>

                        {/* Status Toggle Button */}
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
                                // Loading spinner
                                <FaSpinner className="animate-spin" size={14} />
                              ) : item.is_active ? (
                                // Active toggle icon
                                <FaToggleOn size={18} className="text-green-600" />
                              ) : (
                                // Inactive toggle icon
                                <FaToggleOff size={18} className="text-gray-500" />
                              )}
                              {item.is_active ? 'Active' : 'Inactive'}
                            </button>
                          ) : (
                            // Deleted status label
                            <span className="text-xs text-red-500 font-medium">Deleted</span>
                          )}
                        </td>

                        {/* Protected Status Badge */}
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

                        {/* Created Date */}
                        <td className="px-6 py-4 text-sm text-gray-500">{formatValue(item, 'created_at')}</td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {isDeleted ? (
                            // Actions for deleted items
                            <>
                              {/* Restore Button */}
                              <button
                                onClick={() => confirmRestore(item)}
                                disabled={isRestoring}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Restore"
                              >
                                <FaUndo size={16} />
                              </button>
                              {/* Force Delete Button */}
                              <button
                                onClick={() => confirmForceDelete(item)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Force Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </>
                          ) : (
                            // Actions for active items
                            <>
                              {/* Section List Button - NOW CONNECTED to Sections page */}
                              <Link
                                href={route('backend.cms.sections.page.sections', item.id)}
                                className="p-2 rounded-lg transition text-yellow-600 hover:bg-yellow-50 cursor-pointer hover:scale-110"
                                title='Manage Sections'
                              >
                                <BsStack size={16} />
                              </Link>

                              {/* Edit Button */}
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

                              {/* Delete Button (disabled for protected) */}
                              <button
                                onClick={() => confirmDelete(item)}
                                className={`p-2 rounded-lg transition ${protectedPage
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-600 hover:bg-red-50 cursor-pointer hover:scale-110'
                                  }`}
                                title={protectedPage ? 'Protected page cannot be deleted' : 'Delete'}
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
          CREATE/EDIT MODAL
          ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit' : 'Create'} Page</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ImCross size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NAME</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={handleNameChange}
                  placeholder="Enter page name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Slug will be auto-generated from the name</p>
              </div>

              {/* Slug Field with Regenerate Button */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SLUG</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={handleSlugChange}
                    placeholder="Auto-generated from name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={regenerateSlug}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                    title="Regenerate slug from name"
                  >
                    <FaSync size={14} />
                    Regenerate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.name ? `Generated: ${generateSlug(formData.name)}` : 'Enter a name to generate slug'}
                  {editingItem && formData.slug !== generateSlug(formData.name) && formData.slug && (
                    <span className="text-yellow-600 ml-2">⚠️ Manual override</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">You can manually edit the slug or click regenerate</p>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TITLE</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter page title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DESCRIPTION</label>
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
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
                {editingItem && isProtected(editingItem) && (
                  <p className="text-xs text-yellow-600 mt-1">Protected pages cannot be deactivated</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                  {loading ? <FaSpinner className="animate-spin" size={16} /> : null}
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