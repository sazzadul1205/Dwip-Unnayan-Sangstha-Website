// resources/js/pages/Backend/Locations/Index.jsx

import { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

// Icons
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaMapMarkerAlt,
  FaTimes,
  FaUndo,
  FaFilter,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaBan,
  FaCheckDouble,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaShieldAlt,
} from 'react-icons/fa';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';
import { Can } from '../../../components/Auth/Can';

// Components
import LocationModal from './LocationModal';

// SweetAlert2
import Swal from 'sweetalert2';

export default function LocationsIndex({ locations: initialLocations, filters: initialFilters = {}, stats = {} }) {
  const { flash } = usePage().props;

  // Use centralized auth hook
  const {
    hasAnyPermission,
  } = useAuth();

  // Check permissions for location management
  const canViewLocations = hasAnyPermission(['locations.view', 'locations.manage']);
  const canEditLocations = hasAnyPermission(['locations.update', 'locations.manage']);
  const canToggleLocations = hasAnyPermission(['locations.update', 'locations.manage']);
  const canCreateLocations = hasAnyPermission(['locations.create', 'locations.manage']);
  const canDeleteLocations = hasAnyPermission(['locations.destroy', 'locations.manage']);
  const canRestoreLocations = hasAnyPermission(['locations.restore', 'locations.manage']);
  const canBulkDeleteLocations = hasAnyPermission(['locations.bulk_delete', 'locations.manage']);
  const canBulkRestoreLocations = hasAnyPermission(['locations.bulk_restore', 'locations.manage']);
  const canForceDeleteLocations = hasAnyPermission(['locations.force_delete', 'locations.manage']);
  const canBulkActivateLocations = hasAnyPermission(['locations.bulk_activate', 'locations.manage']);
  const canBulkDeactivateLocations = hasAnyPermission(['locations.bulk_deactivate', 'locations.manage']);
  const canBulkForceDeleteLocations = hasAnyPermission(['locations.bulk_force_delete', 'locations.manage']);

  // States
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forceDeletingId, setForceDeletingId] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Pagination state
  const [locations, setLocations] = useState(initialLocations);

  // Filter states
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    status: initialFilters.status || 'all',
  });

  // Form data for modal
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    is_active: true,
  });

  // Prevent browser caching
  useEffect(() => {
    document.querySelector('meta[name="cache-control"]')?.setAttribute('content', 'no-cache, no-store, must-revalidate');
    document.querySelector('meta[name="pragma"]')?.setAttribute('content', 'no-cache');
    document.querySelector('meta[name="expires"]')?.setAttribute('content', '0');
  }, []);

  // Get locations array from paginated response
  const locationItems = useMemo(() => {
    if (Array.isArray(locations)) return locations;
    if (locations && Array.isArray(locations.data)) return locations.data;
    return [];
  }, [locations]);

  // Pagination info
  const pagination = useMemo(() => {
    if (locations && typeof locations === 'object' && 'current_page' in locations) {
      return {
        currentPage: locations.current_page,
        lastPage: locations.last_page,
        perPage: locations.per_page,
        total: locations.total,
        from: locations.from,
        to: locations.to,
        links: locations.links || [],
      };
    }
    return null;
  }, [locations]);

  // Apply filters
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      router.get(route('backend.locations.index'), {
        ...filters,
        page: 1,
        _t: Date.now(),
      }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onSuccess: (page) => {
          setLocations(page.props.locations);
        },
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, filters.search, filters.status, isInitialLoad]);

  // Keep local locations in sync
  useEffect(() => {
    setLocations(initialLocations);
  }, [initialLocations]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    let filtered = [...locationItems];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(loc =>
        loc.name.toLowerCase().includes(searchLower) ||
        (loc.address && loc.address.toLowerCase().includes(searchLower))
      );
    }

    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filtered = filtered.filter(loc => loc.is_active && !loc.deleted_at);
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(loc => !loc.is_active && !loc.deleted_at);
      } else if (filters.status === 'deleted') {
        filtered = filtered.filter(loc => loc.deleted_at);
      }
    }

    return filtered.sort((a, b) => {
      const aIsTrashed = a.deleted_at !== null;
      const bIsTrashed = b.deleted_at !== null;

      if (aIsTrashed && !bIsTrashed) return 1;
      if (!aIsTrashed && bIsTrashed) return -1;

      if (!aIsTrashed && !bIsTrashed) {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return a.name.localeCompare(b.name);
      }

      return new Date(b.deleted_at) - new Date(a.deleted_at);
    });
  }, [locationItems, filters.search, filters.status]);

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

  // If user doesn't have permission
  if (!canViewLocations) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">You don't have permission to view locations.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Stats
  const activeCount = stats?.active || locationItems.filter(loc => !loc.deleted_at && loc.is_active).length;
  const inactiveCount = stats?.inactive || locationItems.filter(loc => !loc.deleted_at && !loc.is_active).length;
  const deletedCount = stats?.total_deleted || locationItems.filter(loc => loc.deleted_at).length;
  const totalCount = stats?.total || locationItems.length;

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
    });
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return filters.search !== '' || filters.status !== 'all';
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page === pagination?.currentPage) return;
    if (page < 1 || page > pagination?.lastPage) return;

    router.get(route('backend.locations.index'), {
      ...filters,
      page,
      _t: Date.now(),
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setLocations(page.props.locations);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    const selectableLocations = filteredLocations.filter(loc => !loc.deleted_at && canEditLocations);
    if (selectedLocations.length === selectableLocations.length) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(selectableLocations.map(loc => loc.id));
    }
  };

  const handleSelectLocation = (locationId) => {
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  // Bulk activate
  const handleBulkActivate = () => {
    if (!canBulkActivateLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk activate locations.', 'error');
      return;
    }

    if (selectedLocations.length === 0) {
      Swal.fire('No Selection', 'Please select at least one location.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Activate Locations',
      text: `Are you sure you want to activate ${selectedLocations.length} location(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, activate',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.locations.bulk-activate'), {
          location_ids: selectedLocations
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Activated!',
              text: `${selectedLocations.length} location(s) have been activated.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedLocations([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to activate locations.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk deactivate
  const handleBulkDeactivate = () => {
    if (!canBulkDeactivateLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk deactivate locations.', 'error');
      return;
    }

    if (selectedLocations.length === 0) {
      Swal.fire('No Selection', 'Please select at least one location.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Deactivate Locations',
      text: `Are you sure you want to deactivate ${selectedLocations.length} location(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, deactivate',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.locations.bulk-deactivate'), {
          location_ids: selectedLocations
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deactivated!',
              text: `${selectedLocations.length} location(s) have been deactivated.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedLocations([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to deactivate locations.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (!canBulkDeleteLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk delete locations.', 'error');
      return;
    }

    if (selectedLocations.length === 0) {
      Swal.fire('No Selection', 'Please select at least one location.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Delete Locations',
      text: `Are you sure you want to delete ${selectedLocations.length} location(s)? This will move them to trash.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.locations.bulk-delete'), {
          location_ids: selectedLocations
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
                text: `${selectedLocations.length} location(s) have been moved to trash.`,
                timer: 1500,
                showConfirmButton: false
              });
              setSelectedLocations([]);
              router.reload();
            }
            setIsBulkProcessing(false);
          },
          onError: (error) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete locations.';
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

  // Bulk force delete
  const handleBulkForceDelete = () => {
    if (!canBulkForceDeleteLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to permanently delete locations.', 'error');
      return;
    }

    if (selectedLocations.length === 0) {
      Swal.fire('No Selection', 'Please select at least one location.', 'warning');
      return;
    }

    const trashedSelected = selectedLocations.filter(id => {
      const location = locationItems.find(loc => loc.id === id);
      return location && location.deleted_at;
    });

    if (trashedSelected.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Deleted Locations',
        text: 'Please select locations that are already in trash to permanently delete them.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: 'Permanently Delete Locations',
      html: `Are you sure you want to <strong>permanently delete</strong> ${trashedSelected.length} location(s)?<br/><br/>This action <strong>cannot be undone</strong> and will remove these locations from the database completely.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, permanently delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.locations.bulk-force-delete'), {
          location_ids: trashedSelected
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `${trashedSelected.length} location(s) have been permanently deleted.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedLocations([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to permanently delete locations.',
            });
            setIsBulkProcessing(false);
            router.reload();
          }
        });
      }
    });
  };

  // Bulk restore
  const handleBulkRestore = () => {
    if (!canBulkRestoreLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk restore locations.', 'error');
      return;
    }

    if (selectedLocations.length === 0) {
      Swal.fire('No Selection', 'Please select at least one location.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Restore Locations',
      text: `Are you sure you want to restore ${selectedLocations.length} location(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.locations.bulk-restore'), {
          location_ids: selectedLocations
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: `${selectedLocations.length} location(s) have been restored.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedLocations([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to restore locations.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Modal handlers
  const handleOpenCreate = () => {
    if (!canCreateLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to create locations.', 'error');
      return;
    }
    setEditingLocation(null);
    setFormData({ name: '', address: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (location) => {
    if (!canEditLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to edit locations.', 'error');
      return;
    }
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      is_active: location.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
  };

  // Single location actions
  const handleDelete = (id, name) => {
    if (!canDeleteLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to delete locations.', 'error');
      return;
    }

    Swal.fire({
      title: 'Delete Location?',
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

        router.delete(route('backend.locations.destroy', id), {
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
                text: 'Location has been moved to trash.',
                timer: 1500,
                showConfirmButton: false,
              });
              router.reload();
            }
          },
          onError: (errors) => {
            let errorMessage = 'Failed to delete location.';
            if (errors?.response?.data?.message) {
              errorMessage = errors.response.data.message;
            } else if (errors?.response?.data?.error) {
              errorMessage = errors.response.data.error;
            } else if (errors?.message) {
              errorMessage = errors.message;
            }
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
    if (!canForceDeleteLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to permanently delete locations.', 'error');
      return;
    }

    Swal.fire({
      title: 'Permanently Delete Location?',
      html: `Are you sure you want to <strong>permanently delete</strong> "${name}"?<br/><br/>This action <strong>cannot be undone</strong> and will remove this location from the database completely.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, permanently delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setForceDeletingId(id);

        router.delete(route('backend.locations.force-delete', id), {
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
            let errorMessage = 'Failed to permanently delete location.';
            if (errors?.response?.data?.message) {
              errorMessage = errors.response.data.message;
            } else if (errors?.response?.data?.error) {
              errorMessage = errors.response.data.error;
            } else if (errors?.message) {
              errorMessage = errors.message;
            }
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
    if (!canRestoreLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to restore locations.', 'error');
      return;
    }

    Swal.fire({
      title: 'Restore Location?',
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

        router.patch(route('backend.locations.restore', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: 'Location has been restored successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Restore Failed',
              text: errors?.message || 'Failed to restore location.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setRestoringId(null),
        });
      }
    });
  };

  // Toggle location status
  const handleToggle = (location) => {
    if (!canToggleLocations) {
      Swal.fire('Permission Denied', 'You do not have permission to change location status.', 'error');
      return;
    }

    Swal.fire({
      title: location.is_active ? 'Deactivate Location?' : 'Activate Location?',
      text: `This will ${location.is_active ? 'deactivate' : 'activate'} "${location.name}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, continue',
    }).then((result) => {
      if (result.isConfirmed) {
        setTogglingId(location.id);

        router.patch(route('backend.locations.toggle', location.id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            router.reload();
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: `Location has been ${!location.is_active ? 'activated' : 'deactivated'}.`,
              timer: 1500,
              showConfirmButton: false,
            });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to update location status.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setTogglingId(null),
        });
      }
    });
  };

  // Pagination component
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

  // Check Permissions
  const canBulkActivate = canBulkActivateLocations && selectedLocations.length > 0;
  const canBulkDeactivate = canBulkDeactivateLocations && selectedLocations.length > 0;
  const canBulkDelete = canBulkDeleteLocations && selectedLocations.length > 0;
  const canBulkForceDelete = canBulkForceDeleteLocations && selectedLocations.length > 0;
  const canBulkRestore = canBulkRestoreLocations && selectedLocations.length > 0;

  return (
    <AuthenticatedLayout>
      <Head title="Locations" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
        <div className="mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Locations
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                Manage job locations across the system
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-3 mt-1.5 sm:mt-2">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
                  Active: {activeCount}
                </span>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" />
                  Inactive: {inactiveCount}
                </span>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
                  Deleted: {deletedCount}
                </span>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                  Total: {totalCount}
                </span>
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

              <Can permission="locations.create" fallback={null}>
                <button
                  onClick={handleOpenCreate}
                  className="flex-1 sm:flex-none bg-linear-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-xs sm:text-sm"
                >
                  <FaPlus size={14} />
                  Add Location
                </button>
              </Can>
            </div>
          </div>

          {/* BULK ACTIONS BAR */}
          {selectedLocations.length > 0 && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 animate-fade-in border border-blue-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FaCheckDouble className="text-blue-600" size={16} />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {selectedLocations.length} location(s) selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                  {canBulkActivate && (
                    <button
                      onClick={handleBulkActivate}
                      disabled={isBulkProcessing}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <FaCheckCircle size={12} />
                      Activate
                    </button>
                  )}
                  {canBulkDeactivate && (
                    <button
                      onClick={handleBulkDeactivate}
                      disabled={isBulkProcessing}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <FaBan size={12} />
                      Deactivate
                    </button>
                  )}
                  {canBulkRestore && (
                    <button
                      onClick={handleBulkRestore}
                      disabled={isBulkProcessing}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <FaUndo size={12} />
                      Restore
                    </button>
                  )}
                  {canBulkForceDelete && (
                    <button
                      onClick={handleBulkForceDelete}
                      disabled={isBulkProcessing}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <FaExclamationTriangle size={12} />
                      Force Delete
                    </button>
                  )}
                  {canBulkDelete && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={isBulkProcessing}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
                    >
                      <FaTrash size={12} />
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedLocations([])}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 text-xs sm:text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FILTERS PANEL */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filter Locations</h3>
                <button
                  onClick={resetFilters}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <FaTimes size={10} />
                  Reset all
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Search */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search by name or address..."
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-linear-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLocations.length === filteredLocations.filter(loc => !loc.deleted_at && canEditLocations).length && filteredLocations.filter(loc => !loc.deleted_at && canEditLocations).length > 0}
                        onChange={handleSelectAll}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={filteredLocations.filter(loc => !loc.deleted_at && canEditLocations).length === 0}
                      />
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location Details
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Address
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
                  {filteredLocations.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-12 sm:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <FaMapMarkerAlt className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">No locations found</h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">
                          {hasActiveFilters() ? 'Try adjusting your filters.' : 'Get started by adding a new location.'}
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

                  {filteredLocations.map((location, index) => {
                    const trashed = location.deleted_at !== null;
                    const canEdit = canEditLocations && !trashed;
                    const canDelete = canDeleteLocations && !trashed;
                    const canRestore = canRestoreLocations && trashed;
                    const canForceDelete = canForceDeleteLocations && trashed;
                    const canToggle = canToggleLocations && !trashed;

                    return (
                      <tr
                        key={location.id}
                        className={`hover:bg-gray-50 transition-all duration-200 animate-fade-in ${trashed ? 'bg-gray-50 opacity-75' : ''} ${selectedLocations.includes(location.id) ? 'bg-blue-50' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          {!trashed && canEdit && (
                            <input
                              type="checkbox"
                              checked={selectedLocations.includes(location.id)}
                              onChange={() => handleSelectLocation(location.id)}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                        </td>

                        {/* LOCATION DETAILS */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${trashed ? 'bg-gray-300' : location.is_active ? 'bg-green-100' : 'bg-yellow-100'}`}>
                              <FaMapMarkerAlt className={trashed ? 'text-gray-500' : location.is_active ? 'text-green-600' : 'text-yellow-600'} size={14} />
                            </div>
                            <div>
                              <div className={`text-sm sm:text-base font-semibold ${trashed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {location.name}
                              </div>
                              {!trashed && (
                                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                                  ID: #{location.id}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* ADDRESS - Hidden on mobile */}
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className={`text-xs sm:text-sm max-w-md ${trashed ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                            {location.address || <span className="text-gray-400 italic">No address</span>}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {!trashed ? (
                            <button
                              onClick={() => handleToggle(location)}
                              disabled={togglingId === location.id || !canToggle}
                              className={`px-1.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-1 sm:gap-2 ${location.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                } ${(togglingId === location.id || !canToggle) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={!canToggle ? 'You do not have permission to change location status' : ''}
                            >
                              {togglingId === location.id ? (
                                <FaSpinner className="animate-spin" size={10} />
                              ) : location.is_active ? (
                                <FaCheckCircle size={10} />
                              ) : (
                                <FaBan size={10} />
                              )}
                              <span className="hidden xs:inline">{location.is_active ? 'Active' : 'Inactive'}</span>
                            </button>
                          ) : (
                            <span className="px-1.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-gray-200 text-gray-500 flex items-center gap-1 sm:gap-2">
                              <FaTrash size={10} />
                              <span className="hidden xs:inline">Deleted</span>
                            </span>
                          )}
                          {trashed && location.deleted_at && (
                            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                              {new Date(location.deleted_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            {!trashed && canEdit && (
                              <button
                                onClick={() => handleOpenEdit(location)}
                                className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Edit Location"
                              >
                                <FaEdit size={14} />
                              </button>
                            )}

                            {!trashed && canDelete && (
                              <button
                                onClick={() => handleDelete(location.id, location.name)}
                                disabled={deletingId === location.id}
                                className={`p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 ${deletingId === location.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Delete Location"
                              >
                                {deletingId === location.id ? (
                                  <FaSpinner className="animate-spin" size={14} />
                                ) : (
                                  <FaTrash size={14} />
                                )}
                              </button>
                            )}

                            {trashed && canRestore && (
                              <button
                                onClick={() => handleRestore(location.id, location.name)}
                                disabled={restoringId === location.id}
                                className={`p-1.5 sm:p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 ${restoringId === location.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Restore Location"
                              >
                                {restoringId === location.id ? (
                                  <FaSpinner className="animate-spin" size={14} />
                                ) : (
                                  <FaUndo size={14} />
                                )}
                              </button>
                            )}

                            {trashed && canForceDelete && (
                              <button
                                onClick={() => handleForceDelete(location.id, location.name)}
                                disabled={forceDeletingId === location.id}
                                className={`p-1.5 sm:p-2 text-red-700 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-200 ${forceDeletingId === location.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Permanently Delete"
                              >
                                {forceDeletingId === location.id ? (
                                  <FaSpinner className="animate-spin" size={14} />
                                ) : (
                                  <FaExclamationTriangle size={14} />
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

      {/* MODAL */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingLocation={editingLocation}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        canCreateLocations={canCreateLocations}
        canEditLocations={canEditLocations}
      />

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