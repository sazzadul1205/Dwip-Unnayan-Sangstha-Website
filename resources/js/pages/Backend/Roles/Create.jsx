// resources/js/pages/Backend/Roles/Create.jsx

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { useAuth } from '../../../hooks/useAuth';
import { FaArrowLeft, FaShieldAlt, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { ReviewStep } from '../../../components/RoleSteps/ReviewStep';
import { BasicInfoStep } from '../../../components/RoleSteps/BasicInfoStep';
import { StepIndicator } from '../../../components/RoleSteps/StepIndicator';
import { StepNavigation } from '../../../components/RoleSteps/StepNavigation';
import { PermissionsStep } from '../../../components/RoleSteps/PermissionsStep';
import { ModuleAccessStep } from '../../../components/RoleSteps/ModuleAccessStep';
import Swal from 'sweetalert2';

export default function Create({ permissions, existingLevels, accessLevels }) {
  const { user: currentUser, hasAnyPermission, hasRole } = useAuth();
  const isSuperAdmin = hasRole('super-admin');
  const canViewRoles = hasAnyPermission(['roles.view', 'roles.manage']);
  const canCreateRoles = hasAnyPermission(['roles.create', 'roles.manage']);
  const canAssignAllPermissions = isSuperAdmin || hasAnyPermission(['roles.assign_all_permissions', 'roles.manage']);

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const steps = [
    { id: 1, title: 'Basic Info', component: BasicInfoStep },
    { id: 2, title: 'Permissions', component: PermissionsStep },
    { id: 3, title: 'Module Access', component: ModuleAccessStep },
    { id: 4, title: 'Review', component: ReviewStep },
  ];

  // ✅ Initialize state with proper default values
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    level: 60,
    is_default: false,
    is_active: true,
    permissions: [],
    module_access: [],
  });

  // ✅ Simple update function
  const updateForm = (updates) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      setIsDirty(true);
      return newData;
    });
  };

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

  const getUserHighestLevel = () => {
    if (!currentUser) return 100;
    if (currentUser.highest_role_level) return currentUser.highest_role_level;
    if (currentUser.roles?.length) {
      return Math.max(...currentUser.roles.map(r => r.level || 0));
    }
    return 100;
  };

  const validateStep = () => {
    const newErrors = {};
    switch (currentStep) {
      case 1: {
        if (!formData.name?.trim() || formData.name.trim().length < 2) {
          newErrors.name = 'Role name must be at least 2 characters';
        }
        if (!formData.slug?.trim() || formData.slug.trim().length < 2) {
          newErrors.slug = 'Slug must be at least 2 characters';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
          newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
        }
        if (existingLevels?.some(role => role.slug === formData.slug)) {
          newErrors.slug = 'This slug is already in use.';
        }
        if (!formData.level) {
          newErrors.level = 'Please select a level';
        } else if (formData.level < 1 || formData.level > 100) {
          newErrors.level = 'Level must be between 1 and 100';
        }
        const userHighest = getUserHighestLevel();
        if (userHighest === 100 && formData.level >= 100) {
          newErrors.level = `Max role level for super admin is 99.`;
        } else if (userHighest < 100 && formData.level >= userHighest) {
          newErrors.level = `You cannot create a role with level ${formData.level} when your level is ${userHighest}.`;
        }
        break;
      }
      default: break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please fix the errors before proceeding.' });
    }
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStep = (step) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (!canCreateRoles) {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'You cannot create roles.' });
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
            Swal.fire({ icon: 'success', title: 'Role Created!', timer: 2000, showConfirmButton: false })
              .then(() => router.visit(route('backend.roles.index')));
          },
          onError: (error) => {
            if (error.response?.data?.errors) {
              setErrors(error.response.data.errors);
              setCurrentStep(1);
              Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please check the form.' });
            } else {
              Swal.fire({ icon: 'error', title: 'Creation Failed', text: error.response?.data?.message || 'Failed to create role.' });
            }
            setIsSubmitting(false);
          },
          onFinish: () => setIsSubmitting(false),
        });
      }
    });
  };

  const handleBack = () => {
    if (isDirty) {
      Swal.fire({
        title: 'Discard changes?',
        text: 'You have unsaved changes that will be lost.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, discard',
        cancelButtonText: 'Stay',
      }).then((res) => {
        if (res.isConfirmed) router.visit(route('backend.roles.index'));
      });
    } else {
      router.visit(route('backend.roles.index'));
    }
  };

  const filteredPermissions = canAssignAllPermissions
    ? permissions
    : permissions.filter(p => hasAnyPermission([p.slug]));

  const CurrentStepComponent = steps[currentStep - 1].component;
  const isReviewStep = currentStep === steps.length;
  const progress = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

  // ✅ Pass props directly to the component
  const getStepProps = () => {
    const baseProps = {
      formData,
      errors,
      setFormData: updateForm,
      permissions: filteredPermissions,
      existingLevels,
      accessLevels,
      onNavigateToStep: navigateToStep,
      canAssignAllPermissions,
    };

    // For BasicInfoStep, explicitly set isDefaultRole and isEdit
    if (currentStep === 1) {
      return {
        ...baseProps,
        isDefaultRole: false,
        isEdit: false,
      };
    }

    return baseProps;
  };

  const stepProps = getStepProps();

  return (
    <AuthenticatedLayout>
      <Head title="Create Role" />
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center">
                <FaShieldAlt className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Create New Role
                </h1>
                <p className="text-sm text-gray-500">Define role details, permissions, and access levels</p>
              </div>
            </div>
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Back to Roles</span>
            </button>
          </div>

          {!canAssignAllPermissions && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Limited Permission Mode</p>
                <p className="text-xs text-yellow-700">You can only assign permissions that you personally have.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="w-full h-1 bg-gray-200">
              <div className="h-full bg-purple-600 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <div className="border-b border-gray-100 bg-gray-50/50 px-8 pt-6">
              <StepIndicator currentStep={currentStep} steps={steps} />
            </div>

            <div className="px-8 py-8">
              <CurrentStepComponent {...stepProps} />
            </div>

            <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-6">
              <StepNavigation
                currentStep={currentStep}
                totalSteps={steps.length}
                onNext={isReviewStep ? handleSubmit : nextStep}
                onPrevious={previousStep}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isValid={true}
                isReviewStep={isReviewStep}
              />
            </div>
          </div>

          {isSubmitting && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 flex flex-col items-center shadow-2xl">
                <FaSpinner className="animate-spin text-purple-600" size={48} />
                <p className="mt-4 text-gray-700 font-medium">Creating role...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}