import React, { useEffect, useState } from 'react';
import { atsApi } from '../api';
import { Briefcase, Users, FileCheck, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await atsApi.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Use mock data for demo
      setDashboardData({
        total_jobs: 12,
        total_applications: 156,
        active_applications: 89,
        avg_score: 72.5,
        recent_applications: [
          { id: 1, applicant_name: 'John Doe', job_title: 'Software Engineer', score: 85, status: 'pending' },
          { id: 2, applicant_name: 'Jane Smith', job_title: 'Product Manager', score: 92, status: 'interview' },
          { id: 3, applicant_name: 'Bob Johnson', job_title: 'UX Designer', score: 78, status: 'pending' },
          { id: 4, applicant_name: 'Alice Williams', job_title: 'Data Scientist', score: 88, status: 'offered' },
        ],
        jobs_overview: [
          { title: 'Software Engineer', applications: 45 },
          { title: 'Product Manager', applications: 32 },
          { title: 'UX Designer', applications: 28 },
          { title: 'Data Scientist', applications: 25 },
          { title: 'DevOps Engineer', applications: 26 },
        ],
        status_distribution: [
          { name: 'Pending', value: 45 },
          { name: 'Screening', value: 30 },
          { name: 'Interview', value: 25 },
          { name: 'Offered', value: 15 },
          { name: 'Rejected', value: 41 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Jobs', value: dashboardData.total_jobs, icon: Briefcase, color: 'blue' },
    { label: 'Total Applications', value: dashboardData.total_applications, icon: FileCheck, color: 'green' },
    { label: 'Active Applications', value: dashboardData.active_applications, icon: Users, color: 'purple' },
    { label: 'Average ATS Score', value: `${dashboardData.avg_score}%`, icon: TrendingUp, color: 'orange' },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-600 mt-1">Overview of your ATS system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 bg-${stat.color}-100 rounded-full`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Applications per Job</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.jobs_overview}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.status_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.status_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Applications</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ATS Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.recent_applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{app.applicant_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{app.job_title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 w-24">
                        <div
                          className={`h-2.5 rounded-full ${
                            app.score >= 80 ? 'bg-green-500' : app.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${app.score}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{app.score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      app.status === 'offered' ? 'bg-green-100 text-green-800' :
                      app.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                      app.status === 'screening' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
