// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/formatCode.js
//
// Client-side formatting through Prettier's standalone browser build.
//
// The repo's .prettierrc lists plugins that are not installed
// (@trivago/prettier-plugin-sort-imports), which breaks the CLI. `prettier/standalone`
// never reads that file, so every option is passed explicitly here instead.

const BASE_OPTIONS = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf',
  // Never reformat CSS/JS that is embedded in the markup: this section strips
  // <script> and ignores <style>, so touching them would only create noise.
  embeddedLanguageFormatting: 'off',
};

/** Loaded on demand so Prettier stays out of the editor's initial chunk. */
const loadPrettier = async () => {
  const [standalone, html, postcss, estree] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/html'),
    import('prettier/plugins/postcss'),
    import('prettier/plugins/estree'),
  ]);

  return {
    format: standalone.format,
    plugins: [html.default ?? html, postcss.default ?? postcss, estree.default ?? estree],
  };
};

/**
 * Formats `code` and resolves with the result.
 *
 * Throws when Prettier cannot parse the snippet, so the caller can surface the
 * problem and leave the author's text untouched.
 */
export const formatCode = async (code, language) => {
  const source = typeof code === 'string' ? code : '';
  if (source.trim() === '') return source;

  const { format, plugins } = await loadPrettier();

  const options =
    language === 'css'
      ? { ...BASE_OPTIONS, parser: 'css', singleQuote: false, printWidth: 80 }
      : { ...BASE_OPTIONS, parser: 'html', singleQuote: true, htmlWhitespaceSensitivity: 'css' };

  const formatted = await format(source, { ...options, plugins });

  return typeof formatted === 'string' ? formatted.replace(/\s+$/, '') : source;
};