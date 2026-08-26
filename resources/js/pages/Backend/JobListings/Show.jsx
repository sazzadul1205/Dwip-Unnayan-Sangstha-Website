// resources/js/pages/Backend/JobListings/Show.jsx

// Inertia
import { Head, Link, router } from '@inertiajs/react';

// React
import { useState } from 'react';

// Sweetalert
import Swal from 'sweetalert2';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';

import {
  FaArrowLeft,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaEye,
  FaMapMarkerAlt,
  FaSpinner,
  FaTimesCircle,
  FaToggleOff,
  FaToggleOn,
  FaUsers,
  FaMoneyBillWave,
  FaGraduationCap,
  FaTags,
  FaTrash,
  FaSyncAlt,
  FaLinkedin,
  FaFacebook,
  FaEnvelope,
  FaPhone,
  FaStar,
  FaUserTie,
  FaFileAlt,
  FaCheckDouble,
  FaShieldAlt,
} from 'react-icons/fa';

export default function Show({ jobListing, applicationStats, averageAtsScore, recentApplications, totalViews }) {
  // Use centralized auth hook
  const {
    user: currentUser,
    hasAnyPermission,
    hasRole,
  } = useAuth();

  // Check permissions for job management
  const isSuperAdmin = hasRole('super-admin');
  const canViewJobs = hasAnyPermission(['jobs.view', 'jobs.manage']);
  const isEmployer = hasRole('employer') || hasRole('employer-admin');
  const isHRManager = hasRole('hr-manager');
  const canEditJobs = hasAnyPermission(['jobs.update', 'jobs.manage']);
  const canToggleJobs = hasAnyPermission(['jobs.update', 'jobs.manage']);
  const canDeleteJobs = hasAnyPermission(['jobs.destroy', 'jobs.manage']);
  const canViewApplications = hasAnyPermission(['applications.view', 'applications.manage']);

  // Check if user owns this job listing
  const isJobOwner = (isEmployer || isHRManager) && currentUser?.employer_id === jobListing?.employer_id;

  // Check if user can edit this specific job
  const canEditThisJob = canEditJobs || isJobOwner || isSuperAdmin;
  const canDeleteThisJob = canDeleteJobs || isSuperAdmin;
  const canToggleThisJob = canToggleJobs || isJobOwner || isSuperAdmin;

  // Tab states
  const [activeTab, setActiveTab] = useState('details');

  // If user doesn't have permission to view jobs, show access denied
  if (!canViewJobs && !isEmployer) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">You don't have permission to view job details.</p>
            <Link
              href={route('backend.listing.index')}
              className="inline-flex items-center gap-2 mt-6 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
            >
              <FaArrowLeft size={14} />
              Back to job listings
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // If job doesn't exist, show loading screen
  if (!jobListing) {
    return (
      <AuthenticatedLayout>
        <Head title="Loading Job..." />
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl sm:text-5xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 text-base sm:text-lg">Loading job details...</p>
            <Link
              href={route('backend.listing.index')}
              className="inline-flex items-center gap-2 mt-6 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
            >
              <FaArrowLeft size={14} />
              Back to job listings
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Format date and time
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get job type label
  const getJobTypeLabel = (type) => {
    const types = {
      'full-time': { label: 'Full Time', color: 'bg-emerald-100 text-emerald-800' },
      'part-time': { label: 'Part Time', color: 'bg-blue-100 text-blue-800' },
      contract: { label: 'Contract', color: 'bg-purple-100 text-purple-800' },
      internship: { label: 'Internship', color: 'bg-amber-100 text-amber-800' },
      remote: { label: 'Remote', color: 'bg-teal-100 text-teal-800' },
      hybrid: { label: 'Hybrid', color: 'bg-indigo-100 text-indigo-800' },
    };
    return types[type] || { label: type || 'N/A', color: 'bg-gray-100 text-gray-800' };
  };

  // Get experience level label
  const getExperienceLabel = (level) => {
    const levels = {
      entry: { label: 'Entry Level', color: 'bg-green-100 text-green-800' },
      junior: { label: 'Junior', color: 'bg-blue-100 text-blue-800' },
      'mid-level': { label: 'Mid Level', color: 'bg-yellow-100 text-yellow-800' },
      senior: { label: 'Senior', color: 'bg-orange-100 text-orange-800' },
      lead: { label: 'Lead', color: 'bg-red-100 text-red-800' },
      executive: { label: 'Executive', color: 'bg-purple-100 text-purple-800' },
    };
    return levels[level] || { label: level || 'N/A', color: 'bg-gray-100 text-gray-800' };
  };

  // Get salary display
  const getSalaryDisplay = () => {
    if (jobListing.as_per_companies_policy) return 'As per company policy';
    if (jobListing.is_salary_negotiable) return 'Negotiable';

    const formatNumber = (amount) =>
      new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);

    if (jobListing.salary_min && jobListing.salary_max)
      return `${formatNumber(jobListing.salary_min)} - ${formatNumber(jobListing.salary_max)} BDT`;
    if (jobListing.salary_min)
      return `From ${formatNumber(jobListing.salary_min)} BDT`;
    if (jobListing.salary_max)
      return `Up to ${formatNumber(jobListing.salary_max)} BDT`;
    return 'Not specified';
  };

  // Check if job is expired
  const isExpired = () => {
    if (!jobListing.application_deadline) return false;
    return new Date(jobListing.application_deadline) < new Date();
  };

  // Get ATS badge
  const getAtsBadge = (score) => {
    if (score === undefined || score === null) return 'bg-gray-100 text-gray-700';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Toggle job status handler
  const handleToggleActive = () => {
    if (!canToggleThisJob) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to change job status.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: jobListing.is_active ? 'Deactivate Job?' : 'Activate Job?',
      html: jobListing.is_active
        ? '<p class="text-gray-600">This will hide the job from active listings.</p><p class="text-sm text-gray-500 mt-2">Existing applications will not be affected.</p>'
        : '<p class="text-gray-600">This will make the job visible in active listings.</p><p class="text-sm text-gray-500 mt-2">Make sure the publish date and deadline are valid.</p>',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: jobListing.is_active ? 'Deactivate' : 'Activate',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      router.patch(route('backend.listing.toggle-active', jobListing.id), {}, {
        preserveScroll: true,
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: `Job is now ${jobListing.is_active ? 'inactive' : 'active'}.`,
            timer: 1500,
            showConfirmButton: false,
          });
        },
        onError: (errors) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: errors?.message || 'Could not update job status.',
          });
        },
      });
    });
  };

  // Delete job Delete Handler
  const handleDelete = () => {
    if (!canDeleteThisJob) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to delete this job.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Job?',
      html: '<p class="text-gray-600">This will move the job to trash.</p><p class="text-sm text-red-600 mt-2">Jobs with applications cannot be deleted.</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Move to Trash',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      router.delete(route('backend.listing.destroy', jobListing.id), {
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Job moved to trash.',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => {
            router.visit(route('backend.listing.index'));
          });
        },
        onError: (errors) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: errors?.message || 'Could not delete job.',
          });
        },
      });
    });
  };

  // Components - Stat Card
  const StatCard = ({ icon: Icon, label, value, subtext, colorClass }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">{subtext}</p>}
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );

  // Components - Info Row
  const InfoRow = ({ icon: Icon, label, value, highlight }) => (
    <div className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-colors ${highlight ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <Icon className={`mt-0.5 shrink-0 ${highlight ? 'text-blue-600' : 'text-gray-400'}`} size={14} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-xs sm:text-sm font-medium truncate ${highlight ? 'text-blue-900' : 'text-gray-900'}`}>{value || 'N/A'}</p>
      </div>
    </div>
  );

  // Get job type
  const jobType = getJobTypeLabel(jobListing.job_type);

  // Get experience level
  const experienceLevel = getExperienceLabel(jobListing.experience_level);

  // Check if job is expired
  const expired = isExpired();

  return (
    <AuthenticatedLayout>
      <Head title={`${jobListing.title} - Job Details`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
        <div className="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6">
            <Link
              href={route('backend.listing.index')}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-3 sm:mb-4 group text-xs sm:text-sm"
            >
              <FaArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Job Listings</span>
            </Link>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 truncate">{jobListing.title}</h1>
                      <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${jobListing.is_active && !expired ? 'bg-emerald-100 text-emerald-800' :
                        expired ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'
                        }`}>
                        {jobListing.is_active && !expired ? (
                          <><FaCheckCircle size={10} /> Active</>
                        ) : expired ? (
                          <><FaTimesCircle size={10} /> Expired</>
                        ) : (
                          <><FaTimesCircle size={10} /> Inactive</>
                        )}
                      </span>
                      {jobListing.deleted_at && (
                        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-red-100 text-red-800 whitespace-nowrap">
                          <FaTrash size={10} /> Trashed
                        </span>
                      )}
                      {isJobOwner && (
                        <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-100 text-blue-800 whitespace-nowrap">
                          <FaBuilding size={10} /> Your Job
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FaClock size={12} />
                        Created {formatDateTime(jobListing.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaSyncAlt size={12} />
                        Updated {formatDateTime(jobListing.updated_at)}
                      </span>
                    </div>

                    {/* Quick Info Chips */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-4">
                      <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium ${jobType.color}`}>
                        <FaBriefcase size={10} />
                        {jobType.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium ${experienceLevel.color}`}>
                        <FaUserTie size={10} />
                        {experienceLevel.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {canToggleThisJob && !jobListing.deleted_at && (
                      <button
                        type="button"
                        onClick={handleToggleActive}
                        className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm ${jobListing.is_active
                          ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                      >
                        {jobListing.is_active ? <FaToggleOff size={14} /> : <FaToggleOn size={14} />}
                        {jobListing.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}

                    {canEditThisJob && !jobListing.deleted_at && (
                      <Link
                        href={route('backend.listing.edit', jobListing.id)}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-sm"
                      >
                        <FaEdit size={14} />
                        Edit Job
                      </Link>
                    )}

                    {canDeleteThisJob && !jobListing.deleted_at && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium transition-all duration-200 text-xs sm:text-sm"
                      >
                        <FaTrash size={12} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-4 sm:mb-8">
            <StatCard
              icon={FaUsers}
              label="Total Applications"
              value={applicationStats?.total ?? 0}
              subtext={`${applicationStats?.pending ?? 0} pending review`}
              colorClass="bg-blue-50 text-blue-600"
            />
            <StatCard
              icon={FaEye}
              label="Total Views"
              value={totalViews ?? jobListing.views_count ?? 0}
              subtext="Unique visitor views"
              colorClass="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              icon={FaChartLine}
              label="Avg ATS Score"
              value={averageAtsScore === null || averageAtsScore === undefined ? 'N/A' : `${averageAtsScore}%`}
              subtext="Across all applications"
              colorClass="bg-teal-50 text-teal-600"
            />
            <StatCard
              icon={FaCalendarAlt}
              label="Application Deadline"
              value={formatDate(jobListing.application_deadline)}
              subtext={expired ? 'Deadline passed' : `${Math.ceil((new Date(jobListing.application_deadline) - new Date()) / (1000 * 60 * 60 * 24))} days remaining`}
              colorClass={expired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}
            />
          </div>

          {/* Main Content Tabs - Responsive */}
          <div className="mb-4 sm:mb-6 overflow-x-auto">
            <div className="border-b border-gray-200 min-w-max">
              <nav className="flex gap-4 sm:gap-6">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 sm:pb-3 px-1 text-xs sm:text-sm font-medium transition-all duration-200 relative whitespace-nowrap ${activeTab === 'details'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Job Details
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`pb-2 sm:pb-3 px-1 text-xs sm:text-sm font-medium transition-all duration-200 relative whitespace-nowrap ${activeTab === 'applications'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Applications ({applicationStats?.total ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`pb-2 sm:pb-3 px-1 text-xs sm:text-sm font-medium transition-all duration-200 relative whitespace-nowrap ${activeTab === 'analytics'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Analytics
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Description Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-gray-800 to-gray-900">
                    <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                      <FaFileAlt size={14} />
                      Job Description
                    </h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="prose prose-sm sm:prose max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                      {jobListing.description || 'No description provided.'}
                    </div>
                  </div>
                </div>

                {/* Responsibilities Section */}
                {jobListing.responsibilities && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-blue-600 to-blue-700">
                      <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                        <FaCheckDouble size={14} />
                        Key Responsibilities
                      </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="prose prose-sm sm:prose max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                        {jobListing.responsibilities}
                      </div>
                    </div>
                  </div>
                )}

                {/* Requirements Section */}
                {jobListing.requirements && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-purple-600 to-purple-700">
                      <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                        <FaCheckCircle size={14} />
                        Requirements & Qualifications
                      </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="prose prose-sm sm:prose max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                        {jobListing.requirements}
                      </div>
                    </div>
                  </div>
                )}

                {/* Benefits Section */}
                {jobListing.benefits && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-emerald-600 to-teal-600">
                      <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                        <FaStar size={14} />
                        Benefits & Perks
                      </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="prose prose-sm sm:prose max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                        {jobListing.benefits}
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                {jobListing.skills && jobListing.skills.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-indigo-600 to-indigo-700">
                      <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                        <FaTags size={14} />
                        Required Skills
                      </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {typeof jobListing.skills === 'string'
                          ? jobListing.skills.split(',').map((skill, idx) => (
                            <span key={idx} className="px-2 sm:px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-medium">
                              {skill.trim()}
                            </span>
                          ))
                          : jobListing.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 sm:px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-medium">
                              {skill}
                            </span>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-4 sm:space-y-6">
                {/* Quick Info Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-6">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-gray-700 to-gray-800">
                    <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                      <FaBriefcase size={14} />
                      Quick Information
                    </h2>
                  </div>
                  <div className="p-3 sm:p-4 divide-y divide-gray-100">
                    <InfoRow icon={FaBuilding} label="Category" value={jobListing.category?.name || 'N/A'} />
                    <InfoRow icon={FaMapMarkerAlt} label="Locations" value={jobListing.locations?.length ? jobListing.locations.map(l => l.name).join(', ') : 'N/A'} />
                    <InfoRow icon={FaMoneyBillWave} label="Salary" value={getSalaryDisplay()} highlight />
                    <InfoRow icon={FaGraduationCap} label="Education" value={jobListing.education_requirement || 'Not specified'} />
                    <InfoRow icon={FaCalendarAlt} label="Publish Date" value={formatDate(jobListing.publish_at) || 'Immediately'} />
                    <InfoRow icon={FaClock} label="Deadline" value={formatDate(jobListing.application_deadline)} highlight={expired} />

                    {jobListing.required_linkedin_link && (
                      <InfoRow icon={FaLinkedin} label="LinkedIn Required" value="Yes" />
                    )}
                    {jobListing.required_facebook_link && (
                      <InfoRow icon={FaFacebook} label="Facebook Required" value="Yes" />
                    )}
                  </div>
                </div>

                {/* Employer Card */}
                {jobListing.employer && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-cyan-600 to-blue-600">
                      <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                        <FaBuilding size={14} />
                        Employer Information
                      </h2>
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br from-cyan-100 to-blue-100 flex items-center justify-center shrink-0">
                          <FaBuilding className="text-blue-600" size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{jobListing.employer.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">Employer</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <InfoRow icon={FaEnvelope} label="Email" value={jobListing.employer.email} />
                        {jobListing.employer.phone && <InfoRow icon={FaPhone} label="Phone" value={jobListing.employer.phone} />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 bg-linear-to-r from-blue-600 to-indigo-600">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <FaUsers size={16} />
                    All Applications
                  </h2>
                  {canViewApplications && (
                    <Link
                      href={route('backend.listing.applications', jobListing.id)}
                      className="text-white/90 hover:text-white text-xs sm:text-sm font-medium underline underline-offset-2"
                    >
                      View All Applications →
                    </Link>
                  )}
                </div>
              </div>

              {recentApplications?.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentApplications.map((app) => (
                    <Link
                      key={app.id}
                      href={route('backend.applications.show', app.id)}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-all group gap-2 sm:gap-0"
                    >
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {app.name || 'N/A'}
                          </p>
                          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            app.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-green-100 text-green-800'
                            }`}>
                            {app.status || 'pending'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{app.email || ''}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">Applied: {formatDateTime(app.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-start sm:justify-end mt-2 sm:mt-0">
                        {app.ats_score !== null && app.ats_score !== undefined && (
                          <div className={`px-2 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-bold ${getAtsBadge(app.ats_score)}`}>
                            ATS: {Math.round(app.ats_score)}%
                          </div>
                        )}
                        <FaEye className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" size={14} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FaUsers className="text-gray-400" size={20} />
                  </div>
                  <p className="text-sm sm:text-base text-gray-500">No applications received yet.</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Applications will appear here once candidates apply.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* ATS Score Distribution */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-teal-600 to-green-600">
                  <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <FaChartLine size={14} />
                    ATS Score Analysis
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-3xl sm:text-5xl font-bold text-teal-600">
                      {averageAtsScore === null || averageAtsScore === undefined ? 'N/A' : `${averageAtsScore}%`}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Average ATS Score</p>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Pending Review</span>
                      <span className="font-semibold">{applicationStats?.pending ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Shortlisted</span>
                      <span className="font-semibold">{applicationStats?.shortlisted ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Rejected</span>
                      <span className="font-semibold">{applicationStats?.rejected ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Hired</span>
                      <span className="font-semibold">{applicationStats?.hired ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-orange-600 to-red-600">
                  <h2 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <FaEye size={14} />
                    Performance Metrics
                  </h2>
                </div>
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                      <span className="text-gray-600">View to Application Rate</span>
                      <span className="font-semibold">
                        {totalViews > 0 ? `${Math.round(((applicationStats?.total ?? 0) / totalViews) * 100)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div
                        className="bg-blue-600 rounded-full h-1.5 sm:h-2 transition-all duration-500"
                        style={{ width: totalViews > 0 ? `${((applicationStats?.total ?? 0) / totalViews) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                      <span className="text-gray-600">Shortlist Rate</span>
                      <span className="font-semibold">
                        {(applicationStats?.total ?? 0) > 0 ? `${Math.round(((applicationStats?.shortlisted ?? 0) / (applicationStats?.total ?? 1)) * 100)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div
                        className="bg-green-600 rounded-full h-1.5 sm:h-2 transition-all duration-500"
                        style={{ width: (applicationStats?.total ?? 0) > 0 ? `${((applicationStats?.shortlisted ?? 0) / (applicationStats?.total ?? 1)) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                      <span className="text-gray-600">Hire Rate</span>
                      <span className="font-semibold">
                        {(applicationStats?.total ?? 0) > 0 ? `${Math.round(((applicationStats?.hired ?? 0) / (applicationStats?.total ?? 1)) * 100)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div
                        className="bg-purple-600 rounded-full h-1.5 sm:h-2 transition-all duration-500"
                        style={{ width: (applicationStats?.total ?? 0) > 0 ? `${((applicationStats?.hired ?? 0) / (applicationStats?.total ?? 1)) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}