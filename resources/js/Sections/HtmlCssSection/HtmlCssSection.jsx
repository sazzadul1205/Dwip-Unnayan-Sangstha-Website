// js/Sections/HtmlCssSection/HtmlCssSection.jsx
//
// "HTML / CSS Section" – renders raw HTML together with the CSS the admin
// pasted in the CMS.
//
// Two styling modes are supported:
//   * Custom CSS (default) – the admin's stylesheet is injected, scoped to this
//     section. Tailwind utility classes in the markup are not used.
//   * Tailwind mode (`useTailwind`) – the site's own Tailwind build styles the
//     markup, so any CSS saved for the section is deliberately ignored. This
//     keeps the CSS box free to be left empty or minimised.

import React, { useId, useMemo } from 'react';
import { sanitizeHTML, hasValue } from '../../utils/sectionHelpers';
import { scopeCss as scopeCssText } from '../../utils/scopeCss';

// ============================================
// SKELETON
// ============================================
const HtmlCssSkeleton = ({ sectionId, bgColor, paddingX, paddingY, sectionClassName }) => (
  <section id={sectionId} className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}>
    <div className="mx-auto w-full max-w-6xl animate-pulse space-y-4">
      <div className="h-8 w-2/3 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-200" />
      <div className="h-4 w-5/6 rounded bg-gray-200" />
      <div className="h-40 w-full rounded-2xl bg-gray-200" />
    </div>
  </section>
);

/**
 * HtmlCssSection Component
 */
const HtmlCssSection = ({
  data,
  htmlCssData,
  htmlCssSection,
  loading = false,
  bgColor,
  paddingY,
  paddingX,
  sectionId,
  sectionClassName,
  scopeCss = true,
}) => {
  const reactId = useId();

  // ============================================
  // RESOLVE DATA
  // ============================================
  const resolved = useMemo(() => {
    let source = data ?? htmlCssData ?? htmlCssSection ?? null;

    if (source && typeof source === 'object' && source.data && typeof source.data === 'object') {
      source = source.data;
    }

    return source && typeof source === 'object' ? source : {};
  }, [data, htmlCssData, htmlCssSection]);

  const safeSectionId =
    String(sectionId || resolved.sectionId || 'custom-html').replace(/[^a-zA-Z0-9_-]/g, '-') || 'custom-html';

  // Unique per instance (SSR safe) so several HTML/CSS sections can live on one
  // page without their styles bleeding into each other or into the site.
  const scopeSelector = `dus-html-${safeSectionId}-${String(reactId).replace(/[^a-zA-Z0-9]/g, '')}`;

  const html = typeof resolved.html === 'string' ? resolved.html : '';
  const useTailwind = resolved.useTailwind === true;
  // In Tailwind mode the custom stylesheet is kept in the database but never
  // emitted, so a stale rule can not fight the utility classes.
  const css = useTailwind ? '' : typeof resolved.css === 'string' ? resolved.css : '';
  const shouldScope = resolved.scopeCss ?? scopeCss ?? true;

  const scopedCss = useMemo(
    () => (hasValue(css) ? (shouldScope ? scopeCssText(css, `.${scopeSelector}`) : css) : ''),
    [css, shouldScope, scopeSelector]
  );

  const resolvedBgColor = bgColor || resolved.bgColor || '';
  const resolvedPaddingX = paddingX || resolved.paddingX || '';
  const resolvedPaddingY = paddingY || resolved.paddingY || '';
  const resolvedClassName = sectionClassName || resolved.sectionClassName || '';

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <HtmlCssSkeleton
        sectionId={safeSectionId}
        bgColor={resolvedBgColor}
        paddingX={resolvedPaddingX}
        paddingY={resolvedPaddingY}
        sectionClassName={resolvedClassName}
      />
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (!hasValue(html) && !hasValue(css)) {
    return null;
  }

  const sanitizedHtml = sanitizeHTML(html);

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={safeSectionId}
      data-html-css-section="true"
      className={`${scopeSelector} ${resolvedBgColor} ${resolvedPaddingX} ${resolvedPaddingY} ${resolvedClassName}`}
    >
      {hasValue(scopedCss) && <style dangerouslySetInnerHTML={{ __html: scopedCss }} />}

      {hasValue(sanitizedHtml) && (
        <div
          className="dus-html-css-content"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      )}
    </section>
  );
};

export default HtmlCssSection;
