// resources/js/Pages/Backend/ApplicantProfile/Modals/BasicInfoModal.jsx

// React
import { useState, useRef, useEffect } from 'react';

// Inertia
import { router } from '@inertiajs/react';

// SweetAlert
import Swal from 'sweetalert2';

// Icons
import {
  FaPhone,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaHeartbeat,
  FaIdCard,
  FaBirthdayCake,
  FaGlobe,
  FaVenusMars,
  FaTrash,
  FaCloudUploadAlt,
  FaImage,
} from 'react-icons/fa';
import { MdOutlineBloodtype } from 'react-icons/md';

// Components
import Modal from './Modal';

const BasicInfoModal = ({ isOpen, onClose, profile }) => {
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];

  const normalizeDate = (value) => {
    if (!value) return '';
    if (typeof value === 'string') {
      if (value.length >= 10) return value.slice(0, 10);
      return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  };

  const [modalData, setModalData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    birth_date: normalizeDate(profile?.birth_date),
    gender: profile?.gender || '',
    blood_type: profile?.blood_type || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  });

  // Reset modal data when opened
  useEffect(() => {
    if (!isOpen) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setModalData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      birth_date: normalizeDate(profile?.birth_date),
      gender: profile?.gender || '',
      blood_type: profile?.blood_type || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });

    setPhotoPreview(null);
    setPhotoFile(null);
    setRemovePhoto(false);
    setImageError(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

  }, [isOpen, profile]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetPhoto(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetPhoto(file);
    }
    e.target.value = '';
  };

  const validateAndSetPhoto = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please upload a valid image file (JPG, PNG, or GIF)',
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'File size must be less than 2MB',
      });
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const newPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = newPreviewUrl;
    setPhotoPreview(newPreviewUrl);
    setPhotoFile(file);
    setRemovePhoto(false);
    setImageError(false);
  };

  const handleDeletePhoto = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPhotoPreview(null);
    setPhotoFile(null);
    setRemovePhoto(true);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    setModalData({ ...modalData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);

    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('first_name', modalData.first_name);
    formData.append('last_name', modalData.last_name);
    if (modalData.birth_date) formData.append('birth_date', modalData.birth_date);
    if (modalData.gender) formData.append('gender', modalData.gender);
    if (modalData.blood_type) formData.append('blood_type', modalData.blood_type);
    if (modalData.phone) formData.append('phone', modalData.phone);
    if (modalData.address) formData.append('address', modalData.address);
    if (removePhoto) formData.append('remove_photo', '1');
    if (photoFile) formData.append('photo', photoFile);

    try {
      const response = await fetch(route('backend.applicant.profile.update-basic-info', profile.id), {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Basic information updated successfully.',
          timer: 1500,
          showConfirmButton: false
        });

        onClose();
        router.reload();

        setTimeout(() => {
          router.reload();
        }, 300);

      } else {
        throw new Error(data.message || 'Failed to update');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Failed to update basic information.',
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [photoPreview, removePhoto, profile?.photo_path, profile?.photo_url]);

  if (!isOpen) return null;

  const getImageSrc = () => {
    if (photoPreview) return photoPreview;
    if (removePhoto) return null;
    if (profile?.photo_url) return profile.photo_url;
    if (profile?.photo_path) return `/storage/${profile.photo_path}`;
    return null;
  };

  const imageSrc = getImageSrc();
  const hasImage = imageSrc !== null && !imageError;

  return (
    <Modal title="Edit Basic Information" onClose={onClose} onSave={handleSave} saving={saving}>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Left Column - Profile Photo */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 md:mb-3">
                Profile Photo
              </label>

              <div
                className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer ${dragActive
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleFileChange}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Upload profile photo"
                />

                {hasImage ? (
                  <img
                    key={imageSrc}
                    src={imageSrc}
                    alt={profile?.full_name || 'Profile'}
                    className="w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover rounded-2xl shadow-lg"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-40 sm:h-48 md:h-56 lg:h-64 flex flex-col items-center justify-center text-center p-3 sm:p-4 bg-linear-to-br from-blue-50 to-slate-100 rounded-2xl">
                    <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
                      <div className="p-2.5 sm:p-3 md:p-4 bg-blue-100 rounded-full">
                        <FaCloudUploadAlt className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-gray-700 font-medium mb-1 sm:mb-2">Drop your photo here</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 mb-1.5 sm:mb-2 md:mb-3">or click to browse</p>
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1 bg-gray-200 rounded-full">
                      <FaImage className="h-2 w-2 sm:h-3 sm:w-3 text-gray-500" />
                      <span className="text-[8px] sm:text-[10px] md:text-xs text-gray-600">JPG, PNG, GIF up to 2MB</span>
                    </div>
                  </div>
                )}

                {hasImage && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition flex items-end justify-center pb-3 sm:pb-4 md:pb-6 gap-1.5 sm:gap-2 md:gap-3 rounded-2xl">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 bg-white text-gray-800 rounded-xl hover:bg-gray-100 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg"
                    >
                      <FaImage className="h-3 w-3 sm:h-4 sm:w-4" /> Change
                    </button>
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      className="px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg"
                    >
                      <FaTrash size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400 text-center mt-1.5 sm:mt-2 md:mt-3">
                Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-5">
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <FaIdCard className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-500" />
                    First Name
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={modalData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-xs sm:text-sm md:text-base"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  Last Name
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={modalData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-xs sm:text-sm md:text-base"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            {/* Phone & Birth Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-5">
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <FaPhone className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-500" />
                    Phone Number
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                    <FaPhone className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={modalData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-7 sm:pl-8 md:pl-10 pr-2.5 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm md:text-base"
                    placeholder="+880 1XXX XXXXXX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <FaBirthdayCake className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-500" />
                    Birth Date
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                    <FaCalendarAlt className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="birth_date"
                    value={modalData.birth_date}
                    onChange={handleInputChange}
                    className="w-full pl-7 sm:pl-8 md:pl-10 pr-2.5 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Gender & Blood Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-5">
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <FaVenusMars className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-500" />
                    Gender
                  </span>
                </label>
                <select
                  name="gender"
                  value={modalData.gender}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-xs sm:text-sm md:text-base"
                >
                  <option value="">Select gender</option>
                  {genders.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <MdOutlineBloodtype className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-red-500" />
                    Blood Type
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                    <FaHeartbeat className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-400" />
                  </div>
                  <select
                    name="blood_type"
                    value={modalData.blood_type}
                    onChange={handleInputChange}
                    className="w-full pl-7 sm:pl-8 md:pl-10 pr-2.5 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-xs sm:text-sm md:text-base"
                  >
                    <option value="">Select blood type</option>
                    {bloodTypes.map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-0.5 sm:mb-1 md:mb-2">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <FaMapMarkerAlt className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-500" />
                  Address
                </span>
              </label>
              <div className="relative">
                <div className="absolute top-2.5 sm:top-3 md:top-4 left-0 pl-2.5 sm:pl-3 md:pl-4 pointer-events-none">
                  <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <textarea
                  name="address"
                  value={modalData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full pl-7 sm:pl-8 md:pl-10 pr-2.5 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-xs sm:text-sm md:text-base"
                  placeholder="Your full address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-2.5 sm:p-3 md:p-5 border border-blue-100">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="p-0.5 sm:p-1 md:p-1.5 bg-blue-100 rounded-full">
                <FaGlobe className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-blue-600" />
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-700">
                <span className="font-semibold">Note:</span> First name, last name, and phone are required fields.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BasicInfoModal;