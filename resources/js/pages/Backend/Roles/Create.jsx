// resources/js/pages/Backend/Roles/Create.jsx

// React
import { useState } from 'react';

// Inertia
import { Head, router } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Icons
import {
  FaArrowLeft,
  FaShieldAlt,
  FaExclamationTriangle,
} from 'react-icons/fa';

// Step Components
import { ReviewStep } from '../../../components/RoleSteps/ReviewStep';
import { BasicInfoStep } from '../../../components/RoleSteps/BasicInfoStep';
import { StepIndicator } from '../../../components/RoleSteps/StepIndicator';
import { StepNavigation } from '../../../components/RoleSteps/StepNavigation';
import { PermissionsStep } from '../../../components/RoleSteps/PermissionsStep';
import { ModuleAccessStep } from '../../../components/RoleSteps/ModuleAccessStep';

// Auth
import { useAuth } from '../../../hooks/useAuth';

// SweetAlert
import Swal from 'sweetalert2';

export default function Create({ permissions, existingLevels, accessLevels }) {
  // Use centralized auth hook
  const {
    user: currentUser,
    hasAnyPermission,
    hasRole,
  } = useAuth();

  // Check permissions for role management
  const isSuperAdmin = hasRole('super-admin');
  const canViewRoles = hasAnyPermission(['roles.view', 'roles.manage']);
  const canCreateRoles = hasAnyPermission(['roles.create', 'roles.manage']);

  // State
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // If user doesn't have permission to create roles, show access denied
  if (!canCreateRoles) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to create roles.</p>
            {canViewRoles && (
              <button
                onClick={() => router.visit(route('backend.roles.index'))}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Back to Roles
              </button>
            )}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Check if user can assign specific permissions (for super-admin only)
  const canAssignAllPermissions = isSuperAdmin || hasAnyPermission(['roles.assign_all_permissions', 'roles.manage']);

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

  // In Create.jsx, add this helper function after your state declarations
  const getUserHighestLevel = () => {
    if (!currentUser) return 100;
    if (currentUser.highest_role_level) return currentUser.highest_role_level;
    if (currentUser.roles && currentUser.roles.length > 0) {
      return Math.max(...currentUser.roles.map(role => role.level || 0));
    }
    return 100;
  };

  // Then update the validateStep function in Create.jsx (around line 150-180)
  const validateStep = () => {
    const newErrors = {};

    switch (currentStep) {
      case 1: // Basic Info
        {
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

          // Check if slug is unique (client-side check)
          if (existingLevels && existingLevels.some(role => role.slug === formData.slug)) {
            newErrors.slug = 'This slug is already in use. Please choose another.';
          }

          // FIXED: Get user's highest level properly
          const userHighestLevel = getUserHighestLevel();

          // Super admin (level 100) can create roles with level 1-99
          if (userHighestLevel === 100 && formData.level >= 100) {
            newErrors.level = `You cannot create a role with level ${formData.level}. Maximum role level is 99 for super admins.`;
          }

          // For non-super-admins, they cannot create roles with level >= their own
          if (userHighestLevel < 100 && formData.level >= userHighestLevel) {
            newErrors.level = `You cannot create a role with level ${formData.level} when your level is ${userHighestLevel}. This would allow privilege escalation.`;
          }
          break;
        }

      case 2:
      case 3:
      case 4:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Next step
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

  // Previous step
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
    // Additional security check before submission
    if (!canCreateRoles) {
      Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'You do not have permission to create roles.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: 'Create Role?',
      html: `
        <div class="text-left">
          <p class="mb-2">Are you sure you want to create this role?</p>
          <ul class="list-disc list-inside text-sm text-gray-600">
            <li>Role: <strong>${formData.name}</strong></li>
            <li>Level: <strong>${formData.level}</strong></li>
            <li>Permissions: <strong>${formData.permissions.length}</strong> assigned</li>
            ${formData.is_default ? '<li class="text-blue-600">This will be set as DEFAULT role</li>' : ''}
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
            } else if (error.response?.data?.message) {
              Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: error.response.data.message,
                confirmButtonColor: '#2563eb',
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: 'Failed to create role. Please try again.',
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

  // Render current step
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

  // Filter permissions based on user's own permissions (non-super-admins can only assign permissions they have)
  const filteredPermissions = canAssignAllPermissions
    ? permissions
    : permissions.filter(permission => {
      // Non-super-admins can only assign permissions they personally have
      return hasAnyPermission([permission.slug]);
    });

  return (
    <AuthenticatedLayout>
      <Head title="Create Role" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto">

          <div className='flex items-center justify-between' >
            {/* Header */}
            <div className="flex justify-center items-center gap-5 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <FaShieldAlt className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Create New Role
                </h1>
                <p className="text-sm text-gray-500 max-w-md">
                  Define role details, configure permissions, and set access levels
                </p>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={handleBackToListings}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors group"
            >
              <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Back to Roles</span>
            </button>

          </div>

          {/* Warning for limited permission users */}
          {!canAssignAllPermissions && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Limited Permission Mode</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    You can only assign permissions that you personally have. You cannot assign higher-level permissions than your own.
                  </p>
                </div>
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
                formData={formData}
                errors={errors}
                setFormData={setFormData}
                permissions={filteredPermissions}
                existingLevels={existingLevels}
                accessLevels={accessLevels}
                onNavigateToStep={navigateToStep}
                canAssignAllPermissions={canAssignAllPermissions}
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