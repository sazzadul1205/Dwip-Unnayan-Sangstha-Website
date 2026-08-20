// resources/js/Pages/Backend/Profile/Admin/Create.jsx

// React
import { useState } from 'react';

// Inertia
import { Head, useForm, router } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';

// Sweetalert
import Swal from 'sweetalert2';

// Auth
import { useAuth } from '@/hooks/useAuth';
import { Can } from '../../../../components/Auth/Can';

// Icons
import {
  FaSave,
  FaTimes,
  FaUser,
  FaEnvelope,
  FaLock,
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaUserShield,
  FaKey,
  FaShieldAlt,
} from 'react-icons/fa';

export default function Create() {
  // Use centralized auth hook
  const {
    hasAnyPermission,
    hasRole
  } = useAuth();

  // Check permissions for admin management
  const isSuperAdmin = hasRole('super-admin');
  const canViewAdmins = hasAnyPermission(['admin.view', 'admin.manage']);
  const canCreateAdmins = hasAnyPermission(['admin.create', 'admin.manage']);

  // Profile form
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  // show Password form
  const [showPassword, setShowPassword] = useState(false);

  // If user doesn't have permission to create admins, show access denied
  if (!canCreateAdmins) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to create admin accounts.</p>
            {canViewAdmins && (
              <button
                onClick={() => router.visit(route('backend.admin-profile.index'))}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Back to Admin List
              </button>
            )}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Additional security check before submission
    if (!canCreateAdmins) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to create admin accounts.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    post(route('backend.admin-profile.store'), {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Admin profile created successfully!',
          timer: 2000,
          showConfirmButton: false,
        });
        router.visit(route('backend.admin-profile.index'));
      },
      onError: (errors) => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: Object.values(errors).flat().join('\n'),
        });
      }
    });
  };

  // Handle cancel
  const handleCancel = () => {
    router.visit(route('backend.admin-profile.index'));
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  // Calculate password strength
  const passwordStrength = getPasswordStrength(data.password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <AuthenticatedLayout>
      <Head title="Create Admin Profile" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Back Button */}
          <div className="mb-6">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors group"
            >
              <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Back to Admin List</span>
            </button>

            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Create Admin Profile
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Add a new administrator to the system
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Information</h2>
                  <p className="text-sm text-gray-500">Enter the details for the new admin user</p>
                </div>

                <div className="space-y-5">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="email"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="admin@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        required
                        autoComplete="new-password"
                        className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter password (min 8 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <FaLock size={16} /> : <FaKey size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}

                    {/* Password Strength Indicator */}
                    {data.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 h-1.5 mb-2">
                          {[0, 1, 2, 3, 4].map((index) => (
                            <div
                              key={index}
                              className={`flex-1 rounded-full transition-all ${index < passwordStrength
                                ? strengthColors[passwordStrength - 1]
                                : 'bg-gray-200'
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600">
                          Password Strength: <span className="font-medium">{strengthLabels[passwordStrength - 1] || 'Very Weak'}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                        autoComplete="new-password"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password_confirmation ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Confirm password"
                      />
                    </div>
                    {errors.password_confirmation && (
                      <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>
                    )}

                    {/* Password Match Indicator */}
                    {data.password && data.password_confirmation && (
                      <div className="mt-1">
                        {data.password === data.password_confirmation ? (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <FaCheckCircle size={10} />
                            Passwords match
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <FaExclamationCircle size={10} />
                            Passwords do not match
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li className="flex items-center gap-2">
                      {data.password.length >= 8 ?
                        <FaCheckCircle className="text-green-600" size={12} /> :
                        <FaExclamationCircle className="text-blue-600" size={12} />
                      }
                      Minimum 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      {/[A-Z]/.test(data.password) ?
                        <FaCheckCircle className="text-green-600" size={12} /> :
                        <FaExclamationCircle className="text-blue-600" size={12} />
                      }
                      At least one uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      {/[a-z]/.test(data.password) ?
                        <FaCheckCircle className="text-green-600" size={12} /> :
                        <FaExclamationCircle className="text-blue-600" size={12} />
                      }
                      At least one lowercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      {/[0-9]/.test(data.password) ?
                        <FaCheckCircle className="text-green-600" size={12} /> :
                        <FaExclamationCircle className="text-blue-600" size={12} />
                      }
                      At least one number
                    </li>
                  </ul>
                </div>

                {/* Info Box - Shows different info based on user role */}
                <div className="bg-purple-50 rounded-lg p-4 flex items-start gap-3">
                  <FaUserShield className="text-purple-500 mt-0.5" size={18} />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">Admin Account Information:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Admin users have full access to the system</li>
                      <li>They can manage users, jobs, and all platform settings</li>
                      <li>Make sure to provide a secure password</li>
                      <li>The admin will receive a welcome email with login instructions</li>
                      {isSuperAdmin && (
                        <li className="text-purple-900 font-medium">You are creating this as a super admin</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                  >
                    <FaTimes size={14} />
                    Cancel
                  </button>
                  <Can permission="admin.create" fallback={null}>
                    <button
                      type="submit"
                      disabled={processing}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing ? <FaSpinner className="animate-spin" size={14} /> : <FaSave size={14} />}
                      {processing ? 'Creating...' : 'Create Admin'}
                    </button>
                  </Can>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}