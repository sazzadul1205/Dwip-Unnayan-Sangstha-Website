 
// resources/js/pages/Backend/CMS/Section/components/modals/Editors/FAQEditor.jsx

// React
import React from 'react';

// Icons
import { FaExternalLinkAlt, FaQuestionCircle } from 'react-icons/fa';

/**
 * FAQEditor - READ-ONLY redirect notice for page-level FAQSection rows.
 * This section uses Shared Data from the Shared Data Manager.
 * The CANONICAL editable form lives at Shared/Modals/FaqEditor.jsx —
 * do NOT add form fields here, or FAQ edits will split across two places.
 * Features:
 * - Shows information about the section
 * - Provides link to Shared Data Manager for editing
 * - Displays preview of FAQ data
 * - Not editable directly (read-only)
 */
const FAQEditor = ({ section, hasData }) => {
  // ===== DATA EXTRACTION =====
  // This uses Shared Data - managed through the Shared Data Manager
  // No form fields needed - just informational display

  // Get the FAQ data from section
  const data = section?.data || {};
  const faqs = data?.faqs || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">FAQ Section</h3>

      {/* ===== INFO BOX: SHARED DATA ===== */}
      {/* Explains that this section uses Shared Data managed elsewhere */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <FaQuestionCircle size={20} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Shared Data Section</h4>
            <p className="text-sm text-blue-700 mt-1">
              This section uses data from the <strong>Shared Data Manager</strong>.
              It displays frequently asked questions that are managed centrally.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              To add, edit, or remove FAQs, please go to the Shared Data Manager.
              Changes made there will automatically reflect here.
            </p>
          </div>
        </div>
      </div>

      {/* ===== FAQ COUNT AND PREVIEW ===== */}
      {/* Shows how many FAQs are available and previews the first few */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Current FAQs</h4>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
          {hasData && faqs.length > 0 ? (
            <div className="space-y-2">
              {/* FAQ count */}
              <p className="text-xs text-gray-500">
                <span className="font-medium">{faqs.length}</span> FAQ
                {faqs.length > 1 ? 's' : ''} available
              </p>
              {/* FAQ tags - show first 3 */}
              <div className="flex flex-wrap gap-1">
                {faqs.slice(0, 3).map((faq, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {faq.question || `FAQ ${idx + 1}`}
                  </span>
                ))}
                {/* Show "+N more" if more than 3 FAQs */}
                {faqs.length > 3 && (
                  <span className="text-xs text-gray-400 px-2 py-1">
                    +{faqs.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ) : (
            // Empty state - no FAQs
            <p className="text-sm text-gray-400">No FAQs available</p>
          )}
        </div>
      </div>

      {/* ===== FAQ SECTION SETTINGS ===== */}
      {/* Shows configuration details for this section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Section Settings</h4>
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {/* Data Table */}
          <div>
            <span className="text-xs text-gray-500">Data Table</span>
            <p className="text-sm font-medium text-gray-700">shared_data</p>
          </div>
          {/* Data Key */}
          <div>
            <span className="text-xs text-gray-500">Data Key</span>
            <p className="text-sm font-medium text-gray-700">{section.data_key || 'faqData'}</p>
          </div>
          {/* Type */}
          <div>
            <span className="text-xs text-gray-500">Type</span>
            <p className="text-sm font-medium text-gray-700">faq</p>
          </div>
          {/* Status - has data or not */}
          <div>
            <span className="text-xs text-gray-500">Status</span>
            <p className={`text-sm font-medium ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
              {hasData ? '✅ Has Data' : 'No Data'}
            </p>
          </div>
        </div>
      </div>

      {/* ===== FAQ PREVIEW ===== */}
      {/* Shows the first 3 FAQs with questions and answers */}
      {hasData && faqs.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">FAQ Preview</h4>
          <div className="space-y-2">
            {faqs.slice(0, 3).map((faq, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                {/* Question */}
                <p className="text-xs font-medium text-gray-700">
                  {faq.question || `Question ${idx + 1}`}
                </p>
                {/* Answer (truncated) */}
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {faq.answer || 'No answer provided'}
                </p>
              </div>
            ))}
            {/* Show if more FAQs exist */}
            {faqs.length > 3 && (
              <p className="text-xs text-gray-400 text-center">
                + {faqs.length - 3} more FAQs available
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== ACTION BUTTON ===== */}
      {/* Navigates user to the Shared Data Manager where they can edit */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            window.location.href = route('backend.cms.shared.index');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          <FaExternalLinkAlt size={14} />
          Go to Shared Data Manager
        </button>
      </div>

      {/* ===== FOOTER NOTE ===== */}
      {/* Reminder that this section is read-only and where to make changes */}
      <div className="mt-3 text-xs text-gray-400 border-t border-gray-200 pt-3">
        <p>
          💡 <strong>Note:</strong> This section uses Shared Data and does not have editable fields directly.
          All FAQ data is managed through the Shared Data Manager.
          Changes made there will automatically reflect here.
        </p>
        <p className="mt-1">
          📍 To edit FAQs, navigate to <strong>Shared Data Manager → FAQ Section</strong>
        </p>
      </div>
    </div>
  );
};

export default FAQEditor;