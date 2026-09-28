<?php
// app/Services/NewsletterContentRenderer.php

namespace App\Services;

use App\Models\NewsletterSubscription;

/**
 * ============================================================
 *  NEWSLETTER CONTENT RENDERER
 * ============================================================
 *
 * Two responsibilities, both essential before a byte of admin-authored HTML
 * reaches an inbox:
 *
 *  1. MERGE TAGS
 *     `{{name}}`, `{{ first_name }}`, `{{email}}`, `{{unsubscribe_url}}` …
 *     are replaced per-recipient right before the mail is sent.
 *
 *  2. SANITISATION  (security critical)
 *     The campaign body is authored by an admin in the CMS and injected into
 *     the email template with `{!! !!}`. Without sanitising, a compromised or
 *     careless admin account could ship `<script>`, `<iframe>` or
 *     `onerror=` payloads to every subscriber. This class removes:
 *       - script-ish / embedding / form tags
 *       - every `on*` event handler attribute
 *       - `javascript:` / `vbscript:` / `data:text/html` URLs
 *       - CSS `expression()` / `behavior:` / `@import`
 *
 * Only inline `style` attributes and a whitelist of layout/formatting tags
 * survive, which is exactly what a responsive email needs.
 */
class NewsletterContentRenderer
{
    /** Tags that are safe inside a marketing email. */
    private const ALLOWED_TAGS = [
        'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'center', 'cite', 'code', 'col',
        'colgroup', 'dd', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'font', 'footer',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'img', 'ins', 'kbd',
        'li', 'main', 'mark', 'nav', 'ol', 'p', 'pre', 'q', 's', 'section', 'small',
        'span', 'strike', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th',
        'thead', 'tr', 'u', 'ul', 'del', 'time', 'wbr',
    ];

    /**
     * Tags whose *contents* must be dropped along with the tag itself, e.g.
     * `<script>alert(1)</script>` must not leave "alert(1)" behind as text.
     */
    private const STRIP_WITH_CONTENT = [
        'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
        'form', 'input', 'button', 'select', 'option', 'textarea', 'link', 'meta',
        'base', 'svg', 'math', 'noscript', 'template', 'portal', 'dialog',
    ];

    /** Attributes allowed on any tag. */
    private const GLOBAL_ATTRS = ['class', 'style', 'dir', 'lang', 'title', 'align', 'valign', 'width', 'height', 'role'];

    /** Extra attributes allowed per tag. */
    private const TAG_ATTRS = [
        'a' => ['href', 'name', 'target', 'rel'],
        'img' => ['src', 'alt', 'border', 'cellpadding', 'cellspacing'],
        'table' => ['cellpadding', 'cellspacing', 'border', 'bgcolor', 'summary'],
        'td' => ['colspan', 'rowspan', 'bgcolor', 'nowrap', 'scope'],
        'th' => ['colspan', 'rowspan', 'bgcolor', 'scope', 'nowrap'],
        'tr' => ['bgcolor', 'height'],
        'ol' => ['start', 'type', 'reversed'],
        'li' => ['value', 'type'],
        'col' => ['span'],
        'colgroup' => ['span'],
        'font' => ['color', 'face', 'size'],
        'hr' => ['noshade', 'size'],
        'blockquote' => ['cite'],
        'q' => ['cite'],
        'del' => ['cite', 'datetime'],
        'ins' => ['cite', 'datetime'],
        'time' => ['datetime'],
    ];

    /** URL schemes permitted in href/src. */
    private const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel', 'sms'];

    /* ============================================================
     |  MERGE TAGS
     |========================================================== */

    /**
     * Build the replacement map for a given subscriber.
     *
     * @return array<string, string>
     */
    public function mergeMap(NewsletterSubscription $subscriber): array
    {
        $name = trim((string) ($subscriber->name ?? ''));
        $firstName = $name !== '' ? (string) str($name)->before(' ') : '';

        return [
            'name' => $name !== '' ? $name : 'there',
            'first_name' => $firstName !== '' ? $firstName : 'there',
            'email' => (string) $subscriber->email,
            'unsubscribe_url' => $subscriber->unsubscribe_url,
            'resubscribe_url' => $subscriber->resubscribe_url,
            'app_name' => (string) config('app.name', 'DUS'),
            'site_url' => rtrim((string) config('app.url'), '/'),
            'year' => (string) now()->year,
            'date' => now()->format('d M Y'),
        ];
    }

