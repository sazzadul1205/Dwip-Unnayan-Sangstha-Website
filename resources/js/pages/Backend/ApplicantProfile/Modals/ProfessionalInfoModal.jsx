// resources/js/Pages/Backend/ApplicantProfile/Modals/ProfessionalInfoModal.jsx

import { useState } from 'react';
import Swal from 'sweetalert2';
import Modal from './Modal';
import {
  FaBriefcase,
  FaLink,
  FaChartLine,
  FaUserTie,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaFacebook,
  FaGlobe,
  FaYoutube,
  FaMedium,
  FaDev,
  FaStackOverflow,
  FaTrash,
  FaPlus,
} from 'react-icons/fa';
import { router } from '@inertiajs/react';

/**
 * ProfessionalInfoModal Component
 * 
 * Allows users to manage their professional information including:
 * - Years of experience
 * - Current job title
 * - Social media/professional profile links
 * 
 * Features:
 * - Add/remove social links from multiple platforms
 * - Edit experience level and job title
 * - Preview added social links
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.profile - User profile data
 */
const ProfessionalInfoModal = ({ isOpen, onClose, profile }) => {
  const [saving, setSaving] = useState(false);
  const [modalData, setModalData] = useState({
    experience_years: profile?.experience_years || '',
    current_job_title: profile?.current_job_title || '',
    social_links: profile?.social_links || {},
  });
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  /**
   * Available social media platforms
   */
  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-600', placeholder: 'https://linkedin.com/in/username' },
    { id: 'github', name: 'GitHub', icon: FaGithub, color: 'text-gray-800', placeholder: 'https://github.com/username' },
    { id: 'twitter', name: 'Twitter', icon: FaTwitter, color: 'text-blue-400', placeholder: 'https://twitter.com/username' },
    { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'text-blue-700', placeholder: 'https://facebook.com/username' },
    { id: 'youtube', name: 'YouTube', icon: FaYoutube, color: 'text-red-600', placeholder: 'https://youtube.com/@username' },
    { id: 'medium', name: 'Medium', icon: FaMedium, color: 'text-gray-700', placeholder: 'https://medium.com/@username' },
    { id: 'devto', name: 'Dev.to', icon: FaDev, color: 'text-gray-800', placeholder: 'https://dev.to/username' },
    { id: 'stackoverflow', name: 'Stack Overflow', icon: FaStackOverflow, color: 'text-orange-600', placeholder: 'https://stackoverflow.com/users/123456/username' },
    { id: 'portfolio', name: 'Portfolio', icon: FaGlobe, color: 'text-green-600', placeholder: 'https://your-portfolio.com' }
  ];

  /**
   * Handle basic field input changes
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    setModalData({ ...modalData, [e.target.name]: e.target.value });
  };

  const socialLinks = modalData.social_links || {};

  /**
   * Add a new social link to the profile
   */
  const addSocialLink = () => {
    if (selectedPlatform && socialUrl && socialUrl.trim()) {
      const platformId = selectedPlatform;
      const updatedLinks = {
        ...socialLinks,
        [platformId]: socialUrl.trim()
      };
      setModalData({
        ...modalData,
        social_links: updatedLinks
      });

      // Reset form
      setSelectedPlatform('');
      setSocialUrl('');
      setShowAddForm(false);
    }
  };

  /**
   * Remove a social link from the profile
   * @param {string} platformId - Platform identifier
   */
  const removeSocialLink = (platformId) => {
    const updatedLinks = { ...socialLinks };
    delete updatedLinks[platformId];
    setModalData({
      ...modalData,
      social_links: updatedLinks
    });
  };

  /**
   * Get platform details by ID
   * @param {string} platformId - Platform identifier
   * @returns {Object} Platform details
   */
  const getPlatformDetails = (platformId) => {
    return platforms.find(p => p.id === platformId) || {
      name: platformId,
      icon: FaLink,
      color: 'text-gray-600'
    };
  };

  /**
   * Save professional information to server
   * Sends PATCH request to update endpoint
   */
  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(route('backend.applicant.profile.update-professional-info', profile.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          experience_years: modalData.experience_years,
          current_job_title: modalData.current_job_title,
          social_links: modalData.social_links
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Professional information updated successfully.',
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
        text: error.message || 'Failed to update professional information.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal title="Edit Professional Information" onClose={onClose} onSave={handleSave} saving={saving}>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-2.5 sm:pb-3 md:pb-4">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <FaBriefcase className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Professional Information</h2>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">Tell us about your career</p>
            </div>
          </div>
        </div>

        {/* Experience & Job Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-6">
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
              Years of Experience
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                <FaChartLine className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400" />
              </div>
              <select
                name="experience_years"
                value={modalData.experience_years}
                onChange={handleInputChange}
                className="w-full pl-7 sm:pl-8 md:pl-10 pr-2.5 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-xs sm:text-sm md:text-base"
              >
                <option value="">Select experience</option>
                {[...Array(31).keys()].map(y => (
                  <option key={y} value={y}>
                    {y === 0 ? 'Fresher' : `${y} year${y > 1 ? 's' : ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <FaUserTie className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-gray-400" />
                Current Job Title
              </span>
            </label>
            <input
              type="text"
              name="current_job_title"
              value={modalData.current_job_title}
              onChange={handleInputChange}
              className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm md:text-base"
              placeholder="e.g., Software Engineer"
            />
          </div>
        </div>

        {/* Social Links Section */}
        <div>
          <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
            <span className="flex items-center gap-1.5 sm:gap-2">
              <FaLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-gray-400" />
              Social Links
            </span>
          </label>

          {/* Existing Social Links */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 md:mb-4">
              {Object.entries(socialLinks).map(([platformId, url]) => {
                const platform = getPlatformDetails(platformId);
                const Icon = platform.icon;
                return (
                  <div key={platformId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-1.5 sm:p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200 gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 w-full sm:w-auto">
                      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 ${platform.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">{platform.name}</p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                        >
                          {url}
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => removeSocialLink(platformId)}
                      className="p-1 sm:p-1.5 md:p-2 text-gray-400 hover:text-red-600 transition-colors self-end sm:self-center"
                      aria-label="Remove social link"
                    >
                      <FaTrash className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Social Link Button / Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 sm:py-2.5 md:py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base"
            >
              <FaPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Add Social Link
            </button>
          ) : (
            <div className="border border-gray-200 rounded-xl p-2.5 sm:p-3 md:p-4 bg-gray-50">
              <div className="space-y-2.5 sm:space-y-3">
                {/* Platform Selection */}
                <div>
                  <label className="block text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-700 mb-0.5 sm:mb-1">
                    Select Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-base"
                  >
                    <option value="">Choose a platform</option>
                    {platforms.map(platform => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* URL Input */}
                {selectedPlatform && (
                  <div>
                    <label className="block text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-700 mb-0.5 sm:mb-1">
                      Profile URL
                    </label>
                    <input
                      type="url"
                      value={socialUrl}
                      onChange={(e) => setSocialUrl(e.target.value)}
                      placeholder={platforms.find(p => p.id === selectedPlatform)?.placeholder}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-base"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                  <button
                    onClick={addSocialLink}
                    disabled={!selectedPlatform || !socialUrl}
                    className="flex-1 px-3 py-2 sm:py-2.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm md:text-base"
                  >
                    Add Link
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedPlatform('');
                      setSocialUrl('');
                    }}
                    className="px-3 py-2 sm:py-2.5 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-xs sm:text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Platform Info */}
          <div className="mt-2 sm:mt-3 p-1.5 sm:p-2 md:p-3 bg-gray-50 rounded-lg">
            <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500 mb-1 sm:mb-1.5 md:mb-2">Popular platforms you can add:</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
              {platforms.slice(0, 6).map(platform => {
                const Icon = platform.icon;
                return (
                  <div key={platform.id} className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] md:text-xs text-gray-600">
                    <Icon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 ${platform.color}`} /> {platform.name}
                  </div>
                );
              })}
            </div>
            <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400 mt-1 sm:mt-1.5 md:mt-2">
              Add your professional social media profiles to showcase your online presence.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProfessionalInfoModal;