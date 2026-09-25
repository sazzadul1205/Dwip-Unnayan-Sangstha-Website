 
// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/JobsEditor.jsx

import React, { useState, useEffect } from 'react';
import { FaExternalLinkAlt, FaBriefcase } from 'react-icons/fa';

/**
 * JobsEditor - Editor for JobsSection data
 * - Edits section title/description (stored in custom_section_data.data.section)
 * - Edits display settings (limit) stored in custom_section_data.data.section.limit
 * - Edits filter placeholder stored in custom_section_data.data.filter.placeholder
 * - Displays job listings (read-only, from Job Listings Manager)
 */
const JobsEditor = ({ section, hasData, onDataChange }) => {
  // ===== READ INITIAL STATE =====
  // Get data from section.data (custom_section_data)
  const sectionData = section?.data || {};

  // Get title/description/limit from section.data.section
  const sectionTitle = sectionData?.section?.title || 'Join our big family';
  const sectionDescription = sectionData?.section?.description ||
    "Join us on this journey of kindness, and let's make a difference, one act of charity at a time.";

  // ✅ Read limit from data.section.limit (NOT from custom_props)
  // If limit is 5 -> show 5 jobs
  // If limit is null/undefined/empty -> show all (treat as "Show All")
  const existingLimit = sectionData?.section?.limit;
  const [limit, setLimit] = useState(existingLimit ?? '');

  // ✅ Determine if "Show All" is checked based on whether limit exists
  const [showAll, setShowAll] = useState(
    existingLimit === undefined ||
    existingLimit === null ||
    existingLimit === '' ||
    existingLimit === 0
  );

  // Get filter placeholder from data.filter.placeholder
  const filterPlaceholder = sectionData?.filter?.placeholder || 'Browse By';

  // ===== LOCAL STATE =====
  const [title, setTitle] = useState(sectionTitle);
  const [description, setDescription] = useState(sectionDescription);
  const [placeholder, setPlaceholder] = useState(filterPlaceholder);

  // ===== NOTIFY PARENT OF CHANGES =====
  useEffect(() => {
    // ✅ Construct the updated data object
    // Store EVERYTHING in section.data (custom_section_data.data)
    // This matches the new system where limit is in data.section.limit

    // Determine the limit value to save
    const limitToSave = showAll ? undefined : (limit ? parseInt(limit) : 5);

    // Build the full data structure
    const updatedData = {
      section: {
        title,
        description,
        // ✅ Store limit in data.section.limit (NEW SYSTEM)
        limit: limitToSave,
      },
      filter: {
        placeholder,
      },
    };

    // Call onDataChange with the updated data
    // ✅ IMPORTANT: We DO NOT store limit in custom_props anymore
    // All data goes into the 'data' field
    onDataChange({
      data: updatedData, // This updates custom_section_data.data
      // ✅ custom_props should NOT contain limit anymore
      // Keep any existing custom_props that might be needed, but remove limit
      custom_props: {
        // Remove limit from custom_props if it exists
        // Keep other props that might be needed
        ...(section?.custom_props || {}),
        // Explicitly remove limit to avoid confusion
        limit: undefined,
      },
    });
  }, [title, description, limit, showAll, placeholder, onDataChange, section?.custom_props]);

  // ===== HANDLE SHOW ALL TOGGLE =====
  const handleShowAllChange = (checked) => {
    setShowAll(checked);
    if (checked) {
      setLimit(''); // Clear limit when "Show All" is checked
    } else {
      setLimit(5); // Default to 5 when switching to limited mode
    }
  };

  // ===== READ JOBS DATA (READ-ONLY) =====
  const jobs = sectionData?.jobs || [];
  const hasJobsData = hasData && jobs.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Jobs Section</h3>

      {/* ===== DISPLAY SETTINGS ===== */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Display Settings</h4>

        <div className="space-y-3">
          {/* Section Title */}
          <div>
            <label className="block text-xs text-gray-400 mb-0.5">Section Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Section title"
            />
            <p className="text-xs text-gray-400 mt-1">This title will be displayed at the top of the section.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-400 mb-0.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Section description"
            />
          </div>

          {/* ✅ Show All Toggle */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="showAllJobs"
              checked={showAll}
              onChange={(e) => handleShowAllChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showAllJobs" className="text-sm font-medium text-gray-700">
              Show all jobs (no limit)
            </label>
          </div>

          {/* ✅ Limit Input - Only visible when "Show All" is not checked */}
          {!showAll && (
            <div>
              <label className="block text-xs text-gray-400 mb-0.5">Number of Jobs to Display</label>
              <input
                type="number"
                min="1"
                max="50"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="e.g., 5"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum 1 – only this many jobs will be shown on the frontend.
                Uncheck "Show all" to display a limited number of jobs.
              </p>
            </div>
          )}

          {/* Filter Placeholder */}
          <div>
            <label className="block text-xs text-gray-400 mb-0.5">Filter Placeholder</label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Browse By"
            />
            <p className="text-xs text-gray-400 mt-1">Placeholder text for the filter dropdown.</p>
          </div>
        </div>
      </div>

      {/* ===== CURRENT SETTINGS SUMMARY ===== */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-1">Current Settings</h4>
        <div className="text-sm text-blue-700">
          <p>
            <span className="font-medium">Display mode:</span>{' '}
            {showAll ? (
              <span className="text-green-600 font-medium">Show all jobs</span>
            ) : (
              <span>Show <strong>{limit || '5'}</strong> job{limit !== '1' ? 's' : ''}</span>
            )}
          </p>
          <p className="mt-1">
            <span className="font-medium">Total jobs available:</span>{' '}
            <span className="font-medium">{jobs.length}</span>
          </p>
          {!showAll && jobs.length > (parseInt(limit) || 5) && (
            <p className="text-xs text-blue-600 mt-1">
              ⚡ {jobs.length - (parseInt(limit) || 5)} more job{(jobs.length - (parseInt(limit) || 5)) > 1 ? 's' : ''} will be hidden behind the "View All" button.
            </p>
          )}
          <p className="mt-1 text-xs text-blue-600">
            📍 Limit is stored in <code className="bg-blue-100 px-1 rounded">data.section.limit</code>
          </p>
        </div>
      </div>

      {/* ===== INFO BOX: JOB LISTINGS ===== */}
      <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <FaBriefcase size={20} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-purple-800">Job Listings Section</h4>
            <p className="text-sm text-purple-700 mt-1">
              This section displays job listings from the <strong>Job Listings Manager</strong>.
              It automatically shows active job openings.
            </p>
            <p className="text-xs text-purple-600 mt-1">
              To add, edit, or remove job listings, please go to the Job Listings Manager.
              Changes made there will automatically reflect here.
            </p>
          </div>
        </div>
      </div>

      {/* ===== JOB COUNT AND PREVIEW ===== */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Current Job Listings</h4>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
          {hasJobsData ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                <span className="font-medium">{jobs.length}</span> job
                {jobs.length > 1 ? 's' : ''} available
                {!showAll && limit && jobs.length > parseInt(limit) && (
                  <span className="text-blue-600"> (showing {limit} of {jobs.length})</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1">
                {(showAll ? jobs : jobs.slice(0, parseInt(limit) || 5)).map((job, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    {job.title || `Job ${idx + 1}`}
                  </span>
                ))}
                {!showAll && jobs.length > (parseInt(limit) || 5) && (
                  <span className="text-xs text-gray-400 px-2 py-1">
                    +{jobs.length - (parseInt(limit) || 5)} more
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">No job listings available</p>
              <p className="text-xs text-gray-400 mt-1">
                Add job listings in the Job Listings Manager
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== SECTION SETTINGS ===== */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Section Settings</h4>
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <span className="text-xs text-gray-500">Data Table</span>
            <p className="text-sm font-medium text-gray-700">custom_section_data</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Data Key</span>
            <p className="text-sm font-medium text-gray-700">{section.data_key || 'jobsData'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Component</span>
            <p className="text-sm font-medium text-gray-700">JobsSection</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Status</span>
            <p className={`text-sm font-medium ${hasJobsData ? 'text-green-600' : 'text-gray-400'}`}>
              {hasJobsData ? '✅ Has Jobs' : 'No Jobs'}
            </p>
          </div>
        </div>
      </div>

      {/* ===== DATA STRUCTURE PREVIEW ===== */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-600 mb-1">Data Structure Preview</h4>
        <pre className="text-xs text-gray-500 bg-white p-2 rounded border border-gray-200 overflow-x-auto">
          {`{
  "section": {
    "title": "${title}",
    "description": "${description.substring(0, 30)}${description.length > 30 ? '...' : ''}",
    "limit": ${showAll ? 'undefined (show all)' : (limit || 5)}
  },
  "filter": {
    "placeholder": "${placeholder}"
  }
}`}
        </pre>
      </div>

      {/* ===== QUICK STATS ===== */}
      {hasJobsData && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Quick Stats</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <span className="text-xs text-gray-500">Total</span>
              <p className="text-lg font-bold text-blue-600">{jobs.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <span className="text-xs text-gray-500">Active</span>
              <p className="text-lg font-bold text-green-600">
                {jobs.filter(j => j.is_active !== false).length}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <span className="text-xs text-gray-500">Featured</span>
              <p className="text-lg font-bold text-purple-600">
                {jobs.filter(j => j.is_featured).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== ACTION BUTTON ===== */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            window.location.href = route('backend.listing.index');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
        >
          <FaExternalLinkAlt size={14} />
          Go to Job Listings Manager
        </button>
      </div>

      {/* ===== FOOTER NOTE ===== */}
      <div className="mt-3 text-xs text-gray-400 border-t border-gray-200 pt-3">
        <p>
          💡 <strong>Note:</strong> The title, description, and limit are stored in <code className="bg-gray-100 px-1 rounded">data.section</code>.
          The job listings themselves are managed in the <strong>Job Listings Manager</strong>.
        </p>
        <p className="mt-1">
          📍 To manage jobs, navigate to <strong>Job Listings Manager</strong> in the sidebar.
        </p>
        <p className="mt-1 text-blue-600">
          🔄 When "Show all jobs" is checked, the <code className="bg-blue-100 px-1 rounded">limit</code> field will be <code className="bg-blue-100 px-1 rounded">undefined</code>, and all jobs will be displayed.
          When a limit is set, only that many jobs will be shown with a "View All" button.
        </p>
        <p className="mt-1 text-green-600">
          ✅ The frontend <code className="bg-green-100 px-1 rounded">JobsSection</code> component reads the limit from <code className="bg-green-100 px-1 rounded">data.section.limit</code>.
        </p>
      </div>
    </div>
  );
};

export default JobsEditor;