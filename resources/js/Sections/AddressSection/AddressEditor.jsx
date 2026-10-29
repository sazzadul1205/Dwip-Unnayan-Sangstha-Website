// resources/js/Sections/AddressSection/AddressEditor.jsx

import React, { useState, useEffect } from 'react';
import {
  FaTrash, FaPlus, FaPhone, FaEnvelope, FaMapMarkerAlt, FaGlobe, FaAddressCard,
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1';

const AddressEditor = ({ section, onDataChange }) => {
  const initialData = section?.data?.data || section?.data || [];
  const [formData, setFormData] = useState(Array.isArray(initialData) ? initialData : []);

  useEffect(() => { onDataChange?.(formData); }, [formData, onDataChange]);

  const updateArrayItem = (index, field, value) => {
    const next = [...formData];
    if (!next[index]) next[index] = {};
    next[index][field] = value;
    setFormData(next);
  };

  const updateNestedArrayItem = (index, field, subIndex, value) => {
    const next = [...formData];
    if (!next[index]) next[index] = {};
    if (!next[index][field]) next[index][field] = [];
    next[index][field][subIndex] = value;
    setFormData(next);
  };

  const addPhone = (i) => {
    const next = [...formData];
    if (!next[i]) next[i] = {};
    if (!next[i].phones) next[i].phones = [];
    next[i].phones.push('');
    setFormData(next);
  };
  const removePhone = (i, pi) => {
    const next = [...formData];
    if (next[i]?.phones) next[i].phones.splice(pi, 1);
    setFormData(next);
  };

  const addEmail = (i) => {
    const next = [...formData];
    if (!next[i]) next[i] = {};
    if (!next[i].emails) next[i].emails = [];
    next[i].emails.push('');
    setFormData(next);
  };
  const removeEmail = (i, ei) => {
    const next = [...formData];
    if (next[i]?.emails) next[i].emails.splice(ei, 1);
    setFormData(next);
  };

  const addAddress = () => {
    setFormData([...formData, {
      id: `address-${Date.now()}`,
      label: '', address: '', mapUrl: '',
      coordinates: { lat: 0, lng: 0 },
      phones: [''], emails: [''],
    }]);
  };

  const removeAddress = (index) => {
    Swal.fire({
      title: 'Remove address?',
      text: `Remove "${formData[index]?.label || 'this address'}"?`,
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

  return (
    <div className="space-y-5">
      <EditorSection
        icon={FaAddressCard}
        title="Addresses"
        description={`${formData.length} address${formData.length === 1 ? '' : 'es'} â€¢ Each address can have multiple phones and emails`}
        tone="emerald"
        action={
          <button
            type="button"
            onClick={addAddress}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700"
          >
            <FaPlus size={10} /> Add address
          </button>
        }
      >
        {formData.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">No addresses yet</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Click <span className="font-medium text-blue-600">Add address</span> to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.map((address, index) => (
              <div
                key={address.id || index}
                className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                      {index + 1}
                    </span>
                    {address.label || `Address ${index + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Remove address"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Left: core fields */}
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>Label</label>
                      <input
                        type="text" value={address.label || ''}
                        onChange={(e) => updateArrayItem(index, 'label', e.target.value)}
                        className={inputClass} placeholder="Head Office"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Address</label>
                      <textarea
                        value={address.address || ''}
                        onChange={(e) => updateArrayItem(index, 'address', e.target.value)}
                        rows={2} className={`${inputClass} resize-y`}
                        placeholder="24/5 Mollika, Prominent Housingâ€¦"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Map URL</label>
                      <input
                        type="text" value={address.mapUrl || ''}
                        onChange={(e) => updateArrayItem(index, 'mapUrl', e.target.value)}
                        className={inputClass}
                        placeholder="https://www.google.com/maps?q=â€¦&output=embed"
                      />
                    </div>
                  </div>

                  {/* Right: phones, emails, coordinates */}
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className={labelClass}>Phone Numbers</label>
                        <button
                          type="button" onClick={() => addPhone(index)}
                          className="text-[11px] font-medium text-blue-600 hover:underline"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {(address.phones || ['']).map((phone, pi) => (
                          <div key={pi} className="flex items-center gap-2">
                            <FaPhone size={11} className="shrink-0 text-slate-400" />
                            <input
                              type="text" value={phone || ''}
                              onChange={(e) => updateNestedArrayItem(index, 'phones', pi, e.target.value)}
                              className={`${inputClass} py-1.5`}
                              placeholder="+880 1761-493412"
                            />
                            {(address.phones || []).length > 1 && (
                              <button
                                type="button" onClick={() => removePhone(index, pi)}
                                className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <FaTrash size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className={labelClass}>Email Addresses</label>
                        <button
                          type="button" onClick={() => addEmail(index)}
                          className="text-[11px] font-medium text-blue-600 hover:underline"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {(address.emails || ['']).map((email, ei) => (
                          <div key={ei} className="flex items-center gap-2">
                            <FaEnvelope size={11} className="shrink-0 text-slate-400" />
                            <input
                              type="text" value={email || ''}
                              onChange={(e) => updateNestedArrayItem(index, 'emails', ei, e.target.value)}
                              className={`${inputClass} py-1.5`}
                              placeholder="dusdhaka@gmail.com"
                            />
                            {(address.emails || []).length > 1 && (
                              <button
                                type="button" onClick={() => removeEmail(index, ei)}
                                className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <FaTrash size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Latitude</label>
                        <input
                          type="number" step="any" value={address.coordinates?.lat || ''}
                          onChange={(e) => {
                            const next = [...formData];
                            if (!next[index].coordinates) next[index].coordinates = { lat: 0, lng: 0 };
                            next[index].coordinates.lat = parseFloat(e.target.value) || 0;
                            setFormData(next);
                          }}
                          className={`${inputClass} py-1.5`} placeholder="23.757"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Longitude</label>
                        <input
                          type="number" step="any" value={address.coordinates?.lng || ''}
                          onChange={(e) => {
                            const next = [...formData];
                            if (!next[index].coordinates) next[index].coordinates = { lat: 0, lng: 0 };
                            next[index].coordinates.lng = parseFloat(e.target.value) || 0;
                            setFormData(next);
                          }}
                          className={`${inputClass} py-1.5`} placeholder="90.362"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview row */}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <FaMapMarkerAlt size={10} /> {address.address ? address.address.slice(0, 40) : 'No address'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FaPhone size={10} /> {(address.phones || []).filter(Boolean).length} phones
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FaEnvelope size={10} /> {(address.emails || []).filter(Boolean).length} emails
                  </span>
                  {address.coordinates?.lat && address.coordinates?.lng && (
                    <span className="inline-flex items-center gap-1">
                      <FaGlobe size={10} /> {address.coordinates.lat}, {address.coordinates.lng}
                    </span>
                  )}
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
          <span className="block text-slate-400">Addresses</span>
          <span className="font-medium text-slate-700">{formData.length}</span>
        </div>
      </div>
    </div>
  );
};

export default AddressEditor;
