// pages/auth/Steps/BasicInfo.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FaUser, FaCloudUploadAlt, FaCalendarAlt, FaPhone, FaVenusMars,
  FaMapMarkerAlt, FaIdCard, FaBirthdayCake, FaHeartbeat, FaImage,
} from 'react-icons/fa';
import { MdOutlineBloodtype } from 'react-icons/md';
import Swal from 'sweetalert2';

const BasicInfo = ({ data, setData }) => {
  const genders = ['Male', 'Female', 'Other'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const dateInputRef = useRef(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (data.photo && data.photo instanceof File) {
      const url = URL.createObjectURL(data.photo);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (data.photo_url) setPreviewUrl(data.photo_url);
    else if (data.photo_path) setPreviewUrl(`/storage/${data.photo_path}`);
    else setPreviewUrl(null);
  }, [data.photo, data.photo_path, data.photo_url]);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d+\-()\s]/g, '').slice(0, 20);
    setData('phone', value);
  };

  const validateAndSetPhoto = useCallback((file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      Swal.fire({ icon: 'error', title: 'Invalid file type', text: 'JPG, PNG or GIF only.', timer: 2500, showConfirmButton: false });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'File too large', text: 'Max size is 2MB.', timer: 2500, showConfirmButton: false });
      return;
    }
    setData('photo', file);
    setData('photo_path', null);
    setData('photo_url', null);
  }, [setData]);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current += 1; if (e.dataTransfer?.items?.length) setDragActive(true); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current -= 1; if (dragCounter.current <= 0) { dragCounter.current = 0; setDragActive(false); } };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current = 0; setDragActive(false); const file = e.dataTransfer?.files?.[0]; if (file) validateAndSetPhoto(file); };

  const handleDeletePhoto = (e) => {
    e.stopPropagation();
    Swal.fire({ title: 'Remove photo?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Remove', confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', reverseButtons: true })
      .then((r) => {
        if (r.isConfirmed) {
          setData('photo', null); setData('photo_path', null); setData('photo_url', null);
          setPreviewUrl(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      });
  };

  const openDatePicker = (e) => {
    const el = e.currentTarget;
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); } catch { /* ignore */ }
    }
  };

  const inputCls = "w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400";
  const labelCls = "flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2 bg-blue-50 rounded-lg">
          <FaUser className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">Tell us about you</h2>
          <p className="text-xs text-gray-500">Fields marked <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      {/* Photo row */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex items-center gap-4 p-3 rounded-xl border-2 border-dashed transition-colors duration-150 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50/50'
          }`}
      >
        {dragActive && (
          <div className="absolute inset-0 z-10 rounded-xl bg-blue-500/5 border border-blue-400 flex items-center justify-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-blue-200 shadow-sm">
              <FaCloudUploadAlt className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Drop image to upload</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={openFilePicker}
          aria-label="Choose profile photo"
          className="group relative shrink-0 h-14 w-14 rounded-full overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
        >
          {previewUrl ? <img src={previewUrl} alt="" className="h-full w-full object-cover" /> : <FaUser className="h-5 w-5 text-gray-300" />}
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
            <FaCloudUploadAlt className="h-4 w-4 text-white" />
          </span>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 inline-flex items-center gap-1.5">
            <FaImage className="h-3 w-3 text-gray-400" /> Profile photo
          </p>
          <p className="text-xs text-gray-500">
            Click the image or drag & drop here ·{' '}
            <button type="button" onClick={openFilePicker} className="text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline font-medium">
              browse
            </button>{' '}
            · JPG, PNG, GIF · max 2MB
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/gif" onChange={(e) => e.target.files?.[0] && validateAndSetPhoto(e.target.files[0])} className="hidden" />
          {previewUrl && (
            <button type="button" onClick={handleDeletePhoto} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition">
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            <FaIdCard className="h-3 w-3 text-gray-400" /> First name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} className={inputCls} placeholder="John" />
        </div>
        <div>
          <label className={labelCls}>
            <FaIdCard className="h-3 w-3 text-gray-400" /> Last name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} className={inputCls} placeholder="Doe" />
        </div>

        <div>
          <label className={labelCls}>
            <FaPhone className="h-3 w-3 text-gray-400" /> Phone <span className="text-red-500">*</span>
          </label>
          <input type="tel" value={data.phone || ''} onChange={handlePhoneChange} className={inputCls} placeholder="+1 555 123 4567" autoComplete="tel" inputMode="tel" />
        </div>

        <div>
          <label className={labelCls}>
            <FaBirthdayCake className="h-3 w-3 text-gray-400" /> Birth date
          </label>
          <div className="relative">
            <input
              ref={dateInputRef}
              type="date"
              value={data.birth_date || ''}
              onChange={(e) => setData('birth_date', e.target.value)}
              onClick={openDatePicker}
              onFocus={openDatePicker}
              className={`${inputCls} pr-9 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
            />
            <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>
            <FaVenusMars className="h-3 w-3 text-gray-400" /> Gender
          </label>
          <select value={data.gender} onChange={(e) => setData('gender', e.target.value)} className={inputCls}>
            <option value="">Select gender</option>
            {genders.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>
            <MdOutlineBloodtype className="h-3 w-3 text-red-400" /> Blood group
          </label>
          <select value={data.blood_type} onChange={(e) => setData('blood_type', e.target.value)} className={inputCls}>
            <option value="">Select blood group</option>
            {bloodTypes.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>
            <FaMapMarkerAlt className="h-3 w-3 text-gray-400" /> Address
          </label>
          <textarea value={data.address} onChange={(e) => setData('address', e.target.value)} rows="2" className={`${inputCls} resize-none`} placeholder="City, Country or full address" />
        </div>
      </div>

      {/* Friendly hint */}
      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <FaHeartbeat className="h-3 w-3 text-rose-400" />
        We never share your personal details with anyone.
      </p>
    </div>
  );
};

export default BasicInfo;