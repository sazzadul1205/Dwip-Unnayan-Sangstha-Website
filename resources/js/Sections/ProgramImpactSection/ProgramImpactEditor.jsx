// resources/js/Sections/ProgramImpactSection/ProgramImpactEditor.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { FaTrash, FaPlus, FaUpload, FaTimes, FaImages, FaChartBar } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { TextField } from '../../Shared/SectionEditor/Fields';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ProgramImpactEditor = ({ section, hasData, onDataChange }) => {
  const getInitialData = useCallback(() => {
    const data = section?.data?.data || section?.data || {};
    return {
      section: { title: '', mainImage: { images: [] } },
      sdgImages: [],
      ...data,
    };
  }, [section]);

  const [formData, setFormData] = useState(getInitialData);
  const [isDirty, setIsDirty] = useState(false);
  const [imageChanges, setImageChanges] = useState({ main: {}, sdg: {} });
  const [oldImagePaths, setOldImagePaths] = useState({ main: {}, sdg: {} });
  const [uploadingImages, setUploadingImages] = useState({ main: {}, sdg: {} });

  useEffect(() => {
    setFormData(getInitialData());
      setIsDirty(false);
      setImageChanges({ main: {}, sdg: {} });
      setOldImagePaths({ main: {}, sdg: {} });
      setUploadingImages({ main: {}, sdg: {} });
  }, [section, getInitialData]);

  useEffect(() => {
    if (isDirty) {
      onDataChange?.({
        ...formData,
        _oldImagePaths: oldImagePaths,
        _imageChanges: imageChanges,
      });
    }
  }, [formData, isDirty, oldImagePaths, imageChanges, onDataChange]);

  const updateField = (path, value) => {
    const keys = path.split('.');
    setFormData((prev) => {
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
    setIsDirty(true);
  };

  const updateArrayItem = (path, index, field, value) => {
    const keys = path.split('.');
    setFormData((prev) => {
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length; i++) {
        if (i === keys.length - 1) {
          if (!cur[keys[i]]) cur[keys[i]] = [];
          if (!cur[keys[i]][index]) cur[keys[i]][index] = {};
          if (field === '') cur[keys[i]][index] = value;
          else cur[keys[i]][index][field] = value;
        } else {
          if (!cur[keys[i]]) cur[keys[i]] = {};
          cur = cur[keys[i]];
        }
      }
      return next;
    });
    setIsDirty(true);
  };

  const addSdg = () => {
    setFormData((prev) => {
      const next = { ...prev };
      if (!next.sdgImages) next.sdgImages = [];
      const newId = Math.max(0, ...next.sdgImages.map((i) => i.id || 0)) + 1;
      next.sdgImages.push({ id: newId, src: '', alt: '' });
      return next;
    });
    setIsDirty(true);
  };

  const removeSdg = (index) => {
    setFormData((prev) => {
      const next = { ...prev };
      if (Array.isArray(next.sdgImages)) next.sdgImages.splice(index, 1);
      return next;
    });
    setIsDirty(true);
  };

  const validate = (file) => {
    if (!file.type.startsWith('image/')) return 'Please select an image.';
    if (file.size > MAX_IMAGE_SIZE) return `Max ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`;
    return null;
  };

  const processImage = (file, type, index, updateFn) => {
    const err = validate(file);
    if (err) {
      Swal.fire({ icon: 'error', title: 'Invalid file', text: err, confirmButtonColor: '#3b82f6' });
      return;
    }
    if (type === 'main') {
      const items = formData.section?.mainImage?.images || [];
      if (items[index] && !imageChanges.main[index]) {
        setOldImagePaths((p) => ({ ...p, main: { ...p.main, [index]: items[index] } }));
        setImageChanges((p) => ({ ...p, main: { ...p.main, [index]: true } }));
      }
    } else if (type === 'sdg') {
      const items = formData.sdgImages || [];
      if (items[index]?.src && !imageChanges.sdg[index]) {
        setOldImagePaths((p) => ({ ...p, sdg: { ...p.sdg, [index]: items[index].src } }));
        setImageChanges((p) => ({ ...p, sdg: { ...p.sdg, [index]: true } }));
      }
    }
    setUploadingImages((p) => ({ ...p, [type]: { ...p[type], [index]: true } }));
    const reader = new FileReader();
    reader.onload = (e) => {
      updateFn(e.target.result);
      setUploadingImages((p) => ({ ...p, [type]: { ...p[type], [index]: false } }));
    };
    reader.onerror = () => {
      setUploadingImages((p) => ({ ...p, [type]: { ...p[type], [index]: false } }));
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to read image.', confirmButtonColor: '#3b82f6' });
    };
    reader.readAsDataURL(file);
  };

  const handleMainDrop = (e, i) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file, 'main', i, (url) => {
      const arr = [...(formData.section?.mainImage?.images || [])];
      arr[i] = url;
      updateField('section.mainImage.images', arr);
    });
  };

  const handleMainSelect = (e, i) => {
    const file = e.target.files?.[0];
    if (file) processImage(file, 'main', i, (url) => {
      const arr = [...(formData.section?.mainImage?.images || [])];
      arr[i] = url;
      updateField('section.mainImage.images', arr);
    });
    e.target.value = '';
  };

  const removeMainImage = (i) => {
    const items = formData.section?.mainImage?.images || [];
    if (items[i]) {
      setOldImagePaths((p) => ({ ...p, main: { ...p.main, [i]: items[i] } }));
      setImageChanges((p) => ({ ...p, main: { ...p.main, [i]: true } }));
    }
    updateField('section.mainImage.images', items.filter((_, idx) => idx !== i));
  };

  const handleSdgDrop = (e, i) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file, 'sdg', i, (url) => updateArrayItem('sdgImages', i, 'src', url));
  };

  const handleSdgSelect = (e, i) => {
    const file = e.target.files?.[0];
    if (file) processImage(file, 'sdg', i, (url) => updateArrayItem('sdgImages', i, 'src', url));
    e.target.value = '';
  };

  const removeSdgImage = (i) => {
    const items = formData.sdgImages || [];
    if (items[i]?.src) {
      setOldImagePaths((p) => ({ ...p, sdg: { ...p.sdg, [i]: items[i].src } }));
      setImageChanges((p) => ({ ...p, sdg: { ...p.sdg, [i]: true } }));
    }
    removeSdg(i);
  };

  const displayPath = (src) => {
    if (!src) return '';
    if (src.startsWith('data:image')) return 'New image (pending upload)';
    return src.length > 45 ? `${src.substring(0, 45)}â€¦` : src;
  };

  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No data yet</p>
        <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Save Changes</span> to seed the initial structure</p>
      </div>
    );
  }

  const mainImages = formData.section?.mainImage?.images || [];
  const sdgImages = formData.sdgImages || [];

  return (
    <div className="space-y-5">
      {isDirty && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Unsaved changes â€” click <strong className="mx-0.5">Save Changes</strong> to apply.
        </div>
      )}

      <EditorSection icon={FaChartBar} title="Section Content" description="Heading above the impact images" tone="blue">
        <TextField label="Title" value={formData.section?.title || ''}
          onChange={(e) => updateField('section.title', e.target.value)}
          placeholder="Program Impact and SDGs" />
      </EditorSection>

      <EditorSection
        icon={FaImages}
        title="Main Images"
        description={`${mainImages.length} image${mainImages.length === 1 ? '' : 's'} â€¢ Displayed prominently`}
        tone="emerald"
      >
        {mainImages.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-6 text-center">
            <p className="text-sm text-slate-500">No main images yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {mainImages.map((image, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-2">
                <div
                  className={`relative rounded-lg border-2 border-dashed p-1 transition ${uploadingImages.main[index] ? 'pointer-events-none opacity-60' : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                    }`}
                  onDragEnter={(e) => e.preventDefault()}
                  onDragLeave={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleMainDrop(e, index)}
                >
                  {image ? (
                    <div className="relative">
                      <img src={image} alt="" className="h-20 w-full rounded-md object-cover" />
                      <button type="button" onClick={() => removeMainImage(index)}
                        className="absolute right-1 top-1 rounded bg-red-500 p-1 text-white hover:bg-red-600">
                        <FaTimes size={9} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                      <FaUpload size={16} />
                      <span className="mt-1 text-[10px]">Drop or click</span>
                    </div>
                  )}
                  <input type="file" accept="image/*"
                    onChange={(e) => handleMainSelect(e, index)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    disabled={uploadingImages.main[index]} />
                </div>
                <span className="mt-1 block truncate text-[10px] text-slate-400">
                  {displayPath(image) || 'No image'}
                </span>
              </div>
            ))}
          </div>
        )}
      </EditorSection>

      <EditorSection
        icon={FaImages}
        title="SDG Images"
        description={`${sdgImages.length} SDG image${sdgImages.length === 1 ? '' : 's'}`}
        tone="orange"
        action={
          <button type="button" onClick={addSdg}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
            <FaPlus size={10} /> Add SDG
          </button>
        }
      >
        {sdgImages.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-6 text-center">
            <p className="text-sm text-slate-500">No SDG images yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {sdgImages.map((sdg, index) => (
              <div key={sdg.id || index} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">SDG #{index + 1}</span>
                  <button type="button" onClick={() => removeSdgImage(index)}
                    className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                    <FaTrash size={10} />
                  </button>
                </div>
                <div
                  className={`relative rounded-lg border-2 border-dashed p-1 transition ${uploadingImages.sdg[index] ? 'pointer-events-none opacity-60' : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                    }`}
                  onDragEnter={(e) => e.preventDefault()}
                  onDragLeave={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleSdgDrop(e, index)}
                >
                  {sdg.src ? (
                    <div className="relative">
                      <img src={sdg.src} alt={sdg.alt || ''} className="h-20 w-full rounded-md object-cover" />
                      <button type="button"
                        onClick={() => {
                          if (sdg.src) {
                            setOldImagePaths((p) => ({ ...p, sdg: { ...p.sdg, [index]: sdg.src } }));
                            setImageChanges((p) => ({ ...p, sdg: { ...p.sdg, [index]: true } }));
                          }
                          updateArrayItem('sdgImages', index, 'src', '');
                        }}
                        className="absolute right-1 top-1 rounded bg-red-500 p-1 text-white hover:bg-red-600">
                        <FaTimes size={9} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                      <FaUpload size={16} />
                      <span className="mt-1 text-[10px]">Drop or click</span>
                    </div>
                  )}
                  <input type="file" accept="image/*"
                    onChange={(e) => handleSdgSelect(e, index)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    disabled={uploadingImages.sdg[index]} />
                </div>
                <TextField label="Alt text" value={sdg.alt || ''}
                  onChange={(e) => updateArrayItem('sdgImages', index, 'alt', e.target.value)}
                  placeholder="No Poverty"
                  className="mt-2" />
              </div>
            ))}
          </div>
        )}
      </EditorSection>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs md:grid-cols-4">
        <div>
          <span className="block text-slate-400">Section ID</span>
          <span className="font-mono text-slate-700">{section.id}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data table</span>
          <span className="font-mono text-slate-700">{section.data_table || 'â€”'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Main images</span>
          <span className="font-medium text-slate-700">{mainImages.length}</span>
        </div>
        <div>
          <span className="block text-slate-400">SDG images</span>
          <span className="font-medium text-slate-700">{sdgImages.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgramImpactEditor;
