// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/PageBannerEditor.jsx

import { useState, useEffect } from 'react';

// Shared Components
import ImageUpload from '../../../Shared/SectionEditor/ImageUpload';
import { TextField, SelectField } from '../../../Shared/SectionEditor/Fields';
import { useImageUpload } from '../../../Shared/SectionEditor/useImageUpload';
import EditorSection from '../../../pages/Backend/CMS/Shared/components/EditorSection';
import { FaFileAlt, FaImage, FaPalette } from 'react-icons/fa';

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

const PageBannerEditor = ({ section, hasData, onDataChange }) => {
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

  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No data yet</p>
        <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Save Changes</span> to seed the initial structure</p>
      </div>
    );
  }

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

      <EditorSection icon={FaFileAlt} title="Content" description="Title and description shown over the banner" tone="emerald">
        <div>
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Title</h5>
          <div className="space-y-2">
            <TextField label="Text" value={formData.content?.title?.text || ''}
              onChange={(e) => updateField('content.title.text', e.target.value)}
              placeholder="About Us" />
            <TextField label="Class name" value={formData.content?.title?.className || 'font-bold leading-tight'}
              onChange={(e) => updateField('content.title.className', e.target.value)}
              placeholder="CSS classes" />
          </div>
        </div>
        <div>
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</h5>
          <div className="space-y-2">
            <TextField label="Text" value={formData.content?.description?.text || ''}
              onChange={(e) => updateField('content.description.text', e.target.value)}
              placeholder="Our mission is to help…" />
            <TextField label="Class name" value={formData.content?.description?.className || 'font-normal leading-tight'}
              onChange={(e) => updateField('content.description.className', e.target.value)}
              placeholder="CSS classes" />
          </div>
        </div>
      </EditorSection>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs md:grid-cols-4">
        <div>
          <span className="block text-slate-400">Section ID</span>
          <span className="font-mono text-slate-700">{section.id}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data table</span>
          <span className="font-mono text-slate-700">{section.data_table || '—'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data key</span>
          <span className="font-mono text-slate-700">{section.data_key || '—'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Status</span>
          <span className={`font-medium ${hasData ? 'text-emerald-600' : 'text-slate-400'}`}>
            {hasData ? 'Has data' : 'Empty'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PageBannerEditor;