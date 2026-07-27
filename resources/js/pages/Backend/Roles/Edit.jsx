// resources/js/pages/Backend/Roles/Edit.jsx

import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { useAuth } from '../../../hooks/useAuth';
import { FaArrowLeft, FaShieldAlt, FaLock, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { ReviewStep } from '../../../components/RoleSteps/ReviewStep';
import { StepIndicator } from '../../../components/RoleSteps/StepIndicator';
import { BasicInfoStep } from '../../../components/RoleSteps/BasicInfoStep';
import { StepNavigation } from '../../../components/RoleSteps/StepNavigation';
import { PermissionsStep } from '../../../components/RoleSteps/PermissionsStep';
import { ModuleAccessStep } from '../../../components/RoleSteps/ModuleAccessStep';
import Swal from 'sweetalert2';

export default function Edit({
  role: initialRole,
  permissions,
  grantedPermissionIds,
  moduleAccess: initialModuleAccess,
  existingLevels,
  accessLevels,
}) {
  const { user: currentUser, hasAnyPermission, hasRole } = useAuth();
  const isSuperAdmin = hasRole('super-admin');
  const canEditRoles = hasAnyPermission(['roles.update', 'roles.manage']);
  const canAssignAllPermissions = isSuperAdmin || hasAnyPermission(['roles.assign_all_permissions', 'roles.manage']);
  const canEditDefaultRole = isSuperAdmin || !initialRole.is_default;

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const steps = [
    { id: 1, title: 'Basic Info', component: BasicInfoStep },
    { id: 2, title: 'Permissions', component: PermissionsStep },
    { id: 3, title: 'Module Access', component: ModuleAccessStep },
    { id: 4, title: 'Review', component: ReviewStep },
  ];

  const [formData, setFormData] = useState({
    name: initialRole.name || '',
    slug: initialRole.slug || '',
    description: initialRole.description || '',
    level: initialRole.level || 60,
    is_default: initialRole.is_default || false,
    is_active: initialRole.is_active ?? true,
    permissions: grantedPermissionIds || [],
    module_access: initialModuleAccess || [],
  });

  const isDefaultRole = initialRole.is_default;

  useEffect(() => {
    const originalPermissions = grantedPermissionIds || [];
    const originalModuleAccess = initialModuleAccess || [];
    const permChanged = JSON.stringify([...formData.permissions].sort()) !== JSON.stringify([...originalPermissions].sort());
    const moduleChanged = JSON.stringify(formData.module_access) !== JSON.stringify(originalModuleAccess);
    const basicChanged =
      formData.name !== initialRole.name ||
      formData.slug !== initialRole.slug ||
      formData.description !== initialRole.description ||
      formData.level !== initialRole.level ||
      formData.is_default !== initialRole.is_default ||
      formData.is_active !== initialRole.is_active;
    setHasChanges(permChanged || moduleChanged || basicChanged);
  }, [formData, initialRole, grantedPermissionIds, initialModuleAccess]);

  if (!canEditRoles) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to edit roles.</p>
            <button onClick={() => router.visit(route('backend.roles.show', initialRole.id))} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Back to Role Details
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (initialRole.is_default && !canEditDefaultRole) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaLock className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Cannot Edit Default Role</h2>
            <p className="text-gray-500 mt-2">Default roles can only be edited by super-admins.</p>
            <button onClick={() => router.visit(route('backend.roles.show', initialRole.id))} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Back to Role Details
            </button>
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
        if (!isDefaultRole || isSuperAdmin) {
          if (!formData.slug?.trim() || formData.slug.trim().length < 2) {
            newErrors.slug = 'Slug must be at least 2 characters';
          } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = 'Invalid slug format';
          }
          if (existingLevels?.some(role => role.slug === formData.slug && role.id !== initialRole.id)) {
            newErrors.slug = 'Slug already in use by another role.';
          }
        }
        if (!formData.level) {
          newErrors.level = 'Please select a level';
        } else if (formData.level < 1 || formData.level > 100) {
          newErrors.level = 'Level must be between 1 and 100';
        }
        const userHighest = getUserHighestLevel();
        if (formData.level >= userHighest && userHighest < 100) {
          newErrors.level = `You cannot set level ≥ your own level (${userHighest}).`;
        }
        if (userHighest === 100 && formData.level >= 100) {
          newErrors.level = `Max role level for super admin is 99.`;
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
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please fix errors before proceeding.' });
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
    if (!validateStep()) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please fix the errors.' });
      return;
    }
    if (!hasChanges) {
      Swal.fire({ icon: 'info', title: 'No Changes', text: 'You haven\'t made any changes.' });
      return;
    }
    if (!canEditRoles) {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'You cannot edit roles.' });
      return;
    }
    if (isDefaultRole && !canEditDefaultRole) {
      Swal.fire({ icon: 'error', title: 'Cannot Edit Default Role', text: 'Default roles can only be edited by super-admins.' });
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
            Swal.fire({ icon: 'success', title: 'Role Updated!', timer: 2000, showConfirmButton: false })
              .then(() => router.visit(route('backend.roles.show', initialRole.id)));
          },
          onError: (error) => {
            if (error.response?.data?.errors) {
              setErrors(error.response.data.errors);
              setCurrentStep(1);
              Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please check the form.' });
            } else {
              Swal.fire({ icon: 'error', title: 'Update Failed', text: error.response?.data?.message || 'Failed to update role.' });
            }
            setIsSubmitting(false);
          },
          onFinish: () => setIsSubmitting(false),
        });
      }
    });
  };

  const handleBack = () => {
    if (hasChanges) {
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
        if (res.isConfirmed) router.visit(route('backend.roles.show', initialRole.id));
      });
    } else {
      router.visit(route('backend.roles.show', initialRole.id));
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;
  const isReviewStep = currentStep === steps.length;

  const filteredPermissions = canAssignAllPermissions
    ? permissions
    : permissions.filter(p => hasAnyPermission([p.slug]));

  const filteredFormDataPermissions = canAssignAllPermissions
    ? formData.permissions
    : formData.permissions.filter(permId => {
        const p = permissions.find(pp => pp.id === permId);
        return p && hasAnyPermission([p.slug]);
      });

  const basicInfoProps = {
    formData: { ...formData, permissions: filteredFormDataPermissions },
    errors,
    setFormData,
    existingLevels,
    isEdit: true,
    isDefaultRole,
    originalName: initialRole.name,
    canEditSlug: !isDefaultRole || isSuperAdmin,
    canEditName: !isDefaultRole || isSuperAdmin,
    isSuperAdmin,
  };

  const permissionsProps = {
    formData: { ...formData, permissions: filteredFormDataPermissions },
    setFormData,
    permissions: filteredPermissions,
    isEdit: true,
    canAssignAllPermissions,
  };

  const moduleAccessProps = {
    formData: { ...formData, permissions: filteredFormDataPermissions },
    setFormData,
    permissions: filteredPermissions,
    accessLevels,
    isEdit: true,
    canAssignAllPermissions,
  };

  const reviewProps = {
    formData: { ...formData, permissions: filteredFormDataPermissions },
    permissions: filteredPermissions,
    accessLevels,
    onNavigateToStep: navigateToStep,
    isEdit: true,
    originalRole: initialRole,
    grantedPermissionIds,
    initialModuleAccess,
    hasChanges,
  };

  const stepPropsMap = {
    1: basicInfoProps,
    2: permissionsProps,
    3: moduleAccessProps,
    4: reviewProps,
  };

  return (
    <AuthenticatedLayout>
      <Head title={`Edit: ${initialRole.name}`} />
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto">
          <div className="flex justify-center items-center gap-5 mb-6">
            <div className="w-16 h-16 bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg flex items-center justify-center">
              <FaShieldAlt className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Edit Role
              </h1>
              <p className="text-sm text-gray-500">Update "{initialRole.name}" role details</p>
            </div>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <button onClick={handleBack} className="group flex items-center gap-2 text-gray-500 hover:text-gray-700 transition">
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" size={14} />
              <span className="text-sm">Back to Role Details</span>
            </button>
            {hasChanges && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs shadow-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Unsaved changes
              </div>
            )}
          </div>

          {!canAssignAllPermissions && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Limited Permission Mode</p>
                <p className="text-xs text-yellow-700">You can only assign permissions you have. Existing permissions you don't have access to will be preserved.</p>
              </div>
            </div>
          )}

          {isDefaultRole && (
            <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FaInfoCircle className="text-amber-500 mt-0.5" size={14} />
                <div>
                  <p className="text-xs text-amber-700">
                    <strong className="font-medium">Default Role:</strong> This is a default role.
                    {!canEditDefaultRole ? ' Only super-admins can edit default roles.' : ' Some basic fields should be edited with caution.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="border-b border-gray-100 bg-gray-50/50 px-8 pt-6">
              <StepIndicator currentStep={currentStep} steps={steps} />
            </div>
            <div className="px-8 py-8">
              <CurrentStepComponent {...stepPropsMap[currentStep]} />
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
                isEdit={true}
              />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}