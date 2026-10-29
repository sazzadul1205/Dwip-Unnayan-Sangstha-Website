// resources/js/pages/Backend/CMS/Sections/components/SectionHeader.jsx
import { Link } from '@inertiajs/react';
import { FaChevronRight, FaSpinner, FaLock, FaStar, FaShareAlt, FaBriefcase, FaList, FaFileAlt } from 'react-icons/fa';

const StatChip = ({ icon: Icon, label, value, tone }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ${tones[tone]}`}>
      <Icon size={10} />
      {label}: <span className="font-semibold">{value}</span>
    </span>
  );
};

const SectionHeader = ({ page, stats, isSaving, dragError }) => (
  <div className="mb-6">
    <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
      <Link href={route('backend.cms.pages.index')} className="font-medium text-slate-600 transition hover:text-blue-600">
        Pages
      </Link>
      <FaChevronRight size={8} className="text-slate-300" />
      <span className="text-slate-400">Sections</span>
    </nav>

    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
      Sections — {page.name}
    </h1>

    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <StatChip icon={FaList} label="Total" value={stats.total} tone="slate" />
      {stats.fixed > 0 && <StatChip icon={FaLock} label="Fixed" value={stats.fixed} tone="blue" />}
      {stats.banner > 0 && <StatChip icon={FaStar} label="Banner" value={stats.banner} tone="amber" />}
      {stats.shared > 0 && <StatChip icon={FaShareAlt} label="Shared" value={stats.shared} tone="emerald" />}
      {stats.jobs > 0 && <StatChip icon={FaBriefcase} label="Jobs" value={stats.jobs} tone="violet" />}
      {stats.programs > 0 && <StatChip icon={FaList} label="Programs" value={stats.programs} tone="orange" />}
      {stats.hasData > 0 && <StatChip icon={FaFileAlt} label="With data" value={stats.hasData} tone="blue" />}
      {isSaving && (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
          <FaSpinner className="animate-spin" size={10} /> Saving order…
        </span>
      )}
      {dragError && (
        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
          {dragError}
        </span>
      )}
    </div>
  </div>
);

export default SectionHeader;