// resources/js/pages/Backend/Roles/Edit.jsx

import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Icons
import {
  FaArrowLeft,
  FaSave,
  FaShieldAlt,
  FaKey,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaSpinner,
  FaInfoCircle,
} from 'react-icons/fa';

// Step Components
import { BasicInfoStep } from '../../../components/RoleSteps/BasicInfoStep';
import { PermissionsStep } from '../../../components/RoleSteps/PermissionsStep';
import { ModuleAccessStep } from '../../../components/RoleSteps/ModuleAccessStep';
import { ReviewStep } from '../../../components/RoleSteps/ReviewStep';
import { StepIndicator } from '../../../components/RoleSteps/StepIndicator';
import { StepNavigation } from '../../../components/RoleSteps/StepNavigation';

// SweetAlert
import Swal from 'sweetalert2';

export default function Edit({
  role: initialRole,
  permissions,
  grantedPermissionIds,
  moduleAccess: initialModuleAccess,
  existingLevels,
  accessLevels
}) {
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
    name: initialRole.name || '',
    slug: initialRole.slug || '',
    description: initialRole.description || '',
    level: initialRole.level || 60,
    is_default: initialRole.is_default || false,
    is_active: initialRole.is_active ?? true,

    // Permissions
    permissions: grantedPermissionIds || [],

    // Module Access
    module_access: initialModuleAccess || [],
  });

  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  const isDefaultRole = initialRole.is_default;

  // Check for changes
  useEffect(() => {
    const originalPermissions = grantedPermissionIds || [];
    const originalModuleAccess = initialModuleAccess || [];

    const permissionsChanged =
      JSON.stringify(formData.permissions.sort()) !== JSON.stringify(originalPermissions.sort());

    const moduleAccessChanged =
      JSON.stringify(formData.module_access) !== JSON.stringify(originalModuleAccess);

    const basicInfoChanged =
      formData.name !== initialRole.name ||
      formData.slug !== initialRole.slug ||
      formData.description !== initialRole.description ||
      formData.level !== initialRole.level ||
      formData.is_default !== initialRole.is_default ||
      formData.is_active !== initialRole.is_active;

    setHasChanges(permissionsChanged || moduleAccessChanged || basicInfoChanged);
  }, [formData, initialRole, grantedPermissionIds, initialModuleAccess]);

  // Handle back button with confirmation
  const handleBackToListings = () => {
    if (hasChanges) {
      Swal.fire({
        title: 'Discard changes?',
        text: 'You have unsaved changes that will be lost if you leave. Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, discard',
        cancelButtonText: 'Stay',
      }).then((result) => {
        if (result.isConfirmed) {
          router.visit(route('backend.roles.show', initialRole.id));
        }
      });
    } else {
      router.visit(route('backend.roles.show', initialRole.id));
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

      case 2: // Permissions - Optional
      case 3: // Module Access - Optional
      case 4: // Review
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
    if (!validateStep()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fix the errors before submitting.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    if (!hasChanges) {
      Swal.fire({
        icon: 'info',
        title: 'No Changes',
        text: "You haven't made any changes to the role.",
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: 'Update Role?',
      html: `
        <div class="text-left">
          <p class="mb-2">Are you sure you want to update this role?</p>
          <ul class="list-disc list-inside text-sm text-gray-600">
            <li>Role: <strong>${formData.name}</strong></li>
            <li>Level: <strong>${formData.level}</strong></li>
            <li>Permissions: <strong>${formData.permissions.length}</strong> assigned</li>
          </ul>
          <p class="text-xs text-yellow-600 mt-3">⚠️ Changes will affect all users with this role.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Update Role',
      cancelButtonText: 'Review Again',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setIsSubmitting(true);

        router.put(route('backend.roles.update', initialRole.id), formData, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Role Updated!',
              html: `
                <p>Role "${formData.name}" has been updated successfully.</p>
                <p class="text-sm text-gray-500 mt-2">Changes are now applied.</p>
              `,
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              router.visit(route('backend.roles.show', initialRole.id));
            });
          },
          onError: (error) => {
            console.error('Update error:', error);

            if (error.response?.data?.errors) {
              setErrors(error.response.data.errors);
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
                title: 'Update Failed',
                text: error.response?.data?.message || 'Failed to update role. Please try again.',
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

  const handleStepSubmit = () => {
    if (isReviewStep) {
      handleSubmit();
    } else {
      nextStep();
    }
  };

  // Extended props for BasicInfoStep with edit mode
  const basicInfoProps = {
    formData,
    errors,
    setFormData,
    existingLevels,
    isEdit: true,
    isDefaultRole,
    originalName: initialRole.name,
  };

  // Extended props for PermissionsStep
  const permissionsProps = {
    formData,
    setFormData,
    permissions,
    isEdit: true,
  };

  // Extended props for ModuleAccessStep
  const moduleAccessProps = {
    formData,
    setFormData,
    permissions,
    accessLevels,
    isEdit: true,
  };

  // Extended props for ReviewStep
  const reviewProps = {
    formData,
    permissions,
    accessLevels,
    onNavigateToStep: navigateToStep,
    isEdit: true,
    originalRole: initialRole,
    grantedPermissionIds,
    initialModuleAccess,
    hasChanges,
  };

  return (
    <AuthenticatedLayout>
      <Head title={`Edit: ${initialRole.name}`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto">
          {/* Header */}
          <div className="flex justify-center items-center gap-5 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg">
              <FaShieldAlt className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Edit Role
              </h1>
              <p className="text-sm text-gray-500 max-w-md">
                Update "{initialRole.name}" role details, permissions, and access levels
              </p>
            </div>
          </div>

          {/* Back Button and Unsaved Changes Indicator */}
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={handleBackToListings}
              className="group flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-all duration-200"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" size={14} />
              <span className="text-sm">Back to Role Details</span>
            </button>

            {hasChanges && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs shadow-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Unsaved changes
              </div>
            )}
          </div>

          {/* Warning for Default Role */}
          {isDefaultRole && (
            <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FaInfoCircle className="text-amber-500 mt-0.5" size={14} />
                <p className="text-xs text-amber-700">
                  <strong className="font-medium">Default Role:</strong> This is a default role.
                  Some basic fields like name and slug cannot be edited to prevent system issues.
                </p>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Step Indicator */}
            <div className="border-b border-gray-100 bg-gray-50/50 px-8 pt-6">
              <StepIndicator currentStep={currentStep} steps={steps} />
            </div>

            {/* Form Content */}
            <div className="px-8 py-8">
              <CurrentStepComponent
                {...(currentStep === 1 ? basicInfoProps :
                  currentStep === 2 ? permissionsProps :
                    currentStep === 3 ? moduleAccessProps :
                      reviewProps)}
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
                isEdit={true}
              />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}BasicInfoStep