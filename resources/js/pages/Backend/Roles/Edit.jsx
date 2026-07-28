// resources/js/pages/Backend/Roles/Edit.jsx

import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import { useAuth } from '../../../hooks/useAuth';
import {
  FaArrowLeft, FaShieldAlt, FaExclamationTriangle, FaSpinner,
  FaCheckCircle, FaTimesCircle, FaMagic, FaInfoCircle,
  FaKey, FaDatabase, FaSearch, FaLock, FaChevronDown, FaChevronUp,
} from 'react-icons/fa';
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
  const canViewRoles = hasAnyPermission(['roles.view', 'roles.manage']);
  const canEditRoles = hasAnyPermission(['roles.update', 'roles.manage']);
  const canAssignAllPermissions = isSuperAdmin || hasAnyPermission(['roles.assign_all_permissions', 'roles.manage']);

  // ---- Permission checks ----
  const NON_EDITABLE_ROLE_SLUGS = ['super-admin', 'admin', 'employer-admin', 'job-seeker', 'employer', 'job_seeker'];
  const isRoleProtected = (role) => {
    if (!role) return false;
    if (role.is_default) return true;
    return NON_EDITABLE_ROLE_SLUGS.includes(role.slug);
  };

    // ---- State ----
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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [permSearch, setPermSearch] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // ---- Detect changes ----
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

  const canEditSpecificRole = () => {
    if (!canEditRoles) return false;
    if (isSuperAdmin) return true;
    if (initialRole.level >= (currentUser?.highest_role_level || 100)) return false;
    return !isRoleProtected(initialRole);
  };

  // If user can't edit at all, show modal and redirect
  if (!canEditRoles) {
    Swal.fire({
      icon: 'error',
      title: 'Access Denied',
      text: 'You do not have permission to edit roles.',
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Go Back',
      allowOutsideClick: false,
    }).then(() => {
      if (canViewRoles) router.visit(route('backend.roles.show', initialRole.id));
      else router.visit('/');
    });
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-gray-400" />
            <p className="mt-4 text-gray-500">Checking permissions...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // If user can't edit this specific role, show modal and redirect
  if (!canEditSpecificRole()) {
    let reason = '';
    if (initialRole.is_default) reason = 'Default roles cannot be edited.';
    else if (isRoleProtected(initialRole)) reason = 'System-protected roles cannot be edited.';
    else if (initialRole.level >= (currentUser?.highest_role_level || 100)) {
      reason = `You cannot edit a role with level ${initialRole.level} because your own level is ${currentUser?.highest_role_level || 100}.`;
    } else reason = 'You do not have permission to edit this role.';
    Swal.fire({
      icon: 'error',
      title: 'Cannot Edit Role',
      text: reason,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'View Role Details',
      allowOutsideClick: false,
    }).then(() => {
      router.visit(route('backend.roles.show', initialRole.id));
    });
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-gray-400" />
            <p className="mt-4 text-gray-500">Redirecting...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }



  // ---- Helpers ----
  const getUserHighestLevel = () => {
    if (!currentUser) return 100;
    if (currentUser.highest_role_level) return currentUser.highest_role_level;
    if (currentUser.roles?.length) {
      return Math.max(...currentUser.roles.map(r => r.level || 0));
    }
    return 100;
  };

  const getLevelRecommendation = () => {
    const name = formData.name.toLowerCase();
    if (name.includes('admin') || name.includes('super') || name.includes('owner')) return 10;
    if (name.includes('manager') || name.includes('lead') || name.includes('head')) return 30;
    if (name.includes('senior')) return 50;
    if (name.includes('junior') || name.includes('intern')) return 80;
    return 60;
  };

  // ---- Handlers ----
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const generateSlug = () => {
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const toggleModule = (moduleName) => {
    setExpandedModules(prev => ({ ...prev, [moduleName]: !prev[moduleName] }));
  };

  const expandAll = () => {
    const all = {};
    permissions.forEach(m => { all[m.module] = true; });
    setExpandedModules(all);
  };

  const collapseAll = () => setExpandedModules({});

  const handlePermissionToggle = (permId) => {
    setFormData(prev => {
      const perms = prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: perms };
    });
  };

  const selectAllModule = (modulePermissions) => {
    const allIds = modulePermissions.map(p => p.id);
    setFormData(prev => ({
      ...prev,
      permissions: [...new Set([...prev.permissions, ...allIds])],
    }));
  };

  const deselectAllModule = (modulePermissions) => {
    const allIds = modulePermissions.map(p => p.id);
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.filter(id => !allIds.includes(id)),
    }));
  };

  const handleModuleAccessChange = (moduleName, accessLevel) => {
    setFormData(prev => {
      const existingIndex = prev.module_access.findIndex(m => m.module === moduleName);
      const newModuleAccess = [...prev.module_access];
      if (existingIndex >= 0) {
        if (accessLevel === 'no_access') {
          newModuleAccess.splice(existingIndex, 1);
        } else {
          newModuleAccess[existingIndex] = { module: moduleName, access_level: accessLevel };
        }
      } else if (accessLevel !== 'no_access') {
        newModuleAccess.push({ module: moduleName, access_level: accessLevel });
      }
      return { ...prev, module_access: newModuleAccess };
    });
  };

  const getModuleAccessLevel = (moduleName) => {
    const found = formData.module_access.find(m => m.module === moduleName);
    return found?.access_level || 'no_access';
  };

  const getAccessLevelColor = (level) => {
    switch (level) {
      case 'manage': return 'text-red-600 bg-red-50 border-red-200';
      case 'write': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'read': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const getAccessLevelIcon = (level) => {
    switch (level) {
      case 'manage': return '🔒';
      case 'write': return '✏️';
      case 'read': return '👁️';
      default: return '🚫';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Role name must be at least 2 characters';
    }
    if (!initialRole.is_default || isSuperAdmin) {
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
    if (userHighest === 100 && formData.level >= 100) {
      newErrors.level = 'Max role level for super admin is 99.';
    } else if (userHighest < 100 && formData.level >= userHighest) {
      newErrors.level = `You cannot set level ≥ your own level (${userHighest}).`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please fix the errors.' });
      return;
    }
    if (!hasChanges) {
      Swal.fire({ icon: 'info', title: 'No Changes', text: 'You haven\'t made any changes.' });
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
      }).then(res => {
        if (res.isConfirmed) router.visit(route('backend.roles.show', initialRole.id));
      });
    } else {
      router.visit(route('backend.roles.show', initialRole.id));
    }
  };

  // ---- Filter permissions ----
  const filteredPermissions = canAssignAllPermissions
    ? permissions
    : permissions.filter(p => hasAnyPermission([p.slug]));

  const filteredFormDataPermissions = canAssignAllPermissions
    ? formData.permissions
    : formData.permissions.filter(permId => {
      const p = permissions.find(pp => pp.id === permId);
      return p && hasAnyPermission([p.slug]);
    });

  // ---- Render ----
  return (
    <AuthenticatedLayout>
      <Head title={`Edit: ${initialRole.name}`} />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className=" mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-5 mb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg flex items-center justify-center">
                <FaShieldAlt className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Role</h1>
                <p className="text-sm text-gray-500">Update "{initialRole.name}" role details</p>
              </div>
            </div>
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Back to Details</span>
            </button>
          </div>

          {/* Warning banners */}
          {!canAssignAllPermissions && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Limited Permission Mode</p>
                <p className="text-xs text-yellow-700">You can only assign permissions you have. Existing permissions you don't have access to will be preserved.</p>
              </div>
            </div>
          )}

          {initialRole.is_default && (
            <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FaInfoCircle className="text-amber-500 mt-0.5" size={14} />
                <div>
                  <p className="text-xs text-amber-700">
                    <strong className="font-medium">Default Role:</strong> This is a default role. Some basic fields should be edited with caution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasChanges && (
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs shadow-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              Unsaved changes
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-8 space-y-8">
              {/* ---- Basic Info Section ---- */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaShieldAlt className="text-amber-600" /> Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={generateSlug}
                      placeholder="e.g., Content Manager"
                      disabled={initialRole.is_default && !isSuperAdmin}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${errors.name ? 'border-red-500' : 'border-gray-300'} ${(initialRole.is_default && !isSuperAdmin) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    <p className="mt-1 text-xs text-gray-500">Minimum 2 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-mono">/</span>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="e.g., content-manager"
                        disabled={initialRole.is_default && !isSuperAdmin}
                        className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm ${errors.slug ? 'border-red-500' : 'border-gray-300'} ${(initialRole.is_default && !isSuperAdmin) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
                    <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, hyphens only.</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Access Level <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, level: getLevelRecommendation() }))}
                      className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                    >
                      <FaMagic size={10} /> Suggest
                    </button>
                  </div>
                  <div className="flex gap-4 items-center">
                    <input
                      type="number"
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      className={`w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-center ${errors.level ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    <div className="flex-1">
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-linear-to-r from-amber-500 to-orange-500 rounded-full h-2 transition-all duration-300"
                            style={{ width: `${(formData.level / 100) * 100}%` }}
                          />
                        </div>
                        <div className="absolute -top-1 left-0 right-0 flex justify-between px-1">
                          {[0, 25, 50, 75, 100].map(m => (
                            <div key={m} className="relative">
                              <div className="w-0.5 h-3 bg-gray-300" />
                              <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400">{m}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {errors.level && <p className="mt-1 text-sm text-red-500">{errors.level}</p>}
                  <p className="mt-2 text-xs text-gray-500">Lower number = higher access (1=highest, 100=lowest)</p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the role responsibilities..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">{formData.description?.length || 0}/500 characters</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.is_active ? 'bg-green-100' : 'bg-gray-200'}`}>
                        {formData.is_active ? <FaCheckCircle className="text-green-600" size={18} /> : <FaTimesCircle className="text-gray-400" size={18} />}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Active</span>
                        <p className="text-xs text-gray-400">Inactive roles cannot be assigned</p>
                      </div>
                    </div>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                  </label>
                  {/* <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.is_default ? 'bg-purple-100' : 'bg-gray-200'}`}>
                        <FaShieldAlt className={formData.is_default ? 'text-purple-600' : 'text-gray-400'} size={18} />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Default Role</span>
                        <p className="text-xs text-gray-400">Auto-assigned to new users</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={formData.is_default}
                      onChange={handleChange}
                      disabled={initialRole.is_default && !isSuperAdmin}
                      className={`w-5 h-5 text-purple-600 rounded focus:ring-purple-500 ${(initialRole.is_default && !isSuperAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </label> */}
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* ---- Permissions Section ---- */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FaKey className="text-amber-600" /> Permissions
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={expandAll} className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">Expand All</button>
                    <button onClick={collapseAll} className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">Collapse All</button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      value={permSearch}
                      onChange={e => setPermSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${showSelectedOnly ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {showSelectedOnly ? <FaCheckCircle size={14} /> : <FaKey size={14} />}
                    {showSelectedOnly ? 'Showing Selected' : 'Show All'}
                  </button>
                </div>

                {filteredPermissions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No permissions available.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredPermissions.map(module => {
                      const selectedCount = module.permissions.filter(p => filteredFormDataPermissions.includes(p.id)).length;
                      const allSelected = selectedCount === module.permissions.length && module.permissions.length > 0;
                      const someSelected = selectedCount > 0 && selectedCount < module.permissions.length;
                      // FIX: default to collapsed (false) if not in expandedModules
                      const isExpanded = expandedModules[module.module] ?? false;

                      return (
                        <div key={module.module} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center justify-between p-4">
                              <button onClick={() => toggleModule(module.module)} className="flex items-center gap-3 flex-1 text-left">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                  <FaDatabase className="text-amber-600" size={14} />
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-900">{module.module}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {allSelected && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">All selected</span>}
                                    {someSelected && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{selectedCount}/{module.permissions.length} selected</span>}
                                    {!someSelected && !allSelected && selectedCount === 0 && <span className="text-xs text-gray-400">None selected</span>}
                                  </div>
                                </div>
                              </button>
                              <div className="flex items-center gap-2">
                                {!allSelected && <button onClick={() => selectAllModule(module.permissions)} className="text-xs text-amber-600 hover:text-amber-800 px-2 py-1 rounded hover:bg-amber-50">Select All</button>}
                                {allSelected && <button onClick={() => deselectAllModule(module.permissions)} className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50">Deselect All</button>}
                                <button onClick={() => toggleModule(module.module)} className="p-1 hover:bg-gray-200 rounded-lg">
                                  {isExpanded ? <FaChevronUp className="text-gray-400" size={14} /> : <FaChevronDown className="text-gray-400" size={14} />}
                                </button>
                              </div>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {module.permissions.map(permission => {
                                const isChecked = filteredFormDataPermissions.includes(permission.id);
                                return (
                                  <label key={permission.id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handlePermissionToggle(permission.id)}
                                      className="mt-0.5 w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">{permission.action}</span>
                                      </div>
                                      {permission.description && <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>}
                                      <p className="text-xs text-gray-400 font-mono mt-0.5">{permission.slug}</p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <hr className="border-gray-200" />

              {/* ---- Module Access Section ---- */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaLock className="text-amber-600" /> Module Access Levels
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl mb-4">
                  {accessLevels.map(level => (
                    <div key={level.value} className="text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getAccessLevelColor(level.value)} mb-1`}>
                        <span className="text-sm">{getAccessLevelIcon(level.value)}</span>
                      </div>
                      <div className="text-xs font-medium text-gray-700">{level.label}</div>
                      <div className="text-xs text-gray-400">
                        {level.value === 'manage' && 'Full control'}
                        {level.value === 'write' && 'Create & edit'}
                        {level.value === 'read' && 'View only'}
                        {level.value === 'no_access' && 'No access'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700">Module Access Configuration</h3>
                    <p className="text-xs text-gray-500">Set access level for each module (overrides individual permissions)</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {filteredPermissions.map(module => {
                      const currentLevel = getModuleAccessLevel(module.module);
                      return (
                        <div key={module.module} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{module.module}</span>
                              <span className="text-xs text-gray-400 ml-2">({module.permissions.length} permissions)</span>
                              <p className="text-xs text-gray-500 mt-0.5">Set access level for all {module.module} permissions</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={currentLevel}
                                onChange={e => handleModuleAccessChange(module.module, e.target.value)}
                                className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 ${getAccessLevelColor(currentLevel)}`}
                              >
                                {accessLevels.map(l => (
                                  <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                              </select>
                              {currentLevel !== 'no_access' && (
                                <div className={`text-xs px-2 py-1 rounded-full ${getAccessLevelColor(currentLevel)}`}>
                                  {getAccessLevelIcon(currentLevel)} {currentLevel}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 bg-amber-50 rounded-lg p-4 flex items-start gap-3">
                  <FaInfoCircle className="text-amber-500 mt-0.5" size={18} />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">How Module Access Works:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>Manage:</strong> Full control – view, create, edit, delete</li>
                      <li><strong>Write:</strong> View, create, edit (cannot delete)</li>
                      <li><strong>Read:</strong> View only</li>
                      <li><strong>No Access:</strong> Cannot access this module</li>
                      <li>Module access overrides individual permissions</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* ---- Review & Submit ---- */}
              <section className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="text-yellow-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Please review carefully</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Once updated, changes will affect all users with this role immediately.
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !hasChanges}
                  className={`px-6 py-2.5 rounded-lg transition shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 ${
                    !hasChanges || isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-linear-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
                  }`}
                >
                  {isSubmitting ? <FaSpinner className="animate-spin" size={16} /> : <FaCheckCircle size={16} />}
                  {isSubmitting ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}