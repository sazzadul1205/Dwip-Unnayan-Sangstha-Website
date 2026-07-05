/* eslint-disable no-undef */
// resources/js/Pages/Backend/Apply/Index.jsx

// React
import { useState, useEffect } from 'react';

// Inertia
import { Head, router, usePage, Link } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';

// Icons
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaEye,
  FaBriefcase,
  FaCalendarAlt,
  FaChartLine,
  FaBuilding,
  FaDollarSign,
  FaFilePdf,
  FaCheck,
  FaHourglassHalf,
  FaUserCheck,
  FaUserSlash,
  FaTrashRestore,
  FaChevronLeft,
  FaChevronRight,
  FaRegClock,
  FaFilter,
  FaShieldAlt,
} from 'react-icons/fa';

// SweetAlert2
import Swal from 'sweetalert2';

export default function ApplyIndex({ applications: initialApplications, stats: initialStats }) {
  const { flash } = usePage().props;

  // Use centralized auth hook - MUST be called before any conditional returns
  const {
    user: currentUser,
    isAuthenticated,
    hasRole,
    hasAnyPermission,
  } = useAuth();

  // Check user role and permissions - computed values, not hooks
  const isJobSeeker = hasRole('job-seeker') || hasRole('job_seeker');
  const canViewAllApplications = hasAnyPermission(['applications.view', 'applications.manage']);
  const isAdmin = canViewAllApplications;

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [restoringId, setRestoringId] = useState(null);
  const [showTrashed, setShowTrashed] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [recalculatingId, setRecalculatingId] = useState(null);
  const [applications, setApplications] = useState(initialApplications);

  // stats
  const [stats, setStats] = useState(initialStats || {
    total: 0, total_deleted: 0, pending: 0, shortlisted: 0, rejected: 0, hired: 0, average_ats_score: 0,
  });

  // Flash message effect - MUST be called before conditional returns
  useEffect(() => {
    if (flash?.success) {
      Swal.fire({ icon: 'success', title: 'Success!', text: flash.success, timer: 2000, showConfirmButton: false });
    }
    if (flash?.error) {
      Swal.fire({ icon: 'error', title: 'Error!', text: flash.error, confirmButtonColor: '#ef4444' });
    }
  }, [flash]);

  // NOW we can do conditional returns after all hooks
  // If user is not authenticated, show access denied
  if (!isAuthenticated) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Login Required</h2>
            <p className="text-gray-500 mt-2">Please login to view your applications.</p>
            <button
              onClick={() => router.visit(route('login'))}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Login Now
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // If user is employer (not job seeker), show message
  if (!isJobSeeker && !isAdmin) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBriefcase className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Employer Account</h2>
            <p className="text-gray-500 mt-2">
              Employer accounts cannot submit job applications. Please create a job seeker account to apply for jobs.
            </p>
            <button
              onClick={() => router.visit(route('backend.dashboard'))}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // pagination - computed after conditional returns
  const applicationItems = applications?.data || [];
  const pagination = applications?.data ? {
    currentPage: applications.current_page,
    lastPage: applications.last_page,
    total: applications.total,
    from: applications.from,
    to: applications.to,
  } : null;

  // Show trashed applications handler
  const toggleShowTrashed = () => {
    const newValue = !showTrashed;
    setShowTrashed(newValue);
    router.get(route('backend.apply.index'), { show_trashed: newValue ? 'true' : 'false' }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setStats(page.props.stats);
      },
    });
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page === pagination?.currentPage || page < 1 || page > pagination?.lastPage) return;
    router.get(route('backend.apply.index'), {
      page,
      show_trashed: showTrashed ? 'true' : 'false'
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: (page) => {
        setApplications(page.props.applications);
        setStats(page.props.stats);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  // Handle withdraw
  const handleWithdraw = (id) => {
    Swal.fire({
      title: 'Withdraw Application?',
      text: 'This will move your application to trash. You can restore it later.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, withdraw',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setWithdrawingId(id);
        router.delete(route('backend.apply.destroy', id), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({ icon: 'success', title: 'Withdrawn!', timer: 1500, showConfirmButton: false });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({ icon: 'error', title: 'Failed', text: errors?.message || 'Unable to withdraw.', confirmButtonColor: '#ef4444' });
          },
          onFinish: () => setWithdrawingId(null),
        });
      }
    });
  };

  // Handle restore
  const handleRestore = (id) => {
    Swal.fire({
      title: 'Restore Application?',
      text: 'This will restore your application from trash.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, restore',
    }).then((result) => {
      if (result.isConfirmed) {
        setRestoringId(id);
        router.post(route('backend.apply.restore', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({ icon: 'success', title: 'Restored!', timer: 1500, showConfirmButton: false });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({ icon: 'error', title: 'Failed', text: errors?.message || 'Unable to restore.' });
          },
          onFinish: () => setRestoringId(null),
        });
      }
    });
  };

  // Handle force delete
  const handleForceDelete = (id, jobTitle) => {
    Swal.fire({
      title: 'Permanently Delete?',
      html: `Are you sure you want to permanently delete application for <strong>${jobTitle}</strong>?<br><br>This action cannot be undone.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete permanently',
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('backend.apply.force-delete', id), {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({ icon: 'error', title: 'Failed', text: errors?.message || 'Unable to delete.' });
          },
        });
      }
    });
  };

  // Handle recalculate
  const handleRecalculateAts = (id) => {
    Swal.fire({
      title: 'Recalculate ATS Score?',
      text: 'This will re-analyze your CV against the job requirements.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, recalculate',
    }).then((result) => {
      if (result.isConfirmed) {
        setRecalculatingId(id);
        router.post(route('backend.apply.recalculate-ats', id), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({ icon: 'success', title: 'Recalculated!', timer: 1500, showConfirmButton: false });
            router.reload();
          },
          onError: (errors) => {
            Swal.fire({ icon: 'error', title: 'Failed', text: errors?.message || 'Unable to recalculate.' });
          },
          onFinish: () => setRecalculatingId(null),
        });
      }
    });
  };

  // format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-amber-100 text-amber-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-rose-100 text-rose-800',
      hired: 'bg-emerald-100 text-emerald-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status text
  const getStatusText = (status) => {
    const texts = { pending: 'Pending', shortlisted: 'Shortlisted', rejected: 'Rejected', hired: 'Hired' };
    return texts[status] || status;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaRegClock className="text-amber-500" size={14} />,
      shortlisted: <FaUserCheck className="text-blue-500" size={14} />,
      rejected: <FaUserSlash className="text-rose-500" size={14} />,
      hired: <FaCheck className="text-emerald-500" size={14} />
    };
    return icons[status] || <FaBriefcase className="text-gray-500" size={14} />;
  };

  // Get ATS score color
  const getAtsScoreColor = (score) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  // Get ATS score background
  const getAtsScoreBg = (score) => {
    if (!score) return 'bg-gray-100';
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-amber-100';
    return 'bg-rose-100';
  };

  // Format salary
  const formatSalary = (salary) => {
    if (!salary) return null;
    return `${new Intl.NumberFormat('en-US').format(salary)  } BDT`;
  };

  // Get stats cards
  const statsCards = [
    { title: 'Total', value: stats.total, icon: <FaBriefcase size={18} />, color: 'blue', key: 'total' },
    { title: 'Pending', value: stats.pending, icon: <FaHourglassHalf size={18} />, color: 'amber', key: 'pending' },
    { title: 'Shortlisted', value: stats.shortlisted, icon: <FaUserCheck size={18} />, color: 'indigo', key: 'shortlisted' },
    { title: 'Rejected', value: stats.rejected, icon: <FaUserSlash size={18} />, color: 'rose', key: 'rejected' },
    { title: 'Hired', value: stats.hired, icon: <FaCheck size={18} />, color: 'emerald', key: 'hired' },
    { title: 'Withdrawn', value: stats.total_deleted, icon: <FaTrash size={18} />, color: 'gray', key: 'withdrawn' },
    { title: 'Avg. ATS', value: stats.average_ats_score ? `${Math.round(stats.average_ats_score)}%` : 'N/A', icon: <FaChartLine size={18} />, color: 'purple', key: 'ats' },
  ];

  // Pagination component (moved inside the main component but after hooks)
  const Pagination = () => {
    if (!pagination || pagination.lastPage <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(pagination.lastPage, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-700">{pagination.from || 0}</span> to{' '}
          <span className="font-medium text-gray-700">{pagination.to || 0}</span> of{' '}
          <span className="font-medium text-gray-700">{pagination.total}</span> applications
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${pagination.currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            <FaChevronLeft size={12} /> Prev
          </button>
          {startPage > 1 && (
            <>
              <button onClick={() => handlePageChange(1)} className="px-3 py-1.5 rounded-lg text-sm bg-white text-gray-600 hover:bg-gray-100 border border-gray-300">1</button>
              {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
            </>
          )}
          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${page === pagination.currentPage
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
            >
              {page}
            </button>
          ))}
          {endPage < pagination.lastPage && (
            <>
              {endPage < pagination.lastPage - 1 && <span className="px-2 text-gray-400">...</span>}
              <button onClick={() => handlePageChange(pagination.lastPage)} className="px-3 py-1.5 rounded-lg text-sm bg-white text-gray-600 hover:bg-gray-100 border border-gray-300">
                {pagination.lastPage}
              </button>
            </>
          )}
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.lastPage}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${pagination.currentPage === pagination.lastPage
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            Next <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    );
  };

  // Admin can see all applications, job seekers only see their own
  const applicationsCount = applicationItems.length;

  return (
    <AuthenticatedLayout>
      <Head title={showTrashed ? "Withdrawn Applications" : "My Applications"} />

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100/50 p-4 md:p-6">
        <div className=" mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {showTrashed ? 'Withdrawn Applications' : 'My Applications'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {showTrashed ? 'View and manage your withdrawn applications' : 'Track and manage all your active job applications'}
              </p>
              {isAdmin && !showTrashed && (
                <p className="text-xs text-blue-600 mt-1">
                  👑 Admin view - Showing all applications
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleShowTrashed}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${showTrashed
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
              >
                <FaFilter size={12} />
                {showTrashed ? 'Show Active' : 'Show Withdrawn'}
              </button>
              {!showTrashed && (
                <Link
                  href={route('backend.public-jobs.index')}
                  className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm text-sm font-medium"
                >
                  <FaPlus size={12} />
                  Browse Jobs
                </Link>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
            {statsCards.map((card) => {
              const colorMap = {
                blue: 'from-blue-50 to-blue-100 text-blue-700',
                amber: 'from-amber-50 to-amber-100 text-amber-700',
                indigo: 'from-indigo-50 to-indigo-100 text-indigo-700',
                rose: 'from-rose-50 to-rose-100 text-rose-700',
                emerald: 'from-emerald-50 to-emerald-100 text-emerald-700',
                gray: 'from-gray-50 to-gray-100 text-gray-700',
                purple: 'from-purple-50 to-purple-100 text-purple-700',
              };
              return (
                <div
                  key={card.key}
                  className={`bg-linear-to-br ${colorMap[card.color]} rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
                  onClick={() => {
                    if (card.key === 'withdrawn') {
                      if (!showTrashed) toggleShowTrashed();
                    } else if (card.key !== 'ats' && showTrashed) {
                      if (showTrashed) toggleShowTrashed();
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="opacity-80">{card.icon}</div>
                    <span className="text-xl font-bold">{card.value}</span>
                  </div>
                  <p className="text-xs font-medium mt-1 opacity-75">{card.title}</p>
                </div>
              );
            })}
          </div>

          {/* Applications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {applicationsCount === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaBriefcase className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {showTrashed ? 'No withdrawn applications' : 'No applications yet'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {showTrashed ? 'Withdrawn applications will appear here.' : 'Start applying for jobs to see them here.'}
                </p>
                {!showTrashed && (
                  <Link
                    href={route('backend.public-jobs.index')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition mt-4"
                  >
                    <FaPlus size={12} /> Browse Jobs
                  </Link>
                )}
              </div>
            )}

            {applicationItems.map((app) => {
              const trashed = !!app.deleted_at;
              const isPending = !trashed && app.status === 'pending';
              const isProcessing = app.ats_calculation_status === 'processing';
              // For admin, check if this is the user's own application
              const isOwnApplication = currentUser?.id === app.user_id;

              return (
                <div
                  key={app.id}
                  className={`group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border ${trashed ? 'border-gray-200 opacity-75' : 'border-gray-100'
                    }`}
                >
                  <div className="p-4">
                    {/* Job Title */}
                    <Link
                      href={route('backend.apply.show', app.id)}
                      className={`font-semibold text-base hover:text-blue-600 transition line-clamp-1 ${trashed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}
                    >
                      {app.job_title}
                    </Link>

                    {/* Employer */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <FaBuilding size={10} />
                      {app.employer_name}
                    </div>

                    {/* Admin indicator for other user's applications */}
                    {isAdmin && !isOwnApplication && !trashed && (
                      <div className="mt-1">
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                          Applicant: {app.name}
                        </span>
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between mt-3">
                      {/* ATS Score */}
                      {!trashed && (
                        app.ats_score ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getAtsScoreBg(app.ats_score)} ${getAtsScoreColor(app.ats_score)}`}>
                            <FaChartLine size={10} />
                            {app.ats_score}%
                          </div>
                        ) : isProcessing ? (
                          <span className="text-xs text-blue-600 flex items-center gap-1">
                            <FaSpinner className="animate-spin" size={10} /> Calculating...
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">ATS pending</span>
                        )
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <FaCalendarAlt size={10} />
                        {formatDate(app.created_at)}
                      </div>
                    </div>

                    {/* Status & Salary */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5">
                        {!trashed ? (
                          <>
                            {getStatusIcon(app.status)}
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(app.status)}`}>
                              {getStatusText(app.status)}
                            </span>
                          </>
                        ) : (
                          <>
                            <FaTrash size={12} className="text-gray-400" />
                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Withdrawn</span>
                          </>
                        )}
                      </div>
                      {app.expected_salary && !trashed && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <FaDollarSign size={10} />
                          {formatSalary(app.expected_salary)}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex gap-1">
                        <Link
                          href={route('backend.apply.show', app.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <FaEye size={14} />
                        </Link>
                        {isPending && (
                          <Link
                            href={route('backend.apply.edit', app.id)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <FaEdit size={14} />
                          </Link>
                        )}
                        {isPending && (
                          <button
                            onClick={() => handleWithdraw(app.id)}
                            disabled={withdrawingId === app.id}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                            title="Withdraw"
                          >
                            {withdrawingId === app.id ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                          </button>
                        )}
                        {trashed && (
                          <>
                            <button
                              onClick={() => handleRestore(app.id)}
                              disabled={restoringId === app.id}
                              className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Restore"
                            >
                              {restoringId === app.id ? <FaSpinner className="animate-spin" size={14} /> : <FaTrashRestore size={14} />}
                            </button>
                            <button
                              onClick={() => handleForceDelete(app.id, app.job_title)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                              title="Permanent Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {app.resume_url && (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                            title="View Resume"
                          >
                            <FaFilePdf size={14} />
                          </a>
                        )}
                        {!trashed && !isProcessing && (
                          <button
                            onClick={() => handleRecalculateAts(app.id)}
                            disabled={recalculatingId === app.id}
                            className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition disabled:opacity-50"
                            title="Recalculate ATS"
                          >
                            {recalculatingId === app.id ? <FaSpinner className="animate-spin" size={14} /> : <FaChartLine size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.lastPage > 1 && (
            <div className="mt-6">
              <Pagination />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </AuthenticatedLayout>
  );
}