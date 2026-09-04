import React, { useEffect, useState } from 'react';
import { atsApi } from '../api';
import { Users, Mail, Phone, MapPin } from 'lucide-react';

const Applicants = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadApplicants();
  }, []);

  const loadApplicants = async () => {
    try {
      const response = await atsApi.getApplicants();
      setApplicants(response.data);
    } catch (error) {
      console.error('Error loading applicants:', error);
      // Mock data for demo
      setApplicants([
        { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1-555-0101', location: 'San Francisco, CA', skills: ['React', 'Node.js', 'Python'], experience_years: 5, applications_count: 2 },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1-555-0102', location: 'New York, NY', skills: ['Product Management', 'Agile', 'Data Analysis'], experience_years: 7, applications_count: 3 },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+1-555-0103', location: 'Austin, TX', skills: ['Figma', 'Sketch', 'User Research'], experience_years: 4, applications_count: 1 },
        { id: 4, name: 'Alice Williams', email: 'alice@example.com', phone: '+1-555-0104', location: 'Boston, MA', skills: ['Machine Learning', 'Python', 'TensorFlow'], experience_years: 6, applications_count: 2 },
        { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', phone: '+1-555-0105', location: 'Seattle, WA', skills: ['AWS', 'Docker', 'Kubernetes'], experience_years: 5, applications_count: 1 },
        { id: 6, name: 'Diana Prince', email: 'diana@example.com', phone: '+1-555-0106', location: 'Los Angeles, CA', skills: ['Java', 'Spring Boot', 'Microservices'], experience_years: 8, applications_count: 3 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplicants = applicants.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading applicants...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Applicants</h2>
        <p className="text-gray-600 mt-1">Browse and manage applicant profiles</p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Applicants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApplicants.map((applicant) => (
          <div key={applicant.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-800">{applicant.name}</h3>
                  <p className="text-sm text-gray-600">{applicant.experience_years} years experience</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                {applicant.applications_count} Applications
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {applicant.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {applicant.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {applicant.location}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {applicant.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredApplicants.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No applicants found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default Applicants;
