// resources/js/pages/Backend/EmailTemplates/Editor.jsx
//
// ============================================================
//  EMAIL TEMPLATE EDITOR
// ============================================================
//
// A plain source editor with a live preview — no CMS, no database.
//
//   Source     raw Blade + HTML + CSS, with a one-click variable palette
//   Preview    rendered in a sandboxed iframe, desktop / mobile widths
//   Sample     JSON merge values used only for the preview
//   Revisions  restore any previous save
//
// Ctrl/Cmd + S saves. Every save snapshots the file that was there
// before, so nothing is ever lost.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../layouts/AdminLayout';
import Swal from 'sweetalert2';
import {
  FiArrowLeft,
  FiCode,
  FiDownload,
  FiMonitor,
  FiRefreshCw,
  FiSave,
  FiSend,
  FiSidebar,
  FiSmartphone,
  FiUpload,
} from 'react-icons/fi';
import { FaHistory, FaSpinner, FaUndo } from 'react-icons/fa';

const PREVIEW_DEBOUNCE_MS = 700;

const TABS = [
  { key: 'source', label: 'Source', icon: FiCode },
  { key: 'sample', label: 'Sample data', icon: FiCode },
  { key: 'revisions', label: 'Revisions', icon: FaHistory },
];

const ViewportButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
      active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const EmailTemplateEditor = ({ template, source: initialSource, sampleData, revisions: initialRevisions, html: initialHtml, can }) => {
  const { flash } = usePage().props;

  // ---------------------------------------------
  //  STATE
  // ---------------------------------------------
  const [source, setSource] = useState(initialSource ?? '');
  const [savedSource, setSavedSource] = useState(initialSource ?? '');
  const [html, setHtml] = useState(initialHtml ?? '');
  const [sample, setSample] = useState(() => JSON.stringify(sampleData ?? {}, null, 2));
  const [revisions, setRevisions] = useState(initialRevisions ?? []);
  const [tab, setTab] = useState('source');
  const [viewport, setViewport] = useState('desktop');
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [sampleError, setSampleError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const textareaRef = useRef(null);
  const dirty = source !== savedSource;

  const csrfToken =
    typeof document !== 'undefined'
      ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
      : '';

  // ---------------------------------------------
  //  SAMPLE DATA
  // ---------------------------------------------
  const parsedSample = useMemo(() => {
    try {
      const parsed = JSON.parse(sample);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { value: {}, error: 'Sample data must be a JSON object.' };
      }
      return { value: parsed, error: null };
    } catch (e) {
      return { value: {}, error: e.message };
    }
  }, [sample]);

  useEffect(() => setSampleError(parsedSample.error), [parsedSample.error]);

  // ---------------------------------------------
  //  LIVE PREVIEW (debounced)
  // ---------------------------------------------
  const refreshPreview = useCallback(async () => {
    setPreviewing(true);
    try {
      const response = await fetch(route('backend.email-templates.preview', template.slug), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          Accept: 'application/json',
        },
        body: JSON.stringify({ source, sample: parsedSample.value }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPreviewError(data.error ?? 'Preview failed.');
        return;
      }

      setHtml(data.html ?? '');
      setPreviewError(null);
    } catch {
      setPreviewError('Could not reach the preview endpoint.');
    } finally {
      setPreviewing(false);
    }
  }, [source, parsedSample.value, template.slug, csrfToken]);

  useEffect(() => {
    const timer = setTimeout(refreshPreview, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [refreshPreview]);

  // ---------------------------------------------
  //  SAVE
  // ---------------------------------------------
  const save = useCallback(
    (e) => {
      e?.preventDefault?.();

      if (!dirty || saving) return;

      if (parsedSample.error) {
        setTab('sample');
        Swal.fire({ icon: 'warning', title: 'Fix the sample data JSON before previewing.', text: parsedSample.error });
        return;
      }

      setSaving(true);
      router.post(
        route('backend.email-templates.update', template.slug),
        { _method: 'PUT', source },
        {
          preserveScroll: true,
          onSuccess: () => {
            setSavedSource(source);
            setSaving(false);
          },
          onError: () => setSaving(false),
        }
      );
    },
    [dirty, saving, source, template.slug, parsedSample.error]
  );

  // Ctrl/Cmd + S anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [save]);

  // Warn before losing unsaved work.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // ---------------------------------------------
  //  SOURCE EDITOR HELPERS
  // ---------------------------------------------
  const handleChange = (event) => setSource(event.target.value);

  // Tab indents instead of leaving the textarea; Shift+Tab outdents.
  const handleKeyDown = (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();

    const el = event.target;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const next = `${value.slice(0, start)}  ${value.slice(end)}`;

    setSource(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2;
    });
  };

  const insertVariable = (variable) => {
    const token = `{{ $${variable} }}`;
    const el = textareaRef.current;
    const at = el ? el.selectionStart : source.length;

    setSource(source.slice(0, at) + token + source.slice(el ? el.selectionEnd : at));

    requestAnimationFrame(() => {
      el?.focus();
      const caret = at + token.length;
      el?.setSelectionRange(caret, caret);
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(source);
      Swal.fire({ icon: 'success', title: 'Source copied to clipboard.', timer: 1600, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Clipboard is not available in this browser.' });
    }
  };

  const resetSource = () => {
    setSource(savedSource);
    setTab('source');
  };

  // ---------------------------------------------
  //  REVISIONS
  // ---------------------------------------------
  const restoreRevision = (revision) => {
    Swal.fire({
      icon: 'warning',
      title: 'Restore this revision?',
      html: `<code class="text-xs">${revision.filename}</code><br><span class="text-sm">The current file will be snapshotted first.</span>`,
      showCancelButton: true,
      confirmButtonText: 'Restore',
      confirmButtonColor: '#2563eb',
    }).then((result) => {
      if (!result.isConfirmed) return;

      router.post(
        route('backend.email-templates.revert', [template.slug, revision.filename]),
        {},
        {
          preserveScroll: true,
          onSuccess: (page) => {
            setRevisions(page.props.revisions ?? revisions);
            setSource(page.props.source ?? source);
            setSavedSource(page.props.source ?? source);
            setHtml(page.props.html ?? html);
            setTab('source');
          },
        }
      );
    });
  };

  // ---------------------------------------------
  //  TEST SEND
  // ---------------------------------------------
  const sendTest = () => {
    if (!testEmail.trim()) {
      Swal.fire({ icon: 'warning', title: 'Enter an email address to send the preview to.' });
      return;
    }

    setSending(true);

    fetch(route('backend.email-templates.test-send', template.slug), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        Accept: 'application/json',
      },
      body: JSON.stringify({ email: testEmail.trim(), source }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Send failed.');
        Swal.fire({ icon: 'success', title: data.message, timer: 3000, showConfirmButton: false });
      })
      .catch((error) => Swal.fire({ icon: 'error', title: error.message }))
      .finally(() => setSending(false));
  };

  // ---------------------------------------------
  //  FLASH
  // ---------------------------------------------
  useEffect(() => {
    if (flash?.success) {
      Swal.fire({ icon: 'success', title: flash.success, timer: 3500, showConfirmButton: false });
    }
    if (flash?.error) {
      Swal.fire({ icon: 'error', title: flash.error, timer: 5000 });
    }
  }, [flash]);

  // ---------------------------------------------
  //  RENDER
  // ---------------------------------------------
  return (
    <AdminLayout>
      <Head title={`${template.label} | Email Templates`} />

      <form onSubmit={save} className="flex flex-col h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)]">
        {/* ===================== TOOLBAR ===================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={route('backend.email-templates.index')}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="All templates"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>

            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">{template.label}</h1>
              <p className="text-[11px] font-mono text-gray-400 truncate">{template.file}</p>
            </div>

            {dirty && (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {can?.update && (
              <button
                type="button"
                onClick={resetSource}
                disabled={!dirty}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Discard unsaved changes"
              >
                <FaUndo />
              </button>
            )}

            <a
              href={route('backend.email-templates.download', template.slug)}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Download .blade.php"
            >
              <FiDownload className="w-5 h-5" />
            </a>

            {can?.update && (
              <button
                type="submit"
                disabled={!dirty || saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FiSave />}
                Save
              </button>
            )}
          </div>
        </div>

        {/* ===================== WORKSPACE ===================== */}
        <div className="flex-1 flex overflow-hidden">
          {/* -------- Editor column -------- */}
          <div className={`flex flex-col min-w-0 border-r border-gray-200 bg-white ${showSidebar ? 'w-1/2' : 'w-full'}`}>
            {/* Tabs */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
                    tab === key ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {key === 'revisions' && revisions.length > 0 && (
                    <span className="px-1.5 rounded-full bg-gray-200 text-[10px] font-semibold">{revisions.length}</span>
                  )}
                </button>
              ))}

              {tab === 'source' && (
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="ml-auto px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100"
                >
                  Copy
                </button>
              )}
            </div>

            {tab === 'source' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {template.variables.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <span className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mr-1">Insert</span>
                    {template.variables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono text-[11px] text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {`{{ $${variable} }}`}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={source}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  disabled={!can?.update}
                  placeholder="<html>…</html>"
                  className="flex-1 w-full resize-none p-4 font-mono text-[13px] leading-relaxed text-gray-800 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            )}

            {tab === 'sample' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                  Values substituted for the merge variables while previewing. Saving does not change them.
                </div>

                <textarea
                  value={sample}
                  onChange={(e) => setSample(e.target.value)}
                  spellCheck={false}
                  className="flex-1 w-full resize-none p-4 font-mono text-[13px] leading-relaxed text-gray-800 outline-none"
                />

                <div className="px-4 py-2 border-t border-gray-100">
                  {sampleError ? (
                    <p className="text-xs text-red-600 font-mono">{sampleError}</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSample(JSON.stringify(sampleData ?? {}, null, 2))}
                      className="text-xs text-gray-500 hover:text-blue-600"
                    >
                      Reset to defaults
                    </button>
                  )}
                </div>
              </div>
            )}

            {tab === 'revisions' && (
              <div className="flex-1 overflow-y-auto p-4">
                {revisions.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <FaHistory className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No revisions yet.</p>
                    <p className="text-xs mt-1">A snapshot is taken every time you save.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {revisions.map((revision) => (
                      <li
                        key={revision.filename}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-gray-700 truncate">{revision.filename}</p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(revision.created_at.replace(' ', 'T')).toLocaleString()} ·{' '}
                            {(revision.size / 1024).toFixed(1)} KB
                          </p>
                        </div>

                        {can?.update && (
                          <button
                            type="button"
                            onClick={() => restoreRevision(revision)}
                            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            <FiUpload className="w-3.5 h-3.5" />
                            Restore
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* -------- Preview column -------- */}
          {showSidebar && (
            <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  Preview
                  {previewing ? (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <FaSpinner className="animate-spin" /> rendering
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1">
                  <ViewportButton
                    active={viewport === 'desktop'}
                    onClick={() => setViewport('desktop')}
                    icon={FiMonitor}
                    label="Desktop"
                  />
                  <ViewportButton
                    active={viewport === 'mobile'}
                    onClick={() => setViewport('mobile')}
                    icon={FiSmartphone}
                    label="Mobile"
                  />
                  <button
                    type="button"
                    onClick={refreshPreview}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Refresh preview"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {previewError && (
                <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700">{previewError}</div>
              )}

              <div className="flex-1 overflow-auto p-4">
                <iframe
                  title={`${template.label} preview`}
                  srcDoc={html}
                  sandbox="allow-same-origin"
                  className={`h-full min-h-[600px] w-full bg-white rounded-lg border border-gray-200 shadow-sm transition-all ${
                    viewport === 'mobile' ? 'max-w-[375px] mx-auto' : ''
                  }`}
                />
              </div>

              {/* Test send */}
              {can?.send && (
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={sendTest}
                    disabled={sending}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {sending ? <FaSpinner className="animate-spin" /> : <FiSend />}
                    Send preview
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar toggle lives in the flow so it never overlaps the preview */}
        <div className="px-4 py-1.5 border-t border-gray-200 bg-white flex justify-end">
          <button
            type="button"
            onClick={() => setShowSidebar((value) => !value)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <FiSidebar className="w-3.5 h-3.5" />
            {showSidebar ? 'Hide preview' : 'Show preview'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default EmailTemplateEditor;
