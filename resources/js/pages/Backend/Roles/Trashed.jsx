// resources/js/pages/Backend/Roles/Trashed.jsx

import { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

// Icons
import {
  FaArrowLeft,
  FaTrash,
  FaSpinner,
  FaEye,
  FaShieldAlt,
  FaTrashRestore,
  FaFilter,
  FaSearch,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaCheckDouble,
  FaChevronLeft,
  FaChevronRight,
  FaDatabase,
  FaUser,
  FaClock,
  FaUndo,
} from 'react-icons/fa';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// SweetAlert2
import Swal from 'sweetalert2';

export default function RolesTrashed({ roles: initialRoles, filters: initialFilters = {}, stats: initialStats = {} }) {
  const { flash } = usePage().props;

  // States
  const [restoringId, setRestoringId] = useState(null);
  const [forceDeletingId, setForceDeletingId] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Pagination state
  const [roles, setRoles] = useState(initialRoles);
  const [currentPage, setCurrentPage] = useState(initialRoles?.current_page || 1);
  const [stats, setStats] = useState(initialStats);

  // Filter states
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    sortBy: initialFilters.sort_by || 'deleted_at',
    sortDir: initialFilters.sort_dir || 'desc',
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

  // Apply filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get(route('backend.roles.trashed'), {
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

    router.get(route('backend.roles.trashed'), {
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

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      sortBy: 'deleted_at',
      sortDir: 'desc',
    });
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return filters.search !== '';
  };

  // Sort roles
  const sortedRoles = useMemo(() => {
    let sorted = [...roleItems];

    if (filters.sortBy === 'name') {
      sorted.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return filters.sortDir === 'asc' ? comparison : -comparison;
      });
    } else if (filters.sortBy === 'level') {
      sorted.sort((a, b) => {
        const comparison = (a.level || 999) - (b.level || 999);
        return filters.sortDir === 'asc' ? comparison : -comparison;
      });
    } else if (filters.sortBy === 'deleted_at') {
      sorted.sort((a, b) => {
        const comparison = new Date(a.deleted_at) - new Date(b.deleted_at);
        return filters.sortDir === 'asc' ? comparison : -comparison;
      });
    }

    return sorted;
  }, [roleItems, filters.sortBy, filters.sortDir]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedRoles.length === sortedRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(sortedRoles.map(role => role.id));
    }
  };

  const handleSelectRole = (roleId) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
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

  // Bulk force delete (permanent delete)
  const handleBulkForceDelete = () => {
    if (selectedRoles.length === 0) {
      Swal.fire('No Selection', 'Please select at least one role.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Permanently Delete Roles',
      html: `<p class="text-gray-600">Are you sure you want to permanently delete ${selectedRoles.length} role(s)?</p>
             <p class="text-sm text-red-600 mt-2">This action cannot be undone!</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete permanently',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.roles.bulk-force-delete'), {
          role_ids: selectedRoles
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `${selectedRoles.length} role(s) have been permanently deleted.`,
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

  // Single role actions
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

  const handleForceDelete = (id, name) => {
    Swal.fire({
      title: 'Permanently Delete?',
      html: `<p>Are you sure you want to permanently delete "${name}"?</p>
             <p class="text-sm text-red-600 mt-2">This action cannot be undone!</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete permanently',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setForceDeletingId(id);

        router.delete(route('backend.roles.force-delete', id), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Role has been permanently deleted.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: errors?.message || 'Failed to delete role permanently.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setForceDeletingId(null),
        });
      }
    });
  };

  // Helper functions
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
          <span className="font-medium">{pagination.total}</span> deleted roles
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

  return (
    <AuthenticatedLayout>
      <Head title="Trashed Roles" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
        <div className="mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={route('backend.roles.index')}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <FaArrowLeft size={14} />
                  <span className="text-sm">Back to Roles</span>
                </Link>
              </div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Trashed Roles
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage soft-deleted roles
              </p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Deleted: {stats?.total_deleted || 0}
                </span>
                {hasActiveFilters() && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Filtered
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
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
                    1
                  </span>
                )}
                {showFilters ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* BULK ACTIONS BAR */}
          {selectedRoles.length > 0 && (
            <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-xl shadow-lg p-4 mb-6 animate-fade-in border border-amber-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <FaCheckDouble className="text-amber-600" size={20} />
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
                    onClick={handleBulkForceDelete}
                    disabled={isBulkProcessing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <FaTrash size={14} />
                    Delete Permanently
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
                <h3 className="text-lg font-semibold text-gray-900">Filter Trashed Roles</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <FaTimes size={12} />
                  Reset all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search by name, slug..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="deleted_at">Deleted Date</option>
                    <option value="name">Role Name</option>
                    <option value="level">Access Level</option>
                  </select>
                </div>

                {/* Sort Direction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort Direction</label>
                  <select
                    value={filters.sortDir}
                    onChange={(e) => handleFilterChange('sortDir', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
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
                        checked={selectedRoles.length === sortedRoles.length && sortedRoles.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={sortedRoles.length === 0}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Deleted Info
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedRoles.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaTrash className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No trashed roles found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {hasActiveFilters() ? 'Try adjusting your filters.' : 'Deleted roles will appear here.'}
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

                  {sortedRoles.map((role, index) => (
                    <tr
                      key={role.id}
                      className={`hover:bg-gray-50 transition-all duration-200 animate-fade-in ${selectedRoles.includes(role.id) ? 'bg-amber-50' : ''}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={() => handleSelectRole(role.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>

                      {/* ROLE DETAILS */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                            <FaShieldAlt className="text-gray-500" size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 line-through">
                              {role.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Slug: {role.slug}
                            </div>
                            {role.description && (
                              <div className="text-xs text-gray-400 mt-1">
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

                      {/* DELETED INFO */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <FaClock className="text-red-400" size={14} />
                          <span className="text-sm text-gray-700">
                            {formatDate(role.deleted_at)}
                          </span>
                        </div>
                        {role.deleted_by && (
                          <div className="flex items-center gap-2">
                            <FaUser className="text-gray-400" size={12} />
                            <span className="text-xs text-gray-500">
                              Deleted by: {role.deleted_by}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={route('backend.roles.show', role.id)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <FaEye size={18} />
                          </Link>

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

                          <button
                            onClick={() => handleForceDelete(role.id, role.name)}
                            disabled={forceDeletingId === role.id}
                            className={`p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 ${forceDeletingId === role.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            title="Permanently Delete"
                          >
                            {forceDeletingId === role.id ? (
                              <FaSpinner className="animate-spin" size={18} />
                            ) : (
                              <FaTrash size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <Pagination />
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <FaUndo className="text-blue-600" size={14} />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">About Trashed Roles</p>
                <p className="text-xs text-blue-600 mt-1">
                  Roles in trash can be restored at any time. Permanently deleted roles cannot be recovered.
                  Default roles cannot be deleted or permanently removed.
                </p>
              </div>
            </div>
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