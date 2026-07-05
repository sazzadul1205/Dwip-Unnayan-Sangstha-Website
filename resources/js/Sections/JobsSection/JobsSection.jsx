// js/Sections/JobsSection/JobsSection.jsx

// React
import React, { useState, useRef, useEffect, useCallback } from 'react';

// React Icons
import { HiOutlineLocationMarker, HiOutlineSearch } from "react-icons/hi";
import { LuBriefcaseBusiness, LuClock4 } from "react-icons/lu";

// Axios
import axios from 'axios';

// Arrow Icon
import ArrowIcon from '../../components/Shared/ArrowIcon';
import { Link } from '@inertiajs/react';

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
 * @param {Object} data - Full custom section data containing section and jobs
 * @param {Object} customProps - Custom props from section configuration (includes limit, showAllText, showAllLink)
 * @param {string} title - Fallback title (optional)
 * @param {string} description - Fallback description (optional)
 * @param {number} limit - Number of jobs to display (if not provided, shows all) - DEPRECATED: use customProps.limit instead
 * @param {string} showAllText - Text for "View All" button - DEPRECATED: use customProps.showAllText instead
 * @param {string} showAllLink - Link for "View All" button - DEPRECATED: use customProps.showAllLink instead
 * @param {string} bgColor - Background color class
 * @param {string} paddingY - Vertical padding class
 * @param {string} paddingX - Horizontal padding class
 * @param {string} sectionClassName - Additional section classes
 * @param {string} apiEndpoint - API endpoint for fetching jobs
 * @param {Object} apiParams - Additional API parameters
 * @param {string} publicJobsRoute - Route prefix for job links (default: /backend/jobs)
 */
