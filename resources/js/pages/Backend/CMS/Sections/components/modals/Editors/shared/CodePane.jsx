// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/CodePane.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { FaAlignLeft, FaWandMagicSparkles } from 'react-icons/fa6';
import { highlight } from './codeHighlight';
import { formatCode } from './formatCode';

// Both layers must agree on every metric that affects glyph position, otherwise
// the caret drifts away from the character it is supposed to sit on.
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
const PAIR_CLOSERS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };

const countLines = (value) => {
  let lines = 1;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '\n') lines += 1;
  }
  return lines;
};

const leadingWhitespace = (line) => /^[ \t]*/.exec(line)[0];

const CodePane = ({
  language = 'html',
  label,
  value,
  onChange,
  textareaRef,
  onCaret,
  height = 320,
  actions = null,
  headerHint = null,
}) => {
  const preRef = useRef(null);
  const gutterRef = useRef(null);
  const internalRef = useRef(null);

  const [wrap, setWrap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ line: 1, column: 1 });

  const source = typeof value === 'string' ? value : '';
  const lineCount = useMemo(() => countLines(source), [source]);

  const html = useMemo(() => highlight(source, language), [source, language]);

  const setTextareaRef = useCallback(
    (node) => {
      internalRef.current = node;
      if (typeof textareaRef === 'function') textareaRef(node);
      else if (textareaRef) textareaRef.current = node;
    },
    [textareaRef]
  );

  /** The textarea is the only scroller; the highlight layer and gutter follow. */
  const syncScroll = useCallback((event) => {
    const { scrollTop, scrollLeft } = event.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = scrollTop;
  }, []);

  const reportCaret = useCallback(
    (event) => {
      const el = event.currentTarget;
      const upto = el.value.slice(0, el.selectionStart ?? 0);
      const breaks = upto.split('\n');
      setStatus({ line: breaks.length, column: breaks[breaks.length - 1].length + 1 });
      if (onCaret) onCaret(event);
    },
    [onCaret]
  );

  const emit = useCallback(
    (next, caret) => {
      onChange(next);
      if (caret === undefined) return;
      window.requestAnimationFrame(() => {
        const el = internalRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(caret, caret);
      });
    },
    [onChange]
  );

  const indentLines = useCallback(
    (text, start, end, outdent) => {
      const from = text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', end) === -1 ? text.length : text.indexOf('\n', end);
      const block = text.slice(from, lineEnd);
      const shifted = block
        .split('\n')
        .map((line) => {
          if (outdent) return line.replace(/^[ \t]{1,2}/, '');
          return line.length === 0 ? line : INDENT + line;
        })
        .join('\n');
      const delta = shifted.length - block.length;

      return {
        text: text.slice(0, from) + shifted + text.slice(lineEnd),
        caret: Math.max(from, end + delta),
      };
    },
    []
  );

  const handleKeyDown = useCallback(
    (event) => {
      const el = event.currentTarget;
      const { selectionStart: start, selectionEnd: end, value: text } = el;

      if (event.key === 'Tab') {
        const multiline = text.slice(start, end).includes('\n');

        if (event.shiftKey || multiline) {
          event.preventDefault();
          const result = indentLines(text, start, end, event.shiftKey);
          emit(result.text, result.caret);
          return;
        }

        event.preventDefault();
        emit(`${text.slice(0, start)}${INDENT}${text.slice(end)}`, start + INDENT.length);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const currentLine = text.slice(lineStart, start);
        let indent = leadingWhitespace(currentLine);

        // An opening brace opens a new level, matching how CSS blocks read.
        if (/[{(]\s*$/.test(currentLine)) indent += INDENT;

        const insert = `\n${indent}`;
        emit(text.slice(0, start) + insert + text.slice(end), start + insert.length);
        return;
      }

      if (event.key === 'Backspace' && start === end && start > 0) {
        const before = text.slice(start - 1, start);
        const after = text[start];

        if (INDENT.startsWith(before) && (after === ' ' || after === undefined)) {
          const target = before === '\t' ? 1 : before === '  ' ? 2 : 1;
          const from = start - target;
          if (leadingWhitespace(text.slice(0, start)) === text.slice(from, start)) {
            event.preventDefault();
            emit(text.slice(0, from) + text.slice(end), from);
          }
          return;
        }

        const closer = PAIR_CLOSERS[before];
        if (closer && after === closer) {
          event.preventDefault();
          emit(text.slice(0, start - 1) + text.slice(end), start - 1);
        }
        return;
      }

      const closer = PAIR_CLOSERS[event.key];
      if (!closer) return;

      // Type-over: skip the closer that was auto-inserted for us.
      if (closer === event.key && start === end && text[start] === closer) {
        event.preventDefault();
        emit(text, start + 1);
        return;
      }

      if (start !== end) return;

      const next = text[start];
      const safeAfter = next === undefined || /[\s>)\]},]/.test(next);
      if (!safeAfter) return;

      event.preventDefault();
      emit(`${text.slice(0, start)}${event.key}${closer}${text.slice(end)}`, start + 1);
    },
    [emit, indentLines]
  );

  const handleFormat = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError('');

    try {
      const formatted = await formatCode(source, language);
      if (formatted !== source) {
        onChange(formatted);
        window.requestAnimationFrame(() => internalRef.current?.focus());
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
  }, [busy, language, onChange, source]);

  useEffect(() => {
    if (wrap) {
      if (preRef.current) preRef.current.style.whiteSpace = 'pre-wrap';
      return;
    }
    if (preRef.current) preRef.current.style.whiteSpace = 'pre';
  }, [wrap]);

  // The highlight layer is re-derived from `source` on every render, so it stays
  // in step with changes that never came through the textarea (snippet buttons,
  // the formatter, "Load example").
  return (
    <div className="overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] shadow-sm">
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

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setWrap((prev) => !prev)}
          title={wrap ? 'Disable word wrap' : 'Enable word wrap'}
          className={`rounded p-1 transition hover:bg-[#3c3c3c] ${
            wrap ? 'text-[#4fc1ff]' : 'text-[#858585] hover:text-white'
          }`}
        >
          <FaAlignLeft size={10} />
        </button>

        {actions}

        <span className="ml-auto font-mono text-[10px] text-[#858585]">
          Ln {status.line}, Col {status.column}
        </span>
      </div>

      <div className="flex" style={{ height }}>
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="shrink-0 select-none overflow-hidden border-r border-[#3c3c3c] bg-[#1e1e1e] px-2 text-right text-[#6a737d]"
          style={{ ...CODE_FONT, lineHeight: '20px' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <pre
            ref={preRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-0 overflow-hidden p-3 text-[#d4d4d4]"
            style={CODE_FONT}
          >
            <code dangerouslySetInnerHTML={{ __html: html || ' ' }} />
          </pre>

          <textarea
            ref={setTextareaRef}
            value={source}
            onChange={(event) => onChange(event.target.value)}
            onScroll={syncScroll}
            onSelect={reportCaret}
            onKeyUp={reportCaret}
            onClick={reportCaret}
            onFocus={reportCaret}
            onKeyDown={handleKeyDown}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={label}
            placeholder=""
            className="absolute inset-0 h-full w-full resize-none overflow-auto border-0 bg-transparent p-3 text-transparent caret-[#d4d4d4] outline-none"
            style={CODE_FONT}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-[#3c3c3c] bg-[#007acc] px-2 py-0.5 text-[10px] text-white">
        <span className="font-mono">
          {language === 'css' ? 'CSS' : 'HTML'}
        </span>
        <span className="font-mono">{lineCount} lines</span>
        <span className="font-mono">{source.length} chars</span>
        {headerHint && <span className="ml-auto truncate opacity-90">{headerHint}</span>}
      </div>

      {error && (
        <div className="flex items-start gap-1.5 border-t border-[#68217a] bg-[#3b1f47] px-3 py-1.5 text-[11px] text-[#f48771]">
          <FaExclamationTriangle size={11} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default CodePane;