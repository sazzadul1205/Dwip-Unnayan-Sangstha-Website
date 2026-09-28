// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/HtmlCssEditor.jsx

import React, { useState } from 'react';
import { FaCode, FaEye, FaMagic } from 'react-icons/fa';
import { TextField, SelectField } from './shared/Fields';
import { useSectionEditor } from './shared/useSectionEditor';
import HtmlCssSection from '../../../../../../../Sections/HtmlCssSection/HtmlCssSection';

// ============================================
// STARTER SNIPPET ("Load example" button)
// ============================================
const EXAMPLE_HTML = `<div class="dus-feature">
  <h2>Built with plain HTML &amp; CSS</h2>
  <p>Tailwind classes are ignored here – every style comes from the CSS box.</p>
  <a class="dus-feature__cta" href="/contact">Get in touch</a>
</div>`;

const EXAMPLE_CSS = `.dus-feature {
  padding: 32px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a, #1e3a8a);
  color: #ffffff;
}

.dus-feature h2 {
  font-size: 30px;
  line-height: 1.2;
  margin: 0 0 12px;
}

.dus-feature p {
  margin: 0 0 20px;
  color: #cbd5f5;
}

.dus-feature__cta {
  display: inline-block;
  padding: 12px 22px;
  border-radius: 999px;
  background: #009be2;
  color: #ffffff;
  text-decoration: none;
}`;

const DEFAULT_DATA = {
  html: '',
  css: '',
  scopeCss: true,
  bgColor: '',
  paddingY: '',
  paddingX: '',
  sectionId: 'custom-html',
  sectionClassName: '',
};

const CODE_AREA_CLASS =
  'w-full px-3 py-2 text-xs font-mono leading-relaxed border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y';

const HtmlCssEditor = ({ section, hasData, onDataChange }) => {
  const { formData, updateField, isDirty } = useSectionEditor(section, DEFAULT_DATA, onDataChange);
  const [previewKey, setPreviewKey] = useState(0);

  const html = typeof formData.html === 'string' ? formData.html : '';
  const css = typeof formData.css === 'string' ? formData.css : '';
  const isEmpty = html.trim() === '' && css.trim() === '';

  const handleInsertExample = () => {
    updateField('html', EXAMPLE_HTML);
    updateField('css', EXAMPLE_CSS);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <FaCode className="text-blue-600 mt-0.5" size={16} />
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Edit HTML / CSS Section</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Tailwind utility classes do <strong>not</strong> apply here — the HTML is styled by the CSS you write
              below.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInsertExample}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition"
            title="Replace the boxes with a small starter snippet"
          >
            <FaMagic size={11} />
            Load example
          </button>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              isDirty ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {isDirty ? 'Unsaved changes' : 'Saved'}
          </span>
        </div>
      </div>

      {!hasData && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          No content exists yet. Paste your HTML and CSS below, then click "Save Changes" to create it.
        </div>
      )}

      {/* ===== CODE BOXES ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs text-gray-400">HTML</label>
            <span className="text-[10px] text-gray-400">{html.length} chars</span>
          </div>
          <textarea
            value={html}
            onChange={(e) => updateField('html', e.target.value)}
            rows={14}
            spellCheck={false}
            placeholder={'<div class="my-card">\n  <h2>Hello world</h2>\n  <p>Write your own markup.</p>\n</div>'}
            className={CODE_AREA_CLASS}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs text-gray-400">CSS</label>
            <span className="text-[10px] text-gray-400">{css.length} chars</span>
          </div>
          <textarea
            value={css}
            onChange={(e) => updateField('css', e.target.value)}
            rows={14}
            spellCheck={false}
            placeholder={'.my-card {\n  padding: 24px;\n  border-radius: 16px;\n  background: #f8fafc;\n}'}
            className={CODE_AREA_CLASS}
          />
        </div>
      </div>

      {/* ===== CSS SCOPING ===== */}
      <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.scopeCss !== false}
          onChange={(e) => updateField('scopeCss', e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span className="text-xs text-gray-600 leading-relaxed">
          <strong className="text-gray-700">Scope CSS to this section</strong> (recommended). Every rule is prefixed
          with this section's wrapper, so <code className="bg-white px-1 rounded border border-gray-200">h1 {'{'} … {'}'}</code>{' '}
          only affects this section. Turn it off to write fully global CSS.
        </span>
      </label>

      {/* ===== LAYOUT SETTINGS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField
          label="Section ID (anchor)"
          value={formData.sectionId || ''}
          onChange={(e) => updateField('sectionId', e.target.value)}
          placeholder="custom-html"
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
            { value: 'bg-transparent', label: 'Transparent' },
            { value: 'bg-white', label: 'White' },
            { value: 'bg-[#F5F5F5]', label: 'Gray' },
            { value: 'bg-[#F9F9FA]', label: 'Off White' },
          ]}
        />
        <SelectField
          label="Vertical Padding"
          value={formData.paddingY || ''}
          onChange={(e) => updateField('paddingY', e.target.value)}
          options={[
            { value: '', label: 'None' },
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
            { value: '', label: 'None' },
            { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
            { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
            { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
          ]}
        />
      </div>

      {/* ===== LIVE PREVIEW ===== */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <FaEye className="text-gray-500" size={13} />
            <h4 className="text-sm font-semibold text-gray-700">Live preview</h4>
            <p className="text-xs text-gray-400">Rendered with the exact same scoping used on the website</p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewKey((prev) => prev + 1)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh preview
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          {isEmpty ? (
            <p className="p-6 text-sm text-gray-400 text-center">Nothing to preview yet — add HTML and CSS above.</p>
          ) : (
            <HtmlCssSection key={previewKey} data={formData} />
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-400">
        Tip: <code className="bg-gray-100 px-1 rounded">&lt;script&gt;</code> tags and inline event handlers are
        stripped for safety, and <code className="bg-gray-100 px-1 rounded">&lt;style&gt;</code> tags inside the HTML box
        are ignored — put your rules in the CSS box instead.
      </p>
    </div>
  );
};

export default HtmlCssEditor;
