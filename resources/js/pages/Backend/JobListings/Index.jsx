// resources/js/pages/Backend/JobListings/Index.jsx

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
  FaSpinner,
  FaEye,
  FaBriefcase,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaToggleOn,
  FaToggleOff,
  FaUsers,
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
  FaShieldAlt,
} from 'react-icons/fa';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// SweetAlert2
import Swal from 'sweetalert2';

export default function JobListingsIndex({
  jobListings: initialJobListings,
  filters: initialFilters = {},
  activeJobs,
  inactiveJobs,
  deletedJobs,
  totalViews,
  totalJobs,
}) {
  const { flash } = usePage().props;

  // Use centralized auth hook - MUST be called before any conditional returns
  const {
    user: currentUser,
    hasAnyPermission,
    hasRole,
  } = useAuth();

  // Check permissions for job management
  const canViewJobs = hasAnyPermission(['jobs.view', 'jobs.manage']);
  const isEmployer = hasRole('employer') || hasRole('employer-admin');
  const canEditJobs = hasAnyPermission(['jobs.update', 'jobs.manage']);
  const canToggleJobs = hasAnyPermission(['jobs.update', 'jobs.manage']);
  const canDeleteJobs = hasAnyPermission(['jobs.destroy', 'jobs.manage']);
  const canRestoreJobs = hasAnyPermission(['jobs.restore', 'jobs.manage']);
  const canBulkDeleteJobs = hasAnyPermission(['jobs.bulk_delete', 'jobs.manage']);
  const canBulkActivateJobs = hasAnyPermission(['jobs.bulk_activate', 'jobs.manage']);
  const canBulkDeactivateJobs = hasAnyPermission(['jobs.bulk_deactivate', 'jobs.manage']);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // States
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [restoringId, setRestoringId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Pagination state
  const [jobListings, setJobListings] = useState(initialJobListings);

  // Filter states - synced with URL/backend
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    status: initialFilters.status || 'all',
    jobType: initialFilters.job_type || 'all',
    experienceLevel: initialFilters.experience_level || 'all',
    category: initialFilters.category || 'all',
    location: initialFilters.location || 'all',
    dateRange: initialFilters.date_range || 'all',
  });

  // Get job listings array from paginated response
  const jobListingItems = useMemo(() => {
    if (Array.isArray(jobListings)) return jobListings;
    if (jobListings && Array.isArray(jobListings.data)) return jobListings.data;
    return [];
  }, [jobListings]);

  // Pagination info
  const pagination = useMemo(() => {
    if (jobListings && typeof jobListings === 'object' && 'current_page' in jobListings) {
      return {
        currentPage: jobListings.current_page,
        lastPage: jobListings.last_page,
        perPage: jobListings.per_page,
        total: jobListings.total,
        from: jobListings.from,
        to: jobListings.to,
        links: jobListings.links || [],
      };
    }
    return null;
  }, [jobListings]);

  // Get unique values for filters from all jobs
  const uniqueJobTypes = useMemo(() => {
    const types = new Set();
    jobListingItems.forEach(job => {
      if (job.job_type) types.add(job.job_type);
    });
    return Array.from(types);
  }, [jobListingItems]);

  const uniqueExperienceLevels = useMemo(() => {
    const levels = new Set();
    jobListingItems.forEach(job => {
      if (job.experience_level) levels.add(job.experience_level);
    });
    return Array.from(levels);
  }, [jobListingItems]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    jobListingItems.forEach(job => {
      if (job.category?.name) cats.add(job.category.name);
    });
    return Array.from(cats);
  }, [jobListingItems]);

  const uniqueLocations = useMemo(() => {
    const locs = new Set();
    jobListingItems.forEach(job => {
      if (job.locations && Array.isArray(job.locations)) {
        job.locations.forEach(location => {
          if (location.name) locs.add(location.name);
        });
      }
    });
    return Array.from(locs);
  }, [jobListingItems]);

  // Sort jobs for display
  const sortedJobListings = useMemo(() => {
    return [...jobListingItems].sort((a, b) => {
      const aIsTrashed = a.deleted_at !== null;
      const bIsTrashed = b.deleted_at !== null;

      if (aIsTrashed && !bIsTrashed) return 1;
      if (!aIsTrashed && bIsTrashed) return -1;

      if (!aIsTrashed && !bIsTrashed) {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      }

      if (aIsTrashed && bIsTrashed) {
        return new Date(b.deleted_at) - new Date(a.deleted_at);
      }

      return 0;
    });
  }, [jobListingItems]);

  // ALL EFFECTS MUST BE CALLED BEFORE CONDITIONAL RETURNS
  // Apply filters whenever filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get(route('backend.listing.index'), {
        ...filters,
        page: 1,
      }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onSuccess: (page) => {
          setJobListings(page.props.jobListings);
        },
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Keep local job listings in sync
  useEffect(() => {
    setJobListings(initialJobListings);
  }, [initialJobListings]);

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

  // NOW we can do conditional returns after all hooks
  // If user doesn't have permission to view jobs, show access denied
  if (!canViewJobs && !isEmployer) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to view job listings.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Count jobs by status
  const totalCount = totalJobs || 0;
  const activeCount = activeJobs || 0;
  const deletedCount = deletedJobs || 0;
  const totalViewsAll = totalViews || 0;
  const inactiveCount = inactiveJobs || 0;

  // Handle page change
  const handlePageChange = (page) => {
    if (page === pagination?.currentPage) return;
    if (page < 1 || page > pagination?.lastPage) return;

    router.get(route('backend.listing.index'), {
      ...filters,
      page,
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setJobListings(page.props.jobListings);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      jobType: 'all',
      experienceLevel: 'all',
      category: 'all',
      location: 'all',
      dateRange: 'all',
    });
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return filters.search !== '' ||
      filters.status !== 'all' ||
      filters.jobType !== 'all' ||
      filters.experienceLevel !== 'all' ||
      filters.category !== 'all' ||
      filters.location !== 'all' ||
      filters.dateRange !== 'all';
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    const selectableJobs = sortedJobListings.filter(job => !job.deleted_at && (canEditJobs || (isEmployer && job.employer_id === currentUser?.employer_id)));
    if (selectedJobs.length === selectableJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(selectableJobs.map(job => job.id));
    }
  };

  const handleSelectJob = (jobId) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  // Check if user can bulk perform actions
  const canBulkActivate = canBulkActivateJobs && selectedJobs.length > 0;
  const canBulkDeactivate = canBulkDeactivateJobs && selectedJobs.length > 0;
  const canBulkDelete = canBulkDeleteJobs && selectedJobs.length > 0;

  // Bulk actions
  const handleBulkActivate = () => {
    if (!canBulkActivateJobs) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk activate jobs.', 'error');
      return;
    }

    if (selectedJobs.length === 0) {
      Swal.fire('No Selection', 'Please select at least one job listing.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Activate Jobs',
      text: `Are you sure you want to activate ${selectedJobs.length} job listing(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, activate',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.listing.bulk-activate'), {
          job_ids: selectedJobs
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Activated!',
              text: `${selectedJobs.length} job listing(s) have been activated.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedJobs([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to activate jobs.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk Job Deactivate Handler
  const handleBulkDeactivate = () => {
    if (!canBulkDeactivateJobs) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk deactivate jobs.', 'error');
      return;
    }

    if (selectedJobs.length === 0) {
      Swal.fire('No Selection', 'Please select at least one job listing.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Deactivate Jobs',
      text: `Are you sure you want to deactivate ${selectedJobs.length} job listing(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, deactivate',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.listing.bulk-deactivate'), {
          job_ids: selectedJobs
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deactivated!',
              text: `${selectedJobs.length} job listing(s) have been deactivated.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedJobs([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to deactivate jobs.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk Job Delete Handler
  const handleBulkDelete = () => {
    if (!canBulkDeleteJobs) {
      Swal.fire('Permission Denied', 'You do not have permission to bulk delete jobs.', 'error');
      return;
    }

    if (selectedJobs.length === 0) {
      Swal.fire('No Selection', 'Please select at least one job listing.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Delete Jobs',
      text: `Are you sure you want to delete ${selectedJobs.length} job listing(s)? This will move them to trash.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.delete(route('backend.listing.bulk-delete'), {
          data: { job_ids: selectedJobs },
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `${selectedJobs.length} job listing(s) have been moved to trash.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedJobs([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to delete jobs.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Single Job Delete Handler
  const handleDelete = (id) => {
    if (!canDeleteJobs) {
      Swal.fire('Permission Denied', 'You do not have permission to delete jobs.', 'error');
      return;
    }

    Swal.fire({
      title: 'Delete job listing?',
      text: 'This will move it to trash. Applications will be preserved.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setDeletingId(id);

        router.delete(route('backend.listing.destroy', id), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Job listing has been moved to trash.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: errors?.message || 'Failed to delete job listing. Please try again.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setDeletingId(null),
        });
      }
    });
  };

  // Single Job Restore Handler
  const handleRestore = (id) => {
    if (!canRestoreJobs) {
      Swal.fire('Permission Denied', 'You do not have permission to restore jobs.', 'error');
      return;
    }

    Swal.fire({
      title: 'Restore job listing?',
      text: 'This will restore the job listing from trash.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setRestoringId(id);

        router.patch(route('backend.listing.restore', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: 'Job listing has been restored successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Restore Failed',
              text: errors?.message || 'Failed to restore job listing. Please try again.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setRestoringId(null),
        });
      }
    });
  };

  // Single Job Toggle Handler
  const handleToggle = (job) => {
    if (!canToggleJobs && !(isEmployer && job.employer_id === currentUser?.employer_id)) {
      Swal.fire('Permission Denied', 'You do not have permission to change job status.', 'error');
      return;
    }

    Swal.fire({
      title: 'Change status?',
      text: `This will ${job.is_active ? 'deactivate' : 'activate'} this job listing.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, continue',
    }).then((result) => {
      if (result.isConfirmed) {
        setTogglingId(job.id);

        router.patch(route('backend.listing.toggle-active', job.id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            router.reload();
            Swal.fire({
              icon: 'success',
              title: 'Status Updated!',
              text: `Job listing has been ${!job.is_active ? 'activated' : 'deactivated'}.`,
              timer: 1500,
              showConfirmButton: false,
            });
          },
          onError: (error) => {
            console.error(error);
            Swal.fire({
              icon: 'error',
              title: 'Update Failed',
              text: 'Failed to update job status. Please try again.',
              confirmButtonColor: '#2563eb',
            });
          },
          onFinish: () => setTogglingId(null),
        });
      }
    });
  };

  // Check if user can edit a specific job
  const canEditJob = (job) => {
    if (canEditJobs) return true;
    if (isEmployer && job.employer_id === currentUser?.employer_id) return true;
    return false;
  };

  // Check if user can delete a specific job
  const canDeleteJob = () => {
    if (canDeleteJobs) return true;
    return false;
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

  const getJobTypeBadge = (type) => {
    const types = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-yellow-100 text-yellow-800',
      'contract': 'bg-blue-100 text-blue-800',
      'internship': 'bg-orange-100 text-orange-800',
      'remote': 'bg-indigo-100 text-indigo-800',
      'hybrid': 'bg-purple-100 text-purple-800'
    };
    return types[type] || 'bg-gray-100 text-gray-800';
  };

  const getExperienceBadge = (level) => {
    const levels = {
      'entry': 'bg-blue-100 text-blue-800',
      'junior': 'bg-cyan-100 text-cyan-800',
      'mid-level': 'bg-teal-100 text-teal-800',
      'senior': 'bg-purple-100 text-purple-800',
      'lead': 'bg-orange-100 text-orange-800',
      'executive': 'bg-red-100 text-red-800'
    };
    return levels[level] || 'bg-gray-100 text-gray-800';
  };

  const getSalaryRange = (job) => {
    if (job.as_per_companies_policy) {
      return 'As per company policy';
    }
    if (job.is_salary_negotiable) {
      return 'Negotiable';
    }
    if (job.salary_min && job.salary_max) {
      return `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} BDT`;
    }
    if (job.salary_min) {
      return `From ${job.salary_min.toLocaleString()} BDT`;
    }
    return null;
  };

  const formatLocations = (locations) => {
    if (!locations || locations.length === 0) return 'N/A';
    if (locations.length === 1) return locations[0].name;
    return `${locations[0].name} +${locations.length - 1}`;
  };

  // Check if user can select a job for bulk actions
  const canSelectJob = (job) => {
    return !job.deleted_at && (canEditJobs || (isEmployer && job.employer_id === currentUser?.employer_id));
  };

  // Check if all selectable jobs are selected
  const selectableJobsCount = sortedJobListings.filter(job => canSelectJob(job)).length;
  const allSelectableSelected = selectedJobs.length === selectableJobsCount && selectableJobsCount > 0;

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

  return (
    <AuthenticatedLayout>
      <Head title="Job Listings" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 text-black">
        <div className="mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Job Listings
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                Manage all job postings in one place
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
                  Active: {activeCount}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" />
                  Inactive: {inactiveCount}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
                  Deleted: {deletedCount}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs">
                  <FaEye className="text-blue-500" size={10} />
                  Views: {totalViewsAll.toLocaleString()}
                </span>
                {hasActiveFilters() && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-blue-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Filtered
                  </span>
                )}
                {pagination && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    Total: {totalCount}
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

              <Can permission="jobs.create" fallback={null}>
                <a
                  href={route('backend.listing.create')}
                  className="flex-1 sm:flex-none bg-linear-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg text-xs sm:text-sm"
                >
                  <FaPlus size={14} />
                  Create Job
                </a>
              </Can>
            </div>
          </div>

          {/* BULK ACTIONS BAR */}
          {selectedJobs.length > 0 && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 animate-fade-in border border-blue-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FaCheckDouble className="text-blue-600" size={16} />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {selectedJobs.length} job(s) selected
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
                    onClick={() => setSelectedJobs([])}
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
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filter Job Listings</h3>
                <button
                  onClick={resetFilters}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <FaTimes size={10} />
                  Reset all
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Search */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search by title..."
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
                    <option value="trashed">Deleted</option>
                  </select>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Job Type</label>
                  <select
                    value={filters.jobType}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Types</option>
                    {uniqueJobTypes.map(type => (
                      <option key={type} value={type}>{type.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Experience Level</label>
                  <select
                    value={filters.experienceLevel}
                    onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Levels</option>
                    {uniqueExperienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Location</label>
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Locations</option>
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Deadline</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">Any Time</option>
                    <option value="today">Today</option>
                    <option value="week">Next 7 Days</option>
                    <option value="month">Next 30 Days</option>
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
                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-left">
                      <input
                        type="checkbox"
                        checked={allSelectableSelected}
                        onChange={handleSelectAll}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={selectableJobsCount === 0}
                      />
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Job Details
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location(s)
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type & Level
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Views & Apps
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Deadline
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
                  {sortedJobListings.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 sm:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <FaBriefcase className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">No job listings found</h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">
                          {hasActiveFilters() ? 'Try adjusting your filters.' : 'Get started by creating a new job posting.'}
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

                  {sortedJobListings.map((job, index) => {
                    const trashed = job.deleted_at !== null;
                    const applicationsCount = job.applications_count || 0;
                    const viewsCount = job.views_count || 0;
                    const salaryDisplay = getSalaryRange(job);
                    const canEdit = canEditJob(job);
                    const canDelete = canDeleteJob(job);
                    const canToggleThis = canToggleJobs || (isEmployer && job.employer_id === currentUser?.employer_id);
                    const canSelect = canSelectJob(job);

                    return (
                      <tr
                        key={job.id}
                        className={`hover:bg-gray-50 transition-all duration-200 animate-fade-in ${trashed ? 'bg-gray-50 opacity-75' : ''} ${selectedJobs.includes(job.id) ? 'bg-blue-50' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={selectedJobs.includes(job.id)}
                              onChange={() => handleSelectJob(job.id)}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                        </td>

                        {/* JOB DETAILS */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${trashed ? 'bg-gray-300' : job.is_active ? 'bg-green-100' : 'bg-yellow-100'}`}>
                              <FaBriefcase className={trashed ? 'text-gray-500' : job.is_active ? 'text-green-600' : 'text-yellow-600'} size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className={`text-sm sm:text-base font-semibold truncate ${trashed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {job.title}
                              </div>
                              <div className={`text-[10px] sm:text-sm mt-0.5 sm:mt-1 truncate ${trashed ? 'text-gray-400' : 'text-gray-500'}`}>
                                {job.category?.name || 'N/A'}
                              </div>
                              {salaryDisplay && (
                                <div className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium truncate ${trashed ? 'text-gray-400' : 'text-green-600'}`}>
                                  {salaryDisplay}
                                </div>
                              )}
                              {!trashed && isEmployer && job.employer_id === currentUser?.employer_id && (
                                <div className="text-[10px] sm:text-xs text-blue-500 mt-0.5 sm:mt-1">
                                  Your Job
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* LOCATION(S) - hidden on mobile */}
                        <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <FaMapMarkerAlt className={trashed ? 'text-gray-400' : 'text-gray-400'} size={12} />
                            <span className={`text-xs sm:text-sm ${trashed ? 'text-gray-400' : 'text-gray-700'}`}>
                              {formatLocations(job.locations)}
                            </span>
                          </div>
                          {job.locations && job.locations.length > 1 && (
                            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">
                              {job.locations.map(loc => loc.name).join(', ')}
                            </div>
                          )}
                        </td>

                        {/* TYPE & LEVEL - hidden on tablet */}
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className="space-y-1.5 sm:space-y-2">
                            {!trashed ? (
                              <>
                                <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getJobTypeBadge(job.job_type)}`}>
                                  {job.job_type?.replace('-', ' ') || 'N/A'}
                                </span>
                                <br />
                                <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getExperienceBadge(job.experience_level)}`}>
                                  {job.experience_level || 'N/A'}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-gray-200 text-gray-500">
                                  {job.job_type?.replace('-', ' ') || 'N/A'}
                                </span>
                                <br />
                                <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-gray-200 text-gray-500">
                                  {job.experience_level || 'N/A'}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* VIEWS & APPS - hidden on tablet */}
                        <td className="hidden xl:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <FaEye className={`text-xs sm:text-sm ${trashed ? 'text-gray-400' : 'text-blue-500'}`} size={12} />
                              <span className={`text-xs sm:text-sm font-medium ${trashed ? 'text-gray-400' : 'text-gray-700'}`}>
                                {viewsCount.toLocaleString()} views
                              </span>
                            </div>
                            {!trashed && (
                              <a
                                href={route('backend.applications.job', job.id)}
                                className="flex items-center gap-1.5 sm:gap-2 hover:text-purple-700 transition-colors"
                              >
                                <FaUsers className={`text-xs sm:text-sm ${trashed ? 'text-gray-400' : 'text-purple-500'}`} size={12} />
                                <span className={`text-xs sm:text-sm font-medium ${trashed ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {applicationsCount.toLocaleString()} apps
                                </span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* DEADLINE - hidden on mobile */}
                        <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <FaCalendarAlt className={trashed ? 'text-gray-400' : 'text-gray-400'} size={12} />
                            <span className={`text-xs sm:text-sm ${trashed ? 'text-gray-400' : 'text-gray-700'}`}>
                              {formatDate(job.application_deadline)}
                            </span>
                          </div>
                          {!trashed && job.application_deadline && new Date(job.application_deadline) < new Date() && job.is_active && (
                            <span className="text-[10px] sm:text-xs text-red-500 mt-0.5 sm:mt-1 block">
                              Expired
                            </span>
                          )}
                          {trashed && (
                            <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 block">
                              Deleted: {formatDate(job.deleted_at)}
                            </span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {!trashed ? (
                            <button
                              onClick={() => handleToggle(job)}
                              disabled={togglingId === job.id || !canToggleThis}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-1 sm:gap-2 ${job.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                } ${(togglingId === job.id || !canToggleThis) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={!canToggleThis ? 'You do not have permission to change job status' : ''}
                            >
                              {togglingId === job.id ? (
                                <FaSpinner className="animate-spin" size={10} />
                              ) : job.is_active ? (
                                <FaToggleOn size={12} />
                              ) : (
                                <FaToggleOff size={12} />
                              )}
                              <span className="hidden xs:inline">{job.is_active ? 'Active' : 'Inactive'}</span>
                            </button>
                          ) : (
                            <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-gray-200 text-gray-500">
                              Deleted
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <a
                              href={route('backend.applications.job', job.id)}
                              className="relative p-1.5 sm:p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                              title="View Applications"
                            >
                              <FaUsers size={14} />
                              {applicationsCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold shadow-md">
                                  {applicationsCount > 99 ? '99+' : applicationsCount}
                                </span>
                              )}
                            </a>

                            <a
                              href={route('backend.listing.show', job.id)}
                              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${trashed
                                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                              title="View Details"
                            >
                              <FaEye size={14} />
                            </a>

                            {!trashed && canEdit && (
                              <a
                                href={route('backend.listing.edit', job.id)}
                                className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </a>
                            )}

                            {trashed && canRestoreJobs && (
                              <button
                                onClick={() => handleRestore(job.id)}
                                disabled={restoringId === job.id}
                                className={`p-1.5 sm:p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 ${restoringId === job.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Restore"
                              >
                                {restoringId === job.id ? (
                                  <FaSpinner className="animate-spin" size={14} />
                                ) : (
                                  <FaTrashRestore size={14} />
                                )}
                              </button>
                            )}

                            {!trashed && canDelete && (
                              <button
                                onClick={() => handleDelete(job.id)}
                                disabled={deletingId === job.id}
                                className={`p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 ${deletingId === job.id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                title="Delete"
                              >
                                {deletingId === job.id ? (
                                  <FaSpinner className="animate-spin" size={14} />
                                ) : (
                                  <FaTrash size={14} />
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

        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline !important;-
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