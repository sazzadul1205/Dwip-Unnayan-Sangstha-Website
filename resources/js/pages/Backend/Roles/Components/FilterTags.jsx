// resources/js/pages/Backend/Roles/Components/FilterTags.jsx

import { FaTimes } from 'react-icons/fa';

export default function FilterTags({ filters, onClear }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const entries = Object.entries(filters).filter(([_, value]) => value && value !== 'all' && value !== '');
  if (entries.length === 0) return null;

  const labelMap = {
    search: 'Search',
    status: 'Status',
    minLevel: 'Min Level',
    maxLevel: 'Max Level',
    perPage: 'Per Page',
    sortBy: 'Sort By',
    sortDir: 'Sort Direction',
  };

  const formatValue = (key, value) => {
    if (key === 'status') return value === 'active' ? 'Active' : value === 'inactive' ? 'Inactive' : value;
    if (key === 'sortDir') return value === 'asc' ? 'Ascending' : 'Descending';
    return value;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-full text-sm border border-blue-200"
        >
          <span className="font-medium">{labelMap[key] || key}:</span>
          <span>{formatValue(key, value)}</span>
          <button
            onClick={() => onClear(key)}
            className="ml-1 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
            aria-label={`Clear ${key} filter`}
          >
            <FaTimes size={10} />
          </button>
        </span>
      ))}
    </div>
  );
}