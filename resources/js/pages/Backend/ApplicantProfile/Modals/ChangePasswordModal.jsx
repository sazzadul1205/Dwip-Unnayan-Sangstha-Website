// resources/js/Pages/Backend/ApplicantProfile/Modals/ChangePasswordModal.jsx

// React
import { useState } from 'react';

// Icons
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

// Components
import Modal from './Modal';

// SweetAlert
import Swal from 'sweetalert2';

/**
 * ChangePasswordModal Component
 * 
 * Allows authenticated users to change their password.
 * Features:
 * - Current password verification
 * - New password with confirmation
 * - Password visibility toggle
 * - Validation error display
 * 
 * Note: This modal should only be available to the profile owner,
 * not to admins viewing other profiles.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.profile - User profile data (unused but kept for consistency)
 */
const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Handle input field changes
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  /**
   * Toggle password visibility for a specific field
   * @param {string} field - Field name ('current', 'new', or 'confirm')
   */
  const togglePasswordVisibility = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  /**
   * Submit password change request
   * Sends POST request to change password endpoint
   */
  const handleSubmit = async () => {
    setSaving(true);
    setErrors({});

    try {
      const response = await fetch(route('backend.applicant.profile.change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
          throw new Error(Object.values(data.errors).flat()[0]);
        }
        throw new Error(data.message || 'Failed to change password');
      }

      // Success
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Password changed successfully!',
        timer: 2000,
        showConfirmButton: false
      });

      onClose();
      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal title="Change Password" onClose={onClose} onSave={handleSubmit} saving={saving}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-3 sm:pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaLock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Change Your Password</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Update your account password</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Current Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type={showPassword.current ? 'text' : 'password'}
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base ${errors.current_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword.current ? (
                  <FaEyeSlash className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FaEye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.current_password && (
              <p className="mt-1 text-[10px] sm:text-xs text-red-600">{errors.current_password[0]}</p>
            )}
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type={showPassword.new ? 'text' : 'password'}
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base ${errors.new_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter new password (min 8 characters)"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword.new ? (
                  <FaEyeSlash className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FaEye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.new_password && (
              <p className="mt-1 text-[10px] sm:text-xs text-red-600">{errors.new_password[0]}</p>
            )}
            <p className="mt-1 text-[10px] sm:text-xs text-gray-500">Password must be at least 8 characters long</p>
          </div>

          {/* Confirm New Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                name="new_password_confirmation"
                value={formData.new_password_confirmation}
                onChange={handleChange}
                className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base ${errors.new_password_confirmation ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword.confirm ? (
                  <FaEyeSlash className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FaEye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.new_password_confirmation && (
              <p className="mt-1 text-[10px] sm:text-xs text-red-600">{errors.new_password_confirmation[0]}</p>
            )}
          </div>
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
          <p className="text-[10px] sm:text-xs font-medium text-blue-800 mb-1.5 sm:mb-2">Password Requirements:</p>
          <ul className="text-[10px] sm:text-xs text-blue-700 space-y-0.5 sm:space-y-1">
            <li>• Minimum 8 characters long</li>
            <li>• Use a mix of letters, numbers, and symbols for better security</li>
            <li>• Avoid using common passwords or personal information</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;