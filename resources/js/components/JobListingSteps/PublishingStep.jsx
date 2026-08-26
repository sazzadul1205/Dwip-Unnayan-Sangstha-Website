// resources/js/components/JobListingSteps/PublishingStep.jsx

import { useState, useEffect } from 'react';
import { StepWrapper } from './StepWrapper';

export const PublishingStep = ({ formData, errors, handleChange, setError, clearError }) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const publishDate = formData.publish_at;
    const today = new Date().toISOString().split('T')[0];

    if (publishDate && publishDate > today) {
      setIsScheduled(true);
      if (formData.is_active) {
        handleChange({ target: { name: 'is_active', value: false } });
      }
    } else {
      setIsScheduled(false);
    }
  }, [formData.publish_at, formData.is_active, handleChange]);

  const handlePublishDateChange = (e) => {
    const newPublishDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    setShowWarning(false);
    clearError?.('publish_at');

    if (newPublishDate && newPublishDate > today) {
      if (formData.is_active) {
        handleChange({ target: { name: 'is_active', value: false } });
      }
      setIsScheduled(true);
      setShowWarning(true);
    } else {
      setIsScheduled(false);
    }

    handleChange(e);
  };

  const handleActiveStatusChange = (e) => {
    const isChecked = e.target.checked;
    const publishDate = formData.publish_at;
    const today = new Date().toISOString().split('T')[0];

    if (isChecked && publishDate && publishDate > today) {
      setError?.('is_active', 'Cannot activate scheduled job. Clear publish date to activate immediately.');
      return;
    }

    clearError?.('is_active');
    handleChange({ target: { name: 'is_active', value: isChecked } });
  };

  const handleClearPublishDate = () => {
    handleChange({ target: { name: 'publish_at', value: '' } });
    setIsScheduled(false);
    setShowWarning(false);
    clearError?.('publish_at');
  };

  return (
    <StepWrapper
      title="Publishing & Deadlines"
      description="Set when this job should be published and when applications close"
      isActive={true}
      stepNumber={5}
    >
      <div className="space-y-4 sm:space-y-6">
        {showWarning && (
          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-800">Job Scheduled for Future Publishing</p>
              <p className="text-xs sm:text-sm text-blue-700 mt-0.5">
                This job will become active on <strong>{formData.publish_at}</strong>.
                You cannot manually activate it before that date.
              </p>
              <button
                type="button"
                onClick={handleClearPublishDate}
                className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-blue-700 hover:text-blue-900 font-medium underline"
              >
                Publish immediately instead
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowWarning(false)}
              className="shrink-0 text-blue-500 hover:text-blue-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Application Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="application_deadline"
              value={formData.application_deadline}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.application_deadline ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.application_deadline && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.application_deadline}</p>
            )}
            <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
              Last date for candidates to submit applications
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Publish Date <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="publish_at"
                value={formData.publish_at}
                onChange={handlePublishDateChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${isScheduled ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                  } ${errors.publish_at ? 'border-red-500' : ''}`}
              />
              {isScheduled && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800">
                    Scheduled
                  </span>
                </div>
              )}
            </div>
            {errors.publish_at && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.publish_at}</p>
            )}
            <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
              Leave empty to publish immediately. Future date schedules the job.
            </p>
          </div>
        </div>

        {/* Social Media Requirements */}
        <div className="border-t pt-4 sm:pt-6">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2 sm:mb-3">Social Media Requirements</h3>
          <div className="space-y-2 sm:space-y-3">
            <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="required_linkedin_link"
                checked={formData.required_linkedin_link}
                onChange={(e) => handleChange({ target: { name: 'required_linkedin_link', value: e.target.checked } })}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-xs sm:text-sm text-gray-700 group-hover:text-gray-900">
                Require LinkedIn profile for application
              </span>
            </label>

            <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="required_facebook_link"
                checked={formData.required_facebook_link}
                onChange={(e) => handleChange({ target: { name: 'required_facebook_link', value: e.target.checked } })}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-xs sm:text-sm text-gray-700 group-hover:text-gray-900">
                Require Facebook profile for application
              </span>
            </label>
          </div>
        </div>

        {/* Active Status */}
        <div className="border-t pt-4 sm:pt-6">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2 sm:mb-3">Job Status</h3>

          <div className={`p-3 sm:p-4 rounded-lg border ${isScheduled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
            }`}>
            <label className={`flex items-start gap-2 sm:gap-3 ${isScheduled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleActiveStatusChange}
                disabled={isScheduled}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 focus:ring-blue-500 mt-0.5 ${isScheduled ? 'bg-gray-100 cursor-not-allowed' : 'text-blue-600'
                  }`}
              />
              <div>
                <span className={`text-xs sm:text-sm ${isScheduled ? 'text-gray-400' : 'text-gray-700'}`}>
                  Active immediately
                </span>
                {!isScheduled && (
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                    Job will be visible to candidates immediately upon creation
                  </p>
                )}
              </div>
            </label>

            {isScheduled && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Schedule Mode:</strong> This job is scheduled for future publishing.
                    </p>
                    <p className="text-[10px] sm:text-xs text-blue-700 mt-1">
                      The job will automatically become active on {formData.publish_at}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errors.is_active && (
              <p className="mt-2 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.is_active}
              </p>
            )}
          </div>

          <p className="mt-2 text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Jobs automatically become inactive after the deadline
          </p>
        </div>

        {/* Quick Summary Card */}
        <div className="border-t pt-4 sm:pt-6">
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Publishing Summary</h4>
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row justify-between gap-1">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${isScheduled ? 'text-blue-600' : formData.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                  {isScheduled ? 'Scheduled' : formData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {isScheduled && (
                <div className="flex flex-col sm:flex-row justify-between gap-1">
                  <span className="text-gray-500">Publish Date:</span>
                  <span className="font-medium text-gray-700">{formData.publish_at}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-between gap-1">
                <span className="text-gray-500">Deadline:</span>
                <span className="font-medium text-gray-700">{formData.application_deadline || 'Not set'}</span>
              </div>
              {!isScheduled && (
                <div className="flex flex-col sm:flex-row justify-between gap-1">
                  <span className="text-gray-500">Visible to candidates:</span>
                  <span className={`font-medium ${formData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.is_active ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};