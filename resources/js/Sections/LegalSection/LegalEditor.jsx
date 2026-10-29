// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/LegalEditor.jsx

// React
import { useState, useEffect } from 'react';

// Shared Components
import ImageUpload from '../../Shared/SectionEditor/ImageUpload';
import { TextField, SelectField } from '../../Shared/SectionEditor/Fields';
import { useImageUpload } from '../../Shared/SectionEditor/useImageUpload';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { FaFileAlt, FaImage, FaPalette } from 'react-icons/fa';

const overlayOptions = [
  { value: 'bg-black/30', label: 'Light Dark Overlay' },
  { value: 'bg-black/40', label: 'Medium Dark Overlay' },
  { value: 'bg-black/50', label: 'Standard Dark Overlay' },
  { value: 'bg-black/60', label: 'Dark Overlay' },
  { value: 'bg-black/70', label: 'Heavy Dark Overlay' },
  { value: 'bg-black/80', label: 'Very Heavy Dark Overlay' },
  { value: 'bg-linear-to-r from-black/85 via-black/10 to-transparent', label: 'Gradient Left to Right' },
  { value: 'bg-linear-to-l from-black/85 via-black/10 to-transparent', label: 'Gradient Right to Left' },
];

const LegalEditor = ({ section, hasData, onDataChange }) => {
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
      <EditorSection icon={FaImage} title="Background Image" description="Full-bleed background image" tone="blue">
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
          uploadPath="/storage/AboutUs/"
        />
        <TextField label="Alt text" value={formData.background?.alt || ''}
          onChange={(e) => updateField('background.alt', e.target.value)}
          placeholder="Alt text for image" />
      </EditorSection>

      <EditorSection icon={FaPalette} title="Overlay" description="Dark overlay on the background" tone="violet">
        <SelectField label="Dark overlay" value={formData.overlay?.darkOverlay || ''}
          onChange={(e) => updateField('overlay.darkOverlay', e.target.value)}
          options={overlayOptions} />
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

      <EditorSection icon={FaFileAlt} title="Text Box" description="Title lines and call-to-action button" tone="emerald">
        <TextField label="Title line 1" value={formData.textBox?.title || ''}
          onChange={(e) => updateField('textBox.title', e.target.value)}
          placeholder="Legal Status and Org." />
        <TextField label="Title line 2" value={formData.textBox?.titleLine2 || ''}
          onChange={(e) => updateField('textBox.titleLine2', e.target.value)}
          placeholder="Affiliations" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextField label="Button text" value={formData.textBox?.buttonText || ''}
            onChange={(e) => updateField('textBox.buttonText', e.target.value)}
            placeholder="Learn More Affiliations" />
          <TextField label="Button link" value={formData.textBox?.buttonLink || ''}
            onChange={(e) => updateField('textBox.buttonLink', e.target.value)}
            placeholder="/about/legal-affiliations" />
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

export default LegalEditor;