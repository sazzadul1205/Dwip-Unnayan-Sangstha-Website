// resources/js/components/RoleSteps/ModuleAccessStep.jsx

import { StepWrapper } from './StepWrapper';
import { FaLock, FaInfoCircle } from 'react-icons/fa';

export const ModuleAccessStep = ({ formData, setFormData, permissions, accessLevels }) => {

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
    const moduleAccess = formData.module_access.find(m => m.module === moduleName);
    return moduleAccess?.access_level || 'no_access';
  };

  // Get access level color
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

  return (
    <StepWrapper
      title="Module Access Levels"
      description="Define access levels for each module (overrides individual permissions)"
      isActive={true}
      stepNumber={3}
    >
      <div className="space-y-6">
        {/* Access Level Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl">
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

        {/* Module Access List */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-medium text-gray-700 flex items-center gap-2">
              <FaLock size={14} className="text-purple-600" />
              Module Access Configuration
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Set access levels for each module. Higher levels (manage) include lower levels (read, write).
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {permissions.map(module => {
              const currentLevel = getModuleAccessLevel(module.module);

              return (
                <div key={module.module} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{module.module}</span>
                        <span className="text-xs text-gray-400">
                          ({module.permissions.length} permissions)
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Set access level for all {module.module} module permissions
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={currentLevel}
                        onChange={(e) => handleModuleAccessChange(module.module, e.target.value)}
                        className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getAccessLevelColor(currentLevel)}`}
                      >
                        {accessLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
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

        {/* Info Box */}
        <div className="bg-purple-50 rounded-lg p-4 flex items-start gap-3">
          <FaInfoCircle className="text-purple-500 mt-0.5" size={18} />
          <div className="text-sm text-purple-800">
            <p className="font-medium mb-1">How Module Access Works:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Manage:</strong> Full control - can view, create, edit, and delete all items</li>
              <li><strong>Write:</strong> Can view, create, and edit items (cannot delete)</li>
              <li><strong>Read:</strong> Can only view items (cannot make changes)</li>
              <li><strong>No Access:</strong> Cannot access this module at all</li>
              <li>Module access overrides individual permission settings for better control</li>
            </ul>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};