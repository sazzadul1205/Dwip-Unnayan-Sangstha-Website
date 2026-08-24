/* eslint-disable no-useless-escape */
// resources/js/Pages/Backend/Apply/Create.jsx

// React
import { useState } from 'react';

// Inertia
import { Head, router } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';

// Icons
import {
  FaArrowLeft,
  FaFilePdf,
  FaCheckCircle,
  FaInfoCircle,
  FaLinkedin,
  FaFacebook,
  FaDollarSign,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaBriefcase,
  FaCalendarAlt,
  FaClock,
  FaBuilding,
  FaMapMarkerAlt,
  FaChartLine,
  FaSpinner,
  FaShieldAlt,
  FaRocket,
  FaStar,
  FaExclamationTriangle,
} from 'react-icons/fa';

// SweetAlert
import Swal from 'sweetalert2';

export default function ApplyCreate({ jobListing, applicantProfile, cvs }) {
  // Use centralized auth hook
  const {
    user: currentUser,
    isAuthenticated,
    hasRole,
  } = useAuth();

  // Simplified form state
  const [formData, setFormData] = useState({
    cv_id: cvs.find(cv => cv.is_primary)?.id || cvs[0]?.id || '',
    name: `${applicantProfile?.first_name || ''} ${applicantProfile?.last_name || ''}`.trim() || currentUser?.name || '',
    email: applicantProfile?.email || currentUser?.email || '',
    phone: applicantProfile?.phone || '',
    expected_salary: '',
    linkedin_link: '',
    facebook_link: '',
  });

  // States
  const [errors, setErrors] = useState({});
  const [atsPreview, setAtsPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewingAts, setIsPreviewingAts] = useState(false);

  // If user is not authenticated, show access denied
  if (!isAuthenticated) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Login Required</h2>
            <p className="text-gray-500 mt-2">Please login to apply for this job.</p>
            <button
              onClick={() => router.visit(route('login', { redirect: route('public.jobs.show', jobListing.slug) }))}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Login Now
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // If user is employer, show message
  if (hasRole('employer') || hasRole('employer-admin')) {
    return (
      <AuthenticatedLayout>
        <Head title="Cannot Apply" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Employer Accounts Cannot Apply</h2>
            <p className="text-gray-500 mt-2">
              Employer accounts are for posting jobs, not applying for them. Please create a job seeker account to apply.
            </p>
            <button
              onClick={() => router.visit(route('backend.dashboard'))}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Helper functions
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get days left
  const getDaysLeft = () => {
    const daysLeft = Math.ceil((new Date(jobListing.application_deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'Expired';
    if (daysLeft === 0) return 'Today';
    if (daysLeft === 1) return 'Tomorrow';
    return `${daysLeft} days left`;
  };

  // Get job type label
  const getJobTypeLabel = (type) => {
    const types = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
      'remote': 'Remote',
      'hybrid': 'Hybrid',
    };
    return types[type] || type;
  };

  // Get salary display
  const getSalaryDisplay = () => {
    if (jobListing.as_per_companies_policy) return 'As per company policy';
    if (jobListing.is_salary_negotiable) return 'Negotiable';
    if (jobListing.salary_min && jobListing.salary_max) {
      return `${jobListing.salary_min.toLocaleString()} - ${jobListing.salary_max.toLocaleString()} BDT`;
    }
    if (jobListing.salary_min) return `From ${jobListing.salary_min.toLocaleString()} BDT`;
    if (jobListing.salary_max) return `Up to ${jobListing.salary_max.toLocaleString()} BDT`;
    return 'Not specified';
  };

  // Check if salary input should be shown
  const showSalaryInput = () => {
    if (jobListing.as_per_companies_policy) return false;
    if (jobListing.is_salary_negotiable) return false;
    return !!(jobListing.salary_min || jobListing.salary_max);
  };

  // Validate salary
  const validateSalary = (salary) => {
    const numSalary = parseFloat(salary);
    if (isNaN(numSalary)) return false;
    if (jobListing.salary_min && numSalary < jobListing.salary_min) return false;
    if (jobListing.salary_max && numSalary > jobListing.salary_max) return false;
    return true;
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Simulate ATS preview (replace with actual API call)
  const handlePreviewAts = () => {
    if (!formData.cv_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Select CV First',
        text: 'Please select a CV to analyze.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsPreviewingAts(true);

    // Simulate API call - replace with actual endpoint
    setTimeout(() => {
      const mockScore = Math.floor(Math.random() * 41) + 60;
      setAtsPreview({
        score: mockScore,
        matched: Math.floor(Math.random() * 15) + 5,
        missing: Math.floor(Math.random() * 10) + 1,
        matchedSkills: ['JavaScript', 'React', 'PHP', 'Laravel'].slice(0, Math.floor(Math.random() * 3) + 2),
        missingSkills: ['TypeScript', 'AWS', 'Docker'].slice(0, Math.floor(Math.random() * 2) + 1),
        suggestions: [
          'Add more specific technical skills',
          'Include quantifiable achievements',
          'Highlight relevant experience'
        ].slice(0, Math.floor(Math.random() * 2) + 2),
      });
      setIsPreviewingAts(false);
    }, 1200);
  };

  // Get ATS score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.cv_id) newErrors.cv_id = 'Please select a CV';
    if (!formData.name?.trim()) newErrors.name = 'Full name is required';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (formData.phone?.trim()) {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{4,10}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Enter a valid phone number';
      }
    }

    if (showSalaryInput() && formData.expected_salary) {
      if (!validateSalary(formData.expected_salary)) {
        newErrors.expected_salary = `Salary must be between ${jobListing.salary_min?.toLocaleString() || 0} - ${jobListing.salary_max?.toLocaleString() || 'unlimited'} BDT`;
      }
    }

    if (jobListing.required_linkedin_link && !formData.linkedin_link) {
      newErrors.linkedin_link = 'LinkedIn profile is required';
    } else if (formData.linkedin_link && !formData.linkedin_link.includes('linkedin.com')) {
      newErrors.linkedin_link = 'Enter a valid LinkedIn URL';
    }

    if (jobListing.required_facebook_link && !formData.facebook_link) {
      newErrors.facebook_link = 'Facebook profile is required';
    } else if (formData.facebook_link && !formData.facebook_link.includes('facebook.com') && !formData.facebook_link.includes('fb.com')) {
      newErrors.facebook_link = 'Enter a valid Facebook URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submissionData = { ...formData };
    // Clean up empty fields
    Object.keys(submissionData).forEach(key => {
      if (!submissionData[key]) delete submissionData[key];
    });

    Swal.fire({
      title: 'Submit Application?',
      html: `
        <div class="text-left">
          <div class="bg-gray-50 rounded-lg p-3 mb-3">
            <p class="text-sm"><strong>Job:</strong> ${jobListing.title}</p>
            <p class="text-sm mt-1"><strong>Name:</strong> ${submissionData.name}</p>
            <p class="text-sm mt-1"><strong>Email:</strong> ${submissionData.email}</p>
            ${submissionData.expected_salary ? `<p class="text-sm mt-1"><strong>Expected Salary:</strong> ${parseFloat(submissionData.expected_salary).toLocaleString()} BDT</p>` : ''}
          </div>
          <p class="text-xs text-gray-500">Your ATS score will be calculated automatically after submission.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Submit Application',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsSubmitting(true);
        router.post(route('backend.apply.store', jobListing.slug), submissionData, {
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Application Submitted!',
              text: 'Your application has been submitted successfully.',
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              router.visit(route('backend.apply.index'));
            });
          },
          onError: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Submission Failed',
              text: err.response?.data?.message || 'Please try again.',
              confirmButtonColor: '#3b82f6',
            });
            setIsSubmitting(false);
          },
          onFinish: () => setIsSubmitting(false),
        });
      }
    });
  };

  // Check if job is expired
  const isExpired = new Date(jobListing.application_deadline) < new Date();

  // Job Expired Screen
  if (isExpired) {
    return (
      <AuthenticatedLayout>
        <Head title="Application Closed" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaClock className="text-rose-600 text-3xl" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Application Closed</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-4">The application deadline for this position has passed.</p>
            <button
              onClick={() => window.history.back()}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
            >
              Go Back
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Check if profile is incomplete
  const isProfileIncomplete = !applicantProfile || (!applicantProfile.first_name && !applicantProfile.last_name);

  return (
    <AuthenticatedLayout>
      <Head title={`Apply for ${jobListing.title}`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
        <div className="mx-auto">
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-700 mb-3 sm:mb-5 transition text-xs sm:text-sm"
          >
            <FaArrowLeft size={12} className="group-hover:-translate-x-0.5 transition" />
            <span>Back to Job</span>
          </button>

          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg mb-4 sm:mb-6 px-4 sm:px-6 py-4 sm:py-5">
            <h1 className="text-lg sm:text-xl font-bold text-white">Apply for Position</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5 sm:mt-1">Complete the form below to submit your application</p>
          </div>

          {/* Profile Incomplete Warning */}
          {isProfileIncomplete && (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <FaExclamationTriangle className="text-amber-600 mt-0.5" size={16} />
                <div>
                  <p className="text-sm font-medium text-amber-800">Profile Incomplete</p>
                  <p className="text-xs text-amber-700 mt-0.5 sm:mt-1">
                    Please complete your profile information to improve your application quality.
                  </p>
                  <button
                    onClick={() => router.visit(route('backend.applicant.profile.show'))}
                    className="mt-1.5 sm:mt-2 text-xs text-amber-800 underline hover:text-amber-900"
                  >
                    Complete Profile →
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Job Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gray-50 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                    <FaBriefcase className="text-blue-500" size={14} />
                    Job Summary
                  </h2>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2">{jobListing.title}</h3>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <FaBuilding size={12} />
                      <span className="line-clamp-1">{jobListing.employer?.name || 'Company'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <FaMapMarkerAlt size={12} />
                      <span className="line-clamp-1">Multiple Locations</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <FaCalendarAlt size={12} />
                      <span>{getJobTypeLabel(jobListing.job_type)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <FaStar size={12} />
                      <span className="capitalize">{jobListing.experience_level || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <span className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <FaDollarSign size={12} />
                      {getSalaryDisplay()}
                    </span>
                    <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full ${isExpired ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      <FaClock size={10} className="inline mr-1" />
                      Deadline: {formatDate(jobListing.application_deadline)} ({getDaysLeft()})
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Form */}
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gray-50 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 text-sm sm:text-base">Application Information</h2>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Please fill in all required fields</p>
                </div>

                <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                  {/* CV Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Select CV <span className="text-rose-500">*</span>
                    </label>
                    {cvs.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 text-center">
                        <p className="text-amber-700 text-xs sm:text-sm mb-2">No CV found</p>
                        <a href={route('backend.applicant.profile.show')} className="text-blue-600 text-xs sm:text-sm hover:underline">
                          Upload a CV first →
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-1.5 sm:space-y-2">
                        {cvs.map((cv) => (
                          <label
                            key={cv.id}
                            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all ${formData.cv_id === cv.id
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                              }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                              <input
                                type="radio"
                                name="cv_id"
                                value={cv.id}
                                checked={formData.cv_id === cv.id}
                                onChange={() => {
                                  setFormData(prev => ({ ...prev, cv_id: cv.id }));
                                  setAtsPreview(null);
                                }}
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0"
                              />
                              <FaFilePdf className="text-rose-500" size={16} />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-1">{cv.original_name}</p>
                                {cv.is_primary && (
                                  <span className="text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Primary</span>
                                )}
                              </div>
                            </div>
                            <a href={cv.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs sm:text-sm hover:underline ml-7 sm:ml-0 mt-1 sm:mt-0">
                              View
                            </a>
                          </label>
                        ))}
                      </div>
                    )}
                    {errors.cv_id && <p className="text-rose-500 text-xs mt-1">{errors.cv_id}</p>}
                  </div>

                  {/* ATS Preview Button */}
                  {cvs.length > 0 && formData.cv_id && !atsPreview && (
                    <button
                      type="button"
                      onClick={handlePreviewAts}
                      disabled={isPreviewingAts}
                      className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-purple-600 hover:text-purple-700 transition"
                    >
                      {isPreviewingAts ? (
                        <FaSpinner className="animate-spin" size={14} />
                      ) : (
                        <FaChartLine size={14} />
                      )}
                      Preview ATS Score
                    </button>
                  )}

                  {/* ATS Preview Result */}
                  {atsPreview && (
                    <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200 animate-fadeIn">
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <h4 className="font-medium text-purple-800 text-xs sm:text-sm flex items-center gap-2">
                          <FaChartLine size={14} />
                          ATS Preview
                        </h4>
                        <button
                          onClick={() => setAtsPreview(null)}
                          className="text-purple-400 hover:text-purple-600 text-[10px] sm:text-xs"
                        >
                          Hide
                        </button>
                      </div>
                      <div className="text-center mb-2 sm:mb-3">
                        <span className={`text-2xl sm:text-3xl font-bold ${getScoreColor(atsPreview.score)}`}>
                          {atsPreview.score}%
                        </span>
                        <p className="text-[10px] sm:text-xs text-gray-500">Compatibility Score</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center text-xs sm:text-sm mb-2 sm:mb-3">
                        <div className="bg-emerald-100 rounded-lg p-1.5 sm:p-2">
                          <p className="text-emerald-700 font-semibold text-sm sm:text-base">{atsPreview.matched}</p>
                          <p className="text-[10px] sm:text-xs text-gray-600">Matched</p>
                        </div>
                        <div className="bg-rose-100 rounded-lg p-1.5 sm:p-2">
                          <p className="text-rose-700 font-semibold text-sm sm:text-base">{atsPreview.missing}</p>
                          <p className="text-[10px] sm:text-xs text-gray-600">Missing</p>
                        </div>
                      </div>
                      {atsPreview.matchedSkills?.length > 0 && (
                        <div className="mb-1.5 sm:mb-2">
                          <p className="text-[10px] sm:text-xs font-medium text-emerald-700 mb-1">✓ Matched Skills</p>
                          <div className="flex flex-wrap gap-0.5 sm:gap-1">
                            {atsPreview.matchedSkills.map((skill, i) => (
                              <span key={i} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {atsPreview.suggestions?.length > 0 && (
                        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-purple-200">
                          <p className="text-[10px] sm:text-xs font-medium text-purple-700 mb-1">💡 Suggestions</p>
                          <ul className="text-[10px] sm:text-xs text-purple-600 space-y-0.5 list-disc list-inside">
                            {atsPreview.suggestions.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Personal Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm ${errors.name ? 'border-rose-400' : 'border-gray-300'}`}
                          placeholder="Full name"
                        />
                      </div>
                      {errors.name && <p className="text-rose-500 text-[10px] sm:text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm ${errors.email ? 'border-rose-400' : 'border-gray-300'}`}
                          placeholder="email@example.com"
                        />
                      </div>
                      {errors.email && <p className="text-rose-500 text-[10px] sm:text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                      <div className="relative">
                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm ${errors.phone ? 'border-rose-400' : 'border-gray-300'}`}
                          placeholder="+880 XXXXXXXXX"
                        />
                      </div>
                      {errors.phone && <p className="text-rose-500 text-[10px] sm:text-xs mt-1">{errors.phone}</p>}
                    </div>

                    {showSalaryInput() && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Expected Salary (BDT)</label>
                        <div className="relative">
                          <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input
                            type="number"
                            name="expected_salary"
                            value={formData.expected_salary}
                            onChange={handleChange}
                            className={`w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm ${errors.expected_salary ? 'border-rose-400' : 'border-gray-300'}`}
                            placeholder="Expected salary"
                          />
                        </div>
                        {errors.expected_salary && <p className="text-rose-500 text-[10px] sm:text-xs mt-1">{errors.expected_salary}</p>}
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {(jobListing.required_linkedin_link || jobListing.required_facebook_link) && (
                    <div className="border-t border-gray-100 pt-3 sm:pt-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Social Profiles</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {jobListing.required_linkedin_link && (
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              LinkedIn <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <FaLinkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={14} />
                              <input
                                type="url"
                                name="linkedin_link"
                                value={formData.linkedin_link}
                                onChange={handleChange}
                                className={`w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 text-sm ${errors.linkedin_link ? 'border-rose-400' : 'border-gray-300'}`}
                                placeholder="linkedin.com/in/username"
                              />
                            </div>
                            {errors.linkedin_link && <p className="text-rose-500 text-[10px] sm:text-xs mt-1">{errors.linkedin_link}</p>}
                          </div>
                        )}

                        {jobListing.required_facebook_link && (
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Facebook <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <FaFacebook className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={14} />
                              <input
                                type="url"
                                name="facebook_link"
                                value={formData.facebook_link}
                                onChange={handleChange}
                                className={`w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 text-sm ${errors.facebook_link ? 'border-rose-400' : 'border-gray-300'}`}
                                placeholder="facebook.com/username"
                              />
                            </div>
                            {errors.facebook_link && <p className="text-rose-500 text-[10px] sm:text-xs mt-1">{errors.facebook_link}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Info Note */}
                  <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 flex gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-blue-700">
                    <FaInfoCircle className="shrink-0 mt-0.5" size={14} />
                    <p>Your ATS score will be calculated automatically. You can track your application status from your dashboard.</p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="w-full sm:w-auto px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || cvs.length === 0}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-linear-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm text-sm font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin" size={14} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle size={14} />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Tips */}
            <div className="space-y-4 sm:space-y-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-linear-to-r from-purple-600 to-indigo-600">
                  <h3 className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
                    <FaRocket size={14} />
                    Quick Tips
                  </h3>
                </div>
                <div className="p-4 sm:p-5 space-y-2 sm:space-y-3">
                  {[
                    { text: 'Select the CV that best matches this job' },
                    { text: 'Use ATS preview to check compatibility' },
                    { text: 'Ensure expected salary is within range' },
                    { text: 'Complete all required fields' },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-gray-600 text-xs sm:text-sm">{tip.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 sm:p-4 border border-amber-200">
                <div className="flex gap-1.5 sm:gap-2">
                  <FaShieldAlt className="text-amber-600 shrink-0 mt-0.5" size={14} />
                  <div className="text-[10px] sm:text-xs text-amber-800">
                    <p className="font-medium mb-0.5 sm:mb-1">Before You Apply</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Review job requirements carefully</li>
                      <li>Update your CV if needed</li>
                      <li>Check salary expectations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </AuthenticatedLayout>
  );
}