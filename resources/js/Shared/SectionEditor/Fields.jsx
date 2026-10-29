// resources/js/Shared/SectionEditor/Fields.jsx

import React from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';
const inputIdle =
  'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60';
const inputError =
  'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100/60';

const FieldShell = ({ label, error, hint, className = '', children }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label className="block text-xs font-medium text-slate-600">{label}</label>
    )}
    {children}
    {error && (
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
        <FaExclamationCircle size={10} /> {error}
      </p>
    )}
    {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
  </div>
);

export const TextField = ({
  label, value, onChange, placeholder, className = '',
  disabled = false, error = null, hint = null, type = 'text', readOnly = false,
}) => (
  <FieldShell label={label} error={error} hint={hint} className={className}>
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`${inputBase} ${error ? inputError : inputIdle}`}
      disabled={disabled}
    />
  </FieldShell>
);

export const TextAreaField = ({
  label, value, onChange, placeholder, rows = 2, className = '',
  disabled = false, error = null, hint = null,
}) => (
  <FieldShell label={label} error={error} hint={hint} className={className}>
    <textarea
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`${inputBase} ${error ? inputError : inputIdle} min-h-20 resize-y`}
      disabled={disabled}
    />
  </FieldShell>
);

export const SelectField = ({
  label, value, onChange, options = [], className = '',
  disabled = false, error = null, hint = null, placeholder,
}) => (
  <FieldShell label={label} error={error} hint={hint} className={className}>
    <select
      value={value ?? ''}
      onChange={onChange}
      className={`${inputBase} ${error ? inputError : inputIdle} pr-8`}
      disabled={disabled}
    >
      <option value="">{placeholder || `Select ${label || 'an option'}`}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </FieldShell>
);

export const NumberField = ({
  label, value, onChange, placeholder, className = '',
  disabled = false, error = null, hint = null, min, max, step = 'any',
}) => (
  <FieldShell label={label} error={error} hint={hint} className={className}>
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className={`${inputBase} ${error ? inputError : inputIdle}`}
      disabled={disabled}
    />
  </FieldShell>
);

export const CheckboxField = ({
  label, description, checked, onChange, className = '', disabled = false,
}) => (
  <label className={`flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300 ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="mt-0.5 h-4 w-4 rounded accent-blue-600"
    />
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {description && (
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      )}
    </span>
  </label>
);