    /**
     * Replace every `{{ tag }}` (spaces tolerated) using the supplied map.
     *
     * @param  array<string, string>  $map
     */
    public function applyMergeTags(string $html, array $map): string
    {
        if ($html === '' || $map === []) {
            return $html;
        }

        $replacements = [];
        foreach ($map as $key => $value) {
            // Both `{{name}}` and `{{ name }}` resolve to the same token.
            $replacements['{{' . $key . '}}'] = $value;
            $replacements['{{ ' . $key . ' }}'] = $value;
        }

        return strtr($html, $replacements);
    }

    /**
     * Full pipeline: merge tags first (so a merge value can never smuggle in
     * unsanitised markup), then sanitise the merged result.
     *
     * @param  array<string, string>|null  $mergeMap
     */
    public function render(string $html, ?array $mergeMap = null): string
    {
        $html = $mergeMap ? $this->applyMergeTags($html, $mergeMap) : $html;

        return $this->sanitize($html);
    }

    /**
     * Merge tags exposed to the editor palette.
     *
     * @return array<int, array{tag: string, label: string, hint: string}>
     */
    public function availableMergeTags(): array
    {
        return [
            ['tag' => 'name', 'label' => 'Full name', 'hint' => 'Subscriber name, or "there"'],
            ['tag' => 'first_name', 'label' => 'First name', 'hint' => 'First word of the name'],
            ['tag' => 'email', 'label' => 'Email address', 'hint' => 'Subscriber email'],
            ['tag' => 'unsubscribe_url', 'label' => 'Unsubscribe link', 'hint' => 'Required by CAN-SPAM / GDPR'],
            ['tag' => 'app_name', 'label' => 'Site name', 'hint' => 'config(app.name)'],
            ['tag' => 'site_url', 'label' => 'Site URL', 'hint' => 'config(app.url)'],
            ['tag' => 'year', 'label' => 'Current year', 'hint' => 'For copyright lines'],
            ['tag' => 'date', 'label' => "Today's date", 'hint' => 'e.g. 27 Sep 2026'],
        ];
    }


    /* ============================================================
     |  SANITISATION
     |========================================================== */

    /**
     * Remove every dangerous construct from admin-authored HTML.
     */
    public function sanitize(string $html): string
    {
        if (trim($html) === '') {
            return '';
        }

        // 1) Drop dangerous tags *including their contents* first. Doing this
        //    before attribute filtering guarantees no payload survives inside
        //    e.g. <script src=...> or <style>@import url(...)</style>.
        $html = $this->removeDangerousTagsWithContent($html);

        // 2) Normalise self-closing / void tags so the attribute walker sees a
        //    predictable shape: <img ...> / <br>
        $html = $this->normaliseVoidTags($html);

        // 3) Rewrite every remaining tag, filtering attributes.
        $html = $this->filterTags($html);

        // 4) Neutralise leftover merge tokens so a typo renders as a visible
        //    hint rather than shipping raw "{{foo}}" to the inbox.
        return $this->highlightUnknownTags($html);
    }

    /**
     * Strip <script>, <style>, <iframe>, … plus everything between the tags.
     */
    private function removeDangerousTagsWithContent(string $html): string
    {
        $tags = $this->dangerousTagPattern();

        // <script ...> ... </script>  (also catches unclosed / self-closed).
        // NOTE: the alternation MUST be wrapped in a non-capturing group,
        // otherwise `<style>` would match the bare `style` branch and the
        // opening `<` would leak through into the output.
        $html = (string) preg_replace(
            '#<(?:' . $tags . ')\b[^>]*>.*?</(?:' . $tags . ')\s*>#is',
            '',
            $html
        );

        // Leftover opening / self-closing tags of the same names.
        $html = (string) preg_replace('#</?(?:' . $tags . ')\b[^>]*>#i', '', $html);

        // HTML comments can hide conditional-comment payloads in Outlook.
        return (string) preg_replace('#<!--.*?-->#s', '', $html);
    }

    /**
     * Pipe-delimited alternation of every tag that must be removed wholesale.
     */
    private function dangerousTagPattern(): string
    {
        return implode('|', array_map(
            static fn (string $tag): string => preg_quote($tag, '/'),
            self::STRIP_WITH_CONTENT
        ));
    }


    /**
     * Turn `<br/>` into `<br>` so a single attribute parser can cope.
     */
    private function normaliseVoidTags(string $html): string
    {
        return (string) preg_replace(
            '#<(br|hr|img|wbr|col)(\s[^>]*?)?/?>#i',
            '<$1$2>',
            $html
        );
    }

