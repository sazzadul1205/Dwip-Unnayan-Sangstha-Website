// pages/auth/Steps/ReviewPage.jsx

// Icons
import {
  FaCheckCircle,
  FaUser,
  FaFileAlt,
  FaTrophy,
  FaEdit,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaHeartbeat,
  FaBuilding,
  FaCalendarDay,
  FaLink,
  FaStar,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaFacebook,
  FaYoutube,
  FaMedium,
  FaDev,
  FaStackOverflow,
  FaGlobe,
  FaFilePdf,
  FaFileWord,
  FaUserCircle,
  FaBriefcase,
  FaGraduationCap,
  FaAward,
  FaShieldAlt,
  FaClipboardCheck
} from 'react-icons/fa';
import { GiSuitcase, GiAchievement } from 'react-icons/gi';
import { MdWork, MdSchool, MdVerified } from 'react-icons/md';
import { useState, useEffect } from 'react';

const ReviewPage = ({ data, onEditStep }) => {
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    // Handle photo URL for display
    if (data.photo instanceof File) {
      const url = URL.createObjectURL(data.photo);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (data.photo_url) {
      setPhotoUrl(data.photo_url);
    } else if (data.photo_path) {
      setPhotoUrl(`/storage/${data.photo_path}`);
    } else {
      setPhotoUrl(null);
    }
  }, [data.photo, data.photo_path, data.photo_url]);

  const formatDate = (date) => {
    if (!date) return 'Not provided';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to get icon for any social platform
  const getSocialIcon = (platform) => {
    const icons = {
      linkedin: <FaLinkedin className="h-4 w-4" />,
      github: <FaGithub className="h-4 w-4" />,
      twitter: <FaTwitter className="h-4 w-4" />,
      facebook: <FaFacebook className="h-4 w-4" />,
      youtube: <FaYoutube className="h-4 w-4" />,
      medium: <FaMedium className="h-4 w-4" />,
      devto: <FaDev className="h-4 w-4" />,
      stackoverflow: <FaStackOverflow className="h-4 w-4" />,
      portfolio: <FaGlobe className="h-4 w-4" />
    };
    return icons[platform] || <FaLink className="h-4 w-4" />;
  };

  // Function to get color for each platform
  const getSocialColor = (platform) => {
    const colors = {
      linkedin: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      github: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      twitter: 'bg-sky-50 text-sky-700 hover:bg-sky-100',
      facebook: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      youtube: 'bg-red-50 text-red-700 hover:bg-red-100',
      medium: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      devto: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      stackoverflow: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
      portfolio: 'bg-green-50 text-green-700 hover:bg-green-100'
    };
    return colors[platform] || 'bg-gray-50 text-gray-700 hover:bg-gray-100';
  };

  // Function to get display name for platform
  const getSocialName = (platform) => {
    const names = {
      linkedin: 'LinkedIn',
      github: 'GitHub',
      twitter: 'Twitter',
      facebook: 'Facebook',
      youtube: 'YouTube',
      medium: 'Medium',
      devto: 'Dev.to',
      stackoverflow: 'Stack Overflow',
      portfolio: 'Portfolio'
    };
    return names[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  const formatSocialLinks = (links) => {
    if (!links || Object.keys(links).length === 0) {
      return <p className="text-sm text-gray-400 italic">No social links provided</p>;
    }

    return (
      <div className="flex flex-wrap gap-3">
        {Object.entries(links).map(([platform, url]) => (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm ${getSocialColor(platform)}`}
          >
            {getSocialIcon(platform)}
            {getSocialName(platform)}
          </a>
        ))}
      </div>
    );
  };

  const SectionHeader = ({ icon: Icon, title, step, color = "blue", badge }) => (
    <div className="bg-linear-to-r from-gray-50 to-white px-6 py-4 flex justify-between items-center border-b">
      <div className="flex items-center space-x-3">
        <div className={`p-2 bg-${color}-100 rounded-xl shadow-sm`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {badge && <p className="text-xs text-gray-500 mt-0.5">{badge}</p>}
        </div>
      </div>
      <button
        onClick={() => onEditStep(step)}
        className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium transition-all duration-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg"
      >
        <FaEdit className="h-3.5 w-3.5 mr-1" />
        Edit
      </button>
    </div>
  );

  const InfoRow = ({ label, value, icon: Icon, highlight = false }) => (
    <div className={`p-3 rounded-lg transition-all duration-200 ${highlight ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-gray-400" />}
        {label}
      </p>
      <p className={`text-sm ${highlight ? 'text-blue-900 font-semibold' : 'text-gray-900'}`}>
        {value || 'Not provided'}
      </p>
    </div>
  );

  const calculateCompletion = () => {
    let total = 0;
    let completed = 0;

    // Basic Info
    total += 6;
    if (data.first_name) completed++;
    if (data.last_name) completed++;
    if (data.phone) completed++;
    if (data.birth_date) completed++;
    if (data.gender) completed++;
    if (data.address) completed++;

    // Professional Info
    total += 2;
    if (data.experience_years) completed++;
    if (data.current_job_title) completed++;

    // CV
    total += 1;
    if (data.cvs && data.cvs.length > 0) completed++;

    // Work Experience
    total += 1;
    if (data.job_histories && data.job_histories.length > 0) completed++;

    // Education
    total += 1;
    if (data.education_histories && data.education_histories.length > 0) completed++;

    // Achievements
    total += 1;
    if (data.achievements && data.achievements.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateCompletion();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center py-6 bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl mb-2">
        <div className="inline-flex items-center justify-center p-3 bg-green-500 rounded-full mb-4 shadow-lg">
          <FaCheckCircle className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Review Your Profile</h2>
        <p className="text-gray-600 mt-1">Please review all information before submitting</p>

        {/* Completion Progress */}
        <div className="max-w-md mx-auto mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Profile Completion</span>
            <span className="font-semibold text-blue-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <SectionHeader icon={FaUser} title="Basic Information" step={0} color="blue"
          badge="Personal & Contact Details" />
        <div className="px-6 py-5">
          {/* Profile Photo Display */}
          <div className="flex justify-center md:justify-start mb-6">
            <div className="relative">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-300"><svg class="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>';
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-300">
                  <FaUser className="h-10 w-10 text-gray-400" />
                </div>
              )}
              {(data.photo || data.photo_path) && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <FaCheckCircle className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoRow label="Full Name" value={`${data.first_name} ${data.last_name}`.trim()} icon={FaUserCircle} highlight />
            <InfoRow label="Phone Number" value={data.phone} icon={FaPhone} />
            <InfoRow label="Birth Date" value={formatDate(data.birth_date)} icon={FaCalendarAlt} />
            <InfoRow label="Gender" value={data.gender || 'Not specified'} icon={FaUser} />
            <InfoRow label="Blood Type" value={data.blood_type || 'Not specified'} icon={FaHeartbeat} />
            <InfoRow label="Address" value={data.address || 'Not provided'} icon={FaMapMarkerAlt} />
          </div>
        </div>
      </div>

      {/* Professional Information Section */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <SectionHeader icon={MdWork} title="Professional Information" step={1} color="purple"
          badge="Career & Social Links" />
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <InfoRow label="Years of Experience" value={data.experience_years ? `${data.experience_years} years` : 'Not specified'} icon={FaBriefcase} />
            <InfoRow label="Current Job Title" value={data.current_job_title || 'Not specified'} icon={MdWork} />
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
              <FaLink className="h-3.5 w-3.5" />
              Social Links
            </p>
            {formatSocialLinks(data.social_links)}
          </div>
        </div>
      </div>

      {/* CV Section */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <SectionHeader icon={FaFileAlt} title="CV/Resume" step={2} color="green"
          badge="Uploaded Documents" />
        <div className="px-6 py-5">
          {!data.cvs || data.cvs.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <FaFileAlt className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No CV uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {data.cvs.map((cv) => (
                <div key={cv.id} className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-4">
                    {cv.type === 'application/pdf' ? (
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FaFilePdf className="h-6 w-6 text-red-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FaFileWord className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cv.original_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(cv.size / 1024).toFixed(1)} KB • Uploaded {cv.upload_date ? new Date(cv.upload_date).toLocaleDateString() : 'recently'}
                      </p>
                    </div>
                  </div>
                  {cv.is_primary && (
                    <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                      <FaStar className="h-3 w-3" />
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Work Experience Section */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <SectionHeader icon={GiSuitcase} title="Work Experience" step={3} color="orange"
          badge={`${data.job_histories?.length || 0} position${data.job_histories?.length !== 1 ? 's' : ''}`} />
        <div className="px-6 py-5">
          {!data.job_histories || data.job_histories.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <FaBriefcase className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No work experience added</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.job_histories.map((job, index) => (
                <div key={index} className="border-l-4 border-orange-400 pl-4 py-3 hover:bg-orange-50/30 rounded-r-lg transition-all">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{job.position || 'Position not specified'}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                        <FaBuilding className="h-3.5 w-3.5 text-gray-400" />
                        {job.company_name || 'Company not specified'}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                      <FaCalendarDay className="h-3 w-3" />
                      {job.starting_year} - {job.is_current ? 'Present' : (job.ending_year || 'Present')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Education Section */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <SectionHeader icon={MdSchool} title="Education" step={4} color="indigo"
          badge={`${data.education_histories?.length || 0} degree${data.education_histories?.length !== 1 ? 's' : ''}`} />
        <div className="px-6 py-5">
          {!data.education_histories || data.education_histories.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <FaGraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No education added</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.education_histories.map((edu, index) => (
                <div key={index} className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 pb-4 border-b last:border-0">
                  <div>
                    <p className="font-semibold text-gray-900">{edu.degree || 'Degree not specified'}</p>
                    <p className="text-sm text-gray-600 mt-1">{edu.institution_name || 'Institution not specified'}</p>
                  </div>
                  <p className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    Passed: {edu.passing_year}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <SectionHeader icon={GiAchievement} title="Achievements & Certifications" step={5} color="yellow"
          badge={`${data.achievements?.length || 0} achievement${data.achievements?.length !== 1 ? 's' : ''}`} />
        <div className="px-6 py-5">
          {!data.achievements || data.achievements.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <FaAward className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No achievements added</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {data.achievements.map((achievement, index) => (
                <div key={index} className="p-4 bg-linear-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <FaTrophy className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{achievement.achievement_name || 'Untitled Achievement'}</p>
                      {achievement.achievement_details && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{achievement.achievement_details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Success and Warning Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <FaShieldAlt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Information Protection</p>
              <p className="text-xs text-blue-700 mt-0.5">Your data is encrypted and securely stored</p>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <FaClipboardCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Review Before Submitting</p>
              <p className="text-xs text-amber-700 mt-0.5">You can still edit your profile after submission</p>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Status Summary */}
      <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <MdVerified className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">Profile Status</p>
              <div className="flex gap-3 mt-1 text-xs">
                <span className="flex items-center gap-1">
                  {data.cvs && data.cvs.length > 0 ? '✅' : '❌'} CV
                </span>
                <span className="flex items-center gap-1">
                  {data.job_histories && data.job_histories.length > 0 ? '✅' : '❌'} Experience
                </span>
                <span className="flex items-center gap-1">
                  {data.education_histories && data.education_histories.length > 0 ? '✅' : '❌'} Education
                </span>
              </div>
            </div>
          </div>
          <div className="text-sm text-green-800">
            {completionPercentage === 100 ? '🎉 Complete profile ready for submission!' : '📝 Complete all sections for better opportunities'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
