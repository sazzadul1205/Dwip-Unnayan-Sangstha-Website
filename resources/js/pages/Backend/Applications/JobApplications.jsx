/* eslint-disable no-useless-escape */
// resources/js/pages/Backend/Applications/JobApplications.jsx

// React
import { useState, useEffect } from 'react';

// Inertia
import { Head, router, usePage, Link } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Components
import EmailModal from '../../../components/EmailModal';

// Hooks
import useEmailModal from '../../../hooks/useEmailModal';

// Auth
import { useAuth } from '../../../hooks/useAuth';

// Icons
import {
  FaArrowLeft,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaFilePdf,
  FaFilter,
  FaHourglassHalf,
  FaPhone,
  FaSpinner,
  FaTimes,
  FaUserCheck,
  FaUserSlash,
  FaChevronDown,
  FaChevronUp,
  FaCheckDouble,
  FaFileExcel,
  FaFileCsv,
  FaCheckCircle,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaShieldAlt,
  FaExclamationTriangle,
} from 'react-icons/fa';

import Swal from 'sweetalert2';

export default function JobApplications({
  job,
  filterOptions = {},
  filters: initialFilters = {},
  applications: initialApplications,
}) {
  // Auth
  const { flash } = usePage().props;

  const safeInitialFilters = (initialFilters && !Array.isArray(initialFilters)) ? initialFilters : {};

  // States
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedApps, setSelectedApps] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [pendingDeletes, setPendingDeletes] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [applications, setApplications] = useState(initialApplications);
  const [sortField, setSortField] = useState(safeInitialFilters.sort || 'created_at');
  const [sortDirection, setSortDirection] = useState(safeInitialFilters.direction || 'desc');

  // Use the email modal hook
  const {
    isEmailModalOpen,
    emailRecipients,
    emailModalTitle,
    openEmailModal,
    closeEmailModal,
  } = useEmailModal();

  // Comprehensive filter states
  const [filters, setFilters] = useState({
    status: safeInitialFilters.status || '',
    search: safeInitialFilters.search || '',
    min_ats_score: safeInitialFilters.min_ats_score || '',
    max_ats_score: safeInitialFilters.max_ats_score || '',
    min_experience: safeInitialFilters.min_experience || '',
    max_experience: safeInitialFilters.max_experience || '',
    min_salary: safeInitialFilters.min_salary || '',
    max_salary: safeInitialFilters.max_salary || '',
    education_level: safeInitialFilters.education_level || '',
    date_from: safeInitialFilters.date_from || '',
    date_to: safeInitialFilters.date_to || '',
    date_range: safeInitialFilters.date_range || '',
  });

  // Use centralized auth hook
  const {
    user: currentUser,
    hasAnyPermission,
    hasRole,
  } = useAuth();

  // ---- Check if job is deleted ----
  const isJobDeleted = job?.deleted_at !== null;

  // Show flash messages
  useEffect(() => {
    if (flash?.success && Object.keys(pendingUpdates).length === 0 && Object.keys(pendingDeletes).length === 0) {
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
  }, [flash, pendingDeletes, pendingUpdates]);

  // Check permissions for application management
  const isEmployer = hasRole('employer') || hasRole('employer-admin');
  const canViewApplications = hasAnyPermission(['applications.view', 'applications.manage']);
  const canExportApplications = hasAnyPermission(['applications.export', 'applications.manage']);
  const canDeleteApplications = hasAnyPermission(['applications.destroy', 'applications.manage']);
  const canEmailApplicants = hasAnyPermission(['applications.email.send', 'applications.manage']);
  const canDownloadResumes = hasAnyPermission(['applications.download_resume', 'applications.manage']);
  const canUpdateApplications = hasAnyPermission(['applications.status.update', 'applications.manage']);

  // Check if user owns this job
  const isJobOwner = isEmployer && currentUser?.id === job?.user_id;

  // If user doesn't have permission to view applications and doesn't own the job, show access denied
  if (!canViewApplications && !isJobOwner) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to view applications for this job.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

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

  // Education levels
  const educationLevels = {
    high_school: 'High School',
    associate: 'Associate Degree',
    bachelor: "Bachelor's Degree",
    master: "Master's Degree",
    phd: 'PhD',
    other: 'Other'
  };

  // Get applications array from paginated response
  const applicationItems = applications?.data || [];

  // Get selected application objects
  const getSelectedApplicants = () => {
    return applicationItems.filter(app => selectedApps.includes(app.id));
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
    router.get(route('backend.applications.job', job.id), buildQueryParams(1), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setShowFilters(false);
        setSelectedApps([]);
        setPendingUpdates({});
        setPendingDeletes({});
      },
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: '',
      search: '',
      min_ats_score: '',
      max_ats_score: '',
      min_experience: '',
      max_experience: '',
      min_salary: '',
      max_salary: '',
      education_level: '',
      date_from: '',
      date_to: '',
      date_range: '',
    });
    setSortField('created_at');
    setSortDirection('desc');

    router.get(route('backend.applications.job', job.id), { page: 1 }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setShowFilters(false);
        setSelectedApps([]);
        setPendingUpdates({});
        setPendingDeletes({});
      },
    });
  };

  // Handle sort
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);

    router.get(route('backend.applications.job', job.id), buildQueryParams(1, { sort: field, direction: newDirection }), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setSelectedApps([]);
        setPendingUpdates({});
        setPendingDeletes({});
      },
    });
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page === pagination?.currentPage) return;
    if (page < 1 || page > pagination?.lastPage) return;

    router.get(route('backend.applications.job', job.id), buildQueryParams(page), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setSelectedApps([]);
        setPendingUpdates({});
        setPendingDeletes({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Handle select all applications (only if user has update permission and job is not deleted)
  const handleSelectAll = () => {
    if (isJobDeleted) return;
    const selectableApps = applicationItems.filter(app => !pendingDeletes[app.id] && canUpdateApplications);
    if (selectedApps.length === selectableApps.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(selectableApps.map(app => app.id));
    }
  };

  // Handle select single application
  const handleSelectApp = (appId) => {
    if (isJobDeleted) return;
    setSelectedApps(prev =>
      prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  // Open email modal for bulk
  const handleOpenBulkEmail = () => {
    if (isJobDeleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Job Deleted',
        text: 'This job has been deleted. You cannot send emails.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    if (!canEmailApplicants) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to send emails to applicants.',
        confirmButtonColor: '#d33',
      });
      return;
    }

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

  // Open email modal for single applicant
  const handleOpenSingleEmail = (applicant) => {
    if (isJobDeleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Job Deleted',
        text: 'This job has been deleted. You cannot send emails.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    if (!canEmailApplicants) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to send emails to applicants.',
        confirmButtonColor: '#d33',
      });
      return;
    }
    openEmailModal(applicant, `Send Email to ${applicant.name}`);
  };

  // Helper function to extract filename from Content-Disposition header
  const extractFilenameFromDisposition = (contentDisposition) => {
    if (!contentDisposition) return null;

    const filenameStarMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (filenameStarMatch?.[1]) {
      try {
        return decodeURIComponent(filenameStarMatch[1].replace(/(^\"|\"$)/g, ''));
      } catch {
        return filenameStarMatch[1].replace(/(^\"|\"$)/g, '');
      }
    }

    const filenameMatch = contentDisposition.match(/filename\s*=\s*\"?([^\";]+)\"?/i);
    return filenameMatch?.[1] ?? null;
  };

  // Helper function to sanitize filename
  const safeFilename = (name) => {
    if (!name) return 'Resume';
    return name
      .toString()
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_') || 'Resume';
  };

  // Handle bulk export
  const handleExport = (format) => {
    if (isJobDeleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Job Deleted',
        text: 'This job has been deleted. You cannot export applications.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    if (!canExportApplications) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to export applications.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    if (applicationItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data to Export',
        text: 'There are no applications to export.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);

    const formData = new FormData();
    formData.append('format', format);

    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        formData.append(key, filters[key]);
      }
    });
    formData.append('sort', sortField);
    formData.append('direction', sortDirection);

    fetch(route('backend.applications.export', job.id), {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      },
    })
      .then(response => {
        if (!response.ok) throw new Error('Export failed');
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `applications_${job.title}_${Date.now()}.${format}`;
        if (contentDisposition) {
          const extracted = extractFilenameFromDisposition(contentDisposition);
          if (extracted) filename = extracted;
        }
        return response.blob().then(blob => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        Swal.fire({
          icon: 'success',
          title: 'Export Started!',
          text: 'Your file will download shortly.',
          timer: 1500,
          showConfirmButton: false,
        });
      })
      .catch(error => {
        console.error('Export error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Export Failed',
          text: 'Failed to export applications. Please try again.',
          confirmButtonColor: '#d33',
        });
      })
      .finally(() => setIsExporting(false));
  };

  // Handle bulk delete with optimistic update
  const handleBulkDelete = () => {
    if (isJobDeleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Job Deleted',
        text: 'This job has been deleted. You cannot delete applications.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    if (!canDeleteApplications) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to delete applications.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    if (selectedApps.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Applications Selected',
        text: 'Please select at least one application to delete.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Applications',
      text: `Are you sure you want to delete ${selectedApps.length} application(s)? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const originalApplications = JSON.parse(JSON.stringify(applications));

        const deleteKeys = {};
        selectedApps.forEach(appId => {
          deleteKeys[appId] = true;
        });
        setPendingDeletes(prev => ({ ...prev, ...deleteKeys }));

        const updatedApplications = {
          ...applications,
          data: applications.data.filter(app => !selectedApps.includes(app.id))
        };
        setApplications(updatedApplications);

        setIsDeleting(true);

        router.post(route('backend.applications.bulk-delete'), {
          application_ids: selectedApps,
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `${selectedApps.length} application(s) have been deleted.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedApps([]);
            setIsDeleting(false);

            setPendingDeletes(prev => {
              const newPending = { ...prev };
              selectedApps.forEach(id => delete newPending[id]);
              return newPending;
            });
          },
          onError: (error) => {
            setApplications(originalApplications);
            setPendingDeletes(prev => {
              const newPending = { ...prev };
              selectedApps.forEach(id => delete newPending[id]);
              return newPending;
            });
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: error?.message || 'Failed to delete applications.',
            });
            setIsDeleting(false);
          }
        });
      }
    });
  };

  // Handle single delete with optimistic update
  const handleDeleteSingle = (appId, applicantName) => {
    if (isJobDeleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Job Deleted',
        text: 'This job has been deleted. You cannot delete applications.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    if (!canDeleteApplications) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to delete applications.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Application?',
      text: `Are you sure you want to delete ${applicantName}'s application? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const originalApplications = JSON.parse(JSON.stringify(applications));

        setPendingDeletes(prev => ({ ...prev, [appId]: true }));

        const updatedApplications = {
          ...applications,
          data: applications.data.filter(app => app.id !== appId)
        };
        setApplications(updatedApplications);

        router.delete(route('backend.applications.destroy', appId), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Application deleted successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            setPendingDeletes(prev => {
              const newPending = { ...prev };
              delete newPending[appId];
              return newPending;
            });
            if (selectedApps.includes(appId)) {
              setSelectedApps(prev => prev.filter(id => id !== appId));
            }
          },
          onError: (error) => {
            setApplications(originalApplications);
            setPendingDeletes(prev => {
              const newPending = { ...prev };
              delete newPending[appId];
              return newPending;
            });
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: error?.message || 'Failed to delete application.',
              confirmButtonColor: '#d33',
            });
          },
        });
      }
    });
  };

  // Handle bulk status update with optimistic update
  const handleBulkStatusUpdate = (newStatus) => {
    if (isJobDeleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Job Deleted',
        text: 'This job has been deleted. You cannot update statuses.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    if (!canUpdateApplications) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to update application statuses.',
        confirmButtonColor: '#d33',
      });
      return;
    }

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
      text: `Are you sure you want to change ${selectedApps.length} application(s) status to ${newStatus}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const originalApplications = JSON.parse(JSON.stringify(applications));

        const updateKeys = {};
        selectedApps.forEach(appId => {
          updateKeys[appId] = newStatus;
        });
        setPendingUpdates(prev => ({ ...prev, ...updateKeys }));

        const updatedApplications = {
          ...applications,
          data: applications.data.map(app =>
            selectedApps.includes(app.id) ? { ...app, status: newStatus } : app
          )
        };
        setApplications(updatedApplications);

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
              text: `${selectedApps.length} application(s) status updated to ${newStatus}.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedApps([]);
            setIsUpdatingStatus(false);

            setPendingUpdates(prev => {
              const newPending = { ...prev };
              selectedApps.forEach(id => delete newPending[id]);
              return newPending;
            });
          },
          onError: (error) => {
            setApplications(originalApplications);
            setPendingUpdates(prev => {
              const newPending = { ...prev };
              selectedApps.forEach(id => delete newPending[id]);
              return newPending;
            });
            Swal.fire({
              icon: 'error',
              title: 'Update Failed',
              text: error?.message || 'Failed to update statuses.',
            });
            setIsUpdatingStatus(false);
          }
        });
      }
    });
  };

  // Handle bulk download resumes (MERGED PDF)
  const handleBulkDownload = async () => {
    if (isJobDeleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Job Deleted',
        text: 'This job has been deleted. You cannot download resumes.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    if (!canDownloadResumes) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to download resumes.',
        confirmButtonColor: '#d33',
      });
      return;
    }

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
      const serverFilename = extractFilenameFromDisposition(contentDisposition);

      let filename;
      if (serverFilename) {
        filename = serverFilename;
      } else if (selectedApps.length === 1) {
        const app = applicationItems.find(a => a.id === selectedApps[0]);
        filename = `Resume_${safeFilename(app?.name || 'applicant')}.pdf`;
      } else {
        const jobTitle = safeFilename(job.title || 'job');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        filename = `Resumes_${jobTitle}_${timestamp}.pdf`;
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
        title: 'Download Complete!',
        text: selectedApps.length === 1
          ? 'Resume downloaded successfully.'
          : `${selectedApps.length} resumes merged and downloaded.`,
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
  const handleDownloadResume = async (app) => {
    if (isJobDeleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Job Deleted',
        text: 'This job has been deleted. You cannot download resumes.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    if (!canDownloadResumes) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to download resumes.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    try {
      const url = route('backend.applications.download_resume', app.id);
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }

      const contentDisposition = response.headers.get('content-disposition');
      const serverFilename = extractFilenameFromDisposition(contentDisposition);
      const serverExt = serverFilename?.split('.').pop();

      const ext = serverExt && serverExt.length <= 6 ? serverExt : 'pdf';
      const desiredFilename = `Resume_${safeFilename(app.name)}.${ext}`;

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = desiredFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: e?.message || 'Failed to download resume.',
        confirmButtonColor: '#d33',
      });
    }
  };

  // Handle single status update with optimistic update (✅ FIXED ROUTE NAME)
  const handleStatusUpdate = (appId, newStatus) => {
    if (isJobDeleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Job Deleted',
        text: 'This job has been deleted. You cannot update statuses.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    if (!canUpdateApplications) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to update application statuses.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    const originalApplications = JSON.parse(JSON.stringify(applications));

    setPendingUpdates(prev => ({ ...prev, [appId]: newStatus }));

    const updatedApplications = {
      ...applications,
      data: applications.data.map(app =>
        app.id === appId ? { ...app, status: newStatus } : app
      )
    };
    setApplications(updatedApplications);

    // ✅ CORRECT ROUTE NAME
    router.put(route('backend.applications.update-status', appId), {
      status: newStatus,
      notes: `Status updated to ${newStatus}`,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setPendingUpdates(prev => {
          const newPending = { ...prev };
          delete newPending[appId];
          return newPending;
        });

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Application status updated successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      onError: (error) => {
        setApplications(originalApplications);
        setPendingUpdates(prev => {
          const newPending = { ...prev };
          delete newPending[appId];
          return newPending;
        });
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: error?.message || 'Failed to update status.',
          confirmButtonColor: '#d33',
        });
      },
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

  // Get status badge
  const getStatusBadge = (status, isPending = false) => {
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
          <FaSpinner className="animate-spin" size={10} />
          Updating...
        </span>
      );
    }

    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-purple-100 text-purple-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaHourglassHalf className="text-yellow-500" size={14} />,
      shortlisted: <FaUserCheck className="text-green-500" size={14} />,
      rejected: <FaUserSlash className="text-red-500" size={14} />,
      hired: <FaCheckCircle className="text-purple-500" size={14} />
    };
    return icons[status] || <FaBriefcase className="text-gray-500" size={14} />;
  };

  // Get status text
  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      shortlisted: 'Shortlisted',
      rejected: 'Rejected',
      hired: 'Hired'
    };
    return texts[status] || status;
  };

  // Get ATS score color
  const getAtsScoreColor = (score) => {
    if (score === undefined || score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get ATS score background
  const getAtsScoreBg = (score) => {
    if (score === undefined || score === null) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Format salary
  const formatSalary = (salary) => {
    if (!salary) return null;
    return `${new Intl.NumberFormat('en-US').format(salary)} BDT`;
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return Object.keys(filters).some(key =>
      filters[key] !== '' && filters[key] !== null && filters[key] !== undefined
    );
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(key =>
      filters[key] !== '' && filters[key] !== null && filters[key] !== undefined
    ).length;
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-400 ml-1" size={12} />;
    return sortDirection === 'asc' ?
      <FaSortUp className="text-blue-600 ml-1" size={12} /> :
      <FaSortDown className="text-blue-600 ml-1" size={12} />;
  };

  // Filter out deleted applications from display
  const visibleApplications = applicationItems.filter(app => !pendingDeletes[app.id]);

  // Get status counts from visible applications
  const pendingCount = visibleApplications.filter(app => app.status === 'pending').length;
  const shortlistedCount = visibleApplications.filter(app => app.status === 'shortlisted').length;
  const rejectedCount = visibleApplications.filter(app => app.status === 'rejected').length;
  const hiredCount = visibleApplications.filter(app => app.status === 'hired').length;
  const totalCount = visibleApplications.length;

  // Check if user can perform bulk actions (and job is not deleted)
  const canBulkEmail = !isJobDeleted && canEmailApplicants && selectedApps.length > 0;
  const canBulkStatusUpdate = !isJobDeleted && canUpdateApplications && selectedApps.length > 0;
  const canBulkDownload = !isJobDeleted && canDownloadResumes && selectedApps.length > 0;
  const canBulkDelete = !isJobDeleted && canDeleteApplications && selectedApps.length > 0;

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
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{pagination.from || 0}</span> to{' '}
            <span className="font-medium">{pagination.to || 0}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> applications
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
      <Head title={`Applications for ${job.title}`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
        <div className=" mx-auto">
          {/* HEADER */}
          <div className="mb-6">
            <Link
              href={route('backend.listing.index')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <FaArrowLeft className="mr-2" size={14} />
              Back to Job Listings
            </Link>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {job.title}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <FaBuilding size={12} />
                    {job.employer?.name || 'Company'}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <FaCalendarAlt size={12} />
                    Posted: {formatDate(job.created_at)}
                  </span>
                  {isJobOwner && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Your Job
                    </span>
                  )}
                  {isJobDeleted && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Deleted
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Pending: {pendingCount}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Shortlisted: {shortlistedCount}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Rejected: {rejectedCount}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Hired: {hiredCount}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Total: {totalCount}
                  </span>
                  {hasActiveFilters() && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Filtered ({getActiveFilterCount()})
                    </span>
                  )}
                  {pagination && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      Page Total: {pagination.total}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {/* Export Dropdown Button */}
                {canExportApplications && !isJobDeleted && (
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      disabled={isExporting || applicationItems.length === 0}
                      className="px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {isExporting ? (
                        <FaSpinner className="animate-spin" size={14} />
                      ) : (
                        <FaFileExcel size={14} />
                      )}
                      Export Data
                      <FaChevronDown size={12} />
                    </button>

                    {showExportMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowExportMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-20 border border-gray-200 overflow-hidden">
                          <button
                            onClick={() => handleExport('xlsx')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <FaFileExcel className="text-green-600" size={16} />
                            Export as Excel (.xlsx)
                          </button>
                          <button
                            onClick={() => handleExport('csv')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100 transition-colors"
                          >
                            <FaFileCsv className="text-blue-600" size={16} />
                            Export as CSV (.csv)
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

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
          </div>

          {/* --- JOB DELETED WARNING BANNER --- */}
          {isJobDeleted && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-fade-in">
              <FaExclamationTriangle className="text-red-600 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-red-800">
                  ⚠️ This job listing has been deleted.
                </p>
                <p className="text-xs text-red-600 mt-1">
                  These applications are for reference only. All actions (status updates, emails, downloads, deletions) are disabled because the job is no longer active.
                </p>
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

                {/* Education Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                  <select
                    value={filters.education_level}
                    onChange={(e) => setFilters(prev => ({ ...prev, education_level: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    {Object.entries(educationLevels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
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

          {/* BULK ACTIONS BAR */}
          {selectedApps.length > 0 && !isJobDeleted && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 mb-6 animate-fade-in border border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <FaCheckDouble className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-900">
                    {selectedApps.length} application(s) selected
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {canBulkEmail && (
                    <button
                      onClick={handleOpenBulkEmail}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-700 transition-all duration-200"
                    >
                      <FaEnvelope size={14} />
                      Send Email
                    </button>
                  )}

                  {canBulkStatusUpdate && (
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
                  )}

                  {canBulkDownload && (
                    <button
                      onClick={handleBulkDownload}
                      disabled={isDownloading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <FaSpinner className="animate-spin" size={14} />
                      ) : selectedApps.length > 1 ? (
                        <FaFilePdf size={14} />
                      ) : (
                        <FaDownload size={14} />
                      )}
                      {isDownloading
                        ? 'Downloading...'
                        : selectedApps.length > 1
                          ? 'Download Merged PDF'
                          : 'Download Resume'
                      }
                    </button>
                  )}

                  {canBulkDelete && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {isDeleting ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                      Delete All
                    </button>
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

          {/* TABLE CARD */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-linear-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      {!isJobDeleted && canUpdateApplications && (
                        <input
                          type="checkbox"
                          checked={visibleApplications.length > 0 && selectedApps.length === visibleApplications.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          disabled={visibleApplications.length === 0}
                        />
                      )}
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
                      onClick={() => handleSort('years_of_experience')}
                    >
                      <div className="flex items-center">
                        Experience
                        {getSortIcon('years_of_experience')}
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
                  {visibleApplications.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaBriefcase className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {hasActiveFilters() ? 'Try adjusting your filters.' : 'No applications have been submitted for this job yet.'}
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

                  {visibleApplications.map((app, index) => {
                    const atsScore = app.calculated_ats_score || app.ats_score?.percentage;
                    const isPending = pendingUpdates[app.id] !== undefined;
                    const displayStatus = isPending ? pendingUpdates[app.id] : app.status;

                    return (
                      <tr
                        key={app.id}
                        className={`hover:bg-gray-50 transition-all duration-200 animate-fade-in ${selectedApps.includes(app.id) ? 'bg-blue-50' : ''} ${isPending ? 'opacity-70' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-4 py-4">
                          {!isJobDeleted && canUpdateApplications && (
                            <input
                              type="checkbox"
                              checked={selectedApps.includes(app.id)}
                              onChange={() => handleSelectApp(app.id)}
                              disabled={isPending}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
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
                              <div className={`font-semibold ${isPending ? 'text-gray-500' : 'text-gray-900'}`}>
                                {app.name}
                              </div>
                              <div className="text-xs mt-0.5 text-gray-500">
                                ID: #{app.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className={`flex items-center gap-1 text-sm ${isPending ? 'text-gray-400' : 'text-gray-600'}`}>
                              <FaEnvelope size={12} className="text-gray-400" />
                              <a href={`mailto:${app.email}`} className={`hover:text-blue-600 truncate max-w-36 ${isPending ? 'pointer-events-none' : ''}`}>
                                {app.email}
                              </a>
                            </div>
                            {app.phone && (
                              <div className={`flex items-center gap-1 text-sm ${isPending ? 'text-gray-400' : 'text-gray-600'}`}>
                                <FaPhone size={12} className="text-gray-400" />
                                {app.phone}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* ATS SCORE */}
                        <td className="px-6 py-4">
                          {atsScore !== undefined && atsScore !== null ? (
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getAtsScoreBg(atsScore)} ${getAtsScoreColor(atsScore)}`}>
                              <FaChartLine size={10} />
                              {Math.round(atsScore)}%
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not calculated</span>
                          )}
                        </td>

                        {/* EXPECTED SALARY */}
                        <td className="px-6 py-4">
                          {app.expected_salary ? (
                            <span className={`text-sm font-medium ${isPending ? 'text-gray-400' : 'text-green-600'}`}>
                              {formatSalary(app.expected_salary)}
                            </span>
                          ) : (
                            <span className={`text-sm ${isPending ? 'text-gray-400' : 'text-gray-400'}`}>
                              Not specified
                            </span>
                          )}
                        </td>

                        {/* EXPERIENCE */}
                        <td className="px-6 py-4">
                          {app.years_of_experience ? (
                            <span className={`text-sm ${isPending ? 'text-gray-400' : 'text-gray-700'}`}>
                              {app.years_of_experience} {app.years_of_experience === 1 ? 'year' : 'years'}
                            </span>
                          ) : (
                            <span className={`text-sm ${isPending ? 'text-gray-400' : 'text-gray-400'}`}>
                              Not specified
                            </span>
                          )}
                        </td>

                        {/* APPLIED ON */}
                        <td className="px-6 py-4">
                          <span className={`text-sm ${isPending ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatDate(app.created_at)}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4">
                          {!isPending ? (
                            <div className="flex items-center gap-2">
                              {getStatusIcon(app.status)}
                              <span className={`text-xs font-medium rounded-full px-2 py-1 ${getStatusBadge(app.status)}`}>
                                {getStatusText(app.status)}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                              <FaSpinner className="animate-spin" size={10} />
                              Updating...
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            {!isJobDeleted && canUpdateApplications && (
                              <select
                                value={displayStatus}
                                onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                                disabled={isPending}
                                className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 bg-white"
                              >
                                {statuses.map(status => (
                                  <option key={status} value={status}>
                                    {getStatusText(status)}
                                  </option>
                                ))}
                              </select>
                            )}

                            {!isJobDeleted && canEmailApplicants && (
                              <button
                                onClick={() => handleOpenSingleEmail(app)}
                                disabled={isPending}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title="Send Email"
                              >
                                <FaEnvelope size={16} />
                              </button>
                            )}

                            <Link
                              href={route('backend.applications.show', app.id)}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                              title="View Details"
                            >
                              <FaEye size={16} />
                            </Link>

                            {!isJobDeleted && canDownloadResumes && (
                              <button
                                onClick={() => handleDownloadResume(app)}
                                disabled={isPending}
                                className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title="Download Resume"
                              >
                                <FaFilePdf size={16} />
                              </button>
                            )}

                            {!isJobDeleted && canDeleteApplications && (
                              <button
                                onClick={() => handleDeleteSingle(app.id, app.name)}
                                disabled={isPending}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title="Delete"
                              >
                                <FaTrash size={16} />
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
        jobTitle={job.title}
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