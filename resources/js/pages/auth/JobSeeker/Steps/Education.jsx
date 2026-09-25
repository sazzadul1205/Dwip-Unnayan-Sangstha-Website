// pages/auth/Steps/Education.jsx
import { FaPlus, FaTrashAlt, FaUniversity, FaCalendarAlt, FaBook } from 'react-icons/fa';
import { MdSchool } from 'react-icons/md';
import Swal from 'sweetalert2';

const MAX_EDUCATION = 3;

const Education = ({ data, setData }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

  const add = () => {
    if (data.education_histories.length >= MAX_EDUCATION) {
      Swal.fire({ icon: 'warning', title: 'Limit reached', text: `Up to ${MAX_EDUCATION} entries.`, timer: 2500, showConfirmButton: false });
      return;
    }
    setData('education_histories', [
      ...data.education_histories,
      { id: Date.now(), institution_name: '', degree: '', passing_year: currentYear },
    ]);
  };

  const update = (index, field, value) => {
    const next = [...data.education_histories];
    next[index][field] = value;
    setData('education_histories', next);
  };

  const remove = (i) => setData('education_histories', data.education_histories.filter((_, idx) => idx !== i));

  const inputCls = "w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400";
  const labelCls = "flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MdSchool className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Your education</h2>
            <p className="text-xs text-gray-500">Optional · add up to {MAX_EDUCATION} entries</p>
          </div>
        </div>
        <span className="text-xs font-medium text-gray-500 tabular-nums">
          {data.education_histories.length}/{MAX_EDUCATION}
        </span>
      </div>

      {/* Empty state */}
      {data.education_histories.length === 0 && (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
          <MdSchool className="h-6 w-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">No education added yet</p>
          <p className="text-xs text-gray-400 mt-1">Start with your highest degree</p>
        </div>
      )}

      {data.education_histories.map((edu, index) => (
        <div key={edu.id} className="p-4 border border-gray-200 rounded-xl bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
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
              <label className={labelCls}><FaUniversity className="h-3 w-3 text-gray-400" /> Institution</label>
              <input type="text" value={edu.institution_name} onChange={(e) => update(index, 'institution_name', e.target.value)} className={inputCls} placeholder="University / School" />
            </div>
            <div>
              <label className={labelCls}><FaBook className="h-3 w-3 text-gray-400" /> Degree</label>
              <input type="text" value={edu.degree} onChange={(e) => update(index, 'degree', e.target.value)} className={inputCls} placeholder="e.g., BSc in Computer Science" />
            </div>
            <div>
              <label className={labelCls}><FaCalendarAlt className="h-3 w-3 text-gray-400" /> Passing year</label>
              <select value={edu.passing_year} onChange={(e) => update(index, 'passing_year', parseInt(e.target.value))} className={inputCls}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}

      {data.education_histories.length < MAX_EDUCATION && (
        <button
          onClick={add}
          className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/40 transition inline-flex items-center justify-center gap-2"
        >
          <FaPlus className="h-3.5 w-3.5" /> Add education
        </button>
      )}
    </div>
  );
};

export default Education;