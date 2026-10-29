// resources/js/Sections/OurActionSection/OurActionEditor.jsx

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaUpload, FaTimes, FaHands } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { TextField, TextAreaField } from '../../Shared/SectionEditor/Fields';

const CardsEditorActions = ({ section, hasData, onDataChange }) => {
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);
  const [iconChanges, setIconChanges] = useState({});
  const [oldIconPaths, setOldIconPaths] = useState({});
  const [uploadingIcon, setUploadingIcon] = useState({});

  useEffect(() => { onDataChange?.(formData); }, [formData, onDataChange]);

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

  const addItem = () => {
    const next = { ...formData };
    if (!next.actions) next.actions = [];
    const newId = Math.max(0, ...next.actions.map((a) => a.id || 0)) + 1;
    next.actions.push({ id: newId, icon: '', title: '', description: '', alt: '' });
    setFormData(next);
  };

  const removeItem = (index) => {
    const next = { ...formData };
    if (next.actions?.[index]?.icon) {
      setOldIconPaths((p) => ({ ...p, [index]: next.actions[index].icon }));
      setIconChanges((p) => ({ ...p, [index]: true }));
    }
    next.actions.splice(index, 1);
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
    const existing = formData.actions?.[index]?.icon;
    if (existing && !iconChanges[index]) {
      setOldIconPaths((p) => ({ ...p, [index]: existing }));
    }
    setUploadingIcon((p) => ({ ...p, [index]: true }));
    const reader = new FileReader();
    reader.onload = (e) => {
      updateArrayItem('actions', index, 'icon', e.target.result);
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
    const existing = formData.actions?.[index]?.icon;
    if (existing) setOldIconPaths((p) => ({ ...p, [index]: existing }));
    updateArrayItem('actions', index, 'icon', '');
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

  const actions = formData.actions || [];

  return (
    <div className="space-y-5">
      <EditorSection icon={FaHands} title="Section Content" description="Heading and description for the actions grid" tone="blue">
        <TextField label="Title" value={formData.section?.title || ''}
          onChange={(e) => updateField('section.title', e.target.value)}
          placeholder="Our Actions for Social Change" />
        <TextAreaField label="Description" value={formData.section?.description || ''}
          onChange={(e) => updateField('section.description', e.target.value)}
          placeholder="Description of the actions" rows={2} />
      </EditorSection>

      <EditorSection
        icon={FaHands}
        title="Action Items"
        description={`${actions.length} item${actions.length === 1 ? '' : 's'} â€¢ Icon, title, and description`}
        tone="emerald"
        action={
          <button type="button" onClick={addItem}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
            <FaPlus size={10} /> Add item
          </button>
        }
      >
        {actions.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">No action items yet</p>
            <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Add item</span> to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((item, index) => (
              <div key={item.id || index} className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                      {index + 1}
                    </span>
                    {item.title || `Item ${index + 1}`}
                  </span>
                  <button type="button" onClick={() => removeItem(index)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                    <FaTrash size={11} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Icon</label>
                    <div
                      className={`relative rounded-lg border-2 border-dashed p-3 transition ${uploadingIcon[index]
                          ? 'pointer-events-none opacity-60'
                          : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                        }`}
                      onDragEnter={(e) => e.preventDefault()}
                      onDragLeave={(e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      {item.icon ? (
                        <div className="flex items-center gap-3">
                          <img src={item.icon} alt={item.alt || ''}
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
                    <TextField label="Title" value={item.title || ''}
                      onChange={(e) => updateArrayItem('actions', index, 'title', e.target.value)}
                      placeholder="Education" />
                    <TextField label="Description" value={item.description || ''}
                      onChange={(e) => updateArrayItem('actions', index, 'description', e.target.value)}
                      placeholder="Description of the action" />
                    <TextField label="Alt text" value={item.alt || ''}
                      onChange={(e) => updateArrayItem('actions', index, 'alt', e.target.value)}
                      placeholder="Education Icon" />
                  </div>
                </div>
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
          <span className="block text-slate-400">Data key</span>
          <span className="font-mono text-slate-700">{section.data_key || 'â€”'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Items</span>
          <span className="font-medium text-slate-700">{actions.length}</span>
        </div>
      </div>
    </div>
  );
};

export default CardsEditorActions;
