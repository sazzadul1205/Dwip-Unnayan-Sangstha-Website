import RichTextEditor from '@/components/editor/RichTextEditor';
import FileUpload from '../../Shared/components/FileUpload';
import ToggleGroup from '../../Shared/components/ToggleGroup';
import {
  FaLock, FaInfoCircle, FaExclamationCircle, FaGlobe, FaPaintBrush,
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
const ProgramForm = ({ form }) => {
  const { data, errors, isSubmitting, dragActive, uploading } = form;
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
      <Section title="Content" description="The name and body of this program">
        <div className="space-y-5">
          {/* Title */}
          <Field label="Title" required error={errors?.title}>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Enter the program title"
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

          {/* Breadcrumb */}
          <Field label="Breadcrumb" error={errors?.breadcrumb}>
            <input
              type="text"
              value={data.breadcrumb || ''}
              onChange={(e) => set('breadcrumb', e.target.value)}
              placeholder="Auto-generated from title if left empty"
              className={`${inputBase} ${errors?.breadcrumb ? inputError : inputIdle}`}
            />
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <FaInfoCircle size={10} /> Used in navigation — falls back to the title when empty
            </p>
          </Field>

          {/* Content */}
          <Field label="Content" error={errors?.full_content_html}>
            <div className="overflow-hidden rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100/60">
              <RichTextEditor
                value={data.full_content_html || ''}
                onChange={(html) => set('full_content_html', html)}
                placeholder="Write your program content here…"
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
      <Section title="Program Image" description="Main visual shown in cards and detail views">
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

      {/* ─── Link & Appearance ───────────────────── */}
      <Section title="Link & Appearance" description="Optional external link and background color">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Link */}
          <Field label="Link URL" error={errors?.link}>
            <IconInput
              icon={FaGlobe}
              type="text"
              value={data.link || ''}
              onChange={(e) => set('link', e.target.value)}
              placeholder="https://example.com"
            />
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <FaInfoCircle size={10} /> If set, the title links to this URL
            </p>
          </Field>

          {/* Background Color */}
          <Field label="Background Color" error={errors?.bg_color}>
            <IconInput
              icon={FaPaintBrush}
              type="text"
              value={data.bg_color || ''}
              onChange={(e) => set('bg_color', e.target.value)}
              placeholder="#ffffff or bg-blue-500"
            />
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <FaInfoCircle size={10} /> Tailwind class or hex — leave empty for default
            </p>
          </Field>
        </div>
      </Section>

      {/* ─── Auto-managed notice ─────────────────── */}
      <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <FaInfoCircle className="mt-0.5 shrink-0 text-slate-400" size={13} />
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-700">Display order</span> is automatically
          managed by the system and assigned when this program is saved.
        </p>
      </div>

      {/* ─── Sticky save bar ─────────────────────── */}
      <ToggleGroup
        isSubmitting={isSubmitting}
        submitLabel="Save Program"
        statusValue={data.is_active}
        featuredValue={data.is_featured}
        onStatusToggle={() => set('is_active', !data.is_active)}
        onFeaturedToggle={() => set('is_featured', !data.is_featured)}
      />
    </form>
  );
};

export default ProgramForm;