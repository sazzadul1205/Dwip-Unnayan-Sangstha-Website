// resources/js/pages/Backend/CMS/Sections/components/SectionRow.jsx
import React, { Fragment, useState } from 'react';
import { router } from '@inertiajs/react';
import {
  FaDatabase, FaGripVertical, FaEye, FaEyeSlash, FaShareAlt, FaBriefcase,
  FaExternalLinkAlt, FaList, FaEdit, FaTrash, FaTrashRestore, FaTrashAlt,
  FaFileAlt, FaLock, FaArrowUp, FaArrowDown, FaStar,
} from 'react-icons/fa';
import { BsStack } from 'react-icons/bs';
import Swal from 'sweetalert2';

import { Can } from '../../../../../components/Auth/Can';
import { showToast } from '../utils/toastHelper';
import { getComponentLabel, getDataTableLabel, getSectionTypeInfo } from '../utils/sectionHelpers';
import SectionIndex from '../../../../../Sections/_runtime/SectionIndex';

const SWAL_BASE = {
  popup: 'rounded-xl shadow-2xl',
  title: 'text-lg font-semibold text-slate-900',
  htmlContainer: 'text-sm text-slate-600',
  confirmButton: 'rounded-lg font-semibold px-4 py-2',
  cancelButton: 'rounded-lg font-medium px-4 py-2',
};

const Pill = ({ icon: Icon, label, tone }) => {
  const tones = {
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${tones[tone]}`}>
      {Icon && <Icon size={8} />}
      {label}
    </span>
  );
};

const PreviewNotice = ({ tone = 'slate', icon: Icon, title, description, ctaLabel, ctaHref }) => {
  const tones = {
    emerald: { icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100', title: 'text-emerald-800', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25' },
    violet: { icon: 'bg-violet-50 text-violet-600 ring-violet-100', title: 'text-violet-800', btn: 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/25' },
    orange: { icon: 'bg-orange-50 text-orange-600 ring-orange-100', title: 'text-orange-800', btn: 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/25' },
    indigo: { icon: 'bg-indigo-50 text-indigo-600 ring-indigo-100', title: 'text-indigo-800', btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25' },
    slate: { icon: 'bg-slate-100 text-slate-600 ring-slate-200', title: 'text-slate-800', btn: 'bg-slate-600 hover:bg-slate-700 shadow-slate-600/25' },
  };
  const t = tones[tone] ?? tones.slate;
  return (
    <tr>
      <td colSpan="6" className="px-6 py-10 text-center">
        <div className="mx-auto max-w-md">
          <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-1 ${t.icon}`}>
            <Icon size={20} />
          </div>
          <h3 className={`text-sm font-semibold ${t.title}`}>{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
          <a
            href={ctaHref}
            className={`mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition ${t.btn}`}
          >
            <FaExternalLinkAlt size={10} /> {ctaLabel}
          </a>
        </div>
      </td>
    </tr>
  );
};

