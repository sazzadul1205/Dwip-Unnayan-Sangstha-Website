// resources/js/pages/Backend/EmailTemplates/Index.jsx
//
// ============================================================
//  EMAIL TEMPLATE PICKER
// ============================================================
//
// Every transactional email this application can send is a Blade file
// living in resources/views/emails/. There is no database record and no
// CMS page involved — this screen simply lists the files, and the
// editor behind each card writes that file directly to disk.

import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../../layouts/AdminLayout';
import Swal from 'sweetalert2';
import {
  FiCode,
  FiEdit3,
  FiFileText,
  FiFolder,
  FiHardDrive,
  FiSearch,
  FiChevronRight,
} from 'react-icons/fi';
import { FaHistory } from 'react-icons/fa';

const GROUP_STYLES = {
  Newsletter: 'bg-sky-50 text-sky-700 border-sky-200',
  Applications: 'bg-violet-50 text-violet-700 border-violet-200',
  Account: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const groupStyle = (group) => GROUP_STYLES[group] ?? 'bg-gray-50 text-gray-700 border-gray-200';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const Stat = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 text-xs text-gray-500">
    <Icon className="w-3.5 h-3.5 text-gray-400" />
    <span>{label}</span>
    <span className="font-medium text-gray-700">{value}</span>
  </div>
);

const TemplateCard = ({ template, canUpdate }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col">
    <div className="p-5 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <FiFileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{template.label}</h3>
            <p className="text-[11px] font-mono text-gray-400 truncate">{template.file}</p>
          </div>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[11px] font-medium ${groupStyle(template.group)}`}>
          {template.group}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{template.description}</p>

      {template.variables.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-1.5">Merge variables</p>
          <div className="flex flex-wrap gap-1.5">
            {template.variables.map((variable) => (
              <code
                key={variable}
                className="px-1.5 py-0.5 rounded bg-gray-100 text-[11px] font-mono text-gray-700"
              >
                {`{{ $${variable} }}`}
              </code>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
        <Stat icon={FiHardDrive} label="Size" value={formatBytes(template.size)} />
        <Stat icon={FiCode} label="Lines" value={template.lines} />
        <Stat icon={FaHistory} label="Revisions" value={template.revisions} />
      </div>
    </div>

    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
      <span className="text-[11px] text-gray-400">
        {template.updated_at ? `Updated ${new Date(template.updated_at.replace(' ', 'T')).toLocaleString()}` : 'Never saved'}
      </span>
      <Link
        href={route(`backend.email-templates.edit`, template.slug)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          canUpdate
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <FiEdit3 className="w-4 h-4" />
        {canUpdate ? 'Edit' : 'View'}
      </Link>
    </div>
  </div>
);

const EmailTemplatesIndex = ({ templates, viewPath, backupPath, can }) => {
  const { flash } = usePage().props;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return templates;
    return templates.filter((t) =>
      [t.label, t.slug, t.description, t.group, ...t.variables]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [templates, query]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, template) => {
      (acc[template.group] ||= []).push(template);
      return acc;
    }, {});
  }, [filtered]);

  React.useEffect(() => {
    if (flash?.success) {
      Swal.fire({ icon: 'success', title: flash.success, timer: 3500, showConfirmButton: false });
    }
    if (flash?.error) {
      Swal.fire({ icon: 'error', title: flash.error, timer: 5000 });
    }
  }, [flash]);

  return (
    <AdminLayout>
      <Head title="Email Templates | DUS Admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-sm text-gray-500 mt-1">
              Edit the raw HTML and CSS of every email the site sends.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates or variables…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* How it works */}
        <div className="mb-8 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
          <p className="font-semibold mb-1">No database — these are files.</p>
          <p className="leading-relaxed">
            Saving writes the Blade file in <code className="font-mono">{viewPath}</code> and drops the
            compiled view cache, so the change is live immediately. Every save snapshots the previous
            version under <code className="font-mono">{backupPath}</code> and you can restore any of them
            from the editor.
          </p>
        </div>

        {/* Groups */}
        {Object.keys(grouped).length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FiSearch className="w-10 h-10 mx-auto mb-3" />
            <p className="text-sm">No template matches “{query}”.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <section key={group} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FiFolder className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{group}</h2>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {items.map((template) => (
                  <TemplateCard key={template.slug} template={template} canUpdate={can?.update} />
                ))}
              </div>
            </section>
          ))
        )}

        <Link
          href={route('backend.newsletter.campaigns.index')}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
        >
          Campaign bodies live in the campaign builder
          <FiChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </AdminLayout>
  );
};

export default EmailTemplatesIndex;
