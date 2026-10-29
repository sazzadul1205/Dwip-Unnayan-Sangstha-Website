// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/WhereWeWorkEditor.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { FaTrash, FaPlus, FaUpload, FaTimes, FaMapMarkedAlt, FaChartBar, FaImage } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { TextField } from '../../Shared/SectionEditor/Fields';
import ImageUpload from '../../Shared/SectionEditor/ImageUpload';
import { useImageUpload } from '../../Shared/SectionEditor/useImageUpload';

const labelClass = 'block text-xs font-medium text-slate-500 mb-1';

const normalizeSectionData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const normalizedData = { ...data };
  normalizedData.section = data.section && typeof data.section === 'object' ? data.section : {};
  normalizedData.image = data.image && typeof data.image === 'object' ? data.image : {};
  if (Array.isArray(data.stats)) {
    normalizedData.stats = data.stats.filter(Boolean).map((s) => (s && typeof s === 'object' ? s : {}));
  } else if (data.stats && typeof data.stats === 'object') {
    normalizedData.stats = [data.stats];
  } else {
    normalizedData.stats = [];
  }
  return normalizedData;
};

const WhereWeWorkEditor = ({ section, hasData, onDataChange }) => {
  const initialData = useMemo(
    () => normalizeSectionData(section?.data?.data || section?.data || {}),
    [section?.data]
  );
  const [formData, setFormData] = useState(initialData);
  const image = useImageUpload(initialData?.image?.src || '');

  const [iconChanges, setIconChanges] = useState({});
  const [oldIconPaths, setOldIconPaths] = useState({});
  const [uploadingIcon, setUploadingIcon] = useState({});

  useEffect(() => { onDataChange?.(formData); }, [formData, onDataChange]);
  useEffect(() => { setFormData(initialData); }, [initialData]);

  const updateField = (path, value) => {
    const keys = path.split('.');
    const next = { ...formData };
    let cur = next;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
    setFormData(next);
  };

  const updateArrayItem = (path, index, field, value) => {
    const keys = path.split('.');
    const next = { ...formData };
    let cur = next;
    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        if (!cur[keys[i]]) cur[keys[i]] = [];
        if (!cur[keys[i]][index]) cur[keys[i]][index] = {};
        cur[keys[i]][index] = { ...cur[keys[i]][index], [field]: value };
      } else {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
    }
    setFormData(next);
  };

  const addStat = () => {
    const next = { ...formData };
    if (!Array.isArray(next.stats)) next.stats = [];
    const newId = Math.max(0, ...next.stats.map((s) => s.id || 0)) + 1;
    next.stats.push({ id: newId, icon: '', value: '', label: '', alt: '' });
    setFormData(next);
  };

  const removeStat = (index) => {
    const next = { ...formData };
    const item = Array.isArray(next.stats) ? next.stats[index] : null;
    if (item?.icon) {
      setOldIconPaths((p) => ({ ...p, [index]: item.icon }));
      setIconChanges((p) => ({ ...p, [index]: true }));
    }
    if (Array.isArray(next.stats)) next.stats.splice(index, 1);
    setFormData(next);
  };

  const processIcon = (file, index) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Please select an image.', confirmButtonColor: '#3b82f6' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ icon: 'error', title: 'File too large', text: 'Max 2MB.', confirmButtonColor: '#3b82f6' });
      return;
    }
    const items = Array.isArray(formData?.stats) ? formData.stats : [];
    if (items[index]?.icon && !iconChanges[index]) {
      setOldIconPaths((p) => ({ ...p, [index]: items[index].icon }));
    }
    setUploadingIcon((p) => ({ ...p, [index]: true }));
    const reader = new FileReader();
    reader.onload = (e) => {
      updateArrayItem('stats', index, 'icon', e.target.result);
      setIconChanges((p) => ({ ...p, [index]: true }));
      setUploadingIcon((p) => ({ ...p, [index]: false }));
    };
    reader.onerror = () => {
      setUploadingIcon((p) => ({ ...p, [index]: false }));
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to read icon.', confirmButtonColor: '#3b82f6' });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e, i) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processIcon(file, i);
  };

  const handleSelect = (e, i) => {
    const file = e.target.files?.[0];
    if (file) processIcon(file, i);
    e.target.value = '';
  };

  const removeIcon = (index) => {
    const items = Array.isArray(formData?.stats) ? formData.stats : [];
    if (items[index]?.icon) setOldIconPaths((p) => ({ ...p, [index]: items[index].icon }));
    updateArrayItem('stats', index, 'icon', '');
    setIconChanges((p) => ({ ...p, [index]: true }));
  };

  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No data yet</p>
        <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Save Changes</span> to seed the initial structure</p>
      </div>
    );
  }

  const stats = Array.isArray(formData?.stats) ? formData.stats.filter(Boolean) : [];

  return (
    <div className="space-y-5">
      <EditorSection icon={FaMapMarkedAlt} title="Section Content" description="Heading shown above the map" tone="blue">
        <TextField label="Title" value={formData.section?.title || ''}
          onChange={(e) => updateField('section.title', e.target.value)}
          placeholder="Where We Work" />
      </EditorSection>

      <EditorSection
        icon={FaChartBar}
        title="Statistics"
        description={`${stats.length} stat${stats.length === 1 ? '' : 's'} • Icon, value, and label`}
        tone="emerald"
        action={
          <button type="button" onClick={addStat}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
            <FaPlus size={10} /> Add stat
          </button>
        }
      >
        {stats.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">No statistics yet</p>
            <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Add stat</span> to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((stat, index) => (
              <div key={stat.id || index} className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                      {index + 1}
                    </span>
                    {stat.label || `Stat ${index + 1}`}
                  </span>
                  <button type="button" onClick={() => removeStat(index)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                    <FaTrash size={11} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Icon</label>
                    <div
                      className={`relative rounded-lg border-2 border-dashed p-3 transition ${uploadingIcon[index] ? 'pointer-events-none opacity-60' : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                        }`}
                      onDragEnter={(e) => e.preventDefault()}
                      onDragLeave={(e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      {stat.icon ? (
                        <div className="flex items-center gap-3">
                          <img src={stat.icon} alt={stat.alt || ''}
                            className="h-12 w-12 shrink-0 rounded-md border border-slate-200 object-contain" />
                          <span className="flex-1 truncate text-xs text-slate-500">Icon uploaded</span>
                          <button type="button" onClick={() => removeIcon(index)}
                            className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                            <FaTimes size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-1 text-slate-400">
                          <FaUpload size={14} />
                          <span className="text-xs">Drop icon or click to browse</span>
                        </div>
                      )}
                      <input type="file" accept="image/*"
                        onChange={(e) => handleSelect(e, index)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        disabled={uploadingIcon[index]} />
                    </div>
                    {iconChanges[index] && oldIconPaths[index] && (
                      <p className="mt-1 text-[11px] text-red-500">Old icon will be deleted on save</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <TextField label="Value" value={stat.value || ''}
                      onChange={(e) => updateArrayItem('stats', index, 'value', e.target.value)}
                      placeholder="450K" />
                    <TextField label="Label" value={stat.label || ''}
                      onChange={(e) => updateArrayItem('stats', index, 'label', e.target.value)}
                      placeholder="Total Member Reach" />
                    <TextField label="Alt text" value={stat.alt || ''}
                      onChange={(e) => updateArrayItem('stats', index, 'alt', e.target.value)}
                      placeholder="Member Reach Icon" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorSection>

      <EditorSection icon={FaImage} title="Map Image" description="Large visual shown beside the statistics" tone="violet">
        <ImageUpload
          label=""
          imageSrc={image.imageSrc}
          onImageChange={(src) => {
            image.handleImageChange(src);
            updateField('image.src', src);
          }}
          onImageRemove={() => {
            image.handleImageRemove();
            updateField('image.src', '');
          }}
          oldImagePath={image.oldImagePath}
          imageChanged={image.imageChanged}
          uploadPath="/storage/WhereWeWork/"
          className="h-20 w-24 rounded-lg object-cover ring-1 ring-slate-200"
        />
        <TextField label="Image alt text" value={formData.image?.alt || ''}
          onChange={(e) => updateField('image.alt', e.target.value)}
          placeholder="Map Placeholder Text" />
        <TextField label="Image class name" value={formData.image?.className || ''}
          onChange={(e) => updateField('image.className', e.target.value)}
          placeholder="w-full h-232.5 object-cover rounded-4xl" />
      </EditorSection>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs md:grid-cols-4">
        <div>
          <span className="block text-slate-400">Section ID</span>
          <span className="font-mono text-slate-700">{section?.id || 'N/A'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data table</span>
          <span className="font-mono text-slate-700">{section?.data_table || '—'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data key</span>
          <span className="font-mono text-slate-700">{section?.data_key || '—'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Stats</span>
          <span className="font-medium text-slate-700">{stats.length}</span>
        </div>
      </div>
    </div>
  );
};

export default WhereWeWorkEditor;