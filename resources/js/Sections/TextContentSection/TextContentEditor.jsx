// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/TextContentEditor.jsx

import React, { useEffect, useMemo } from 'react';
import { FaFileAlt, FaCog, FaEye } from 'react-icons/fa';
import RichTextEditor from '../../components/editor/RichTextEditor';
import { sanitizeHTML } from '../../utils/sectionHelpers';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { TextField, SelectField } from '../../Shared/SectionEditor/Fields';
import { useSectionEditor } from '../../Shared/SectionEditor/useSectionEditor';

const DEFAULT_DATA = {
  content: { html: '', content: '', text: '' },
  bgColor: 'bg-white',
  paddingY: 'py-10 sm:py-15 md:py-25 lg:py-37.5',
  paddingX: 'px-5 sm:px-10 md:px-20 lg:px-50',
  maxWidth: 'max-w-4xl lg:max-w-6xl',
  sectionId: 'text-content',
  sectionClassName: '',
};

const TextContentEditor = ({ section, hasData, onDataChange }) => {
  const { formData, updateField, isDirty } = useSectionEditor(
    section,
    useMemo(() => DEFAULT_DATA, []),
    onDataChange
  );

  useEffect(() => {
    if (!formData.content) {
      updateField('content', { html: '', content: '', text: '' });
    }
  }, [formData, updateField]);

  const currentHtml =
    formData?.content?.html ||
    formData?.content?.content ||
    formData?.content?.text ||
    '';
  const previewHtml = sanitizeHTML(currentHtml || '');

  const handleHtmlChange = (html) => {
    updateField('content.html', html);
    updateField('content.content', html);
    updateField('content.text', html);
  };

  return (
    <div className="space-y-5">
      {!hasData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No content exists yet. Add text below, then click <strong>Save Changes</strong> to create it.
        </div>
      )}

      <EditorSection icon={FaFileAlt} title="Content" description="Rich text body" tone="blue">
        <div className="text-slate-900 [&_.editor-placeholder]:text-slate-900 [&_.editor-placeholder_*]:text-slate-900">
          <RichTextEditor
            value={currentHtml}
            onChange={handleHtmlChange}
            height="320px"
            placeholder="Write your section content here..."
          />
        </div>
      </EditorSection>

      <EditorSection icon={FaCog} title="Layout" description="Section ID, background, and spacing" tone="emerald">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextField label="Section ID" value={formData.sectionId || ''}
            onChange={(e) => updateField('sectionId', e.target.value)}
            placeholder="text-content" />
          <TextField label="Additional CSS classes" value={formData.sectionClassName || ''}
            onChange={(e) => updateField('sectionClassName', e.target.value)}
            placeholder="optional classes" />
          <SelectField label="Background color" value={formData.bgColor || ''}
            onChange={(e) => updateField('bgColor', e.target.value)}
            options={[
              { value: 'bg-white', label: 'White' },
              { value: 'bg-[#F5F5F5]', label: 'Gray' },
              { value: 'bg-[#F9F9FA]', label: 'Off White' },
            ]} />
          <SelectField label="Max width" value={formData.maxWidth || ''}
            onChange={(e) => updateField('maxWidth', e.target.value)}
            options={[
              { value: 'max-w-3xl', label: 'Narrow' },
              { value: 'max-w-4xl lg:max-w-6xl', label: 'Default' },
              { value: 'max-w-5xl lg:max-w-7xl', label: 'Wide' },
            ]} />
          <SelectField label="Vertical padding" value={formData.paddingY || ''}
            onChange={(e) => updateField('paddingY', e.target.value)}
            options={[
              { value: 'py-5 sm:py-10 md:py-15 lg:py-20', label: 'Small' },
              { value: 'py-10 sm:py-15 md:py-25 lg:py-37.5', label: 'Medium' },
              { value: 'py-15 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
            ]} />
          <SelectField label="Horizontal padding" value={formData.paddingX || ''}
            onChange={(e) => updateField('paddingX', e.target.value)}
            options={[
              { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
              { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
              { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
            ]} />
        </div>
      </EditorSection>

      <EditorSection icon={FaEye} title="Preview" description="Rendered as it will appear on the frontend" tone="violet">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div
            className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600"
            dangerouslySetInnerHTML={{
              __html: previewHtml || '<p class="text-slate-400">No content to preview yet.</p>',
            }}
          />
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
          <span className="block text-slate-400">Anchor</span>
          <span className="font-mono text-slate-700">{formData.sectionId || 'text-content'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Status</span>
          <span className={`font-medium ${isDirty ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isDirty ? 'Unsaved' : 'Saved'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TextContentEditor;