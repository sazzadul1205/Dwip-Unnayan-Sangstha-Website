// resources/js/pages/Backend/Roles/Index.jsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { useAuth } from '../../../hooks/useAuth';
import { Can } from '../../../components/Auth/Can';
import Swal from 'sweetalert2';
import {
  FaPlus, FaEdit, FaTrash, FaSpinner, FaEye, FaShieldAlt,
  FaToggleOn, FaToggleOff, FaUsers, FaKey, FaTrashRestore,
  FaFilter, FaSearch, FaTimes, FaChevronDown, FaChevronUp,
  FaCheckDouble, FaChevronLeft, FaChevronRight, FaCopy, FaDownload, FaLock,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// ============================================================
// Reusable Filter Tags Component
// ============================================================
const FilterTags = ({ filters, onClear }) => {
  const entries = Object.entries(filters).filter(([ value]) => value && value !== 'all' && value !== '');
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {entries.map(([key, value]) => (
        <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {key === 'search' ? `Search: ${value}` : `${key}: ${value}`}
          <button onClick={() => onClear(key)} className="ml-1 hover:text-blue-600">
            <FaTimes size={10} />
          </button>
        </span>
      ))}
    </div>
  );
};

export default function RolesIndex({ roles: initialRoles, filters: initialFilters = {}, stats: initialStats = {} }) {
  const { flash } = usePage().props;
  const { user: currentUser, hasAnyPermission, hasRole } = useAuth();

  // Permissions
  const isSuperAdmin = hasRole('super-admin');
  const canViewRoles = hasAnyPermission(['roles.view', 'roles.manage']);
  const canEditRoles = hasAnyPermission(['roles.update', 'roles.manage']);
  const canCloneRoles = hasAnyPermission(['roles.create', 'roles.manage']);
  const canExportRoles = hasAnyPermission(['roles.export', 'roles.manage']);
  const canToggleStatus = hasAnyPermission(['roles.update', 'roles.manage']);
  const canDeleteRoles = hasAnyPermission(['roles.destroy', 'roles.manage']);
  const canRestoreRoles = hasAnyPermission(['roles.restore', 'roles.manage']);
  const canBulkDeleteRoles = hasAnyPermission(['roles.bulk_delete', 'roles.manage']);
  const canBulkRestoreRoles = hasAnyPermission(['roles.bulk_restore', 'roles.manage']);

  // State
  const [cloningId, setCloningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ✅ FIX: Use roles directly, not users
  const [roles, setRoles] = useState(initialRoles);
  const [stats, setStats] = useState(initialStats);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    status: initialFilters.status || 'all',
    minLevel: initialFilters.min_level || '',
    maxLevel: initialFilters.max_level || '',
    perPage: initialFilters.per_page || 10,
  });

  const NON_EDITABLE_ROLE_SLUGS = useMemo(() => [
    'super-admin', 'admin', 'employer-admin', 'job-seeker', 'employer', 'job_seeker'
  ], []);

  const isRoleProtected = (role) => {
    if (!role) return false;
    if (role.is_default) return true;
    return NON_EDITABLE_ROLE_SLUGS.includes(role.slug);
  };

  const canEditSpecificRole = (role) => {
    if (!canEditRoles) return false;
    if (isSuperAdmin) return true;
    if (role.level >= (currentUser?.highest_role_level || 100)) return false;
    return !isRoleProtected(role);
  };

  const canDeleteSpecificRole = (role) => {
    if (!canDeleteRoles) return false;
    if (isSuperAdmin) return true;
    if (role.level >= (currentUser?.highest_role_level || 100)) return false;
    return !isRoleProtected(role) && !role.is_default;
  };

  // Build query
  const buildQuery = useCallback((page = 1) => {
    const params = { page };
    if (filters.search) params.search = filters.search;
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.minLevel) params.min_level = filters.minLevel;
    if (filters.maxLevel) params.max_level = filters.maxLevel;
    if (filters.perPage) params.per_page = filters.perPage;
    return params;
  }, [filters]);

  // Fetch data
  const fetchData = useCallback((page = 1) => {
    router.get(route('backend.roles.index'), buildQuery(page), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setRoles(page.props.roles);
        setStats(page.props.stats);
        setIsLoading(false);
      },
    });
  }, [buildQuery]);

  // Apply filters (debounced)
  useEffect(() => {
    // Skip the initial render since we already have initialRoles
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const timer = setTimeout(() => fetchData(1), 400);
    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.minLevel, filters.maxLevel, filters.perPage, fetchData, isInitialLoad]);

  // Sync with props
  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles, initialStats]);

  // Flash messages
  useEffect(() => {
    if (flash?.success) {
      Swal.fire({ icon: 'success', title: 'Success!', text: flash.success, timer: 2000, showConfirmButton: false });
    }
    if (flash?.error) {
      Swal.fire({ icon: 'error', title: 'Error!', text: flash.error, confirmButtonColor: '#2563eb' });
    }
  }, [flash]);

  
  // Pagination & roles
  const roleItems = useMemo(() => {
    if (Array.isArray(roles)) return roles;
    if (roles?.data) return roles.data;
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

  const sortedRoles = useMemo(() => {
    return [...roleItems].sort((a, b) => {
      // Show active roles first, then inactive, then deleted
      if (a.deleted_at && !b.deleted_at) return 1;
      if (!a.deleted_at && b.deleted_at) return -1;
      // Then sort by level (highest first)
      return (b.level ?? 0) - (a.level ?? 0);
    });
  }, [roleItems]);

  if (!canViewRoles) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to view roles.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Handlers
  const handlePageChange = (page) => {
    if (page === pagination?.currentPage) return;
    if (page < 1 || page > pagination?.lastPage) return;
    fetchData(page);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ search: '', status: 'all', minLevel: '', maxLevel: '', perPage: 10 });
  };

  const clearFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: '' }));
  };

  const hasActiveFilters = () => {
    return filters.search !== '' || filters.status !== 'all' || filters.minLevel !== '' || filters.maxLevel !== '';
  };

  // Selection
  const handleSelectAll = () => {
    const selectable = sortedRoles.filter(r => !r.deleted_at && canDeleteSpecificRole(r));
    if (selectedRoles.length === selectable.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(selectable.map(r => r.id));
    }
  };

  const handleSelectRole = (id) => {
    setSelectedRoles(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  // Bulk Delete
const handleBulkDelete = () => {
    if (!canBulkDeleteRoles) {
        Swal.fire('Permission Denied', 'You cannot bulk delete roles.', 'error');
        return;
    }
    if (selectedRoles.length === 0) {
        Swal.fire('No Selection', 'Please select at least one role.', 'warning');
        return;
    }
    // Optional: check for protected roles locally (but the server also checks)
    const protectedSelected = selectedRoles.filter(id => {
        const role = sortedRoles.find(r => r.id === id);
        return !canDeleteSpecificRole(role);
    });
    if (protectedSelected.length > 0) {
        Swal.fire('Protected Roles', `${protectedSelected.length} selected role(s) cannot be deleted.`, 'error');
        return;
    }

    Swal.fire({
        title: 'Delete Roles',
        text: `Are you sure you want to delete ${selectedRoles.length} role(s)? They will be moved to trash.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete',
    }).then((result) => {
        if (result.isConfirmed) {
            setIsBulkProcessing(true);
            router.post(route('backend.roles.bulk-delete'), { role_ids: selectedRoles }, {
                preserveScroll: true,
                onSuccess: (page) => {
                    if (page.props.flash?.error) {
                        Swal.fire({ icon: 'error', title: 'Error', text: page.props.flash.error });
                        setSelectedRoles([]);
                        setIsBulkProcessing(false);
                        return;
                    }
                    Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
                    setSelectedRoles([]);
                    setIsBulkProcessing(false);
                    router.reload();
                },
                onError: (errors) => {
                    const msg = errors?.message || 'Failed to delete roles.';
                    Swal.fire({ icon: 'error', title: 'Failed', text: msg });
                    setIsBulkProcessing(false);
                }
            });
        }
    });
};

  // Bulk Restore
  const handleBulkRestore = () => {
    if (!canBulkRestoreRoles) {
      Swal.fire('Permission Denied', 'You cannot bulk restore roles.', 'error');
      return;
    }
    if (selectedRoles.length === 0) {
      Swal.fire('No Selection', 'Please select at least one role.', 'warning');
      return;
    }
    Swal.fire({
      title: 'Restore Roles',
      text: `Restore ${selectedRoles.length} role(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);
        router.post(route('backend.roles.bulk-restore'), { role_ids: selectedRoles }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({ icon: 'success', title: 'Restored!', timer: 1500, showConfirmButton: false });
            setSelectedRoles([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({ icon: 'error', title: 'Failed', text: error?.message || 'Failed to restore roles.' });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Single role actions
const handleDelete = (id, name) => {
    if (!canDeleteRoles) {
        Swal.fire('Permission Denied', 'You cannot delete roles.', 'error');
        return;
    }
    Swal.fire({
        title: 'Delete Role?',
        text: `Move "${name}" to trash?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete',
    }).then((result) => {
        if (result.isConfirmed) {
            setDeletingId(id);
            router.delete(route('backend.roles.destroy', id), {
                preserveScroll: true,
                onSuccess: (page) => {
                    // Check flash error
                    if (page.props.flash?.error) {
                        Swal.fire({ icon: 'error', title: 'Error', text: page.props.flash.error });
                        setDeletingId(null);
                        return;
                    }
                    Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
                    setDeletingId(null);
                    router.reload();
                },
                onError: (errors) => {
                    const msg = errors?.message || 'Failed to delete role.';
                    Swal.fire({ icon: 'error', title: 'Delete Failed', text: msg });
                    setDeletingId(null);
                },
                onFinish: () => setDeletingId(null),
            });
        }
    });
};

const handleRestore = (id, name) => {
    if (!canRestoreRoles) {
        Swal.fire('Permission Denied', 'You cannot restore roles.', 'error');
        return;
    }
    Swal.fire({
        title: 'Restore Role?',
        text: `Restore "${name}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, restore',
    }).then((result) => {
        if (result.isConfirmed) {
            setRestoringId(id);
            router.post(route('backend.roles.restore', id), {}, {
                preserveScroll: true,
                onSuccess: (page) => {
                    if (page.props.flash?.error) {
                        Swal.fire({ icon: 'error', title: 'Error', text: page.props.flash.error });
                        setRestoringId(null);
                        return;
                    }
                    Swal.fire({ icon: 'success', title: 'Restored!', timer: 1500, showConfirmButton: false });
                    setRestoringId(null);
                    router.reload();
                },
                onError: (errors) => {
                    const msg = errors?.message || 'Failed to restore role.';
                    Swal.fire({ icon: 'error', title: 'Restore Failed', text: msg });
                    setRestoringId(null);
                },
                onFinish: () => setRestoringId(null),
            });
        }
    });
};

const handleToggleStatus = (role) => {
    if (!canToggleStatus) {
        Swal.fire('Permission Denied', 'You cannot change role status.', 'error');
        return;
    }
    if (role.is_default) {
        Swal.fire('Cannot Deactivate', 'Default roles cannot be deactivated.', 'info');
        return;
    }
    if (!isSuperAdmin && role.level >= (currentUser?.highest_role_level || 100)) {
        Swal.fire('Permission Denied', 'You cannot modify a role with equal or higher level.', 'error');
        return;
    }

    Swal.fire({
        title: role.is_active ? 'Deactivate Role?' : 'Activate Role?',
        text: `This will ${role.is_active ? 'deactivate' : 'activate'} "${role.name}".`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#d33',
        confirmButtonText: role.is_active ? 'Deactivate' : 'Activate',
    }).then((result) => {
        if (result.isConfirmed) {
            setTogglingId(role.id);
            router.post(route('backend.roles.toggle-status', role.id), {}, {
                preserveScroll: true,
                onSuccess: (page) => {
                    if (page.props.flash?.error) {
                        Swal.fire({ icon: 'error', title: 'Error', text: page.props.flash.error });
                        setTogglingId(null);
                        return;
                    }
                    router.reload();
                    Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
                    setTogglingId(null);
                },
                onError: (errors) => {
                    const msg = errors?.message || 'Failed to update status.';
                    Swal.fire({ icon: 'error', title: 'Failed', text: msg });
                    setTogglingId(null);
                }
            });
        }
    });
};
  const handleClone = (id, name) => {
    if (!canCloneRoles) {
      Swal.fire('Permission Denied', 'You cannot clone roles.', 'error');
      return;
    }
    Swal.fire({
      title: 'Clone Role?',
      text: `Create a copy of "${name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, clone',
    }).then((result) => {
      if (result.isConfirmed) {
        setCloningId(id);
        router.post(route('backend.roles.clone', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({ icon: 'success', title: 'Cloned!', timer: 1500, showConfirmButton: false });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({ icon: 'error', title: 'Clone Failed', text: errors?.message || 'Failed to clone role.' });
          },
          onFinish: () => setCloningId(null),
        });
      }
    });
  };

  const handleExport = () => {
    if (!canExportRoles) {
      Swal.fire('Permission Denied', 'You cannot export roles.', 'error');
      return;
    }
    window.open(route('backend.roles.export', filters), '_blank');
  };

  // Helpers
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getLevelBadge = (level) => {
    if (!level) return 'bg-gray-100 text-gray-600';
    if (level <= 10) return 'bg-red-100 text-red-700';
    if (level <= 30) return 'bg-orange-100 text-orange-700';
    if (level <= 60) return 'bg-yellow-100 text-yellow-700';
    if (level <= 80) return 'bg-blue-100 text-blue-700';
    return 'bg-green-100 text-green-700';
  };

  // Pagination component (unchanged)
  const Pagination = () => {
    if (!pagination || pagination.lastPage <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(pagination.lastPage, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{pagination.from || 0}</span> to{' '}
          <span className="font-medium">{pagination.to || 0}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> results
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>
            <FaChevronLeft size={12} /> Previous
          </button>
          {startPage > 1 && (
            <>
              <button onClick={() => handlePageChange(1)} className="px-3 py-1.5 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition">1</button>
              {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
            </>
          )}
          {pages.map(page => (
            <button key={page} onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${page === pagination.currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>
              {page}
            </button>
          ))}
          {endPage < pagination.lastPage && (
            <>
              {endPage < pagination.lastPage - 1 && <span className="px-2 text-gray-400">...</span>}
              <button onClick={() => handlePageChange(pagination.lastPage)} className="px-3 py-1.5 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition">{pagination.lastPage}</button>
            </>
          )}
          <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.lastPage}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${pagination.currentPage === pagination.lastPage ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>
            Next <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <AuthenticatedLayout>
      <Head title="Roles & Permissions" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
              <p className="text-sm text-gray-500 mt-1">Manage user roles and access control</p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-green-500" /> Active: {activeCount}</span>
                <span className="inline-flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-red-500" /> Inactive: {inactiveCount}</span>
                <span className="inline-flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-gray-400" /> Deleted: {deletedCount}</span>
                <span className="inline-flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-purple-500" /> Default: {defaultCount}</span>
                {hasActiveFilters() && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500" /> Filtered</span>
                )}
                {pagination && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-gray-400" /> Total: {totalCount}</span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Can permission="roles.export" fallback={null}>
                <button onClick={handleExport} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 text-sm transition">
                  <FaDownload /> Export
                </button>
              </Can>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition ${showFilters || hasActiveFilters() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <FaFilter /> Filters {showFilters ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <Can permission="roles.create" fallback={null}>
                <a href={route('backend.roles.create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition">
                  <FaPlus /> Create Role
                </a>
              </Can>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={FaShieldAlt} label="Total Roles" value={stats?.total || 0} color="blue" />
            <StatCard icon={FaUsers} label="Active" value={stats?.active || 0} color="green" />
            <StatCard icon={FaTrash} label="Inactive" value={stats?.inactive || 0} color="red" />
            <StatCard icon={FaTrashRestore} label="Trashed" value={stats?.total_deleted || 0} color="gray" />
          </div>

          {/* Bulk actions bar */}
          {selectedRoles.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FaCheckDouble className="text-blue-600" size={20} />
                <span className="font-semibold">{selectedRoles.length} role(s) selected</span>
              </div>
              <div className="flex gap-2">
                <Can permission="roles.bulk_restore" fallback={null}>
                  <button onClick={handleBulkRestore} disabled={isBulkProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                    <FaTrashRestore /> Restore
                  </button>
                </Can>
                <Can permission="roles.bulk_delete" fallback={null}>
                  <button onClick={handleBulkDelete} disabled={isBulkProcessing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                    <FaTrash /> Delete
                  </button>
                </Can>
                <button onClick={() => setSelectedRoles([])} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Filters panel */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filter Roles</h3>
                <button onClick={resetFilters} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
                  <FaTimes /> Reset
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Name, slug..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Level</label>
                  <input type="number" value={filters.minLevel} onChange={(e) => handleFilterChange('minLevel', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="1" min="1" max="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Level</label>
                  <input type="number" value={filters.maxLevel} onChange={(e) => handleFilterChange('maxLevel', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="100" min="1" max="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
                  <select value={filters.perPage} onChange={(e) => handleFilterChange('perPage', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <FilterTags filters={filters} onClear={clearFilter} />

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox"
                        checked={selectedRoles.length === sortedRoles.filter(r => !r.deleted_at && canDeleteSpecificRole(r)).length && sortedRoles.filter(r => !r.deleted_at && canDeleteSpecificRole(r)).length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={sortedRoles.filter(r => !r.deleted_at && canDeleteSpecificRole(r)).length === 0} />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users / Permissions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedRoles.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-12">
                        <FaShieldAlt className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-500">No roles found.</p>
                        {hasActiveFilters() && <button onClick={resetFilters} className="text-blue-600 hover:underline mt-2">Clear filters</button>}
                      </td>
                    </tr>
                  )}
                  {sortedRoles.map((role, index) => {
                    const trashed = role.deleted_at !== null;
                    const isDefault = role.is_default;
                    const canEdit = canEditSpecificRole(role);
                    const canDelete = canDeleteSpecificRole(role);
                    const canToggle = canToggleStatus && !isDefault && (isSuperAdmin || role.level < (currentUser?.highest_role_level || 100));
                    const isPermanent = ['super-admin', 'admin', 'employer', 'employer-admin'].includes(role.slug);
                    const isHighLevelRestricted = !isSuperAdmin && role.level >= (currentUser?.highest_role_level || 100);

                    // ✅ FIX: Don't show deleted roles with strikethrough if they shouldn't be
                    // Check if the role is actually soft-deleted (has deleted_at)
                    const isActuallyDeleted = role.deleted_at !== null && role.deleted_at !== undefined;
                    return (
                      <tr key={role.id} className={`hover:bg-gray-50 transition-all duration-200 animate-fade-in ${trashed ? 'bg-gray-50 opacity-75' : ''} ${selectedRoles.includes(role.id) ? 'bg-blue-50' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-4 py-4">
                          {!trashed && canDelete && (
                            <input type="checkbox" checked={selectedRoles.includes(role.id)} onChange={() => handleSelectRole(role.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${trashed ? 'bg-gray-300' : showDefaultBadge ? 'bg-purple-100' : isPermanentRole ? 'bg-red-100' : role.is_active ? 'bg-green-100' : 'bg-yellow-100'}`}>
                              <FaShieldAlt className={trashed ? 'text-gray-500' : showDefaultBadge ? 'text-purple-600' : isPermanentRole ? 'text-red-600' : role.is_active ? 'text-green-600' : 'text-yellow-600'} size={18} />
                            </div>
                            <div>
                              <div className={`font-semibold ${trashed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {role.name}
                                {showDefaultBadge && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Default</span>}
                                {isPermanentRole && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Permanent</span>}
                                {isHighLevel && !trashed && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700"><FaLock size={10} className="mr-1" /> Restricted</span>}
                              </div>
                              <div className={`text-sm mt-0.5 ${trashed ? 'text-gray-400' : 'text-gray-500'}`}>Slug: {role.slug}</div>
                              {role.description && <div className={`text-xs mt-1 ${trashed ? 'text-gray-400' : 'text-gray-400'}`}>{role.description.length > 60 ? `${role.description.substring(0, 60)}...` : role.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-bold ${getLevelBadge(role.level)}`}>Level {role.level}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2"><FaUsers className="text-gray-400" size={14} /><span className={`text-sm font-medium ${isActuallyDeleted ? 'text-gray-400' : 'text-gray-700'}`}>{role.user_count || 0} user(s)</span></div>
                            <div className="flex items-center gap-2"><FaKey className="text-gray-400" size={14} /><span className={`text-sm ${isActuallyDeleted ? 'text-gray-400' : 'text-gray-500'}`}>{role.permission_count || 0} permission(s)</span></div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{formatDate(role.created_at)}</div>
                          {role.creator && <div className="text-xs text-gray-500 mt-1">by {role.creator.name}</div>}
                          {isActuallyDeleted && <div className="text-xs text-red-500 mt-1">Deleted: {formatDate(role.deleted_at)}</div>}
                        </td>
                        <td className="px-6 py-4">
                          {!trashed ? (
                            <button onClick={() => handleToggleStatus(role)} disabled={togglingId === role.id || !canToggle}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${role.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'} ${(togglingId === role.id || !canToggle) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={!canToggle ? (isDefault ? 'Default roles cannot be toggled' : 'Insufficient permission') : ''}>
                              {togglingId === role.id ? <FaSpinner className="animate-spin" size={12} /> : role.is_active ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />}
                              {role.is_active ? 'Active' : 'Inactive'}
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">Deleted</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <a href={route('backend.roles.show', role.id)} className={`p-2 rounded-lg transition-all duration-200 ${trashed ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} title="View Details"><FaEye size={18} /></a>
                            {!trashed && canEdit && <a href={route('backend.roles.edit', role.id)} className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200" title="Edit"><FaEdit size={18} /></a>}
                            {!trashed && canCloneRoles && <button onClick={() => handleClone(role.id, role.name)} disabled={cloningId === role.id} className={`p-2 text-teal-600 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition-all duration-200 ${cloningId === role.id ? 'opacity-50 cursor-not-allowed' : ''}`} title="Clone">{cloningId === role.id ? <FaSpinner className="animate-spin" size={18} /> : <FaCopy size={18} />}</button>}
                            {trashed && canRestoreRoles && <button onClick={() => handleRestore(role.id, role.name)} disabled={restoringId === role.id} className={`p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 ${restoringId === role.id ? 'opacity-50 cursor-not-allowed' : ''}`} title="Restore">{restoringId === role.id ? <FaSpinner className="animate-spin" size={18} /> : <FaTrashRestore size={18} />}</button>}
                            {!trashed && canDelete && <button onClick={() => handleDelete(role.id, role.name)} disabled={deletingId === role.id} className={`p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 ${deletingId === role.id ? 'opacity-50 cursor-not-allowed' : ''}`} title="Delete">{deletingId === role.id ? <FaSpinner className="animate-spin" size={18} /> : <FaTrash size={18} />}</button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}