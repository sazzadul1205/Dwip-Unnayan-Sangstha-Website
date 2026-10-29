// resources/js/Sections/JobsSection/JobsEditor.jsx
// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/JobsEditor.jsx

import { useState, useEffect } from 'react';
import { FaExternalLinkAlt, FaBriefcase, FaCog } from 'react-icons/fa';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { NumberField, TextAreaField, TextField } from '../../Shared/SectionEditor/Fields';

const JobsEditor = ({ section, hasData, onDataChange }) => {
  const sectionData = section?.data || {};
  const existingLimit = sectionData?.section?.limit;
  const [limit, setLimit] = useState(existingLimit ?? '');
  const [showAll, setShowAll] = useState(
    existingLimit === undefined || existingLimit === null || existingLimit === '' || existingLimit === 0
  );
  const [title, setTitle] = useState(sectionData?.section?.title || 'Join our big family');
  const [description, setDescription] = useState(
    sectionData?.section?.description || "Join us on this journey of kindness, and let's make a difference, one act of charity at a time."
  );
  const [placeholder, setPlaceholder] = useState(sectionData?.filter?.placeholder || 'Browse By');

  useEffect(() => {
    const limitToSave = showAll ? undefined : (limit ? parseInt(limit) : 5);
    onDataChange?.({
      data: {
        section: { title, description, limit: limitToSave },
        filter: { placeholder },
      },
      custom_props: { ...(section?.custom_props || {}), limit: undefined },
    });
  }, [title, description, limit, showAll, placeholder, onDataChange, section?.custom_props]);

  const handleShowAllChange = (checked) => {
    setShowAll(checked);
    if (checked) setLimit('');
    else setLimit(5);
  };

  const jobs = sectionData?.jobs || [];
  const hasJobsData = hasData && jobs.length > 0;
  const limitedJobs = showAll ? jobs : jobs.slice(0, parseInt(limit) || 5);

  return (
    <div className="space-y-5">
      <EditorSection icon={FaCog} title="Display Settings" description="Section heading, description, and how many jobs to show" tone="blue">
        <TextField label="Section title" value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Section title" />
        <TextAreaField label="Description" value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Section description" rows={2} />
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300">
          <input type="checkbox" checked={showAll} onChange={(e) => handleShowAllChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-blue-600" />
          <span>
            <span className="block text-sm font-medium text-slate-700">Show all jobs (no limit)</span>
            <span className="mt-0.5 block text-xs text-slate-500">Uncheck to display a limited number</span>
          </span>
        </label>
        {!showAll && (
          <NumberField label="Number of jobs to display" value={limit}
            onChange={(e) => setLimit(e.target.value)} placeholder="5" min={1} max={50} />
        )}
        <TextField label="Filter placeholder" value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          placeholder="Browse By" />
      </EditorSection>

      <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
        <h4 className="mb-1.5 text-sm font-semibold text-blue-900">Current settings</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p>
            <span className="font-medium">Display mode:</span>{' '}
            {showAll ? <span className="text-emerald-700">Show all jobs</span> : `Show ${limit || 5} job${limit !== '1' ? 's' : ''}`}
          </p>
          <p>
            <span className="font-medium">Total jobs available:</span> {jobs.length}
          </p>
          {!showAll && jobs.length > (parseInt(limit) || 5) && (
            <p className="text-xs text-blue-700">
              {jobs.length - (parseInt(limit) || 5)} more job{(jobs.length - (parseInt(limit) || 5)) > 1 ? 's' : ''} hidden behind "View All"
            </p>
          )}
        </div>
      </div>

      <EditorSection
        icon={FaBriefcase}
        title="Current Job Listings"
        description={`${jobs.length} job${jobs.length === 1 ? '' : 's'} from Job Listings Manager`}
        tone="violet"
      >
        {hasJobsData ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              Showing <span className="font-medium text-slate-700">{limitedJobs.length}</span> of {jobs.length}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {limitedJobs.map((job, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  {job.title || `Job ${idx + 1}`}
                </span>
              ))}
              {!showAll && jobs.length > (parseInt(limit) || 5) && (
                <span className="px-2 py-1 text-xs text-slate-400">
                  +{jobs.length - (parseInt(limit) || 5)} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-500">No job listings available</p>
            <p className="mt-0.5 text-xs text-slate-400">Add job listings in the Job Listings Manager</p>
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button type="button"
            onClick={() => { window.location.href = route('backend.listing.index'); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-600/25 transition hover:bg-violet-700">
            <FaExternalLinkAlt size={10} /> Go to Job Listings Manager
          </button>
        </div>
      </EditorSection>

      {hasJobsData && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-2.5 text-center">
            <span className="block text-[11px] font-medium text-blue-600">Total</span>
            <p className="text-lg font-bold tabular-nums text-blue-700">{jobs.length}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-center">
            <span className="block text-[11px] font-medium text-emerald-600">Active</span>
            <p className="text-lg font-bold tabular-nums text-emerald-700">
              {jobs.filter((j) => j.is_active !== false).length}
            </p>
          </div>
          <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-2.5 text-center">
            <span className="block text-[11px] font-medium text-violet-600">Featured</span>
            <p className="text-lg font-bold tabular-nums text-violet-700">
              {jobs.filter((j) => j.is_featured).length}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs md:grid-cols-4">
        <div>
          <span className="block text-slate-400">Data table</span>
          <span className="font-mono text-slate-700">custom_section_data</span>
        </div>
        <div>
          <span className="block text-slate-400">Data key</span>
          <span className="font-mono text-slate-700">{section.data_key || 'jobsData'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Component</span>
          <span className="font-mono text-slate-700">JobsSection</span>
        </div>
        <div>
          <span className="block text-slate-400">Status</span>
          <span className={`font-medium ${hasJobsData ? 'text-emerald-600' : 'text-slate-400'}`}>
            {hasJobsData ? 'Has jobs' : 'No jobs'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default JobsEditor;
