// resources/js/Pages/Backend/ApplicantProfile/Modals/WorkExperienceModal.jsx

import { useState } from 'react';
import Swal from 'sweetalert2';
import {
  FaPlus,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaTrashAlt,
  FaCheckCircle,
} from 'react-icons/fa';
import { GiSuitcase } from 'react-icons/gi';
import { MdWork, MdBusinessCenter } from 'react-icons/md';
import Modal from './Modal';
import { router } from '@inertiajs/react';

/**
 * WorkExperienceModal Component
 * 
 * Allows users to manage their work history.
 * Features:
 * - Add multiple work experiences (max 3)
 * - Edit company name, position, start/end years
 * - Mark current job
 * - Delete existing entries
 * - Preview of added experience
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.profile - User profile data containing job histories
 */
const WorkExperienceModal = ({ isOpen, onClose, profile }) => {
  const [saving, setSaving] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

  const [modalData, setModalData] = useState({
    job_histories: profile?.job_histories?.map(job => ({
      id: job.id || null,
      company_name: job.company_name || '',
      position: job.position || '',
      starting_year: job.starting_year || currentYear,
      ending_year: job.ending_year || null,
      is_current: job.is_current || false,
      to_delete: false
    })) || [],
  });

  /**
   * Add a new empty work experience entry
   */
  const addWorkExperience = () => {
    setModalData({
      ...modalData,
      job_histories: [
        ...modalData.job_histories,
        {
          id: null,
          company_name: '',
          position: '',
          starting_year: currentYear,
          ending_year: null,
          is_current: false,
          to_delete: false
        }
      ]
    });
  };

  /**
   * Update a specific work experience field
   * @param {number} index - Index of experience to update
   * @param {string} field - Field name
   * @param {string|number|boolean} value - New value
   */
  const updateWorkExperience = (index, field, value) => {
    const updatedJobs = [...modalData.job_histories];
    updatedJobs[index][field] = value;
    // Clear ending year if marked as current
    if (field === 'is_current' && value) {
      updatedJobs[index].ending_year = null;
    }
    setModalData({ ...modalData, job_histories: updatedJobs });
  };

  /**
   * Remove work experience entry (soft delete for existing, hard delete for new)
   * @param {number} index - Index of experience to remove
   */
  const removeWorkExperience = (index) => {
    const updatedJobs = [...modalData.job_histories];
    if (updatedJobs[index].id) {
      // Mark existing job for deletion
      updatedJobs[index].to_delete = true;
    } else {
      // Remove unsaved job immediately
      updatedJobs.splice(index, 1);
    }
    setModalData({ ...modalData, job_histories: updatedJobs });
  };

  /**
   * Save work experience data to server
   * Sends PUT request to update endpoint
   */
  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(route('backend.applicant.profile.update-work-experiences', profile.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          job_histories: modalData.job_histories
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Work experience updated successfully.',
          timer: 1500,
          showConfirmButton: false
        });
        // Close modal first, then reload
        onClose();
        router.reload();

        // Small delay to allow modal to close before reload
        setTimeout(() => {
          router.reload();
        }, 300);
      } else {
        throw new Error(responseData.message || 'Failed to update');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Failed to update work experience.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const activeJobs = modalData.job_histories.filter(job => !job.to_delete);

  return (
    <Modal title="Edit Work Experience" onClose={onClose} onSave={handleSave} saving={saving}>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-2.5 sm:pb-3 md:pb-4">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <MdWork className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Work Experience</h2>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">Tell us about your professional background</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {activeJobs.length === 0 && (
          <div className="text-center py-6 sm:py-8 md:py-12 bg-linear-to-b from-gray-50 to-gray-100 rounded-xl">
            <div className="p-2.5 sm:p-3 md:p-4 bg-white rounded-full w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-2 sm:mb-3 md:mb-4 shadow-md flex items-center justify-center">
              <GiSuitcase className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-gray-400" />
            </div>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium">No work experience added yet</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-0.5 sm:mt-1">Click the button below to add your experience</p>
          </div>
        )}

        {/* Work Experience List */}
        {activeJobs.map((job, index) => (
          <div key={job.id} className="border border-gray-200 rounded-xl p-2.5 sm:p-3 md:p-5 relative hover:shadow-lg transition-all duration-200 bg-white">
            {/* Delete Button - repositioned for smaller screens */}
            <button
              onClick={() => removeWorkExperience(index)}
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 md:top-4 md:right-4 text-red-500 hover:text-red-700 p-0.5 sm:p-1 hover:bg-red-50 rounded-lg transition-colors duration-200"
              aria-label="Delete work experience"
            >
              <FaTrashAlt className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
            </button>

            {/* Experience Header */}
            <div className="flex flex-wrap items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3 md:mb-4 pb-1.5 sm:pb-2 border-b border-gray-100">
              <MdBusinessCenter className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500" />
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-600">Experience #{index + 1}</span>
              {job.is_current && (
                <span className="ml-0.5 sm:ml-1 md:ml-2 text-[8px] sm:text-[10px] md:text-xs bg-green-100 text-green-700 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1">
                  <FaCheckCircle className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-3 md:w-3" />
                  Current
                </span>
              )}
            </div>

            {/* Company & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-5">
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <FaBuilding className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-gray-400" />
                    Company Name
                  </span>
                </label>
                <input
                  type="text"
                  value={job.company_name}
                  onChange={(e) => updateWorkExperience(index, 'company_name', e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm md:text-base"
                  placeholder="e.g., Google, Microsoft, Local Company"
                />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <FaBriefcase className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-gray-400" />
                    Position
                  </span>
                </label>
                <input
                  type="text"
                  value={job.position}
                  onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm md:text-base"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
            </div>

            {/* Start & End Years */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-5 mt-2.5 sm:mt-3 md:mt-5">
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  Starting Year
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                    <FaCalendarAlt className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                  <select
                    value={job.starting_year}
                    onChange={(e) => updateWorkExperience(index, 'starting_year', parseInt(e.target.value))}
                    className="w-full pl-7 sm:pl-8 md:pl-10 pr-2.5 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-xs sm:text-sm md:text-base"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  {job.is_current ? 'Ending Year' : 'Ending Year (if applicable)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                    <FaCalendarAlt className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                  <select
                    value={job.ending_year || ''}
                    onChange={(e) => updateWorkExperience(index, 'ending_year', e.target.value ? parseInt(e.target.value) : null)}
                    disabled={job.is_current}
                    className="w-full pl-7 sm:pl-8 md:pl-10 pr-2.5 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white text-xs sm:text-sm md:text-base"
                  >
                    <option value="">Present</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Current Job Checkbox */}
            <div className="mt-2.5 sm:mt-3 md:mt-5 pt-0.5 sm:pt-1 md:pt-2">
              <label className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={job.is_current}
                  onChange={(e) => updateWorkExperience(index, 'is_current', e.target.checked)}
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-[10px] sm:text-xs md:text-sm text-gray-700 flex items-center gap-0.5 sm:gap-1">
                  <FaCheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-500" />
                  I currently work here
                </span>
              </label>
            </div>
          </div>
        ))}

        {/* Add Work Experience Button */}
        <button
          onClick={addWorkExperience}
          disabled={activeJobs.length >= 3}
          className={`w-full py-2.5 sm:py-3 md:py-3.5 border-2 border-dashed rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm md:text-base
            ${activeJobs.length >= 3 ? 'border-gray-200 text-gray-400 cursor-not-allowed hover:border-gray-200 hover:text-gray-400 hover:bg-white' : 'border-gray-300'}`}
        >
          <FaPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          Add Work Experience
        </button>

        {/* Tips Section */}
        {activeJobs.length > 0 && (
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-2.5 sm:p-3 md:p-4 border border-blue-100">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 md:gap-2">
              <FaBriefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500 shrink-0" />
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 text-center sm:text-left">
                Add all your relevant work experiences. You can add multiple entries and mark your current job.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WorkExperienceModal;