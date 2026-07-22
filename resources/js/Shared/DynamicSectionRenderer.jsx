// resources/js/components/Shared/DynamicSectionRenderer.jsx

import React, { Suspense } from 'react';
import SectionLoader from './SectionLoader';
import { SECTION_COMPONENTS, SECTION_CONFIGS } from '../config/sectionRegistry';

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
    dataKey,  // 🔥 This is the key used in pageData
    custom_props: customPropsFromDb,
    customProps: customPropsFromFrontend,
    data: sectionData,  // Data attached directly to section
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
  const rawCustomProps = customPropsFromDb || customPropsFromFrontend || {};

  let parsedCustomProps = {};
  if (typeof rawCustomProps === 'string') {
    try {
      const parsed = JSON.parse(rawCustomProps);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parsedCustomProps = parsed;
      }
    } catch (e) {
      console.warn(`[DynamicSectionRenderer] Failed to parse customProps for ${componentName}:`, e);
    }
  } else if (rawCustomProps && typeof rawCustomProps === 'object' && !Array.isArray(rawCustomProps)) {
    parsedCustomProps = rawCustomProps;
  }

  // ============================================
  // BUILD COMPONENT PROPS
  // ============================================
  const baseProps = { ...globalProps, ...parsedCustomProps };

  const config = SECTION_CONFIGS[componentName];

  // ============================================
  // 🔥 RESOLVE DATA USING DATAKEY
  // ============================================
  let dataValue = undefined;

  // 1. First, check if data is attached directly to the section
  if (sectionData !== undefined && sectionData !== null) {
    dataValue = sectionData;
  }

  // 2. If not, try to find data in pageData using dataKey
  if (dataValue === undefined && dataKey && pageData) {
    const dataSource = pageData?.pageData || pageData || {};

    // Try the exact dataKey
    if (dataSource[dataKey] !== undefined) {
      dataValue = dataSource[dataKey];
    }

    // If dataKey has underscores, try with hyphens
    if (dataValue === undefined && dataKey.includes('_')) {
      const hyphenKey = dataKey.replace(/_/g, '-');
      if (dataSource[hyphenKey] !== undefined) {
        dataValue = dataSource[hyphenKey];
      }
    }

    // If dataKey has hyphens, try with underscores
    if (dataValue === undefined && dataKey.includes('-')) {
      const underscoreKey = dataKey.replace(/-/g, '_');
      if (dataSource[underscoreKey] !== undefined) {
        dataValue = dataSource[underscoreKey];
      }
    }
  }

  // 3. Try using propName
  if (dataValue === undefined && propName && pageData) {
    const dataSource = pageData?.pageData || pageData || {};
    if (dataSource[propName] !== undefined) {
      dataValue = dataSource[propName];
    }
  }

  // 4. Try kebab-case of propName
  if (dataValue === undefined && propName && pageData) {
    const dataSource = pageData?.pageData || pageData || {};
    const kebabProp = propName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    if (dataSource[kebabProp] !== undefined) {
      dataValue = dataSource[kebabProp];
    }
  }

  // 5. Try snake_case of propName
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

  if (config?.isMultiProp) {
    // Multi-prop components: pass multiple props
    if (dataValue && typeof dataValue === 'object') {
      Object.assign(componentProps, dataValue);
    }
  } else {
    // Single prop components
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