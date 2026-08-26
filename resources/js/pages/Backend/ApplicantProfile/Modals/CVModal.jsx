// resources/js/Pages/Backend/ApplicantProfile/Modals/CVModal.jsx

// React
import { useState, useEffect } from 'react';

// Inertia
import { router } from '@inertiajs/react';

// SweetAlert
import Swal from 'sweetalert2';

// Icons
import {
  FaFileAlt,
  FaTrashAlt,
  FaCloudUploadAlt,
  FaStar,
  FaRegStar,
  FaFilePdf,
  FaFileWord,
  FaSpinner,
  FaEye
} from 'react-icons/fa';
import { MdDescription } from 'react-icons/md';
import { BiCloudUpload } from 'react-icons/bi';

// Modals
import Modal from './Modal';

// React PDF
import { Document, Page, pdfjs } from 'react-pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_CVS = 3;

/**
 * CVModal Component
 * 
 * Allows users to manage their CV/resume files.
 * Features:
 * - Upload multiple CVs (max 3)
 * - Set primary CV
 * - Preview PDF files
 * - Delete CVs
 * - Drag-and-drop upload
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.profile - User profile data containing CVs
 */
const CVModal = ({ isOpen, onClose, profile }) => {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewCv, setPreviewCv] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const [cvs, setCvs] = useState([]);

  /**
   * Helper function to get CSRF token from meta tag
   * @returns {string} CSRF token
   */
  const getCsrfToken = () => {
    const tokenMeta = document.querySelector('meta[name="csrf-token"]');
    const tokenInput = document.querySelector('input[name="_token"]');
    return tokenMeta?.getAttribute('content') || tokenInput?.value || '';
  };

  // Initialize CV list from profile data
  useEffect(() => {
    if (profile?.cvs) {
      setCvs(profile.cvs.map(cv => ({
        id: cv.id,
        original_name: cv.original_name,
        size: cv.file_size || 0,
        type: cv.cv_path?.split('.').pop() || 'pdf',
        data: cv.cv_url,
        cv_path: cv.cv_path,
        is_primary: cv.is_primary || false,
        order_position: cv.order_position,
        status: cv.status,
        upload_date: cv.created_at
      })));
    }
  }, [profile]);

  /**
   * Handle drag events for CV upload area
   * @param {DragEvent} e - Drag event
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  /**
   * Handle dropped file for CV upload
   * @param {DragEvent} e - Drop event
   */
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await uploadCV(files[0]);
    }
  };

  /**
   * Handle file input change for CV upload
   * @param {Event} e - Change event
   */
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      await uploadCV(files[0]);
    }
  };

  /**
   * Read file as Data URL for preview
   * @param {File} file - File to read
   * @returns {Promise<string>} Data URL
   */
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Upload CV file to server
   * @param {File} file - CV file to upload
   */
  const uploadCV = async (file) => {
    // Check maximum CV limit
    if (cvs.length >= MAX_CVS) {
      Swal.fire({
        icon: 'warning',
        title: 'Maximum CVs Reached',
        text: `You can only upload up to ${MAX_CVS} CVs. Please remove an existing CV before uploading a new one.`,
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please upload a file smaller than 5MB',
      });
      return;
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload PDF, DOC, or DOCX files only',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('cv', file);
      formData.append('_token', getCsrfToken());

      const response = await fetch(route('backend.applicant-profile.cv.upload'), {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 419) {
          throw new Error('Session expired. Please refresh the page and try again.');
        }
        throw new Error(errorData?.message || 'Upload failed');
      }

      const result = await response.json();
      const fileData = await readFileAsDataURL(file);

      const newCv = {
        id: result.id,
        original_name: result.original_name,
        size: result.size,
        type: result.type,
        data: fileData,
        order_position: result.order_position,
        is_primary: result.is_primary,
        upload_date: result.upload_date || new Date().toISOString(),
        status: result.status,
        cv_path: result.cv_path,
      };

      setCvs([...cvs, newCv]);

      Swal.fire({
        icon: 'success',
        title: 'CV Uploaded!',
        text: `${file.name} uploaded successfully.`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Upload error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message || 'Something went wrong while uploading the file.',
      });
    } finally {
      setUploading(false);
    }
  };

  /**
   * Remove CV from server
   * @param {number} index - Index of CV to remove
   */
  const removeCV = (index) => {
    Swal.fire({
      title: 'Remove CV?',
      text: "Are you sure you want to remove this CV?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const cvToRemove = cvs[index];
        if (cvToRemove?.id) {
          try {
            const response = await fetch(route('backend.applicant-profile.cv.destroy', cvToRemove.id), {
              method: 'DELETE',
              headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok && response.status === 419) {
              throw new Error('Session expired. Please refresh the page.');
            }
          } catch (error) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.message || 'Failed to remove CV.',
            });
            return;
          }
        }

        const newCVs = cvs.filter((_, i) => i !== index);
        setCvs(newCVs);

        // Clear preview if the removed CV was being previewed
        if (previewCv?.id === cvs[index].id) {
          setPreviewCv(null);
          setNumPages(null);
          setPdfError(false);
        }

        Swal.fire({
          icon: 'success',
          title: 'Removed!',
          text: 'CV has been removed.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  /**
   * Set a CV as primary (default)
   * @param {number} index - Index of CV to set as primary
   */
  const setPrimaryCV = async (index) => {
    const newCVs = cvs.map((cv, idx) => ({
      ...cv,
      is_primary: idx === index
    }));
    setCvs(newCVs);

    const cv = cvs[index];
    if (cv?.id) {
      try {
        const response = await fetch(route('backend.applicant-profile.cv.primary', cv.id), {
          method: 'PATCH',
          headers: {
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok && response.status === 419) {
          throw new Error('Session expired. Please refresh the page.');
        }

        Swal.fire({
          icon: 'success',
          title: 'Primary CV Updated!',
          text: 'This CV is now set as primary.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to update primary CV.',
        });
        // Revert the local state change
        const revertedCVs = cvs.map((cv, idx) => ({
          ...cv,
          is_primary: idx === (cvs.findIndex(c => c.id === cv.id))
        }));
        setCvs(revertedCVs);
      }
    }
  };

  /**
   * Open PDF preview modal
   * @param {Object} cv - CV object to preview
   */
  const previewCV = (cv) => {
    setPreviewCv(cv);
    setNumPages(null);
    setPdfError(false);
  };

  /**
   * Close PDF preview modal
   */
  const closePreview = () => {
    setPreviewCv(null);
    setNumPages(null);
    setPdfError(false);
  };

  /**
   * Get appropriate icon based on file extension
   * @param {string} fileName - File name
   * @returns {JSX.Element} - Icon component
   */
  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop().toLowerCase();
    if (extension === 'pdf') return <FaFilePdf className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-red-500" />;
    if (extension === 'doc' || extension === 'docx') return <FaFileWord className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-500" />;
    return <FaFileAlt className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-gray-500" />;
  };

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Handle successful PDF document load
   * @param {Object} pdf - PDF document object
   */
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfError(false);
  };

  /**
   * Handle PDF document load error
   * @param {Error} error - Error object
   */
  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setPdfError(true);
  };

  /**
   * Handle save action (refreshes page)
   */
  const handleSave = () => {
    setSaving(true);
    closeModal();
    setSaving(false);
  };

  /**
   * Close modal and refresh page
   */
  const closeModal = () => {
    setPreviewCv(null);
    setNumPages(null);
    setPdfError(false);
    router.reload();
    onClose();
  };

  const remainingSlots = MAX_CVS - cvs.length;

  if (!isOpen) return null;

  return (
    <>
      <Modal title="Manage CVs & Resumes" onClose={closeModal} onSave={handleSave} saving={saving}>
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-2.5 sm:pb-3 md:pb-4">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <MdDescription className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Upload Your CV/Resume</h2>
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">Add your resume so employers can review your qualifications</p>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] sm:text-xs md:text-sm gap-0.5 sm:gap-1">
            <span className="text-gray-600">
              {cvs.length} of {MAX_CVS} CVs uploaded
            </span>
            <span className="text-gray-500">
              {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5 md:h-2">
            <div
              className="bg-blue-600 rounded-full h-1 sm:h-1.5 md:h-2 transition-all duration-300"
              style={{ width: `${(cvs.length / MAX_CVS) * 100}%` }}
            />
          </div>

          {/* Upload Area */}
          {cvs.length < MAX_CVS ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-3 sm:p-4 md:p-8 text-center transition-all duration-200 ${dragActive ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 bg-gray-50'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <div className="p-2.5 sm:p-3 md:p-4 bg-white rounded-full shadow-md mb-1.5 sm:mb-2 md:mb-3">
                  <BiCloudUpload className="mx-auto h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-500" />
                </div>
                <p className="text-xs sm:text-sm md:text-base font-medium text-gray-700">
                  Drag & drop your CV here, or click to select
                </p>
                <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5 sm:mt-1 md:mt-2">Supports PDF, DOC, DOCX (Max 5MB)</p>
                {uploading && (
                  <div className="mt-2 sm:mt-3 md:mt-4 flex flex-col items-center">
                    <FaSpinner className="animate-spin h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-500" />
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-0.5 sm:mt-1 md:mt-2">Uploading...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 md:p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="p-1.5 sm:p-2 md:p-3 bg-yellow-100 rounded-full mb-1.5 sm:mb-2 md:mb-3">
                  <FaCloudUploadAlt className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-yellow-600" />
                </div>
                <p className="text-xs sm:text-sm md:text-base font-medium text-yellow-800">
                  Maximum CV Limit Reached
                </p>
                <p className="text-[10px] sm:text-xs md:text-sm text-yellow-600 mt-0.5 sm:mt-1">
                  You have reached the maximum limit of {MAX_CVS} CVs. Please remove an existing CV to upload a new one.
                </p>
              </div>
            </div>
          )}

          {/* CV List */}
          {cvs.length > 0 && (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-0.5 sm:gap-1">
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">Your CVs ({cvs.length}/{MAX_CVS})</h3>
                <span className="text-[8px] sm:text-[10px] md:text-xs text-gray-500">
                  <FaStar className="inline h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-3 md:w-3 text-yellow-500 mr-0.5 sm:mr-1" />
                  Star indicates primary CV
                </span>
              </div>

              {cvs.map((cv, index) => (
                <div key={cv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 sm:p-3 md:p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-200 gap-2 sm:gap-3">
                  <div className="flex items-center space-x-2.5 sm:space-x-3 w-full sm:w-auto">
                    {getFileIcon(cv.original_name)}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 break-all">{cv.original_name}</p>
                      <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500">
                        {formatFileSize(cv.size)} • {new Date(cv.upload_date).toLocaleDateString()}
                      </p>
                      <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500 flex items-center gap-0.5 sm:gap-1 mt-0.5">
                        {cv.is_primary ? (
                          <>
                            <FaStar className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-3 md:w-3 text-yellow-500" />
                            <span className="text-yellow-600">Primary CV</span>
                          </>
                        ) : (
                          <>
                            <FaRegStar className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-3 md:w-3 text-gray-400" />
                            <span>{cv.status === 'pending' ? 'Pending' : `CV ${index + 1}`}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => previewCV(cv)}
                      className="p-1 sm:p-1.5 md:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Preview CV"
                    >
                      <FaEye className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                    </button>
                    {!cv.is_primary && (
                      <button
                        onClick={() => setPrimaryCV(index)}
                        className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1.5 text-[8px] sm:text-[10px] md:text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors duration-200"
                      >
                        <FaStar className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-3 md:w-3" />
                        Set as Primary
                      </button>
                    )}
                    <button
                      onClick={() => removeCV(index)}
                      className="p-1 sm:p-1.5 md:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <FaTrashAlt className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Note */}
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-2.5 sm:p-3 md:p-4 border border-blue-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-1 sm:gap-1.5 md:gap-2">
              <FaCloudUploadAlt className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500 shrink-0" />
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 text-center sm:text-left">
                You can upload up to {MAX_CVS} CVs and set one as primary. Your primary CV will be used for auto-applications.
                Files upload immediately and stay pending until your profile is complete.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* PDF Preview Modal */}
      {previewCv && previewCv.type === 'application/pdf' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-1.5 sm:p-2 md:p-4" onClick={closePreview}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-2.5 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2">
              <div>
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 break-all">{previewCv.original_name}</h3>
                <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500">{formatFileSize(previewCv.size)}</p>
              </div>
              <button onClick={closePreview} className="text-gray-500 hover:text-gray-700 text-base sm:text-lg md:text-xl">✕</button>
            </div>
            <div className="p-1.5 sm:p-2 md:p-6">
              {!pdfError ? (
                <Document
                  file={previewCv.data}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center py-8 sm:py-12 md:py-20">
                      <FaSpinner className="animate-spin h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-500" />
                      <p className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs md:text-sm text-gray-600">Loading PDF...</p>
                    </div>
                  }
                  error={
                    <div className="text-center py-8 sm:py-12 md:py-20">
                      <FaFilePdf className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-red-400 mx-auto mb-2 sm:mb-3 md:mb-4" />
                      <p className="text-xs sm:text-sm md:text-base text-red-600 font-medium mb-1.5 sm:mb-2">Failed to load PDF</p>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = previewCv.data;
                          link.download = previewCv.original_name;
                          link.click();
                        }}
                        className="mt-2 sm:mt-3 md:mt-4 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-[10px] sm:text-xs md:text-sm"
                      >
                        Download File Instead
                      </button>
                    </div>
                  }
                >
                  {numPages && Array.from(new Array(numPages), (el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      scale={1.0}
                      className="mb-3 sm:mb-4 shadow-lg"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={Math.min(window.innerWidth - 32, 800)}
                    />
                  ))}
                </Document>
              ) : (
                <div className="text-center py-8 sm:py-12 md:py-20">
                  <FaFilePdf className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-red-400 mx-auto mb-2 sm:mb-3 md:mb-4" />
                  <p className="text-xs sm:text-sm md:text-base text-red-600 font-medium mb-1.5 sm:mb-2">Failed to load PDF</p>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = previewCv.data;
                      link.download = previewCv.original_name;
                      link.click();
                    }}
                    className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-[10px] sm:text-xs md:text-sm"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Non-PDF Preview (Download only) */}
      {previewCv && previewCv.type !== 'application/pdf' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-1.5 sm:p-2 md:p-4" onClick={closePreview}>
          <div className="bg-white rounded-xl max-w-2xl w-full mx-1 sm:mx-2 md:mx-0" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 px-2.5 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2">
              <div>
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 break-all">{previewCv.original_name}</h3>
                <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500">{formatFileSize(previewCv.size)}</p>
              </div>
              <button onClick={closePreview} className="text-gray-500 hover:text-gray-700 text-base sm:text-lg md:text-xl">✕</button>
            </div>
            <div className="p-3 sm:p-4 md:p-6 text-center">
              <div className="mb-2 sm:mb-3 md:mb-4">{getFileIcon(previewCv.original_name)}</div>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-2 sm:mb-3 md:mb-4">Preview not available for this file type.</p>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewCv.data;
                  link.download = previewCv.original_name;
                  link.click();
                }}
                className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-[10px] sm:text-xs md:text-sm"
              >
                Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CVModal;