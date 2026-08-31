// resources/js/components/JobListingSteps/ReviewStep.jsx

import React from 'react';
import { StepWrapper } from './StepWrapper';
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillWave,
  FaPen,
  FaCalendarAlt,
  FaFacebook,
  FaLinkedin,
  FaGlobe,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaArrowRight,
} from 'react-icons/fa';
import { FaListCheck } from "react-icons/fa6";

export const ReviewStep = ({ formData, locations, categories, onNavigateToStep, isEdit = false, originalJob = null }) => {

  const getCategoryName = () => {
    const category = categories?.find(c => c.id === parseInt(formData.category_id));
    return category?.name || 'Not selected';
  };

  const getLocationNames = () => {
    if (!formData.location_ids?.length) return [];
    return locations
      .filter(loc => formData.location_ids.includes(loc.id))
      .map(loc => loc.name);
  };

  const getJobTypeLabel = (type) => {
    const types = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
      'remote': 'Remote',
      'hybrid': 'Hybrid',
    };
    return types[type] || type;
  };

  const getExperienceLabel = (level) => {
    const levels = {
      'entry': 'Entry Level',
      'junior': 'Junior',
      'mid-level': 'Mid Level',
      'senior': 'Senior',
      'lead': 'Lead',
      'executive': 'Executive',
    };
    return levels[level] || level;
  };

  const getSalaryDisplay = () => {
    if (formData.as_per_companies_policy) {
      return 'As per company policy';
    }
    if (formData.is_salary_negotiable) {
      return 'Negotiable';
    }
    if (formData.salary_min && formData.salary_max) {
      return `${parseInt(formData.salary_min).toLocaleString()} - ${parseInt(formData.salary_max).toLocaleString()} BDT`;
    }
    if (formData.salary_min) {
      return `From ${parseInt(formData.salary_min).toLocaleString()} BDT`;
    }
    return 'Not specified';
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getFullHtmlContent = (html) => {
    if (!html) return 'Not provided';
    return html;
  };

  const hasFieldChanged = (field, currentValue, originalValue) => {
    if (!isEdit || !originalJob) return false;

    if (Array.isArray(currentValue) && Array.isArray(originalValue)) {
      return JSON.stringify(currentValue) !== JSON.stringify(originalValue);
    }

    if (typeof currentValue === 'string' && typeof originalValue === 'string') {
      const cleanCurrent = stripHtml(currentValue).trim();
      const cleanOriginal = stripHtml(originalValue).trim();
      if (cleanCurrent !== cleanOriginal) return true;
    }

    return currentValue !== originalValue;
  };

  const getChangedFieldsSummary = () => {
    if (!isEdit || !originalJob) return [];

    const changes = [];

    if (hasFieldChanged('title', formData.title, originalJob.title)) {
      changes.push({ field: 'Job Title', old: originalJob.title, new: formData.title });
    }
    if (hasFieldChanged('category_id', formData.category_id, originalJob.category_id)) {
      changes.push({ field: 'Category', old: getCategoryName(originalJob.category_id), new: getCategoryName() });
    }
    if (hasFieldChanged('job_type', formData.job_type, originalJob.job_type)) {
      changes.push({ field: 'Job Type', old: getJobTypeLabel(originalJob.job_type), new: getJobTypeLabel(formData.job_type) });
    }
    if (hasFieldChanged('experience_level', formData.experience_level, originalJob.experience_level)) {
      changes.push({ field: 'Experience Level', old: getExperienceLabel(originalJob.experience_level), new: getExperienceLabel(formData.experience_level) });
    }
    if (hasFieldChanged('description', formData.description, originalJob.description)) {
      changes.push({ field: 'Description', changed: true });
    }
    if (hasFieldChanged('requirements', formData.requirements, originalJob.requirements)) {
      changes.push({ field: 'Requirements', changed: true });
    }
    if (hasFieldChanged('skills', formData.skills, originalJob.skills)) {
      changes.push({ field: 'Skills', old: originalJob.skills?.length || 0, new: formData.skills?.length || 0 });
    }
    if (hasFieldChanged('location_ids', formData.location_ids, originalJob.location_ids)) {
      changes.push({ field: 'Locations', changed: true });
    }
    if (hasFieldChanged('salary_min', formData.salary_min, originalJob.salary_min) ||
      hasFieldChanged('salary_max', formData.salary_max, originalJob.salary_max)) {
      changes.push({ field: 'Salary', changed: true });
    }
    if (hasFieldChanged('application_deadline', formData.application_deadline, originalJob.application_deadline)) {
      changes.push({ field: 'Application Deadline', old: formatDate(originalJob.application_deadline), new: formatDate(formData.application_deadline) });
    }
    if (hasFieldChanged('is_active', formData.is_active, originalJob.is_active)) {
      changes.push({ field: 'Status', old: originalJob.is_active ? 'Active' : 'Inactive', new: formData.is_active ? 'Active' : 'Inactive' });
    }

    return changes;
  };

  const InfoSection = ({ title, icon: Icon, children, step, hasChanges = false }) => (
    <div className={`border rounded-lg overflow-hidden mb-4 sm:mb-6 transition-all duration-200 ${hasChanges ? 'border-yellow-400 shadow-md' : 'border-gray-200'}`}>
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b ${hasChanges ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Icon className={hasChanges ? 'text-yellow-600' : 'text-blue-600'} size={16} />
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{title}</h3>
          {hasChanges && (
            <span className="ml-1 sm:ml-2 inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-yellow-200 text-yellow-800">
              Changed
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onNavigateToStep(step)}
          className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm flex items-center gap-1 transition-colors"
        >
          <FaPen size={10} />
          Edit
        </button>
      </div>
      <div className="p-3 sm:p-4 bg-white">
        {children}
      </div>
    </div>
  );

  const InfoRow = ({ label, value, isHtml = false, hasChanged = false, fullHeight = false }) => (
    <div className={`py-2 sm:py-3 border-b border-gray-100 last:border-0 ${hasChanged ? 'bg-yellow-50 -mx-2 px-2 rounded' : ''}`}>
      <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2 flex flex-wrap items-center gap-1 sm:gap-2">
        {label}
        {hasChanged && (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-yellow-700">
            <FaArrowRight size={8} />
            Changed
          </span>
        )}
      </dt>
      <dd className={`text-xs sm:text-sm md:text-base text-gray-900 ${fullHeight ? '' : 'max-h-48 sm:max-h-96 overflow-y-auto'}`}>
        {isHtml ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: value || '<span class="text-gray-400">Not provided</span>' }}
          />
        ) : (
          value || <span className="text-gray-400">Not provided</span>
        )}
      </dd>
    </div>
  );

  const TagList = ({ items, color = 'blue', originalItems = null }) => {
    const hasChanges = isEdit && originalItems && JSON.stringify(items) !== JSON.stringify(originalItems);

    return (
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
        {items?.length > 0 ? (
          items.map((item, index) => (
            <span
              key={index}
              className={`inline-flex px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-${color}-100 text-${color}-800`}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-xs sm:text-sm">None provided</span>
        )}
        {hasChanges && (
          <span className="text-[10px] sm:text-xs text-yellow-600 ml-1 sm:ml-2">(Updated)</span>
        )}
      </div>
    );
  };

  const locationNames = getLocationNames();
  const hasRequiredLinks = formData.required_linkedin_link || formData.required_facebook_link;
  const changedFields = getChangedFieldsSummary();
  const hasAnyChanges = changedFields.length > 0;

  return (
    <StepWrapper
      title={isEdit ? "Review & Update" : "Review & Submit"}
      description={isEdit ? "Review all changes before updating your job" : "Review all information before posting your job"}
      isActive={true}
      stepNumber={6}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Warning Message */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <FaExclamationTriangle className="text-yellow-500 mt-0.5" size={16} />
            <div>
              <p className="text-xs sm:text-sm font-medium text-yellow-800">
                {isEdit ? 'Please review your changes carefully' : 'Please review carefully'}
              </p>
              <p className="text-[10px] sm:text-xs text-yellow-700 mt-0.5 sm:mt-1">
                {isEdit
                  ? 'Review all changes before updating. Changes will be visible to applicants immediately.'
                  : 'Once you post this job, it will be visible to applicants. Make sure all information is correct.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Changes Summary */}
        {isEdit && hasAnyChanges && (
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <div className="flex items-start gap-2 sm:gap-3">
              <FaInfoCircle className="text-blue-500 mt-0.5" size={14} />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-blue-900">Summary of Changes</p>
                <div className="mt-1.5 sm:mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                  {changedFields.slice(0, 6).map((change, idx) => (
                    <div key={idx} className="text-[10px] sm:text-xs">
                      <span className="font-medium text-blue-800">{change.field}:</span>
                      {change.old && change.new ? (
                        <span className="text-blue-700 ml-1">
                          <span className="line-through text-gray-500">{change.old}</span>
                          {' → '}
                          <span className="font-medium">{change.new}</span>
                        </span>
                      ) : (
                        <span className="text-blue-700 ml-1">Updated</span>
                      )}
                    </div>
                  ))}
                  {changedFields.length > 6 && (
                    <div className="text-[10px] sm:text-xs text-blue-600">
                      + {changedFields.length - 6} more change(s)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Changes Message */}
        {isEdit && !hasAnyChanges && (
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex items-start gap-2 sm:gap-3">
              <FaInfoCircle className="text-gray-500 mt-0.5" size={14} />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">No Changes Detected</p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                  You haven't made any changes to this job listing. Click "Cancel" to go back or make some changes to update.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information Section */}
        <InfoSection
          title="Basic Information"
          icon={FaBriefcase}
          step={1}
          hasChanges={isEdit && (
            hasFieldChanged('title', formData.title, originalJob?.title) ||
            hasFieldChanged('category_id', formData.category_id, originalJob?.category_id) ||
            hasFieldChanged('job_type', formData.job_type, originalJob?.job_type) ||
            hasFieldChanged('experience_level', formData.experience_level, originalJob?.experience_level) ||
            hasFieldChanged('description', formData.description, originalJob?.description)
          )}
        >
          <dl className="divide-y divide-gray-100">
            <InfoRow
              label="Job Title"
              value={formData.title}
              hasChanged={isEdit && hasFieldChanged('title', formData.title, originalJob?.title)}
            />
            <InfoRow
              label="Category"
              value={getCategoryName()}
              hasChanged={isEdit && hasFieldChanged('category_id', formData.category_id, originalJob?.category_id)}
            />
            <InfoRow
              label="Job Type"
              value={getJobTypeLabel(formData.job_type)}
              hasChanged={isEdit && hasFieldChanged('job_type', formData.job_type, originalJob?.job_type)}
            />
            <InfoRow
              label="Experience Level"
              value={getExperienceLabel(formData.experience_level)}
              hasChanged={isEdit && hasFieldChanged('experience_level', formData.experience_level, originalJob?.experience_level)}
            />
            <InfoRow
              label="Job Description"
              value={getFullHtmlContent(formData.description)}
              isHtml={true}
              fullHeight={true}
              hasChanged={isEdit && hasFieldChanged('description', formData.description, originalJob?.description)}
            />
          </dl>
        </InfoSection>

        {/* Requirements Section */}
        <InfoSection
          title="Requirements & Qualifications"
          icon={FaListCheck}
          step={2}
          hasChanges={isEdit && (
            hasFieldChanged('requirements', formData.requirements, originalJob?.requirements) ||
            hasFieldChanged('skills', formData.skills, originalJob?.skills) ||
            hasFieldChanged('responsibilities', formData.responsibilities, originalJob?.responsibilities) ||
            hasFieldChanged('benefits', formData.benefits, originalJob?.benefits)
          )}
        >
          <dl className="divide-y divide-gray-100">
            <InfoRow
              label="Requirements"
              value={getFullHtmlContent(formData.requirements)}
              isHtml={true}
              fullHeight={true}
              hasChanged={isEdit && hasFieldChanged('requirements', formData.requirements, originalJob?.requirements)}
            />
            <InfoRow
              label="Required Skills"
              value={
                <TagList
                  items={formData.skills}
                  color="blue"
                  originalItems={originalJob?.skills}
                />
              }
            />
            <InfoRow
              label="Key Responsibilities"
              value={
                formData.responsibilities?.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5 sm:space-y-1">
                    {formData.responsibilities.map((resp, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-gray-900">{resp}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )
              }
              hasChanged={isEdit && hasFieldChanged('responsibilities', formData.responsibilities, originalJob?.responsibilities)}
            />
            <InfoRow
              label="Benefits & Perks"
              value={
                <TagList
                  items={formData.benefits}
                  color="green"
                  originalItems={originalJob?.benefits}
                />
              }
            />
            {formData.education_requirement && (
              <InfoRow
                label="Education Requirement"
                value={formData.education_requirement}
                hasChanged={isEdit && hasFieldChanged('education_requirement', formData.education_requirement, originalJob?.education_requirement)}
              />
            )}
            {formData.education_details && (
              <InfoRow
                label="Education Details"
                value={formData.education_details}
                hasChanged={isEdit && hasFieldChanged('education_details', formData.education_details, originalJob?.education_details)}
              />
            )}
          </dl>
        </InfoSection>

        {/* Location Section */}
        <InfoSection
          title="Location"
          icon={FaMapMarkerAlt}
          step={3}
          hasChanges={isEdit && hasFieldChanged('location_ids', formData.location_ids, originalJob?.location_ids)}
        >
          <dl className="divide-y divide-gray-100">
            <InfoRow
              label="Job Locations"
              value={
                locationNames.length > 0 ? (
                  <div className="space-y-0.5 sm:space-y-1">
                    {locationNames.map((loc, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                        <FaMapMarkerAlt size={10} className="text-gray-400" />
                        <span className="text-xs sm:text-sm text-gray-900">{loc}</span>
                      </div>
                    ))}
                  </div>
                ) : 'No locations selected'
              }
            />
          </dl>
        </InfoSection>

        {/* Compensation Section */}
        <InfoSection
          title="Compensation"
          icon={FaMoneyBillWave}
          step={4}
          hasChanges={isEdit && (
            hasFieldChanged('salary_min', formData.salary_min, originalJob?.salary_min) ||
            hasFieldChanged('salary_max', formData.salary_max, originalJob?.salary_max) ||
            hasFieldChanged('is_salary_negotiable', formData.is_salary_negotiable, originalJob?.is_salary_negotiable) ||
            hasFieldChanged('as_per_companies_policy', formData.as_per_companies_policy, originalJob?.as_per_companies_policy) ||
            hasFieldChanged('keywords', formData.keywords, originalJob?.keywords)
          )}
        >
          <dl className="divide-y divide-gray-100">
            <InfoRow
              label="Salary"
              value={getSalaryDisplay()}
            />
            <InfoRow
              label="Keywords (SEO)"
              value={
                <TagList
                  items={formData.keywords}
                  color="purple"
                  originalItems={originalJob?.keywords}
                />
              }
            />
          </dl>
        </InfoSection>

        {/* Publishing Section */}
        <InfoSection
          title="Publishing & Deadlines"
          icon={FaCalendarAlt}
          step={5}
          hasChanges={isEdit && (
            hasFieldChanged('application_deadline', formData.application_deadline, originalJob?.application_deadline) ||
            hasFieldChanged('publish_at', formData.publish_at, originalJob?.publish_at) ||
            hasFieldChanged('is_active', formData.is_active, originalJob?.is_active)
          )}
        >
          <dl className="divide-y divide-gray-100">
            <InfoRow
              label="Application Deadline"
              value={
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FaCalendarAlt size={12} className="text-red-500" />
                  <span className="font-medium text-xs sm:text-sm text-gray-900">{formatDate(formData.application_deadline)}</span>
                </div>
              }
              hasChanged={isEdit && hasFieldChanged('application_deadline', formData.application_deadline, originalJob?.application_deadline)}
            />
            <InfoRow
              label="Publish Date"
              value={
                formData.publish_at ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FaClock size={12} className="text-blue-500" />
                    <span className="text-xs sm:text-sm">{formatDate(formData.publish_at)}</span>
                  </div>
                ) : 'Immediately (upon posting)'
              }
              hasChanged={isEdit && hasFieldChanged('publish_at', formData.publish_at, originalJob?.publish_at)}
            />
            <InfoRow
              label="Status"
              value={
                <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${formData.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {formData.is_active ? 'Active' : 'Inactive'}
                </span>
              }
              hasChanged={isEdit && hasFieldChanged('is_active', formData.is_active, originalJob?.is_active)}
            />
          </dl>
        </InfoSection>

        {/* Social & External Options */}
        {(hasRequiredLinks) && (
          <InfoSection title="Additional Options" icon={FaGlobe} step={5}>
            <dl className="divide-y divide-gray-100">
              {formData.required_linkedin_link && (
                <InfoRow
                  label="Social Requirements"
                  value={
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FaLinkedin className="text-blue-700" size={14} />
                      <span className="text-xs sm:text-sm">Require LinkedIn profile</span>
                    </div>
                  }
                />
              )}
              {formData.required_facebook_link && (
                <InfoRow
                  label=""
                  value={
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FaFacebook className="text-blue-600" size={14} />
                      <span className="text-xs sm:text-sm">Require Facebook profile</span>
                    </div>
                  }
                />
              )}
            </dl>
          </InfoSection>
        )}

        {/* Completion Status */}
        <div className={`rounded-lg p-3 sm:p-4 border ${isEdit && !hasAnyChanges
          ? 'bg-gray-50 border-gray-200'
          : 'bg-green-50 border-green-200'
          }`}>
          <div className="flex items-start gap-2 sm:gap-3">
            <FaCheckCircle className={`mt-0.5 ${isEdit && !hasAnyChanges ? 'text-gray-400' : 'text-green-600'}`} size={16} />
            <div>
              <p className={`text-xs sm:text-sm font-medium ${isEdit && !hasAnyChanges ? 'text-gray-700' : 'text-green-900'}`}>
                {isEdit
                  ? (hasAnyChanges ? 'Ready to Update' : 'No Changes to Apply')
                  : 'Ready to Post'}
              </p>
              <p className={`text-[10px] sm:text-xs ${isEdit && !hasAnyChanges ? 'text-gray-600' : 'text-green-700'} mt-0.5`}>
                {isEdit
                  ? (hasAnyChanges
                    ? 'Review all changes above and click "Update Job" to apply them.'
                    : 'Make some changes above to update this job listing.')
                  : 'All required fields are filled. Click "Post Job" below to make this job listing live.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Help */}
        <div className="text-center text-[10px] sm:text-xs text-gray-500 pt-2 sm:pt-4">
          <p>Need to change something? Click the <FaPen className="inline mx-1" size={10} /> Edit button next to any section to jump directly to that step.</p>
        </div>
      </div>
    </StepWrapper>
  );
};