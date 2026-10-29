// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/ContactReachEditor.jsx

import { useState, useEffect } from 'react';
import { FaImage, FaInfoCircle } from 'react-icons/fa';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { TextField } from '../../Shared/SectionEditor/Fields';
import ImageUpload from '../../Shared/SectionEditor/ImageUpload';
import { useImageUpload } from '../../Shared/SectionEditor/useImageUpload';

const ContactReachEditor = ({ section, hasData, onDataChange }) => {
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);
  const image = useImageUpload(initialData?.image || '');

  useEffect(() => { onDataChange?.(formData); }, [formData, onDataChange]);

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

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
      <EditorSection icon={FaImage} title="Image" description="Supporting image shown beside the contact form" tone="blue">
        <ImageUpload
          label=""
          imageSrc={image.imageSrc}
          onImageChange={(src) => {
            image.handleImageChange(src);
            updateField('image', src);
          }}
          onImageRemove={() => {
            image.handleImageRemove();
            updateField('image', '');
          }}
          oldImagePath={image.oldImagePath}
          imageChanged={image.imageChanged}
          uploadPath="/storage/ContactUs/"
          className="h-20 w-24 rounded-lg object-cover ring-1 ring-slate-200"
        />
      </EditorSection>

      <EditorSection icon={FaInfoCircle} title="Content" description="Title and submit-button text" tone="emerald">
        <TextField label="Title" value={formData.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Reach out to us today!" />
        <TextField label="Button text" value={formData.buttonText || ''}
          onChange={(e) => updateField('buttonText', e.target.value)}
          placeholder="Submit Message" />
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

export default ContactReachEditor;