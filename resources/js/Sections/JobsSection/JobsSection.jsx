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

// ============================================
// SKELETON LOADING COMPONENTS
// ============================================

// Individual job skeleton card
const JobSkeletonCard = () => (
  <div className="bg-white p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl animate-pulse">
    <div className="flex flex-col md:flex-row items-start justify-between gap-5">
      <div className="flex-1 w-full">
        {/* Tags skeleton */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
          <div className="h-4 w-20 bg-gray-200 rounded-full" />
          <div className="h-4 w-px bg-gray-200" />
          <div className="h-4 w-24 bg-gray-200 rounded-full" />
          <div className="h-4 w-px bg-gray-200" />
          <div className="h-4 w-16 bg-gray-200 rounded-full" />
        </div>
        {/* Title skeleton */}
        <div className="h-8 bg-gray-200 rounded-lg mb-3 w-3/4" />
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
        {/* Salary skeleton */}
        <div className="mt-3 h-5 bg-gray-200 rounded w-40" />
      </div>
      <div className="w-full md:w-auto mt-4 md:mt-0">
        <div className="h-12 bg-gray-200 rounded-md w-full md:w-36" />
      </div>
    </div>
  </div>
);

// Multiple skeleton cards
const JobSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <JobSkeletonCard key={`skeleton-${index}`} />
      ))}
    </>
  );
};

