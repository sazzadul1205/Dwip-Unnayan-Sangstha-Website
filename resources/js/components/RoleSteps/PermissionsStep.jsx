// resources/js/components/RoleSteps/PermissionsStep.jsx

import { useState } from 'react';
import { StepWrapper } from './StepWrapper';
import {
  FaChevronDown,
  FaChevronUp,
  FaDatabase,
  FaKey,
  FaSearch,
  FaTimes,
  FaCheckDouble,
  FaMinus,
} from 'react-icons/fa';

export const PermissionsStep = ({ formData, setFormData, permissions }) => {
  const [expandedModules, setExpandedModules] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Toggle module expansion
  const toggleModule = (moduleName) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  // Expand all modules
  const expandAll = () => {
    const allExpanded = {};
    permissions.forEach(module => {
      allExpanded[module.module] = true;
    });
    setExpandedModules(allExpanded);
  };

  // Collapse all modules
  const collapseAll = () => {
    setExpandedModules({});
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions };
    });
  };

  // Select all permissions in a module
  const selectAllModule = (modulePermissions) => {
    const allIds = modulePermissions.map(p => p.id);
    setFormData(prev => ({
      ...prev,
      permissions: [...new Set([...prev.permissions, ...allIds])]
    }));
  };

  // Deselect all permissions in a module
  const deselectAllModule = (modulePermissions) => {
    const allIds = modulePermissions.map(p => p.id);
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.filter(id => !allIds.includes(id))
    }));
  };

  // Filter permissions based on search and selected filter
  const filteredPermissions = permissions.filter(module => {
    // Filter by selected only
    if (showSelectedOnly) {
      const hasSelectedPermissions = module.permissions.some(p =>
        formData.permissions.includes(p.id)
      );
      if (!hasSelectedPermissions) return false;
    }

    // Filter by search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (module.module.toLowerCase().includes(searchLower)) return true;
      return module.permissions.some(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.slug.toLowerCase().includes(searchLower) ||
        p.action.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const totalPermissions = permissions.reduce((sum, m) => sum + m.permissions.length, 0);
  const selectedCount = formData.permissions.length;

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <StepWrapper
      title="Permissions"
      description="Select the permissions this role will have"
      isActive={true}
      stepNumber={2}
    >
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{selectedCount}</div>
              <div className="text-xs text-gray-500">Selected</div>
            </div>
            <div className="w-px h-10 bg-gray-300" />
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{totalPermissions}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="w-px h-10 bg-gray-300" />
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{permissions.length}</div>
              <div className="text-xs text-gray-500">Modules</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search permissions by name, module, or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowSelectedOnly(!showSelectedOnly)}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap ${showSelectedOnly
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {showSelectedOnly ? <FaCheckDouble size={14} /> : <FaKey size={14} />}
            {showSelectedOnly ? 'Showing Selected Only' : 'Show All Permissions'}
          </button>
        </div>

        {/* Permissions List */}
        {filteredPermissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FaKey className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500">No permissions found</p>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="mt-2 text-sm text-purple-600 hover:text-purple-800"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPermissions.map(module => {
              const modulePermissionIds = module.permissions.map(p => p.id);
              const selectedInModule = module.permissions.filter(p => formData.permissions.includes(p.id)).length;
              const isAllSelected = selectedInModule === module.permissions.length && module.permissions.length > 0;
              const isSomeSelected = selectedInModule > 0 && selectedInModule < module.permissions.length;
              const isExpanded = expandedModules[module.module] !== false;

              return (
                <div key={module.module} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Module Header */}
                  <div className="bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between p-4">
                      <button
                        onClick={() => toggleModule(module.module)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <FaDatabase className="text-purple-600" size={14} />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">{module.module}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {isAllSelected && (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                All selected
                              </span>
                            )}
                            {isSomeSelected && (
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                {selectedInModule}/{module.permissions.length} selected
                              </span>
                            )}
                            {!isSomeSelected && !isAllSelected && selectedInModule === 0 && (
                              <span className="text-xs text-gray-400">None selected</span>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Select/Deselect All Buttons */}
                        {!isAllSelected && (
                          <button
                            onClick={() => selectAllModule(module.permissions)}
                            className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-50"
                          >
                            Select All
                          </button>
                        )}
                        {isAllSelected && (
                          <button
                            onClick={() => deselectAllModule(module.permissions)}
                            className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Deselect All
                          </button>
                        )}
                        <button
                          onClick={() => toggleModule(module.module)}
                          className="p-1 hover:bg-gray-200 rounded-lg transition"
                        >
                          {isExpanded ? <FaChevronUp className="text-gray-400" size={14} /> : <FaChevronDown className="text-gray-400" size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Module Permissions */}
                  {isExpanded && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {module.permissions.map(permission => (
                        <label
                          key={permission.id}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${formData.permissions.includes(permission.id)
                              ? 'bg-purple-50 border border-purple-200'
                              : 'hover:bg-gray-50 border border-transparent'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="mt-0.5 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StepWrapper>
  );
};