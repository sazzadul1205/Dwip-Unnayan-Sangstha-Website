// resources/js/Pages/Backend/PageMap/Index.jsx

import React from 'react';
import { Head, Link } from '@inertiajs/react';

import { FiMap, FiLink, FiGrid, FiList, FiRefreshCw } from 'react-icons/fi';
import AdminLayout from '../../../layouts/AdminLayout';

const PageMapIndex = ({ pageMap, frontendCount, dynamicCount, backendCount, totalPages }) => {
  const [activeTab, setActiveTab] = React.useState('frontend');

  const tabs = [
    { key: 'frontend', label: 'CMS Pages', count: frontendCount, icon: FiGrid },
    { key: 'dynamic_content', label: 'Dynamic Content', count: dynamicCount, icon: FiList },
    { key: 'backend', label: 'Backend Routes', count: backendCount, icon: FiLink },
  ];

  const getStatusBadge = (isActive, isTrashed) => {
    if (isTrashed) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Trashed</span>;
    }
    if (isActive) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Inactive</span>;
  };

  const renderPageItem = (page, index) => (
    <div key={index} className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {page.title || page.name}
            </h4>
            {getStatusBadge(page.is_active, page.is_trashed)}
            {page.type && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                {page.type}
              </span>
            )}
          </div>
          {page.slug && (
            <p className="text-xs text-gray-500 mt-1 font-mono">/{page.slug}</p>
          )}
          {page.url && (
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-700 mt-1 inline-block"
            >
              {page.url}
            </a>
          )}
          {page.uri && (
            <p className="text-xs text-gray-500 mt-1 font-mono">{page.uri}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {page.url && (
            <Link
              href={page.url}
              className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
              title="View page"
            >
              <FiLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
        {page.created_at && (
          <span>Created: {new Date(page.created_at).toLocaleDateString()}</span>
        )}
        {page.updated_at && (
          <span>Updated: {new Date(page.updated_at).toLocaleDateString()}</span>
        )}
        {page.author && (
          <span>Author: {page.author}</span>
        )}
        {page.controller && (
          <span className="font-mono text-gray-500">{page.controller}</span>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <Head title="Page Map | DUS Admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Page Map</h1>
            <p className="text-sm text-gray-500 mt-1">
              Auto-discovered pages across the entire application
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {totalPages} total pages
            </span>
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiGrid className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{frontendCount}</p>
                <p className="text-xs text-gray-500">CMS Pages</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <FiList className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{dynamicCount}</p>
                <p className="text-xs text-gray-500">Dynamic Content</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiLink className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{backendCount}</p>
                <p className="text-xs text-gray-500">Backend Routes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-3">
          {pageMap[activeTab]?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiMap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>No pages found in this category.</p>
            </div>
          ) : (
            pageMap[activeTab]?.map((page, index) => renderPageItem(page, index))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PageMapIndex;