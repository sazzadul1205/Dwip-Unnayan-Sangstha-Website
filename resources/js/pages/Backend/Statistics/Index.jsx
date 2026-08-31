// resources/js/pages/Backend/Statistics/Index.jsx

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
  FaChartLine,
  FaBriefcase,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaUserCheck,
  FaBuilding,
  FaMapMarkerAlt,
  FaChartPie,
  FaChartBar,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaShieldAlt,
} from 'react-icons/fa';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

// Auth
import { useAuth } from '../../../hooks/useAuth';
import { CanAny } from '../../../components/Auth/CanAny';

// Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

export default function StatisticsIndex({
  summary,
  trends,
  jobsByType,
  jobsByExperience,
  jobsByCategory,
  jobsByLocation,
  monthlyJobs,
  applicationsByStatus,
  monthlyApplications,
  applicationsByJob,
  atsScoreByJobType,
  topEmployers,
  topEmployersByApplications,
  dateRange,
}) {

  // Use centralized auth hook
  const {
    hasAnyPermission,
  } = useAuth();

  // Check permissions for viewing statistics
  const canViewStatistics = hasAnyPermission(['statistics.view', 'statistics.manage', 'dashboard.view']);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState(dateRange || 'all');

  // If user doesn't have permission to view statistics, show access denied
  if (!canViewStatistics) {
    return (
      <AuthenticatedLayout>
        <Head title="Access Denied" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">You don't have permission to view statistics.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Handle date range filter change
  const handleRangeChange = (range) => {
    if (range === selectedRange) return;

    setIsLoading(true);
    setSelectedRange(range);

    router.get(route('backend.statistics.index'),
      { date_range: range },
      {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => setIsLoading(false)
      }
    );
  };

  // Date range buttons - Responsive
  const DateRangeButtons = () => (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {[
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' },
        { value: 'all', label: 'All Time' },
      ].map((range) => (
        <button
          key={range.value}
          onClick={() => handleRangeChange(range.value)}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none ${selectedRange === range.value
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );

  // Trend indicator component
  const TrendIndicator = ({ value }) => {
    if (value > 0) {
      return (
        <span className="text-green-600 flex items-center gap-1 text-xs sm:text-sm">
          <FaArrowUp size={10} />
          +{value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="text-red-600 flex items-center gap-1 text-xs sm:text-sm">
          <FaArrowDown size={10} />
          {value}%
        </span>
      );
    }
    return (
      <span className="text-gray-400 flex items-center gap-1 text-xs sm:text-sm">
        <FaMinus size={10} />
        0%
      </span>
    );
  };

  // Loading overlay
  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <Head title="Statistics" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-sm sm:text-base text-gray-600">Loading statistics...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <Head title="Statistics Dashboard" />

      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        <div className="mx-auto">
          {/* Header - Responsive */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Statistics Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                Overview of job listings, applications, and performance metrics
              </p>
            </div>
            <DateRangeButtons />
          </div>

          {/* Summary Cards - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
            {/* Total Jobs */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm">Total Jobs</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{summary.total_jobs}</p>
                  <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                    <TrendIndicator value={trends.total_jobs} />
                    <span className="text-gray-400 text-[10px] sm:text-xs">vs previous</span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaBriefcase className="text-blue-600 text-base sm:text-xl" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex flex-wrap justify-between gap-1 text-[10px] sm:text-xs">
                <span className="text-green-600">Active: {summary.active_jobs}</span>
                <span className="text-red-600">Inactive: {summary.inactive_jobs}</span>
                <span className="text-gray-500">Trashed: {summary.trashed_jobs}</span>
              </div>
            </div>

            {/* Total Applications */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm">Total Applications</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{summary.total_applications}</p>
                  <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                    <TrendIndicator value={trends.total_applications} />
                    <span className="text-gray-400 text-[10px] sm:text-xs">vs previous</span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaFileAlt className="text-purple-600 text-base sm:text-xl" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex flex-wrap justify-between gap-1 text-[10px] sm:text-xs">
                <span className="text-yellow-600">Pending: {summary.pending_applications}</span>
                <span className="text-blue-600">Shortlisted: {summary.shortlisted_applications}</span>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm">Conversion Rate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{summary.conversion_rate}%</p>
                  <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                    <TrendIndicator value={trends.conversion_rate} />
                    <span className="text-gray-400 text-[10px] sm:text-xs">vs previous</span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaUserCheck className="text-green-600 text-base sm:text-xl" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-green-600 rounded-full h-1.5 sm:h-2 transition-all duration-500"
                    style={{ width: `${Math.min(summary.conversion_rate, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2">
                  {summary.hired_applications} hired out of {summary.total_applications}
                </p>
              </div>
            </div>

            {/* Hiring Statistics */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm">Hiring Status</p>
                  <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                    <div className="flex items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
                      <span className="flex items-center gap-1">
                        <FaCheckCircle className="text-green-500 text-[10px]" />
                        Hired
                      </span>
                      <span className="font-semibold">{summary.hired_applications}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
                      <span className="flex items-center gap-1">
                        <FaHourglassHalf className="text-yellow-500 text-[10px]" />
                        Rejected
                      </span>
                      <span className="font-semibold">{summary.rejected_applications}</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaTimesCircle className="text-red-600 text-base sm:text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 - Job & Application Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
            {/* Monthly Job Trend */}
            <CanAny permissions={['statistics.jobs', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaChartLine className="text-blue-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Job Creation Trend</h3>
                </div>
                {monthlyJobs.length > 0 ? (
                  <div className="h-48 sm:h-64">
                    <Line
                      data={{
                        labels: monthlyJobs.map(item => item.month),
                        datasets: [
                          {
                            label: 'Jobs Created',
                            data: monthlyJobs.map(item => item.total),
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              font: { size: 10 },
                              boxWidth: 10,
                              padding: 8,
                            },
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              font: { size: 9 },
                              maxRotation: 45,
                              minRotation: 0,
                            },
                          },
                          y: {
                            ticks: {
                              font: { size: 9 },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>

            {/* Monthly Application Trend */}
            <CanAny permissions={['statistics.applications', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaChartLine className="text-purple-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Application Trend</h3>
                </div>
                {monthlyApplications.length > 0 ? (
                  <div className="h-48 sm:h-64">
                    <Line
                      data={{
                        labels: monthlyApplications.map(item => item.month),
                        datasets: [
                          {
                            label: 'Applications Received',
                            data: monthlyApplications.map(item => item.total),
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              font: { size: 10 },
                              boxWidth: 10,
                              padding: 8,
                            },
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              font: { size: 9 },
                              maxRotation: 45,
                              minRotation: 0,
                            },
                          },
                          y: {
                            ticks: {
                              font: { size: 9 },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>
          </div>

          {/* Charts Row 2 - Job Distribution & Application Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
            {/* Jobs by Type */}
            <CanAny permissions={['statistics.jobs', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaChartPie className="text-green-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Jobs by Type</h3>
                </div>
                {jobsByType.length > 0 ? (
                  <div className="h-48 sm:h-56">
                    <Pie
                      data={{
                        labels: jobsByType.map(item => item.name),
                        datasets: [
                          {
                            data: jobsByType.map(item => item.value),
                            backgroundColor: jobsByType.map(item => item.color),
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              font: { size: 9 },
                              boxWidth: 10,
                              padding: 6,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>

            {/* Jobs by Experience */}
            <CanAny permissions={['statistics.jobs', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaChartBar className="text-orange-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Jobs by Experience</h3>
                </div>
                {jobsByExperience.length > 0 ? (
                  <div className="h-48 sm:h-56">
                    <Bar
                      data={{
                        labels: jobsByExperience.map(item => item.name),
                        datasets: [
                          {
                            data: jobsByExperience.map(item => item.value),
                            backgroundColor: jobsByExperience.map(item => item.color),
                            borderRadius: 8,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              font: { size: 9 },
                              maxRotation: 30,
                              minRotation: 0,
                            },
                          },
                          y: {
                            ticks: {
                              font: { size: 9 },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>

            {/* Applications by Status */}
            <CanAny permissions={['statistics.applications', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaChartPie className="text-red-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Applications by Status</h3>
                </div>
                {applicationsByStatus.some(item => item.value > 0) ? (
                  <div className="h-48 sm:h-56">
                    <Doughnut
                      data={{
                        labels: applicationsByStatus.map(item => item.name),
                        datasets: [
                          {
                            data: applicationsByStatus.map(item => item.value),
                            backgroundColor: applicationsByStatus.map(item => item.color),
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              font: { size: 9 },
                              boxWidth: 10,
                              padding: 6,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>
          </div>

          {/* Charts Row 3 - Categories & Locations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
            {/* Top Categories */}
            <CanAny permissions={['statistics.jobs', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaBuilding className="text-blue-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Job Categories</h3>
                </div>
                {jobsByCategory.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
                    {jobsByCategory.map((category, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-xs sm:text-sm mb-0.5 sm:mb-1">
                          <span className="text-gray-700 truncate flex-1 mr-2">{category.name}</span>
                          <span className="font-semibold">{category.value}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div
                            className="h-1.5 sm:h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(category.value / jobsByCategory[0].value) * 100}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>

            {/* Top Locations */}
            <CanAny permissions={['statistics.jobs', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaMapMarkerAlt className="text-red-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Job Locations</h3>
                </div>
                {jobsByLocation.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
                    {jobsByLocation.map((location, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-xs sm:text-sm mb-0.5 sm:mb-1">
                          <span className="text-gray-700 truncate flex-1 mr-2">{location.name}</span>
                          <span className="font-semibold">{location.value}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div
                            className="h-1.5 sm:h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(location.value / jobsByLocation[0].value) * 100}%`,
                              backgroundColor: location.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>
          </div>

          {/* Charts Row 4 - Top Jobs & ATS Scores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
            {/* Top Jobs by Applications */}
            <CanAny permissions={['statistics.applications', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaBriefcase className="text-green-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Most Applied Jobs</h3>
                </div>
                {applicationsByJob.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
                    {applicationsByJob.map((job, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-xs sm:text-sm mb-0.5 sm:mb-1">
                          <span className="text-gray-700 truncate flex-1 mr-2">{job.title}</span>
                          <span className="font-semibold">{job.count} apps</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div
                            className="h-1.5 sm:h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(job.count / applicationsByJob[0].count) * 100}%`,
                              backgroundColor: job.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>

            {/* ATS Score by Job Type */}
            <CanAny permissions={['statistics.ats', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaChartBar className="text-indigo-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Avg ATS Score by Job Type</h3>
                </div>
                {atsScoreByJobType.length > 0 ? (
                  <div className="h-48 sm:h-56">
                    <Bar
                      data={{
                        labels: atsScoreByJobType.map(item => item.type),
                        datasets: [
                          {
                            label: 'ATS Score (%)',
                            data: atsScoreByJobType.map(item => item.score),
                            backgroundColor: '#6366f1',
                            borderRadius: 8,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Score (%)',
                              font: { size: 10 },
                            },
                            ticks: {
                              font: { size: 9 },
                            },
                          },
                          x: {
                            ticks: {
                              font: { size: 9 },
                              maxRotation: 30,
                              minRotation: 0,
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>
          </div>

          {/* Top Employers Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
            {/* Top Employers by Job Count */}
            <CanAny permissions={['statistics.employers', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaBuilding className="text-blue-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Employers (Jobs)</h3>
                </div>
                {topEmployers.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
                    {topEmployers.map((employer, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 sm:gap-0"
                      >
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {employer.avatar ? (
                            <img
                              src={employer.avatar}
                              alt={employer.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                              <FaBuilding className="text-blue-600 text-sm" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900 text-xs sm:text-sm truncate">{employer.name}</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-blue-600">{employer.job_count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>

            {/* Top Employers by Applications */}
            <CanAny permissions={['statistics.employers', 'statistics.manage']} fallback={null}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <FaFileAlt className="text-purple-600 text-sm sm:text-base" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Employers (Applications)</h3>
                </div>
                {topEmployersByApplications.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
                    {topEmployersByApplications.map((employer, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 sm:gap-0"
                      >
                        <span className="font-medium text-gray-900 text-xs sm:text-sm truncate">{employer.name}</span>
                        <span className="text-xl sm:text-2xl font-bold text-purple-600">{employer.application_count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No data available</p>
                )}
              </div>
            </CanAny>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}