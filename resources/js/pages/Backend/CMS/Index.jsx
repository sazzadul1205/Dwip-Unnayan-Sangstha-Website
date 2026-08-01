// resources/js/pages/Backend/CMS/Index.jsx

// React
import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Icons
import {
  FaPlus, FaEdit, FaTrash, FaUndo, FaSpinner,
  FaLock, FaHome, FaInfoCircle, FaCogs,
  FaEnvelope, FaBlog, FaUsers, FaFileAlt, FaToggleOn, FaToggleOff,
  FaSync, FaExclamationTriangle,
  FaSave, FaCalendarAlt,
  FaImages,
  FaBriefcase,
  FaGavel,
  FaShieldAlt,
} from 'react-icons/fa';
import { ImCross } from "react-icons/im";
import { BsStack } from "react-icons/bs";

// SweetAlert
import Swal from 'sweetalert2';

export default function Index({ items, protectedPages = [] }) {
  // STATE MANAGEMENT
  const { flash } = usePage().props;

  // Modal states
  const [formData, setFormData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // HELPER FUNCTIONS
  const generateSlug = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const getIcon = (slug) => {
    // Main pages with specific icons
    if (slug === 'home') return <FaHome className="text-blue-500" size={18} />;
    if (slug === 'about') return <FaInfoCircle className="text-green-500" size={18} />;
    if (slug === 'services') return <FaCogs className="text-purple-500" size={18} />;
    if (slug === 'contact') return <FaEnvelope className="text-red-500" size={18} />;
    if (slug === 'blog') return <FaBlog className="text-orange-500" size={18} />;
    if (slug === 'programs' || slug === 'projects-programs') return <FaUsers className="text-indigo-500" size={18} />;
    if (slug === 'publications') return <FaFileAlt className="text-teal-500" size={18} />;
    if (slug === 'gallery') return <FaImages className="text-pink-500" size={18} />;
    if (slug === 'jobs') return <FaBriefcase className="text-yellow-600" size={18} />;
    if (slug === 'terms') return <FaGavel className="text-gray-600" size={18} />;
    if (slug === 'privacy') return <FaShieldAlt className="text-gray-600" size={18} />;

    // Detail/sub-pages
    if (slug?.endsWith('-details')) return <FaFileAlt className="text-teal-500" size={18} />;

    // Default
    return <FaFileAlt className="text-gray-400" size={18} />;
  };

  const getPageTypeLabel = (slug) => {
    // Main pages with specific labels
    if (slug === 'home') return '🏠 Homepage';
    if (slug === 'about') return 'ℹ️ About Page';
    if (slug === 'services') return '⚙️ Services';
    if (slug === 'contact') return '📧 Contact Page';
    if (slug === 'blog') return '📝 Blog';
    if (slug === 'programs' || slug === 'projects-programs') return '👥 Programs';
    if (slug === 'publications') return '📄 Publications';
    if (slug === 'gallery') return '🖼️ Gallery';
    if (slug === 'jobs') return '💼 Careers';
    if (slug === 'terms') return '📋 Terms & Conditions';
    if (slug === 'privacy') return '🔒 Privacy Policy';

    // Detail/sub-pages
    if (slug?.endsWith('-details')) {
      // Extract parent name for better label
      const parent = slug.replace('-details', '');
      const parentLabels = {
        'about': 'About',
        'blog': 'Blog',
        'projects-programs': 'Program',
        'publications': 'Publication'
      };
      const displayName = parentLabels[parent] || parent.charAt(0).toUpperCase() + parent.slice(1);
      return `📄 ${displayName} Detail`;
    }

    // Default
    return '📄 Standard Page';
  };

  const isProtected = (item) => {
    if (!item) return false;
    if (item.slug?.endsWith('-details')) return true;
    return protectedPages.includes(item.slug);
  };

  const isSubPage = (slug) => {
    return slug?.endsWith('-details') || false;
  };

  const getParentSlug = (slug) => {
    if (!slug || !slug.endsWith('-details')) return null;
    return slug.replace('-details', '');
  };

  const getFields = () => ({
    slug: '',
    name: '',
    title: '',
    description: '',
    is_active: true
  });

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

  const handleSlugChange = (e) => {
    setFormData({
      ...formData,
      slug: e.target.value
    });
    if (validationErrors.slug) {
      setValidationErrors({ ...validationErrors, slug: null });
    }
  };

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

  // FORM VALIDATION
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

  // MODAL FUNCTIONS
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

  // CRUD OPERATIONS
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Fix Errors',
        text: 'There are some fields that need your attention.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setLoading(true);

    const data = { ...formData };

    if (!data.slug || data.slug.trim() === '') {
      delete data.slug;
    }

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
          title: editingItem ? '✨ Page Updated!' : '🎉 Page Created!',
          text: editingItem ? 'Your page has been updated successfully.' : 'Your new page has been created successfully.',
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
            title: 'Oops! Something went wrong',
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
        icon: 'info',
        title: '🔒 Protected Page',
        text: 'This page is system-protected and cannot be deactivated.',
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
          text: 'Failed to change status. Please try again.',
          confirmButtonColor: '#3b82f6',
        });
      },
    });
  };

  const confirmDelete = (item) => {
    if (isProtected(item)) {
      Swal.fire({
        icon: 'info',
        title: '🔒 Protected Page',
        text: 'This page is system-protected and cannot be deleted.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: 'Move to Trash?',
      html: `
        <div class="text-left">
          <p class="mb-2">You're about to move <strong>"${item.name || item.slug}"</strong> to the trash.</p>
          <p class="text-sm text-gray-500">⚠️ You can restore it later from the trash view.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🗑️ Move to Trash',
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
      html: `
        <div class="text-left">
          <p class="mb-2">You're about to permanently delete <strong>"${item.name || item.slug}"</strong>.</p>
          <p class="text-sm text-red-600 font-semibold">⚠️ This action CANNOT be undone!</p>
        </div>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🗑️ Permanently Delete',
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
      title: 'Restore Page?',
      html: `
        <div class="text-left">
          <p class="mb-2">You're about to restore <strong>"${item.name || item.slug}"</strong> from the trash.</p>
          <p class="text-sm text-gray-500">✅ The page will become active again.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '✅ Restore',
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

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // SORTING & FILTERING
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

  const getFilteredItems = () => {
    const sorted = getSortedItems();

    // First filter by deleted status
    let filtered = showDeleted
      ? sorted.filter(item => item.deleted_at !== null)
      : sorted.filter(item => item.deleted_at === null);

    // Then filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item =>
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.slug && item.slug.toLowerCase().includes(term)) ||
        (item.title && item.title.toLowerCase().includes(term))
      );
    }

    // Then filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(item => item.is_active === true);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(item => item.is_active === false);
    }

    return filtered;
  };

  // EFFECTS
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

  // RENDER
  const filteredItems = getFilteredItems();
  const activeCount = items.filter(p => p.is_active && !p.deleted_at).length;
  const deletedCount = items.filter(p => p.deleted_at !== null).length;
  const protectedCount = items.filter(p => isProtected(p) && !p.deleted_at).length;

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Pages" />

      <div className="p-4 md:p-6">
        {/* HEADER SECTION */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="bg-linear-to-r from-blue-500 to-purple-500 text-white p-2.5 rounded-xl text-xl">
                  📄
                </span>
                Pages
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage all your website pages from one place
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-5 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl cursor-pointer font-medium text-sm"
            >
              <FaPlus size={14} /> Create New Page
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Total Pages</span>
                <span className="text-lg font-bold text-gray-900">{items.length}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">✅ Active</span>
                <span className="text-lg font-bold text-green-600">{activeCount}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">🔒 Protected</span>
                <span className="text-lg font-bold text-yellow-600">{protectedCount}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">🗑️ Trash</span>
                <span className="text-lg font-bold text-red-500">{deletedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search pages by name, slug, or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="all">📊 All Status</option>
                <option value="active">✅ Active</option>
                <option value="inactive">⛔ Inactive</option>
              </select>
            </div>

            {/* Trash Toggle */}
            <button
              onClick={() => {
                setShowDeleted(!showDeleted);
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className={`px-5 py-2.5 rounded-lg transition flex items-center gap-2 font-medium cursor-pointer whitespace-nowrap ${showDeleted
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {showDeleted ? '📋 Show Active Pages' : '🗑️ View Trash'}
              {deletedCount > 0 && !showDeleted && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {deletedCount}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {(searchTerm || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium cursor-pointer"
              >
                Clear Filters ✕
              </button>
            )}
          </div>
        </div>

        {/* PAGE LIST */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">
                {showDeleted ? '🗑️' : '📄'}
              </div>
              <p className="text-gray-500 font-medium text-lg">
                {showDeleted ? 'No pages in trash' : 'No pages found'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {showDeleted
                  ? 'Deleted pages will appear here'
                  : searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Click "Create New Page" to get started'
                }
              </p>
              {!showDeleted && !searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => openModal()}
                  className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
                >
                  <FaPlus className="inline mr-2" size={14} />
                  Create Your First Page
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">

                {/* TABLE HEAD */}
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Slug
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Type
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Created
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* PAGE ROWS */}
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => {
                    const isDeleted = item.deleted_at !== null;
                    const protectedPage = isProtected(item);
                    const subPage = isSubPage(item.slug);
                    const parentSlug = getParentSlug(item.slug);
                    const parentExists = items.some(p => p.slug === parentSlug && !isSubPage(p.slug));

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 transition ${isDeleted ? 'bg-red-50/30' : ''} ${subPage && parentExists ? 'border-l-4 border-teal-300' : ''}`}
                      >
                        {/* Page Name */}
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                              {getIcon(item.slug)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium text-gray-900 ${subPage && parentExists ? 'text-sm' : ''}`}>
                                  {subPage && parentExists && <span className="text-gray-400 mr-1">↳</span>}
                                  {item.name || 'Unnamed Page'}
                                </span>
                                {subPage && parentExists && (
                                  <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                                    Sub-page
                                  </span>
                                )}
                                {protectedPage && (
                                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                    🔒 Protected
                                  </span>
                                )}
                                {isDeleted && (
                                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                    🗑️ Deleted
                                  </span>
                                )}
                              </div>
                              {item.title && (
                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                                  {item.title}
                                </p>
                              )}
                              {isDeleted && item.deleted_at && (
                                <p className="text-xs text-red-400 mt-0.5">
                                  Deleted: {formatDate(item.deleted_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Slug - Hidden on mobile */}
                        <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                            /{item.slug || '-'}
                          </code>
                        </td>

                        {/* Type - Hidden on tablet */}
                        <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                          <span className="text-xs text-gray-600">
                            {getPageTypeLabel(item.slug)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 md:px-6 py-4">
                          {!isDeleted ? (
                            <button
                              onClick={() => toggleStatus(item)}
                              disabled={toggling === item.id || protectedPage}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${item.is_active
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                } ${protectedPage ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                            <span className="text-sm text-red-500 font-medium">
                              🗑️ In Trash
                            </span>
                          )}
                        </td>

                        {/* Created Date - Hidden on mobile */}
                        <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <FaCalendarAlt size={12} className="text-gray-400" />
                            {formatDate(item.created_at)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 md:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isDeleted ? (
                              <>
                                <button
                                  onClick={() => confirmRestore(item)}
                                  disabled={isRestoring}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition cursor-pointer disabled:opacity-50 hover:scale-110"
                                  title="Restore from trash"
                                >
                                  <FaUndo size={16} />
                                </button>
                                <button
                                  onClick={() => confirmForceDelete(item)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer hover:scale-110"
                                  title="Permanently delete"
                                >
                                  <FaTrash size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <Link
                                  href={route('backend.cms.sections.page.sections', item.id)}
                                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition cursor-pointer hover:scale-110"
                                  title="Manage page sections"
                                >
                                  <BsStack size={16} />
                                </Link>
                                <button
                                  onClick={() => openModal(item)}
                                  className="p-2 rounded-lg transition cursor-pointer hover:scale-110 text-blue-600 hover:bg-blue-50"
                                  title={protectedPage ? 'Protected page cannot be edited' : 'Edit page'}
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => confirmDelete(item)}
                                  disabled={protectedPage}
                                  className={`p-2 rounded-lg transition cursor-pointer hover:scale-110 ${protectedPage
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-red-600 hover:bg-red-50'
                                    }`}
                                  title={protectedPage ? 'Protected page cannot be deleted' : 'Move to trash'}
                                >
                                  <FaTrash size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer with count */}
          {filteredItems.length > 0 && (
            <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
              <span>Showing {filteredItems.length} page{filteredItems.length > 1 ? 's' : ''}</span>
              {showDeleted && (
                <span className="text-red-500">🗑️ Trash view</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-linear-to-r from-blue-50 to-purple-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {editingItem ? '✏️ Edit Page' : '📄 Create New Page'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingItem ? 'Update your page details' : 'Fill in the details to create a new page'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/80 rounded-xl transition cursor-pointer"
              >
                <ImCross size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
              <div className="space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Page Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={handleNameChange}
                    placeholder="e.g., About Us, Our Services, Contact"
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${validationErrors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.name ? (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <FaExclamationTriangle size={12} /> {validationErrors.name}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1.5">
                      💡 The page name is used to generate the URL slug
                    </p>
                  )}
                </div>

                {/* Slug Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                      <input
                        type="text"
                        value={formData.slug || ''}
                        onChange={handleSlugChange}
                        placeholder="page-url-slug"
                        className={`w-full pl-6 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${validationErrors.slug ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                          }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={regenerateSlug}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center gap-2 shrink-0 cursor-pointer font-medium text-sm"
                      title="Auto-generate from name"
                    >
                      <FaSync size={14} />
                      Auto
                    </button>
                  </div>
                  {validationErrors.slug ? (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <FaExclamationTriangle size={12} /> {validationErrors.slug}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1.5">
                      💡 The URL slug is what appears in the browser address bar
                    </p>
                  )}
                </div>

                {/* Title Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Page Title <span className="text-gray-400 text-xs">(optional)</span>
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
                    placeholder="e.g., Welcome to Our Website"
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${validationErrors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                      }`}
                  />
                  {validationErrors.title && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <FaExclamationTriangle size={12} /> {validationErrors.title}
                    </p>
                  )}
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Description <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="A brief description of this page..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
                  />
                </div>

                {/* Active Status Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Page Status
                  </label>
                  <select
                    value={formData.is_active ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white ${editingItem && isProtected(editingItem) ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    disabled={editingItem && isProtected(editingItem)}
                  >
                    <option value="1">✅ Active - Visible on the site</option>
                    <option value="0">⛔ Inactive - Hidden from the site</option>
                  </select>
                  {editingItem && isProtected(editingItem) && (
                    <p className="text-xs text-yellow-600 mt-1.5 flex items-center gap-1">
                      <FaLock size={12} /> Protected pages cannot be deactivated
                    </p>
                  )}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-sm cursor-pointer"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition flex items-center gap-2 shadow-md hover:shadow-lg font-medium text-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" size={16} />
                    {editingItem ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <FaSave size={16} />
                    {editingItem ? 'Update Page' : 'Create Page'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}