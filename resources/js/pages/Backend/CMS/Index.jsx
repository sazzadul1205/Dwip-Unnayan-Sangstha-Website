// resources/js/pages/Backend/CMS/Index.jsx

import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

import {
  FaPlus, FaEdit, FaTrash, FaUndo, FaSpinner, FaLock, FaSync,
  FaExclamationCircle, FaSave, FaCalendarAlt, FaToggleOn, FaToggleOff,
  FaHashtag, FaCheckCircle, FaShieldAlt, FaSearch, FaTimes,
  FaRegListAlt,
} from 'react-icons/fa';
import { MdDeleteForever, MdOutlineInbox } from 'react-icons/md';
import { BsStack } from 'react-icons/bs';
import Swal from 'sweetalert2';

import {
  generateSlug, getPageIcon, getPageTypeLabel, isSubPage,
  getParentSlug, isProtectedPage, formatDate,
} from './utils/pageHelpers';

// ─── Design tokens ──────────────────────────────────────────────
const TONE = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  red: 'bg-red-50 text-red-600 ring-red-100',
  orange: 'bg-orange-50 text-orange-600 ring-orange-100',
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
  pink: 'bg-pink-50 text-pink-600 ring-pink-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400';
const inputIdle =
  'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60';
const inputError =
  'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100/60';

// ─── Reusable subcomponents ─────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, tone }) => (
  <div className={`rounded-lg border p-3 ${TONE[tone]}`}>
    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-80">
      <Icon size={10} /> {label}
    </div>
    <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
  </div>
);

