// resources/js/pages/Backend/CMS/Pages/Sections.jsx

import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import { useAuth } from '../../../../hooks/useAuth';
import Swal from 'sweetalert2';
import {
  FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSpinner, FaLayerGroup,
  FaToggleOn, FaToggleOff, FaShieldAlt, FaTimes, FaSave, FaGripVertical,
  FaArrowUp, FaArrowDown, FaStar
} from 'react-icons/fa';

const AVAILABLE_COMPONENTS = {
  'PageBannerSection': 'Page Banner',
  'HeroFigureSection': 'Hero with Figure',
  'CardsSection': 'Cards Section',
  'FAQSection': 'FAQ Section',
  'StoriesSection': 'Stories Section',
  'BlogSection': 'Blog Section',
  'OurProgramsSection': 'Our Programs',
  'ContactOfficeSection': 'Contact Office',
  'AddressSection': 'Address Section',
  'ContentSection': 'Content Section',
};

// Banner-related components that should always appear first
const BANNER_COMPONENTS = ['PageBannerSection', 'HeroFigureSection'];

export default function Sections({ page, sections }) {
  const { hasAnyPermission } = useAuth();
  const canEdit = hasAnyPermission(['sections.update', 'sections.manage']);
  const canCreate = hasAnyPermission(['sections.create', 'sections.manage']);
  const canDelete = hasAnyPermission(['sections.destroy', 'sections.manage']);

  // State
  const [localSections, setLocalSections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [dragError, setDragError] = useState(null);
  const [reorderQueue, setReorderQueue] = useState([]);

  const [formData, setFormData] = useState({
    section_key: '', component: '', data_table: '', data_key: '',
    prop_name: '', display_order: 0, is_enabled: true,
    is_fixed_section: false, is_special_component: false, custom_props: {},
  });

  // ========== ENSURE BANNER SECTIONS ARE ALWAYS FIRST ==========
  useEffect(() => {
    if (sections) {
      // Sort sections to ensure banner components come first
      const sortedSections = [...sections].sort((a, b) => {
        const aIsBanner = BANNER_COMPONENTS.includes(a.component);
        const bIsBanner = BANNER_COMPONENTS.includes(b.component);

        // Banner sections always come first
        if (aIsBanner && !bIsBanner) return -1;
        if (!aIsBanner && bIsBanner) return 1;

        // For same type, maintain existing order
        return a.display_order - b.display_order;
      });

      // Update display_order to reflect the new order
      const reorderedSections = sortedSections.map((section, index) => ({
        ...section,
        display_order: index,
        // Automatically mark banner sections as fixed
        is_fixed_section: BANNER_COMPONENTS.includes(section.component) ? true : section.is_fixed_section
      }));

      setLocalSections(reorderedSections);
    }
  }, [sections]);

  // ========== PERMISSION CHECK ==========
  if (!canEdit && !canCreate && !canDelete) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to manage sections.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ========== CHECK IF SECTION IS BANNER ==========
  const isBannerSection = (section) => {
    return BANNER_COMPONENTS.includes(section?.component);
  };

  // ========== MODAL HANDLERS ==========
  const handleOpenCreate = () => {
    setEditingSection(null);
    // Calculate next display order (after banner sections)
    const bannerCount = localSections.filter(s => isBannerSection(s)).length;
    setFormData({
      section_key: '', component: '', data_table: '', data_key: '',
      prop_name: '', display_order: localSections.length, is_enabled: true,
      is_fixed_section: false, is_special_component: false, custom_props: {},
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (section) => {
    setEditingSection(section);
    const isBanner = isBannerSection(section);
    setFormData({
      section_key: section.section_key, component: section.component,
      data_table: section.data_table || '', data_key: section.data_key || '',
      prop_name: section.prop_name || '', display_order: section.display_order,
      is_enabled: section.is_enabled,
      is_fixed_section: isBanner ? true : section.is_fixed_section,
      is_special_component: section.is_special_component,
      custom_props: section.custom_props || {},
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSection(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // If component is being changed to a banner component, automatically set fixed
    if (name === 'component' && BANNER_COMPONENTS.includes(value)) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        is_fixed_section: true
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Ensure banner sections are marked as fixed
    const submitData = {
      ...formData,
      is_fixed_section: BANNER_COMPONENTS.includes(formData.component) ? true : formData.is_fixed_section
    };

    const url = editingSection
      ? route('backend.cms.sections.update', { pageId: page.id, sectionId: editingSection.id })
      : route('backend.cms.sections.store', page.id);

    router[editingSection ? 'put' : 'post'](url, submitData, {
      preserveScroll: true,
      onSuccess: () => {
        Swal.fire({ icon: 'success', title: 'Success!', text: `Section ${editingSection ? 'updated' : 'created'} successfully.`, timer: 1500, showConfirmButton: false });
        setIsModalOpen(false);
        router.reload();
      },
      onError: (error) => {
        Swal.fire({ icon: 'error', title: 'Failed', text: error?.message || `Failed to ${editingSection ? 'update' : 'create'} section.` });
        setIsSubmitting(false);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  // ========== DELETE HANDLER ==========
  const handleDelete = (sectionId) => {
    if (!canDelete) {
      Swal.fire('Permission Denied', 'You do not have permission to delete sections.', 'error');
      return;
    }

    const section = localSections.find(s => s.id === sectionId);
    if (isBannerSection(section)) {
      Swal.fire({
        title: 'Cannot Delete Banner',
        text: 'Banner sections are required and cannot be deleted.',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }

    Swal.fire({
      title: 'Delete Section?',
      text: 'This will permanently delete this section configuration.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
    }).then((result) => {
      if (result.isConfirmed) {
        setDeletingId(sectionId);
        router.delete(route('backend.cms.sections.destroy', { pageId: page.id, sectionId }), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Section deleted successfully.', timer: 1500, showConfirmButton: false });
            router.reload();
          },
          onError: (error) => {
            Swal.fire({ icon: 'error', title: 'Delete Failed', text: error?.message || 'Failed to delete section.' });
          },
          onFinish: () => setDeletingId(null),
        });
      }
    });
  };

  // ========== TOGGLE HANDLER ==========
  const handleToggle = (section) => {
    if (!canEdit) {
      Swal.fire('Permission Denied', 'You do not have permission to update sections.', 'error');
      return;
    }

    // Don't allow disabling banner sections
    if (isBannerSection(section)) {
      Swal.fire({
        title: 'Cannot Disable Banner',
        text: 'Banner sections are required and cannot be disabled.',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }

    router.put(
      route('backend.cms.sections.update', { pageId: page.id, sectionId: section.id }),
      { ...section, is_enabled: !section.is_enabled },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.reload();
          Swal.fire({ icon: 'success', title: 'Updated!', text: `Section ${section.is_enabled ? 'disabled' : 'enabled'} successfully.`, timer: 1500, showConfirmButton: false });
        },
        onError: (error) => {
          Swal.fire({ icon: 'error', title: 'Failed', text: error?.message || 'Failed to update section status.' });
        },
      }
    );
  };

  // ========== DRAG & DROP REORDERING ==========
  const handleDragStart = (e, index) => {
    const section = localSections[index];
    if (isBannerSection(section)) {
      e.preventDefault();
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Move Banner',
        text: 'Banner sections are fixed and cannot be reordered.',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);

    if (dragIndex === dropIndex) return;

    // Check if either section is a banner
    const draggedSection = localSections[dragIndex];
    const dropSection = localSections[dropIndex];

    if (isBannerSection(draggedSection) || isBannerSection(dropSection)) {
      setDragError('Banner sections cannot be reordered.');
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Reorder',
        text: 'Banner sections are locked and must remain at the top.',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    if (draggedSection?.is_fixed_section || dropSection?.is_fixed_section) {
      setDragError('Fixed sections cannot be reordered.');
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Reorder',
        text: 'Fixed sections are locked and cannot be moved.',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setDragError(null);

    // Create new order
    const newSections = [...localSections];
    const [removed] = newSections.splice(dragIndex, 1);
    newSections.splice(dropIndex, 0, removed);

    // Update display_order for all sections
    const updatedSections = newSections.map((section, idx) => ({
      ...section,
      display_order: idx,
    }));

    // Optimistic update - update UI immediately
    setLocalSections(updatedSections);
    setIsReordering(true);

    // Send all updates to backend
    const updatePromises = updatedSections.map((section) => {
      // Prepare the data to match what the controller expects
      const updateData = {
        section_key: section.section_key,
        component: section.component,
        data_table: section.data_table,
        data_key: section.data_key,
        prop_name: section.prop_name,
        display_order: section.display_order,
        is_enabled: section.is_enabled,
        is_fixed_section: section.is_fixed_section,
        is_special_component: section.is_special_component,
        custom_props: section.custom_props || {},
      };

      return router.put(
        route('backend.cms.sections.update', {
          pageId: page.id,
          sectionId: section.id
        }),
        updateData,
        {
          preserveScroll: true,
          preserveState: true,
          onError: (error) => {
            console.error('Failed to update section:', section.id, error);
          }
        }
      );
    });

    // Wait for all updates to complete
    Promise.allSettled(updatePromises)
      .then((results) => {
        setIsReordering(false);

        // Check if any updates failed
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          // Revert to original state if any update failed
          setLocalSections(sections || []);
          setDragError('Some updates failed. Changes reverted.');
          Swal.fire({
            icon: 'error',
            title: 'Reorder Partially Failed',
            text: `${failed.length} section(s) failed to update. Changes have been reverted.`,
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Reordered!',
            text: 'Section order updated successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
          router.reload();
        }
      })
      .catch((error) => {
        // Revert on complete failure
        setLocalSections(sections || []);
        setIsReordering(false);
        setDragError('Failed to update order. Changes reverted.');
        Swal.fire({
          icon: 'error',
          title: 'Reorder Failed',
          text: error?.message || 'Failed to update section order. Changes have been reverted.',
        });
      });
  };

  // ========== MOVE UP/DOWN BUTTONS ==========
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const section = localSections[index];
    if (isBannerSection(section)) {
      Swal.fire({ icon: 'warning', title: 'Cannot Move', text: 'Banner sections cannot be moved.', timer: 1500, showConfirmButton: false });
      return;
    }
    if (section?.is_fixed_section) {
      Swal.fire({ icon: 'warning', title: 'Cannot Move', text: 'Fixed sections cannot be moved.', timer: 1500, showConfirmButton: false });
      return;
    }

    // Simulate drop event
    const dropIndex = index - 1;
    handleDrop(null, dropIndex);
  };

  const handleMoveDown = (index) => {
    if (index === localSections.length - 1) return;
    const section = localSections[index];
    if (isBannerSection(section)) {
      Swal.fire({ icon: 'warning', title: 'Cannot Move', text: 'Banner sections cannot be moved.', timer: 1500, showConfirmButton: false });
      return;
    }
    if (section?.is_fixed_section) {
      Swal.fire({ icon: 'warning', title: 'Cannot Move', text: 'Fixed sections cannot be moved.', timer: 1500, showConfirmButton: false });
      return;
    }

    // Simulate drop event
    const dropIndex = index + 1;
    handleDrop(null, dropIndex);
  };

  // ========== UI HELPERS ==========
  const getComponentLabel = (component) => AVAILABLE_COMPONENTS[component] || component;

  // Get banner sections count
  const bannerCount = localSections.filter(s => isBannerSection(s)).length;

  return (
    <AuthenticatedLayout>
      <Head title={`Sections - ${page.name}`} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100/50 p-6">
        <div className="mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href={route('backend.cms.pages')} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
                  <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" size={14} />
                  <span className="text-sm">Back to Pages</span>
                </Link>
              </div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Sections - {page.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {bannerCount > 0 && <span className="text-blue-600 font-medium">⭐ {bannerCount} banner section{bannerCount > 1 ? 's' : ''} fixed at top • </span>}
                {localSections.length} sections total
                {isReordering && <span className="ml-2 text-blue-600">Saving order...</span>}
                {dragError && <span className="ml-2 text-red-600">{dragError}</span>}
              </p>
            </div>
            {canCreate && (
              <button onClick={handleOpenCreate} className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg">
                <FaPlus size={16} /> Add Section
              </button>
            )}
          </div>

          {/* Sections List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {localSections.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaLayerGroup className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No sections found</h3>
                <p className="text-sm text-gray-500 mt-1">Add a section to start building your page.</p>
                {canCreate && (
                  <button onClick={handleOpenCreate} className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <FaPlus size={14} /> Add Section
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {localSections.map((section, index) => {
                  const isBanner = isBannerSection(section);
                  return (
                    <div
                      key={section.id}
                      className={`p-4 hover:bg-gray-50 transition-all duration-200 ${isReordering ? 'opacity-75' : ''} ${isBanner ? 'bg-linear-to-r from-blue-50/50 to-white border-l-4 border-blue-500' : ''}`}
                      draggable={canEdit && !isBanner && !section.is_fixed_section}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Drag Handle */}
                          {canEdit && !isBanner && !section.is_fixed_section && (
                            <div className="cursor-grab text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors" title="Drag to reorder">
                              <FaGripVertical size={16} />
                            </div>
                          )}
                          {(isBanner || section.is_fixed_section) && (
                            <div className="w-6 text-center" title={isBanner ? "Banner section - always at top" : "Fixed section - cannot be moved"}>
                              {isBanner ? <FaStar className="text-yellow-500" size={14} /> : '🔒'}
                            </div>
                          )}

                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${section.is_enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <FaLayerGroup className={section.is_enabled ? 'text-green-600' : 'text-gray-400'} size={14} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm">{section.section_key}</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                {getComponentLabel(section.component)}
                              </span>
                              {isBanner && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded flex items-center gap-1">
                                  <FaStar size={10} /> Banner
                                </span>
                              )}
                              {!isBanner && section.is_fixed_section && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Fixed</span>
                              )}
                              {section.is_special_component && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Special</span>
                              )}
                              <span className="text-xs text-gray-400">#{index + 1}</span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              Order: {section.display_order} • Data: {section.data_table || 'None'} • Prop: {section.prop_name || 'Default'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Move Up/Down Buttons */}
                          {canEdit && !isBanner && !section.is_fixed_section && (
                            <>
                              <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0 || isReordering}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move Up"
                              >
                                <FaArrowUp size={12} />
                              </button>
                              <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === localSections.length - 1 || isReordering}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move Down"
                              >
                                <FaArrowDown size={12} />
                              </button>
                            </>
                          )}

                          {/* Toggle */}
                          <button
                            onClick={() => handleToggle(section)}
                            disabled={!canEdit || isReordering || isBanner}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${section.is_enabled ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              } ${(!canEdit || isReordering || isBanner) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isBanner ? "Banner sections cannot be disabled" : ""}
                          >
                            {section.is_enabled ? <FaToggleOn size={12} /> : <FaToggleOff size={12} />}
                            {section.is_enabled ? 'On' : 'Off'}
                          </button>

                          {/* Edit */}
                          {canEdit && (
                            <button onClick={() => handleOpenEdit(section)} className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-all duration-200" title="Edit">
                              <FaEdit size={14} />
                            </button>
                          )}

                          {/* Delete */}
                          {canDelete && !isBanner && !section.is_fixed_section && (
                            <button
                              onClick={() => handleDelete(section.id)}
                              disabled={deletingId === section.id}
                              className={`p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-all duration-200 ${deletingId === section.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Delete"
                            >
                              {deletingId === section.id ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reorder Instructions */}
          {localSections.length > 1 && canEdit && (
            <div className="mt-4 text-xs text-gray-400 flex items-center gap-4 flex-wrap">
              <span>⭐ <span className="text-yellow-600 font-medium">Banner sections</span> are automatically fixed at the top</span>
              <span>💡 Drag the <FaGripVertical className="inline text-gray-400" size={12} /> handle to reorder other sections</span>
              <span>Or use <FaArrowUp className="inline text-gray-400" size={10} /> <FaArrowDown className="inline text-gray-400" size={10} /> buttons</span>
              <span>🔒 Fixed sections cannot be moved</span>
            </div>
          )}
        </div>
      </div>

      {/* ========== MODAL ========== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{editingSection ? 'Edit Section' : 'Add Section'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{editingSection ? 'Update section configuration' : 'Configure a new section for this page'}</p>
              </div>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section Key <span className="text-red-500">*</span></label>
                <input type="text" name="section_key" value={formData.section_key} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., banner, about-us" required />
                <p className="text-xs text-gray-400 mt-1">Unique identifier. Use lowercase letters and hyphens.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Component <span className="text-red-500">*</span></label>
                <select name="component" value={formData.component} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                  <option value="">Select a component</option>
                  {Object.entries(AVAILABLE_COMPONENTS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {BANNER_COMPONENTS.includes(value) ? `⭐ ${label}` : label}
                    </option>
                  ))}
                </select>
                {formData.component && BANNER_COMPONENTS.includes(formData.component) && (
                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <FaStar size={10} /> Banner sections are automatically fixed at the top of the page
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Table</label>
                  <input type="text" name="data_table" value={formData.data_table} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., about_content" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Key</label>
                  <input type="text" name="data_key" value={formData.data_key} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prop Name</label>
                  <input type="text" name="prop_name" value={formData.prop_name} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Default: data" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                  <input type="number" name="display_order" value={formData.display_order} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" min="0" />
                  <p className="text-xs text-gray-400 mt-1">Banner sections will be automatically placed first</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'is_enabled', label: 'Enabled', desc: 'Section will be displayed on the page' },
                  { name: 'is_fixed_section', label: 'Fixed Section', desc: 'Section cannot be moved or deleted' },
                  { name: 'is_special_component', label: 'Special Component', desc: 'Component requires special handling' },
                ].map(({ name, label, desc }) => {
                  const isBanner = BANNER_COMPONENTS.includes(formData.component);
                  const isDisabled = name === 'is_fixed_section' && isBanner;
                  return (
                    <div key={name} className={`flex items-center justify-between p-3 rounded-lg ${isDisabled ? 'bg-gray-100 opacity-60' : 'bg-gray-50'}`}>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                        <p className="text-xs text-gray-500">{desc}</p>
                        {isDisabled && (
                          <p className="text-xs text-yellow-600 mt-1">✓ Automatically enabled for banner sections</p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        name={name}
                        checked={formData[name]}
                        onChange={handleChange}
                        disabled={isDisabled}
                        className={`w-5 h-5 ${isDisabled ? 'text-gray-400 border-gray-300' : 'text-blue-600 border-gray-300'} rounded`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md">
                  {isSubmitting && <FaSpinner className="animate-spin" size={16} />}
                  <FaSave size={16} />
                  {editingSection ? (isSubmitting ? 'Updating...' : 'Update Section') : (isSubmitting ? 'Creating...' : 'Create Section')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </AuthenticatedLayout>
  );
}