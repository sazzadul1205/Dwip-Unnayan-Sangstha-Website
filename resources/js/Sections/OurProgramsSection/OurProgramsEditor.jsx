// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/OurProgramsEditor.jsx

import React, { useState, useEffect } from 'react';
import { FaExternalLinkAlt, FaList, FaCog } from 'react-icons/fa';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { NumberField, TextField } from '../../Shared/SectionEditor/Fields';

const OurProgramsEditor = ({ section, onDataChange }) => {
  const customProps = section?.custom_props || {};
  const [displayLimit, setDisplayLimit] = useState(customProps?.limit ?? 3);
  const [showFeatured, setShowFeatured] = useState(customProps?.showFeatured !== false);
  const [bgColor, setBgColor] = useState(customProps?.bgColor || 'bg-white');

  useEffect(() => {
    const props = section?.custom_props || {};
    setDisplayLimit(props?.limit ?? 3);
    setShowFeatured(props?.showFeatured !== false);
    setBgColor(props?.bgColor || 'bg-white');
  }, [section?.custom_props]);

  useEffect(() => {
    onDataChange?.({
      custom_props: { limit: displayLimit, showFeatured, bgColor },
      ...(section?.data || {}),
    });
  }, [displayLimit, showFeatured, bgColor, onDataChange, section?.data]);

  const programs = Array.isArray(section?.data) ? section.data : [];
  const visiblePrograms = programs.slice(0, displayLimit || 3);

  return (
    <div className="space-y-5">
      <EditorSection icon={FaCog} title="Display Settings" description="How many programs to display and their order" tone="blue">
        <NumberField label="Display limit" value={displayLimit}
          onChange={(e) => setDisplayLimit(Math.max(1, parseInt(e.target.value) || 1))}
          placeholder="3" min={1} />
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300">
          <input type="checkbox" checked={showFeatured} onChange={(e) => setShowFeatured(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-blue-600" />
          <span>
            <span className="block text-sm font-medium text-slate-700">Show featured first</span>
            <span className="mt-0.5 block text-xs text-slate-500">Prioritize featured programs</span>
          </span>
        </label>
        <TextField label="Background color class" value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          placeholder="bg-white"
          hint="Tailwind class (e.g. bg-white, bg-gray-50)" />
      </EditorSection>

      <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
        <h4 className="mb-1 text-sm font-semibold text-blue-900">Special section</h4>
        <p className="text-sm text-blue-800">
          Displays programs from <strong>Program Manager</strong>. Currently showing{' '}
          <strong>{displayLimit}</strong> program{displayLimit > 1 ? 's' : ''}
          {showFeatured && ' (featured first)'}.
        </p>
      </div>

      <EditorSection icon={FaList} title="Available Programs"
        description={`${programs.length} program${programs.length === 1 ? '' : 's'} • Showing ${visiblePrograms.length}`}
        tone="orange">
        {programs.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {visiblePrograms.map((p, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {p.title || `Program ${idx + 1}`}
              </span>
            ))}
            {programs.length > displayLimit && (
              <span className="px-2 py-1 text-xs text-slate-400">
                +{programs.length - displayLimit} more
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No programs available</p>
        )}
        <div className="flex justify-end pt-2">
          <button type="button"
            onClick={() => { window.location.href = route('backend.cms.programs.index'); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
            <FaExternalLinkAlt size={10} /> Go to Program Manager
          </button>
        </div>
      </EditorSection>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs md:grid-cols-4">
        <div>
          <span className="block text-slate-400">Display limit</span>
          <span className="font-medium text-slate-700">{displayLimit}</span>
        </div>
        <div>
          <span className="block text-slate-400">Featured first</span>
          <span className="font-medium text-slate-700">{showFeatured ? 'Yes' : 'No'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data table</span>
          <span className="font-mono text-slate-700">{section.data_table || 'programs'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data key</span>
          <span className="font-mono text-slate-700">{section.data_key || 'ourProgramsData'}</span>
        </div>
      </div>
    </div>
  );
};

export default OurProgramsEditor;