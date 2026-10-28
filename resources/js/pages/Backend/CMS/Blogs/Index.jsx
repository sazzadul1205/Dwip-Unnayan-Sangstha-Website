import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaUndo, FaSpinner,
  FaStar, FaRegStar, FaSearch, FaTimes,
  FaRegFileAlt, FaRegTrashAlt, FaRegCheckCircle,
  FaRegListAlt, FaEye, FaEyeSlash,
} from 'react-icons/fa';
import { MdDeleteForever, MdOutlineInbox } from 'react-icons/md';
import Swal from 'sweetalert2';

import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import { Can } from '../../../../components/Auth/Can';

// ─── Stat card ──────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, tone }) => {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50/60 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    red: 'border-red-200 bg-red-50/60 text-red-700',
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-80">
        <Icon size={11} /> {label}
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
};

// ─── Status pill ────────────────────────────────────────────────
const StatusPill = ({ active, onClick, busy }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 transition ${busy
        ? 'cursor-wait opacity-60'
        : active
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
          : 'bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200'
      }`}
  >
    {busy ? (
      <FaSpinner className="animate-spin" size={10} />
    ) : active ? (
      <FaEye size={10} />
    ) : (
      <FaEyeSlash size={10} />
    )}
    {active ? 'Active' : 'Inactive'}
  </button>
);

// ─── Featured toggle ────────────────────────────────────────────
const FeaturedToggle = ({ featured, onClick, busy }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className={`rounded-md p-1.5 transition ${busy
        ? 'cursor-wait opacity-60'
        : featured
          ? 'text-amber-500 hover:bg-amber-50'
          : 'text-slate-300 hover:bg-slate-100 hover:text-amber-400'
      }`}
    title={featured ? 'Unmark featured' : 'Mark featured'}
  >
    {busy ? (
      <FaSpinner className="animate-spin" size={13} />
    ) : featured ? (
      <FaStar size={16} />
    ) : (
      <FaRegStar size={16} />
    )}
  </button>
);

// ─── Main page ──────────────────────────────────────────────────
export default function Index({ items }) {
  const { flash } = usePage().props;
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toggling, setToggling] = useState(null);
  const [featureToggling, setFeatureToggling] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (flash?.success) {
      Swal.fire({
        icon: 'success', title: 'Success', text: flash.success,
        timer: 2500, showConfirmButton: false, toast: true, position: 'top-end',
      });
    }
    if (flash?.error) {
      Swal.fire({
        icon: 'error', title: 'Error', text: flash.error,
        confirmButtonColor: '#3b82f6',
      });
    }
  }, [flash]);

  const filtered = items
    .filter((b) => (showDeleted ? b.deleted_at !== null : b.deleted_at === null))
    .filter((b) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });

  const active = items.filter((b) => b.is_active && !b.deleted_at).length;
  const featured = items.filter((b) => b.is_featured && !b.deleted_at).length;
  const trash = items.filter((b) => b.deleted_at !== null).length;

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Blog Posts" />

      <div className="p-4 md:p-6">
        {/* ─── Header ─────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Blog Posts
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Manage, publish, and organize your content
            </p>
          </div>
          <Can permission="blogs.create">
            <button
              type="button"
              onClick={() => router.visit(route('backend.cms.blogs.create'))}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:self-auto"
            >
              <FaPlus size={12} /> New Blog Post
            </button>
          </Can>
        </div>

        {/* ─── Stats ──────────────────────────────── */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Active" value={active} icon={FaRegCheckCircle} tone="emerald" />
          <StatCard label="Featured" value={`${featured}/1`} icon={FaStar} tone="amber" />
          <StatCard label="Total" value={items.length} icon={FaRegFileAlt} tone="slate" />
          <StatCard label="In Trash" value={trash} icon={FaRegTrashAlt} tone="red" />
        </div>

        {/* ─── Toolbar ────────────────────────────── */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <FaSearch
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={12}
            />
            <input
              type="text"
              placeholder="Search by title, author, or tag…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Clear search"
              >
                <FaTimes size={10} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDeleted(!showDeleted)}
            className={`inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-medium ring-1 transition sm:self-auto ${showDeleted
                ? 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100'
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
              }`}
          >
            {showDeleted ? <FaRegListAlt size={12} /> : <FaRegTrashAlt size={12} />}
            {showDeleted ? 'Back to Active' : 'View Trash'}
            {trash > 0 && (
              <span className="ml-0.5 rounded-full bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-700">
                {trash}
              </span>
            )}
          </button>
        </div>

        {/* ─── Table ──────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Post</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Featured</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <MdOutlineInbox size={26} />
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        {showDeleted ? 'Trash is empty' : 'No blog posts yet'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {searchTerm
                          ? `No results for "${searchTerm}"`
                          : showDeleted
                            ? 'Deleted posts will appear here'
                            : 'Create your first post to get started'}
                      </p>
                      {!showDeleted && !searchTerm && (
                        <Can permission="blogs.create">
                          <button
                            type="button"
                            onClick={() => router.visit(route('backend.cms.blogs.create'))}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            <FaPlus size={10} /> Create post
                          </button>
                        </Can>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isDeleted = item.deleted_at !== null;
                    const isActive = item.is_active;
                    // Left accent bar by status
                    const accent = isDeleted
                      ? 'before:bg-red-400'
                      : isActive
                        ? 'before:bg-emerald-400'
                        : 'before:bg-slate-300';

                    return (
                      <tr
                        key={item.id}
                        className={`group relative transition-colors before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] ${accent} ${isDeleted ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-slate-50/70'
                          }`}
                      >
                        {/* Post */}
                        <td className="w-full px-4 py-3.5 pl-5">
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 shrink-0 rounded-md p-1.5 ${isDeleted
                                  ? 'bg-slate-100 text-slate-400'
                                  : 'bg-blue-50 text-blue-600'
                                }`}
                            >
                              <FaRegFileAlt size={11} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`truncate text-sm font-medium ${isDeleted
                                    ? 'text-slate-400 line-through'
                                    : 'text-slate-900'
                                  }`}
                              >
                                {item.title}
                              </div>
                              <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                {item.excerpt || 'No excerpt provided'}
                              </div>
                              {item.tags?.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {item.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                  {item.tags.length > 3 && (
                                    <span className="self-center text-[10px] font-medium text-slate-400">
                                      +{item.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {isDeleted ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200">
                              <FaRegTrashAlt size={10} /> Deleted
                            </span>
                          ) : (
                            <Can permission="blogs.toggle_status">
                              <StatusPill
                                active={item.is_active}
                                busy={toggling === item.id}
                                onClick={() => {
                                  setToggling(item.id);
                                  router.post(
                                    route('backend.cms.blogs.toggle-status', { id: item.id }),
                                    {},
                                    {
                                      preserveScroll: true,
                                      onSuccess: () => setToggling(null),
                                      onError: () => setToggling(null),
                                    }
                                  );
                                }}
                              />
                            </Can>
                          )}
                        </td>

                        {/* Featured */}
                        <td className="px-4 py-3.5">
                          {isDeleted ? (
                            <span className="text-xs text-slate-300">—</span>
                          ) : (
                            <Can permission="blogs.toggle_featured">
                              <FeaturedToggle
                                featured={item.is_featured}
                                busy={featureToggling === item.id}
                                onClick={() => {
                                  setFeatureToggling(item.id);
                                  router.post(
                                    route('backend.cms.blogs.toggle-featured', { id: item.id }),
                                    {},
                                    {
                                      preserveScroll: true,
                                      onSuccess: () => setFeatureToggling(null),
                                      onError: () => setFeatureToggling(null),
                                    }
                                  );
                                }}
                              />
                            </Can>
                          )}
                        </td>

                        {/* Date */}
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                          {item.date || '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
                            {isDeleted ? (
                              <>
                                <Can permission="blogs.restore">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsRestoring(true);
                                      router.post(
                                        route('backend.cms.blogs.restore', { id: item.id }),
                                        {},
                                        {
                                          onSuccess: () => setIsRestoring(false),
                                          onError: () => setIsRestoring(false),
                                        }
                                      );
                                    }}
                                    disabled={isRestoring}
                                    className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                                    title="Restore"
                                  >
                                    <FaUndo size={13} />
                                  </button>
                                </Can>
                                <Can permission="blogs.force_delete">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      Swal.fire({
                                        title: 'Permanently delete?',
                                        text: `"${item.title}" will be gone forever.`,
                                        icon: 'error',
                                        showCancelButton: true,
                                        confirmButtonColor: '#dc2626',
                                        cancelButtonColor: '#6b7280',
                                        confirmButtonText: 'Yes, delete forever',
                                        cancelButtonText: 'Cancel',
                                      }).then((r) => {
                                        if (r.isConfirmed) {
                                          router.delete(
                                            route('backend.cms.blogs.force-delete', { id: item.id }),
                                            { preserveScroll: true }
                                          );
                                        }
                                      });
                                    }}
                                    className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50"
                                    title="Delete permanently"
                                  >
                                    <MdDeleteForever size={16} />
                                  </button>
                                </Can>
                              </>
                            ) : (
                              <>
                                <Can permission="blogs.update">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      router.visit(route('backend.cms.blogs.edit', { id: item.id }))
                                    }
                                    className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50"
                                    title="Edit"
                                  >
                                    <FaEdit size={13} />
                                  </button>
                                </Can>
                                <Can permission="blogs.destroy">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      Swal.fire({
                                        title: 'Move to trash?',
                                        text: `"${item.title}" can be restored later.`,
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#dc2626',
                                        cancelButtonColor: '#6b7280',
                                        confirmButtonText: 'Move to trash',
                                        cancelButtonText: 'Cancel',
                                      }).then((r) => {
                                        if (r.isConfirmed) {
                                          router.delete(
                                            route('backend.cms.blogs.destroy', { id: item.id }),
                                            { preserveScroll: true }
                                          );
                                        }
                                      });
                                    }}
                                    className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50"
                                    title="Move to trash"
                                  >
                                    <FaTrash size={12} />
                                  </button>
                                </Can>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer meta */}
        {filtered.length > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            Showing <span className="font-medium text-slate-600">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'post' : 'posts'}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        )}
      </div>
    </AuthenticatedLayout>
  );
}