const SectionRow = ({
  section, index, totalSections, isPreviewOpen, isReordering, isSaving, isMovable,
  onTogglePreview, onMoveUp, onMoveDown, onDragStart, onDragEnd, onDragOver,
  onDragEnter, onDragLeave, onDrop, onEditClick, onSectionDeleted,
  isTrashed = false, draggedIndex, dragOverIndex,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const isDragging = draggedIndex === index;
  const isDragOver = dragOverIndex === index && !isDragging;

  const typeInfo = getSectionTypeInfo(section);
  const isBanner = section.component === 'HomeBanner' || section.component === 'PageBannerSection';
  const isShared = section.data_table === 'shared_data';
  const isJobs = section.data_table === 'jobs';
  const isPrograms = section.data_table === 'programs' || section.component === 'OurProgramsSection';
  const isPublications = section.data_table === 'publications';

  const accent = isBanner ? 'before:bg-amber-400'
    : section.is_fixed_section ? 'before:bg-blue-400'
      : isShared ? 'before:bg-emerald-400'
        : isJobs ? 'before:bg-violet-400'
          : isPrograms ? 'before:bg-orange-400'
            : isPublications ? 'before:bg-indigo-400'
              : 'before:bg-slate-200';

  let rowClasses = `group relative transition-colors before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] ${accent} ${isTrashed ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-slate-50/70'
    } ${isReordering ? 'opacity-75' : ''}`;
  if (isDragging) rowClasses += ' opacity-60 shadow-lg ring-2 ring-blue-400 z-10 relative';
  if (isDragOver) rowClasses += ' border-t-2 border-blue-500 bg-blue-50/60';

  const canPreview = !isJobs && !isShared && !isPrograms && !isPublications;

  const handleDelete = () => {
    if (section.is_fixed_section) {
      showToast('warning', 'Cannot Delete', 'Fixed sections cannot be deleted.', 2500);
      return;
    }
    Swal.fire({
      title: 'Move to Trash?',
      html: `<p class="text-sm text-slate-600">Move "<strong>${section.section_key}</strong>" to trash? You can restore it later.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Move to Trash',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: SWAL_BASE,
    }).then((r) => {
      if (!r.isConfirmed) return;
      setIsDeleting(true);
      router.delete(route('backend.cms.sections.destroy', { section: section.id }), {
        preserveScroll: true, preserveState: true,
        onSuccess: () => {
          setIsDeleting(false);
          showToast('success', 'Moved to Trash', 'Section moved to trash.', 2000);
          onSectionDeleted?.();
        },
        onError: (errs) => {
          setIsDeleting(false);
          showToast('error', 'Delete Failed', errs?.message || 'Failed to delete.', 4000);
        },
      });
    });
  };

  const handleRestore = () => {
    Swal.fire({
      title: 'Restore Section?',
      html: `<p class="text-sm text-slate-600">Restore "<strong>${section.section_key}</strong>" to its original position?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Restore',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: SWAL_BASE,
    }).then((r) => {
      if (!r.isConfirmed) return;
      setIsDeleting(true);
      router.post(route('backend.cms.sections.restore', { section: section.id }), {}, {
        preserveScroll: true, preserveState: true,
        onSuccess: () => {
          setIsDeleting(false);
          showToast('success', 'Restored', 'Section restored.', 2000);
          onSectionDeleted?.();
        },
        onError: (errs) => {
          setIsDeleting(false);
          showToast('error', 'Restore Failed', errs?.message || 'Failed to restore.', 4000);
        },
      });
    });
  };

  const handleForceDelete = () => {
    if (section.is_fixed_section) {
      showToast('warning', 'Cannot Delete', 'Fixed sections cannot be deleted.', 2500);
      return;
    }
    Swal.fire({
      title: 'Permanently delete?',
      html: `<p class="text-sm text-slate-600">Permanently delete "<strong>${section.section_key}</strong>"? This cannot be undone.</p>`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete forever',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: SWAL_BASE,
    }).then((r) => {
      if (!r.isConfirmed) return;
      setIsDeleting(true);
      router.delete(route('backend.cms.sections.force-delete', { section: section.id }), {
        preserveScroll: true, preserveState: true,
        onSuccess: () => {
          setIsDeleting(false);
          showToast('success', 'Permanently Deleted', 'Section removed permanently.', 2000);
          onSectionDeleted?.();
        },
        onError: (errs) => {
          setIsDeleting(false);
          showToast('error', 'Delete Failed', errs?.message || 'Failed to delete.', 4000);
        },
      });
    });
  };

  // ---------- TRASHED ROW ----------
  if (isTrashed) {
    return (
      <tr className="group relative bg-red-50/30 transition-colors before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-red-400 before:content-[''] hover:bg-red-50/50">
        <td className="px-4 py-3.5 text-sm text-slate-400">
          <span className="font-mono tabular-nums">#{index + 1}</span>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500 ring-1 ring-red-200">
              <FaTrash size={12} />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-slate-400 line-through">{section.section_key}</span>
              <div className="mt-0.5">
                <Pill icon={FaTrash} label="Trashed" tone="slate" />
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <span className="text-sm text-slate-600">{getComponentLabel(section.component)}</span>
          <div className="text-xs font-mono text-slate-400">{section.component}</div>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FaDatabase size={11} className="text-slate-400" />
            {getDataTableLabel(section.data_table)}
          </div>
        </td>
        <td className="px-4 py-3.5">
          <Pill label="Deleted" tone="slate" />
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-0.5">
            <Can permission="sections.restore">
              <button
                type="button"
                onClick={handleRestore}
                disabled={isDeleting}
                className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                title="Restore"
              >
                <FaTrashRestore size={13} />
              </button>
            </Can>
            <Can permission="sections.force_delete">
              <button
                type="button"
                onClick={handleForceDelete}
                disabled={isDeleting}
                className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                title="Permanently delete"
              >
                <FaTrashAlt size={13} />
              </button>
            </Can>
          </div>
        </td>
      </tr>
    );
  }

  // ---------- ACTIVE ROW ----------
  return (
    <Fragment>
      {isDragOver && (
        <tr>
          <td colSpan="6" className="h-0 p-0">
            <div className="mx-4 h-0.5 animate-pulse rounded-full bg-blue-500" />
          </td>
        </tr>
      )}

      <tr
        className={rowClasses}
        draggable={isMovable}
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragEnter={(e) => onDragEnter(e, index)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, index)}
      >
        {/* Index */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            {isMovable ? (
              <span
                className="cursor-grab rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
                title="Drag to reorder"
              >
                <FaGripVertical size={12} />
              </span>
            ) : (
              <span className="w-5" />
            )}
            <span className="w-6 text-center text-sm font-mono tabular-nums text-slate-400">
              {index + 1}
            </span>
          </div>
        </td>

        {/* Section Key + Pills */}
        <td className="px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1 ${section.is_enabled
                ? 'bg-blue-50 text-blue-600 ring-blue-100'
                : 'bg-slate-100 text-slate-400 ring-slate-200'
              }`}>
              {isShared ? <FaShareAlt size={12} />
                : isJobs ? <FaBriefcase size={12} />
                  : isPrograms ? <FaList size={12} />
                    : isPublications ? <FaFileAlt size={12} />
                      : <BsStack size={12} />}
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-slate-800">{section.section_key}</span>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {isBanner && <Pill icon={FaStar} label="Banner" tone="amber" />}
                {section.is_fixed_section && <Pill icon={FaLock} label="Fixed" tone="blue" />}
                {isShared && <Pill icon={FaShareAlt} label="Shared" tone="emerald" />}
                {isJobs && <Pill icon={FaBriefcase} label="Jobs" tone="violet" />}
                {isPrograms && <Pill icon={FaList} label="Programs" tone="orange" />}
                {isPublications && <Pill icon={FaFileAlt} label="Publications" tone="indigo" />}
              </div>
            </div>
          </div>
        </td>

        {/* Component */}
        <td className="px-4 py-3.5">
          <span className="text-sm font-medium text-slate-700">{getComponentLabel(section.component)}</span>
          <div className="text-xs font-mono text-slate-400">{section.component}</div>
        </td>

        {/* Status */}
        <td className="px-4 py-3.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ${section.is_enabled
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : 'bg-slate-100 text-slate-500 ring-slate-200'
              }`}
          >
            {section.is_enabled ? <FaEye size={10} /> : <FaEyeSlash size={10} />}
            {section.is_enabled ? 'Active' : 'Inactive'}
          </span>
        </td>

        {/* Type */}
        <td className="px-4 py-3.5">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ${typeInfo.color}`}>
            <span aria-hidden>{typeInfo.icon}</span>
            {typeInfo.label}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
            <Can permission="sections.update_order">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
                disabled={index === 0 || !isMovable || isSaving}
                className={`rounded-md p-1.5 transition ${index === 0 || !isMovable || isSaving
                    ? 'cursor-not-allowed text-slate-300'
                    : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                title={!isMovable ? 'Fixed section cannot be moved' : 'Move up'}
              >
                <FaArrowUp size={10} />
              </button>
            </Can>

            <span className="min-w-8 text-center text-xs font-mono tabular-nums text-slate-400">
              #{section.display_order}
            </span>

            <Can permission="sections.update_order">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
                disabled={index === totalSections - 1 || !isMovable || isSaving}
                className={`rounded-md p-1.5 transition ${index === totalSections - 1 || !isMovable || isSaving
                    ? 'cursor-not-allowed text-slate-300'
                    : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                title={!isMovable ? 'Fixed section cannot be moved' : 'Move down'}
              >
                <FaArrowDown size={10} />
              </button>
            </Can>

            <span className="mx-0.5 h-5 w-px bg-slate-200" />

            <Can permission="sections.update">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEditClick(section); }}
                className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50"
                title="Edit section"
              >
                <FaEdit size={13} />
              </button>
            </Can>

            {canPreview ? (
              <Can permission="sections.view">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTogglePreview(section.id); }}
                  className={`rounded-md p-1.5 transition ${isPreviewOpen
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  title={isPreviewOpen ? 'Close preview' : 'Preview'}
                >
                  {isPreviewOpen ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                </button>
              </Can>
            ) : (
              <button
                type="button"
                className="cursor-not-allowed rounded-md p-1.5 text-slate-300"
                title={
                  isShared ? 'Shared data — edit in Shared Data Manager'
                    : isJobs ? 'Jobs — edit in Job Manager'
                      : isPrograms ? 'Programs — edit in Program Manager'
                        : isPublications ? 'Publications — edit in Publications Manager'
                          : 'Preview not available'
                }
                disabled
              >
                <FaEye size={13} className="opacity-40" />
              </button>
            )}

            {!section.is_fixed_section && (
              <Can permission="sections.destroy">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  disabled={isDeleting}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="Move to trash"
                >
                  <FaTrash size={12} />
                </button>
              </Can>
            )}
          </div>
        </td>
      </tr>

      {/* Preview (built-in) */}
      {isPreviewOpen && canPreview && !isTrashed && (
        <tr>
          <td colSpan="6" className="border-t border-slate-100 bg-slate-50/70 px-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Live preview
                  </span>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 ring-1 ring-slate-200">
                    {section.component}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onTogglePreview(section.id)}
                  className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
                >
                  Close
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="p-3">
                  <SectionIndex sections={[section]} />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Shared data preview */}
      {isPreviewOpen && isShared && !isTrashed && (
        <PreviewNotice
          tone="emerald"
          icon={FaShareAlt}
          title="Shared data section"
          description="This section pulls from the Shared Data Manager so it can be reused across pages."
          ctaLabel="Go to Shared Data Manager"
          ctaHref={route('backend.cms.shared.index')}
        />
      )}

      {/* Jobs preview */}
      {isPreviewOpen && isJobs && !isTrashed && (
        <PreviewNotice
          tone="violet"
          icon={FaBriefcase}
          title="Jobs section"
          description="Job listings are managed in the Job Manager."
          ctaLabel="Go to Job Listings"
          ctaHref={route('backend.listing.index')}
        />
      )}

      {/* Programs preview */}
      {isPreviewOpen && isPrograms && !isTrashed && (
        <PreviewNotice
          tone="orange"
          icon={FaList}
          title="Programs section"
          description="Programs are managed in the Program Manager."
          ctaLabel="Go to Program Manager"
          ctaHref={route('backend.cms.programs.index')}
        />
      )}

      {/* Publications preview */}
      {isPreviewOpen && isPublications && !isTrashed && (
        <PreviewNotice
          tone="indigo"
          icon={FaFileAlt}
          title="Publications section"
          description="Publications are managed in the Publications Manager."
          ctaLabel="Go to Publications Manager"
          ctaHref={route('backend.cms.publications.index')}
        />
      )}
    </Fragment>
  );
};

export default SectionRow;