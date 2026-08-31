// resources/js/Pages/Backend/ApplicantProfile/Modals/EducationModal.jsx

import { useState } from 'react';
import Swal from 'sweetalert2';
import {
  FaPlus,
  FaBook,
  FaAward,
  FaTrashAlt,
  FaBookOpen,
  FaUniversity,
  FaCalendarAlt,
  FaGraduationCap,
} from 'react-icons/fa';
import { MdSchool } from 'react-icons/md';
import { GiBookshelf } from 'react-icons/gi';
import Modal from './Modal';
import { router } from '@inertiajs/react';

/**
 * EducationModal Component
 * 
 * Allows users to manage their education history.
 * Features:
 * - Add multiple education entries (max 3)
 * - Edit institution name, degree, and passing year
 * - Delete existing entries
 * - Preview of added education
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.profile - User profile data containing education histories
 */
const EducationModal = ({ isOpen, onClose, profile }) => {
  const [saving, setSaving] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

  const [modalData, setModalData] = useState({
    education_histories: profile?.education_histories?.map(edu => ({
      id: edu.id || null,
      institution_name: edu.institution_name || '',
      degree: edu.degree || '',
      passing_year: edu.passing_year || currentYear,
      to_delete: false
    })) || [],
  });

  /**
   * Add a new empty education entry
   */
  const addEducation = () => {
    setModalData({
      ...modalData,
      education_histories: [
        ...modalData.education_histories,
        {
          id: null,
          institution_name: '',
          degree: '',
          passing_year: currentYear,
          to_delete: false
        }
      ]
    });
  };

  /**
   * Update a specific education field
   * @param {number} index - Index of education to update
   * @param {string} field - Field name ('institution_name', 'degree', or 'passing_year')
   * @param {string|number} value - New value
   */
  const updateEducation = (index, field, value) => {
    const updatedEducations = [...modalData.education_histories];
    updatedEducations[index][field] = value;
    setModalData({ ...modalData, education_histories: updatedEducations });
  };

  /**
   * Remove education entry (soft delete for existing, hard delete for new)
   * @param {number} index - Index of education to remove
   */
  const removeEducation = (index) => {
    const updatedEducations = [...modalData.education_histories];
    if (updatedEducations[index].id) {
      // Mark existing education for deletion
      updatedEducations[index].to_delete = true;
    } else {
      // Remove unsaved education immediately
      updatedEducations.splice(index, 1);
    }
    setModalData({ ...modalData, education_histories: updatedEducations });
  };

  /**
   * Save education data to server
   * Sends PUT request to update education endpoint
   */
  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(route('backend.applicant.profile.update-educations', profile.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          education_histories: modalData.education_histories
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Education updated successfully.',
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
        text: error.message || 'Failed to update education.',
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Get appropriate icon based on degree type
   * @param {string} degree - Degree name
   * @returns {JSX.Element} - Icon component
   */
  const getDegreeIcon = (degree) => {
    if (degree?.toLowerCase().includes('bachelor')) return <FaBookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-500" />;
    if (degree?.toLowerCase().includes('master')) return <FaAward className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-purple-500" />;
    if (degree?.toLowerCase().includes('phd')) return <FaGraduationCap className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-yellow-500" />;
    return <FaBook className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-500" />;
  };

  if (!isOpen) return null;

  const activeEducations = modalData.education_histories.filter(edu => !edu.to_delete);

  return (
    <Modal title="Edit Education" onClose={onClose} onSave={handleSave} saving={saving}>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-2.5 sm:pb-3 md:pb-4">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <MdSchool className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Education</h2>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">Tell us about your academic background</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {activeEducations.length === 0 && (
          <div className="text-center py-6 sm:py-8 md:py-12 bg-linear-to-b from-gray-50 to-gray-100 rounded-xl">
            <div className="p-2.5 sm:p-3 md:p-4 bg-white rounded-full w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-2 sm:mb-3 md:mb-4 shadow-md flex items-center justify-center">
              <GiBookshelf className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-gray-400" />
            </div>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium">No education added yet</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-0.5 sm:mt-1">Click the button below to add your education</p>
          </div>
        )}

        {/* Education List */}
        {activeEducations.map((edu, index) => (
          <div key={edu.id} className="border border-gray-200 rounded-xl p-2.5 sm:p-3 md:p-5 relative hover:shadow-lg transition-all duration-200 bg-white">
            {/* Delete Button - repositioned for smaller screens */}
            <button
              onClick={() => removeEducation(index)}
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 md:top-4 md:right-4 text-red-500 hover:text-red-700 p-0.5 sm:p-1 hover:bg-red-50 rounded-lg transition-colors duration-200"
              aria-label="Delete education"
            >
              <FaTrashAlt className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
            </button>

            {/* Education Header */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3 md:mb-4 pb-1.5 sm:pb-2 border-b border-gray-100">
              <FaUniversity className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500" />
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-600">Education #{index + 1}</span>
              {edu.degree && (
                <span className="ml-1 sm:ml-2 flex items-center gap-0.5 sm:gap-1">
                  {getDegreeIcon(edu.degree)}
                </span>
              )}
            </div>

            {/* Institution & Degree */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-5">
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <FaUniversity className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-gray-400" />
                    Institution Name
                  </span>
                </label>
                <input
                  type="text"
                  value={edu.institution_name}
                  onChange={(e) => updateEducation(index, 'institution_name', e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm md:text-base"
                  placeholder="e.g., University of Dhaka, BUET, North South University"
                />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <FaGraduationCap className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-gray-400" />
                    Degree
                  </span>
                </label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm md:text-base"
                  placeholder="e.g., BSc in Computer Science, MBA, HSC, SSC"
                />
              </div>
            </div>

            {/* Passing Year */}
            <div className="mt-2.5 sm:mt-3 md:mt-5">
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                Passing Year
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                  <FaCalendarAlt className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <select
                  value={edu.passing_year}
                  onChange={(e) => updateEducation(index, 'passing_year', parseInt(e.target.value))}
                  className="w-full pl-7 sm:pl-8 md:pl-10 pr-2.5 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-xs sm:text-sm md:text-base"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview Section */}
            {(edu.institution_name || edu.degree) && (
              <div className="mt-2.5 sm:mt-3 md:mt-4 p-1.5 sm:p-2 md:p-3 bg-gray-50 rounded-lg">
                <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500 mb-0.5 sm:mb-1">Preview:</p>
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">
                  {edu.degree && <span>{edu.degree}</span>}
                  {edu.degree && edu.institution_name && <span> from </span>}
                  {edu.institution_name && <span>{edu.institution_name}</span>}
                  {edu.passing_year && <span className="text-gray-500"> ({edu.passing_year})</span>}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Add Education Button */}
        <button
          onClick={addEducation}
          disabled={activeEducations.length >= 3}
          className={`w-full py-2.5 sm:py-3 md:py-3.5 border-2 border-dashed rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm md:text-base
            ${activeEducations.length >= 3 ? 'border-gray-200 text-gray-400 cursor-not-allowed hover:border-gray-200 hover:text-gray-400 hover:bg-white' : 'border-gray-300'}`}
        >
          <FaPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          Add Education
        </button>

        {/* Tips Section */}
        {activeEducations.length > 0 && (
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-2.5 sm:p-3 md:p-4 border border-blue-100">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 md:gap-2">
              <FaGraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500 shrink-0" />
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 text-center sm:text-left">
                Add all your educational qualifications from highest to lowest level.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EducationModal;