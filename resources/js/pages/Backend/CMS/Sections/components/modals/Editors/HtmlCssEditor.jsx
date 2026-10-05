// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/HtmlCssEditor.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaCode,
  FaEye,
  FaMagic,
  FaHdd,
  FaExclamationTriangle,
  FaEraser,
  FaExpand,
  FaCompress,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { TextField, SelectField } from './shared/Fields';
import CodeImageUpload from './shared/CodeImageUpload';
import CodePane from './shared/CodePane';
import { formatCode } from './shared/formatCode';
import { useSectionEditor } from './shared/useSectionEditor';
import HtmlCssSection from '../../../../../../../Sections/HtmlCssSection/HtmlCssSection';

// ============================================
// STARTER SNIPPET ("Load example" button)
// ============================================
const EXAMPLE_HTML = `<div class="dus-feature">
  <h2>Built with plain HTML &amp; CSS</h2>
  <p>Tailwind classes are ignored here – every style comes from the CSS box.</p>
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
    No CSS box needed — style everything with the utility classes already used across the site.
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
  'rounded px-1.5 py-1 font-mono text-[10px] text-gray-600 transition hover:bg-blue-100 hover:text-blue-700';

// ============================================
// QUICK INSERT BUTTONS
// ============================================
const QUICK_SNIPPETS = [
  { key: 'div', label: '<div>', before: '\n<div class="my-block">\n  ', after: '\n</div>\n', caretInside: true },
  { key: 'h2', label: '<h2>', before: '\n<h2>', after: '</h2>\n', caretInside: true },
  { key: 'p', label: '<p>', before: '\n<p>', after: '</p>\n', caretInside: true },
  {
    key: 'ul',
    label: '<ul>',
    before: '\n<ul>\n  ',
    after: '\n</ul>\n',
    caretInside: true,
  },
  { key: 'a', label: '<a>', before: '\n<a href="/contact">', after: '</a>\n', caretInside: true },
  { key: 'strong', label: '<b>', before: '<strong>', after: '</strong>', caretInside: true },
  { key: 'em', label: '<i>', before: '<em>', after: '</em>', caretInside: true },
];

const QUICK_CSS_SNIPPETS = [
  { key: 'rule', label: '+ rule', before: '\n.my-block {\n  ', after: '\n}\n', caretInside: true },
  {
    key: 'hover',
    label: ':hover',
    before: '\n.my-block:hover {\n  ',
    after: '\n}\n',
    caretInside: true,
  },
  {
    key: 'media',
    label: '@media',
    before: '\n@media (max-width: 768px) {\n  ',
    after: '\n}\n',
    caretInside: true,
  },
];

// ============================================
// TAILWIND QUICK INSERT BUTTONS
//
// Every class here is force-generated into the stylesheet by the `@source
// inline(...)` safelist in resources/css/app.css, so these cannot silently
// render unstyled the way an arbitrary utility typed into the database would.
// ============================================
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
const escapeAttr = (value = '') =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const IMG_SRC_PATTERN = /<img[^>]+src=["']([^"']+)["']/gi;
const CSS_URL_PATTERN = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;

/**
 * True only for images genuinely hosted somewhere else.
 *
 * Older saves stored absolute URLs from `asset()` (for example
 * "https://dus.org/storage/editor-images/x.png"). Those are same-origin files
 * that already live on this server, so flagging them would send admins off to
 * re-upload images they already have.
 */
