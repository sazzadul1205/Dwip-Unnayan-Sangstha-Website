// resources/js/pages/Backend/Logs/Index.jsx
//
// ============================================================
//  SYSTEM LOGS
// ============================================================
//
// File-based, human-readable operational log viewer. Reads from
// storage/logs/{type}.log and displays parsed entries with
// expandable context, search, export, and detail view.
//
// Complements the database-backed audit trail: SimpleLogger
// captures operational events while the audit middleware
// captures data mutations automatically.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../layouts/AdminLayout';
import Swal from 'sweetalert2';
import {
  FiDatabase,
  FiClock,
  FiUser,
  FiDownload,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiX,
  FiFileText,
  FiEdit,
  FiSettings,
  FiUsers,
  FiCpu,
  FiBriefcase,
  FiBarChart2,
} from 'react-icons/fi';

const TYPE_ICONS = {
  security: { icon: FiShield, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'Login attempts, password changes, security events' },
  jobs: { icon: FiBriefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Job creation, updates, deletions, status changes' },
  applications: { icon: FiFileText, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', desc: 'Application submissions, status changes, emails' },
  users: { icon: FiUsers, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', desc: 'User management, profile updates, role changes' },
  cms: { icon: FiEdit, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'Blog, pages, programs, about content changes' },
  system: { icon: FiSettings, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', desc: 'Cache clearing, backups, system operations' },
  ats: { icon: FiCpu, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', desc: 'ATS score calculations and failures' },
};

const FALLBACK_ICON = { icon: FiFileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', desc: '' };

const getEmoji = (message) => {
  if (!message) return '📝';
  const emojiMap = {
    '✅': '✅', '❌': '❌', '🔴': '🔴', '🟢': '🟢',
    '📦': '📦', '🔄': '🔄', '🗑️': '🗑️', '📥': '📥',
    '📊': '📊', '🔒': '🔒', '💼': '💼', '📄': '📄',
    '👤': '👤', '📝': '📝', '⚙️': '⚙️', '🤖': '🤖',
    '🚪': '🚪', '📸': '📸', '✏️': '✏️',
  };
  for (const [key, value] of Object.entries(emojiMap)) {
    if (message.includes(key)) return value;
  }
  return '📝';
};

const isHighlighted = (message) => {
  const highlightPatterns = [
    '❌', '🔴', 'Failed', 'failed', 'error', 'Error',
    'deleted', 'Deleted', 'permanently', 'Permanently',
  ];
  return highlightPatterns.some((pattern) => message?.includes(pattern));
};

const formatContext = (context) => {
  if (!context) return '{}';
  if (typeof context === 'string') {
    try {
      return JSON.stringify(JSON.parse(context), null, 2);
    } catch {
      return context;
    }
  }
  return JSON.stringify(context, null, 2);
};

const DetailDrawer = ({ type, line, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!line) return undefined;

    setLoading(true);
    fetch(route('backend.logs.show', { type, line }), {
      headers: { Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, [type, line]);

  if (!line) return null;

  const log = data?.log;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {type} log entry #{line}
            </h2>
            <p className="text-xs text-gray-500">
              {log ? new Date(log.timestamp.replace(' ', 'T')).toLocaleString() : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-900">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading && <p className="text-sm text-gray-400">Loading…</p>}

          {log && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Type">{type}</Field>
                <Field label="Line">{line}</Field>
                <Field label="Timestamp">{log.timestamp}</Field>
                <Field label="User">
                  <div className="flex items-center gap-1">
                    <FiUser className="w-3 h-3 text-gray-400" />
                    {log.email || 'System'}
                  </div>
                </Field>
                <Field label="User ID">{log.user_id}</Field>
                <Field label="IP Address">{log.ip || '0.0.0.0'}</Field>
                <Field label="Highlighted">
                  {log.is_highlighted ? (
                    <span className="text-red-600 font-medium">Yes</span>
                  ) : (
                    'No'
                  )}
                </Field>
              </div>

              <Field label="Message">
                <div className={`break-all text-sm ${log.is_highlighted ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                  <span className="text-base mr-1">{getEmoji(log.message)}</span>
                  {log.message}
                </div>
              </Field>

              {log.context && (
                <Field label="Context">
                  <pre className="text-[10px] text-gray-700 bg-gray-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                    {formatContext(log.context)}
                  </pre>
                </Field>
              )}

              {log.raw && (
                <Field label="Raw Line">
                  <pre className="text-[10px] text-gray-500 bg-gray-50 rounded-lg p-3 overflow-x-auto break-all font-mono">
                    {log.raw}
                  </pre>
                </Field>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-1">{label}</p>
    <div className="text-sm text-gray-800">{children}</div>
  </div>
);

const SystemLogsIndex = ({ logTypes, currentType, logs, fileInfo, can, retentionDays }) => {
  const { flash } = usePage().props;

  const [activeType, setActiveType] = useState(currentType || 'security');
  const [entries, setEntries] = useState(logs || []);
  const [info, setInfo] = useState(fileInfo || {});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const typeConfig = useMemo(() => TYPE_ICONS[activeType] || FALLBACK_ICON, [activeType]);
  const TypeIcon = typeConfig.icon;

  const typeHelpers = useMemo(
    () => ({
      icon: TypeIcon,
      color: typeConfig.color,
      bg: typeConfig.bg,
      border: typeConfig.border,
      label: logTypes[activeType] || activeType,
      description: typeConfig.desc,
    }),
    [activeType, logTypes, typeConfig, TypeIcon]
  );

  const fetchLogs = useCallback(() => {
    setLoading(true);
    router.get(
      route('backend.logs.index', { type: activeType, limit: 200 }),
      {},
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onSuccess: (page) => {
          setEntries(page.props.logs || []);
          setInfo(page.props.fileInfo || {});
          setLoading(false);
        },
        onError: () => setLoading(false),
      }
    );
  }, [activeType]);

  const handleTypeChange = useCallback(
    (type) => {
      setActiveType(type);
      setSearchTerm('');
      router.get(
        route('backend.logs.index', { type, limit: 200 }),
        {},
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
          onSuccess: (page) => {
            setEntries(page.props.logs || []);
            setInfo(page.props.fileInfo || {});
          },
        }
      );
    },
    []
  );

  const handleExport = useCallback(() => {
    if (!can?.export) {
      Swal.fire('Permission Denied', 'You do not have permission to export logs.', 'error');
      return;
    }
    window.open(route('backend.logs.export', { type: activeType, limit: 5000 }), '_blank');
  }, [can, activeType]);

  const handleClear = useCallback(() => {
    if (!can?.clear) {
      Swal.fire('Permission Denied', 'You do not have permission to clear logs.', 'error');
      return;
    }

    Swal.fire({
      title: `Clear ${typeHelpers.label}?`,
      text: `Are you sure you want to clear all entries from ${typeHelpers.label}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(true);
        router.post(
          route('backend.logs.clear', { type: activeType }),
          {},
          {
            preserveScroll: true,
            onSuccess: () => {
              Swal.fire({
                icon: 'success',
                title: 'Cleared!',
                text: `${typeHelpers.label} has been cleared.`,
                timer: 1500,
                showConfirmButton: false,
              });
              fetchLogs();
            },
            onError: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error?.message || 'Failed to clear logs.',
              });
              setLoading(false);
            },
          }
        );
      }
    });
  }, [can, activeType, typeHelpers, fetchLogs]);

  const fetchStats = useCallback(() => {
    setShowStats(true);
    fetch(route('backend.logs.stats'), {
      headers: { Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStatsData(data))
      .catch(() => setStatsData(null));
  }, []);

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return entries;
    const term = searchTerm.toLowerCase();
    return entries.filter(
      (log) =>
        log.message?.toLowerCase().includes(term) ||
        log.email?.toLowerCase().includes(term) ||
        log.ip?.toLowerCase().includes(term) ||
        log.timestamp?.toLowerCase().includes(term)
    );
  }, [entries, searchTerm]);

  const noResults = filteredLogs.length === 0 && !loading;

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs();
      }, 30000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, fetchLogs, refreshInterval]);

  useEffect(() => {
    if (flash?.success)
      Swal.fire({ icon: 'success', title: flash.success, timer: 3000, showConfirmButton: false });
    if (flash?.error) Swal.fire({ icon: 'error', title: flash.error, timer: 5000 });
  }, [flash]);

  if (!can?.view && !can?.export && !can?.clear) {
    return (
      <AdminLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShield className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2 text-sm">
              You don't have permission to view system logs.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head title="System Logs | DUS Admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiDatabase className="w-6 h-6 text-blue-600" />
              System Logs
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              File-based operational log trail. Entries are kept for {retentionDays} days.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${typeHelpers.bg} ${typeHelpers.color} border ${typeHelpers.border}`}
            >
              <TypeIcon size={12} />
              {typeHelpers.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">File Size</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{info?.size || '0 B'}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiDatabase className="text-blue-600" size={14} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Total Lines</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{info?.lines || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiClock className="text-purple-600" size={14} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Last Modified</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900">{info?.last_modified || 'Never'}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiRefreshCw className="text-orange-600" size={14} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Max Lines</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">10,000</p>
                <p className="text-[8px] sm:text-xs text-gray-400">Auto-rotates</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FiShield className="text-red-600" size={14} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="w-full relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 flex items-center gap-0.5 sm:gap-1 whitespace-nowrap"
              >
                <FiX size={10} />
                Clear
              </button>
            )}
            <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              Showing {filteredLogs.length} of {entries.length}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
          <select
            value={activeType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            {Object.entries(logTypes || {}).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            {loading ? <FiRefreshCw className="animate-spin" size={12} /> : <FiRefreshCw size={12} />}
            Refresh
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
              autoRefresh
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiRefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
            Auto-Refresh {autoRefresh && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
          </button>

          <button
            onClick={fetchStats}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <FiBarChart2 size={12} />
            Stats
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <FiDownload size={12} />
              Export CSV
            </button>

            <button
              onClick={handleClear}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <FiTrash2 size={12} />
              Clear
            </button>
          </div>
        </div>

        {showStats && statsData && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Log Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(statsData.stats || {}).map(([type, data]) => {
                const Icon = TYPE_ICONS[type]?.icon || FiFileText;
                return (
                  <div key={type} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">{type}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{data.lines || 0} lines</p>
                    <p className="text-[10px] text-gray-400">{data.last_modified}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
              <span>Total: {statsData.total}</span>
              <span>Last entry: {statsData.lastEntryAt || 'Never'}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0">
            <span className="text-xs sm:text-sm text-gray-600">
              Showing <strong>{filteredLogs.length}</strong> entries
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500">
              {typeHelpers.label}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <FiRefreshCw className="animate-spin text-3xl sm:text-4xl text-blue-600" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                {noResults ? (
                  <FiSearch className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                ) : (
                  <FiDatabase className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                )}
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                {noResults ? 'No matching logs found' : 'No log entries found'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {noResults
                  ? 'Try adjusting your search term.'
                  : `${typeHelpers.label} is empty. System is quiet! 🤫`}
              </p>
              {noResults && searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-3 sm:mt-4 inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-left text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider w-8 sm:w-10">#</th>
                    <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-left text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider w-28 sm:w-40">Time</th>
                    <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-left text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider w-24 sm:w-36">User</th>
                    <th className="hidden md:table-cell px-2 sm:px-4 py-1.5 sm:py-2 text-left text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider w-20 sm:w-28">IP</th>
                    <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-left text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider">Message</th>
                    <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-left text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider w-10 sm:w-14">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => {
                    const highlighted = isHighlighted(log.message);
                    const emoji = getEmoji(log.message);
                    const contextCount = log.context && typeof log.context === 'object' ? Object.keys(log.context).length : 0;

                    return (
                      <tr
                        key={index}
                        className={`hover:bg-gray-50 transition-colors ${highlighted ? 'bg-red-50/70' : ''} ${
                          index % 2 === 0 && !highlighted ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-gray-400 text-[10px] sm:text-xs text-center">
                          {log.line || index + 1}
                        </td>
                        <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-gray-500 whitespace-nowrap text-[10px] sm:text-xs">
                          {log.timestamp || 'N/A'}
                        </td>
                        <td className="px-2 sm:px-4 py-1.5 sm:py-2">
                          <div className="flex items-center gap-1">
                            <FiUser className="text-gray-400 text-[8px] sm:text-xs" size={8} />
                            <span
                              className="text-blue-600 font-medium text-[10px] sm:text-xs truncate max-w-16 sm:max-w-24"
                            >
                              {log.email || 'System'}
                            </span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-2 sm:px-4 py-1.5 sm:py-2 text-gray-500 text-[10px] sm:text-xs">
                          {log.ip || '0.0.0.0'}
                        </td>
                        <td className="px-2 sm:px-4 py-1.5 sm:py-2">
                          <div className="flex items-start gap-1.5 sm:gap-2">
                            <span className="text-sm sm:text-base shrink-0 mt-0.5">{emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div
                                className={`break-all text-[11px] sm:text-sm ${highlighted ? 'text-red-700 font-medium' : 'text-gray-700'}`}
                              >
                                {log.message}
                              </div>

                              {contextCount > 0 && (
                                <div className="mt-1">
                                  <button
                                    onClick={() => setOpenDrawer({ type: activeType, line: log.line })}
                                    className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 sm:gap-1"
                                  >
                                    <FiEye size={8} />
                                    View details ({contextCount})
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-1.5 sm:py-2">
                          <button
                            onClick={() => setOpenDrawer({ type: activeType, line: log.line })}
                            className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            title="View details"
                          >
                            <FiEye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 text-[10px] sm:text-xs text-gray-400">
          <div>
            <span>Showing {filteredLogs.length} of {entries.length} entries</span>
            {searchTerm && <span className="ml-1 sm:ml-2">(filtered)</span>}
          </div>
          <div>
            <span>Log file: {activeType}.log</span>
            <span className="ml-2 sm:ml-4">Max: 10,000 lines (auto-rotates)</span>
          </div>
        </div>
      </div>

      <DetailDrawer
        type={openDrawer?.type}
        line={openDrawer?.line}
        onClose={() => setOpenDrawer(null)}
      />
    </AdminLayout>
  );
};

export default SystemLogsIndex;
