// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/codeHighlight.js
//
// Dependency-free tokenizers that colour HTML and CSS the way VS Code's
// Dark+ theme does. The editor paints these tokens in a <pre> that sits behind
// a transparent <textarea>, so the caret, selection and undo stack stay native.

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** Index just past the `>` that closes the tag starting at `start`. */
const findTagEnd = (source, start) => {
  let quote = null;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];

    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '>') return i;
  }

  return -1;
};

const tokenizeTag = (raw) => {
  const head = /^<(\/?)([A-Za-z][\w:.-]*)/.exec(raw);
  if (!head) return [{ type: 'punct', value: raw }];

  const tokens = [{ type: 'punct', value: `<${head[1]}` }, { type: 'tag', value: head[2] }];

  const body = raw.slice(head[0].length);
  const bodyEnd = body.search(/\/?>$/);
  const attrZone = bodyEnd === -1 ? body : body.slice(0, bodyEnd);
  const tail = bodyEnd === -1 ? '' : body.slice(bodyEnd);

  const attrPattern = /([^\s"'=<>`/]+)(\s*=\s*)?/g;
  let cursor = 0;
  let match = attrPattern.exec(attrZone);

  while (match) {
    if (match.index > cursor) {
      tokens.push({ type: 'plain', value: attrZone.slice(cursor, match.index) });
    }

    tokens.push({ type: 'attr', value: match[1] });

    if (match[2]) {
      tokens.push({ type: 'punct', value: match[2] });
    }

    // The value is whatever follows the `=`, whatever quote style it uses.
    const afterName = attrPattern.lastIndex;
    const quoted = /^\s*(["'])/.exec(attrZone.slice(afterName));

    if (quoted) {
      const close = attrZone.indexOf(quoted[1], afterName + quoted[0].length);
      const end = close === -1 ? attrZone.length : close + 1;
      tokens.push({ type: 'string', value: attrZone.slice(afterName, end) });
      attrPattern.lastIndex = end;
    }

    cursor = attrPattern.lastIndex;
    match = attrPattern.exec(attrZone);
  }

  if (cursor < attrZone.length) {
    tokens.push({ type: 'plain', value: attrZone.slice(cursor) });
  }
  if (tail) tokens.push({ type: 'punct', value: tail });

  return tokens;
};

export const tokenizeHtml = (source) => {
  const tokens = [];
  const push = (type, value) => {
    if (value) tokens.push({ type, value });
  };

  let i = 0;
  while (i < source.length) {
    const lt = source.indexOf('<', i);

    if (lt === -1) {
      push('plain', source.slice(i));
      break;
    }
    push('plain', source.slice(i, lt));

    if (source.startsWith('<!--', lt)) {
      const end = source.indexOf('-->', lt);
      const stop = end === -1 ? source.length : end + 3;
      push('comment', source.slice(lt, stop));
      i = stop;
      continue;
    }

    if (source.startsWith('<!', lt) || source.startsWith('<?', lt)) {
      const end = source.indexOf('>', lt);
      const stop = end === -1 ? source.length : end + 1;
      push('doctype', source.slice(lt, stop));
      i = stop;
      continue;
    }

    const tagEnd = findTagEnd(source, lt);
    if (tagEnd === -1) {
      push('plain', source.slice(lt));
      break;
    }

    tokenizeTag(source.slice(lt, tagEnd + 1)).forEach((token) => push(token.type, token.value));
    i = tagEnd + 1;
  }

  return tokens;
};

export const tokenizeCss = (source) => {
  const tokens = [];
  const push = (type, value) => {
    if (value) tokens.push({ type, value });
  };

  let i = 0;
  let inBlock = false;
  let afterColon = false;

  while (i < source.length) {
    if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      push('comment', source.slice(i, stop));
      i = stop;
      continue;
    }

    const ch = source[i];

    if (ch === '{') {
      push('punct', ch);
      inBlock = true;
      afterColon = false;
      i += 1;
      continue;
    }
    if (ch === '}') {
      push('punct', ch);
      inBlock = false;
      afterColon = false;
      i += 1;
      continue;
    }
    if (ch === ':' || ch === ';') {
      push('punct', ch);
      afterColon = ch === ':';
      i += 1;
      continue;
    }
    if (ch === '(' || ch === ')' || ch === ',') {
      push('punct', ch);
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < source.length && source[j] !== ch) {
        if (source[j] === '\\') j += 1;
        j += 1;
      }
      push('string', source.slice(i, Math.min(j + 1, source.length)));
      i = j + 1;
      continue;
    }

    if (/\s/.test(ch)) {
      let j = i;
      while (j < source.length && /\s/.test(source[j])) j += 1;
      push('plain', source.slice(i, j));
      i = j;
      continue;
    }

    let j = i;
    while (j < source.length && !/[\s{}:;(),"']/.test(source[j])) j += 1;
    const word = source.slice(i, j);
    i = j;

    if (!inBlock) {
      push(word.startsWith('@') ? 'atrule' : 'selector', word);
    } else if (afterColon) {
      if (word.startsWith('#')) push('hex', word);
      else if (/^[+-]?[\d.]/.test(word)) push('number', word);
      else if (word.startsWith('!')) push('keyword', word);
      else push('value', word);
    } else {
      push(word.startsWith('--') ? 'variable' : 'property', word);
    }
  }

  return tokens;
};

const ESCAPE_LOOKUP = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const escapeHtml = (value) => value.replace(/[&<>]/g, (ch) => ESCAPE_LOOKUP[ch]);

// VS Code's Dark+ palette. Colours are written as inline styles rather than
// utility classes because the Tailwind build cannot see class names that only
// exist inside this string and would purge them.
const TOKEN_COLORS = {
  tag: '#569cd6',
  doctype: '#569cd6',
  attr: '#9cdcfe',
  property: '#9cdcfe',
  variable: '#9cdcfe',
  string: '#ce9178',
  value: '#ce9178',
  hex: '#ce9178',
  comment: '#6a9955',
  selector: '#d7ba7d',
  number: '#b5cea8',
  atrule: '#c586c0',
  keyword: '#569cd6',
  punct: '#808080',
};

/**
 * HTML text runs are escaped, then the `<`, `>` and `&` that belong to real
 * tags are un-escaped again so the tokens land on the original characters.
 */
export const highlight = (source, language) => {
  if (!source) return '';

  const tokens = language === 'css' ? tokenizeCss(source) : tokenizeHtml(source);

  return tokens
    .map(({ type, value }) => {
      const safe = escapeHtml(value);
      const color = TOKEN_COLORS[type];
      return color ? `<span style="color:${color}">${safe}</span>` : safe;
    })
    .join('');
};

export { VOID_TAGS };