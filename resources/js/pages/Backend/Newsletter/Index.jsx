// resources/js/Pages/Backend/Newsletter/Index.jsx

import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import {
  FaEnvelope,
  FaSearch,
  FaTrash,
  FaDownload,
  FaPaperPlane,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaUserPlus,
  FaUsers,
  FaExclamationTriangle,
  FaFilter,
  FaSortUp,
  FaSortDown,
  FaEye,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Campaigns Table Component
const CampaignsTable = ({ campaigns }) => {
  const { data, from, to, total, links } = campaigns;

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const getProgress = (campaign) => {
    if (campaign.total_subscribers === 0) return 0;
    return Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_subscribers) * 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent / Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No campaigns yet.
                </td>
              </tr>
            ) : (
              data.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{campaign.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                      {campaign.status === 'processing' && <FaSpinner className="animate-spin" size={12} />}
                      {campaign.status === 'completed' && <FaCheckCircle size={12} />}
                      {campaign.status === 'failed' && <FaTimesCircle size={12} />}
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${getProgress(campaign)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{getProgress(campaign)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {campaign.sent_count} / {campaign.total_subscribers}
                    {campaign.failed_count > 0 && (
                      <span className="text-red-500 ml-1">({campaign.failed_count} failed)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        Swal.fire({
                          title: campaign.subject || 'Campaign Details',
                          html: `
                            <div style="text-align:left">
                              <p><strong>Status:</strong> ${campaign.status || 'unknown'}</p>
                              <p><strong>Sent:</strong> ${campaign.sent_count ?? 0}</p>
                              <p><strong>Failed:</strong> ${campaign.failed_count ?? 0}</p>
                              <p><strong>Total:</strong> ${campaign.total_subscribers ?? 0}</p>
                            </div>
                          `,
                          confirmButtonColor: '#3b82f6',
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
                    >
                      <FaEye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {links && links.length > 3 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {from || 0} to {to || 0} of {total || 0} results
          </p>
          <div className="flex items-center gap-1">
            {links.map((link, index) => (
              <button
                key={index}
                onClick={() => {
                  if (link.url && !link.active) {
                    router.get(link.url, {}, { preserveState: true });
                  }
                }}
                dangerouslySetInnerHTML={{ __html: link.label }}
                className={`px-3 py-1 rounded text-sm ${link.active
                  ? 'bg-blue-600 text-white'
                  : link.url
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                  }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function NewsletterIndex({ subscribers, stats, filters, campaigns: initialCampaigns = { data: [] } }) {
  const { flash } = usePage().props;

  // States
  const [selectAll, setSelectAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sortDirection, setSortDirection] = useState('desc');
  const [sortField, setSortField] = useState('subscribed_at');
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [activeTab, setActiveTab] = useState('subscribers');
  const campaigns = initialCampaigns || { data: [] };

  // Stats cards
  const statCards = [
    {
      key: 'total',
      label: 'Total Subscribers',
      value: stats.total,
      icon: <FaUsers className="text-blue-500" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      key: 'subscribed',
      label: 'Active',
      value: stats.subscribed,
      icon: <FaCheckCircle className="text-green-500" />,
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      key: 'unsubscribed',
      label: 'Unsubscribed',
      value: stats.unsubscribed,
      icon: <FaTimesCircle className="text-red-500" />,
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    {
      key: 'today',
      label: 'New Today',
      value: stats.today,
      icon: <FaUserPlus className="text-purple-500" />,
      bg: 'bg-purple-50',
      border: 'border-purple-200',
    },
  ];

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedIds(subscribers.data.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  }, [selectAll, subscribers.data]);

  useEffect(() => {
    if (flash?.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: flash.success,
        timer: 3000,
        showConfirmButton: false,
      });
    }
    if (flash?.error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: flash.error,
        confirmButtonColor: '#3b82f6',
      });
    }
  }, [flash]);

  // Handle individual select
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    router.get(
      route('backend.newsletter.index'),
      { search: searchTerm, status: statusFilter },
      { preserveState: true }
    );
  };

  // Handle filter change
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    router.get(
      route('backend.newsletter.index'),
      { search: searchTerm, status },
      { preserveState: true }
    );
  };

  // Handle sort
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);
    router.get(
      route('backend.newsletter.index'),
      {
        search: searchTerm,
        status: statusFilter,
        sort: field,
        direction: newDirection
      },
      { preserveState: true }
    );
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Subscribers Selected',
        text: 'Please select at least one subscriber to delete.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Subscribers?',
      text: `Are you sure you want to delete ${selectedIds.length} subscriber(s)? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete them',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        router.post(
          route('backend.newsletter.bulk-delete'),
          { ids: selectedIds },
          {
            preserveScroll: true,
            onSuccess: () => {
              setSelectedIds([]);
              setSelectAll(false);
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: `${selectedIds.length} subscriber(s) deleted successfully.`,
                timer: 2000,
                showConfirmButton: false,
              });
            },
            onError: (errors) => {
              Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: errors.message || 'Something went wrong.',
                confirmButtonColor: '#3b82f6',
              });
            },
          }
        );
      }
    });
  };

  // Handle bulk unsubscribe
  const handleBulkUnsubscribe = () => {
    if (selectedIds.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Subscribers Selected',
        text: 'Please select at least one subscriber to unsubscribe.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    Swal.fire({
      title: 'Unsubscribe Subscribers?',
      text: `Are you sure you want to unsubscribe ${selectedIds.length} subscriber(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, unsubscribe them',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        router.post(
          route('backend.newsletter.bulk-unsubscribe'),
          { ids: selectedIds },
          {
            preserveScroll: true,
            onSuccess: () => {
              setSelectedIds([]);
              setSelectAll(false);
              Swal.fire({
                icon: 'success',
                title: 'Unsubscribed!',
                text: `${selectedIds.length} subscriber(s) unsubscribed successfully.`,
                timer: 2000,
                showConfirmButton: false,
              });
            },
            onError: (errors) => {
              Swal.fire({
                icon: 'error',
                title: 'Operation Failed',
                text: errors.message || 'Something went wrong.',
                confirmButtonColor: '#3b82f6',
              });
            },
          }
        );
      }
    });
  };

  // Handle export
  const handleExport = () => {
    router.post(
      route('backend.newsletter.export'),
      { status: statusFilter },
      {
        preserveScroll: true,
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'Export Started',
            text: 'Your CSV file is being downloaded.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        onError: (errors) => {
          Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            text: errors.message || 'Something went wrong.',
            confirmButtonColor: '#3b82f6',
          });
        },
      }
    );
  };

  // Handle send bulk email
  const handleSendBulkEmail = () => {
    if (selectedIds.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Subscribers Selected',
        text: 'Please select at least one subscriber to send email to.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
    setShowSendEmailModal(true);
  };

  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in both subject and content.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setSendingEmail(true);
    router.post(
      route('backend.newsletter.send-bulk'),
      {
        ids: selectedIds,
        subject: emailSubject,
        content: emailContent,
      },
      {
        preserveScroll: true,
        onSuccess: (page) => {
          setSendingEmail(false);
          setShowSendEmailModal(false);
          setEmailSubject('');
          setEmailContent('');
          setSelectedIds([]);
          setSelectAll(false);
          // Switch to campaigns tab to show progress
          setActiveTab('campaigns');

          const message = page.props.flash?.success || 'Campaign started!';
          Swal.fire({
            icon: 'success',
            title: 'Campaign Started',
            text: message,
            timer: 3000,
            showConfirmButton: false,
          });
        },
        onError: (errors) => {
          setSendingEmail(false);
          const errorMessage = errors.message || 'Something went wrong.';
          Swal.fire({
            icon: 'error',
            title: 'Send Failed',
            text: errorMessage,
            confirmButtonColor: '#3b82f6',
          });
        },
      }
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      subscribed: 'bg-green-100 text-green-700',
      unsubscribed: 'bg-red-100 text-red-700',
      bounced: 'bg-yellow-100 text-yellow-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    if (status === 'subscribed') return <FaCheckCircle className="text-green-500" />;
    if (status === 'unsubscribed') return <FaTimesCircle className="text-red-500" />;
    return <FaExclamationTriangle className="text-yellow-500" />;
  };

  return (
    <AuthenticatedLayout>
      <Head title="Newsletter" />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
        <div className="mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Newsletter
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                Manage subscribers and track email campaigns.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={handleExport}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <FaDownload size={12} />
                Export CSV
              </button>
              <button
                onClick={handleSendBulkEmail}
                disabled={selectedIds.length === 0}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 text-xs sm:text-sm ${selectedIds.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                <FaPaperPlane size={12} />
                Send Email ({selectedIds.length})
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
            {statCards.map((stat) => (
              <div
                key={stat.key}
                className={`${stat.bg} border ${stat.border} rounded-xl p-3 sm:p-4 flex items-center justify-between`}
              >
                <div>
                  <p className="text-[10px] sm:text-sm text-gray-500">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="text-2xl sm:text-3xl">{stat.icon}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4 sm:mb-6">
            <button
              className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium ${activeTab === 'subscribers'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('subscribers')}
            >
              Subscribers
            </button>
            <button
              className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium ${activeTab === 'campaigns'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('campaigns')}
            >
              Campaigns
            </button>
          </div>

          {/* Subscribers Tab */}
          {activeTab === 'subscribers' && (
            <>
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <form onSubmit={handleSearch} className="flex-1 min-w-48 sm:min-w-56">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by email or name..."
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                      />
                    </div>
                  </form>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FaFilter className="text-gray-400" size={12} />
                    <select
                      value={statusFilter}
                      onChange={(e) => handleStatusFilter(e.target.value)}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="subscribed">Active</option>
                      <option value="unsubscribed">Unsubscribed</option>
                      <option value="bounced">Bounced</option>
                    </select>
                  </div>

                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm text-gray-500">
                        {selectedIds.length} selected
                      </span>
                      <button
                        onClick={handleBulkUnsubscribe}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-xs sm:text-sm"
                      >
                        Unsubscribe
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-2 sm:px-4 py-2.5 sm:py-3 w-8 sm:w-10">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={() => setSelectAll(!selectAll)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 sm:w-4 sm:h-4"
                          />
                        </th>
                        <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('email')}
                            className="flex items-center gap-0.5 sm:gap-1 hover:text-gray-700"
                          >
                            Email
                            {sortField === 'email' && (
                              sortDirection === 'desc' ? <FaSortDown size={10} /> : <FaSortUp size={10} />
                            )}
                          </button>
                        </th>
                        <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('status')}
                            className="flex items-center gap-0.5 sm:gap-1 hover:text-gray-700"
                          >
                            Status
                            {sortField === 'status' && (
                              sortDirection === 'desc' ? <FaSortDown size={10} /> : <FaSortUp size={10} />
                            )}
                          </button>
                        </th>
                        <th className="hidden sm:table-cell px-2 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('subscribed_at')}
                            className="flex items-center gap-0.5 sm:gap-1 hover:text-gray-700"
                          >
                            Subscribed
                            {sortField === 'subscribed_at' && (
                              sortDirection === 'desc' ? <FaSortDown size={10} /> : <FaSortUp size={10} />
                            )}
                          </button>
                        </th>
                        <th className="hidden md:table-cell px-2 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-2 sm:px-4 py-2.5 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {subscribers.data.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-sm">
                            No subscribers found.
                          </td>
                        </tr>
                      ) : (
                        subscribers.data.map((subscriber) => (
                          <tr key={subscriber.id} className="hover:bg-gray-50 transition">
                            <td className="px-2 sm:px-4 py-2.5 sm:py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(subscriber.id)}
                                onChange={() => toggleSelect(subscriber.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 sm:w-4 sm:h-4"
                              />
                            </td>
                            <td className="px-2 sm:px-4 py-2.5 sm:py-3">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <FaEnvelope className="text-gray-400" size={12} />
                                <span className="text-xs sm:text-sm text-gray-900 truncate max-w-28 sm:max-w-none">{subscriber.email}</span>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700">
                              {subscriber.name || '-'}
                            </td>
                            <td className="px-2 sm:px-4 py-2.5 sm:py-3">
                              <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusBadge(subscriber.status)}`}>
                                {getStatusIcon(subscriber.status)}
                                {subscriber.status.charAt(0).toUpperCase() + subscriber.status.slice(1)}
                              </span>
                            </td>
                            <td className="hidden sm:table-cell px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-500">
                              {subscriber.subscribed_at ? new Date(subscriber.subscribed_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="hidden md:table-cell px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-500">
                              {subscriber.source || 'website'}
                            </td>
                            <td className="px-2 sm:px-4 py-2.5 sm:py-3 text-right">
                              <div className="flex items-center justify-end gap-1 sm:gap-2">
                                {subscriber.status === 'subscribed' && (
                                  <button
                                    onClick={() => {
                                      Swal.fire({
                                        title: 'Unsubscribe?',
                                        text: `Unsubscribe ${subscriber.email}?`,
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#ef4444',
                                        cancelButtonColor: '#6b7280',
                                        confirmButtonText: 'Yes, unsubscribe',
                                      }).then((result) => {
                                        if (result.isConfirmed) {
                                          router.post(
                                            route('backend.newsletter.unsubscribe', subscriber.id),
                                            {},
                                            {
                                              preserveScroll: true,
                                              onSuccess: () => {
                                                Swal.fire({
                                                  icon: 'success',
                                                  title: 'Unsubscribed!',
                                                  timer: 1500,
                                                  showConfirmButton: false,
                                                });
                                              },
                                            }
                                          );
                                        }
                                      });
                                    }}
                                    className="p-1 sm:p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition"
                                    title="Unsubscribe"
                                  >
                                    <FaTimesCircle size={12} />
                                  </button>
                                )}
                                {subscriber.status === 'unsubscribed' && (
                                  <button
                                    onClick={() => {
                                      router.post(
                                        route('backend.newsletter.resubscribe', subscriber.id),
                                        {},
                                        {
                                          preserveScroll: true,
                                          onSuccess: () => {
                                            Swal.fire({
                                              icon: 'success',
                                              title: 'Resubscribed!',
                                              timer: 1500,
                                              showConfirmButton: false,
                                            });
                                          },
                                        }
                                      );
                                    }}
                                    className="p-1 sm:p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                                    title="Resubscribe"
                                  >
                                    <FaCheckCircle size={12} />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    Swal.fire({
                                      title: 'Delete Subscriber?',
                                      text: `Delete ${subscriber.email}? This cannot be undone.`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#ef4444',
                                      cancelButtonColor: '#6b7280',
                                      confirmButtonText: 'Delete',
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        router.delete(
                                          route('backend.newsletter.destroy', subscriber.id),
                                          {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                              Swal.fire({
                                                icon: 'success',
                                                title: 'Deleted!',
                                                timer: 1500,
                                                showConfirmButton: false,
                                              });
                                            },
                                          }
                                        );
                                      }
                                    });
                                  }}
                                  className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                  title="Delete"
                                >
                                  <FaTrash size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {subscribers.links && subscribers.links.length > 3 && (
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Showing {subscribers.from || 0} to {subscribers.to || 0} of {subscribers.total || 0} results
                    </p>
                    <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
                      {subscribers.links.map((link, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (link.url && !link.active) {
                              router.get(link.url, {}, { preserveState: true });
                            }
                          }}
                          dangerouslySetInnerHTML={{ __html: link.label }}
                          className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm ${link.active
                              ? 'bg-blue-600 text-white'
                              : link.url
                                ? 'text-gray-700 hover:bg-gray-100'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <CampaignsTable campaigns={campaigns} />
          )}
        </div>
      </div>

      {/* Send Email Modal */}
      {showSendEmailModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSendEmailModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Send Bulk Email</h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Sending to {selectedIds.length} subscriber(s)
                </p>
              </div>
              <button
                onClick={() => setShowSendEmailModal(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition self-end sm:self-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Enter email content..."
                  rows={8}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none font-mono text-xs sm:text-sm"
                />
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                  HTML is supported. You can use basic HTML tags.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-yellow-700">
                <strong>Note:</strong> This will start a background campaign. You can track progress in the campaigns tab on this page.
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowSendEmailModal(false)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailSubject.trim() || !emailContent.trim()}
                className={`w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm ${sendingEmail || !emailSubject.trim() || !emailContent.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                  }`}
              >
                {sendingEmail ? (
                  <>
                    <FaSpinner className="animate-spin" size={14} />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={14} />
                    Start Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
