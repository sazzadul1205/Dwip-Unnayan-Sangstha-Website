// pages/auth/Steps/Achievements.jsx
import { FaPlus, FaTrashAlt, FaTrophy, FaAlignLeft, FaLightbulb, FaCertificate, FaMedal, FaAward } from 'react-icons/fa';
import { GiAchievement } from 'react-icons/gi';
import Swal from 'sweetalert2';

const MAX_ACHIEVEMENTS = 3;

const Achievements = ({ data, setData }) => {
  const add = () => {
    if (data.achievements.length >= MAX_ACHIEVEMENTS) {
      Swal.fire({ icon: 'warning', title: 'Limit reached', text: `Up to ${MAX_ACHIEVEMENTS} entries.`, timer: 2500, showConfirmButton: false });
      return;
    }
    setData('achievements', [
      ...data.achievements,
      { id: Date.now(), achievement_name: '', achievement_details: '' },
    ]);
  };

  const update = (index, field, value) => {
    const next = [...data.achievements];
    next[index][field] = value;
    setData('achievements', next);
  };

  const remove = (i) => setData('achievements', data.achievements.filter((_, idx) => idx !== i));

  const inputCls = "w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400";
  const labelCls = "flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5";

  // Friendly empty-state examples
  const examples = [
    { Icon: FaCertificate, color: 'text-purple-500', text: 'AWS Certified Solutions Architect' },
    { Icon: FaMedal, color: 'text-amber-500', text: 'Employee of the Month' },
    { Icon: FaTrophy, color: 'text-orange-500', text: 'Hackathon Winner 2024' },
    { Icon: FaAward, color: 'text-emerald-500', text: 'Google IT Support Certificate' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <GiAchievement className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">What are you proud of?</h2>
            <p className="text-xs text-gray-500">Optional · certifications, awards, recognitions · up to {MAX_ACHIEVEMENTS}</p>
          </div>
        </div>
        <span className="text-xs font-medium text-gray-500 tabular-nums">
          {data.achievements.length}/{MAX_ACHIEVEMENTS}
        </span>
      </div>

      {/* Empty state with examples */}
      {data.achievements.length === 0 && (
        <div className="py-6 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
          <div className="text-center mb-4">
            <GiAchievement className="h-6 w-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">Nothing added yet</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {examples.map(({ Icon, color, text }, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-100 rounded-lg px-3 py-2">
                <Icon className={`h-3 w-3 ${color} shrink-0`} />
                <span className="truncate">{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.achievements.map((a, index) => (
        <div key={a.id} className="p-4 border border-gray-200 rounded-xl bg-white">
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

          <div className="space-y-3">
            <div>
              <label className={labelCls}><FaTrophy className="h-3 w-3 text-amber-500" /> Title</label>
              <input
                type="text"
                value={a.achievement_name}
                onChange={(e) => update(index, 'achievement_name', e.target.value)}
                className={inputCls}
                placeholder="e.g., AWS Certified Solutions Architect"
              />
            </div>
            <div>
              <label className={labelCls}><FaAlignLeft className="h-3 w-3 text-gray-400" /> Details</label>
              <textarea
                value={a.achievement_details}
                onChange={(e) => update(index, 'achievement_details', e.target.value)}
                rows="2"
                className={`${inputCls} resize-none`}
                placeholder="Issuing organization, date, and any context…"
              />
            </div>
          </div>
        </div>
      ))}

      {data.achievements.length < MAX_ACHIEVEMENTS && (
        <button
          onClick={add}
          className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/40 transition inline-flex items-center justify-center gap-2"
        >
          <FaPlus className="h-3.5 w-3.5" /> Add achievement
        </button>
      )}

      {/* Friendly tip */}
      {data.achievements.length > 0 && data.achievements.length < MAX_ACHIEVEMENTS && (
        <div className="flex items-start gap-2 p-3 bg-amber-50/60 border border-amber-100 rounded-lg">
          <FaLightbulb className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            Add any certificate, award or recognition — even small ones help you stand out.
          </p>
        </div>
      )}
    </div>
  );
};

export default Achievements;