// resources/js/Pages/Backend/Logs/Index.jsx

// React
import { useState, useEffect, useMemo, useCallback } from 'react';

// Inertia
import { Head, router } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';
import { Can } from '../../../components/Auth/Can';

// Icons
import {
  FaShieldAlt,
  FaBriefcase,
  FaFileAlt,
  FaUsers,
  FaEdit,
  FaCog,
  FaRobot,
  FaSpinner,
  FaSearch,
  FaTimes,
  FaChevronDown,
  FaDownload,
  FaTrash,
  FaExclamationTriangle,
  FaInfoCircle,
  FaClock,
  FaUser,
  FaDatabase,
  FaSyncAlt,
} from 'react-icons/fa';

// SweetAlert2
import Swal from 'sweetalert2';

export default function LogsIndex({
  currentType: initialCurrentType,
  logs: initialLogs,
  fileInfo: initialFileInfo,
}) {

  // ============================================
  // ALL HOOKS MUST BE CALLED FIRST
  // ============================================

  // Use centralized auth hook
  const {
    hasAnyPermission,
  } = useAuth();

  // Check permissions
  const canViewLogs = hasAnyPermission(['logs.view', 'logs.manage']);
  const canExportLogs = hasAnyPermission(['logs.export', 'logs.manage']);
  const canClearLogs = hasAnyPermission(['logs.clear', 'logs.manage']);

  // Log types with icons
  const logTypes = useMemo(() => ({
    security: {
      label: 'Security Logs',
      icon: FaShieldAlt,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      description: 'Login attempts, password changes, security events'
    },
    jobs: {
      label: 'Jobs Log',
      icon: FaBriefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      description: 'Job creation, updates, deletions, status changes'
    },
    applications: {
      label: 'Applications Log',
      icon: FaFileAlt,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      description: 'Application submissions, status changes, emails'
    },
    users: {
      label: 'Users Log',
      icon: FaUsers,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      description: 'User management, profile updates, role changes'
    },
    cms: {
      label: 'CMS Log',
      icon: FaEdit,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      description: 'Blog, pages, programs, about content changes'
    },
    system: {
      label: 'System Log',
      icon: FaCog,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      description: 'Cache clearing, backups, system operations'
    },
    ats: {
      label: 'ATS Log',
      icon: FaRobot,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      description: 'ATS score calculations and failures'
    },
  }), []);

  // States
  const [currentType, setCurrentType] = useState(initialCurrentType || 'security');
  const [logs, setLogs] = useState(initialLogs || []);
  const [fileInfo, setFileInfo] = useState(initialFileInfo || {});
  const [loading, setLoading] = useState(false);
  const [expandedContext, setExpandedContext] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // ============================================
  // ALL useCallback HOOKS
  // ============================================

  // Fetch logs for current type
  const fetchLogs = useCallback(() => {
    setLoading(true);
    router.get(route('backend.logs.index', { type: currentType, limit: 200 }), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setLogs(page.props.logs || []);
        setFileInfo(page.props.fileInfo || {});
        setLoading(false);
      },
      onError: () => {
        setLoading(false);
      },
    });
  }, [currentType]);

  // Handle type change
  const handleTypeChange = useCallback((type) => {
    setCurrentType(type);
    setExpandedContext({});
    setSearchTerm('');
    router.get(route('backend.logs.index', { type, limit: 200 }), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setLogs(page.props.logs || []);
        setFileInfo(page.props.fileInfo || {});
      },
    });
  }, []);

  // Export logs
  const handleExport = useCallback(() => {
    if (!canExportLogs) {
      Swal.fire('Permission Denied', 'You do not have permission to export logs.', 'error');
      return;
    }
    window.open(route('backend.logs.export', { type: currentType }), '_blank');
  }, [canExportLogs, currentType]);

  // Clear logs
  const handleClear = useCallback(() => {
    if (!canClearLogs) {
      Swal.fire('Permission Denied', 'You do not have permission to clear logs.', 'error');
      return;
    }

    const logType = logTypes[currentType];
    Swal.fire({
      title: `Clear ${logType?.label || currentType}?`,
      text: `Are you sure you want to clear all entries from the ${logType?.label || currentType}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(true);
        router.post(route('backend.logs.clear', { type: currentType }), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Cleared!',
              text: `${logType?.label || currentType} has been cleared.`,
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
        });
      }
    });
  }, [canClearLogs, currentType, logTypes, fetchLogs]);

  // Toggle expanded context
  const toggleExpanded = useCallback((index) => {
    setExpandedContext(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

  // Check if log entry should be highlighted
  const isHighlighted = useCallback((message) => {
    const highlightPatterns = [
      '❌', '🔴', 'Failed', 'failed', 'error', 'Error',
      'deleted', 'Deleted', 'permanently', 'Permanently'
    ];
    return highlightPatterns.some(pattern => message?.includes(pattern));
  }, []);

  // Get emoji for log entry
  const getLogEmoji = useCallback((message) => {
    if (!message) return '📝';
    const emojiMap = {
      '✅': '✅', '❌': '❌', '🔴': '🔴', '🟢': '🟢',
      '📦': '📦', '🔄': '🔄', '🗑️': '🗑️', '📥': '📥',
      '📊': '📊', '🔒': '🔒', '💼': '💼', '📄': '📄',
      '👤': '👤', '📝': '📝', '⚙️': '⚙️', '🤖': '🤖',
      '🚪': '🚪', '📸': '📸', '✏️': '✏️'
    };
    for (const [key, value] of Object.entries(emojiMap)) {
      if (message.includes(key)) return value;
    }
    return '📝';
  }, []);

  // Get context count
  const getContextCount = useCallback((log) => {
    if (!log.context) return 0;
    if (typeof log.context === 'object') {
      return Object.keys(log.context).length;
    }
    return 0;
  }, []);

  // Format context
  const formatContext = useCallback((context) => {
    if (!context) return '{}';
    if (typeof context === 'string') {
      try {
        return JSON.stringify(JSON.parse(context), null, 2);
      } catch {
        return context;
      }
    }
    return JSON.stringify(context, null, 2);
  }, []);

  // ============================================
  // ALL useEffect HOOKS
  // ============================================

  // Auto-refresh effect
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

  // Initial fetch on mount
  useEffect(() => {
    if (initialLogs && initialLogs.length === 0) {
      fetchLogs();
    }
  }, [fetchLogs, initialLogs]);

  // ============================================
  // ALL useMemo HOOKS
  // ============================================

  // Filter logs by search term
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(log =>
      log.message?.toLowerCase().includes(term) ||
      log.email?.toLowerCase().includes(term) ||
      log.ip?.toLowerCase().includes(term) ||
      log.timestamp?.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  // No results check
  const noResults = useMemo(() => {
    return filteredLogs.length === 0 && !loading;
  }, [filteredLogs, loading]);

  // Get log type helpers
  const logTypeHelpers = useMemo(() => {
    const type = logTypes[currentType];
    return {
      icon: type?.icon || FaShieldAlt,
      color: type?.color || 'text-gray-600',
      bg: type?.bg || 'bg-gray-50',
      border: type?.border || 'border-gray-200',
      label: type?.label || currentType,
      description: type?.description || '',
    };
  }, [currentType, logTypes]);

  // ============================================
  // CONDITIONAL RETURN
  // ============================================

  if (!canViewLogs) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">You don't have permission to view system logs.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  const LogTypeIcon = logTypeHelpers.icon;

  return (
    <AuthenticatedLayout>
      <Head title="System Logs" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
        <div className="mx-auto">
          {/* HEADER - Responsive */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 xl:gap-4 mb-4 sm:mb-6 animate-fade-in">
            <div className="w-full xl:w-auto">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  System Logs
                </h1>
                <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${logTypeHelpers.bg} ${logTypeHelpers.color} border ${logTypeHelpers.border}`}>
                  <LogTypeIcon size={12} />
                  {logTypeHelpers.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                {logTypeHelpers.description}
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-3 mt-1 sm:mt-2">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-500">
                  <FaDatabase size={10} />
                  Size: {fileInfo?.size || '0 B'}
                </span>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-500">
                  <FaClock size={10} />
                  Lines: {fileInfo?.lines || 0}
                </span>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-500">
                  <FaSyncAlt size={10} />
                  Modified: {fileInfo?.last_modified || 'Never'}
                </span>
                {autoRefresh && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Auto-refresh ON
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full xl:w-auto">
              {/* Auto-refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 text-xs sm:text-sm ${autoRefresh
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <FaSyncAlt size={12} className={autoRefresh ? 'animate-spin' : ''} />
                <span className="hidden xs:inline">Auto-Refresh</span>
                <span className="xs:hidden">Auto</span>
              </button>

              {/* Log Type Selector */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={currentType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 pr-7 sm:pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-xs sm:text-sm"
                >
                  {Object.entries(logTypes).map(([key, type]) => (
                    <option key={key} value={key}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
              >
                {loading ? <FaSpinner className="animate-spin" size={12} /> : <FaSyncAlt size={12} />}
                <span className="hidden xs:inline">Refresh</span>
              </button>

              {/* Export Button */}
              <Can permission="logs.export" fallback={null}>
                <button
                  onClick={handleExport}
                  className="flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                >
                  <FaDownload size={12} />
                  <span className="hidden xs:inline">Export</span>
                </button>
              </Can>

              {/* Clear Button */}
              <Can permission="logs.clear" fallback={null}>
                <button
                  onClick={handleClear}
                  disabled={loading || !fileInfo?.exists}
                  className="flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
                >
                  <FaTrash size={12} />
                  <span className="hidden xs:inline">Clear</span>
                </button>
              </Can>
            </div>
          </div>

          {/* Stats Cards - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500">File Size</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{fileInfo?.size || '0 B'}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaDatabase className="text-blue-600" size={14} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500">Total Lines</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{fileInfo?.lines || 0}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaClock className="text-purple-600" size={14} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500">Last Modified</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">{fileInfo?.last_modified || 'Never'}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaSyncAlt className="text-orange-600" size={14} />
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
                  <FaExclamationTriangle className="text-red-600" size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar - Responsive */}
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="w-full relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
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
                  <FaTimes size={10} />
                  Clear
                </button>
              )}
              <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                Showing {filteredLogs.length} of {logs.length}
              </div>
            </div>
          </div>

          {/* Log Entries Table - Responsive */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm text-gray-600">
                Showing <strong>{filteredLogs.length}</strong> entries
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500">
                {logTypeHelpers.label}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 sm:py-20">
                <FaSpinner className="animate-spin text-3xl sm:text-4xl text-blue-600" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  {noResults ? (
                    <FaSearch className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                  ) : (
                    <FaDatabase className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  {noResults ? 'No matching logs found' : 'No log entries found'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {noResults
                    ? 'Try adjusting your search term.'
                    : `${logTypeHelpers.label} is empty. System is quiet! 🤫`}
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => {
                      const highlighted = isHighlighted(log.message);
                      const contextCount = getContextCount(log);
                      const isExpanded = expandedContext[index];
                      const emoji = getLogEmoji(log.message);

                      return (
                        <tr
                          key={index}
                          className={`hover:bg-gray-50 transition-colors ${highlighted ? 'bg-red-50/70' : ''} ${index % 2 === 0 && !highlighted ? 'bg-white' : 'bg-gray-50/50'
                            }`}
                        >
                          <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-gray-400 text-[10px] sm:text-xs text-center">
                            {index + 1}
                          </td>
                          <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-gray-500 whitespace-nowrap text-[10px] sm:text-xs">
                            {log.timestamp || 'N/A'}
                          </td>
                          <td className="px-2 sm:px-4 py-1.5 sm:py-2">
                            <div className="flex items-center gap-1">
                              <FaUser className="text-gray-400 text-[8px] sm:text-xs" size={8} />
                              <span className="text-blue-600 font-medium text-[10px] sm:text-xs truncate max-w-16 sm:max-w-24">
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
                                <div className={`break-all text-[11px] sm:text-sm ${highlighted ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                                  {log.message}
                                </div>

                                {contextCount > 0 && (
                                  <div className="mt-1">
                                    <button
                                      onClick={() => toggleExpanded(index)}
                                      className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 sm:gap-1"
                                    >
                                      <FaInfoCircle size={8} />
                                      {isExpanded ? 'Hide' : 'Show'} details ({contextCount})
                                      <FaChevronDown
                                        size={8}
                                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                      />
                                    </button>

                                    {isExpanded && (
                                      <div className="mt-1.5 sm:mt-2 p-2 sm:p-3 bg-gray-100 rounded-lg overflow-x-auto">
                                        <pre className="text-[10px] sm:text-xs text-gray-700 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                                          {formatContext(log.context)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Info - Responsive */}
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 text-[10px] sm:text-xs text-gray-400">
            <div>
              <span>Showing {filteredLogs.length} of {logs.length} entries</span>
              {searchTerm && <span className="ml-1 sm:ml-2">(filtered)</span>}
            </div>
            <div>
              <span>Log file: {currentType}.log</span>
              <span className="ml-2 sm:ml-4">Max: 10,000 lines (auto-rotates)</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline !important;
          }
          .xs\\:hidden {
            display: none !important;
          }
        }
        .xs\\:inline {
          display: none;
        }
        .xs\\:hidden {
          display: inline;
        }
      `}</style>
    </AuthenticatedLayout>
  );
}