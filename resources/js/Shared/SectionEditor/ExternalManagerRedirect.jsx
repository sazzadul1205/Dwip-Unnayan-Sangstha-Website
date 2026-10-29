// resources/js/Shared/SectionEditor/ExternalManagerRedirect.jsx

import React from 'react';
import { FaExternalLinkAlt, FaInfoCircle } from 'react-icons/fa';

const TONES = {
  blue: {
    box: 'bg-blue-50 ring-blue-100',
    iconWrap: 'bg-blue-100 text-blue-600',
    heading: 'text-blue-900',
    text: 'text-blue-800',
    hint: 'text-blue-600',
    dot: 'bg-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25',
  },
  emerald: {
    box: 'bg-emerald-50 ring-emerald-100',
    iconWrap: 'bg-emerald-100 text-emerald-600',
    heading: 'text-emerald-900',
    text: 'text-emerald-800',
    hint: 'text-emerald-600',
    dot: 'bg-emerald-500',
    button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25',
  },
  violet: {
    box: 'bg-violet-50 ring-violet-100',
    iconWrap: 'bg-violet-100 text-violet-600',
    heading: 'text-violet-900',
    text: 'text-violet-800',
    hint: 'text-violet-600',
    dot: 'bg-violet-500',
    button: 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/25',
  },
  orange: {
    box: 'bg-orange-50 ring-orange-100',
    iconWrap: 'bg-orange-100 text-orange-600',
    heading: 'text-orange-900',
    text: 'text-orange-800',
    hint: 'text-orange-600',
    dot: 'bg-orange-500',
    button: 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/25',
  },
  indigo: {
    box: 'bg-indigo-50 ring-indigo-100',
    iconWrap: 'bg-indigo-100 text-indigo-600',
    heading: 'text-indigo-900',
    text: 'text-indigo-800',
    hint: 'text-indigo-600',
    dot: 'bg-indigo-500',
    button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25',
  },
  slate: {
    box: 'bg-slate-50 ring-slate-200',
    iconWrap: 'bg-slate-100 text-slate-600',
    heading: 'text-slate-900',
    text: 'text-slate-700',
    hint: 'text-slate-500',
    dot: 'bg-slate-500',
    button: 'bg-slate-600 hover:bg-slate-700 shadow-slate-600/25',
  },
};

const ExternalManagerRedirect = ({
  sectionTitle,
  icon: Icon,
  tone = 'blue',
  heading,
  description,
  hint,
  listLabel,
  itemNoun = 'item',
  items = [],
  emptyList,
  children,
  noDataTitle,
  noDataHint,
  actionLabel = 'Open Manager',
  actionRoute,
  actionHref,
  footerNote,
  hasData = false,
  variant = 'full',
}) => {
  const t = TONES[tone] ?? TONES.blue;

  if (variant === 'notice') {
    return (
      <div className={`rounded-lg p-4 ring-1 ${t.box}`}>
        <h3 className={`mb-1 text-sm font-semibold ${t.heading}`}>{heading}</h3>
        <p className={`text-sm ${t.text}`}>{description}</p>
        {actionHref && (
          <a
            href={actionHref}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition ${t.button}`}
          >
            <FaExternalLinkAlt size={10} /> {actionLabel}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sectionTitle && (
        <h3 className="text-sm font-semibold text-slate-800">{sectionTitle}</h3>
      )}

      {/* Info box */}
      <div className={`rounded-xl p-4 ring-1 ${t.box}`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.iconWrap}`}>
            {Icon && <Icon size={18} />}
          </div>
          <div className="min-w-0">
            <h4 className={`text-sm font-semibold ${t.heading}`}>{heading}</h4>
            {description && <p className={`mt-1 text-sm ${t.text}`}>{description}</p>}
            {hint && <p className={`mt-1 text-xs ${t.hint}`}>{hint}</p>}
          </div>
        </div>
      </div>

      {/* Item list */}
      {listLabel && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {listLabel}
          </h4>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            {hasData && items.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{items.length}</span>{' '}
                  {itemNoun}
                  {items.length > 1 ? 's' : ''} available
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.slice(0, 3).map((label, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
                      {label}
                    </span>
                  ))}
                  {items.length > 3 && (
                    <span className="px-2 py-1 text-xs text-slate-400">
                      +{items.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ) : (
              emptyList
            )}
          </div>
        </div>
      )}

      {children}

      {!hasData && noDataTitle && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <FaInfoCircle className="shrink-0 text-amber-500" size={13} />
            <p className="text-sm text-amber-800">{noDataTitle}</p>
          </div>
          {noDataHint && <p className="mt-1 text-xs text-amber-700">{noDataHint}</p>}
        </div>
      )}

      {actionRoute && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { window.location.href = route(actionRoute); }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${t.button}`}
          >
            <FaExternalLinkAlt size={11} /> {actionLabel}
          </button>
        </div>
      )}

      {footerNote && (
        <div className="rounded-lg border-t border-slate-100 pt-3 text-xs text-slate-400">
          {footerNote}
        </div>
      )}
    </div>
  );
};

export default ExternalManagerRedirect;