    /**
     * Walk every tag and drop attributes that are not explicitly allowed.
     */
    private function filterTags(string $html): string
    {
        return (string) preg_replace_callback(
            '#<\s*(/?)\s*([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|\'[^\']*\'|[^>"\'])*)(/?)\s*>#s',
            function (array $m): string {
                [$all, $closing, $tag, $attrString, $selfClosing] = $m;

                $tag = strtolower($tag);

                // Closing tag – always safe, nothing to filter.
                if ($closing === '/') {
                    return in_array($tag, self::ALLOWED_TAGS, true) ? '</' . $tag . '>' : '';
                }

                // Unknown/non-whitelisted tag: drop the tag, keep its text.
                if (!in_array($tag, self::ALLOWED_TAGS, true)) {
                    return '';
                }

                $attrs = $this->filterAttributes($tag, $attrString);
                $suffix = in_array($tag, ['br', 'hr', 'img', 'wbr', 'col'], true)
                    ? ''
                    : ($selfClosing === '/' ? ' /' : '');

                return '<' . $tag . $attrs . $suffix . '>';
            },
            $html
        );
    }

    /**
     * Keep only the attributes allowed for a given tag.
     */
    private function filterAttributes(string $tag, string $attrString): string
    {
        $attrString = trim($attrString);
        if ($attrString === '') {
            return '';
        }

        $allowed = array_merge(self::GLOBAL_ATTRS, self::TAG_ATTRS[$tag] ?? []);

        $out = [];

        // Matches: name="value" | name='value' | name=value | name
        preg_match_all(
            '#([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("[^"]*"|\'[^\']*\'|[^\s"\'>]+))?#',
            $attrString,
            $matches,
            PREG_SET_ORDER
        );

        foreach ($matches as $match) {
            $name = strtolower($match[1]);
            $value = $this->decodeAttributeValue($match[2] ?? '');

            // Event handlers and framework bindings never survive.
            if (str_starts_with($name, 'on') || str_starts_with($name, 'v-bind') || str_starts_with($name, 'x-')) {
                continue;
            }

            if (!in_array($name, $allowed, true)) {
                continue;
            }

            // URL-bearing attributes must use an allowed scheme.
            if (in_array($name, ['href', 'src', 'cite'], true) && !$this->isSafeUrl($value)) {
                continue;
            }

            // Inline CSS is allowed but hardened.
            if ($name === 'style') {
                $value = $this->sanitizeStyle($value);
                if (trim($value) === '') {
                    continue;
                }
            }

            // target="_blank" without rel="noopener" leaks the opener window.
            if ($tag === 'a' && $name === 'target' && strtolower($value) === '_blank') {
                $out[] = 'target="_blank"';
                $out[] = 'rel="noopener noreferrer"';
                continue;
            }

            $out[] = $name . '="' . htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '"';
        }

        // De-duplicate while preserving order (target+rel above may repeat).
        return $out === [] ? '' : ' ' . implode(' ', array_unique($out));
    }

    /**
     * Strip surrounding quotes from an attribute value.
     */
    private function decodeAttributeValue(string $raw): string
    {
        $raw = trim($raw);
        if (strlen($raw) >= 2) {
            $first = $raw[0];
            $last = $raw[strlen($raw) - 1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                return substr($raw, 1, -1);
            }
        }

        return $raw;
    }

    /**
     * Allow only http(s), mailto, tel, sms plus relative/anchor URLs.
     * Rejects javascript:, vbscript: and data:text/html payloads, including
     * entity- and percent-encoded attempts.
     */
    private function isSafeUrl(string $url): bool
    {
        $normalised = $this->normaliseUrl($url);

        if ($normalised === '') {
            return false;
        }

        // Relative URLs (/jobs, #anchor, images/x.png) are safe.
        if (str_starts_with($normalised, '/') || str_starts_with($normalised, '#')) {
            return true;
        }

        if (!preg_match('#^([a-zA-Z][a-zA-Z0-9+.\-]*):#', $normalised, $m)) {
            // No scheme at all – treated as a relative path.
            return true;
        }

        return in_array(strtolower($m[1]), self::ALLOWED_SCHEMES, true);
    }

