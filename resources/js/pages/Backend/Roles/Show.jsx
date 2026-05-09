// resources/js/pages/Backend/Roles/Show.jsx

import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

import {
  FaArrowLeft,
  FaShieldAlt,
  FaKey,
  FaUsers,
  FaEdit,
  FaTrash,
  FaTrashRestore,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaToggleOn,
  FaToggleOff,
  FaCopy,
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaClock,
  FaDatabase,
  FaEye,
  FaLock,
  FaChartLine,
  FaTag,
  FaIdCard,
  FaUserTag,
} from 'react-icons/fa';

export default function Show({ role, users, permissions, moduleAccess, isDeleted }) {
  const [activeTab, setActiveTab] = useState('permissions');
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [cloning, setCloning] = useState(false);

  if (!role) {
    return (
      <AuthenticatedLayout>
        <Head title="Loading Role..." />
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <FaSpinner className="animate-spin text-5xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading role details...</p>
            <Link
              href={route('backend.roles.index')}
              className="inline-flex items-center gap-2 mt-6 text-blue-600 hover:text-blue-800 font-medium"
            >
              <FaArrowLeft size={14} />
              Back to roles
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLevelBadge = (level) => {
    if (!level) return 'bg-gray-100 text-gray-600';
    if (level <= 10) return 'bg-red-100 text-red-700';
    if (level <= 30) return 'bg-orange-100 text-orange-700';
    if (level <= 60) return 'bg-yellow-100 text-yellow-700';
    if (level <= 80) return 'bg-blue-100 text-blue-700';
    return 'bg-green-100 text-green-700';
  };

  const getAccessLevelBadge = (level) => {
    const colors = {
      manage: 'bg-purple-100 text-purple-700',
      write: 'bg-blue-100 text-blue-700',
      read: 'bg-green-100 text-green-700',
      no_access: 'bg-gray-100 text-gray-500',
    };
    return colors[level] || colors.no_access;
  };

  const getAccessLevelLabel = (level) => {
    const labels = {
      manage: 'Full Management',
      write: 'Read & Write',
      read: 'Read Only',
      no_access: 'No Access',
    };
    return labels[level] || level;
  };

  const handleToggleStatus = () => {
    if (role.is_default) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Deactivate',
        text: 'Default roles cannot be deactivated.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: role.is_active ? 'Deactivate Role?' : 'Activate Role?',
      text: role.is_active
        ? 'This will make the role unavailable for assignment.'
        : 'This will make the role available for assignment.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: role.is_active ? 'Deactivate' : 'Activate',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      setTogglingStatus(true);
      router.post(route('backend.roles.toggle-status', role.id), {}, {
        preserveScroll: true,
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: `Role is now ${role.is_active ? 'inactive' : 'active'}.`,
            timer: 1500,
            showConfirmButton: false,
          });
          router.reload();
        },
        onError: (errors) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: errors?.message || 'Could not update role status.',
          });
        },
        onFinish: () => setTogglingStatus(false),
      });
    });
  };

  const handleDelete = () => {
    if (role.is_default) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete',
        text: 'Default roles cannot be deleted.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    if (role.user_count > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete',
        text: `This role has ${role.user_count} user(s) assigned. Please reassign users first.`,
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Role?',
      html: '<p class="text-gray-600">This will move the role to trash.</p><p class="text-sm text-red-600 mt-2">Roles with users assigned cannot be deleted.</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Move to Trash',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      setDeleting(true);
      router.delete(route('backend.roles.destroy', role.id), {
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Role moved to trash.',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => {
            router.visit(route('backend.roles.index'));
          });
        },
        onError: (errors) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: errors?.message || 'Could not delete role.',
          });
        },
        onFinish: () => setDeleting(false),
      });
    });
  };

  const handleRestore = () => {
    Swal.fire({
      title: 'Restore Role?',
      text: 'This will restore the role from trash.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Restore',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      setRestoring(true);
      router.post(route('backend.roles.restore', role.id), {}, {
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Restored!',
            text: 'Role has been restored.',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => {
            router.visit(route('backend.roles.show', role.id));
          });
        },
        onError: (errors) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: errors?.message || 'Could not restore role.',
          });
        },
        onFinish: () => setRestoring(false),
      });
    });
  };

  const handleClone = () => {
    Swal.fire({
      title: 'Clone Role?',
      text: `Create a copy of "${role.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Clone',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      setCloning(true);
      router.post(route('backend.roles.clone', role.id), {}, {
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Cloned!',
            text: 'Role cloned successfully.',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => {
            router.visit(route('backend.roles.index'));
          });
        },
        onError: (errors) => {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: errors?.message || 'Could not clone role.',
          });
        },
        onFinish: () => setCloning(false),
      });
    });
  };

  const StatCard = ({ icon: Icon, label, value, subtext, colorClass }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  const InfoRow = ({ icon: Icon, label, value, highlight }) => (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${highlight ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <Icon className={`mt-0.5 ${highlight ? 'text-blue-600' : 'text-gray-400'}`} size={16} />
      <div className="flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-medium ${highlight ? 'text-blue-900' : 'text-gray-900'}`}>{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <AuthenticatedLayout>
      <Head title={`${role.name} - Role Details`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-6">
            <Link
              href={route('backend.roles.index')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4 group"
            >
              <FaArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Roles</span>
            </Link>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{role.name}</h1>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${role.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                        }`}>
                        {role.is_active ? <FaCheckCircle size={12} /> : <FaTimesCircle size={12} />}
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {role.is_default && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          <FaStar size={12} />
                          Default Role
                        </span>
                      )}
                      {isDeleted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <FaTrash size={12} />
                          Trashed
                        </span>
                      )}
                    </div>

                    {role.description && (
                      <p className="text-gray-600 mt-2 max-w-2xl">{role.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-3">
                      <span className="flex items-center gap-1.5">
                        <FaTag size={14} />
                        Slug: {role.slug}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FaClock size={14} />
                        Created {formatDateTime(role.created_at)}
                      </span>
                      {role.updated_at !== role.created_at && (
                        <span className="flex items-center gap-1.5">
                          <FaSyncAlt size={14} />
                          Updated {formatDateTime(role.updated_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {!isDeleted && (
                      <>
                        <button
                          type="button"
                          onClick={handleToggleStatus}
                          disabled={togglingStatus || role.is_default}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${role.is_active
                              ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                              : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            } ${(togglingStatus || role.is_default) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {togglingStatus ? (
                            <FaSpinner className="animate-spin" size={16} />
                          ) : role.is_active ? (
                            <FaToggleOff size={16} />
                          ) : (
                            <FaToggleOn size={16} />
                          )}
                          {role.is_active ? 'Deactivate' : 'Activate'}
                        </button>

                        <Link
                          href={route('backend.roles.edit', role.id)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <FaEdit size={14} />
                          Edit Role
                        </Link>

                        <button
                          type="button"
                          onClick={handleClone}
                          disabled={cloning}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 hover:bg-teal-100 font-medium transition-all duration-200"
                        >
                          {cloning ? <FaSpinner className="animate-spin" size={14} /> : <FaCopy size={14} />}
                          Clone
                        </button>

                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleting || role.is_default}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium transition-all duration-200 ${(deleting || role.is_default) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                          {deleting ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                          Delete
                        </button>
                      </>
                    )}

                    {isDeleted && (
                      <button
                        type="button"
                        onClick={handleRestore}
                        disabled={restoring}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 font-medium transition-all duration-200"
                      >
                        {restoring ? <FaSpinner className="animate-spin" size={14} /> : <FaTrashRestore size={14} />}
                        Restore Role
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard
              icon={FaUserTag}
              label="Access Level"
              value={`Level ${role.level}`}
              subtext={role.level <= 10 ? 'Highest Access' : role.level <= 30 ? 'High Access' : role.level <= 60 ? 'Medium Access' : 'Standard Access'}
              colorClass="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              icon={FaUsers}
              label="Assigned Users"
              value={role.user_count || 0}
              subtext="Users with this role"
              colorClass="bg-blue-50 text-blue-600"
            />
            <StatCard
              icon={FaKey}
              label="Permissions"
              value={role.permission_count || 0}
              subtext="Granted permissions"
              colorClass="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              icon={FaDatabase}
              label="Modules"
              value={moduleAccess?.length || 0}
              subtext="Modules with access control"
              colorClass="bg-purple-50 text-purple-600"
            />
          </div>

          {/* Main Content Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex gap-6">
                {['permissions', 'module_access', 'users'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-1 text-sm font-medium transition-all duration-200 relative ${activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab === 'permissions' && `Permissions (${role.permission_count || 0})`}
                    {tab === 'module_access' && `Module Access (${moduleAccess?.length || 0})`}
                    {tab === 'users' && `Assigned Users (${role.user_count || 0})`}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'permissions' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-blue-600 to-indigo-600">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <FaKey size={16} />
                  Granted Permissions
                </h2>
                <p className="text-white/70 text-sm mt-1">
                  Permissions assigned to this role
                </p>
              </div>

              {permissions && permissions.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {permissions.map((module) => (
                    <div key={module.module} className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FaDatabase className="text-blue-500" size={18} />
                        {module.module}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {module.permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group"
                          >
                            <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" size={14} />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                                <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono">
                                  {permission.action}
                                </span>
                              </div>
                              {permission.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
                              )}
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{permission.slug}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FaKey className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-500">No permissions assigned to this role.</p>
                  <p className="text-sm text-gray-400 mt-1">Edit the role to add permissions.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'module_access' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-purple-600 to-indigo-600">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <FaLock size={16} />
                  Module Access Levels
                </h2>
                <p className="text-white/70 text-sm mt-1">
                  Module-level access control for this role
                </p>
              </div>

              {moduleAccess && moduleAccess.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {moduleAccess.map((access) => (
                      <div
                        key={access.module}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FaLock className="text-purple-600" size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{access.module}</p>
                            <p className="text-xs text-gray-500">Module</p>
                          </div>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getAccessLevelBadge(access.access_level)}`}>
                          {getAccessLevelLabel(access.access_level)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FaLock className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-500">No module access levels configured.</p>
                  <p className="text-sm text-gray-400 mt-1">Edit the role to configure module access.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-cyan-600 to-blue-600">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <FaUsers size={16} />
                  Users with this Role
                </h2>
                <p className="text-white/70 text-sm mt-1">
                  Users currently assigned to "{role.name}"
                </p>
              </div>

              {users && users.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <div key={user.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                          <FaUser className="text-blue-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-base font-semibold text-gray-900">{user.name}</p>
                            {user.profile_completed && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                                <FaCheckCircle size={10} />
                                Profile Complete
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FaEnvelope size={12} />
                              {user.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaIdCard size={12} />
                              Legacy Role: {user.role || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={route('backend.users.show', user.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View User"
                        >
                          <FaEye size={16} />
                        </Link>
                      </div>
                    </div>
                  ))}

                  {role.user_count > 10 && (
                    <div className="p-4 text-center bg-gray-50">
                      <p className="text-sm text-gray-500">
                        And {role.user_count - 10} more user(s)...
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FaUsers className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-500">No users assigned to this role.</p>
                  <p className="text-sm text-gray-400 mt-1">Users will appear here once assigned.</p>
                </div>
              )}
            </div>
          )}

          {/* Audit Information Section */}
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-linear-to-r from-gray-700 to-gray-800">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <FaClock size={16} />
                Audit Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={FaUser} label="Created By" value={role.creator?.name || 'System'} />
              <InfoRow icon={FaCalendarAlt} label="Created At" value={formatDateTime(role.created_at)} />
              <InfoRow icon={FaUser} label="Last Updated By" value={role.updater?.name || 'System'} />
              <InfoRow icon={FaCalendarAlt} label="Last Updated At" value={formatDateTime(role.updated_at)} />
              {isDeleted && role.deleted_at && (
                <>
                  <InfoRow icon={FaTrash} label="Deleted At" value={formatDateTime(role.deleted_at)} highlight />
                  <InfoRow icon={FaUser} label="Deleted By" value={role.updater?.name || 'System'} highlight />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

// Missing FaStar and FaSyncAlt icons - add to imports
import { FaStar, FaSyncAlt } from 'react-icons/fa';