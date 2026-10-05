import RichTextEditor from '@/components/editor/RichTextEditor';
import FileUpload from '../../Shared/components/FileUpload';
import FormField from '../../Shared/components/FormField';
import ToggleGroup from '../../Shared/components/ToggleGroup';
import TagInput from '../../Shared/components/TagInput';
import {
  FaLock, FaInfoCircle, FaExclamationTriangle,
  FaUser, FaCalendarAlt, FaClock,
} from 'react-icons/fa';

const PublicationForm = ({ form }) => {
  const {
    data,
    errors,
    isSubmitting,
    dragActive,
    uploading,
    pdfUploading,
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
        placeholder="Enter publication title"
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

      {/* Excerpt */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Excerpt <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <textarea
          value={data.excerpt || ''}
          onChange={(e) => handleChange('excerpt', e.target.value)}
          placeholder="Brief summary of the publication"
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Full Content */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Full Content</label>
        <RichTextEditor
          value={data.full_content || ''}
          onChange={(html) => handleChange('full_content', html)}
          placeholder="Write your publication content here..."
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
        label="Featured Image"
        value={data.image || ''}
        onChange={form.handleFileSelect}
        onRemove={form.removeImage}
        dragActive={dragActive}
        onDrag={form.handleDrag}
        onDrop={form.handleDrop}
        uploading={uploading}
      />

      {/* PDF Upload */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          PDF File <span className="text-gray-400 text-xs">(optional - max 20MB)</span>
        </label>
        <FileUpload
          label=""
          value={data.pdf_url || ''}
          onChange={form.handlePdfFileSelect}
          onRemove={form.removePdf}
          dragActive={false}
          onDrag={() => {}}
          onDrop={form.handlePdfDrop}
          uploading={pdfUploading}
          accept=".pdf,application/pdf"
          maxSizeText="max 20MB"
          fileTypesText="PDF"
        />
      </div>

      {/* Author, Category, Date, Read Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Author"
          name="author"
          value={data.author || ''}
          onChange={(e) => handleChange('author', e.target.value)}
          placeholder="Author name"
          icon={<FaUser className="text-gray-400" size={14} />}
          error={errors?.author}
        />
        <FormField
          label="Category"
          name="category"
          value={data.category || ''}
          onChange={(e) => handleChange('category', e.target.value)}
          placeholder="e.g., Climate Change, Agriculture"
          error={errors?.category}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <div className="relative">
            <input
              type="date"
              value={data.date || ''}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-4 py-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>
        </div>
        <FormField
          label="Read Time"
          name="read_time"
          value={data.read_time || ''}
          onChange={(e) => handleChange('read_time', e.target.value)}
          placeholder="e.g., 3 minutes"
          icon={<FaClock className="text-gray-400" size={14} />}
          error={errors?.read_time}
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
        submitLabel="Save Publication"
        statusValue={data.is_active}
        featuredValue={data.is_featured}
        onStatusToggle={() => handleChange('is_active', !data.is_active)}
        onFeaturedToggle={() => handleChange('is_featured', !data.is_featured)}
      />
    </form>
  );
};

export default PublicationForm;
