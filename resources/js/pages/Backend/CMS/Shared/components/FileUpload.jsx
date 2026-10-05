import { FaUpload, FaTimes, FaCheck } from 'react-icons/fa';

const FileUpload = ({
  value,
  onChange,
  onRemove,
  dragActive,
  onDrag,
  onDrop,
  uploading,
  accept = 'image/*',
  label = 'Image',
  maxSizeText = 'max 5MB',
  fileTypesText = 'JPEG, PNG, GIF, WebP, SVG',
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-gray-400 text-xs">(optional)</span>
      </label>
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50' : ''}`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        {value ? (
          <div className="flex items-center gap-4">
            <img
              src={value}
              alt={label}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Image uploaded</p>
              <p className="text-xs text-gray-400 truncate">
                {value.substring(0, 60)}...
              </p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                <FaCheck size={10} /> Ready
              </p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <FaTimes size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <FaUpload size={32} className="mb-2" />
            <p className="text-sm font-medium text-gray-600">Drag & drop an image here</p>
            <p className="text-xs mt-1">or click to browse</p>
            <p className="text-xs mt-2 text-gray-400">
              Supports {fileTypesText} ({maxSizeText})
            </p>
          </div>
        )}
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="text-sm text-gray-600">Uploading image...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
