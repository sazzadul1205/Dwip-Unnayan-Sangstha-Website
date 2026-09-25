// pages/auth/Steps/CVUpload.jsx
import { useState } from 'react';
import { FaFilePdf, FaFileWord, FaFileAlt, FaTrashAlt, FaStar, FaRegStar, FaSpinner, FaCloudUploadAlt, FaLightbulb } from 'react-icons/fa';
import Swal from 'sweetalert2';

const MAX_CVS = 3;

const CVUpload = ({ data, setData }) => {
  const [uploading, setUploading] = useState(false);

  const uploadCV = async (file) => {
    if (data.cvs.length >= MAX_CVS) {
      Swal.fire({ icon: 'warning', title: 'Limit reached', text: `You can upload up to ${MAX_CVS} CVs.`, timer: 2500, showConfirmButton: false });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: 'error', title: 'File too large', text: 'Max size is 5MB.', timer: 2500, showConfirmButton: false });
      return;
    }
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      Swal.fire({ icon: 'error', title: 'Invalid file type', text: 'PDF, DOC or DOCX only.', timer: 2500, showConfirmButton: false });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await fetch('/profile/cv', {
        method: 'POST', body: formData,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json',
        },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(err?.message || 'Upload failed');
      }
      const r = await response.json();
      setData('cvs', [...data.cvs, {
        id: r.id, name: r.original_name, size: r.size, type: r.type,
        original_name: r.original_name, order_position: r.order_position,
        is_primary: r.is_primary, upload_date: r.upload_date || new Date().toISOString(),
        status: r.status, cv_path: r.cv_path, url: r.url || null,
      }]);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload failed', text: err.message || 'Something went wrong.' });
    } finally {
      setUploading(false);
    }
  };

  const removeCV = (index) => {
    Swal.fire({
      title: 'Remove CV?', icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Remove', confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280', reverseButtons: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      const cv = data.cvs[index];
      if (cv?.id) {
        await fetch(`/profile/cv/${cv.id}`, {
          method: 'DELETE',
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });
      }
      const next = data.cvs.filter((_, i) => i !== index);
      next.forEach((c, i) => { c.order_position = i; });
      setData('cvs', next);
    });
  };

  const setPrimaryCV = async (index) => {
    setData('cvs', data.cvs.map((cv, i) => ({ ...cv, is_primary: i === index })));
    const cv = data.cvs[index];
    if (cv?.id) {
      await fetch(`/profile/cv/${cv.id}/primary`, {
        method: 'PATCH',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
    }
  };

  const getIcon = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className="h-4 w-4 text-red-500" />;
    if (ext === 'doc' || ext === 'docx') return <FaFileWord className="h-4 w-4 text-blue-600" />;
    return <FaFileAlt className="h-4 w-4 text-gray-500" />;
  };

  const fmtSize = (b) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FaFileAlt className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Upload your CV</h2>
            <p className="text-xs text-gray-500">Add up to {MAX_CVS} files · we use your primary CV for auto-applications</p>
          </div>
        </div>
        <span className="text-xs font-medium text-gray-500 tabular-nums">
          {data.cvs.length}/{MAX_CVS}
        </span>
      </div>

      {/* Slot dots */}
      <div className="flex gap-1.5">
        {[...Array(MAX_CVS)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < data.cvs.length ? 'bg-blue-500' : 'bg-gray-150 bg-gray-100'}`}
          />
        ))}
      </div>

      {/* Upload zone */}
      {data.cvs.length < MAX_CVS && (
        <label className="relative flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition group">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => e.target.files?.[0] && uploadCV(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="p-2.5 bg-blue-50 group-hover:bg-blue-100 rounded-lg transition">
            {uploading ? <FaSpinner className="h-4 w-4 text-blue-600 animate-spin" /> : <FaCloudUploadAlt className="h-4 w-4 text-blue-600" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">
              {uploading ? 'Uploading…' : 'Click to upload your resume'}
            </p>
            <p className="text-xs text-gray-500">PDF, DOC or DOCX · up to 5MB</p>
          </div>
        </label>
      )}

      {/* List */}
      {data.cvs.length > 0 && (
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
          {data.cvs.map((cv, i) => (
            <div key={cv.id || i} className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50/50 transition">
              <div className="p-2 bg-gray-50 rounded-lg shrink-0">{getIcon(cv.original_name)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{cv.original_name}</p>
                <p className="text-xs text-gray-500">{fmtSize(cv.size)} · {new Date(cv.upload_date).toLocaleDateString()}</p>
              </div>

              <button
                onClick={() => setPrimaryCV(i)}
                disabled={cv.is_primary}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${cv.is_primary
                    ? 'bg-amber-50 text-amber-700 cursor-default'
                    : 'text-gray-500 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                title={cv.is_primary ? 'Primary CV' : 'Set as primary'}
              >
                {cv.is_primary ? <FaStar className="h-3 w-3" /> : <FaRegStar className="h-3 w-3" />}
                <span className="hidden sm:inline">{cv.is_primary ? 'Primary' : 'Set primary'}</span>
              </button>

              <button
                onClick={() => removeCV(i)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                aria-label="Remove"
              >
                <FaTrashAlt className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty hint */}
      {data.cvs.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50/60 border border-amber-100 rounded-lg">
          <FaLightbulb className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            <strong className="font-semibold">Tip:</strong> Tailor your CV to the roles you want. You can upload different versions and mark one as primary.
          </p>
        </div>
      )}
    </div>
  );
};

export default CVUpload;