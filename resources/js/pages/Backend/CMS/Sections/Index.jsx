// resources/js/pages/Backend/CMS/Sections/Index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import { useSectionHelpers } from './hooks/useSectionHelpers';
import {
  FaPlus, FaTrash, FaSync, FaArrowLeft, FaCheckCircle,
  FaExclamationCircle, FaToggleOff, FaHashtag, FaInbox,
} from 'react-icons/fa';

import SectionTable from './components/SectionTable';
import SectionFooter from './components/SectionFooter';
import AddSectionModal from './components/AddSectionModal';
import SectionEditModal from './components/SectionEditModal';
import { getSectionStats } from './utils/sectionHelpers';
import { showErrorToast } from './utils/toastHelper';

const StatCard = ({ label, value, icon: Icon, tone }) => {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50/60 text-amber-700',
    red: 'border-red-200 bg-red-50/60 text-red-700',
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-80">
        <Icon size={10} /> {label}
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
};

const Index = ({ page, sections: initialSections, trashedSections: initialTrashedSections, trashedCount: initialTrashedCount }) => {
  const { flash } = usePage().props;

  const {
    sections, previewSections, isReordering, isSaving, error: hookError,
    draggedIndex, dragOverIndex, togglePreview, hasData, canMove,
    handleDragStart, handleDragEnd, handleDragOver, handleDragEnter,
    handleDragLeave, handleDrop, handleMoveUp, handleMoveDown,
    editingSection, isEditModalOpen, handleEditClick, handleEditClose, handleEditSuccess,
  } = useSectionHelpers(initialSections, page?.id);

  const [activeTab, setActiveTab] = useState('active');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const trashedSections = initialTrashedSections || [];
  const trashedCount = initialTrashedCount || 0;
  const stats = getSectionStats(sections);

  const handleSectionChanged = useCallback(() => {
    router.reload({ only: ['sections', 'trashedSections', 'trashedCount'] });
  }, []);

  useEffect(() => {
    if (flash?.error) showErrorToast('Error', flash.error);
  }, [flash]);

  if (!page) {
    return (
      <AuthenticatedLayout>
        <Head title="Sections" />
        <div className="p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <FaExclamationCircle className="mx-auto mb-3 text-red-500" size={32} />
            <h2 className="text-lg font-semibold text-red-800">Page not found</h2>
            <p className="mt-1 text-sm text-red-700">The requested page could not be found.</p>
            <Link href={route('backend.cms.pages.index')} className="mt-4 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Back to Pages
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const displaySections = activeTab === 'active' ? sections : trashedSections;

  return (
    <AuthenticatedLayout>
      <Head title={`Sections - ${page.name}`} />

      <div className="p-4 md:p-6">
        {hookError && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border-l-4 border-red-400 bg-red-50 px-4 py-3">
            <FaExclamationCircle className="mt-0.5 shrink-0 text-red-500" size={14} />
            <p className="text-sm text-red-700">{hookError}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Link href={route('backend.cms.pages.index')} className="font-medium text-slate-600 hover:text-blue-600">
              Pages
            </Link>
            <span className="text-slate-300">›</span>
            <span className="text-slate-400">Sections</span>
          </nav>

          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {page.name} — Sections
              </h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                Manage all sections for this page
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">{page.slug}</code>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.reload({ only: ['sections', 'trashedSections', 'trashedCount'] })}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title="Refresh"
              >
                <FaSync className={isSaving ? 'animate-spin' : ''} size={14} />
              </button>
              <Link
                href={route('backend.cms.pages.index')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <FaArrowLeft size={11} /> Back
              </Link>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-md"
              >
                <FaPlus size={11} /> Add section
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total" value={stats.total} icon={FaHashtag} tone="slate" />
            <StatCard label="Active" value={stats.active ?? sections.filter((s) => s.is_enabled).length} icon={FaCheckCircle} tone="emerald" />
            <StatCard label="Inactive" value={stats.inactive ?? sections.filter((s) => !s.is_enabled).length} icon={FaToggleOff} tone="slate" />
            <StatCard label="Trash" value={trashedCount} icon={FaTrash} tone="red" />
          </div>
        </div>

        {/* Tabs + Table card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${activeTab === 'active'
                  ? 'text-blue-700 border-b-2 border-blue-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <FaCheckCircle size={11} />
              Active
              <span className={`rounded px-1.5 text-[10px] font-semibold ${activeTab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>{sections.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trashed')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${activeTab === 'trashed'
                  ? 'text-red-700 border-b-2 border-red-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <FaTrash size={11} />
              Trash
              {trashedCount > 0 && (
                <span className={`rounded px-1.5 text-[10px] font-semibold ${activeTab === 'trashed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                  }`}>{trashedCount}</span>
              )}
            </button>
          </div>

          <SectionTable
            hasData={hasData}
            canMove={canMove}
            isSaving={isSaving}
            handleDrop={handleDrop}
            sections={displaySections}
            isReordering={isReordering}
            draggedIndex={draggedIndex}
            toggleExpand={() => { }}
            handleMoveUp={handleMoveUp}
            onEditClick={handleEditClick}
            togglePreview={togglePreview}
            handleDragEnd={handleDragEnd}
            dragOverIndex={dragOverIndex}
            getDataSummary={() => ''}
            handleMoveDown={handleMoveDown}
            handleDragOver={handleDragOver}
            previewSections={previewSections}
            handleDragStart={handleDragStart}
            handleDragEnter={handleDragEnter}
            handleDragLeave={handleDragLeave}
            expandedSections={{}}
            showTrashed={activeTab === 'trashed'}
            onSectionDeleted={handleSectionChanged}
          />
        </div>

        <SectionFooter sections={displaySections} hasData={hasData} />

        {/* Trash empty hint */}
        {activeTab === 'trashed' && displaySections.length === 0 && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <FaInbox className="mt-0.5 shrink-0 text-slate-400" size={14} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">Trash is empty</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Deleted sections will appear here. You can restore them or permanently delete them.
              </p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-slate-500">
                <li>• <strong className="text-slate-700">Restore</strong> — recovers the section and its data</li>
                <li>• <strong className="text-slate-700">Permanently delete</strong> — cannot be undone</li>
                <li>• Fixed sections cannot be deleted</li>
              </ul>
            </div>
          </div>
        )}

        <SectionEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditClose}
          section={editingSection}
          pageId={page.id}
          onSuccess={handleEditSuccess}
        />

        <AddSectionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          pageId={page.id}
          onSuccess={handleEditSuccess}
        />
      </div>
    </AuthenticatedLayout>
  );
};

export default Index;