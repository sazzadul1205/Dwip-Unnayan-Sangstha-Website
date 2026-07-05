/* eslint-disable no-undef */
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
  FaBookmark,
  FaPrint,
  FaFacebook,
  FaLinkedin,
  FaEnvelope,
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

export default function PublicJobListingShow({
  jobListing,
  hasApplied,
  relatedJobs,
  applicationStats,
  averageAtsScore,
  isBookmarked: initialIsBookmarked = false,
  bookmarkId: initialBookmarkId = null,
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
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(initialBookmarkId);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

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

  // Format date and time

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
          router.visit(route('login', { redirect: route('backend.public-jobs.show', jobListing.slug) }));
        }
      });
      return;
    }

    setIsApplying(true);
    router.visit(route('backend.apply.create', jobListing.slug), {
      onFinish: () => setIsApplying(false),
    });
  };

  // Bookmark Handler
  const handleBookmark = () => {
    if (!isAuthenticated) {
      Swal.fire({
        title: 'Login Required',
        text: 'Please login to save jobs to your bookmarks.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Login Now',
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          router.visit(route('login', { redirect: route('backend.public-jobs.show', jobListing.slug) }));
        }
      });
      return;
    }

    setIsSavingBookmark(true);

    if (isBookmarked) {
      // Remove bookmark
      router.delete(route('bookmarks.destroy', bookmarkId), {
        preserveScroll: true,
        onSuccess: () => {
          setIsBookmarked(false);
          setBookmarkId(null);
          Swal.fire({
            icon: 'success',
            title: 'Removed',
            text: 'Job removed from your bookmarks.',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        onError: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error?.message || 'Failed to remove bookmark.',
          });
        },
        onFinish: () => setIsSavingBookmark(false),
      });
    } else {
      // Add bookmark
      router.post(route('bookmarks.store'), {
        job_listing_id: jobListing.id,
      }, {
        preserveScroll: true,
        onSuccess: (response) => {
          setIsBookmarked(true);
          setBookmarkId(response.props.bookmarkId);
          Swal.fire({
            icon: 'success',
            title: 'Saved!',
            text: 'Job saved to your bookmarks.',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        onError: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error?.message || 'Failed to save bookmark.',
          });
        },
        onFinish: () => setIsSavingBookmark(false),
      });
    }
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

  // Print Handler
  const handlePrint = () => {
    window.print();
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
      <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-gray-50/50 to-white border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Icon className="text-blue-600" size={16} />
          </div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
        {badge && badge}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  // Info Row Component
  const InfoRow = ({ label, value, isHtml = false }) => (
    <div className="py-3 first:pt-0 last:pb-0 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">{label}</dt>
      <dd className="text-gray-800">
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
      <div className="flex flex-wrap gap-2">
        {items?.length > 0 ? (
          items.map((item, index) => (
            <span
              key={index}
              className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${colorClasses[color] || colorClasses.blue}`}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-gray-400 italic text-sm">None provided</span>
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
      <div className="bg-linear-to-br rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 ring-1 ring-gray-100 shadow-sm hover:shadow-md">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br ${colorClasses[color]} mb-2.5`}>
          <Icon className={`text-${color === 'blue' ? 'blue' : color === 'purple' ? 'purple' : color === 'indigo' ? 'indigo' : 'gray'}-600`} size={16} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{value}</h3>
        <p className="text-xs text-gray-500 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
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
          <div className="relative  mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
            <button
              onClick={() => window.history.back()}
              className="group inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-all duration-200 hover:-translate-x-0.5"
            >
              <FaArrowLeft size={14} />
              <span className="text-sm font-medium">Back to Jobs</span>
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">{jobListing.title}</h1>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-white/20 ring-1 ring-white/30">
                    {getJobTypeLabel(jobListing.job_type)}
                  </span>
                  {jobListing.experience_level && (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-white/10 ring-1 ring-white/20">
                      {getExperienceLabel(jobListing.experience_level)}
                    </span>
                  )}
                  {isJobOwner && (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/30 backdrop-blur-sm ring-1 ring-amber-400/50">
                      <FaBuilding size={12} className="mr-1" />
                      Your Job
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <FaBuilding size={14} className="opacity-70" />
                    <span>{jobListing.employer?.name || 'Company'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt size={14} className="opacity-70" />
                    <span>
                      {jobListing.locations?.length > 0
                        ? jobListing.locations.map(l => l.name).join(', ')
                        : 'Location not specified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaDollarSign size={14} className="opacity-70" />
                    <span className="font-medium">{getSalaryDisplay()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleBookmark}
                  disabled={isSavingBookmark}
                  className={`p-2.5 rounded-xl transition-all duration-200 backdrop-blur-sm hover:scale-105 ${isSavingBookmark
                    ? 'bg-white/10 opacity-50 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20'
                    }`}
                  title="Bookmark"
                >
                  {isSavingBookmark ? (
                    <FaSpinner className="animate-spin text-white/80" size={16} />
                  ) : (
                    <FaBookmark className={isBookmarked ? 'text-amber-400' : 'text-white/80'} size={16} />
                  )}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm hover:scale-105"
                    title="Share"
                  >
                    <FaShare size={16} className="text-white/80" />
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-fadeIn">
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        <FaExternalLinkAlt size={14} className="text-gray-400" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        <FaFacebook size={14} className="text-blue-600" />
                        Facebook
                      </button>
                      <button
                        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm rounded-b-xl"
                      >
                        <FaLinkedin size={14} className="text-blue-700" />
                        LinkedIn
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handlePrint}
                  className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm hover:scale-105"
                  title="Print"
                >
                  <FaPrint size={16} className="text-white/80" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deadline Alert */}
              {!isExpired && (
                <div className={`rounded-2xl bg-linear-to-r p-5 border ${deadlineColor}`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white/50 rounded-xl">
                        <FaClock size={20} />
                      </div>
                      <div>
                        <p className="font-semibold">Application Deadline</p>
                        <p className="text-sm opacity-80">{formatDate(jobListing.application_deadline)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold">{getDaysLeft(jobListing.application_deadline)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Employer Actions - Only visible to job owner */}
              {canEditJob && !isExpired && (
                <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-xl">
                        <FaBuilding className="text-amber-600" size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-amber-800">Employer Actions</h3>
                        <p className="text-sm text-amber-600">Manage your job posting</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleEditJob}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
                      >
                        Edit Job
                      </button>
                      <button
                        onClick={handleManageApplications}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        View Applications ({applicationStats.total || 0})
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Button - Only for job seekers */}
              {!isExpired && !hasApplied && !isJobOwner && (
                <div className="bg-linear-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <FaRocket className="text-emerald-600" size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-emerald-800">Ready to apply?</h3>
                        <p className="text-sm text-emerald-600">Submit your application before the deadline</p>
                      </div>
                    </div>
                    <button
                      onClick={handleApply}
                      disabled={isApplying}
                      className="px-6 py-2.5 bg-linear-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isApplying ? (
                        <>
                          <FaSpinner className="animate-spin" size={16} />
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
                <div className="bg-linear-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-200 p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-sky-100 rounded-xl">
                      <FaCheckCircle className="text-sky-600" size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sky-800">You have already applied for this position</p>
                      <p className="text-sm text-sky-600">Your application is being reviewed by the employer</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Description */}
              <InfoSection title="Job Description" icon={FaBriefcase}>
                <div className="prose prose-sm max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: jobListing.description }} />
              </InfoSection>

              {/* Requirements */}
              <InfoSection title="Requirements & Qualifications" icon={FaListCheck}>
                <div className="prose prose-sm max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: jobListing.requirements }} />
              </InfoSection>

              {/* Responsibilities */}
              {jobListing.responsibilities?.length > 0 && (
                <InfoSection title="Key Responsibilities" icon={FaListUl}>
                  <ul className="space-y-2.5">
                    {jobListing.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
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
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard title="Total Views" value={jobListing.views_count?.toLocaleString() || 0} color="blue" icon={FaEye} />
                <StatCard title="Applications" value={applicationStats.total || 0} color="purple" icon={FaUsers} />
                <StatCard title="Avg. ATS Score" value={averageAtsScore ? `${averageAtsScore}%` : 'N/A'} color="indigo" icon={FaChartLine} />
                <StatCard title="Posted" value={formatDate(jobListing.created_at)} color="gray" icon={FaCalendarAlt} subtitle="Date posted" />
              </div>

              {/* Basic Info Card */}
              <InfoSection title="Job Information" icon={FaInfoCircle}>
                <dl className="space-y-3">
                  <InfoRow label="Job Type" value={getJobTypeLabel(jobListing.job_type)} />
                  <InfoRow label="Experience Level" value={getExperienceLabel(jobListing.experience_level)} />
                  <InfoRow label="Category" value={jobListing.category?.name || 'N/A'} />
                  <InfoRow label="Salary" value={getFormattedSalaryRange()} />
                </dl>
              </InfoSection>

              {/* Location Card */}
              <InfoSection title="Job Location" icon={FaMapMarkerAlt}>
                {jobListing.locations?.length > 0 ? (
                  <div className="space-y-3">
                    {jobListing.locations.map((location, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-gray-400 mt-0.5 shrink-0" size={14} />
                        <div>
                          <p className="text-gray-900 font-medium">{location.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">Location not specified</p>
                )}
              </InfoSection>

              {/* Dates Card */}
              <InfoSection title="Important Dates" icon={FaCalendarAlt}>
                <dl className="space-y-3">
                  <InfoRow
                    label="Application Deadline"
                    value={
                      <div className={`flex items-center gap-2 ${isExpired ? 'text-rose-600' : 'text-gray-900'}`}>
                        <FaCalendarAlt size={12} />
                        <span className="font-medium">{formatDate(jobListing.application_deadline)}</span>
                        {isExpired && (
                          <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">Expired</span>
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
                    <p className="text-gray-900 font-medium mb-2">{jobListing.education_requirement}</p>
                  )}
                  {jobListing.education_details && (
                    <p className="text-sm text-gray-500">{jobListing.education_details}</p>
                  )}
                </InfoSection>
              )}

              {/* Employer Info Card */}
              {jobListing.employer && (
                <InfoSection title="About the Employer" icon={FaBuilding}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FaBuilding className="text-gray-500" size={14} />
                      </div>
                      <span className="text-gray-900 font-medium">{jobListing.employer.name}</span>
                    </div>
                    {jobListing.employer.email && (
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="text-gray-400" size={14} />
                        <a href={`mailto:${jobListing.employer.email}`} className="text-blue-600 hover:text-blue-700 hover:underline text-sm">
                          {jobListing.employer.email}
                        </a>
                      </div>
                    )}
                  </div>
                </InfoSection>
              )}
            </div>
          </div>

          {/* Related Jobs Section */}
          {relatedJobs && relatedJobs.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FaRocket className="text-blue-600" size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Similar Jobs You Might Like</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Explore other opportunities</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedJobs.map((job) => (
                  <a
                    key={job.id}
                    href={route('backend.public-jobs.show', job.slug)}
                    className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 border border-gray-100 hover:border-blue-200 block"
                  >
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <FaMapMarkerAlt size={12} />
                      <span className="line-clamp-1">{job.locations?.length > 0 ? job.locations[0].name : 'Location N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getJobTypeBadge(job.job_type)}`}>
                        {getJobTypeLabel(job.job_type)}
                      </span>
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <FaEye size={11} />
                          {job.views_count || 0}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FaUsers size={11} />
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
          margin-bottom: 0.875rem;
          line-height: 1.6;
        }
        
        .prose ul, .prose ol {
          margin-top: 0.5rem;
          margin-bottom: 0.875rem;
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