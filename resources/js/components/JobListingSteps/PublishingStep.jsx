// resources/js/components/JobListingSteps/PublishingStep.jsx

import { useState, useEffect } from 'react';
import { StepWrapper } from './StepWrapper';

export const PublishingStep = ({ formData, errors, handleChange, setError, clearError }) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Check if publish date is set and in the future
  useEffect(() => {
    const publishDate = formData.publish_at;
    const today = new Date().toISOString().split('T')[0];

    if (publishDate && publishDate > today) {
      setIsScheduled(true);
      // Auto-uncheck is_active when publish date is in the future
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

    // Clear any previous warnings
    setShowWarning(false);
    clearError?.('publish_at');

    // Auto-uncheck is_active if publish date is in the future
    if (newPublishDate && newPublishDate > today) {
      if (formData.is_active) {
        handleChange({ target: { name: 'is_active', value: false } });
      }
      setIsScheduled(true);

      // Show info message (non-blocking)
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

    // If trying to activate but there's a future publish date
    if (isChecked && publishDate && publishDate > today) {
      // Set error instead of alert
      setError?.('is_active', 'Cannot activate scheduled job. Clear the publish date to activate immediately.');
      return;
    }

    // Clear error if valid
    clearError?.('is_active');
    handleChange({ target: { name: 'is_active', value: isChecked } });
  };

  const handleClearPublishDate = () => {
    // Clear the publish date and allow immediate activation
    handleChange({ target: { name: 'publish_at', value: '' } });
    setIsScheduled(false);
    setShowWarning(false);
    clearError?.('publish_at');

    // Optionally, suggest to activate
    if (!formData.is_active) {
      // Set a success message or highlight
      setShowWarning(false);
    }
  };

  return (
    <StepWrapper
      title="Publishing & Deadlines"
      description="Set when this job should be published and when applications close"
      isActive={true}
      stepNumber={5}
    >
      <div className="space-y-6">
        {/* Info Banner - Shown when scheduling */}
        {showWarning && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Job Scheduled for Future Publishing</p>
              <p className="text-sm text-blue-700 mt-0.5">
                This job will become active on <strong>{formData.publish_at}</strong>.
                You cannot manually activate it before that date.
              </p>
              <button
                type="button"
                onClick={handleClearPublishDate}
                className="mt-2 text-sm text-blue-700 hover:text-blue-900 font-medium underline"
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

        {/* Application Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="application_deadline"
              value={formData.application_deadline}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.application_deadline ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.application_deadline && (
              <p className="mt-1 text-sm text-red-500">{errors.application_deadline}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Last date for candidates to submit applications
            </p>
          </div>

          {/* Publish Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publish Date <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="publish_at"
                value={formData.publish_at}
                onChange={handlePublishDateChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isScheduled ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                  } ${errors.publish_at ? 'border-red-500' : ''}`}
              />
              {isScheduled && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Scheduled
                  </span>
                </div>
              )}
            </div>
            {errors.publish_at && (
              <p className="mt-1 text-sm text-red-500">{errors.publish_at}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to publish immediately. Future date will schedule the job posting.
            </p>
          </div>
        </div>

        {/* Social Media Requirements */}
        <div className="border-t pt-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">Social Media Requirements</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="required_linkedin_link"
                checked={formData.required_linkedin_link}
                onChange={(e) => handleChange({ target: { name: 'required_linkedin_link', value: e.target.checked } })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                Require LinkedIn profile for application
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="required_facebook_link"
                checked={formData.required_facebook_link}
                onChange={(e) => handleChange({ target: { name: 'required_facebook_link', value: e.target.checked } })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                Require Facebook profile for application
              </span>
            </label>
          </div>
        </div>

        {/* Active Status */}
        <div className="border-t pt-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">Job Status</h3>

          <div className="space-y-3">
            <div className={`p-4 rounded-lg border ${isScheduled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
              }`}>
              <label className={`flex items-center gap-3 ${isScheduled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleActiveStatusChange}
                  disabled={isScheduled}
                  className={`w-4 h-4 rounded border-gray-300 focus:ring-blue-500 ${isScheduled ? 'bg-gray-100 cursor-not-allowed' : 'text-blue-600'
                    }`}
                />
                <div>
                  <span className={`text-sm ${isScheduled ? 'text-gray-400' : 'text-gray-700'}`}>
                    Active immediately
                  </span>
                  {!isScheduled && (
                    <p className="text-xs text-gray-500 mt-0.5">
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
                      <p className="text-sm text-blue-800">
                        <strong>Schedule Mode:</strong> This job is scheduled for future publishing.
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        The job will automatically become active on {formData.publish_at}.
                        You cannot manually activate it before this date.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error message for is_active */}
              {errors.is_active && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.is_active}
                </p>
              )}
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Jobs will automatically become inactive after the application deadline
          </p>
        </div>

        {/* Quick Summary Card */}
        <div className="border-t pt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Publishing Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${isScheduled ? 'text-blue-600' : formData.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                  {isScheduled ? 'Scheduled' : formData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {isScheduled && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Publish Date:</span>
                  <span className="font-medium text-gray-700">{formData.publish_at}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Deadline:</span>
                <span className="font-medium text-gray-700">{formData.application_deadline || 'Not set'}</span>
              </div>
              {!isScheduled && (
                <div className="flex justify-between">
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