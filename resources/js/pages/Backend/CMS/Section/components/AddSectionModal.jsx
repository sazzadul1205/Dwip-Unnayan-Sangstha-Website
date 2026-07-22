 
// resources/js/pages/Backend/CMS/Section/components/AddSectionModal.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
  FaTimes,
  FaPlus,
  FaSpinner,
  FaSearch,
  FaTag,
  FaDatabase,
  FaCode,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLayerGroup,
  FaFileAlt,
  FaImages,
  FaVideo,
  FaBriefcase,
  FaNewspaper,
  FaQuestionCircle,
  FaCalendarAlt,
  FaHome,
  FaInfo,
  FaHands,
  FaMapMarkedAlt,
  FaUserFriends,
  FaAddressCard,
  FaPhoneAlt,
  FaGavel,
  FaChartBar,
  FaStar,
  FaThLarge,
} from 'react-icons/fa';
import { showToast } from '../utils/toastHelper';

// Icon mapping for section types
const SECTION_ICONS = {
  'BlogSection': FaNewspaper,
  'OurProgramsSection': FaLayerGroup,
  'FAQSection': FaQuestionCircle,
  'UpcomingEventsSection': FaCalendarAlt,
  'ContentSection': FaFileAlt,
  'PublicationsSection': FaNewspaper,
  'StoriesSection': FaUserFriends,
  'HomeBanner': FaHome,
  'PageBannerSection': FaInfo,
  'PageTagBannerSection': FaTag,
  'AboutUsSection': FaInfo,
  'OurActionSection': FaHands,
  'WhereWeWorkSection': FaMapMarkedAlt,
  'HeroFigureSection': FaUserFriends,
  'CardsSection': FaLayerGroup,
  'ContactOfficeSection': FaAddressCard,
  'AddressSection': FaMapMarkedAlt,
  'ContactReachSection': FaPhoneAlt,
  'JobsSection': FaBriefcase,
  'FollowUSSection': FaUserFriends,
  'LegalSection': FaGavel,
  'ProgramImpactSection': FaChartBar,
  'ImageGallerySection': FaImages,
  'VideoGallerySection': FaVideo,
  'TextContentSection': FaFileAlt,
};

