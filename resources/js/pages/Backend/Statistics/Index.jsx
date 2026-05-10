// resources/js/pages/Backend/Statistics/Index.jsx

import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
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
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from 'react-icons/fa';

// Layout
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';

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
  filters
}) {
  const [selectedRange, setSelectedRange] = useState(dateRange || 'all');
  const [isLoading, setIsLoading] = useState(false);

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

  // Date range buttons
  const DateRangeButtons = () => (
    <div className="flex gap-2">
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
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedRange === range.value
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
        <span className="text-green-600 flex items-center gap-1 text-sm">
          <FaArrowUp size={12} />
          +{value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="text-red-600 flex items-center gap-1 text-sm">
          <FaArrowDown size={12} />
          {value}%
        </span>
      );
    }
    return (
      <span className="text-gray-400 flex items-center gap-1 text-sm">
        <FaMinus size={12} />
        0%
      </span>
    );
  };

  // Loading overlay
  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <Head title="Statistics" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <Head title="Statistics Dashboard" />

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Statistics Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Overview of job listings, applications, and performance metrics
              </p>
            </div>
            <DateRangeButtons />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Jobs */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summary.total_jobs}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendIndicator value={trends.total_jobs} />
                    <span className="text-gray-400 text-xs">vs previous period</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaBriefcase className="text-blue-600 text-xl" />
                </div>
              </div>
              <div className="mt-4 flex justify-between text-xs">
                <span className="text-green-600">Active: {summary.active_jobs}</span>
                <span className="text-red-600">Inactive: {summary.inactive_jobs}</span>
                <span className="text-gray-500">Trashed: {summary.trashed_jobs}</span>
              </div>
            </div>

            {/* Total Applications */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summary.total_applications}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendIndicator value={trends.total_applications} />
                    <span className="text-gray-400 text-xs">vs previous period</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaFileAlt className="text-purple-600 text-xl" />
                </div>
              </div>
              <div className="mt-4 flex justify-between text-xs">
                <span className="text-yellow-600">Pending: {summary.pending_applications}</span>
                <span className="text-blue-600">Shortlisted: {summary.shortlisted_applications}</span>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summary.conversion_rate}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendIndicator value={trends.conversion_rate} />
                    <span className="text-gray-400 text-xs">vs previous period</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaUserCheck className="text-green-600 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.min(summary.conversion_rate, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{summary.hired_applications} hired out of {summary.total_applications}</p>
              </div>
            </div>

            {/* Hiring Statistics */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Hiring Status</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <FaCheckCircle className="text-green-500 text-xs" />
                        Hired
                      </span>
                      <span className="font-semibold">{summary.hired_applications}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <FaHourglassHalf className="text-yellow-500 text-xs" />
                        Rejected
                      </span>
                      <span className="font-semibold">{summary.rejected_applications}</span>
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaTimesCircle className="text-red-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Job Trend */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartLine className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Job Creation Trend</h3>
              </div>
              {monthlyJobs.length > 0 ? (
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
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>

            {/* Monthly Application Trend */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartLine className="text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Application Trend</h3>
              </div>
              {monthlyApplications.length > 0 ? (
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
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Jobs by Type */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartPie className="text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Jobs by Type</h3>
              </div>
              {jobsByType.length > 0 ? (
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
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          font: { size: 11 },
                        },
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>

            {/* Jobs by Experience */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartBar className="text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Jobs by Experience</h3>
              </div>
              {jobsByExperience.length > 0 ? (
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
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>

            {/* Applications by Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartPie className="text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Applications by Status</h3>
              </div>
              {applicationsByStatus.some(item => item.value > 0) ? (
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
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Charts Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Categories */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaBuilding className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Top Job Categories</h3>
              </div>
              {jobsByCategory.length > 0 ? (
                <div className="space-y-3">
                  {jobsByCategory.map((category, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{category.name}</span>
                        <span className="font-semibold">{category.value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(category.value / jobsByCategory[0].value) * 100}%`,
                            backgroundColor: category.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>

            {/* Top Locations */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaMapMarkerAlt className="text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Top Job Locations</h3>
              </div>
              {jobsByLocation.length > 0 ? (
                <div className="space-y-3">
                  {jobsByLocation.map((location, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{location.name}</span>
                        <span className="font-semibold">{location.value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(location.value / jobsByLocation[0].value) * 100}%`,
                            backgroundColor: location.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Charts Row 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Jobs by Applications */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaBriefcase className="text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Most Applied Jobs</h3>
              </div>
              {applicationsByJob.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {applicationsByJob.map((job, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate flex-1 mr-2">{job.title}</span>
                        <span className="font-semibold">{job.count} apps</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(job.count / applicationsByJob[0].count) * 100}%`,
                            backgroundColor: job.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>

            {/* ATS Score by Job Type */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartBar className="text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Average ATS Score by Job Type</h3>
              </div>
              {atsScoreByJobType.length > 0 ? (
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
                    maintainAspectRatio: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Score (%)',
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
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Top Employers Section */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Employers by Job Count */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaBuilding className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Top Employers (Jobs)</h3>
              </div>
              {topEmployers.length > 0 ? (
                <div className="space-y-3">
                  {topEmployers.map((employer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {employer.avatar ? (
                          <img
                            src={employer.avatar}
                            alt={employer.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaBuilding className="text-blue-600 text-sm" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{employer.name}</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{employer.job_count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>

            {/* Top Employers by Applications */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaFileAlt className="text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Top Employers (Applications)</h3>
              </div>
              {topEmployersByApplications.length > 0 ? (
                <div className="space-y-3">
                  {topEmployersByApplications.map((employer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{employer.name}</span>
                      <span className="text-2xl font-bold text-purple-600">{employer.application_count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}