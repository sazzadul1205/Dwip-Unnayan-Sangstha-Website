import RichTextEditor from '@/components/editor/RichTextEditor';
import FileUpload from '../../Shared/components/FileUpload';
import FormField from '../../Shared/components/FormField';
import ToggleGroup from '../../Shared/components/ToggleGroup';
import {
  FaLock, FaInfoCircle,
  FaExclamationTriangle, FaGlobe, FaPaintBrush,
} from 'react-icons/fa';

const ProgramForm = ({ form }) => {
  const {
    data,
    errors,
    isSubmitting,
    dragActive,
    uploading,
  } = form;

  const handleChange = (field, value) => {
    form.updateField(field, value);
  };

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      {errors && Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
            <FaExclamationTriangle size={14} />
            Please fix the following errors:
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([field, msgs]) => (
              <li key={field}>• {Array.isArray(msgs) ? msgs[0] : msgs}</li>
            ))}
          </ul>
        </div>
      )}

      {/* === Title === */}
      <FormField
        label="Title"
        name="title"
        value={data.title || ''}
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Enter the program title"
        required
        error={errors?.title}
      />

      {/* === Slug (read-only — non-developer friendly) === */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Slug <span className="text-gray-400 text-xs">(auto-generated)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.slug || ''}
            onChange={(e) => handleChange('slug', e.target.value)}
            readOnly
            className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-default"
            placeholder="Auto-generated from title..."
          />
          <FaLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        </div>
        <div className="flex items-center gap-2">
          <FaInfoCircle className="text-gray-400" size={12} />
          <p className="text-xs text-gray-400">
            Automatically generated from the title. Locked to keep URLs clean.
          </p>
        </div>
      </div>

      {/* === Breadcrumb (auto-generated from title, simple field) === */}
      <FormField
        label="Breadcrumb"
        name="breadcrumb"
        value={data.breadcrumb || ''}
        onChange={(e) => handleChange('breadcrumb', e.target.value)}
        placeholder="Auto-generated from title if left empty"
        error={errors?.breadcrumb}
      />
      <div className="flex items-center gap-2">
        <FaInfoCircle className="text-gray-400" size={12} />
        <p className="text-xs text-gray-400">
          Used in navigation. If left empty, it will use the title automatically.
        </p>
      </div>

      {/* === Content === */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Content</label>
        <RichTextEditor
          value={data.full_content_html || ''}
          onChange={(html) => handleChange('full_content_html', html)}
          placeholder="Write your program content here..."
          height="400px"
          features={{ codeView: false, colors: false }}
          onImageUploaded={(url) => form.addUploadedImage(url)}
        />
        <div className="flex items-center gap-2">
          <FaInfoCircle className="text-gray-400" size={12} />
          <p className="text-xs text-gray-400">
            Use the formatting toolbar to style your content. HTML source editing is disabled.
          </p>
        </div>
      </div>

      {/* === Featured Image === */}
      <FileUpload
        label="Program Image"
        value={data.image || ''}
        onChange={form.handleFileSelect}
        onRemove={form.removeImage}
        dragActive={dragActive}
        onDrag={form.handleDrag}
        onDrop={form.handleDrop}
        uploading={uploading}
      />

      {/* === Link & Background Color === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Link (URL)"
          name="link"
          value={data.link || ''}
          onChange={(e) => handleChange('link', e.target.value)}
          placeholder="e.g., https://example.com"
          icon={<FaGlobe className="text-gray-400" size={14} />}
          hint="If provided, the program title will link to this URL."
          error={errors?.link}
        />
        <FormField
          label="Background Color"
          name="bg_color"
          value={data.bg_color || ''}
          onChange={(e) => handleChange('bg_color', e.target.value)}
          placeholder="e.g., #ffffff or bg-blue-500"
          icon={<FaPaintBrush className="text-gray-400" size={14} />}
          hint="Leave empty for default. Use Tailwind class (e.g., bg-blue-500) or hex color."
          error={errors?.bg_color}
        />
      </div>

      {/* Note about hidden fields */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-2">
          <FaInfoCircle className="text-gray-400 mt-0.5" size={14} />
          <div>
            <p className="text-xs text-gray-500">
              Display order is automatically managed by the system and assigned when this program is saved.
            </p>
          </div>
        </div>
      </div>

      {/* === Status Toggles === */}
      <ToggleGroup
        isSubmitting={isSubmitting}
        submitLabel="Save Program"
        statusValue={data.is_active}
        featuredValue={data.is_featured}
        onStatusToggle={() => handleChange('is_active', !data.is_active)}
        onFeaturedToggle={() => handleChange('is_featured', !data.is_featured)}
      />
    </form>
  );
};

export default ProgramForm;
