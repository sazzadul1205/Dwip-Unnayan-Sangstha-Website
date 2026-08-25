// resources/js/pages/Backend/Applications/Show.jsx

// React
import { useState } from 'react';

// Inertia
import { Head, router } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';

// Icons
import {
  FaArrowLeft,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaEnvelope,
  FaFilePdf,
  FaGraduationCap,
  FaHistory,
  FaHourglassHalf,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPhone,
  FaTimesCircle,
  FaTrophy,
  FaUserCheck,
  FaUserSlash,
  FaAward,
  FaFacebook,
  FaLinkedin,
  FaSpinner,
  FaUserCircle,
  FaShieldAlt,
} from 'react-icons/fa';

// SweetAlert2
import Swal from 'sweetalert2';

// Helper functions for resume download
const safeFilename = (name) => {
  return name
    ? String(name)
      .replace(/[^a-z0-9\s\-_.]/gi, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[._-]+|[._-]+$/g, '')
      .substring(0, 200) || 'resume'
    : 'resume';
};

// Helper function to extract filename from Content-Disposition header
const extractFilenameFromDisposition = (header) => {
  if (!header) return null;
  const match = header.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (!match) return null;
  const filename = match[1].replace(/['"]/g, '').trim();
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
};

export default function Show({ application, atsAnalysis }) {
  // Use centralized auth hook
  const {
    user: currentUser,
    hasAnyPermission,
    hasRole,
  } = useAuth();

  // Check permissions for application management
  const isEmployer = hasRole('employer') || hasRole('employer-admin');
  const canViewApplications = hasAnyPermission(['applications.view', 'applications.manage']);
  const canDownloadResumes = hasAnyPermission(['applications.download_resume', 'applications.manage']);

  // Check if user is the applicant owner
  const isApplicantOwner = currentUser?.id === application?.user_id;

  // Check if user owns the job this application is for
  const isJobOwner = isEmployer && currentUser?.id === application?.job_listing?.user_id;

  // Determine if user can view this application
  const canView = canViewApplications || isApplicantOwner || isJobOwner;

  // Determine if user can update status
  const canUpdateStatus = hasAnyPermission(['applications.status.update', 'applications.manage']) || isJobOwner;

  // Determine if user can download resume
  const canDownload = canDownloadResumes || isJobOwner || isApplicantOwner;

  // Determine if user can recalculate ATS
  const canRecalcAts = hasAnyPermission(['applications.recalculate_ats', 'applications.manage']) || isJobOwner;

  // State
  const [isDownloadingCv, setIsDownloadingCv] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(application.status);

  // Statuses
  const statuses = ['pending', 'shortlisted', 'rejected', 'hired'];

  // If user doesn't have permission to view this application, show access denied
  if (!canView) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">
              You don't have permission to view this application.
            </p>
            <button
              onClick={() => router.visit(route('backend.dashboard'))}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaHourglassHalf className="text-yellow-500" size={20} />,
      shortlisted: <FaUserCheck className="text-blue-500" size={20} />,
      rejected: <FaUserSlash className="text-red-500" size={20} />,
      hired: <FaCheckCircle className="text-green-500" size={20} />
    };
    return icons[status] || <FaBriefcase className="text-gray-500" size={20} />;
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

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format date and time
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format salary
  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    return `${new Intl.NumberFormat('en-US').format(salary)} BDT`;
  };

  // Handle status update
  const handleStatusUpdate = () => {
    if (!canUpdateStatus) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to update application status.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    if (selectedStatus === application.status) return;

    Swal.fire({
      title: 'Update Status?',
      text: `Change application status from ${getStatusText(application.status)} to ${getStatusText(selectedStatus)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsUpdatingStatus(true);

        router.put(route('backend.applications.update-status', application.id), {
          status: selectedStatus,
          notes: `Status updated to ${selectedStatus} from application details page`,
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: 'Application status has been updated.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload({ preserveScroll: true });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Update Failed',
              text: error?.message || 'Failed to update status.',
              confirmButtonColor: '#d33',
            });
            setSelectedStatus(application.status);
          },
          onFinish: () => setIsUpdatingStatus(false),
        });
      } else {
        setSelectedStatus(application.status);
      }
    });
  };

  // Handle download resume
  const handleDownloadResume = async (app) => {
    if (!canDownload) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to download this resume.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    setIsDownloadingCv(true);

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

      // Use a safe extension, default to 'pdf' if can't determine
      const ext = (serverExt && serverExt.length <= 6) ? serverExt : 'pdf';
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

      // Success notification (optional)
      Swal.fire({
        icon: 'success',
        title: 'Downloaded!',
        text: `Resume downloaded as ${desiredFilename}`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error('Download error:', e);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: e?.message || 'Failed to download resume. Please try again.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsDownloadingCv(false);
    }
  };

  // Handle recalculate ATS
  const handleRecalculateAts = () => {
    if (!canRecalcAts) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to recalculate ATS score.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    Swal.fire({
      title: 'Recalculate ATS Score?',
      text: 'This will re-analyze the resume against the job requirements.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Recalculate',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Processing...',
          text: 'Please wait while we analyze the resume.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        router.post(route('backend.applications.recalculate-ats', application.id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Recalculated!',
              text: 'ATS score has been updated.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload({ preserveScroll: true });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Calculation Failed',
              text: error?.message || 'Failed to recalculate ATS score.',
              confirmButtonColor: '#d33',
            });
          },
        });
      }
    });
  };

  // Get application data
  const job = application.job_listing;
  const profile = application.applicant_profile;
  const user = profile?.user;

  // Get profile photo URL (adjust based on your storage structure)
  const getProfilePhoto = () => {
    if (!profile?.photo_path) return null;

    // If the backend already provided a URL, prefer it.
    if (profile.photo_url) return profile.photo_url;

    // Normalize stored paths (handles older URL-encoded values and accidental `storage/` prefix)
    let path = profile.photo_path;
    try {
      path = decodeURIComponent(path);
    } catch {
      // ignore decode errors
    }
    path = path.replace(/^\/+/, '');
    if (path.startsWith('storage/')) path = path.slice('storage/'.length);

    return `/storage/${path}`;
  };

  // Determine which role is viewing
  const isAdminView = canViewApplications;
  const isEmployerView = isJobOwner && !isAdminView;
  const isApplicantView = isApplicantOwner && !isAdminView && !isEmployerView;

  return (
    <AuthenticatedLayout>
      <Head title={`Application: ${application.name} - ${job?.title}`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
        <div className=" mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors group"
              >
                <FaArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">Back</span>
              </button>
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Application Details
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {application.name} - {job?.title}
              </p>
              {isAdminView && (
                <p className="text-xs text-blue-600 mt-1">
                  👑 Admin view
                </p>
              )}
              {isEmployerView && (
                <p className="text-xs text-green-600 mt-1">
                  🏢 Employer view - You own this job
                </p>
              )}
              {isApplicantView && (
                <p className="text-xs text-purple-600 mt-1">
                  👤 Your application
                </p>
              )}
            </div>

            {canDownload && (
              <button
                onClick={() => handleDownloadResume(application)}
                className="px-5 py-2.5 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-xl flex items-center gap-2 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                {isDownloadingCv ? <FaSpinner className="animate-spin" size={14} /> : <FaDownload size={14} />}
                Download Resume
              </button>
            )}
          </div>

          {/* Two Column Layout - 80/20 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT COLUMN - 80% (3/4 of grid) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Job Summary Card - Enhanced */}
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <FaBriefcase className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{job?.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FaBuilding size={12} />
                        {job?.employer?.name || 'Company'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      <FaMapMarkerAlt size={12} className="text-red-500" />
                      <span>{job?.locations?.[0]?.name || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      <FaCalendarAlt size={12} className="text-blue-500" />
                      <span>{formatDate(job?.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Applicant Information Card - Enhanced with Photo and CV Download */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <FaUserCircle size={22} className="text-blue-500" />
                  Applicant Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column - Profile Image & Basic Info */}
                  <div className="md:col-span-1">
                    <div className="flex flex-col items-center text-center">
                      {getProfilePhoto() ? (
                        <img
                          src={getProfilePhoto()}
                          alt={application.name}
                          className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                          <span className="text-white text-4xl font-bold">
                            {application.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <h3 className="font-bold text-gray-900 text-lg mt-3">{application.name}</h3>
                      <p className="text-sm text-gray-500">{user?.email || application.email}</p>

                      {/* Download CV Button - Visible and Working */}
                      {canDownload && (
                        <div className="mt-4 w-full">
                          <button
                            onClick={() => handleDownloadResume(application)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all duration-200 group shadow-md hover:shadow-lg"
                          >
                            {isDownloadingCv ? <FaSpinner className="animate-spin" size={18} /> : <FaFilePdf size={18} />}
                            <span className="font-medium">Download CV</span>
                            {!isDownloadingCv && <FaDownload size={14} className="group-hover:translate-y-0.5 transition-transform" />}
                          </button>
                          <p className="text-xs text-gray-400 text-center mt-2">
                            CV submitted with this application
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Contact & Professional Info */}
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Contact Information */}
                      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <FaEnvelope size={14} className="text-blue-500" />
                          Contact Information
                        </h4>
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-sm">
                            <FaEnvelope className="text-gray-400" size={14} />
                            <a href={`mailto:${application.email}`} className="text-blue-600 hover:underline truncate">
                              {application.email}
                            </a>
                          </p>
                          {application.phone && (
                            <p className="flex items-center gap-2 text-sm">
                              <FaPhone className="text-gray-400" size={14} />
                              <a href={`tel:${application.phone}`} className="text-gray-700 hover:text-blue-600">
                                {application.phone}
                              </a>
                            </p>
                          )}
                          {application.expected_salary && (
                            <p className="flex items-center gap-2 text-sm">
                              <FaMoneyBillWave className="text-gray-400" size={14} />
                              <span className="text-gray-700">Expected: <span className="font-semibold text-green-600">{formatSalary(application.expected_salary)}</span></span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Professional Information */}
                      <div className="bg-linear-to-r from-green-50 to-teal-50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <FaBriefcase size={14} className="text-green-500" />
                          Professional Information
                        </h4>
                        <div className="space-y-2">
                          {profile?.current_job_title && (
                            <div>
                              <p className="text-xs text-gray-500">Current Position</p>
                              <p className="text-sm font-medium text-gray-900">{profile.current_job_title}</p>
                            </div>
                          )}
                          {profile?.experience_years && (
                            <div>
                              <p className="text-xs text-gray-500">Years of Experience</p>
                              <p className="text-sm font-medium text-gray-900">{profile.experience_years} years</p>
                            </div>
                          )}
                          {application.education_level && (
                            <div>
                              <p className="text-xs text-gray-500">Education Level</p>
                              <p className="text-sm font-medium text-gray-900">{application.education_level}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    {(application.facebook_link || application.linkedin_link) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex gap-3">
                          {application.facebook_link && (
                            <a
                              href={application.facebook_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-blue-100 rounded-lg transition-all text-sm text-gray-700 hover:text-blue-600"
                            >
                              <FaFacebook size={14} /> Facebook
                            </a>
                          )}
                          {application.linkedin_link && (
                            <a
                              href={application.linkedin_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-blue-100 rounded-lg transition-all text-sm text-gray-700 hover:text-blue-600"
                            >
                              <FaLinkedin size={14} /> LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ATS Score Card - MAIN HIGHLIGHT - Enhanced */}
              {application.ats_score ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FaChartLine size={16} className="text-indigo-600" />
                      </div>
                      ATS Score Analysis
                    </h2>
                    {canRecalcAts && (
                      <button
                        onClick={handleRecalculateAts}
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
                      >
                        <FaSpinner size={12} />
                        Recalculate
                      </button>
                    )}
                  </div>

                  {/* Score Display - Enhanced */}
                  <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
                    <div className="relative">
                      <div className="w-44 h-44">
                        <div className={`w-full h-full rounded-full ${getAtsScoreBg(application.ats_score.percentage)} flex items-center justify-center shadow-inner`}>
                          <div className="text-center">
                            <span className={`text-5xl font-bold ${getAtsScoreColor(application.ats_score.percentage)}`}>
                              {application.ats_score.percentage}%
                            </span>
                            <p className="text-xs text-gray-500 mt-1">Match Score</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FaCheckCircle className="text-green-600" size={16} />
                          <p className="text-sm font-semibold text-green-700">Matched Keywords</p>
                        </div>
                        <p className="text-3xl font-bold text-green-700">
                          {application.matched_keywords?.length || 0}
                        </p>
                        {application.matched_keywords && application.matched_keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {application.matched_keywords.slice(0, 5).map((keyword, i) => (
                              <span key={i} className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                                {keyword}
                              </span>
                            ))}
                            {application.matched_keywords.length > 5 && (
                              <span className="text-xs text-green-600">+{application.matched_keywords.length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FaTimesCircle className="text-red-600" size={16} />
                          <p className="text-sm font-semibold text-red-700">Missing Keywords</p>
                        </div>
                        <p className="text-3xl font-bold text-red-700">
                          {application.missing_keywords?.length || 0}
                        </p>
                        {application.missing_keywords && application.missing_keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {application.missing_keywords.slice(0, 5).map((keyword, i) => (
                              <span key={i} className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                                {keyword}
                              </span>
                            ))}
                            {application.missing_keywords.length > 5 && (
                              <span className="text-xs text-red-600">+{application.missing_keywords.length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Analysis Message - Enhanced */}
                  {atsAnalysis && (
                    <div className={`p-5 rounded-xl ${atsAnalysis.color === 'red' ? 'bg-red-50 border border-red-200' : atsAnalysis.color === 'green' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'} mt-4`}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          {atsAnalysis.color === 'red' ? <FaTimesCircle className="text-red-500" size={14} /> : atsAnalysis.color === 'green' ? <FaCheckCircle className="text-green-500" size={14} /> : <FaChartLine className="text-blue-500" size={14} />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{atsAnalysis.level}</p>
                          <p className="text-sm text-gray-600 mt-1">{atsAnalysis.message}</p>
                          {atsAnalysis.suggestions && atsAnalysis.suggestions.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Suggestions to Improve:</p>
                              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                {atsAnalysis.suggestions.slice(0, 3).map((suggestion, i) => (
                                  <li key={i}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {application.ats_attempt_count > 0 && (
                    <p className="text-xs text-gray-400 text-center mt-4">
                      Calculated {application.ats_attempt_count} time(s) • Last: {formatDateTime(application.ats_last_attempted_at)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaChartLine className="text-gray-400 text-3xl" />
                  </div>
                  <p className="text-gray-500">ATS score not calculated yet</p>
                  {canRecalcAts && (
                    <button
                      onClick={handleRecalculateAts}
                      className="mt-4 px-5 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm hover:from-indigo-700 hover:to-indigo-800 transition-all transform hover:scale-105"
                    >
                      Calculate ATS Score
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - 20% (1/4 of grid) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Status Update Card - Enhanced */}
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <FaClock size={12} className="text-yellow-600" />
                  </div>
                  Application Status
                </h2>

                <div className="mb-4 p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">Current Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                      {getStatusIcon(application.status)}
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadge(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                  </div>
                </div>

                {canUpdateStatus && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Change Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      disabled={isUpdatingStatus}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>
                          {getStatusText(status)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={selectedStatus === application.status || isUpdatingStatus}
                      className="w-full px-4 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02]"
                    >
                      {isUpdatingStatus ? <FaSpinner className="animate-spin inline mr-2" size={14} /> : null}
                      Update Status
                    </button>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <FaCalendarAlt size={10} />
                    Applied: {formatDateTime(application.created_at)}
                  </p>
                </div>
              </div>

              {/* Work Experience - Compact */}
              {profile?.job_histories && profile.job_histories.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                  <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaBriefcase size={12} className="text-blue-600" />
                    </div>
                    Work Experience
                    <span className="text-xs text-gray-400 ml-1">({profile.job_histories.length})</span>
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {profile.job_histories.map((job, index) => (
                      <div key={index} className="border-l-2 border-blue-300 pl-3 pb-2 hover:bg-gray-50 rounded-r-lg transition-colors">
                        <p className="text-sm font-semibold text-gray-900">{job.position}</p>
                        <p className="text-xs text-gray-600">{job.company_name}</p>
                        <p className="text-xs text-gray-400">{job.duration}</p>
                        {job.is_current && (
                          <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">
                            Current
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education - Compact */}
              {profile?.education_histories && profile.education_histories.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                  <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaGraduationCap size={12} className="text-green-600" />
                    </div>
                    Education
                    <span className="text-xs text-gray-400 ml-1">({profile.education_histories.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {profile.education_histories.map((edu, index) => (
                      <div key={index} className="border-l-2 border-green-300 pl-3 hover:bg-gray-50 rounded-r-lg transition-colors">
                        <p className="text-sm font-semibold text-gray-900">{edu.degree}</p>
                        <p className="text-xs text-gray-600">{edu.institution_name}</p>
                        <p className="text-xs text-gray-400">Year: {edu.passing_year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements - Compact */}
              {profile?.achievements && profile.achievements.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                  <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <FaTrophy size={12} className="text-yellow-600" />
                    </div>
                    Achievements
                    <span className="text-xs text-gray-400 ml-1">({profile.achievements.length})</span>
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {profile.achievements.map((achievement, index) => (
                      <div key={index} className="bg-linear-to-r from-yellow-50 to-orange-50 p-3 rounded-xl">
                        <p className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                          <FaAward size={10} className="text-yellow-500" />
                          {achievement.achievement_name}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{achievement.achievement_details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Timeline - Compact */}
              {application.status_timelines && application.status_timelines.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                  <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaHistory size={12} className="text-purple-600" />
                    </div>
                    Status Timeline
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {application.status_timelines.slice(0, 5).map((timeline, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="shrink-0 mt-0.5">
                          {timeline.status === 'hired' ? (
                            <FaCheckCircle className="text-green-500" size={12} />
                          ) : timeline.status === 'rejected' ? (
                            <FaTimesCircle className="text-red-500" size={12} />
                          ) : (
                            <FaClock className="text-yellow-500" size={12} />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`text-xs font-medium ${getStatusBadge(timeline.status)} px-2 py-0.5 rounded-full`}>
                            {getStatusText(timeline.status)}
                          </span>
                          <p className="text-gray-400 text-xs mt-1">{formatDateTime(timeline.created_at)}</p>
                          {timeline.notes && (
                            <p className="text-gray-500 text-xs mt-0.5">{timeline.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
