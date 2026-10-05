import { FaExclamationTriangle } from 'react-icons/fa';

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
  const InputTag = as === 'textarea' ? 'textarea' : 'input';

  const commonProps = {
    name,
    id: name,
    value,
    onChange,
    placeholder,
    required,
    readOnly,
    className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${
      error ? 'border-red-500' : 'border-gray-300'
    } ${as === 'textarea' ? 'resize-y' : ''}`,
  };

  if (min !== undefined) commonProps.min = min;
  if (max !== undefined) commonProps.max = max;
  if (rows !== undefined) commonProps.rows = rows;
  if (maxLength !== undefined) commonProps.maxLength = maxLength;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        )}
        <InputTag
          {...commonProps}
          className={`${icon ? 'pl-9' : 'px-4'} ${commonProps.className}`}
        />
        {type !== 'text' && (
          <input type={type} className="hidden" />
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs flex items-center gap-1">
          <FaExclamationTriangle size={12} />
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
      {hint && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
};

export default FormField;
