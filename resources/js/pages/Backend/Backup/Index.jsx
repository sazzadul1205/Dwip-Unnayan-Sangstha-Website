// resources/js/Pages/Backend/Backup/Index.jsx

// React
import React, { useState, } from 'react';

// Inertia
import { Head } from '@inertiajs/react';

// Layout
import AdminLayout from '../../../layouts/AdminLayout';

// SweetAlert
import Swal from 'sweetalert2';

// Icons
import {
  FaFileArchive,
  FaDownload,
  FaTrash,
  FaUndo,
  FaPlus,
  FaClock,
  FaInfoCircle,
  FaSpinner,
  FaCheckCircle,
  FaCalendarAlt,
  FaUser,
  FaRobot,
  FaHdd,
} from 'react-icons/fa';

export default function BackupIndex({ backups, backupLogs, storageInfo, config }) {
  const [loading, setLoading] = useState(false);
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get trigger icon
  const getTriggerIcon = (trigger) => {
    return trigger === 'auto' ? <FaRobot className="text-blue-500" /> : <FaUser className="text-green-500" />;
  };

  // Get trigger label
  const getTriggerLabel = (trigger) => {
    return trigger === 'auto' ? 'Automatic' : 'Manual';
  };

  // Get type badge color
  const getTypeColor = (type) => {
    switch (type) {
      case 'full': return 'bg-purple-100 text-purple-800';
      case 'database': return 'bg-blue-100 text-blue-800';
      case 'files': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Create manual backup
  const createManualBackup = async () => {
    const result = await Swal.fire({
      title: 'Create Manual Backup?',
      text: 'This will create a full backup of your application.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, create backup',
      input: 'select',
      inputOptions: {
        'full': 'Full Backup (Database + Files)',
        'database': 'Database Only',
        'files': 'Files Only'
      },
      inputPlaceholder: 'Select backup type',
      inputValue: 'full',
    });

    if (result.isConfirmed) {
      const type = result.value || 'full';
      await performBackup(type, 'manual');
    }
  };

  // Create automatic backup
  const createAutoBackup = async () => {
    const result = await Swal.fire({
      title: 'Create Automatic Backup?',
      text: 'This will create an automated backup of your application.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, create backup',
    });

    if (result.isConfirmed) {
      await performBackup('full', 'auto');
    }
  };

  // Perform backup
  const performBackup = async (type, trigger) => {
    setLoading(true);
    try {
      const endpoint = trigger === 'auto' ? 'create-auto' : 'create-manual';
      const response = await fetch(route(`backend.backup.${endpoint}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Backup Created!',
          text: 'Your backup has been created successfully.',
          timer: 2000,
          showConfirmButton: false,
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error(data.message || 'Failed to create backup');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Backup Failed',
        text: error.message || 'An error occurred while creating the backup.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Restore backup
  const restoreBackup = async (backupId) => {
    const result = await Swal.fire({
      title: 'Restore Backup?',
      text: 'This will restore the selected backup. This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, restore',
      input: 'select',
      inputOptions: {
        'full': 'Full Restore (Database + Files)',
        'database': 'Database Only',
        'files': 'Files Only'
      },
      inputPlaceholder: 'Select restore type',
      inputValue: 'full',
    });

    if (result.isConfirmed) {
      const type = result.value || 'full';
      setLoading(true);
      try {

        const response = await fetch(route('backend.backup.restore'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          },
          body: JSON.stringify({ backup_id: backupId, type }),
        });

        const data = await response.json();

        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Restore Successful!',
            text: 'Your backup has been restored successfully.',
            timer: 3000,
            showConfirmButton: false,
          });
          setTimeout(() => window.location.reload(), 3000);
        } else {
          throw new Error(data.message || 'Failed to restore backup');
        }
      } catch (error) {
        console.error('Restore error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Restore Failed',
          text: error.message || 'An error occurred while restoring the backup.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete backup
  const deleteBackup = async (backupId) => {
    const result = await Swal.fire({
      title: 'Delete Backup?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await fetch(route('backend.backup.delete'), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          },
          body: JSON.stringify({ backup_id: backupId }),
        });

        const data = await response.json();

        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Backup has been deleted.',
            timer: 1500,
            showConfirmButton: false,
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          throw new Error(data.message || 'Failed to delete backup');
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: error.message || 'An error occurred while deleting the backup.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Download backup
  const downloadBackup = (backupId) => {
    try {
      const url = route('backend.backup.download', { backup_id: backupId });
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'An error occurred while downloading the backup.',
      });
    }
  };

  return (
    <AdminLayout>
      <Head title="Backup Manager" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-6">
        <div className=" mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Backup Manager
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Create, manage, and restore backups of your application
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={createAutoBackup}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md disabled:opacity-50"
              >
                <FaClock size={16} />
                Auto Backup
              </button>
              <button
                onClick={createManualBackup}
                disabled={loading}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md disabled:opacity-50"
              >
                <FaPlus size={16} />
                Manual Backup
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaFileArchive className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Backups</p>
                  <p className="text-2xl font-bold text-gray-900">{storageInfo?.total_backups || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FaHdd className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Size</p>
                  <p className="text-2xl font-bold text-gray-900">{storageInfo?.total_size_formatted || '0 B'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaCheckCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Backups</p>
                  <p className="text-2xl font-bold text-gray-900">{config?.maxBackups || 10}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FaInfoCircle className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Disk Free</p>
                  <p className="text-2xl font-bold text-gray-900">{storageInfo?.disk_free || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Backup List */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Backup History</h2>
            </div>

            {backups && backups.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Backup ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {backups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{backup.id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(backup.type)}`}>
                            {backup.type.toUpperCase()}
                          </span>
                          {backup.database && (
                            <span className="ml-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              DB
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getTriggerIcon(backup.trigger)}
                            <span className="text-sm text-gray-600">{getTriggerLabel(backup.trigger)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {backup.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt size={12} className="text-gray-400" />
                            {formatDate(backup.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          {backup.size_formatted}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadBackup(backup.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <FaDownload size={16} />
                            </button>
                            <button
                              onClick={() => restoreBackup(backup.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Restore"
                            >
                              <FaUndo size={16} />
                            </button>
                            <button
                              onClick={() => deleteBackup(backup.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <FaFileArchive className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Backups Found</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Create your first backup using the "Manual Backup" or "Auto Backup" button above.
                </p>
              </div>
            )}
          </div>

          {/* Backup Logs */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Backup Logs</h2>
              <p className="text-sm text-gray-500 mt-1">Recent backup activities</p>
            </div>

            {backupLogs && backupLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Backup ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {backupLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">{log.timestamp}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${log.level === 'success' ? 'bg-green-100 text-green-800' :
                            log.level === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.backup_id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(log.type)}`}>
                            {log.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-500">No backup logs available</p>
              </div>
            )}
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 flex flex-col items-center">
                <FaSpinner className="animate-spin text-blue-600" size={48} />
                <p className="mt-4 text-gray-700 font-medium">Processing...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}