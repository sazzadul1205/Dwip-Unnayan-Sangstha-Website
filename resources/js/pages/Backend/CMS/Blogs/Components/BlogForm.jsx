import RichTextEditor from '@/components/editor/RichTextEditor';
import FileUpload from '../../Shared/components/FileUpload';
import TagInput from '../../Shared/components/TagInput';
import {
  FaRegSave, FaSpinner, FaLock, FaInfoCircle,
  FaCalendarAlt, FaUser, FaClock, FaEye, FaEyeSlash,
  FaStar, FaRegStar, FaExclamationCircle, FaTimes,
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

const Field = ({ label, required, hint, children, error }) => (
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

const IconInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      size={13}
    />
    <input {...props} className={`${inputBase} ${inputIdle} pl-9`} />
  </div>
);

// ─── Main component ─────────────────────────────────────────────
const BlogForm = ({ form }) => {
  const {
    data, errors, isSubmitting, dragActive, uploading,
    tagInput, tagSuggestions,
  } = form;

  const set = (field, value) => form.updateField(field, value);
  const hasErrors = errors && Object.keys(errors).length > 0;

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6 pb-24">
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
      <Section title="Content" description="The main body of your blog post">
        <div className="space-y-5">
          {/* Title — big, prominent */}
          <div className="space-y-1.5">
            <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Enter a compelling title…"
              required
              className={`${inputBase} py-3 text-base font-medium ${errors?.title ? inputError : inputIdle
                }`}
            />
            {errors?.title && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                <FaExclamationCircle size={11} />
                {Array.isArray(errors.title) ? errors.title[0] : errors.title}
              </p>
            )}
          </div>

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
          <Field
            label="Excerpt"
            hint="max 500"
            error={errors?.excerpt}
          >
            <textarea
              value={data.excerpt || ''}
              onChange={(e) => set('excerpt', e.target.value)}
              placeholder="A short summary shown in blog listings and search results…"
              rows={3}
              maxLength={500}
              className={`${inputBase} min-h-20 resize-y ${errors?.excerpt ? inputError : inputIdle
                }`}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Appears in listings and previews
              </p>
              <span
                className={`text-xs font-medium tabular-nums ${(data.excerpt || '').length > 450
                    ? 'text-amber-600'
                    : 'text-slate-400'
                  }`}
              >
                {(data.excerpt || '').length}/500
              </span>
            </div>
          </Field>

          {/* Content editor */}
          <Field label="Body Content" error={errors?.full_content}>
            <div className="overflow-hidden rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100/60">
              <RichTextEditor
                value={data.full_content || ''}
                onChange={(html) => set('full_content', html)}
                placeholder="Write your blog content here…"
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

      {/* ─── Media + Metadata (2-col) ─────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Featured Image" description="Shown in listings and social previews">
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

        <Section title="Metadata" description="Author, date, and reading time">
          <div className="space-y-4">
            <Field label="Author" hint="defaults to Admin">
              <IconInput
                icon={FaUser}
                type="text"
                value={data.author || ''}
                onChange={(e) => set('author', e.target.value)}
                placeholder="Author name"
              />
            </Field>

            <Field label="Publish Date" hint="defaults to today">
              <IconInput
                icon={FaCalendarAlt}
                type="text"
                value={data.date || ''}
                onChange={(e) => set('date', e.target.value)}
                placeholder="e.g. June 6, 2024"
              />
            </Field>

            <Field
              label="Read Time"
              hint="minutes"
              error={errors?.read_time}
            >
              <div className="relative">
                <FaClock
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={13}
                />
                <input
                  type="number"
                  value={data.read_time || ''}
                  onChange={(e) =>
                    set('read_time', e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  placeholder="5"
                  min="1"
                  max="60"
                  className={`${inputBase} pl-9 ${errors?.read_time ? inputError : inputIdle
                    }`}
                />
              </div>
            </Field>
          </div>
        </Section>
      </div>

      {/* ─── Tags ─────────────────────────────────── */}
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

      {/* ─── Sticky save bar ──────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          {/* Publishing toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => set('is_active', !data.is_active)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${data.is_active
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200'
                }`}
            >
              {data.is_active ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
              {data.is_active ? 'Published' : 'Draft'}
            </button>
            <button
              type="button"
              onClick={() => set('is_featured', !data.is_featured)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${data.is_featured
                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200'
                }`}
            >
              {data.is_featured ? <FaStar size={12} /> : <FaRegStar size={12} />}
              {data.is_featured ? 'Featured' : 'Not Featured'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={form.handleCancel}
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:inline-flex"
            >
              <FaTimes size={11} /> Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <><FaSpinner className="animate-spin" size={13} /> Saving…</>
              ) : (
                <><FaRegSave size={13} /> Save Blog</>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default BlogForm;