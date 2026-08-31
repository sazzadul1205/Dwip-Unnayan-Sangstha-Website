// pages/Backend/ApplicantProfile/Show.jsx

// React
import { useState } from 'react';

// Inertia
import { Head, Link, router } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';

// Icons
import {
  FaUser,
  FaPhone,
  FaEdit,
  FaTrash,
  FaTrashRestore,
  FaFilePdf,
  FaUserCircle,
  FaPlusCircle,
  FaSpinner,
  FaBirthdayCake,
  FaIdCard,
  FaExclamationTriangle,
  FaFileAlt,
  FaBriefcase,
  FaTrophy,
  FaMapMarkerAlt,
  FaVenusMars,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
  FaCalendarAlt,
  FaStar,
  FaFacebook,
  FaYoutube,
  FaMedium,
  FaDev,
  FaStackOverflow,
  FaChartLine,
  FaUserTie,
  FaLink,
  FaBuilding,
  FaInfoCircle,
  FaArrowLeft,
  FaShieldAlt,
} from 'react-icons/fa';
import {
  MdOutlineBloodtype,
  MdSchool,
  MdPending,
  MdEmail
} from 'react-icons/md';

// SweetAlert2
import Swal from 'sweetalert2';

// Modals
import CVModal from './Modals/CVModal';
import EducationModal from './Modals/EducationModal';
import BasicInfoModal from './Modals/BasicInfoModal';
import AchievementsModal from './Modals/AchievementsModal';
import WorkExperienceModal from './Modals/WorkExperienceModal';
import ChangePasswordModal from './Modals/ChangePasswordModal';
import ProfessionalInfoModal from './Modals/ProfessionalInfoModal';

