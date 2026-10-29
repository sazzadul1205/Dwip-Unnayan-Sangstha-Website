// resources/js/Sections/BannerSection/PageTagBannerSection/PageTagBannerEditor.jsx

// React
import { useState, useEffect } from 'react';

// Icons
import { FaTrash, FaPlus, FaImage, FaPalette, FaTag } from 'react-icons/fa';

// Shared Components
import ImageUpload from '../../../Shared/SectionEditor/ImageUpload';
import { TextField, SelectField } from '../../../Shared/SectionEditor/Fields';
import { useImageUpload } from '../../../Shared/SectionEditor/useImageUpload';
import EditorSection from '../../../pages/Backend/CMS/Shared/components/EditorSection';

const overlayOptions = [
  { value: 'bg-black/40 lg:bg-black/50', label: 'Light Dark Overlay' },
  { value: 'bg-black/60 lg:bg-black/70', label: 'Medium Dark Overlay' },
  { value: 'bg-black/80 lg:bg-black/90', label: 'Heavy Dark Overlay' },
  { value: 'bg-linear-to-r from-black/85 via-black/10 to-transparent', label: 'Gradient Left to Right' },
  { value: 'bg-linear-to-l from-black/85 via-black/10 to-transparent', label: 'Gradient Right to Left' },
  { value: 'bg-linear-to-t from-black/85 via-black/10 to-transparent', label: 'Gradient Bottom to Top' },
  { value: 'bg-linear-to-b from-black/85 via-black/10 to-transparent', label: 'Gradient Top to Bottom' },
];
const gradientOptions = [
  { value: 'bg-linear-to-r from-black/85 via-black/10 to-transparent', label: 'Left to Right' },
  { value: 'bg-linear-to-l from-black/85 via-black/10 to-transparent', label: 'Right to Left' },
  { value: 'bg-linear-to-t from-black/85 via-black/10 to-transparent', label: 'Bottom to Top' },
  { value: 'bg-linear-to-b from-black/85 via-black/10 to-transparent', label: 'Top to Bottom' },
  { value: '', label: 'None' },
];
const colorOptions = [
  { value: '#009BE2', label: 'Blue' }, { value: '#FF6B6B', label: 'Red' },
  { value: '#4ECDC4', label: 'Teal' }, { value: '#FFE66D', label: 'Yellow' },
  { value: '#6C5CE7', label: 'Purple' }, { value: '#FD79A8', label: 'Pink' },
  { value: '#00B894', label: 'Green' }, { value: '#FDCB6E', label: 'Gold' },
  { value: '#E17055', label: 'Orange' }, { value: '#0984E3', label: 'Dark Blue' },
  { value: '#A29BFE', label: 'Lavender' }, { value: '#55EFC4', label: 'Mint' },
  { value: '#F8A5C2', label: 'Rose' }, { value: '#74B9FF', label: 'Light Blue' },
  { value: '#FF7675', label: 'Coral' },
];

const PageTagBannerEditor = ({ section, hasData, onDataChange }) => {
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);
  const image = useImageUpload(initialData?.background?.src || '');

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

  const addTag = () => {
    const next = { ...formData };
    if (!next.tags) next.tags = [];
    next.tags.push({ label: '', color: '#009BE2' });
    setFormData(next);
  };

  const removeTag = (index) => {
    const next = { ...formData };
    if (next.tags) next.tags.splice(index, 1);
    setFormData(next);
  };

  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No data yet</p>
        <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Save Changes</span> to seed the initial structure</p>
      </div>
    );
  }

  const tags = formData.tags || [];

  return (
    <div className="space-y-5">
      <EditorSection icon={FaImage} title="Background Image" description="Full-bleed banner image" tone="blue">
        <ImageUpload
          label=""
          imageSrc={image.imageSrc}
          onImageChange={(src) => {
            image.handleImageChange(src);
            updateField('background.src', src);
          }}
          onImageRemove={() => {
            image.handleImageRemove();
            updateField('background.src', '');
          }}
          oldImagePath={image.oldImagePath}
          imageChanged={image.imageChanged}
          uploadPath="/storage/Banner/"
        />
        <TextField label="Alt text" value={formData.background?.alt || ''}
          onChange={(e) => updateField('background.alt', e.target.value)}
          placeholder="Alt text for image" />
      </EditorSection>

      <EditorSection icon={FaPalette} title="Overlay Settings" description="Dark overlay and gradient applied over the background" tone="violet">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SelectField label="Dark overlay" value={formData.overlay?.darkOverlay || ''}
            onChange={(e) => updateField('overlay.darkOverlay', e.target.value)}
            options={overlayOptions} />
          <SelectField label="Gradient" value={formData.overlay?.gradient || ''}
            onChange={(e) => updateField('overlay.gradient', e.target.value)}
            options={gradientOptions} />
        </div>
        {formData.overlay?.darkOverlay && (
          <div>
            <div
              className={`h-8 w-full rounded-lg border border-slate-200 ${formData.overlay.darkOverlay}`}
              style={{
                backgroundImage: formData.overlay.darkOverlay.includes('gradient')
                  ? formData.overlay.darkOverlay.replace(/^bg-/, '')
                  : undefined,
                backgroundColor: formData.overlay.darkOverlay.includes('bg-') && !formData.overlay.darkOverlay.includes('gradient')
                  ? formData.overlay.darkOverlay.replace(/^bg-/, '').replace(/\s/g, '')
                  : undefined,
              }}
            />
            <span className="mt-1 block text-[11px] text-slate-400">Preview</span>
          </div>
        )}
      </EditorSection>

      <EditorSection icon={FaTag} title="Banner Content" description="Main title and tags shown over the banner" tone="emerald">
        <TextField label="Tag title" value={formData.tagTitle || ''}
          onChange={(e) => updateField('tagTitle', e.target.value)}
          placeholder="Photo Gallery" />
        {tags.length > 0 && (
          <SelectField label="Active tag" value={formData.activeTag || tags[0]?.label || ''}
            onChange={(e) => updateField('activeTag', e.target.value)}
            options={tags.map((t) => ({ value: t.label, label: t.label || 'Untitled' }))} />
        )}
      </EditorSection>

      <EditorSection
        icon={FaTag}
        title="Tags"
        description={`${tags.length} tag${tags.length === 1 ? '' : 's'}`}
        tone="orange"
        action={
          <button type="button" onClick={addTag}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
            <FaPlus size={10} /> Add tag
          </button>
        }
      >
        {tags.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">No tags yet</p>
            <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Add tag</span> to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tags.map((tag, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                      {index + 1}
                    </span>
                    {tag.label || `Tag ${index + 1}`}
                  </span>
                  <button type="button" onClick={() => removeTag(index)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                    <FaTrash size={11} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <TextField label="Label" value={tag.label || ''}
                    onChange={(e) => updateArrayItem('tags', index, 'label', e.target.value)}
                    placeholder="DUS in action" />
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={tag.color || '#009BE2'}
                        onChange={(e) => updateArrayItem('tags', index, 'color', e.target.value)}
                        className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5" />
                      <select value={tag.color || '#009BE2'}
                        onChange={(e) => updateArrayItem('tags', index, 'color', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60">
                        {colorOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <span className="mr-2 text-[11px] text-slate-400">Preview:</span>
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: tag.color || '#009BE2' }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {tag.label || 'Tag'}
                  </span>
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
          <span className="block text-slate-400">Tags</span>
          <span className="font-medium text-slate-700">{tags.length}</span>
        </div>
      </div>
    </div>
  );
};

export default PageTagBannerEditor;
