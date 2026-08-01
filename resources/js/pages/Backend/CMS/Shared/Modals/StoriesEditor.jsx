// resources/js/pages/Backend/CMS/Shared/Modals/StoriesEditor.jsx

import React from 'react';
import { FaInfoCircle, FaExternalLinkAlt } from 'react-icons/fa';

export default function StoriesEditor({
  formData,
  updateFormData,
  isLoading = false,
}) {

  // Check if any upload is in progress
  const isDisabled = isLoading;

  // RENDER
  return (
    <div className="space-y-8 w-full">

      {/*  SECTION HEADER */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaInfoCircle className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Stories Section Settings</h3>
            <p className="text-xs text-gray-500">Configure the title and description for your stories section</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Title
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.section?.title || ''}
              onChange={(e) => updateFormData('section.title', e.target.value)}
              placeholder="e.g., Our Latest Stories"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Description
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </label>
            <textarea
              value={formData.section?.description || ''}
              onChange={(e) => updateFormData('section.description', e.target.value)}
              rows={2}
              placeholder="e.g., Read inspiring stories from our community"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none resize-y"
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/*  QUICK LINK TO BLOGS */}
      <div className="bg-linear-to-r from-cyan-50 to-teal-50 rounded-xl p-6 border border-cyan-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <FaExternalLinkAlt className="text-cyan-600 text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Manage Your Stories</h3>
              <p className="text-xs text-gray-500">To add or edit stories, go to the Blog management section</p>
            </div>
          </div>
          <a
            href="/backend/cms/blogs"
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition shadow-sm text-sm font-medium flex items-center gap-2"
          >
            <span>Go to Blogs</span>
            <FaExternalLinkAlt size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}