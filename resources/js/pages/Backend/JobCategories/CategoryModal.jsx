// resources/js/pages/Backend/JobCategories/CategoryModal.jsx

import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
  FaBriefcase,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaBan,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const CategoryModal = ({
  isOpen,
  onClose,
  editingCategory,
  formData,
  setFormData,
  isSubmitting,
  setIsSubmitting,
  canCreateCategories,
  canEditCategories,
}) => {
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);

  // Focus name input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => nameInputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && isOpen) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!canCreateCategories && !canEditCategories) {
      Swal.fire('Permission Denied', 'You do not have permission to save categories.', 'error');
      return;
    }

    setIsSubmitting(true);

    if (editingCategory) {
      router.put(route('backend.categories.update', editingCategory.id), formData, {
        preserveScroll: true,
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Category updated successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
          setIsSubmitting(false);
          onClose();
          router.reload();
        },
        onError: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: error?.response?.data?.message || error?.message || 'Failed to update category.',
          });
          setIsSubmitting(false);
        },
      });
    } else {
      router.post(route('backend.categories.store'), formData, {
        preserveScroll: true,
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Created!',
            text: 'Category created successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
          setIsSubmitting(false);
          onClose();
          router.reload();
        },
        onError: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: error?.response?.data?.message || error?.message || 'Failed to create category.',
          });
          setIsSubmitting(false);
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 animate-slide-up max-h-[95vh] overflow-y-auto"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shrink-0">
              <FaBriefcase className="text-white" size={14} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                {editingCategory ? 'Update category information' : 'Create a new job category'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:rotate-90 transform self-end sm:self-center"
            aria-label="Close modal"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                placeholder="e.g., Information Technology"
                required
              />
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                A unique slug will be automatically generated from the name
              </p>
            </div>

            {/* Status Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${formData.is_active ? 'bg-green-100' : 'bg-gray-200'}`}>
                  {formData.is_active ? <FaCheckCircle className="text-green-600" size={12} /> : <FaBan className="text-gray-500" size={12} />}
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">Active Category</span>
                  <p className="text-[10px] sm:text-xs text-gray-500">Inactive categories won't appear in job listings</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t rounded-b-2xl sticky bottom-0 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200 font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-medium shadow-md text-sm sm:text-base"
            >
              {isSubmitting && <FaSpinner className="animate-spin" size={14} />}
              {editingCategory ? (isSubmitting ? 'Updating...' : 'Update Category') : (isSubmitting ? 'Creating...' : 'Create Category')}
            </button>
          </div>
        </form>
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
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CategoryModal;