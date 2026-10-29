// resources/js/pages/Backend/CMS/Sections/components/SectionFooter.jsx
import {
  FaGripVertical, FaHashtag, FaStar, FaLock, FaShareAlt,
  FaBriefcase, FaList, FaDatabase, FaInfoCircle,
} from 'react-icons/fa';

const StatBadge = ({ icon: Icon, label, value, tone }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ${tones[tone]}`}>
      <Icon size={10} />
      {label}: <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
};

const SectionFooter = ({ sections, hasData }) => {
  const stats = {
    total: sections.length,
    banner: sections.filter((s) => s.component === 'HomeBanner' || s.component === 'PageBannerSection').length,
    fixed: sections.filter((s) => s.is_fixed_section).length,
    shared: sections.filter((s) => s.data_table === 'shared_data').length,
    jobs: sections.filter((s) => s.data_table === 'jobs').length,
    programs: sections.filter((s) => s.data_table === 'programs' || s.component === 'OurProgramsSection').length,
    hasData: sections.filter((s) => hasData(s)).length,
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      <StatBadge icon={FaHashtag} label="Total" value={stats.total} tone="slate" />
      {stats.banner > 0 && <StatBadge icon={FaStar} label="Banner" value={stats.banner} tone="amber" />}
      {stats.fixed > 0 && <StatBadge icon={FaLock} label="Fixed" value={stats.fixed} tone="blue" />}
      {stats.shared > 0 && <StatBadge icon={FaShareAlt} label="Shared" value={stats.shared} tone="emerald" />}
      {stats.jobs > 0 && <StatBadge icon={FaBriefcase} label="Jobs" value={stats.jobs} tone="violet" />}
      {stats.programs > 0 && <StatBadge icon={FaList} label="Programs" value={stats.programs} tone="orange" />}
      {stats.hasData > 0 && <StatBadge icon={FaDatabase} label="Has data" value={stats.hasData} tone="blue" />}

      <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
        <FaInfoCircle size={10} />
        Drag <FaGripVertical className="inline text-slate-400" size={10} /> or use ↑↓ to reorder · Fixed sections locked
      </span>
    </div>
  );
};

export default SectionFooter;