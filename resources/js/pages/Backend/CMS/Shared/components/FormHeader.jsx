import { Link } from '@inertiajs/react';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

const FormHeader = ({
  title,
  subtitle,
  backRoute,
  backText = 'Back to List',
  error = null,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-4">
        <Link
          href={backRoute}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center justify-center"
          title={backText}
        >
          <FaArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <FaExclamationTriangle className="text-red-500" size={16} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FormHeader;
