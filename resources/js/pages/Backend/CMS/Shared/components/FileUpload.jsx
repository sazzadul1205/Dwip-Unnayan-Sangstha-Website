// resources/js/pages/Backend/CMS/Shared/components/FileUpload.jsx
import { FaUpload, FaTrashAlt, FaCheckCircle } from 'react-icons/fa';

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
}) => (
  <div>
    <label className="mb-1.5 flex items-baseline gap-1 text-sm font-medium text-slate-700">
      {label}
      <span className="text-xs font-normal text-slate-400">(optional)</span>
    </label>

    <div
      className={`relative rounded-lg border-2 border-dashed transition-all ${dragActive
          ? 'border-blue-500 bg-blue-50/60'
          : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
    >
      {value ? (
        <div className="flex items-center gap-3 p-3">
          <div className="relative shrink-0">
            <img
              src={value}
              alt={label}
              className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <span className="absolute -right-1 -top-1 rounded-full bg-emerald-500 p-0.5 text-white ring-2 ring-white">
              <FaCheckCircle size={12} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700">Image ready</p>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {value.substring(0, 50)}…
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            aria-label="Remove image"
          >
            <FaTrashAlt size={13} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <div className="rounded-full bg-blue-100 p-3 text-blue-600">
            <FaUpload size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              Click to upload or drag &amp; drop
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {fileTypesText} · {maxSizeText}
            </p>
          </div>
        </div>
      )}

      <input
        type="file"
        accept={accept}
        onChange={onChange}
        disabled={uploading}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            Uploading…
          </div>
        </div>
      )}
    </div>
  </div>
);

export default FileUpload;