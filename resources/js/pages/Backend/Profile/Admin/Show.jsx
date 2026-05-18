// resources/js/Pages/Backend/Profile/Admin/Show.jsx

// React
import React from 'react';

// Inertia
import { Head, Link, router } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// Sweetalert
import Swal from 'sweetalert2';

// Auth
import { useAuth } from '@/hooks/useAuth';
import { Can } from '../../../../components/Auth/Can';

// Icons
import {
  FaEdit,
  FaEnvelope,
  FaCalendarAlt,
  FaUserShield,
  FaCheckCircle,
  FaLock,
  FaArrowLeft,
  FaUser,
  FaShieldAlt,
  FaKey,
  FaClock,
  FaTrash,
  FaExclamationTriangle,
} from 'react-icons/fa';

export default function Show({ user: adminUser }) {
  // Use centralized auth hook
  const {
    user: currentUser,
    hasAnyPermission,
    hasRole,
    isAuthenticated,
  } = useAuth();

  // Check permissions for admin management
  const isSuperAdmin = hasRole('super-admin');
  const canViewAdmins = hasAnyPermission([
    'admin.view',
    'admin.manage',
    'admin_profile.view'
  ]);
  const canEditAdmins = hasAnyPermission([
    'admin.update',
    'admin.manage',
    'admin_profile.edit',
    'admin_profile.update'
  ]);
  const canDeleteAdmins = hasAnyPermission([
    'admin.destroy',
    'admin.manage'
  ]);


  // Check if viewing self
  const isViewingSelf = currentUser?.id === adminUser?.id;

  // Check if target is super admin
  const isTargetSuperAdmin = adminUser?.roles?.some(role => role.slug === 'super-admin') || false;

  // Check if user can edit this admin
  const canEditTargetAdmin = canEditAdmins && (
    isViewingSelf ||
    isSuperAdmin ||
    (!isTargetSuperAdmin && !isViewingSelf)
  );

  // Check if user can delete this admin
  const canDeleteTargetAdmin = canDeleteAdmins && !isViewingSelf && (isSuperAdmin || !isTargetSuperAdmin);

  // If user doesn't have permission to view admins, show access denied
  if (!canViewAdmins) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to view admin profiles.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Helper functions
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

  // Handle delete
  const handleDelete = () => {
    if (!canDeleteTargetAdmin) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: isViewingSelf
          ? 'You cannot delete your own admin account.'
          : 'You do not have permission to delete this admin account.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Admin?',
      text: `Are you sure you want to delete "${adminUser.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('backend.admin-profile.destroy', adminUser.id), {
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Admin account has been deleted.',
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              router.visit(route('backend.admin-profile.index'));
            });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: error?.message || 'Failed to delete admin account.',
            });
          }
        });
      }
    });
  };

  // Get user roles display
  const getUserRoles = () => {
    if (!adminUser.roles || adminUser.roles.length === 0) {
      return 'Administrator';
    }
    return adminUser.roles.map(r => r.name).join(', ');
  };

  // Check if user has any specific permissions
  const hasFullAccess = isSuperAdmin || adminUser.roles?.some(r => r.slug === 'super-admin') || false;

  return (
    <AuthenticatedLayout>
      <Head title={`Admin Profile - ${adminUser.name}`} />

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
                  Admin Profile
                </h1>
                <p className="text-sm text-gray-500 mt-1">{adminUser.name}</p>
              </div>

              <div className="flex gap-3">
                {canEditTargetAdmin && (
                  <Link
                    href={route('backend.admin-profile.edit', adminUser.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all duration-200"
                  >
                    <FaEdit size={14} />
                    Edit Profile
                  </Link>
                )}

                {canDeleteTargetAdmin && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition-all duration-200"
                  >
                    <FaTrash size={14} />
                    Delete Admin
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Warning for viewing other admin */}
          {!isViewingSelf && (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-amber-600 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-amber-800">Viewing Another Admin</p>
                  <p className="text-xs text-amber-700 mt-1">
                    You are currently viewing {adminUser.name}'s profile. Some actions may be restricted based on your permissions.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Profile Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <FaUserShield className="text-blue-500" size={22} />
                  Profile Information
                </h2>

                <div className="flex items-start gap-6 mb-6">
                  <div className="shrink-0">
                    <div className={`w-24 h-24 rounded-xl bg-linear-to-br flex items-center justify-center shadow-md ${hasFullAccess
                      ? 'from-purple-500 to-purple-600'
                      : 'from-blue-500 to-blue-600'
                      }`}>
                      <FaUser className="text-white" size={32} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">{adminUser.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <FaShieldAlt size={12} />
                      {getUserRoles()}
                    </p>
                    {isViewingSelf && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        <FaUser size={10} />
                        Your Account
                      </span>
                    )}
                    {isTargetSuperAdmin && (
                      <span className="inline-flex items-center gap-1 mt-2 ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        <FaShieldAlt size={10} />
                        Super Admin
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <FaEnvelope className="text-blue-500" size={16} />
                    <div>
                      <p className="text-xs text-gray-500">Email Address</p>
                      <a href={`mailto:${adminUser.email}`} className="text-sm text-blue-600 hover:underline">
                        {adminUser.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <FaCalendarAlt className="text-green-500" size={16} />
                    <div>
                      <p className="text-xs text-gray-500">Member Since</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(adminUser.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity & Permissions */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <FaShieldAlt className="text-purple-500" size={22} />
                  Permissions & Access
                </h2>

                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${hasFullAccess
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-blue-50 border-blue-200'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <FaCheckCircle className={hasFullAccess ? 'text-purple-500' : 'text-blue-500'} size={16} />
                      <span className={`text-sm font-semibold ${hasFullAccess ? 'text-purple-700' : 'text-blue-700'}`}>
                        {hasFullAccess ? 'Full System Access' : 'Administrative Access'}
                      </span>
                    </div>
                    <p className={`text-xs ${hasFullAccess ? 'text-purple-600' : 'text-blue-600'}`}>
                      {hasFullAccess
                        ? 'Has complete control over all system features including user management, job management, application reviews, and system settings.'
                        : 'Has standard administrative access to manage system operations.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 text-sm text-gray-600">
                      <FaCheckCircle className="text-green-500" size={12} />
                      User Management
                    </div>
                    <div className="flex items-center gap-2 p-2 text-sm text-gray-600">
                      <FaCheckCircle className="text-green-500" size={12} />
                      Job Management
                    </div>
                    <div className="flex items-center gap-2 p-2 text-sm text-gray-600">
                      <FaCheckCircle className="text-green-500" size={12} />
                      Application Review
                    </div>
                    <div className="flex items-center gap-2 p-2 text-sm text-gray-600">
                      <FaCheckCircle className="text-green-500" size={12} />
                      System Settings
                    </div>
                  </div>
                </div>
              </div>
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
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCheckCircle className="text-green-500" size={16} />
                      <span className="text-sm font-semibold text-green-700">Active</span>
                    </div>
                    <p className="text-xs text-green-600">
                      Account is active and in good standing.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Role</span>
                      <span className="font-medium text-gray-900">{getUserRoles()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Account ID</span>
                      <span className="font-medium text-gray-900">#{adminUser.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Login</span>
                      <span className="font-medium text-gray-900">{formatDate(adminUser.last_login_at) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Account Created</span>
                      <span className="font-medium text-gray-900">{formatDate(adminUser.created_at)}</span>
                    </div>
                  </div>

                  {/* Action Buttons - Only show if user has permission */}
                  {canEditTargetAdmin && (
                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      <Link
                        href={route('backend.admin-profile.edit', adminUser.id)}
                        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <FaEdit size={14} />
                        Edit Profile
                      </Link>

                      {isViewingSelf && (
                        <Link
                          href={route('backend.admin-profile.edit', { id: adminUser.id, tab: 'password' })}
                          className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2"
                        >
                          <FaKey size={14} />
                          Change Password
                        </Link>
                      )}

                      {!isViewingSelf && isSuperAdmin && (
                        <Link
                          href={route('backend.admin-profile.edit', { id: adminUser.id, tab: 'password' })}
                          className="w-full px-4 py-2.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition flex items-center justify-center gap-2"
                        >
                          <FaKey size={14} />
                          Reset Password
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Security Tips */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaLock className="text-red-500" size={18} />
                  Security Tips
                </h2>
                <ul className="space-y-2 text-xs text-gray-600">
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-0.5" size={12} />
                    Use a strong, unique password
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-0.5" size={12} />
                    Enable two-factor authentication
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-0.5" size={12} />
                    Never share your login credentials
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="text-green-500 mt-0.5" size={12} />
                    Log out when using public computers
                  </li>
                </ul>
              </div>

              {/* Audit Info (for admins viewing other admins) */}
              {!isViewingSelf && canViewAdmins && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FaClock className="text-gray-500" size={18} />
                    Audit Information
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created By</span>
                      <span className="text-gray-900">{adminUser.creator?.name || 'System'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Updated</span>
                      <span className="text-gray-900">{formatDate(adminUser.updated_at)}</span>
                    </div>
                    {adminUser.deleted_at && (
                      <div className="flex justify-between text-red-600">
                        <span>Deleted At</span>
                        <span>{formatDate(adminUser.deleted_at)}</span>
                      </div>
                    )}
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