// resources/js/Pages/Frontend/JobsDetails/JobsDetails.jsx

import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { CiCalendar, CiLocationOn } from "react-icons/ci";
import { FaRegClock, FaFacebookF, FaLinkedinIn, FaInstagram, FaBriefcase, FaMoneyBillWave, FaGraduationCap, FaBuilding } from "react-icons/fa";
import axios from 'axios';
import PublicLayout from '../../../layouts/PublicLayout';
import DynamicSectionRenderer from '../../../components/Shared/DynamicSectionRenderer';

// Banner Section Component
const BannerSection = ({ bannerData, jobData, loading }) => {
  if (loading) {
    return (
      <section className="relative isolate w-full min-h-[400px] sm:min-h-[500px] lg:h-125 overflow-hidden bg-[#080C14] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="mt-4 text-lg">Loading job details...</p>
        </div>
      </section>
    );
  }

  const normalizedJobData = {
    title: jobData?.title || 'Job Opportunity',
    department: jobData?.category?.name || jobData?.category_name || 'General',
    location: jobData?.locations?.[0]?.name || jobData?.location || 'Hatiya Island, Noakhali',
    type: jobData?.job_type_label || jobData?.job_type || 'Full-time',
    deadline: jobData?.application_deadline ? new Date(jobData.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '30 June 2026',
    experience: jobData?.experience_level_label || jobData?.experience_level || '3-5 years',
    salary: jobData?.salary_range || 'Negotiable',
    employer: jobData?.employer?.name || jobData?.employer_name || 'DUS - Dwip Unnayan Society',
  };

  // Use job image as banner if bannerData is not available
  const defaultBanner = {
    background: {
      src: jobData?.image || '/storage/Jobs/banner-default.jpg',
      alt: jobData?.title || 'Job Banner'
    },
    overlay: {
      darkOverlay: 'bg-black/60',
      gradient: 'bg-gradient-to-r from-black/85 via-black/10 to-transparent'
    }
  };

  const banner = bannerData || defaultBanner;

  return (
    <section className="relative isolate w-full min-h-[400px] sm:min-h-[500px] lg:h-125 overflow-hidden bg-[#080C14]">
      <div className="absolute inset-0 z-0">
        {banner?.background?.src && (
          <img
            src={banner.background.src}
            alt={banner.background.alt || 'Banner background'}
            className="h-full w-full object-cover object-center"
          />
        )}
        <div className={`absolute inset-0 ${banner?.overlay?.darkOverlay || 'bg-black/60'}`}>
          {banner?.overlay?.gradient && (
            <div className={`absolute inset-0 ${banner.overlay.gradient}`} />
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-275 mx-auto px-4 pt-20 sm:pt-28 lg:pt-32 h-full flex flex-col items-center justify-center text-center">
        {/* Job Type Badge */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap mb-4">
          <span className="text-white bg-[#009BE2] text-[12px] sm:text-[13px] font-semibold px-4 py-1.5 rounded-full">
            {normalizedJobData.type}
          </span>
          {normalizedJobData.department && (
            <span className="text-white bg-[#503AF2] text-[12px] sm:text-[13px] font-semibold px-4 py-1.5 rounded-full">
              {normalizedJobData.department}
            </span>
          )}
          {normalizedJobData.experience && (
            <span className="text-white bg-[#00B894] text-[12px] sm:text-[13px] font-semibold px-4 py-1.5 rounded-full">
              {normalizedJobData.experience}
            </span>
          )}
        </div>

        {/* Job Title */}
        <h1 className="text-white font-bold text-[32px] sm:text-[48px] lg:text-[72px] leading-[1.1] mb-4 max-w-380">
          {normalizedJobData.title}
        </h1>

        {/* Employer */}
        <div className="flex items-center justify-center gap-2 mb-4 text-white/80 text-sm">
          <FaBuilding className="text-sm" />
          <span>{normalizedJobData.employer}</span>
        </div>

        {/* Job Meta Information */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-white text-[12px] sm:text-[14px] font-medium">
          <div className="flex items-center gap-2">
            <CiLocationOn className="text-lg" />
            <span>{normalizedJobData.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <CiCalendar className="text-lg" />
            <span>Deadline: {normalizedJobData.deadline}</span>
          </div>

          <div className="flex items-center gap-2">
            <FaMoneyBillWave className="text-sm" />
            <span>{normalizedJobData.salary}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// Job Content Section Component
const JobContentSection = ({
  jobData,
  bgColor = 'bg-white',
  paddingY = 'py-12 lg:py-16',
  paddingX = 'px-4',
  sectionClassName = '',
  sectionId,
  loading
}) => {
  const renderHTML = (htmlString) => {
    if (!htmlString) return { __html: '' };
    return { __html: htmlString };
  };

  if (loading) {
    return (
      <section className={`${bgColor} ${paddingY} ${paddingX} ${sectionClassName}`}>
        <div className="max-w-275 mx-auto">
          <div className="flex justify-center items-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#009BE2] border-r-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!jobData) {
    return null;
  }

  // Parse data from the JobListing model
  const job = {
    title: jobData.title || 'Job Opportunity',
    fullContent: jobData.description || '',
    requirements: jobData.requirements ? (typeof jobData.requirements === 'string' ? JSON.parse(jobData.requirements) : jobData.requirements) : [],
    responsibilities: jobData.responsibilities ? (typeof jobData.responsibilities === 'string' ? JSON.parse(jobData.responsibilities) : jobData.responsibilities) : [],
    benefits: jobData.benefits ? (typeof jobData.benefits === 'string' ? JSON.parse(jobData.benefits) : jobData.benefits) : [],
    skills: jobData.skills ? (typeof jobData.skills === 'string' ? JSON.parse(jobData.skills) : jobData.skills) : [],
    salary: jobData.salary_range || 'Negotiable',
    location: jobData.locations?.[0]?.name || jobData.location || 'Hatiya Island, Noakhali',
    type: jobData.job_type_label || jobData.job_type || 'Full-time',
    applicationDeadline: jobData.application_deadline ? new Date(jobData.application_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not specified',
    howToApply: jobData.how_to_apply || jobData.howToApply || 'Please send your CV and cover letter to career@dus.org.bd',
    applyLink: jobData.apply_link || jobData.applyLink || '#',
    isRemote: jobData.is_remote || jobData.isRemote || false,
    educationRequirement: jobData.education_requirement || jobData.education_details || 'Not specified',
    experienceLevel: jobData.experience_level_label || jobData.experience_level || 'Not specified',
    employer: jobData.employer?.name || 'DUS - Dwip Unnayan Society',
    category: jobData.category?.name || 'General',
    viewsCount: jobData.views_count || 0,
    isActive: jobData.is_active || false,
    isExpired: jobData.isExpired ? jobData.isExpired() : false,
  };

  return (
    <section id={sectionId} className={`${bgColor} ${paddingY} ${paddingX} ${sectionClassName}`}>
      <div className="max-w-275 mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-25">
          {/* Social Share Sidebar */}
          <div className="hidden lg:flex flex-col items-center gap-4 pt-2 sticky top-25">
            <a href="#" className="w-8 h-8 rounded-full bg-[#080C14] text-white flex items-center justify-center hover:bg-[#009BE2] transition-colors">
              <FaFacebookF className="text-sm" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#080C14] text-white flex items-center justify-center hover:bg-[#009BE2] transition-colors">
              <FaLinkedinIn className="text-sm" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#080C14] text-white flex items-center justify-center hover:bg-[#009BE2] transition-colors">
              <FaInstagram className="text-sm" />
            </a>
          </div>

          <div className="flex-1 min-w-0">
            {/* Job Quick Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                <FaBriefcase className="text-[#009BE2] text-xl mx-auto mb-2" />
                <p className="text-xs text-gray-500">Employment Type</p>
                <p className="text-sm font-semibold text-gray-800">{job.type}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                <CiLocationOn className="text-[#009BE2] text-xl mx-auto mb-2" />
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-semibold text-gray-800">{job.location}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                <FaMoneyBillWave className="text-[#009BE2] text-xl mx-auto mb-2" />
                <p className="text-xs text-gray-500">Salary</p>
                <p className="text-sm font-semibold text-gray-800">{job.salary}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                <FaRegClock className="text-[#009BE2] text-xl mx-auto mb-2" />
                <p className="text-xs text-gray-500">Deadline</p>
                <p className="text-sm font-semibold text-gray-800">{job.applicationDeadline}</p>
              </div>
            </div>

            {/* Employer & Category Info */}
            <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2">
                <FaBuilding className="text-[#009BE2]" />
                <span className="text-sm text-gray-600">Employer:</span>
                <span className="text-sm font-semibold text-gray-800">{job.employer}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaGraduationCap className="text-[#009BE2]" />
                <span className="text-sm text-gray-600">Education:</span>
                <span className="text-sm font-semibold text-gray-800">{job.educationRequirement}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaBriefcase className="text-[#009BE2]" />
                <span className="text-sm text-gray-600">Experience:</span>
                <span className="text-sm font-semibold text-gray-800">{job.experienceLevel}</span>
              </div>
              {job.viewsCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Views:</span>
                  <span className="text-sm font-semibold text-gray-800">{job.viewsCount}</span>
                </div>
              )}
            </div>

            {/* Full Description */}
            {job.fullContent && (
              <div className="mb-8">
                <h2 className="font-700 text-2xl sm:text-3xl text-[#080C14] mb-4">Job Description</h2>
                <div
                  className="bricolage-grotesque prose prose-sm sm:prose-base lg:prose-lg max-w-none
                    prose-headings:font-700 prose-headings:text-[#080C14]
                    prose-p:text-[#333333] prose-p:leading-relaxed
                    prose-ul:text-[#333333] prose-ul:leading-relaxed
                    prose-li:text-[#333333] prose-li:leading-relaxed
                    prose-strong:text-[#009BE2]
                    prose-p:mt-4 prose-p:mb-4
                    prose-h2:mt-8 prose-h2:mb-4
                    prose-h3:mt-6 prose-h3:mb-3"
                  dangerouslySetInnerHTML={renderHTML(job.fullContent)}
                />
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="mb-8">
                <h2 className="font-700 text-2xl sm:text-3xl text-[#080C14] mb-4">Key Responsibilities</h2>
                <ul className="list-disc pl-6 space-y-2">
                  {job.responsibilities.map((item, index) => (
                    <li key={index} className="text-[#333333] text-base sm:text-lg leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="mb-8">
                <h2 className="font-700 text-2xl sm:text-3xl text-[#080C14] mb-4">Requirements</h2>
                <ul className="list-disc pl-6 space-y-2">
                  {job.requirements.map((item, index) => (
                    <li key={index} className="text-[#333333] text-base sm:text-lg leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="font-700 text-2xl sm:text-3xl text-[#080C14] mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="bg-[#009BE2]/10 text-[#009BE2] px-4 py-2 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="mb-8">
                <h2 className="font-700 text-2xl sm:text-3xl text-[#080C14] mb-4">Benefits</h2>
                <ul className="list-disc pl-6 space-y-2">
                  {job.benefits.map((item, index) => (
                    <li key={index} className="text-[#333333] text-base sm:text-lg leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* How to Apply */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h2 className="font-700 text-2xl sm:text-3xl text-[#080C14] mb-4">How to Apply</h2>
              <p className="text-[#333333] text-base sm:text-lg leading-relaxed mb-4">
                {job.howToApply}
              </p>
              <div className="flex flex-wrap gap-4">
                {job.applyLink && job.applyLink !== '#' && (
                  <a
                    href={job.applyLink}
                    className="inline-block bg-[#009BE2] text-white font-600 px-8 py-3 rounded-lg hover:bg-[#009BE2]/80 transition-colors"
                  >
                    Apply Now
                  </a>
                )}
                {job.isExpired && (
                  <span className="inline-block bg-red-500 text-white font-600 px-8 py-3 rounded-lg opacity-70 cursor-not-allowed">
                    Application Closed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const JobsDetails = ({
  topBarData,
  navbarData,
  footerData,
  storageUrl,
  sectionConfig,
  pageData: pageDataProp,
  ...pageData
}) => {
  // Get the slug from the URL
  const { url } = usePage();
  const slug = window.location.pathname.split('/').pop();

  // State for job data
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch job data from API
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/jobs/${slug}`);

        if (response.data.success) {
          setJobData(response.data.data);
        } else {
          setError('Failed to load job details');
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err.response?.data?.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchJobData();
    }
  }, [slug]);

  // Use the data from the correct nesting
  const actualPageData = pageDataProp || pageData || {};
  

  // Get banner data from page data
  const bannerData = actualPageData.bannerData;

  const sectionsToRender = (sectionConfig?.sections || [])
    .filter(section => section.enabled === true)
    .sort((a, b) => a.order - b.order);

  const renderSpecialComponent = (section) => {
    const { component, customProps = {} } = section;

    if (component === 'BannerSection' || component === 'PageBannerSection') {
      return (
        <BannerSection
          key={section.id}
          bannerData={bannerData}
          jobData={jobData}
          loading={loading}
          {...customProps}
        />
      );
    }
console.log(jobData);

    if (component === 'JobContentSection') {
      return (
        <JobContentSection
          key={section.id}
          jobData={jobData}
          storageUrl={storageUrl}
          loading={loading}
          bgColor={customProps.bgColor || 'bg-white'}
          paddingY={customProps.paddingY || 'py-12 lg:py-16'}
          paddingX={customProps.paddingX || 'px-4'}
          sectionClassName={customProps.sectionClassName || ''}
          sectionId={customProps.sectionId || 'job-content'}
        />
      );
    }

    return null;
  };

  const pageTitle = jobData?.title
    ? `${jobData.title} | DUS - Dwip Unnayan Society | Career Opportunities`
    : 'Job Details | DUS - Dwip Unnayan Society';

  // Show error state
  if (error) {
    return (
      <PublicLayout
        topBarData={topBarData}
        navbarData={navbarData}
        footerData={footerData}
        storageUrl={storageUrl}
      >
        <Head title="Job Not Found | DUS" />
        <div className="max-w-275 mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-[#080C14] mb-4">Job Not Found</h2>
          <p className="text-gray-600">{error}</p>
          <a href="/jobs" className="inline-block mt-6 bg-[#009BE2] text-white px-6 py-3 rounded-lg hover:bg-[#009BE2]/80 transition-colors">
            View All Jobs
          </a>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout
      topBarData={topBarData}
      navbarData={navbarData}
      footerData={footerData}
      storageUrl={storageUrl}
    >
      <Head title={pageTitle} />

      {sectionsToRender.map((section) => {
        if (section.isSpecialComponent ||
          section.component === 'BannerSection' ||
          section.component === 'JobContentSection' ||
          section.component === 'PageBannerSection') {
          return renderSpecialComponent(section);
        }
        return (
          <DynamicSectionRenderer
            key={section.id}
            section={section}
            pageData={actualPageData}
            globalProps={{ storageUrl }}
          />
        );
      })}
    </PublicLayout>
  );
};

export default JobsDetails;