// resources/js/Pages/Public/JobListings/Show.jsx

// React
import { useState } from 'react';

// Inertia
import { Head, router } from '@inertiajs/react';

// Icons
import {
  FaArrowLeft,
  FaBriefcase,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaDollarSign,
  FaBuilding,
  FaGraduationCap,
  FaCheckCircle,
  FaEye,
  FaUsers,
  FaShare,
  FaFacebook,
  FaLinkedin,
  FaExternalLinkAlt,
  FaStar,
  FaChartLine,
  FaRocket,
  FaInfoCircle,
  FaSpinner,
} from 'react-icons/fa';
import { FaListUl, FaListCheck } from "react-icons/fa6";

// SweetAlert
import Swal from 'sweetalert2';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';

// ============================================
// SKELETON LOADING COMPONENTS
// ============================================

const SkeletonBadge = () => (
  <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-200 rounded-full animate-pulse" />
);

const SkeletonInfoCard = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50/50 border-b border-gray-100">
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-4 sm:h-5 w-24 sm:w-32 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
      <div className="space-y-2">
        <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-3.5 sm:h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-3.5 sm:h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

const SkeletonStatCard = () => (
  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center animate-pulse">
    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full mx-auto mb-1.5 sm:mb-2.5" />
    <div className="h-5 sm:h-6 w-12 sm:w-16 bg-gray-200 rounded mx-auto mb-0.5 sm:mb-1" />
    <div className="h-2.5 sm:h-3 w-16 sm:w-20 bg-gray-200 rounded mx-auto" />
  </div>
);

