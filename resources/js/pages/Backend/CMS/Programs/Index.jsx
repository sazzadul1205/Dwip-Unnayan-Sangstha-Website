import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaUndo, FaSpinner,
  FaToggleOn, FaToggleOff, FaStar, FaRegStar,
  FaFileAlt,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import { Can } from '../../../../components/Auth/Can';

export default function Index({ items }) {
  const { flash } = usePage().props;

  const [showDeleted, setShowDeleted] = useState(false);
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

  const filteredItems = showDeleted
    ? items.filter(item => item.deleted_at !== null)
    : items.filter(item => item.deleted_at === null);

  const featuredCount = items.filter(item => item.is_featured && !item.deleted_at).length;

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Programs" />

      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📋 Programs</h1>
            <p className="text-sm text-gray-500">Manage programs and projects</p>
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
            <Can permission="programs.create">
              <button
                onClick={() => router.visit(route('backend.cms.programs.create'))}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-md hover:shadow-lg cursor-pointer"
              >
                <FaPlus size={14} /> Add New
              </button>
            </Can>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {showDeleted ? '🗑️ No programs in trash' : '📋 No programs found'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isDeleted = item.deleted_at !== null;
                    const isFeatured = item.is_featured;

                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${isDeleted ? 'bg-red-50/50' : ''}`}>
                        <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <span className="text-xl">🖼️</span>
                            ) : (
                              <FaFileAlt className="text-blue-500" size={16} />
                            )}
                            <div>
                              <div className={`font-medium ${isDeleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {item.breadcrumb || 'No breadcrumb'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {!isDeleted ? (
                            <Can permission="programs.toggle_status">
                              <button
                                onClick={() => {
                                  setToggling(item.id);
                                  router.post(route('backend.cms.programs.toggle-status', { id: item.id }), {}, {
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
                            </Can>
                          ) : (
                            <span className="text-xs text-red-500 font-medium">
                              <span className="inline-block mr-1">🗑️</span> Deleted
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!isDeleted && (
                            <Can permission="programs.toggle_featured">
                              <button
                                onClick={() => {
                                  setFeatureToggling(item.id);
                                  router.post(route('backend.cms.programs.toggle-featured', { id: item.id }), {}, {
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
                            </Can>
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
                              <Can permission="programs.restore">
                                <button
                                  onClick={() => {
                                    setIsRestoring(true);
                                    router.post(route('backend.cms.programs.restore', { id: item.id }), {}, {
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
                              </Can>
                              <Can permission="programs.force_delete">
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
                                        router.delete(route('backend.cms.programs.force-delete', { id: item.id }), {
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
                              </Can>
                            </>
                          ) : (
                            <>
                              <Can permission="programs.update">
                                <button
                                  onClick={() => router.visit(route('backend.cms.programs.edit', { id: item.id }))}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                              </Can>
                              <Can permission="programs.destroy">
                                <button
                                  onClick={() => {
                                    Swal.fire({
                                      title: 'Delete Program',
                                      text: `Move "${item.title}" to trash?`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#d33',
                                      cancelButtonColor: '#6b7280',
                                      confirmButtonText: 'Yes, delete it!',
                                      cancelButtonText: 'Cancel'
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        router.delete(route('backend.cms.programs.destroy', { id: item.id }), {
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
