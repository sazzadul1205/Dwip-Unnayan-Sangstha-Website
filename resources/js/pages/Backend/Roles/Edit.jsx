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
  FaSpinner,
} from 'react-icons/fa';

// SweetAlert
import Swal from 'sweetalert2';

export default function Edit({ role: initialRole, permissions, grantedPermissionIds, moduleAccess: initialModuleAccess, existingLevels, accessLevels }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [expandedModules, setExpandedModules] = useState({});

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Info
    name: initialRole.name || '',
    slug: initialRole.slug || '',
    description: initialRole.description || '',
    level: initialRole.level || '',
    is_default: initialRole.is_default || false,
    is_active: initialRole.is_active ?? true,

    // Permissions
    permissions: grantedPermissionIds || [],

    // Module Access
    module_access: initialModuleAccess || [],
  });

  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

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

  // Toggle module expansion
  const toggleModule = (moduleName) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId];

      return { ...prev, permissions };
    });

    // Clear error for this field
    if (errors.permissions) {
      setErrors(prev => ({ ...prev, permissions: undefined }));
    }
  };

  // Handle module access level change
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

  // Get current module access level
  const getModuleAccessLevel = (moduleName) => {
    const moduleAccess = formData.module_access.find(m => m.module === moduleName);
    return moduleAccess?.access_level || 'no_access';
  };

  // Handle basic input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Generate slug from name
  const generateSlug = () => {
    if (formData.name && !hasUserEditedSlug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const [hasUserEditedSlug, setHasUserEditedSlug] = useState(false);

  const handleSlugChange = (e) => {
    setHasUserEditedSlug(true);
    handleChange(e);
  };

  // Permission filters
  const [permissionFilters, setPermissionFilters] = useState({
    search: '',
    showSelectedOnly: false,
  });

  // Filter permissions based on search
  const filteredPermissions = permissions.filter(module => {
    if (permissionFilters.showSelectedOnly) {
      const hasSelectedPermissions = module.permissions.some(p =>
        formData.permissions.includes(p.id)
      );
      if (!hasSelectedPermissions) return false;
    }

    if (permissionFilters.search) {
      const searchLower = permissionFilters.search.toLowerCase();
      if (module.module.toLowerCase().includes(searchLower)) return true;
      return module.permissions.some(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.slug.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Validation
  const validateForm = () => {
    const newErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Smart back button
  const handleBack = () => {
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
          if (window.history.length > 1) {
            window.history.back();
          } else {
            router.visit(route('backend.roles.index'));
          }
        }
      });
    } else {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        router.visit(route('backend.roles.index'));
      }
    }
  };

  // Submit form
  const handleSubmit = () => {
    if (!validateForm()) {
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
        text: 'You haven\'t made any changes to the role.',
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
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Update Role',
      cancelButtonText: 'Review',
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

  // Get level recommendation
  const getLevelRecommendation = () => {
    const name = formData.name.toLowerCase();
    if (name.includes('admin') || name.includes('super') || name.includes('owner')) return 10;
    if (name.includes('manager') || name.includes('lead') || name.includes('head')) return 30;
    if (name.includes('senior')) return 50;
    if (name.includes('junior') || name.includes('intern')) return 80;
    return 60;
  };

  const applyLevelRecommendation = () => {
    setFormData(prev => ({ ...prev, level: getLevelRecommendation() }));
  };

  const isDefaultRole = initialRole.is_default;

  return (
    <AuthenticatedLayout>
      <Head title={`Edit: ${initialRole.name}`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header with Back Button */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBack}
                className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" size={14} />
                <span className="text-sm">Back</span>
              </button>
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Edit Role
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Update "{initialRole.name}"
              </p>
              {hasChanges && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  Unsaved changes
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Information */}
            <div className="lg:col-span-1 space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 bg-linear-to-r from-gray-800 to-gray-900">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <FaShieldAlt size={16} />
                    Basic Information
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {/* Role Name */}
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
                      placeholder="e.g., Content Manager, Sales Lead"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      disabled={isDefaultRole}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      placeholder="e.g., content-manager"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono text-sm ${errors.slug ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      disabled={isDefaultRole}
                    />
                    {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
                    <p className="text-xs text-gray-400 mt-1">Used for URL and code references.</p>
                  </div>

                  {/* Level */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Access Level <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={applyLevelRecommendation}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <FaPlus size={10} />
                        Suggest
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        placeholder="1-100"
                        min="1"
                        max="100"
                        className={`w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${errors.level ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                      />
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                            style={{ width: `${(formData.level / 100) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {errors.level && <p className="text-xs text-red-500 mt-1">{errors.level}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      Lower numbers = higher access (1=highest, 100=lowest)
                    </p>

                    {/* Existing Levels Reference */}
                    {existingLevels && existingLevels.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 mb-2">Existing Role Levels:</p>
                        <div className="flex flex-wrap gap-2">
                          {existingLevels.slice(0, 6).map(role => (
                            <span key={role.level} className="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-600">
                              Lvl {role.level}: {role.name}
                            </span>
                          ))}
                          {existingLevels.length > 6 && (
                            <span className="text-xs text-gray-400">+{existingLevels.length - 6} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Describe the role and its responsibilities..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.description?.length || 0}/500 characters
                    </p>
                  </div>

                  {/* Status Toggles */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {formData.is_active ? <FaCheckCircle className="text-green-600" size={16} /> : <FaTimesCircle className="text-gray-400" size={16} />}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Active</span>
                          <p className="text-xs text-gray-400">Inactive roles cannot be assigned to users</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer opacity-75">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.is_default ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          <FaShieldAlt className={formData.is_default ? 'text-purple-600' : 'text-gray-400'} size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Default Role</span>
                          <p className="text-xs text-gray-400">
                            {isDefaultRole
                              ? 'Default roles cannot be changed'
                              : 'Auto-assigned to new users (only one default role allowed)'}
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        name="is_default"
                        checked={formData.is_default}
                        onChange={handleChange}
                        disabled={isDefaultRole}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Module Access Card */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 bg-linear-to-r from-indigo-600 to-indigo-700">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <FaLock size={16} />
                    Module Access Levels
                  </h2>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-3">
                    Define access levels for each module. This overrides individual permissions.
                  </p>
                  <div className="space-y-3 max-h-100 overflow-y-auto">
                    {permissions.map(module => (
                      <div key={module.module} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{module.module}</span>
                          <select
                            value={getModuleAccessLevel(module.module)}
                            onChange={(e) => handleModuleAccessChange(module.module, e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                          >
                            {accessLevels.map(level => (
                              <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    {permissions.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No modules available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Permissions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 bg-linear-to-r from-blue-600 to-blue-700">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <FaKey size={16} />
                      Permissions
                    </h2>
                    <div className="flex gap-3">
                      {/* Search */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search permissions..."
                          value={permissionFilters.search}
                          onChange={(e) => setPermissionFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-8 pr-3 py-1.5 text-sm bg-white/20 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <FaDatabase className="absolute left-2.5 top-2 text-white/60" size={12} />
                      </div>
                      <button
                        onClick={() => setPermissionFilters(prev => ({ ...prev, showSelectedOnly: !prev.showSelectedOnly }))}
                        className={`px-3 py-1.5 text-sm rounded-lg transition ${permissionFilters.showSelectedOnly
                            ? 'bg-green-500 text-white'
                            : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                      >
                        {permissionFilters.showSelectedOnly ? 'Showing Selected' : 'Show All'}
                      </button>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm mt-2">
                    {formData.permissions.length} permission(s) selected
                  </p>
                </div>

                <div className="p-6 max-h-150 overflow-y-auto">
                  {filteredPermissions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <FaKey className="text-gray-400" size={24} />
                      </div>
                      <p className="text-gray-500">No permissions found</p>
                      {permissionFilters.search && (
                        <button
                          onClick={() => setPermissionFilters(prev => ({ ...prev, search: '' }))}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPermissions.map(module => {
                        const selectedCount = module.permissions.filter(p => formData.permissions.includes(p.id)).length;
                        const isExpanded = expandedModules[module.module] !== false;

                        return (
                          <div key={module.module} className="border border-gray-200 rounded-xl overflow-hidden">
                            {/* Module Header */}
                            <button
                              onClick={() => toggleModule(module.module)}
                              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <FaDatabase className="text-blue-600" size={14} />
                                </div>
                                <div className="text-left">
                                  <span className="font-semibold text-gray-900">{module.module}</span>
                                  {selectedCount > 0 && (
                                    <span className="ml-2 text-xs text-green-600">
                                      ({selectedCount}/{module.permissions.length} selected)
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isExpanded ? <FaChevronUp className="text-gray-400" size={14} /> : <FaChevronDown className="text-gray-400" size={14} />}
                            </button>

                            {/* Module Permissions */}
                            {isExpanded && (
                              <div className="p-4 space-y-2">
                                {/* Select All for Module */}
                                <div className="pb-2 border-b border-gray-100 mb-2">
                                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600">
                                    <input
                                      type="checkbox"
                                      checked={selectedCount === module.permissions.length && module.permissions.length > 0}
                                      onChange={() => {
                                        const allIds = module.permissions.map(p => p.id);
                                        const allSelected = selectedCount === module.permissions.length;
                                        setFormData(prev => ({
                                          ...prev,
                                          permissions: allSelected
                                            ? prev.permissions.filter(id => !allIds.includes(id))
                                            : [...new Set([...prev.permissions, ...allIds])]
                                        }));
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    Select All ({module.permissions.length})
                                  </label>
                                </div>

                                {/* Permission Items */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {module.permissions.map(permission => (
                                    <label
                                      key={permission.id}
                                      className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${formData.permissions.includes(permission.id)
                                          ? 'bg-blue-50 border border-blue-200'
                                          : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.permissions.includes(permission.id)}
                                        onChange={() => handlePermissionToggle(permission.id)}
                                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">
                                            {permission.action}
                                          </span>
                                        </div>
                                        {permission.description && (
                                          <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">{permission.slug}</p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Selected Permissions:</span>
                      <span className="font-semibold text-blue-600">{formData.permissions.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleBack}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !hasChanges}
                  className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <FaSpinner className="animate-spin" size={14} />
                  ) : (
                    <FaSave size={14} />
                  )}
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