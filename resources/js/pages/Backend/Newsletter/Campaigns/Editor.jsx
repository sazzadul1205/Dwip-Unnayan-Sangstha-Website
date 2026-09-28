// resources/js/pages/Backend/Newsletter/Campaigns/Editor.jsx
//
// ============================================================
//  CAMPAIGN BUILDER
// ============================================================
//
// Full-screen composer for a newsletter campaign:
//
//   Envelope   -> subject, preview text, From name/address, Reply-To
//   Body       -> EmailContentEditor (blocks / HTML / live preview)
//   Audience   -> all active, filtered segment, or hand-picked recipients
//   Safety     -> server-side deliverability analysis + test send
//   Actions    -> save as draft, or save and send immediately

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import EmailContentEditor from '../Components/EmailContentEditor';
import {
  FaArrowLeft,
  FaPaperPlane,
  FaSave,
  FaEnvelope,
  FaFlask,
  FaUsers,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSpinner,
  FaSearch,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const EMPTY_AUDIENCE_META = { status: '', source: '', ids: [] };

const CampaignEditor = ({
  campaign,
  audienceOptions = [],
  mergeTags = [],
  template = '',
  recipients = [],
}) => {
  const { auth } = usePage().props;
  const isEditing = Boolean(campaign?.id);

  // ---------------------------------------------
  //  FORM STATE
  // ---------------------------------------------
  const [form, setForm] = useState({
    subject: campaign?.subject ?? '',
    preview_text: campaign?.preview_text ?? '',
    from_name: campaign?.from_name ?? '',
    from_email: campaign?.from_email ?? '',
    reply_to: campaign?.reply_to ?? '',
    html_content: campaign?.html_content ?? campaign?.content ?? template ?? '',
    audience_type: campaign?.audience_type ?? 'all_active',
    audience_meta: { ...EMPTY_AUDIENCE_META, ...(campaign?.audience_meta ?? {}) },
  });

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [recipientSearch, setRecipientSearch] = useState('');

  const csrfToken =
    typeof document !== 'undefined'
      ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
      : '';

  // ---------------------------------------------
  //  DERIVED
  // ---------------------------------------------
  const selectedIds = useMemo(
    () => (Array.isArray(form.audience_meta?.ids) ? form.audience_meta.ids : []),
    [form.audience_meta]
  );

  const filteredRecipients = useMemo(() => {
    const term = recipientSearch.trim().toLowerCase();
    if (!term) return recipients;

    return recipients.filter(
      (r) => r.email?.toLowerCase().includes(term) || r.name?.toLowerCase().includes(term)
    );
  }, [recipients, recipientSearch]);

  const update = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateMeta = useCallback((key, value) => {
    setForm((prev) => ({
      ...prev,
      audience_meta: { ...EMPTY_AUDIENCE_META, ...prev.audience_meta, [key]: value },
    }));
  }, []);

  const toggleRecipient = useCallback((id) => {
    setForm((prev) => {
      const ids = Array.isArray(prev.audience_meta?.ids) ? prev.audience_meta.ids : [];

      return {
        ...prev,
        audience_meta: {
          ...prev.audience_meta,
          ids: ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
        },
      };
    });
  }, []);

  // ---------------------------------------------
  //  DELIVERABILITY ANALYSIS
  //  Debounced so it does not fire on every keystroke.
  // ---------------------------------------------
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!form.html_content.trim() && !form.subject.trim()) {
        setAnalysis(null);
        return;
      }

      try {
        const response = await fetch(route('backend.newsletter.campaigns.preview'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            html_content: form.html_content,
            subject: form.subject,
            preview_text: form.preview_text,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysis(data.analysis ?? null);
        }
      } catch {
        /* analysis is a nice-to-have, never block the editor on it */
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [form.html_content, form.subject, form.preview_text, csrfToken]);

  // ---------------------------------------------
  //  SUBMIT
  // ---------------------------------------------
  const payload = (sendNow) => ({
    subject: form.subject,
    preview_text: form.preview_text,
    from_name: form.from_name,
    from_email: form.from_email,
    reply_to: form.reply_to,
    html_content: form.html_content,
    audience_type: form.audience_type,
    audience_meta: form.audience_meta,
    send_now: sendNow,
  });

  const validate = () => {
    if (!form.subject.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Subject required',
        text: 'Give your campaign a subject line before saving.',
        confirmButtonColor: '#3b82f6',
      });
      return false;
    }

    if (!form.html_content.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty email',
        text: 'Add some content to the email body first.',
        confirmButtonColor: '#3b82f6',
      });
      return false;
    }

    if (form.audience_type === 'selected' && selectedIds.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No recipients',
        text: 'Pick at least one recipient, or switch to "All active subscribers".',
        confirmButtonColor: '#3b82f6',
      });
      return false;
    }

    return true;
  };

  const handleSave = (sendNow) => {
    if (!validate()) return;

    const options = {
      preserveScroll: true,
      onSuccess: (page) => {
        setSaving(false);
        setSending(false);

        Swal.fire({
          icon: 'success',
          title: sendNow ? 'Campaign started' : 'Draft saved',
          text: page.props.flash?.success ?? (sendNow ? 'Your campaign is being sent.' : 'Saved.'),
          timer: 2500,
          showConfirmButton: false,
        });
      },
      onError: (errors) => {
        setSaving(false);
        setSending(false);

        Swal.fire({
          icon: 'error',
          title: 'Could not save',
          text: Object.values(errors)[0] ?? 'Something went wrong.',
          confirmButtonColor: '#ef4444',
        });
      },
    };

    if (sendNow) {
      setSending(true);

      Swal.fire({
        title: 'Send this campaign?',
        html: `This will immediately queue the email for every recipient in the selected audience.<br/><br/>
               <strong>${form.subject}</strong>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, send it',
        cancelButtonText: 'Keep editing',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
      }).then((result) => {
        if (!result.isConfirmed) {
          setSending(false);
          return;
        }

        if (isEditing) {
          router.put(route('backend.newsletter.campaigns.update', campaign.id), payload(true), options);
        } else {
          router.post(route('backend.newsletter.campaigns.store'), payload(true), options);
        }
      });

      return;
    }

    setSaving(true);

    if (isEditing) {
      router.put(route('backend.newsletter.campaigns.update', campaign.id), payload(false), options);
    } else {
      router.post(route('backend.newsletter.campaigns.store'), payload(false), options);
    }
  };

  // ---------------------------------------------
  //  TEST SEND
  // ---------------------------------------------
  const handleTestSend = async () => {
    const { value: email } = await Swal.fire({
      title: 'Send a test email',
      input: 'email',
      inputPlaceholder: 'you@example.com',
      inputValue: auth?.user?.email ?? '',
      showCancelButton: true,
      confirmButtonText: 'Send test',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      inputValidator: (v) => (!v || !/^\S+@\S+\.\S+$/.test(v) ? 'Enter a valid email address' : null),
    });

    if (!email) return;

    setTesting(true);

    try {
      const response = await fetch(route('backend.newsletter.campaigns.test-send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          subject: form.subject || 'Newsletter test',
          preview_text: form.preview_text,
          from_name: form.from_name,
          from_email: form.from_email,
          html_content: form.html_content,
        }),
      });

      const data = await response.json();

      Swal.fire({
        icon: data.success ? 'success' : 'error',
        title: data.success ? 'Test sent' : 'Test failed',
        text: data.message ?? (data.errors ? Object.values(data.errors)[0] : 'Unknown error'),
        confirmButtonColor: data.success ? '#16a34a' : '#ef4444',
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Test failed',
        text: 'Could not reach the server.',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setTesting(false);
    }
  };

  // ---------------------------------------------
  //  RENDER HELPERS
  // ---------------------------------------------
  const scoreTone = analysis?.score >= 80 ? 'green' : analysis?.score >= 55 ? 'amber' : 'red';

  const toneClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  const fieldClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';


  return (
    <AuthenticatedLayout>
      <Head title={isEditing ? 'Edit Campaign' : 'New Campaign'} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
        <div className="mx-auto max-w-7xl">
          {/* ---------- HEADER ---------- */}
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={route('backend.newsletter.campaigns.index')}
                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 transition hover:bg-gray-100"
              >
                <FaArrowLeft size={14} />
              </Link>

              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  {isEditing ? 'Edit Campaign' : 'New Campaign'}
                </h1>
                <p className="text-xs text-gray-500 sm:text-sm">
                  Compose the email, pick an audience, then send or save it as a draft.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTestSend}
                disabled={testing || !form.html_content.trim()}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:text-sm"
              >
                {testing ? <FaSpinner className="animate-spin" size={13} /> : <FaFlask size={13} />}
                Send test
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving || sending}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 sm:flex-none sm:text-sm"
              >
                {saving ? <FaSpinner className="animate-spin" size={13} /> : <FaSave size={13} />}
                Save draft
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={sending || saving}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:flex-none sm:text-sm"
              >
                {sending ? <FaSpinner className="animate-spin" size={13} /> : <FaPaperPlane size={13} />}
                {isEditing ? 'Update & send' : 'Send now'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 sm:gap-6">
            {/* ---------- MAIN COLUMN ---------- */}
            <div className="space-y-4 sm:space-y-6 lg:col-span-2">


              {/* ENVELOPE */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <FaEnvelope className="text-blue-600" size={15} />
                  Email envelope
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Subject line <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => update('subject', e.target.value)}
                      maxLength={255}
                      placeholder="e.g. New job openings this week"
                      className={fieldClass}
                    />
                    <p className="mt-1 text-right text-[11px] text-gray-400">
                      {form.subject.length}/255
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Preview text
                    </label>
                    <input
                      type="text"
                      value={form.preview_text}
                      onChange={(e) => update('preview_text', e.target.value)}
                      maxLength={255}
                      placeholder="Shown next to the subject in the inbox"
                      className={fieldClass}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">From name</label>
                      <input
                        type="text"
                        value={form.from_name}
                        onChange={(e) => update('from_name', e.target.value)}
                        placeholder="Dwip Unnayan Sangstha"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">From address</label>
                      <input
                        type="email"
                        value={form.from_email}
                        onChange={(e) => update('from_email', e.target.value)}
                        placeholder="newsletter@example.com"
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Reply-To</label>
                    <input
                      type="email"
                      value={form.reply_to}
                      onChange={(e) => update('reply_to', e.target.value)}
                      placeholder="Where replies should go (optional)"
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div>
                <h2 className="mb-3 text-sm font-semibold text-gray-900">Email content</h2>
                <EmailContentEditor
                  value={form.html_content}
                  onChange={(value) => update('html_content', value)}
                  mergeTags={mergeTags}
                />
              </div>
            </div>


            {/* ---------- SIDEBAR ---------- */}
            <div className="space-y-4 sm:space-y-6">
              {/* DELIVERABILITY */}
              {analysis && (
                <div className={`rounded-xl border p-4 shadow-sm ${toneClasses[scoreTone]}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Deliverability</h3>
                    <span className="text-lg font-bold">{analysis.score}</span>
                  </div>

                  {analysis.issues?.map((issue) => (
                    <p key={issue} className="mt-1.5 flex items-start gap-1.5 text-xs">
                      <FaExclamationTriangle className="mt-0.5 shrink-0" size={11} />
                      <span>{issue}</span>
                    </p>
                  ))}

                  {analysis.warnings?.map((warning) => (
                    <p key={warning} className="mt-1.5 flex items-start gap-1.5 text-xs">
                      <FaInfoCircle className="mt-0.5 shrink-0" size={11} />
                      <span>{warning}</span>
                    </p>
                  ))}

                  {!analysis.issues?.length && !analysis.warnings?.length && (
                    <p className="flex items-center gap-1.5 text-xs">
                      <FaCheckCircle size={11} /> Looks good to send.
                    </p>
                  )}

                  {analysis.metrics && (
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-current/20 pt-3 text-center">
                      <div>
                        <p className="text-base font-bold">{analysis.metrics.word_count}</p>
                        <p className="text-[10px] opacity-75">words</p>
                      </div>
                      <div>
                        <p className="text-base font-bold">{analysis.metrics.link_count}</p>
                        <p className="text-[10px] opacity-75">links</p>
                      </div>
                      <div>
                        <p className="text-base font-bold">{analysis.metrics.image_count}</p>
                        <p className="text-[10px] opacity-75">images</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AUDIENCE */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <FaUsers className="text-blue-600" size={15} />
                  Audience
                </h3>

                <div className="space-y-2">
                  {audienceOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition ${
                        form.audience_type === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="audience_type"
                        value={option.value}
                        checked={form.audience_type === option.value}
                        onChange={(e) => update('audience_type', e.target.value)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-gray-800">
                          {option.label}
                        </span>
                        <span className="block text-[11px] text-gray-500">{option.hint}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                        {option.count}
                      </span>
                    </label>
                  ))}
                </div>


                {/* FILTER OPTIONS */}
                {form.audience_type === 'filtered' && (
                  <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">Status</label>
                      <select
                        value={form.audience_meta?.status ?? ''}
                        onChange={(e) => updateMeta('status', e.target.value)}
                        className={fieldClass}
                      >
                        <option value="">Active only</option>
                        <option value="unsubscribed">Unsubscribed</option>
                        <option value="bounced">Bounced</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-gray-600">Source</label>
                      <input
                        type="text"
                        value={form.audience_meta?.source ?? ''}
                        onChange={(e) => updateMeta('source', e.target.value)}
                        placeholder="e.g. footer"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                )}

                {/* RECIPIENT PICKER */}
                {form.audience_type === 'selected' && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-gray-600">
                        {selectedIds.length} selected
                      </span>
                      {selectedIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => updateMeta('ids', [])}
                          className="text-[11px] text-red-600 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="relative mb-2">
                      <FaSearch
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={12}
                      />
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        placeholder="Search subscribers…"
                        className={`${fieldClass} pl-8 text-xs`}
                      />
                    </div>

                    <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-1">
                      {filteredRecipients.length === 0 ? (
                        <p className="p-3 text-center text-[11px] text-gray-400">
                          No subscribers found.
                        </p>
                      ) : (
                        filteredRecipients.map((sub) => (
                          <label
                            key={sub.id}
                            className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(sub.id)}
                              onChange={() => toggleRecipient(sub.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[11px] text-gray-800">
                                {sub.email}
                              </span>
                              {sub.name && (
                                <span className="block truncate text-[10px] text-gray-400">
                                  {sub.name}
                                </span>
                              )}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* DELIVERY NOTE */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs leading-relaxed text-blue-800">
                  <strong>How sending works.</strong> The campaign is queued on the database queue.
                  A worker sends each email in the background and records the outcome, so you can
                  see exactly who received it and why any delivery failed.
                </p>
                <p className="mt-2 text-[11px] text-blue-700">
                  Make sure <code className="rounded bg-blue-100 px-1">php artisan queue:work</code>{' '}
                  is running.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default CampaignEditor;

