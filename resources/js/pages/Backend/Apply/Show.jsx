// resources/js/Pages/Backend/Apply/Show.jsx

// React
import { useState } from 'react';

// Inertia
import { Head, router, Link } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';

// Icons
import {
  FaArrowLeft,
  FaBriefcase,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaLinkedin,
  FaFacebook,
  FaFilePdf,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaUserCheck,
  FaUserSlash,
  FaTrash,
  FaEdit,
  FaSpinner,
  FaInfoCircle,
  FaStar,
  FaThumbsUp,
  FaLightbulb,
  FaExternalLinkAlt,
} from 'react-icons/fa';

// SweetAlert
import Swal from 'sweetalert2';

export default function ApplyShow({ application, jobListing, statusTimeline, atsDetails, atsStatus, isDeleted }) {
  // Use centralized auth hook
  const {
    user: currentUser,
  } = useAuth();

  // Check if user is the owner of this application
  const isOwner = currentUser?.id === application?.user_id;

  // Loading state
  const [restoring, setRestoring] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Format dates
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format short dates
  const formatShortDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
      pending: 'Pending Review',
      shortlisted: 'Shortlisted',
      rejected: 'Rejected',
      hired: 'Hired'
    };
    return texts[status] || status;
  };

  // Get ATS score color
  const getAtsScoreColor = (score) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get ATS score message
  const getAtsScoreMessage = (score) => {
    if (!score) return 'Not calculated yet';
    if (score >= 80) return 'Excellent match! Your CV aligns very well with this position.';
    if (score >= 60) return 'Good match! Your CV meets most requirements.';
    if (score >= 40) return 'Fair match. Consider updating your CV with relevant keywords.';
    return 'Low match. Try customizing your CV for this position.';
  };

  // Format salary
  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    return `${new Intl.NumberFormat('en-US').format(salary)} BDT`;
  };

  // Recalculate ATS handler
  const handleRecalculateAts = () => {
    Swal.fire({
      title: 'Recalculate ATS Score?',
      text: 'This will re-analyze your CV against the job requirements.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, recalculate',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setRecalculating(true);

        router.post(route('backend.apply.recalculate-ats', application.id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Recalculated!',
              text: 'ATS score has been updated.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Recalculation Failed',
              text: errors?.message || 'Failed to recalculate ATS score.',
              confirmButtonColor: '#d33',
            });
          },
          onFinish: () => setRecalculating(false),
        });
      }
    });
  };

  // Withdraw handler
  const handleWithdraw = () => {
    Swal.fire({
      title: 'Withdraw Application?',
      text: 'This will move your application to trash. You can restore it later.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, withdraw',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setWithdrawing(true);

        router.delete(route('backend.apply.destroy', application.id), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Withdrawn!',
              text: 'Application has been withdrawn.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.get(route('backend.apply.index'));
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Withdraw Failed',
              text: errors?.message || 'Failed to withdraw application.',
              confirmButtonColor: '#d33',
            });
          },
          onFinish: () => setWithdrawing(false),
        });
      }
    });
  };

  // Restore handler
  const handleRestore = () => {
    Swal.fire({
      title: 'Restore Application?',
      text: 'This will restore your application from trash.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setRestoring(true);

        router.post(route('backend.apply.restore', application.id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: 'Application has been restored successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.get(route('backend.apply.index'));
          },
          onError: (errors) => {
            Swal.fire({
              icon: 'error',
              title: 'Restore Failed',
              text: errors?.message || 'Failed to restore application.',
              confirmButtonColor: '#d33',
            });
          },
          onFinish: () => setRestoring(false),
        });
      }
    });
  };

  // Force delete handler
  const handleForceDelete = () => {
    Swal.fire({
      title: 'Permanently Delete?',
      html: `Are you sure you want to permanently delete this application?<br><br><strong>This action cannot be undone.</strong>`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete permanently',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('backend.apply.force-delete', application.id), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Application has been permanently deleted.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.get(route('backend.apply.index'));
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

  // Determine if user can edit this application
  const canEdit = !isDeleted && application.status === 'pending' && isOwner;

  // Determine if user can withdraw this application
  const canWithdraw = !isDeleted && application.status === 'pending' && isOwner;

  // Determine if user can restore this application
  const canRestore = isDeleted && isOwner;

  // Determine if user can recalculate ATS
  const canRecalculate = !isDeleted && atsStatus?.can_recalculate && isOwner;

  return (
    <AuthenticatedLayout>
      <Head title={`Application for ${jobListing.title}`} />

      {/* Main Content */}
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-8xl">
          {/* Back Button */}
          <button
            onClick={() => router.get(route('backend.apply.index'))}
            className="group flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-all duration-200 text-xs sm:text-sm"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" size={12} />
            <span className="font-medium">Back to Applications</span>
          </button>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4 sm:mb-6 animate-fade-in">
            <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">Application Details</h1>
                  <p className="text-blue-100 text-xs sm:text-sm mt-0.5 sm:mt-1">Review your application information</p>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                  {canEdit && (
                    <Link
                      href={route('backend.apply.edit', application.id)}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 text-xs sm:text-sm"
                    >
                      <FaEdit size={12} />
                      Edit
                    </Link>
                  )}
                  {canWithdraw && (
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600/20 hover:bg-red-600/30 text-red-100 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm"
                    >
                      {withdrawing ? <FaSpinner className="animate-spin" size={12} /> : <FaTrash size={12} />}
                      Withdraw
                    </button>
                  )}
                  {canRestore && (
                    <button
                      onClick={handleRestore}
                      disabled={restoring}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600/20 hover:bg-green-600/30 text-green-100 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm"
                    >
                      {restoring ? <FaSpinner className="animate-spin" size={12} /> : <FaCheckCircle size={12} />}
                      Restore
                    </button>
                  )}
                  {isDeleted && isOwner && (
                    <button
                      onClick={handleForceDelete}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600/20 hover:bg-red-600/30 text-red-100 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 text-xs sm:text-sm"
                    >
                      <FaTrash size={12} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Application Status Card */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <FaInfoCircle className="text-blue-600" />
                    Application Status
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {getStatusIcon(application.status)}
                      <span className={`inline-flex px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold ${getStatusBadge(application.status)}`}>
                        {getStatusText(application.status)}
                      </span>
                    </div>
                    {isDeleted && (
                      <span className="inline-flex px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-gray-200 text-gray-600">
                        Withdrawn
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500">Applied on</p>
                      <p className="font-medium text-gray-900">{formatShortDate(application.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-900">{formatShortDate(application.updated_at)}</p>
                    </div>
                    {isDeleted && application.deleted_at && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Withdrawn on</p>
                        <p className="font-medium text-red-600">{formatShortDate(application.deleted_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Details Card */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <FaBriefcase className="text-blue-600" />
                    Job Details
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">{jobListing.title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm mb-3 sm:mb-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                      <FaBuilding size={12} />
                      <span>{jobListing.employer?.name || 'Company'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                      <FaMapMarkerAlt size={12} />
                      <span>Multiple Locations</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                      <FaCalendarAlt size={12} />
                      <span>{jobListing.job_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                      <FaStar size={12} />
                      <span>{jobListing.experience_level}</span>
                    </div>
                  </div>

                  {jobListing.description && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Job Description</p>
                      <div className="text-xs sm:text-sm text-gray-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: jobListing.description.substring(0, 300) + (jobListing.description.length > 300 ? '...' : '') }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information Card */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <FaUser className="text-blue-600" />
                    Personal Information
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{application.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base break-all">{application.email}</p>
                    </div>
                    {application.phone && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Phone Number</p>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">{application.phone}</p>
                      </div>
                    )}
                    {application.expected_salary && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Expected Salary</p>
                        <p className="font-medium text-green-600 text-sm sm:text-base">{formatSalary(application.expected_salary)}</p>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {(application.linkedin_link || application.facebook_link) && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Social Profiles</p>
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        {application.linkedin_link && (
                          <a
                            href={application.linkedin_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:text-blue-800 transition-colors text-xs sm:text-sm"
                          >
                            <FaLinkedin size={16} />
                            LinkedIn
                          </a>
                        )}
                        {application.facebook_link && (
                          <a
                            href={application.facebook_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:text-blue-800 transition-colors text-xs sm:text-sm"
                          >
                            <FaFacebook size={16} />
                            Facebook
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resume Link */}
                  {application.resume_url && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all duration-200 text-xs sm:text-sm"
                      >
                        <FaFilePdf size={14} />
                        <span className="font-medium">View Resume/CV</span>
                        <FaExternalLinkAlt size={10} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Timeline */}
              {statusTimeline && statusTimeline.length > 0 && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                      <FaClock className="text-blue-600" />
                      Status Timeline
                    </h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {statusTimeline.map((timeline, index) => (
                        <div key={index} className="flex gap-2 sm:gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                            {index < statusTimeline.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200" />
                            )}
                          </div>
                          <div className="flex-1 pb-3 sm:pb-4">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                              <span className={`inline-flex px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusBadge(timeline.status)}`}>
                                {getStatusText(timeline.status)}
                              </span>
                              <span className="text-[10px] sm:text-xs text-gray-500">{formatDate(timeline.created_at)}</span>
                            </div>
                            {timeline.notes && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{timeline.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - ATS Score & Actions */}
            <div className="space-y-4 sm:space-y-6">
              {/* ATS Score Card */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 sticky top-24">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-purple-600 to-indigo-600">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
                    <FaChartLine size={16} />
                    ATS Compatibility Score
                  </h3>
                </div>
                <div className="p-4 sm:p-6">
                  {atsDetails ? (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-full mb-3 sm:mb-4" style={{
                        background: `conic-gradient(${atsDetails.percentage >= 80 ? '#10b981' : atsDetails.percentage >= 60 ? '#3b82f6' : atsDetails.percentage >= 40 ? '#f59e0b' : '#ef4444'} ${atsDetails.percentage * 3.6}deg, #e5e7eb ${atsDetails.percentage * 3.6}deg)`
                      }}>
                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white flex items-center justify-center">
                          <div className="text-center">
                            <span className={`text-2xl sm:text-3xl font-bold ${getAtsScoreColor(atsDetails.percentage)}`}>
                              {atsDetails.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className={`text-xs sm:text-sm font-medium mb-2 sm:mb-3 ${getAtsScoreColor(atsDetails.percentage)}`}>
                        {getAtsScoreMessage(atsDetails.percentage)}
                      </p>

                      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                          <p className="text-green-600 font-medium text-xs sm:text-sm">Matched</p>
                          <p className="text-lg sm:text-2xl font-bold text-green-700">{atsDetails.matched_count}</p>
                        </div>
                        <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg">
                          <p className="text-red-600 font-medium text-xs sm:text-sm">Missing</p>
                          <p className="text-lg sm:text-2xl font-bold text-red-700">{atsDetails.missing_count}</p>
                        </div>
                      </div>

                      {atsDetails.matched_keywords && atsDetails.matched_keywords.length > 0 && (
                        <div className="mb-3 sm:mb-4">
                          <p className="text-[10px] sm:text-xs font-medium text-green-600 mb-1 sm:mb-2 text-left">✓ Matched Keywords</p>
                          <div className="flex flex-wrap gap-0.5 sm:gap-1">
                            {atsDetails.matched_keywords.slice(0, 8).map((keyword, idx) => (
                              <span key={idx} className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-green-100 text-green-700 rounded-full">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {atsDetails.missing_keywords && atsDetails.missing_keywords.length > 0 && (
                        <div className="mb-3 sm:mb-4">
                          <p className="text-[10px] sm:text-xs font-medium text-red-600 mb-1 sm:mb-2 text-left">⚠ Missing Keywords</p>
                          <div className="flex flex-wrap gap-0.5 sm:gap-1">
                            {atsDetails.missing_keywords.slice(0, 8).map((keyword, idx) => (
                              <span key={idx} className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-red-100 text-red-700 rounded-full">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {atsDetails.analysis?.suggestions && atsDetails.analysis.suggestions.length > 0 && (
                        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 rounded-lg text-left">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <FaLightbulb className="text-blue-600" size={12} />
                            <p className="text-[10px] sm:text-xs font-medium text-blue-800">Suggestions to Improve</p>
                          </div>
                          <ul className="text-[10px] sm:text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                            {atsDetails.analysis.suggestions.slice(0, 3).map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-8">
                      {application.ats_calculation_status === 'pending' ? (
                        <>
                          <FaSpinner className="animate-spin text-purple-600 text-2xl sm:text-3xl mx-auto mb-2 sm:mb-3" />
                          <p className="text-xs sm:text-sm text-gray-600">ATS score is being calculated...</p>
                          <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">This may take a few moments</p>
                        </>
                      ) : application.ats_calculation_status === 'processing' ? (
                        <>
                          <FaSpinner className="animate-spin text-purple-600 text-2xl sm:text-3xl mx-auto mb-2 sm:mb-3" />
                          <p className="text-xs sm:text-sm text-gray-600">Processing your CV...</p>
                        </>
                      ) : application.ats_calculation_status === 'failed' ? (
                        <>
                          <FaTimesCircle className="text-red-500 text-2xl sm:text-3xl mx-auto mb-2 sm:mb-3" />
                          <p className="text-xs sm:text-sm text-gray-600">ATS calculation failed</p>
                          <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">Please try recalculating</p>
                        </>
                      ) : (
                        <>
                          <FaChartLine className="text-gray-400 text-2xl sm:text-3xl mx-auto mb-2 sm:mb-3" />
                          <p className="text-xs sm:text-sm text-gray-600">ATS score not available</p>
                        </>
                      )}
                    </div>
                  )}

                  {canRecalculate && (
                    <button
                      onClick={handleRecalculateAts}
                      disabled={recalculating}
                      className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
                    >
                      {recalculating ? (
                        <>
                          <FaSpinner className="animate-spin" size={12} />
                          Recalculating...
                        </>
                      ) : (
                        <>
                          <FaChartLine size={12} />
                          Recalculate ATS Score
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              {!isDeleted && (canEdit || canWithdraw || application.resume_url) && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-gray-700 to-gray-800">
                    <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
                      <FaThumbsUp size={14} />
                      Quick Actions
                    </h3>
                  </div>
                  <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    {canEdit && (
                      <Link
                        href={route('backend.apply.edit', application.id)}
                        className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200"
                      >
                        <FaEdit className="text-blue-600" size={14} />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">Edit Application</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">Update your application details</p>
                        </div>
                      </Link>
                    )}

                    {application.resume_url && (
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200"
                      >
                        <FaFilePdf className="text-purple-600" size={14} />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">Download Resume</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">View or save your CV</p>
                        </div>
                      </a>
                    )}

                    {canWithdraw && (
                      <button
                        onClick={handleWithdraw}
                        className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200"
                      >
                        <FaTrash className="text-red-600" size={14} />
                        <div className="text-left">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">Withdraw Application</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">Move to trash</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Employer Notes */}
              {application.employer_notes && (
                <div className="bg-yellow-50 rounded-xl p-3 sm:p-4 border border-yellow-200">
                  <div className="flex items-start gap-1.5 sm:gap-2">
                    <FaInfoCircle className="text-yellow-600 mt-0.5 shrink-0" size={14} />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-yellow-800 mb-0.5 sm:mb-1">Employer Note</p>
                      <p className="text-xs sm:text-sm text-yellow-700">{application.employer_notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
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