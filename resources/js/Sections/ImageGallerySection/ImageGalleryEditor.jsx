// resources/js/Sections/ImageGallerySection/ImageGalleryEditor.jsx

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaTimes, FaImage, FaImages, FaTag } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { TextField } from '../../Shared/SectionEditor/Fields';

const TagInput = ({ value, onChange, placeholder = 'Add tag...' }) => {
  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState(() => {
    if (!value) return [];
    return value.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
  });

  useEffect(() => { onChange(tags.join(', ')); }, [tags, onChange]);

  const addTag = (newTag) => {
    const trimmed = newTag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags((p) => [...p, trimmed]);
    setInputValue('');
  };

  const removeTag = (i) => setTags((p) => p.filter((_, idx) => idx !== i));

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-white p-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100/60">
        {tags.map((tag, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-blue-50 py-0.5 pl-2 pr-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
            <FaTag size={8} className="opacity-60" />
            {tag}
            <button type="button" onClick={() => removeTag(idx)}
              className="rounded p-0.5 hover:bg-blue-100">
              <FaTimes size={8} />
            </button>
          </span>
        ))}
        <input type="text" value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => inputValue.trim() && addTag(inputValue)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Press Enter or comma to add</p>
    </div>
  );
};

const ImageGalleryEditor = ({ section, hasData, onDataChange }) => {
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);
  const [uploadingImage, setUploadingImage] = useState({});

  useEffect(() => { onDataChange?.(formData); }, [formData, onDataChange]);

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const updateArrayItem = (index, field, value) => {
    const next = { ...formData };
    if (!next.images) next.images = [];
    if (!next.images[index]) next.images[index] = {};
    next.images[index][field] = value;
    setFormData(next);
  };

  const addImage = () => {
    const next = { ...formData };
    if (!next.images) next.images = [];
    const newId = Math.max(0, ...next.images.map((i) => i.id || 0)) + 1;
    next.images.push({ id: newId, src: '', alt: '', title: '', tag: '' });
    setFormData(next);
  };

  const removeImage = (index) => {
    const next = { ...formData };
    next.images.splice(index, 1);
    setFormData(next);
  };

  const processImage = (file, index) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Please select an image.', confirmButtonColor: '#3b82f6' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: 'error', title: 'File too large', text: 'Max 5MB.', confirmButtonColor: '#3b82f6' });
      return;
    }
    setUploadingImage((p) => ({ ...p, [index]: true }));
    const reader = new FileReader();
    reader.onload = (e) => {
      updateArrayItem(index, 'src', e.target.result);
      setUploadingImage((p) => ({ ...p, [index]: false }));
    };
    reader.onerror = () => {
      setUploadingImage((p) => ({ ...p, [index]: false }));
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to read image.', confirmButtonColor: '#3b82f6' });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e, i) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file, i);
  };

  const handleSelect = (e, i) => {
    const file = e.target.files?.[0];
    if (file) processImage(file, i);
    e.target.value = '';
  };

  const removeImageSrc = (index) => {
    updateArrayItem(index, 'src', '');
  };

  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No data yet</p>
        <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Save Changes</span> to seed the initial structure</p>
      </div>
    );
  }

  const images = formData.images || [];

  return (
    <div className="space-y-5">
      <EditorSection icon={FaImage} title="Section Settings" description="Heading and count label" tone="blue">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextField label="Section title" value={formData.sectionTitle || ''}
            onChange={(e) => updateField('sectionTitle', e.target.value)}
            placeholder="DUS in action" />
          <TextField label="Image count label" value={formData.imageCountLabel || 'Image Count'}
            onChange={(e) => updateField('imageCountLabel', e.target.value)}
            placeholder="Image Count" />
        </div>
      </EditorSection>

      <EditorSection
        icon={FaImages}
        title="Images"
        description={`${images.length} image${images.length === 1 ? '' : 's'}`}
        tone="orange"
        action={
          <button type="button" onClick={addImage}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
            <FaPlus size={10} /> Add image
          </button>
        }
      >
        {images.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">No images yet</p>
            <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Add image</span> to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {images.map((img, index) => (
              <div key={img.id || index} className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                      {index + 1}
                    </span>
                    {img.title || `Image ${index + 1}`}
                  </span>
                  <button type="button" onClick={() => removeImage(index)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                    <FaTrash size={11} />
                  </button>
                </div>

                <div
                  className={`relative rounded-lg border-2 border-dashed p-3 transition ${
                    uploadingImage[index] ? 'pointer-events-none opacity-60' : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                  }`}
                  onDragEnter={(e) => e.preventDefault()}
                  onDragLeave={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {img.src ? (
                    <div className="flex items-center gap-3">
                      <img src={img.src} alt={img.alt || ''}
                        className="h-14 w-20 shrink-0 rounded-md border border-slate-200 object-cover" />
                      <span className="flex-1 truncate text-xs text-slate-500">
                        {img.src.startsWith('data:image') ? 'New image (pending upload)' : img.src}
                      </span>
                      <button type="button" onClick={() => removeImageSrc(index)}
                        className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                        <FaTimes size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1 text-slate-400">
                      <FaImage size={14} />
                      <span className="text-xs">Drop image or click to browse</span>
                    </div>
                  )}
                  <input type="file" accept="image/*"
                    onChange={(e) => handleSelect(e, index)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    disabled={uploadingImage[index]} />
                </div>

                <div className="mt-2 space-y-2">
                  <TextField label="Title" value={img.title || ''}
                    onChange={(e) => updateArrayItem(index, 'title', e.target.value)}
                    placeholder="Image title" />
                  <TextField label="Alt text" value={img.alt || ''}
                    onChange={(e) => updateArrayItem(index, 'alt', e.target.value)}
                    placeholder="Gallery image description" />
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tags</label>
                    <TagInput value={img.tag || ''}
                      onChange={(newValue) => updateArrayItem(index, 'tag', newValue)}
                      placeholder="Add tags..." />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorSection>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs md:grid-cols-4">
        <div>
          <span className="block text-slate-400">Section ID</span>
          <span className="font-mono text-slate-700">{section.id}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data table</span>
          <span className="font-mono text-slate-700">{section.data_table || 'â€”'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data key</span>
          <span className="font-mono text-slate-700">{section.data_key || 'â€”'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Images</span>
          <span className="font-medium text-slate-700">{images.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryEditor;
