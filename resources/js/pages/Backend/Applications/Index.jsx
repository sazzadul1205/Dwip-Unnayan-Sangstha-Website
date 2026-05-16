// resources/js/pages/Backend/Applications/Index.jsx

import { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import EmailModal from '../../../components/EmailModal';
import useEmailModal from '../../../hooks/useEmailModal';

// Icons
import {
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaCheck,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaFilePdf,
  FaFilter,
  FaHourglassHalf,
  FaPhone,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaTrashRestore,
  FaUser,
  FaUserCheck,
  FaUserSlash,
  FaUsers,
  FaChevronDown,
  FaChevronUp,
  FaCheckDouble,
  FaStar,
  FaRegBuilding,
  FaSort,
  FaSortUp,
  FaSortDown,
} from 'react-icons/fa';

// SweetAlert2
import Swal from 'sweetalert2';

export default function Index({
  applications: initialApplications,
  jobs,
  categories,
  locations,
  jobTypes,
  educationLevels,
  filters: initialFilters = {},
  statusCounts,
  totalApplications,
  filterOptions = {}
}) {
  const { flash } = usePage().props;
  const safeInitialFilters = (initialFilters && !Array.isArray(initialFilters)) ? initialFilters : {};

  // Use the email modal hook
  const {
    isEmailModalOpen,
    emailRecipients,
    emailModalTitle,
    openEmailModal,
    closeEmailModal,
  } = useEmailModal();

  // States
  const [applications, setApplications] = useState(initialApplications);
  const [selectedApps, setSelectedApps] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [sortField, setSortField] = useState(safeInitialFilters.sort || 'created_at');
  const [sortDirection, setSortDirection] = useState(safeInitialFilters.direction || 'desc');

  // Statuses
  const statuses = ['pending', 'shortlisted', 'rejected', 'hired'];

  // Date range options
  const dateRangeOptions = [
    { value: '', label: 'Any Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
  ];

  // Trash filter options
  const trashOptions = [
    { value: '', label: 'Without Trash' },
    { value: 'with', label: 'With Trash' },
    { value: 'only', label: 'Only Trash' },
  ];

  // Filter states
  const [filters, setFilters] = useState({
    status: safeInitialFilters.status || '',
    job_id: safeInitialFilters.job_id || '',
    category_id: safeInitialFilters.category_id || '',
    search: safeInitialFilters.search || '',
    date_from: safeInitialFilters.date_from || '',
    date_to: safeInitialFilters.date_to || '',
    date_range: safeInitialFilters.date_range || '',
    min_ats_score: safeInitialFilters.min_ats_score || '',
    max_ats_score: safeInitialFilters.max_ats_score || '',
    min_experience: safeInitialFilters.min_experience || '',
    max_experience: safeInitialFilters.max_experience || '',
    min_salary: safeInitialFilters.min_salary || '',
    max_salary: safeInitialFilters.max_salary || '',
    education_level: safeInitialFilters.education_level || '',
    job_type: safeInitialFilters.job_type || '',
    location_id: safeInitialFilters.location_id || '',
    trashed: safeInitialFilters.trashed || '',
    per_page: safeInitialFilters.per_page || '7',
  });

  // Get applications array from paginated response
  const applicationItems = applications?.data || [];

  // Get selected application objects for email
  const getSelectedApplicants = () => {
    return applicationItems.filter(app => selectedApps.includes(app.id));
  };

  // Open email modal for bulk
  const handleOpenBulkEmail = () => {
    if (selectedApps.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Applications Selected',
        text: 'Please select at least one application to send emails.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const selectedApplicants = getSelectedApplicants();
    openEmailModal(selectedApplicants, `Send Email to ${selectedApps.length} Applicant(s)`);
  };

  // Pagination info
  const pagination = applications?.data ? {
    currentPage: applications.current_page,
    lastPage: applications.last_page,
    perPage: applications.per_page,
    total: applications.total,
    from: applications.from,
    to: applications.to,
  } : null;

  // Build query params
  const buildQueryParams = (pageNumber = 1, additionalParams = {}) => {
    const params = {
      page: pageNumber,
      sort: sortField,
      direction: sortDirection,
      ...additionalParams
    };

    // Add all filters that have values
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        params[key] = filters[key];
      }
    });

    return params;
  };

  // Apply filters
  const applyFilters = () => {
    router.get(route('backend.applications.index'), buildQueryParams(1), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setShowFilters(false);
        setSelectedApps([]);
      },
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: '',
      job_id: '',
      category_id: '',
      search: '',
      date_from: '',
      date_to: '',
      date_range: '',
      min_ats_score: '',
      max_ats_score: '',
      min_experience: '',
      max_experience: '',
      min_salary: '',
      max_salary: '',
      education_level: '',
      job_type: '',
      location_id: '',
      trashed: '',
      per_page: '7',
    });

    setSortField('created_at');
    setSortDirection('desc');

    router.get(route('backend.applications.index'), { page: 1 }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setShowFilters(false);
        setSelectedApps([]);
      },
    });
  };

  // Handle sort
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);

    router.get(route('backend.applications.index'), buildQueryParams(1, { sort: field, direction: newDirection }), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setSelectedApps([]);
      },
    });
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page === pagination?.currentPage) return;
    if (page < 1 || page > pagination?.lastPage) return;

    router.get(route('backend.applications.index'), buildQueryParams(page), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setSelectedApps([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Handle per page change
  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setFilters(prev => ({ ...prev, per_page: newPerPage }));

    router.get(route('backend.applications.index'), buildQueryParams(1, { per_page: newPerPage }), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setSelectedApps([]);
      },
    });
  };

  // Handle select all applications
  const handleSelectAll = () => {
    const selectableApps = applicationItems.filter(app => !app.deleted_at);
    if (selectedApps.length === selectableApps.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(selectableApps.map(app => app.id));
    }
  };

  // Handle select single application
  const handleSelectApp = (appId) => {
    setSelectedApps(prev =>
      prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = (newStatus) => {
    if (selectedApps.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Applications Selected',
        text: 'Please select at least one application.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: 'Update Status',
      text: `Are you sure you want to mark ${selectedApps.length} application(s) as ${newStatus}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsUpdatingStatus(true);

        router.post(route('backend.applications.bulk-status'), {
          application_ids: selectedApps,
          status: newStatus,
          notes: `Bulk updated to ${newStatus}`,
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: `${selectedApps.length} application(s) updated successfully.`,
              timer: 1500,
              showConfirmButton: false,
            });
            setSelectedApps([]);
            setIsUpdatingStatus(false);
            router.reload({ preserveScroll: true });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Update Failed',
              text: error?.message || 'Failed to update applications.',
              confirmButtonColor: '#d33',
            });
            setIsUpdatingStatus(false);
          },
        });
      }
    });
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedApps.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Applications Selected',
        text: 'Please select at least one application.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Applications',
      text: `Are you sure you want to delete ${selectedApps.length} application(s)? This will move them to trash.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(true);

        router.delete(route('backend.applications.bulk-delete'), {
          data: { application_ids: selectedApps },
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `${selectedApps.length} application(s) moved to trash.`,
              timer: 1500,
              showConfirmButton: false,
            });
            setSelectedApps([]);
            setIsDeleting(false);
            router.reload({ preserveScroll: true });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: error?.message || 'Failed to delete applications.',
              confirmButtonColor: '#d33',
            });
            setIsDeleting(false);
          },
        });
      }
    });
  };

  // Handle bulk restore
  const handleBulkRestore = () => {
    if (selectedApps.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Applications Selected',
        text: 'Please select at least one application to restore.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: 'Restore Applications',
      text: `Are you sure you want to restore ${selectedApps.length} application(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsRestoring(true);

        router.post(route('backend.applications.bulk-restore'), {
          application_ids: selectedApps,
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: `${selectedApps.length} application(s) restored successfully.`,
              timer: 1500,
              showConfirmButton: false,
            });
            setSelectedApps([]);
            setIsRestoring(false);
            router.reload({ preserveScroll: true });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Restore Failed',
              text: error?.message || 'Failed to restore applications.',
              confirmButtonColor: '#d33',
            });
            setIsRestoring(false);
          },
        });
      }
    });
  };

  // Handle bulk download resumes (MERGED PDF)
  const handleBulkDownload = async () => {
    if (selectedApps.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Applications Selected',
        text: 'Please select at least one application to download resumes.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsDownloading(true);

    Swal.fire({
      title: 'Preparing Resumes...',
      text: selectedApps.length === 1
        ? 'Downloading resume...'
        : `Merging ${selectedApps.length} resumes into one PDF...`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(route('backend.applications.bulk-download'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/pdf, application/zip, application/octet-stream',
        },
        body: JSON.stringify({
          application_ids: selectedApps,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Download failed (${response.status})`);
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `resumes_${selectedApps.length}_files.zip`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {
            // Use as is
          }
        }
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'Download Started!',
        text: selectedApps.length === 1
          ? 'Resume downloaded successfully.'
          : `${selectedApps.length} files downloaded.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Bulk download error:', error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: error?.message || 'Failed to download resumes. Please try again.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle single resume download
  const handleDownloadResume = (appId) => {
    window.location.href = route('backend.applications.download', appId);
  };

  // Handle single delete
  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'Delete Application?',
      text: `Are you sure you want to delete application from "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('backend.applications.destroy', id), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Application moved to trash.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload({ preserveScroll: true });
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: errors?.message || 'Failed to delete application.',
              confirmButtonColor: '#d33',
            });
          },
        });
      }
    });
  };

  // Handle restore
  const handleRestore = (id, name) => {
    Swal.fire({
      title: 'Restore Application?',
      text: `Restore application from "${name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        router.post(route('backend.applications.restore', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: 'Application restored successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload({ preserveScroll: true });
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Restore Failed',
              text: errors?.message || 'Failed to restore application.',
              confirmButtonColor: '#d33',
            });
          },
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
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaHourglassHalf className="text-yellow-500" size={14} />,
      shortlisted: <FaUserCheck className="text-blue-500" size={14} />,
      rejected: <FaUserSlash className="text-red-500" size={14} />,
      hired: <FaCheckCircle className="text-green-500" size={14} />
    };
    return icons[status] || <FaBriefcase className="text-gray-500" size={14} />;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      shortlisted: 'Shortlisted',
      rejected: 'Rejected',
      hired: 'Hired'
    };
    return texts[status] || status;
  };

  const getAtsScoreColor = (score) => {
    if (score === undefined || score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAtsScoreBg = (score) => {
    if (score === undefined || score === null) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatSalary = (salary) => {
    if (!salary) return null;
    return new Intl.NumberFormat('en-US').format(salary) + ' BDT';
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return Object.keys(filters).some(key =>
      filters[key] !== '' && filters[key] !== null && filters[key] !== undefined && key !== 'per_page'
    );
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(key =>
      filters[key] !== '' && filters[key] !== null && filters[key] !== undefined && key !== 'per_page'
    ).length;
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
        confirmButtonColor: '#d33',
      });
    }
  }, [flash]);

  const pendingCount = statusCounts?.pending || 0;
  const shortlistedCount = statusCounts?.shortlisted || 0;
  const rejectedCount = statusCounts?.rejected || 0;
  const hiredCount = statusCounts?.hired || 0;
  const deletedCount = statusCounts?.deleted || 0;
  const totalCount = totalApplications || 0;

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-400 ml-1" size={12} />;
    return sortDirection === 'asc' ?
      <FaSortUp className="text-blue-600 ml-1" size={12} /> :
      <FaSortDown className="text-blue-600 ml-1" size={12} />;
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
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{pagination.from || 0}</span> to{' '}
            <span className="font-medium">{pagination.to || 0}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> applications
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Show:</label>
            <select
              value={filters.per_page}
              onChange={handlePerPageChange}
              className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">7</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
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

  return (
    <AuthenticatedLayout>
      <Head title="All Applications" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
        <div className="mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                All Applications
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and review all job applications across all listings
              </p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Pending: {pendingCount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Shortlisted: {shortlistedCount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Rejected: {rejectedCount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Hired: {hiredCount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Deleted: {deletedCount}
                </span>
                {hasActiveFilters() && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Filtered ({getActiveFilterCount()})
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
                    {getActiveFilterCount()}
                  </span>
                )}
                {showFilters ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* BULK ACTIONS BAR */}
          {selectedApps.length > 0 && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 mb-6 animate-fade-in border border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <FaCheckDouble className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-900">
                    {selectedApps.length} application(s) selected
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Email Button - Added */}
                  <button
                    onClick={handleOpenBulkEmail}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-700 transition-all duration-200"
                  >
                    <FaEnvelope size={14} />
                    Send Email
                  </button>

                  {filters.trashed === 'only' ? (
                    <button
                      onClick={handleBulkRestore}
                      disabled={isRestoring}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {isRestoring ? <FaSpinner className="animate-spin" size={14} /> : <FaTrashRestore size={14} />}
                      Restore All
                    </button>
                  ) : (
                    <>
                      <select
                        onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                        disabled={isUpdatingStatus}
                        className="px-4 py-2 text-sm border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                        defaultValue=""
                      >
                        <option value="" disabled>Bulk Update Status</option>
                        {statuses.map(status => (
                          <option key={status} value={status}>
                            Mark as {getStatusText(status)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleBulkDownload}
                        disabled={isDownloading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700 transition-all duration-200 disabled:opacity-50"
                      >
                        {isDownloading ? <FaSpinner className="animate-spin" size={14} /> : <FaDownload size={14} />}
                        Download Resumes
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                      >
                        {isDeleting ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                        Delete All
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedApps([])}
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
                <h3 className="text-lg font-semibold text-gray-900">Filter Applications</h3>
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
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Name, email, or phone..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {getStatusText(status)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job</label>
                  <select
                    value={filters.job_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, job_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Jobs</option>
                    {jobs?.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories?.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <select
                    value={filters.job_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, job_type: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {jobTypes?.map(type => (
                      <option key={type} value={type}>
                        {type.replace(/-/g, ' ').charAt(0).toUpperCase() + type.replace(/-/g, ' ').slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={filters.location_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, location_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Locations</option>
                    {locations?.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Education Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                  <select
                    value={filters.education_level}
                    onChange={(e) => setFilters(prev => ({ ...prev, education_level: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    {Object.entries(educationLevels || {}).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ATS Score Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ATS Score Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.min_ats_score}
                      onChange={(e) => setFilters(prev => ({ ...prev, min_ats_score: e.target.value }))}
                      placeholder={`Min (${filterOptions?.ats?.min || 0})`}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={filterOptions?.ats?.min || 0}
                      max={filterOptions?.ats?.max || 100}
                    />
                    <input
                      type="number"
                      value={filters.max_ats_score}
                      onChange={(e) => setFilters(prev => ({ ...prev, max_ats_score: e.target.value }))}
                      placeholder={`Max (${filterOptions?.ats?.max || 100})`}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={filterOptions?.ats?.min || 0}
                      max={filterOptions?.ats?.max || 100}
                    />
                  </div>
                </div>

                {/* Experience Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.min_experience}
                      onChange={(e) => setFilters(prev => ({ ...prev, min_experience: e.target.value }))}
                      placeholder={`Min (${filterOptions?.experience?.min || 0})`}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={filterOptions?.experience?.min || 0}
                      max={filterOptions?.experience?.max || 30}
                    />
                    <input
                      type="number"
                      value={filters.max_experience}
                      onChange={(e) => setFilters(prev => ({ ...prev, max_experience: e.target.value }))}
                      placeholder={`Max (${filterOptions?.experience?.max || 30})`}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={filterOptions?.experience?.min || 0}
                      max={filterOptions?.experience?.max || 30}
                    />
                  </div>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Salary (BDT)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.min_salary}
                      onChange={(e) => setFilters(prev => ({ ...prev, min_salary: e.target.value }))}
                      placeholder={`Min (${(filterOptions?.salary?.min || 0).toLocaleString()})`}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={filters.max_salary}
                      onChange={(e) => setFilters(prev => ({ ...prev, max_salary: e.target.value }))}
                      placeholder={`Max (${(filterOptions?.salary?.max || 500000).toLocaleString()})`}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Date Range Preset */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={filters.date_range}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_range: e.target.value, date_from: '', date_to: '' }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {dateRangeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value, date_range: '' }))}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value, date_range: '' }))}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Trash Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Show</label>
                  <select
                    value={filters.trashed}
                    onChange={(e) => setFilters(prev => ({ ...prev, trashed: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {trashOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Apply Filters
                </button>
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
                        checked={applicationItems.length > 0 && selectedApps.length === applicationItems.filter(app => !app.deleted_at).length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={applicationItems.filter(app => !app.deleted_at).length === 0}
                      />
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Applicant
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Job Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('ats_score')}
                    >
                      <div className="flex items-center">
                        ATS Score
                        {getSortIcon('ats_score')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('expected_salary')}
                    >
                      <div className="flex items-center">
                        Expected Salary
                        {getSortIcon('expected_salary')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Applied On
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {applicationItems.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaBriefcase className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {hasActiveFilters() ? 'Try adjusting your filters.' : 'No applications have been submitted yet.'}
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

                  {applicationItems.map((app, index) => {
                    const trashed = app.deleted_at !== null;
                    const atsPercentage = app.ats_percentage || app.calculated_ats_score;

                    return (
                      <tr
                        key={app.id}
                        className={`hover:bg-gray-50 transition-all duration-200 animate-fade-in ${trashed ? 'bg-gray-50 opacity-75' : ''} ${selectedApps.includes(app.id) ? 'bg-blue-50' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-4 py-4">
                          {!trashed && (
                            <input
                              type="checkbox"
                              checked={selectedApps.includes(app.id)}
                              onChange={() => handleSelectApp(app.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                        </td>

                        {/* APPLICANT */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                              {app.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className={`font-semibold ${trashed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {app.name}
                              </div>
                              <div className={`text-xs mt-0.5 ${trashed ? 'text-gray-400' : 'text-gray-500'}`}>
                                {app.years_of_experience ? `${app.years_of_experience} yrs exp` : 'Experience N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* JOB DETAILS */}
                        <td className="px-6 py-4">
                          <div>
                            <div className={`font-medium ${trashed ? 'text-gray-400' : 'text-gray-900'}`}>
                              {app.job_listing?.title}
                            </div>
                            <div className={`text-xs mt-0.5 flex items-center gap-1 ${trashed ? 'text-gray-400' : 'text-gray-500'}`}>
                              <FaRegBuilding size={10} />
                              {app.job_listing?.employer?.name || 'Company'}
                            </div>
                            {app.job_listing?.job_type && (
                              <div className={`text-xs mt-0.5 ${trashed ? 'text-gray-400' : 'text-gray-400'}`}>
                                {app.job_listing.job_type?.replace(/-/g, ' ')}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* CONTACT */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className={`flex items-center gap-1 text-sm ${trashed ? 'text-gray-400' : 'text-gray-600'}`}>
                              <FaEnvelope size={12} className="text-gray-400" />
                              <a href={`mailto:${app.email}`} className={`hover:text-blue-600 truncate max-w-36 ${trashed ? 'pointer-events-none' : ''}`}>
                                {app.email}
                              </a>
                            </div>
                            {app.phone && (
                              <div className={`flex items-center gap-1 text-sm ${trashed ? 'text-gray-400' : 'text-gray-600'}`}>
                                <FaPhone size={12} className="text-gray-400" />
                                {app.phone}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* ATS SCORE */}
                        <td className="px-6 py-4">
                          {atsPercentage !== undefined && atsPercentage !== null ? (
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getAtsScoreBg(atsPercentage)} ${getAtsScoreColor(atsPercentage)}`}>
                              <FaChartLine size={10} />
                              {Math.round(atsPercentage)}%
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not calculated</span>
                          )}
                        </td>

                        {/* EXPECTED SALARY */}
                        <td className="px-6 py-4">
                          {app.expected_salary ? (
                            <span className={`text-sm font-medium ${trashed ? 'text-gray-400' : 'text-green-600'}`}>
                              {formatSalary(app.expected_salary)}
                            </span>
                          ) : (
                            <span className={`text-sm ${trashed ? 'text-gray-400' : 'text-gray-400'}`}>
                              Not specified
                            </span>
                          )}
                        </td>

                        {/* APPLIED ON */}
                        <td className="px-6 py-4">
                          <div className={`text-sm ${trashed ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatDate(app.created_at)}
                          </div>
                          {trashed && app.deleted_at && (
                            <div className="text-xs text-red-500 mt-1">
                              Deleted: {formatDate(app.deleted_at)}
                            </div>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4">
                          {!trashed ? (
                            <div className="flex items-center gap-2">
                              {getStatusIcon(app.status)}
                              <span className={`text-xs font-medium rounded-full px-2 py-1 ${getStatusBadge(app.status)}`}>
                                {getStatusText(app.status)}
                              </span>
                            </div>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">
                              Deleted
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            {/* Email Button - Individual */}
                            {!trashed && (
                              <button
                                onClick={() => {
                                  const applicant = {
                                    id: app.id,
                                    name: app.name,
                                    email: app.email,
                                    job_title: app.job_listing?.title
                                  };
                                  openEmailModal(applicant, `Send Email to ${app.name}`);
                                }}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                                title="Send Email"
                              >
                                <FaEnvelope size={16} />
                              </button>
                            )}

                            {!trashed && (
                              <Link
                                href={route('backend.applications.show', app.id)}
                                className="p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                title="View Details"
                              >
                                <FaEye size={18} />
                              </Link>
                            )}

                            {!trashed && (
                              <button
                                onClick={() => handleDownloadResume(app.id)}
                                className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                                title="Download Resume"
                              >
                                <FaFilePdf size={18} />
                              </button>
                            )}

                            {trashed && (
                              <button
                                onClick={() => handleRestore(app.id, app.name)}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                                title="Restore"
                              >
                                <FaTrashRestore size={18} />
                              </button>
                            )}

                            {!trashed && (
                              <button
                                onClick={() => handleDelete(app.id, app.name)}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Delete"
                              >
                                <FaTrash size={18} />
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

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={closeEmailModal}
        recipients={emailRecipients}
        title={emailModalTitle}
        jobTitle="Job Application"
        onSuccess={() => {
          Swal.fire({
            icon: 'success',
            title: 'Email Sent!',
            text: 'The email has been sent successfully.',
            timer: 2000,
            showConfirmButton: false
          });
        }}
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
        `}</style>
    </AuthenticatedLayout>
  );
}