const SkeletonJobDetail = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Skeleton */}
      <div className="bg-gray-800 py-6 sm:py-8 lg:py-10">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 rounded animate-pulse" />
            <div className="h-3.5 sm:h-4 w-20 sm:w-24 bg-gray-600 rounded animate-pulse" />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-6">
            <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-6 sm:h-8 w-48 sm:w-64 bg-gray-600 rounded animate-pulse" />
                <SkeletonBadge />
                <SkeletonBadge />
              </div>
              <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2">
                <div className="h-3.5 sm:h-4 w-24 sm:w-32 bg-gray-600 rounded animate-pulse" />
                <div className="h-3.5 sm:h-4 w-28 sm:w-40 bg-gray-600 rounded animate-pulse" />
                <div className="h-3.5 sm:h-4 w-20 sm:w-28 bg-gray-600 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-xl animate-pulse" />
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-gray-100 rounded-2xl p-4 sm:p-5 animate-pulse">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl" />
                  <div>
                    <div className="h-3.5 sm:h-4 w-32 sm:w-40 bg-gray-200 rounded" />
                    <div className="h-2.5 sm:h-3 w-24 sm:w-32 bg-gray-200 rounded mt-1" />
                  </div>
                </div>
                <div className="h-5 sm:h-6 w-20 sm:w-24 bg-gray-200 rounded" />
              </div>
            </div>
            <SkeletonInfoCard />
            <SkeletonInfoCard />
            <SkeletonInfoCard />
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </div>
            <SkeletonInfoCard />
            <SkeletonInfoCard />
            <SkeletonInfoCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PublicJobListingShow({
  jobListing,
  hasApplied,
  relatedJobs,
  applicationStats,
  averageAtsScore,
}) {
  // Use centralized auth hook
  const {
    user: currentUser,
    isAuthenticated,
    hasRole,
    hasAnyPermission,
  } = useAuth();

  // Check user roles/permissions
  const isSuperAdmin = hasRole('super-admin');
  const isEmployer = hasRole('employer') || hasRole('employer-admin');
  const canManageJobs = hasAnyPermission(['jobs.manage', 'jobs.update']);

  // Check if current user owns this job
  const isJobOwner = isEmployer && currentUser?.employer_id === jobListing?.employer_id;

  // States
  const [isApplying, setIsApplying] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // If jobListing is not loaded yet, show skeleton
  if (!jobListing) {
    return (
      <AuthenticatedLayout>
        <Head title="Loading Job..." />
        <SkeletonJobDetail />
      </AuthenticatedLayout>
    );
  }

  // Format currency in BDT
  const formatCurrency = (amount) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('BDT', '৳');
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get days left
  const getDaysLeft = (deadline) => {
    const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'Expired';
    if (daysLeft === 0) return 'Today';
    if (daysLeft === 1) return 'Tomorrow';
    return `${daysLeft} days left`;
  };

  // Get deadline color
  const getDeadlineColor = () => {
    const daysLeft = Math.ceil((new Date(jobListing.application_deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) return 'from-red-50 to-red-100 border-red-200 text-red-800';
    if (daysLeft <= 7) return 'from-orange-50 to-amber-100 border-orange-200 text-orange-800';
    return 'from-green-50 to-emerald-100 border-green-200 text-green-800';
  };

  // Get job type label
  const getJobTypeLabel = (type) => {
    const types = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
      'remote': 'Remote',
      'hybrid': 'Hybrid',
    };
    return types[type] || type;
  };

  // Get job type badge
  const getJobTypeBadge = (type) => {
    const types = {
      'full-time': 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
      'part-time': 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
      'contract': 'bg-sky-100 text-sky-800 ring-1 ring-sky-200',
      'internship': 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
      'remote': 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200',
      'hybrid': 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
    };
    return types[type] || 'bg-gray-100 text-gray-800 ring-1 ring-gray-200';
  };

  // Get experience level label
  const getExperienceLabel = (level) => {
    const levels = {
      'entry': 'Entry Level',
      'junior': 'Junior',
      'mid-level': 'Mid Level',
      'senior': 'Senior',
      'lead': 'Lead',
      'executive': 'Executive',
    };
    return levels[level] || level;
  };

  // Get salary display
  const getSalaryDisplay = () => {
    if (jobListing.as_per_companies_policy) {
      return 'As per company policy';
    }
    if (jobListing.is_salary_negotiable) {
      return 'Negotiable';
    }
    if (jobListing.salary_min && jobListing.salary_max) {
      return `${formatCurrency(jobListing.salary_min)} — ${formatCurrency(jobListing.salary_max)}`;
    }
    if (jobListing.salary_min) {
      return `From ${formatCurrency(jobListing.salary_min)}`;
    }
    if (jobListing.salary_max) {
      return `Up to ${formatCurrency(jobListing.salary_max)}`;
    }
    return 'Not specified';
  };

  // Get formatted salary range
  const getFormattedSalaryRange = () => {
    if (jobListing.as_per_companies_policy) {
      return 'As per company policy';
    }
    if (jobListing.is_salary_negotiable) {
      return 'Negotiable';
    }
    if (jobListing.salary_min && jobListing.salary_max) {
      return `${formatCurrency(jobListing.salary_min)} — ${formatCurrency(jobListing.salary_max)}`;
    }
    if (jobListing.salary_min) {
      return `From ${formatCurrency(jobListing.salary_min)}`;
    }
    if (jobListing.salary_max) {
      return `Up to ${formatCurrency(jobListing.salary_max)}`;
    }
    return 'Not specified';
  };

  // Apply Handler
  const handleApply = () => {
    if (!isAuthenticated) {
      Swal.fire({
        title: 'Login Required',
        text: 'Please login or create an account to apply for this job.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Login Now',
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          router.visit(route('login', { redirect: route('public.jobs.show', jobListing.slug) }));
        }
      });
      return;
    }

    setIsApplying(true);
    router.visit(route('backend.apply.create', jobListing.slug), {
      onFinish: () => setIsApplying(false),
    });
  };

  // Share Handler
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    Swal.fire({
      icon: 'success',
      title: 'Link Copied!',
      text: 'Job link has been copied to clipboard.',
      timer: 2000,
      showConfirmButton: false,
    });
    setShowShareMenu(false);
  };

  // Edit Job Handler (for employers)
  const handleEditJob = () => {
    router.visit(route('employer.jobs.edit', jobListing.slug));
  };

  // Manage Applications Handler (for employers)
  const handleManageApplications = () => {
    router.visit(route('employer.jobs.applications', jobListing.slug));
  };

  // Info Section Component
  const InfoSection = ({ title, icon: Icon, children, badge }) => (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-gray-50/50 to-white border-b border-gray-100">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Icon className="text-blue-600" size={14} />
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">{title}</h2>
        </div>
        {badge && badge}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );

  // Info Row Component
  const InfoRow = ({ label, value, isHtml = false }) => (
    <div className="py-2.5 sm:py-3 first:pt-0 last:pb-0 border-b border-gray-100 last:border-0">
      <dt className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5">{label}</dt>
      <dd className="text-sm sm:text-base text-gray-800">
        {isHtml ? (
          <div dangerouslySetInnerHTML={{ __html: value }} className="prose prose-sm max-w-none" />
        ) : (
          value || <span className="text-gray-400 italic">Not provided</span>
        )}
      </dd>
    </div>
  );

  // Tag List Component
  const TagList = ({ items, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
      green: 'bg-green-50 text-green-700 ring-1 ring-green-200',
      purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
      amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    };
    return (
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {items?.length > 0 ? (
          items.map((item, index) => (
            <span
              key={index}
              className={`inline-flex px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${colorClasses[color] || colorClasses.blue}`}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-gray-400 italic text-xs sm:text-sm">None provided</span>
        )}
      </div>
    );
  };

  // Stat Card Component
  const StatCard = ({ title, value, color, icon: Icon, subtitle }) => {
    const colorClasses = {
      blue: 'from-blue-50 to-sky-50 ring-blue-100',
      purple: 'from-purple-50 to-fuchsia-50 ring-purple-100',
      indigo: 'from-indigo-50 to-blue-50 ring-indigo-100',
      gray: 'from-gray-50 to-slate-50 ring-gray-100',
    };
    return (
      <div className="bg-linear-to-br rounded-xl p-3 sm:p-4 text-center transition-all duration-300 hover:scale-105 ring-1 ring-gray-100 shadow-sm hover:shadow-md">
        <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-br ${colorClasses[color]} mb-1.5 sm:mb-2.5`}>
          <Icon className={`text-${color === 'blue' ? 'blue' : color === 'purple' ? 'purple' : color === 'indigo' ? 'indigo' : 'gray'}-600`} size={14} />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{value}</h3>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{title}</p>
        {subtitle && <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    );
  };

  // Deadline Card Component
  const deadlineColor = getDeadlineColor();
  const isExpired = new Date(jobListing.application_deadline) < new Date();
  const canEditJob = isJobOwner || isSuperAdmin || canManageJobs;

  return (
    <AuthenticatedLayout>
      <Head title={`${jobListing.title} - Job Details`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
        {/* Hero Section */}
        <div className="relative bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/5" />
          <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <button
              onClick={() => window.history.back()}
              className="group inline-flex items-center gap-1.5 sm:gap-2 text-white/70 hover:text-white mb-4 sm:mb-6 transition-all duration-200 hover:-translate-x-0.5 text-xs sm:text-sm"
            >
              <FaArrowLeft size={12} />
              <span className="font-medium">Back to Jobs</span>
            </button>

            <div className="flex flex-col sm:flex-row flex-wrap items-start justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">{jobListing.title}</h1>
                  <span className="inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-sm bg-white/20 ring-1 ring-white/30">
                    {getJobTypeLabel(jobListing.job_type)}
                  </span>
                  {jobListing.experience_level && (
                    <span className="inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-sm bg-white/10 ring-1 ring-white/20">
                      {getExperienceLabel(jobListing.experience_level)}
                    </span>
                  )}
                  {isJobOwner && (
                    <span className="inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-amber-500/30 backdrop-blur-sm ring-1 ring-amber-400/50">
                      <FaBuilding size={10} className="mr-1" />
                      Your Job
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm text-white/80">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FaBuilding size={12} className="opacity-70" />
                    <span>{jobListing.employer?.name || 'Company'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FaMapMarkerAlt size={12} className="opacity-70" />
                    <span className="line-clamp-1">
                      {jobListing.locations?.length > 0
                        ? jobListing.locations.map(l => l.name).join(', ')
                        : 'Location not specified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FaDollarSign size={12} className="opacity-70" />
                    <span className="font-medium">{getSalaryDisplay()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-2 sm:p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm hover:scale-105"
                    title="Share"
                  >
                    <FaShare size={14} className="text-white/80" />
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-fadeIn">
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                      >
                        <FaExternalLinkAlt size={12} className="text-gray-400" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`)}
                        className="flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                      >
                        <FaFacebook size={12} className="text-blue-600" />
                        Facebook
                      </button>
                      <button
                        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`)}
                        className="flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm rounded-b-xl"
                      >
                        <FaLinkedin size={12} className="text-blue-700" />
                        LinkedIn
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Deadline Alert */}
              {!isExpired && (
                <div className={`rounded-2xl bg-linear-to-r p-4 sm:p-5 border ${deadlineColor}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-1.5 sm:p-2 bg-white/50 rounded-xl">
                        <FaClock size={16} />
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-semibold">Application Deadline</p>
                        <p className="text-xs sm:text-sm opacity-80">{formatDate(jobListing.application_deadline)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-bold">{getDaysLeft(jobListing.application_deadline)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Employer Actions - Only visible to job owner */}
              {canEditJob && !isExpired && (
                <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-amber-100 rounded-xl">
                        <FaBuilding className="text-amber-600" size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-amber-800">Employer Actions</h3>
                        <p className="text-xs sm:text-sm text-amber-600">Manage your job posting</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleEditJob}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-xs sm:text-sm font-medium"
                      >
                        Edit Job
                      </button>
                      <button
                        onClick={handleManageApplications}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm font-medium"
                      >
                        View Apps ({applicationStats.total || 0})
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Button - Only for job seekers */}
              {!isExpired && !hasApplied && !isJobOwner && (
                <div className="bg-linear-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-xl">
                        <FaRocket className="text-emerald-600" size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-emerald-800">Ready to apply?</h3>
                        <p className="text-xs sm:text-sm text-emerald-600">Submit before the deadline</p>
                      </div>
                    </div>
                    <button
                      onClick={handleApply}
                      disabled={isApplying}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-linear-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isApplying ? (
                        <>
                          <FaSpinner className="animate-spin" size={14} />
                          Processing...
                        </>
                      ) : (
                        'Apply Now'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {hasApplied && !isJobOwner && (
                <div className="bg-linear-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-200 p-4 sm:p-5">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-1.5 sm:p-2 bg-sky-100 rounded-xl">
                      <FaCheckCircle className="text-sky-600" size={16} />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-sky-800">You have already applied</p>
                      <p className="text-xs sm:text-sm text-sky-600">Your application is being reviewed</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Description */}
              <InfoSection title="Job Description" icon={FaBriefcase}>
                <div className="prose prose-sm sm:prose-base max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: jobListing.description }} />
              </InfoSection>

              {/* Requirements */}
              <InfoSection title="Requirements & Qualifications" icon={FaListCheck}>
                <div className="prose prose-sm sm:prose-base max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: jobListing.requirements }} />
              </InfoSection>

              {/* Responsibilities */}
              {jobListing.responsibilities?.length > 0 && (
                <InfoSection title="Key Responsibilities" icon={FaListUl}>
                  <ul className="space-y-2 sm:space-y-2.5">
                    {jobListing.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-gray-700">
                        <span className="text-emerald-500 mt-0.5">▹</span>
                        <span className="leading-relaxed">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </InfoSection>
              )}

              {/* Benefits */}
              {jobListing.benefits?.length > 0 && (
                <InfoSection title="Benefits & Perks" icon={FaCheckCircle}>
                  <TagList items={jobListing.benefits} color="green" />
                </InfoSection>
              )}

              {/* Skills */}
              {jobListing.skills?.length > 0 && (
                <InfoSection title="Required Skills" icon={FaStar}>
                  <TagList items={jobListing.skills} color="blue" />
                </InfoSection>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <StatCard title="Total Views" value={jobListing.views_count?.toLocaleString() || 0} color="blue" icon={FaEye} />
                <StatCard title="Applications" value={applicationStats.total || 0} color="purple" icon={FaUsers} />
                <StatCard title="Avg. ATS Score" value={averageAtsScore ? `${averageAtsScore}%` : 'N/A'} color="indigo" icon={FaChartLine} />
                <StatCard title="Posted" value={formatDate(jobListing.created_at)} color="gray" icon={FaCalendarAlt} subtitle="Date posted" />
              </div>

              {/* Basic Info Card */}
              <InfoSection title="Job Information" icon={FaInfoCircle}>
                <dl className="space-y-2 sm:space-y-3">
                  <InfoRow label="Job Type" value={getJobTypeLabel(jobListing.job_type)} />
                  <InfoRow label="Experience Level" value={getExperienceLabel(jobListing.experience_level)} />
                  <InfoRow label="Category" value={jobListing.category?.name || 'N/A'} />
                  <InfoRow label="Salary" value={getFormattedSalaryRange()} />
                </dl>
              </InfoSection>

              {/* Location Card */}
              <InfoSection title="Job Location" icon={FaMapMarkerAlt}>
                {jobListing.locations?.length > 0 ? (
                  <div className="space-y-2.5 sm:space-y-3">
                    {jobListing.locations.map((location, idx) => (
                      <div key={idx} className="flex items-start gap-2 sm:gap-3">
                        <FaMapMarkerAlt className="text-gray-400 mt-0.5 shrink-0" size={12} />
                        <div>
                          <p className="text-sm sm:text-base text-gray-900 font-medium">{location.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm sm:text-base">Location not specified</p>
                )}
              </InfoSection>

              {/* Dates Card */}
              <InfoSection title="Important Dates" icon={FaCalendarAlt}>
                <dl className="space-y-2 sm:space-y-3">
                  <InfoRow
                    label="Application Deadline"
                    value={
                      <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 ${isExpired ? 'text-rose-600' : 'text-gray-900'}`}>
                        <FaCalendarAlt size={12} />
                        <span className="font-medium text-sm sm:text-base">{formatDate(jobListing.application_deadline)}</span>
                        {isExpired && (
                          <span className="text-[10px] sm:text-xs bg-rose-100 text-rose-600 px-1.5 sm:px-2 py-0.5 rounded-full">Expired</span>
                        )}
                      </div>
                    }
                  />
                  <InfoRow label="Posted On" value={formatDate(jobListing.created_at)} />
                  {jobListing.publish_at && (
                    <InfoRow label="Published On" value={formatDate(jobListing.publish_at)} />
                  )}
                </dl>
              </InfoSection>

              {/* Education Card */}
              {(jobListing.education_requirement || jobListing.education_details) && (
                <InfoSection title="Education Requirements" icon={FaGraduationCap}>
                  {jobListing.education_requirement && (
                    <p className="text-sm sm:text-base text-gray-900 font-medium mb-1.5 sm:mb-2">{jobListing.education_requirement}</p>
                  )}
                  {jobListing.education_details && (
                    <p className="text-xs sm:text-sm text-gray-500">{jobListing.education_details}</p>
                  )}
                </InfoSection>
              )}
            </div>
          </div>

          {/* Related Jobs Section */}
          {relatedJobs && relatedJobs.length > 0 && (
            <div className="mt-8 sm:mt-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-xl">
                  <FaRocket className="text-blue-600" size={16} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Similar Jobs You Might Like</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Explore other opportunities</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {relatedJobs.map((job) => (
                  <a
                    key={job.id}
                    href={route('public.jobs.show', job.slug)}
                    className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 sm:p-5 border border-gray-100 hover:border-blue-200 block"
                  >
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5 sm:mb-2">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                      <FaMapMarkerAlt size={10} />
                      <span className="line-clamp-1">{job.locations?.length > 0 ? job.locations[0].name : 'Location N/A'}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                      <span className={`inline-flex px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getJobTypeBadge(job.job_type)}`}>
                        {getJobTypeLabel(job.job_type)}
                      </span>
                      <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-400">
                        <span className="flex items-center gap-1 sm:gap-1.5">
                          <FaEye size={10} />
                          {job.views_count || 0}
                        </span>
                        <span className="flex items-center gap-1 sm:gap-1.5">
                          <FaUsers size={10} />
                          {job.applications_count || 0}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .bg-linear-to-br, .bg-linear-to-r, .bg-blue-50, .bg-emerald-50, button, a {
            background: white !important;
            color: black !important;
          }
          .shadow-sm, .shadow-md, .shadow-lg {
            box-shadow: none !important;
          }
          button, .p-2, .bg-white\\/10, .backdrop-blur-sm {
            display: none !important;
          }
          .rounded-2xl, .rounded-xl {
            border: 1px solid #e5e7eb !important;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
        
        .prose {
          max-width: none;
          color: #374151;
        }
        
        .prose p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        
        .prose ul, .prose ol {
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
          padding-left: 1.5rem;
        }
        
        .prose li {
          margin-bottom: 0.375rem;
        }
        
        .prose h1, .prose h2, .prose h3 {
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        
        .prose h4, .prose h5, .prose h6 {
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </AuthenticatedLayout>
  );
}