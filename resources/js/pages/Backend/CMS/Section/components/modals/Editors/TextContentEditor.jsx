// resources/js/pages/Backend/CMS/Section/components/modals/Editors/TextContentEditor.jsx

import React, { useEffect, useMemo } from 'react';
import RichTextEditor from '../../../../../../../components/RichTextEditor/RichTextEditor';
import { sanitizeHTML } from '../../../../../../../utils/sectionHelpers';
import { TextField, SelectField } from './shared/Fields';
import { useSectionEditor } from './shared/useSectionEditor';

const TextContentEditor = ({ section, hasData, onDataChange }) => {
  const {
    formData,
    updateField,
    isDirty,
  } = useSectionEditor(section, useMemo(() => ({
    content: {
      html: '',
      content: '',
      text: '',
    },
    bgColor: 'bg-white',
    paddingY: 'py-10 sm:py-15 md:py-25 lg:py-37.5',
    paddingX: 'px-5 sm:px-10 md:px-20 lg:px-50',
    maxWidth: 'max-w-4xl lg:max-w-6xl',
    sectionId: 'text-content',
    sectionClassName: '',
  }), []), onDataChange);

  useEffect(() => {
    if (!formData.content) {
      updateField('content', {
        html: '',
        content: '',
        text: '',
      });
    }
  }, [formData, updateField]);

  const currentHtml = formData?.content?.html || formData?.content?.content || formData?.content?.text || '';
  const previewHtml = sanitizeHTML(currentHtml || '');

  const handleHtmlChange = (html) => {
    updateField('content.html', html);
    updateField('content.content', html);
    updateField('content.text', html);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Edit Text Content Section</h3>
          <p className="text-xs text-gray-400 mt-0.5">Edit rich text content and layout settings for this section.</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDirty ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {isDirty ? 'Unsaved changes' : 'Saved'}
        </span>
      </div>

      {!hasData && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          No content exists yet. Add text below, then click "Save Changes" to create it.
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Content</label>
          <div className="text-black [&_.editor-placeholder]:text-black [&_.editor-placeholder_*]:text-black">
            <RichTextEditor
              value={currentHtml}
              onChange={handleHtmlChange}
              height="320px"
              placeholder="Write your section content here..."
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-700">Preview</h4>
            <p className="text-xs text-gray-400">TextContentSection</p>
          </div>
          <span className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
            {formData.sectionId || 'text-content'}
          </span>
        </div>
        <div
          className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600"
          dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-gray-400">No content to preview yet.</p>' }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField
          label="Section ID"
          value={formData.sectionId || ''}
          onChange={(e) => updateField('sectionId', e.target.value)}
          placeholder="text-content"
        />
        <TextField
          label="Additional CSS Classes"
          value={formData.sectionClassName || ''}
          onChange={(e) => updateField('sectionClassName', e.target.value)}
          placeholder="optional classes"
        />
        <SelectField
          label="Background Color"
          value={formData.bgColor || ''}
          onChange={(e) => updateField('bgColor', e.target.value)}
          options={[
            { value: 'bg-white', label: 'White' },
            { value: 'bg-[#F5F5F5]', label: 'Gray' },
            { value: 'bg-[#F9F9FA]', label: 'Off White' },
          ]}
        />
        <SelectField
          label="Max Width"
          value={formData.maxWidth || ''}
          onChange={(e) => updateField('maxWidth', e.target.value)}
          options={[
            { value: 'max-w-3xl', label: 'Narrow' },
            { value: 'max-w-4xl lg:max-w-6xl', label: 'Default' },
            { value: 'max-w-5xl lg:max-w-7xl', label: 'Wide' },
          ]}
        />
        <SelectField
          label="Vertical Padding"
          value={formData.paddingY || ''}
          onChange={(e) => updateField('paddingY', e.target.value)}
          options={[
            { value: 'py-5 sm:py-10 md:py-15 lg:py-20', label: 'Small' },
            { value: 'py-10 sm:py-15 md:py-25 lg:py-37.5', label: 'Medium' },
            { value: 'py-15 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
          ]}
        />
        <SelectField
          label="Horizontal Padding"
          value={formData.paddingX || ''}
          onChange={(e) => updateField('paddingX', e.target.value)}
          options={[
            { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
            { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
            { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
          ]}
        />
      </div>
    </div>
  );
};

export default TextContentEditor;
