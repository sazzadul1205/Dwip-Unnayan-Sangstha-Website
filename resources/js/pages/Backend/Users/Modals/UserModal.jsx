// resources/js/pages/Backend/Users/Modals/UserModal.jsx

import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
  FaTimes,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaSyncAlt,
  FaCopy,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUsers,
  FaUserTag,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function UserModal({ isOpen, onClose, editingUser, roles, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role_slug: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Reset form when modal opens or editingUser changes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        const userRole = editingUser.roles?.[0]?.slug || '';
        setFormData({
          name: editingUser.name || '',
          email: editingUser.email || '',
          password: '',
          password_confirmation: '',
          role_slug: userRole,
        });
      } else {
        const defaultRole = roles.find(r => r.slug === 'job_seeker') || roles[0];
        setFormData({
          name: '',
          email: '',
          password: '',
          password_confirmation: '',
          role_slug: defaultRole?.slug || '',
        });
      }
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPasswordCopied(false);
    }
  }, [isOpen, editingUser, roles]);

  if (!isOpen) return null;

  // Generate random password
  const generatePassword = () => {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    password = password.split('').sort(() => Math.random() - 0.5).join('');

    setFormData(prev => ({
      ...prev,
      password,
      password_confirmation: password
    }));
    setPasswordCopied(false);
  };

  // Copy password to clipboard
  const copyPassword = async () => {
    if (!formData.password) {
      Swal.fire({
        icon: 'warning',
        title: 'No Password',
        text: 'Please generate a password first.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(formData.password);
      setPasswordCopied(true);
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Password copied to clipboard.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Copy',
        text: 'Please copy the password manually.',
        confirmButtonColor: '#2563eb',
      });
    }
  };

  // Validate form before submission
  const validateForm = () => {
    if (!formData.name.trim()) {
      Swal.fire('Validation Error', 'Please enter full name.', 'error');
      return false;
    }
    if (!formData.email.trim()) {
      Swal.fire('Validation Error', 'Please enter email address.', 'error');
      return false;
    }
    if (!formData.role_slug) {
      Swal.fire('Validation Error', 'Please select a role.', 'error');
      return false;
    }

    if (!editingUser && !formData.password) {
      Swal.fire('Validation Error', 'Please enter a password or generate one.', 'error');
      return false;
    }

    if (formData.password) {
      if (formData.password !== formData.password_confirmation) {
        Swal.fire('Validation Error', 'Password and confirm password do not match.', 'error');
        return false;
      }

      if (formData.password.length < 8) {
        Swal.fire('Validation Error', 'Password must be at least 8 characters.', 'error');
        return false;
      }

      if (!editingUser && !passwordCopied) {
        Swal.fire({
          title: 'Password Not Copied',
          html: 'Please copy the generated password before creating the user.<br/><small>This ensures you have saved the password securely.</small>',
          icon: 'warning',
          confirmButtonColor: '#2563eb',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const submitData = {
      name: formData.name,
      email: formData.email,
      role_slug: formData.role_slug,
    };

    if (formData.password) {
      submitData.password = formData.password;
    }

    if (editingUser) {
      router.put(route('backend.users.update', editingUser.id), submitData, {
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'User updated successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
          setIsSubmitting(false);
          onClose();
          onSuccess();
        },
        onError: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: error?.response?.data?.message || error?.message || 'Failed to update user.',
          });
          setIsSubmitting(false);
        },
      });
    } else {
      router.post(route('backend.users.store'), submitData, {
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Created!',
            text: 'User created and verified successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
          setIsSubmitting(false);
          onClose();
          onSuccess();
        },
        onError: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: error?.response?.data?.message || error?.message || 'Failed to create user.',
          });
          setIsSubmitting(false);
        },
      });
    }
  };

  const getRoleDescription = (roleSlug) => {
    const role = roles.find(r => r.slug === roleSlug);
    return role?.description || '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 animate-slide-up max-h-[95vh] overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shrink-0">
              <FaUsers className="text-white" size={14} />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Add User'}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                {editingUser ? 'Update user information' : 'Create a new system user'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:rotate-90 transform self-end sm:self-center"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                placeholder="John Doe"
                required
                autoFocus
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                placeholder="john@example.com"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Password {!editingUser && <span className="text-red-500">*</span>}
                {editingUser && <span className="text-gray-400 text-[10px] sm:text-xs"> (Optional - leave empty to keep current)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setPasswordCopied(false);
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-20 sm:pr-24 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  placeholder={editingUser ? 'Leave empty to keep current password' : 'Enter password'}
                  minLength={8}
                />
                <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex gap-0.5 sm:gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="p-1 sm:p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Generate strong password"
                  >
                    <FaSyncAlt size={12} />
                  </button>
                </div>
              </div>
              {formData.password && (
                <div className="mt-1.5 sm:mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-lg gap-1.5 sm:gap-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <code className="text-[10px] sm:text-xs font-mono text-gray-700 break-all">{formData.password}</code>
                    <button
                      type="button"
                      onClick={copyPassword}
                      className={`p-1 rounded transition-colors ${passwordCopied ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                      title="Copy password"
                    >
                      <FaCopy size={12} />
                    </button>
                  </div>
                  {passwordCopied && (
                    <span className="text-[10px] sm:text-xs text-green-600 flex items-center gap-0.5 sm:gap-1">
                      <FaCheckCircle size={10} />
                      Copied!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            {formData.password && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    placeholder="Confirm password"
                    required={!!formData.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                  >
                    {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
                {formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation && (
                  <p className="text-[10px] sm:text-xs text-red-500 mt-1 flex items-center gap-0.5 sm:gap-1">
                    <FaExclamationTriangle size={8} />
                    Passwords do not match
                  </p>
                )}
                {formData.password && formData.password === formData.password_confirmation && formData.password_confirmation && (
                  <p className="text-[10px] sm:text-xs text-green-500 mt-1 flex items-center gap-0.5 sm:gap-1">
                    <FaCheckCircle size={8} />
                    Passwords match
                  </p>
                )}
              </div>
            )}

            {/* Password Copy Confirmation for new users */}
            {!editingUser && formData.password && !passwordCopied && (
              <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <input
                  type="checkbox"
                  id="passwordCopied"
                  checked={passwordCopied}
                  onChange={(e) => setPasswordCopied(e.target.checked)}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                />
                <label htmlFor="passwordCopied" className="text-[10px] sm:text-sm text-gray-700 cursor-pointer">
                  I have copied the password to a secure location
                </label>
              </div>
            )}

            {/* Role Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role_slug}
                onChange={(e) => setFormData({ ...formData, role_slug: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                required
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.slug}>
                    {role.name}
                  </option>
                ))}
              </select>
              {formData.role_slug && (
                <div className="mt-1.5 sm:mt-2 p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FaUserTag className="text-blue-500" size={10} />
                    <p className="text-[10px] sm:text-xs text-gray-600">
                      {getRoleDescription(formData.role_slug)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t bg-gray-50 rounded-b-2xl sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200 font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!editingUser && !passwordCopied && !!formData.password)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-medium shadow-md text-sm sm:text-base"
            >
              {isSubmitting && <FaSpinner className="animate-spin" size={14} />}
              {editingUser ? (isSubmitting ? 'Updating...' : 'Update User') : (isSubmitting ? 'Creating...' : 'Create User')}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}