// resources/js/Sections/HtmlCssSection/HtmlCssEditor.jsx

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useDeferredValue,
} from 'react';

// Icons
import {
  FaCode,
  FaEye,
  FaMagic,
  FaHdd,
  FaTimes,
  FaEraser,
  FaExpand,
  FaCompress,
  FaSlidersH,
  FaInfoCircle,
  FaChevronDown,
  FaChevronRight,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { FaWandMagicSparkles } from 'react-icons/fa6';

// Shared Components
import CodePane from '../../Shared/SectionEditor/CodePane';
import { formatCode } from '../../Shared/SectionEditor/formatCode';
import CodeImageUpload from '../../Shared/SectionEditor/CodeImageUpload';
import { TextField, SelectField } from '../../Shared/SectionEditor/Fields';
import { useSectionEditor } from '../../Shared/SectionEditor/useSectionEditor';

// HTML & CSS Editors
import HtmlCssSection from './HtmlCssSection';

// ============================================
// STARTER SNIPPETS ("Example" button)
// ============================================
const EXAMPLE_HTML = `<div class="dus-feature">
  <h2>Built with plain HTML &amp; CSS</h2>
  <p>Tailwind classes are ignored here â€“ every style comes from the CSS box.</p>
  <a class="dus-feature__cta" href="/contact">Get in touch</a>
</div>`;

const EXAMPLE_CSS = `.dus-feature {
  padding: 32px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a, #1e3a8a);
  color: #ffffff;
}

.dus-feature h2 {
  font-size: 30px;
  line-height: 1.2;
  margin: 0 0 12px;
}

.dus-feature p {
  margin: 0 0 20px;
  color: #cbd5f5;
}

.dus-feature__cta {
  display: inline-block;
  padding: 12px 22px;
  border-radius: 999px;
  background: #009be2;
  color: #ffffff;
  text-decoration: none;
}`;

const TAILWIND_EXAMPLE_HTML = `<div class="mx-auto max-w-4xl px-4 text-center">
  <span class="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
    Welcome
  </span>
  <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
    Built with Tailwind classes
  </h2>
  <p class="mt-4 text-base text-gray-600 md:text-lg">
    No CSS box needed â€” style everything with the utility classes already used across the site.
  </p>
  <a
    href="/contact"
    class="mt-8 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
  >
    Get in touch
  </a>
</div>`;

const DEFAULT_DATA = {
  html: '',
  css: '',
  useTailwind: false,
  scopeCss: true,
  bgColor: '',
  paddingY: '',
  paddingX: '',
  sectionId: 'custom-html',
  sectionClassName: '',
};

const SNIPPET_BUTTON_CLASS =
  'rounded-md px-2 py-1 font-mono text-[10px] text-gray-600 transition ' +
  'hover:bg-blue-100 hover:text-blue-700 focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1';

// ============================================
// QUICK INSERT BUTTONS
// ============================================
const QUICK_SNIPPETS = [
  { key: 'div', label: '<div>', before: '\n<div class="my-block">\n  ', after: '\n</div>\n', caretInside: true },
  { key: 'h2', label: '<h2>', before: '\n<h2>', after: '</h2>\n', caretInside: true },
  { key: 'p', label: '<p>', before: '\n<p>', after: '</p>\n', caretInside: true },
  { key: 'ul', label: '<ul>', before: '\n<ul>\n  ', after: '\n</ul>\n', caretInside: true },
  { key: 'a', label: '<a>', before: '\n<a href="/contact">', after: '</a>\n', caretInside: true },
  { key: 'strong', label: '<b>', before: '<strong>', after: '</strong>', caretInside: true },
  { key: 'em', label: '<i>', before: '<em>', after: '</em>', caretInside: true },
];

const QUICK_CSS_SNIPPETS = [
  { key: 'rule', label: '+ rule', before: '\n.my-block {\n  ', after: '\n}\n', caretInside: true },
  { key: 'hover', label: ':hover', before: '\n.my-block:hover {\n  ', after: '\n}\n', caretInside: true },
  { key: 'media', label: '@media', before: '\n@media (max-width: 768px) {\n  ', after: '\n}\n', caretInside: true },
];

const TAILWIND_SNIPPETS = [
  {
    key: 'container',
    label: 'container',
    before: '\n<div class="mx-auto max-w-6xl px-4">\n  ',
    after: '\n</div>\n',
    caretInside: true,
  },
  {
    key: 'grid',
    label: 'grid',
    before: '\n<div class="grid grid-cols-1 gap-8 md:grid-cols-3">\n  ',
    after: '\n</div>\n',
    caretInside: true,
  },
  {
    key: 'card',
    label: 'card',
    before: '\n<div class="rounded-2xl bg-white p-6 shadow-lg">\n  ',
    after: '\n</div>\n',
    caretInside: true,
  },
  { key: 'h2tw', label: 'h2', before: '\n<h2 class="text-3xl font-bold text-gray-900 md:text-4xl">', after: '</h2>\n', caretInside: true },
  { key: 'ptw', label: 'p', before: '\n<p class="mt-4 text-base text-gray-600 md:text-lg">', after: '</p>\n', caretInside: true },
  {
    key: 'btntw',
    label: 'button',
    before:
      '\n<a href="#" class="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">',
    after: '</a>\n',
    caretInside: true,
  },
  {
    key: 'imgtw',
    label: 'img',
    before: '\n<img src="" alt="" class="h-auto w-full rounded-2xl object-cover" />\n',
    caretInside: false,
  },
];

// ============================================
// MARKUP HELPERS
// ============================================

// For values placed inside an HTML attribute.
const escapeAttr = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// For values placed inside a CSS url('...'). CSS is NOT HTML-decoded, so
// "&" must stay "&" â€” only quotes, backslashes and newlines need escaping.
const escapeCssUrl = (value = '') =>
  value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/[\r\n]+/g, '');

