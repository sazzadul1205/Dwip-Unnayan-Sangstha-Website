// resources/js/pages/Backend/Assets/Index.jsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
  FiGrid,
  FiList,
  FiSearch,
  FiTrash2,
  FiRefreshCw,
  FiExternalLink,
  FiFolder,
  FiFile,
  FiFileText,
  FiArchive,
  FiMusic,
  FiVideo,
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
  FiChevronRight,
  FiInfo,
  FiCopy,
} from 'react-icons/fi';
import { FaFilePdf, FaFileImage } from 'react-icons/fa';
import Swal from 'sweetalert2';
import AdminLayout from '../../../layouts/AdminLayout';

const CATEGORY_META = {
  image: { label: 'Images', icon: FaFileImage, tint: 'bg-emerald-50 text-emerald-600' },
  document: { label: 'Documents', icon: FaFilePdf, tint: 'bg-rose-50 text-rose-600' },
  video: { label: 'Video', icon: FiVideo, tint: 'bg-violet-50 text-violet-600' },
  audio: { label: 'Audio', icon: FiMusic, tint: 'bg-amber-50 text-amber-600' },
  archive: { label: 'Archives', icon: FiArchive, tint: 'bg-orange-50 text-orange-600' },
  other: { label: 'Other', icon: FiFile, tint: 'bg-gray-100 text-gray-500' },
};

/**
 * Page numbers for the pager: first, last, and a short run around the current
 * page, with null marking an elision. Keeps the row a fixed width at any count.
 */
const pageNumbers = ({ current_page: current, last_page: last }) => {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set([1, last, current]);

  for (let offset = 1; offset <= 2; offset += 1) {
    if (current - offset > 1) pages.add(current - offset);
    if (current + offset < last) pages.add(current + offset);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const withGaps = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) withGaps.push(null);
    withGaps.push(page);
  });

  return withGaps;
};

// Labels only: ordering is done server-side now, and these keys are the ones
// the AssetLibrary::paginate() validator accepts.
const SORTS = {
  newest: { label: 'Newest first' },
  oldest: { label: 'Oldest first' },
  name: { label: 'Name (A–Z)' },
  size: { label: 'Smallest first' },
  size_desc: { label: 'Largest first' },
};

