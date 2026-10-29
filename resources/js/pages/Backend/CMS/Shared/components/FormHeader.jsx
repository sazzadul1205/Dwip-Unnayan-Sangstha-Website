// resources/js/pages/Backend/CMS/Shared/components/FormHeader.jsx
import { Link } from '@inertiajs/react';
import { FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';

const FormHeader = ({
  title,
  subtitle,
  backRoute,
  backText = 'Back to List',
  error = null,
}) => (
  <div className="mb-6">
    <div className="flex items-center gap-3">
      <Link
        href={backRoute}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        title={backText}
      >
        <FaArrowLeft size={16} />
      </Link>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {error && (
      <div className="mt-3 flex items-start gap-2 rounded-lg border-l-4 border-red-400 bg-red-50 px-4 py-3">
        <FaExclamationCircle className="mt-0.5 shrink-0 text-red-500" size={14} />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )}
  </div>
);

export default FormHeader;