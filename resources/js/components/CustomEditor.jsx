import { useState, useRef, useEffect, useCallback } from 'react';
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
  FaUndo,
  FaRedo,
  FaEraser,
  FaEye,
  FaEyeSlash,
  FaCode,
} from 'react-icons/fa';
import DOMPurify from 'dompurify';

export default function CustomEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  showPreviewToggle = true,
  showCodeView = false,
  minHeight = 'min-h-52',
  className = '',
}) {
  const editorRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const typingTimeout = useRef(null);
  const isInternalUpdate = useRef(false);
  const savedRangeRef = useRef(null);
  const isInitialized = useRef(false);

  const [isPreview, setIsPreview] = useState(false);
  const [isCodeView, setIsCodeView] = useState(false);
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

  const btnClass = "p-2 rounded-md transition flex items-center justify-center text-gray-700 min-w-[36px]";
  const activeBtnClass = "bg-blue-500 text-white";
  const inactiveBtnClass = "hover:bg-gray-200";

  // ========== SELECTION ==========
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      try {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      } catch (e) {
        console.error(e);
       }
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      } catch (e) {
        console.error(e);
       }
    }
  }, []);

  // ========== HISTORY ==========
  const pushHistory = useCallback((html) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(html);
    historyIndexRef.current++;
    if (historyRef.current.length > 100) {
      historyRef.current = historyRef.current.slice(-100);
      historyIndexRef.current = historyRef.current.length - 1;
    }
  }, []);

  // ========== ACTIVE FORMATS ==========
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
    } catch (e) {
      console.error(e);
     }
  }, []);

  // ========== INPUT HANDLER ==========
  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      const html = el.innerHTML;
      isInternalUpdate.current = true;
      onChange(html);
      pushHistory(html);
    }, 100);
  }, [onChange, pushHistory]);

  // ========== EXEC COMMAND ==========
  const exec = useCallback((cmd) => {
    const el = editorRef.current;
    if (!el) return;

    el.focus();
    restoreSelection();
    document.execCommand(cmd, false, null);
    // Trigger input handler to save state
    const html = el.innerHTML;
    isInternalUpdate.current = true;
    onChange(html);
    pushHistory(html);
    updateActiveFormats();
  }, [onChange, pushHistory, restoreSelection, updateActiveFormats]);

  // ========== UNDO / REDO ==========
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const html = historyRef.current[historyIndexRef.current];
    if (editorRef.current && html !== undefined) {
      isInternalUpdate.current = true;
      editorRef.current.innerHTML = html;
      onChange(html);
    }
  }, [onChange]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const html = historyRef.current[historyIndexRef.current];
    if (editorRef.current && html !== undefined) {
      isInternalUpdate.current = true;
      editorRef.current.innerHTML = html;
      onChange(html);
    }
  }, [onChange]);

  // ========== TOGGLE PREVIEW ==========
  const togglePreview = useCallback(() => {
    setIsPreview(prev => !prev);
  }, []);

  // ========== TOGGLE CODE VIEW ==========
  const toggleCodeView = useCallback(() => {
    setIsCodeView(prev => !prev);
  }, []);

  // ========== INITIALIZE ==========
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || '';
      historyRef.current = [value || ''];
      historyIndexRef.current = 0;
      isInitialized.current = true;
    }
  }, [value]);

  // ========== SYNC EXTERNAL VALUE - FIXED ==========
  useEffect(() => {
    // Skip if this is an internal update (we just changed it ourselves)
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const el = editorRef.current;
    if (!el || !isInitialized.current) return;

    // Only update if the value is different AND it's not just whitespace differences
    const currentHtml = el.innerHTML;
    const newValue = value || '';

    // Normalize both strings for comparison (remove extra whitespace)
    const normalize = (str) => str.replace(/\s+/g, ' ').trim();

    if (normalize(currentHtml) !== normalize(newValue)) {
      el.innerHTML = newValue;
      // Don't push to history for external changes
    }
  }, [value]);

  // ========== SELECTION TRACKER ==========
  useEffect(() => {
    const handleSelectionChange = () => {
      const el = editorRef.current;
      if (el && document.activeElement === el) {
        updateActiveFormats();
        saveSelection();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updateActiveFormats, saveSelection]);

  // ========== CLEANUP ==========
  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  // ========== KEYBOARD SHORTCUTS ==========
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z for undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y for redo
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      // Ctrl+B for bold
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        exec('bold');
      }
      // Ctrl+I for italic
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        exec('italic');
      }
      // Ctrl+U for underline
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        exec('underline');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, exec]);

  const getButtonClass = (key) => `${btnClass} ${activeFormats[key] ? activeBtnClass : inactiveBtnClass}`;

  // ========== RENDER ==========
  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm ${className}`}>
      {/* TOOLBAR */}
      {!isPreview && !isCodeView && (
        <div className="border-b bg-gray-50 px-3 py-2 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-min flex-wrap">
            {/* Text formatting */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => exec('bold')} 
                className={getButtonClass('bold')} 
                title="Bold (Ctrl+B)"
              >
                <FaBold />
              </button>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => exec('italic')} 
                className={getButtonClass('italic')} 
                title="Italic (Ctrl+I)"
              >
                <FaItalic />
              </button>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => exec('underline')} 
                className={getButtonClass('underline')} 
                title="Underline (Ctrl+U)"
              >
                <FaUnderline />
              </button>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => exec('strikeThrough')} 
                className={getButtonClass('strikeThrough')} 
                title="Strikethrough"
              >
                <FaStrikethrough />
              </button>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => exec('removeFormat')} 
                className={`${btnClass} hover:bg-gray-200`} 
                title="Clear formatting"
              >
                <FaEraser />
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => exec('insertUnorderedList')} 
                className={getButtonClass('insertUnorderedList')} 
                title="Bulleted list"
              >
                <FaListUl />
              </button>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => exec('insertOrderedList')} 
                className={getButtonClass('insertOrderedList')} 
                title="Numbered list"
              >
                <FaListOl />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => exec('justifyLeft')} 
                className={getButtonClass('justifyLeft')} 
                title="Align left"
              >
                <FaAlignLeft />
              </button>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => exec('justifyCenter')} 
                className={getButtonClass('justifyCenter')} 
                title="Align center"
              >
                <FaAlignCenter />
              </button>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => exec('justifyRight')} 
                className={getButtonClass('justifyRight')} 
                title="Align right"
              >
                <FaAlignRight />
              </button>
            </div>

            {/* History */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={undo} 
                className={btnClass} 
                title="Undo (Ctrl+Z)"
              >
                <FaUndo />
              </button>
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={redo} 
                className={btnClass} 
                title="Redo (Ctrl+Y)"
              >
                <FaRedo />
              </button>
            </div>

            {/* View controls */}
            <div className="flex items-center gap-1">
              {showPreviewToggle && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={togglePreview}
                  className={`${btnClass} ${isPreview ? activeBtnClass : inactiveBtnClass}`}
                  title={isPreview ? 'Edit mode' : 'Preview mode'}
                >
                  {isPreview ? <FaEyeSlash /> : <FaEye />}
                </button>
              )}
              {showCodeView && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggleCodeView}
                  className={`${btnClass} ${isCodeView ? activeBtnClass : inactiveBtnClass}`}
                  title={isCodeView ? 'Hide HTML' : 'Show HTML'}
                >
                  <FaCode />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      {isPreview ? (
        // Preview mode
        <div
          className={`p-4 ${minHeight} prose max-w-none overflow-auto`}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value || '') }}
        />
      ) : isCodeView ? (
        // Code view - show raw HTML
        <textarea
          className={`w-full p-4 ${minHeight} font-mono text-sm focus:outline-none resize-none bg-gray-50`}
          value={value || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue);
          }}
          placeholder={placeholder}
          spellCheck={false}
        />
      ) : (
        // Editor mode
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={() => {
            // Restore selection when focus is regained
            if (savedRangeRef.current) {
              restoreSelection();
            }
          }}
          className={`p-4 ${minHeight} focus:outline-none prose max-w-none overflow-auto editor-placeholder`}
          data-placeholder={placeholder}
          aria-label={placeholder}
          role="textbox"
          aria-multiline="true"
        />
      )}

      {/* Status bar */}
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-1.5 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>
            {isPreview ? 'Preview' : isCodeView ? 'HTML View' : 'Edit Mode'}
          </span>
          {!isPreview && !isCodeView && (
            <span>
              Characters: {(value || '').replace(/<[^>]*>/g, '').length}
            </span>
          )}
        </div>
        {!isPreview && !isCodeView && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
              <span>Active</span>
            </span>
          </div>
        )}
      </div>

      <style>{`
        .editor-placeholder:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .editor-placeholder:focus:empty:before {
          content: attr(data-placeholder);
          color: #d1d5db;
          pointer-events: none;
        }
        /* Prose styles for consistent content */
        .prose {
          max-width: none;
        }
        .prose p {
          margin-bottom: 0.75rem;
        }
        .prose ul, .prose ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .prose ul {
          list-style-type: disc;
        }
        .prose ol {
          list-style-type: decimal;
        }
        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin-left: 0;
          color: #6b7280;
        }
        .prose h1, .prose h2, .prose h3, .prose h4 {
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .prose h1 { font-size: 2rem; }
        .prose h2 { font-size: 1.5rem; }
        .prose h3 { font-size: 1.25rem; }
        .prose h4 { font-size: 1rem; }
        .prose a {
          color: #2563eb;
          text-decoration: underline;
        }
        .prose img {
          max-width: 100%;
          height: auto;
        }
        .prose table {
          border-collapse: collapse;
          width: 100%;
        }
        .prose table th,
        .prose table td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
        }
        .prose table th {
          background-color: #f3f4f6;
        }
      `}</style>
    </div>
  );
}