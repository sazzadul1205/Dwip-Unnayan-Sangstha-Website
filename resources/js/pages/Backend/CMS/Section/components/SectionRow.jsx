// resources/js/pages/Backend/CMS/Section/components/SectionRow.jsx

// React
import React, { Fragment, useState } from 'react';
import { router } from '@inertiajs/react';

// icons
import {
  FaDatabase,
  FaToggleOn,
  FaToggleOff,
  FaGripVertical,
  FaEye,
  FaEyeSlash,
  FaShareAlt,
  FaBriefcase,
  FaExternalLinkAlt,
  FaList,
  FaEdit,
  FaTrash,
  FaTrashRestore,
  FaTrashAlt,
  FaFileAlt,
  FaLock,
} from 'react-icons/fa';
import { BsStack } from 'react-icons/bs';

// utils
import Swal from 'sweetalert2';

// utils
import { showToast } from '../utils/toastHelper';
import { getComponentLabel, getDataTableLabel, getSectionTypeInfo } from '../utils/sectionHelpers';

// section components
import SectionIndex from '../../../../../Sections/SectionIndex';

const SectionRow = ({
  section,
  index,
  totalSections,
  isPreviewOpen,
  isReordering,
  isSaving,
  isMovable,
  onTogglePreview,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onEditClick,
  onSectionDeleted,
  isTrashed = false,
  draggedIndex,
  dragOverIndex,
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

  const typeColorMap = {
    banner: 'border-l-4 border-yellow-400',
    shared: 'border-l-4 border-green-400',
    jobs: 'border-l-4 border-purple-400',
    programs: 'border-l-4 border-orange-400',
    publications: 'border-l-4 border-indigo-400',
    fixed: 'border-l-4 border-blue-400',
    default: '',
  };

  const rowBorderClass = isBanner
    ? typeColorMap.banner
    : section.is_fixed_section
      ? typeColorMap.fixed
      : isShared
        ? typeColorMap.shared
        : isJobs
          ? typeColorMap.jobs
          : isPrograms
            ? typeColorMap.programs
            : isPublications
              ? typeColorMap.publications
              : typeColorMap.default;

  const rowBgClass = isBanner
    ? 'bg-yellow-50/30 hover:bg-yellow-50/60'
    : section.is_fixed_section
      ? 'bg-blue-50/20 hover:bg-blue-50/50'
      : isShared
        ? 'bg-green-50/20 hover:bg-green-50/50'
        : isJobs
          ? 'bg-purple-50/20 hover:bg-purple-50/50'
          : isPrograms
            ? 'bg-orange-50/20 hover:bg-orange-50/50'
            : isPublications
              ? 'bg-indigo-50/20 hover:bg-indigo-50/50'
              : 'hover:bg-gray-50/80';

  let rowClasses = `group transition-all duration-200 ${rowBgClass} ${rowBorderClass} ${isReordering ? 'opacity-75' : ''}`;
  if (isDragging) {
    rowClasses += ' opacity-60 shadow-xl ring-2 ring-blue-400 scale-[0.98] z-50 relative bg-blue-50';
  }
  if (isDragOver) {
    rowClasses += ' border-t-2 border-blue-500 bg-blue-50/70 shadow-inner';
  }

  const canPreview = !isJobs && !isShared && !isPrograms && !isPublications;

  const handleDelete = () => {
    if (section.is_fixed_section) {
      showToast('warning', 'Cannot Delete', 'Fixed sections cannot be deleted.', 3000);
      return;
    }

    Swal.fire({
      title: 'Move to Trash?',
      html: `
        <div class="text-left">
          <p class="text-sm text-gray-600 mb-3">You are about to move this section to the trash:</p>
          <div class="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
            <p class="font-semibold text-gray-800">${section.section_key}</p>
            <p class="text-xs text-gray-500 mt-0.5">${getComponentLabel(section.component)}</p>
          </div>
          <p class="text-xs text-gray-500">You can restore it later from the trash.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Move to Trash',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-lg font-semibold',
        confirmButton: 'px-5 py-2.5 rounded-xl font-medium transition hover:scale-[1.02]',
        cancelButton: 'px-5 py-2.5 rounded-xl font-medium transition hover:bg-gray-100',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(true);
        router.delete(
          route('backend.cms.sections.destroy', { section: section.id }),
          {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
              setIsDeleting(false);
              showToast('success', 'Moved to Trash', 'Section moved to trash successfully.', 2000);
              if (onSectionDeleted) onSectionDeleted();
            },
            onError: (errors) => {
              setIsDeleting(false);
              showToast('error', 'Delete Failed', errors?.message || 'Failed to delete section.', 4000);
            },
          }
        );
      }
    });
  };

  const handleRestore = () => {
    Swal.fire({
      title: 'Restore Section?',
      html: `
        <div class="text-left">
          <p class="text-sm text-gray-600 mb-3">You are about to restore this section:</p>
          <div class="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
            <p class="font-semibold text-gray-800">${section.section_key}</p>
            <p class="text-xs text-gray-500 mt-0.5">${getComponentLabel(section.component)}</p>
          </div>
          <p class="text-xs text-green-600">The section will be restored to its original position.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Restore',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-lg font-semibold',
        confirmButton: 'px-5 py-2.5 rounded-xl font-medium transition hover:scale-[1.02] bg-green-600 hover:bg-green-700',
        cancelButton: 'px-5 py-2.5 rounded-xl font-medium transition hover:bg-gray-100',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(true);
        router.post(
          route('backend.cms.sections.restore', { section: section.id }),
          {},
          {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
              setIsDeleting(false);
              showToast('success', 'Restored!', 'Section restored successfully.', 2000);
              if (onSectionDeleted) onSectionDeleted();
            },
            onError: (errors) => {
              setIsDeleting(false);
              showToast('error', 'Restore Failed', errors?.message || 'Failed to restore section.', 4000);
            },
          }
        );
      }
    });
  };

  const handleForceDelete = () => {
    if (section.is_fixed_section) {
      showToast('warning', 'Cannot Delete', 'Fixed sections cannot be permanently deleted.', 3000);
      return;
    }

    Swal.fire({
      title: '⚠️ Permanently Delete?',
      html: `
        <div class="text-left">
          <p class="text-sm text-red-600 font-semibold mb-3">This action cannot be undone!</p>
          <p class="text-sm text-gray-600 mb-3">You are about to permanently delete this section:</p>
          <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
            <p class="font-semibold text-gray-800">${section.section_key}</p>
            <p class="text-xs text-gray-500 mt-0.5">${getComponentLabel(section.component)}</p>
            ${section.data_table === 'custom_section_data' ? '<p class="text-xs text-red-500 mt-2">⚠️ All associated data and images will be permanently removed.</p>' : ''}
          </div>
          <p class="text-xs text-red-500">This will also delete all associated data and images.</p>
        </div>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Permanently Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-lg font-semibold text-red-600',
        confirmButton: 'px-5 py-2.5 rounded-xl font-medium transition hover:scale-[1.02] bg-red-600 hover:bg-red-700',
        cancelButton: 'px-5 py-2.5 rounded-xl font-medium transition hover:bg-gray-100',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(true);
        router.delete(
          route('backend.cms.sections.force-delete', { section: section.id }),
          {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
              setIsDeleting(false);
              showToast('success', 'Permanently Deleted', 'Section permanently deleted.', 2000);
              if (onSectionDeleted) onSectionDeleted();
            },
            onError: (errors) => {
              setIsDeleting(false);
              showToast('error', 'Delete Failed', errors?.message || 'Failed to permanently delete section.', 4000);
            },
          }
        );
      }
    });
  };

  // Trashed row view
  if (isTrashed) {
    return (
      <tr className="bg-red-50/30 hover:bg-red-50/60 transition-colors group">
        <td className="px-4 py-3.5 text-sm text-gray-400">
          <span className="font-mono">#{index + 1}</span>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-100/80 shrink-0">
              <FaTrash className="text-red-500" size={14} />
            </span>
            <div>
              <span className="text-sm font-medium text-gray-500 line-through">
                {section.section_key}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  🗑️ Trashed
                </span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <span className="text-sm text-gray-600">{getComponentLabel(section.component)}</span>
          <div className="text-xs text-gray-400 font-mono">{section.component}</div>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2">
            <FaDatabase size={12} className="text-gray-400" />
            <span className="text-sm text-gray-600">{getDataTableLabel(section.data_table)}</span>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            Deleted
          </span>
        </td>
        <td className="px-4 py-3.5">
          <span className="text-xs text-gray-400 font-mono">
            {section.deleted_at ? new Date(section.deleted_at).toLocaleDateString() : 'N/A'}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1">
            <button
              onClick={handleRestore}
              disabled={isDeleting}
              className="p-2 rounded-xl transition-all text-green-600 hover:bg-green-50 hover:text-green-700 hover:shadow-sm"
              title="Restore Section"
            >
              <FaTrashRestore size={15} />
            </button>
            <button
              onClick={handleForceDelete}
              disabled={isDeleting}
              className="p-2 rounded-xl transition-all text-red-600 hover:bg-red-50 hover:text-red-700 hover:shadow-sm"
              title="Permanently Delete"
            >
              <FaTrashAlt size={15} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <Fragment>
      {/* Drag Over Indicator */}
      {isDragOver && (
        <tr className="bg-transparent">
          <td colSpan="7" className="h-0 p-0">
            <div className="h-0.5 bg-linear-to-r from-blue-400 to-blue-600 animate-pulse rounded-full mx-4 shadow-lg shadow-blue-200" />
          </td>
        </tr>
      )}

      {/* Draggable Row */}
      <tr
        className={rowClasses}
        draggable={isMovable}
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragEnter={(e) => onDragEnter(e, index)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, index)}
        style={{
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDragging ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        {/* Index & Drag Handle */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            {isMovable ? (
              <span
                className="cursor-grab text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/70 transition-all active:cursor-grabbing"
                title="Drag to reorder"
                onClick={(e) => e.stopPropagation()}
                aria-label="Drag to reorder"
              >
                <FaGripVertical size={13} />
              </span>
            ) : (
              <span className="w-5" />
            )}
            <span className="text-sm text-gray-400 font-mono font-medium w-6 text-center">
              {index + 1}
            </span>
          </div>
        </td>

        {/* Section Key */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${section.is_enabled
                ? 'bg-linear-to-br from-blue-100 to-blue-200 text-blue-700'
                : 'bg-gray-100 text-gray-400'
                }`}
            >
              {isShared ? (
                <FaShareAlt className={section.is_enabled ? 'text-green-600' : 'text-gray-400'} size={15} />
              ) : isJobs ? (
                <FaBriefcase className={section.is_enabled ? 'text-purple-600' : 'text-gray-400'} size={15} />
              ) : isPrograms ? (
                <FaList className={section.is_enabled ? 'text-orange-600' : 'text-gray-400'} size={15} />
              ) : isPublications ? (
                <FaFileAlt className={section.is_enabled ? 'text-indigo-600' : 'text-gray-400'} size={15} />
              ) : (
                <BsStack className={section.is_enabled ? 'text-blue-600' : 'text-gray-400'} size={15} />
              )}
            </span>
            <div>
              <span className="text-sm font-semibold text-gray-800">{section.section_key}</span>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {isBanner && (
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">⭐ Banner</span>
                )}
                {section.is_fixed_section && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                    <FaLock size={8} /> Fixed
                  </span>
                )}
                {isShared && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">🔄 Shared</span>
                )}
                {isJobs && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">💼 Jobs</span>
                )}
                {isPrograms && (
                  <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">📋 Programs</span>
                )}
                {isPublications && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">📄 Publications</span>
                )}
              </div>
            </div>
          </div>
        </td>

        {/* Component */}
        <td className="px-4 py-3.5">
          <span className="text-sm text-gray-700 font-medium">{getComponentLabel(section.component)}</span>
          <div className="text-xs text-gray-400 font-mono">{section.component}</div>
        </td>

        {/* Status */}
        <td className="px-4 py-3.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${section.is_enabled
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
              }`}
          >
            {section.is_enabled ? <FaToggleOn size={13} className="text-green-600" /> : <FaToggleOff size={13} />}
            {section.is_enabled ? 'Active' : 'Inactive'}
          </span>
        </td>

        {/* Type */}
        <td className="px-4 py-3.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
            <span>{typeInfo.icon}</span>
            {typeInfo.label}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(index);
              }}
              disabled={index === 0 || !isMovable || isSaving}
              className={`p-1.5 rounded-lg transition-all ${index === 0 || !isMovable || isSaving
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm'
                }`}
              title={!isMovable ? 'Fixed section cannot be moved' : 'Move Up'}
              aria-label="Move section up"
            >
              ↑
            </button>

            <span className="text-xs text-gray-400 font-mono min-w-8 text-center">#{section.display_order}</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(index);
              }}
              disabled={index === totalSections - 1 || !isMovable || isSaving}
              className={`p-1.5 rounded-lg transition-all ${index === totalSections - 1 || !isMovable || isSaving
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm'
                }`}
              title={!isMovable ? 'Fixed section cannot be moved' : 'Move Down'}
              aria-label="Move section down"
            >
              ↓
            </button>

            <div className="w-px h-6 bg-gray-200 mx-0.5" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(section);
              }}
              className="p-1.5 rounded-lg transition-all text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm"
              title="Edit Section"
              aria-label="Edit section"
            >
              <FaEdit size={14} />
            </button>

            {canPreview ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePreview(section.id);
                }}
                className={`p-1.5 rounded-lg transition-all ${isPreviewOpen
                  ? 'text-blue-600 bg-blue-50 shadow-sm'
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm'
                  }`}
                title={isPreviewOpen ? 'Close Preview' : 'Preview Section'}
                aria-label={isPreviewOpen ? 'Close preview' : 'Preview section'}
              >
                {isPreviewOpen ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            ) : (
              <button
                className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed"
                title={
                  isShared
                    ? 'Shared data - Edit in Shared Data Manager'
                    : isJobs
                      ? 'Jobs data - Edit in Job Manager'
                      : isPrograms
                        ? 'Programs data - Edit in Program Manager'
                        : isPublications
                          ? 'Publications data - Edit in Publications Manager'
                          : 'Cannot preview'
                }
                disabled
                aria-label="Preview not available"
              >
                <FaEye size={14} className="opacity-40" />
              </button>
            )}

            {!section.is_fixed_section && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="p-1.5 rounded-lg transition-all text-gray-400 hover:text-red-600 hover:bg-red-50 hover:shadow-sm"
                title="Move to Trash"
                aria-label="Move to trash"
              >
                <FaTrash size={14} />
              </button>
            )}

            <div className="w-px h-6 bg-gray-200 mx-0.5" />
          </div>
        </td>
      </tr>

      {/* Preview Row */}
      {isPreviewOpen && canPreview && !isTrashed && (
        <tr>
          <td colSpan="7" className="px-4 py-4 bg-blue-50/40 border-t border-blue-200">
            <div className="space-y-3 w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-700">🔍 Preview</span>
                  <span className="text-xs text-blue-500 font-mono">{section.component}</span>
                </div>
                <button
                  onClick={() => onTogglePreview(section.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 transition font-medium"
                >
                  Close Preview ✕
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-inner overflow-hidden border border-blue-100">
                <div className="p-4">
                  <SectionIndex sections={[section]} />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Shared Data Preview */}
      {isPreviewOpen && isShared && !isTrashed && (
        <tr>
          <td colSpan="7" className="px-4 py-6 bg-green-50/40 border-t border-green-200">
            <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                <FaShareAlt className="text-green-500 text-3xl" />
              </div>
              <h3 className="text-lg font-semibold text-green-700">Shared Data Section</h3>
              <p className="text-gray-600 max-w-md text-sm">
                This section uses data from the <strong>Shared Data</strong> system.
                To edit this content, please go to the Shared Data Manager.
              </p>
              <button
                onClick={() => {
                  window.location.href = route('backend.cms.shared.index');
                }}
                className="mt-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2 font-medium text-sm hover:scale-[1.02]"
              >
                <FaExternalLinkAlt size={14} />
                Go to Shared Data Manager
              </button>
            </div>
          </td>
        </tr>
      )}

      {/* Jobs Data Preview */}
      {isPreviewOpen && isJobs && !isTrashed && (
        <tr>
          <td colSpan="7" className="px-4 py-6 bg-purple-50/40 border-t border-purple-200">
            <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                <FaBriefcase className="text-purple-500 text-3xl" />
              </div>
              <h3 className="text-lg font-semibold text-purple-700">Jobs Section</h3>
              <p className="text-gray-600 max-w-md text-sm">
                This section displays job listings. The data comes from the <strong>Jobs</strong> system.
                To edit job listings, please go to the Job Listings Manager.
              </p>
              <button
                onClick={() => {
                  window.location.href = route('backend.listing.index');
                }}
                className="mt-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2 font-medium text-sm hover:scale-[1.02]"
              >
                <FaExternalLinkAlt size={14} />
                Go to Job Listings
              </button>
            </div>
          </td>
        </tr>
      )}

      {/* Programs Data Preview */}
      {isPreviewOpen && isPrograms && !isTrashed && (
        <tr>
          <td colSpan="7" className="px-4 py-6 bg-orange-50/40 border-t border-orange-200">
            <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                <FaList className="text-orange-500 text-3xl" />
              </div>
              <h3 className="text-lg font-semibold text-orange-700">Programs Section</h3>
              <p className="text-gray-600 max-w-md text-sm">
                This section displays programs and projects. The data comes from the <strong>Programs</strong> system.
                To edit programs, please go to the Program Manager.
              </p>
              <button
                onClick={() => {
                  window.location.href = route('backend.cms.programs.index');
                }}
                className="mt-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center gap-2 font-medium text-sm hover:scale-[1.02]"
              >
                <FaExternalLinkAlt size={14} />
                Go to Program Manager
              </button>
            </div>
          </td>
        </tr>
      )}

      {/* Publications Data Preview */}
      {isPreviewOpen && isPublications && !isTrashed && (
        <tr>
          <td colSpan="7" className="px-4 py-6 bg-indigo-50/40 border-t border-indigo-200">
            <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <FaFileAlt className="text-indigo-500 text-3xl" />
              </div>
              <h3 className="text-lg font-semibold text-indigo-700">Publications Section</h3>
              <p className="text-gray-600 max-w-md text-sm">
                This section displays publications. The data comes from the <strong>Publications</strong> system.
                To edit publications, please go to the Publications Manager.
              </p>
              <button
                onClick={() => {
                  window.location.href = route('backend.cms.publications.index');
                }}
                className="mt-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 font-medium text-sm hover:scale-[1.02]"
              >
                <FaExternalLinkAlt size={14} />
                Go to Publications Manager
              </button>
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
};


export default SectionRow; 