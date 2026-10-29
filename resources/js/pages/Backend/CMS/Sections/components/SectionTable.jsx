// resources/js/pages/Backend/CMS/Sections/components/SectionTable.jsx
import React from 'react';
import { FaInbox } from 'react-icons/fa';
import SectionRow from './SectionRow';

const SectionTable = ({
  sections,
  previewSections,
  isReordering,
  isSaving,
  canMove,
  togglePreview,
  handleMoveUp,
  handleMoveDown,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  onEditClick,
  onSectionDeleted,
  showTrashed = false,
  draggedIndex,
  dragOverIndex,
}) => {
  if (sections.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <FaInbox size={26} />
        </div>
        <p className="text-sm font-medium text-slate-600">
          {showTrashed ? 'Trash is empty' : 'No sections yet'}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {showTrashed ? 'Deleted sections will appear here' : 'Add a new section to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="border-b border-slate-100 bg-slate-50/70">
          <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-16 px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Section</th>
            <th className="px-4 py-3 text-left">Component</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">{showTrashed ? 'Deleted At' : 'Type'}</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sections.map((section, index) => (
            <SectionRow
              key={section.id}
              section={section}
              index={index}
              totalSections={sections.length}
              isPreviewOpen={previewSections[section.id] || false}
              isReordering={isReordering}
              isSaving={isSaving}
              isMovable={canMove(section)}
              onTogglePreview={togglePreview}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onEditClick={onEditClick}
              onSectionDeleted={onSectionDeleted}
              isTrashed={showTrashed}
              draggedIndex={draggedIndex}
              dragOverIndex={dragOverIndex}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SectionTable;