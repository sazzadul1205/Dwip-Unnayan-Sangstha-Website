// resources/js/Pages/Backend/ApplicantProfile/Modals/AchievementsModal.jsx

// React
import { useState } from 'react';

// SweetAlert
import Swal from 'sweetalert2';

// Icons
import {
  FaPlus,
  FaTrophy,
  FaAward,
  FaStar,
  FaTrashAlt,
  FaMedal,
  FaCertificate,
  FaRegStar,
} from 'react-icons/fa';
import { MdEmojiEvents, MdVerified } from 'react-icons/md';
import { GiAchievement, GiMedalSkull } from 'react-icons/gi';

// Components
import Modal from './Modal';
import { router } from '@inertiajs/react';

/**
 * AchievementsModal Component
 * 
 * Allows users to manage their achievements, certifications, and awards.
 * Supports adding, editing, and deleting achievements.
 * 
 * Features:
 * - Add/Edit achievement titles and descriptions
 * - Delete existing achievements
 * - Visual preview of achievements
 * - Maximum 3 achievements limit
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.profile - User profile data containing achievements
 */
const AchievementsModal = ({ isOpen, onClose, profile }) => {
  const [saving, setSaving] = useState(false);

  // Initialize modal data from profile
  const [modalData, setModalData] = useState({
    achievements: profile?.achievements?.map(ach => ({
      id: ach.id || null,
      achievement_name: ach.achievement_name || '',
      achievement_details: ach.achievement_details || '',
      to_delete: false // Flag for soft deletion
    })) || [],
  });

  /**
   * Add a new empty achievement to the list
   */
  const addAchievement = () => {
    setModalData({
      ...modalData,
      achievements: [
        ...modalData.achievements,
        {
          id: null,
          achievement_name: '',
          achievement_details: '',
          to_delete: false
        }
      ]
    });
  };

  /**
   * Update a specific achievement field
   * @param {number} index - Index of achievement to update
   * @param {string} field - Field name ('achievement_name' or 'achievement_details')
   * @param {string} value - New value
   */
  const updateAchievement = (index, field, value) => {
    const updatedAchievements = [...modalData.achievements];
    updatedAchievements[index][field] = value;
    setModalData({ ...modalData, achievements: updatedAchievements });
  };

  /**
   * Remove achievement (soft delete for existing, hard delete for new)
   * @param {number} index - Index of achievement to remove
   */
  const removeAchievement = (index) => {
    const updatedAchievements = [...modalData.achievements];
    if (updatedAchievements[index].id) {
      // Mark existing achievement for deletion
      updatedAchievements[index].to_delete = true;
    } else {
      // Remove unsaved achievement immediately
      updatedAchievements.splice(index, 1);
    }
    setModalData({ ...modalData, achievements: updatedAchievements });
  };

  /**
   * Save achievements to the server
   * Sends PUT request to update achievements endpoint
   */
  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(route('backend.applicant.profile.update-achievements', profile.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          achievements: modalData.achievements
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Achievements updated successfully.',
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
        text: error.message || 'Failed to update achievements.',
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Get appropriate icon based on achievement title
   * @param {string} title - Achievement title
   * @returns {JSX.Element} - Icon component
   */
  const getAchievementIcon = (title) => {
    if (title?.toLowerCase().includes('certificate') || title?.toLowerCase().includes('certified')) {
      return <FaCertificate className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />;
    }
    if (title?.toLowerCase().includes('award') || title?.toLowerCase().includes('winner')) {
      return <FaMedal className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />;
    }
    if (title?.toLowerCase().includes('competition')) {
      return <MdEmojiEvents className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />;
    }
    return <FaStar className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />;
  };

  if (!isOpen) return null;

  // Filter out deleted achievements
  const activeAchievements = modalData.achievements.filter(ach => !ach.to_delete);

  return (
    <Modal title="Edit Achievements & Certifications" onClose={onClose} onSave={handleSave} saving={saving}>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="border-b border-gray-200 pb-2.5 sm:pb-3 md:pb-4">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <GiAchievement className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Achievements & Certifications</h2>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">Showcase your accomplishments</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {activeAchievements.length === 0 && (
          <div className="text-center py-6 sm:py-8 md:py-12 bg-linear-to-b from-gray-50 to-gray-100 rounded-xl">
            <div className="p-3 sm:p-4 bg-white rounded-full w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-2 sm:mb-3 md:mb-4 shadow-md flex items-center justify-center">
              <GiMedalSkull className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-gray-400" />
            </div>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium">No achievements added yet</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-0.5 sm:mt-1">Add your certifications, awards, or accomplishments</p>
          </div>
        )}

        {/* Achievements List */}
        {activeAchievements.map((achievement, index) => (
          <div key={achievement.id} className="border border-gray-200 rounded-xl p-3 sm:p-4 md:p-5 relative hover:shadow-lg transition-all duration-200 bg-white">
            {/* Delete Button - repositioned for smaller screens */}
            <button
              onClick={() => removeAchievement(index)}
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 md:top-4 md:right-4 text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors duration-200"
              aria-label="Delete achievement"
            >
              <FaTrashAlt className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
            </button>

            {/* Achievement Header */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3 md:mb-4 pb-1.5 sm:pb-2 border-b border-gray-100">
              <FaTrophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-500" />
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-600">Achievement #{index + 1}</span>
              {achievement.achievement_name && (
                <span className="ml-1 sm:ml-2 flex items-center gap-0.5 sm:gap-1">
                  {getAchievementIcon(achievement.achievement_name)}
                </span>
              )}
            </div>

            {/* Achievement Title Field */}
            <div className="mb-2.5 sm:mb-3 md:mb-4">
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <FaAward className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-gray-400" />
                  Achievement / Certification Title
                </span>
              </label>
              <input
                type="text"
                value={achievement.achievement_name}
                onChange={(e) => updateAchievement(index, 'achievement_name', e.target.value)}
                className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm md:text-base"
                placeholder="e.g., Certified Scrum Master, Best Employee Award 2024, Google IT Certification"
              />
            </div>

            {/* Achievement Details Field */}
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <MdVerified className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-gray-400" />
                  Details
                </span>
              </label>
              <textarea
                value={achievement.achievement_details}
                onChange={(e) => updateAchievement(index, 'achievement_details', e.target.value)}
                rows="3"
                className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm md:text-base"
                placeholder="Describe your achievement, certification, or award. Include issuing organization, date, and any relevant details..."
              />
            </div>

            {/* Preview Section */}
            {(achievement.achievement_name || achievement.achievement_details) && (
              <div className="mt-2 sm:mt-3 md:mt-4 p-1.5 sm:p-2 md:p-3 bg-linear-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
                <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500 mb-0.5 sm:mb-1 flex items-center gap-0.5 sm:gap-1">
                  <FaRegStar className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-3 md:w-3 text-yellow-500" />
                  Preview:
                </p>
                {achievement.achievement_name && (
                  <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-800">
                    🏆 {achievement.achievement_name}
                  </p>
                )}
                {achievement.achievement_details && (
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-0.5 line-clamp-2">
                    {achievement.achievement_details}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add Achievement Button - full width on mobile */}
        <button
          onClick={addAchievement}
          disabled={activeAchievements.length >= 3}
          className={`w-full py-2.5 sm:py-3 md:py-3.5 border-2 border-dashed rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm md:text-base
            ${activeAchievements.length >= 3 ? 'border-gray-200 text-gray-400 cursor-not-allowed hover:border-gray-200 hover:text-gray-400 hover:bg-white' : 'border-gray-300'}`}
        >
          <FaPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          Add Achievement / Certification
        </button>

        {/* Tips Section */}
        {activeAchievements.length > 0 && (
          <div className="bg-linear-to-r from-yellow-50 to-orange-50 rounded-xl p-2.5 sm:p-3 md:p-4 border border-yellow-100">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <FaTrophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-600" />
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
                Add all your achievements, certifications, awards, and recognitions to stand out to employers.
              </p>
            </div>
          </div>
        )}

        {/* Example Achievements - responsive grid */}
        {activeAchievements.length === 0 && (
          <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3 md:p-4 border border-gray-200">
            <p className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-500 mb-1.5 sm:mb-2 flex items-center gap-0.5 sm:gap-1">
              <FaStar className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-3 md:w-3 text-yellow-500" />
              Example achievements you can add:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5 md:gap-2 text-[8px] sm:text-[10px] md:text-xs text-gray-600">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <FaCertificate className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-500" />
                <span>Certified Scrum Master (CSM)</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <FaMedal className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500" />
                <span>Employee of the Month</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <MdEmojiEvents className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-500" />
                <span>Hackathon Winner 2023</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <FaAward className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                <span>AWS Certified Solutions Architect</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AchievementsModal;