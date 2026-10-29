// resources/js/pages/Backend/CMS/Shared/components/FormField.jsx
import { FaExclamationCircle } from 'react-icons/fa';

const inputBase =
  'w-full rounded-lg border bg-white py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500';
const inputIdle =
  'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60';
const inputError =
  'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100/60';

const FormField = ({
  label,
  name,
  value = '',
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error = null,
  hint = null,
  icon = null,
  min,
  max,
  rows,
  maxLength,
  readOnly = false,
  as = 'input',
}) => {
  const isTextarea = as === 'textarea';
  const InputTag = isTextarea ? 'textarea' : 'input';
  const hasError = Boolean(error);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={name}
          className="flex items-baseline gap-1 text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="text-xs text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <InputTag
          id={name}
          name={name}
          {...(!isTextarea && { type })}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          min={min}
          max={max}
          rows={rows}
          maxLength={maxLength}
          className={`${inputBase} ${hasError ? inputError : inputIdle} ${icon ? 'pl-9' : 'px-3.5'
            } pr-3.5 ${isTextarea ? 'min-h-24 resize-y' : ''}`}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <FaExclamationCircle size={11} />
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
};

export default FormField;