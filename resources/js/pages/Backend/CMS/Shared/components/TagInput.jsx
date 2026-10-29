// resources/js/pages/Backend/CMS/Shared/components/TagInput.jsx
import { FaTag, FaTimes, FaExclamationCircle, FaLightbulb } from 'react-icons/fa';

const TagInput = ({
  tags = [],
  tagInput = '',
  suggestions = [],
  onAddTag,
  onRemoveTag,
  onInputChange,
  onKeyDown,
  error = null,
  maxTags = 10,
  placeholder = 'Type a tag and press Enter…',
}) => {
  const atMax = tags.length >= maxTags;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-slate-700">Tags</label>
        <span
          className={`text-xs font-medium tabular-nums ${atMax ? 'text-amber-600' : 'text-slate-400'
            }`}
        >
          {tags.length} / {maxTags}
        </span>
      </div>

      <div
        className={`flex min-h-11 flex-wrap gap-1.5 rounded-lg border bg-white p-2 transition-all ${error
            ? 'border-red-300 ring-4 ring-red-100/60'
            : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100/60'
          }`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 py-1 pl-2 pr-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100"
          >
            <FaTag size={9} className="opacity-60" />
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="rounded p-0.5 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              aria-label={`Remove ${tag}`}
            >
              <FaTimes size={9} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={atMax}
          className="min-w-32 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <FaExclamationCircle size={11} /> {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/50">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onAddTag(s)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50"
            >
              <FaTag size={10} className="text-slate-400" />
              {s}
            </button>
          ))}
        </div>
      )}

      {!error && (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <FaLightbulb size={10} className="text-amber-400" />
          Press
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1 font-mono text-[10px] text-slate-600">
            Enter
          </kbd>
          or
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1 font-mono text-[10px] text-slate-600">
            ,
          </kbd>
          to add
        </p>
      )}
    </div>
  );
};

export default TagInput;