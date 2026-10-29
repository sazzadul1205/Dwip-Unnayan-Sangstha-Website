// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/PublicationsEditor.jsx

import { FaFileAlt } from 'react-icons/fa';
import ExternalManagerRedirect from '../../Shared/SectionEditor/ExternalManagerRedirect';

const PublicationsEditor = ({ section, hasData }) => {
  const data = section?.data || [];
  const publications = Array.isArray(data) ? data : [];

  return (
    <ExternalManagerRedirect
      sectionTitle="Publications Section"
      icon={FaFileAlt}
      tone="indigo"
      heading="Controlled by Publications Manager"
      description={<>This section displays publications from the <strong>Publications Manager</strong>. It automatically shows all active publications.</>}
      hint="To add, edit, or remove publications, please go to the Publications Manager."
      listLabel="Current Publications"
      itemNoun="publication"
      items={publications.map((p, idx) => p.title || `Publication ${idx + 1}`)}
      emptyList={
        <div className="py-2 text-center">
          <p className="text-sm text-slate-500">No publications available</p>
          <p className="mt-0.5 text-xs text-slate-400">Add publications in the Publications Manager</p>
        </div>
      }
      noDataTitle="No publications have been created yet."
      noDataHint="Go to the Publications Manager to create your first publication."
      actionLabel="Go to Publications Manager"
      actionRoute="backend.cms.publications.index"
      hasData={hasData}
      footerNote={
        <p>Publication content is managed centrally. Edit records in the Publications Manager and they will appear here automatically.</p>
      }
    >
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">
        <div>
          <span className="block text-xs text-slate-400">Data Table</span>
          <p className="font-mono text-slate-700">publications</p>
        </div>
        <div>
          <span className="block text-xs text-slate-400">Data Key</span>
          <p className="font-mono text-slate-700">{section.data_key || 'publicationsData'}</p>
        </div>
        <div>
          <span className="block text-xs text-slate-400">Component</span>
          <p className="font-mono text-slate-700">PublicationsSection</p>
        </div>
        <div>
          <span className="block text-xs text-slate-400">Status</span>
          <p className={`font-medium ${hasData ? 'text-emerald-600' : 'text-slate-400'}`}>
            {hasData ? 'Has publications' : 'No publications'}
          </p>
        </div>
      </div>

      {hasData && publications.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-2.5 text-center">
            <span className="block text-[11px] font-medium text-indigo-600">Total</span>
            <p className="text-lg font-bold tabular-nums text-indigo-700">{publications.length}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-center">
            <span className="block text-[11px] font-medium text-emerald-600">Active</span>
            <p className="text-lg font-bold tabular-nums text-emerald-700">
              {publications.filter((p) => p.is_active !== false).length}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-center">
            <span className="block text-[11px] font-medium text-amber-600">Featured</span>
            <p className="text-lg font-bold tabular-nums text-amber-700">
              {publications.filter((p) => p.is_featured).length}
            </p>
          </div>
        </div>
      )}
    </ExternalManagerRedirect>
  );
};

export default PublicationsEditor;