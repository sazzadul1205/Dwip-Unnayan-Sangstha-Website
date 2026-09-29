// resources/js/pages/Backend/AuditLogs/Index.jsx
//
// ============================================================
//  AUDIT TRAIL
// ============================================================
//
// Every state-changing request in the application lands here
// automatically, so this is the record of who changed what, when,
// and from where. Updates carry a before/after diff.
//
// Read-only by design — an audit trail you can edit is not an audit
// trail. The only write actions are export and prune, both gated.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../layouts/AdminLayout';
import Swal from 'sweetalert2';
import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
} from 'react-icons/fi';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaEye,
  FaPen,
  FaSignInAlt,
  FaSignOutAlt,
  FaTrash,
  FaUndo,
  FaUserShield,
} from 'react-icons/fa';

// ============================================
//  EVENT PRESENTATION
// ============================================

const EVENT_STYLES = {
  created: { label: 'Created', cls: 'bg-green-100 text-green-700', Icon: FaCheckCircle },
  updated: { label: 'Updated', cls: 'bg-blue-100 text-blue-700', Icon: FaPen },
  deleted: { label: 'Deleted', cls: 'bg-red-100 text-red-700', Icon: FaTrash },
  restored: { label: 'Restored', cls: 'bg-amber-100 text-amber-700', Icon: FaUndo },
  force_deleted: { label: 'Force deleted', cls: 'bg-rose-100 text-rose-700', Icon: FaTrash },
  login: { label: 'Signed in', cls: 'bg-emerald-100 text-emerald-700', Icon: FaSignInAlt },
  logout: { label: 'Signed out', cls: 'bg-slate-100 text-slate-700', Icon: FaSignOutAlt },
  failed_login: { label: 'Failed sign-in', cls: 'bg-orange-100 text-orange-700', Icon: FaExclamationCircle },
  denied: { label: 'Access denied', cls: 'bg-purple-100 text-purple-700', Icon: FaUserShield },
  exported: { label: 'Exported', cls: 'bg-cyan-100 text-cyan-700', Icon: FiDownload },
  pruned: { label: 'Pruned', cls: 'bg-stone-100 text-stone-700', Icon: FaTrash },
};

const FALLBACK = { label: 'Activity', cls: 'bg-gray-100 text-gray-700', Icon: FaPen };

const eventStyle = (event) => EVENT_STYLES[event] ?? FALLBACK;

