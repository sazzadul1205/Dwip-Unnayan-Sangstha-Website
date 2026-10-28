// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/ArrayManager.jsx

// react
import React from 'react';

// icons
import { FaTrash, FaPlus } from 'react-icons/fa';

/**
 * Reusable Array Manager Component
 * Handles adding/removing items from an array with confirmation
 */
const ArrayManager = ({
  items = [],
  onAdd,
  onRemove,
  addLabel = 'Add Item',
  removeLabel = 'Remove',
  itemLabel = 'Item',
  showAddButton = true,
  className = 'space-y-3',
  renderItem,
}) => {

  // No items added
  if (!items || items.length === 0) {
    return (
      <div>
        {showAddButton && (
          <button
            type="button"
            onClick={onAdd}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <FaPlus size={12} /> {addLabel}
          </button>
        )}
        <div className="text-center py-4 text-gray-400 text-sm">
          No {itemLabel.toLowerCase()}s added.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>

      {/* Items */}
      {items.map((item, index) => (
        <div key={item.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">
              {itemLabel} #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <FaTrash size={12} /> {removeLabel}
            </button>
          </div>
          {renderItem(item, index)}
        </div>
      ))}

      {/* Add Button */}
      {showAddButton && (
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <FaPlus size={12} /> {addLabel}
        </button>
      )}
    </div>
  );
};

export default ArrayManager;