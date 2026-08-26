// resources/js/pages/Backend/JobListings/Create.jsx

// React
import { useState } from 'react';

// Inertia
import { Head, router } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';

// Icons
import { FaArrowLeft, FaBriefcase, FaShieldAlt, FaSpinner, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

// Step Components
import { ReviewStep } from '../../../components/JobListingSteps/ReviewStep';
import { LocationStep } from '../../../components/JobListingSteps/LocationStep';
import { BasicInfoStep } from '../../../components/JobListingSteps/BasicInfoStep';
import { StepIndicator } from '../../../components/JobListingSteps/StepIndicator';
import { PublishingStep } from '../../../components/JobListingSteps/PublishingStep';
import { RequirementsStep } from '../../../components/JobListingSteps/RequirementsStep';
import { CompensationStep } from '../../../components/JobListingSteps/CompensationStep';

// SweetAlert
import Swal from 'sweetalert2';

export default function Create({ categories, locations }) {
  // Use centralized auth hook
  const {
    user: currentUser,
    hasAnyPermission,
    hasRole,
  } = useAuth();

  // Check permissions for job creation
  const canViewJobs = hasAnyPermission(['jobs.view', 'jobs.manage']);
  const isEmployer = hasRole('employer') || hasRole('employer-admin');
  const canCreateJobs = hasAnyPermission(['jobs.create', 'jobs.manage']);

  // Check if user has an employer profile (for employers)
  const hasEmployerProfile = currentUser?.employer_id !== null;

  // Make categories and locations available globally for child components
  if (typeof window !== 'undefined') {
    window.categories = categories;
    window.locations = locations;
  }

  // States
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Steps
  const steps = [
    { id: 1, title: 'Basic Info', component: BasicInfoStep },
    { id: 2, title: 'Requirements', component: RequirementsStep },
    { id: 3, title: 'Location', component: LocationStep },
    { id: 4, title: 'Compensation', component: CompensationStep },
    { id: 5, title: 'Publishing', component: PublishingStep },
    { id: 6, title: 'Review', component: ReviewStep },
  ];

  // Form Data
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    category_id: '',
    job_type: '',
    experience_level: '',
    description: '',

    // Requirements
    requirements: '',
    skills: [],
    responsibilities: [],
    benefits: [],
    education_requirement: '',
    education_details: '',

    // Location
    location_ids: [],

    // Compensation
    salary_min: '',
    salary_max: '',
    is_salary_negotiable: false,
    as_per_companies_policy: false,
    keywords: [],

    // Publishing
    application_deadline: '',
    publish_at: '',
    is_active: true,
    required_linkedin_link: false,
    required_facebook_link: false,
  });

  // If user doesn't have permission to create jobs, show access denied
  if (!canCreateJobs && !isEmployer) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to create job listings.</p>
            {canViewJobs && (
              <button
                onClick={() => router.visit(route('backend.listing.index'))}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Back to Job Listings
              </button>
            )}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Warning for employers without complete profile
  if (isEmployer && !hasEmployerProfile) {
    return (
      <AuthenticatedLayout>
        <Head title="Complete Your Profile" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBriefcase className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Complete Your Employer Profile</h2>
            <p className="text-gray-500 mt-2">
              Please complete your employer profile before posting jobs.
            </p>
            <button
              onClick={() => router.visit(route('backend.employer.profile.edit'))}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Complete Profile
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Check if form has any data entered
  const hasFormData = () => {
    return (
      formData.title ||
      formData.category_id ||
      formData.job_type ||
      formData.experience_level ||
      formData.description ||
      formData.requirements ||
      formData.skills.length > 0 ||
      formData.responsibilities.length > 0 ||
      formData.location_ids.length > 0
    );
  };

  // Handle back button click with confirmation if data exists
  const handleBackToListings = () => {
    if (hasFormData()) {
      Swal.fire({
        title: 'Discard changes?',
        text: 'You have entered information that will be lost if you leave. Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, discard',
        cancelButtonText: 'Stay',
      }).then((result) => {
        if (result.isConfirmed) {
          router.visit(route('backend.listing.index'));
        }
      });
    } else {
      router.visit(route('backend.listing.index'));
    }
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};

    switch (currentStep) {
      case 1: // Basic Info
        if (!formData.title || formData.title.length < 5) {
          newErrors.title = 'Title must be at least 5 characters';
        }
        if (!formData.category_id) {
          newErrors.category_id = 'Please select a category';
        }
        if (!formData.job_type) {
          newErrors.job_type = 'Please select a job type';
        }
        if (!formData.experience_level) {
          newErrors.experience_level = 'Please select an experience level';
        }
        if (!formData.description || formData.description.replace(/<[^>]*>/g, '').trim().length < 50) {
          newErrors.description = 'Description must be at least 50 characters';
        }
        break;

      case 2: // Requirements
        if (!formData.requirements || formData.requirements.replace(/<[^>]*>/g, '').trim().length < 50) {
          newErrors.requirements = 'Requirements must be at least 50 characters';
        }
        if (formData.skills.length === 0) {
          newErrors.skills = 'Please add at least one required skill';
        }
        if (formData.responsibilities.length === 0) {
          newErrors.responsibilities = 'Please add at least one responsibility';
        }
        break;

      case 3: // Location
        if (formData.location_ids.length === 0) {
          newErrors.location_ids = 'Please select at least one location';
        }
        break;

      case 4: // Compensation
        if (formData.salary_min && formData.salary_max && parseFloat(formData.salary_max) < parseFloat(formData.salary_min)) {
          newErrors.salary_max = 'Maximum salary must be greater than or equal to minimum salary';
        }
        break;

      case 5: // Publishing
        if (!formData.application_deadline) {
          newErrors.application_deadline = 'Please set an application deadline';
        }
        if (formData.application_deadline && new Date(formData.application_deadline) < new Date()) {
          newErrors.application_deadline = 'Application deadline must be in the future';
        }
        break;

      case 6: // Review - Always valid if we got here
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle array input changes
  const handleArrayChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Move to the next step
  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fix the errors before proceeding.',
        confirmButtonColor: '#2563eb',
      });
    }
  };

  // Move to the previous step
  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to a specific step (for review page editing)
  const navigateToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final submission
  const handleSubmit = () => {
    if (!canCreateJobs && !isEmployer) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to post jobs.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const submitData = {
      ...formData,
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
    };

    Swal.fire({
      title: 'Post Job Listing?',
      html: `
        <div class="text-left">
          <p class="mb-2">Are you sure you want to post this job?</p>
          <ul class="list-disc list-inside text-sm text-gray-600">
            <li>The job will be visible to applicants</li>
            <li>You can edit or deactivate it later</li>
            <li>Applications will start coming in once posted</li>
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Post Job',
      cancelButtonText: 'Review Again',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setIsSubmitting(true);

        router.post(route('backend.listing.store'), submitData, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Job Posted!',
              html: `
                <p>Your job listing has been posted successfully.</p>
                <p class="text-sm text-gray-500 mt-2">Candidates can now apply.</p>
              `,
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              router.visit(route('backend.listing.index'));
            });
          },
          onError: (error) => {
            if (error.response?.data?.errors) {
              setErrors(error.response.data.errors);
              setCurrentStep(1);
              Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please check the form for errors.',
                confirmButtonColor: '#2563eb',
              });
            } else if (error.response?.data?.message) {
              Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: error.response.data.message,
                confirmButtonColor: '#2563eb',
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: 'Failed to post job listing. Please try again.',
                confirmButtonColor: '#2563eb',
              });
            }
            setIsSubmitting(false);
          },
          onFinish: () => {
            setIsSubmitting(false);
          },
        });
      }
    });
  };

  const CurrentStepComponent = steps[currentStep - 1].component;
  const isReviewStep = currentStep === steps.length;

  return (
    <AuthenticatedLayout>
      <Head title="Create Job Listing" />

      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header with Back Button - Responsive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shrink-0">
                <FaBriefcase className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Create Job Listing
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md hidden sm:block">
                  Fill in the details below to post a new job opportunity and find the perfect candidate
                </p>
              </div>
            </div>

            <button
              onClick={handleBackToListings}
              className="group flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-700 transition-all duration-200 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 w-full sm:w-auto justify-center"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" size={12} />
              <span>Back to Job Listings</span>
            </button>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Step Indicator - Responsive */}
            <div className="border-b border-gray-100 bg-gray-50/50 px-3 sm:px-8 pt-4 sm:pt-6 overflow-x-auto">
              <StepIndicator currentStep={currentStep} steps={steps} />
            </div>

            {/* Form Content - Responsive */}
            <div className="px-3 sm:px-8 py-4 sm:py-8">
              <CurrentStepComponent
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                handleArrayChange={handleArrayChange}
                setFormData={setFormData}
                locations={locations}
                categories={categories}
                onNavigateToStep={navigateToStep}
              />
            </div>

            {/* Navigation - Responsive */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-3 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="w-full sm:w-auto">
                  {currentStep > 1 && (
                    <button
                      onClick={previousStep}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 text-sm font-medium border border-gray-200 hover:border-gray-300"
                    >
                      ← Previous
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {isReviewStep ? (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-linear-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-medium text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="animate-spin" size={16} />
                          Posting...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle size={16} />
                          Post Job
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={nextStep}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-medium text-sm"
                    >
                      Next Step
                      <FaArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step Indicator - Mobile Summary */}
          <div className="mt-3 sm:mt-4 text-center sm:hidden">
            <p className="text-xs text-gray-400">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
            </p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}