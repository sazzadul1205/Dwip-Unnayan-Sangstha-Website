// resources/js/pages/Backend/CMS/Section/components/modals/Editors/PublicationsEditor.jsx
// READ-ONLY redirect notice for page-level PublicationsSection rows.
// This section is controlled by the Publications Manager — do NOT add form fields here.

// React
import React from 'react';

// Icons
import { FaFileAlt } from 'react-icons/fa';

// Shared generic redirect notice
import ExternalManagerRedirect from './shared/ExternalManagerRedirect';

const PublicationsEditor = ({ section, hasData }) => {
  // ===== DATA EXTRACTION =====
  // Get publications data from section - this is read-only
  const data = section?.data || [];
  const publications = Array.isArray(data) ? data : [];

  return (
    <ExternalManagerRedirect
      sectionTitle="Publications Section"
      icon={FaFileAlt}
      tone="indigo"
      heading="Controlled by Publications Manager"
      description={
        <>
          This section displays publications from the <strong>Publications Manager</strong>. It
          automatically shows all active publications.
        </>
      }
      hint="To add, edit, or remove publications, please go to the Publications Manager. Changes made there will automatically reflect here."
      listLabel="Current Publications"
      itemNoun="publication"
      items={publications.map((pub, idx) => pub.title || `Publication ${idx + 1}`)}
      emptyList={
        // Empty state - no publications
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">No publications available</p>
          <p className="text-xs text-gray-400 mt-1">
            Add publications in the Publications Manager
          </p>
        </div>
      }
      noDataTitle="No publications have been created yet."
      noDataHint="Go to the Publications Manager to create your first publication."
      actionLabel="Go to Publications Manager"
      actionRoute="backend.cms.publications.index"
      hasData={hasData}
      footerNote={
        <>
          <p>
            💡 <strong>Note:</strong> This section is controlled by the Publications Manager. You
            cannot edit publication content directly here.
          </p>
          <p className="mt-1">
            📍 To manage publications, navigate to <strong>Publications Manager</strong> in the CMS
            sidebar. All changes made there will automatically appear in this section.
          </p>
        </>
      }
    >
      {/* ===== SECTION SETTINGS ===== */}
      {/* Shows configuration details for this section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Section Settings</h4>
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <span className="text-xs text-gray-500">Data Table</span>
            <p className="text-sm font-medium text-gray-700">publications</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Data Key</span>
            <p className="text-sm font-medium text-gray-700">
              {section.data_key || 'publicationsData'}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Component</span>
            <p className="text-sm font-medium text-gray-700">PublicationsSection</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Status</span>
            <p className={`text-sm font-medium ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
              {hasData ? '✅ Has Publications' : 'No Publications'}
            </p>
          </div>
        </div>
      </div>

      {/* ===== PUBLICATION STATS ===== */}
      {/* Shows statistics about publications (total, active, featured) */}
      {hasData && publications.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Publication Stats</h4>
          <div className="grid grid-cols-3 gap-2">
            {/* Total publications */}
            <div className="bg-indigo-50 rounded-lg p-2 text-center">
              <span className="text-xs text-gray-500">Total</span>
              <p className="text-lg font-bold text-indigo-600">{publications.length}</p>
            </div>
            {/* Active publications */}
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <span className="text-xs text-gray-500">Active</span>
              <p className="text-lg font-bold text-green-600">
                {publications.filter((p) => p.is_active !== false).length}
              </p>
            </div>
            {/* Featured publications */}
            <div className="bg-yellow-50 rounded-lg p-2 text-center">
              <span className="text-xs text-gray-500">Featured</span>
              <p className="text-lg font-bold text-yellow-600">
                {publications.filter((p) => p.is_featured).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== RECENT PUBLICATION PREVIEW ===== */}
      {/* Shows preview of the most recent 2 publications */}
      {hasData && publications.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Publication Preview</h4>
          <div className="space-y-2">
            {publications.slice(0, 2).map((pub, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                {/* Publication title */}
                <p className="text-xs font-medium text-gray-700">
                  {pub.title || `Publication ${idx + 1}`}
                </p>
                {/* Publication excerpt (if available) */}
                {pub.excerpt && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pub.excerpt}</p>
                )}
                {/* Publication date (if available) */}
                {pub.date && <p className="text-xs text-gray-400 mt-1">{pub.date}</p>}
                {/* Publication author (if available) */}
                {pub.author && (
                  <p className="text-xs text-gray-400 mt-0.5">By {pub.author}</p>
                )}
              </div>
            ))}
            {/* Show if more publications exist */}
            {publications.length > 2 && (
              <p className="text-xs text-gray-400 text-center">
                + {publications.length - 2} more publications available
              </p>
            )}
          </div>
        </div>
      )}

    </ExternalManagerRedirect>
  );
};

export default PublicationsEditor;