const isExternalImage = (url) => {
  if (!/^https?:\/\//i.test(url)) return false;
  if (typeof window === 'undefined' || !window.location?.origin) return true;

  return !url.toLowerCase().startsWith(window.location.origin.toLowerCase());
};

/** Pull every image URL already referenced by the markup / stylesheet. */
const collectImageUrls = (...texts) => {
  const urls = [];

  texts.filter(Boolean).forEach((text) => {
    [IMG_SRC_PATTERN, CSS_URL_PATTERN].forEach((pattern) => {
      pattern.lastIndex = 0;
      let match = pattern.exec(text);
      while (match) {
        const url = match[1].trim();
        if (url && !url.startsWith('data:') && !urls.includes(url)) urls.push(url);
        match = pattern.exec(text);
      }
    });
  });

  return urls;
};

/** Tailwind does not run in this section, so images get plain inline styles. */
const buildImgTag = ({ url, name }) =>
  `\n<img src="${escapeAttr(url)}" alt="${escapeAttr(name || 'image')}" ` +
  'style="max-width:100%;height:auto;border-radius:12px;display:block;margin:16px auto;" />\n';

const buildCssBackground = ({ url }) =>
  `\nbackground-image: url('${escapeAttr(url)}');\n` +
  'background-size: cover;\nbackground-position: center;\nbackground-repeat: no-repeat;\n';

const HtmlCssEditor = ({ section, hasData, onDataChange, onUploadsChange }) => {
  const { formData, updateField, setFormData, isDirty } = useSectionEditor(section, DEFAULT_DATA, onDataChange);
  const [previewKey, setPreviewKey] = useState(0);
  const [formatError, setFormatError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collapsed, setCollapsed] = useState({ html: false, css: false });

  const cardRef = useRef(null);
  const seededRef = useRef(false);
  const htmlRef = useRef(null);
  const cssRef = useRef(null);
  const caretRef = useRef({ html: { start: 0, end: 0 }, css: { start: 0, end: 0 } });
  const pendingCaretRef = useRef(null);

  const html = typeof formData.html === 'string' ? formData.html : '';
  const css = typeof formData.css === 'string' ? formData.css : '';
  const isEmpty = html.trim() === '' && css.trim() === '';
  const useTailwind = formData.useTailwind === true;

  const togglePane = useCallback((target) => {
    setCollapsed((prev) => ({ ...prev, [target]: !prev[target] }));
  }, []);

  const setMode = useCallback(
    (next) => {
      updateField('useTailwind', next);
    },
    [updateField]
  );

  /**
   * Open a brand-new section on a ready-made example so the admin starts from
   * something that already renders. Uses setFormData rather than updateField
   * because filling a blank section is not an edit the admin has to save.
   */
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

  // Images already referenced by this section — powers the image library.
  const storedImages = useMemo(() => collectImageUrls(html, css), [html, css]);
  const externalImageCount = useMemo(
    () => storedImages.filter(isExternalImage).length,
    [storedImages]
  );

  // ------------------------------------------------------------------
  // Full-screen writing mode
  // ------------------------------------------------------------------
  const enterFullscreen = useCallback(async () => {
    const node = cardRef.current;
    if (!node) return;

    try {
      // The real Fullscreen API escapes the section modal's stacking context.
      if (node.requestFullscreen) {
        await node.requestFullscreen();
        return;
      }
    } catch {
      // Denied (or unsupported): the CSS overlay below still works.
    }
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Nothing to leave; just clear the flag.
    }
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, isFullscreen]);

  // The browser owns Escape while the native fullscreen is active, so only the
  // CSS overlay needs a manual handler.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() === 'f' && event.ctrlKey && event.shiftKey) {
        event.preventDefault();
        toggleFullscreen();
        return;
      }
      if (event.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
        event.preventDefault();
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  // Leaving full screen from the browser chrome (Esc, F11) still has to reset us.
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // In full screen the panes take whatever height the viewport can spare.
  const paneHeight = isFullscreen ? 'calc(100vh - 420px)' : 340;

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

  /**
   * Splices `before + selection + after` into a code box at the selection.
   * With `caretInside` the caret lands between the tags (so the admin can type
   * straight away); otherwise it ends up after the whole snippet.
   */
  const spliceAtSelection = useCallback(
    (target, { before, after = '', caretInside = false }) => {
      const current = target === 'css' ? css : html;
      const remembered = caretRef.current[target] || { start: current.length, end: current.length };

      const start = Math.min(remembered.start ?? current.length, current.length);
      const end = Math.min(Math.max(remembered.end ?? start, start), current.length);
      const selected = current.slice(start, end);

      const next = current.slice(0, start) + before + selected + after + current.slice(end);
      const insertedEnd = start + before.length + selected.length;

      pendingCaretRef.current = {
        target,
        position: caretInside ? insertedEnd : insertedEnd + after.length,
      };
      updateField(target, next);
    },
    [css, html, updateField]
  );

  /** Quick-tag buttons: insert a skeleton or wrap the current selection. */
  const applyHtmlSnippet = useCallback(
    ({ before, after = '', caretInside = false }) => {
      spliceAtSelection('html', { before, after, caretInside });
    },
    [spliceAtSelection]
  );

  const applyCssSnippet = useCallback(
    ({ before, after = '', caretInside = false }) => {
      spliceAtSelection('css', { before, after, caretInside });
    },
    [spliceAtSelection]
  );

  // An <img> tag only makes sense in the markup, so it always lands in HTML.
  const insertImage = useCallback(
    (asset) => {
      spliceAtSelection('html', { before: buildImgTag(asset) });
    },
    [spliceAtSelection]
  );

  const insertCssBackground = useCallback(
    (asset) => {
      spliceAtSelection('css', { before: buildCssBackground(asset) });
    },
    [spliceAtSelection]
  );

  const clearBox = useCallback(
    (target) => {
      pendingCaretRef.current = { target, position: 0 };
      updateField(target, '');
    },
    [updateField]
  );

  /**
   * Images are written to disk the moment they are inserted, so the parent
   * needs the list to reclaim anything this session never saves.
   */
  const handleUploaded = useCallback(
    (urls) => {
      if (!onUploadsChange || urls.length === 0) return;
      onUploadsChange((prev) => [...new Set([...prev, ...urls])]);
    },
    [onUploadsChange]
  );

  const handleInsertExample = useCallback(() => {
    if (useTailwind) {
      updateField('html', TAILWIND_EXAMPLE_HTML);
      updateField('css', '');
      return;
    }
    updateField('html', EXAMPLE_HTML);
    updateField('css', EXAMPLE_CSS);
  }, [updateField, useTailwind]);

  /**
   * Formats both panes in one pass so the two halves of the section stay in the
   * same house style. A pane that fails to parse is left exactly as typed.
   */
  const handleFormatAll = useCallback(async () => {
    setFormatError('');

    // The CSS box is not part of the output in Tailwind mode, so only the
    // markup is worth reformatting.
    const jobs = useTailwind
      ? [[html, 'html', 'html']]
      : [
          [html, 'html', 'html'],
          [css, 'css', 'css'],
        ];

    const results = await Promise.allSettled(
      jobs.map(([code, language]) => formatCode(code, language))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') updateField(jobs[index][2], result.value);
    });

    const labels = jobs.map(([, , field]) => field.toUpperCase());
    const failed = labels.filter((_, index) => results[index].status === 'rejected');

    if (failed.length === jobs.length) {
      setFormatError(`Could not format the ${failed.join(' or the ')} — look for an unclosed tag or brace.`);
    } else if (failed.length > 0) {
      setFormatError(
        `Could not format the ${failed[0]} — ${
          failed[0] === 'HTML' ? 'look for an unclosed tag or quote.' : 'look for an unclosed brace.'
        }`
      );
    }
  }, [css, html, updateField, useTailwind]);

  // Restore the caret once React has written the new value into the textarea.
  useEffect(() => {
    const pending = pendingCaretRef.current;
    if (!pending) return;
    pendingCaretRef.current = null;

    const el = pending.target === 'css' ? cssRef.current : htmlRef.current;
    if (!el) return;

    el.focus();
    el.setSelectionRange(pending.position, pending.position);
    caretRef.current[pending.target] = { start: pending.position, end: pending.position };
  }, [html, css]);

  // Start with the caret at the end of the HTML box so the first insert lands
  // in a sensible place when the admin has not clicked into either textarea yet.
  useEffect(() => {
    caretRef.current.html = { start: html.length, end: html.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={cardRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[9999] flex h-screen w-screen flex-col overflow-hidden bg-white p-4'
          : 'bg-white rounded-lg border border-gray-200 p-4 space-y-4'
      }
    >
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <FaCode className="text-blue-600 mt-0.5" size={16} />
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Edit HTML / CSS Section</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {useTailwind ? (
                <>
                  <strong className="text-gray-600">Tailwind mode.</strong> Style with the utility classes already
                  used across the site — the CSS box is not needed.
                </>
              ) : (
                <>
                  <strong className="text-gray-600">Custom CSS mode.</strong> Tailwind utility classes do{' '}
                  <strong>not</strong> apply here — the HTML is styled only by the CSS you write below.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFormatAll}
            disabled={isEmpty}
            title="Reformat both the HTML and the CSS with Prettier"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaWandMagicSparkles size={11} />
            Format all
          </button>
          <button
            type="button"
            onClick={handleInsertExample}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition"
            title="Replace the boxes with a small starter snippet"
          >
            <FaMagic size={11} />
            Load example
          </button>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              isDirty ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {isDirty ? 'Unsaved changes' : 'Saved'}
          </span>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={
              isFullscreen
                ? 'Leave full screen (Ctrl+Shift+F)'
                : 'Full screen for distraction-free editing (Ctrl+Shift+F)'
            }
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              isFullscreen
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isFullscreen ? <FaCompress size={11} /> : <FaExpand size={11} />}
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>
      </div>

      <div className={isFullscreen ? 'min-h-0 flex-1 space-y-4 overflow-y-auto pr-1' : 'space-y-4'}>
          {!hasData && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            No content exists yet. Paste your HTML and CSS below, then click "Save Changes" to create it.
          </div>
        )}

        {formatError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-700">
            <FaExclamationTriangle size={13} className="mt-0.5 shrink-0 text-red-500" />
            <span>{formatError}</span>
          </div>
        )}

        {/* ===== STYLE MODE ===== */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="text-[11px] font-semibold text-gray-600">Style with</span>

            <div className="flex overflow-hidden rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={() => setMode(false)}
                className={`px-3 py-1.5 text-[11px] font-semibold transition ${
                  useTailwind ? 'bg-white text-gray-500 hover:bg-gray-50' : 'bg-gray-800 text-white'
                }`}
              >
                Custom CSS
              </button>
              <button
                type="button"
                onClick={() => setMode(true)}
                className={`px-3 py-1.5 text-[11px] font-semibold transition ${
                  useTailwind ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                Tailwind classes
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-gray-500">
              {useTailwind ? (
                <>
                  The website&apos;s Tailwind build styles this section, so you can leave the CSS box alone entirely.
                  {css.trim() !== '' && (
                    <span className="ml-1 font-medium text-amber-600">
                      Saved CSS is kept but ignored until you switch back.
                    </span>
                  )}
                </>
              ) : (
                <>Write plain CSS below. Tailwind classes in the HTML are ignored in this mode.</>
              )}
            </p>
          </div>

          {/* ===== IMAGE STORAGE NOTICE ===== */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
          <FaHdd size={13} className="shrink-0 text-blue-600" />
          <span className="font-medium">Images are stored on this server</span>
          <span className="text-blue-600">
            Use <span className="font-semibold">Insert image</span> — the file is uploaded and a{' '}
            <code className="rounded bg-white px-1">/storage/editor-images/…</code> URL is dropped into your markup, so
            no external image host is needed.
          </span>
        </div>

        {externalImageCount > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
            <FaExclamationTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              {externalImageCount} image{externalImageCount > 1 ? 's are' : ' is'} linked from an external host
              (<code className="rounded bg-white px-1">http(s)://…</code>). Upload {externalImageCount > 1 ? 'them' : 'it'}{' '}
              with <span className="font-semibold">Insert image</span> and replace the link so the site does not depend
              on someone else's server.
            </span>
          </div>
        )}

        {/* ===== CODE BOXES ===== */}
        <div className={useTailwind ? 'space-y-3' : 'grid grid-cols-1 gap-3 lg:grid-cols-2'}>
          {/* ---------- HTML ---------- */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => togglePane('html')}
                aria-expanded={!collapsed.html}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-blue-700"
              >
                {collapsed.html ? (
                  <FaChevronRight size={11} className="text-gray-400" />
                ) : (
                  <FaChevronDown size={11} className="text-gray-400" />
                )}
                HTML
              </button>
              <span className="text-[10px] text-gray-400">
                {html.split('\n').length} lines · {html.length} chars
              </span>
            </div>

            {!collapsed.html && (
              <>
                {/* Toolbar: quick tags + image upload */}
                <div className="mb-1.5 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1.5">
                  <CodeImageUpload
                    onInsertImage={insertImage}
                    onInsertCssBackground={insertCssBackground}
                    onUploaded={handleUploaded}
                    existingImages={storedImages}
                  />

                  <span className="mx-0.5 h-5 w-px bg-gray-200" />

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
                    className="ml-auto rounded px-1.5 py-1 text-[10px] text-gray-500 transition hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
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
                  headerHint="Tab indents · Enter auto-indents · {} &quot; auto-close"
                  actions={
                    storedImages.length > 0 ? (
                      <span className="rounded-full bg-[#3c3c3c] px-1.5 text-[10px] text-[#9cdcfe]">
                        {storedImages.length} image{storedImages.length > 1 ? 's' : ''}
                      </span>
                    ) : null
                  }
                />
              </>
            )}
          </div>

          {/* ---------- CSS (hidden entirely in Tailwind mode) ---------- */}
          {!useTailwind && (
            <div>
              <div className="mb-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePane('css')}
                  aria-expanded={!collapsed.css}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-blue-700"
                >
                  {collapsed.css ? (
                    <FaChevronRight size={11} className="text-gray-400" />
                  ) : (
                    <FaChevronDown size={11} className="text-gray-400" />
                  )}
                  CSS
                </button>
                <span className="text-[10px] text-gray-400">
                  {css.split('\n').length} lines · {css.length} chars
                </span>
              </div>

              {!collapsed.css && (
                <>
                  <div className="mb-1 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1.5">
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
                      Tip: hover an image thumbnail for a CSS background
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
                    headerHint="Tab indents · Enter auto-indents · {} auto-close"
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* ===== CSS SCOPING (Custom CSS mode only) ===== */}
        {!useTailwind && (
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.scopeCss !== false}
              onChange={(e) => updateField('scopeCss', e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-700">Scope CSS to this section</strong> (recommended). Every rule is
              prefixed with this section&apos;s wrapper, so{' '}
              <code className="bg-white px-1 rounded border border-gray-200">h1 {'{'} … {'}'}</code> only affects this
              section. Turn it off to write fully global CSS.
            </span>
          </label>
        )}

        {/* ===== LAYOUT SETTINGS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField
            label="Section ID (anchor)"
            value={formData.sectionId || ''}
            onChange={(e) => updateField('sectionId', e.target.value)}
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

        {/* ===== LIVE PREVIEW ===== */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <FaEye className="text-gray-500" size={13} />
              <h4 className="text-sm font-semibold text-gray-700">Live preview</h4>
              <p className="text-xs text-gray-400">Rendered with the exact same scoping used on the website</p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewKey((prev) => prev + 1)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Refresh preview
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {isEmpty ? (
              <p className="p-6 text-sm text-gray-400 text-center">Nothing to preview yet — add HTML and CSS above.</p>
            ) : (
              <HtmlCssSection key={previewKey} data={formData} />
            )}
          </div>
        </div>

        <p className="text-[11px] text-gray-400">
            Tip: <code className="bg-gray-100 px-1 rounded">&lt;script&gt;</code> tags and inline event handlers are
            stripped for safety, and <code className="bg-gray-100 px-1 rounded">&lt;style&gt;</code> tags inside the HTML box
            are ignored — put your rules in the CSS box instead.
          </p>
      </div>
    </div>
  );
};

export default HtmlCssEditor;
