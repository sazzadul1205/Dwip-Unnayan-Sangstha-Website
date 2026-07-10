// js/Sections/JobsSection/JobsSection.jsx

// Inertia & React
import { Link } from '@inertiajs/react';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// React Icons
import { LuBriefcaseBusiness, LuClock4 } from "react-icons/lu";
import { HiOutlineLocationMarker, HiOutlineSearch } from "react-icons/hi";

// Axios
import axios from 'axios';

// Shared
import ArrowIcon from '../../Shared/ArrowIcon';

// Utils
import { hasValue } from '../../utils/sectionHelpers';

const JobsSection = ({
  data: propData,
  customProps = {},
  title: propTitle,
  description: propDescription,
  limit: propLimit,
  filterPlaceholder: propFilterPlaceholder,
  bgColor = 'bg-[#F5F5F5]',
  paddingY = 'py-12 sm:py-16 md:py-25 lg:py-37.5',
  paddingX = 'px-5 sm:px-10 md:px-20 lg:px-75',
  sectionClassName = '',
  apiEndpoint = '/api/jobs',
  apiParams = {},
  publicJobsRoute = '/seeker/jobs',
}) => {
  // ============================================
  // STATE
  // ============================================
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState([{ value: 'all', label: 'All Jobs' }]);

  // ============================================
  // REFS – HOLD THE LATEST VALUES WITHOUT TRIGGERING RE‑RENDERS
  // ============================================
  const searchRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const initialFetchDone = useRef(false);

  // Values that can change without causing a re‑fetch reference change
  const apiParamsRef = useRef(apiParams);
  const propDataRef = useRef(propData);
  const apiEndpointRef = useRef(apiEndpoint);
  const publicJobsRouteRef = useRef(publicJobsRoute);

  // Computed values (we'll update these refs whenever the corresponding props change)
  const limitRef = useRef(999);
  const shouldFetchAllRef = useRef(true);
  const effectiveLimitRef = useRef(null);
  const titleRef = useRef('Job Openings');
  const descriptionRef = useRef('Join our team and make a difference');
  const filterPlaceholderRef = useRef('Browse By');

  // ============================================
  // UPDATE REFS WHEN PROPS CHANGE (without triggering effects)
  // ============================================
  useEffect(() => {
    apiParamsRef.current = apiParams;
    propDataRef.current = propData;
    apiEndpointRef.current = apiEndpoint;
    publicJobsRouteRef.current = publicJobsRoute;

    // Compute limit values
    let lim = 999;
    if (customProps.limit !== undefined && customProps.limit !== null && customProps.limit !== '') {
      const val = parseInt(customProps.limit);
      if (!isNaN(val)) lim = val;
    } else if (propData?.data?.section?.limit !== undefined && propData?.data?.section?.limit !== null && propData?.data?.section?.limit !== '') {
      const val = parseInt(propData.data.section.limit);
      if (!isNaN(val)) lim = val;
    } else if (propLimit !== undefined && propLimit !== null && propLimit !== '') {
      const val = parseInt(propLimit);
      if (!isNaN(val)) lim = val;
    }
    limitRef.current = lim;
    shouldFetchAllRef.current = (lim === 999 || lim === 0);
    effectiveLimitRef.current = shouldFetchAllRef.current ? null : Math.max(1, lim);

    // Title, description, placeholder
    titleRef.current = customProps.title || propData?.data?.section?.title || propTitle || 'Job Openings';
    descriptionRef.current = customProps.description || propData?.data?.section?.description || propDescription || 'Join our team and make a difference';
    filterPlaceholderRef.current = customProps.filterPlaceholder || propData?.data?.filter?.placeholder || propFilterPlaceholder || 'Browse By';
  }, [customProps, propData, propTitle, propDescription, propLimit, propFilterPlaceholder, apiParams, apiEndpoint, publicJobsRoute]);

  // ============================================
  // CLOSE SEARCH DROPDOWN ON OUTSIDE CLICK
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
  // FETCH LOGIC (stable – no dependencies that change)
  // ============================================
  const fetchJobs = useCallback(async (params = {}) => {
    if (isFetchingRef.current) return; // prevent concurrent requests
    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Get latest values from refs
      const currentSearch = searchTerm; // closure captures latest state
      const currentFilter = selectedFilter;
      const endpoint = apiEndpointRef.current;
      const route = publicJobsRouteRef.current;
      const fetchAll = shouldFetchAllRef.current;
      const effLimit = effectiveLimitRef.current;
      const currentApiParams = apiParamsRef.current || {};

      const queryParams = new URLSearchParams();

      if (currentSearch.trim()) {
        queryParams.append('search', currentSearch.trim());
      }
      if (currentFilter && currentFilter !== 'all') {
        queryParams.append('job_type', currentFilter);
      }
      if (fetchAll) {
        queryParams.append('limit', 999);
        queryParams.append('all', 'true');
      } else {
        const maxLimit = Math.max(1, effLimit + 1);
        queryParams.append('limit', maxLimit);
      }

      Object.keys(currentApiParams).forEach(key => {
        if (currentApiParams[key] !== undefined && currentApiParams[key] !== null) {
          queryParams.append(key, currentApiParams[key]);
        }
      });
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      });

      const url = `${endpoint}?${queryParams.toString()}`;
      const response = await axios.get(url);

      let fetchedJobs = [];
      if (response.data?.data?.data) fetchedJobs = response.data.data.data || [];
      else if (response.data?.data) fetchedJobs = response.data.data || [];
      else if (Array.isArray(response.data)) fetchedJobs = response.data;
      else fetchedJobs = response.data?.jobs || [];

      if (!Array.isArray(fetchedJobs)) fetchedJobs = [];

      const mappedJobs = fetchedJobs.map(job => ({
        id: job.id,
        title: job.title || 'Untitled Position',
        description: job.description || job.requirements || 'No description available.',
        type: job.job_type || job.type || 'Full-time',
        department: job.department || job.category?.name || 'General',
        location: job.location || job.locations?.[0]?.name || 'Bangladesh',
        link: job.slug ? `${route}/${job.slug}` : `${route}/${job.id}`,
        slug: job.slug,
        views: job.views_count || 0,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        is_active: job.is_active,
        category: job.category,
        employer: job.employer,
      }));

      setJobs(mappedJobs);

      // Update filter options
      const types = new Set();
      mappedJobs.forEach(job => {
        if (job.type) {
          const type = job.type.toLowerCase().replace(/\s+/g, '-');
          types.add(type);
        }
      });
      const options = [{ value: 'all', label: 'All Jobs' }];
      types.forEach(type => {
        const label = type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        options.push({ value: type, label });
      });
      setFilterOptions(options);

    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load jobs');

      // Fallback to static data from propData
      const fallbackData = propDataRef.current;
      if (fallbackData) {
        let parsed = fallbackData;
        if (typeof fallbackData === 'string') {
          try { parsed = JSON.parse(fallbackData); } catch (e) {
            console.error('Error parsing fallback data:', e);
            /* empty */

          }
        }
        const findJobsArray = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj.jobs && Array.isArray(obj.jobs) && obj.jobs.length) return obj.jobs;
          for (const key in obj) {
            const result = findJobsArray(obj[key]);
            if (result) return result;
          }
          return null;
        };
        const fallbackJobs = findJobsArray(parsed);
        if (fallbackJobs && fallbackJobs.length) {
          const mapped = fallbackJobs.map(job => ({
            ...job,
            link: job.slug ? `${publicJobsRouteRef.current}/${job.slug}` : `${publicJobsRouteRef.current}/${job.id}`,
          }));
          setJobs(mapped);
          setError(null);
        }
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [searchTerm, selectedFilter]); // These are the only state variables that should trigger a new fetch

  // ============================================
  // DEBOUNCED FETCH ON SEARCH/FILTER CHANGE
  // ============================================
  useEffect(() => {
    // Skip on initial mount – we'll handle that separately
    if (!initialFetchDone.current) return;

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Schedule a new fetch with debounce (500ms)
    debounceTimerRef.current = setTimeout(() => {
      fetchJobs();
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, selectedFilter, fetchJobs]); // fetchJobs is stable (depends only on searchTerm and selectedFilter, which are included)

  // ============================================
  // INITIAL FETCH (runs once on mount)
  // ============================================
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchJobs();
    }
    // We intentionally don't include fetchJobs as a dependency because we want to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsSearchOpen(true);
  };

  const handleSearchSelect = (job) => {
    setSearchTerm(job.title);
    setIsSearchOpen(false);
    const el = document.getElementById(`job-${job.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#009BE2]', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-[#009BE2]', 'ring-offset-2'), 3000);
    }
  };

  // ============================================
  // DERIVED DATA
  // ============================================
  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) return jobs;
    const lower = searchTerm.toLowerCase().trim();
    return jobs.filter(job =>
      job.title?.toLowerCase().includes(lower) ||
      job.description?.toLowerCase().includes(lower) ||
      job.type?.toLowerCase().includes(lower) ||
      job.department?.toLowerCase().includes(lower) ||
      job.location?.toLowerCase().includes(lower)
    );
  }, [jobs, searchTerm]);

  const searchSuggestions = isSearchOpen && searchTerm.trim() !== '' ? filteredJobs.slice(0, 5) : [];

  const displayLimit = shouldFetchAllRef.current ? filteredJobs.length : Math.max(1, effectiveLimitRef.current);
  const displayedJobs = filteredJobs.slice(0, displayLimit);

  const title = titleRef.current;
  const description = descriptionRef.current;

  // ============================================
  // RENDER
  // ============================================
  return (
    <section id="jobs" className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}>
      {/* Header */}
      {(hasValue(title) || hasValue(description) || hasValue(filterOptions)) && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-8 sm:pb-10 lg:pb-15 flex-wrap gap-5">
          {(hasValue(title) || hasValue(description)) && (
            <div>
              {hasValue(title) && (
                <h1 className="bricolage-grotesque text-[#080C14] font-semibold text-[36px] pb-2.5">{title}</h1>
              )}
              {hasValue(description) && (
                <p className="bricolage-grotesque text-[#524B48] font-normal text-[16px] sm:text-[18px] lg:text-[20px]">
                  {description}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
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

              {isSearchOpen && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                  {searchSuggestions.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleSearchSelect(job)}
                      className="w-full text-left px-4 py-3 hover:bg-[#F5F5F5] transition-colors duration-200 border-b border-[#F5F5F5] last:border-b-0"
                    >
                      <div className="font-500 text-[#080C14] text-[14px] sm:text-[16px]">{job.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[12px] sm:text-[14px] text-[#524B48]">
                        {job.type && <span>{job.type}</span>}
                        {job.type && job.location && <span>•</span>}
                        {job.location && <span>{job.location}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isSearchOpen && searchTerm.trim() !== "" && searchSuggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 p-4 text-center text-[#524B48] text-[14px]">
                  No jobs found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && jobs.length === 0 && (
        <div className="flex items-center justify-center min-h-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#009BE2] border-t-transparent" />
            <p className="mt-4 text-[#524B48]">Loading jobs...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4">
          <p>Error loading jobs: {error}</p>
        </div>
      )}

      {/* No jobs */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#524B48] text-[18px]">No jobs available at the moment.</p>
        </div>
      )}

      {/* Jobs list */}
      {!loading && jobs.length > 0 && (
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          {displayedJobs.map((job) => (
            <div key={job.id} id={`job-${job.id}`} className="bg-white p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col md:flex-row items-start justify-between gap-5">
                <div className="flex-1 w-full">
                  {(hasValue(job.type) || hasValue(job.department) || hasValue(job.location)) && (
                    <div className="flex items-center gap-2 sm:gap-3 text-[#524B48] text-[12px] sm:text-[14px] font-400 uppercase mb-3 flex-wrap">
                      {hasValue(job.type) && (
                        <>
                          <p className="flex items-center gap-1 sm:gap-1.5">
                            <LuClock4 className="text-[12px] sm:text-[14px]" /> {job.type}
                          </p>
                          {(hasValue(job.department) || hasValue(job.location)) && (
                            <span className="w-1 h-px bg-[#524B48] block" />
                          )}
                        </>
                      )}
                      {hasValue(job.department) && (
                        <>
                          <p className="flex items-center gap-1 sm:gap-1.5">
                            <LuBriefcaseBusiness className="text-[12px] sm:text-[14px]" /> {job.department}
                          </p>
                          {hasValue(job.location) && <span className="w-1 h-px bg-[#524B48] block" />}
                        </>
                      )}
                      {hasValue(job.location) && (
                        <p className="flex items-center gap-1 sm:gap-1.5">
                          <HiOutlineLocationMarker className="text-[12px] sm:text-[14px]" /> {job.location}
                        </p>
                      )}
                    </div>
                  )}
                  {hasValue(job.title) && (
                    <h3 className="text-[#080C14] text-[22px] sm:text-[26px] md:text-[28px] lg:text-[32px] font-600 mb-2 sm:mb-3 leading-tight">
                      {job.title}
                    </h3>
                  )}
                  {hasValue(job.description) && (
                    <p className="text-[#524B48] text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] font-400 leading-relaxed">
                      {job.description}
                    </p>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <div className="mt-3 flex items-center gap-2 text-[#009BE2] font-500 text-[14px]">
                      {job.salary_min && job.salary_max && (
                        <span>${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}</span>
                      )}
                      {job.salary_min && !job.salary_max && <span>From ${job.salary_min.toLocaleString()}</span>}
                      {!job.salary_min && job.salary_max && <span>Up to ${job.salary_max.toLocaleString()}</span>}
                    </div>
                  )}
                </div>
                <div className="w-full md:w-auto mt-4 md:mt-0">
                  <Link
                    href={job.link}
                    className="bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-5 sm:px-6 lg:px-7.5 py-3 sm:py-3.5 lg:py-4 font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center justify-center gap-2 sm:gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300 whitespace-nowrap w-full md:w-auto"
                  >
                    Apply Now
                    <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && jobs.length > 0 && (
            <div className="bg-white p-8 sm:p-10 lg:p-12 rounded-2xl text-center">
              <p className="text-[#515151] text-[16px] sm:text-[17px] lg:text-[18px] font-400">
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

export default React.memo(JobsSection);