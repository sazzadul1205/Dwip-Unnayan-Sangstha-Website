// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/CodePane.jsx

import React, { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { highlight } from './codeHighlight';
import { formatCode } from './formatCode';

// The highlight layer and the textarea must agree on every metric that affects
// glyph position, otherwise the caret drifts away from the character it sits on.
const CODE_FONT = {
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: '13px',
  lineHeight: '20px',
  tabSize: 2,
  fontVariantLigatures: 'none',
  letterSpacing: 'normal',
  whiteSpace: 'pre',
  wordWrap: 'normal',
  overflowWrap: 'normal',
};

const INDENT = '  ';
const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
const CLOSERS = new Set(Object.values(PAIRS));
const BRACKETS = { '(': ')', '[': ']', '{': '}' };
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);
// Lazy attribute match so `<br />` is seen as self-closing.
const OPEN_TAG = /<([A-Za-z][\w:-]*)(?:\s[^<>]*?)?(\/?)>$/;

// ------------------------------------------------------------------
// Text helpers
// ------------------------------------------------------------------
const countLines = (value) => {
  let lines = 1;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '\n') lines += 1;
  }
  return lines;
};

// lastIndexOf('\n', -1) matches index 0, so position 0 needs its own case.
const lineStartOf = (text, position) =>
  position === 0 ? 0 : text.lastIndexOf('\n', position - 1) + 1;

const leadingWhitespace = (line) => /^[ \t]*/.exec(line)[0];

const locate = (text, position) => {
  let line = 1;
  let last = -1;
  for (let i = text.indexOf('\n'); i !== -1 && i < position; i = text.indexOf('\n', i + 1)) {
    line += 1;
    last = i;
  }
  return { line, column: position - last };
};

const isOpeningTag = (textBeforeCaret) => {
  const match = OPEN_TAG.exec(textBeforeCaret.trimEnd());
  return Boolean(match) && !match[2] && !VOID_TAGS.has(match[1].toLowerCase());
};

/** Indent / outdent every line touched by the selection. */
const shiftLines = (text, start, end, outdent) => {
  // A selection ending right after a newline does not include the next line.
  const effectiveEnd = end > start && text[end - 1] === '\n' ? end - 1 : end;
  const from = lineStartOf(text, start);
  const newline = text.indexOf('\n', effectiveEnd);
  const to = newline === -1 ? text.length : newline;

  let firstDelta = 0;
  let total = 0;

  const lines = text
    .slice(from, to)
    .split('\n')
    .map((line, index) => {
      let next;
      if (outdent) next = line.replace(/^(?: {1,2}|\t)/, '');
      else next = line.length === 0 ? line : INDENT + line;

      const delta = next.length - line.length;
      if (index === 0) firstDelta = delta;
      total += delta;
      return next;
    });

  return {
    from,
    to,
    text: lines.join('\n'),
    changed: total !== 0,
    selStart: Math.max(from, start + firstDelta),
    selEnd: Math.max(from, end + total),
  };
};

// ------------------------------------------------------------------
// Line-number gutter (memoised: only re-renders when its props change)
// ------------------------------------------------------------------
const Gutter = memo(function Gutter({ count, active }) {
  return (
    <div
      aria-hidden="true"
      className="sticky left-0 z-10 min-w-12 shrink-0 select-none border-r border-[#3c3c3c] bg-[#1e1e1e] px-2 py-3 text-right text-[#6a737d]"
      style={CODE_FONT}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={i + 1 === active ? 'text-[#c6c6c6]' : undefined}>
          {i + 1}
        </div>
      ))}
    </div>
  );
});

