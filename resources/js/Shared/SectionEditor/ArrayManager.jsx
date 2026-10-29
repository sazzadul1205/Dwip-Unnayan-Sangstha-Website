// resources/js/Shared/SectionEditor/ArrayManager.jsx

import React from 'react';
import { FaTrash, FaPlus, FaInbox } from 'react-icons/fa';

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
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-4 py-8 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <FaInbox size={16} />
        </div>
        <p className="text-sm font-medium text-slate-600">
          No {itemLabel.toLowerCase()}s yet
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          Click below to add the first one
        </p>
        {showAddButton && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
          >
            <FaPlus size={10} /> {addLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          key={item.id || index}
          className="rounded-lg border border-slate-200 bg-white p-3.5 transition hover:border-slate-300"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                {index + 1}
              </span>
              {itemLabel}
            </span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              title={removeLabel}
              aria-label={`${removeLabel} ${itemLabel} ${index + 1}`}
            >
              <FaTrash size={11} />
            </button>
          </div>
          {renderItem(item, index)}
        </div>
      ))}

      {showAddButton && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
        >
          <FaPlus size={10} /> {addLabel}
        </button>
      )}
    </div>
  );
};

export default ArrayManager;
