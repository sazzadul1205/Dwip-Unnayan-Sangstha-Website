// resources/js/pages/UnauthorizedAccess.jsx

import { Head, Link } from '@inertiajs/react';
import { FaExclamationTriangle, FaArrowLeft, FaHome, FaShieldAlt } from 'react-icons/fa';

export default function UnauthorizedAccess({ status = 403, message = null }) {
  const errorMessages = {
    403: {
      title: 'Unauthorized Access',
      defaultMessage: 'You do not have permission to access this page.',
      description: 'Please contact your administrator if you believe this is an error.'
    },
    401: {
      title: 'Authentication Required',
      defaultMessage: 'Please log in to access this page.',
      description: 'You need to be logged in to view this content.'
    },
    404: {
      title: 'Page Not Found',
      defaultMessage: 'The page you are looking for does not exist.',
      description: 'Please check the URL or navigate back to the dashboard.'
    }
  };

  const error = errorMessages[status] || errorMessages[403];
  const displayMessage = message || error.defaultMessage;

  return (
    <>
      <Head title={error.title} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Top Gradient Bar */}
            <div className="h-2 bg-linear-to-r from-red-500 to-orange-500"></div>

            <div className="p-8 text-center">
              {/* Icon */}
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <FaExclamationTriangle className="h-12 w-12 text-red-500" />
              </div>

              {/* Status Code */}
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                  {status || 403}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {error.title}
              </h1>

              {/* Message */}
              <p className="text-gray-600 mb-6">
                {displayMessage}
              </p>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-8">
                {error.description}
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => window.history.back()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  <FaArrowLeft size={16} />
                  Go Back
                </button>

                <Link
                  href={route('dashboard')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
                >
                  <FaHome size={16} />
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <FaShieldAlt size={12} />
              Restricted Area • Access Logged
            </p>
          </div>
        </div>
      </div>
    </>
  );
}