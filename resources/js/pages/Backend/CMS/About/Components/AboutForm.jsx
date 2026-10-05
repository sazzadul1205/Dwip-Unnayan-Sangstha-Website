import RichTextEditor from '@/components/editor/RichTextEditor';
import FileUpload from '../../Shared/components/FileUpload';
import FormField from '../../Shared/components/FormField';
import ToggleGroup from '../../Shared/components/ToggleGroup';
import TagInput from '../../Shared/components/TagInput';
import {
  FaLock, FaInfoCircle, FaExclamationTriangle,
} from 'react-icons/fa';

const AboutForm = ({ form }) => {
  const {
    data,
    errors,
    isSubmitting,
    dragActive,
    uploading,
    tagInput,
    tagSuggestions,
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

      {/* Title */}
      <FormField
        label="Title"
        name="title"
        value={data.title || ''}
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Enter about content title"
        required
        error={errors?.title}
      />

      {/* Slug (auto-generated) */}
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

      {/* Type */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Type <span className="text-red-500">*</span>
        </label>
        <select
          value={data.type || 'main'}
          onChange={(e) => handleChange('type', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${
            errors?.type ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="main">Main Content</option>
          <option value="detail">Detail Page</option>
        </select>
        <p className="text-xs text-gray-400">
          Main content appears on the main about page. Detail pages are separate pages.
        </p>
        {errors?.type && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <FaExclamationTriangle size={12} />
            {Array.isArray(errors.type) ? errors.type[0] : errors.type}
          </p>
        )}
      </div>

      {/* Short Content */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Content <span className="text-gray-400 text-xs">(short description - max 500 chars)</span>
        </label>
        <textarea
          value={data.content || ''}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Brief description or summary"
          rows={3}
          maxLength={500}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition resize-y ${
            errors?.content ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between">
          <p className="text-xs text-gray-400">Brief summary shown in listings</p>
          <span className={`text-xs ${(data.content || '').length > 450 ? 'text-yellow-500' : 'text-gray-400'}`}>
            {(data.content || '').length}/500
          </span>
        </div>
        {errors?.content && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <FaExclamationTriangle size={12} />
            {Array.isArray(errors.content) ? errors.content[0] : errors.content}
          </p>
        )}
      </div>

      {/* Full Content */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Full Content</label>
        <RichTextEditor
          value={data.full_content || ''}
          onChange={(html) => handleChange('full_content', html)}
          placeholder="Write your full content here..."
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

      {/* Image */}
      <FileUpload
        label="Image"
        value={data.image || ''}
        onChange={form.handleFileSelect}
        onRemove={form.removeImage}
        dragActive={dragActive}
        onDrag={form.handleDrag}
        onDrop={form.handleDrop}
        uploading={uploading}
      />

      {/* Icon */}
      <FileUpload
        label="Icon"
        value={data.icon || ''}
        onChange={(e) => form.handleFileSelect(e)}
        onRemove={form.removeImage}
        dragActive={dragActive}
        onDrag={form.handleDrag}
        onDrop={form.handleDrop}
        uploading={uploading}
        accept="image/svg+xml,image/png,image/jpeg,image/gif,image/webp"
        maxSizeText="max 2MB"
        fileTypesText="SVG, PNG, JPEG, GIF, WebP"
      />

      {/* Background Color, Display Order, Button Text, Button Link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Background Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={data.bg_color || '#ffffff'}
              onChange={(e) => handleChange('bg_color', e.target.value)}
              className="w-12 h-12 p-1 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={data.bg_color || ''}
              onChange={(e) => handleChange('bg_color', e.target.value)}
              placeholder="#ffffff"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <FormField
          label="Display Order"
          name="display_order"
          type="number"
          value={data.display_order ?? ''}
          onChange={(e) => handleChange('display_order', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
          placeholder="0"
          hint="Lower numbers appear first"
          min="0"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Button Text"
          name="btn_text"
          value={data.btn_text || ''}
          onChange={(e) => handleChange('btn_text', e.target.value)}
          placeholder="Learn More"
          error={errors?.btn_text}
        />
        <FormField
          label="Button Link"
          name="btn_link"
          value={data.btn_link || ''}
          onChange={(e) => handleChange('btn_link', e.target.value)}
          placeholder="/about/details"
          error={errors?.btn_link}
        />
      </div>

      {/* Tags */}
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

      {/* Status Toggles */}
      <ToggleGroup
        isSubmitting={isSubmitting}
        submitLabel="Save About Content"
        statusValue={data.is_active}
        featuredValue={data.is_featured}
        onStatusToggle={() => handleChange('is_active', !data.is_active)}
        onFeaturedToggle={() => handleChange('is_featured', !data.is_featured)}
      />
    </form>
  );
};

export default AboutForm;