const JobsSection = ({
  data: propData,
  customProps = {},
  title: propTitle,
  description: propDescription,
  limit: propLimit,
  bgColor = 'bg-[#F5F5F5]',
  paddingY = 'py-12 sm:py-16 md:py-25 lg:py-37.5',
  paddingX = 'px-5 sm:px-10 md:px-20 lg:px-75',
  sectionClassName = '',
  apiEndpoint = '/api/jobs',
  apiParams = {},
  publicJobsRoute = '/backend/jobs',
}) => {
  // ============================================
  // ✅ HELPER: Parse data if it's a string
  // ============================================
  const parseData = useCallback((data) => {
    if (!data) return null;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.warn('Failed to parse data:', e);
        return null;
      }
    }
    return data;
  }, []);

  // ============================================
  // ✅ READ VALUES FROM NESTED DATA STRUCTURE
  // ============================================
  const parsedData = parseData(propData);

  // ✅ Get limit from propData?.data?.section?.limit
  const getLimit = useCallback(() => {
    // 1. Check customProps
    if (customProps.limit !== undefined && customProps.limit !== null && customProps.limit !== '') {
      const val = parseInt(customProps.limit);
      return isNaN(val) ? 999 : val;
    }

    // 2. Check propData?.data?.section?.limit (YOUR DATA STRUCTURE)
    if (propData?.data?.section?.limit !== undefined &&
      propData?.data?.section?.limit !== null &&
      propData?.data?.section?.limit !== '') {
      const val = parseInt(propData.data.section.limit);
      // If limit is 0, treat as "show all" (fetch 999)
      if (val === 0) {
        return 999;
      }
      return isNaN(val) ? 999 : val;
    }

    // 3. Check parsedData?.section?.limit (fallback for other structures)
    if (parsedData?.section?.limit !== undefined &&
      parsedData?.section?.limit !== null &&
      parsedData?.section?.limit !== '') {
      const val = parseInt(parsedData.section.limit);
      if (val === 0) {
        return 999;
      }
      return isNaN(val) ? 999 : val;
    }

    // 4. Check propLimit
    if (propLimit !== undefined && propLimit !== null && propLimit !== '') {
      const val = parseInt(propLimit);
      if (val === 0) {
        return 999;
      }
      return isNaN(val) ? 999 : val;
    }

    // 5. Default: 999 (show all)
    return 999;
  }, [customProps.limit, propData, parsedData, propLimit]);

  const getTitle = useCallback(() => {
    // 1. Check customProps
    if (customProps.title) return customProps.title;

    // 2. Check propData?.data?.section?.title
    if (propData?.data?.section?.title) return propData.data.section.title;

    // 3. Check parsedData?.section?.title
    if (parsedData?.section?.title) return parsedData.section.title;

    // 4. Check propTitle
    if (propTitle) return propTitle;

    // 5. Default
    return 'Job Openings';
  }, [customProps.title, propData, parsedData, propTitle]);

  const getDescription = useCallback(() => {
    // 1. Check customProps
    if (customProps.description) return customProps.description;

    // 2. Check propData?.data?.section?.description
    if (propData?.data?.section?.description) return propData.data.section.description;

    // 3. Check parsedData?.section?.description
    if (parsedData?.section?.description) return parsedData.section.description;

    // 4. Check propDescription
    if (propDescription) return propDescription;

    // 5. Default
    return 'Join our team and make a difference';
  }, [customProps.description, propData, parsedData, propDescription]);

  const getFilterPlaceholder = useCallback(() => {
    // 1. Check customProps
    if (customProps.filterPlaceholder) return customProps.filterPlaceholder;

    // 2. Check propData?.data?.filter?.placeholder
    if (propData?.data?.filter?.placeholder) return propData.data.filter.placeholder;

    // 3. Check parsedData?.filter?.placeholder
    if (parsedData?.filter?.placeholder) return parsedData.filter.placeholder;

    // 4. Default
    return 'Browse By';
  }, [customProps.filterPlaceholder, propData, parsedData]);

  // ============================================
  // ✅ COMPUTED VALUES
  // ============================================
  const limitValue = getLimit();
  // If limit is 999 or null/undefined, show all
  const shouldFetchAll = limitValue === null || limitValue === undefined || limitValue >= 999;
  // If limit is a specific number (like 5), use that
  const effectiveLimit = shouldFetchAll ? null : Math.max(1, limitValue);

  // ============================================
  // STATE
  // ============================================
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState([
    { value: 'all', label: 'All Jobs' }
  ]);
  const [sectionData, setSectionData] = useState({
    title: getTitle(),
    description: getDescription(),
    filterPlaceholder: getFilterPlaceholder()
  });

  const searchRef = useRef(null);
  const initialFetchDone = useRef(false);
  const debounceTimerRef = useRef(null);

  // ============================================
  // CLOSE SEARCH DROPDOWN
  // ============================================
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
  // HELPER: Recursively find section object in deeply nested data
  // ============================================
  const findSection = useCallback((obj) => {
    if (!obj || typeof obj !== 'object') return null;

    // If this object has a section with a title, return it
    if (obj.section && obj.section.title) {
      return obj.section;
    }

    // Recursively search through all properties
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        const result = findSection(obj[key]);
        if (result) return result;
      }
    }

    return null;
  }, []);

  // ============================================
  // HELPER: Recursively find jobs array in deeply nested data
  // ============================================
  const findJobsArray = useCallback((obj) => {
    if (!obj || typeof obj !== 'object') return null;

    // If this object has a jobs array with items, return it
    if (obj.jobs && Array.isArray(obj.jobs) && obj.jobs.length > 0) {
      return obj.jobs;
    }

    // Recursively search through all properties
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        const result = findJobsArray(obj[key]);
        if (result) return result;
      }
    }

    return null;
  }, []);

  // ============================================
  // PROCESS INCOMING DATA PROP
  // ============================================
  const processDataProp = useCallback((data) => {
    if (!data) return;

    let parsedData = data;

    // If data is a string, parse it
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.warn('Failed to parse data prop:', e);
        return;
      }
    }

    // Find the section object anywhere in the nested data
    const section = findSection(parsedData) || {};

    // Update section title/description
    setSectionData(prev => ({
      ...prev,
      title: section.title || prev.title,
      description: section.description || prev.description,
      filterPlaceholder: parsedData?.filter?.placeholder || prev.filterPlaceholder,
    }));
  }, [findSection]);

  // ============================================
  // FETCH JOBS FROM API
  // ============================================
  const fetchJobs = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();

      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      if (selectedFilter && selectedFilter !== 'all') {
        queryParams.append('job_type', selectedFilter);
      }

      // ✅ If shouldFetchAll is true, fetch all (999)
      // ✅ Otherwise, fetch limit + 1 to check if there are more
      if (shouldFetchAll) {
        // No limit - fetch all active jobs
        queryParams.append('limit', 999);
        queryParams.append('all', 'true');
      } else {
        // Fetch limit + 1 to check if there are more
        const maxLimit = Math.max(1, effectiveLimit + 1);
        queryParams.append('limit', maxLimit);
      }

      Object.keys(apiParams).forEach(key => {
        if (apiParams[key] !== undefined && apiParams[key] !== null) {
          queryParams.append(key, apiParams[key]);
        }
      });

      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      });

      const url = `${apiEndpoint}?${queryParams.toString()}`;

      const response = await axios.get(url);

      let fetchedJobs = [];

      // Handle different response structures
      if (response.data?.data?.data) {
        fetchedJobs = response.data.data.data || [];
      } else if (response.data?.data) {
        fetchedJobs = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        fetchedJobs = response.data;
      } else {
        fetchedJobs = response.data?.jobs || [];
      }

      if (!Array.isArray(fetchedJobs)) {
        fetchedJobs = [];
      }

      // Map API jobs to the expected format
      const mappedJobs = fetchedJobs.map(job => {
        // ✅ Build the link with /backend/jobs prefix
        let jobLink;
        if (job.slug) {
          jobLink = `${publicJobsRoute}/${job.slug}`;
        } else {
          jobLink = `${publicJobsRoute}/${job.id}`;
        }

        return {
          id: job.id,
          title: job.title || 'Untitled Position',
          description: job.description || job.requirements || 'No description available.',
          type: job.job_type || job.type || 'Full-time',
          department: job.department || job.category?.name || 'General',
          location: job.location || job.locations?.[0]?.name || 'Bangladesh',
          link: jobLink,
          slug: job.slug,
          views: job.views_count || 0,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          is_active: job.is_active,
          category: job.category,
          employer: job.employer,
        };
      });

      setJobs(mappedJobs);

      // Extract filter options from the fetched jobs
      const types = new Set();
      mappedJobs.forEach(job => {
        if (job.type) {
          const type = job.type.toLowerCase().replace(/\s+/g, '-');
          types.add(type);
        }
      });

      const options = [{ value: 'all', label: 'All Jobs' }];
      types.forEach(type => {
        const label = type.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        options.push({ value: type, label });
      });
      setFilterOptions(options);

    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load jobs');

      // Fallback to static jobs from prop data if API fails
      if (propData) {
        // Parse the prop data if it's a string
        let parsedPropData = propData;
        if (typeof propData === 'string') {
          try {
            parsedPropData = JSON.parse(propData);
          } catch (e) {
            console.warn('Failed to parse fallback data:', e);
          }
        }

        // Find jobs array anywhere in the nested data
        const fallbackJobs = findJobsArray(parsedPropData);

        if (fallbackJobs && Array.isArray(fallbackJobs) && fallbackJobs.length > 0) {
          // ✅ Map fallback jobs with correct links
          const mappedFallbackJobs = fallbackJobs.map(job => ({
            ...job,
            link: job.slug ? `${publicJobsRoute}/${job.slug}` : `${publicJobsRoute}/${job.id}`,
          }));
          setJobs(mappedFallbackJobs);
          setError(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedFilter, effectiveLimit, shouldFetchAll, apiEndpoint, apiParams, propData, findJobsArray, publicJobsRoute]);

  // ============================================
  // INITIAL FETCH
  // ============================================
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;

      // First, process the prop data to get section title/description
      if (propData) {
        processDataProp(propData);
      }

      // Then fetch jobs from API
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // RE-FETCH ON FILTER/SEARCH CHANGE - WITH DEBOUNCE
  // ============================================
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only fetch if initial fetch is done and we're not in the middle of initial load
    if (initialFetchDone.current && !loading) {
      debounceTimerRef.current = setTimeout(() => {
        fetchJobs();
      }, 500); // 500ms debounce
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedFilter]);

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
  // FILTER JOBS (Client-side filtering)
  // ============================================
  const getFilteredJobs = () => {
    let filtered = jobs;

    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(job => {
        return (
          job.title?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower) ||
          job.type?.toLowerCase().includes(searchLower) ||
          job.department?.toLowerCase().includes(searchLower) ||
          job.location?.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  };

  const filteredJobs = getFilteredJobs();
  const searchSuggestions = isSearchOpen && searchTerm.trim() !== ''
    ? filteredJobs.slice(0, 5)
    : [];

  // ============================================
  // DISPLAY JOBS
  // ============================================
  // ✅ If shouldFetchAll is true, show all jobs (no limit)
  // ✅ Otherwise, limit to effectiveLimit
  const maxJobs = shouldFetchAll ? filteredJobs.length : Math.max(1, effectiveLimit);
  const displayedJobs = shouldFetchAll ? filteredJobs : filteredJobs.slice(0, maxJobs);

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id='jobs'
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {/* Header Section - Always visible */}
      {(hasValue(sectionData.title) || hasValue(sectionData.description) || hasValue(filterOptions)) && (
        <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center pb-8 sm:pb-10 lg:pb-15 flex-wrap gap-5'>

          {/* Left - Title and Description */}
          {(hasValue(sectionData.title) || hasValue(sectionData.description)) && (
            <div>
              {hasValue(sectionData.title) && (
                <h1 className='bricolage-grotesque text-[#080C14] font-semibold text-[36px] pb-2.5'>
                  {sectionData.title}
                </h1>
              )}
              {hasValue(sectionData.description) && (
                <p className='bricolage-grotesque text-[#524B48] font-normal text-[16px] sm:text-[18px] lg:text-[20px]'>
                  {sectionData.description}
                </p>
              )}
            </div>
          )}

          {/* Right - Search */}
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

      {/* Loading State */}
      {loading && jobs.length === 0 && (
        <div className="flex items-center justify-center min-h-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#009BE2] border-t-transparent" />
            <p className="mt-4 text-[#524B48]">Loading jobs...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4">
          <p>Error loading jobs: {error}</p>
        </div>
      )}

      {/* No Jobs Available Message */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#524B48] text-[18px]">No jobs available at the moment.</p>
        </div>
      )}

      {/* Jobs List */}
      {!loading && jobs.length > 0 && (
        <div className='space-y-4 sm:space-y-5 lg:space-y-6'>
          {displayedJobs.map((job) => (
            <div
              key={job.id}
              id={`job-${job.id}`}
              className='bg-white p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl hover:shadow-lg transition-all duration-300'
            >
              <div className='flex flex-col md:flex-row items-start justify-between gap-5'>
                <div className='flex-1 w-full'>

                  {/* Job Meta Info */}
                  {(hasValue(job.type) || hasValue(job.department) || hasValue(job.location)) && (
                    <div className='flex items-center gap-2 sm:gap-3 text-[#524B48] text-[12px] sm:text-[14px] font-400 uppercase mb-3 flex-wrap'>

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

                  {/* Salary Info */}
                  {(job.salary_min || job.salary_max) && (
                    <div className="mt-3 flex items-center gap-2 text-[#009BE2] font-500 text-[14px]">
                      {job.salary_min && job.salary_max && (
                        <span>${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}</span>
                      )}
                      {job.salary_min && !job.salary_max && (
                        <span>From ${job.salary_min.toLocaleString()}</span>
                      )}
                      {!job.salary_min && job.salary_max && (
                        <span>Up to ${job.salary_max.toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                <div className='w-full md:w-auto mt-4 md:mt-0'>
                  <Link
                    href={`${job.link}`}
                    className="bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-5 sm:px-6 lg:px-7.5 py-3 sm:py-3.5 lg:py-4 font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center justify-center gap-2 sm:gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300 whitespace-nowrap w-full md:w-auto"
                  >
                    Apply Now
                    <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* No Jobs Found Message (when search returns no results) */}
          {filteredJobs.length === 0 && jobs.length > 0 && (
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