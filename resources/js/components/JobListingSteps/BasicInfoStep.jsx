// resources/js/components/JobListingSteps/BasicInfoStep.jsx

import { StepWrapper } from './StepWrapper';
import CustomEditor from '../../components/CustomEditor';

export const BasicInfoStep = ({ formData, errors, handleChange, setFormData }) => {
  return (
    <StepWrapper
      title="Basic Information"
      description="Enter the fundamental details of the job position"
      isActive={true}
      stepNumber={1}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Senior Software Engineer"
            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          {errors.title && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.title}</p>}
          <p className="mt-1 text-[10px] sm:text-xs text-gray-500">Minimum 5 characters, max 255 characters</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Job Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.category_id ? 'border-red-500' : 'border-gray-300'
              }`}
          >
            <option value="">Select a category</option>
            {window.categories?.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.category_id}</p>}
        </div>

        {/* Job Type & Experience Level - Two columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Job Type <span className="text-red-500">*</span>
            </label>
            <select
              name="job_type"
              value={formData.job_type}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.job_type ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Select job type</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
            {errors.job_type && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.job_type}</p>}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Experience Level <span className="text-red-500">*</span>
            </label>
            <select
              name="experience_level"
              value={formData.experience_level}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.experience_level ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Select experience level</option>
              <option value="entry">Entry Level</option>
              <option value="junior">Junior</option>
              <option value="mid-level">Mid Level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
              <option value="executive">Executive</option>
            </select>
            {errors.experience_level && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.experience_level}</p>}
          </div>
        </div>

        {/* Job Description - Using CustomEditor */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Job Description <span className="text-red-500">*</span>
          </label>
          <CustomEditor
            value={formData.description}
            onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
            placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
          />
          {errors.description && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.description}</p>}
          <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
            Minimum 50 characters. Use formatting tools to make your description engaging.
          </p>
        </div>
      </div>
    </StepWrapper>
  );
};