// resources/js/pages/Backend/CMS/Sections/components/AddSectionModal.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
  FaTimes, FaPlus, FaSpinner, FaSearch, FaTag, FaDatabase, FaCode,
  FaInfoCircle, FaCheckCircle, FaExclamationCircle, FaLayerGroup,
  FaFileAlt, FaImages, FaVideo, FaBriefcase, FaNewspaper,
  FaQuestionCircle, FaCalendarAlt, FaHome, FaInfo, FaHands,
  FaMapMarkedAlt, FaUserFriends, FaAddressCard, FaPhoneAlt, FaGavel,
  FaChartBar, FaStar, FaThLarge,
} from 'react-icons/fa';
import { showToast } from '../utils/toastHelper';

const SECTION_ICONS = {
  BlogSection: FaNewspaper, OurProgramsSection: FaLayerGroup, FAQSection: FaQuestionCircle,
  UpcomingEventsSection: FaCalendarAlt, PublicationsSection: FaNewspaper, StoriesSection: FaUserFriends,
  HomeBanner: FaHome, PageBannerSection: FaInfo, PageTagBannerSection: FaTag,
  AboutUsSection: FaInfo, OurActionSection: FaHands, WhereWeWorkSection: FaMapMarkedAlt,
  HeroFigureSection: FaUserFriends, CardsSection: FaLayerGroup,
  ContactOfficeSection: FaAddressCard, AddressSection: FaMapMarkedAlt,
  ContactReachSection: FaPhoneAlt, JobsSection: FaBriefcase, FollowUSSection: FaUserFriends,
  LegalSection: FaGavel, ProgramImpactSection: FaChartBar, ImageGallerySection: FaImages,
  VideoGallerySection: FaVideo, TextContentSection: FaFileAlt, HtmlCssSection: FaCode,
};