const SECTION_OPTIONS = {
  // ============================================
  // SPECIAL SECTIONS (use external data tables)
  // ============================================
  'BlogSection': {
    label: 'Blog Section',
    data_table: 'blogs',
    description: 'Display blog posts from the Blog Manager',
    isSpecial: true,
    category: 'content',
    badge: 'Dynamic',
    badgeColor: 'purple'
  },
  'OurProgramsSection': {
    label: 'Programs Section',
    data_table: 'programs',
    description: 'Display programs from the Program Manager',
    isSpecial: true,
    category: 'content',
    badge: 'Dynamic',
    badgeColor: 'purple'
  },
  'FAQSection': {
    label: 'FAQ Section',
    data_table: 'shared_data',
    description: 'Display frequently asked questions (Shared Data)',
    isSpecial: true,
    category: 'content',
    badge: 'Shared',
    badgeColor: 'green'
  },
  'UpcomingEventsSection': {
    label: 'Upcoming Events Section',
    data_table: 'shared_data',
    description: 'Display upcoming events and activities (Shared Data)',
    isSpecial: true,
    category: 'content',
    badge: 'Shared',
    badgeColor: 'green'
  },
  'ContentSection': {
    label: 'Dynamic Content Section',
    data_table: 'about_content',
    description: 'Display dynamic content from About Content Manager',
    isSpecial: true,
    category: 'content',
    badge: 'Dynamic',
    badgeColor: 'purple'
  },
  'TextContentSection': {
    label: 'Text Content Section',
    data_table: 'custom_section_data',
    description: 'Display rich text or HTML content from a custom section',
    isSpecial: false,
    category: 'content',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'PublicationsSection': {
    label: 'Publications Section',
    data_table: 'publications',
    description: 'Display publications from Publications Manager',
    isSpecial: true,
    category: 'content',
    badge: 'Dynamic',
    badgeColor: 'purple'
  },
  'StoriesSection': {
    label: 'Stories Section',
    data_table: 'shared_data',
    description: 'Display stories with images and descriptions (Shared Data)',
    isSpecial: true,
    category: 'content',
    badge: 'Shared',
    badgeColor: 'green'
  },

  // ============================================
  // CUSTOM DATA SECTIONS (create custom_section_data entries)
  // ============================================
  'HomeBanner': {
    label: 'Home Banner',
    data_table: 'custom_section_data',
    description: 'Full-width hero banner with text, buttons, and background image',
    isSpecial: false,
    category: 'banner',
    badge: 'Custom',
    badgeColor: 'blue',
    isPopular: true
  },
  'PageBannerSection': {
    label: 'Page Banner',
    data_table: 'custom_section_data',
    description: 'Page header banner with title and description',
    isSpecial: false,
    category: 'banner',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'PageTagBannerSection': {
    label: 'Tag Banner',
    data_table: 'custom_section_data',
    description: 'Page header banner with tag filters and title',
    isSpecial: false,
    category: 'banner',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'AboutUsSection': {
    label: 'About Us Section',
    data_table: 'custom_section_data',
    description: 'About us with mission, vision, and impact statistics',
    isSpecial: false,
    category: 'content',
    badge: 'Custom',
    badgeColor: 'blue',
    isPopular: true
  },
  'OurActionSection': {
    label: 'Our Actions Section',
    data_table: 'custom_section_data',
    description: 'Grid of action items with icons and descriptions',
    isSpecial: false,
    category: 'content',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'WhereWeWorkSection': {
    label: 'Where We Work Section',
    data_table: 'custom_section_data',
    description: 'Statistics with map visualization',
    isSpecial: false,
    category: 'content',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'HeroFigureSection': {
    label: 'Hero with Figure',
    data_table: 'custom_section_data',
    description: 'Hero section with image and rich text content',
    isSpecial: false,
    category: 'banner',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'CardsSection': {
    label: 'Cards Section',
    data_table: 'custom_section_data',
    description: 'Cards with images, titles, and action buttons',
    isSpecial: false,
    category: 'content',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'ContactOfficeSection': {
    label: 'Contact Office Section',
    data_table: 'custom_section_data',
    description: 'Office locations with contact details and map',
    isSpecial: false,
    category: 'contact',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'AddressSection': {
    label: 'Address Section',
    data_table: 'custom_section_data',
    description: 'Addresses with map coordinates and contact info',
    isSpecial: false,
    category: 'contact',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'ContactReachSection': {
    label: 'Contact Reach Section',
    data_table: 'custom_section_data',
    description: 'Contact form with supporting image',
    isSpecial: false,
    category: 'contact',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'JobsSection': {
    label: 'Jobs Section',
    data_table: 'custom_section_data',
    description: 'Display job listings with custom title, description, and display limit',
    isSpecial: false,
    category: 'content',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'FollowUSSection': {
    label: 'Follow Us Section',
    data_table: 'custom_section_data',
    description: 'Social media links and follow buttons',
    isSpecial: false,
    category: 'contact',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'LegalSection': {
    label: 'Legal Section',
    data_table: 'custom_section_data',
    description: 'Legal status information with background image',
    isSpecial: false,
    category: 'content',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'ProgramImpactSection': {
    label: 'Program Impact Section',
    data_table: 'custom_section_data',
    description: 'Program impact statistics with SDG images',
    isSpecial: false,
    category: 'content',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'ImageGallerySection': {
    label: 'Image Gallery Section',
    data_table: 'custom_section_data',
    description: 'Image gallery with grid layout and lightbox',
    isSpecial: false,
    category: 'media',
    badge: 'Custom',
    badgeColor: 'blue'
  },
  'VideoGallerySection': {
    label: 'Video Gallery Section',
    data_table: 'custom_section_data',
    description: 'Video gallery with thumbnails and play functionality',
    isSpecial: false,
    category: 'media',
    badge: 'Custom',
    badgeColor: 'blue'
  },
};

const CATEGORY_LABELS = {
  banner: 'Banners & Hero Sections',
  content: 'Content Sections',
  contact: 'Contact & Social',
  media: 'Media & Gallery',
};

const CATEGORY_ICONS = {
  banner: '🎨',
  content: '📄',
  contact: '📞',
  media: '🎬',
};

const CATEGORY_COLORS = {
  banner: 'from-yellow-50 to-yellow-100 border-yellow-200',
  content: 'from-blue-50 to-blue-100 border-blue-200',
  contact: 'from-green-50 to-green-100 border-green-200',
  media: 'from-purple-50 to-purple-100 border-purple-200',
};

const AddSectionModal = ({ isOpen, onClose, pageId, onSuccess }) => {
  const [selectedComponent, setSelectedComponent] = useState('');
  const [sectionKey, setSectionKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [suggestedKey, setSuggestedKey] = useState('');
  const [isHovered, setIsHovered] = useState(null);

  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Generate suggested section key
  useEffect(() => {
    if (selectedComponent) {
      const baseKey = selectedComponent
        .replace('Section', '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
        .replace(/-+/g, '-');
      setSuggestedKey(baseKey);
      setSectionKey(baseKey);
    }
  }, [selectedComponent]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedComponent('');
      setSectionKey('');
      setErrors({});
      setSearchQuery('');
      setSelectedCategory('all');
      setActiveTab('all');
      setIsSubmitting(false);
      setIsHovered(null);
    }
  }, [isOpen]);

  // Filter sections based on search, category, and tab
  const filteredSections = useMemo(() => {
    let sections = Object.entries(SECTION_OPTIONS);

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      sections = sections.filter(([key, opt]) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description.toLowerCase().includes(query) ||
        key.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      sections = sections.filter(([, opt]) => opt.category === selectedCategory);
    }

    // Filter by tab
    if (activeTab === 'special') {
      sections = sections.filter(([, opt]) => opt.isSpecial === true);
    } else if (activeTab === 'custom') {
      sections = sections.filter(([, opt]) => opt.isSpecial === false);
    }

    return sections;
  }, [searchQuery, selectedCategory, activeTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const option = SECTION_OPTIONS[selectedComponent];

    const data = {
      page_id: pageId,
      component: selectedComponent,
      section_key: sectionKey,
      data_table: option.data_table,
      is_enabled: true,
      custom_props: {}
    };

    router.post(
      route('backend.cms.sections.store'),
      data,
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setIsSubmitting(false);
          showToast('success', '✅ Created!', 'Section created successfully.', 2000);
          if (onSuccess) onSuccess();
          onClose();
        },
        onError: (errors) => {
          setIsSubmitting(false);
          setErrors(errors);
          const errorMessage = errors.message || 'Failed to create section.';
          showToast('error', '❌ Creation Failed', errorMessage, 4000);
        },
      }
    );
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Get badge color classes
  const getBadgeClasses = (badgeColor) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-700',
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      red: 'bg-red-100 text-red-700',
    };
    return colors[badgeColor] || colors.blue;
  };

  if (!isOpen) return null;

  const selectedOption = selectedComponent ? SECTION_OPTIONS[selectedComponent] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-slideUp"
      >
        {/* Header - Enhanced with gradient accent */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <FaPlus className="text-white text-lg" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-gray-900">Add New Section</h2>
              <p className="text-sm text-gray-500 mt-0.5">Choose a section type to add to this page</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Search Bar - Enhanced */}
          <div className="relative mb-5">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections by name or description..."
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 hover:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>

          {/* Filter Tabs - Enhanced with better styling */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 font-medium ${activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All ({Object.keys(SECTION_OPTIONS).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 font-medium flex items-center gap-1.5 ${activeTab === 'custom'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <FaThLarge size={12} />
              Custom ({Object.values(SECTION_OPTIONS).filter(opt => !opt.isSpecial).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('special')}
              className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 font-medium flex items-center gap-1.5 ${activeTab === 'special'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <FaStar size={12} />
              Special ({Object.values(SECTION_OPTIONS).filter(opt => opt.isSpecial).length})
            </button>

            {/* Category Filter */}
            {!searchQuery && (
              <>
                <span className="w-px bg-gray-300 mx-2" />
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                  const count = Object.values(SECTION_OPTIONS).filter(opt => opt.category === key).length;
                  const isActive = selectedCategory === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === key ? 'all' : key)}
                      className={`px-3 py-2 text-sm rounded-xl transition-all duration-200 ${isActive
                          ? `bg-linear-to-r ${CATEGORY_COLORS[key]} text-gray-800 shadow-sm`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      {CATEGORY_ICONS[key]} {label} ({count})
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Section Type Grid - Enhanced */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Section Type <span className="text-red-500">*</span>
            </label>

            {filteredSections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1 custom-scrollbar">
                {filteredSections.map(([key, opt]) => {
                  const isSelected = selectedComponent === key;
                  const Icon = SECTION_ICONS[key] || FaCode;
                  const isHoveredState = isHovered === key;
                  const badgeClasses = getBadgeClasses(opt.badgeColor);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedComponent(key);
                        setErrors({});
                      }}
                      onMouseEnter={() => setIsHovered(key)}
                      onMouseLeave={() => setIsHovered(null)}
                      className={`group relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100 scale-[1.02]'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-md'
                        } ${isHoveredState && !isSelected ? 'border-blue-200 bg-gray-50' : ''}`}
                    >
                      {/* Popular badge */}
                      {opt.isPopular && (
                        <span className="absolute -top-2 -right-2 bg-linear-to-r from-yellow-400 to-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                          <FaStar className="inline mr-0.5" size={8} />
                          Popular
                        </span>
                      )}

                      <div className={`p-2.5 rounded-xl shrink-0 transition-all duration-200 ${isSelected
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'
                            }`}>
                            {opt.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeClasses}`}>
                            {opt.badge}
                          </span>
                          {opt.isSpecial && opt.data_table === 'shared_data' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                              ♻️ Shared
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{opt.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                          📊 {opt.data_table}
                        </p>
                      </div>
                      {isSelected && (
                        <FaCheckCircle className="text-blue-600 shrink-0 mt-1 animate-scaleIn" size={18} />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-500">No sections found matching your filters</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setActiveTab('all');
                  }}
                  className="text-blue-600 hover:underline text-sm mt-2 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {errors.component && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <FaExclamationTriangle size={12} />
                {errors.component}
              </p>
            )}
          </div>

          {/* Selected Section Details - Enhanced */}
          {selectedOption && (
            <div className="mb-5 p-5 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-md">
                  {selectedComponent && React.createElement(SECTION_ICONS[selectedComponent] || FaCode, {
                    className: "text-blue-600 text-2xl"
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-800 text-lg">{selectedOption.label}</h4>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${selectedOption.isSpecial
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                      }`}>
                      {selectedOption.isSpecial ? '⭐ Special' : '📝 Custom'}
                    </span>
                    {selectedOption.data_table === 'shared_data' && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                        ♻️ Shared
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{selectedOption.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-lg">
                      <FaDatabase size={12} className="text-blue-500" />
                      <code className="font-mono">{selectedOption.data_table}</code>
                    </span>
                    {selectedOption.isSpecial ? (
                      <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                        <FaExclamationTriangle size={12} />
                        Data managed externally
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        <FaCheckCircle size={12} />
                        Auto-generates template data
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Key - Enhanced */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Section Key <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 font-normal ml-2">(unique identifier)</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaTag size={14} />
              </div>
              <input
                type="text"
                value={sectionKey}
                onChange={(e) => setSectionKey(e.target.value)}
                className={`w-full pl-9 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.section_key ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="e.g., about-us, our-programs, banner"
                required
              />
              {sectionKey && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">
                  {sectionKey.length} chars
                </div>
              )}
            </div>
            {errors.section_key ? (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <FaExclamationTriangle size={12} />
                {errors.section_key}
              </p>
            ) : (
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <span className="text-gray-400">💡 Suggested:</span>
                <code className="px-2 py-0.5 bg-gray-100 rounded font-mono">{suggestedKey}</code>
                <button
                  type="button"
                  onClick={() => setSectionKey(suggestedKey)}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Use this
                </button>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">Cannot be changed later</span>
              </div>
            )}
          </div>

          {/* Info Box - Enhanced */}
          {selectedOption && (
            <div className="mb-5 p-5 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-gray-200 rounded-lg text-gray-600">
                  <FaInfoCircle size={16} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-700">What happens next?</h4>
                  <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                    {selectedOption.isSpecial ? (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">▸</span>
                          <span>The section will reference existing data from <strong className="text-gray-800">{selectedOption.data_table}</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">▸</span>
                          <span>No new data will be created - edit the source data directly</span>
                        </li>
                        {selectedOption.data_table === 'shared_data' && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">▸</span>
                            <span>Changes will reflect on all pages using this shared data</span>
                          </li>
                        )}
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">▸</span>
                          <span>A new <strong className="text-gray-800">custom data entry</strong> will be created with pre-filled template</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">▸</span>
                          <span>You can customize the content after creation in the section editor</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">▸</span>
                          <span>Images and content can be managed directly in this section</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions - Enhanced */}
          <div className="flex items-center justify-end gap-3 pt-5 mt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedComponent}
              className={`px-7 py-2.5 rounded-xl text-white transition-all duration-200 flex items-center gap-2 font-medium ${isSubmitting || !selectedComponent
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02]'
                }`}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FaPlus size={14} />
                  Create Section
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Add custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AddSectionModal; 
