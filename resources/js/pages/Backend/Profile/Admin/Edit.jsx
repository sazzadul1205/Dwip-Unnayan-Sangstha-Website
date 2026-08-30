// resources/js/Pages/Backend/Profile/Admin/Edit.jsx

import { useState, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import Swal from 'sweetalert2';
import { useAuth } from '@/hooks/useAuth';
import { Can } from '../../../../components/Auth/Can';
import {
  FaSave, FaTimes, FaUser, FaEnvelope, FaLock, FaArrowLeft,
  FaSpinner, FaCheckCircle, FaExclamationCircle, FaUserShield,
  FaTrash, FaShieldAlt, FaUpload, FaImage, FaUndo, FaInfoCircle,
  FaEye, FaEyeSlash, FaCog
} from 'react-icons/fa';

export default function Edit({ user: adminUser, currentIcon, availableIcons, icons }) {
  // Use the new `icons` prop if available, otherwise fallback to single type
  const iconData = icons || {
    site_icon: { current: currentIcon, available: availableIcons || [] }
  };

  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Icon management state
  const [selectedIconType, setSelectedIconType] = useState('site_icon');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Get current icon and available icons for selected type
  const currentIconForType = iconData[selectedIconType]?.current || null;
  const availableIconsForType = iconData[selectedIconType]?.available || [];

  // Profile form
  const { data: profileData, setData: setProfileData, patch, processing: profileProcessing, errors: profileErrors } = useForm({
    name: adminUser?.name || '',
    email: adminUser?.email || '',
  });

  // Password form
  const {
    data: passwordData,
    setData: setPasswordData,
    put,
    reset: resetPassword,
    processing: passwordProcessing,
    errors: passwordErrors,
  } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const { user: currentUser, hasAnyPermission, hasRole } = useAuth();

  const isSuperAdmin = hasRole('super-admin');
  const canViewAdmins = hasAnyPermission(['admin.view', 'admin.manage', 'admin_profile.view', 'admin_profile.edit']);
  const canEditAdmins = hasAnyPermission(['admin.update', 'admin.manage', 'admin_profile.edit', 'admin_profile.update']);
  const canDeleteAdmins = hasAnyPermission(['admin.destroy', 'admin.manage']);

  const isEditingSelf = currentUser?.id === adminUser?.id;
  const isTargetSuperAdmin = adminUser?.roles?.some(role => role.slug === 'super-admin') || false;
  const canEditTargetAdmin = canEditAdmins && (isEditingSelf || isSuperAdmin || (!isTargetSuperAdmin && !isEditingSelf));

  if (!canEditAdmins) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">You don't have permission to edit admin accounts.</p>
            {canViewAdmins && (
              <button
                onClick={() => router.visit(route('backend.admin-profile.index'))}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
              >
                Back to Admin List
              </button>
            )}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!canEditTargetAdmin) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Cannot Edit This Admin</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              {isTargetSuperAdmin && !isSuperAdmin
                ? "Super admin accounts can only be edited by other super admins."
                : "You don't have permission to edit this admin account."}
            </p>
            <button
              onClick={() => router.visit(route('backend.admin-profile.index'))}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
            >
              Back to Admin List
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ─── Handlers ────────────────────────────────────────────

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!canEditAdmins || !canEditTargetAdmin) {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'You do not have permission to edit this admin account.', confirmButtonColor: '#2563eb' });
      return;
    }
    patch(route('backend.admin-profile.update', adminUser.id), {
      onSuccess: () => {
        Swal.fire({ icon: 'success', title: 'Success!', text: 'Profile updated successfully!', timer: 2000, showConfirmButton: false });
      },
      onError: (errors) => {
        Swal.fire({ icon: 'error', title: 'Error!', text: Object.values(errors).flat().join('\n') });
      }
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!canEditAdmins || !canEditTargetAdmin) {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'You do not have permission to change this admin\'s password.', confirmButtonColor: '#2563eb' });
      return;
    }
    put(route('backend.admin-profile.password.update', adminUser.id), {
      onSuccess: () => {
        resetPassword();
        Swal.fire({ icon: 'success', title: 'Success!', text: 'Password updated successfully!', timer: 2000, showConfirmButton: false });
      },
      onError: (errors) => {
        Swal.fire({ icon: 'error', title: 'Error!', text: Object.values(errors).flat().join('\n') });
      }
    });
  };

  const handleCancel = () => router.visit(route('backend.admin-profile.show', adminUser.id));

  const handleDelete = () => {
    if (!canDeleteAdmins) {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'You do not have permission to delete admin accounts.', confirmButtonColor: '#2563eb' });
      return;
    }
    if (isEditingSelf) {
      Swal.fire({ icon: 'warning', title: 'Cannot Delete Yourself', text: 'You cannot delete your own admin account.', confirmButtonColor: '#2563eb' });
      return;
    }
    if (isTargetSuperAdmin && !isSuperAdmin) {
      Swal.fire({ icon: 'warning', title: 'Cannot Delete Super Admin', text: 'Only super admins can delete other super admin accounts.', confirmButtonColor: '#2563eb' });
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
            Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Admin account has been deleted.', timer: 2000, showConfirmButton: false })
              .then(() => router.visit(route('backend.admin-profile.index')));
          },
          onError: (error) => {
            Swal.fire({ icon: 'error', title: 'Error!', text: error?.message || 'Failed to delete admin account.' });
          }
        });
      }
    });
  };

  // ─── Icon handlers ──────────────────────────────────────

  const handleIconUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select an image file.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ icon: 'error', title: 'File Too Large', text: 'File size must be less than 2MB.' });
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('icon', file);
    formData.append('type', selectedIconType); // ← send the type

    try {
      const response = await fetch(route('backend.admin-profile.icon.update'), {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Icon Updated!',
          text: `${selectedIconType.replace('_', ' ')} icon has been updated successfully.`,
          timer: 1500,
          showConfirmButton: false,
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: data.message || 'Failed to update icon.' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Upload Failed', text: error.message || 'An error occurred during upload.' });
    } finally {
      setUploading(false);
    }
  };

  const handleResetIcon = async () => {
    const result = await Swal.fire({
      title: 'Reset Icon?',
      text: `This will remove the custom ${selectedIconType.replace('_', ' ')} icon and revert to default.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, reset',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(route('backend.admin-profile.icon.reset'), {
          method: 'DELETE',
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: selectedIconType }), // ← send the type
        });

        const data = await response.json();

        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Icon Reset!',
            text: `${selectedIconType.replace('_', ' ')} icon has been reset to default.`,
            timer: 1500,
            showConfirmButton: false,
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          Swal.fire({ icon: 'error', title: 'Reset Failed', text: data.message || 'Failed to reset icon.' });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Reset Failed', text: error.message || 'An error occurred during reset.' });
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleIconUpload(file);
  };

  // ─── Render ─────────────────────────────────────────────

  return (
    <AuthenticatedLayout>
      <Head title={`Edit Admin: ${adminUser?.name}`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-4 sm:py-8">
        <div className="mx-auto px-3 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Edit Admin Profile
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                Update account information for {adminUser?.name}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors group text-xs sm:text-sm"
            >
              <FaArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Profile</span>
            </button>
          </div>

          {/* Warning for editing other admin */}
          {!isEditingSelf && (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <FaExclamationCircle className="text-amber-600 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-amber-800">Editing Another Admin</p>
                  <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5 sm:mt-1">
                    You are currently editing {adminUser?.name}'s account. Changes will affect their access and permissions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6">
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex gap-0.5 sm:gap-1 px-2 sm:px-4 min-w-max">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FaUser size={14} /> Profile
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'password'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FaLock size={14} /> Password
                </button>
                <button
                  onClick={() => setActiveTab('icon')}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'icon'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FaImage size={14} /> Icons
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

            {/* ─── PROFILE TAB ─── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="p-4 sm:p-6 md:p-8">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Profile Information</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Update account details for {isEditingSelf ? 'your account' : 'this admin'}</p>
                  </div>

                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData('name', e.target.value)}
                          required
                          autoComplete="name"
                          className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${profileErrors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="Full name"
                        />
                      </div>
                      {profileErrors.name && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{profileErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData('email', e.target.value)}
                          required
                          autoComplete="email"
                          className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${profileErrors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="admin@example.com"
                        />
                      </div>
                      {profileErrors.email && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{profileErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Role</label>
                      <div className="relative">
                        <FaUserShield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          value={adminUser?.roles?.map(r => r.name).join(', ') || 'Admin'}
                          disabled
                          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base"
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                        Role can only be changed by super admins from the roles management section
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                    <FaCheckCircle className="text-blue-500 mt-0.5 shrink-0" size={16} />
                    <div className="text-xs sm:text-sm text-blue-800">
                      <p className="font-medium mb-1">Profile Information Tips:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-xs">
                        <li>Use real names for official communications</li>
                        <li>Keep email addresses up to date for important notifications</li>
                        <li>Changes will take effect immediately</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <FaTimes size={14} /> Cancel
                    </button>
                    {!isEditingSelf && canDeleteAdmins && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <FaTrash size={14} /> Delete Admin
                      </button>
                    )}
                    <Can permission="admin.update" fallback={null}>
                      <button
                        type="submit"
                        disabled={profileProcessing}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                      >
                        {profileProcessing ? <FaSpinner className="animate-spin" size={14} /> : <FaSave size={14} />}
                        {profileProcessing ? 'Saving...' : 'Save Changes'}
                      </button>
                    </Can>
                  </div>
                </div>
              </form>
            )}

            {/* ─── PASSWORD TAB ─── */}
            {(isEditingSelf || isSuperAdmin) && activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="p-4 sm:p-6 md:p-8">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Change Password</h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {isEditingSelf ? 'Update your account password' : `Update password for ${adminUser?.name}`}
                    </p>
                  </div>

                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData('current_password', e.target.value)}
                          className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${passwordErrors.current_password ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                          {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                      {passwordErrors.current_password && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{passwordErrors.current_password}</p>}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.password}
                          onChange={(e) => setPasswordData('password', e.target.value)}
                          className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${passwordErrors.password ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="Enter new password (min 8 characters)"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                          {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                      {passwordErrors.password && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{passwordErrors.password}</p>}
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Password must be at least 8 characters</p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.password_confirmation}
                          onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                          className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${passwordErrors.password_confirmation ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                          {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                      {passwordErrors.password_confirmation && <p className="text-red-500 text-[10px] sm:text-xs mt-1">{passwordErrors.password_confirmation}</p>}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1.5 sm:mb-2">Password Requirements:</p>
                    <ul className="text-[10px] sm:text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                      <li>Minimum 8 characters long</li>
                      <li>Use a mix of letters, numbers, and symbols</li>
                      <li>Avoid common passwords or personal information</li>
                    </ul>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <FaTimes size={14} /> Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={passwordProcessing}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {passwordProcessing ? <FaSpinner className="animate-spin" size={14} /> : <FaSave size={14} />}
                      {passwordProcessing ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {!isEditingSelf && !isSuperAdmin && activeTab === 'password' && (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <FaLock className="text-gray-400" size={24} />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Password Change Restricted</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                  Only super admins can change passwords for other admin accounts.
                </p>
                <button onClick={() => setActiveTab('profile')} className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                  Go to Profile Information
                </button>
              </div>
            )}

            {/* ─── ICON TAB ─── (Multi‑type support) */}
            {activeTab === 'icon' && (
              <div className="p-4 sm:p-6 md:p-8">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Site Icons Manager</h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Customize icons for different purposes (favicon, preloader, logo, etc.)
                    </p>
                  </div>

                  {/* Icon Type Selector */}
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FaCog size={14} className="text-gray-500" />
                      Icon Type:
                    </label>
                    <select
                      value={selectedIconType}
                      onChange={(e) => setSelectedIconType(e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.keys(iconData).map((type) => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] sm:text-xs text-gray-400">
                      {currentIconForType ? 'Custom icon set' : 'Default icon'}
                    </span>
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Left Column - Current & Upload */}
                    <div className="space-y-4 sm:space-y-6">
                      {/* Current Icon Card */}
                      <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-100">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                          <FaImage className="text-blue-500" size={14} />
                          Current {selectedIconType.replace('_', ' ')} Icon
                        </h3>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                          <div className="relative">
                            {currentIconForType ? (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-blue-200 overflow-hidden bg-white shadow-sm">
                                <img
                                  src={currentIconForType.url}
                                  alt="Current icon"
                                  className="w-full h-full object-contain p-1.5 sm:p-2"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-white/50">
                                <FaImage className="text-gray-300" size={24} />
                              </div>
                            )}
                            {currentIconForType && (
                              <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                                <FaCheckCircle size={10} />
                              </span>
                            )}
                          </div>

                          <div className="flex-1">
                            {currentIconForType ? (
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium text-gray-800">{currentIconForType.name}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">{currentIconForType.size}</p>
                                <p className="text-[10px] sm:text-xs text-gray-400">{currentIconForType.last_modified}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm text-gray-500">No custom icon set</p>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Using default application icon</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Upload Card */}
                      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                          <FaUpload className="text-blue-500" size={14} />
                          Upload New Icon
                        </h3>

                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-100 transition">
                            <FaUpload className="text-blue-400 group-hover:text-blue-600 transition" size={16} />
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 font-medium">Click to select an icon file</p>
                          <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">
                            PNG, JPG, SVG, WebP, ICO • Max 2MB
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-400">
                            Recommended: 512×512px or 256×256px
                          </p>
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {uploading && (
                          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 rounded-lg">
                            <FaSpinner className="animate-spin text-blue-600" size={16} />
                            <span className="text-xs sm:text-sm text-gray-600">Uploading icon...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Actions & History */}
                    <div className="space-y-4 sm:space-y-6">
                      {/* Actions Card */}
                      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                          <FaInfoCircle className="text-blue-500" size={14} />
                          Actions
                        </h3>

                        <div className="space-y-2.5 sm:space-y-3">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm disabled:opacity-50 text-sm"
                          >
                            <FaUpload size={14} /> Upload New Icon
                          </button>

                          {currentIconForType && (
                            <button
                              onClick={handleResetIcon}
                              disabled={uploading}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 flex items-center justify-center gap-2 font-medium border border-red-200 text-sm"
                            >
                              <FaUndo size={14} /> Reset to Default
                            </button>
                          )}
                        </div>

                        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-1.5 sm:gap-2">
                          <FaInfoCircle className="text-yellow-600 mt-0.5 shrink-0" size={12} />
                          <p className="text-[10px] sm:text-xs text-yellow-700">
                            <span className="font-medium">Note:</span> After uploading, clear your browser cache or restart your browser to see changes.
                          </p>
                        </div>
                      </div>

                      {/* Icon History Card */}
                      {availableIconsForType.length > 0 && (
                        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                            <FaImage className="text-gray-500" size={14} />
                            Icon History
                            <span className="text-[10px] sm:text-xs text-gray-400 font-normal ml-0.5 sm:ml-1">
                              ({availableIconsForType.length})
                            </span>
                          </h3>

                          <div className="flex gap-2 sm:gap-3 flex-wrap">
                            {availableIconsForType.slice(0, 6).map((icon) => (
                              <div
                                key={icon.name}
                                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 overflow-hidden bg-white flex items-center justify-center transition ${currentIconForType?.name === icon.name
                                  ? 'border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-200 hover:border-gray-300'
                                  }`}
                              >
                                <img
                                  src={icon.url}
                                  alt={icon.name}
                                  className="w-full h-full object-contain p-1 sm:p-1.5"
                                />
                                {currentIconForType?.name === icon.name && (
                                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5">
                                    <FaCheckCircle size={8} />
                                  </div>
                                )}
                              </div>
                            ))}
                            {availableIconsForType.length > 6 && (
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                                  +{availableIconsForType.length - 6}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}