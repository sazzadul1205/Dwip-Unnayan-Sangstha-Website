/**
 * RichTextEditor
 * ---------------------------------------------------------------------------
 * A stable, extensible WYSIWYG editor.
 *
 *  Stability rules (do not break these when extending):
 *    1. The contentEditable <div> is NEVER unmounted.
 *       Preview / code-view are SIBLINGS toggled with `hidden`, so
 *       switching modes can never wipe user content.
 *    2. Every mutation (typing, exec, image insert, paste, code edit)
 *       flows through ONE function: `syncToParent()`. That keeps
 *       onChange / history / char-count / code-view in lockstep.
 *
 *  Extending:
 *    • Toggle existing toolbar groups via the `enableX` props.
 *    • Add your own buttons with the `extraTools` prop (see example below).
 *    • Reuse GLOBAL_STYLES / DEFAULT_COLORS from `./editorConfig`.
 *
 *  Example — add a Horizontal Rule button:
 *
 *    import { FaMinus } from 'react-icons/fa';
 *
 *    const extraTools = [{
 *      key: 'hr',
 *      icon: <FaMinus size={13} />,
 *      title: 'Insert horizontal rule',
 *      action: (ctx) => ctx.insertHtml(`<hr class="${ctx.GLOBAL_STYLES.hr}" />`),
 *    }];
 *
 *    <RichTextEditor extraTools={extraTools} ... />
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaPalette,
  FaImage,
  FaUndo,
  FaRedo,
  FaEraser,
  FaEye,
  FaEyeSlash,
  FaCode,
} from 'react-icons/fa';
import axios from 'axios';
import DOMPurify from 'dompurify';

import {
  GLOBAL_STYLES,
  DEFAULT_COLORS,
  DEFAULT_FEATURES,
  ALLOWED_PASTE_TAGS,
  ALLOWED_PASTE_ATTRS,
  MAX_UPLOAD_BYTES,
  stripHtml,
  normalizeHtml,
  isProbablyImage,
  formatBytes,
  notify,
} from './editorConfig';
import './RichTextEditor.css';

// ---------------------------------------------------------------------------
// Small presentational helpers (kept inside the file so they stay private).
// ---------------------------------------------------------------------------

/** A toolbar button. Extracted so custom tools render identically. */
const ToolbarButton = ({ active, className, onClick, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()} // keeps text selection alive
    onClick={onClick}
    title={title}
    className={className}
    aria-pressed={active}
  >
    {children}
  </button>
);

