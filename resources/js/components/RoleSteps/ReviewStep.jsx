// resources/js/components/RoleSteps/ReviewStep.jsx

import { StepWrapper } from './StepWrapper';
import {
  FaShieldAlt,
  FaKey,
  FaLock,
  FaPen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaUserTag,
  FaLayerGroup,
} from 'react-icons/fa';

export const ReviewStep = ({ formData, permissions, accessLevels, onNavigateToStep }) => {

  // Get permission names for display
  const getPermissionNames = () => {
    const allPermissions = permissions.flatMap(m => m.permissions);
    return allPermissions
      .filter(p => formData.permissions.includes(p.id))
      .map(p => p.name);
  };

  // Get module access summary
  const getModuleAccessSummary = () => {
    const modules = permissions.map(m => m.module);
    return modules.map(module => {
      const access = formData.module_access.find(m => m.module === module);
      return {
        module,
        level: access?.access_level || 'no_access',
      };
    });
  };

  const getAccessLevelLabel = (level) => {
    const found = accessLevels.find(l => l.value === level);
    return found?.label || 'No Access';
  };

  const getAccessLevelColor = (level) => {
    switch (level) {
      case 'manage': return 'text-red-600 bg-red-100';
      case 'write': return 'text-orange-600 bg-orange-100';
      case 'read': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const InfoSection = ({ title, icon: Icon, children, step }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon className="text-purple-600" size={16} />
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => onNavigateToStep(step)}
          className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1 transition-colors"
        >
          <FaPen size={12} />
          Edit
        </button>
      </div>
      <div className="p-4 bg-white">
        {children}
      </div>
    </div>
  );

  const InfoRow = ({ label, value, badge = null }) => (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-gray-900">
        {value || <span className="text-gray-400">Not provided</span>}
        {badge && <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${badge.color}`}>{badge.text}</span>}
      </dd>
    </div>
  );

  const selectedPermissions = getPermissionNames();
  const moduleAccessSummary = getModuleAccessSummary();
  const hasModuleAccessConfig = formData.module_access.length > 0;

  return (
    <StepWrapper
      title="Review & Create"
      description="Review all information before creating the role"
      isActive={true}
      stepNumber={4}
    >
      <div className="space-y-6">
        {/* Warning Message */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-yellow-500 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-yellow-800">Please review carefully</p>
              <p className="text-xs text-yellow-700 mt-1">
                Once created, this role can be assigned to users. You can edit the role later,
                but changes will affect all users with this role.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <InfoSection title="Basic Information" icon={FaShieldAlt} step={1}>
          <dl className="divide-y divide-gray-100">
            <InfoRow label="Role Name" value={formData.name} />
            <InfoRow label="Slug" value={formData.slug} />
            <InfoRow
              label="Access Level"
              value={`Level ${formData.level} (${formData.level <= 30 ? 'High Access' : formData.level <= 70 ? 'Medium Access' : 'Low Access'})`}
              badge={{
                text: formData.level <= 30 ? 'High' : formData.level <= 70 ? 'Medium' : 'Low',
                color: formData.level <= 30 ? 'bg-red-100 text-red-700' : formData.level <= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }}
            />
            <InfoRow label="Description" value={formData.description || 'No description provided'} />
            <InfoRow
              label="Status"
              value={
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${formData.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {formData.is_default && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Default Role
                    </span>
                  )}
                </div>
              }
            />
          </dl>
        </InfoSection>

        {/* Permissions Section */}
        <InfoSection title="Permissions" icon={FaKey} step={2}>
          {selectedPermissions.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                {selectedPermissions.length} permission(s) selected
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedPermissions.map((permission, idx) => (
                  <span key={idx} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No permissions selected. This role will have no specific permissions.</p>
          )}
        </InfoSection>

        {/* Module Access Section */}
        <InfoSection title="Module Access Levels" icon={FaLock} step={3}>
          {hasModuleAccessConfig ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {formData.module_access.length} module(s) have custom access levels configured
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {moduleAccessSummary.filter(m => m.level !== 'no_access').map((module, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{module.module}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getAccessLevelColor(module.level)}`}>
                      {getAccessLevelLabel(module.level)}
                    </span>
                  </div>
                ))}
              </div>
              {moduleAccessSummary.filter(m => m.level === 'no_access').length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  All other modules have <strong>No Access</strong> by default
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No custom module access configured. All modules will have default access based on permissions.</p>
          )}
        </InfoSection>

        {/* Completion Status */}
        <div className={`rounded-lg p-4 border ${selectedPermissions.length === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start gap-3">
            <FaCheckCircle className={`mt-0.5 ${selectedPermissions.length === 0 ? 'text-yellow-600' : 'text-green-600'}`} size={20} />
            <div>
              <p className={`text-sm font-medium ${selectedPermissions.length === 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                {selectedPermissions.length === 0 ? 'Limited Permissions' : 'Ready to Create'}
              </p>
              <p className="text-xs mt-1 ${selectedPermissions.length === 0 ? 'text-yellow-700' : 'text-green-700'}">
                {selectedPermissions.length === 0
                  ? 'This role has no permissions assigned. You can always add permissions later.'
                  : `${selectedPermissions.length} permission(s) assigned. Review above and click "Create Role" to finish.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Help */}
        <div className="text-center text-xs text-gray-500 pt-4">
          <p>Need to change something? Click the <FaPen className="inline mx-1" size={10} /> Edit button next to any section to jump directly to that step.</p>
        </div>
      </div>
    </StepWrapper>
  );
};