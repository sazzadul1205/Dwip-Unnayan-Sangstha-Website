// resources/js/pages/Backend/CMS/Section/components/SectionFooter.jsx

import React from 'react';
import {
  FaGripVertical,
  FaHashtag,
  FaStar,
  FaLock,
  FaShareAlt,
  FaBriefcase,
  FaList,
  FaDatabase,
  FaInfoCircle
} from 'react-icons/fa';

const SectionFooter = ({ sections, hasData }) => {
  const stats = {
    total: sections.length,
    banner: sections.filter(s => s.component === 'HomeBanner' || s.component === 'PageBannerSection').length,
    fixed: sections.filter(s => s.is_fixed_section).length,
    shared: sections.filter(s => s.data_table === 'shared_data').length,
    jobs: sections.filter(s => s.data_table === 'jobs').length,
    programs: sections.filter(s => s.data_table === 'programs' || s.component === 'OurProgramsSection').length,
    hasData: sections.filter(s => hasData(s)).length,
  };

  const StatBadge = ({ icon, label, value, color = 'gray' }) => {
    const colorClasses = {
      gray: 'bg-gray-50 text-gray-600 border-gray-200',
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
      red: 'bg-red-50 text-red-600 border-red-200',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${colorClasses[color]}`}>
        {icon}
        {label}: <span className="font-bold ml-0.5">{value}</span>
      </span>
    );
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
      <StatBadge icon={<FaHashtag size={11} />} label="Total" value={stats.total} color="gray" />
      <StatBadge icon={<FaStar size={11} />} label="Banner" value={stats.banner} color="yellow" />
      <StatBadge icon={<FaLock size={10} />} label="Fixed" value={stats.fixed} color="blue" />
      <StatBadge icon={<FaShareAlt size={10} />} label="Shared" value={stats.shared} color="green" />
      <StatBadge icon={<FaBriefcase size={10} />} label="Jobs" value={stats.jobs} color="purple" />
      <StatBadge icon={<FaList size={10} />} label="Programs" value={stats.programs} color="orange" />
      <StatBadge icon={<FaDatabase size={10} />} label="Has Data" value={stats.hasData} color="blue" />

      <span className="text-gray-400 flex items-center gap-1.5 ml-1">
        <FaInfoCircle size={12} />
        <span className="text-gray-400">
          Drag <FaGripVertical className="inline text-gray-400" size={11} /> or use ↑↓ to reorder
        </span>
      </span>
      <span className="text-gray-300">•</span>
      <span className="text-gray-400">🔒 Fixed sections locked</span>
    </div>
  );
};

export default SectionFooter;