/** Thin vertical divider used between toolbar groups. */
const ToolbarDivider = () => (
  <div className="border-r border-gray-300 pr-2 sm:pr-3 mr-1 sm:mr-2 h-6" />
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RichTextEditor({
  // ---- Content --------------------------------------------------------
  value = '',
  onChange = () => { },

  // ---- Layout ---------------------------------------------------------
  height,                      // fixed height (e.g. '400px') → scrolls
  minHeight = 'min-h-52',      // Tailwind class used when no fixed height
  className = '',
  placeholder = 'Write something...',

  // ---- Image upload ---------------------------------------------------
  onImageUploaded,             // (url: string) => void
  onImageUpload,               // (base64, file) => Promise<string>  custom uploader
  uploadEndpoint,              // string URL — falls back to Laravel route()
  maxUploadBytes = MAX_UPLOAD_BYTES,

  // ---- Feature flags (see DEFAULT_FEATURES) ---------------------------
  features = {},
  colors = DEFAULT_COLORS,

  // ---- Extensibility --------------------------------------------------
  extraTools = [],             // Array<CustomTool>  — see JSDoc at top
  headerContent,               // ReactNode rendered before the toolbar groups
  footerContent,               // ReactNode rendered after the status bar

  // ---- Misc -----------------------------------------------------------
  readOnly = false,
}) {
  // Merge caller's feature flags with defaults.
  const flags = useMemo(() => ({ ...DEFAULT_FEATURES, ...features }), [features]);

  // =========================================================================
  // Refs
  // =========================================================================
  const editorRef = useRef(null);              // the contentEditable div
  const isInternalUpdate = useRef(false);      // guards against echo loops
  const savedRangeRef = useRef(null);          // last known selection range
  const isInitialized = useRef(false);         // has first value been applied?
  const typingTimeout = useRef(null);          // debounce for onInput
  const fileInputRef = useRef(null);           // hidden <input type=file>
  const historyRef = useRef([]);               // undo/redo stack of HTML strings
  const historyIndexRef = useRef(-1);          // pointer into history stack

  // =========================================================================
  // State
  // =========================================================================
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#333333');

  const [showImageOptions, setShowImageOptions] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSettings, setImageSettings] = useState({
    url: '',
    width: 400,
    alignment: 'center',
    alt: '',
  });
  const [showImageSettingsModal, setShowImageSettingsModal] = useState(false);

  const [isPreview, setIsPreview] = useState(false);
  const [isCodeView, setIsCodeView] = useState(false);
  const [codeValue, setCodeValue] = useState(value || '');
  const [charCount, setCharCount] = useState(stripHtml(value || '').length);

  // =========================================================================
  // Toolbar styling
  // =========================================================================
  const btnClass =
    'p-1.5 sm:p-2 rounded-md transition flex items-center justify-center ' +
    'text-gray-700 min-w-[30px] sm:min-w-[36px] text-sm sm:text-base';
  const activeBtnClass = 'bg-blue-600 text-white';
  const inactiveBtnClass = 'hover:bg-gray-200';
  const getButtonClass = (key) =>
    `${btnClass} ${activeFormats[key] ? activeBtnClass : inactiveBtnClass}`;

  // =========================================================================
  // Selection management
  // =========================================================================
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      try {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      } catch {
        /* selection may be transient — ignore */
      }
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // =========================================================================
  // Active format detection (drives button highlighting)
  // =========================================================================
  const updateActiveFormats = useCallback(() => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      /* queryCommandState throws in some browsers when focused outside */
    }
  }, []);

  // =========================================================================
  // History (undo / redo)
  // =========================================================================
  const pushHistory = useCallback((html) => {
    const current = historyRef.current[historyIndexRef.current];
    if (current === html) return; // don't push duplicates

    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(html);
    historyIndexRef.current = historyRef.current.length - 1;

    // Cap at 100 entries to avoid unbounded memory.
    if (historyRef.current.length > 100) {
      const overflow = historyRef.current.length - 100;
      historyRef.current = historyRef.current.slice(overflow);
      historyIndexRef.current -= overflow;
    }
  }, []);

  const applyHistory = useCallback(
    (html) => {
      if (editorRef.current && html !== undefined) {
        isInternalUpdate.current = true;
        editorRef.current.innerHTML = html;
        onChange(html);
        setCodeValue(html);
        setCharCount(stripHtml(html).length);
      }
    },
    [onChange]
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    applyHistory(historyRef.current[historyIndexRef.current]);
  }, [applyHistory]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    applyHistory(historyRef.current[historyIndexRef.current]);
  }, [applyHistory]);

  // =========================================================================
  // Central sync — every mutation funnels through here.
  // =========================================================================
  const syncToParent = useCallback(
    (html, { push = true } = {}) => {
      isInternalUpdate.current = true;
      onChange(html);
      if (push) pushHistory(html);
      setCharCount(stripHtml(html).length);
      setCodeValue(html);
    },
    [onChange, pushHistory]
  );

  // =========================================================================
  // Typing handler (debounced)
  // =========================================================================
  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      syncToParent(el.innerHTML);
    }, 100);
  }, [syncToParent]);

  // =========================================================================
  // execCommand wrapper
  // =========================================================================
  const exec = useCallback(
    (cmd, val = null) => {
      if (readOnly) return;
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      restoreSelection();
      document.execCommand(cmd, false, val);
      clearTimeout(typingTimeout.current);
      syncToParent(el.innerHTML);
      updateActiveFormats();
    },
    [readOnly, restoreSelection, syncToParent, updateActiveFormats]
  );

  // =========================================================================
  // Headings
  // =========================================================================
  const handleHeader = useCallback(
    (level) => {
      if (readOnly) return;
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      restoreSelection();

      const selected = window.getSelection()?.toString() || ' ';

      let html;
      if (level === 'normal') {
        html = `<p class="${GLOBAL_STYLES.paragraph}">${selected}</p>`;
      } else {
        const cls = GLOBAL_STYLES.headings[level] || GLOBAL_STYLES.headings[1];
        html = `<h${level} class="${cls}">${selected}</h${level}>`;
      }

      document.execCommand('insertHTML', false, html);
      clearTimeout(typingTimeout.current);
      syncToParent(el.innerHTML);
      updateActiveFormats();
    },
    [readOnly, restoreSelection, syncToParent, updateActiveFormats]
  );

  // =========================================================================
  // Lists — execCommand then decorate new <ul>/<ol>/<li> with global classes.
  // Negative-lookahead so we don't double-apply classes to existing nodes.
  // =========================================================================
  const handleList = useCallback(
    (type) => {
      if (readOnly) return;
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      restoreSelection();

      const cmd = type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList';
      document.execCommand(cmd, false, null);

      let html = el.innerHTML;
      if (type === 'ul') {
        html = html
          .replace(/<ul(?!\s+class=)/g, `<ul class="${GLOBAL_STYLES.unorderedList}"`)
          .replace(/<li(?!\s+class=)/g, `<li class="${GLOBAL_STYLES.listItem}"`);
      } else {
        html = html
          .replace(/<ol(?!\s+class=)/g, `<ol class="${GLOBAL_STYLES.orderedList}"`)
          .replace(/<li(?!\s+class=)/g, `<li class="${GLOBAL_STYLES.listItem}"`);
      }
      el.innerHTML = html;

      clearTimeout(typingTimeout.current);
      syncToParent(html);
      updateActiveFormats();
    },
    [readOnly, restoreSelection, syncToParent, updateActiveFormats]
  );

  // =========================================================================
  // Color
  // =========================================================================
  const handleColor = useCallback(
    (color) => {
      setSelectedColor(color);
      exec('foreColor', color);
      setShowColorPicker(false);
    },
    [exec]
  );

  // =========================================================================
  // Image upload / insert
  // =========================================================================
  const uploadImage = useCallback(
    // NOTE: no `await` here — we simply forward the promise.
    (base64, file) => {
      if (typeof onImageUpload === 'function') {
        return onImageUpload(base64, file);
      }
      const endpoint =
        uploadEndpoint ||
        (typeof window !== 'undefined' && typeof window.route === 'function'
          ? window.route('admin.upload-editor-image')
          : null);
      if (!endpoint) {
        return Promise.reject(new Error('No image upload endpoint configured.'));
      }
      return axios
        .post(endpoint, { image: base64 }, {
          headers: { 'Content-Type': 'application/json' },
        })
        .then((res) => res.data.url);
    },
    [onImageUpload, uploadEndpoint]
  );

  const handleImageUpload = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isProbablyImage(file)) {
      notify('error', 'Invalid File', 'Please select an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > maxUploadBytes) {
      notify(
        'error',
        'File Too Large',
        `Image size should be less than ${formatBytes(maxUploadBytes)}.`
      );
      event.target.value = '';
      return;
    }

    setUploadingImage(true);
    setShowImageOptions(false);

    try {
      // Read as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const url = await uploadImage(base64, file);
      if (onImageUploaded) onImageUploaded(url);

      setImageSettings({
        url,
        width: 400,
        alignment: 'center',
        alt: file.name.split('.')[0] || 'Image',
      });
      setShowImageSettingsModal(true);
    } catch (err) {
      console.error('[RichTextEditor] upload failed:', err);
      notify('error', 'Upload Failed', 'Could not upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const insertImageWithSettings = () => {
    const { url, width, alignment, alt } = imageSettings;
    if (!url) {
      notify('warning', 'No Image', 'Please upload an image first.');
      return;
    }
    const el = editorRef.current;
    if (!el) return;

    el.focus();
    restoreSelection();

    let alignClass = '';
    if (alignment === 'left') alignClass = 'float-left mr-4';
    else if (alignment === 'right') alignClass = 'float-right ml-4';

    const imgTag =
      `<img src="${url}" alt="${alt || 'Image'}" ` +
      `style="width:${width}px;max-width:100%;height:auto;" ` +
      `class="${GLOBAL_STYLES.image} ${alignClass}" />`;

    const finalHtml =
      alignment === 'center'
        ? `<div style="text-align:center;margin:1rem 0;">${imgTag}</div>`
        : `<div style="margin:1rem 0;" class="clearfix">${imgTag}</div>`;

    document.execCommand('insertHTML', false, finalHtml);
    clearTimeout(typingTimeout.current);
    syncToParent(el.innerHTML);

    setShowImageSettingsModal(false);
    setImageSettings({ url: '', width: 400, alignment: 'center', alt: '' });
  };

  // =========================================================================
  // Paste — sanitize pasted HTML so the app styles stay consistent.
  // =========================================================================
  const handlePaste = useCallback(
    (e) => {
      if (readOnly) return;
      const cd = e.clipboardData;
      if (!cd) return;

      const html = cd.getData('text/html');
      const text = cd.getData('text/plain');

      if (html) {
        e.preventDefault();
        const clean = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ALLOWED_PASTE_TAGS,
          ALLOWED_ATTR: ALLOWED_PASTE_ATTRS,
        });
        document.execCommand('insertHTML', false, clean);
      } else if (text) {
        e.preventDefault();
        document.execCommand('insertText', false, text);
      }

      clearTimeout(typingTimeout.current);
      syncToParent(editorRef.current?.innerHTML || '');
    },
    [readOnly, syncToParent]
  );

  // =========================================================================
  // View toggles — preview / code view are SIBLINGS, editor stays mounted.
  // =========================================================================
  const togglePreview = useCallback(() => {
    setIsPreview((prev) => {
      const next = !prev;
      if (next) setIsCodeView(false);
      return next;
    });
  }, []);

  const toggleCodeView = useCallback(() => {
    setIsCodeView((prev) => {
      const next = !prev;
      if (next) {
        // Snapshot current HTML so the textarea starts in sync.
        setCodeValue(editorRef.current?.innerHTML || value || '');
        setIsPreview(false);
      }
      return next;
    });
  }, [value]);

  const handleCodeChange = useCallback(
    (newVal) => {
      setCodeValue(newVal);
      setCharCount(stripHtml(newVal).length);
      // Keep the (hidden) editor in sync so exiting code-view preserves state.
      if (editorRef.current) editorRef.current.innerHTML = newVal;

      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        isInternalUpdate.current = true;
        onChange(newVal);
        pushHistory(newVal);
      }, 200);
    },
    [onChange, pushHistory]
  );

  // =========================================================================
  // Keyboard shortcuts (scoped to the editor, not the whole page)
  // =========================================================================
  const handleEditorKeyDown = useCallback(
    (e) => {
      if (readOnly) return;
      if (!(e.ctrlKey || e.metaKey)) return;

      const key = e.key.toLowerCase();
      if (key === 'b') { e.preventDefault(); exec('bold'); }
      else if (key === 'i') { e.preventDefault(); exec('italic'); }
      else if (key === 'u') { e.preventDefault(); exec('underline'); }
      else if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    },
    [readOnly, exec, undo, redo]
  );

  // =========================================================================
  // Context handed to custom tools — this is the extension API.
  // =========================================================================
  const editorContext = useMemo(
    () => ({
      /** Fire a native execCommand and sync. */
      exec,
      /** Insert raw HTML at the current selection (sanitized by caller). */
      insertHtml: (html) => {
        document.execCommand('insertHTML', false, html);
        clearTimeout(typingTimeout.current);
        syncToParent(editorRef.current?.innerHTML || '');
      },
      /** Current selection as plain text. */
      getSelectionText: () => window.getSelection()?.toString() || '',
      /** Full editor HTML. */
      getHtml: () => editorRef.current?.innerHTML || '',
      /** Replace the whole editor HTML (also syncs to parent). */
      setHtml: (html) => {
        if (editorRef.current) editorRef.current.innerHTML = html;
        syncToParent(html);
      },
      /** Shared constants so custom tools stay consistent. */
      GLOBAL_STYLES,
      value,
      onChange,
      readOnly,
    }),
    [exec, syncToParent, value, onChange, readOnly]
  );

  // =========================================================================
  // Lifecycle — initial value
  // =========================================================================
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      const initial = value || '';
      editorRef.current.innerHTML = initial;
      historyRef.current = [initial];
      historyIndexRef.current = 0;
      setCodeValue(initial);
      setCharCount(stripHtml(initial).length);
      isInitialized.current = true;
    }
  }, [value]);

  // =========================================================================
  // Lifecycle — external value sync
  // =========================================================================
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const el = editorRef.current;
    if (!el || !isInitialized.current) return;

    const incoming = value || '';

    if (isCodeView) {
      setCodeValue((prev) => (prev !== incoming ? incoming : prev));
      setCharCount(stripHtml(incoming).length);
      return;
    }

    if (normalizeHtml(el.innerHTML) !== normalizeHtml(incoming)) {
      el.innerHTML = incoming;
      setCodeValue(incoming);
      setCharCount(stripHtml(incoming).length);
    }
  }, [value, isCodeView]);

  // =========================================================================
  // Lifecycle — track selection to update active-format buttons
  // =========================================================================
  useEffect(() => {
    const handler = () => {
      const el = editorRef.current;
      if (el && document.activeElement === el) {
        updateActiveFormats();
        saveSelection();
      }
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [updateActiveFormats, saveSelection]);

  // =========================================================================
  // Lifecycle — cleanup
  // =========================================================================
  useEffect(() => () => clearTimeout(typingTimeout.current), []);

  // =========================================================================
  // Render
  // =========================================================================
  const contentBoxStyle = height ? { height } : undefined;
  const contentBoxClass = `${minHeight} ${height ? 'overflow-auto' : ''}`;
  const showToolbar = !readOnly && !isPreview && !isCodeView;

  return (
    <div
      className={`border border-gray-300 rounded-lg bg-white shadow-sm overflow-visible ${className}`}
    >
      {/* ================================================================
          TOOLBAR
          ================================================================ */}
      {showToolbar && (
        <div className="border-b bg-gray-50 px-1.5 sm:px-3 py-1.5 sm:py-2">
          {/* Slot: caller-provided content shown before the built-in tools. */}
          {headerContent}

          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {/* ---------------- Headings ---------------- */}
            {flags.headings && (
              <>
                <div className="flex items-center gap-1">
                  <select
                    onChange={(e) => handleHeader(e.target.value)}
                    className="text-xs sm:text-sm border border-gray-300 rounded px-1.5 sm:px-2 py-1 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="normal"
                  >
                    <option value="normal">Normal</option>
                    <option value="1">H1</option>
                    <option value="2">H2</option>
                    <option value="3">H3</option>
                    <option value="4">H4</option>
                    <option value="5">H5</option>
                    <option value="6">H6</option>
                  </select>
                </div>
                <ToolbarDivider />
              </>
            )}

            {/* ---------------- Text formatting ---------------- */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <ToolbarButton
                active={activeFormats.bold}
                className={getButtonClass('bold')}
                onClick={() => exec('bold')}
                title="Bold (Ctrl+B)"
              >
                <FaBold size={13} />
              </ToolbarButton>

              <ToolbarButton
                active={activeFormats.italic}
                className={getButtonClass('italic')}
                onClick={() => exec('italic')}
                title="Italic (Ctrl+I)"
              >
                <FaItalic size={13} />
              </ToolbarButton>

              <ToolbarButton
                active={activeFormats.underline}
                className={getButtonClass('underline')}
                onClick={() => exec('underline')}
                title="Underline (Ctrl+U)"
              >
                <FaUnderline size={13} />
              </ToolbarButton>

              {flags.strikethrough && (
                <ToolbarButton
                  active={activeFormats.strikeThrough}
                  className={getButtonClass('strikeThrough')}
                  onClick={() => exec('strikeThrough')}
                  title="Strikethrough"
                >
                  <FaStrikethrough size={13} />
                </ToolbarButton>
              )}

              {flags.clearFormat && (
                <ToolbarButton
                  className={`${btnClass} hover:bg-gray-200`}
                  onClick={() => exec('removeFormat')}
                  title="Clear formatting"
                >
                  <FaEraser size={13} />
                </ToolbarButton>
              )}
            </div>

            <ToolbarDivider />

            {/* ---------------- Lists ---------------- */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <ToolbarButton
                active={activeFormats.insertUnorderedList}
                className={getButtonClass('insertUnorderedList')}
                onClick={() => handleList('ul')}
                title="Bulleted list"
              >
                <FaListUl size={13} />
              </ToolbarButton>

              <ToolbarButton
                active={activeFormats.insertOrderedList}
                className={getButtonClass('insertOrderedList')}
                onClick={() => handleList('ol')}
                title="Numbered list"
              >
                <FaListOl size={13} />
              </ToolbarButton>
            </div>

            {/* ---------------- Alignment ---------------- */}
            {flags.alignment && (
              <>
                <ToolbarDivider />
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <ToolbarButton
                    active={activeFormats.justifyLeft}
                    className={getButtonClass('justifyLeft')}
                    onClick={() => exec('justifyLeft')}
                    title="Align left"
                  >
                    <FaAlignLeft size={13} />
                  </ToolbarButton>
                  <ToolbarButton
                    active={activeFormats.justifyCenter}
                    className={getButtonClass('justifyCenter')}
                    onClick={() => exec('justifyCenter')}
                    title="Align center"
                  >
                    <FaAlignCenter size={13} />
                  </ToolbarButton>
                  <ToolbarButton
                    active={activeFormats.justifyRight}
                    className={getButtonClass('justifyRight')}
                    onClick={() => exec('justifyRight')}
                    title="Align right"
                  >
                    <FaAlignRight size={13} />
                  </ToolbarButton>
                </div>
              </>
            )}

            {/* ---------------- Color ---------------- */}
            {flags.colors && (
              <>
                <ToolbarDivider />
                <ToolbarButton
                  className={`${btnClass} hover:bg-gray-200`}
                  onClick={() => setShowColorPicker((v) => !v)}
                  title="Text color"
                >
                  <FaPalette size={13} />
                </ToolbarButton>
              </>
            )}

            {/* ---------------- Image ---------------- */}
            {flags.images && (
              <>
                <ToolbarDivider />
                <div className="relative">
                  <ToolbarButton
                    className={`${btnClass} hover:bg-gray-200 relative`}
                    onClick={() => setShowImageOptions((v) => !v)}
                    title="Insert image"
                  >
                    <FaImage size={13} />
                    {uploadingImage && (
                      <span className="absolute -top-1 -right-1 w-3 h-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                      </span>
                    )}
                  </ToolbarButton>

                  {showImageOptions && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-30 min-w-45">
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={uploadingImage}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition flex items-center gap-2"
                      >
                        <FaImage size={14} className="text-blue-500" />
                        Upload &amp; Insert Image
                      </button>
                      <div className="text-xs text-gray-400 px-3 py-1 border-t border-gray-100 mt-1">
                        Max {formatBytes(maxUploadBytes)} • JPG, PNG, GIF, WebP
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </>
            )}

            {/* ---------------- History ---------------- */}
            {flags.history && (
              <>
                <ToolbarDivider />
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <ToolbarButton
                    className={`${btnClass} hover:bg-gray-200`}
                    onClick={undo}
                    title="Undo (Ctrl+Z)"
                  >
                    <FaUndo size={13} />
                  </ToolbarButton>
                  <ToolbarButton
                    className={`${btnClass} hover:bg-gray-200`}
                    onClick={redo}
                    title="Redo (Ctrl+Y)"
                  >
                    <FaRedo size={13} />
                  </ToolbarButton>
                </div>
              </>
            )}

            {/* ---------------- EXTENSION POINT — caller-provided tools ---------------- */}
            {extraTools.length > 0 && (
              <>
                <ToolbarDivider />
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {extraTools.map((tool) => (
                    <ToolbarButton
                      key={tool.key}
                      active={tool.isActive?.(editorContext)}
                      className={`${btnClass} ${tool.isActive?.(editorContext)
                          ? activeBtnClass
                          : inactiveBtnClass
                        }`}
                      onClick={() => tool.action(editorContext)}
                      title={tool.title}
                    >
                      {tool.icon}
                    </ToolbarButton>
                  ))}
                </div>
              </>
            )}

            {/* ---------------- View toggles (right-aligned) ---------------- */}
            <div className="ml-auto flex items-center gap-1">
              {flags.preview && (
                <ToolbarButton
                  active={isPreview}
                  className={`${btnClass} ${isPreview ? activeBtnClass : inactiveBtnClass
                    }`}
                  onClick={togglePreview}
                  title={isPreview ? 'Back to edit' : 'Preview'}
                >
                  {isPreview ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                </ToolbarButton>
              )}
              {flags.codeView && (
                <ToolbarButton
                  active={isCodeView}
                  className={`${btnClass} ${isCodeView ? activeBtnClass : inactiveBtnClass
                    }`}
                  onClick={toggleCodeView}
                  title={isCodeView ? 'Back to edit' : 'HTML'}
                >
                  <FaCode size={13} />
                </ToolbarButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          EDIT VIEW — always mounted, hidden while in preview/code view.
          ================================================================ */}
      <div
        className={contentBoxClass}
        style={contentBoxStyle}
        hidden={isPreview || isCodeView}
      >
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleEditorKeyDown}
          className="editor-placeholder rte-content p-3 sm:p-4 focus:outline-none"
          style={{ minHeight: '100%' }}
          data-placeholder={placeholder}
          aria-label={placeholder}
          role="textbox"
          aria-multiline="true"
        />
      </div>

      {/* ================================================================
          PREVIEW VIEW
          ================================================================ */}
      {isPreview && (
        <div
          className={`${contentBoxClass} rte-content p-3 sm:p-4`}
          style={contentBoxStyle}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(value || '', {
              ALLOWED_TAGS: ALLOWED_PASTE_TAGS,
              ALLOWED_ATTR: ALLOWED_PASTE_ATTRS,
            }),
          }}
        />
      )}

      {/* ================================================================
          CODE VIEW
          ================================================================ */}
      {isCodeView && (
        <textarea
          className={`w-full p-3 sm:p-4 font-mono text-xs sm:text-sm focus:outline-none resize-none bg-gray-50 ${minHeight}`}
          style={contentBoxStyle}
          value={codeValue}
          onChange={(e) => handleCodeChange(e.target.value)}
          spellCheck={false}
        />
      )}

      {/* ================================================================
          STATUS BAR
          ================================================================ */}
      <div className="border-t border-gray-200 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>
            {readOnly
              ? 'Read-only'
              : isPreview
                ? 'Preview'
                : isCodeView
                  ? 'HTML'
                  : 'Edit'}
          </span>
          {!isPreview && !isCodeView && <span>Characters: {charCount}</span>}
        </div>
        {!readOnly && !isPreview && !isCodeView && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
              Active
            </span>
            <span className="text-gray-400">Ctrl+B / I / U</span>
          </div>
        )}
      </div>

      {/* Slot: caller-provided content shown after the status bar. */}
      {footerContent}

      {/* ================================================================
          COLOR PICKER MODAL
          ================================================================ */}
      {showColorPicker && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowColorPicker(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-xl shadow-2xl p-6 z-50"
            style={{ minWidth: '300px' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Choose Color</h3>
              <button
                onClick={() => setShowColorPicker(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColor(c)}
                  className="w-9 h-9 rounded-lg border-2 border-gray-200 hover:scale-110 transition-transform hover:border-blue-500"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="pt-3 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Color
              </label>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColor(e.target.value)}
                className="w-full h-12 cursor-pointer rounded-lg"
              />
            </div>
          </div>
        </>
      )}

      {/* ================================================================
          IMAGE SETTINGS MODAL
          ================================================================ */}
      {showImageSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Image Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="50"
                  max="1200"
                  value={imageSettings.width}
                  onChange={(e) =>
                    setImageSettings({
                      ...imageSettings,
                      width: parseInt(e.target.value, 10) || 400,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alignment
                </label>
                <div className="flex gap-4">
                  {['left', 'center', 'right'].map((a) => (
                    <label key={a} className="flex items-center gap-2 capitalize">
                      <input
                        type="radio"
                        value={a}
                        checked={imageSettings.alignment === a}
                        onChange={() =>
                          setImageSettings({ ...imageSettings, alignment: a })
                        }
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={imageSettings.alt}
                  onChange={(e) =>
                    setImageSettings({ ...imageSettings, alt: e.target.value })
                  }
                  placeholder="Image description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowImageSettingsModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={insertImageWithSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Optional: uncomment if you want a barrel export for the folder.
// export { default as RichTextEditor } from './RichTextEditor';
// export * from './editorConfig';