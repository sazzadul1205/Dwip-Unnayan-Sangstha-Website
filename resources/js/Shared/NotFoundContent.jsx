// resources/js/Shared/NotFoundContent.jsx

import { Link } from '@inertiajs/react';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFoundContent = ({
  title = 'Content Not Available',
  message = 'The content you are looking for is no longer available or has been removed.',
  buttonText = 'Return to Home',
  buttonLink = '/',
  icon = '📄',
  backButton = true,
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center border border-gray-100">
          {/* Icon */}
          <div className="text-7xl mb-6">{icon}</div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#080C14] mb-3">
            {title}
          </h1>

          {/* Description */}
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8 max-w-md mx-auto">
            {message}
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">What now?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={buttonLink}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#009BE2] text-white font-600 px-8 py-3.5 rounded-xl hover:bg-[#007BB5] transition-all duration-300 shadow-lg shadow-[#009BE2]/25 hover:shadow-xl hover:shadow-[#009BE2]/30 hover:-translate-y-0.5"
            >
              <FiHome className="w-5 h-5" />
              {buttonText}
            </Link>
            {backButton && (
              <button
                onClick={() => window.history.back()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-600 px-8 py-3.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:-translate-y-0.5"
              >
                <FiArrowLeft className="w-5 h-5" />
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundContent;