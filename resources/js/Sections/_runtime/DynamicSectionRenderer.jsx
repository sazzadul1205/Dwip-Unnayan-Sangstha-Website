// resources/js/Sections/_runtime/DynamicSectionRenderer.jsx
// FRONTEND lazy-loaded section renderer (used by pages/Frontend/* detail pages + DynamicPage).
// Resolves components via _runtime/sectionRegistry.js (SECTION_COMPONENTS/CONFIGS).
// NOTE: NOT a duplicate of _runtime/SectionIndex.jsx — that one is the
// BACKEND-ONLY synchronous preview renderer with legacy normalizeData mapping.
// Keep both; do not merge without aligning prop-mapping + normalization first.

import React, { Suspense } from 'react';
import SectionLoader from './SectionLoader';
import { SECTION_COMPONENTS, SECTION_CONFIGS } from './sectionRegistry';

// Components that always receive their whole payload as ONE prop object.
// These must never be spread (isMultiProp) — otherwise the shape breaks.
const SINGLE_PAYLOAD_COMPONENTS = new Set([
  'HomeBanner',
  'PageBannerSection',
  'PageTagBannerSection',
]);

const DynamicSectionRenderer = ({
  section,
  pageData,
  globalProps = {}
}) => {
  // ============================================
  // EXTRACT SECTION CONFIG
  // ============================================
  const {
    id,
    component: componentName,
    propName,
    dataKey,
    custom_props: rawCustomProps,
    data: sectionData,
  } = section;

  // ============================================
  // GET COMPONENT FROM REGISTRY
  // ============================================
  const Component = SECTION_COMPONENTS[componentName];

  if (!Component) {
    console.warn(`[DynamicSectionRenderer] Component "${componentName}" not found in registry`);
    return null;
  }

  // ============================================
  // PARSE CUSTOM PROPS
  // ============================================
  // `custom_props` is a JSON column on section_configs, and the CMS + the public
  // frontend now both expose it under that single name (it used to arrive as
  // camelCase `customProps` from formatSectionConfigs). Keep the defensive string
  // parse for JSON-encoded legacy payloads.
  let parsedCustomProps = {};
  if (typeof rawCustomProps === 'string') {
    try {
      const parsed = JSON.parse(rawCustomProps);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parsedCustomProps = parsed;
      }
    } catch (e) {
      console.warn(`[DynamicSectionRenderer] Failed to parse custom_props for ${componentName}:`, e);
    }
  } else if (rawCustomProps && typeof rawCustomProps === 'object' && !Array.isArray(rawCustomProps)) {
    parsedCustomProps = rawCustomProps;
  }

  // ============================================
  // BASE PROPS
  // ============================================
  const baseProps = { ...globalProps, ...parsedCustomProps };

  const config = SECTION_CONFIGS[componentName];

  // ============================================
  // RESOLVE DATA USING DATAKEY
  // ============================================
  let dataValue = undefined;

  // 1. Data attached directly to the section
  if (sectionData !== undefined && sectionData !== null) {
    dataValue = sectionData;
  }

  // 2. Resolve via dataKey
  if (dataValue === undefined && dataKey && pageData) {
    const dataSource = pageData?.pageData || pageData || {};

    if (dataSource[dataKey] !== undefined) {
      dataValue = dataSource[dataKey];
    }

    if (dataValue === undefined && dataKey.includes('_')) {
      const hyphenKey = dataKey.replace(/_/g, '-');
      if (dataSource[hyphenKey] !== undefined) {
        dataValue = dataSource[hyphenKey];
      }
    }

    if (dataValue === undefined && dataKey.includes('-')) {
      const underscoreKey = dataKey.replace(/-/g, '_');
      if (dataSource[underscoreKey] !== undefined) {
        dataValue = dataSource[underscoreKey];
      }
    }
  }

  // 3. Resolve via propName
  if (dataValue === undefined && propName && pageData) {
    const dataSource = pageData?.pageData || pageData || {};
    if (dataSource[propName] !== undefined) {
      dataValue = dataSource[propName];
    }
  }

  // 4. kebab-case of propName
  if (dataValue === undefined && propName && pageData) {
    const dataSource = pageData?.pageData || pageData || {};
    const kebabProp = propName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    if (dataSource[kebabProp] !== undefined) {
      dataValue = dataSource[kebabProp];
    }
  }

  // 5. snake_case of propName
  if (dataValue === undefined && propName && pageData) {
    const dataSource = pageData?.pageData || pageData || {};
    const snakeProp = propName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    if (dataSource[snakeProp] !== undefined) {
      dataValue = dataSource[snakeProp];
    }
  }

  // ============================================
  // BUILD COMPONENT PROPS
  // ============================================
  const componentProps = { ...baseProps };

  if (SINGLE_PAYLOAD_COMPONENTS.has(componentName)) {
    // Always pass the whole payload as one prop (e.g. bannerData = { slideInterval, slides })
    const propNameToUse = propName || config?.propName || 'bannerData';
    if (dataValue !== undefined) {
      componentProps[propNameToUse] = dataValue;
    }
  } else if (config?.isMultiProp) {
    // Multi-prop components: spread object keys
    if (dataValue && typeof dataValue === 'object') {
      Object.assign(componentProps, dataValue);
    }
  } else {
    // Default single-prop
    const propNameToUse = propName || config?.propName || 'data';
    if (dataValue !== undefined) {
      componentProps[propNameToUse] = dataValue;
    }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <Suspense fallback={<SectionLoader message={`Loading ${id}...`} />}>
      <Component {...componentProps} />
    </Suspense>
  );
};

export default DynamicSectionRenderer;