const IMG_SRC_SOURCE = String.raw`<img\b[^>]*?\ssrc\s*=\s*(["'])(.*?)\1`;
const CSS_URL_SOURCE = String.raw`url\(\s*(['"]?)([^'")]+)\1\s*\)`;

const isExternalImage = (url) => {
  if (!/^(?:https?:)?\/\//i.test(url)) return false;
  if (typeof window === 'undefined' || !window.location) return true;
  try {
    return new URL(url, window.location.href).origin !== window.location.origin;
  } catch {
    return true;
  }
};

const collectImageUrls = (...texts) => {
  const urls = [];
  texts.filter(Boolean).forEach((text) => {
    [IMG_SRC_SOURCE, CSS_URL_SOURCE].forEach((source) => {
      for (const match of text.matchAll(new RegExp(source, 'gi'))) {
        const url = (match[2] || '').trim();
        if (url && !url.startsWith('data:') && !urls.includes(url)) urls.push(url);
      }
    });
  });
  return urls;
};

const buildImgTag = ({ url, name }) =>
  `\n<img src="${escapeAttr(url)}" alt="${escapeAttr(name || 'image')}" ` +
  'style="max-width:100%;height:auto;border-radius:12px;display:block;margin:16px auto;" />\n';

const buildCssBackground = ({ url }) =>
  `\nbackground-image: url('${escapeCssUrl(url)}');\n` +
  'background-size: cover;\nbackground-position: center;\nbackground-repeat: no-repeat;\n';

const sanitizeAnchorId = (value = '') => value.replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// eslint-disable-next-line no-alert
const confirmAction = (message) => (typeof window === 'undefined' ? true : window.confirm(message));

const FORMAT_HINTS = {
  html: 'look for an unclosed tag or quote',
  css: 'look for an unclosed brace',
};

// Shared button classes for the header actions
const headerActionClass =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ' +
  'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ' +
  'disabled:cursor-not-allowed disabled:opacity-40';

// ============================================
// PREVIEW ERROR BOUNDARY
// A broken snippet must never take the whole editor down.
// ============================================
class PreviewBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prevProps) {
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="p-6 text-center text-sm text-red-600" role="alert">
          The preview could not render this markup. Fix the code and it will retry automatically.
        </p>
      );
    }
    return this.props.children;
  }
}

