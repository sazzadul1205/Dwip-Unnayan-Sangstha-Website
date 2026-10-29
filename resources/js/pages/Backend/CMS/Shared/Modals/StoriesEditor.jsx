// resources/js/pages/Backend/CMS/Shared/Modals/StoriesEditor.jsx
import { FaInfoCircle, FaExternalLinkAlt } from 'react-icons/fa';
import EditorSection from '../components/EditorSection';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 disabled:bg-slate-50 disabled:text-slate-500';

const labelClass = 'block text-sm font-medium text-slate-700';
const hintClass = 'mt-1.5 flex items-center gap-1.5 text-xs text-slate-400';

export default function StoriesEditor({ formData, updateFormData, isLoading = false }) {
  const isDisabled = isLoading;

  return (
    <div className="space-y-6 w-full">
      {/* Settings */}
      <EditorSection
        icon={FaInfoCircle}
        title="Stories Section Settings"
        description="Configure the title and description for your stories section"
        tone="blue"
      >
        <div>
          <label className={labelClass}>
            Section Title
            <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.section?.title || ''}
            onChange={(e) => updateFormData('section.title', e.target.value)}
            placeholder="e.g., Our Latest Stories"
            className={`${inputClass} mt-1.5`}
            disabled={isDisabled}
          />
        </div>
        <div>
          <label className={labelClass}>
            Section Description
            <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={formData.section?.description || ''}
            onChange={(e) => updateFormData('section.description', e.target.value)}
            rows={2}
            placeholder="e.g., Read inspiring stories from our community"
            className={`${inputClass} mt-1.5 resize-y`}
            disabled={isDisabled}
          />
        </div>
      </EditorSection>

      {/* Manage link */}
      <EditorSection
        icon={FaExternalLinkAlt}
        title="Manage Your Stories"
        description="To add or edit stories, go to the Blog management section"
        tone="cyan"
        action={
          <a
            href="/backend/cms/blogs"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
          >
            Go to Blogs <FaExternalLinkAlt size={11} />
          </a>
        }
      >
        <p className={hintClass}>
          <FaInfoCircle size={10} />
          Stories are managed as blog posts. Any post marked as Featured appears in this section.
        </p>
      </EditorSection>
    </div>
  );
}