// Loading more skeleton (shows 2 cards)
const LoadingMoreSkeleton = () => (
  <div className="space-y-4 sm:space-y-5 lg:space-y-6">
    <JobSkeletonCard />
    <JobSkeletonCard />
  </div>
);

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
  publicJobsRoute = '/backend/seeker/jobs',
  perPage = 10,
}) => {
  // ============================================
  // STATE
  // ============================================
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState([{ value: 'all', label: 'All Jobs' }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // ============================================
  // REFS
  // ============================================
  const searchRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const observerRef = useRef(null);
  const loadMoreDebounceRef = useRef(null);

  const apiParamsRef = useRef(apiParams);
  const propDataRef = useRef(propData);
  const apiEndpointRef = useRef(apiEndpoint);
  const publicJobsRouteRef = useRef(publicJobsRoute);
  const perPageRef = useRef(perPage);
  const displayLimitRef = useRef(999);
  const shouldFetchAllRef = useRef(true);

  const titleRef = useRef('Job Openings');
  const descriptionRef = useRef('Join our team and make a difference');
  const filterPlaceholderRef = useRef('Browse By');

  // ============================================
  // UPDATE REFS WHEN PROPS CHANGE
  // ============================================
  useEffect(() => {
    apiParamsRef.current = apiParams;
    propDataRef.current = propData;
    apiEndpointRef.current = apiEndpoint;
    publicJobsRouteRef.current = publicJobsRoute;
    perPageRef.current = perPage;

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

    displayLimitRef.current = lim;
    shouldFetchAllRef.current = (lim === 999 || lim === 0);

    titleRef.current = customProps.title || propData?.data?.section?.title || propTitle || 'Job Openings';
    descriptionRef.current = customProps.description || propData?.data?.section?.description || propDescription || 'Join our team and make a difference';
    filterPlaceholderRef.current = customProps.filterPlaceholder || propData?.data?.filter?.placeholder || propFilterPlaceholder || 'Browse By';
  }, [customProps, propData, propTitle, propDescription, propLimit, propFilterPlaceholder, apiParams, apiEndpoint, publicJobsRoute, perPage]);

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
  // FETCH JOBS
  // ============================================
  const fetchJobs = useCallback(async (params = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setJobs([]);

      const currentSearch = searchTerm;
      const currentFilter = selectedFilter;
      const endpoint = apiEndpointRef.current;
      const route = publicJobsRouteRef.current;
      const currentApiParams = apiParamsRef.current || {};
      const currentPerPage = perPageRef.current;
      const displayLimit = displayLimitRef.current;

      const queryParams = new URLSearchParams();

      if (currentSearch.trim()) {
        queryParams.append('search', currentSearch.trim());
      }
      if (currentFilter && currentFilter !== 'all') {
        queryParams.append('job_type', currentFilter);
      }

      const effectivePerPage = displayLimit < currentPerPage ? displayLimit : currentPerPage;
      queryParams.append('page', 1);
      queryParams.append('per_page', effectivePerPage);

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
      let meta = {};

      if (response.data?.success && Array.isArray(response.data?.data)) {
        fetchedJobs = response.data.data;
        meta = response.data.meta || {};
      } else if (response.data?.data && Array.isArray(response.data?.data)) {
        fetchedJobs = response.data.data;
        meta = response.data.meta || {};
      } else if (response.data?.data?.data && Array.isArray(response.data?.data?.data)) {
        fetchedJobs = response.data.data.data;
        meta = response.data.data.meta || {};
      } else if (Array.isArray(response.data)) {
        fetchedJobs = response.data;
      } else if (response.data?.jobs && Array.isArray(response.data?.jobs)) {
        fetchedJobs = response.data.jobs;
      } else {
        fetchedJobs = [];
      }

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

      const limitedJobs = mappedJobs.slice(0, displayLimit);
      setJobs(limitedJobs);

      if (displayLimit < 999 && limitedJobs.length >= displayLimit) {
        setHasMorePages(false);
      } else if (meta && meta.total !== undefined) {
        const currentPageNum = meta.current_page || 1;
        const lastPage = meta.last_page || 1;
        const hasMore = currentPageNum < lastPage && limitedJobs.length < displayLimit;
        setHasMorePages(hasMore);
      } else {
        setHasMorePages(fetchedJobs.length === currentPerPage && limitedJobs.length < displayLimit);
      }

      const types = new Set();
      limitedJobs.forEach(job => {
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
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      setInitialFetchDone(true);
    }
  }, [searchTerm, selectedFilter]);

  // ============================================
  // LOAD MORE JOBS
  // ============================================
  const loadMoreJobs = useCallback(async () => {
    if (isFetchingRef.current || loadingMore || !hasMorePages) return;

    const displayLimit = displayLimitRef.current;
    if (jobs.length >= displayLimit) {
      setHasMorePages(false);
      return;
    }

    const nextPage = currentPage + 1;
    setLoadingMore(true);
    isFetchingRef.current = true;

    try {
      const endpoint = apiEndpointRef.current;
      const currentSearch = searchTerm;
      const currentFilter = selectedFilter;
      const currentPerPage = perPageRef.current;

      const queryParams = new URLSearchParams();

      queryParams.append('page', nextPage);
      queryParams.append('per_page', currentPerPage);

      if (currentSearch.trim()) {
        queryParams.append('search', currentSearch.trim());
      }
      if (currentFilter && currentFilter !== 'all') {
        queryParams.append('job_type', currentFilter);
      }

      const currentApiParams = apiParamsRef.current || {};
      Object.keys(currentApiParams).forEach(key => {
        if (currentApiParams[key] !== undefined && currentApiParams[key] !== null) {
          queryParams.append(key, currentApiParams[key]);
        }
      });

      const url = `${endpoint}?${queryParams.toString()}`;
      const response = await axios.get(url);

      let fetchedJobs = [];
      let meta = {};

      if (response.data?.success && Array.isArray(response.data?.data)) {
        fetchedJobs = response.data.data;
        meta = response.data.meta || {};
      } else if (response.data?.data && Array.isArray(response.data?.data)) {
        fetchedJobs = response.data.data;
        meta = response.data.meta || {};
      } else if (response.data?.data?.data && Array.isArray(response.data?.data?.data)) {
        fetchedJobs = response.data.data.data;
        meta = response.data.data.meta || {};
      } else if (Array.isArray(response.data)) {
        fetchedJobs = response.data;
      } else if (response.data?.jobs && Array.isArray(response.data?.jobs)) {
        fetchedJobs = response.data.jobs;
      } else {
        fetchedJobs = [];
      }

      if (!Array.isArray(fetchedJobs)) fetchedJobs = [];

      if (fetchedJobs.length === 0) {
        setHasMorePages(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
        return;
      }

      const mappedJobs = fetchedJobs.map(job => ({
        id: job.id,
        title: job.title || 'Untitled Position',
        description: job.description || job.requirements || 'No description available.',
        type: job.job_type || job.type || 'Full-time',
        department: job.department || job.category?.name || 'General',
        location: job.location || job.locations?.[0]?.name || 'Bangladesh',
        link: job.slug ? `${publicJobsRouteRef.current}/${job.slug}` : `${publicJobsRouteRef.current}/${job.id}`,
        slug: job.slug,
        views: job.views_count || 0,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        is_active: job.is_active,
        category: job.category,
        employer: job.employer,
      }));

      const allJobs = [...jobs, ...mappedJobs];
      const limitedJobs = allJobs.slice(0, displayLimit);

      setJobs(limitedJobs);
      setCurrentPage(nextPage);

      if (limitedJobs.length >= displayLimit) {
        setHasMorePages(false);
      } else if (meta && meta.total !== undefined) {
        const lastPage = meta.last_page || 1;
        const hasMore = nextPage < lastPage;
        setHasMorePages(hasMore);
      } else {
        setHasMorePages(fetchedJobs.length === currentPerPage);
      }

    } catch (err) {
      console.error('Error loading more jobs:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load more jobs');
      setHasMorePages(false);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [currentPage, hasMorePages, loadingMore, searchTerm, selectedFilter, jobs]);

  // ============================================
  // INFINITE SCROLL - Intersection Observer
  // ============================================
  useEffect(() => {
    if (jobs.length === 0 || !hasMorePages || loading || loadingMore) return;

    const displayLimit = displayLimitRef.current;
    if (jobs.length >= displayLimit) {
      setHasMorePages(false);
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const jobElements = document.querySelectorAll('[data-job-id]');
    if (jobElements.length === 0) return;

    const lastElement = jobElements[jobElements.length - 1];

    if (loadMoreDebounceRef.current) {
      clearTimeout(loadMoreDebounceRef.current);
      loadMoreDebounceRef.current = null;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (loadMoreDebounceRef.current) {
          clearTimeout(loadMoreDebounceRef.current);
        }

        if (entries[0].isIntersecting && hasMorePages && !loadingMore && !isFetchingRef.current) {
          loadMoreDebounceRef.current = setTimeout(() => {
            if (jobs.length >= displayLimitRef.current) {
              setHasMorePages(false);
              loadMoreDebounceRef.current = null;
              return;
            }
            loadMoreJobs();
            loadMoreDebounceRef.current = null;
          }, 300);
        }
      },
      {
        root: null,
        rootMargin: '0px 0px 200px 0px',
        threshold: 0.1,
      }
    );

    observerRef.current.observe(lastElement);

    return () => {
      if (loadMoreDebounceRef.current) {
        clearTimeout(loadMoreDebounceRef.current);
        loadMoreDebounceRef.current = null;
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [jobs, hasMorePages, loading, loadingMore, loadMoreJobs]);

  // ============================================
  // DEBOUNCED FETCH ON SEARCH/FILTER CHANGE
  // ============================================
  useEffect(() => {
    if (!initialFetchDone) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchJobs();
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, selectedFilter, fetchJobs, initialFetchDone]);

  // ============================================
  // INITIAL FETCH
  // ============================================
  useEffect(() => {
    if (!initialFetchDone) {
      fetchJobs();
    }
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

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setIsSearchOpen(false);
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

  const displayLimit = displayLimitRef.current;
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
            {filterOptions.length > 1 && (
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-4 border border-[#A3A3A3] rounded-[14px] bg-white text-[14px] sm:text-[16px] font-400 text-[#515151] outline-none focus:border-[#009BE2] focus:ring-1 focus:ring-[#009BE2] transition-all duration-300 appearance-none pr-10"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-[#A3A3A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}

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

      {/* Skeleton Loading - Initial Load */}
      {loading && jobs.length === 0 && (
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          <JobSkeleton count={3} />
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
          {displayedJobs.map((job, index) => (
            <div
              key={job.id || `job-${index}`}
              id={`job-${job.id}`}
              data-job-id={job.id}
              className="bg-white p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl hover:shadow-lg transition-all duration-300"
            >
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
                    <p className="text-[#524B48] text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] font-400 leading-relaxed line-clamp-3">
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

          {/* Loading More - Skeleton */}
          {loadingMore && (
            <div className="pt-2">
              <LoadingMoreSkeleton />
            </div>
          )}

          {/* No More Jobs Message */}
          {!loadingMore && !hasMorePages && jobs.length > 0 && (
            <div className="text-center py-8">
              <p className="text-[#524B48] text-[14px]">
                {jobs.length >= displayLimitRef.current
                  ? `Showing ${displayLimitRef.current} jobs (display limit reached)`
                  : "You've reached the end of the list"}
              </p>
            </div>
          )}

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