const Thumbnail = ({ asset }) => {
  const meta = CATEGORY_META[asset.category] || CATEGORY_META.other;
  const Icon = meta.icon;

  if (asset.category === 'image') {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px]">
        <img
          src={asset.url}
          alt={asset.name}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full items-center justify-center ${meta.tint}`}>
      <Icon className="h-8 w-8" />
    </div>
  );
};

const Assets = ({
  assets = [],
  folders = [],
  summary = {},
  filters = {},
  pagination = {},
  truncated = false,
  contentReliable = true,
  scanGaps = [],
  can = {},
}) => {
  const { flash } = usePage().props;

  const [view, setView] = useState('grid');
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Folder, category, usage, sort and the page number are all server state now.
  // Filtering 3,679 content rows and walking the disk on every keystroke is
  // what made this screen slow; the server does it once per visit and pages it.
  const { folder, category, usage, sort } = filters;
  const unusedOnly = usage === 'unused';
  const visible = assets;

  const applyFilters = useCallback(
    (patch, { resetPage = true } = {}) => {
      router.get(
        route('backend.assets.index'),
        {
          folder,
          category,
          usage,
          sort,
          ...(resetPage ? {} : { page: pagination.current_page }),
          ...patch,
        },
        { preserveState: true, preserveScroll: true, replace: true }
      );
    },
    [folder, category, usage, sort, pagination.current_page]
  );

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    if (searchInput === (filters.search || '')) return undefined;

    const timer = setTimeout(() => {
      applyFilters({ search: searchInput });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, applyFilters]);

  useEffect(() => {
    if (flash?.success) {
      Swal.fire({ icon: 'success', title: flash.success, timer: 3000, showConfirmButton: false });
    }
    if (flash?.error) {
      Swal.fire({ icon: 'error', title: flash.error, timer: 6000 });
    }
  }, [flash]);

  // -----------------------------------------------------------------
  //  Navigation between folders
  // -----------------------------------------------------------------

  // Child folders of whatever is currently open, the way Explorer shows them.
  const childFolders = useMemo(() => {
    if (folder === 'all') return [];
    return folders.filter((f) => f.parent === folder);
  }, [folder, folders]);

  const breadcrumbs = useMemo(() => {
    if (folder === 'all') return [{ key: 'all', label: 'All assets' }];
    const parts = folder.split('/');
    return parts.map((label, index) => ({
      key: parts.slice(0, index + 1).join('/'),
      label,
    }));
  }, [folder]);

  const stats = useMemo(() => {
    const bytes = visible.reduce((total, asset) => total + asset.size, 0);
    // "unused" is only trustworthy when the scan could search everywhere, so
    // unknown files are counted apart from unused ones.
    const unused = visible.filter((asset) => asset.usage_state === 'unused').length;
    const unknown = visible.filter((asset) => asset.usage_state === 'unknown').length;
    return { count: visible.length, bytes, unused, unknown };
  }, [visible]);

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    const ids = visible.map((asset) => asset.id);
    setSelected((prev) => (ids.every((id) => prev.includes(id)) ? [] : ids));
  }, [visible]);

  // -----------------------------------------------------------------
  //  Detail drawer
  // -----------------------------------------------------------------
  const openDetail = useCallback(async (asset) => {
    setDetailLoading(true);
    setDetail(asset);

    try {
      const response = await fetch(route('backend.assets.show', asset.id), {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setDetail(data.asset);
      }
    } catch {
      // The inline metadata already rendered; the drawer stays usable.
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // -----------------------------------------------------------------
  //  Deleting
  // -----------------------------------------------------------------
  const confirmDelete = useCallback(
    async (ids, force = false) => {
      if (ids.length === 0) return;

      const referenced = ids.filter(
        (id) => assets.find((asset) => asset.id === id)?.usage_state === 'referenced'
      );

      // Unknown means the scan could not search everywhere, so these are not
      // safe to delete and the server will refuse them regardless of force.
      const unknown = ids.filter(
        (id) => assets.find((asset) => asset.id === id)?.usage_state === 'unknown'
      );

      const blocked = unknown.length > 0;

      const result = await Swal.fire({
        icon: force ? 'warning' : 'error',
        title: force
          ? `Force delete ${ids.length} file${ids.length === 1 ? '' : 's'}?`
          : `Delete ${ids.length} file${ids.length === 1 ? '' : 's'}?`,
        html: `
          ${
            blocked
              ? `<p style="margin-bottom:8px"><strong>${unknown.length}</strong> of these could not be checked for use, because the reference scan was incomplete. They will not be deleted.</p>`
              : ''
          }
          ${
            referenced.length > 0 && !force
              ? `<p style="margin-bottom:8px"><strong>${referenced.length}</strong> of these are still referenced by the project.</p>`
              : ''
          }<p style="color:#6b7280">Files are removed from disk permanently. This cannot be undone.</p>`,
        showCancelButton: true,
        confirmButtonText: blocked ? 'Delete the checked ones' : force ? 'Force delete' : 'Delete',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
      });

      if (!result.isConfirmed) return;

      setBusy(true);

      try {
        await router.post(
          route('backend.assets.destroy'),
          { assets: ids, force },
          {
            preserveScroll: true,
            onFinish: () => {
              setBusy(false);
              setSelected([]);
              setDetail(null);
            },
          }
        );
      } catch {
        setBusy(false);
      }
    },
    [assets]
  );

  const copyUrl = useCallback(async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      Swal.fire({ icon: 'success', title: 'URL copied', timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Could not copy', timer: 2000 });
    }
  }, []);

  const unusedSelected = selected.filter(
    (id) => assets.find((a) => a.id === id)?.usage_state === 'unused'
  );

  // -----------------------------------------------------------------
  //  Render
  // -----------------------------------------------------------------
  const categoryTabs = useMemo(() => {
    const counts = summary.categories || {};
    return [
      { key: 'all', label: 'All', count: summary.total || 0 },
      ...Object.entries(CATEGORY_META)
        .map(([key, meta]) => ({ key, label: meta.label, count: counts[key] || 0 }))
        .filter((tab) => tab.count > 0),
    ];
  }, [summary]);

  return (
    <AdminLayout title="Assets">
      <Head title="Assets" />

      <div className="space-y-4">
        {/* ===== HEADER ===== */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Images &amp; Assets</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Everything stored under <code className="rounded bg-gray-100 px-1">storage/app/public</code> and{' '}
              <code className="rounded bg-gray-100 px-1">public/images</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.post(route('backend.assets.refresh'), {}, { preserveScroll: true })}
              disabled={busy}
              title="Re-read the folders from disk"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <FiRefreshCw size={13} className={busy ? 'animate-spin' : ''} />
              Refresh
            </button>

            <div className="flex overflow-hidden rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={() => setView('grid')}
                title="Icon view"
                className={`px-2.5 py-2 ${view === 'grid' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <FiGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                title="Details view"
                className={`px-2.5 py-2 ${view === 'list' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <FiList size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* ===== SUMMARY CARDS ===== */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Total files', value: summary.total || 0, sub: summary.size_label, tint: 'text-gray-800' },
            { label: 'Still referenced', value: summary.referenced || 0, sub: 'found in project files', tint: 'text-emerald-600' },
            { label: 'Not referenced', value: summary.unused || 0, sub: summary.unused_size_label, tint: 'text-amber-600' },
            ...(summary.unknown > 0
              ? [
                  {
                    label: 'Unknown use',
                    value: summary.unknown,
                    sub: 'scan could not check',
                    tint: 'text-red-600',
                  },
                ]
              : []),
            { label: 'Folders', value: folders.length, sub: 'across all roots', tint: 'text-blue-600' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold ${card.tint}`}>{card.value}</p>
              <p className="text-[11px] text-gray-400">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ===== EXPLAINER ===== */}
{contentReliable ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
            <FiAlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>&ldquo;Not referenced&rdquo; means nothing in the project mentions this file name</strong> — checked
              against the source files and against every stored CMS value, including names nested inside JSON.
              Still check the page before deleting anything important.
            </span>
          </div>
        ) : (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-800">
            <p className="font-semibold">
              The reference scan was incomplete, so &ldquo;unused&rdquo; here does not mean unused.
            </p>
            <ul className="mt-1 list-disc pl-4">
              {(scanGaps.length > 0
                ? scanGaps
                : ['Stored content could not be searched.']
              ).map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
            <p className="mt-1">
              Files in this state are marked <strong>unknown</strong> and will not be deleted, even with force. Fix
              the cause and reload.
            </p>
          </div>
        )}

        {truncated && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            The scan hit the configured file limit, so this list is incomplete. Raise{' '}
            <code className="rounded bg-white px-1">asset-library.max_files</code> to see everything.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* ===== FOLDER SIDEBAR ===== */}
          <aside className="lg:col-span-1">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <p className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">Folders</p>

              <button
                type="button"
                onClick={() => applyFilters({ folder: 'all' })}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
                  folder === 'all' ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {folder === 'all' ? <FiFolder className="text-blue-500" /> : <FiFolder className="text-gray-400" />}
                All assets
                <span className="ml-auto text-[10px] text-gray-400">{summary.total || 0}</span>
              </button>

              <div className="max-h-[420px] overflow-y-auto py-1">
                {folders.map((item) => {
                  const active = folder === item.key;
                  const isRoot = !item.parent;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => applyFilters({ folder: item.key })}
                      style={isRoot ? undefined : { paddingLeft: `${12 + (item.parent ? 16 : 0)}px` }}
                      className={`flex w-full items-center gap-2 py-1.5 pr-3 text-left text-xs transition ${
                        active ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {active ? (
                        <FiFolder size={13} className="shrink-0 text-blue-500" />
                      ) : (
                        <FiFolder size={13} className="shrink-0 text-gray-400" />
                      )}
                      <span className="truncate">{item.name}</span>
                      {item.unused > 0 && (
                        <span className="rounded-full bg-amber-100 px-1.5 text-[9px] font-semibold text-amber-700">
                          {item.unused}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-gray-400">{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ===== FILE AREA ===== */}
          <section className="space-y-3 lg:col-span-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <div className="flex items-center gap-1 text-xs">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.key}>
                    {index > 0 && <FiChevronRight size={11} className="text-gray-300" />}
                    <button
                      type="button"
                      onClick={() => applyFilters({ folder: crumb.key })}
                      className={`rounded px-1 py-0.5 transition hover:bg-gray-100 ${
                        index === breadcrumbs.length - 1 ? 'font-semibold text-gray-800' : 'text-gray-500'
                      }`}
                    >
                      {crumb.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <div className="relative ml-auto min-w-[180px] flex-1 sm:flex-none">
                <FiSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search file names…"
                  className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-2 text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={sort}
                onChange={(e) => applyFilters({ sort: e.target.value })}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
              >
                {Object.entries(SORTS).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => applyFilters({ usage: unusedOnly ? 'all' : 'unused' })}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  unusedOnly ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Show only files the project does not reference"
              >
                Unused only
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => applyFilters({ category: tab.key })}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    category === tab.key
                      ? 'bg-gray-800 font-semibold text-white'
                      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 opacity-60">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Bulk action bar */}
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs">
                <span className="font-semibold text-blue-800">
                  {selected.length} selected
                  {stats.unused > 0 && ` · ${unusedSelected.length} not referenced`}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <button type="button" onClick={() => setSelected([])} className="px-2 py-1 text-gray-600 hover:underline">
                    Clear
                  </button>

                  {can.delete && (
                    <>
                      {unusedSelected.length > 0 && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => confirmDelete(unusedSelected)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <FiTrash2 size={11} />
                          Delete {unusedSelected.length} unused
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => confirmDelete(selected)}
                        className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        <FiTrash2 size={11} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {childFolders.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {childFolders.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => applyFilters({ folder: item.key })}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:shadow-sm"
                  >
                    <FiFolder className="shrink-0 text-amber-400" size={22} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-gray-800">{item.name}</span>
                      <span className="block text-[10px] text-gray-400">
                        {item.count} files · {item.size_label}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Result count + select all */}
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>
                Showing {pagination.from}–{pagination.to} of {pagination.total} file
                {pagination.total === 1 ? '' : 's'}
                {stats.unused > 0 && (
                  <span className="ml-1 text-amber-600">({stats.unused} not referenced)</span>
                )}
              </span>

              {visible.length > 0 && (
                <button type="button" onClick={toggleSelectAll} className="font-medium text-blue-600 hover:underline">
                  {selected.length === visible.length ? 'Deselect all' : 'Select this page'}
                </button>
              )}
            </div>

            {/* Empty state */}
            {visible.length === 0 && childFolders.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                <FiFolder className="mx-auto text-3xl text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-600">
                  {summary.total === 0 ? 'No assets found' : 'Nothing matches these filters'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {summary.total === 0
                    ? 'Upload an image from any section editor and it will appear here.'
                    : 'Try clearing the search or switching category.'}
                </p>
              </div>
            )}

            {/* ===== GRID VIEW ===== */}
            {view === 'grid' && visible.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {visible.map((asset) => {
                  const isSelected = selected.includes(asset.id);

                  return (
                    <div
                      key={asset.id}
                      onClick={() => openDetail(asset)}
                      className={`group cursor-pointer overflow-hidden rounded-xl border bg-white transition hover:shadow-md ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="relative h-32">
                        <Thumbnail asset={asset} />

                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-2 top-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(asset.id)}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
                          />
                        </label>

                        {asset.usage_state === 'unused' && (
                          <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            unused
                          </span>
                        )}

                        {asset.usage_state === 'unknown' && (
                          <span className="absolute right-2 top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            unverified
                          </span>
                        )}

                        {asset.dimensions && (
                          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                            {asset.dimensions.width}×{asset.dimensions.height}
                          </span>
                        )}
                      </div>

                      <div className="border-t border-gray-100 px-2.5 py-2">
                        <p className="truncate text-[11px] font-medium text-gray-800" title={asset.name}>
                          {asset.name}
                        </p>
                        <p className="mt-0.5 flex items-center justify-between text-[10px] text-gray-400">
                          <span>{asset.size_label}</span>
                          {asset.usage_state === 'referenced' && (
                            <FiCheckCircle size={11} className="text-emerald-500" />
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===== LIST VIEW ===== */}
            {view === 'list' && visible.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="grid grid-cols-[28px_1fr_70px_90px_96px] gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <span />
                  <span>Name</span>
                  <span className="text-right">Size</span>
                  <span>Modified</span>
                  <span className="text-right">Status</span>
                </div>

                {visible.map((asset) => {
                  const meta = CATEGORY_META[asset.category] || CATEGORY_META.other;
                  const Icon = meta.icon;
                  const isSelected = selected.includes(asset.id);

                  return (
                    <div
                      key={asset.id}
                      onClick={() => openDetail(asset)}
                      className={`grid cursor-pointer grid-cols-[28px_1fr_70px_90px_96px] items-center gap-2 border-b border-gray-50 px-3 py-2 text-xs transition last:border-0 hover:bg-blue-50/40 ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelect(asset.id)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
                      />

                      <span className="flex min-w-0 items-center gap-2">
                        <Icon size={14} className="shrink-0 text-gray-400" />
                        <span className="truncate text-gray-800" title={asset.id}>
                          {asset.name}
                        </span>
                      </span>

                      <span className="text-right text-gray-500">{asset.size_label}</span>
                      <span className="text-gray-500">{asset.modified_label}</span>

                      <span className="text-right">
                        {asset.usage_state === 'referenced' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                            <FiCheckCircle size={11} />
                            used
                          </span>
                        ) : asset.usage_state === 'unknown' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                            unverified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            unused
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===== PAGINATION ===== */}
            {pagination.last_page > 1 && (
              <nav className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <button
                  type="button"
                  disabled={pagination.current_page <= 1}
                  onClick={() => applyFilters({ page: pagination.current_page - 1 }, { resetPage: false })}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Previous
                </button>

                {/* Windowed page numbers: first, last, and a run around the current page. */}
                <div className="flex items-center gap-1">
                  {pageNumbers(pagination).map((page, index) =>
                    page === null ? (
                      <span key={`gap-${index}`} className="px-1 text-xs text-gray-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => applyFilters({ page }, { resetPage: false })}
                        className={`h-7 min-w-7 rounded-lg px-2 text-xs font-medium transition ${
                          page === pagination.current_page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => applyFilters({ page: pagination.current_page + 1 }, { resetPage: false })}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next
                </button>
              </nav>
            )}
          </section>
        </div>
      </div>

      {/* ===== DETAIL DRAWER ===== */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />

          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Asset details</h2>
              <span className="flex items-center gap-2">
                {detailLoading && <FiRefreshCw size={12} className="animate-spin text-gray-400" />}
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100"
                >
                  <FiX size={15} />
                </button>
              </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {detail.category === 'image' ? (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px]">
                  <img src={detail.url} alt={detail.name} className="max-h-64 w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg bg-gray-50">
                  <FiFileText size={40} className="text-gray-300" />
                </div>
              )}

              <div>
                <p className="break-all text-sm font-semibold text-gray-800">{detail.name}</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-gray-400">{detail.id}</p>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border border-gray-200 p-3 text-xs">
                {[
                  ['Type', detail.category],
                  ['Size', detail.size_label],
                  ['Dimensions', detail.dimensions ? `${detail.dimensions.width} × ${detail.dimensions.height}` : '—'],
                  ['Modified', detail.modified_label],
                  ['Folder', detail.folder || detail.root],
                  [
                    'Status',
                    detail.usage_state === 'referenced'
                      ? 'Referenced'
                      : detail.usage_state === 'unknown'
                        ? 'Unknown — scan could not check'
                        : 'Not referenced',
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] uppercase tracking-wide text-gray-400">{label}</dt>
                    <dd className="mt-0.5 break-all capitalize text-gray-700">{value}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <FiInfo size={12} />
                  Public URL
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
                  <code className="min-w-0 flex-1 truncate text-[11px] text-gray-600">{detail.url}</code>
                  <button
                    type="button"
                    onClick={() => copyUrl(detail.url)}
                    title="Copy URL"
                    className="rounded p-1 text-gray-500 transition hover:bg-gray-200"
                  >
                    <FiCopy size={12} />
                  </button>
                  <a
                    href={detail.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open in a new tab"
                    className="rounded p-1 text-gray-500 transition hover:bg-gray-200"
                  >
                    <FiExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold text-gray-700">
                  Referenced in {detail.reference_count} place{detail.reference_count === 1 ? '' : 's'}
                </p>

                {detail.references && detail.references.length > 0 ? (
                  <ul className="space-y-1">
                    {detail.references.map((ref) => (
                      <li
                        key={ref.source}
                        className="flex items-start gap-1.5 rounded bg-gray-50 px-2 py-1 font-mono text-[11px] text-gray-600"
                      >
                        <span className="shrink-0 rounded bg-white px-1 text-[9px] uppercase text-gray-400">
                          {ref.source.startsWith('content:') ? 'db' : 'code'}
                        </span>
                        <span className="truncate">{ref.source}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
<p className="rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] leading-relaxed text-amber-800">
                  {detail.usage_state === 'unknown'
                    ? 'The reference scan was incomplete, so nothing can be said about this file. It is not safe to delete.'
                    : 'No source file or stored value mentions this name, including inside JSON. It is a candidate for removal.'}
                </p>
                )}
              </div>
            </div>

            {can.delete && detail.deletable && (
              <div className="border-t border-gray-200 p-4">
                {detail.usage_state === 'unknown' ? (
                  <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-800">
                    <p className="font-semibold">Deletion disabled — use could not be verified.</p>
                    <p className="mt-1">
                      The reference scan did not finish, so this file may well be in use. Reload once the scan
                      succeeds; deletion stays blocked until then.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirmDelete([detail.id], detail.usage_state === 'referenced')}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50 ${
                      detail.usage_state === 'referenced'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <FiTrash2 size={13} />
                    {detail.usage_state === 'referenced' ? 'Force delete anyway' : 'Delete this file'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Assets;