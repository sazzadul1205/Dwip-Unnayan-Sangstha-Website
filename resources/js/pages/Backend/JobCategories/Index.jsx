// resources/js/pages/Backend/JobCategories/Index.jsx

// React
import { useState, useMemo, useEffect } from 'react';

// Inertia
import { Head, router, usePage } from '@inertiajs/react';

// Auth
import { useAuth } from '../../../hooks/useAuth';
import { Can } from '../../../components/Auth/Can';

// Icons
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSpinner,
  FaUndo,
  FaBriefcase,
  FaFilter,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaBan,
  FaCheckDouble,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaShieldAlt,
} from 'react-icons/fa';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// SweetAlert2
import Swal from 'sweetalert2';

export default function JobCategoriesIndex({ categories: initialCategories, filters: initialFilters = {}, stats: initialStats = {} }) {
  const { flash } = usePage().props;

  // Use centralized auth hook
  const {
    hasAnyPermission,
  } = useAuth();

  // Check permissions for category management
  const canViewCategories = hasAnyPermission(['categories.view', 'categories.manage']);
  const canEditCategories = hasAnyPermission(['categories.update', 'categories.manage']);
  const canCreateCategories = hasAnyPermission(['categories.create', 'categories.manage']);
  const canToggleCategories = hasAnyPermission(['categories.update', 'categories.manage']);
  const canDeleteCategories = hasAnyPermission(['categories.destroy', 'categories.manage']);
  const canRestoreCategories = hasAnyPermission(['categories.restore', 'categories.manage']);
  const canBulkDeleteCategories = hasAnyPermission(['categories.bulk_delete', 'categories.manage']);
  const canForceDeleteCategories = hasAnyPermission(['categories.force_delete', 'categories.manage']);
  const canBulkRestoreCategories = hasAnyPermission(['categories.bulk_restore', 'categories.manage']);
  const canBulkActivateCategories = hasAnyPermission(['categories.bulk_activate', 'categories.manage']);
  const canBulkDeactivateCategories = hasAnyPermission(['categories.bulk_deactivate', 'categories.manage']);
  const canBulkForceDeleteCategories = hasAnyPermission(['categories.bulk_force_delete', 'categories.manage']);

  // States
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [forceDeletingId, setForceDeletingId] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Pagination state
  const [categories, setCategories] = useState(initialCategories);

  // Filter states
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    status: initialFilters.status || 'all',
  });

  // Form data for modal
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
  });

  // ✅ Prevent browser caching of this page
  useEffect(() => {
    document.querySelector('meta[name="cache-control"]')?.setAttribute('content', 'no-cache, no-store, must-revalidate');
    document.querySelector('meta[name="pragma"]')?.setAttribute('content', 'no-cache');
    document.querySelector('meta[name="expires"]')?.setAttribute('content', '0');
  }, []);

  // Get categories array from paginated response
  const categoryItems = useMemo(() => {
    if (Array.isArray(categories)) return categories;
    if (categories && Array.isArray(categories.data)) return categories.data;
    return [];
  }, [categories]);

  // Pagination info
  const pagination = useMemo(() => {
    if (categories && typeof categories === 'object' && 'current_page' in categories) {
      return {
        currentPage: categories.current_page,
        lastPage: categories.last_page,
        perPage: categories.per_page,
        total: categories.total,
        from: categories.from,
        to: categories.to,
        links: categories.links || [],
      };
    }
    return null;
  }, [categories]);

  // ✅ FIX: Apply filters only when they change, not on every render
  useEffect(() => {
    // Skip the initial render since we already have initialCategories
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      router.get(route('backend.categories.index'), {
        ...filters,
        page: 1,
        _t: Date.now(), // Cache busting
      }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onSuccess: (page) => {
          setCategories(page.props.categories);
        },
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, filters.search, filters.status, isInitialLoad]);

  // Keep local categories in sync when initialCategories changes
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Filtered categories (client-side filtering)
  const filteredCategories = useMemo(() => {
    let filtered = [...categoryItems];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filtered = filtered.filter(cat => cat.is_active && !cat.deleted_at);
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(cat => !cat.is_active && !cat.deleted_at);
      } else if (filters.status === 'deleted') {
        filtered = filtered.filter(cat => cat.deleted_at);
      }
    }

    return filtered;
  }, [categoryItems, filters.search, filters.status]);

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

  // If user doesn't have permission to view categories, show access denied
  if (!canViewCategories) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to view job categories.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Stats
  // Use safe fallbacks with optional chaining
  const activeCount = initialStats?.active ?? categoryItems.filter(cat => !cat.deleted_at && cat.is_active).length;
  const inactiveCount = initialStats?.inactive ?? categoryItems.filter(cat => !cat.deleted_at && !cat.is_active).length;
  const deletedCount = initialStats?.total_deleted ?? categoryItems.filter(cat => cat.deleted_at).length;
  const totalCount = initialStats?.total ?? categoryItems.length;

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

    router.get(route('backend.categories.index'), {
      ...filters,
      page,
      _t: Date.now(),
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setCategories(page.props.categories);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    const selectableCategories = filteredCategories.filter(cat => !cat.deleted_at && canEditCategories);
    if (selectedCategories.length === selectableCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(selectableCategories.map(cat => cat.id));
    }
  };

  // Category selection handlers
  const handleSelectCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Bulk Activate Handler
  const handleBulkActivate = () => {
    if (!canBulkActivateCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk activate categories.', 'error');
      return;
    }

    if (selectedCategories.length === 0) {
      Swal.fire('No Selection', 'Please select at least one category.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Activate Categories',
      text: `Are you sure you want to activate ${selectedCategories.length} category(ies)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, activate',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.categories.bulk-activate'), {
          category_ids: selectedCategories
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Activated!',
              text: `${selectedCategories.length} category(ies) have been activated.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedCategories([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to activate categories.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk Deactivate Handler
  const handleBulkDeactivate = () => {
    if (!canBulkDeactivateCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk deactivate categories.', 'error');
      return;
    }

    if (selectedCategories.length === 0) {
      Swal.fire('No Selection', 'Please select at least one category.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Deactivate Categories',
      text: `Are you sure you want to deactivate ${selectedCategories.length} category(ies)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, deactivate',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.categories.bulk-deactivate'), {
          category_ids: selectedCategories
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deactivated!',
              text: `${selectedCategories.length} category(ies) have been deactivated.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedCategories([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to deactivate categories.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk Delete Handler
  const handleBulkDelete = () => {
    if (!canBulkDeleteCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk delete categories.', 'error');
      return;
    }

    if (selectedCategories.length === 0) {
      Swal.fire('No Selection', 'Please select at least one category.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Delete Categories',
      text: `Are you sure you want to delete ${selectedCategories.length} category(ies)? This will move them to trash.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.categories.bulk-delete'), {
          category_ids: selectedCategories
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
                text: `${selectedCategories.length} category(ies) have been moved to trash.`,
                timer: 1500,
                showConfirmButton: false
              });
              setSelectedCategories([]);
              router.reload();
            }
            setIsBulkProcessing(false);
          },
          onError: (error) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete categories.';
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

  // Bulk Restore Handler
  const handleBulkRestore = () => {
    if (!canBulkRestoreCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk restore categories.', 'error');
      return;
    }

    if (selectedCategories.length === 0) {
      Swal.fire('No Selection', 'Please select at least one category.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Restore Categories',
      text: `Are you sure you want to restore ${selectedCategories.length} category(ies)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.categories.bulk-restore'), {
          category_ids: selectedCategories
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: `${selectedCategories.length} category(ies) have been restored.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedCategories([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to restore categories.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk Force Delete Handler
  const handleBulkForceDelete = () => {
    if (!canBulkForceDeleteCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to permanently delete categories.', 'error');
      return;
    }

    if (selectedCategories.length === 0) {
      Swal.fire('No Selection', 'Please select at least one category.', 'warning');
      return;
    }

    const trashedSelected = selectedCategories.filter(id => {
      const category = categoryItems.find(cat => cat.id === id);
      return category && category.deleted_at;
    });

    if (trashedSelected.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Deleted Categories',
        text: 'Please select categories that are already in trash to permanently delete them.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: 'Permanently Delete Categories',
      html: `Are you sure you want to <strong>permanently delete</strong> ${trashedSelected.length} category(ies)?<br/><br/>This action <strong>cannot be undone</strong> and will remove these categories from the database completely.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, permanently delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.categories.bulk-force-delete'), {
          category_ids: trashedSelected
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `${trashedSelected.length} category(ies) have been permanently deleted.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedCategories([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to permanently delete categories.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Modal handlers - Create 
  const handleOpenCreate = () => {
    if (!canCreateCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to create categories.', 'error');
      return;
    }
    setEditingCategory(null);
    setFormData({ name: '', is_active: true });
    setIsModalOpen(true);
  };

  // Modal handlers - Edit
  const handleOpenEdit = (category) => {
    if (!canEditCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to edit categories.', 'error');
      return;
    }
    setEditingCategory(category);
    setFormData({
      name: category.name,
      is_active: category.is_active,
    });
    setIsModalOpen(true);
  };

  // Modal handlers - Close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  // Form handlers
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!canCreateCategories && !canEditCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to save categories.', 'error');
      return;
    }

    setIsSubmitting(true);

    if (editingCategory) {
      router.put(route('backend.categories.update', editingCategory.id), formData, {
        preserveScroll: true,
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Category updated successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
          setIsSubmitting(false);
          handleCloseModal();
          router.reload();
        },
        onError: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: error?.response?.data?.message || error?.message || 'Failed to update category.',
          });
          setIsSubmitting(false);
        },
      });
    } else {
      router.post(route('backend.categories.store'), formData, {
        preserveScroll: true,
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Created!',
            text: 'Category created successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
          setIsSubmitting(false);
          handleCloseModal();
          router.reload();
        },
        onError: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: error?.response?.data?.message || error?.message || 'Failed to create category.',
          });
          setIsSubmitting(false);
        },
      });
    }
  };

  // Single category actions
  const handleDelete = (id, name) => {
    if (!canDeleteCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to delete categories.', 'error');
      return;
    }

    Swal.fire({
      title: 'Delete Category?',
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

        router.delete(route('backend.categories.destroy', id), {
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
                text: 'Category has been moved to trash.',
                timer: 1500,
                showConfirmButton: false,
              });
              router.reload();
            }
          },
          onError: (errors) => {
            const errorMessage = errors?.response?.data?.message || errors?.message || 'Failed to delete category.';
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

  // Force delete Handler
  const handleForceDelete = (id, name) => {
    if (!canForceDeleteCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to permanently delete categories.', 'error');
      return;
    }

    Swal.fire({
      title: 'Permanently Delete Category?',
      html: `Are you sure you want to <strong>permanently delete</strong> "${name}"?<br/><br/>This action <strong>cannot be undone</strong> and will remove this category from the database completely.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, permanently delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setForceDeletingId(id);

        router.delete(route('backend.categories.force-delete', id), {
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
            const errorMessage = errors?.response?.data?.message || errors?.message || 'Failed to permanently delete category.';
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

  // Restore Handler
  const handleRestore = (id, name) => {
    if (!canRestoreCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to restore categories.', 'error');
      return;
    }

    Swal.fire({
      title: 'Restore Category?',
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

        router.patch(route('backend.categories.restore', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: 'Category has been restored successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Restore Failed',
              text: errors?.message || 'Failed to restore category.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setRestoringId(null),
        });
      }
    });
  };

  // Toggle Handler
  const handleToggle = (category) => {
    if (!canToggleCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to change category status.', 'error');
      return;
    }

    Swal.fire({
      title: category.is_active ? 'Deactivate Category?' : 'Activate Category?',
      text: `This will ${category.is_active ? 'deactivate' : 'activate'} "${category.name}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, continue',
    }).then((result) => {
      if (result.isConfirmed) {
        setTogglingId(category.id);

        router.patch(route('backend.categories.toggle', category.id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            router.reload();
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: `Category has been ${!category.is_active ? 'activated' : 'deactivated'}.`,
              timer: 1500,
              showConfirmButton: false,
            });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to update category status.',
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

  // Permissions
  const canBulkActivate = canBulkActivateCategories && selectedCategories.length > 0;
  const canBulkDeactivate = canBulkDeactivateCategories && selectedCategories.length > 0;
  const canBulkDelete = canBulkDeleteCategories && selectedCategories.length > 0;
  const canBulkForceDelete = canBulkForceDeleteCategories && selectedCategories.length > 0;
  const canBulkRestore = canBulkRestoreCategories && selectedCategories.length > 0;

  return (
    <AuthenticatedLayout>
      <Head title="Job Categories" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
        <div className="mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Job Categories
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage job categories across the system
              </p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Active: {activeCount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Inactive: {inactiveCount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Deleted: {deletedCount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Total: {totalCount}
                </span>
                {hasActiveFilters() && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
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
                    {Object.values(filters).filter(v => v !== 'all' && v !== '').length}
                  </span>
                )}
                {showFilters ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>

              <Can permission="categories.create" fallback={null}>
                <button
                  onClick={handleOpenCreate}
                  className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <FaPlus size={16} />
                  Add Category
                </button>
              </Can>
            </div>
          </div>

          {/* BULK ACTIONS BAR */}
          {selectedCategories.length > 0 && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 mb-6 animate-fade-in border border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <FaCheckDouble className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-900">
                    {selectedCategories.length} category(ies) selected
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {canBulkActivate && (
                    <button
                      onClick={handleBulkActivate}
                      disabled={isBulkProcessing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaCheckCircle size={14} />
                      Activate All
                    </button>
                  )}
                  {canBulkDeactivate && (
                    <button
                      onClick={handleBulkDeactivate}
                      disabled={isBulkProcessing}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaBan size={14} />
                      Deactivate All
                    </button>
                  )}
                  {canBulkRestore && (
                    <button
                      onClick={handleBulkRestore}
                      disabled={isBulkProcessing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaUndo size={14} />
                      Restore All
                    </button>
                  )}
                  {canBulkForceDelete && (
                    <button
                      onClick={handleBulkForceDelete}
                      disabled={isBulkProcessing}
                      className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaExclamationTriangle size={14} />
                      Permanently Delete
                    </button>
                  )}
                  {canBulkDelete && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={isBulkProcessing}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaTrash size={14} />
                      Delete All
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCategories([])}
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
                <h3 className="text-lg font-semibold text-gray-900">Filter Categories</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <FaTimes size={12} />
                  Reset all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search by category name..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

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
                    <option value="deleted">Deleted</option>
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
                        checked={selectedCategories.length === filteredCategories.filter(cat => !cat.deleted_at && canEditCategories).length && filteredCategories.filter(cat => !cat.deleted_at && canEditCategories).length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={filteredCategories.filter(cat => !cat.deleted_at && canEditCategories).length === 0}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Slug
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
                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaBriefcase className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No categories found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {hasActiveFilters() ? 'Try adjusting your filters.' : 'Get started by adding a new category.'}
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

                  {filteredCategories.map((category, index) => {
                    const trashed = category.deleted_at !== null;
                    const canEdit = canEditCategories && !trashed;
                    const canDelete = canDeleteCategories && !trashed;
                    const canRestore = canRestoreCategories && trashed;
                    const canForceDelete = canForceDeleteCategories && trashed;
                    const canToggle = canToggleCategories && !trashed;

                    return (
                      <tr
                        key={category.id}
                        className={`hover:bg-gray-50 transition-all duration-200 animate-fade-in ${trashed ? 'bg-gray-50 opacity-75' : ''} ${selectedCategories.includes(category.id) ? 'bg-blue-50' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-4 py-4">
                          {!trashed && canEdit && (
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleSelectCategory(category.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${trashed ? 'bg-gray-300' : category.is_active ? 'bg-green-100' : 'bg-yellow-100'}`}>
                              <FaBriefcase className={trashed ? 'text-gray-500' : category.is_active ? 'text-green-600' : 'text-yellow-600'} size={18} />
                            </div>
                            <div>
                              <div className={`font-semibold ${trashed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {category.name}
                              </div>
                              {!trashed && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  ID: #{category.id}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className={`text-sm font-mono ${trashed ? 'text-gray-400' : 'text-gray-500'}`}>
                            {category.slug || <span className="text-gray-400 italic">No slug</span>}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {!trashed ? (
                            <button
                              onClick={() => handleToggle(category)}
                              disabled={togglingId === category.id || !canToggle}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 ${category.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                } ${(togglingId === category.id || !canToggle) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={!canToggle ? 'You do not have permission to change category status' : ''}
                            >
                              {togglingId === category.id ? (
                                <FaSpinner className="animate-spin" size={12} />
                              ) : category.is_active ? (
                                <FaCheckCircle size={12} />
                              ) : (
                                <FaBan size={12} />
                              )}
                              {category.is_active ? 'Active' : 'Inactive'}
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500 flex items-center gap-2">
                              <FaTrash size={12} />
                              Deleted
                            </span>
                          )}
                          {trashed && category.deleted_at && (
                            <div className="text-xs text-gray-400 mt-1">
                              Deleted: {new Date(category.deleted_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            {!trashed && canEdit && (
                              <button
                                onClick={() => handleOpenEdit(category)}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Edit Category"
                              >
                                <FaEdit size={18} />
                              </button>
                            )}

                            {!trashed && canDelete && (
                              <button
                                onClick={() => handleDelete(category.id, category.name)}
                                disabled={deletingId === category.id}
                                className={`p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 ${deletingId === category.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Delete Category"
                              >
                                {deletingId === category.id ? (
                                  <FaSpinner className="animate-spin" size={18} />
                                ) : (
                                  <FaTrash size={18} />
                                )}
                              </button>
                            )}

                            {trashed && canRestore && (
                              <button
                                onClick={() => handleRestore(category.id, category.name)}
                                disabled={restoringId === category.id}
                                className={`p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 ${restoringId === category.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Restore Category"
                              >
                                {restoringId === category.id ? (
                                  <FaSpinner className="animate-spin" size={18} />
                                ) : (
                                  <FaUndo size={18} />
                                )}
                              </button>
                            )}

                            {trashed && canForceDelete && (
                              <button
                                onClick={() => handleForceDelete(category.id, category.name)}
                                disabled={forceDeletingId === category.id}
                                className={`p-2 text-red-700 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-200 ${forceDeletingId === category.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Permanently Delete (Cannot be undone)"
                              >
                                {forceDeletingId === category.id ? (
                                  <FaSpinner className="animate-spin" size={18} />
                                ) : (
                                  <FaExclamationTriangle size={18} />
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

      {/* MODAL - Create/Edit Category - Only shown if user has permission */}
      {isModalOpen && (canCreateCategories || canEditCategories) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <FaBriefcase className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingCategory ? 'Edit Category' : 'Add Category'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {editingCategory ? 'Update category information' : 'Create a new job category'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:rotate-90 transform"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Information Technology"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    A unique slug will be automatically generated from the name
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.is_active ? 'bg-green-100' : 'bg-gray-200'}`}>
                      {formData.is_active ? <FaCheckCircle className="text-green-600" size={14} /> : <FaBan className="text-gray-500" size={14} />}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Active Category</span>
                      <p className="text-xs text-gray-500">Inactive categories won't appear in job listings</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 font-medium shadow-md"
                >
                  {isSubmitting && <FaSpinner className="animate-spin" size={16} />}
                  {editingCategory ? (isSubmitting ? 'Updating...' : 'Update Category') : (isSubmitting ? 'Creating...' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </AuthenticatedLayout>
  );
}