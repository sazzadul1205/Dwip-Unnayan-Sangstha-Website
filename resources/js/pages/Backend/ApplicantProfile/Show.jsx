// pages/Backend/ApplicantProfile/Show.jsx

// React
import { useState } from 'react';

// Inertia
import { Head, Link, router, usePage } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Icons
import { FaCakeCandles } from "react-icons/fa6";
import {
  FaUser,
  FaEnvelope,
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
  FaPlus,
  FaFacebook,
  FaYoutube,
  FaMedium,
  FaDev,
  FaStackOverflow,
  FaChartLine,
  FaUserTie,
  FaLink,
  FaCheckCircle,
  FaClock,
  FaGraduationCap,
  FaBuilding,
  FaCalendarDay,
  FaInfoCircle,
  FaArrowLeft,
} from 'react-icons/fa';
import {
  MdOutlineBloodtype,
  MdSchool,
  MdPending,
  MdVerified,
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

export default function Show({ profile, canEdit = false, canDelete = false }) {
  const authUser = usePage().props?.auth?.user || null;
  const isOauthUser = !!authUser?.google_id;

  // Check if current user is the profile owner
  const isOwner = authUser?.id === profile?.user_id;

  // Check if user has admin role (super-admin or admin)
  const userRoles = authUser?.roles?.map(role => role.slug) || [];
  const isSuperAdmin = userRoles.includes('super-admin');
  const isAdmin = userRoles.includes('admin');
  const hasAdminRole = isSuperAdmin || isAdmin;

  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const baseProfilePath = '/backend/applicant/profile';
  const [activeModal, setActiveModal] = useState(null);
  const isDeleted = profile?.deleted_at !== null;

  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleDelete = () => {
    if (!isOwner && !canDelete) {
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

            // If admin deleted someone else's profile, redirect back to list
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

  const handleRestore = () => {
    if (!isOwner && !canDelete) {
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

            // If admin restored someone else's profile, redirect back to list
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

  const handleGoBack = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to profiles list
      router.visit(route('backend.applicant-profile.index'));
    }
  };

  if (!profile) {
    return (
      <AuthenticatedLayout>
        <Head title="My Profile" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUserCircle className="text-gray-400 text-5xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Profile Found</h2>
            <p className="text-gray-600 mb-6">You haven't created a profile yet. Create one to apply for jobs.</p>
            <Link
              href={route('backend.applicant.profile.create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FaPlusCircle size={18} />
              Create Profile
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const age = calculateAge(profile?.birth_date);
  const stats = profile?.stats || {};

  // Determine if user has admin permissions (for delete/restore actions)
  const hasAdminAccess = canDelete || !isOwner;

  return (
    <AuthenticatedLayout>
      <Head title={`${profile.first_name} ${profile.last_name} - Profile`} />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header with Back Button for Admin */}
          <div className="mb-6">
            {/* Back button for admin view */}
            {!isOwner && hasAdminRole && (
              <div className="mb-4">
                <button
                  onClick={handleGoBack}
                  className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
                >
                  <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" size={16} />
                  Back to Profiles
                </button>
              </div>
            )}

            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isOwner ? 'My Profile' : `${profile.first_name}'s Profile`}
                </h1>
                {!isOwner && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <FaInfoCircle size={12} />
                    Viewing profile as {hasAdminRole ? (isSuperAdmin ? 'Super Admin' : 'Admin') : 'administrator'}
                  </p>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                {/* Change Password - Only show for profile owner */}
                {!isDeleted && !isOauthUser && isOwner && (
                  <button
                    onClick={() => openModal('change-password')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    <FaUser size={16} />
                    Change Password
                  </button>
                )}

                {/* Restore/Delete buttons */}
                {isDeleted ? (
                  <button
                    onClick={handleRestore}
                    disabled={restoring}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {restoring ? <FaSpinner className="animate-spin" size={16} /> : <FaTrashRestore size={16} />}
                    Restore Profile
                  </button>
                ) : (
                  <>
                    {/* Applications - Only show for profile owner */}
                    {isOwner && (
                      <Link
                        href={route('backend.apply.index')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        <FaFileAlt size={16} />
                        My Applications ({stats.total_applications || 0})
                      </Link>
                    )}

                    {/* Delete button - Show for owner or admins */}
                    {(isOwner || hasAdminAccess) && (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting ? <FaSpinner className="animate-spin" size={16} /> : <FaTrash size={16} />}
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
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
              <div className="flex items-center">
                <FaInfoCircle className="h-5 w-5 text-blue-400 mr-3" />
                <p className="text-sm text-blue-700">
                  You are viewing <span className="font-semibold">{profile.first_name}'s</span> profile. Edit buttons are disabled as this is not your profile.
                </p>
              </div>
            </div>
          )}

          {/* Deleted Banner */}
          {isDeleted && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-center">
                <FaExclamationTriangle className="h-5 w-5 text-yellow-400 mr-3" />
                <p className="text-sm text-yellow-700">
                  This profile has been deleted. {isOwner ? 'You can restore it to continue using your profile.' : 'Only administrators can restore it.'}
                </p>
              </div>
            </div>
          )}

          {/* Main Profile Card */}
          <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${isDeleted ? 'opacity-75' : ''}`}>

            {/* Banner */}
            <div className={`h-32 ${isDeleted ? 'bg-gray-400' : 'bg-linear-to-r from-blue-600 to-blue-700'}`} />

            {/* Content */}
            <div className="px-6 pb-6">

              {/* Profile Photo */}
              <div className="flex justify-center -mt-16 mb-4">
                {profile.photo_url && !isDeleted && !imgError ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.full_name}
                    onError={() => setImgError(true)}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
                    <FaUser className="text-gray-400 text-5xl" />
                  </div>
                )}
              </div>

              {/* Name & Title */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                {profile.current_job_title && (
                  <p className="text-gray-600 text-sm mt-1">{profile.current_job_title}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">Job Seeker</p>
                {isDeleted && (
                  <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                    Deleted
                  </span>
                )}
                {!isOwner && !isDeleted && (
                  <span className="inline-block mt-2 ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                    View Only
                  </span>
                )}
              </div>

              {/* Basic Information */}
              <div className="border-t pt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaUser className="text-blue-600" />
                    Basic Information
                  </h3>
                  {!isDeleted && isOwner && (
                    <button
                      onClick={() => openModal('basic')}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                    >
                      <FaEdit size={14} /> Edit
                    </button>
                  )}
                  {!isDeleted && !isOwner && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-1 text-sm cursor-not-allowed"
                      >
                        <FaEdit size={14} /> Edit
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only edit your own profile
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MdEmail className="text-blue-600" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900 break-all">{profile?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FaPhone className="text-blue-600" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{profile.phone || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FaBirthdayCake className="text-blue-600" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Birth Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {profile.birth_date ? `${formatDate(profile.birth_date)}${age ? ` (${age} years)` : ''}` : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FaVenusMars className="text-blue-600" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Gender</p>
                      <p className="text-sm font-medium text-gray-900">{profile.gender || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MdOutlineBloodtype className="text-red-500" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Blood Type</p>
                      <p className="text-sm font-medium text-gray-900">{profile.blood_type || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FaMapMarkerAlt className="text-blue-600" size={18} />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900">{profile.address || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="border-t pt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaBriefcase className="text-purple-600" />
                    Professional Information
                  </h3>
                  {!isDeleted && isOwner && (
                    <button
                      onClick={() => openModal('professional')}
                      className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm"
                    >
                      <FaEdit size={14} /> Edit
                    </button>
                  )}
                  {!isDeleted && !isOwner && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-1 text-sm cursor-not-allowed"
                      >
                        <FaEdit size={14} /> Edit
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only edit your own profile
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(!profile.experience_years && profile.experience_years !== 0) && !profile.current_job_title && (!profile.social_links || Object.keys(profile.social_links).length === 0) ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FaBriefcase className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No professional information added yet</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FaChartLine className="text-purple-600" size={18} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Years of Experience</p>
                          <p className="text-sm font-medium text-gray-900">
                            {profile.experience_years !== null && profile.experience_years !== undefined
                              ? (profile.experience_years === 0 ? 'Fresher' : `${profile.experience_years} year${profile.experience_years > 1 ? 's' : ''}`)
                              : 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FaUserTie className="text-purple-600" size={18} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Current Job Title</p>
                          <p className="text-sm font-medium text-gray-900">{profile.current_job_title || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <FaLink className="h-4 w-4 text-gray-400" />
                          Social Links
                        </p>
                        <div className="flex flex-wrap gap-3">
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
                                className={`flex items-center gap-2 px-3 py-2 ${config.bg} rounded-lg hover:shadow-md transition-all group`}
                              >
                                <Icon className={`${config.color} transition-transform group-hover:scale-110`} size={16} />
                                <span className="text-sm text-gray-700 capitalize font-medium">{config.name}</span>
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
              <div className="border-t pt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaBriefcase className="text-orange-600" />
                    Work Experience ({profile.job_histories?.length || 0})
                  </h3>
                  {!isDeleted && isOwner && (
                    <button
                      onClick={() => openModal('work')}
                      className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm"
                    >
                      <FaEdit size={14} /> Edit
                    </button>
                  )}
                  {!isDeleted && !isOwner && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-1 text-sm cursor-not-allowed"
                      >
                        <FaEdit size={14} /> Edit
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only edit your own profile
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {profile.job_histories && profile.job_histories.length > 0 ? (
                  <div className="space-y-4">
                    {profile.job_histories.map((job, index) => (
                      <div key={job.id || index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{job.position}</h4>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <FaBuilding className="h-3 w-3 text-gray-400" />
                              {job.company_name}
                            </p>
                          </div>
                          {job.is_current && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                              <FaStar size={12} /> Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                          <FaCalendarAlt size={12} />
                          {job.starting_year} - {job.is_current ? 'Present' : (job.ending_year || 'Present')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FaBriefcase className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No work experience added yet</p>
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="border-t pt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MdSchool className="text-green-600" />
                    Education ({profile.education_histories?.length || 0})
                  </h3>
                  {!isDeleted && isOwner && (
                    <button
                      onClick={() => openModal('education')}
                      className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                    >
                      <FaEdit size={14} /> Edit
                    </button>
                  )}
                  {!isDeleted && !isOwner && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-1 text-sm cursor-not-allowed"
                      >
                        <FaEdit size={14} /> Edit
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only edit your own profile
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {profile.education_histories && profile.education_histories.length > 0 ? (
                  <div className="space-y-4">
                    {profile.education_histories.map((edu, index) => (
                      <div key={edu.id || index} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                        <p className="text-sm text-gray-600 mt-1">{edu.institution_name}</p>
                        <p className="text-xs text-gray-500 mt-2">Passing Year: {edu.passing_year}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <MdSchool className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No education added yet</p>
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="border-t pt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaTrophy className="text-yellow-600" />
                    Achievements & Certifications ({profile.achievements?.length || 0})
                  </h3>
                  {!isDeleted && isOwner && (
                    <button
                      onClick={() => openModal('achievements')}
                      className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1 text-sm"
                    >
                      <FaEdit size={14} /> Edit
                    </button>
                  )}
                  {!isDeleted && !isOwner && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-1 text-sm cursor-not-allowed"
                      >
                        <FaEdit size={14} /> Edit
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only edit your own profile
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {profile.achievements && profile.achievements.length > 0 ? (
                  <div className="space-y-4">
                    {profile.achievements.map((achievement, index) => (
                      <div key={achievement.id || index} className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <FaTrophy className="text-yellow-600" size={16} />
                          {achievement.achievement_name}
                        </h4>
                        {achievement.achievement_details && (
                          <p className="text-sm text-gray-600 mt-2 ml-6">{achievement.achievement_details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FaTrophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No achievements added yet</p>
                  </div>
                )}
              </div>

              {/* CV Section */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaFileAlt className="text-red-600" />
                    CV / Resume ({profile.cvs?.length || 0})
                  </h3>
                  {!isDeleted && isOwner && (
                    <button
                      onClick={() => openModal('cv')}
                      className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                    >
                      <FaEdit size={14} /> Manage CVs
                    </button>
                  )}
                  {!isDeleted && !isOwner && (
                    <div className="relative group">
                      <button
                        disabled
                        className="text-gray-400 flex items-center gap-1 text-sm cursor-not-allowed"
                      >
                        <FaEdit size={14} /> Manage CVs
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                          You can only manage your own CVs
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {profile.cvs && profile.cvs.length > 0 ? (
                  <div className="space-y-3">
                    {profile.cvs.map((cv) => (
                      <div key={cv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <FaFilePdf className="text-red-500" size={24} />
                          <div>
                            <p className="font-medium text-gray-900">{cv.original_name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                              <span>Uploaded: {new Date(cv.created_at).toLocaleDateString()}</span>
                              {cv.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-orange-600">
                                  <MdPending size={12} /> Pending
                                </span>
                              )}
                              {cv.is_primary && (
                                <span className="inline-flex items-center gap-1 text-yellow-600">
                                  <FaStar size={12} /> Primary
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <a
                          href={cv.cv_url || `/storage/${cv.cv_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
                        >
                          View CV
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FaFilePdf className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No CV uploaded yet</p>
                  </div>
                )}
              </div>

              {/* Member Since */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaIdCard className="text-blue-600" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Member Since</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals - Only render if owner */}
      {isOwner && (
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