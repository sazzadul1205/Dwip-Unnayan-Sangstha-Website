import { FaTag, FaTimes, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

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
  placeholder = 'Type a tag and press Enter...',
}) => {
  const handleSuggestionClick = (suggestion) => {
    if (onAddTag) onAddTag(suggestion);
  };

  const handleKeyDown = (e) => {
    if (onKeyDown) onKeyDown(e);
  };

  const handleInputChange = (e) => {
    if (onInputChange) onInputChange(e);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Tags <span className="text-gray-400 text-xs">(max {maxTags} tags)</span>
      </label>
      <div className="relative">
        <div
          className={`flex flex-wrap gap-2 p-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 min-h-10.5 transition ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              <FaTag size={10} />
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="hover:text-red-600 transition ml-0.5"
              >
                <FaTimes size={10} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-30 border-0 outline-none text-sm bg-transparent"
          />
        </div>

        {error && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <FaExclamationTriangle size={12} /> {error}
          </p>
        )}

        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition flex items-center gap-2"
              >
                <FaTag size={10} className="text-gray-400" />
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <FaInfoCircle className="text-gray-400" size={12} />
          <p className="text-xs text-gray-400">
            Press Enter or comma to add a tag. Click the X to remove.
            {tags.length > 0 && ` (${tags.length}/${maxTags})`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TagInput;
