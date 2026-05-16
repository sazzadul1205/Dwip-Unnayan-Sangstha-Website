// resources/js/pages/Backend/ApplicantProfile/Index.jsx

import { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Icons
import {
  FaUser,
  FaBriefcase,
  FaGraduationCap,
  FaTrophy,
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
  FaClock,
  FaChartLine,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaDownload,
  FaFilePdf,
  FaLinkedin,
  FaFacebook,
  FaTwitter,
  FaUserCheck,
  FaUserTimes,
  FaStar,
  FaRegBuilding,
  FaBirthdayCake,
  FaVenusMars,
  FaTint,
  FaIdCard,
} from 'react-icons/fa';

import Swal from 'sweetalert2';

export default function Index({
  profiles: initialProfiles,
  filters: initialFilters = {},
  filterOptions = {},
  statusCounts = {},
  genderDistribution = {},
  experienceDistribution = {},
  totalProfiles = 0,
}) {
  const { flash } = usePage().props;
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

  // Keep local state in sync with Inertia props (e.g. back/forward navigation,
  // visiting this page from elsewhere, or any navigation that doesn't go through
  // our explicit router.get onSuccess handlers).
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
    const selectableProfiles = profileItems.filter(p => !p.deleted_at);
    if (selectedProfiles.length === selectableProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(selectableProfiles.map(p => p.id));
    }
  };

  // Handle select single
  const handleSelectProfile = (profileId) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
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
            <span className="font-medium">{pagination.total}</span> results (per page {pagination.perPage})
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
      <Head title="Applicant Profiles" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
        <div className="mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Applicant Profiles
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and review all applicant profiles across the platform
              </p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Total: {statusCounts.total || 0}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Complete: {statusCounts.complete || 0}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Has CV: {statusCounts.has_cv || 0}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Has Applied: {statusCounts.has_applied || 0}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Deleted: {statusCounts.deleted || 0}
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
                    Results: {pagination.total}
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

          {/* FILTERS PANEL */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filter Profiles</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <FaTimes size={12} />
                  Reset all
                </button>
              </div>

              {/* Basic Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Name or email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                  <select
                    value={filters.blood_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, blood_type: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {(filterOptions?.blood_types || ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
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

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
              >
                {showAdvanced ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
              </button>

              {/* Advanced Filters */}
              {showAdvanced && (
                <div className="space-y-6">
                  {/* Professional Info Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FaBriefcase className="text-blue-500" size={14} />
                      Professional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          />
                          <input
                            type="number"
                            value={filters.max_experience}
                            onChange={(e) => setFilters(prev => ({ ...prev, max_experience: e.target.value }))}
                            placeholder={`Max (${filterOptions?.experience?.max || 30})`}
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Experience Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                        <select
                          value={filters.experience_level}
                          onChange={(e) => setFilters(prev => ({ ...prev, experience_level: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {experienceLevelOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Current Job Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Job Title</label>
                        <input
                          type="text"
                          value={filters.current_job_title}
                          onChange={(e) => setFilters(prev => ({ ...prev, current_job_title: e.target.value }))}
                          placeholder="e.g., Software Engineer"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Has Current Job */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Has Current Job</label>
                        <select
                          value={filters.has_current_job}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_current_job: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CV & Documents Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FaFilePdf className="text-red-500" size={14} />
                      CV & Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Has CV</label>
                        <select
                          value={filters.has_cv}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_cv: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Has Primary CV</label>
                        <select
                          value={filters.has_primary_cv}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_primary_cv: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Completion Status</label>
                        <select
                          value={filters.completion_status}
                          onChange={(e) => setFilters(prev => ({ ...prev, completion_status: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {completionStatusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Application Related Filters */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FaChartLine className="text-green-500" size={14} />
                      Applications
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Has Applied</label>
                        <select
                          value={filters.has_applied}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_applied: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Applications</label>
                        <input
                          type="number"
                          value={filters.min_applications}
                          onChange={(e) => setFilters(prev => ({ ...prev, min_applications: e.target.value }))}
                          placeholder="Minimum number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min ATS Score</label>
                        <input
                          type="number"
                          value={filters.min_ats_score}
                          onChange={(e) => setFilters(prev => ({ ...prev, min_ats_score: e.target.value }))}
                          placeholder={`Min (${filterOptions?.ats?.min || 0})`}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max ATS Score</label>
                        <input
                          type="number"
                          value={filters.max_ats_score}
                          onChange={(e) => setFilters(prev => ({ ...prev, max_ats_score: e.target.value }))}
                          placeholder={`Max (${filterOptions?.ats?.max || 100})`}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Links Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FaLinkedin className="text-blue-700" size={14} />
                      Social Links
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Has Social Links</label>
                        <select
                          value={filters.has_social_links}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_social_links: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Has LinkedIn</label>
                        <select
                          value={filters.has_linkedin}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_linkedin: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Has Facebook</label>
                        <select
                          value={filters.has_facebook}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_facebook: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Has Twitter</label>
                        <select
                          value={filters.has_twitter}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_twitter: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Job History Filters */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FaRegBuilding className="text-gray-600" size={14} />
                      Job History
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Has Job History</label>
                        <select
                          value={filters.has_job_history}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_job_history: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                        <input
                          type="text"
                          value={filters.company_name}
                          onChange={(e) => setFilters(prev => ({ ...prev, company_name: e.target.value }))}
                          placeholder="Company name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                        <input
                          type="text"
                          value={filters.position}
                          onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="Job position"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Job History Count</label>
                        <input
                          type="number"
                          value={filters.min_job_history_count}
                          onChange={(e) => setFilters(prev => ({ ...prev, min_job_history_count: e.target.value }))}
                          placeholder="Minimum entries"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Education Filters */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FaGraduationCap className="text-green-600" size={14} />
                      Education
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Has Education</label>
                        <select
                          value={filters.has_education}
                          onChange={(e) => setFilters(prev => ({ ...prev, has_education: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {booleanOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                        <input
                          type="text"
                          value={filters.degree}
                          onChange={(e) => setFilters(prev => ({ ...prev, degree: e.target.value }))}
                          placeholder="e.g., Bachelor's"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                        <input
                          type="text"
                          value={filters.institution}
                          onChange={(e) => setFilters(prev => ({ ...prev, institution: e.target.value }))}
                          placeholder="University name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Passing Year Range</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={filters.min_passing_year}
                            onChange={(e) => setFilters(prev => ({ ...prev, min_passing_year: e.target.value }))}
                            placeholder="Min"
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="number"
                            value={filters.max_passing_year}
                            onChange={(e) => setFilters(prev => ({ ...prev, max_passing_year: e.target.value }))}
                            placeholder="Max"
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date Filters */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-500" size={14} />
                      Dates
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range Preset</label>
                        <select
                          value={filters.date_range}
                          onChange={(e) => setFilters(prev => ({ ...prev, date_range: e.target.value, created_from: '', created_to: '' }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {dateRangeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Created From</label>
                        <input
                          type="date"
                          value={filters.created_from}
                          onChange={(e) => setFilters(prev => ({ ...prev, created_from: e.target.value, date_range: '' }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Created To</label>
                        <input
                          type="date"
                          value={filters.created_to}
                          onChange={(e) => setFilters(prev => ({ ...prev, created_to: e.target.value, date_range: '' }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date Range</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={filters.birth_date_from}
                            onChange={(e) => setFilters(prev => ({ ...prev, birth_date_from: e.target.value }))}
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="date"
                            value={filters.birth_date_to}
                            onChange={(e) => setFilters(prev => ({ ...prev, birth_date_to: e.target.value }))}
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
          {selectedProfiles.length > 0 && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 mb-6 animate-fade-in border border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-900">
                    {selectedProfiles.length} profile(s) selected
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {filters.trashed === 'only' ? (
                    <button
                      onClick={handleBulkRestore}
                      disabled={isRestoring}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {isRestoring ? <FaSpinner className="animate-spin" size={14} /> : <FaUndo size={14} />}
                      Restore All
                    </button>
                  ) : (
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
                    onClick={() => setSelectedProfiles([])}
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
                      <input
                        type="checkbox"
                        checked={profileItems.length > 0 && selectedProfiles.length === profileItems.filter(p => !p.deleted_at).length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={profileItems.filter(p => !p.deleted_at).length === 0}
                      />
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className="flex items-center">
                        Applicant
                        {getSortIcon('full_name')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('experience_years')}
                    >
                      <div className="flex items-center">
                        Experience
                        {getSortIcon('experience_years')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('completion_percentage')}
                    >
                      <div className="flex items-center">
                        Profile Complete
                        {getSortIcon('completion_percentage')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      CV
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Joined
                        {getSortIcon('created_at')}
                      </div>
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
                  {profileItems.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaUser className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No profiles found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {hasActiveFilters() ? 'Try adjusting your filters.' : 'No applicant profiles available yet.'}
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
                        <td className="px-4 py-4">
                          {!trashed && (
                            <input
                              type="checkbox"
                              checked={selectedProfiles.includes(profile.id)}
                              onChange={() => handleSelectProfile(profile.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                        </td>

                        {/* APPLICANT */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                              {profile.first_name?.charAt(0)?.toUpperCase() || '?'}
                              {profile.last_name?.charAt(0)?.toUpperCase() || ''}
                            </div>
                            <div>
                              <div className={`font-semibold ${trashed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {age && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <FaBirthdayCake size={10} />
                                    {age} years
                                  </span>
                                )}
                                {profile.gender && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <FaVenusMars size={10} />
                                    {profile.gender}
                                  </span>
                                )}
                                {profile.blood_type && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <FaTint size={10} />
                                    {profile.blood_type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className={`flex items-center gap-1 text-sm ${trashed ? 'text-gray-400' : 'text-gray-600'}`}>
                              <FaEnvelope size={12} className="text-gray-400" />
                              <a href={`mailto:${profile.email}`} className={`hover:text-blue-600 truncate max-w-36 ${trashed ? 'pointer-events-none' : ''}`}>
                                {profile.email}
                              </a>
                            </div>
                            {profile.phone && (
                              <div className={`flex items-center gap-1 text-sm ${trashed ? 'text-gray-400' : 'text-gray-600'}`}>
                                <FaPhone size={12} className="text-gray-400" />
                                {profile.phone}
                              </div>
                            )}
                            {profile.address && (
                              <div className={`flex items-center gap-1 text-xs ${trashed ? 'text-gray-400' : 'text-gray-400'}`}>
                                <FaMapMarkerAlt size={10} />
                                <span className="truncate max-w-36">{profile.address}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* EXPERIENCE */}
                        <td className="px-6 py-4">
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getExperienceBadge(profile.experience_years)}`}>
                              <FaBriefcase size={10} />
                              {profile.experience_years !== null && profile.experience_years !== undefined
                                ? `${profile.experience_years} ${profile.experience_years === 1 ? 'year' : 'years'}`
                                : 'Not specified'}
                            </span>
                            {profile.current_job_title && (
                              <div className="text-xs text-gray-500 mt-1">
                                {profile.current_job_title}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* COMPLETION */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-24">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCompletionColor(completionPercentage)}`}>
                              {completionPercentage}%
                            </span>
                          </div>
                        </td>

                        {/* CV STATUS */}
                        <td className="px-6 py-4">
                          {profile.active_cvs_count > 0 ? (
                            <div className="flex items-center gap-1">
                              <FaFilePdf className="text-red-500" size={14} />
                              <span className="text-xs text-gray-600">{profile.active_cvs_count} CV(s)</span>
                              {profile.primaryCv && (
                                <FaStar className="text-yellow-500 ml-1" size={10} title="Primary CV" />
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No CV</span>
                          )}
                        </td>

                        {/* JOINED */}
                        <td className="px-6 py-4">
                          <div className={`text-sm ${trashed ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatDate(profile.created_at)}
                          </div>
                          {profile.applications_count > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {profile.applications_count} application(s)
                            </div>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4">
                          {!trashed ? (
                            <div className="flex flex-col gap-1">
                              {profile.email_verified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <FaCheckCircle size={10} />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <FaClock size={10} />
                                  Unverified
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">
                              Deleted
                            </span>
                          )}
                        </td>

                        {/* // In the actions column of your table */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={route('backend.applicant-profile.show', profile.id)}
                              className="p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                              title="View Profile"
                            >
                              <FaEye size={18} />
                            </Link>

                            {trashed && (
                              <button
                                onClick={() => {
                                  // Handle restore for single profile
                                  if (typeof handleBulkRestore === 'function') {
                                    handleBulkRestore([profile.id]);
                                  }
                                }}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                                title="Restore"
                              >
                                <FaUndo size={18} />
                              </button>
                            )}

                            {!trashed && (
                              <button
                                onClick={() => {
                                  // Handle delete for single profile
                                  if (typeof handleBulkDelete === 'function') {
                                    handleBulkDelete([profile.id]);
                                  }
                                }}
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
