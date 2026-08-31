// js/Sections/PublicationsSection/PublicationsSection.jsx

// React
import React, { useState } from 'react';

// Lucide Icons
import {
  ChevronDown,
  LayoutGrid,
  List,
  FileText,
  Download,
  Eye,
  User,
  Calendar
} from 'lucide-react';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * PublicationsSection Component
 * 
 * @param {Object} props
 * @param {Object|Array} props.data - Publications data from API (from DynamicSectionRenderer)
 * @param {Object|Array} props.publicationsData - Publications data from API (direct prop)
 * @param {Object} props.mainPublication - Main/featured publication (for featured layout)
 * @param {Array} props.publicationItems - Publication items array (for grid/list)
 * @param {string} props.sectionTitle - Section title (optional)
 * @param {boolean} props.isRelated - Whether this is a related publications section
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'publications-section')
 * 
 * @returns {JSX.Element} Rendered publications section
 */
const PublicationsSection = ({
  data,
  publicationsData,
  mainPublication = null,
  publicationItems = [],
  sectionTitle = null,
  isRelated = false,
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'publications-section',
}) => {
  // ============================================
  // HOOKS
  // ============================================
  const [viewMode, setViewMode] = useState('grid');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Newest');

  // Sort options
  const sortOptions = ['Newest', 'Oldest', 'Most Viewed', 'Least Viewed'];

  // ============================================
  // RESOLVE DATA
  // ============================================
  let resolvedData = publicationsData || data || [];

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  let resolvedMainPublication = mainPublication;
  let resolvedPublicationItems = publicationItems;
  let resolvedSectionTitle = sectionTitle;

  if (hasValue(resolvedData)) {
    if (resolvedData.data && typeof resolvedData.data === 'object') {
      resolvedData = resolvedData.data;
    }

    // If resolvedData is an array, use it as publication items
    if (Array.isArray(resolvedData)) {
      resolvedPublicationItems = resolvedData;

      // Find featured publication for main publication
      const featuredPub = resolvedData.find(pub => pub.is_featured === true || pub.is_featured === 1);
      if (featuredPub) {
        resolvedMainPublication = featuredPub;
      } else if (resolvedData.length > 0) {
        resolvedMainPublication = resolvedData[0];
      }
    } else if (typeof resolvedData === 'object') {
      // Extract main publication
      if (hasValue(resolvedData.mainPublication)) {
        resolvedMainPublication = resolvedData.mainPublication;
      } else if (hasValue(resolvedData.main)) {
        resolvedMainPublication = resolvedData.main;
      } else if (hasValue(resolvedData.featured)) {
        resolvedMainPublication = resolvedData.featured;
      }

      // Extract publication items
      if (Array.isArray(resolvedData.publicationItems)) {
        resolvedPublicationItems = resolvedData.publicationItems;
      } else if (Array.isArray(resolvedData.items)) {
        resolvedPublicationItems = resolvedData.items;
      } else if (Array.isArray(resolvedData.results)) {
        resolvedPublicationItems = resolvedData.results;
      } else if (Array.isArray(resolvedData.publications)) {
        resolvedPublicationItems = resolvedData.publications;
      }

      // Extract section title
      if (hasValue(resolvedData.sectionTitle)) {
        resolvedSectionTitle = resolvedData.sectionTitle;
      } else if (hasValue(resolvedData.title)) {
        resolvedSectionTitle = resolvedData.title;
      }
    }
  }

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const isRelatedSection = Boolean(isRelated);

  // For related sections, limit to 3 items and use grid layout
  if (isRelatedSection) {
    resolvedMainPublication = null;
    resolvedPublicationItems = Array.isArray(resolvedPublicationItems)
      ? resolvedPublicationItems.slice(0, 3)
      : [];
  }

  const hasMainPublication = !isRelatedSection && hasValue(resolvedMainPublication) &&
    hasValue(resolvedMainPublication.title) &&
    hasValue(resolvedMainPublication.image);

  const hasPublicationItems = hasValue(resolvedPublicationItems) && resolvedPublicationItems.length > 0;

  // If no publication data at all, don't render anything
  if (!hasMainPublication && !hasPublicationItems) {
    return null;
  }

  // ============================================
  // FORMAT DATE
  // ============================================
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleSortSelect = (option) => {
    setSelectedSort(option);
    setIsSortOpen(false);
  };

  // ============================================
  // GET DETAIL PAGE URL
  // ============================================
  const getDetailUrl = (publication) => {
    if (publication.slug) {
      return `/publications/${publication.slug}`;
    }
    if (publication.link) {
      return publication.link;
    }
    if (publication.id) {
      return `/publications/${publication.id}`;
    }
    return '#';
  };

  // ============================================
  // SORT PUBLICATIONS
  // ============================================
  const getSortedPublications = () => {
    const sorted = [...resolvedPublicationItems];
    if (isRelatedSection) {
      return sorted;
    }
    switch (selectedSort) {
      case 'Newest':
        return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'Oldest':
        return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'Most Viewed':
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'Least Viewed':
        return sorted.sort((a, b) => (a.views || 0) - (b.views || 0));
      default:
        return sorted;
    }
  };

  const sortedPublications = getSortedPublications();

  // ============================================
  // RENDER GRID VIEW
  // ============================================
  const renderGridView = () => (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-5 xl:gap-7.5 items-stretch ${hasMainPublication ? "pt-8 sm:pt-10 md:pt-12 lg:pt-15" : ""
        }`}
    >
      {sortedPublications.map((publication) => {
        if (hasMainPublication && resolvedMainPublication.id === publication.id) {
          return null;
        }

        return (
          <div
            key={publication.id}
            className="text-black flex h-full min-w-0 flex-col rounded-2xl bg-white p-4 sm:p-5 md:p-6 lg:p-5 xl:p-7.5 shadow-2xl transition-shadow duration-300 hover:shadow-3xl"
          >
            {hasValue(publication.image) && (
              <img
                src={publication.image}
                alt={publication.title || "Publication image"}
                className="mb-4 sm:mb-5 h-40 sm:h-48 md:h-56 lg:h-52 xl:h-62.5 w-full rounded-2xl object-cover object-center"
              />
            )}

            <div className="flex-1">
              {hasValue(publication.date) && (
                <p className="mb-1.5 sm:mb-2 text-[12px] sm:text-[13px] md:text-[14px] lg:text-[16px] font-normal text-[#009BE2]">
                  {formatDate(publication.date)}
                </p>
              )}

              {hasValue(publication.title) && (
                <h3 className="mb-3 sm:mb-4 md:mb-5 text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] xl:text-[32px] 2xl:text-[36px] font-semibold leading-tight">
                  {publication.title}
                </h3>
              )}

              {hasValue(publication.excerpt) && (
                <p className="text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[20px] font-normal text-gray-600 line-clamp-4">
                  {publication.excerpt}
                </p>
              )}
            </div>

            <div className="mt-5 sm:mt-6 md:mt-7 lg:mt-6 xl:mt-8 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8E8EB] px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] md:text-[14px] font-medium transition-colors hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  const url = getDetailUrl(publication);
                  if (url && url !== '#') {
                    window.location.href = url;
                  }
                }}
              >
                <FileText size={14} />
                <span>Explore Publication</span>
              </button>

              {hasValue(publication.pdf_url) && (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#009BE2] px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] md:text-[14px] font-medium text-[#009BE2] transition-colors hover:bg-[#009BE2] hover:text-white cursor-pointer"
                  onClick={() => window.open(publication.pdf_url, "_blank")}
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ============================================
  // RENDER LIST VIEW
  // ============================================
  const renderListView = () => (
    <div className={`text-black flex flex-col gap-4 sm:gap-5 md:gap-6 ${hasMainPublication ? 'pt-8 sm:pt-10 md:pt-12 lg:pt-15' : ''}`}>
      {sortedPublications.map((publication) => {
        if (hasMainPublication && resolvedMainPublication.id === publication.id) {
          return null;
        }

        return (
          <div key={publication.id} className='shadow-2xl p-4 sm:p-5 md:p-6 lg:p-7.5 rounded-2xl hover:shadow-3xl transition-shadow duration-300 bg-white flex flex-col md:flex-row gap-4 sm:gap-5 md:gap-6'>
            {hasValue(publication.image) && (
              <img
                src={publication.image}
                alt={publication.title || "Publication image"}
                className="w-full md:w-40 lg:w-48 xl:w-56 h-32 sm:h-40 md:h-44 lg:h-48 rounded-2xl object-cover shrink-0"
              />
            )}

            <div className="flex-1 flex flex-col justify-between">
              <div>
                {hasValue(publication.date) && (
                  <p className='font-normal text-[12px] sm:text-[13px] md:text-[14px] lg:text-[16px] text-[#009BE2] pb-1.5 sm:pb-2 block'>
                    {formatDate(publication.date)}
                  </p>
                )}

                {hasValue(publication.title) && (
                  <h3 className='font-semibold text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] xl:text-[26px] leading-snug pb-2 sm:pb-3'>
                    {publication.title}
                  </h3>
                )}

                {hasValue(publication.excerpt) && (
                  <p className='font-normal text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] line-clamp-3 text-gray-600'>
                    {publication.excerpt}
                  </p>
                )}

                <div className='flex items-center gap-2 sm:gap-3 md:gap-4 pt-2 sm:pt-3 flex-wrap'>
                  {hasValue(publication.author) && (
                    <>
                      <span className='flex items-center gap-1 text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] text-gray-500'>
                        <User size={14} />
                        {publication.author}
                      </span>
                    </>
                  )}
                  {hasValue(publication.views) && (
                    <>
                      {hasValue(publication.author) && <span className='text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] text-gray-500'>•</span>}
                      <span className='flex items-center gap-1 text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] text-gray-500'>
                        <Eye size={14} />
                        {publication.views} views
                      </span>
                    </>
                  )}
                  {hasValue(publication.readTime) && (
                    <>
                      {(hasValue(publication.author) || hasValue(publication.views)) && (
                        <span className='text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] text-gray-500'>•</span>
                      )}
                      <span className='flex items-center gap-1 text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] text-gray-500'>
                        <Calendar size={14} />
                        {publication.readTime}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
                <button
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-[#E8E8EB] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-medium flex items-center gap-1 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    const url = getDetailUrl(publication);
                    if (url && url !== '#') {
                      window.location.href = url;
                    }
                  }}
                >
                  <FileText size={14} />
                  <span>Explore</span>
                </button>
                {hasValue(publication.pdf_url) && (
                  <button
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-[#009BE2] text-[#009BE2] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-medium flex items-center gap-1 hover:bg-[#009BE2] hover:text-white transition-colors"
                    onClick={() => {
                      window.open(publication.pdf_url, '_blank');
                    }}
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {/* Section Title - Left aligned for related sections, otherwise left aligned */}
      {hasValue(resolvedSectionTitle) && isRelatedSection && (
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-15">
          <h2 className="text-[#080C14] font-extrabold text-[24px] sm:text-[28px] md:text-[32px] lg:text-[40px] xl:text-[44px] 2xl:text-[50px] leading-tight text-left">
            {resolvedSectionTitle}
          </h2>
        </div>
      )}

      {/* Publications Grid/List */}
      {hasPublicationItems && (
        <>
          {/* Filters Bar - Only show for main publications section, NOT for related */}
          {!isRelatedSection && (
            <div className={`flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 ${hasMainPublication ? 'pt-4 sm:pt-6 md:pt-8 lg:pt-10' : ''}`}>
              <h3 className='font-normal text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] xl:text-[20px]'>
                Showing all {sortedPublications.length} results
              </h3>
              <div className='flex items-center flex-wrap gap-2'>
                {/* Sort Section */}
                <div className='relative'>
                  <div
                    className='flex items-center cursor-pointer px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors'
                    onClick={() => setIsSortOpen(!isSortOpen)}
                  >
                    <p className='text-[#5D6174] text-[12px] sm:text-[13px] md:text-[14px] pr-2 hidden sm:block'>Sort by:</p>
                    <p className='text-[#171D38] font-medium text-[12px] sm:text-[13px] md:text-[14px] pr-2'>
                      {selectedSort}
                    </p>
                    <ChevronDown
                      size={14}
                      className={`text-[#747788] transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* Sort Dropdown */}
                  {isSortOpen && (
                    <div className='absolute top-full right-0 sm:left-0 mt-2 bg-white border border-[#E8E8EB] rounded-xl shadow-lg py-2 min-w-40 sm:min-w-45 md:min-w-50 z-10'>
                      {sortOptions.map((option) => (
                        <div
                          key={option}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] md:text-[14px] hover:bg-[#F6F6F7] cursor-pointer transition-colors ${selectedSort === option ? 'text-[#009BE2] font-medium' : 'text-[#171D38]'
                            }`}
                          onClick={() => handleSortSelect(option)}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* View Toggle */}
                <div className='px-1.5 sm:px-2 py-1 rounded-xl bg-[#F6F6F7] border border-[#E8E8EB] gap-1 flex items-center'>
                  <div
                    className={`p-2 sm:p-[10.5px] rounded-xl cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-[#009BE2]' : 'hover:bg-[#E8E8EB]'
                      }`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid
                      size={14}
                      color={viewMode === 'grid' ? 'white' : '#171D38'}
                    />
                  </div>
                  <div
                    className={`p-2 sm:p-[10.5px] rounded-xl cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-[#009BE2]' : 'hover:bg-[#E8E8EB]'
                      }`}
                    onClick={() => setViewMode('list')}
                  >
                    <List
                      size={15}
                      color={viewMode === 'list' ? 'white' : '#171D38'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content - Dynamic based on view mode */}
          {viewMode === 'grid' ? renderGridView() : renderListView()}

          {sortedPublications.length === 0 && (
            <div className='text-center py-10'>
              <p className='text-gray-500 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px]'>No publications found.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default PublicationsSection;