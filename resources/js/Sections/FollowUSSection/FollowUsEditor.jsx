// resources/js/Sections/FollowUSSection/FollowUsEditor.jsx

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaTwitter, FaGlobe, FaShareAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { TextField, SelectField } from '../../Shared/SectionEditor/Fields';

const iconOptions = [
  { value: 'facebook', label: 'Facebook', icon: <FaFacebook className="text-blue-600" size={16} /> },
  { value: 'instagram', label: 'Instagram', icon: <FaInstagram className="text-pink-600" size={16} /> },
  { value: 'linkedin', label: 'LinkedIn', icon: <FaLinkedin className="text-blue-700" size={16} /> },
  { value: 'youtube', label: 'YouTube', icon: <FaYoutube className="text-red-600" size={16} /> },
  { value: 'twitter', label: 'X (Twitter)', icon: <FaTwitter className="text-slate-700" size={16} /> },
  { value: 'globe', label: 'Website', icon: <FaGlobe className="text-slate-600" size={16} /> },
];

const getIconPreview = (name) => iconOptions.find((o) => o.value === name)?.icon || <FaGlobe className="text-slate-400" size={16} />;
const getIconLabel = (name) => iconOptions.find((o) => o.value === name)?.label || name;

const FollowUsEditor = ({ section, hasData, onDataChange }) => {
  const initialData = section?.data?.data || section?.data || [];
  const [formData, setFormData] = useState(Array.isArray(initialData) ? initialData : []);

  useEffect(() => { onDataChange?.(formData); }, [formData, onDataChange]);

  const updateArrayItem = (index, field, value) => {
    const next = [...formData];
    if (!next[index]) next[index] = {};
    next[index][field] = value;
    setFormData(next);
  };

  const addLink = () => {
    setFormData([...formData, { icon: 'facebook', label: '', url: '#' }]);
  };

  const removeLink = (index) => {
    Swal.fire({
      title: 'Remove social link?',
      text: `Remove "${formData[index]?.label || 'this link'}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b',
      confirmButtonText: 'Remove', cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then((r) => {
      if (r.isConfirmed) {
        const next = [...formData];
        next.splice(index, 1);
        setFormData(next);
      }
    });
  };

  if (!hasData || !formData || formData.length === 0) {
    return (
      <div className="space-y-5">
        <EditorSection icon={FaShareAlt} title="Social Links" description="Add social media links to display in the footer" tone="cyan">
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">No social links yet</p>
            <p className="mt-0.5 text-xs text-slate-400">Click below to add your first link</p>
            <button type="button" onClick={addLink}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
              <FaPlus size={10} /> Add social link
            </button>
          </div>
        </EditorSection>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <EditorSection
        icon={FaShareAlt}
        title="Social Links"
        description={`${formData.length} link${formData.length === 1 ? '' : 's'}`}
        tone="cyan"
        action={
          <button type="button" onClick={addLink}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
            <FaPlus size={10} /> Add link
          </button>
        }
      >
        <div className="space-y-3">
          {formData.map((link, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  {getIconPreview(link.icon)}
                  {getIconLabel(link.icon)}
                  {link.label && <span className="text-slate-400">Â·</span>}
                  {link.label && <span className="text-xs text-slate-500">{link.label}</span>}
                </span>
                <button type="button" onClick={() => removeLink(index)}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                  <FaTrash size={11} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <SelectField label="Icon" value={link.icon || 'facebook'}
                  onChange={(e) => updateArrayItem(index, 'icon', e.target.value)}
                  options={iconOptions.map((o) => ({ value: o.value, label: o.label }))} />
                <TextField label="Label" value={link.label || ''}
                  onChange={(e) => updateArrayItem(index, 'label', e.target.value)}
                  placeholder="Facebook" />
                <TextField label="URL" value={link.url || ''}
                  onChange={(e) => updateArrayItem(index, 'url', e.target.value)}
                  placeholder="https://facebook.com/your-page" />
              </div>
              {link.url && link.url !== '#' && (
                <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                  <span className="text-slate-400">Preview:</span>
                  <span className="flex items-center gap-1.5 rounded-md px-2 py-1">
                    {getIconPreview(link.icon)}
                    <span className="font-medium text-slate-700">{link.label || 'Untitled'}</span>
                  </span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="truncate text-blue-600 hover:underline">
                    {link.url}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
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
          <span className="block text-slate-400">Links</span>
          <span className="font-medium text-slate-700">{formData.length}</span>
        </div>
      </div>
    </div>
  );
};

export default FollowUsEditor;
