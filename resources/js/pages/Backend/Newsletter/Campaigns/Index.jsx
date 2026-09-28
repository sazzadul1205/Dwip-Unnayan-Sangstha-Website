// resources/js/pages/Backend/Newsletter/Campaigns/Index.jsx
//
// ============================================================
//  CAMPAIGN MANAGER
// ============================================================
//
// Answers the two questions that matter after a send:
//   "how many went out?" and "how many failed?"
//
// Every row shows a stacked delivered / failed / queued bar plus the exact
// success rate, and links through to the per-recipient delivery ledger.

import React, { useCallback, useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import {
  FaPlus,
  FaPaperPlane,
  FaEye,
  FaEdit,
  FaCopy,
  FaTrash,
  FaSearch,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaFileAlt,
  FaClock,
  FaChartLine,
  FaRedo,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// ============================================
//  SMALL PRESENTATIONAL PIECES
// ============================================

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-200 text-slate-700',
};

const STATUS_ICONS = {
  draft: FaFileAlt,
  pending: FaClock,
  processing: FaSpinner,
  completed: FaCheckCircle,
  failed: FaTimesCircle,
  cancelled: FaExclamationCircle,
};

const StatusBadge = ({ status }) => {
  const Icon = STATUS_ICONS[status] ?? FaFileAlt;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      <Icon size={10} className={status === 'processing' ? 'animate-spin' : ''} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

/**
 * Stacked progress bar: delivered (green) | failed (red) | queued (grey).
 */
const DeliveryBar = ({ sent, failed, bounced, total }) => {
  const safeTotal = Math.max(total, sent + failed + bounced, 1);

  const pct = (n) => `${(n / safeTotal) * 100}%`;

  const segments = [
    { value: sent, className: 'bg-green-500', label: 'Delivered' },
    { value: failed, className: 'bg-red-500', label: 'Failed' },
    { value: bounced, className: 'bg-red-700', label: 'Bounced' },
  ];

  return (
    <div className="w-full">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
        {segments.map((seg) =>
          seg.value > 0 ? (
            <div
              key={seg.label}
              className={seg.className}
              style={{ width: pct(seg.value) }}
              title={`${seg.label}: ${seg.value}`}
            />
          ) : null
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, sub, icon: Icon, tone }) => {
  const tones = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${tones[tone] ?? tones.blue}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium opacity-80 sm:text-xs">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-gray-900 sm:text-2xl">{value}</p>
          {sub && <p className="mt-0.5 truncate text-[10px] text-gray-500 sm:text-[11px]">{sub}</p>}
        </div>
        <Icon size={20} className="shrink-0 opacity-70" />
      </div>
    </div>
  );
};

const Pagination = ({ meta }) => {
  if (!meta || (meta.last_page ?? 1) <= 1) return null;

  const onPageClick = (url) => {
    if (url) router.get(url, {}, { preserveState: true, preserveScroll: true });
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <p className="text-xs text-gray-500">
        Showing {meta.from ?? 0} to {meta.to ?? 0} of {meta.total ?? 0}
      </p>

      <div className="flex items-center gap-1">
        {(meta.links ?? []).map((link, index) => (
          <button
            key={index}
            type="button"
            disabled={!link.url}
            onClick={() => onPageClick(link.url)}
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
  );
};

// ============================================
//  PAGE
// ============================================

const CampaignIndex = ({ campaigns, summary = {}, filters = {} }) => {
  const [search, setSearch] = useState(filters.search ?? '');
  const [status, setStatus] = useState(filters.status ?? 'all');

  const { flash } = usePage().props;

  useEffect(() => {
    if (flash?.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: flash.success,
        timer: 2800,
        showConfirmButton: false,
      });
    }

    if (flash?.error) {
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
        text: flash.error,
        confirmButtonColor: '#ef4444',
      });
    }
  }, [flash]);

  const applyFilters = useCallback((nextSearch, nextStatus) => {
    router.get(
      route('backend.newsletter.campaigns.index'),
      { search: nextSearch, status: nextStatus },
      { preserveState: true, preserveScroll: true }
    );
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters(search, status);
  };

  const handleStatus = (value) => {
    setStatus(value);
    applyFilters(search, value);
  };

  // ---------------------------------------------
  //  ROW ACTIONS
  // ---------------------------------------------
  const handleDuplicate = (campaign) => {
    router.post(
      route('backend.newsletter.campaigns.duplicate', campaign.id),
      {},
      {
        preserveScroll: true,
        onSuccess: (page) => {
          Swal.fire({
            icon: 'success',
            title: 'Duplicated',
            text: page.props.flash?.success ?? 'Copied to a new draft.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
      }
    );
  };

  const handleDelete = (campaign) => {
    Swal.fire({
      title: 'Delete this campaign?',
      html: `<strong>${campaign.subject}</strong><br/>
             The stored HTML and the full delivery ledger will be removed permanently.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (!result.isConfirmed) return;

      router.delete(route('backend.newsletter.campaigns.destroy', campaign.id), {
        preserveScroll: true,
        onSuccess: (page) => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: page.props.flash?.success ?? 'Campaign removed.',
            timer: 1800,
            showConfirmButton: false,
          });
        },
        onError: (errors) => {
          Swal.fire({
            icon: 'error',
            title: 'Could not delete',
            text: errors.error ?? 'This campaign is still sending.',
            confirmButtonColor: '#ef4444',
          });
        },
      });
    });
  };

  const handleRetry = (campaign) => {
    const failed = (campaign.failed_count ?? 0) + (campaign.bounced_count ?? 0);

    Swal.fire({
      title: 'Retry failed recipients?',
      html: `This will re-queue <strong>${failed}</strong> failed delivery attempt(s) for
             <strong>${campaign.subject}</strong>.`,
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

  const rows = campaigns?.data ?? [];


  return (
    <AuthenticatedLayout>
      <Head title="Campaign Manager" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
        <div className="mx-auto max-w-7xl">
          {/* ---------- HEADER ---------- */}
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Campaign Manager</h1>
              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                Build newsletters in HTML and track exactly what was delivered and what failed.
              </p>
            </div>

            <Link
              href={route('backend.newsletter.campaigns.create')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FaPlus size={14} />
              New campaign
            </Link>
          </div>

          {/* ---------- SUMMARY ---------- */}
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            <SummaryCard
              label="Campaigns"
              value={summary.campaigns ?? 0}
              sub={`${summary.drafts ?? 0} drafts`}
              icon={FaChartLine}
              tone="blue"
            />
            <SummaryCard
              label="Emails sent"
              value={summary.sent ?? 0}
              sub={`${summary.attempted ?? 0} attempted`}
              icon={FaPaperPlane}
              tone="green"
            />
            <SummaryCard
              label="Failed"
              value={summary.failed ?? 0}
              sub={`${summary.bounced ?? 0} bounced`}
              icon={FaTimesCircle}
              tone="red"
            />
            <SummaryCard
              label="Success rate"
              value={`${summary.success_rate ?? 0}%`}
              sub={`${summary.failure_rate ?? 0}% failed`}
              icon={FaCheckCircle}
              tone={(summary.success_rate ?? 0) >= 95 ? 'green' : 'red'}
            />
            <SummaryCard
              label="Active subscribers"
              value={summary.active_subscribers ?? 0}
              sub={`${summary.in_flight ?? 0} sending now`}
              icon={FaChartLine}
              tone="purple"
            />
          </div>

          {/* ---------- FILTERS ---------- */}
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <form onSubmit={handleSearch} className="min-w-0 flex-1">
                <div className="relative">
                  <FaSearch
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={13}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by subject or preview text…"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'draft', label: 'Drafts' },
                  { value: 'processing', label: 'Sending' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'failed', label: 'Failed' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleStatus(option.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      status === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* ---------- TABLE ---------- */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:text-xs">
                      Campaign
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:text-xs">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:text-xs">
                      Delivery
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:text-xs">
                      Result
                    </th>
                    <th className="hidden px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:text-xs md:table-cell">
                      Sent
                    </th>
                    <th className="px-3 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-14 text-center">
                        <FaPaperPlane className="mx-auto mb-3 text-gray-300" size={32} />
                        <p className="text-sm font-medium text-gray-600">No campaigns yet</p>
                        <p className="mt-1 text-xs text-gray-400">
                          Create your first newsletter to start reaching subscribers.
                        </p>
                        <Link
                          href={route('backend.newsletter.campaigns.create')}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          <FaPlus size={12} />
                          New campaign
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    rows.map((campaign) => {
                      const sent = campaign.sent_count ?? 0;
                      const failed = campaign.failed_count ?? 0;
                      const bounced = campaign.bounced_count ?? 0;
                      const total = campaign.total_subscribers ?? 0;
                      const attempted = sent + failed + bounced;
                      const successRate = campaign.success_rate ?? 0;
                      const hasFailures = failed + bounced > 0;

                      return (
                        <tr key={campaign.id} className="transition hover:bg-gray-50">
                          <td className="px-3 py-3 sm:px-4">
                            <Link
                              href={route('backend.newsletter.campaigns.show', campaign.id)}
                              className="block max-w-xs truncate text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {campaign.subject}
                            </Link>

                            {campaign.preview_text && (
                              <p className="mt-0.5 max-w-xs truncate text-[11px] text-gray-400">
                                {campaign.preview_text}
                              </p>
                            )}

                            <p className="mt-1 text-[10px] text-gray-400">
                              {campaign.creator?.name ?? 'System'} ·{' '}
                              {new Date(campaign.created_at).toLocaleDateString()}
                            </p>
                          </td>

                          <td className="px-3 py-3 sm:px-4">
                            <StatusBadge status={campaign.status} />
                          </td>


                          <td className="px-3 py-3 sm:px-4">
                            <div className="min-w-[140px]">
                              <DeliveryBar
                                sent={sent}
                                failed={failed}
                                bounced={bounced}
                                total={total}
                              />

                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
                                <span className="text-green-600">
                                  <FaCheckCircle className="mr-0.5 inline" size={9} />
                                  {sent} sent
                                </span>
                                {failed > 0 && (
                                  <span className="text-red-600">
                                    <FaTimesCircle className="mr-0.5 inline" size={9} />
                                    {failed} failed
                                  </span>
                                )}
                                {bounced > 0 && (
                                  <span className="text-red-700">
                                    <FaExclamationCircle className="mr-0.5 inline" size={9} />
                                    {bounced} bounced
                                  </span>
                                )}
                                {attempted === 0 && <span className="text-gray-400">Not sent yet</span>}
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3 sm:px-4">
                            {attempted > 0 ? (
                              <div>
                                <p
                                  className={`text-sm font-bold ${
                                    successRate >= 95
                                      ? 'text-green-600'
                                      : successRate >= 80
                                        ? 'text-amber-600'
                                        : 'text-red-600'
                                  }`}
                                >
                                  {successRate}%
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {campaign.failure_rate ?? 0}% failed
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>

                          <td className="hidden px-3 py-3 text-xs text-gray-500 sm:px-4 md:table-cell">
                            {campaign.started_at ? (
                              <>
                                <p>{new Date(campaign.started_at).toLocaleDateString()}</p>
                                <p className="text-[10px] text-gray-400">
                                  {new Date(campaign.started_at).toLocaleTimeString()}
                                </p>
                              </>
                            ) : (
                              '—'
                            )}
                          </td>


                          <td className="px-3 py-3 sm:px-4">
                            <div className="flex items-center justify-end gap-0.5">
                              <Link
                                href={route('backend.newsletter.campaigns.show', campaign.id)}
                                title="Delivery report"
                                className="rounded p-1.5 text-blue-600 transition hover:bg-blue-50"
                              >
                                <FaEye size={13} />
                              </Link>

                              {campaign.status === 'draft' && (
                                <Link
                                  href={route('backend.newsletter.campaigns.edit', campaign.id)}
                                  title="Edit"
                                  className="rounded p-1.5 text-gray-600 transition hover:bg-gray-100"
                                >
                                  <FaEdit size={13} />
                                </Link>
                              )}

                              {hasFailures && campaign.status !== 'processing' && (
                                <button
                                  type="button"
                                  onClick={() => handleRetry(campaign)}
                                  title="Retry failed"
                                  className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50"
                                >
                                  <FaRedo size={13} />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDuplicate(campaign)}
                                title="Duplicate"
                                className="rounded p-1.5 text-gray-600 transition hover:bg-gray-100"
                              >
                                <FaCopy size={13} />
                              </button>

                              <a
                                href={route('backend.newsletter.campaigns.export-html', campaign.id)}
                                title="Download stored HTML"
                                className="rounded p-1.5 text-gray-600 transition hover:bg-gray-100"
                              >
                                <FaFileAlt size={13} />
                              </a>

                              {campaign.status !== 'processing' && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(campaign)}
                                  title="Delete"
                                  className="rounded p-1.5 text-red-600 transition hover:bg-red-50"
                                >
                                  <FaTrash size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              meta={{
                from: campaigns?.from,
                to: campaigns?.to,
                total: campaigns?.total,
                links: campaigns?.links,
                last_page: campaigns?.last_page,
              }}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default CampaignIndex;

