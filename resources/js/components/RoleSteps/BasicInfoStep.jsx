// resources/js/components/RoleSteps/BasicInfoStep.jsx

import { useState } from 'react';
import { StepWrapper } from './StepWrapper';
import { FaMagic, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

export const BasicInfoStep = ({
  formData,
  errors,
  setFormData,
  existingLevels,
  isEdit = false,
  isDefaultRole = false,
}) => {
  const [hasUserEditedSlug, setHasUserEditedSlug] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    // ✅ Directly call setFormData with the new value
    setFormData({ [name]: newValue });
  };

  const generateSlug = () => {
    if (formData.name && !hasUserEditedSlug && !isDefaultRole) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData({ slug });
    }
  };

  const handleSlugChange = (e) => {
    setHasUserEditedSlug(true);
    handleChange(e);
  };

  const getLevelRecommendation = () => {
    const name = formData.name.toLowerCase();
    if (name.includes('admin') || name.includes('super') || name.includes('owner')) return 10;
    if (name.includes('manager') || name.includes('lead') || name.includes('head')) return 30;
    if (name.includes('senior')) return 50;
    if (name.includes('junior') || name.includes('intern')) return 80;
    return 60;
  };

  const applyLevelRecommendation = () => {
    setFormData({ level: getLevelRecommendation() });
  };

  const isDisabled = isDefaultRole === true && isEdit === true;

  return (
    <StepWrapper
      title="Basic Information"
      description={isEdit ? "Edit the fundamental details of the role" : "Enter the fundamental details of the role"}
      isActive={true}
      stepNumber={1}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role Name <span className="text-red-500">*</span>
            {isDisabled && <span className="ml-2 text-xs text-amber-600 font-normal">(Default Role - Read Only)</span>}
          </label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            onBlur={generateSlug}
            placeholder="e.g., Content Manager, Sales Lead, Developer"
            disabled={isDisabled}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${errors.name ? 'border-red-500' : 'border-gray-300'} ${isDisabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          {isDisabled && (
            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
              <FaInfoCircle size={12} />
              Default role name cannot be changed
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">Minimum 2 characters, descriptive name for the role</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug <span className="text-red-500">*</span>
            {isDisabled && <span className="ml-2 text-xs text-amber-600 font-normal">(Default Role - Read Only)</span>}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-mono">/</span>
            <input
              type="text"
              name="slug"
              value={formData.slug || ''}
              onChange={handleSlugChange}
              placeholder="e.g., content-manager"
              disabled={isDisabled}
              className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm ${errors.slug ? 'border-red-500' : 'border-gray-300'} ${isDisabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
            />
          </div>
          {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
          {isDisabled && (
            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
              <FaInfoCircle size={12} />
              Default role slug cannot be changed
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">Used for URL and code references. Use lowercase letters, numbers, and hyphens only.</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Access Level <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={applyLevelRecommendation}
              disabled={isDisabled}
              className={`text-xs flex items-center gap-1 ${isDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:text-purple-800'}`}
            >
              <FaMagic size={10} /> Suggest
            </button>
          </div>
          <div className="flex gap-4 items-center">
            <input
              type="number"
              name="level"
              value={formData.level || 60}
              onChange={handleChange}
              placeholder="1-100"
              min="1"
              max="100"
              disabled={isDisabled}
              className={`w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center ${errors.level ? 'border-red-500' : 'border-gray-300'} ${isDisabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
            />
            <div className="flex-1">
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-linear-to-r from-purple-500 to-indigo-500 rounded-full h-2 transition-all duration-300" style={{ width: `${((formData.level || 60) / 100) * 100}%` }} />
                </div>
                <div className="absolute -top-1 left-0 right-0 flex justify-between px-1">
                  {[0, 25, 50, 75, 100].map(marker => (
                    <div key={marker} className="relative">
                      <div className="w-0.5 h-3 bg-gray-300" />
                      <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400">{marker}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {errors.level && <p className="mt-1 text-sm text-red-500">{errors.level}</p>}
          <p className="mt-3 text-xs text-gray-500">Lower numbers = higher access (1=highest, 100=lowest). This determines role hierarchy.</p>

          {existingLevels && existingLevels.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                <FaInfoCircle size={10} /> Existing Role Levels Reference:
              </p>
              <div className="flex flex-wrap gap-2">
                {existingLevels.slice(0, 10).map(role => (
                  <span key={role.level} className="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-600">
                    Lvl {role.level}: {role.name}
                  </span>
                ))}
                {existingLevels.length > 10 && (
                  <span className="text-xs text-gray-400">+{existingLevels.length - 10} more</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={4}
            disabled={isDisabled}
            placeholder="Describe the role, its responsibilities, and what this role entails..."
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${isDisabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
          />
          <p className="mt-1 text-xs text-gray-500">{formData.description?.length || 0}/500 characters</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <label className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition ${isDisabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-gray-50 hover:bg-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.is_active ? 'bg-green-100' : 'bg-gray-200'}`}>
                {formData.is_active ? <FaCheckCircle className="text-green-600" size={18} /> : <FaTimesCircle className="text-gray-400" size={18} />}
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Active</span>
                <p className="text-xs text-gray-400">Inactive roles cannot be assigned to users</p>
              </div>
            </div>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active ?? true}
              onChange={handleChange}
              disabled={isDisabled}
              className={`w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 ${isDisabled ? 'cursor-not-allowed' : ''}`}
            />
          </label>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 flex items-start gap-3">
          <FaInfoCircle className="text-purple-500 mt-0.5" size={18} />
          <div className="text-sm text-purple-800">
            <p className="font-medium mb-1">Role Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Role names should be descriptive and follow a consistent naming pattern</li>
              <li>Lower level numbers have higher access (Admin: 10, User: 80)</li>
              <li>Default roles are automatically assigned to new registrations</li>
              {isEdit && <li>Changes will affect all users with this role immediately</li>}
            </ul>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};