// Same SECTION_OPTIONS map from your original file — unchanged
const SECTION_OPTIONS = {
  'BlogSection': { label: 'Blog Section', data_table: 'blogs', description: 'Display blog posts from the Blog Manager', isSpecial: true, category: 'content', badge: 'Dynamic', badgeColor: 'violet' },
  'OurProgramsSection': { label: 'Programs Section', data_table: 'programs', description: 'Display programs from the Program Manager', isSpecial: true, category: 'content', badge: 'Dynamic', badgeColor: 'violet' },
  'FAQSection': { label: 'FAQ Section', data_table: 'shared_data', description: 'Display frequently asked questions (Shared Data)', isSpecial: true, category: 'content', badge: 'Shared', badgeColor: 'emerald' },
  'UpcomingEventsSection': { label: 'Upcoming Events Section', data_table: 'shared_data', description: 'Display upcoming events and activities (Shared Data)', isSpecial: true, category: 'content', badge: 'Shared', badgeColor: 'emerald' },
  'TextContentSection': { label: 'Text Content Section', data_table: 'custom_section_data', description: 'Display rich text or HTML content from a custom section', isSpecial: false, category: 'content', badge: 'Custom', badgeColor: 'blue' },
  'PublicationsSection': { label: 'Publications Section', data_table: 'publications', description: 'Display publications from Publications Manager', isSpecial: true, category: 'content', badge: 'Dynamic', badgeColor: 'violet' },
  'StoriesSection': { label: 'Stories Section', data_table: 'shared_data', description: 'Display stories with images and descriptions (Shared Data)', isSpecial: true, category: 'content', badge: 'Shared', badgeColor: 'emerald' },
  'HomeBanner': { label: 'Home Banner', data_table: 'custom_section_data', description: 'Full-width hero banner with text, buttons, and background image', isSpecial: false, category: 'banner', badge: 'Custom', badgeColor: 'blue', isPopular: true },
  'PageBannerSection': { label: 'Page Banner', data_table: 'custom_section_data', description: 'Page header banner with title and description', isSpecial: false, category: 'banner', badge: 'Custom', badgeColor: 'blue' },
  'PageTagBannerSection': { label: 'Tag Banner', data_table: 'custom_section_data', description: 'Page header banner with tag filters and title', isSpecial: false, category: 'banner', badge: 'Custom', badgeColor: 'blue' },
  'AboutUsSection': { label: 'About Us Section', data_table: 'custom_section_data', description: 'About us with mission, vision, and impact statistics', isSpecial: false, category: 'content', badge: 'Custom', badgeColor: 'blue', isPopular: true },
  'OurActionSection': { label: 'Our Actions Section', data_table: 'custom_section_data', description: 'Grid of action items with icons and descriptions', isSpecial: false, category: 'content', badge: 'Custom', badgeColor: 'blue' },
  'WhereWeWorkSection': { label: 'Where We Work Section', data_table: 'custom_section_data', description: 'Statistics with map visualization', isSpecial: false, category: 'content', badge: 'Custom', badgeColor: 'blue' },
  'HeroFigureSection': { label: 'Hero with Figure', data_table: 'custom_section_data', description: 'Hero section with image and rich text content', isSpecial: false, category: 'banner', badge: 'Custom', badgeColor: 'blue' },
  'CardsSection': { label: 'Cards Section', data_table: 'custom_section_data', description: 'Cards with images, titles, and action buttons', isSpecial: false, category: 'content', badge: 'Custom', badgeColor: 'blue' },
  'ContactOfficeSection': { label: 'Contact Office Section', data_table: 'custom_section_data', description: 'Office locations with contact details and map', isSpecial: false, category: 'contact', badge: 'Custom', badgeColor: 'blue' },
  'AddressSection': { label: 'Address Section', data_table: 'custom_section_data', description: 'Addresses with map coordinates and contact info', isSpecial: false, category: 'contact', badge: 'Custom', badgeColor: 'blue' },
  'ContactReachSection': { label: 'Contact Reach Section', data_table: 'custom_section_data', description: 'Contact form with supporting image', isSpecial: false, category: 'contact', badge: 'Custom', badgeColor: 'blue' },
  'JobsSection': { label: 'Jobs Section', data_table: 'custom_section_data', description: 'Display job listings with custom title, description, and display limit', isSpecial: false, category: 'content', badge: 'Custom', badgeColor: 'blue' },
  'FollowUSSection': { label: 'Follow Us Section', data_table: 'custom_section_data', description: 'Social media links and follow buttons', isSpecial: false, category: 'contact', badge: 'Custom', badgeColor: 'blue' },
  'LegalSection': { label: 'Legal Section', data_table: 'custom_section_data', description: 'Legal status information with background image', isSpecial: false, category: 'content', badge: 'Custom', badgeColor: 'blue' },
  'ProgramImpactSection': { label: 'Program Impact Section', data_table: 'custom_section_data', description: 'Program impact statistics with SDG images', isSpecial: false, category: 'content', badge: 'Custom', badgeColor: 'blue' },
  'ImageGallerySection': { label: 'Image Gallery Section', data_table: 'custom_section_data', description: 'Image gallery with grid layout and lightbox', isSpecial: false, category: 'media', badge: 'Custom', badgeColor: 'blue' },
  'VideoGallerySection': { label: 'Video Gallery Section', data_table: 'custom_section_data', description: 'Video gallery with thumbnails and play functionality', isSpecial: false, category: 'media', badge: 'Custom', badgeColor: 'blue' },
  'HtmlCssSection': { label: 'HTML / CSS Section', data_table: 'custom_section_data', description: 'Write raw HTML and CSS — Tailwind classes are ignored, your own CSS is applied', isSpecial: false, category: 'content', badge: 'Custom', badgeColor: 'blue' },
};

const CATEGORY_LABELS = { banner: 'Banners', content: 'Content', contact: 'Contact', media: 'Media' };
const CATEGORY_TONES = {
  banner: 'bg-amber-50 text-amber-700 ring-amber-200',
  content: 'bg-blue-50 text-blue-700 ring-blue-200',
  contact: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  media: 'bg-violet-50 text-violet-700 ring-violet-200',
};

