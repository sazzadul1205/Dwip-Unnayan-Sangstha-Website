// resources/js/components/CustomEditor.jsx

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
  FaChevronDown,
  FaChevronUp,
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
  const [showMoreTools, setShowMoreTools] = useState(false);
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

  const btnClass = "p-1.5 sm:p-2 rounded-md transition flex items-center justify-center text-gray-700 min-w-[28px] sm:min-w-[36px] text-sm sm:text-base";
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

  // ========== TOGGLE MORE TOOLS ==========
  const toggleMoreTools = useCallback(() => {
    setShowMoreTools(prev => !prev);
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

  // ========== SYNC EXTERNAL VALUE ==========
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const el = editorRef.current;
    if (!el || !isInitialized.current) return;

    const currentHtml = el.innerHTML;
    const newValue = value || '';

    const normalize = (str) => str.replace(/\s+/g, ' ').trim();

    if (normalize(currentHtml) !== normalize(newValue)) {
      el.innerHTML = newValue;
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
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        exec('bold');
      }
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        exec('italic');
      }
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        exec('underline');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, exec]);

  const getButtonClass = (key) => `${btnClass} ${activeFormats[key] ? activeBtnClass : inactiveBtnClass}`;

  // ========== TOOLBAR GROUPS ==========
  const textFormattingTools = (
    <div className="flex items-center gap-0.5 sm:gap-1 border-r border-gray-300 pr-1.5 sm:pr-3 mr-1.5 sm:mr-3">
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
  );

  const listTools = (
    <div className="flex items-center gap-0.5 sm:gap-1 border-r border-gray-300 pr-1.5 sm:pr-3 mr-1.5 sm:mr-3">
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
  );

  const alignmentTools = (
    <div className="flex items-center gap-0.5 sm:gap-1 border-r border-gray-300 pr-1.5 sm:pr-3 mr-1.5 sm:mr-3">
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
  );

  const historyTools = (
    <div className="flex items-center gap-0.5 sm:gap-1 border-r border-gray-300 pr-1.5 sm:pr-3 mr-1.5 sm:mr-3">
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
  );

  const viewTools = (
    <div className="flex items-center gap-0.5 sm:gap-1">
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
  );

  // ========== RENDER ==========
  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm ${className}`}>
      {/* TOOLBAR */}
      {!isPreview && !isCodeView && (
        <div className="border-b bg-gray-50 px-1.5 sm:px-3 py-1.5 sm:py-2 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2 min-w-min flex-wrap">
            {/* Always visible tools */}
            {textFormattingTools}
            
            {/* Tools that hide on small screens */}
            <div className="hidden xs:flex items-center">
              {listTools}
            </div>
            <div className="hidden sm:flex items-center">
              {alignmentTools}
            </div>
            <div className="hidden xs:flex items-center">
              {historyTools}
            </div>

            {/* "More" toggle for mobile */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleMoreTools}
              className={`${btnClass} xs:hidden hover:bg-gray-200`}
              title="More tools"
            >
              {showMoreTools ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {/* View tools - always visible on right */}
            <div className="ml-auto flex items-center">
              {viewTools}
            </div>
          </div>

          {/* Expanded tools for mobile (shown when "More" is clicked) */}
          {showMoreTools && (
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-200">
              {listTools}
              {alignmentTools}
              {historyTools}
            </div>
          )}
        </div>
      )}

      {/* Editor Content */}
      {isPreview ? (
        <div
          className={`p-3 sm:p-4 ${minHeight} prose max-w-none overflow-auto text-sm sm:text-base`}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value || '') }}
        />
      ) : isCodeView ? (
        <textarea
          className={`w-full p-3 sm:p-4 ${minHeight} font-mono text-xs sm:text-sm focus:outline-none resize-none bg-gray-50`}
          value={value || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue);
          }}
          placeholder={placeholder}
          spellCheck={false}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={() => {
            if (savedRangeRef.current) {
              restoreSelection();
            }
          }}
          className={`p-3 sm:p-4 ${minHeight} focus:outline-none prose max-w-none overflow-auto editor-placeholder text-sm sm:text-base`}
          data-placeholder={placeholder}
          aria-label={placeholder}
          role="textbox"
          aria-multiline="true"
        />
      )}

      {/* Status bar */}
      <div className="border-t border-gray-200 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 xs:gap-0 text-[10px] sm:text-xs text-gray-500">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
              <span className="hidden xs:inline">Active</span>
            </span>
            <span className="text-[8px] sm:text-[10px] text-gray-400">
              Ctrl+B/I/U
            </span>
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 480px) {
          .xs\\:flex {
            display: flex !important;
          }
          .xs\\:hidden {
            display: none !important;
          }
          .xs\\:inline {
            display: inline !important;
          }
        }
        .xs\\:flex {
          display: none;
        }
        .xs\\:hidden {
          display: inline;
        }
        .xs\\:inline {
          display: none;
        }
        
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