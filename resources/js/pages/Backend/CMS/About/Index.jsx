import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaUndo, FaSpinner,
  FaToggleOn, FaToggleOff, FaStar, FaRegStar,
  FaInfoCircle, FaFileAlt,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import { Can } from '../../../../components/Auth/Can';

export default function Index({ items }) {
  const { flash } = usePage().props;

  const [showDeleted, setShowDeleted] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [toggling, setToggling] = useState(null);
  const [featureToggling, setFeatureToggling] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (flash?.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: flash.success,
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
    if (flash?.error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: flash.error,
        confirmButtonColor: '#3b82f6',
      });
    }
  }, [flash]);

  const getFilteredItems = () => {
    let filtered = showDeleted
      ? items.filter(item => item.deleted_at !== null)
      : items.filter(item => item.deleted_at === null);

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();
  const featuredCount = items.filter(item => item.is_featured && !item.deleted_at).length;

  const getTypeBadge = (type) => {
    if (type === 'main') {
      return {
        label: 'Main',
        color: 'bg-blue-100 text-blue-700',
        icon: 'ℹ️'
      };
    }
    return {
      label: 'Detail',
      color: 'bg-purple-100 text-purple-700',
      icon: '📋'
    };
  };

  return (
    <AuthenticatedLayout>
      <Head title="CMS - About Content" />

      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📋 About Content</h1>
            <p className="text-sm text-gray-500">Manage about page content and details</p>
            <div className="flex gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Active: {items.filter(b => b.is_active && !b.deleted_at).length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                Featured: {featuredCount} (max 1)
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Total: {items.length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Trash: {items.filter(b => b.deleted_at !== null).length}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 cursor-pointer ${showDeleted
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {showDeleted ? '📋 Show Active' : '🗑️ Trash'}
            </button>
            <Can permission="about.create">
              <button
                onClick={() => router.visit(route('backend.cms.about.create'))}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-md hover:shadow-lg cursor-pointer"
              >
                <FaPlus size={14} /> Add New
              </button>
            </Can>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('main')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${filterType === 'main'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <span className="flex items-center gap-1">
              <FaInfoCircle size={12} /> Main Content
            </span>
          </button>
          <button
            onClick={() => setFilterType('detail')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${filterType === 'detail'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <span className="flex items-center gap-1">
              <FaFileAlt size={12} /> Detail Pages
            </span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      {showDeleted ? '🗑️ No deleted about content found' : '📋 No about content found'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isDeleted = item.deleted_at !== null;
                    const isFeatured = item.is_featured;
                    const typeInfo = getTypeBadge(item.type);

                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${isDeleted ? 'bg-red-50/50' : ''}`}>
                        <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.icon ? (
                              <span className="text-xl">🖼️</span>
                            ) : item.image ? (
                              <span className="text-xl">🖼️</span>
                            ) : (
                              <FaFileAlt className="text-blue-500" size={16} />
                            )}
                            <div>
                              <div className={`font-medium ${isDeleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {item.content || 'No content'}
                              </div>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                  {item.tags.length > 2 && (
                                    <span className="text-xs text-gray-400">+{item.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {!isDeleted ? (
                            <button
                              onClick={() => {
                                setToggling(item.id);
                                router.post(route('backend.cms.about.toggle-status', { id: item.id }), {}, {
                                  preserveScroll: true,
                                  onSuccess: () => setToggling(null),
                                  onError: () => setToggling(null),
                                });
                              }}
                              disabled={toggling === item.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${item.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                } ${toggling === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {toggling === item.id ? (
                                <FaSpinner className="animate-spin" size={14} />
                              ) : item.is_active ? (
                                <FaToggleOn size={16} className="text-green-600" />
                              ) : (
                                <FaToggleOff size={16} className="text-gray-500" />
                              )}
                              {item.is_active ? 'Active' : 'Inactive'}
                            </button>
                          ) : (
                            <span className="text-xs text-red-500 font-medium">
                              <span className="inline-block mr-1">🗑️</span> Deleted
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!isDeleted && (
                            <button
                              onClick={() => {
                                setFeatureToggling(item.id);
                                router.post(route('backend.cms.about.toggle-featured', { id: item.id }), {}, {
                                  preserveScroll: true,
                                  onSuccess: () => setFeatureToggling(null),
                                  onError: () => setFeatureToggling(null),
                                });
                              }}
                              disabled={featureToggling === item.id}
                              className={`p-1.5 rounded-lg transition hover:bg-yellow-50 cursor-pointer ${isFeatured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                                } ${featureToggling === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={isFeatured ? 'Remove featured' : 'Make featured'}
                            >
                              {featureToggling === item.id ? (
                                <FaSpinner className="animate-spin" size={14} />
                              ) : isFeatured ? (
                                <FaStar size={18} />
                              ) : (
                                <FaRegStar size={18} />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
                            # {item.display_order || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {isDeleted ? (
                            <>
                              <button
                                onClick={() => {
                                  setIsRestoring(true);
                                  router.post(route('backend.cms.about.restore', { id: item.id }), {}, {
                                    onSuccess: () => {
                                      setIsRestoring(false);
                                    },
                                    onError: () => setIsRestoring(false),
                                  });
                                }}
                                disabled={isRestoring}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                                title="Restore"
                              >
                                <FaUndo size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  Swal.fire({
                                    title: '⚠️ Permanently Delete?',
                                    text: `Permanently delete "${item.title}"?`,
                                    icon: 'error',
                                    showCancelButton: true,
                                    confirmButtonColor: '#d33',
                                    cancelButtonColor: '#6b7280',
                                    confirmButtonText: 'Yes, delete permanently',
                                    cancelButtonText: 'Cancel'
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      router.delete(route('backend.cms.about.force-delete', { id: item.id }), {
                                        preserveScroll: true,
                                      });
                                    }
                                  });
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Permanently Delete"
                              >
                                <FaTrash size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Can permission="about.update">
                                <button
                                  onClick={() => router.visit(route('backend.cms.about.edit', { id: item.id }))}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                              </Can>
                              <Can permission="about.destroy">
                                <button
                                  onClick={() => {
                                    Swal.fire({
                                      title: 'Delete About Content',
                                      text: `Move "${item.title}" to trash?`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#d33',
                                      cancelButtonColor: '#6b7280',
                                      confirmButtonText: 'Yes, delete it!',
                                      cancelButtonText: 'Cancel'
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        router.delete(route('backend.cms.about.destroy', { id: item.id }), {
                                          preserveScroll: true,
                                        });
                                      }
                                    });
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Move to Trash"
                                >
                                  <FaTrash size={16} />
                                </button>
                              </Can>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
