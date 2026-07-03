// js/Sections/JobsSection/JobsSection.jsx

// React
import React, { useState, useRef, useEffect } from 'react';

// React Icons
import { HiOutlineLocationMarker, HiOutlineSearch } from "react-icons/hi";
import { LuBriefcaseBusiness, LuClock4 } from "react-icons/lu";

// Arrow Icon
import ArrowIcon from '../../components/Shared/ArrowIcon';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * JobsSection Component
 * 
 * @param {Object} props
 * @param {Object|Array} props.data - Jobs data from API (from DynamicSectionRenderer)
 * @param {Object|Array} props.jobsData - Jobs data from API (direct prop)
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {number} props.maxJobs - Maximum number of jobs to display (default: 5)
 * 
 * @returns {JSX.Element} Rendered jobs section
 */
const JobsSection = ({
  data,
  jobsData,
  bgColor = 'bg-[#F5F5F5]',
  paddingY = 'py-12 sm:py-16 md:py-25 lg:py-37.5',
  paddingX = 'px-5 sm:px-10 md:px-20 lg:px-75',
  sectionClassName = '',
  maxJobs = 5,
}) => {
  // ============================================
  // HOOKS - Must be called before any conditional returns
  // ============================================
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // RESOLVE DATA
  // ============================================
  let resolvedData = data || jobsData;

  // console.log('JobsSection - resolvedData (raw):', resolvedData);

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  if (resolvedData && resolvedData.data && typeof resolvedData.data === 'object') {
    // console.log('JobsSection - Using nested data property');
    resolvedData = resolvedData.data;
  }

  // console.log('JobsSection - resolvedData after normalization:', resolvedData);

  // ============================================
  // HANDLE DIFFERENT DATA STRUCTURES
  // ============================================
  let section = {};
  let filter = {};
  let jobs = [];

  if (Array.isArray(resolvedData)) {
    // console.log('JobsSection - Data is an array of jobs');
    jobs = resolvedData;
    section = {
      title: 'Job Openings',
      description: 'Join our team and make a difference'
    };
    filter = {
      options: [
        { value: 'all', label: 'All Jobs' },
        { value: 'full-time', label: 'Full Time' },
        { value: 'part-time', label: 'Part Time' },
        { value: 'contract', label: 'Contract' },
        { value: 'internship', label: 'Internship' }
      ]
    };
  } else if (resolvedData && typeof resolvedData === 'object') {
    // console.log('JobsSection - Data is an object');

    if (resolvedData.filter && resolvedData.filter.options) {
      filter = resolvedData.filter;
      // console.log('JobsSection - Found filter.options:', filter.options);
    } else {
      filter = { options: [{ value: 'all', label: 'All Jobs' }] };
    }

    if (Array.isArray(resolvedData.jobs)) {
      jobs = resolvedData.jobs;
      // console.log('JobsSection - Found jobs array in jobs property');
    } else if (resolvedData.jobsData && Array.isArray(resolvedData.jobsData)) {
      jobs = resolvedData.jobsData;
      // console.log('JobsSection - Found jobs array in jobsData property');
    } else {
      let foundJobs = false;
      for (const key in resolvedData) {
        if (Array.isArray(resolvedData[key]) && resolvedData[key].length > 0) {
          const firstItem = resolvedData[key][0];
          if (firstItem && (firstItem.title || firstItem.description || firstItem.type)) {
            jobs = resolvedData[key];
            foundJobs = true;
            // console.log(`JobsSection - Found jobs in property: ${key}`);
            break;
          }
        }
      }
      if (!foundJobs) {
        console.warn('JobsSection - No jobs array found in data');
      }
    }

    if (resolvedData.section) {
      section = resolvedData.section;
      // console.log('JobsSection - Found section data:', section);
    }
  }

  // ============================================
  // GENERATE FILTER OPTIONS FROM JOBS
  // ============================================
  if ((!filter.options || filter.options.length <= 1) && jobs.length > 0) {
    // console.log('JobsSection - Generating filter options from jobs');
    const jobTypes = new Set();
    jobs.forEach(job => {
      if (job.type) {
        const type = job.type.toLowerCase().replace(" ", "-");
        jobTypes.add(type);
      }
    });

    filter.options = [{ value: 'all', label: 'All Jobs' }];
    jobTypes.forEach(type => {
      const label = type.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      filter.options.push({ value: type, label });
    });
    // console.log('JobsSection - Generated filter options:', filter.options);
  }

  // ============================================
  // EARLY RETURN - No data
  // ============================================
  if (!hasValue(jobs)) return null;

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasTitle = hasValue(section.title);
  const hasDescription = hasValue(section.description);
  const hasFilterOptions = hasValue(filter.options);
  const hasJobs = hasValue(jobs);

  const hasAnyContent = hasTitle || hasDescription || hasFilterOptions || hasJobs;

  if (!hasAnyContent) return null;

  // ============================================
  // SEARCH HANDLING
  // ============================================
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsSearchOpen(true);
  };

  const handleSearchSelect = (job) => {
    setSearchTerm(job.title);
    setIsSearchOpen(false);
    // Scroll to or highlight the job card
    const element = document.getElementById(`job-${job.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-[#009BE2]', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-[#009BE2]', 'ring-offset-2');
      }, 3000);
    }
  };

  // ============================================
  // FILTER JOBS
  // ============================================
  // Filter by type
  const typeFilteredJobs = selectedFilter === "" || selectedFilter === "all"
    ? jobs
    : jobs.filter(job => {
      const jobType = job.type?.toLowerCase().replace(" ", "-");
      return jobType === selectedFilter;
    });

  // Filter by search term
  const searchFilteredJobs = searchTerm.trim() === ""
    ? typeFilteredJobs
    : typeFilteredJobs.filter(job => {
      const searchLower = searchTerm.toLowerCase().trim();
      return (
        job.title?.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower) ||
        job.type?.toLowerCase().includes(searchLower) ||
        job.department?.toLowerCase().includes(searchLower) ||
        job.location?.toLowerCase().includes(searchLower)
      );
    });

  // Get search suggestions (max 5)
  const searchSuggestions = searchTerm.trim() !== "" && isSearchOpen
    ? searchFilteredJobs.slice(0, 5)
    : [];

  // console.log('JobsSection - Selected filter:', selectedFilter);
  // console.log('JobsSection - Search term:', searchTerm);
  // console.log('JobsSection - Filtered jobs count:', searchFilteredJobs.length);

  // Limit to maxJobs (5 by default)
  const displayedJobs = searchFilteredJobs.slice(0, maxJobs);
  const hasMoreJobs = searchFilteredJobs.length > maxJobs;

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id='jobs'
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {/* Header Section */}
      {(hasTitle || hasDescription || hasFilterOptions) && (
        <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center pb-8 sm:pb-10 lg:pb-15 flex-wrap gap-5'>

          {/* Left - Title and Description */}
          {(hasTitle || hasDescription) && (
            <div>
              {hasTitle && (
                <h1 className='bricolage-grotesque text-[#080C14] font-semibold text-[36px] pb-2.5'>
                  {section.title}
                </h1>
              )}
              {hasDescription && (
                <p className='bricolage-grotesque text-[#524B48] font-normal text-[16px] sm:text-[18px] lg:text-[20px]'>
                  {section.description}
                </p>
              )}
            </div>
          )}

          {/* Right - Search and Filter */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto'>
            {/* Search Box with Autocomplete */}
            <div className="relative w-full lg:min-w-80" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-4 py-3 sm:py-4 border border-[#A3A3A3] rounded-[14px] bg-white text-[14px] sm:text-[16px] font-400 text-[#515151] outline-none focus:border-[#009BE2] focus:ring-1 focus:ring-[#009BE2] transition-all duration-300"
                />
                <HiOutlineSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3] text-[18px] sm:text-[20px]" />
              </div>

              {/* Search Suggestions Dropdown */}
              {isSearchOpen && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                  {searchSuggestions.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleSearchSelect(job)}
                      className="w-full text-left px-4 py-3 hover:bg-[#F5F5F5] transition-colors duration-200 border-b border-[#F5F5F5] last:border-b-0"
                    >
                      <div className="font-500 text-[#080C14] text-[14px] sm:text-[16px]">
                        {job.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[12px] sm:text-[14px] text-[#524B48]">
                        {job.type && <span>{job.type}</span>}
                        {job.type && job.location && <span>•</span>}
                        {job.location && <span>{job.location}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results Message */}
              {isSearchOpen && searchTerm.trim() !== "" && searchSuggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 p-4 text-center text-[#524B48] text-[14px]">
                  No jobs found matching "{searchTerm}"
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Jobs List */}
      {hasJobs && (
        <div className='space-y-4 sm:space-y-5 lg:space-y-6'>
          {displayedJobs.map((job) => (
            <div
              key={job.id}
              id={`job-${job.id}`}
              className='bg-white p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl hover:shadow-lg transition-all duration-300'
            >
              <div className='flex flex-col md:flex-row items-start justify-between gap-5'>
                <div className='flex-1 w-full'>

                  {/* Job Meta Info (Type, Department, Location) */}
                  {(hasValue(job.type) || hasValue(job.department) || hasValue(job.location)) && (
                    <div className='flex items-center gap-2 sm:gap-3 text-[#524B48] text-[12px] sm:text-[14px] font-400 uppercase mb-3 flex-wrap'>

                      {/* Job Type */}
                      {hasValue(job.type) && (
                        <>
                          <p className='flex items-center gap-1 sm:gap-1.5'>
                            <LuClock4 className="text-[12px] sm:text-[14px]" />
                            {job.type}
                          </p>
                          {(hasValue(job.department) || hasValue(job.location)) && (
                            <span className='w-1 h-px bg-[#524B48] block' />
                          )}
                        </>
                      )}

                      {/* Department */}
                      {hasValue(job.department) && (
                        <>
                          <p className='flex items-center gap-1 sm:gap-1.5'>
                            <LuBriefcaseBusiness className="text-[12px] sm:text-[14px]" />
                            {job.department}
                          </p>
                          {hasValue(job.location) && (
                            <span className='w-1 h-px bg-[#524B48] block' />
                          )}
                        </>
                      )}

                      {/* Location */}
                      {hasValue(job.location) && (
                        <p className='flex items-center gap-1 sm:gap-1.5'>
                          <HiOutlineLocationMarker className="text-[12px] sm:text-[14px]" />
                          {job.location}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Job Title */}
                  {hasValue(job.title) && (
                    <h3 className='text-[#080C14] text-[22px] sm:text-[26px] md:text-[28px] lg:text-[32px] font-600 mb-2 sm:mb-3 leading-tight'>
                      {job.title}
                    </h3>
                  )}

                  {/* Job Description */}
                  {hasValue(job.description) && (
                    <p className='text-[#524B48] text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] font-400 leading-relaxed'>
                      {job.description}
                    </p>
                  )}
                </div>

                {/* Apply Button */}
                <div className='w-full md:w-auto mt-4 md:mt-0'>
                  <button
                    onClick={() => {
                      if (job.link) {
                        window.location.href = job.link;
                      }
                    }}
                    className="bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-5 sm:px-6 lg:px-7.5 py-3 sm:py-3.5 lg:py-4 font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center justify-center gap-2 sm:gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300 whitespace-nowrap w-full md:w-auto"
                  >
                    Apply Now
                    <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Show "View All" button if there are more jobs */}
          {hasMoreJobs && (
            <div className='text-center pt-4'>
              <button
                className="bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-6 sm:px-8 py-3 sm:py-4 font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center justify-center gap-2 group hover:bg-[#009BE2] hover:text-white transition-all duration-300"
                onClick={() => {
                  // Show all jobs or navigate to jobs page
                  setSearchTerm('');
                  setSelectedFilter('all');
                }}
              >
                View All Jobs ({searchFilteredJobs.length})
                <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </button>
            </div>
          )}

          {/* No Jobs Message */}
          {searchFilteredJobs.length === 0 && (
            <div className='bg-white p-8 sm:p-10 lg:p-12 rounded-2xl text-center'>
              <p className='text-[#515151] text-[16px] sm:text-[17px] lg:text-[18px] font-400'>
                No jobs found matching your search.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('all');
                }}
                className="mt-4 text-[#009BE2] font-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default JobsSection;