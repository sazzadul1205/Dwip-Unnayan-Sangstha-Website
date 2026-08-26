// resources/js/pages/Backend/Users/Index.jsx

import { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

// Icons
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaUsers,
  FaTimes,
  FaUndo,
  FaFilter,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaCheckDouble,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaEnvelope,
  FaUserTag,
  FaEnvelopeOpen,
  FaShieldAlt,
} from 'react-icons/fa';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Components
import UserModal from './Modals/UserModal';

// Auth
import { useAuth } from '../../../hooks/useAuth';
import { Can } from '../../../components/Auth/Can';

// SweetAlert2
import Swal from 'sweetalert2';

export default function UsersIndex({ users: initialUsers, filters: initialFilters = {}, roles }) {
  // Check if there are any users with flash messages
  const { flash } = usePage().props;

  // Use centralized auth hook
  const {
    user: currentUser,
    hasAnyPermission,
  } = useAuth();

  // Permission helper functions using the centralized hook
  const canViewUsers = hasAnyPermission(['users.view', 'users.manage']);
  const canEditUser = hasAnyPermission(['users.update', 'users.manage']);
  const canCreateUser = hasAnyPermission(['users.create', 'users.manage']);
  const canVerifyUser = hasAnyPermission(['users.verify', 'users.manage']);
  const canDeleteUser = hasAnyPermission(['users.destroy', 'users.manage']);
  const canRestoreUser = hasAnyPermission(['users.restore', 'users.manage']);
  const canBulkDeleteUser = hasAnyPermission(['users.bulk_delete', 'users.manage']);
  const canBulkRestoreUser = hasAnyPermission(['users.bulk_restore', 'users.manage']);
  const canForceDeleteUser = hasAnyPermission(['users.force_delete', 'users.manage']);

  // States
  const [deletingId, setDeletingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [forceDeletingId, setForceDeletingId] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Pagination state
  const [users, setUsers] = useState(initialUsers);

  // Filter states
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    status: initialFilters.status || 'all',
    email_verified: initialFilters.email_verified || 'all',
    role: initialFilters.role || '',
  });

  // Prevent browser caching
  useEffect(() => {
    document.querySelector('meta[name="cache-control"]')?.setAttribute('content', 'no-cache, no-store, must-revalidate');
    document.querySelector('meta[name="pragma"]')?.setAttribute('content', 'no-cache');
    document.querySelector('meta[name="expires"]')?.setAttribute('content', '0');
  }, []);

  // Get users array from paginated response
  const userItems = useMemo(() => {
    if (Array.isArray(users)) return users;
    if (users && Array.isArray(users.data)) return users.data;
    return [];
  }, [users]);

  // Pagination info
  const pagination = useMemo(() => {
    if (users && typeof users === 'object' && 'current_page' in users) {
      return {
        currentPage: users.current_page,
        lastPage: users.last_page,
        perPage: users.per_page,
        total: users.total,
        from: users.from,
        to: users.to,
        links: users.links || [],
      };
    }
    return null;
  }, [users]);

  // Apply filters
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      router.get(route('backend.users.index'), {
        ...filters,
        page: 1,
        _t: Date.now(),
      }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onSuccess: (page) => {
          setUsers(page.props.users);
        },
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [filters.search, filters.status, filters.email_verified, filters.role, isInitialLoad, filters]);

  // Keep local users in sync
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

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

  // If user doesn't have permission to view users, show access denied
  if (!canViewUsers) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">You don't have permission to view users.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Handle page change
  const handlePageChange = (page) => {
    if (page === pagination?.currentPage) return;
    if (page < 1 || page > pagination?.lastPage) return;

    router.get(route('backend.users.index'), {
      ...filters,
      page,
      _t: Date.now(),
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setUsers(page.props.users);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Stats
  const activeCount = userItems.filter(user => !user.deleted_at).length;
  const deletedCount = userItems.filter(user => user.deleted_at).length;
  const verifiedCount = userItems.filter(user => user.is_verified === true).length;
  const unverifiedCount = userItems.filter(user => user.is_verified === false && !user.deleted_at).length;

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      email_verified: 'all',
      role: '',
    });
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return filters.search !== '' || filters.status !== 'all' || filters.email_verified !== 'all' || filters.role !== '';
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    const nonDeletedUsers = userItems.filter(user => !user.deleted_at);
    if (selectedUsers.length === nonDeletedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(nonDeletedUsers.map(user => user.id));
    }
  };

  // Select single user
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (!canBulkDeleteUser) {
      Swal.fire('Permission Denied', 'You do not have permission to delete users.', 'error');
      return;
    }

    if (selectedUsers.length === 0) {
      Swal.fire('No Selection', 'Please select at least one user.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Delete Users',
      text: `Are you sure you want to delete ${selectedUsers.length} user(s)? This will move them to trash.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.users.bulk-delete'), {
          user_ids: selectedUsers
        }, {
          preserveScroll: true,
          onSuccess: (page) => {
            if (page.props.flash?.error) {
              Swal.fire({
                icon: 'error',
                title: 'Cannot Delete',
                text: page.props.flash.error,
                confirmButtonColor: '#2563eb',
              });
            } else {
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: `${selectedUsers.length} user(s) have been moved to trash.`,
                timer: 1500,
                showConfirmButton: false
              });
              setSelectedUsers([]);
              router.reload();
            }
            setIsBulkProcessing(false);
          },
          onError: (error) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete users.';
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: errorMessage,
              confirmButtonColor: '#2563eb',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk restore
  const handleBulkRestore = () => {
    if (!canBulkRestoreUser) {
      Swal.fire('Permission Denied', 'You do not have permission to restore users.', 'error');
      return;
    }

    if (selectedUsers.length === 0) {
      Swal.fire('No Selection', 'Please select at least one user.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Restore Users',
      text: `Are you sure you want to restore ${selectedUsers.length} user(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.users.bulk-restore'), {
          user_ids: selectedUsers
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: `${selectedUsers.length} user(s) have been restored.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedUsers([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to restore users.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Modal handlers
  const handleOpenCreate = () => {
    if (!canCreateUser) {
      Swal.fire('Permission Denied', 'You do not have permission to create users.', 'error');
      return;
    }
    setEditingUser(null);
    setIsModalOpen(true);
  };

  // Modal handlers for edit
  const handleOpenEdit = (user) => {
    if (!canEditUser) {
      Swal.fire('Permission Denied', 'You do not have permission to edit users.', 'error');
      return;
    }
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // Modal Close handlers
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Single user actions
  const handleDelete = (id, name) => {
    if (!canDeleteUser) {
      Swal.fire('Permission Denied', 'You do not have permission to delete users.', 'error');
      return;
    }

    if (id === currentUser?.id) {
      Swal.fire('Cannot Delete', 'You cannot delete your own account.', 'error');
      return;
    }

    Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete "${name}"? This will move them to trash.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setDeletingId(id);

        router.delete(route('backend.users.destroy', id), {
          preserveScroll: true,
          onSuccess: (page) => {
            if (page.props.flash?.error) {
              Swal.fire({
                icon: 'error',
                title: 'Cannot Delete',
                text: page.props.flash.error,
                confirmButtonColor: '#2563eb',
              });
            } else {
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'User has been moved to trash.',
                timer: 1500,
                showConfirmButton: false,
              });
              router.reload();
            }
          },
          onError: (errors) => {
            const errorMessage = errors?.response?.data?.message || errors?.message || 'Failed to delete user.';
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: errorMessage,
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setDeletingId(null),
        });
      }
    });
  };

  // Force delete
  const handleForceDelete = (id, name) => {
    if (!canForceDeleteUser) {
      Swal.fire('Permission Denied', 'You do not have permission to permanently delete users.', 'error');
      return;
    }

    Swal.fire({
      title: 'Permanently Delete User?',
      html: `Are you sure you want to <strong>permanently delete</strong> "${name}"?<br/><br/>This action <strong>cannot be undone</strong> and will remove this user from the database completely.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, permanently delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setForceDeletingId(id);

        router.delete(route('backend.users.force-delete', id), {
          preserveScroll: true,
          onSuccess: (page) => {
            if (page.props.flash?.error) {
              Swal.fire({
                icon: 'error',
                title: 'Cannot Delete',
                text: page.props.flash.error,
                confirmButtonColor: '#2563eb',
              });
            } else {
              Swal.fire({
                icon: 'success',
                title: 'Permanently Deleted!',
                text: `"${name}" has been permanently deleted from the database.`,
                timer: 1500,
                showConfirmButton: false,
              });
              router.reload();
            }
          },
          onError: (errors) => {
            const errorMessage = errors?.response?.data?.message || errors?.message || 'Failed to permanently delete user.';
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: errorMessage,
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setForceDeletingId(null),
        });
      }
    });
  };

  // Restore
  const handleRestore = (id, name) => {
    if (!canRestoreUser) {
      Swal.fire('Permission Denied', 'You do not have permission to restore users.', 'error');
      return;
    }

    Swal.fire({
      title: 'Restore User?',
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

        router.patch(route('backend.users.restore', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: 'User has been restored successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Restore Failed',
              text: errors?.message || 'Failed to restore user.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setRestoringId(null),
        });
      }
    });
  };

  // Verify
  const handleVerify = (id, name) => {
    if (!canVerifyUser) {
      Swal.fire('Permission Denied', 'You do not have permission to verify users.', 'error');
      return;
    }

    Swal.fire({
      title: 'Verify User?',
      text: `Are you sure you want to verify "${name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, verify',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setVerifyingId(id);

        router.post(route('backend.users.verify', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Verified!',
              text: 'User has been verified successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: errors?.message || 'Failed to verify user.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setVerifyingId(null),
        });
      }
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (roleSlug) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      employer: 'bg-blue-100 text-blue-800',
      job_seeker: 'bg-green-100 text-green-800',
      'super-admin': 'bg-purple-100 text-purple-800',
      'hr-manager': 'bg-indigo-100 text-indigo-800',
      recruiter: 'bg-cyan-100 text-cyan-800',
    };
    return colors[roleSlug] || 'bg-gray-100 text-gray-800';
  };

  // Get role display name
  const getRoleDisplayName = (roleSlug) => {
    const role = roles.find(r => r.slug === roleSlug);
    return role?.name || roleSlug || 'User';
  };

  // Pagination component - Responsive
  const Pagination = () => {
    if (!pagination || pagination.lastPage <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(pagination.lastPage, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
          Showing <span className="font-medium">{pagination.from || 0}</span> to{' '}
          <span className="font-medium">{pagination.to || 0}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> results
        </div>

        <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-0.5 sm:gap-1 transition ${pagination.currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            <FaChevronLeft size={10} />
            <span className="hidden xs:inline">Previous</span>
            <span className="xs:hidden">Prev</span>
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition"
              >
                1
              </button>
              {startPage > 2 && <span className="px-1 text-gray-400">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition ${page === pagination.currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
            >
              {page}
            </button>
          ))}

          {endPage < pagination.lastPage && (
            <>
              {endPage < pagination.lastPage - 1 && <span className="px-1 text-gray-400">...</span>}
              <button
                onClick={() => handlePageChange(pagination.lastPage)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition"
              >
                {pagination.lastPage}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.lastPage}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-0.5 sm:gap-1 transition ${pagination.currentPage === pagination.lastPage
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            <span className="hidden xs:inline">Next</span>
            <span className="xs:hidden">Next</span>
            <FaChevronRight size={10} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AuthenticatedLayout>
      <Head title="Users" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
        <div className="mx-auto">
          {/* HEADER - Responsive */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Users
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                Manage system users and their roles
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-3 mt-1.5 sm:mt-2">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
                  Active: {activeCount}
                </span>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
                  Deleted: {deletedCount}
                </span>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                  Verified: {verifiedCount}
                </span>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500" />
                  Unverified: {unverifiedCount}
                </span>
                {hasActiveFilters() && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-blue-600">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                    Filtered
                  </span>
                )}
                {pagination && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
                    Total: {pagination.total}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 text-xs sm:text-sm ${showFilters || hasActiveFilters()
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <FaFilter size={12} />
                Filters
                {hasActiveFilters() && (
                  <span className="ml-0.5 sm:ml-1 bg-white text-blue-600 rounded-full w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs flex items-center justify-center">
                    {Object.values(filters).filter(v => v !== 'all' && v !== '').length}
                  </span>
                )}
                {showFilters ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>

              <Can permission="users.create" fallback={null}>
                <button
                  onClick={handleOpenCreate}
                  className="flex-1 sm:flex-none bg-linear-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-xs sm:text-sm"
                >
                  <FaPlus size={14} />
                  Add User
                </button>
              </Can>
            </div>
          </div>

          {/* BULK ACTIONS BAR - Responsive */}
          {selectedUsers.length > 0 && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 animate-fade-in border border-blue-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FaCheckDouble className="text-blue-600" size={16} />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {selectedUsers.length} user(s) selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <Can permission="users.bulk_restore" fallback={null}>
                    <button
                      onClick={handleBulkRestore}
                      disabled={isBulkProcessing}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <FaUndo size={12} />
                      Restore
                    </button>
                  </Can>
                  <Can permission="users.bulk_delete" fallback={null}>
                    <button
                      onClick={handleBulkDelete}
                      disabled={isBulkProcessing}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <FaTrash size={12} />
                      Delete
                    </button>
                  </Can>
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 text-xs sm:text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FILTERS PANEL - Responsive */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filter Users</h3>
                <button
                  onClick={resetFilters}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <FaTimes size={10} />
                  Reset all
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Verification</label>
                  <select
                    value={filters.email_verified}
                    onChange={(e) => handleFilterChange('email_verified', e.target.value)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Role</label>
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.slug}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TABLE CARD - Responsive */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-linear-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === userItems.filter(user => !user.deleted_at).length && userItems.filter(user => !user.deleted_at).length > 0}
                        onChange={handleSelectAll}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={userItems.filter(user => !user.deleted_at).length === 0}
                      />
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {userItems.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 sm:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <FaUsers className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">No users found</h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">
                          {hasActiveFilters() ? 'Try adjusting your filters.' : 'Get started by adding a new user.'}
                        </p>
                        {hasActiveFilters() && (
                          <div className="mt-4 sm:mt-6">
                            <button
                              onClick={resetFilters}
                              className="inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                            >
                              <FaTimes className="mr-1.5 sm:mr-2" size={14} />
                              Clear Filters
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}

                  {userItems.map((user, index) => {
                    const trashed = user.deleted_at !== null;
                    const userRole = user.roles?.[0]?.slug || '';
                    const isVerified = user.is_verified === true;
                    const isCurrentUser = user.id === currentUser?.id;

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-gray-50 transition-all duration-200 animate-fade-in ${trashed ? 'bg-gray-50 opacity-75' : ''} ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          {!trashed && canDeleteUser && !isCurrentUser && (
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                        </td>

                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${trashed ? 'bg-gray-300' : 'bg-blue-100'}`}>
                              <FaUsers className={trashed ? 'text-gray-500' : 'text-blue-600'} size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className={`text-sm sm:text-base font-semibold truncate ${trashed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {user.name}
                                {isCurrentUser && (
                                  <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-full">You</span>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5">
                                <FaEnvelope className="text-gray-400 text-[10px] sm:text-xs" />
                                <span className={`text-[10px] sm:text-xs truncate ${trashed ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {user.email}
                                </span>
                              </div>
                              {!trashed && (
                                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                                  ID: #{user.id}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          {!trashed && userRole ? (
                            <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
                              <FaUserTag size={8} />
                              {getRoleDisplayName(userRole)}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs sm:text-sm">-</span>
                          )}
                        </td>

                        <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          {!trashed ? (
                            isVerified ? (
                              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-800">
                                <FaCheckCircle size={8} />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-yellow-100 text-yellow-800">
                                <FaEnvelopeOpen size={8} />
                                Unverified
                              </span>
                            )
                          ) : (
                            <span className="text-gray-400 text-xs sm:text-sm">-</span>
                          )}
                        </td>

                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {!trashed ? (
                            <span className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-0.5 sm:gap-1 w-fit">
                              <FaCheckCircle size={10} />
                              <span className="hidden xs:inline">Active</span>
                            </span>
                          ) : (
                            <span className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-gray-200 text-gray-500 flex items-center gap-0.5 sm:gap-1 w-fit">
                              <FaTrash size={10} />
                              <span className="hidden xs:inline">Deleted</span>
                            </span>
                          )}
                          {trashed && user.deleted_at && (
                            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                              {new Date(user.deleted_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1 sm:gap-2 flex-wrap">
                            {!trashed && (
                              <>
                                <Can permission="users.update">
                                  <button
                                    onClick={() => handleOpenEdit(user)}
                                    className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    title="Edit User"
                                  >
                                    <FaEdit size={14} />
                                  </button>
                                </Can>

                                {!isVerified && (
                                  <Can permission="users.verify">
                                    <button
                                      onClick={() => handleVerify(user.id, user.name)}
                                      disabled={verifyingId === user.id}
                                      className={`p-1.5 sm:p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 ${verifyingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title="Verify User"
                                    >
                                      {verifyingId === user.id ? (
                                        <FaSpinner className="animate-spin" size={14} />
                                      ) : (
                                        <FaEnvelopeOpen size={14} />
                                      )}
                                    </button>
                                  </Can>
                                )}

                                {!isCurrentUser && (
                                  <Can permission="users.destroy">
                                    <button
                                      onClick={() => handleDelete(user.id, user.name)}
                                      disabled={deletingId === user.id}
                                      className={`p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 ${deletingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title="Delete User"
                                    >
                                      {deletingId === user.id ? (
                                        <FaSpinner className="animate-spin" size={14} />
                                      ) : (
                                        <FaTrash size={14} />
                                      )}
                                    </button>
                                  </Can>
                                )}
                              </>
                            )}

                            {trashed && (
                              <>
                                <Can permission="users.restore">
                                  <button
                                    onClick={() => handleRestore(user.id, user.name)}
                                    disabled={restoringId === user.id}
                                    className={`p-1.5 sm:p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 ${restoringId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Restore User"
                                  >
                                    {restoringId === user.id ? (
                                      <FaSpinner className="animate-spin" size={14} />
                                    ) : (
                                      <FaUndo size={14} />
                                    )}
                                  </button>
                                </Can>
                                <Can permission="users.force_delete">
                                  <button
                                    onClick={() => handleForceDelete(user.id, user.name)}
                                    disabled={forceDeletingId === user.id}
                                    className={`p-1.5 sm:p-2 text-red-700 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-200 ${forceDeletingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Permanently Delete"
                                  >
                                    {forceDeletingId === user.id ? (
                                      <FaSpinner className="animate-spin" size={14} />
                                    ) : (
                                      <FaExclamationTriangle size={14} />
                                    )}
                                  </button>
                                </Can>
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

            <Pagination />
          </div>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingUser={editingUser}
        roles={roles}
        onSuccess={() => {
          router.reload();
        }}
      />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }

        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline !important;
          }
          .xs\\:hidden {
            display: none !important;
          }
        }
        .xs\\:inline {
          display: none;
        }
        .xs\\:hidden {
          display: inline;
        }
      `}</style>
    </AuthenticatedLayout>
  );
}