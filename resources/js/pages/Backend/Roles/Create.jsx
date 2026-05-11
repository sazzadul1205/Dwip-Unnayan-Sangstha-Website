// resources/js/pages/Backend/Roles/Create.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Icons
import {
  FaArrowLeft,
  FaSave,
  FaShieldAlt,
  FaKey,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
  FaTrash,
  FaEye,
  FaEdit,
  FaLock,
  FaDatabase,
  FaInfoCircle,
  FaExclamationTriangle,
  FaUserTag,
  FaLayerGroup,
  FaMagic,
  FaSearch,
} from 'react-icons/fa';

// Step Components
import { BasicInfoStep } from '../../../components/RoleSteps/BasicInfoStep';
import { PermissionsStep } from '../../../components/RoleSteps/PermissionsStep';
import { StepIndicator } from '../../../components/RoleSteps/StepIndicator';
import { ModuleAccessStep } from '../../../components/RoleSteps/ModuleAccessStep';
import { ReviewStep } from '../../../components/RoleSteps/ReviewStep';
import { StepNavigation } from '../../../components/RoleSteps/StepNavigation';

// SweetAlert
import Swal from 'sweetalert2';

export default function Create({ permissions, existingLevels, accessLevels }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, title: 'Basic Info', component: BasicInfoStep },
    { id: 2, title: 'Permissions', component: PermissionsStep },
    { id: 3, title: 'Module Access', component: ModuleAccessStep },
    { id: 4, title: 'Review', component: ReviewStep },
  ];

  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    slug: '',
    description: '',
    level: 60,
    is_default: false,
    is_active: true,

    // Permissions
    permissions: [],

    // Module Access
    module_access: [],
  });

  // Check if form has any data entered
  const hasFormData = () => {
    return (
      formData.name ||
      formData.description ||
      formData.permissions.length > 0 ||
      formData.module_access.length > 0
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
          router.visit(route('backend.roles.index'));
        }
      });
    } else {
      router.visit(route('backend.roles.index'));
    }
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};

    switch (currentStep) {
      case 1: // Basic Info
        if (!formData.name || formData.name.trim().length < 2) {
          newErrors.name = 'Role name must be at least 2 characters';
        }
        if (!formData.slug || formData.slug.trim().length < 2) {
          newErrors.slug = 'Slug must be at least 2 characters';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
          newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
        }
        if (!formData.level) {
          newErrors.level = 'Please select a level';
        } else if (formData.level < 1 || formData.level > 100) {
          newErrors.level = 'Level must be between 1 and 100';
        }
        break;

      case 2: // Permissions - Optional, no validation needed
        break;

      case 3: // Module Access - Optional, no validation needed
        break;

      case 4: // Review - Always valid if we got here
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    Swal.fire({
      title: 'Create Role?',
      html: `
        <div class="text-left">
          <p class="mb-2">Are you sure you want to create this role?</p>
          <ul class="list-disc list-inside text-sm text-gray-600">
            <li>Role: <strong>${formData.name}</strong></li>
            <li>Level: <strong>${formData.level}</strong></li>
            <li>Permissions: <strong>${formData.permissions.length}</strong> assigned</li>
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Create Role',
      cancelButtonText: 'Review Again',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setIsSubmitting(true);

        router.post(route('backend.roles.store'), formData, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Role Created!',
              html: `
                <p>Role "${formData.name}" has been created successfully.</p>
                <p class="text-sm text-gray-500 mt-2">You can now assign this role to users.</p>
              `,
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              router.visit(route('backend.roles.index'));
            });
          },
          onError: (error) => {
            console.error('Submission error:', error);

            if (error.response?.data?.errors) {
              setErrors(error.response.data.errors);
              // Navigate back to first step to show errors
              setCurrentStep(1);
              Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please check the form for errors.',
                confirmButtonColor: '#2563eb',
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: error.response?.data?.message || 'Failed to create role. Please try again.',
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

  // Custom submit handler for review step
  const handleStepSubmit = () => {
    if (isReviewStep) {
      handleSubmit();
    } else {
      nextStep();
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Create Role" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto">
          {/* Header */}
          <div className="flex justify-center items-center gap-5 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
              <FaShieldAlt className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Create New Role
              </h1>
              <p className="text-sm text-gray-500 max-w-md">
                Define role details, configure permissions, and set access levels
              </p>
            </div>
          </div>

          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={handleBackToListings}
              className="group flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-all duration-200"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" size={14} />
              <span className="text-sm">Back to Roles</span>
            </button>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Step Indicator */}
            <div className="border-b border-gray-100 bg-gray-50/50 px-8 pt-6">
              <StepIndicator currentStep={currentStep} steps={steps} />
            </div>

            {/* Form Content */}
            <div className="px-8 py-8">
              <CurrentStepComponent
                formData={formData}
                errors={errors}
                setFormData={setFormData}
                permissions={permissions}
                existingLevels={existingLevels}
                accessLevels={accessLevels}
                onNavigateToStep={navigateToStep}
              />
            </div>

            {/* Navigation */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-6">
              <StepNavigation
                currentStep={currentStep}
                totalSteps={steps.length}
                onNext={handleStepSubmit}
                onPrevious={previousStep}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isValid={true}
                isReviewStep={isReviewStep}
              />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}