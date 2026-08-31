// resources/js/pages/Backend/JobListings/Applications.jsx

// React
import { useState, useEffect } from 'react';

// Inertia
import { Head, Link, router } from '@inertiajs/react';

// SweetAlert
import Swal from 'sweetalert2';

// Auth
import { useAuth } from '../../../hooks/useAuth';
import { Can } from '../../../components/Auth/Can';

// Icons
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaStar,
  FaSpinner,
  FaFilePdf,
  FaDownload,
  FaTrash,
  FaCheckDouble,
  FaFilter,
  FaSearch,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaShieldAlt,
} from 'react-icons/fa';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Email Modal Component
function EmailModal({ isOpen, onClose, applications, onSend, isBulk = false, canSendEmails = true }) {

  // States
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  // Effects
  useEffect(() => {
    if (isOpen && applications && canSendEmails) {
      setLoading(true);
      if (isBulk) {
        // Fetch bulk email template
        fetch(route('backend.applications.bulk-email-modal'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
          },
          body: JSON.stringify({
            application_ids: applications
          })
        })
          .then(res => res.json())
          .then(data => {
            setSubject(data.default_subject || '');
            setMessage(data.default_message || '');
            setLoading(false);
          })
          .catch(() => {
            setLoading(false);
            setError('Failed to load email template');
          });
      } else {
        // Fetch single email template
        fetch(route('backend.applications.email-modal', applications), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
          }
        })
          .then(res => res.json())
          .then(data => {
            setSubject(data.default_subject || '');
            setMessage(data.default_message || '');
            setLoading(false);
          })
          .catch(() => {
            setLoading(false);
            setError('Failed to load email template');
          });
      }
    }
  }, [isOpen, applications, isBulk, canSendEmails]);

  // Send Email Handler
  const handleSend = () => {
    if (!canSendEmails) {
      setError('You do not have permission to send emails');
      return;
    }

    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    setSending(true);
    setError(null);

    const endpoint = isBulk
      ? route('backend.applications.bulk-send-emails')
      : route('backend.applications.send-email', applications);

    const data = isBulk
      ? { application_ids: applications, subject, message }
      : { subject, message };

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
      },
      body: JSON.stringify(data)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to send email');
        return res.json();
      })
      .then((responseData) => {
        setSending(false);
        onSend(true, responseData);
        onClose();
      })
      .catch(err => {
        setSending(false);
        setError(err?.message || 'Failed to send email');
      });
  };

  // Render
  if (!isOpen) return null;

  // Get recipient text
  const recipientText = isBulk
    ? `${applications?.length || 0} candidates`
    : applications?.name;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Send Email to {recipientText}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              The candidate will be notified about being shortlisted
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!canSendEmails && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              You do not have permission to send emails.
            </div>
          )}

          {loading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-2">
              <FaSpinner className="animate-spin" size={16} />
              Loading template...
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!loading && canSendEmails && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Write your message here... You can use line breaks for better formatting"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Use line breaks to organize your message. HTML formatting is supported.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          {canSendEmails && (
            <button
              onClick={handleSend}
              disabled={sending || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {sending && <FaSpinner className="animate-spin" size={16} />}
              <FaEnvelope size={14} />
              Send Email
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Applications({ jobListing, applications, filters: initialFilters }) {
  // Use centralized auth hook
  const {
    user: currentUser,
    hasAnyPermission,
    hasRole,
  } = useAuth();

  // Check permissions
  const canSendEmails = hasAnyPermission(['applications.email', 'applications.manage']);
  const canViewApplications = hasAnyPermission(['applications.view', 'applications.manage']);
  const canDownloadResumes = hasAnyPermission(['applications.download', 'applications.manage']);
  const canUpdateApplications = hasAnyPermission(['applications.update', 'applications.manage']);
  const canDeleteApplications = hasAnyPermission(['applications.destroy', 'applications.manage']);

  // Check if user is employer or admin
  const isEmployer = hasRole('employer') || hasRole('employer-admin');
  const isHRManager = hasRole('hr-manager');
  
  // Check if user owns this job listing
  const isJobOwner = (isEmployer || isHRManager) && currentUser?.employer_id === jobListing?.employer_id;

  // State
  const [showFilters, setShowFilters] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalType, setEmailModalType] = useState('single');
  const [selectedForEmail, setSelectedForEmail] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    search: initialFilters?.search || '',
    status: initialFilters?.status || 'all',
    minScore: initialFilters?.min_score || '',
  });

  // If user doesn't have permission to view applications, show access denied
  if (!canViewApplications) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to view applications.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statuses = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock, label: 'Pending' },
      reviewed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaEye, label: 'Reviewed' },
      shortlisted: { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheckCircle, label: 'Shortlisted' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: FaTimesCircle, label: 'Rejected' },
      hired: { bg: 'bg-purple-100', text: 'text-purple-800', icon: FaStar, label: 'Hired' }
    };
    const s = statuses[status] || statuses.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        <Icon size={10} />
        {s.label}
      </span>
    );
  };

  // Get ATS score Color
  const getATSScoreColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get ATS score
  const getATSScore = (application) => {
    if (application.ats_score) {
      if (typeof application.ats_score === 'object') {
        return application.ats_score.percentage || application.ats_score.total || null;
      }
      if (typeof application.ats_score === 'number') {
        return application.ats_score;
      }
    }
    return null;
  };

  // Select all applications
  const handleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id));
    }
  };

  // Select single application
  const handleSelectApplication = (id) => {
    setSelectedApplications(prev =>
      prev.includes(id)
        ? prev.filter(appId => appId !== id)
        : [...prev, id]
    );
  };

  // Bulk Status Update Handler
  const handleBulkStatusUpdate = (newStatus) => {
    if (!canUpdateApplications) {
      Swal.fire('Permission Denied', 'You do not have permission to update application statuses.', 'error');
      return;
    }

    if (selectedApplications.length === 0) {
      Swal.fire('No Selection', 'Please select at least one application.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Update Status',
      text: `Are you sure you want to change ${selectedApplications.length} application(s) status to ${newStatus}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.applications.batch-status'), {
          application_ids: selectedApplications,
          status: newStatus
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: `${selectedApplications.length} application(s) status updated to ${newStatus}.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedApplications([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: error?.message || 'Failed to update statuses.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk Delete Handler
  const handleBulkDelete = () => {
    if (!canDeleteApplications) {
      Swal.fire('Permission Denied', 'You do not have permission to delete applications.', 'error');
      return;
    }

    if (selectedApplications.length === 0) {
      Swal.fire('No Selection', 'Please select at least one application.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Delete Applications',
      text: `Are you sure you want to delete ${selectedApplications.length} application(s)? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsBulkProcessing(true);

        router.post(route('backend.applications.batch-delete'), {
          application_ids: selectedApplications
        }, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: `${selectedApplications.length} application(s) have been deleted.`,
              timer: 1500,
              showConfirmButton: false
            });
            setSelectedApplications([]);
            setIsBulkProcessing(false);
            router.reload();
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: error?.message || 'Failed to delete applications.',
            });
            setIsBulkProcessing(false);
          }
        });
      }
    });
  };

  // Bulk Download Handler
  const handleBulkDownload = () => {
    if (!canDownloadResumes) {
      Swal.fire('Permission Denied', 'You do not have permission to download resumes.', 'error');
      return;
    }

    if (selectedApplications.length === 0) {
      Swal.fire('No Selection', 'Please select at least one application.', 'warning');
      return;
    }

    setIsBulkProcessing(true);

    router.post(route('backend.applications.batch-download'), {
      application_ids: selectedApplications
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBulkProcessing(false);
      },
      onError: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: error?.message || 'Failed to download resumes.',
        });
        setIsBulkProcessing(false);
      }
    });
  };

  // Open Email Modal Handler
  const handleOpenEmailModal = (applicationId = null, isBulk = false) => {
    if (!canSendEmails) {
      Swal.fire('Permission Denied', 'You do not have permission to send emails.', 'error');
      return;
    }

    if (isBulk && selectedApplications.length === 0) {
      Swal.fire('No Selection', 'Please select at least one application to email.', 'warning');
      return;
    }

    setEmailModalType(isBulk ? 'bulk' : 'single');
    setSelectedForEmail(isBulk ? selectedApplications : applicationId);
    setEmailModalOpen(true);
  };

  // Single Status Update Handler
  const handleSingleStatusUpdate = (applicationId, newStatus) => {
    if (!canUpdateApplications) {
      Swal.fire('Permission Denied', 'You do not have permission to update application status.', 'error');
      return;
    }

    // If status is being changed to shortlisted, open email modal first
    if (newStatus === 'shortlisted') {
      Swal.fire({
        title: 'Send Email?',
        text: 'Do you want to send an email to inform the candidate about being shortlisted?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, send email',
        cancelButtonText: 'Update status only'
      }).then((result) => {
        if (result.isConfirmed) {
          // Open email modal, status will be updated after email is sent
          handleOpenEmailModal(applicationId, false);
        } else {
          // Just update status without email
          performStatusUpdate(applicationId, newStatus);
        }
      });
    } else {
      performStatusUpdate(applicationId, newStatus);
    }
  };

  // Status Update Handler
  const performStatusUpdate = (applicationId, newStatus) => {
    setUpdatingStatus(applicationId);

    router.patch(route('backend.applications.update-status', applicationId), {
      status: newStatus
    }, {
      preserveScroll: true,
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: `Status changed to ${newStatus}.`,
          timer: 1500,
          showConfirmButton: false
        });
        setUpdatingStatus(null);
        router.reload();
      },
      onError: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to update status.',
        });
        setUpdatingStatus(null);
      }
    });
  };

  // Delete Single Handler
  const handleDeleteSingle = (applicationId, applicantName) => {
    if (!canDeleteApplications) {
      Swal.fire('Permission Denied', 'You do not have permission to delete applications.', 'error');
      return;
    }

    Swal.fire({
      title: 'Delete Application?',
      text: `Are you sure you want to delete ${applicantName}'s application?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('backend.applications.destroy', applicationId), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Application deleted successfully.',
              timer: 1500,
              showConfirmButton: false
            });
            router.reload();
          },
          onError: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to delete application.',
            });
          }
        });
      }
    });
  };

  // Download Resume Handler
  const handleDownloadResume = (applicationId) => {
    if (!canDownloadResumes) {
      Swal.fire('Permission Denied', 'You do not have permission to download resumes.', 'error');
      return;
    }
    window.open(route('backend.applications.download-resume', applicationId), '_blank');
  };

  // Apply Filters
  const applyFilters = () => {
    router.get(route('backend.listing.applications', jobListing.id), {
      search: filters.search,
      status: filters.status === 'all' ? '' : filters.status,
      min_score: filters.minScore,
    }, {
      preserveState: true,
      preserveScroll: true
    });
  };

  // Reset Filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      minScore: '',
    });
    router.get(route('backend.listing.applications', jobListing.id), {}, {
      preserveState: true,
      preserveScroll: true
    });
  };

  // Filter applications based on search and status
  const filteredApplications = applications.filter(app => {
    let matches = true;

    if (filters.search && !app.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !app.email.toLowerCase().includes(filters.search.toLowerCase())) {
      matches = false;
    }

    if (filters.status !== 'all' && app.status !== filters.status) {
      matches = false;
    }

    if (filters.minScore) {
      const score = getATSScore(app);
      if (!score || score < parseInt(filters.minScore)) {
        matches = false;
      }
    }

    return matches;
  });

  // Calculate stats
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    hired: applications.filter(a => a.status === 'hired').length,
    averageScore: applications.reduce((acc, app) => {
      const score = getATSScore(app);
      return acc + (score || 0);
    }, 0) / applications.filter(a => getATSScore(a)).length || 0,
  };

  // Bulk Actions
  const canBulkUpdate = canUpdateApplications && selectedApplications.length > 0;
  const canBulkDownload = canDownloadResumes && selectedApplications.length > 0;
  const canBulkDeleteApplications = canDeleteApplications && selectedApplications.length > 0;

  return (
    <AuthenticatedLayout>
      <Head title={`Applications - ${jobListing.title}`} />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={route('backend.listing.index')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <FaArrowLeft className="mr-2" size={16} />
              Back to Job Listings
            </Link>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{jobListing.title}</h1>
                <p className="text-gray-600 mt-1">Manage applications for this position</p>
                {isJobOwner && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Your Job Posting
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <FaFilter size={14} />
                  Filters
                  {showFilters ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-gray-500">Reviewed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-gray-500">Shortlisted</p>
              <p className="text-2xl font-bold text-green-600">{stats.shortlisted}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-gray-500">Hired</p>
              <p className="text-2xl font-bold text-purple-600">{stats.hired}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <p className="text-xs text-gray-500">Avg. Score</p>
              <p className="text-2xl font-bold text-indigo-600">{Math.round(stats.averageScore)}%</p>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filter Applications</h3>
                <button onClick={resetFilters} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
                  <FaTimes size={12} /> Reset all
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min ATS Score</label>
                  <select
                    value={filters.minScore}
                    onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Score</option>
                    <option value="80">80%+ (Excellent)</option>
                    <option value="60">60%+ (Good)</option>
                    <option value="40">40%+ (Fair)</option>
                    <option value="0">Below 40%</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={applyFilters} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Bulk Actions Bar */}
          {selectedApplications.length > 0 && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 mb-6 border border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <FaCheckDouble className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-900">
                    {selectedApplications.length} application(s) selected
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {canBulkUpdate && (
                    <select
                      onChange={(e) => {
                        if (e.target.value === 'shortlisted') {
                          handleOpenEmailModal(null, true);
                        } else {
                          handleBulkStatusUpdate(e.target.value);
                        }
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      disabled={isBulkProcessing}
                    >
                      <option value="" disabled>Update Status</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  )}
                  {canBulkDownload && (
                    <button
                      onClick={handleBulkDownload}
                      disabled={isBulkProcessing}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                      <FaDownload size={14} />
                      Download Resumes
                    </button>
                  )}
                  {canBulkDeleteApplications && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={isBulkProcessing}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                      <FaTrash size={14} />
                      Delete All
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedApplications([])}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 text-sm"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Applications Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                        onChange={handleSelectAll}
                        disabled={!canUpdateApplications}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ATS Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <FaUser className="text-4xl text-gray-300 mb-3" />
                          <p>No applications found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((application) => {
                      const atsScore = getATSScore(application);
                      const isProcessing = application.ats_calculation_status === 'processing';

                      return (
                        <tr key={application.id} className={`hover:bg-gray-50 transition-colors ${selectedApplications.includes(application.id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedApplications.includes(application.id)}
                              onChange={() => handleSelectApplication(application.id)}
                              disabled={!canUpdateApplications}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <FaUser className="text-gray-500" size={16} />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {application.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: #{application.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-center gap-2">
                              <FaEnvelope className="text-gray-400" size={12} />
                              {application.email}
                            </div>
                            {application.phone && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                <FaPhone className="text-gray-400" size={12} />
                                {application.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{formatDate(application.created_at)}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(application.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isProcessing ? (
                              <div className="flex items-center gap-2">
                                <FaSpinner className="animate-spin text-gray-400" size={14} />
                                <span className="text-xs text-gray-500">Calculating...</span>
                              </div>
                            ) : atsScore ? (
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${getATSScoreColor(atsScore)}`}>
                                  {Math.round(atsScore)}%
                                </span>
                                <div className="w-20">
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${atsScore >= 80 ? 'bg-green-500' :
                                        atsScore >= 60 ? 'bg-blue-500' :
                                          atsScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                      style={{ width: `${atsScore}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Not available</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {canUpdateApplications ? (
                              <select
                                value={application.status}
                                onChange={(e) => handleSingleStatusUpdate(application.id, e.target.value)}
                                disabled={updatingStatus === application.id}
                                className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                                <option value="hired">Hired</option>
                              </select>
                            ) : (
                              getStatusBadge(application.status)
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Can permission="applications.view" fallback={null}>
                                <Link
                                  href={route('backend.applications.show', application.id)}
                                  className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="View Details"
                                >
                                  <FaEye size={16} />
                                </Link>
                              </Can>
                              {canDownloadResumes && (
                                <button
                                  onClick={() => handleDownloadResume(application.id)}
                                  className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                                  title="Download Resume"
                                >
                                  <FaFilePdf size={16} />
                                </button>
                              )}
                              {canSendEmails && (
                                <button
                                  onClick={() => handleOpenEmailModal(application.id, false)}
                                  className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Send Email"
                                >
                                  <FaEnvelope size={16} />
                                </button>
                              )}
                              {canDeleteApplications && (
                                <button
                                  onClick={() => handleDeleteSingle(application.id, application.name)}
                                  className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Delete"
                                >
                                  <FaTrash size={16} />
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
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false);
          setSelectedForEmail(null);
        }}
        applications={selectedForEmail}
        isBulk={emailModalType === 'bulk'}
        canSendEmails={canSendEmails}
        onSend={(success) => {
          if (success) {
            Swal.fire({
              icon: 'success',
              title: 'Email Sent!',
              text: 'The email has been sent successfully.',
              timer: 2000,
              showConfirmButton: false
            });
            // Refresh the page to update statuses
            setTimeout(() => router.reload(), 1500);
          }
        }}
      />
    </AuthenticatedLayout>
  );
}