import RichTextEditor from '@/components/editor/RichTextEditor';
import FileUpload from '../../Shared/components/FileUpload';
import TagInput from '../../Shared/components/TagInput';
import {
  FaRegSave, FaSpinner, FaLock, FaInfoCircle,
  FaExclamationTriangle, FaCalendarAlt, FaUser,
  FaClock, FaEye, FaEyeSlash,
} from 'react-icons/fa';

const BlogForm = ({ form }) => {
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
    if (field === '_dragActive') {
      // Not used here — dragActive is managed in the page component
      return;
    }
    form.updateField(field, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    form.handleSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter a compelling title for your blog post"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${
            errors?.title ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors?.title && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <FaExclamationTriangle size={12} />
            {Array.isArray(errors.title) ? errors.title[0] : errors.title}
          </p>
        )}
      </div>

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
            Automatically generated from the title. Locked to keep URLs clean and prevent broken links.
          </p>
        </div>
      </div>

      {/* === Excerpt === */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Excerpt <span className="text-gray-400 text-xs">(max 500 characters)</span>
        </label>
        <textarea
          value={data.excerpt || ''}
          onChange={(e) => handleChange('excerpt', e.target.value)}
          placeholder="Write a brief summary of your blog post..."
          rows={3}
          maxLength={500}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition resize-y ${
            errors?.excerpt ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between">
          <p className="text-xs text-gray-400">This appears in blog listings and search results.</p>
          <span className="text-xs text-gray-400">{(data.excerpt || '').length}/500</span>
        </div>
        {errors?.excerpt && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <FaExclamationTriangle size={12} />
            {Array.isArray(errors.excerpt) ? errors.excerpt[0] : errors.excerpt}
          </p>
        )}
      </div>

      {/* === Full Content (codeView disabled for non-developer safety) === */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Content</label>
        <RichTextEditor
          value={data.full_content || ''}
          onChange={(html) => handleChange('full_content', html)}
          placeholder="Write your blog content here..."
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
        {errors?.full_content && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <FaExclamationTriangle size={12} />
            {Array.isArray(errors.full_content) ? errors.full_content[0] : errors.full_content}
          </p>
        )}
      </div>

      {/* === Featured Image === */}
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

      {/* === Author, Date, Read Time (non-technical fields) === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Author <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.author || ''}
              onChange={(e) => handleChange('author', e.target.value)}
              placeholder="Author name"
              className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>
          <p className="text-xs text-gray-400">Defaults to "Admin" if left empty.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Publish Date <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.date || ''}
              onChange={(e) => handleChange('date', e.target.value)}
              placeholder="e.g., June 6, 2023"
              className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>
          <p className="text-xs text-gray-400">Defaults to today's date.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Read Time <span className="text-gray-400 text-xs">(minutes)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={data.read_time || ''}
              onChange={(e) => handleChange('read_time', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="e.g., 5"
              min="1"
              max="60"
              className={`w-full pl-9 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors?.read_time ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>
          <p className="text-xs text-gray-400">Defaults to 5 minutes.</p>
        </div>
      </div>

      {/* === Tags === */}
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

      {/* === Status Toggles === */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <button
              type="button"
              onClick={() => handleChange('is_active', !data.is_active)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                data.is_active
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {data.is_active ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
              {data.is_active ? 'Published' : 'Draft'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Featured:</label>
            <button
              type="button"
              onClick={() => handleChange('is_featured', !data.is_featured)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                data.is_featured
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {data.is_featured ? '⭐ Featured' : '☆ Not Featured'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <FaSpinner className="animate-spin" size={16} />
              Saving...
            </>
          ) : (
            <>
              <FaRegSave size={16} />
              Save Blog
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default BlogForm;