export default function Show({ profile }) {
  // Use centralized auth hook
  const {
    user: authUser,
    hasAnyPermission,
    hasRole,
  } = useAuth();

  // Check if user is OAuth user (Google login)
  const isOauthUser = !!authUser?.google_id;

  // Check permissions using the auth hook
  const isAdmin = hasRole('admin');
  const isSuperAdmin = hasRole('super-admin');
  const canViewAllProfiles = hasAnyPermission(['applicant-profiles.view', 'applicant-profiles.manage']);
  const canEditAnyProfile = hasAnyPermission(['applicant-profiles.update', 'applicant-profiles.manage']);
  const canDeleteAnyProfile = hasAnyPermission(['applicant-profiles.destroy', 'applicant-profiles.manage']);

  // Check if current user is the profile owner
  const isOwner = authUser?.id === profile?.user_id;

  // Check if user has admin role for viewing/editing other profiles
  const hasAdminRole = isSuperAdmin || isAdmin || canViewAllProfiles || canEditAnyProfile;

  // State
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  // Base path for profile images
  const baseProfilePath = '/backend/applicant/profile';
  const profileImageUrl = profile?.photo_url
    || (profile?.photo_path ? `/storage/${profile.photo_path}` : null);
  const hasProfileImage = !!profileImageUrl && !photoError;
  const [activeModal, setActiveModal] = useState(null);
  const isDeleted = profile?.deleted_at !== null;

  // If user doesn't have permission to view this profile and isn't the owner, show access denied
  if (!isOwner && !hasAdminRole) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaShieldAlt className="text-red-500 text-3xl sm:text-4xl" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm sm:text-base text-gray-600">You don't have permission to view this profile.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Function to format date
  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to calculate age
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Open modal
  const openModal = (modalType) => {
    if (!isOwner) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You can only edit your own profile.',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (isDeleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Edit',
        text: 'Please restore your profile before editing.',
      });
      return;
    }
    setActiveModal(modalType);
  };

  // Close modal
  const closeModal = () => {
    setActiveModal(null);
  };

  // Delete profile Handler
  const handleDelete = () => {
    if (!isOwner && !canDeleteAnyProfile) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You do not have permission to delete this profile.',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Profile?',
      text: isOwner ? 'Your profile will be soft deleted. You can restore it later.' : 'This profile will be soft deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setDeleting(true);
        try {
          const response = await fetch(`${baseProfilePath}/${profile.id}`, {
            method: 'DELETE',
            headers: {
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json'
            }
          });

          const data = await response.json();

          if (data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: isOwner ? 'Your profile has been deleted.' : 'Profile has been deleted.',
              timer: 2000,
              showConfirmButton: false
            });

            if (!isOwner && hasAdminRole) {
              router.visit(route('backend.applicant-profile.index'));
            } else {
              router.reload();
            }
          } else {
            throw new Error(data.message || 'Failed to delete');
          }
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.message || 'Failed to delete profile.',
          });
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  // Restore profile Handler
  const handleRestore = () => {
    if (!isOwner && !canDeleteAnyProfile) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You do not have permission to restore this profile.',
      });
      return;
    }

    Swal.fire({
      title: 'Restore Profile?',
      text: 'The profile will be restored with all its data.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setRestoring(true);
        try {
          const response = await fetch(`${baseProfilePath}/${profile.user_id}/restore`, {
            method: 'POST',
            headers: {
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json'
            }
          });

          const data = await response.json();

          if (data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: 'Profile has been restored successfully.',
              timer: 1500,
              showConfirmButton: false
            });

            if (!isOwner && hasAdminRole) {
              router.visit(route('backend.applicant-profile.index'));
            } else {
              router.reload();
            }
          } else {
            throw new Error(data.message || 'Failed to restore');
          }
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.message || 'Failed to restore profile.',
          });
        } finally {
          setRestoring(false);
        }
      }
    });
  };

  // Go back 
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.visit(route('backend.applicant-profile.index'));
    }
  };

  // Check if profile exists
  if (!profile) {
    return (
      <AuthenticatedLayout>
        <Head title="My Profile" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaUserCircle className="text-gray-400 text-4xl sm:text-5xl" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Profile Found</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">You haven't created a profile yet. Create one to apply for jobs.</p>
            <Link
              href={route('backend.applicant.profile.create')}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
            >
              <FaPlusCircle size={16} />
              Create Profile
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Calculate age
  const age = calculateAge(profile?.birth_date);

  // Get profile stats
  const stats = profile?.stats || {};

  // Determine if user can edit this profile
  const canEditProfile = isOwner || canEditAnyProfile;

  // Determine if user can delete/restore this profile
  const hasAdminAccess = !isOwner && (canDeleteAnyProfile || hasAdminRole);

  return (
    <AuthenticatedLayout>
      <Head title={`${profile.first_name} ${profile.last_name} - Profile`} />

      <div className="min-h-screen bg-gray-50 py-3 sm:py-4">
        <div className="mx-auto px-3 sm:px-6 lg:px-8">

          {/* Header with Back Button for Admin */}
          <div className="mb-3 sm:mb-4 lg:mb-6">
            {!isOwner && hasAdminRole && (
              <div className="mb-2 sm:mb-3 lg:mb-4">
                <button
                  onClick={handleGoBack}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
                >
                  <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" size={12} />
                  Back to Profiles
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-full sm:w-auto">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 text-center sm:text-left">
                  {isOwner ? 'My Profile' : `${profile.first_name}'s Profile`}
                </h1>
                {!isOwner && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 flex items-center justify-center sm:justify-start gap-1">
                    <FaInfoCircle size={10} />
                    Viewing profile as {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'administrator'}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {!isDeleted && !isOauthUser && isOwner && (
                  <button
                    onClick={() => openModal('change-password')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-xs sm:text-sm lg:text-base"
                  >
                    <FaUser size={14} />
                    Change Password
                  </button>
                )}

                {isDeleted ? (
                  <button
                    onClick={handleRestore}
                    disabled={restoring}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs sm:text-sm lg:text-base"
                  >
                    {restoring ? <FaSpinner className="animate-spin" size={14} /> : <FaTrashRestore size={14} />}
                    Restore Profile
                  </button>
                ) : (
                  <>
                    {isOwner && (
                      <Link
                        href={route('backend.apply.index')}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs sm:text-sm lg:text-base"
                      >
                        <FaFileAlt size={14} />
                        My Applications ({stats.total_applications || 0})
                      </Link>
                    )}

                    {(isOwner || hasAdminAccess) && (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-xs sm:text-sm lg:text-base"
                      >
                        {deleting ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* View-Only Banner */}
          {!isOwner && !isDeleted && (
            <div className="mb-3 sm:mb-4 lg:mb-6 bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <FaInfoCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 sm:mr-3 shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-xs sm:text-sm text-blue-700">
                  You are viewing <span className="font-semibold">{profile.first_name}'s</span> profile. Edit buttons are disabled as this is not your profile.
                </p>
              </div>
            </div>
          )}

          {/* Deleted Banner */}
          {isDeleted && (
            <div className="mb-3 sm:mb-4 lg:mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <FaExclamationTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2 sm:mr-3 shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-xs sm:text-sm text-yellow-700">
                  This profile has been deleted. {isOwner ? 'You can restore it to continue using your profile.' : 'Only administrators can restore it.'}
                </p>
              </div>
            </div>
          )}

          {/* Main Profile Card */}
          <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${isDeleted ? 'opacity-75' : ''}`}>

            {/* Banner */}
            <div className={`h-16 sm:h-20 lg:h-32 ${isDeleted ? 'bg-gray-400' : 'bg-linear-to-r from-blue-600 to-blue-700'}`} />

            {/* Content */}
            <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">

              {/* Profile Photo */}
              <div className="flex justify-center -mt-10 sm:-mt-12 lg:-mt-16 mb-2 sm:mb-3 lg:mb-4">
                {hasProfileImage ? (
                  <img
                    src={profileImageUrl}
                    alt={profile.full_name}
                    className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white"
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full border-4 border-white shadow-lg bg-linear-to-br from-blue-100 to-slate-100 flex items-center justify-center">
                    <FaUserCircle className="text-gray-400 w-12 h-12 sm:w-14 sm:h-14 lg:w-20 lg:h-20" />
                  </div>
                )}
              </div>

              {/* Name & Title */}
              <div className="text-center mb-3 sm:mb-4 lg:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                {profile.current_job_title && (
                  <p className="text-gray-600 text-xs sm:text-sm mt-0.5 sm:mt-1">{profile.current_job_title}</p>
                )}
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Job Seeker</p>
                {isDeleted && (
                  <span className="inline-block mt-1.5 sm:mt-2 px-2 py-0.5 sm:py-1 bg-red-100 text-red-600 text-[10px] sm:text-xs rounded-full">
                    Deleted
                  </span>
                )}
                {!isOwner && !isDeleted && (
                  <span className="inline-block mt-1.5 sm:mt-2 ml-1 sm:ml-2 px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-600 text-[10px] sm:text-xs rounded-full">
                    View Only
                  </span>
                )}
              </div>

              {/* Basic Information */}
              <div className="border-t pt-3 sm:pt-4 lg:pt-6 mb-3 sm:mb-4 lg:mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 lg:mb-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                    <FaUser className="text-blue-600" size={14} />
                    Basic Information
                  </h3>
                  {!isDeleted && canEditProfile && (
                    <button
                      onClick={() => openModal('basic')}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm"
                    >
                      <FaEdit size={12} /> Edit
                    </button>
                  )}
                  {!isDeleted && !canEditProfile && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm cursor-not-allowed"
                      >
                        <FaEdit size={12} /> Edit
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-[10px] sm:text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only edit your own profile
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <MdEmail className="text-blue-600 shrink-0" size={14} />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Email</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 break-all">{profile?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <FaPhone className="text-blue-600 shrink-0" size={14} />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Phone</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{profile.phone || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <FaBirthdayCake className="text-blue-600 shrink-0" size={14} />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Birth Date</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {profile.birth_date ? `${formatDate(profile.birth_date)}${age ? ` (${age} years)` : ''}` : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <FaVenusMars className="text-blue-600 shrink-0" size={14} />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Gender</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{profile.gender || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <MdOutlineBloodtype className="text-red-500 shrink-0" size={14} />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Blood Type</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{profile.blood_type || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <FaMapMarkerAlt className="text-blue-600 shrink-0" size={14} />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Address</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">{profile.address || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="border-t pt-3 sm:pt-4 lg:pt-6 mb-3 sm:mb-4 lg:mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 lg:mb-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                    <FaBriefcase className="text-purple-600" size={14} />
                    Professional Information
                  </h3>
                  {!isDeleted && canEditProfile && (
                    <button
                      onClick={() => openModal('professional')}
                      className="text-purple-600 hover:text-purple-700 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm"
                    >
                      <FaEdit size={12} /> Edit
                    </button>
                  )}
                  {!isDeleted && !canEditProfile && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm cursor-not-allowed"
                      >
                        <FaEdit size={12} /> Edit
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-[10px] sm:text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only edit your own profile
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(!profile.experience_years && profile.experience_years !== 0) && !profile.current_job_title && (!profile.social_links || Object.keys(profile.social_links).length === 0) ? (
                  <div className="text-center py-4 sm:py-6 lg:py-8 bg-gray-50 rounded-lg">
                    <FaBriefcase className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-300 mx-auto mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm lg:text-base text-gray-500">No professional information added yet</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg shrink-0">
                          <FaChartLine className="text-purple-600" size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs text-gray-500">Years of Experience</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {profile.experience_years !== null && profile.experience_years !== undefined
                              ? (profile.experience_years === 0 ? 'Fresher' : `${profile.experience_years} year${profile.experience_years > 1 ? 's' : ''}`)
                              : 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg shrink-0">
                          <FaUserTie className="text-purple-600" size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs text-gray-500">Current Job Title</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{profile.current_job_title || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                      <div className="mt-2 sm:mt-3 lg:mt-4">
                        <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                          <FaLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                          Social Links
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:gap-3">
                          {Object.entries(profile.social_links).map(([platform, url]) => {
                            const platformConfig = {
                              linkedin: { icon: FaLinkedin, color: "text-blue-600", bg: "bg-blue-50", name: "LinkedIn" },
                              github: { icon: FaGithub, color: "text-gray-800", bg: "bg-gray-100", name: "GitHub" },
                              twitter: { icon: FaTwitter, color: "text-sky-500", bg: "bg-sky-50", name: "Twitter" },
                              facebook: { icon: FaFacebook, color: "text-blue-700", bg: "bg-blue-50", name: "Facebook" },
                              youtube: { icon: FaYoutube, color: "text-red-600", bg: "bg-red-50", name: "YouTube" },
                              medium: { icon: FaMedium, color: "text-gray-700", bg: "bg-gray-100", name: "Medium" },
                              devto: { icon: FaDev, color: "text-gray-800", bg: "bg-gray-100", name: "Dev.to" },
                              stackoverflow: { icon: FaStackOverflow, color: "text-orange-600", bg: "bg-orange-50", name: "Stack Overflow" },
                              portfolio: { icon: FaGlobe, color: "text-green-600", bg: "bg-green-50", name: "Portfolio" }
                            };
                            const config = platformConfig[platform] || { icon: FaGlobe, color: "text-gray-600", bg: "bg-gray-50", name: platform };
                            const Icon = config.icon;

                            return (
                              <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 lg:py-2 ${config.bg} rounded-lg hover:shadow-md transition-all group text-[10px] sm:text-xs lg:text-sm`}
                              >
                                <Icon className={`${config.color} transition-transform group-hover:scale-110`} size={12} />
                                <span className="text-gray-700 capitalize font-medium">{config.name}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Work Experience */}
              <div className="border-t pt-3 sm:pt-4 lg:pt-6 mb-3 sm:mb-4 lg:mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 lg:mb-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                    <FaBriefcase className="text-orange-600" size={14} />
                    Work Experience ({profile.job_histories?.length || 0})
                  </h3>
                  {!isDeleted && canEditProfile && (
                    <button
                      onClick={() => openModal('work')}
                      className="text-orange-600 hover:text-orange-700 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm"
                    >
                      <FaEdit size={12} /> Edit
                    </button>
                  )}
                  {!isDeleted && !canEditProfile && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm cursor-not-allowed"
                      >
                        <FaEdit size={12} /> Edit
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-[10px] sm:text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only edit your own profile
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {profile.job_histories && profile.job_histories.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {profile.job_histories.map((job, index) => (
                      <div key={job.id || index} className="p-2.5 sm:p-3 lg:p-4 bg-gray-50 rounded-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <div>
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900">{job.position}</h4>
                            <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                              <FaBuilding className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 shrink-0" />
                              {job.company_name}
                            </p>
                          </div>
                          {job.is_current && (
                            <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1">
                              <FaStar size={10} /> Current
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                          <FaCalendarAlt size={10} />
                          {job.starting_year} - {job.is_current ? 'Present' : (job.ending_year || 'Present')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 lg:py-8 bg-gray-50 rounded-lg">
                    <FaBriefcase className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-300 mx-auto mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm lg:text-base text-gray-500">No work experience added yet</p>
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="border-t pt-3 sm:pt-4 lg:pt-6 mb-3 sm:mb-4 lg:mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 lg:mb-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                    <MdSchool className="text-green-600" size={14} />
                    Education ({profile.education_histories?.length || 0})
                  </h3>
                  {!isDeleted && canEditProfile && (
                    <button
                      onClick={() => openModal('education')}
                      className="text-green-600 hover:text-green-700 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm"
                    >
                      <FaEdit size={12} /> Edit
                    </button>
                  )}
                  {!isDeleted && !canEditProfile && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm cursor-not-allowed"
                      >
                        <FaEdit size={12} /> Edit
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-[10px] sm:text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only edit your own profile
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {profile.education_histories && profile.education_histories.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {profile.education_histories.map((edu, index) => (
                      <div key={edu.id || index} className="p-2.5 sm:p-3 lg:p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900">{edu.degree}</h4>
                        <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 mt-0.5 sm:mt-1">{edu.institution_name}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">Passing Year: {edu.passing_year}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 lg:py-8 bg-gray-50 rounded-lg">
                    <MdSchool className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-300 mx-auto mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm lg:text-base text-gray-500">No education added yet</p>
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="border-t pt-3 sm:pt-4 lg:pt-6 mb-3 sm:mb-4 lg:mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 lg:mb-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                    <FaTrophy className="text-yellow-600" size={14} />
                    Achievements & Certifications ({profile.achievements?.length || 0})
                  </h3>
                  {!isDeleted && canEditProfile && (
                    <button
                      onClick={() => openModal('achievements')}
                      className="text-yellow-600 hover:text-yellow-700 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm"
                    >
                      <FaEdit size={12} /> Edit
                    </button>
                  )}
                  {!isDeleted && !canEditProfile && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm cursor-not-allowed"
                      >
                        <FaEdit size={12} /> Edit
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-[10px] sm:text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only edit your own profile
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {profile.achievements && profile.achievements.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {profile.achievements.map((achievement, index) => (
                      <div key={achievement.id || index} className="p-2.5 sm:p-3 lg:p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                          <FaTrophy className="text-yellow-600" size={14} />
                          {achievement.achievement_name}
                        </h4>
                        {achievement.achievement_details && (
                          <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 mt-1 sm:mt-2 ml-4 sm:ml-6">{achievement.achievement_details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 lg:py-8 bg-gray-50 rounded-lg">
                    <FaTrophy className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-300 mx-auto mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm lg:text-base text-gray-500">No achievements added yet</p>
                  </div>
                )}
              </div>

              {/* CV Section */}
              <div className="border-t pt-3 sm:pt-4 lg:pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 lg:mb-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                    <FaFileAlt className="text-red-600" size={14} />
                    CV / Resume ({profile.cvs?.length || 0})
                  </h3>
                  {!isDeleted && canEditProfile && (
                    <button
                      onClick={() => openModal('cv')}
                      className="text-red-600 hover:text-red-700 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm"
                    >
                      <FaEdit size={12} /> Manage CVs
                    </button>
                  )}
                  {!isDeleted && !canEditProfile && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm cursor-not-allowed"
                      >
                        <FaEdit size={12} /> Manage CVs
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-[10px] sm:text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only manage your own CVs
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {profile.cvs && profile.cvs.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {profile.cvs.map((cv) => (
                      <div key={cv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 sm:p-3 lg:p-4 bg-gray-50 rounded-lg gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <FaFilePdf className="text-red-500 shrink-0" size={18} />
                          <div className="min-w-0">
                            <p className="text-sm sm:text-base font-medium text-gray-900 break-all">{cv.original_name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span>Uploaded: {new Date(cv.created_at).toLocaleDateString()}</span>
                              {cv.status === 'pending' && (
                                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-orange-600">
                                  <MdPending size={10} /> Pending
                                </span>
                              )}
                              {cv.is_primary && (
                                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-yellow-600">
                                  <FaStar size={10} /> Primary
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <a
                          href={cv.cv_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm transition w-full sm:w-auto text-center"
                        >
                          View CV
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 lg:py-8 bg-gray-50 rounded-lg">
                    <FaFilePdf className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-300 mx-auto mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm lg:text-base text-gray-500">No CV uploaded yet</p>
                  </div>
                )}
              </div>

              {/* Member Since */}
              <div className="border-t pt-3 sm:pt-4 lg:pt-6 mt-3 sm:mt-4 lg:mt-6">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <FaIdCard className="text-blue-600 shrink-0" size={14} />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500">Member Since</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals - Only render if user can edit the profile */}
      {canEditProfile && (
        <>
          <BasicInfoModal
            isOpen={activeModal === 'basic'}
            onClose={closeModal}
            profile={profile}
          />

          <ProfessionalInfoModal
            isOpen={activeModal === 'professional'}
            onClose={closeModal}
            profile={profile}
          />

          <WorkExperienceModal
            isOpen={activeModal === 'work'}
            onClose={closeModal}
            profile={profile}
          />

          <EducationModal
            isOpen={activeModal === 'education'}
            onClose={closeModal}
            profile={profile}
          />

          <AchievementsModal
            isOpen={activeModal === 'achievements'}
            onClose={closeModal}
            profile={profile}
          />

          <CVModal
            isOpen={activeModal === 'cv'}
            onClose={closeModal}
            profile={profile}
          />

          <ChangePasswordModal
            isOpen={activeModal === 'change-password'}
            onClose={closeModal}
            profile={profile}
          />
        </>
      )}
    </AuthenticatedLayout>
  );
}