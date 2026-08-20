// resources/js/Pages/Backend/Notifications/Index.jsx

// React
import { useState } from 'react';

// Inertia
import { Head, Link, router } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Sweetalert
import Swal from 'sweetalert2';

// Auth
import { useAuth } from '@/hooks/useAuth';

// Icons
import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiInbox,
  FiAlertCircle,
} from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';

export default function Index({ notifications }) {
  // Use centralized auth hook
  const {
    isAuthenticated,
  } = useAuth();

  // Check if user is authenticated to view notifications
  const canViewNotifications = isAuthenticated;

  // Get notifications
  const items = notifications?.data || [];

  // Get pagination
  const pagination = notifications && {
    currentPage: notifications.current_page,
    lastPage: notifications.last_page,
    perPage: notifications.per_page,
    total: notifications.total,
    from: notifications.from,
    to: notifications.to,
  };

  // State
  const [loading, setLoading] = useState(false);
  const [isMarking, setIsMarking] = useState({});
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(notifications?.current_page || 1);

  // If user is not authenticated, show access denied
  if (!canViewNotifications) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">Please login to view your notifications.</p>
            <Link
              href={route('login')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Login Now
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Handle mark all as read
  const handleMarkAllRead = () => {
    if (items.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Notifications',
        text: 'You have no notifications to mark as read.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    Swal.fire({
      title: 'Mark all as read?',
      text: 'This will mark all your unread notifications as read.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, mark all',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsMarkingAll(true);
        router.post(route('backend.notifications.read-all'), {}, {
          preserveScroll: true,
          onSuccess: () => {
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: 'All notifications marked as read.',
              timer: 1500,
              showConfirmButton: false,
            });
            router.reload({ preserveScroll: true });
          },
          onError: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: error?.message || 'Failed to mark notifications as read.',
              confirmButtonColor: '#d33',
            });
          },
          onFinish: () => setIsMarkingAll(false),
        });
      }
    });
  };

  // Handle mark as read
  const handleMarkRead = (id) => {
    setIsMarking(prev => ({ ...prev, [id]: true }));
    router.post(route('backend.notifications.read', id), {}, {
      preserveScroll: true,
      onSuccess: () => {
        router.reload({ preserveScroll: true });
      },
      onError: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: error?.message || 'Failed to mark notification as read.',
          confirmButtonColor: '#d33',
        });
      },
      onFinish: () => {
        setIsMarking(prev => ({ ...prev, [id]: false }));
      },
    });
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page === currentPage) return;
    if (page < 1 || page > pagination?.lastPage) return;

    setLoading(true);
    router.get(route('backend.notifications.index'), { page }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onSuccess: () => {
        setCurrentPage(page);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: () => setLoading(false),
    });
  };

  // Get unread count
  const getUnreadCount = () => {
    return items.filter(n => !n.read_at).length;
  };

  // Pagination
  const Pagination = () => {
    if (!pagination || pagination.lastPage <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(pagination.lastPage, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{pagination.from || 0}</span> to{' '}
          <span className="font-medium">{pagination.to || 0}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> notifications
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${currentPage === 1 || loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            Previous
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
            >
              {page}
            </button>
          ))}

          {endPage < pagination.lastPage && (
            <>
              {endPage < pagination.lastPage - 1 && <span className="px-2 text-gray-400">...</span>}
              <button
                onClick={() => handlePageChange(pagination.lastPage)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition"
              >
                {pagination.lastPage}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.lastPage || loading}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${currentPage === pagination.lastPage || loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Get unread count
  const unreadCount = getUnreadCount();

  return (
    <AuthenticatedLayout>
      <Head title="Notifications" />

      <div className=" mx-auto p-4 md:p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-medium">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Track updates on your job applications in one place.
              </p>
            </div>

            {items.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isMarkingAll ? (
                  <FaSpinner className="animate-spin w-4 h-4" />
                ) : (
                  <FiCheckCircle className="w-4 h-4" />
                )}
                Mark all as read
              </button>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="p-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <FiInbox className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">No notifications yet</h2>
              <p className="text-sm text-gray-500 mt-2">
                When an employer updates your application status, it will appear here.
              </p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="divide-y divide-gray-100">
              {items.map((notification) => {
                const data = notification.data || {};
                const isUnread = !notification.read_at;
                const isMarkingThis = isMarking[notification.id];

                return (
                  <div
                    key={notification.id}
                    className={`p-5 md:p-6 transition-colors ${isUnread ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'bg-white hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-4">
                        <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isUnread ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                          <FiBell className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-semibold text-gray-900">
                              {data.title || 'Application update'}
                            </h2>
                            {isUnread && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-medium">
                                New
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mt-1">
                            {data.message || 'There is an update on your application.'}
                          </p>

                          {data.notes && (
                            <div className="mt-3 p-3 rounded-lg bg-white border border-blue-100 text-sm text-gray-700">
                              {data.notes}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <FiClock className="w-4 h-4" />
                              <span>{new Date(notification.created_at).toLocaleString()}</span>
                            </div>
                            {data.job_title && (
                              <div className="flex items-center gap-1">
                                <span>•</span>
                                <span>{data.job_title}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-14 md:ml-0">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            disabled={isMarkingThis}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            {isMarkingThis ? (
                              <FaSpinner className="animate-spin w-4 h-4" />
                            ) : (
                              'Mark read'
                            )}
                          </button>
                        )}

                        {data.route_name && (
                          <Link
                            href={route(data.route_name, data.route_params || {})}
                            className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors"
                          >
                            View details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Pagination />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}