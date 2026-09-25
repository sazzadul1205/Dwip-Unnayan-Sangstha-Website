 
// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/OurProgramsEditor.jsx

import React, { useState, useEffect } from 'react';
import { FaExternalLinkAlt, FaList } from 'react-icons/fa';
import { NumberField } from './shared/Fields';

const OurProgramsEditor = ({ section, hasData, onDataChange }) => {
  // ===== STATE MANAGEMENT =====
  // Get custom props for display settings
  const customProps = section?.custom_props || {};

  const [displayLimit, setDisplayLimit] = useState(customProps?.limit ?? 3);
  const [showFeatured, setShowFeatured] = useState(customProps?.showFeatured !== false);
  const [bgColor, setBgColor] = useState(customProps?.bgColor || 'bg-white');

  // ===== SYNC LOCAL STATE WITH PROPS =====
  // When section changes, update local state
  useEffect(() => {
    const props = section?.custom_props || {};
    setDisplayLimit(props?.limit ?? 3);
    setShowFeatured(props?.showFeatured !== false);
    setBgColor(props?.bgColor || 'bg-white');
  }, [section?.custom_props]);

  // ===== NOTIFY PARENT OF CHANGES =====
  // When any setting changes, notify parent via onDataChange
  useEffect(() => {
    if (onDataChange) {
      const updatedProps = {
        limit: displayLimit,
        showFeatured,
        bgColor,
      };

      // Send both the custom_props update AND the full data
      // This ensures the parent has everything needed for saving
      onDataChange({
        custom_props: updatedProps,
        // Include existing data to preserve it
        ...(section?.data || {})
      });
    }
  }, [displayLimit, showFeatured, bgColor, onDataChange, section?.data]);

  // ===== HANDLERS =====
  const handleLimitChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setDisplayLimit(Math.max(1, value));
  };

  const handleShowFeaturedChange = (e) => {
    setShowFeatured(e.target.checked);
  };

  const handleBgColorChange = (e) => {
    setBgColor(e.target.value);
  };

  // Rest of your component remains the same...
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Our Programs Section</h3>

      {/* ===== DISPLAY SETTINGS ===== */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Display Settings</h4>

        <div className="space-y-3">
          {/* Display Limit - Number of programs to show */}
          <div>
            <NumberField
              label="Display Limit"
              value={displayLimit}
              onChange={handleLimitChange}
              placeholder="Number of programs to display"
            />
            <p className="text-xs text-gray-400 mt-1">
              How many programs to show on the frontend (minimum 1)
            </p>
          </div>

          {/* Show Featured First - Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showFeatured"
              checked={showFeatured}
              onChange={handleShowFeaturedChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="showFeatured" className="text-sm text-gray-700 font-medium">
              Show Featured Programs First
            </label>
            <span className="text-xs text-gray-400 ml-2">(Prioritize featured programs)</span>
          </div>

          {/* Background Color - Optional */}
          <div>
            <label className="block text-xs text-gray-400 mb-0.5">Background Color Class</label>
            <input
              type="text"
              value={bgColor}
              onChange={handleBgColorChange}
              placeholder="bg-white"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <p className="text-xs text-gray-400 mt-1">Tailwind CSS background color class (e.g., bg-white, bg-gray-50)</p>
          </div>
        </div>
      </div>

      {/* ===== INFO BOX: SPECIAL SECTION ===== */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <FaList size={20} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Special Section</h4>
            <p className="text-sm text-blue-700 mt-1">
              This section displays programs from the <strong>Program Manager</strong>.
              It will show {displayLimit} program{displayLimit > 1 ? 's' : ''}
              {showFeatured ? ' (featured programs prioritized)' : ''}.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              To add, edit, or remove programs, please go to the Program Manager.
            </p>
          </div>
        </div>
      </div>

      {/* ===== CURRENT SETTINGS ===== */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Current Settings</h4>
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <span className="text-xs text-gray-500">Display Limit</span>
            <p className="text-sm font-medium text-gray-700">{displayLimit} programs</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Featured Priority</span>
            <p className="text-sm font-medium text-gray-700">
              {showFeatured ? '✅ Featured first' : '❌ Not prioritized'}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Data Table</span>
            <p className="text-sm font-medium text-gray-700">{section.data_table || 'programs'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Data Key</span>
            <p className="text-sm font-medium text-gray-700">{section.data_key || 'ourProgramsData'}</p>
          </div>
        </div>
      </div>

      {/* ===== AVAILABLE PROGRAMS PREVIEW ===== */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Available Programs</h4>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
          {hasData && section.data ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                {Array.isArray(section.data) ? (
                  <>
                    <span className="font-medium">{section.data.length}</span> program
                    {section.data.length > 1 ? 's' : ''} available
                    {displayLimit && section.data.length > displayLimit && (
                      <span className="text-blue-600"> (showing {displayLimit} of {section.data.length})</span>
                    )}
                  </>
                ) : (
                  'Program data available'
                )}
              </p>
              {Array.isArray(section.data) && section.data.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {section.data.slice(0, displayLimit || 3).map((program, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {program.title || `Program ${idx + 1}`}
                    </span>
                  ))}
                  {displayLimit && section.data.length > displayLimit && (
                    <span className="text-xs text-gray-400 px-2 py-1">
                      +{section.data.length - displayLimit} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No programs available</p>
          )}
        </div>
      </div>

      {/* ===== ACTION BUTTON ===== */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            window.location.href = route('backend.cms.programs.index');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          <FaExternalLinkAlt size={14} />
          Go to Program Manager
        </button>
      </div>

      {/* ===== FOOTER NOTE ===== */}
      <div className="mt-3 text-xs text-gray-400 border-t border-gray-200 pt-3">
        <p>
          💡 <strong>Note:</strong> This section displays programs from the Program Manager.
          Use the settings above to control how many programs are shown and their order.
        </p>
        <p className="mt-1">
          📍 To manage programs, navigate to <strong>Program Manager</strong> in the sidebar.
        </p>
      </div>
    </div>
  );
};

export default OurProgramsEditor;