// resources/js/pages/Backend/Newsletter/Components/EmailContentEditor.jsx
//
// ============================================================
//  HTML EMAIL EDITOR
// ============================================================
//
// A block-based editor for building responsive HTML newsletters without
// leaving the admin panel:
//
//   * Drag-free block palette – click a block to append its pre-built,
//     email-safe HTML (every block uses inline styles + tables, because
//     Outlook ignores <style> blocks and most modern selectors).
//   * Merge tags – one click inserts {{name}}, {{unsubscribe_url}} …
//   * Live preview rendered in a sandboxed <iframe srcDoc>, switchable
//     between desktop / mobile widths so the admin sees what a recipient
//     on a phone will actually get.
//   * Source mode for hand-editing the raw HTML when a block is not enough.
//
// The parent owns the HTML string; this component is fully controlled.

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FaHeading,
  FaLink,
  FaImage,
  FaListUl,
  FaCode,
  FaQuoteLeft,
  FaMinus,
  FaTable,
  FaParagraph,
  FaDesktop,
  FaMobileAlt,
  FaEye,
  FaCheckCircle,
  FaCopy,
} from 'react-icons/fa';

// ============================================
//  BLOCK LIBRARY
// ============================================
//
// Every snippet is written the way a real ESP would emit it: tables +
// inline CSS only, so it survives Outlook / Gmail / Apple Mail.
export const EMAIL_BLOCKS = [
  {
    key: 'heading',
    label: 'Heading',
    icon: FaHeading,
    html: `<h1 style="margin:0 0 16px 0;font-size:28px;line-height:36px;font-weight:700;color:#0f233c;">
    Your headline goes here
</h1>`,
  },
  {
    key: 'subheading',
    label: 'Subheading',
    icon: FaHeading,
    html: `<h2 style="margin:0 0 12px 0;font-size:21px;line-height:28px;font-weight:600;color:#1d3557;">
    Section heading
</h2>`,
  },
  {
    key: 'paragraph',
    label: 'Paragraph',
    icon: FaParagraph,
    html: `<p style="margin:0 0 16px 0;font-size:16px;line-height:26px;color:#33455c;">
    Write your message here. Keep paragraphs short and scannable.
</p>`,
  },
  {
    key: 'button',
    label: 'Button',
    icon: FaLink,
    html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
    <tr>
        <td align="center" bgcolor="#009BE2" style="border-radius:6px;">
            <a href="{{site_url}}"
                style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;
                       color:#ffffff;text-decoration:none;border-radius:6px;">
                Call to action
            </a>
        </td>
    </tr>
</table>`,
  },
  {
    key: 'image',
    label: 'Image',
    icon: FaImage,
    html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
    <tr>
        <td align="center">
            <img src="https://via.placeholder.com/600x240/009BE2/ffffff?text=600+x+240"
                alt="Describe your image" width="600"
                style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:8px;">
        </td>
    </tr>
</table>`,
  },
  {
    key: 'callout',
    label: 'Callout',
    icon: FaQuoteLeft,
    html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
    <tr>
        <td style="padding:18px 20px;background:#f2f7fb;border-left:4px solid #009BE2;border-radius:6px;">
            <p style="margin:0;font-size:15px;line-height:24px;color:#33455c;">
                Highlight an important point or announcement.
            </p>
        </td>
    </tr>
</table>`,
  },
  {
    key: 'divider',
    label: 'Divider',
    icon: FaMinus,
    html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
        <td style="border-top:1px solid #e6ecf3;font-size:0;line-height:0;">&nbsp;</td>
    </tr>
</table>`,
  },
  {
    key: 'columns',
    label: '2 Columns',
    icon: FaTable,
    html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
    <tr>
        <td width="50%" valign="top" style="padding:0 8px 0 0;">
            <p style="margin:0;font-size:15px;line-height:24px;color:#33455c;"><strong>Column one</strong></p>
            <p style="margin:6px 0 0 0;font-size:14px;line-height:22px;color:#6b7f95;">Supporting copy.</p>
        </td>
        <td width="50%" valign="top" style="padding:0 0 0 8px;">
            <p style="margin:0;font-size:15px;line-height:24px;color:#33455c;"><strong>Column two</strong></p>
            <p style="margin:6px 0 0 0;font-size:14px;line-height:22px;color:#6b7f95;">Supporting copy.</p>
        </td>
    </tr>
</table>`,
  },
  {
    key: 'list',
    label: 'Bullet List',
    icon: FaListUl,
    html: `<ul style="margin:0 0 18px 0;padding:0 0 0 22px;font-size:16px;line-height:28px;color:#33455c;">
    <li style="margin:0 0 6px 0;">First key point</li>
    <li style="margin:0 0 6px 0;">Second key point</li>
    <li style="margin:0;">Third key point</li>
</ul>`,
  },
  {
    key: 'legal',
    label: 'Unsubscribe',
    icon: FaCode,
    html: `<p style="margin:24px 0 0 0;padding-top:14px;border-top:1px solid #e6ecf3;font-size:12px;line-height:19px;color:#8a9aad;">
    You are receiving this because you subscribed to {{app_name}}.
    <a href="{{unsubscribe_url}}" style="color:#009BE2;text-decoration:underline;">Unsubscribe</a>
</p>`,
  },
];

// ============================================
//  PREVIEW DOCUMENT
// ============================================

/**
 * Resolve merge tags client-side so the preview updates instantly while
 * typing. The server performs the authoritative render (see
 * NewsletterContentRenderer) when the campaign is actually sent, but the
 * admin should not have to wait for a round trip to see their name inline.
 *
 * The values intentionally mirror the server-side sample subscriber.
 */
const PREVIEW_MERGE_VALUES = {
  name: 'Preview Recipient',
  first_name: 'Preview',
  email: 'preview@example.com',
  unsubscribe_url: '#unsubscribe',
  resubscribe_url: '#resubscribe',
  app_name: 'Dwip Unnayan Sangstha',
  site_url: '#',
  year: String(new Date().getFullYear()),
  date: new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }),
};

export const resolveMergeTags = (html) =>
  String(html || '').replace(
    /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g,
    (match, key) => PREVIEW_MERGE_VALUES[key] ?? match
  );

/**
 * Wrap the body in the same shell the real Blade template uses, so the
 * preview is pixel-accurate rather than an approximation.
 */
export const buildPreviewDocument = (bodyHtml) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preview</title>
<style>
  body { margin:0; padding:0; background:#eef2f7;
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  .nl-wrap { padding:24px 12px; }
  .nl-card { width:600px; max-width:600px; margin:0 auto; background:#ffffff;
             border-radius:14px; overflow:hidden; box-shadow:0 4px 24px rgba(15,35,60,.08); }
  .nl-brand { padding:28px 32px; background:#009BE2; text-align:center;
              color:#fff; font-size:20px; font-weight:700; }
  .nl-greet { padding:28px 32px 8px 32px; }
  .nl-greet h1 { margin:0 0 12px 0; font-size:26px; line-height:34px; font-weight:700; color:#0f233c; }
  .nl-body  { padding:0 32px 8px 32px; font-size:16px; line-height:26px; color:#33455c; }
  .nl-foot  { padding:20px 32px 28px 32px; border-top:1px solid #e6ecf3;
              font-size:13px; line-height:20px; color:#6b7f95; }
  .nl-foot a { color:#009BE2; }
  .nl-outer { margin:18px 0 0 0; font-size:11px; line-height:16px; color:#93a4b8; text-align:center; }
</style>
</head>
<body>
  <div class="nl-wrap">
    <div class="nl-card">
      <div class="nl-brand">Dwip Unnayan Sangstha</div>
      <div class="nl-greet"><h1>Hello Preview!</h1></div>
      <div class="nl-body">${resolveMergeTags(bodyHtml) || '<p style="color:#9aa8b8">Nothing to preview yet &mdash; add a block to get started.</p>'}</div>
      <div class="nl-foot">
        You are receiving this because you subscribed to the newsletter.<br>
        <a href="#unsubscribe">Unsubscribe</a> from future emails.
      </div>
    </div>
    <p class="nl-outer">Sent by Dwip Unnayan Sangstha &middot; This is an automated message.</p>
  </div>
</body>
</html>`;


// ============================================
//  EDITOR COMPONENT
// ============================================

const EmailContentEditor = ({ value, onChange, mergeTags = [], className = '' }) => {
  const [mode, setMode] = useState('blocks'); // blocks | source | preview
  const [device, setDevice] = useState('desktop'); // desktop | mobile
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const html = typeof value === 'string' ? value : '';

  // Append a whole block to the body.
  const appendHtml = useCallback(
    (snippet) => {
      const next = html ? `${html}\n\n${snippet}` : snippet;
      onChange(next);

      // Nudge the admin to the source tab so they see what was inserted.
      if (mode === 'preview') setMode('source');
    },
    [html, onChange, mode]
  );

  /**
   * Insert at the caret when the source textarea is focused, otherwise
   * append. This is what makes the merge tags feel natural to use.
   */
  const insertAtCaret = useCallback(
    (snippet) => {
      const el = textareaRef.current;

      if (!el || document.activeElement !== el) {
        appendHtml(snippet);
        return;
      }

      const start = el.selectionStart ?? html.length;
      const end = el.selectionEnd ?? html.length;
      const next = html.slice(0, start) + snippet + html.slice(end);

      onChange(next);

      requestAnimationFrame(() => {
        el.focus();
        const caret = start + snippet.length;
        el.setSelectionRange(caret, caret);
      });
    },
    [html, onChange, appendHtml]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (insecure context) - ignore */
    }
  }, [html]);

  const previewDoc = useMemo(() => buildPreviewDocument(html), [html]);

  const tabs = [
    { key: 'blocks', label: 'Blocks', icon: FaTable },
    { key: 'source', label: 'HTML', icon: FaCode },
    { key: 'preview', label: 'Preview', icon: FaEye },
  ];

  return (
    <div className={`rounded-xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* ---------- TOOLBAR ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = mode === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          {mode === 'preview' && (
            <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                title="Desktop width"
                className={`px-2 py-1.5 transition ${
                  device === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaDesktop size={12} />
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                title="Mobile width"
                className={`px-2 py-1.5 transition ${
                  device === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaMobileAlt size={12} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
          >
            {copied ? <FaCheckCircle size={12} className="text-green-600" /> : <FaCopy size={12} />}
            {copied ? 'Copied' : 'Copy HTML'}
          </button>
        </div>
      </div>


      {/* ---------- BLOCKS VIEW ---------- */}
      {mode === 'blocks' && (
        <div className="space-y-4 p-3 sm:p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Content blocks
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {EMAIL_BLOCKS.map((block) => {
                const Icon = block.icon;

                return (
                  <button
                    key={block.key}
                    type="button"
                    onClick={() => appendHtml(block.html)}
                    className="flex flex-col items-start gap-1.5 rounded-lg border border-gray-200 bg-white p-2.5 text-left transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm"
                  >
                    <Icon size={15} className="text-blue-600" />
                    <span className="text-[11px] font-medium text-gray-700">{block.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {mergeTags.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Personalisation
              </p>
              <div className="flex flex-wrap gap-1.5">
                {mergeTags.map((tag) => (
                  <button
                    key={tag.tag}
                    type="button"
                    title={tag.hint}
                    onClick={() => insertAtCaret(`{{${tag.tag}}}`)}
                    className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 transition hover:bg-purple-100"
                  >
                    {`{{${tag.tag}}}`}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">
                Replaced per recipient at send time. Open the HTML tab to position the cursor first.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
            <p className="text-xs text-gray-500">
              Pick a block above to append it, or open the{' '}
              <button
                type="button"
                onClick={() => setMode('source')}
                className="font-semibold text-blue-600 underline"
              >
                HTML
              </button>{' '}
              tab to write the markup yourself.
            </p>
          </div>
        </div>
      )}

      {/* ---------- SOURCE VIEW ---------- */}
      {mode === 'source' && (
        <div className="p-3 sm:p-4">
          <textarea
            ref={textareaRef}
            value={html}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            rows={20}
            placeholder="Write your newsletter HTML here…"
            className="w-full rounded-lg border border-gray-300 p-3 font-mono text-xs leading-relaxed text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-gray-400">
              Scripts, iframes and event handlers are stripped automatically when the campaign is sent.
            </p>
            <span className="text-[11px] text-gray-400">{html.length.toLocaleString()} characters</span>
          </div>
        </div>
      )}

      {/* ---------- PREVIEW VIEW ---------- */}
      {mode === 'preview' && (
        <div className="bg-gray-100 p-3 sm:p-4">
          <p className="mb-2 text-[11px] text-gray-500">
            Rendered with sample data — exactly what a subscriber receives.
          </p>

          <div className="flex justify-center">
            <iframe
              title="Email preview"
              srcDoc={previewDoc}
              sandbox=""
              className="h-[560px] w-full rounded-lg border border-gray-300 bg-white shadow-sm transition-all"
              style={{ maxWidth: device === 'mobile' ? '390px' : '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailContentEditor;