const PageIcon = ({ slug }) => {
  const { Icon, tone } = getPageIcon(slug);
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${TONE[tone]}`}>
      <Icon size={13} />
    </div>
  );
};

const ErrorBanner = ({ errors }) =>
  errors && Object.keys(errors).length > 0 ? (
    <div className="rounded-lg border-l-4 border-red-400 bg-red-50 px-4 py-3">
      <div className="flex items-start gap-2">
        <FaExclamationCircle className="mt-0.5 shrink-0 text-red-500" size={14} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-800">
            Please fix the following before saving
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-red-700">
            {Object.values(errors).flat().map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  ) : null;

// ─── Main page ──────────────────────────────────────────────────
export default function Index({ items, protectedPages = [] }) {
  const { flash } = usePage().props;

  const [formData, setFormData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [validationErrors, setValidationErrors] = useState({});

  // ─── Fields ───
  const getFields = () => ({
    slug: '', name: '', title: '', description: '', is_active: true,
  });

  const handleNameChange = (e) => {
    const name = e.target.value;
    const autoSlug = generateSlug(name);
    const currentSlug = formData.slug || '';
    const shouldAutoUpdate = !editingItem
      || (editingItem && currentSlug === generateSlug(editingItem.name || ''));
    setFormData({ ...formData, name, slug: shouldAutoUpdate ? autoSlug : currentSlug });
    if (validationErrors.name) setValidationErrors({ ...validationErrors, name: null });
  };

  const handleSlugChange = (e) => {
    setFormData({ ...formData, slug: e.target.value });
    if (validationErrors.slug) setValidationErrors({ ...validationErrors, slug: null });
  };

  const regenerateSlug = () => {
    if (formData.name) {
      setFormData({ ...formData, slug: generateSlug(formData.name) });
      if (validationErrors.slug) setValidationErrors({ ...validationErrors, slug: null });
    }
  };

  // ─── Validate ───
  const validateForm = () => {
    const errors = {};
    if (!formData.name || formData.name.trim().length < 3) errors.name = 'Name must be at least 3 characters long.';
    if (formData.name && formData.name.length > 255) errors.name = 'Name cannot exceed 255 characters.';
    if (!formData.slug || formData.slug.trim().length < 3) errors.slug = 'Slug must be at least 3 characters long.';
    if (formData.slug && formData.slug.length > 255) errors.slug = 'Slug cannot exceed 255 characters.';
    if (formData.title && formData.title.length > 255) errors.title = 'Title cannot exceed 255 characters.';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Modal ───
  const openModal = (item = null) => {
    setValidationErrors({});
    setEditingItem(item);
    setFormData(item ? { ...item } : getFields());
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setValidationErrors({});
  };

  // ─── CRUD ───
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Swal.fire({
        icon: 'warning', title: 'Please fix the errors',
        text: 'Some fields need your attention.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    setLoading(true);
    const data = { ...formData };
    if (!data.slug || data.slug.trim() === '') delete data.slug;
    data.is_active = !!data.is_active;

    const url = editingItem
      ? route('backend.cms.pages.update', editingItem.id)
      : route('backend.cms.pages.store');
    const method = editingItem ? 'put' : 'post';

    router[method](url, data, {
      preserveScroll: true,
      onSuccess: () => {
        closeModal();
        setLoading(false);
        router.reload({ preserveScroll: true });
        Swal.fire({
          icon: 'success',
          title: editingItem ? 'Page updated' : 'Page created',
          text: editingItem ? 'Your page has been updated.' : 'Your page has been created.',
          timer: 2000, showConfirmButton: false,
          toast: true, position: 'top-end',
        });
      },
      onError: (errors) => {
        setLoading(false);
        if (errors) {
          const message = Object.values(errors).flat().join('\n');
          Swal.fire({
            icon: 'error', title: 'Something went wrong',
            text: message || 'Please check your input.',
            confirmButtonColor: '#3b82f6',
          });
          setValidationErrors(errors);
        }
      },
    });
  };

  const toggleStatus = (item) => {
    if (isProtectedPage(item, protectedPages)) {
      Swal.fire({
        icon: 'info', title: 'Protected page',
        text: 'This page is system-protected and cannot be deactivated.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    setToggling(item.id);
    router.post(route('backend.cms.pages.toggle-status', item.id), {}, {
      preserveScroll: true,
      onSuccess: () => { setToggling(null); router.reload({ preserveScroll: true }); },
      onError: () => {
        setToggling(null);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to change status.', confirmButtonColor: '#3b82f6' });
      },
    });
  };

  const confirmDelete = (item) => {
    if (isProtectedPage(item, protectedPages)) {
      Swal.fire({
        icon: 'info', title: 'Protected page',
        text: 'This page is system-protected and cannot be deleted.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    Swal.fire({
      title: 'Move to trash?',
      html: `<p class="text-sm text-slate-600">Move "<strong>${item.name || item.slug}</strong>" to trash? You can restore it later.</p>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b',
      confirmButtonText: 'Move to trash', cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'text-lg font-semibold text-slate-900',
        htmlContainer: 'text-sm text-slate-600',
      },
    }).then((r) => {
      if (r.isConfirmed) {
        router.delete(route('backend.cms.pages.destroy', item.id), {
          preserveScroll: true,
          onError: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete page.', confirmButtonColor: '#3b82f6' }),
        });
      }
    });
  };

  const confirmForceDelete = (item) => {
    Swal.fire({
      title: 'Permanently delete?',
      html: `<p class="text-sm text-slate-600">Permanently delete "<strong>${item.name || item.slug}</strong>"? This cannot be undone.</p>`,
      icon: 'error', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete forever', cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'text-lg font-semibold text-slate-900',
        htmlContainer: 'text-sm text-slate-600',
      },
    }).then((r) => {
      if (r.isConfirmed) {
        router.delete(route('backend.cms.pages.force-delete', item.id), {
          preserveScroll: true,
          onError: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete page.', confirmButtonColor: '#3b82f6' }),
        });
      }
    });
  };

  const confirmRestore = (item) => {
    Swal.fire({
      title: 'Restore page?',
      html: `<p class="text-sm text-slate-600">Restore "<strong>${item.name || item.slug}</strong>" from the trash?</p>`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#10b981', cancelButtonColor: '#64748b',
      confirmButtonText: 'Restore', cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'text-lg font-semibold text-slate-900',
        htmlContainer: 'text-sm text-slate-600',
      },
    }).then((r) => {
      if (r.isConfirmed) {
        setIsRestoring(true);
        router.post(route('backend.cms.pages.restore', item.id), {}, {
          preserveScroll: true,
          onSuccess: () => { setIsRestoring(false); router.reload({ preserveScroll: true }); },
          onError: () => {
            setIsRestoring(false);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to restore page.', confirmButtonColor: '#3b82f6' });
          },
        });
      }
    });
  };

  // ─── Sorted + filtered ───
  const getSortedItems = () => {
    const parents = items.filter((i) => !isSubPage(i.slug));
    const subs = items.filter((i) => isSubPage(i.slug));
    const subMap = {};
    subs.forEach((s) => {
      const p = getParentSlug(s.slug);
      if (!subMap[p]) subMap[p] = [];
      subMap[p].push(s);
    });
    const out = [];
    parents.forEach((p) => {
      out.push(p);
      const children = (subMap[p.slug] || []).sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      );
      out.push(...children);
    });
    const orphans = subs.filter((s) => !items.some((i) => i.slug === getParentSlug(s.slug)));
    out.push(...orphans);
    return out;
  };

  const getFilteredItems = () => {
    let out = getSortedItems();
    out = showDeleted
      ? out.filter((i) => i.deleted_at !== null)
      : out.filter((i) => i.deleted_at === null);
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase().trim();
      out = out.filter((i) =>
        (i.name && i.name.toLowerCase().includes(t)) ||
        (i.slug && i.slug.toLowerCase().includes(t)) ||
        (i.title && i.title.toLowerCase().includes(t))
      );
    }
    if (filterStatus === 'active') out = out.filter((i) => i.is_active === true);
    if (filterStatus === 'inactive') out = out.filter((i) => i.is_active === false);
    return out;
  };

  // ─── Flash ───
  useEffect(() => {
    if (flash?.success) {
      Swal.fire({ icon: 'success', title: 'Success', text: flash.success, timer: 3000, showConfirmButton: false, toast: true, position: 'top-end' });
    }
    if (flash?.error) {
      Swal.fire({ icon: 'error', title: 'Error', text: flash.error, confirmButtonColor: '#3b82f6' });
    }
  }, [flash]);

  const filteredItems = getFilteredItems();
  const activeCount = items.filter((p) => p.is_active && !p.deleted_at).length;
  const deletedCount = items.filter((p) => p.deleted_at !== null).length;
  const protectedCount = items.filter((p) => isProtectedPage(p, protectedPages) && !p.deleted_at).length;

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Pages" />

      <div className="p-4 md:p-6">
        {/* ── Header ─────────────────────────────── */}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Pages
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage every page on your website from one place
            </p>
          </div>
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:self-auto"
          >
            <FaPlus size={12} /> Create Page
          </button>
        </div>

        {/* ── Stats ──────────────────────────────── */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={items.length} icon={FaHashtag} tone="slate" />
          <StatCard label="Active" value={activeCount} icon={FaCheckCircle} tone="emerald" />
          <StatCard label="Protected" value={protectedCount} icon={FaShieldAlt} tone="amber" />
          <StatCard label="In Trash" value={deletedCount} icon={FaTrash} tone="red" />
        </div>

        {/* ── Toolbar ────────────────────────────── */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                type="text"
                placeholder="Search pages…"
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

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 sm:w-40"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowDeleted(!showDeleted);
              setSearchTerm('');
              setFilterStatus('all');
            }}
            className={`inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-medium ring-1 transition sm:self-auto ${showDeleted
                ? 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100'
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
              }`}
          >
            {showDeleted ? <FaRegListAlt size={12} /> : <FaTrash size={12} />}
            {showDeleted ? 'Back to active' : 'View trash'}
            {deletedCount > 0 && (
              <span className="ml-0.5 rounded-full bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-700">
                {deletedCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Table ──────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Page</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Slug</th>
                  <th className="hidden px-4 py-3 text-left lg:table-cell">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <MdOutlineInbox size={26} />
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        {showDeleted ? 'Trash is empty' : 'No pages found'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {showDeleted
                          ? 'Deleted pages will appear here'
                          : searchTerm || filterStatus !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first page to get started'}
                      </p>
                      {!showDeleted && !searchTerm && filterStatus === 'all' && (
                        <button
                          type="button"
                          onClick={() => openModal()}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          <FaPlus size={10} /> Create page
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isDeleted = item.deleted_at !== null;
                    const protectedPage = isProtectedPage(item, protectedPages);
                    const subPage = isSubPage(item.slug);
                    const parentSlug = getParentSlug(item.slug);
                    const parentExists = items.some((p) => p.slug === parentSlug && !isSubPage(p.slug));
                    const accent = isDeleted
                      ? 'before:bg-red-400'
                      : protectedPage
                        ? 'before:bg-amber-400'
                        : item.is_active
                          ? 'before:bg-emerald-400'
                          : 'before:bg-slate-300';

                    return (
                      <tr
                        key={item.id}
                        className={`group relative transition-colors before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] ${accent} ${isDeleted ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-slate-50/70'
                          }`}
                      >
                        {/* Page */}
                        <td className="px-4 py-3.5 pl-5">
                          <div className="flex items-start gap-3">
                            <PageIcon slug={item.slug} />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {subPage && parentExists && (
                                  <span className="text-xs text-slate-400">↳</span>
                                )}
                                <span className={`truncate text-sm font-medium ${isDeleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                  {item.name || 'Unnamed page'}
                                </span>
                                {subPage && parentExists && (
                                  <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 ring-1 ring-cyan-200">
                                    Sub-page
                                  </span>
                                )}
                                {protectedPage && (
                                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                                    <FaLock size={7} className="inline" /> Protected
                                  </span>
                                )}
                                {isDeleted && (
                                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-red-200">
                                    Deleted
                                  </span>
                                )}
                              </div>
                              {item.title && (
                                <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{item.title}</p>
                              )}
                              {isDeleted && item.deleted_at && (
                                <p className="mt-0.5 text-[11px] text-red-500">
                                  Deleted {formatDate(item.deleted_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="hidden px-4 py-3.5 md:table-cell">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">
                            /{item.slug || '—'}
                          </code>
                        </td>

                        {/* Type */}
                        <td className="hidden px-4 py-3.5 text-xs text-slate-600 lg:table-cell">
                          {getPageTypeLabel(item.slug)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {!isDeleted ? (
                            <button
                              type="button"
                              onClick={() => toggleStatus(item)}
                              disabled={toggling === item.id || protectedPage}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 transition ${protectedPage
                                  ? 'cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200'
                                  : item.is_active
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200'
                                }`}
                              title={protectedPage
                                ? 'Protected page cannot be deactivated'
                                : item.is_active
                                  ? 'Click to deactivate'
                                  : 'Click to activate'}
                            >
                              {toggling === item.id ? (
                                <FaSpinner className="animate-spin" size={10} />
                              ) : item.is_active ? (
                                <FaToggleOn size={12} />
                              ) : (
                                <FaToggleOff size={12} />
                              )}
                              {item.is_active ? 'Active' : 'Inactive'}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200">
                              <FaTrash size={9} /> In trash
                            </span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="hidden px-4 py-3.5 text-xs text-slate-500 sm:table-cell">
                          <div className="inline-flex items-center gap-1.5">
                            <FaCalendarAlt size={10} className="text-slate-400" />
                            {formatDate(item.created_at)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
                            {isDeleted ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => confirmRestore(item)}
                                  disabled={isRestoring}
                                  className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                                  title="Restore"
                                >
                                  <FaUndo size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmForceDelete(item)}
                                  className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50"
                                  title="Delete permanently"
                                >
                                  <MdDeleteForever size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <Link
                                  href={route('backend.cms.sections.page.sections', item.id)}
                                  className="rounded-md p-1.5 text-amber-600 transition hover:bg-amber-50"
                                  title="Manage page sections"
                                >
                                  <BsStack size={14} />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => openModal(item)}
                                  className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50"
                                  title={protectedPage ? 'Protected page cannot be edited' : 'Edit page'}
                                >
                                  <FaEdit size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmDelete(item)}
                                  disabled={protectedPage}
                                  className={`rounded-md p-1.5 transition ${protectedPage
                                      ? 'cursor-not-allowed text-slate-300'
                                      : 'text-red-600 hover:bg-red-50'
                                    }`}
                                  title={protectedPage ? 'Protected page cannot be deleted' : 'Move to trash'}
                                >
                                  <FaTrash size={12} />
                                </button>
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

          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500">
              <span>
                Showing <span className="font-medium text-slate-600">{filteredItems.length}</span>{' '}
                page{filteredItems.length === 1 ? '' : 's'}
              </span>
              {showDeleted && <span className="text-red-500">Trash view</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ───────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="flex max-h-screen w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl">
            {/* Header */}
            <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5">
              <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600 ring-1 ring-blue-100">
                <FaPlus size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-slate-800">
                  {editingItem ? 'Edit Page' : 'Create Page'}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {editingItem ? 'Update the page details' : 'Fill in the details to create a new page'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                aria-label="Close"
              >
                <FaTimes size={16} />
              </button>
            </header>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                <ErrorBanner errors={validationErrors} />

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="flex items-baseline gap-1 text-sm font-medium text-slate-700">
                    Page Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={handleNameChange}
                    placeholder="e.g. About Us, Services, Contact"
                    className={`${inputBase} ${validationErrors.name ? inputError : inputIdle}`}
                  />
                  {validationErrors.name ? (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <FaExclamationCircle size={11} /> {validationErrors.name}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">The name is used to auto-generate the URL slug.</p>
                  )}
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="flex items-baseline gap-1 text-sm font-medium text-slate-700">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">/</span>
                      <input
                        type="text"
                        value={formData.slug || ''}
                        onChange={handleSlugChange}
                        placeholder="page-url-slug"
                        className={`${inputBase} pl-6 font-mono ${validationErrors.slug ? inputError : inputIdle}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={regenerateSlug}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                      title="Regenerate from name"
                    >
                      <FaSync size={11} /> Auto
                    </button>
                  </div>
                  {validationErrors.slug ? (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <FaExclamationCircle size={11} /> {validationErrors.slug}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">What appears in the browser address bar.</p>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="flex items-baseline gap-1 text-sm font-medium text-slate-700">
                    Page Title <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (validationErrors.title) setValidationErrors({ ...validationErrors, title: null });
                    }}
                    placeholder="e.g. Welcome to Our Website"
                    className={`${inputBase} ${validationErrors.title ? inputError : inputIdle}`}
                  />
                  {validationErrors.title && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <FaExclamationCircle size={11} /> {validationErrors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="flex items-baseline gap-1 text-sm font-medium text-slate-700">
                    Description <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="A short description of this page…"
                    rows={3}
                    className={`${inputBase} ${inputIdle} min-h-20 resize-y`}
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Page Status</label>
                  <select
                    value={formData.is_active ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                    disabled={Boolean(editingItem) && isProtectedPage(editingItem, protectedPages)}
                    className={`${inputBase} ${inputIdle} ${editingItem && isProtectedPage(editingItem, protectedPages) ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <option value="1">Active — visible on the site</option>
                    <option value="0">Inactive — hidden from the site</option>
                  </select>
                  {editingItem && isProtectedPage(editingItem, protectedPages) && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                      <FaLock size={10} /> Protected pages cannot be deactivated.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <><FaSpinner className="animate-spin" size={12} /> {editingItem ? 'Saving…' : 'Creating…'}</>
                  ) : (
                    <><FaSave size={12} /> {editingItem ? 'Update page' : 'Create page'}</>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}