// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/VideoGalleryEditor.jsx

// React
import React, { useState, useEffect } from 'react';

// Icons
import { FaTrash, FaPlus, FaTimes, FaVideo, FaYoutube } from 'react-icons/fa';

// Sweetalert
import Swal from 'sweetalert2';

// Shared Components
import { TextField, TextAreaField } from './shared/Fields';

const VideoGalleryEditor = ({ section, hasData, onDataChange }) => {
  // ===== STATE MANAGEMENT =====
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);

  // Track thumbnail changes for deletion tracking
  const [thumbnailChanges, setThumbnailChanges] = useState({});
  const [oldThumbnailPaths, setOldThumbnailPaths] = useState({});
  const [uploadingThumbnail, setUploadingThumbnail] = useState({});

  // Notify parent when form data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // ===== HELPER FUNCTIONS =====

  // Update top-level fields
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Update a field in an array item
  const updateArrayItem = (index, field, value) => {
    const newData = { ...formData };
    if (!newData.videos) newData.videos = [];
    if (!newData.videos[index]) newData.videos[index] = {};
    newData.videos[index][field] = value;
    setFormData(newData);
  };

  // ===== VIDEO MANAGEMENT FUNCTIONS =====

  // Add a new video with default values
  const addVideo = () => {
    const newData = { ...formData };
    if (!newData.videos) newData.videos = [];
    const newId = Math.max(0, ...newData.videos.map(v => v.id || 0)) + 1;
    newData.videos.push({
      id: newId,
      title: '',
      description: '',
      src: '',
      thumbnail: ''
    });
    setFormData(newData);
  };

  // Remove a video and track its thumbnail for deletion
  const removeVideo = (index) => {
    const items = formData.videos || [];
    if (items[index]?.thumbnail) {
      setOldThumbnailPaths(prev => ({
        ...prev,
        [index]: items[index].thumbnail
      }));
      setThumbnailChanges(prev => ({ ...prev, [index]: true }));
    }
    const newData = { ...formData };
    newData.videos.splice(index, 1);
    setFormData(newData);
  };

  // ===== THUMBNAIL HANDLING FUNCTIONS =====

  // Handle thumbnail drop from drag & drop
  const handleThumbnailDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      processThumbnailFile(file, index);
    }
  };

  // Handle thumbnail selection via file input
  const handleThumbnailSelect = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      processThumbnailFile(file, index);
    }
    e.target.value = '';
  };

  // Process and upload the thumbnail file
  const processThumbnailFile = (file, index) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select an image file (JPEG, PNG, GIF, WebP, SVG)',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Validate file size (max 2MB for thumbnails)
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Thumbnail size should be less than 2MB',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Store old thumbnail path if it exists
    const items = formData.videos || [];
    if (items[index]?.thumbnail && !thumbnailChanges[index]) {
      setOldThumbnailPaths(prev => ({
        ...prev,
        [index]: items[index].thumbnail
      }));
    }

    // Read and convert thumbnail to base64
    setUploadingThumbnail(prev => ({ ...prev, [index]: true }));
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      updateArrayItem(index, 'thumbnail', imageUrl);
      setThumbnailChanges(prev => ({ ...prev, [index]: true }));
      setUploadingThumbnail(prev => ({ ...prev, [index]: false }));
    };
    reader.onerror = () => {
      setUploadingThumbnail(prev => ({ ...prev, [index]: false }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read the image file',
        confirmButtonColor: '#3b82f6',
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove thumbnail from a video
  const removeThumbnail = (index) => {
    const items = formData.videos || [];
    if (items[index]?.thumbnail) {
      setOldThumbnailPaths(prev => ({
        ...prev,
        [index]: items[index].thumbnail
      }));
    }
    updateArrayItem(index, 'thumbnail', '');
    setThumbnailChanges(prev => ({ ...prev, [index]: true }));
  };

  // Display path for thumbnail
  const getDisplayPath = (src) => {
    if (!src) return '';
    if (src.startsWith('data:image')) {
      return 'New image (will be uploaded)';
    }
    return src;
  };

  // ===== EMPTY STATE =====
  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Video Gallery Data</h3>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No videos added</p>
          <p className="text-xs mt-1">Click "Add Video" to create one</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={addVideo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <FaPlus size={14} />
            Add Video
          </button>
        </div>
      </div>
    );
  }

  const videos = formData.videos || [];

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Video Gallery Data</h3>

      {/* Section Settings */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Section Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField
            label="Section Title"
            value={formData.sectionTitle || ''}
            onChange={(e) => updateField('sectionTitle', e.target.value)}
            placeholder="Video Gallery"
          />
          <TextField
            label="Video Count Label"
            value={formData.videoCountLabel || 'Video Count'}
            onChange={(e) => updateField('videoCountLabel', e.target.value)}
            placeholder="Video Count"
          />
        </div>
      </div>

      {/* Videos List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">Videos ({videos.length})</h4>
          <button
            type="button"
            onClick={addVideo}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FaPlus size={12} /> Add Video
          </button>
        </div>

        <div className="space-y-4">
          {videos.map((video, index) => (
            <div key={video.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Video #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <FaTrash size={12} /> Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left Column - Thumbnail */}
                <div>
                  <label className="block text-xs text-gray-400 mb-0.5">Thumbnail</label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-3 transition-all ${uploadingThumbnail[index] ? 'opacity-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    onDragEnter={(e) => e.preventDefault()}
                    onDragLeave={(e) => e.preventDefault()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleThumbnailDrop(e, index)}
                  >
                    {video.thumbnail ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={video.thumbnail}
                          alt={video.title || 'Video thumbnail'}
                          className="w-20 h-14 object-cover rounded border border-gray-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 truncate">
                            {getDisplayPath(video.thumbnail)}
                          </p>
                          {thumbnailChanges[index] && oldThumbnailPaths[index] && (
                            <p className="text-xs text-red-400">🗑️ Will delete old</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeThumbnail(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-gray-400">
                        <FaVideo size={18} />
                        <span className="text-sm">Drop thumbnail or click to browse</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleThumbnailSelect(e, index)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingThumbnail[index]}
                    />
                    {uploadingThumbnail[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Video Details */}
                <div className="space-y-2">
                  <TextField
                    label="Title"
                    value={video.title || ''}
                    onChange={(e) => updateArrayItem(index, 'title', e.target.value)}
                    placeholder="Video title"
                  />
                  <TextField
                    label="Video URL"
                    value={video.src || ''}
                    onChange={(e) => updateArrayItem(index, 'src', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID or /storage/videos/video.mp4"
                  />
                  <TextAreaField
                    label="Description"
                    value={video.description || ''}
                    onChange={(e) => updateArrayItem(index, 'description', e.target.value)}
                    placeholder="Video description"
                    rows={2}
                  />
                </div>
              </div>

              {/* Video URL Preview */}
              {video.src && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaYoutube className="text-red-500" />
                    <span className="truncate">{video.src}</span>
                    {video.src.includes('youtube.com') || video.src.includes('youtu.be') ? (
                      <span className="text-green-600">✓ YouTube</span>
                    ) : video.src.endsWith('.mp4') || video.src.endsWith('.webm') ? (
                      <span className="text-blue-600">✓ Self-hosted</span>
                    ) : (
                      <span className="text-gray-400">Unknown source</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {videos.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            No videos added. Click "Add Video" to create one.
          </div>
        )}
      </div>

      {/* Data Information */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Section ID:</span>
            <span className="ml-2 text-gray-700 font-mono">{section.id}</span>
          </div>
          <div>
            <span className="text-gray-500">Data Table:</span>
            <span className="ml-2 text-gray-700 font-mono">{section.data_table || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-500">Data Key:</span>
            <span className="ml-2 text-gray-700 font-mono">{section.data_key || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Videos:</span>
            <span className="ml-2 text-gray-700 font-mono">{videos.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGalleryEditor;