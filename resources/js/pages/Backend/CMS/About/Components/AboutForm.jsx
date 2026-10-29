import RichTextEditor from '@/components/editor/RichTextEditor';
import FileUpload from '../../Shared/components/FileUpload';
import ToggleGroup from '../../Shared/components/ToggleGroup';
import TagInput from '../../Shared/components/TagInput';
import {
  FaLock, FaInfoCircle, FaExclamationCircle,
} from 'react-icons/fa';

// ─── Design tokens ──────────────────────────────────────────────
const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400';
const inputIdle = 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60';
const inputError = 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100/60';

// ─── Sub-components ─────────────────────────────────────────────
const Section = ({ title, description, children, action }) => (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
    <header className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {action}
    </header>
    <div className="p-6">{children}</div>
  </section>
);

const Field = ({ label, required, hint, error, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500">*</span>}
      {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
        <FaExclamationCircle size={11} />
        {Array.isArray(error) ? error[0] : error}
      </p>
    )}
  </div>
);

// ─── Main component ─────────────────────────────────────────────
const AboutForm = ({ form }) => {
  const {
    data, errors, isSubmitting, dragActive, uploading,
    tagInput, tagSuggestions,
  } = form;

  const set = (field, value) => form.updateField(field, value);
  const hasErrors = errors && Object.keys(errors).length > 0;

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      {/* Error banner */}
      {hasErrors && (
        <div className="rounded-lg border-l-4 border-red-400 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <FaExclamationCircle className="mt-0.5 shrink-0 text-red-500" size={14} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-800">
                Please fix the following before saving
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-red-700">
                {Object.entries(errors).map(([f, msgs]) => (
                  <li key={f}>{Array.isArray(msgs) ? msgs[0] : msgs}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── Content ─────────────────────────────── */}
      <Section title="Content" description="The heading, summary, and body of this section">
        <div className="space-y-5">
          {/* Title */}
          <Field label="Title" required error={errors?.title}>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Enter about content title"
              required
              className={`${inputBase} py-3 text-base font-medium ${errors?.title ? inputError : inputIdle
                }`}
            />
          </Field>

          {/* Slug */}
          <Field label="URL Slug" hint="auto-generated">
            <div className="relative">
              <input
                type="text"
                value={data.slug || ''}
                readOnly
                className="w-full cursor-default rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-9 text-sm text-slate-500 outline-none"
                placeholder="Auto-generated from title"
              />
              <FaLock
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={12}
              />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <FaInfoCircle size={10} /> Locked after creation to keep URLs stable
            </p>
          </Field>

          {/* Type — 2-card radio */}
          <Field label="Content Type" required error={errors?.type}>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: 'main', label: 'Main Content', hint: 'Appears on the main about page' },
                { value: 'detail', label: 'Detail Page', hint: 'A standalone nested page' },
              ].map((opt) => {
                const selected = (data.type || 'main') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('type', opt.value)}
                    className={`flex flex-col items-start rounded-lg border-2 p-3 text-left transition ${selected
                        ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-100/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <span
                      className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-slate-800'
                        }`}
                    >
                      {opt.label}
                    </span>
                    <span className="mt-0.5 text-xs text-slate-500">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Short Content */}
          <Field
            label="Summary"
            hint="max 500 chars"
            error={errors?.content}
          >
            <textarea
              value={data.content || ''}
              onChange={(e) => set('content', e.target.value)}
              placeholder="Brief description or summary shown in listings…"
              rows={3}
              maxLength={500}
              className={`${inputBase} min-h-20 resize-y ${errors?.content ? inputError : inputIdle
                }`}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Shown in cards and previews</p>
              <span
                className={`text-xs font-medium tabular-nums ${(data.content || '').length > 450 ? 'text-amber-600' : 'text-slate-400'
                  }`}
              >
                {(data.content || '').length}/500
              </span>
            </div>
          </Field>

          {/* Full Content */}
          <Field label="Full Content" error={errors?.full_content}>
            <div className="overflow-hidden rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100/60">
              <RichTextEditor
                value={data.full_content || ''}
                onChange={(html) => set('full_content', html)}
                placeholder="Write your full content here…"
                height="420px"
                features={{ codeView: false, colors: false }}
                onImageUploaded={(url) => form.addUploadedImage(url)}
              />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <FaInfoCircle size={10} /> HTML source editing is disabled
            </p>
          </Field>
        </div>
      </Section>

      {/* ─── Media ───────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Image" description="Main visual for this section">
          <FileUpload
            label=""
            value={data.image || ''}
            onChange={(e) => form.handleFileSelect(e, 'image')}
            onRemove={() => form.removeImage('image')}
            dragActive={dragActive}
            onDrag={form.handleDrag}
            onDrop={(e) => form.handleDrop(e, 'image')}
            uploading={uploading}
          />
        </Section>

        <Section title="Icon" description="Small symbolic icon (SVG recommended)">
          <FileUpload
            label=""
            value={data.icon || ''}
            onChange={(e) => form.handleFileSelect(e, 'icon')}
            onRemove={() => form.removeImage('icon')}
            dragActive={dragActive}
            onDrag={form.handleDrag}
            onDrop={(e) => form.handleDrop(e, 'icon')}
            uploading={uploading}
            accept="image/svg+xml,image/png,image/jpeg,image/gif,image/webp"
            maxSizeText="max 2MB"
            fileTypesText="SVG, PNG, JPEG, GIF, WebP"
          />
        </Section>
      </div>

      {/* ─── Layout & CTA ────────────────────────── */}
      <Section title="Layout & Call to Action" description="Background, ordering, and button">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Background Color */}
          <Field label="Background Color">
            <div className="flex items-stretch gap-2">
              <input
                type="color"
                value={data.bg_color || '#ffffff'}
                onChange={(e) => set('bg_color', e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                aria-label="Pick background color"
              />
              <input
                type="text"
                value={data.bg_color || ''}
                onChange={(e) => set('bg_color', e.target.value)}
                placeholder="#ffffff"
                className={`${inputBase} ${inputIdle} font-mono uppercase`}
              />
            </div>
          </Field>

          {/* Display Order */}
          <Field label="Display Order" hint="lower = first">
            <input
              type="number"
              value={data.display_order ?? ''}
              onChange={(e) =>
                set('display_order', e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              placeholder="0"
              min="0"
              className={`${inputBase} ${inputIdle}`}
            />
          </Field>

          {/* Button Text */}
          <Field label="Button Text" error={errors?.btn_text}>
            <input
              type="text"
              value={data.btn_text || ''}
              onChange={(e) => set('btn_text', e.target.value)}
              placeholder="Learn More"
              className={`${inputBase} ${errors?.btn_text ? inputError : inputIdle}`}
            />
          </Field>

          {/* Button Link */}
          <Field label="Button Link" error={errors?.btn_link}>
            <input
              type="text"
              value={data.btn_link || ''}
              onChange={(e) => set('btn_link', e.target.value)}
              placeholder="/about/details"
              className={`${inputBase} ${errors?.btn_link ? inputError : inputIdle}`}
            />
          </Field>
        </div>
      </Section>

      {/* ─── Tags ────────────────────────────────── */}
      <Section title="Tags" description="Improve discoverability — max 10 tags">
        <TagInput
          tags={data.tags || []}
          tagInput={tagInput}
          suggestions={tagSuggestions}
          onAddTag={form.addTag}
          onRemoveTag={form.removeTag}
          onInputChange={form.handleTagInputChange}
          onKeyDown={form.handleTagKeyDown}
          error={errors?.tags ? (Array.isArray(errors.tags) ? errors.tags[0] : errors.tags) : null}
        />
      </Section>

      {/* ─── Sticky save bar ─────────────────────── */}
      <ToggleGroup
        isSubmitting={isSubmitting}
        submitLabel="Save About Content"
        statusValue={data.is_active}
        featuredValue={data.is_featured}
        onStatusToggle={() => set('is_active', !data.is_active)}
        onFeaturedToggle={() => set('is_featured', !data.is_featured)}
      />
    </form>
  );
};

export default AboutForm;