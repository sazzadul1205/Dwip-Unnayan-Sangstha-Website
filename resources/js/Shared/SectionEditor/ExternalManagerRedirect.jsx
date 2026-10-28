// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/ExternalManagerRedirect.jsx

import React from 'react';
import { FaExternalLinkAlt, FaInfoCircle } from 'react-icons/fa';

/**
 * ExternalManagerRedirect
 * ------------------------------------------------------------------
 * ONE generic READ-ONLY notice for every page-level section whose data
 * is owned by another manager (Shared Data, Blogs, Publications,
 * About Content, ...).
 *
 * Sections that used to duplicate this whole template now keep only
 * their data extraction + the config below.
 *
 * Variants
 * - "full"   : section title + info box + item list + optional extras
 *              (`children`) + optional "no data" warning + action button
 *              + footer note. Used by the Editors/* redirect notices.
 * - "notice" : compact info box + action link. Used by inline notices
 *              such as RenderDataTab's SharedDataNotice.
 *
 * NOTE: every Tailwind class is written out in full (never interpolated)
 * so Tailwind v4's scanner can actually see the utilities.
 */

const TONES = {
  blue: {
    box: 'bg-blue-50 border-blue-200',
    iconWrap: 'bg-blue-100 text-blue-600',
    heading: 'text-blue-800',
    text: 'text-blue-700',
    hint: 'text-blue-600',
    dot: 'bg-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  purple: {
    box: 'bg-purple-50 border-purple-200',
    iconWrap: 'bg-purple-100 text-purple-600',
    heading: 'text-purple-800',
    text: 'text-purple-700',
    hint: 'text-purple-600',
    dot: 'bg-purple-500',
    button: 'bg-purple-600 hover:bg-purple-700',
  },
  orange: {
    box: 'bg-orange-50 border-orange-200',
    iconWrap: 'bg-orange-100 text-orange-600',
    heading: 'text-orange-800',
    text: 'text-orange-700',
    hint: 'text-orange-600',
    dot: 'bg-orange-500',
    button: 'bg-orange-600 hover:bg-orange-700',
  },
  indigo: {
    box: 'bg-indigo-50 border-indigo-200',
    iconWrap: 'bg-indigo-100 text-indigo-600',
    heading: 'text-indigo-800',
    text: 'text-indigo-700',
    hint: 'text-indigo-600',
    dot: 'bg-indigo-500',
    button: 'bg-indigo-600 hover:bg-indigo-700',
  },
};

const ExternalManagerRedirect = ({
  // ---- shell ----
  sectionTitle,
  icon: Icon,
  tone = 'blue',

  // ---- info box ----
  heading,
  description,
  hint,

  // ---- item list ----
  listLabel,
  itemNoun = 'item',
  items = [],
  emptyList,

  // ---- extra blocks (settings grid, stats, previews) ----
  children,

  // ---- optional "no data" warning ----
  noDataTitle,
  noDataHint,

  // ---- action ----
  actionLabel = 'Open Manager',
  actionRoute, // Ziggy route name -> rendered as a <button> (full variant)
  actionHref, // plain path       -> rendered as an <a>      (notice variant)

  // ---- footer note ----
  footerNote,

  hasData = false,
  variant = 'full',
}) => {
  const t = TONES[tone] || TONES.blue;

  // ===== COMPACT VARIANT (inline notice) =====
  if (variant === 'notice') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-1">{heading}</h3>
        <p className="text-sm text-blue-700">{description}</p>
        {actionHref && (
          <a
            href={actionHref}
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <FaExternalLinkAlt size={12} />
            {actionLabel}
          </a>
        )}
      </div>
    );
  }

  // ===== FULL VARIANT =====
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {sectionTitle && (
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{sectionTitle}</h3>
      )}

      {/* ===== INFO BOX ===== */}
      {/* Explains that this section is managed elsewhere */}
      <div className={`mb-4 p-4 rounded-lg border ${t.box}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.iconWrap}`}>
              {Icon ? <Icon size={20} /> : null}
            </div>
          </div>
          <div>
            <h4 className={`text-sm font-semibold ${t.heading}`}>{heading}</h4>
            {description && <p className={`text-sm mt-1 ${t.text}`}>{description}</p>}
            {hint && <p className={`text-xs mt-1 ${t.hint}`}>{hint}</p>}
          </div>
        </div>
      </div>

      {/* ===== ITEM COUNT AND PREVIEW ===== */}
      {/* Shows how many items are available and previews the first few */}
      {listLabel && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">{listLabel}</h4>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            {hasData && items.length > 0 ? (
              <div className="space-y-2">
                {/* Item count */}
                <p className="text-xs text-gray-500">
                  <span className="font-medium">{items.length}</span> {itemNoun}
                  {items.length > 1 ? 's' : ''} available
                </p>
                {/* Item tags - show first 3 */}
                <div className="flex flex-wrap gap-1">
                  {items.slice(0, 3).map((label, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                      {label}
                    </span>
                  ))}
                  {/* Show "+N more" if more than 3 items */}
                  {items.length > 3 && (
                    <span className="text-xs text-gray-400 px-2 py-1">
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

      {/* ===== SECTION SPECIFIC EXTRAS ===== */}
      {children}

      {/* ===== NO DATA STATE ===== */}
      {!hasData && noDataTitle && (
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2">
            <FaInfoCircle className="text-yellow-600" size={16} />
            <p className="text-sm text-yellow-700">{noDataTitle}</p>
          </div>
          {noDataHint && <p className="text-xs text-yellow-600 mt-1">{noDataHint}</p>}
        </div>
      )}

      {/* ===== ACTION BUTTON ===== */}
      {/* Navigates user to the manager where they can edit */}
      {actionRoute && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              window.location.href = route(actionRoute);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition text-sm font-medium ${t.button}`}
          >
            <FaExternalLinkAlt size={14} />
            {actionLabel}
          </button>
        </div>
      )}

      {/* ===== FOOTER NOTE ===== */}
      {/* Reminder that this section is read-only and where to make changes */}
      {footerNote && (
        <div className="mt-3 text-xs text-gray-400 border-t border-gray-200 pt-3">
          {footerNote}
        </div>
      )}

    </div>
  );
};

export default ExternalManagerRedirect;