const BADGE_TONES = {
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
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

  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) setTimeout(() => searchInputRef.current.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    if (selectedComponent) {
      const base = selectedComponent
        .replace('Section', '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
        .replace(/-+/g, '-');
      setSuggestedKey(base);
      setSectionKey(base);
    }
  }, [selectedComponent]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedComponent('');
      setSectionKey('');
      setErrors({});
      setSearchQuery('');
      setSelectedCategory('all');
      setActiveTab('all');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  const filteredSections = useMemo(() => {
    let sections = Object.entries(SECTION_OPTIONS);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      sections = sections.filter(([key, opt]) =>
        opt.label.toLowerCase().includes(q) ||
        opt.description.toLowerCase().includes(q) ||
        key.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'all') sections = sections.filter(([, opt]) => opt.category === selectedCategory);
    if (activeTab === 'special') sections = sections.filter(([, opt]) => opt.isSpecial === true);
    else if (activeTab === 'custom') sections = sections.filter(([, opt]) => opt.isSpecial === false);
    return sections;
  }, [searchQuery, selectedCategory, activeTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    const option = SECTION_OPTIONS[selectedComponent];
    router.post(route('backend.cms.sections.store'), {
      page_id: pageId,
      component: selectedComponent,
      section_key: sectionKey,
      data_table: option.data_table,
      is_enabled: true,
      custom_props: {},
    }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setIsSubmitting(false);
        showToast('success', 'Created', 'Section created successfully.', 2000);
        onSuccess?.();
        onClose();
      },
      onError: (errs) => {
        setIsSubmitting(false);
        setErrors(errs);
        showToast('error', 'Creation Failed', errs.message || 'Please check the form.', 4000);
      },
    });
  };

  if (!isOpen) return null;

  const selectedOption = selectedComponent ? SECTION_OPTIONS[selectedComponent] : null;
  const SelectedIcon = selectedComponent ? (SECTION_ICONS[selectedComponent] || FaCode) : FaCode;
  const totalCount = Object.keys(SECTION_OPTIONS).length;
  const customCount = Object.values(SECTION_OPTIONS).filter((o) => !o.isSpecial).length;
  const specialCount = Object.values(SECTION_OPTIONS).filter((o) => o.isSpecial).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="flex max-h-screen w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl"
      >
        {/* Sticky header */}
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5">
          <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600 ring-1 ring-blue-100">
            <FaPlus size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-slate-800">Add Section</h2>
            <p className="truncate text-xs text-slate-500">Pick a section type to add to this page</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Search */}
            <div className="relative mb-4">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sections…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <FaTimes size={11} />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {[
                { key: 'all', label: 'All', count: totalCount, icon: null },
                { key: 'custom', label: 'Custom', count: customCount, icon: FaThLarge },
                { key: 'special', label: 'Special', count: specialCount, icon: FaStar },
              ].map(({ key, label, count, icon: Icon }) => {
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {Icon && <Icon size={11} />}
                    {label}
                    <span className={`rounded px-1.5 text-[10px] font-semibold ${active ? 'bg-blue-700/40 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>{count}</span>
                  </button>
                );
              })}

              {!searchQuery && (
                <>
                  <span className="mx-1 h-5 w-px bg-slate-200" />
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                    const count = Object.values(SECTION_OPTIONS).filter((o) => o.category === key).length;
                    const active = selectedCategory === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedCategory(active ? 'all' : key)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ring-1 ${active
                            ? CATEGORY_TONES[key]
                            : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        {label} <span className="font-semibold">{count}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Grid */}
            {filteredSections.length > 0 ? (
              <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {filteredSections.map(([key, opt]) => {
                  const isSelected = selectedComponent === key;
                  const Icon = SECTION_ICONS[key] || FaCode;
                  const badgeTone = BADGE_TONES[opt.badgeColor] ?? BADGE_TONES.blue;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setSelectedComponent(key); setErrors({}); }}
                      className={`group relative flex items-start gap-3 rounded-lg border p-3 text-left transition ${isSelected
                          ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-100/60'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      {opt.isPopular && (
                        <span className="absolute -top-1.5 -right-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          <FaStar size={7} /> Popular
                        </span>
                      )}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${isSelected
                          ? 'bg-blue-600 text-white ring-blue-600'
                          : 'bg-slate-100 text-slate-500 ring-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:ring-blue-100'
                        }`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                            {opt.label}
                          </span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ${badgeTone}`}>
                            {opt.badge}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{opt.description}</p>
                        <p className="mt-1 text-[10px] font-mono text-slate-400">{opt.data_table}</p>
                      </div>
                      {isSelected && <FaCheckCircle className="mt-0.5 shrink-0 text-blue-600" size={14} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 py-10 text-center">
                <p className="text-sm text-slate-500">No sections match your filters</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setActiveTab('all'); }}
                  className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {errors.component && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <FaExclamationCircle size={11} /> {errors.component}
              </p>
            )}

            {/* Selected details */}
            {selectedOption && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <SelectedIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-sm font-semibold text-slate-900">{selectedOption.label}</h4>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ${selectedOption.isSpecial ? BADGE_TONES.violet : BADGE_TONES.blue
                        }`}>
                        {selectedOption.isSpecial ? 'Special' : 'Custom'}
                      </span>
                      {selectedOption.data_table === 'shared_data' && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ${BADGE_TONES.emerald}`}>
                          Shared
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{selectedOption.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5">
                        <FaDatabase size={9} />
                        <code className="font-mono">{selectedOption.data_table}</code>
                      </span>
                      {selectedOption.isSpecial ? (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <FaExclamationCircle size={10} /> Data managed externally
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <FaCheckCircle size={10} /> Template data auto-generated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section key */}
            <div className="mt-4">
              <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
                Section Key <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-slate-400">(unique identifier)</span>
              </label>
              <div className="relative mt-1.5">
                <FaTag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input
                  type="text"
                  value={sectionKey}
                  onChange={(e) => setSectionKey(e.target.value)}
                  className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-16 text-sm font-mono text-slate-900 outline-none transition placeholder:text-slate-400 ${errors.section_key
                      ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100/60'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60'
                    }`}
                  placeholder="e.g., about-us, our-programs"
                  required
                />
                {sectionKey && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
                    {sectionKey.length}
                  </span>
                )}
              </div>
              {errors.section_key ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <FaExclamationCircle size={11} /> {errors.section_key}
                </p>
              ) : (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                  <span>Suggested:</span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">{suggestedKey || '—'}</code>
                  {suggestedKey && (
                    <button
                      type="button"
                      onClick={() => setSectionKey(suggestedKey)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Use
                    </button>
                  )}
                  <span className="text-slate-300">•</span>
                  <span>Locked after creation</span>
                </div>
              )}
            </div>

            {/* Info box */}
            {selectedOption && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-start gap-2.5">
                  <FaInfoCircle className="mt-0.5 shrink-0 text-slate-400" size={12} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">What happens next?</p>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                      {selectedOption.isSpecial ? (
                        <>
                          <li>▸ References existing data from <strong className="text-slate-800">{selectedOption.data_table}</strong></li>
                          <li>▸ No new data is created — edit the source directly</li>
                          {selectedOption.data_table === 'shared_data' && (
                            <li>▸ Changes reflect on every page using this shared data</li>
                          )}
                        </>
                      ) : (
                        <>
                          <li>▸ A new <strong className="text-slate-800">custom data entry</strong> will be created with a template</li>
                          <li>▸ You can customize the content in the section editor</li>
                          <li>▸ Images and content are managed within this section</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedComponent}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <><FaSpinner className="animate-spin" size={12} /> Creating…</>
              ) : (
                <><FaPlus size={12} /> Create Section</>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddSectionModal;