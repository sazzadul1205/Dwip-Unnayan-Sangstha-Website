// resources/js/pages/Backend/Roles/Index.jsx

import { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

// Icons
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaEye,
  FaShieldAlt,
  FaToggleOn,
  FaToggleOff,
  FaUsers,
  FaKey,
  FaTrashRestore,
  FaFilter,
  FaSearch,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaBan,
  FaCheckDouble,
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
  FaDownload,
} from 'react-icons/fa';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// SweetAlert2
import Swal from 'sweetalert2';

export default function RolesIndex({ roles: initialRoles, filters: initialFilters = {}, stats: initialStats = {} }) {
  const { flash } = usePage().props;

  // States
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [restoringId, setRestoringId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [cloningId, setCloningId] = useState(null);

  // Pagination state
  const [roles, setRoles] = useState(initialRoles);
  const [currentPage, setCurrentPage] = useState(initialRoles?.current_page || 1);
  const [stats, setStats] = useState(initialStats);

  // Filter states - synced with URL/backend
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    status: initialFilters.status || 'all',
    minLevel: initialFilters.min_level || '',
    maxLevel: initialFilters.max_level || '',
  });

  // Get roles array from paginated response
  const roleItems = useMemo(() => {
    if (Array.isArray(roles)) return roles;
    if (roles && Array.isArray(roles.data)) return roles.data;
    return [];
  }, [roles]);

  // Pagination info
  const pagination = useMemo(() => {
    if (roles && typeof roles === 'object' && 'current_page' in roles) {
      return {
        currentPage: roles.current_page,
        lastPage: roles.last_page,
        perPage: roles.per_page,
        total: roles.total,
        from: roles.from,
        to: roles.to,
        links: roles.links || [],
      };
    }
    return null;
  }, [roles]);

  // Apply filters whenever filters change (with pagination)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get(route('backend.roles.index'), {
        ...filters,
        page: 1,
      }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onSuccess: (page) => {
          setRoles(page.props.roles);
          setStats(page.props.stats);
          setCurrentPage(1);
        },
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Keep local roles in sync
  useEffect(() => {
    setRoles(initialRoles);
    setStats(initialStats);
    setCurrentPage(initialRoles?.current_page || 1);
  }, [initialRoles, initialStats]);

  // Handle page change
  const handlePageChange = (page) => {
    if (page === pagination?.currentPage) return;
    if (page < 1 || page > pagination?.lastPage) return;

    router.get(route('backend.roles.index'), {
      ...filters,
      page: page,
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setRoles(page.props.roles);
        setStats(page.props.stats);
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Sort roles for display
  const sortedRoles = useMemo(() => {
    return [...roleItems].sort((a, b) => {
      // Deleted roles go to bottom
      if (a.deleted_at && !b.deleted_at) return 1;
      if (!a.deleted_at && b.deleted_at) return -1;

      // Sort by level
      return (a.level || 999) - (b.level || 999);
    });
  }, [roleItems]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      minLevel: '',
      maxLevel: '',
    });
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return filters.search !== '' ||
      filters.status !== 'all' ||
      filters.minLevel !== '' ||
      filters.maxLevel !== '';
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    const nonDeletedRoles = sortedRoles.filter(role => !role.deleted_at);
    if (selectedRoles.length === nonDeletedRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(nonDeletedRoles.map(role => role.id));
    }
  };

  const handleSelectRole = (roleId) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (selectedRoles.length === 0) {
      Swal.fire('No Selection', 'Please select at least one role.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Delete Roles',
      text: `Are you sure you want to delete ${selectedRoles.length} role(s)? This will move them to trash.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.roles.bulk-delete'), {
          role_ids: selectedRoles
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `${selectedRoles.length} role(s) have been moved to trash.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedRoles([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to delete roles.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk restore
  const handleBulkRestore = () => {
    if (selectedRoles.length === 0) {
      Swal.fire('No Selection', 'Please select at least one role.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Restore Roles',
      text: `Are you sure you want to restore ${selectedRoles.length} role(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.roles.bulk-restore'), {
          role_ids: selectedRoles
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: `${selectedRoles.length} role(s) have been restored.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedRoles([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to restore roles.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Single role actions
  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'Delete Role?',
      text: `Are you sure you want to delete "${name}"? This will move it to trash.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setDeletingId(id);

        router.delete(route('backend.roles.destroy', id), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Role has been moved to trash.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: errors?.message || 'Failed to delete role.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setDeletingId(null),
        });
      }
    });
  };

  const handleRestore = (id, name) => {
    Swal.fire({
      title: 'Restore Role?',
      text: `Are you sure you want to restore "${name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setRestoringId(id);

        router.post(route('backend.roles.restore', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: 'Role has been restored successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Restore Failed',
              text: errors?.message || 'Failed to restore role.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setRestoringId(null),
        });
      }
    });
  };

  const handleToggleStatus = (role) => {
    Swal.fire({
      title: role.is_active ? 'Deactivate Role?' : 'Activate Role?',
      text: role.is_default
        ? 'Default roles cannot be deactivated.'
        : `This will ${role.is_active ? 'deactivate' : 'activate'} "${role.name}".`,
      icon: 'question',
      showCancelButton: !role.is_default,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: role.is_active ? 'Deactivate' : 'Activate',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && !role.is_default) {
        setTogglingId(role.id);

        router.post(route('backend.roles.toggle-status', role.id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            router.reload();
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: `Role has been ${!role.is_active ? 'activated' : 'deactivated'}.`,
              timer: 1500,
              showConfirmButton: false,
            });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to update role status.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setTogglingId(null),
        });
      }
    });
  };

  const handleClone = (id, name) => {
    Swal.fire({
      title: 'Clone Role?',
      text: `Create a copy of "${name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, clone',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setCloningId(id);

        router.post(route('backend.roles.clone', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Cloned!',
              text: 'Role has been cloned successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Clone Failed',
              text: errors?.message || 'Failed to clone role.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setCloningId(null),
        });
      }
    });
  };

  const handleExport = () => {
    window.open(route('backend.roles.export', filters), '_blank');
  };

  // Helper functions
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLevelBadge = (level) => {
    if (!level) return 'bg-gray-100 text-gray-600';
    if (level <= 10) return 'bg-red-100 text-red-700';
    if (level <= 30) return 'bg-orange-100 text-orange-700';
    if (level <= 60) return 'bg-yellow-100 text-yellow-700';
    if (level <= 80) return 'bg-blue-100 text-blue-700';
    return 'bg-green-100 text-green-700';
  };

  // Pagination component
  const Pagination = () => {
    if (!pagination || pagination.lastPage <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.lastPage, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{pagination.from || 0}</span> to{' '}
          <span className="font-medium">{pagination.to || 0}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> results
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${pagination.currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            <FaChevronLeft size={12} />
            Previous
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1.5 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${page === pagination.currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
            >
              {page}
            </button>
          ))}

          {endPage < pagination.lastPage && (
            <>
              {endPage < pagination.lastPage - 1 && <span className="px-2 text-gray-400">...</span>}
              <button
                onClick={() => handlePageChange(pagination.lastPage)}
                className="px-3 py-1.5 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition"
              >
                {pagination.lastPage}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.lastPage}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${pagination.currentPage === pagination.lastPage
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            Next
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    );
  };

  // Show flash messages
  useEffect(() => {
    if (flash?.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: flash.success,
        timer: 2000,
        showConfirmButton: false,
      });
    }
    if (flash?.error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: flash.error,
        confirmButtonColor: '#2563eb',
      });
    }
  }, [flash]);

  const activeCount = stats?.active || 0;
  const inactiveCount = stats?.inactive || 0;
  const deletedCount = stats?.total_deleted || 0;
  const defaultCount = stats?.default || 0;
  const totalCount = stats?.total || roleItems.length;

  return (
    <AuthenticatedLayout>
      <Head title="Roles & Permissions" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
        <div className="mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Roles & Permissions
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage user roles and access control levels
              </p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Active: {activeCount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Inactive: {inactiveCount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Deleted: {deletedCount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Default: {defaultCount}
                </span>
                {hasActiveFilters() && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Filtered
                  </span>
                )}
                {pagination && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    Total: {totalCount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2.5 rounded-lg flex items-center gap-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all duration-200"
              >
                <FaDownload size={14} />
                Export
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 ${showFilters || hasActiveFilters()
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <FaFilter size={14} />
                Filters
                {hasActiveFilters() && (
                  <span className="ml-1 bg-white text-blue-600 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {Object.values(filters).filter(v => v !== 'all' && v !== '').length}
                  </span>
                )}
                {showFilters ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>

              <a
                href={route('backend.roles.create')}
                className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <FaPlus size={16} />
                Create Role
              </a>
            </div>
          </div>

          {/* BULK ACTIONS BAR */}
          {selectedRoles.length > 0 && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 mb-6 animate-fade-in border border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <FaCheckDouble className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-900">
                    {selectedRoles.length} role(s) selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkRestore}
                    disabled={isBulkProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <FaTrashRestore size={14} />
                    Restore All
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkProcessing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <FaTrash size={14} />
                    Delete All
                  </button>
                  <button
                    onClick={() => setSelectedRoles([])}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FILTERS PANEL */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filter Roles</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <FaTimes size={12} />
                  Reset all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search by name, slug, description..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Min Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Level</label>
                  <input
                    type="number"
                    value={filters.minLevel}
                    onChange={(e) => handleFilterChange('minLevel', e.target.value)}
                    placeholder="Min level (1-100)"
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Max Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Level</label>
                  <input
                    type="number"
                    value={filters.maxLevel}
                    onChange={(e) => handleFilterChange('maxLevel', e.target.value)}
                    placeholder="Max level (1-100)"
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TABLE CARD */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-linear-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRoles.length === sortedRoles.filter(role => !role.deleted_at).length && sortedRoles.filter(role => !role.deleted_at).length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={sortedRoles.filter(role => !role.deleted_at).length === 0}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Users & Permissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedRoles.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaShieldAlt className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No roles found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {hasActiveFilters() ? 'Try adjusting your filters.' : 'Get started by creating a new role.'}
                        </p>
                        {hasActiveFilters() && (
                          <div className="mt-6">
                            <button
                              onClick={resetFilters}
                              className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                            >
                              <FaTimes className="mr-2" size={16} />
                              Clear Filters
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}

                  {sortedRoles.map((role, index) => {
                    const trashed = role.deleted_at !== null;
                    const isDefault = role.is_default;

                    return (
                      <tr
                        key={role.id}
                        className={`hover:bg-gray-50 transition-all duration-200 animate-fade-in ${trashed ? 'bg-gray-50 opacity-75' : ''} ${selectedRoles.includes(role.id) ? 'bg-blue-50' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-4 py-4">
                          {!trashed && !isDefault && (
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.id)}
                              onChange={() => handleSelectRole(role.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                        </td>

                        {/* ROLE DETAILS */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${trashed ? 'bg-gray-300' : isDefault ? 'bg-purple-100' : role.is_active ? 'bg-green-100' : 'bg-yellow-100'
                              }`}>
                              <FaShieldAlt className={
                                trashed ? 'text-gray-500' : isDefault ? 'text-purple-600' : role.is_active ? 'text-green-600' : 'text-yellow-600'
                              } size={18} />
                            </div>
                            <div>
                              <div className={`font-semibold ${trashed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {role.name}
                                {isDefault && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className={`text-sm mt-0.5 ${trashed ? 'text-gray-400' : 'text-gray-500'}`}>
                                Slug: {role.slug}
                              </div>
                              {role.description && (
                                <div className={`text-xs mt-1 ${trashed ? 'text-gray-400' : 'text-gray-400'}`}>
                                  {role.description.length > 60 ? role.description.substring(0, 60) + '...' : role.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* LEVEL */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-bold ${getLevelBadge(role.level)}`}>
                            Level {role.level}
                          </span>
                        </td>

                        {/* USERS & PERMISSIONS */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FaUsers className="text-gray-400" size={14} />
                              <span className={`text-sm font-medium ${trashed ? 'text-gray-400' : 'text-gray-700'}`}>
                                {role.user_count || 0} user(s)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaKey className="text-gray-400" size={14} />
                              <span className={`text-sm ${trashed ? 'text-gray-400' : 'text-gray-500'}`}>
                                {role.permission_count || 0} permission(s)
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* CREATED */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatDate(role.created_at)}</div>
                          {role.creator && (
                            <div className="text-xs text-gray-500 mt-1">
                              by {role.creator.name}
                            </div>
                          )}
                          {trashed && (
                            <div className="text-xs text-red-500 mt-1">
                              Deleted: {formatDate(role.deleted_at)}
                            </div>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4">
                          {!trashed ? (
                            <button
                              onClick={() => handleToggleStatus(role)}
                              disabled={togglingId === role.id || isDefault}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 ${role.is_active
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                                } ${(togglingId === role.id || isDefault) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {togglingId === role.id ? (
                                <FaSpinner className="animate-spin" size={12} />
                              ) : role.is_active ? (
                                <FaToggleOn size={14} />
                              ) : (
                                <FaToggleOff size={14} />
                              )}
                              {role.is_active ? 'Active' : 'Inactive'}
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">
                              Deleted
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <a
                              href={route('backend.roles.show', role.id)}
                              className={`p-2 rounded-lg transition-all duration-200 ${trashed
                                  ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                              title="View Details"
                            >
                              <FaEye size={18} />
                            </a>

                            {!trashed && (
                              <a
                                href={route('backend.roles.edit', role.id)}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Edit"
                              >
                                <FaEdit size={18} />
                              </a>
                            )}

                            {!trashed && !isDefault && (
                              <button
                                onClick={() => handleClone(role.id, role.name)}
                                disabled={cloningId === role.id}
                                className={`p-2 text-teal-600 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition-all duration-200 ${cloningId === role.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Clone"
                              >
                                {cloningId === role.id ? (
                                  <FaSpinner className="animate-spin" size={18} />
                                ) : (
                                  <FaCopy size={18} />
                                )}
                              </button>
                            )}

                            {trashed && (
                              <button
                                onClick={() => handleRestore(role.id, role.name)}
                                disabled={restoringId === role.id}
                                className={`p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 ${restoringId === role.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Restore"
                              >
                                {restoringId === role.id ? (
                                  <FaSpinner className="animate-spin" size={18} />
                                ) : (
                                  <FaTrashRestore size={18} />
                                )}
                              </button>
                            )}

                            {!trashed && !isDefault && (
                              <button
                                onClick={() => handleDelete(role.id, role.name)}
                                disabled={deletingId === role.id}
                                className={`p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 ${deletingId === role.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Delete"
                              >
                                {deletingId === role.id ? (
                                  <FaSpinner className="animate-spin" size={18} />
                                ) : (
                                  <FaTrash size={18} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <Pagination />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </AuthenticatedLayout>
  );
}