const EventBadge = ({ event }) => {
  const { label, cls, Icon } = eventStyle(event);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// ============================================
//  VALUE RENDERING
// ============================================

const renderValue = (value) => {
  if (value === null || value === undefined) return <span className="text-gray-400 italic">empty</span>;
  if (value === '') return <span className="text-gray-400 italic">empty</span>;
  if (typeof value === 'boolean') return <span>{value ? 'true' : 'false'}</span>;
  if (typeof value === 'object') return <code className="text-[11px]">{JSON.stringify(value)}</code>;

  const text = String(value);

  return <span className="break-all">{text.length > 120 ? `${text.slice(0, 120)}…` : text}</span>;
};

const DiffRow = ({ field, before, after }) => (
  <div className="py-2 border-b border-gray-100 last:border-0">
    <p className="text-[11px] font-mono text-gray-500 mb-1">{field}</p>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="bg-red-50 border border-red-100 rounded px-2 py-1.5">
        <span className="text-[10px] uppercase text-red-400 block mb-0.5">before</span>
        {renderValue(before)}
      </div>
      <div className="bg-green-50 border border-green-100 rounded px-2 py-1.5">
        <span className="text-[10px] uppercase text-green-500 block mb-0.5">after</span>
        {renderValue(after)}
      </div>
    </div>
  </div>
);

const DetailDrawer = ({ id, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return undefined;

    setLoading(true);
    fetch(route('backend.audit-logs.show', id), {
      headers: { Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return null;

  const log = data?.log;
  const changes = data?.changes ?? [];
  const rows = Object.entries(log?.new_values ?? {}).filter(
    ([key]) => !changes.some(([changeKey]) => changeKey === key)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Audit entry #{id}</h2>
            <p className="text-xs text-gray-500">
              {log ? new Date(log.created_at.replace(' ', 'T')).toLocaleString() : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-900">
            Close
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading && <p className="text-sm text-gray-400">Loading…</p>}

          {log && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Event">
                  <EventBadge event={log.event} />
                </Field>
                <Field label="Actor">{log.user_name ?? log.user_email ?? 'System'}</Field>
                <Field label="Route">
                  <code className="text-xs">{log.route_name ?? '—'}</code>
                </Field>
                <Field label="Status">{log.status_code ?? '—'}</Field>
                <Field label="Method">{log.method}</Field>
                <Field label="IP">{log.ip_address ?? '—'}</Field>
                {log.user_agent && (
                  <div className="col-span-2">
                    <Field label="User agent">
                      <span className="text-xs text-gray-600 break-all">{log.user_agent}</span>
                    </Field>
                  </div>
                )}
                {log.subject_type && (
                  <Field label="Subject">
                    {log.subject_type.split('\\').pop()} #{log.subject_id}
                  </Field>
                )}
              </div>

              <Field label="Description">
                <p className="text-sm text-gray-800">{log.description}</p>
              </Field>

              {changes.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">
                    Changes ({changes.length})
                  </p>
                  {changes.map(([field, pair]) => (
                    <DiffRow key={field} field={field} before={pair.old} after={pair.new} />
                  ))}
                </div>
              )}

              {rows.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">
                    Request data
                  </p>
                  {rows.map(([field, value]) => (
                    <div key={field} className="py-1.5 border-b border-gray-100 last:border-0 text-xs">
                      <span className="font-mono text-gray-500 mr-2">{field}</span>
                      {renderValue(value)}
                    </div>
                  ))}
                </div>
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

// ============================================
//  PAGE
// ============================================

const AuditLogsIndex = ({ logs, filters, events, actors, can, retentionDays }) => {
  const { flash } = usePage().props;
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(filters);

  const apply = useCallback(
    (next) => {
      setForm(next);
      router.get(route('backend.audit-logs.index'), next, { preserveScroll: true, replace: true });
    },
    []
  );

  useEffect(() => {
    if (flash?.success) Swal.fire({ icon: 'success', title: flash.success, timer: 3000, showConfirmButton: false });
    if (flash?.error) Swal.fire({ icon: 'error', title: flash.error, timer: 5000 });
  }, [flash]);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v && v !== 'all'));
    const query = params.toString();
    return route('backend.audit-logs.export') + (query ? `?${query}` : '');
  }, [filters]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    apply(form);
  };
  const reset = () => {
    const cleared = { event: 'all', user: '', from: '', to: '', search: '' };
    setForm(cleared);
    apply(cleared);
  };

  return (
    <AdminLayout>
      <Head title="Audit Trail | DUS Admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiShield className="w-6 h-6 text-blue-600" />
              Audit Trail
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Every recorded change, with before/after values. Entries are kept for {retentionDays} days.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {can?.export && (
              <a
                href={exportUrl}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
              >
                <FiDownload className="w-4 h-4" />
                Export CSV
              </a>
            )}
            {can?.prune && (
              <span
                title={`Scheduled daily · retention ${retentionDays} days`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm"
              >
                <FiTrash2 className="w-4 h-4" />
                Auto-pruned
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Event</label>
              <select value={form.event} onChange={set('event')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All events</option>
                {Object.entries(events).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Actor</label>
              <select value={form.user} onChange={set('user')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Anyone</option>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>{actor.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">From</label>
              <input type="date" value={form.from} onChange={set('from')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">To</label>
              <input type="date" value={form.to} onChange={set('to')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={form.search}
                  onChange={set('search')}
                  placeholder="description, route, email…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              <FiFilter className="w-4 h-4" />
              Apply
            </button>
            <button type="button" onClick={reset} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
              <FiRefreshCw className="w-4 h-4" />
              Reset
            </button>
            <span className="ml-auto text-xs text-gray-400">{logs.total} entries</span>
          </div>
        </form>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {logs.data.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <FiShield className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm">No audit entries match these filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Route</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.data.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at.replace(' ', 'T')).toLocaleString()}
                      </td>
                      <td className="px-4 py-3"><EventBadge event={log.event} /></td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800">{log.user_name ?? 'System'}</p>
                        <p className="text-[11px] text-gray-400">{log.user_email ?? log.ip_address}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{log.description}</td>
                      <td className="px-4 py-3">
                        <code className="text-[11px] text-gray-500">{log.route_name ?? '—'}</code>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setOpenId(log.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          title="View details"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {logs.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Page {logs.current_page} of {logs.last_page}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={`${route('backend.audit-logs.index')}?${new URLSearchParams({ ...filters, page: logs.current_page - 1 })}`}
                  preserveScroll
                  className={`p-2 rounded-lg border border-gray-200 ${logs.current_page <= 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'}`}
                >
                  <FiChevronLeft className="w-4 h-4" />
                </Link>
                <Link
                  href={`${route('backend.audit-logs.index')}?${new URLSearchParams({ ...filters, page: logs.current_page + 1 })}`}
                  preserveScroll
                  className={`p-2 rounded-lg border border-gray-200 ${logs.current_page >= logs.last_page ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'}`}
                >
                  <FiChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <DetailDrawer id={openId} onClose={() => setOpenId(null)} />
    </AdminLayout>
  );
};

export default AuditLogsIndex;
