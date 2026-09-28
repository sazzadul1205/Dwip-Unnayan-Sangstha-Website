// resources/js/pages/Backend/Newsletter/Campaigns/Show.jsx
//
// ============================================================
//  DELIVERY REPORT
// ============================================================
//
// The "which succeeded / which failed" screen. Shows the campaign
// envelope, the aggregate outcome, and a filterable ledger of every
// recipient with the real SMTP error behind any failure.

import React, { useCallback, useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import { resolveMergeTags } from '../Components/EmailContentEditor';
import {
  FaArrowLeft,
  FaRedo,
  FaDownload,
  FaFileAlt,
  FaCopy,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaClock,
  FaSearch,
  FaEye,
  FaBan,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const LEDGER_STYLES = {
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  bounced: 'bg-red-700 text-white',
  pending: 'bg-amber-100 text-amber-700',
  skipped: 'bg-gray-100 text-gray-600',
};

const LedgerBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
      LEDGER_STYLES[status] ?? 'bg-gray-100 text-gray-700'
    }`}
  >
    {status === 'sent' && <FaCheckCircle size={10} />}
    {status === 'failed' && <FaExclamationTriangle size={10} />}
    {status === 'bounced' && <FaBan size={10} />}
    {status === 'pending' && <FaClock size={10} />}
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

const StatTile = ({ label, value, tone = 'gray' }) => {
  const tones = {
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${tones[tone]}`}>
      <p className="text-[11px] font-medium opacity-80">{label}</p>
      <p className="mt-0.5 text-xl font-bold sm:text-2xl">{value}</p>
    </div>
  );
};