const HtmlCssEditor = ({ section, hasData, onDataChange, onUploadsChange }) => {
  const { formData, updateField, setFormData, isDirty } = useSectionEditor(section, DEFAULT_DATA, onDataChange);
  const [previewKey, setPreviewKey] = useState(0);
  const [formatError, setFormatError] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collapsed, setCollapsed] = useState({ html: false, css: false });

  const cardRef = useRef(null);
  const seededRef = useRef(false);
  const nativeFsRef = useRef(false);
  const htmlRef = useRef(null);
  const cssRef = useRef(null);
  // null = the user has not placed a caret yet â†’ insert at the end.
  const caretRef = useRef({ html: null, css: null });
  const pendingCaretRef = useRef(null);

  const html = typeof formData.html === 'string' ? formData.html : '';
  const css = typeof formData.css === 'string' ? formData.css : '';
  const isEmpty = html.trim() === '' && css.trim() === '';
  const useTailwind = formData.useTailwind === true;

  // Always holds the newest values, so async work can detect edits made meanwhile.
  const latestRef = useRef({ html, css });
  latestRef.current = { html, css };

  const previewData = useDeferredValue(formData);

  const htmlStats = useMemo(() => ({ lines: html.split('\n').length, chars: html.length }), [html]);
  const cssStats = useMemo(() => ({ lines: css.split('\n').length, chars: css.length }), [css]);

  const togglePane = useCallback((target) => {
    setCollapsed((prev) => ({ ...prev, [target]: !prev[target] }));
  }, []);

  // Switching mode swaps the starter snippet only if the user never edited it.
  const setMode = useCallback(
    (next) => {
      setFormData((prev) => {
        const htmlTrim = (prev.html || '').trim();
        const cssTrim = (prev.css || '').trim();
        const isCustomStarter = htmlTrim === EXAMPLE_HTML.trim() && cssTrim === EXAMPLE_CSS.trim();
        const isTailwindStarter = htmlTrim === TAILWIND_EXAMPLE_HTML.trim() && cssTrim === '';

        if (next && isCustomStarter) {
          return { ...prev, useTailwind: true, html: TAILWIND_EXAMPLE_HTML, css: '' };
        }
        if (!next && isTailwindStarter) {
          return { ...prev, useTailwind: false, html: EXAMPLE_HTML, css: EXAMPLE_CSS };
        }
        return { ...prev, useTailwind: next };
      });
      caretRef.current = { html: null, css: null };
    },
    [setFormData]
  );

  // Seed a starter snippet for brand-new sections.
  useEffect(() => {
    if (seededRef.current || hasData) return;
    if (typeof formData.html === 'string' && formData.html.trim() !== '') return;

    seededRef.current = true;
    setFormData((prev) => ({
      ...prev,
      html: useTailwind ? TAILWIND_EXAMPLE_HTML : EXAMPLE_HTML,
      css: useTailwind ? '' : EXAMPLE_CSS,
    }));
  }, [formData.html, hasData, setFormData, useTailwind]);

  const storedImages = useMemo(() => collectImageUrls(html, css), [html, css]);
  const externalImageCount = useMemo(
    () => storedImages.filter(isExternalImage).length,
    [storedImages]
  );

  // ------------------------------------------------------------------
  // Full-screen writing mode
  // Native Fullscreen API first, fixed-position overlay as a fallback.
  // ------------------------------------------------------------------
  const enterFullscreen = useCallback(async () => {
    const node = cardRef.current;
    if (!node) return;

    if (node.requestFullscreen) {
      try {
        await node.requestFullscreen();
        nativeFsRef.current = true;
        setIsFullscreen(true);
        return;
      } catch {
        /* fall through to the overlay fallback */
      }
    }

    nativeFsRef.current = false;
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (nativeFsRef.current && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* ignored */
      }
    }
    nativeFsRef.current = false;
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, isFullscreen]);

  // Ctrl/Cmd + Shift + F â€” only while focus is inside this editor.
  const handleCardKeyDown = useCallback(
    (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'KeyF') {
        event.preventDefault();
        toggleFullscreen();
      }
    },
    [toggleFullscreen]
  );

  // The browser exits native fullscreen on Escape by itself; keep our state in sync.
  useEffect(() => {
    const onFullscreenChange = () => {
      if (nativeFsRef.current && document.fullscreenElement !== cardRef.current) {
        nativeFsRef.current = false;
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Overlay fallback: Escape closes it, and the page behind stops scrolling.
  useEffect(() => {
    if (!isFullscreen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !nativeFsRef.current && !event.defaultPrevented) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  // Leave native fullscreen if the editor unmounts while it is active.
  useEffect(
    () => () => {
      if (nativeFsRef.current && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => { });
      }
    },
    []
  );

  const paneHeight = isFullscreen ? 'max(280px, calc(100vh - 420px))' : 340;

  // ------------------------------------------------------------------
  // Cursor-aware insertion into either code box
  // ------------------------------------------------------------------
  const rememberCaret = useCallback(
    (target) => (event) => {
      const el = event.currentTarget;
      const start = el.selectionStart ?? el.value.length;
      caretRef.current[target] = { start, end: el.selectionEnd ?? start };
    },
    []
  );

  const spliceAtSelection = useCallback(
    (target, { before, after = '', caretInside = false }) => {
      const current = target === 'css' ? css : html;
      const remembered = caretRef.current[target];

      const start = remembered ? clamp(remembered.start, 0, current.length) : current.length;
      const end = remembered ? clamp(remembered.end, start, current.length) : start;
      const selected = current.slice(start, end);

      const next = current.slice(0, start) + before + selected + after + current.slice(end);
      if (next === current) return;

      const insertedEnd = start + before.length + selected.length;
      pendingCaretRef.current = {
        target,
        position: caretInside ? insertedEnd : insertedEnd + after.length,
      };
      updateField(target, next);
    },
    [css, html, updateField]
  );

  const applyHtmlSnippet = useCallback(
    (snippet) => spliceAtSelection('html', snippet),
    [spliceAtSelection]
  );

  const applyCssSnippet = useCallback(
    (snippet) => spliceAtSelection('css', snippet),
    [spliceAtSelection]
  );

  const insertImage = useCallback(
    (asset) => spliceAtSelection('html', { before: buildImgTag(asset) }),
    [spliceAtSelection]
  );

  const insertCssBackground = useCallback(
    (asset) => spliceAtSelection('css', { before: buildCssBackground(asset) }),
    [spliceAtSelection]
  );

  const clearBox = useCallback(
    (target) => {
      const current = target === 'css' ? css : html;
      if (current === '') return;
      if (current.trim() !== '' && !confirmAction(`Clear the ${target.toUpperCase()} box? This cannot be undone.`)) {
        return;
      }
      pendingCaretRef.current = { target, position: 0 };
      updateField(target, '');
    },
    [css, html, updateField]
  );

  const handleUploaded = useCallback(
    (urls) => {
      if (!onUploadsChange || urls.length === 0) return;
      onUploadsChange((prev) => [...new Set([...prev, ...urls])]);
    },
    [onUploadsChange]
  );

  const handleInsertExample = useCallback(() => {
    const willOverwrite = useTailwind ? html.trim() !== '' : !isEmpty;
    if (willOverwrite && !confirmAction('Replace the current code with the starter example?')) return;

    caretRef.current = { html: null, css: null };
    // One functional update so both fields change together. In Tailwind mode the
    // saved CSS is left untouched (the UI promises it is kept).
    setFormData((prev) =>
      useTailwind
        ? { ...prev, html: TAILWIND_EXAMPLE_HTML }
        : { ...prev, html: EXAMPLE_HTML, css: EXAMPLE_CSS }
    );
  }, [html, isEmpty, setFormData, useTailwind]);

  const handleFormatAll = useCallback(async () => {
    if (isFormatting) return;

    const snapshot = { html, css };
    const fields = (useTailwind ? ['html'] : ['html', 'css']).filter(
      (field) => snapshot[field].trim() !== ''
    );
    if (fields.length === 0) return;

    setFormatError('');
    setIsFormatting(true);

    try {
      const results = await Promise.allSettled(
        fields.map((field) => formatCode(snapshot[field], field))
      );

      const patch = {};
      const failures = [];

      results.forEach((result, index) => {
        const field = fields[index];
        if (result.status === 'rejected') {
          failures.push(field);
          return;
        }
        // Skip no-ops and anything the user edited while Prettier was running.
        if (result.value !== snapshot[field] && latestRef.current[field] === snapshot[field]) {
          patch[field] = result.value;
        }
      });

      if (Object.keys(patch).length > 0) {
        caretRef.current = { html: null, css: null };
        setFormData((prev) => ({ ...prev, ...patch }));
      }

      if (failures.length > 0) {
        setFormatError(
          failures
            .map((field) => `Could not format the ${field.toUpperCase()} â€” ${FORMAT_HINTS[field]}.`)
            .join(' ')
        );
      }
    } finally {
      setIsFormatting(false);
    }
  }, [css, html, isFormatting, setFormData, useTailwind]);

  // Restore the caret after a programmatic insert (before paint â†’ no flicker).
  useLayoutEffect(() => {
    const pending = pendingCaretRef.current;
    if (!pending) return;
    pendingCaretRef.current = null;

    const el = pending.target === 'css' ? cssRef.current : htmlRef.current;
    if (!el) return;

    el.focus();
    el.setSelectionRange(pending.position, pending.position);
    caretRef.current[pending.target] = { start: pending.position, end: pending.position };
  }, [html, css]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div
      ref={cardRef}
      onKeyDown={handleCardKeyDown}
      className={
        isFullscreen
          ? 'fixed inset-0 z-9999 flex h-screen w-screen flex-col gap-4 overflow-hidden bg-gray-50 p-4'
          : 'space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5'
      }
    >
      {/* ===== HEADER ===== */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-200">
            <FaCode size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800">HTML / CSS Section</h3>
              <span
                aria-live="polite"
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${isDirty
                    ? 'bg-amber-50 text-amber-700 ring-amber-200'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isDirty ? 'bg-amber-500' : 'bg-emerald-500'}`}
                />
                {isDirty ? 'Unsaved' : 'Saved'}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {useTailwind
                ? 'Styling with Tailwind utility classes.'
                : 'Styling with your own CSS rules.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleFormatAll}
            disabled={isEmpty || isFormatting}
            title="Reformat the code with Prettier"
            className={`${headerActionClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-400`}
          >
            <FaWandMagicSparkles size={11} />
            {isFormatting ? 'Formattingâ€¦' : 'Format'}
          </button>
          <button
            type="button"
            onClick={handleInsertExample}
            title="Replace the code with a small starter snippet"
            className={`${headerActionClass} bg-blue-50 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-400`}
          >
            <FaMagic size={11} />
            Example
          </button>
          <span className="mx-0.5 hidden h-5 w-px bg-gray-200 sm:inline-block" />
          <button
            type="button"
            onClick={toggleFullscreen}
            title={
              isFullscreen
                ? 'Leave full screen (Ctrl/Cmd+Shift+F)'
                : 'Full screen for distraction-free editing (Ctrl/Cmd+Shift+F)'
            }
            className={`${headerActionClass} ${isFullscreen
                ? 'bg-gray-800 text-white hover:bg-gray-700 focus-visible:ring-gray-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400'
              }`}
          >
            {isFullscreen ? <FaCompress size={11} /> : <FaExpand size={11} />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full screen'}</span>
          </button>
        </div>
      </header>

      {/* ===== SCROLLABLE BODY ===== */}
      <div className={isFullscreen ? 'min-h-0 flex-1 space-y-4 overflow-y-auto pr-1' : 'space-y-4'}>
        {!hasData && (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-xs text-yellow-800">
            <FaInfoCircle size={13} className="mt-0.5 shrink-0 text-yellow-500" />
            <span>
              <strong className="font-semibold">New section.</strong>{' '}
              A starter snippet has been loaded â€” tweak it, then click{' '}
              <strong className="font-semibold">Save Changes</strong> to create this section.
            </span>
          </div>
        )}

        {formatError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-700"
          >
            <FaExclamationTriangle size={13} className="mt-0.5 shrink-0 text-red-500" />
            <span className="flex-1">{formatError}</span>
            <button
              type="button"
              onClick={() => setFormatError('')}
              aria-label="Dismiss message"
              className="rounded p-0.5 text-red-400 transition hover:bg-red-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <FaTimes size={11} />
            </button>
          </div>
        )}

        {/* ===== MODE SWITCHER ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Styling
            </span>
            <div role="group" aria-label="Styling mode" className="inline-flex rounded-lg bg-gray-100 p-0.5">
              <button
                type="button"
                aria-pressed={!useTailwind}
                onClick={() => setMode(false)}
                className={`rounded-md px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${!useTailwind ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Custom CSS
              </button>
              <button
                type="button"
                aria-pressed={useTailwind}
                onClick={() => setMode(true)}
                className={`rounded-md px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${useTailwind ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Tailwind
              </button>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            {useTailwind ? (
              <>
                Classes from the site&apos;s Tailwind build apply.
                {css.trim() !== '' && (
                  <span className="ml-1 font-medium text-amber-600">
                    Saved CSS is kept but ignored until you switch back.
                  </span>
                )}
              </>
            ) : (
              'Plain CSS only â€” Tailwind classes in the HTML are ignored.'
            )}
          </p>
        </div>

        {/* ===== INFO PILLS ===== */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-800 ring-1 ring-sky-100">
          <FaHdd size={12} className="shrink-0 text-sky-600" />
          <span className="font-medium">Images are stored on this server.</span>
          <span className="text-sky-700">
            Use <span className="font-semibold">Insert image</span> â€” the file uploads and a{' '}
            <code className="rounded bg-white px-1">/storage/editor-images/â€¦</code> URL is dropped
            into your markup.
          </span>
        </div>

        {externalImageCount > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
            <FaExclamationTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              {externalImageCount} image{externalImageCount > 1 ? 's are' : ' is'} linked from an
              external host (<code className="rounded bg-white px-1">http(s)://â€¦</code>). Upload{' '}
              {externalImageCount > 1 ? 'them' : 'it'} with{' '}
              <span className="font-semibold">Insert image</span> and replace the link so the site
              does not depend on someone else&apos;s server.
            </span>
          </div>
        )}

        {/* ===== CODE BOXES ===== */}
        <div className={useTailwind ? 'space-y-3' : 'grid grid-cols-1 gap-3 lg:grid-cols-2'}>
          {/* ---------- HTML ---------- */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => togglePane('html')}
                aria-expanded={!collapsed.html}
                aria-controls="html-css-editor-html-pane"
                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {collapsed.html ? (
                  <FaChevronRight size={10} className="text-gray-400" />
                ) : (
                  <FaChevronDown size={10} className="text-gray-400" />
                )}
                HTML
              </button>
              <span className="text-[10px] tabular-nums text-gray-400">
                {htmlStats.lines} lines Â· {htmlStats.chars} chars
              </span>
            </div>

            {/* Hidden, not unmounted: keeps the textarea's undo history and scroll position. */}
            <div id="html-css-editor-html-pane" hidden={collapsed.html}>
              <div className="mb-1.5 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/70 px-1.5 py-1.5">
                <CodeImageUpload
                  onInsertImage={insertImage}
                  onInsertCssBackground={insertCssBackground}
                  onUploaded={handleUploaded}
                  existingImages={storedImages}
                />
                <span className="mx-0.5 h-4 w-px bg-gray-200" />
                {(useTailwind ? TAILWIND_SNIPPETS : QUICK_SNIPPETS).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHtmlSnippet(item)}
                    title={`Insert ${item.label} at the cursor`}
                    className={SNIPPET_BUTTON_CLASS}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => clearBox('html')}
                  disabled={html === ''}
                  title="Empty the HTML box"
                  aria-label="Empty the HTML box"
                  className="ml-auto rounded-md px-1.5 py-1 text-[10px] text-gray-500 transition hover:bg-red-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FaEraser size={11} />
                </button>
              </div>

              <CodePane
                language="html"
                label="index.html"
                value={html}
                onChange={(value) => updateField('html', value)}
                textareaRef={htmlRef}
                onCaret={rememberCaret('html')}
                height={paneHeight}
                headerHint='Tab indents Â· Enter auto-indents Â· {} " auto-close'
                actions={
                  storedImages.length > 0 ? (
                    <span className="rounded-full bg-[#3c3c3c] px-1.5 text-[10px] text-[#9cdcfe]">
                      {storedImages.length} image{storedImages.length > 1 ? 's' : ''}
                    </span>
                  ) : null
                }
              />
            </div>
          </div>

          {/* ---------- CSS (hidden entirely in Tailwind mode) ---------- */}
          {!useTailwind && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => togglePane('css')}
                  aria-expanded={!collapsed.css}
                  aria-controls="html-css-editor-css-pane"
                  className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  {collapsed.css ? (
                    <FaChevronRight size={10} className="text-gray-400" />
                  ) : (
                    <FaChevronDown size={10} className="text-gray-400" />
                  )}
                  CSS
                </button>
                <span className="text-[10px] tabular-nums text-gray-400">
                  {cssStats.lines} lines Â· {cssStats.chars} chars
                </span>
              </div>

              <div id="html-css-editor-css-pane" hidden={collapsed.css}>
                <div className="mb-1.5 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/70 px-1.5 py-1.5">
                  {QUICK_CSS_SNIPPETS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyCssSnippet(item)}
                      title={`Insert ${item.label} at the cursor`}
                      className={SNIPPET_BUTTON_CLASS}
                    >
                      {item.label}
                    </button>
                  ))}
                  <p className="ml-auto hidden text-[10px] text-gray-400 lg:block">
                    Hover an image thumbnail for a CSS background
                  </p>
                </div>

                <CodePane
                  language="css"
                  label="style.css"
                  value={css}
                  onChange={(value) => updateField('css', value)}
                  textareaRef={cssRef}
                  onCaret={rememberCaret('css')}
                  height={paneHeight}
                  headerHint="Tab indents Â· Enter auto-indents Â· {} auto-close"
                />
              </div>
            </div>
          )}
        </div>

        {/* ===== CSS SCOPING (custom mode only) ===== */}
        {!useTailwind && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2">
            <input
              type="checkbox"
              checked={formData.scopeCss !== false}
              onChange={(e) => updateField('scopeCss', e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-blue-600"
            />
            <span className="text-[11px] leading-relaxed text-gray-600">
              <strong className="font-semibold text-gray-700">Scope CSS to this section</strong>{' '}
              <span className="text-gray-400">
                (recommended) â€” every rule is prefixed with this section&apos;s wrapper, so{' '}
                <code className="rounded border border-gray-200 bg-white px-1">h1 {'{'} â€¦ {'}'}</code>{' '}
                only affects this section.
              </span>
            </span>
          </label>
        )}

        {/* ===== LAYOUT SETTINGS (collapsible) ===== */}
        <details open className="group overflow-hidden rounded-xl border border-gray-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <FaSlidersH size={11} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700">Layout &amp; display</span>
            </span>
            <FaChevronDown size={10} className="text-gray-400 transition group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 p-4 md:grid-cols-2">
            <TextField
              label="Section ID (anchor)"
              value={formData.sectionId || ''}
              onChange={(e) => updateField('sectionId', sanitizeAnchorId(e.target.value))}
              placeholder="custom-html"
            />
            <TextField
              label="Additional CSS Classes"
              value={formData.sectionClassName || ''}
              onChange={(e) => updateField('sectionClassName', e.target.value)}
              placeholder="optional classes"
            />
            <SelectField
              label="Background Color"
              value={formData.bgColor || ''}
              onChange={(e) => updateField('bgColor', e.target.value)}
              options={[
                { value: 'bg-transparent', label: 'Transparent' },
                { value: 'bg-white', label: 'White' },
                { value: 'bg-[#F5F5F5]', label: 'Gray' },
                { value: 'bg-[#F9F9FA]', label: 'Off White' },
              ]}
            />
            <SelectField
              label="Vertical Padding"
              value={formData.paddingY || ''}
              onChange={(e) => updateField('paddingY', e.target.value)}
              options={[
                { value: '', label: 'None' },
                { value: 'py-5 sm:py-10 md:py-15 lg:py-20', label: 'Small' },
                { value: 'py-10 sm:py-15 md:py-25 lg:py-37.5', label: 'Medium' },
                { value: 'py-15 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
              ]}
            />
            <SelectField
              label="Horizontal Padding"
              value={formData.paddingX || ''}
              onChange={(e) => updateField('paddingX', e.target.value)}
              options={[
                { value: '', label: 'None' },
                { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
                { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
                { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
              ]}
            />
          </div>
        </details>

        {/* ===== LIVE PREVIEW ===== */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <FaEye className="text-gray-500" size={13} />
              <h4 className="text-xs font-semibold text-gray-700">Live preview</h4>
              <span className="hidden text-[10px] text-gray-400 sm:inline">
                Rendered with the same scoping used on the website
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewKey((prev) => prev + 1)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Refresh
            </button>
          </div>
          <div className="bg-white">
            {isEmpty ? (
              <p className="p-6 text-center text-sm text-gray-400">
                Nothing to preview yet â€” add HTML and CSS above.
              </p>
            ) : (
              <PreviewBoundary resetKey={`${previewKey}:${previewData.html}:${previewData.css}`}>
                <HtmlCssSection key={previewKey} data={previewData} />
              </PreviewBoundary>
            )}
          </div>
        </div>

        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-400">
          <FaInfoCircle size={11} className="mt-0.5 shrink-0" />
          <span>
            <code className="rounded bg-gray-100 px-1">&lt;script&gt;</code> tags and inline event
            handlers are stripped for safety, and{' '}
            <code className="rounded bg-gray-100 px-1">&lt;style&gt;</code> tags inside the HTML box
            are ignored â€” put your rules in the CSS box instead.
          </span>
        </p>
      </div>
    </div>
  );
};

export default HtmlCssEditor;
