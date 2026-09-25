// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/AddressEditor.jsx

// React
import React, { useState, useEffect } from 'react';

// Icons
import { FaTrash, FaPlus, FaPhone, FaEnvelope, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';

// Sweetalert
import Swal from 'sweetalert2';

// Shared Components
import { TextField } from './shared/Fields';

const AddressEditor = ({ section, hasData, onDataChange }) => {
  // Get initial data - it's an array of addresses
  const initialData = section?.data?.data || section?.data || [];

  // State to hold all address data (array of address objects)
  const [formData, setFormData] = useState(Array.isArray(initialData) ? initialData : []);

  // Notify parent component when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // ===== HELPER FUNCTIONS =====

  // Update a field in a specific address
  const updateArrayItem = (index, field, value) => {
    const newData = [...formData];
    if (!newData[index]) newData[index] = {};
    newData[index][field] = value;
    setFormData(newData);
  };

  // Update a field inside a nested array (phones or emails)
  const updateNestedArrayItem = (index, field, subIndex, value) => {
    const newData = [...formData];
    if (!newData[index]) newData[index] = {};
    if (!newData[index][field]) newData[index][field] = [];
    newData[index][field][subIndex] = value;
    setFormData(newData);
  };

  // ===== PHONE FUNCTIONS =====

  // Add a new phone number field to an address
  const addPhone = (index) => {
    const newData = [...formData];
    if (!newData[index]) newData[index] = {};
    if (!newData[index].phones) newData[index].phones = [];
    newData[index].phones.push(''); // Add empty phone
    setFormData(newData);
  };

  // Remove a phone number from an address
  const removePhone = (index, phoneIndex) => {
    const newData = [...formData];
    if (newData[index] && newData[index].phones) {
      newData[index].phones.splice(phoneIndex, 1);
      setFormData(newData);
    }
  };

  // ===== EMAIL FUNCTIONS =====

  // Add a new email field to an address
  const addEmail = (index) => {
    const newData = [...formData];
    if (!newData[index]) newData[index] = {};
    if (!newData[index].emails) newData[index].emails = [];
    newData[index].emails.push(''); // Add empty email
    setFormData(newData);
  };

  // Remove an email from an address
  const removeEmail = (index, emailIndex) => {
    const newData = [...formData];
    if (newData[index] && newData[index].emails) {
      newData[index].emails.splice(emailIndex, 1);
      setFormData(newData);
    }
  };

  // ===== ADDRESS FUNCTIONS =====

  // Add a new address with default empty values
  const addAddress = () => {
    const newData = [...formData];
    newData.push({
      id: `address-${Date.now()}`, // Unique ID using timestamp
      label: '',
      address: '',
      mapUrl: '',
      coordinates: { lat: 0, lng: 0 },
      phones: [''], // Start with one empty phone
      emails: ['']  // Start with one empty email
    });
    setFormData(newData);
  };

  // Remove an address with confirmation dialog
  const removeAddress = (index) => {
    Swal.fire({
      title: 'Remove Address',
      text: `Are you sure you want to remove "${formData[index]?.label || 'this address'}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const newData = [...formData];
        newData.splice(index, 1);
        setFormData(newData);
      }
    });
  };

  // ===== EMPTY STATE =====
  // Show message when no addresses exist
  if (!hasData || !formData || formData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Address Data</h3>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No addresses added</p>
          <p className="text-xs mt-1">Click "Add Address" to create one</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={addAddress}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <FaPlus size={14} />
            Add Address
          </button>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">

      {/* Header with address count and add button */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Edit Address Data ({formData.length} addresses)</h3>
        <button
          type="button"
          onClick={addAddress}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium"
        >
          <FaPlus size={12} />
          Add Address
        </button>
      </div>

      {/* ===== LIST OF ADDRESSES ===== */}
      <div className="space-y-4">
        {formData.map((address, index) => (
          <div key={address.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">

            {/* Address header with index and remove button */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">Address #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeAddress(index)}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <FaTrash size={12} /> Remove
              </button>
            </div>

            {/* ===== ADDRESS FIELDS (2 columns on desktop) ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {/* ===== LEFT COLUMN ===== */}
              <div className="space-y-2">
                {/* Label field */}
                <TextField
                  label="Label"
                  value={address.label || ''}
                  onChange={(e) => updateArrayItem(index, 'label', e.target.value)}
                  placeholder="Head Office"
                />

                {/* Address textarea */}
                <div>
                  <label className="block text-xs text-gray-400 mb-0.5">Address</label>
                  <textarea
                    value={address.address || ''}
                    onChange={(e) => updateArrayItem(index, 'address', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="24/5 Mollika, Prominent Housing, 3 Pisciculture Road, Mohammadpur, Dhaka -1207."
                  />
                </div>

                {/* Map URL field */}
                <TextField
                  label="Map URL"
                  value={address.mapUrl || ''}
                  onChange={(e) => updateArrayItem(index, 'mapUrl', e.target.value)}
                  placeholder="https://www.google.com/maps?q=23.7570,90.3620&output=embed"
                />
              </div>

              {/* ===== RIGHT COLUMN ===== */}
              <div className="space-y-2">

                {/* ===== PHONES SECTION ===== */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-xs text-gray-400">Phone Numbers</label>
                    <button
                      type="button"
                      onClick={() => addPhone(index)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      <FaPlus size={10} /> Add
                    </button>
                  </div>
                  {/* Loop through phones */}
                  {(address.phones || ['']).map((phone, phoneIndex) => (
                    <div key={phoneIndex} className="flex items-center gap-2 mt-1">
                      <FaPhone size={12} className="text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={phone || ''}
                        onChange={(e) => updateNestedArrayItem(index, 'phones', phoneIndex, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="+880 1761-493412"
                      />
                      {/* Show remove button only if more than 1 phone */}
                      {(address.phones || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhone(index, phoneIndex)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <FaTrash size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* ===== EMAILS SECTION ===== */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-xs text-gray-400">Email Addresses</label>
                    <button
                      type="button"
                      onClick={() => addEmail(index)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      <FaPlus size={10} /> Add
                    </button>
                  </div>
                  {/* Loop through emails */}
                  {(address.emails || ['']).map((email, emailIndex) => (
                    <div key={emailIndex} className="flex items-center gap-2 mt-1">
                      <FaEnvelope size={12} className="text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={email || ''}
                        onChange={(e) => updateNestedArrayItem(index, 'emails', emailIndex, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="dusdhaka@gmail.com"
                      />
                      {/* Show remove button only if more than 1 email */}
                      {(address.emails || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmail(index, emailIndex)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <FaTrash size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* ===== COORDINATES ===== */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Latitude */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={address.coordinates?.lat || ''}
                      onChange={(e) => {
                        const newData = [...formData];
                        if (!newData[index].coordinates) newData[index].coordinates = { lat: 0, lng: 0 };
                        newData[index].coordinates.lat = parseFloat(e.target.value) || 0;
                        setFormData(newData);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="23.757"
                    />
                  </div>
                  {/* Longitude */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={address.coordinates?.lng || ''}
                      onChange={(e) => {
                        const newData = [...formData];
                        if (!newData[index].coordinates) newData[index].coordinates = { lat: 0, lng: 0 };
                        newData[index].coordinates.lng = parseFloat(e.target.value) || 0;
                        setFormData(newData);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="90.362"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ===== ADDRESS PREVIEW ===== */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                {/* Show address */}
                <div className="flex items-center gap-1">
                  <FaMapMarkerAlt size={12} className="text-gray-400" />
                  <span className="truncate max-w-40">{address.address || 'No address'}</span>
                </div>
                {/* Show phone count */}
                <div className="flex items-center gap-1">
                  <FaPhone size={12} className="text-gray-400" />
                  <span>{(address.phones || []).filter(p => p).length || 0} phones</span>
                </div>
                {/* Show email count */}
                <div className="flex items-center gap-1">
                  <FaEnvelope size={12} className="text-gray-400" />
                  <span>{(address.emails || []).filter(e => e).length || 0} emails</span>
                </div>
                {/* Show coordinates if available */}
                {address.coordinates?.lat && address.coordinates?.lng && (
                  <div className="flex items-center gap-1">
                    <FaGlobe size={12} className="text-gray-400" />
                    <span>{address.coordinates.lat}, {address.coordinates.lng}</span>
                  </div>
                )}
                {/* Show map link if available */}
                {address.mapUrl && (
                  <a
                    href={address.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View Map
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== DATA INFORMATION ===== */}
      {/* Display metadata about the section */}
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
            <span className="text-gray-500">Total Addresses:</span>
            <span className="ml-2 text-gray-700 font-mono">{formData.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressEditor;