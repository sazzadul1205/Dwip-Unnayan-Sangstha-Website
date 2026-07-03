// resources/js/components/Shared/DynamicSectionRenderer.jsx

/**
 * ============================================
 * DYNAMIC SECTION RENDERER
 * ============================================
 * 
 * PURPOSE:
 * - Dynamically loads and renders a section component
 * - Passes the correct data to the section based on configuration
 * - Handles lazy loading with Suspense
 * - Parses custom props from section configuration
 * 
 * DATA FLOW:
 * 1. Receives section configuration from pageData
 * 2. Looks up the component in SECTION_COMPONENTS registry
 * 3. Determines what data to pass based on data_table and data_key
 * 4. Renders the component with the resolved props
 * 
 * PROP RESOLUTION LOGIC:
 * 1. If config.isMultiProp: Pass multiple props from pageData
 * 2. Else if propName and dataKey: Pass dataKey as propName
 * 3. Else if propName: Pass pageData[propName] as prop
 * 4. Fallback: Try to find data in pageData by various keys
 * 
 * ============================================
 */

// React
import React, { Suspense } from 'react';

// Import section loader
import SectionLoader from './SectionLoader';

// Import section registry
import { SECTION_COMPONENTS, SECTION_CONFIGS } from '../../config/sectionRegistry';

/**
 * DynamicSectionRenderer Component
 * 
 * @param {Object} props
 * @param {Object} props.section - Section configuration from API
 *   - id: Unique section ID
 *   - component: Component name (e.g., 'HomeBanner', 'FAQSection')
 *   - propName: Name of the prop the component expects (e.g., 'data')
 *   - dataKey: Key to look for in pageData
 *   - custom_props: JSON string of custom props
 *   - data_table: Where to get data (shared_data, custom_section_data, etc.)
 * @param {Object} props.pageData - All page data from DynamicPage
 * @param {Object} props.globalProps - Global props (storageUrl, sharedData, etc.)
 * 
 * @returns {JSX.Element} Rendered section with Suspense
 */
const DynamicSectionRenderer = ({
  section,
  pageData,
  globalProps = {}
}) => {
  // console.log("section", section);
  // console.log("pageData", pageData?.pageData);
  // console.log("globalProps", globalProps);

  // ============================================
  // EXTRACT SECTION CONFIG
  // ============================================
  const {
    id,
    component: componentName,
    propName,
    dataKey,
    // Support both field names (custom_props from DB, customProps from frontend)
    custom_props: customPropsFromDb,
    customProps: customPropsFromFrontend,
    // isSpecialSection is intentionally omitted - reserved for future use
    // If needed in the future, uncomment the line below:
    // isSpecialSection,
  } = section;

  // ============================================
  // GET COMPONENT FROM REGISTRY
  // ============================================
  const Component = SECTION_COMPONENTS[componentName];

  // If component doesn't exist, skip rendering
  if (!Component) {
    console.warn(`[DynamicSectionRenderer] Component "${componentName}" not found in registry`);
    return null;
  }

  // ============================================
  // PARSE CUSTOM PROPS
  // ============================================
  // Use the correct field name (prefer custom_props from database)
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
  // Start with global props, then override with custom props
  // This allows custom props to override global props if needed
  const baseProps = { ...globalProps, ...parsedCustomProps };

  // Get configuration for this component from sectionRegistry
  const config = SECTION_CONFIGS[componentName];

  // Build component props based on configuration
  const componentProps = { ...baseProps };

  // ============================================
  // RESOLVE DATA SOURCE
  // ============================================
  // The data might be nested in pageData.pageData or at the root level
  // Check if pageData has a 'pageData' property that contains the actual data
  const dataSource = pageData.pageData || pageData;

  // ============================================
  // RESOLVE PROPS BASED ON CONFIGURATION
  // ============================================

  if (config?.isMultiProp) {
    // Multi-prop components: pass multiple props
    config.props.forEach(prop => {
      if (dataSource[prop] !== undefined) {
        componentProps[prop] = dataSource[prop];
      }
    });
  } else {
    // Single prop components
    const propNameToUse = propName || config?.propName || 'data';

    // Try to find the data
    let dataValue = undefined;

    // 1. Try using dataKey first
    if (dataKey && dataSource[dataKey] !== undefined) {
      dataValue = dataSource[dataKey];
    }

    // 2. If not found, try using propName
    if (dataValue === undefined && propName && dataSource[propName] !== undefined) {
      dataValue = dataSource[propName];
    }

    // 3. If still not found, try kebab-case versions
    if (dataValue === undefined && dataKey) {
      const kebabKey = dataKey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      if (dataSource[kebabKey] !== undefined) {
        dataValue = dataSource[kebabKey];
      }
    }

    // 4. If still not found, try to guess based on component name
    if (dataValue === undefined) {
      const guessedKey = componentName.replace('Section', '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      if (dataSource[guessedKey] !== undefined) {
        dataValue = dataSource[guessedKey];
      }
    }

    // 5. Final fallback: try any key that might contain the data
    if (dataValue === undefined) {
      // Try to find any key in dataSource that contains the component name
      const componentLower = componentName.toLowerCase();
      for (const key in dataSource) {
        if (key.toLowerCase().includes(componentLower.replace('section', ''))) {
          dataValue = dataSource[key];
          break;
        }
      }
    }

    // Set the prop
    componentProps[propNameToUse] = dataValue;
  }

  // ============================================
  // RENDER WITH SUSPENSE (for lazy loading)
  // ============================================
  // Suspense handles the loading state while the lazy component loads
  return (
    <Suspense fallback={<SectionLoader message={`Loading ${id}...`} />}>
      <Component {...componentProps} />
    </Suspense>
  );
};

export default DynamicSectionRenderer;