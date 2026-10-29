import RichTextEditor from '@/components/editor/RichTextEditor';
import FileUpload from '../../Shared/components/FileUpload';
import ToggleGroup from '../../Shared/components/ToggleGroup';
import TagInput from '../../Shared/components/TagInput';
import {
  FaLock, FaInfoCircle, FaExclamationCircle, FaUser,
  FaCalendarAlt, FaClock, FaTag, FaRegFilePdf,
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

const IconInput = ({ icon: Icon, error, ...props }) => (
  <div className="relative">
    <Icon
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      size={13}
    />
    <input
      {...props}
      className={`${inputBase} pl-9 ${error ? inputError : inputIdle}`}
    />
  </div>
);

// ─── Main component ─────────────────────────────────────────────
const PublicationForm = ({ form }) => {
  const {
    data, errors, isSubmitting, dragActive, uploading,
    pdfUploading, tagInput, tagSuggestions,
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
      <Section title="Content" description="The publication's title, summary, and body">
        <div className="space-y-5">
          {/* Title */}
          <Field label="Title" required error={errors?.title}>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Enter publication title"
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

          {/* Excerpt */}
          <Field label="Excerpt" hint="optional" error={errors?.excerpt}>
            <textarea
              value={data.excerpt || ''}
              onChange={(e) => set('excerpt', e.target.value)}
              placeholder="Brief summary of the publication…"
              rows={2}
              className={`${inputBase} min-h-16 resize-y ${errors?.excerpt ? inputError : inputIdle
                }`}
            />
          </Field>

          {/* Content */}
          <Field label="Full Content" error={errors?.full_content}>
            <div className="overflow-hidden rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100/60">
              <RichTextEditor
                value={data.full_content || ''}
                onChange={(html) => set('full_content', html)}
                placeholder="Write your publication content here…"
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
        <Section title="Featured Image" description="Shown in listings and previews">
          <FileUpload
            label=""
            value={data.image || ''}
            onChange={form.handleFileSelect}
            onRemove={form.removeImage}
            dragActive={dragActive}
            onDrag={form.handleDrag}
            onDrop={form.handleDrop}
            uploading={uploading}
          />
        </Section>

        <Section title="PDF Document" description="Attach the full publication as PDF">
          <div className="space-y-2">
            <FileUpload
              label=""
              value={data.pdf_url || ''}
              onChange={form.handlePdfFileSelect}
              onRemove={form.removePdf}
              dragActive={false}
              onDrag={() => { }}
              onDrop={form.handlePdfDrop}
              uploading={pdfUploading}
              accept=".pdf,application/pdf"
              maxSizeText="max 20MB"
              fileTypesText="PDF"
            />
            <div className="flex items-start gap-1.5 text-xs text-slate-400">
              <FaRegFilePdf className="mt-0.5 shrink-0 text-red-400" size={11} />
              <span>PDFs are downloadable by visitors on the publication page</span>
            </div>
          </div>
        </Section>
      </div>

      {/* ─── Metadata ────────────────────────────── */}
      <Section title="Metadata" description="Author, category, date, and reading time">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Author */}
          <Field label="Author" error={errors?.author}>
            <IconInput
              icon={FaUser}
              type="text"
              value={data.author || ''}
              onChange={(e) => set('author', e.target.value)}
              placeholder="Author name"
              error={errors?.author}
            />
          </Field>

          {/* Category */}
          <Field label="Category" hint="e.g. Climate, Agriculture" error={errors?.category}>
            <IconInput
              icon={FaTag}
              type="text"
              value={data.category || ''}
              onChange={(e) => set('category', e.target.value)}
              placeholder="e.g. Climate Change"
              error={errors?.category}
            />
          </Field>

          {/* Date */}
          <Field label="Publish Date">
            <div className="relative">
              <FaCalendarAlt
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={13}
              />
              <input
                type="date"
                value={data.date || ''}
                onChange={(e) => set('date', e.target.value)}
                className={`${inputBase} pl-9 ${inputIdle}`}
              />
            </div>
          </Field>

          {/* Read Time */}
          <Field label="Read Time" hint="e.g. 5 minutes" error={errors?.read_time}>
            <IconInput
              icon={FaClock}
              type="text"
              value={data.read_time || ''}
              onChange={(e) => set('read_time', e.target.value)}
              placeholder="e.g. 3 minutes"
              error={errors?.read_time}
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
        submitLabel="Save Publication"
        statusValue={data.is_active}
        featuredValue={data.is_featured}
        onStatusToggle={() => set('is_active', !data.is_active)}
        onFeaturedToggle={() => set('is_featured', !data.is_featured)}
      />
    </form>
  );
};

export default PublicationForm;