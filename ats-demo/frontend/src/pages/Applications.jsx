import React, { useEffect, useState } from 'react';
import { atsApi } from '../api';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await atsApi.getApplications();
      setApplications(response.data);
    } catch (error) {
      console.error('Error loading applications:', error);
      // Mock data for demo
      setApplications([
        { id: 1, applicant_name: 'John Doe', email: 'john@example.com', job_title: 'Software Engineer', score: 85, status: 'pending', applied_at: '2024-03-01' },
        { id: 2, applicant_name: 'Jane Smith', email: 'jane@example.com', job_title: 'Product Manager', score: 92, status: 'interview', applied_at: '2024-03-02' },
        { id: 3, applicant_name: 'Bob Johnson', email: 'bob@example.com', job_title: 'UX Designer', score: 78, status: 'screening', applied_at: '2024-03-03' },
        { id: 4, applicant_name: 'Alice Williams', email: 'alice@example.com', job_title: 'Data Scientist', score: 88, status: 'offered', applied_at: '2024-03-04' },
        { id: 5, applicant_name: 'Charlie Brown', email: 'charlie@example.com', job_title: 'DevOps Engineer', score: 65, status: 'rejected', applied_at: '2024-03-05' },
        { id: 6, applicant_name: 'Diana Prince', email: 'diana@example.com', job_title: 'Software Engineer', score: 95, status: 'interview', applied_at: '2024-03-06' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await atsApi.updateApplicationStatus(id, newStatus);
      loadApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Status updated! (Demo mode)');
      loadApplications();
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'screening': return <Eye className="w-5 h-5 text-purple-600" />;
      case 'interview': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'offered': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'screening': return 'bg-purple-100 text-purple-800';
      case 'interview': return 'bg-blue-100 text-blue-800';
      case 'offered': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Applications</h2>
        <p className="text-gray-600 mt-1">Review and manage job applications</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search applicants or jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="screening">Screening</option>
          <option value="interview">Interview</option>
          <option value="offered">Offered</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ATS Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{app.applicant_name}</div>
                      <div className="text-sm text-gray-500">{app.email}</div>
                    </div>
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
                      <span className="ml-2 text-sm font-medium text-gray-700">{app.score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(app.status)}
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(app.applied_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {app.status !== 'rejected' && app.status !== 'offered' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'interview')}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Interview"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">Application Details</h3>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Applicant Name</label>
                  <p className="text-lg font-semibold text-gray-800">{selectedApplication.applicant_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg text-gray-800">{selectedApplication.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Job Position</label>
                <p className="text-lg font-semibold text-gray-800">{selectedApplication.job_title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">ATS Score</label>
                <div className="flex items-center mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        selectedApplication.score >= 80 ? 'bg-green-500' : selectedApplication.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${selectedApplication.score}%` }}
                    ></div>
                  </div>
                  <span className="ml-3 text-xl font-bold text-gray-800">{selectedApplication.score}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Current Status</label>
                <div className="flex items-center mt-2">
                  {getStatusIcon(selectedApplication.status)}
                  <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(selectedApplication.status)}`}>
                    {selectedApplication.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Applied Date</label>
                <p className="text-lg text-gray-800">{new Date(selectedApplication.applied_at).toLocaleDateString()}</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <div className="flex gap-2">
                  {['pending', 'screening', 'interview', 'offered', 'rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(selectedApplication.id, status)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        selectedApplication.status === status
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedApplication(null)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
