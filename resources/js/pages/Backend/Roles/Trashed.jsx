// resources/js/pages/Backend/Roles/Trashed.jsx

import { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { useAuth } from '../../../hooks/useAuth';
import { Can } from '../../../components/Auth/Can';
import Swal from 'sweetalert2';
import {
  FaArrowLeft, FaTrash, FaSpinner, FaEye, FaShieldAlt, FaTrashRestore,
  FaFilter, FaSearch, FaTimes, FaChevronDown, FaChevronUp,
  FaCheckDouble, FaChevronLeft, FaChevronRight, FaUser, FaClock, FaUndo, FaLock,
} from 'react-icons/fa';

// Local components
import FilterTags from './Components/FilterTags';
import StatCard from './Components/StatCard';

export default function RolesTrashed({ roles: initialRoles, filters: initialFilters = {}, stats: initialStats = {} }) {
  const { flash } = usePage().props;
  const { user: currentUser, hasAnyPermission, hasRole } = useAuth();

  const isSuperAdmin = hasRole('super-admin');
  const canViewRoles = hasAnyPermission(['roles.view', 'roles.manage']);
  const canRestoreRoles = hasAnyPermission(['roles.restore', 'roles.manage']);
  const canForceDeleteRoles = hasAnyPermission(['roles.force_delete', 'roles.manage']);
  const canBulkRestoreRoles = hasAnyPermission(['roles.bulk_restore', 'roles.manage']);
  const canBulkForceDeleteRoles = hasAnyPermission(['roles.bulk_force_delete', 'roles.manage']);

  // State
  const [restoringId, setRestoringId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [forceDeletingId, setForceDeletingId] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [roles, setRoles] = useState(initialRoles);
  const [stats, setStats] = useState(initialStats);

  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    sortBy: initialFilters.sort_by || 'deleted_at',
    sortDir: initialFilters.sort_dir || 'desc',
  });
  
  // Data helpers
  const roleItems = useMemo(() => {
    if (Array.isArray(roles)) return roles;
    if (roles?.data) return roles.data;
    return [];
  }, [roles]);

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
    const sorted = [...roleItems];
    if (filters.sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'level') {
      sorted.sort((a, b) => (a.level || 999) - (b.level || 999));
    } else if (filters.sortBy === 'deleted_at') {
      sorted.sort((a, b) => new Date(a.deleted_at) - new Date(b.deleted_at));
    }
    if (filters.sortDir === 'desc') sorted.reverse();
    return sorted;
  }, [roleItems, filters.sortBy, filters.sortDir]);

  // Fetch data on filter change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      router.get(route('backend.roles.trashed'), { ...filters, page: 1 }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onSuccess: (page) => {
          setRoles(page.props.roles);
          setStats(page.props.stats);
        },
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Sync with props
  useEffect(() => {
    setRoles(initialRoles);
    setStats(initialStats);
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

  // Permission check – if no view permission, show modal and redirect
  if (!canViewRoles) {
    Swal.fire({
      icon: 'error',
      title: 'Access Denied',
      text: 'You do not have permission to view trashed roles.',
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Go Back',
      allowOutsideClick: false,
    }).then(() => {
      router.visit(route('backend.roles.index'));
    });
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-gray-400" />
            <p className="mt-4 text-gray-500">Redirecting...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Determine if a specific role can be restored/forced
  const canRestoreSpecificRole = (role) => {
    if (!canRestoreRoles) return false;
    if (isSuperAdmin) return true;
    if (role.level >= (currentUser?.highest_role_level || 100)) return false;
    return !role.is_default;
  };

  const canForceDeleteSpecificRole = (role) => {
    if (!canForceDeleteRoles) return false;
    if (isSuperAdmin) return true;
    if (role.level >= (currentUser?.highest_role_level || 100)) return false;
    return !role.is_default;
  };

  // Handlers
  const handlePageChange = (page) => {
    if (page === pagination?.currentPage) return;
    if (page < 1 || page > pagination?.lastPage) return;
    router.get(route('backend.roles.trashed'), { ...filters, page }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setRoles(page.props.roles);
        setStats(page.props.stats);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const resetFilters = () => setFilters({ search: '', sortBy: 'deleted_at', sortDir: 'desc' });
  const hasActiveFilters = () => filters.search !== '';

  // Selection
  const handleSelectAll = () => {
    const selectable = sortedRoles.filter(r => canRestoreSpecificRole(r));
    if (selectedRoles.length === selectable.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(selectable.map(r => r.id));
    }
  };

  const handleSelectRole = (id) => {
    setSelectedRoles(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
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
    const protectedSelected = selectedRoles.filter(id => {
      const role = sortedRoles.find(r => r.id === id);
      return !canRestoreSpecificRole(role);
    });
    if (protectedSelected.length > 0) {
      Swal.fire('Protected Roles', `${protectedSelected.length} selected role(s) cannot be restored.`, 'error');
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

  // Bulk Force Delete
  const handleBulkForceDelete = () => {
    if (!canBulkForceDeleteRoles) {
      Swal.fire('Permission Denied', 'You cannot permanently delete roles.', 'error');
      return;
    }
    if (selectedRoles.length === 0) {
      Swal.fire('No Selection', 'Please select at least one role.', 'warning');
      return;
    }
    const protectedSelected = selectedRoles.filter(id => {
      const role = sortedRoles.find(r => r.id === id);
      return !canForceDeleteSpecificRole(role);
    });
    if (protectedSelected.length > 0) {
      Swal.fire('Protected Roles', `${protectedSelected.length} selected role(s) cannot be permanently deleted.`, 'error');
      return;
    }
    Swal.fire({
      title: 'Permanently Delete Roles',
      html: `<p class="text-gray-600">Are you sure you want to permanently delete ${selectedRoles.length} role(s)?</p><p class="text-sm text-red-600 mt-2">This action cannot be undone!</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete permanently',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);
        router.post(route('backend.roles.bulk-force-delete'), { role_ids: selectedRoles }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
            setSelectedRoles([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({ icon: 'error', title: 'Failed', text: error?.message || 'Failed to delete roles.' });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Single role restore
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
          onSuccess: () => {
            Swal.fire({ icon: 'success', title: 'Restored!', timer: 1500, showConfirmButton: false });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({ icon: 'error', title: 'Restore Failed', text: errors?.message || 'Failed to restore role.' });
          },
          onFinish: () => setRestoringId(null),
        });
      }
    });
  };

  // Single force delete
  const handleForceDelete = (id, name) => {
    if (!canForceDeleteRoles) {
      Swal.fire('Permission Denied', 'You cannot permanently delete roles.', 'error');
      return;
    }
    Swal.fire({
      title: 'Permanently Delete?',
      html: `<p>Are you sure you want to permanently delete "${name}"?</p><p class="text-sm text-red-600 mt-2">This action cannot be undone!</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete permanently',
    }).then((result) => {
      if (result.isConfirmed) {
        setForceDeletingId(id);
        router.delete(route('backend.roles.force-delete', id), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({ icon: 'error', title: 'Delete Failed', text: errors?.message || 'Failed to delete role permanently.' });
          },
          onFinish: () => setForceDeletingId(null),
        });
      }
    });
  };

  // Helpers
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
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

  // Pagination component (same as in Index)
  const Pagination = () => {
    if (!pagination || pagination.lastPage <= 1) return null;
    const pages = [];
    let startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.lastPage, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} deleted roles</div>
        <div className="flex items-center gap-1">
          <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>
            <FaChevronLeft size={12} /> Previous
          </button>
          {startPage > 1 && <><button onClick={() => handlePageChange(1)} className="px-3 py-1.5 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300">1</button>{startPage > 2 && <span className="px-2 text-gray-400">...</span>}</>}
          {pages.map(page => (
            <button key={page} onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${page === pagination.currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>
              {page}
            </button>
          ))}
          {endPage < pagination.lastPage && <>{endPage < pagination.lastPage - 1 && <span className="px-2 text-gray-400">...</span>}<button onClick={() => handlePageChange(pagination.lastPage)} className="px-3 py-1.5 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300">{pagination.lastPage}</button></>}
          <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.lastPage}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${pagination.currentPage === pagination.lastPage ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>
            Next <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    );
  };

  // Check if any roles are selectable
  const canRestoreAny = canRestoreRoles && sortedRoles.some(r => canRestoreSpecificRole(r));
  const canForceDeleteAny = canForceDeleteRoles && sortedRoles.some(r => canForceDeleteSpecificRole(r));

  return (
    <AuthenticatedLayout>
      <Head title="Trashed Roles" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href={route('backend.roles.index')} className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <FaArrowLeft size={14} /> <span className="text-sm">Back to Roles</span>
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Trashed Roles</h1>
              <p className="text-sm text-gray-500 mt-1">Manage soft-deleted roles</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="inline-flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-red-500" /> Deleted: {stats?.total_deleted || 0}</span>
                {hasActiveFilters() && <span className="inline-flex items-center gap-1 text-xs text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500" /> Filtered</span>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition ${showFilters || hasActiveFilters() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <FaFilter /> Filters {showFilters ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard icon={FaTrash} label="Deleted Roles" value={stats?.total_deleted || 0} color="red" />
            <StatCard icon={FaTrashRestore} label="Restorable" value={sortedRoles.filter(r => canRestoreSpecificRole(r)).length} color="green" />
            <StatCard icon={FaLock} label="Protected" value={sortedRoles.filter(r => !canForceDeleteSpecificRole(r)).length} color="gray" />
          </div>

          {/* Bulk actions bar */}
          {selectedRoles.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FaCheckDouble className="text-amber-600" size={20} />
                <span className="font-semibold">{selectedRoles.length} role(s) selected</span>
              </div>
              <div className="flex gap-2">
                <Can permission="roles.bulk_restore" fallback={null}>
                  <button onClick={handleBulkRestore} disabled={isBulkProcessing || !canRestoreAny}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 ${canRestoreAny ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-400 text-white cursor-not-allowed'}`}>
                    <FaTrashRestore /> Restore
                  </button>
                </Can>
                <Can permission="roles.bulk_force_delete" fallback={null}>
                  <button onClick={handleBulkForceDelete} disabled={isBulkProcessing || !canForceDeleteAny}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 ${canForceDeleteAny ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-400 text-white cursor-not-allowed'}`}>
                    <FaTrash /> Delete Permanently
                  </button>
                </Can>
                <button onClick={() => setSelectedRoles([])} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Filters panel */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filter Trashed Roles</h3>
                <button onClick={resetFilters} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
                  <FaTimes /> Reset
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Name, slug..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="deleted_at">Deleted Date</option>
                    <option value="name">Role Name</option>
                    <option value="level">Access Level</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Direction</label>
                  <select value={filters.sortDir} onChange={(e) => handleFilterChange('sortDir', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <FilterTags filters={filters} onClear={(key) => setFilters(prev => ({ ...prev, [key]: '' }))} />

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox"
                        checked={selectedRoles.length === sortedRoles.filter(r => canRestoreSpecificRole(r)).length && sortedRoles.filter(r => canRestoreSpecificRole(r)).length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={sortedRoles.filter(r => canRestoreSpecificRole(r)).length === 0} />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deleted Info</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedRoles.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-12">
                        <FaTrash className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-500">No trashed roles found.</p>
                        {hasActiveFilters() && <button onClick={resetFilters} className="text-blue-600 hover:underline mt-2">Clear filters</button>}
                      </td>
                    </tr>
                  )}
                  {sortedRoles.map(role => {
                    const canRestore = canRestoreSpecificRole(role);
                    const canForceDelete = canForceDeleteSpecificRole(role);
                    const isHighLevelRestricted = !isSuperAdmin && role.level >= (currentUser?.highest_role_level || 100);

                    return (
                      <tr key={role.id} className={`hover:bg-gray-50 ${selectedRoles.includes(role.id) ? 'bg-amber-50' : ''}`}>
                        <td className="px-4 py-3">
                          {canRestore && <input type="checkbox" checked={selectedRoles.includes(role.id)} onChange={() => handleSelectRole(role.id)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                              <FaShieldAlt className="text-gray-500" size={18} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 line-through">
                                {role.name}
                                {isHighLevelRestricted && <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full"><FaLock size={10} /> Restricted</span>}
                              </div>
                              <div className="text-sm text-gray-500">Slug: {role.slug}</div>
                              {role.description && <div className="text-xs text-gray-400">{role.description.length > 60 ? `${role.description.substring(0,60)}...` : role.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-bold ${getLevelBadge(role.level)}`}>Level {role.level}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 mb-1"><FaClock className="text-red-400" size={14} /><span className="text-sm text-gray-700">{formatDate(role.deleted_at)}</span></div>
                          {role.deleted_by && <div className="flex items-center gap-2"><FaUser className="text-gray-400" size={12} /><span className="text-xs text-gray-500">Deleted by: {role.deleted_by}</span></div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={route('backend.roles.show', role.id)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><FaEye size={18} /></Link>
                            <Can permission="roles.restore" fallback={null}>
                              <button onClick={() => handleRestore(role.id, role.name)} disabled={restoringId === role.id || !canRestore}
                                className={`p-2 rounded-lg transition-all duration-200 ${canRestore ? 'text-green-600 hover:text-green-900 hover:bg-green-50' : 'text-gray-400 cursor-not-allowed'} ${restoringId === role.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={!canRestore ? 'You don\'t have permission to restore this role' : 'Restore'}>
                                {restoringId === role.id ? <FaSpinner className="animate-spin" size={18} /> : <FaTrashRestore size={18} />}
                              </button>
                            </Can>
                            <Can permission="roles.force_delete" fallback={null}>
                              <button onClick={() => handleForceDelete(role.id, role.name)} disabled={forceDeletingId === role.id || !canForceDelete}
                                className={`p-2 rounded-lg transition-all duration-200 ${canForceDelete ? 'text-red-600 hover:text-red-900 hover:bg-red-50' : 'text-gray-400 cursor-not-allowed'} ${forceDeletingId === role.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={!canForceDelete ? (role.is_default ? 'Default roles cannot be permanently deleted' : 'You don\'t have permission to permanently delete this role') : 'Permanently Delete'}>
                                {forceDeletingId === role.id ? <FaSpinner className="animate-spin" size={18} /> : <FaTrash size={18} />}
                              </button>
                            </Can>
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

          {/* Info box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><FaUndo className="text-blue-600" size={14} /></div>
              <div>
                <p className="text-sm font-medium text-blue-800">About Trashed Roles</p>
                <p className="text-xs text-blue-600 mt-1">Roles in trash can be restored at any time. Permanently deleted roles cannot be recovered. Default roles cannot be deleted or permanently removed. You can only restore or delete roles that have a lower access level than your own.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}