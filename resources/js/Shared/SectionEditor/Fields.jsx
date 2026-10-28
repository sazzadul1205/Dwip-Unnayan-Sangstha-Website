// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/Fields.jsx

import React from 'react';

// TextField
export const TextField = ({ label, value, onChange, placeholder, className = '', disabled = false }) => (
  <div className={className}>
    <label className="block text-xs text-gray-400 mb-0.5">{label}</label>
    <input
      type="text"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      disabled={disabled}
    />
  </div>
);

// TextAreaField
export const TextAreaField = ({ label, value, onChange, placeholder, rows = 2, className = '', disabled = false }) => (
  <div className={className}>
    <label className="block text-xs text-gray-400 mb-0.5">{label}</label>
    <textarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      disabled={disabled}
    />
  </div>
);

// SelectField
export const SelectField = ({ label, value, onChange, options, className = '', disabled = false }) => (
  <div className={className}>
    <label className="block text-xs text-gray-400 mb-0.5">{label}</label>
    <select
      value={value || ''}
      onChange={onChange}
      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      disabled={disabled}
    >
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// NumberField
export const NumberField = ({ label, value, onChange, placeholder, className = '', disabled = false }) => (
  <div className={className}>
    <label className="block text-xs text-gray-400 mb-0.5">{label}</label>
    <input
      type="number"
      step="any"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      disabled={disabled}
    />
  </div>
);