// resources/js/pages/Backend/CMS/Section/components/SectionTable.jsx

import React from 'react';
import SectionRow from './SectionRow';
import { FaInbox } from 'react-icons/fa';

const SectionTable = ({
  sections,
  expandedSections,
  previewSections,
  isReordering,
  isSaving,
  hasData,
  getDataSummary,
  canMove,
  toggleExpand,
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
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <FaInbox size={28} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">
          {showTrashed ? 'No sections in trash' : 'No sections found for this page'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {showTrashed ? 'Deleted sections will appear here' : 'Add a new section to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Section
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Component
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {showTrashed ? 'Deleted At' : 'Type'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sections.map((section, index) => {
            const isExpanded = expandedSections[section.id] || false;
            const isPreviewOpen = previewSections[section.id] || false;
            const hasSectionData = hasData(section);
            const dataSummary = getDataSummary(section);
            const isMovable = canMove(section);

            return (
              <SectionRow
                key={section.id}
                section={section}
                index={index}
                totalSections={sections.length}
                isExpanded={isExpanded}
                isPreviewOpen={isPreviewOpen}
                isReordering={isReordering}
                isSaving={isSaving}
                isMovable={isMovable}
                hasSectionData={hasSectionData}
                dataSummary={dataSummary}
                onToggleExpand={toggleExpand}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SectionTable;