const CampaignShow = ({ campaign, recipients, breakdown = {}, filters = {} }) => {
  const [search, setSearch] = useState(filters.search ?? '');
  const [status, setStatus] = useState(filters.status ?? 'all');
  const [showHtml, setShowHtml] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);

  const { flash } = usePage().props;

  useEffect(() => {
    if (flash?.success) {
      Swal.fire({ icon: 'success', title: 'Success', text: flash.success, timer: 2600, showConfirmButton: false });
    }
    if (flash?.error) {
      Swal.fire({ icon: 'error', title: 'Something went wrong', text: flash.error, confirmButtonColor: '#ef4444' });
    }
  }, [flash]);

  const applyFilters = useCallback((nextSearch, nextStatus) => {
    router.get(
      route('backend.newsletter.campaigns.show', campaign.id),
      { search: nextSearch, status: nextStatus },
      { preserveState: true, preserveScroll: true }
    );
  }, [campaign.id]);

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters(search, status);
  };

  const handleStatus = (value) => {
    setStatus(value);
    applyFilters(search, value);
  };

  const handleRetry = () => {
    const failed = (campaign.failed_count ?? 0) + (campaign.bounced_count ?? 0);

    if (failed === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Nothing to retry',
        text: 'Every delivery in this campaign succeeded.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: `Retry ${failed} failed recipient(s)?`,
      text: 'They will be re-queued immediately.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (!result.isConfirmed) return;

      router.post(
        route('backend.newsletter.campaigns.retry-failed', campaign.id),
        {},
        {
          preserveScroll: true,
          onSuccess: (page) => {
            Swal.fire({
              icon: 'success',
              title: 'Retrying',
              text: page.props.flash?.success ?? 'Failed recipients re-queued.',
              timer: 2200,
              showConfirmButton: false,
            });
          },
        }
      );
    });
  };

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(campaign.html_content ?? campaign.content ?? '');
      setHtmlCopied(true);
      setTimeout(() => setHtmlCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const rows = recipients?.data ?? [];
  const sent = campaign.sent_count ?? 0;
  const failed = campaign.failed_count ?? 0;
  const bounced = campaign.bounced_count ?? 0;
  const total = campaign.total_subscribers ?? 0;
  const successRate = campaign.success_rate ?? 0;

  // The stored body is the admin-authored copy; preview it with sample data.
  const previewHtml = resolveMergeTags(campaign.html_content ?? campaign.content ?? '');

  const chips = [
    { value: 'all', label: 'All', count: breakdown.all ?? 0 },
    { value: 'delivered', label: 'Delivered', count: breakdown.delivered ?? 0 },
    { value: 'failed', label: 'Failed', count: breakdown.failed ?? 0 },
    { value: 'bounced', label: 'Bounced', count: breakdown.bounced ?? 0 },
    { value: 'queued', label: 'Queued', count: breakdown.queued ?? 0 },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Delivery Report" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
        <div className="mx-auto max-w-7xl">
          {/* ---------- HEADER ---------- */}
          <div className="mb-4 sm:mb-6">
            <Link
              href={route('backend.newsletter.campaigns.index')}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 transition hover:text-blue-600"
            >
              <FaArrowLeft size={12} />
              Back to campaigns
            </Link>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
                  {campaign.subject}
                </h1>

                {campaign.preview_text && (
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">{campaign.preview_text}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <FaClock size={11} />
                    {campaign.started_at
                      ? new Date(campaign.started_at).toLocaleString()
                      : 'Never sent'}
                  </span>
                  <span>by {campaign.creator?.name ?? 'System'}</span>
                  <span>
                    {campaign.from_email
                      ? `${campaign.from_name ?? ''} <${campaign.from_email}>`
                      : `Default sender (${campaign.from_name ?? 'App'})`}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                >
                  <FaRedo size={13} />
                  Retry failed
                </button>

                <button
                  type="button"
                  onClick={() => setShowHtml((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  <FaEye size={13} />
                  {showHtml ? 'Hide' : 'View'} email
                </button>

                <a
                  href={route('backend.newsletter.campaigns.export-html', campaign.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  <FaFileAlt size={13} />
                  HTML
                </a>

                <a
                  href={route('backend.newsletter.campaigns.export-recipients', campaign.id, {
                    status: status === 'all' ? undefined : status,
                    search: search || undefined,
                  })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-green-700"
                >
                  <FaDownload size={13} />
                  Export CSV
                </a>
              </div>
            </div>
          </div>

          {/* ---------- OUTCOME TILES ---------- */}
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            <StatTile label="Total recipients" value={total} tone="blue" />
            <StatTile label="Delivered" value={sent} tone="green" />
            <StatTile label="Failed" value={failed} tone={failed > 0 ? 'red' : 'gray'} />
            <StatTile label="Bounced" value={bounced} tone={bounced > 0 ? 'red' : 'gray'} />
            <StatTile
              label="Success rate"
              value={`${successRate}%`}
              tone={successRate >= 95 ? 'green' : successRate >= 80 ? 'amber' : 'red'}
            />
          </div>

          {/* ---------- STORED EMAIL PREVIEW ---------- */}
          {showHtml && (
            <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:mb-6">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Stored email</h2>
                  <p className="text-[11px] text-gray-500">
                    The exact HTML that was sent, with sample personalisation applied.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyHtml}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  {htmlCopied ? <FaCheckCircle size={12} className="text-green-600" /> : <FaCopy size={12} />}
                  {htmlCopied ? 'Copied' : 'Copy HTML'}
                </button>
              </div>

              <div className="max-h-[520px] overflow-auto bg-gray-100 p-4">
                <iframe
                  title="Stored campaign email"
                  srcDoc={previewHtml || '<p>No content stored.</p>'}
                  sandbox=""
                  className="h-[480px] w-full rounded-lg border border-gray-300 bg-white"
                />
              </div>
            </div>
          )}


          {/* ---------- DELIVERY LEDGER ---------- */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Delivery ledger</h2>
                  <p className="text-[11px] text-gray-500">
                    One row per recipient — who received it, who it failed for and why.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="w-full lg:w-72">
                  <div className="relative">
                    <FaSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={13}
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search email or name…"
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </form>
              </div>

              {/* STATUS FILTER CHIPS */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {chips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => handleStatus(chip.value)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                      status === chip.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {chip.label}
                    <span className="ml-1 opacity-75">{chip.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:text-xs">
                      Recipient
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:text-xs">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:text-xs">
                      Detail
                    </th>
                    <th className="px-3 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:text-xs">
                      Attempts
                    </th>
                  </tr>
                </thead>


                <tbody className="divide-y divide-gray-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-14 text-center">
                        <FaSpinner className="mx-auto mb-3 animate-spin text-gray-300" size={28} />
                        <p className="text-sm font-medium text-gray-600">No recipients found</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {campaign.status === 'processing'
                            ? 'Deliveries are still being processed.'
                            : 'Try changing the filter or search term.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="transition hover:bg-gray-50">
                        <td className="px-3 py-3 sm:px-4">
                          <p className="max-w-xs truncate text-sm font-medium text-gray-900">
                            {row.email}
                          </p>
                          {row.name && (
                            <p className="max-w-xs truncate text-[11px] text-gray-400">{row.name}</p>
                          )}
                        </td>

                        <td className="px-3 py-3 sm:px-4">
                          <LedgerBadge status={row.status} />
                          {row.sent_at && (
                            <p className="mt-1 text-[10px] text-gray-400">
                              {new Date(row.sent_at).toLocaleString()}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-3 sm:px-4">
                          {row.error_message ? (
                            <p
                              className="max-w-md break-words font-mono text-[11px] leading-relaxed text-red-600"
                              title={row.error_message}
                            >
                              {row.error_message}
                            </p>
                          ) : row.status === 'sent' ? (
                            <p className="text-[11px] text-green-600">Delivered successfully</p>
                          ) : (
                            <p className="text-[11px] text-gray-400">Waiting to be sent…</p>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right text-xs text-gray-500 sm:px-4">
                          {row.attempts ?? 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {recipients?.links && recipients.links.length > 3 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Showing {recipients.from ?? 0} to {recipients.to ?? 0} of {recipients.total ?? 0}
                </p>

                <div className="flex items-center gap-1">
                  {recipients.links.map((link, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={!link.url}
                      onClick={() =>
                        link.url &&
                        router.get(link.url, {}, { preserveState: true, preserveScroll: true })
                      }
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      className={`rounded px-2.5 py-1 text-xs transition ${
                        link.active
                          ? 'bg-blue-600 text-white'
                          : link.url
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'cursor-not-allowed text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default CampaignShow;

