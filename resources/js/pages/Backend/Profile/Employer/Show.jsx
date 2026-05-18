// resources/js/Pages/Backend/Profile/Employer/Show.jsx

// Inertia
import { useState } from 'react';

// Inertia
import { Head, Link, router, usePage } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../../hooks/useAuth';
import { Can } from '../../../../components/Auth/Can';

// Icons
import {
  FaBuilding,
  FaCalendarAlt,
  FaEdit,
  FaEnvelope,
  FaGlobe,
  FaIndustry,
  FaMapMarkerAlt,
  FaPhone,
  FaUsers,
  FaBriefcase,
  FaEye,
  FaStar,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLock,
  FaTrash,
  FaUndo,
  FaExclamationCircle,
  FaSpinner,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaDownload,
  FaUserTie,
  FaIdCard,
  FaArrowLeft,
  FaUserShield,
  FaShieldAlt,
} from 'react-icons/fa';
import { HiOfficeBuilding } from 'react-icons/hi';

// SweetAlert2
import Swal from 'sweetalert2';

export default function EmployerShow({ user: employerUser, stats }) {
  // Use centralized auth hook
  const {
    user: currentUser,
    hasAnyPermission,
    hasRole,
    isAuthenticated,
  } = useAuth();

  // Check permissions for employer management
  const isSuperAdmin = hasRole('super-admin');
  const isRegularEmployer = hasRole('employer');
  const isEmployerAdmin = hasRole('employer-admin');

  // FIXED: Include both permission types
  const canViewEmployers = hasAnyPermission([
    'employer.view',
    'employer.manage',
    'employer_profile.view',
    'employer_profile.edit'
  ]);

  const canEditEmployers = hasAnyPermission([
    'employer.update',
    'employer.manage',
    'employer_profile.edit',
    'employer_profile.update'
  ]);

  const canDeleteEmployers = hasAnyPermission([
    'employer.destroy',
    'employer.manage'
  ]);

  // Loading state
  const [isRestoring, setIsRestoring] = useState(false);

  // Deleting state
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === employerUser?.id;
  const isAdminUser = isSuperAdmin || hasAnyPermission(['admin.view', 'admin.manage']);

  // Check if user can edit this employer
  const canEditTargetEmployer = () => {
    if (isOwnProfile) return true;
    if (isSuperAdmin) return true;
    // Employer admins can view/edit employers in their company
    if (isEmployerAdmin && currentUser?.employer_id === employerUser?.employer_id) return true;
    return canEditEmployers;
  };

  // Check if user can delete this employer
  const canDeleteTargetEmployer = () => {
    if (isOwnProfile) return false; // Cannot delete own account
    if (isSuperAdmin) return canDeleteEmployers;
    return canDeleteEmployers && isEmployerAdmin && currentUser?.employer_id === employerUser?.employer_id;
  };

  // Check if employer is trashed
  const isTrashed = employerUser?.deleted_at !== null;

  // If user doesn't have permission to view employers, show access denied
  if (!canViewEmployers && !isOwnProfile) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to view employer profiles.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Format date
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

  // Get company logo URL
  const getCompanyLogo = () => {
    if (employerUser?.company_logo) {
      return `/storage/${employerUser.company_logo}`;
    }
    return null;
  };

  // Handle restore
  const handleRestore = () => {
    if (!canEditTargetEmployer()) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to restore this account.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: 'Restore Account?',
      text: 'This will reactivate the employer account and their job listings.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Restore',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsRestoring(true);
        router.post(route('backend.employer.profile.restore', employerUser.id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: 'Account has been restored successfully.',
              timer: 2000,
              showConfirmButton: false,
            });
            router.reload({ preserveScroll: true });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Restore Failed',
              text: error?.message || 'Failed to restore account.',
              confirmButtonColor: '#d33',
            });
          },
          onFinish: () => setIsRestoring(false),
        });
      }
    });
  };

  // Handle force delete
  const handleForceDelete = () => {
    if (!canDeleteTargetEmployer()) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to delete this account.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: 'Permanently Delete Account?',
      text: 'This action cannot be undone. All data including job listings and applications will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete Permanently',
      cancelButtonText: 'Cancel',
      input: 'password',
      inputPlaceholder: 'Enter your password to confirm',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off',
      },
      preConfirm: (password) => {
        if (!password) {
          Swal.showValidationMessage('Password is required');
          return false;
        }
        return password;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(true);
        router.delete(route('backend.employer.profile.force-destroy', employerUser.id), {
          data: { password: result.value },
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Account has been permanently deleted.',
              timer: 2000,
              showConfirmButton: false,
            });
            router.visit(route('dashboard'));
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: error?.message || 'Failed to delete account.',
              confirmButtonColor: '#d33',
            });
          },
          onFinish: () => setIsDeleting(false),
        });
      }
    });
  };

  // Get user role display
  const getUserRoleDisplay = () => {
    if (isSuperAdmin && employerUser?.roles?.some(r => r.slug === 'super-admin')) return 'Super Admin';
    if (employerUser?.roles?.some(r => r.slug === 'employer-admin')) return 'Employer Admin';
    return 'Employer';
  };

  // Check if user can edit this employer
  const canEdit = canEditTargetEmployer();

  // Check if user can delete this employer
  const canDelete = canDeleteTargetEmployer();

  return (
    <AuthenticatedLayout>
      <Head title={`Employer Profile - ${employerUser.name}`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors group"
            >
              <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Back</span>
            </button>

            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Employer Profile
                </h1>
                <p className="text-sm text-gray-500 mt-1">{employerUser.name}</p>
              </div>

              <div className="flex gap-3">
                {!isOwnProfile && (
                  <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                    <FaUserShield size={14} />
                    {getUserRoleDisplay()}
                  </div>
                )}

                {isTrashed && canEdit && (
                  <button
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                  >
                    {isRestoring ? <FaSpinner className="animate-spin" size={14} /> : <FaUndo size={14} />}
                    Restore Account
                  </button>
                )}

                {!isTrashed && isOwnProfile && (
                  <Link
                    href={route('backend.employer.profile.edit', employerUser.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all duration-200"
                  >
                    <FaEdit size={14} />
                    Edit Profile
                  </Link>
                )}

                {!isTrashed && canDelete && (
                  <button
                    onClick={handleForceDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                  >
                    {isDeleting ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Warning for viewing another employer */}
          {!isOwnProfile && !isTrashed && (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-amber-600 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-amber-800">Viewing Another Employer</p>
                  <p className="text-xs text-amber-700 mt-1">
                    You are currently viewing {employerUser.name}'s profile. Your actions are limited based on your permissions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trashed Warning */}
          {isTrashed && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <FaExclamationTriangle className="text-red-500" size={20} />
              <div>
                <p className="text-sm font-semibold text-red-800">Account Deactivated</p>
                <p className="text-xs text-red-600">
                  Deleted on {formatDate(employerUser.deleted_at)}. Restore to reactivate.
                </p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaBriefcase className="text-blue-600" size={18} />
                </div>
                <p className="text-sm text-gray-500">Total Jobs</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total_jobs}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-green-600" size={18} />
                </div>
                <p className="text-sm text-gray-500">Active Jobs</p>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.active_jobs}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaUsers className="text-purple-600" size={18} />
                </div>
                <p className="text-sm text-gray-500">Total Applicants</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">{stats.total_applications}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaEye className="text-orange-600" size={18} />
                </div>
                <p className="text-sm text-gray-500">Total Views</p>
              </div>
              <p className="text-3xl font-bold text-orange-600">{stats.total_views}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <HiOfficeBuilding className="text-blue-500" size={22} />
                  Company Information
                </h2>

                <div className="flex items-start gap-6 mb-6">
                  <div className="shrink-0">
                    {getCompanyLogo() ? (
                      <img
                        src={getCompanyLogo()}
                        alt={employerUser.company_name || employerUser.name}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200 shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                        <FaBuilding className="text-white" size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {employerUser.company_name || employerUser.name}
                    </h3>
                    {employerUser.industry && (
                      <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <FaIndustry size={12} />
                        {employerUser.industry}
                      </p>
                    )}
                    {employerUser.company_description && (
                      <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                        {employerUser.company_description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employerUser.company_website && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <FaGlobe className="text-blue-500" size={16} />
                      <div>
                        <p className="text-xs text-gray-500">Website</p>
                        <a
                          href={employerUser.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {employerUser.company_website}
                        </a>
                      </div>
                    </div>
                  )}
                  {employerUser.company_phone && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <FaPhone className="text-green-500" size={16} />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm text-gray-900">{employerUser.company_phone}</p>
                      </div>
                    </div>
                  )}
                  {employerUser.company_address && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <FaMapMarkerAlt className="text-purple-500" size={16} />
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm text-gray-900">{employerUser.company_address}</p>
                      </div>
                    </div>
                  )}
                  {employerUser.company_size && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <FaUsers className="text-orange-500" size={16} />
                      <div>
                        <p className="text-xs text-gray-500">Company Size</p>
                        <p className="text-sm text-gray-900">{employerUser.company_size}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <FaIdCard className="text-green-500" size={22} />
                  Contact Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FaUserTie className="text-gray-500" size={16} />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{employerUser.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FaEnvelope className="text-gray-500" size={16} />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <a href={`mailto:${employerUser.email}`} className="text-sm text-blue-600 hover:underline">
                        {employerUser.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaCalendarAlt className="text-gray-500" size={16} />
                  <div>
                    <p className="text-xs text-gray-500">Member Since</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(employerUser.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Job Listings */}
              {employerUser.job_listings && employerUser.job_listings.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FaBriefcase className="text-blue-500" size={22} />
                      Job Listings
                      <span className="text-sm font-normal text-gray-500">
                        ({employerUser.job_listings.length} total)
                      </span>
                    </h2>
                    {isOwnProfile && (
                      <Link
                        href={route('employer.jobs.index')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View All
                      </Link>
                    )}
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {employerUser.job_listings.slice(0, 10).map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${job.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {job.title}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <FaUsers size={10} />
                                {job.applications_count || 0} applicants
                              </span>
                              <span className="flex items-center gap-1">
                                <FaEye size={10} />
                                {job.views_count || 0} views
                              </span>
                              <span className="flex items-center gap-1">
                                <FaCalendarAlt size={10} />
                                {formatDate(job.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isOwnProfile && (
                          <Link
                            href={route('employer.applications.index', { job: job.id })}
                            className="shrink-0 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            View Applications
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <FaLock className="text-gray-500" size={18} />
                  Account Status
                </h2>

                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${isTrashed
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isTrashed ? (
                        <FaExclamationCircle className="text-red-500" size={16} />
                      ) : (
                        <FaCheckCircle className="text-green-500" size={16} />
                      )}
                      <span className={`text-sm font-semibold ${isTrashed ? 'text-red-700' : 'text-green-700'}`}>
                        {isTrashed ? 'Deactivated' : 'Active'}
                      </span>
                    </div>
                    <p className={`text-xs ${isTrashed ? 'text-red-600' : 'text-green-600'}`}>
                      {isTrashed
                        ? 'This account has been deactivated. Restore to reactivate.'
                        : 'Account is active and in good standing.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Role</span>
                      <span className="font-medium text-gray-900 capitalize">{getUserRoleDisplay()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Jobs</span>
                      <span className="font-medium text-gray-900">{stats.total_jobs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Active Jobs</span>
                      <span className="font-medium text-gray-900">{stats.active_jobs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Applicants</span>
                      <span className="font-medium text-gray-900">{stats.total_applications}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Views</span>
                      <span className="font-medium text-gray-900">{stats.total_views}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {(canEdit || canDelete) && !isTrashed && (
                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      {isOwnProfile && canEdit && (
                        <>
                          <Link
                            href={route('backend.employer.profile.edit', employerUser.id)}
                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                          >
                            <FaEdit size={14} />
                            Edit Profile
                          </Link>
                          <Link
                            href={route('backend.employer.profile.change-password', employerUser.id)}
                            className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2"
                          >
                            <FaLock size={14} />
                            Change Password
                          </Link>
                        </>
                      )}
                      {canDelete && !isOwnProfile && (
                        <button
                          onClick={handleForceDelete}
                          disabled={isDeleting}
                          className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isDeleting ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                          Delete Account
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}