// resources/js/utils/scopeCss.js

/**
 * ============================================
 * CUSTOM CSS SCOPING
 * ============================================
 *
 * The "HTML / CSS Section" lets an admin paste raw CSS. Without any scoping a
 * rule like `h1 { color: red }` would leak into the whole site, so every rule
 * is prefixed with a unique scope selector (the section's wrapper class) before
 * it is injected:
 *
 *   h1 { color: red }        ->  .scope-abc h1 { color: red }
 *   .card > p { margin: 0 }  ->  .scope-abc .card > p { margin: 0 }
 *
 * Behaviour:
 *  - normal rules           -> prefixed with the scope selector
 *  - :root / html / body    -> mapped onto the scope element itself
 *  - @media / @supports / @layer / @container / @document / @scope
 *                           -> recursed into the scope
 *  - @keyframes / @font-face / @page / @property …
 *                           -> kept untouched (must stay global)
 *  - top level statements ending with `;` (e.g. @import, @charset)
 *                           -> kept untouched
 *  - selectors that already contain the scope selector are left alone
 */

const AT_RULE_WITH_BODY = /^@(media|supports|layer|container|document|scope)\b/i;
const AT_RULE_KEEP_AS_IS =
  /^@(-(webkit|moz|ms|o)-)?(keyframes|font-face|page|property|counter-style|font-feature-values|view-transition)\b/i;

/**
 * Split a selector list on commas that are NOT inside :is()/:where()/[ ]/etc.
 */
const splitSelectorList = (selector) => {
  const parts = [];
  let current = '';
  let depth = 0;

  for (const char of selector) {
    if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth = Math.max(0, depth - 1);

    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  parts.push(current);

  return parts.map((part) => part.trim()).filter(Boolean);
};

/**
 * Prefix one selector with the scope selector.
 */
const scopeSelector = (selector, scope) => {
  const trimmed = selector.trim();

  if (!trimmed) return '';
  // Already scoped by the author – never double prefix.
  if (trimmed.includes(scope)) return trimmed;

  // Root-level selectors are mapped onto the wrapper itself so that
  // `body { font-family: … }` keeps having an effect.
  if (/^(:root|html|body)$/i.test(trimmed)) return scope;
  if (/^(:root|html|body)(?=[\s>+~:.[#])/i.test(trimmed)) {
    return trimmed.replace(/^(:root|html|body)/i, scope);
  }

  return `${scope} ${trimmed}`;
};

/**
 * Prefix every selector of a stylesheet with `scope`.
 *
 * @param {string} css   Raw CSS pasted by the admin.
 * @param {string} scope A CSS selector, e.g. `.dus-html-custom-html-r3`.
 * @returns {string} The scoped CSS (empty string when there is nothing to scope).
 */
export const scopeCss = (css, scope) => {
  if (!css || !scope) return css || '';

  // Comments would break the selector detection below.
  const source = String(css).replace(/\/\*[\s\S]*?\*\//g, '');

  let output = '';
  let cursor = 0;

  while (cursor < source.length) {
    while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
    if (cursor >= source.length) break;

    const openBrace = source.indexOf('{', cursor);

    if (openBrace === -1) {
      output += source.slice(cursor);
      break;
    }

    // Top-level statements such as `@import url(…);` have no block.
    const statementEnd = source.indexOf(';', cursor);
    if (statementEnd !== -1 && statementEnd < openBrace) {
      output += source.slice(cursor, statementEnd + 1);
      cursor = statementEnd + 1;
      continue;
    }

    const selector = source.slice(cursor, openBrace).trim();

    // Find the matching closing brace of this block.
    let depth = 1;
    let index = openBrace + 1;

    while (index < source.length && depth > 0) {
      const char = source[index];
      if (char === '{') depth += 1;
      else if (char === '}') depth -= 1;
      index += 1;
    }

    const body = source.slice(openBrace + 1, Math.max(openBrace + 1, index - 1));

    if (AT_RULE_KEEP_AS_IS.test(selector)) {
      output += `${selector} {${body}}`;
    } else if (AT_RULE_WITH_BODY.test(selector)) {
      output += `${selector} {${scopeCss(body, scope)}}`;
    } else {
      const scoped = splitSelectorList(selector)
        .map((part) => scopeSelector(part, scope))
        .filter(Boolean)
        .join(', ');

      output += `${scoped} {${body}}`;
    }

    cursor = index;
  }

  // Collapse the empty blocks produced by comment-only / blank input.
  return output.replace(/\s*\{\s*\}/g, '').trim();
};

export default scopeCss;
