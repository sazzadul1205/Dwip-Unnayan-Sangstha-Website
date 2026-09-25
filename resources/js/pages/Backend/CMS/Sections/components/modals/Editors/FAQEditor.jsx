// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/FAQEditor.jsx
// READ-ONLY redirect notice for page-level FAQSection rows.
// This section uses Shared Data from the Shared Data Manager.
// The CANONICAL editable form lives at Shared/Modals/FaqEditor.jsx —
// do NOT add form fields here, or FAQ edits will split across two places.

// React
import React from 'react';

// Icons
import { FaQuestionCircle } from 'react-icons/fa';

// Shared generic redirect notice
import ExternalManagerRedirect from './shared/ExternalManagerRedirect';

const FAQEditor = ({ section, hasData }) => {
  // ===== DATA EXTRACTION =====
  // This uses Shared Data - managed through the Shared Data Manager.
  // No form fields needed - just informational display.
  const data = section?.data || {};
  const faqs = data?.faqs || [];

  return (
    <ExternalManagerRedirect
      sectionTitle="FAQ Section"
      icon={FaQuestionCircle}
      tone="blue"
      heading="Shared Data Section"
      description={
        <>
          This section uses data from the <strong>Shared Data Manager</strong>. It displays
          frequently asked questions that are managed centrally.
        </>
      }
      hint="To add, edit, or remove FAQs, please go to the Shared Data Manager. Changes made there will automatically reflect here."
      listLabel="Current FAQs"
      itemNoun="faq"
      items={faqs.map((faq, idx) => faq.question || `FAQ ${idx + 1}`)}
      emptyList={<p className="text-sm text-gray-400">No FAQs available</p>}
      actionLabel="Go to Shared Data Manager"
      actionRoute="backend.cms.shared.index"
      hasData={hasData}
      footerNote={
        <>
          <p>
            💡 <strong>Note:</strong> This section uses Shared Data and does not have editable
            fields directly. All FAQ data is managed through the Shared Data Manager. Changes
            made there will automatically reflect here.
          </p>
          <p className="mt-1">
            📍 To edit FAQs, navigate to <strong>Shared Data Manager → FAQ Section</strong>
          </p>
        </>
      }
    >
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

    </ExternalManagerRedirect>
  );
};

export default FAQEditor;