const CodePane = ({
  language = 'html',
  label,
  value,
  onChange,
  textareaRef,
  onCaret,
  height = 320,
  actions = null,
  headerHint = null, // shown in the footer bar
}) => {
  const internalRef = useRef(null);
  const pendingSelectionRef = useRef(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ line: 1, column: 1 });

  const source = typeof value === 'string' ? value : '';
  const lineCount = useMemo(() => countLines(source), [source]);
  const highlighted = useMemo(() => highlight(source, language), [source, language]);

  // A trailing newline collapses inside <pre>, so give that last line a glyph.
  const layerHtml = highlighted + (source === '' || source.endsWith('\n') ? ' ' : '');

  const setTextareaRef = useCallback(
    (node) => {
      internalRef.current = node;
      if (typeof textareaRef === 'function') textareaRef(node);
      else if (textareaRef) textareaRef.current = node;
    },
    [textareaRef]
  );

  // ------------------------------------------------------------------
  // Caret reporting
  // ------------------------------------------------------------------
  const updateStatus = useCallback((el) => {
    const position = el.selectionDirection === 'backward' ? el.selectionStart : el.selectionEnd;
    const { line, column } = locate(el.value, position ?? 0);
    setStatus((prev) => (prev.line === line && prev.column === column ? prev : { line, column }));
  }, []);

  const reportCaret = useCallback(
    (event) => {
      updateStatus(event.currentTarget);
      if (onCaret) onCaret(event);
    },
    [onCaret, updateStatus]
  );

  const handleChange = useCallback(
    (event) => {
      onChange(event.target.value);
      setError((prev) => (prev ? '' : prev));
      reportCaret(event);
    },
    [onChange, reportCaret]
  );

  // Restore the selection after the fallback (non-execCommand) path re-rendered.
  useLayoutEffect(() => {
    const pending = pendingSelectionRef.current;
    const el = internalRef.current;
    if (!pending || !el) return;
    pendingSelectionRef.current = null;
    el.setSelectionRange(pending.start, pending.end);
    updateStatus(el);
    if (onCaret) onCaret({ currentTarget: el });
  }, [source, onCaret, updateStatus]);

  // ------------------------------------------------------------------
  // Editing. execCommand keeps the browser's native undo stack intact;
  // replacing the value through React would wipe it on every keystroke.
  // ------------------------------------------------------------------
  const applyEdit = useCallback(
    (from, to, insert, selStart, selEnd = selStart) => {
      const el = internalRef.current;
      if (!el) return;

      el.focus();
      el.setSelectionRange(from, to);

      let done = false;
      try {
        done =
          insert === ''
            ? document.execCommand('delete')
            : document.execCommand('insertText', false, insert);
      } catch {
        done = false;
      }

      if (!done) {
        const text = el.value;
        pendingSelectionRef.current = { start: selStart, end: selEnd };
        onChange(text.slice(0, from) + insert + text.slice(to));
        return;
      }

      el.setSelectionRange(selStart, selEnd);
      updateStatus(el);
      if (onCaret) onCaret({ currentTarget: el });
    },
    [onCaret, onChange, updateStatus]
  );

  const moveCaret = useCallback(
    (el, position) => {
      el.setSelectionRange(position, position);
      updateStatus(el);
      if (onCaret) onCaret({ currentTarget: el });
    },
    [onCaret, updateStatus]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;

      const altGraph = event.getModifierState?.('AltGraph');
      if ((event.ctrlKey || event.metaKey || event.altKey) && !altGraph) return;

      const el = event.currentTarget;
      const { selectionStart: start, selectionEnd: end, value: text } = el;
      const { key } = event;

      // ---- Tab / Shift+Tab -------------------------------------------
      if (key === 'Tab') {
        event.preventDefault();

        if (event.shiftKey || start !== end) {
          const result = shiftLines(text, start, end, event.shiftKey);
          if (result.changed) {
            applyEdit(result.from, result.to, result.text, result.selStart, result.selEnd);
          }
          return;
        }

        applyEdit(start, end, INDENT, start + INDENT.length);
        return;
      }

      // ---- Enter ------------------------------------------------------
      if (key === 'Enter') {
        event.preventDefault();

        const beforeCaret = text.slice(lineStartOf(text, start), start);
        const baseIndent = leadingWhitespace(beforeCaret);
        const prev = text[start - 1];

        const opensBracket = Boolean(BRACKETS[prev]);
        const opensTag = language === 'html' && isOpeningTag(beforeCaret);

        const sitsBetweenPair =
          start === end &&
          ((opensBracket && text[end] === BRACKETS[prev]) ||
            (opensTag && text.slice(end).startsWith('</')));

        if (sitsBetweenPair) {
          const inner = `\n${baseIndent}${INDENT}`;
          applyEdit(start, end, `${inner}\n${baseIndent}`, start + inner.length);
          return;
        }

        const insert = `\n${baseIndent}${opensBracket || opensTag ? INDENT : ''}`;
        applyEdit(start, end, insert, start + insert.length);
        return;
      }

      // ---- Backspace --------------------------------------------------
      if (key === 'Backspace' && start === end && start > 0) {
        const beforeCaret = text.slice(lineStartOf(text, start), start);

        // Only spaces before the caret: delete back to the previous indent stop.
        if (/^ +$/.test(beforeCaret)) {
          const remove = beforeCaret.length % INDENT.length || INDENT.length;
          event.preventDefault();
          applyEdit(start - remove, start, '', start - remove);
          return;
        }

        // Empty pair like (|) or "|": remove both characters.
        if (PAIRS[text[start - 1]] && PAIRS[text[start - 1]] === text[start]) {
          event.preventDefault();
          applyEdit(start - 1, start + 1, '', start - 1);
        }
        return;
      }

      if (key.length !== 1) return;

      // ---- Type over a closer that is already there -------------------
      if (CLOSERS.has(key) && start === end && text[start] === key) {
        event.preventDefault();
        moveCaret(el, start + 1);
        return;
      }

      const closer = PAIRS[key];
      if (!closer) return;

      // ---- Wrap the selection ----------------------------------------
      if (start !== end) {
        event.preventDefault();
        applyEdit(start, end, `${key}${text.slice(start, end)}${closer}`, start + 1, end + 1);
        return;
      }

      // ---- Auto-close ---------------------------------------------------
      const isQuote = key === '"' || key === "'";
      if (isQuote && /\w/.test(text[start - 1] ?? '')) return; // don't, it's, closing quote

      const next = text[start];
      if (next !== undefined && !/[\s<>)\]},;]/.test(next)) return;

      event.preventDefault();
      applyEdit(start, start, `${key}${closer}`, start + 1);
    },
    [applyEdit, language, moveCaret]
  );

  // ------------------------------------------------------------------
  // Format
  // ------------------------------------------------------------------
  const handleFormat = useCallback(async () => {
    if (busy) return;
    const snapshot = source;
    if (snapshot.trim() === '') return;

    setBusy(true);
    setError('');

    try {
      const formatted = await formatCode(snapshot, language);
      const el = internalRef.current;
      if (!el) return;

      if (el.value !== snapshot) {
        setError('The code changed while formatting, so the result was discarded. Run Format again.');
        return;
      }

      if (formatted !== snapshot) {
        const caret = Math.min(el.selectionStart ?? 0, formatted.length);
        applyEdit(0, snapshot.length, formatted, caret);
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? `Could not format — ${e.message.split('\n')[0]}`
          : 'Could not format this code. Check for an unclosed tag or brace.'
      );
    } finally {
      setBusy(false);
    }
  }, [applyEdit, busy, language, source]);

  // ------------------------------------------------------------------
  // Render
  //
  // One scroll container holds the gutter, the highlight layer and the
  // textarea. The highlight layer defines the size and the textarea is laid
  // over it, so nothing needs scroll syncing and nothing can drift.
  // ------------------------------------------------------------------
  return (
    <div className="overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] shadow-sm transition-colors focus-within:border-[#007acc]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#3c3c3c] bg-[#252526] px-2 py-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[#9cdcfe]">
          {label}
        </span>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleFormat}
          disabled={busy || source.trim() === ''}
          title="Format with Prettier"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#cccccc] transition hover:bg-[#3c3c3c] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FaWandMagicSparkles size={10} />
          {busy ? 'Formatting…' : 'Format'}
        </button>

        {actions}

        <span className="ml-auto font-mono text-[10px] text-[#858585]">
          Ln {status.line}, Col {status.column}
        </span>
      </div>

      <div style={{ height }}>
        <div className="h-full overflow-auto scheme-dark">
          <div className="relative flex min-h-full w-max min-w-full">
            <Gutter count={lineCount} active={status.line} />

            <div className="relative flex-1">
              <pre
                aria-hidden="true"
                className="pointer-events-none m-0 block p-3 pr-6 text-[#d4d4d4]"
                style={CODE_FONT}
              >
                <code style={CODE_FONT} dangerouslySetInnerHTML={{ __html: layerHtml }} />
              </pre>

              <textarea
                ref={setTextareaRef}
                value={source}
                onChange={handleChange}
                onSelect={reportCaret}
                onKeyUp={reportCaret}
                onMouseUp={reportCaret}
                onFocus={reportCaret}
                onKeyDown={handleKeyDown}
                wrap="off"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                aria-label={label}
                className="absolute inset-0 m-0 block h-full w-full resize-none overflow-hidden border-0 bg-transparent p-3 pr-6 text-transparent caret-[#d4d4d4] outline-none selection:bg-[#264f78]/70 selection:text-transparent"
                style={CODE_FONT}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-[#3c3c3c] bg-[#007acc] px-2 py-0.5 text-[10px] text-white">
        <span className="font-mono">{language === 'css' ? 'CSS' : 'HTML'}</span>
        <span className="font-mono">{lineCount} lines</span>
        <span className="font-mono">{source.length} chars</span>
        {headerHint && <span className="ml-auto truncate opacity-90">{headerHint}</span>}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-1.5 border-t border-[#68217a] bg-[#3b1f47] px-3 py-1.5 text-[11px] text-[#f48771]"
        >
          <FaExclamationTriangle size={11} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default CodePane;