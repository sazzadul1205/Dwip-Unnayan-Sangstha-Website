// resources/js/pages/Backend/CMS/Sections/components/SectionEditModal.jsx
import { router } from '@inertiajs/react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FaTimes, FaSave, FaSpinner, FaCog, FaDatabase, FaExclamationCircle,
  FaCheckCircle, FaInfoCircle, FaLock, FaTag, FaPalette, FaArrowUp,
  FaArrowsAltH, FaRulerCombined, FaEdit,
} from 'react-icons/fa';
import axios from 'axios';
import { showToast, showWarningToast } from '../utils/toastHelper';
import { getComponentLabel, getDataTableLabel } from '../utils/sectionHelpers';
import { DEFAULT_CONFIG, SECTION_CONFIGS } from '../utils/SectionConfigData';
import { isUnconfigured, withPrefilledDefaults } from '../utils/proMode';
import RenderDataTab from './RenderDataTab';

const sectionHasData = (section) => section?.data !== null && section?.data !== undefined;

const editorImageDeleteRoute = 'backend.cms.editor-image.delete';

const routeUrl = (name, fallback) => {
  if (typeof window !== 'undefined' && typeof window.route === 'function') {
    try { return window.route(name); } catch { /* noop */ }
  }
  return fallback;
};

const reclaimUnsavedUploads = async (pending, savedPayload) => {
  if (!pending || pending.length === 0) return;
  const saved = JSON.stringify(savedPayload ?? {});
  const orphans = pending.filter((url) => !saved.includes(url));
  if (orphans.length === 0) return;
  try {
    await axios.delete(routeUrl(editorImageDeleteRoute, '/backend/cms/editor-image'), {
      data: { urls: orphans },
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    showWarningToast('Cleanup skipped', 'Some unsaved images could not be removed.', 4000);
  }
};

const resolveColorValue = (value) => {
  if (!value) return '#ffffff';
  if (value.startsWith('#')) return value;
  if (value.startsWith('bg-[') && value.endsWith(']')) {
    const m = value.match(/bg-\[(.*?)\]/);
    return m ? m[1] : '#ffffff';
  }
  const colorMap = {
    'bg-white': '#ffffff', 'bg-gray-50': '#f9fafb', 'bg-gray-100': '#f3f4f6',
    'bg-blue-50': '#eff6ff', 'bg-green-50': '#f0fdf4', 'bg-purple-50': '#faf5ff',
    'bg-yellow-50': '#fefce8', 'bg-red-50': '#fef2f2', 'bg-indigo-50': '#eef2ff',
    'bg-pink-50': '#fdf2f8', 'bg-orange-50': '#fff7ed', 'bg-teal-50': '#f0fdfa',
  };
  return colorMap[value] || '#ffffff';
};

const FIELD_ICONS = {
  bgColor: FaPalette, height: FaArrowUp, paddingY: FaArrowUp,
  paddingX: FaArrowsAltH, gap: FaRulerCombined, sectionClassName: FaTag,
};

const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400';
const inputIdle = 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60';
const inputError = 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100/60';

const SectionEditModal = ({ isOpen, onClose, section, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    section_key: '', component: '', data_table: '', data_key: '',
    is_enabled: true, custom_props: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [sectionData, setSectionData] = useState(null);
  const [pendingUploads, setPendingUploads] = useState([]);

  const savedPayloadRef = useRef(null);
  const hasReclaimedRef = useRef(false);

  const handleClose = () => {
    if (!hasReclaimedRef.current) {
      hasReclaimedRef.current = true;
      reclaimUnsavedUploads(pendingUploads, savedPayloadRef.current);
      setPendingUploads([]);
    }
    onClose();
  };

  const getSectionConfig = () => {
    if (!section) return DEFAULT_CONFIG;
    return SECTION_CONFIGS[section.component] || DEFAULT_CONFIG;
  };

  useEffect(() => {
    if (section) {
      const isFresh = isUnconfigured(section);
      setFormData({
        section_key: section.section_key || '',
        component: section.component || '',
        data_table: section.data_table || '',
        data_key: section.data_key || '',
        is_enabled: section.is_enabled ?? true,
        custom_props: isFresh
          ? withPrefilledDefaults(section.component, section.custom_props)
          : (section.custom_props || {}),
      });
      setSectionData(null);
      setPendingUploads([]);
      savedPayloadRef.current = null;
      hasReclaimedRef.current = false;
    }
  }, [section]);

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setActiveTab('basic');
      setSectionData(null);
      setPendingUploads([]);
      savedPayloadRef.current = null;
      hasReclaimedRef.current = false;
    }
  }, [isOpen]);

  const touchedCustomProps = useMemo(() => {
    const defaults = withPrefilledDefaults(section?.component, null);
    return Object.entries(formData.custom_props || {}).reduce((acc, [k, v]) => {
      const isDefault = defaults[k] === v;
      if (!isDefault && v !== '' && v !== null && v !== undefined) acc[k] = v;
      return acc;
    }, {});
  }, [formData.custom_props, section?.component]);

  if (!isOpen || !section) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCustomPropChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      custom_props: { ...prev.custom_props, [key]: value },
    }));
    if (errors.custom_props) setErrors((prev) => ({ ...prev, custom_props: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const newErrors = {};
    if (!formData.section_key.trim()) newErrors.section_key = 'Section key is required';
    if (!formData.component.trim()) newErrors.component = 'Component is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    const submitData = {
      section_key: formData.section_key,
      component: formData.component,
      data_table: formData.data_table,
      data_key: formData.data_key,
      is_enabled: formData.is_enabled,
      custom_props: { ...(section?.custom_props || {}), ...touchedCustomProps },
    };

    if (sectionData !== null && Object.keys(sectionData).length > 0) {
      if (sectionData.custom_props) {
        const existing = Object.keys(submitData.custom_props);
        Object.keys(sectionData.custom_props).forEach((k) => {
          if (!existing.includes(k)) submitData.custom_props[k] = sectionData.custom_props[k];
        });
      }
      const dataToSend = { ...sectionData };
      delete dataToSend.custom_props;
      if (Object.keys(dataToSend).length > 0) submitData.data = dataToSend;
    }

    savedPayloadRef.current = submitData;

    router.put(route('backend.cms.sections.update', { section: section.id }), submitData, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setIsSubmitting(false);
        showToast('success', 'Updated', 'Section updated successfully.', 2000);
        onSuccess?.();
        handleClose();
      },
      onError: (errs) => {
        setIsSubmitting(false);
        if (errs && typeof errs === 'object') {
          setErrors(errs);
          showToast('error', 'Update Failed', errs.message || 'Please check the form.', 4000);
        }
      },
    });
  };

  const sectionConfig = getSectionConfig();
  const hasData = sectionHasData(section);

  const renderField = (field) => {
    const currentValue = formData.custom_props?.[field.key] ?? field.default ?? '';
    const hasError = errors.custom_props && typeof errors.custom_props === 'object' && errors.custom_props[field.key];
    const FieldIcon = FIELD_ICONS[field.key] || FaTag;

    return (
      <div key={field.key} className="space-y-1.5">
        <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
          <FieldIcon size={11} className="text-slate-400" />
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
          {field.description && (
            <span className="text-xs font-normal text-slate-400">{field.description}</span>
          )}
        </label>

        {field.type === 'color' && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={resolveColorValue(currentValue)}
              onChange={(e) => handleCustomPropChange(field.key, `bg-[${e.target.value}]`)}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
            />
            <input
              type="text"
              value={currentValue}
              onChange={(e) => {
                let v = e.target.value.trim();
                if (v.match(/^#[0-9a-fA-F]{6}$/)) v = `bg-[${v}]`;
                else if (v.match(/^[a-zA-Z-]+$/) && !v.startsWith('bg-')) v = `bg-${v}`;
                handleCustomPropChange(field.key, v);
              }}
              className={`${inputBase} ${hasError ? inputError : inputIdle} flex-1 font-mono`}
              placeholder="bg-white or #F9F9FA"
            />
            <div
              className="h-10 w-10 shrink-0 rounded-lg border border-slate-200"
              style={{ backgroundColor: resolveColorValue(currentValue) }}
            />
          </div>
        )}

        {field.type === 'select' && field.options && (
          <select
            value={currentValue}
            onChange={(e) => handleCustomPropChange(field.key, e.target.value)}
            className={`${inputBase} ${hasError ? inputError : inputIdle}`}
            aria-label={field.label}
          >
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {field.type === 'text' && (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleCustomPropChange(field.key, e.target.value)}
            className={`${inputBase} ${hasError ? inputError : inputIdle}`}
            placeholder={field.default || `Enter ${field.label.toLowerCase()}`}
          />
        )}

        {field.type === 'number' && (
          <input
            type="number"
            min={field.min ?? 0}
            max={field.max ?? 100}
            value={currentValue}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) handleCustomPropChange(field.key, v);
              else if (e.target.value === '') handleCustomPropChange(field.key, field.default || 0);
            }}
            className={`${inputBase} ${hasError ? inputError : inputIdle}`}
            placeholder={field.default?.toString() || '0'}
          />
        )}

        {field.type === 'checkbox' && (
          <div className="flex items-center gap-2 pt-1">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id={`prop-${field.key}`}
                checked={currentValue === true || currentValue === 'true' || currentValue === 1 || currentValue === '1'}
                onChange={(e) => handleCustomPropChange(field.key, e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-10 rounded-full bg-slate-200 transition after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:content-[''] after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100/60" />
            </label>
            <label htmlFor={`prop-${field.key}`} className="cursor-pointer text-sm text-slate-700">
              {field.label}
            </label>
          </div>
        )}

        {field.type === 'textarea' && (
          <textarea
            value={currentValue}
            onChange={(e) => handleCustomPropChange(field.key, e.target.value)}
            rows={field.rows || 4}
            className={`${inputBase} ${hasError ? inputError : inputIdle} min-h-20 resize-y font-mono`}
            placeholder={field.default || `Enter ${field.label.toLowerCase()}`}
          />
        )}

        {hasError && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <FaExclamationCircle size={11} />
            {typeof errors.custom_props === 'string' ? errors.custom_props : errors.custom_props?.[field.key]}
          </p>
        )}
      </div>
    );
  };

  const renderBasicTab = () => (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`rounded-lg border p-4 ${formData.is_enabled ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${formData.is_enabled ? 'bg-emerald-100 text-emerald-600 ring-emerald-200' : 'bg-slate-100 text-slate-400 ring-slate-200'
              }`}>
              {formData.is_enabled ? <FaCheckCircle size={15} /> : <FaExclamationCircle size={15} />}
            </div>
            <div>
              <p className={`text-sm font-semibold ${formData.is_enabled ? 'text-emerald-800' : 'text-slate-700'}`}>
                {formData.is_enabled ? 'Section is active' : 'Section is inactive'}
              </p>
              <p className="text-xs text-slate-500">
                {formData.is_enabled ? 'Visible on the frontend' : 'Hidden from the frontend'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              name="is_enabled"
              checked={formData.is_enabled}
              onChange={handleChange}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-slate-200 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:content-[''] after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100/60" />
          </label>
        </div>
      </div>

      {/* Section Key */}
      <div className="space-y-1.5">
        <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
          <FaTag size={11} className="text-slate-400" />
          Section Key <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            name="section_key"
            value={formData.section_key}
            onChange={handleChange}
            className={`${inputBase} pr-20 font-mono ${errors.section_key ? inputError : inputIdle}`}
            placeholder="e.g., home_banner"
          />
          {formData.section_key && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
              {formData.section_key.length}
            </span>
          )}
        </div>
        {errors.section_key ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <FaExclamationCircle size={11} /> {errors.section_key}
          </p>
        ) : (
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <FaInfoCircle size={10} /> Unique identifier for this section
          </p>
        )}
      </div>

      {/* Component (locked) */}
      <div className="space-y-1.5">
        <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
          <FaLock size={11} className="text-slate-400" />
          Component
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <span className="text-sm font-medium text-slate-700">{getComponentLabel(formData.component)}</span>
          <span className="text-xs font-mono text-slate-400">({formData.component})</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200">
            <FaLock size={8} /> Locked
          </span>
        </div>
      </div>

      {/* Data table (locked) */}
      <div className="space-y-1.5">
        <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
          <FaDatabase size={11} className="text-slate-400" />
          Data Table
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <span className="text-sm font-medium text-slate-700">{getDataTableLabel(formData.data_table)}</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
            <FaLock size={8} /> Locked
          </span>
        </div>
      </div>

      {/* Data key */}
      <div className="space-y-1.5">
        <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
          <FaInfoCircle size={11} className="text-slate-400" /> Data Key
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <code className="text-xs font-mono text-slate-700">
            {formData.data_key || 'auto-generated'}
          </code>
          <span className="ml-auto rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] text-slate-500">Auto</span>
        </div>
      </div>

      {/* Custom props */}
      {sectionConfig.fields.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <header className="flex items-start gap-3 border-b border-slate-100 px-4 py-3">
            <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600 ring-1 ring-blue-100">
              <FaCog size={13} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">Section Configuration</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {sectionConfig.fields.length} field{sectionConfig.fields.length > 1 ? 's' : ''} available
              </p>
            </div>
          </header>
          <div className="space-y-4 p-4">
            {sectionConfig.fields.map(renderField)}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-screen w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl">
        {/* Sticky header */}
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5">
          <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600 ring-1 ring-blue-100">
            <FaEdit size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-slate-800">Edit Section</h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                {section.section_key}
              </code>
              <span className="text-slate-300">·</span>
              <span>ID {section.id}</span>
              <span className="text-slate-300">·</span>
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${section.is_enabled
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : 'bg-slate-100 text-slate-500 ring-slate-200'
                }`}>
                {section.is_enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
        </header>

        {/* Tabs */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-2">
          <div className="flex gap-1">
            {[
              { key: 'basic', label: 'Basic Data', icon: FaCog },
              { key: 'data', label: 'Section Data', icon: FaDatabase, showHasData: hasData },
            ].map(({ key, label, icon: Icon, showHasData }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition ${active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <Icon size={11} />
                  {label}
                  {showHasData && (
                    <span className="rounded-full bg-emerald-50 px-1.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                      <FaCheckCircle size={8} className="inline" />
                    </span>
                  )}
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-t-full bg-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className={activeTab === 'basic' ? 'block' : 'hidden'}>{renderBasicTab()}</div>
            <div className={activeTab === 'data' ? 'block' : 'hidden'}>
              <RenderDataTab
                section={section}
                hasData={hasData}
                onDataChange={setSectionData}
                onUploadsChange={setPendingUploads}
              />
            </div>
          </div>

          {/* Sticky footer */}
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <><FaSpinner className="animate-spin" size={12} /> Saving…</>
              ) : (
                <><FaSave size={12} /> Save changes</>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default SectionEditModal;