    /**
     * Decode entities/percent-encoding and strip control characters so
     * "java\tscript&#58;alert(1)" cannot slip past the scheme check.
     */
    private function normaliseUrl(string $url): string
    {
        $decoded = html_entity_decode($url, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $decoded = rawurldecode($decoded);

        // Remove whitespace + control characters used to break up keywords.
        return (string) preg_replace('/[\x00-\x20\x7F]+/', '', $decoded);
    }

    /**
     * Remove CSS constructs that can execute code or fetch remote content.
     */
    private function sanitizeStyle(string $style): string
    {
        // Control characters are used to break up keywords ("exp\0ression").
        $decoded = (string) preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $style);

        // Drop the whole declaration when a dangerous construct is present
        // rather than deleting just the keyword, which would leave a broken
        // fragment such as `width:alert(1))` behind.
        $patterns = [
            // expression(...) in any property
            '/[^;{}]*expression\s*\([^;{}]*;?/i',
            // IE behaviours + -moz-binding
            '/[^;{}]*(?:-moz-)?behaviou?r\s*:[^;{}]*;?/i',
            '/[^;{}]*-moz-binding\s*:[^;{}]*;?/i',
            // @import and remote url() schemes
            '/@import[^;{}]*;?/i',
            '/url\s*\(\s*[\'"]?\s*(?:javascript|vbscript|data)\s*:[^)]*\)/i',
        ];

        foreach ($patterns as $pattern) {
            $decoded = (string) preg_replace($pattern, '', $decoded);
        }

        return trim($decoded);
    }


    /**
     * Replace any merge tag the renderer does not know about with a visible
     * marker, so an unrecognised {{token}} is obvious in the live preview
     * instead of reaching the recipient's inbox verbatim.
     */
    private function highlightUnknownTags(string $html): string
    {
        return (string) preg_replace_callback(
            '/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/',
            static function (array $m): string {
                return '<span style="background:#fff3cd;color:#7a5b00;padding:1px 4px;'
                    . 'border-radius:3px;font-family:monospace;font-size:12px">'
                    . '{{' . htmlspecialchars($m[1], ENT_QUOTES, 'UTF-8') . '}}'
                    . '</span>';
            },
            $html
        );
    }

    /* ============================================================
     |  DELIVERABILITY ANALYSIS
     |========================================================== */

    /**
     * Pre-flight checks surfaced in the editor so a campaign is not silently
     * filtered or flagged as spam.
     *
     * @return array<string, mixed>
     */
    public function analyse(string $html, string $subject, string $previewText = ''): array
    {
        $issues = [];
        $warnings = [];

        $subjectLength = mb_strlen($subject);
        if ($subjectLength === 0) {
            $issues[] = 'The subject line is empty.';
        } elseif ($subjectLength > 60) {
            $warnings[] = "Subject is {$subjectLength} characters – most inboxes truncate after ~60.";
        } elseif ($subjectLength < 15) {
            $warnings[] = 'Subject is quite short; specific subjects get more opens.';
        }

        if (trim($previewText) === '') {
            $warnings[] = 'No preview text set, mail clients will pull the first words of the body.';
        }

        // An unsubscribe link is a legal requirement for bulk mail.
        if (!str_contains($html, '{{unsubscribe_url}}')
            && !preg_match('/href=["\'][^"\']*unsubscribe/i', $html)) {
            $issues[] = 'No unsubscribe link found. Bulk mail without one violates CAN-SPAM/GDPR.';
        }

        // Images without alt text hurt accessibility and deliverability.
        preg_match_all('/<img\b[^>]*>/i', $html, $imgMatches);
        $images = $imgMatches[0] ?? [];
        $withoutAlt = array_filter($images, static fn (string $tag): bool => !preg_match('/\balt\s*=/i', $tag));

        if ($images !== [] && count($withoutAlt) === count($images)) {
            $warnings[] = 'No image has alt text.';
        }

        $plainText = trim(strip_tags($html));

        return [
            'score' => $this->deliverabilityScore($issues, $warnings),
            'issues' => $issues,
            'warnings' => $warnings,
            'metrics' => [
                'subject_length' => $subjectLength,
                'preview_length' => mb_strlen($previewText),
                'html_length' => mb_strlen($html),
                'text_length' => mb_strlen($plainText),
                'image_count' => count($images),
                'link_count' => preg_match_all('/<a\b[^>]*href/i', $html),
                'word_count' => str_word_count($plainText),
            ],
        ];
    }

    /**
     * Turn the issue/warning list into a 0-100 score.
     *
     * @param  array<int, string>  $issues
     * @param  array<int, string>  $warnings
     */
    private function deliverabilityScore(array $issues, array $warnings): int
    {
        return (int) max(0, min(100, 100 - (count($issues) * 30) - (count($warnings) * 8)));
    }
}


