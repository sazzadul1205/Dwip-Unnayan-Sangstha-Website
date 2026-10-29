// resources/js/Sections/VideoGallerySection/VideoGalleryEditor.jsx

import React, { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaTimes, FaVideo, FaYoutube, FaImages } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { TextField, TextAreaField } from '../../Shared/SectionEditor/Fields';

const VideoGalleryEditor = ({ section, hasData, onDataChange }) => {
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);
  const [uploadingThumbnail, setUploadingThumbnail] = useState({});

  useEffect(() => { onDataChange?.(formData); }, [formData, onDataChange]);

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const updateArrayItem = (index, field, value) => {
    const next = { ...formData };
    if (!next.videos) next.videos = [];
    if (!next.videos[index]) next.videos[index] = {};
    next.videos[index][field] = value;
    setFormData(next);
  };

  const addVideo = () => {
    const next = { ...formData };
    if (!next.videos) next.videos = [];
    const newId = Math.max(0, ...next.videos.map((v) => v.id || 0)) + 1;
    next.videos.push({ id: newId, title: '', description: '', src: '', thumbnail: '' });
    setFormData(next);
  };

  const removeVideo = (index) => {
    const next = { ...formData };
    next.videos.splice(index, 1);
    setFormData(next);
  };

  const processThumb = (file, index) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Please select an image.', confirmButtonColor: '#3b82f6' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ icon: 'error', title: 'File too large', text: 'Max 2MB.', confirmButtonColor: '#3b82f6' });
      return;
    }
    setUploadingThumbnail((p) => ({ ...p, [index]: true }));
    const reader = new FileReader();
    reader.onload = (e) => {
      updateArrayItem(index, 'thumbnail', e.target.result);
      setUploadingThumbnail((p) => ({ ...p, [index]: false }));
    };
    reader.onerror = () => {
      setUploadingThumbnail((p) => ({ ...p, [index]: false }));
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to read image.', confirmButtonColor: '#3b82f6' });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e, i) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processThumb(file, i);
  };

  const handleSelect = (e, i) => {
    const file = e.target.files?.[0];
    if (file) processThumb(file, i);
    e.target.value = '';
  };

  const removeThumb = (index) => {
    updateArrayItem(index, 'thumbnail', '');
  };

  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No data yet</p>
        <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Save Changes</span> to seed the initial structure</p>
      </div>
    );
  }

  const videos = formData.videos || [];

  return (
    <div className="space-y-5">
      <EditorSection icon={FaImages} title="Section Settings" description="Heading and count label" tone="blue">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextField label="Section title" value={formData.sectionTitle || ''}
            onChange={(e) => updateField('sectionTitle', e.target.value)}
            placeholder="Video Gallery" />
          <TextField label="Video count label" value={formData.videoCountLabel || 'Video Count'}
            onChange={(e) => updateField('videoCountLabel', e.target.value)}
            placeholder="Video Count" />
        </div>
      </EditorSection>

      <EditorSection
        icon={FaVideo}
        title="Videos"
        description={`${videos.length} video${videos.length === 1 ? '' : 's'}`}
        tone="orange"
        action={
          <button type="button" onClick={addVideo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
            <FaPlus size={10} /> Add video
          </button>
        }
      >
        {videos.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">No videos yet</p>
            <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Add video</span> to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video, index) => (
              <div key={video.id || index} className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                      {index + 1}
                    </span>
                    {video.title || `Video ${index + 1}`}
                  </span>
                  <button type="button" onClick={() => removeVideo(index)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                    <FaTrash size={11} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Thumbnail</label>
                    <div
                      className={`relative rounded-lg border-2 border-dashed p-3 transition ${uploadingThumbnail[index] ? 'pointer-events-none opacity-60' : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                        }`}
                      onDragEnter={(e) => e.preventDefault()}
                      onDragLeave={(e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      {video.thumbnail ? (
                        <div className="flex items-center gap-3">
                          <img src={video.thumbnail} alt={video.title || ''}
                            className="h-14 w-20 shrink-0 rounded-md border border-slate-200 object-cover" />
                          <span className="flex-1 truncate text-xs text-slate-500">
                            {video.thumbnail.startsWith('data:image') ? 'New (pending upload)' : video.thumbnail}
                          </span>
                          <button type="button" onClick={() => removeThumb(index)}
                            className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                            <FaTimes size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-1 text-slate-400">
                          <FaVideo size={14} />
                          <span className="text-xs">Drop thumbnail or click to browse</span>
                        </div>
                      )}
                      <input type="file" accept="image/*"
                        onChange={(e) => handleSelect(e, index)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        disabled={uploadingThumbnail[index]} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <TextField label="Title" value={video.title || ''}
                      onChange={(e) => updateArrayItem(index, 'title', e.target.value)}
                      placeholder="Video title" />
                    <TextField label="Video URL" value={video.src || ''}
                      onChange={(e) => updateArrayItem(index, 'src', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=ID or /storage/videos/file.mp4" />
                    <TextAreaField label="Description" value={video.description || ''}
                      onChange={(e) => updateArrayItem(index, 'description', e.target.value)}
                      placeholder="Video description" rows={2} />
                  </div>
                </div>

                {video.src && (
                  <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                    <FaYoutube className="text-red-500" size={11} />
                    <span className="truncate">{video.src}</span>
                    {video.src.includes('youtube.com') || video.src.includes('youtu.be') ? (
                      <span className="text-emerald-600">YouTube</span>
                    ) : video.src.endsWith('.mp4') || video.src.endsWith('.webm') ? (
                      <span className="text-blue-600">Self-hosted</span>
                    ) : (
                      <span className="text-slate-400">Unknown source</span>
                    )}
                  </div>
                )}
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
          <span className="block text-slate-400">Videos</span>
          <span className="font-medium text-slate-700">{videos.length}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoGalleryEditor;
