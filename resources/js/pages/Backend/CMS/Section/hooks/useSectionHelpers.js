// resources/js/pages/Backend/CMS/Section/hooks/useSectionHelpers.js

import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { showToast } from '../utils/toastHelper';

export const useSectionHelpers = (initialSections, pageId) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL, IN THE SAME ORDER EVERY TIME
  const [sections, setSections] = useState(initialSections || []);
  const [expandedSections, setExpandedSections] = useState({});
  const [previewSections, setPreviewSections] = useState({});
  const [isReordering, setIsReordering] = useState(false);
  const [dragError, setDragError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // Drag state for visual feedback
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Effect hook - always called in the same order
  useEffect(() => {
    if (initialSections && Array.isArray(initialSections)) {
      setSections(initialSections);
    }
  }, [initialSections]);

  // All functions defined after hooks
  const toggleExpand = useCallback((sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const togglePreview = useCallback((sectionId) => {
    setPreviewSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const canMove = useCallback((section) => {
    return !section?.is_fixed_section;
  }, []);

  const hasData = useCallback((section) => {
    return section?.data !== null && section?.data !== undefined;
  }, []);

  const getDataSummary = useCallback((section) => {
    try {
      if (!section) return 'No data';
      if (section.data_table === 'shared_data') {
        return 'Shared Data';
      }
      if (section.section_key === 'content' || section.component === 'ContentSection') {
        return 'Content Section';
      }
      if (!section.data) return 'No data';
      if (Array.isArray(section.data)) {
        return `${section.data.length} items`;
      }
      if (typeof section.data === 'object') {
        const keys = Object.keys(section.data);
        if (keys.includes('data') && section.data.data) {
          if (Array.isArray(section.data.data)) {
            return `${section.data.data.length} items`;
          }
          return 'Has data';
        }
        return `${keys.length} fields`;
      }
      return 'Has data';
    } catch (err) {
      console.error('Error getting data summary:', err);
      return 'Error loading data';
    }
  }, []);

  const handleEditClick = useCallback((section) => {
    setEditingSection(section);
    setIsEditModalOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingSection(null);
  }, []);

  const handleEditSuccess = useCallback(() => {
    router.reload({ only: ['sections'] });
  }, []);

  const handleDragStart = useCallback((e, index) => {
    try {
      const section = sections[index];
      if (!canMove(section)) {
        e.preventDefault();
        showToast('warning', 'Cannot Move Section', 'This section is fixed and cannot be moved.', 2500);
        return;
      }
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
      e.currentTarget.style.opacity = '0.5';
      setDraggedIndex(index);
      setDragOverIndex(null);
    } catch (err) {
      console.error('Drag start error:', err);
      setError('Failed to start drag operation');
    }
  }, [sections, canMove]);

  const handleDragEnd = useCallback((e) => {
    try {
      e.currentTarget.style.opacity = '1';
      setDraggedIndex(null);
      setDragOverIndex(null);
    } catch (err) {
      console.error('Drag end error:', err);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    try {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    } catch (err) {
      console.error('Drag over error:', err);
    }
  }, []);

  const handleDragEnter = useCallback((e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback((e) => {
    const relatedTarget = e.relatedTarget;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    try {
      e.preventDefault();
      setDragOverIndex(null);

      const dragData = e.dataTransfer.getData('text/plain');
      if (!dragData) {
        setDraggedIndex(null);
        return;
      }

      const dragIndex = parseInt(dragData, 10);
      if (isNaN(dragIndex) || dragIndex === dropIndex) {
        setDraggedIndex(null);
        return;
      }

      const draggedSection = sections[dragIndex];
      const dropSection = sections[dropIndex];

      if (!canMove(draggedSection) || !canMove(dropSection)) {
        setDragError('Fixed sections cannot be reordered.');
        showToast('warning', 'Cannot Reorder', 'Fixed sections are locked and cannot be moved.', 2500);
        setDraggedIndex(null);
        return;
      }

      setDragError(null);

      const newSections = [...sections];
      const [removed] = newSections.splice(dragIndex, 1);
      newSections.splice(dropIndex, 0, removed);

      const updatedSections = newSections.map((section, idx) => ({
        ...section,
        display_order: idx,
      }));

      // Optimistic update
      setSections(updatedSections);
      setIsReordering(true);
      setIsSaving(true);
      setDraggedIndex(null);

      const orders = updatedSections.map((section) => ({
        id: section.id,
        display_order: section.display_order,
      }));

      // ✅ USE FETCH INSTEAD OF ROUTER.POST
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
      const url = route('backend.cms.sections.update-order', pageId);

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ orders }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          setIsReordering(false);
          setIsSaving(false);
          showToast('success', '✅ Reordered!', 'Section order updated successfully.', 2000);
          // Reload to get fresh data
          router.reload({ only: ['sections'] });
        } else {
          throw new Error(data.message || 'Failed to update order');
        }
      })
      .catch(error => {
        console.error('Reorder error:', error);
        setIsReordering(false);
        setIsSaving(false);
        setSections(initialSections || []);
        setDragError('Failed to update order. Changes reverted.');
        showToast('error', '❌ Reorder Failed', error.message || 'Failed to update section order. Changes have been reverted.', 4000);
      });

    } catch (err) {
      console.error('Drop error:', err);
      setIsReordering(false);
      setIsSaving(false);
      setSections(initialSections || []);
      setDragError('An unexpected error occurred during reorder.');
      showToast('error', '❌ Reorder Failed', 'An unexpected error occurred. Changes have been reverted.', 4000);
      setDraggedIndex(null);
    }
  }, [sections, canMove, initialSections, pageId]);

  const handleMoveUp = useCallback((index) => {
    try {
      if (index === 0) return;
      const section = sections[index];
      if (!canMove(section)) {
        showToast('warning', 'Cannot Move', 'This section is fixed and cannot be moved.', 2500);
        return;
      }
      const fakeEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: () => index.toString(),
        },
      };
      handleDrop(fakeEvent, index - 1);
    } catch (err) {
      console.error('Move up error:', err);
      showToast('error', 'Move Failed', 'Failed to move section up.', 3000);
    }
  }, [sections, canMove, handleDrop]);

  const handleMoveDown = useCallback((index) => {
    try {
      if (index === sections.length - 1) return;
      const section = sections[index];
      if (!canMove(section)) {
        showToast('warning', 'Cannot Move', 'This section is fixed and cannot be moved.', 2500);
        return;
      }
      const fakeEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: () => index.toString(),
        },
      };
      handleDrop(fakeEvent, index + 1);
    } catch (err) {
      console.error('Move down error:', err);
      showToast('error', 'Move Failed', 'Failed to move section down.', 3000);
    }
  }, [sections, canMove, handleDrop]);

  // Return all hooks
  return {
    sections,
    expandedSections,
    previewSections,
    isReordering,
    dragError,
    isSaving,
    editingSection,
    isEditModalOpen,
    error,
    draggedIndex,
    dragOverIndex,
    toggleExpand,
    togglePreview,
    hasData,
    getDataSummary,
    canMove,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleMoveUp,
    handleMoveDown,
    handleEditClick,
    handleEditClose,
    handleEditSuccess,
  };
};