// resources/js/Pages/Dashboard.jsx

// React
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// Icons
import {
  FiBriefcase,
  FiFileText,
  FiUsers,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiStar,
  FiBarChart2,
  FiBell,
  FiActivity,
  FiSmile,
  FiTarget,
  FiThumbsUp,
  FiShield,
  FiMapPin,
  FiEye,
} from 'react-icons/fi';

import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

const Dashboard = () => {
  const { auth, dashboardData } = usePage().props;
  const user = auth?.user;

  console.log('Dashboard Props:', usePage().props);
  console.log('dashboardData:', dashboardData);
  console.log('role from dashboardData:', dashboardData?.role);
  console.log('job_seeker:', dashboardData?.job_seeker);
  console.log('admin_staff:', dashboardData?.admin_staff);

  // Extract dashboard data from props
  const { role, job_seeker, admin_staff } = dashboardData || {};

  const [greeting, setGreeting] = useState('');
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Trigger animation after mount
    setTimeout(() => setAnimateStats(true), 100);
  }, []);

  // Animated counter component
  const AnimatedCounter = ({ value, suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (animateStats) {
        let start = 0;
        const duration = 1000;
        const increment = value / (duration / 16);

        const timer = setInterval(() => {
          start += increment;
          if (start >= value) {
            setCount(value);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);

        return () => clearInterval(timer);
      }
    }, [value]);

    return <span>{count}{suffix}</span>;
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, color, suffix = '', delay = 0 }) => (
    <div className={`group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 animate-fade-in-up animation-delay-${delay}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {animateStats ? <AnimatedCounter value={value} suffix={suffix} /> : value}
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-linear-to-br ${color} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Activity Item Component
  const ActivityItem = ({ icon: Icon, title, time, color, status }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer group">
      <div className={`p-2 rounded-lg bg-linear-to-br ${color} shadow-md group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          {status && (
            <span className={`text-xs px-2 py-1 rounded-full ${status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
              {status === 'success' ? 'Completed' : status === 'warning' ? 'Pending' : 'New'}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );

  // Quick Action Button
  const QuickAction = ({ icon: Icon, label, color, onClick }) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
    >
      <div className={`p-3 rounded-lg bg-linear-to-br ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
    </button>
  );

  // Build Job Seeker Stats from real data
  const buildJobSeekerStats = () => {
    if (!job_seeker) return [];
    const s = job_seeker.summary;
    return [
      { title: 'Applications Sent', value: s.total_applications || 0, icon: FiFileText, color: 'from-blue-500 to-blue-600', suffix: '' },
      { title: 'Shortlisted', value: s.shortlisted_applications || 0, icon: FiStar, color: 'from-green-500 to-emerald-600', suffix: '' },
      { title: 'Interviews', value: s.interviews || 0, icon: FiClock, color: 'from-purple-500 to-purple-600', suffix: '' },
      { title: 'Profile Views', value: s.views_on_profile || 0, icon: FiEye, color: 'from-yellow-500 to-orange-600', suffix: '' }
    ];
  };

  // Build Admin/Staff Stats from real data
  const buildAdminStats = () => {
    if (!admin_staff) return [];
    const s = admin_staff.summary;
    return [
      { title: 'Total Users', value: s.total_users || 0, icon: FiUsers, color: 'from-blue-500 to-blue-600', suffix: '' },
      { title: 'Active Jobs', value: s.active_jobs || 0, icon: FiBriefcase, color: 'from-green-500 to-emerald-600', suffix: '' },
      { title: 'Total Applications', value: s.total_applications || 0, icon: FiFileText, color: 'from-purple-500 to-purple-600', suffix: '' },
      { title: 'Avg. ATS Score', value: s.average_ats || 0, icon: FiTrendingUp, color: 'from-yellow-500 to-orange-600', suffix: '%' }
    ];
  };

  // Get activities based on role
  const getActivities = () => {
    // Job Seeker - use recent notifications
    if (role === 'job_seeker' && job_seeker) {
      const notifications = job_seeker.recent_notifications || [];
      if (notifications.length > 0) {
        return notifications.slice(0, 4).map((n) => ({
          icon: n.read_at ? FiBell : FiCheckCircle,
          title: n.title || 'Application updated',
          time: n.created_at ? new Date(n.created_at).toLocaleString() : 'Recently',
          color: n.read_at ? 'from-slate-500 to-slate-600' : 'from-blue-500 to-cyan-600',
          status: n.read_at ? 'success' : 'new',
        }));
      }

      // Fallback - use recent applications
      const apps = job_seeker.recent_applications || [];
      if (apps.length > 0) {
        return apps.slice(0, 4).map((app) => ({
          icon: app.status === 'shortlisted' ? FiStar : FiFileText,
          title: `Application for ${app.job_title} at ${app.company}`,
          time: app.applied_at ? new Date(app.applied_at).toLocaleString() : 'Recently',
          color: app.status === 'shortlisted' ? 'from-green-500 to-emerald-600' : 'from-blue-500 to-cyan-600',
          status: app.status === 'shortlisted' ? 'success' : app.status === 'pending' ? 'warning' : 'new',
        }));
      }

      return [
        { icon: FiCheckCircle, title: 'Start exploring jobs to find your perfect match', time: 'Get started', color: 'from-blue-500 to-cyan-600', status: 'new' },
        { icon: FiTarget, title: 'Complete your profile to attract recruiters', time: 'Profile: ' + (job_seeker.summary?.profile_completion || 0) + '%', color: 'from-purple-500 to-purple-600', status: 'warning' }
      ];
    }

    // Admin/Staff - use recent applications
    if ((role === 'admin' || role === 'staff') && admin_staff) {
      const apps = admin_staff.recent_applications || [];
      if (apps.length > 0) {
        return apps.slice(0, 4).map((app) => ({
          icon: FiUsers,
          title: `${app.applicant} applied for ${app.job_title} at ${app.company}`,
          time: app.submitted_at ? new Date(app.submitted_at).toLocaleString() : 'Recently',
          color: app.status === 'shortlisted' ? 'from-green-500 to-emerald-600' : 'from-blue-500 to-cyan-600',
          status: app.status === 'shortlisted' ? 'success' : app.status === 'pending' ? 'warning' : 'new',
        }));
      }

      return [
        { icon: FiTrendingUp, title: `View platform analytics: ${admin_staff.trend?.views_last_30_days || 0} views in 30 days`, time: 'Last 30 days', color: 'from-blue-500 to-cyan-600', status: 'new' },
        { icon: FiBriefcase, title: `${admin_staff.trend?.jobs_last_30_days || 0} new jobs posted`, time: 'Last 30 days', color: 'from-green-500 to-emerald-600', status: 'success' }
      ];
    }

    return [];
  };

  // Get Quick Actions based on role
  const getQuickActions = () => {
    const actions = [];

    if (role === 'job_seeker') {
      actions.push(
        { icon: FiFileText, label: 'Browse Jobs', color: 'from-blue-500 to-blue-600', onClick: () => window.location.href = '/seeker/jobs' },
        { icon: FiTarget, label: 'Complete Profile', color: 'from-green-500 to-emerald-600', onClick: () => window.location.href = '/complete-profile' },
        { icon: FiActivity, label: 'My Applications', color: 'from-purple-500 to-purple-600', onClick: () => window.location.href = '/backend/apply' },
        { icon: FiBell, label: 'Notifications', color: 'from-orange-500 to-red-600', onClick: () => window.location.href = '/backend/notifications' }
      );
    }

    if (role === 'admin' || role === 'staff') {
      actions.push(
        { icon: FiUsers, label: 'Manage Users', color: 'from-blue-500 to-blue-600', onClick: () => window.location.href = '/backend/users' },
        { icon: FiBriefcase, label: 'Manage Jobs', color: 'from-green-500 to-emerald-600', onClick: () => window.location.href = '/backend/listing' },
        { icon: FiFileText, label: 'Applications', color: 'from-purple-500 to-purple-600', onClick: () => window.location.href = '/backend/applications' },
        { icon: FiBarChart2, label: 'Statistics', color: 'from-orange-500 to-red-600', onClick: () => window.location.href = '/backend/statistics' }
      );
    }

    return actions.slice(0, 4);
  };

  // Get stats based on role
  const getStats = () => {
    if (role === 'job_seeker') {
      return buildJobSeekerStats();
    }
    if (role === 'admin' || role === 'staff') {
      return buildAdminStats();
    }
    return [];
  };

  // Get progress data
  const getProgress = () => {
    if (role === 'job_seeker' && job_seeker) {
      return {
        label: job_seeker.progress?.label || 'Profile Completion',
        value: job_seeker.progress?.value || 0,
        unit: '%',
        message: job_seeker.progress?.message || 'Complete your profile to attract more recruiters.'
      };
    }

    if (role === 'admin' || role === 'staff') {
      const trend = admin_staff?.trend || {};
      return {
        label: 'Platform Growth',
        value: Math.min(100, Math.round(((trend.views_last_30_days || 0) / 1000) * 100)),
        unit: '%',
        message: `${trend.applications_last_30_days || 0} applications in the last 30 days. Keep up the good work!`
      };
    }

    return {
      label: 'Getting Started',
      value: 50,
      unit: '%',
      message: 'Explore the platform to unlock more features.'
    };
  };

  // Determine if user can see dashboard
  const stats = getStats();
  const activities = getActivities();
  const quickActions = getQuickActions();
  const progress = getProgress();

  if (stats.length === 0 && activities.length === 0) {
    return (
      <AuthenticatedLayout>
        <Head title="Dashboard" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShield className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Welcome to DUS</h2>
            <p className="text-gray-500 mt-2">Your dashboard is being prepared.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      {/* Welcome Section */}
      <div className="mb-8 animate-fade-in-up">
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {greeting}, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-blue-100">
                {role === 'job_seeker' && 'Here\'s your job search progress at a glance.'}
                {role === 'admin' && 'Here\'s what\'s happening on your platform.'}
                {role === 'staff' && 'Here\'s your staff dashboard overview.'}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
                <FiSmile className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} delay={index * 100} />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="mb-8 animate-fade-in-up animation-delay-400">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Jobs for Job Seekers */}
      {role === 'job_seeker' && job_seeker?.recommended_jobs?.length > 0 && (
        <div className="mb-8 animate-fade-in-up animation-delay-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recommended Jobs</h2>
            <a href="/seeker/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {job_seeker.recommended_jobs.slice(0, 3).map((job) => (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
                <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{job.company}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <FiMapPin className="w-3 h-3" />
                  <span>{job.locations?.join(', ') || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                    {job.job_type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {job.views_count || 0} views
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Jobs for Admin */}
      {role !== 'job_seeker' && admin_staff?.top_jobs?.length > 0 && (
        <div className="mb-8 animate-fade-in-up animation-delay-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Jobs</h2>
            <a href="/backend/listing" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {admin_staff.top_jobs.slice(0, 3).map((job) => (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{job.company}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${job.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {job.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>📄 {job.applications_count || 0} apps</span>
                  <span>👁️ {job.views_count || 0} views</span>
                  <span>📅 {job.deadline || 'No deadline'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Row: Activity + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        {activities.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-fade-in-up animation-delay-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              <FiActivity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </div>
        )}

        {/* Progress Card */}
        <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 animate-fade-in-up animation-delay-600">
          <div className="text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{progress.label}</h2>
              <FiThumbsUp className="w-6 h-6" />
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{progress.label}</span>
                <span>{progress.value}{progress.unit}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-white rounded-full h-2" style={{ width: `${Math.min(progress.value, 100)}%` }} />
              </div>
            </div>
            <p className="text-sm opacity-90">
              {progress.message}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-600 { animation-delay: 0.6s; }
      `}</style>
    </AuthenticatedLayout>
  );
};

export default Dashboard;