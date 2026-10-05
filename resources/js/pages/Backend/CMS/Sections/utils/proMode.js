// resources/js/pages/Backend/CMS/Sections/utils/proMode.js

import { SECTION_CONFIGS } from './SectionConfigData';

/**
 * Defaults derived from a section's declared configuration.
 *
 * A section created from AddSectionModal has no custom_props yet, so every
 * layout field in the editor starts blank. That reads as "nothing is set" and
 * invites the admin to fill in padding and height by hand for every section,
 * even though SECTION_CONFIGS already declares a sensible default per field.
 *
 * Only non-empty defaults are returned: an empty-string default means "leave it
 * alone", not "store an empty string".
 *
 * @param {string} component Section component name, e.g. "HomeBanner".
 * @returns {Object} custom_props shaped defaults.
 */
export const getConfigDefaults = (component) => {
  const config = SECTION_CONFIGS[component];

  if (!config || !Array.isArray(config.fields)) return {};

  const defaults = {};

  for (const field of config.fields) {
    if (!field?.key) continue;

    const value = field.default;

    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (typeof value === 'number' && Number.isNaN(value)) continue;

    defaults[field.key] = value;
  }

  return defaults;
};

/**
 * Merge declared defaults into an existing custom_props bag.
 *
 * Existing values always win. A field the admin has deliberately blanked must
 * not be refilled from the default, or re-opening the editor would resurrect
 * settings they just removed.
 *
 * @param {string} component
 * @param {Object} stored custom_props currently on the section.
 * @returns {Object}
 */
export const withPrefilledDefaults = (component, stored) => {
  const existing = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const defaults = getConfigDefaults(component);

  const filled = { ...defaults };

  for (const [key, value] of Object.entries(existing)) {
    filled[key] = value;
  }

  return filled;
};

/**
 * A section is "empty" when it has no stored props and no data yet.
 *
 * This is the only case where pre-filling applies. Once an admin has saved real
 * content, defaults are noise and rewriting them on every open would silently
 * alter the saved page.
 *
 * @param {Object} section
 * @returns {boolean}
 */
export const isUnconfigured = (section) => {
  if (!section) return false;

  const props = section.custom_props;
  const hasProps = props && typeof props === 'object' && Object.keys(props).length > 0;
  const hasData = section.data !== null && section.data !== undefined;

  return !hasProps && !hasData;
};