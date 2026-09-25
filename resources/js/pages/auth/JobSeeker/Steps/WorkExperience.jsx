// pages/auth/Steps/WorkExperience.jsx
import { FaPlus, FaTrashAlt, FaCheckCircle, FaBuilding, FaBriefcase, FaCalendarAlt, FaSuitcase } from 'react-icons/fa';
import { MdWork } from 'react-icons/md';
import Swal from 'sweetalert2';

const MAX_EXPERIENCES = 3;

const WorkExperience = ({ data, setData }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

  const addJobHistory = () => {
    if (data.job_histories.length >= MAX_EXPERIENCES) {
      Swal.fire({ icon: 'warning', title: 'Limit reached', text: `Up to ${MAX_EXPERIENCES} experiences.`, timer: 2500, showConfirmButton: false });
      return;
    }
    setData('job_histories', [
      ...data.job_histories,
      { id: Date.now(), company_name: '', position: '', starting_year: currentYear, ending_year: null, is_current: false },
    ]);
  };

  const update = (index, field, value) => {
    const updated = [...data.job_histories];
    if (field === 'is_current' && value === true) {
      updated.forEach((job, i) => { if (i !== index) { job.is_current = false; job.ending_year = null; } });
      updated[index].is_current = true;
      updated[index].ending_year = null;
    } else {
      updated[index][field] = value;
    }
    const job = updated[index];
    if (!job.is_current && job.starting_year && job.ending_year && job.ending_year < job.starting_year) {
      Swal.fire({ icon: 'error', title: 'Invalid range', text: 'Ending year must be after starting year.', timer: 2500, showConfirmButton: false });
      return;
    }
    setData('job_histories', updated);
  };

  const remove = (index) => setData('job_histories', data.job_histories.filter((_, i) => i !== index));

  const currentCount = data.job_histories.filter((j) => j.is_current).length;
  const inputCls = "w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400";
  const labelCls = "flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MdWork className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Where have you worked?</h2>
            <p className="text-xs text-gray-500">Optional · add up to {MAX_EXPERIENCES} roles</p>
          </div>
        </div>
        <span className="text-xs font-medium text-gray-500 tabular-nums">
          {data.job_histories.length}/{MAX_EXPERIENCES}
        </span>
      </div>

      {/* Empty state */}
      {data.job_histories.length === 0 && (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
          <FaSuitcase className="h-6 w-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">No experience yet</p>
          <p className="text-xs text-gray-400 mt-1">Fresher? Skip this step — you can add it later.</p>
        </div>
      )}

      {data.job_histories.map((job, index) => {
        const availableEndingYears = years.filter((y) => y >= (job.starting_year || 0));
        const canMarkCurrent = job.is_current || currentCount < 1;

        return (
          <div key={job.id} className="p-4 border border-gray-200 rounded-xl bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                {job.is_current && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                    <FaCheckCircle className="h-2.5 w-2.5" /> Current
                  </span>
                )}
              </div>
              <button
                onClick={() => remove(index)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                aria-label="Remove"
              >
                <FaTrashAlt className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}><FaBuilding className="h-3 w-3 text-gray-400" /> Company</label>
                <input type="text" value={job.company_name} onChange={(e) => update(index, 'company_name', e.target.value)} className={inputCls} placeholder="e.g., Google" />
              </div>
              <div>
                <label className={labelCls}><FaBriefcase className="h-3 w-3 text-gray-400" /> Position</label>
                <input type="text" value={job.position} onChange={(e) => update(index, 'position', e.target.value)} className={inputCls} placeholder="e.g., Software Engineer" />
              </div>
              <div>
                <label className={labelCls}><FaCalendarAlt className="h-3 w-3 text-gray-400" /> Starting year</label>
                <select
                  value={job.starting_year}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (job.ending_year && job.ending_year < v) update(index, 'ending_year', null);
                    update(index, 'starting_year', v);
                  }}
                  className={inputCls}
                >
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}><FaCalendarAlt className="h-3 w-3 text-gray-400" /> Ending year</label>
                <select
                  value={job.ending_year || ''}
                  onChange={(e) => update(index, 'ending_year', e.target.value ? parseInt(e.target.value) : null)}
                  disabled={job.is_current}
                  className={`${inputCls} disabled:bg-gray-50 disabled:cursor-not-allowed`}
                >
                  <option value="">Present</option>
                  {availableEndingYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <label className={`mt-3 inline-flex items-center gap-2 text-xs cursor-pointer ${canMarkCurrent ? 'text-gray-700' : 'text-gray-400'}`}>
              <input
                type="checkbox"
                checked={job.is_current}
                onChange={(e) => update(index, 'is_current', e.target.checked)}
                disabled={!canMarkCurrent}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              I currently work here
            </label>
          </div>
        );
      })}

      {data.job_histories.length < MAX_EXPERIENCES && (
        <button
          onClick={addJobHistory}
          className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/40 transition inline-flex items-center justify-center gap-2"
        >
          <FaPlus className="h-3.5 w-3.5" /> Add experience
        </button>
      )}
    </div>
  );
};

export default WorkExperience;