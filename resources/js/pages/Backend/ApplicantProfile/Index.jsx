// resources/js/pages/Backend/ApplicantProfile/Index.jsx

import { useState, useEffect } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { Can } from '../../../components/Auth/Can';
import { useAuth } from '../../../hooks/useAuth';

// Icons
import {
  FaUser,
  FaBriefcase,
  FaGraduationCap,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaFilter,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaEye,
  FaTrash,
  FaUndo,
  FaSpinner,
  FaCheckCircle,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaDownload,
  FaFilePdf,
  FaLinkedin,
  FaStar,
  FaRegBuilding,
  FaBirthdayCake,
  FaVenusMars,
  FaTint,
  FaLock,
} from 'react-icons/fa';

import Swal from 'sweetalert2';

export default function Index({
  profiles: initialProfiles,
  filters: initialFilters = {},
  filterOptions = {},
  statusCounts = {},
}) {
  const { flash } = usePage().props;
  const { hasPermission, hasAnyPermission, hasRole } = useAuth();

  // MOVE THIS BEFORE useState declarations that use it
  const safeInitialFilters = (initialFilters && !Array.isArray(initialFilters)) ? initialFilters : {};

  // States
  const [profiles, setProfiles] = useState(initialProfiles);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [sortField, setSortField] = useState(safeInitialFilters.sort || 'created_at');
  const [sortDirection, setSortDirection] = useState(safeInitialFilters.direction || 'desc');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Permission checks
  const canViewProfiles = hasPermission('applicant-profiles.view') || hasRole('admin');
  const canDeleteProfiles = hasAnyPermission(['applicant-profiles.delete', 'applicant-profiles.bulk-delete']) || hasRole('admin');
  const canRestoreProfiles = hasAnyPermission(['applicant-profiles.restore', 'applicant-profiles.bulk-restore']) || hasRole('admin');
  const canViewFilters = hasPermission('applicant-profiles.filter') || hasRole('admin');

  // Keep local state in sync with Inertia props
  useEffect(() => {
    setProfiles(initialProfiles);
    setSelectedProfiles([]);
  }, [initialProfiles]);

  // Date range options
  const dateRangeOptions = [
    { value: '', label: 'Any Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
  ];

  // Experience level options
  const experienceLevelOptions = [
    { value: '', label: 'Any Level' },
    { value: 'fresher', label: 'Fresher (0 years)' },
    { value: 'entry', label: 'Entry Level (0-1 years)' },
    { value: 'junior', label: 'Junior (1-3 years)' },
    { value: 'mid', label: 'Mid Level (3-6 years)' },
    { value: 'senior', label: 'Senior (6-10 years)' },
    { value: 'expert', label: 'Expert (10+ years)' },
  ];

  // Completion status options
  const completionStatusOptions = [
    { value: '', label: 'All Profiles' },
    { value: 'complete', label: 'Complete Profiles' },
    { value: 'incomplete', label: 'Incomplete Profiles' },
    { value: 'minimal', label: 'Minimal Profiles' },
    { value: 'complete_with_cv', label: 'Complete with CV' },
  ];

  // Trash filter options
  const trashOptions = [
    { value: '', label: 'Without Trash' },
    { value: 'with', label: 'With Trash' },
    { value: 'only', label: 'Only Trash' },
  ];

  // Boolean options
  const booleanOptions = [
    { value: '', label: 'All' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];

  // Filter states
  const [filters, setFilters] = useState({
    search: safeInitialFilters.search || '',
    email: safeInitialFilters.email || '',
    gender: safeInitialFilters.gender || '',
    blood_type: safeInitialFilters.blood_type || '',
    phone: safeInitialFilters.phone || '',
    address: safeInitialFilters.address || '',
    birth_date_from: safeInitialFilters.birth_date_from || '',
    birth_date_to: safeInitialFilters.birth_date_to || '',
    min_age: safeInitialFilters.min_age || '',
    max_age: safeInitialFilters.max_age || '',
    created_from: safeInitialFilters.created_from || '',
    created_to: safeInitialFilters.created_to || '',
    date_range: safeInitialFilters.date_range || '',
    min_experience: safeInitialFilters.min_experience || '',
    max_experience: safeInitialFilters.max_experience || '',
    experience_level: safeInitialFilters.experience_level || '',
    current_job_title: safeInitialFilters.current_job_title || '',
    has_current_job: safeInitialFilters.has_current_job || '',
    has_experience: safeInitialFilters.has_experience || '',
    has_cv: safeInitialFilters.has_cv || '',
    has_primary_cv: safeInitialFilters.has_primary_cv || '',
    completion_status: safeInitialFilters.completion_status || '',
    trashed: safeInitialFilters.trashed || '',
    has_applied: safeInitialFilters.has_applied || '',
    min_applications: safeInitialFilters.min_applications || '',
    application_status: safeInitialFilters.application_status || '',
    min_ats_score: safeInitialFilters.min_ats_score || '',
    max_ats_score: safeInitialFilters.max_ats_score || '',
    has_social_links: safeInitialFilters.has_social_links || '',
    has_linkedin: safeInitialFilters.has_linkedin || '',
    has_facebook: safeInitialFilters.has_facebook || '',
    has_twitter: safeInitialFilters.has_twitter || '',
    has_job_history: safeInitialFilters.has_job_history || '',
    min_job_history_count: safeInitialFilters.min_job_history_count || '',
    company_name: safeInitialFilters.company_name || '',
    position: safeInitialFilters.position || '',
    has_education: safeInitialFilters.has_education || '',
    degree: safeInitialFilters.degree || '',
    institution: safeInitialFilters.institution || '',
    min_passing_year: safeInitialFilters.min_passing_year || '',
    max_passing_year: safeInitialFilters.max_passing_year || '',
    has_achievements: safeInitialFilters.has_achievements || '',
    min_achievements: safeInitialFilters.min_achievements || '',
    email_verified: safeInitialFilters.email_verified || '',
    user_status: safeInitialFilters.user_status || '',
  });

  // Get profiles array from paginated response
  const profileItems = profiles?.data || [];

  // Pagination info
  const pagination = profiles?.data ? {
    currentPage: profiles.current_page,
    lastPage: profiles.last_page,
    perPage: profiles.per_page,
    total: profiles.total,
    from: profiles.from,
    to: profiles.to,
  } : null;

  // Build query params
  const buildQueryParams = (pageNumber = 1, additionalParams = {}) => {
    const params = {
      page: pageNumber,
      sort: sortField,
      direction: sortDirection,
      ...additionalParams
    };

    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        params[key] = filters[key];
      }
    });

    return params;
  };

  // Apply filters
  const applyFilters = () => {
    if (!canViewFilters) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'You do not have permission to filter profiles.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    router.get(route('backend.applicant-profile.index'), buildQueryParams(1), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setProfiles(page.props.profiles);
        setShowFilters(false);
        setSelectedProfiles([]);
      },
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      email: '',
      gender: '',
      blood_type: '',
      phone: '',
      address: '',
      birth_date_from: '',
      birth_date_to: '',
      min_age: '',
      max_age: '',
      created_from: '',
      created_to: '',
      date_range: '',
      min_experience: '',
      max_experience: '',
      experience_level: '',
      current_job_title: '',
      has_current_job: '',
      has_experience: '',
      has_cv: '',
      has_primary_cv: '',
      completion_status: '',
      trashed: '',
      has_applied: '',
      min_applications: '',
      application_status: '',
      min_ats_score: '',
      max_ats_score: '',
      has_social_links: '',
      has_linkedin: '',
      has_facebook: '',
      has_twitter: '',
      has_job_history: '',
      min_job_history_count: '',
      company_name: '',
      position: '',
      has_education: '',
      degree: '',
      institution: '',
      min_passing_year: '',
      max_passing_year: '',
      has_achievements: '',
      min_achievements: '',
      email_verified: '',
      user_status: '',
    });
    setSortField('created_at');
    setSortDirection('desc');

    router.get(route('backend.applicant-profile.index'), { page: 1 }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setProfiles(page.props.profiles);
        setShowFilters(false);
        setSelectedProfiles([]);
      },
    });
  };

  // Handle sort
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);

    router.get(route('backend.applicant-profile.index'), buildQueryParams(1, { sort: field, direction: newDirection }), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setProfiles(page.props.profiles);
        setSelectedProfiles([]);
      },
    });
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page === pagination?.currentPage) return;
    if (page < 1 || page > pagination?.lastPage) return;

    router.get(route('backend.applicant-profile.index'), buildQueryParams(page), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setProfiles(page.props.profiles);
        setSelectedProfiles([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!canDeleteProfiles && !canRestoreProfiles) return;

    const selectableProfiles = profileItems.filter(p => !p.deleted_at);
    if (selectedProfiles.length === selectableProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(selectableProfiles.map(p => p.id));
    }
  };

  // Handle select single
  const handleSelectProfile = (profileId) => {
    if (!canDeleteProfiles && !canRestoreProfiles) return;

    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (!canDeleteProfiles) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'You do not have permission to delete profiles.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    if (selectedProfiles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Profiles Selected',
        text: 'Please select at least one profile.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Profiles',
      text: `Are you sure you want to delete ${selectedProfiles.length} profile(s)? This will move them to trash.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(true);

        router.post(route('backend.applicant-profile.bulk-delete'), {
          profile_ids: selectedProfiles,
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `${selectedProfiles.length} profile(s) moved to trash.`,
              timer: 1500,
              showConfirmButton: false,
            });
            setSelectedProfiles([]);
            setIsDeleting(false);
            router.reload({ preserveScroll: true });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: error?.message || 'Failed to delete profiles.',
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
    if (!canRestoreProfiles) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'You do not have permission to restore profiles.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    if (selectedProfiles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Profiles Selected',
        text: 'Please select at least one profile to restore.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: 'Restore Profiles',
      text: `Are you sure you want to restore ${selectedProfiles.length} profile(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsRestoring(true);

        router.post(route('backend.applicant-profile.bulk-restore'), {
          profile_ids: selectedProfiles,
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: `${selectedProfiles.length} profile(s) restored successfully.`,
              timer: 1500,
              showConfirmButton: false,
            });
            setSelectedProfiles([]);
            setIsRestoring(false);
            router.reload({ preserveScroll: true });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Restore Failed',
              text: error?.message || 'Failed to restore profiles.',
              confirmButtonColor: '#d33',
            });
            setIsRestoring(false);
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

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getExperienceBadge = (years) => {
    if (years === null || years === 0) return 'bg-gray-100 text-gray-600';
    if (years <= 1) return 'bg-blue-100 text-blue-700';
    if (years <= 3) return 'bg-cyan-100 text-cyan-700';
    if (years <= 6) return 'bg-green-100 text-green-700';
    if (years <= 10) return 'bg-purple-100 text-purple-700';
    return 'bg-orange-100 text-orange-700';
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-400 ml-1" size={12} />;
    return sortDirection === 'asc' ?
      <FaSortUp className="text-blue-600 ml-1" size={12} /> :
      <FaSortDown className="text-blue-600 ml-1" size={12} />;
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
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500 text-center sm:text-left">
          <span>
            Showing <span className="font-medium">{pagination.from || 0}</span> to{' '}
            <span className="font-medium">{pagination.to || 0}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> results
          </span>
          <span className="text-gray-400 text-[10px] sm:text-xs">
            (per page {pagination.perPage})
          </span>
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

  // If user doesn't have permission to view profiles, show access denied
  if (!canViewProfiles) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaLock className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-sm sm:text-base text-gray-600">
              You don't have permission to view applicant profiles.
              Please contact your administrator if you believe this is a mistake.
            </p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <Head title="Applicant Profiles" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
        <div className="mx-auto">
          {/* HEADER - Responsive */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Applicant Profiles
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                Manage and review all applicant profiles across the platform
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-3 mt-1.5 sm:mt-2">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
                  Total: {statusCounts.total || 0}
                </span>
                <Can permission="applicant-profiles.stats">
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                    Complete: {statusCounts.complete || 0}
                  </span>
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500" />
                    Has CV: {statusCounts.has_cv || 0}
                  </span>
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500" />
                    Has Applied: {statusCounts.has_applied || 0}
                  </span>
                </Can>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
                  Deleted: {statusCounts.deleted || 0}
                </span>
                {hasActiveFilters() && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-blue-600">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                    Filtered ({getActiveFilterCount()})
                  </span>
                )}
                {pagination && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
                    Results: {pagination.total}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Can permission="applicant-profiles.filter">
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
                      {getActiveFilterCount()}
                    </span>
                  )}
                  {showFilters ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </button>
              </Can>

              <Can permission="applicant-profiles.export">
                <button
                  onClick={() => {
                    Swal.fire({
                      icon: 'info',
                      title: 'Export Feature',
                      text: 'Export functionality will be implemented soon.',
                      confirmButtonColor: '#3b82f6',
                    });
                  }}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-all duration-200 text-xs sm:text-sm"
                >
                  <FaDownload size={12} />
                  Export
                </button>
              </Can>
            </div>
          </div>

          {/* FILTERS PANEL - Responsive */}
          {showFilters && canViewFilters && (
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filter Profiles</h3>
                <button
                  onClick={resetFilters}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <FaTimes size={10} />
                  Reset all
                </button>
              </div>

              {/* Basic Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {/* Search */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Name or email..."
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Genders</option>
                    {(filterOptions?.genders || ['male', 'female', 'other']).map(gender => (
                      <option key={gender} value={gender}>
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Blood Type */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Blood Type</label>
                  <select
                    value={filters.blood_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, blood_type: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Types</option>
                    {(filterOptions?.blood_types || ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Trash Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Show</label>
                  <select
                    value={filters.trashed}
                    onChange={(e) => setFilters(prev => ({ ...prev, trashed: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {trashOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-3 sm:mb-4"
              >
                {showAdvanced ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
              </button>

              {/* Advanced Filters */}
              {showAdvanced && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Professional Info Section */}
                  <div className="border-t pt-3 sm:pt-4">
                    <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <FaBriefcase className="text-blue-500" size={12} />
                      Professional Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Experience (years)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={filters.min_experience}
                            onChange={(e) => setFilters(prev => ({ ...prev, min_experience: e.target.value }))}
                            placeholder="Min"
                            className="w-1/2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <input
                            type="number"
                            value={filters.max_experience}
                            onChange={(e) => setFilters(prev => ({ ...prev, max_experience: e.target.value }))}
                            placeholder="Max"
                            className="w-1/2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Experience Level</label>
                        <select
                          value={filters.experience_level}
                          onChange={(e) => setFilters(prev => ({ ...prev, experience_level: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          {experienceLevelOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Current Job Title</label>
                        <input
                          type="text"
                          value={filters.current_job_title}
                          onChange={(e) => setFilters(prev => ({ ...prev, current_job_title: e.target.value }))}
                          placeholder="e.g., Software Engineer"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Has Current Job</label>
                        <select
                          value={filters.has_current_job}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_current_job: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CV & Documents Section */}
                  <div className="border-t pt-3 sm:pt-4">
                    <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <FaFilePdf className="text-red-500" size={12} />
                      CV & Documents
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Has CV</label>
                        <select
                          value={filters.has_cv}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_cv: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Has Primary CV</label>
                        <select
                          value={filters.has_primary_cv}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_primary_cv: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Completion Status</label>
                        <select
                          value={filters.completion_status}
                          onChange={(e) => setFilters(prev => ({ ...prev, completion_status: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {completionStatusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Application Related Filters */}
                  <div className="border-t pt-3 sm:pt-4">
                    <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <FaChartLine className="text-green-500" size={12} />
                      Applications
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Has Applied</label>
                        <select
                          value={filters.has_applied}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_applied: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Min Applications</label>
                        <input
                          type="number"
                          value={filters.min_applications}
                          onChange={(e) => setFilters(prev => ({ ...prev, min_applications: e.target.value }))}
                          placeholder="Minimum"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Min ATS Score</label>
                        <input
                          type="number"
                          value={filters.min_ats_score}
                          onChange={(e) => setFilters(prev => ({ ...prev, min_ats_score: e.target.value }))}
                          placeholder="Min"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Max ATS Score</label>
                        <input
                          type="number"
                          value={filters.max_ats_score}
                          onChange={(e) => setFilters(prev => ({ ...prev, max_ats_score: e.target.value }))}
                          placeholder="Max"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Links Section */}
                  <div className="border-t pt-3 sm:pt-4">
                    <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <FaLinkedin className="text-blue-700" size={12} />
                      Social Links
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Has Social Links</label>
                        <select
                          value={filters.has_social_links}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_social_links: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Has LinkedIn</label>
                        <select
                          value={filters.has_linkedin}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_linkedin: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Has Facebook</label>
                        <select
                          value={filters.has_facebook}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_facebook: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Has Twitter</label>
                        <select
                          value={filters.has_twitter}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_twitter: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Job History Filters */}
                  <div className="border-t pt-3 sm:pt-4">
                    <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <FaRegBuilding className="text-gray-600" size={12} />
                      Job History
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Has Job History</label>
                        <select
                          value={filters.has_job_history}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_job_history: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Company Name</label>
                        <input
                          type="text"
                          value={filters.company_name}
                          onChange={(e) => setFilters(prev => ({ ...prev, company_name: e.target.value }))}
                          placeholder="Company name"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Position</label>
                        <input
                          type="text"
                          value={filters.position}
                          onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="Job position"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Min Job History Count</label>
                        <input
                          type="number"
                          value={filters.min_job_history_count}
                          onChange={(e) => setFilters(prev => ({ ...prev, min_job_history_count: e.target.value }))}
                          placeholder="Minimum entries"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Education Filters */}
                  <div className="border-t pt-3 sm:pt-4">
                    <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <FaGraduationCap className="text-green-600" size={12} />
                      Education
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Has Education</label>
                        <select
                          value={filters.has_education}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_education: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Degree</label>
                        <input
                          type="text"
                          value={filters.degree}
                          onChange={(e) => setFilters(prev => ({ ...prev, degree: e.target.value }))}
                          placeholder="e.g., Bachelor's"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Institution</label>
                        <input
                          type="text"
                          value={filters.institution}
                          onChange={(e) => setFilters(prev => ({ ...prev, institution: e.target.value }))}
                          placeholder="University name"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Passing Year Range</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={filters.min_passing_year}
                            onChange={(e) => setFilters(prev => ({ ...prev, min_passing_year: e.target.value }))}
                            placeholder="Min"
                            className="w-1/2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="number"
                            value={filters.max_passing_year}
                            onChange={(e) => setFilters(prev => ({ ...prev, max_passing_year: e.target.value }))}
                            placeholder="Max"
                            className="w-1/2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date Filters */}
                  <div className="border-t pt-3 sm:pt-4">
                    <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-500" size={12} />
                      Dates
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Date Range Preset</label>
                        <select
                          value={filters.date_range}
                          onChange={(e) => setFilters(prev => ({ ...prev, date_range: e.target.value, created_from: '', created_to: '' }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {dateRangeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Created From</label>
                        <input
                          type="date"
                          value={filters.created_from}
                          onChange={(e) => setFilters(prev => ({ ...prev, created_from: e.target.value, date_range: '' }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Created To</label>
                        <input
                          type="date"
                          value={filters.created_to}
                          onChange={(e) => setFilters(prev => ({ ...prev, created_to: e.target.value, date_range: '' }))}
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Birth Date Range</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={filters.birth_date_from}
                            onChange={(e) => setFilters(prev => ({ ...prev, birth_date_from: e.target.value }))}
                            className="w-1/2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="date"
                            value={filters.birth_date_to}
                            onChange={(e) => setFilters(prev => ({ ...prev, birth_date_to: e.target.value }))}
                            className="w-1/2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={resetFilters}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* BULK ACTIONS BAR - Responsive */}
          {selectedProfiles.length > 0 && (canDeleteProfiles || canRestoreProfiles) && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 animate-fade-in border border-blue-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FaCheckCircle className="text-blue-600" size={16} />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {selectedProfiles.length} profile(s) selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                  {filters.trashed === 'only' ? (
                    <Can permission="applicant-profiles.restore">
                      <button
                        onClick={handleBulkRestore}
                        disabled={isRestoring}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                      >
                        {isRestoring ? <FaSpinner className="animate-spin" size={12} /> : <FaUndo size={12} />}
                        Restore All
                      </button>
                    </Can>
                  ) : (
                    <Can permission="applicant-profiles.delete">
                      <button
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                      >
                        {isDeleting ? <FaSpinner className="animate-spin" size={12} /> : <FaTrash size={12} />}
                        Delete All
                      </button>
                    </Can>
                  )}
                  <button
                    onClick={() => setSelectedProfiles([])}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 text-xs sm:text-sm"
                  >
                    Clear
                  </button>
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
                    {(canDeleteProfiles || canRestoreProfiles) && (
                      <th className="px-2 sm:px-4 py-3 sm:py-4 text-left">
                        <input
                          type="checkbox"
                          checked={profileItems.length > 0 && selectedProfiles.length === profileItems.filter(p => !p.deleted_at).length}
                          onChange={handleSelectAll}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          disabled={profileItems.filter(p => !p.deleted_at).length === 0}
                        />
                      </th>
                    )}
                    <th
                      className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        Applicant
                        {getSortIcon('full_name')}
                      </div>
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('experience_years')}
                    >
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        Experience
                        {getSortIcon('experience_years')}
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('completion_percentage')}
                    >
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        Complete
                        {getSortIcon('completion_percentage')}
                      </div>
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      CV
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        Joined
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {profileItems.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 sm:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <FaUser className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">No profiles found</h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">
                          {hasActiveFilters() ? 'Try adjusting your filters.' : 'No applicant profiles available yet.'}
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

                  {profileItems.map((profile, index) => {
                    const trashed = profile.deleted_at !== null;
                    const age = calculateAge(profile.birth_date);
                    const completionPercentage = profile.completion_percentage || 0;

                    return (
                      <tr
                        key={profile.id}
                        className={`hover:bg-gray-50 transition-all duration-200 animate-fade-in ${trashed ? 'bg-gray-50 opacity-75' : ''} ${selectedProfiles.includes(profile.id) ? 'bg-blue-50' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {(canDeleteProfiles || canRestoreProfiles) && (
                          <td className="px-2 sm:px-4 py-3 sm:py-4">
                            {!trashed && (
                              <input
                                type="checkbox"
                                checked={selectedProfiles.includes(profile.id)}
                                onChange={() => handleSelectProfile(profile.id)}
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            )}
                          </td>
                        )}

                        {/* APPLICANT */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs sm:text-sm shrink-0">
                              {profile.first_name?.charAt(0)?.toUpperCase() || '?'}
                              {profile.last_name?.charAt(0)?.toUpperCase() || ''}
                            </div>
                            <div className="min-w-0">
                              <div className={`text-sm sm:text-base font-semibold truncate ${trashed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                              </div>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
                                {age && (
                                  <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-0.5 sm:gap-1">
                                    <FaBirthdayCake size={8} />
                                    {age} yrs
                                  </span>
                                )}
                                {profile.gender && (
                                  <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-0.5 sm:gap-1">
                                    <FaVenusMars size={8} />
                                    {profile.gender}
                                  </span>
                                )}
                                {profile.blood_type && (
                                  <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-0.5 sm:gap-1">
                                    <FaTint size={8} />
                                    {profile.blood_type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT - Hidden on mobile */}
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className="space-y-0.5 sm:space-y-1">
                            <div className={`flex items-center gap-1 text-xs sm:text-sm ${trashed ? 'text-gray-400' : 'text-gray-600'}`}>
                              <FaEnvelope size={10} className="text-gray-400" />
                              <a href={`mailto:${profile.email}`} className={`hover:text-blue-600 truncate max-w-24 sm:max-w-36 ${trashed ? 'pointer-events-none' : ''}`}>
                                {profile.email}
                              </a>
                            </div>
                            {profile.phone && (
                              <div className={`flex items-center gap-1 text-xs sm:text-sm ${trashed ? 'text-gray-400' : 'text-gray-600'}`}>
                                <FaPhone size={10} className="text-gray-400" />
                                {profile.phone}
                              </div>
                            )}
                            {profile.address && (
                              <div className={`flex items-center gap-1 text-[10px] sm:text-xs ${trashed ? 'text-gray-400' : 'text-gray-400'}`}>
                                <FaMapMarkerAlt size={8} />
                                <span className="truncate max-w-24 sm:max-w-36">{profile.address}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* EXPERIENCE - Hidden on tablet */}
                        <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div>
                            <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getExperienceBadge(profile.experience_years)}`}>
                              <FaBriefcase size={8} />
                              {profile.experience_years !== null && profile.experience_years !== undefined
                                ? `${profile.experience_years} ${profile.experience_years === 1 ? 'yr' : 'yrs'}`
                                : 'N/A'}
                            </span>
                            {profile.current_job_title && (
                              <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate max-w-32">
                                {profile.current_job_title}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* COMPLETION */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="flex-1 max-w-16 sm:max-w-24">
                              <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${completionPercentage}%`,
                                    backgroundColor: completionPercentage >= 80 ? '#10b981' :
                                      completionPercentage >= 60 ? '#3b82f6' :
                                        completionPercentage >= 40 ? '#eab308' : '#ef4444'
                                  }}
                                />
                              </div>
                            </div>
                            <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${getCompletionColor(completionPercentage)}`}>
                              {completionPercentage}%
                            </span>
                          </div>
                        </td>

                        {/* CV STATUS - Hidden on tablet */}
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          {profile.active_cvs_count > 0 ? (
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <FaFilePdf className="text-red-500" size={10} />
                              <span className="text-[10px] sm:text-xs text-gray-600">{profile.active_cvs_count}</span>
                              {profile.primaryCv && (
                                <FaStar className="text-yellow-500" size={8} title="Primary CV" />
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] sm:text-xs text-gray-400">No CV</span>
                          )}
                        </td>

                        {/* JOINED - Hidden on large screens */}
                        <td className="hidden xl:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className={`text-xs sm:text-sm ${trashed ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatDate(profile.created_at)}
                          </div>
                          {profile.applications_count > 0 && (
                            <div className="text-[10px] sm:text-xs text-blue-600 mt-0.5">
                              {profile.applications_count} app(s)
                            </div>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Link
                              href={route('backend.applicant-profile.show', profile.id)}
                              className="p-1.5 sm:p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                              title="View Profile"
                            >
                              <FaEye size={14} />
                            </Link>

                            {trashed && canRestoreProfiles && (
                              <button
                                onClick={() => {
                                  setSelectedProfiles([profile.id]);
                                  handleBulkRestore();
                                }}
                                className="p-1.5 sm:p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                                title="Restore"
                              >
                                <FaUndo size={14} />
                              </button>
                            )}

                            {!trashed && canDeleteProfiles && (
                              <button
                                onClick={() => {
                                  setSelectedProfiles([profile.id]);
                                  handleBulkDelete();
                                }}
                                className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Delete"
                              >
                                <FaTrash size={14} />
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