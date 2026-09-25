 
// resources/js/pages/Backend/CMS/Sections/components/SectionHeader.jsx

/**
 * SectionHeader - Page header with title, stats, and back button
 * Features:
 * - Breadcrumb navigation back to Pages
 * - Page title with section name
 * - Statistics display with icons
 * - Saving state indicator
 * - Error message display
 */

import React from 'react';
import { Link } from '@inertiajs/react';
import { FaSpinner } from 'react-icons/fa';

const SectionHeader = ({ page, stats, isSaving, dragError }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        {/* Breadcrumb - Back to Pages */}
        <div className="flex items-center gap-3 mb-1">
          <Link
            href={route('backend.cms.pages.index')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
            <span>Back to Pages</span>
          </Link>
        </div>

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900">Sections - {page.name}</h1>

        {/* Statistics Row */}
        <p className="text-sm text-gray-500 mt-1">
          {/* Total Sections */}
          {stats.total} sections •

          {/* Fixed Sections */}
          {stats.fixed > 0 && (
            <span className="ml-2 text-blue-600">🔒 {stats.fixed} fixed</span>
          )}

          {/* Banner Sections */}
          {stats.banner > 0 && (
            <span className="ml-2 text-yellow-600">⭐ {stats.banner} banner</span>
          )}

          {/* Shared Data Sections */}
          {stats.shared > 0 && (
            <span className="ml-2 text-green-600">🔄 {stats.shared} shared</span>
          )}

          {/* Jobs Sections */}
          {stats.jobs > 0 && (
            <span className="ml-2 text-purple-600">💼 {stats.jobs} jobs</span>
          )}

          {/* Programs Sections */}
          {stats.programs > 0 && (
            <span className="ml-2 text-orange-600">📋 {stats.programs} programs</span>
          )}

          {/* Sections with Data */}
          {stats.hasData > 0 && (
            <span className="ml-2 text-blue-600">📦 {stats.hasData} with data</span>
          )}

          {/* Saving Indicator */}
          {isSaving && (
            <span className="ml-2 text-blue-600 flex items-center gap-1">
              <FaSpinner className="animate-spin" size={12} />
              Saving order...
            </span>
          )}

          {/* Error Message */}
          {dragError && (
            <span className="ml-2 text-red-600">{dragError}</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default SectionHeader;