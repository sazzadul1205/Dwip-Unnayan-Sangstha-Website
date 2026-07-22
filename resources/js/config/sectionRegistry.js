// dus-frontend/src/config/sectionRegistry.js

/**
 * ============================================
 * SECTION REGISTRY - Lazy-Loaded Section Components
 * ============================================
 */

// React
import { lazy } from 'react';

// ============================================
// SECTION COMPONENT REGISTRY
// ============================================

export const SECTION_COMPONENTS = {
  // --- Banner Sections ---
  HomeBanner: lazy(() => import('../Sections/BannerSection/HomeBanner')),
  PageBannerSection: lazy(() => import('../Sections/BannerSection/PageBannerSection')),
  PageTagBannerSection: lazy(() => import('../Sections/BannerSection/PageTagBannerSection')), // NEW
  
  // --- Common Sections ---
  FAQSection: lazy(() => import('../Sections/FAQSection/FAQSection')),
  BlogSection: lazy(() => import('../Sections/BlogSection/BlogSection')),
  JobsSection: lazy(() => import('../Sections/JobsSection/JobsSection')),
  CardsSection: lazy(() => import('../Sections/CardsSection/CardsSection')),
  LegalSection: lazy(() => import('../Sections/LegalSection/LegalSection')),
  AddressSection: lazy(() => import('../Sections/AddressSection/AddressSection')),
  AboutUsSection: lazy(() => import('../Sections/AboutUsSection/AboutUsSection')),
  StoriesSection: lazy(() => import('../Sections/StoriesSection/StoriesSection')),
  FollowUSSection: lazy(() => import('../Sections/FollowUSSection/FollowUSSection')),
  OurActionSection: lazy(() => import('../Sections/OurActionSection/OurActionSection')),
  HeroFigureSection: lazy(() => import('../Sections/HeroFigureSection/HeroFigureSection')),
  OurProgramsSection: lazy(() => import('../Sections/OurProgramsSection/OurProgramsSection')),
  WhereWeWorkSection: lazy(() => import('../Sections/WhereWeWorkSection/WhereWeWorkSection')),
  ContactReachSection: lazy(() => import('../Sections/ContactReachSection/ContactReachSection')),
  ContactOfficeSection: lazy(() => import('../Sections/ContactOfficeSection/ContactOfficeSection')),
  ProgramImpactSection: lazy(() => import('../Sections/ProgramImpactSection/ProgramImpactSection')),
  UpcomingEventsSection: lazy(() => import('../Sections/UpcomingEventsSection/UpcomingEventsSection')),
  TextContentSection: lazy(() => import('../Sections/TextContentSection/TextContentSection')),
  
  // --- Publications Section ---
  PublicationsSection: lazy(() => import('../Sections/PublicationsSection/PublicationsSection')),

  // --- Gallery Sections ---
  ImageGallerySection: lazy(() => import('../Sections/ImageGallerySection/ImageGallerySection')),
  VideoGallerySection: lazy(() => import('../Sections/VideoGallerySection/VideoGallerySection')),
};

// ============================================
// SECTION CONFIGURATIONS
// ============================================

export const SECTION_CONFIGS = {
  // All sections use 'data' as the prop name
  FAQSection: { propName: 'data', isMultiProp: false },
  JobsSection: { propName: 'data', isMultiProp: false },
  HomeBanner: { propName: 'data', isMultiProp: false },
  PageBannerSection: { propName: 'data', isMultiProp: false },
  PageTagBannerSection: { propName: 'data', isMultiProp: false }, // NEW
  CardsSection: { propName: 'data', isMultiProp: false },
  LegalSection: { propName: 'data', isMultiProp: false },
  HeroFigureSection: { propName: 'data', isMultiProp: false },
  ContactReachSection: { propName: 'data', isMultiProp: false },
  AboutUsSection: { propName: 'data', isMultiProp: false },
  StoriesSection: { propName: 'data', isMultiProp: false },
  FollowUSSection: { propName: 'data', isMultiProp: false },
  OurActionSection: { propName: 'data', isMultiProp: false },
  WhereWeWorkSection: { propName: 'data', isMultiProp: false },
  ContactOfficeSection: { propName: 'data', isMultiProp: false },
  AddressSection: { propName: 'data', isMultiProp: false },
  ProgramImpactSection: { propName: 'data', isMultiProp: false },
  OurProgramsSection: { propName: 'data', isMultiProp: false },
  UpcomingEventsSection: { propName: 'data', isMultiProp: false },
  TextContentSection: { propName: 'data', isMultiProp: false },
  
  // BlogSection consumes a single data prop
  BlogSection: { propName: 'data', isMultiProp: false },
  
  // PublicationsSection consumes a single data prop
  PublicationsSection: { propName: 'data', isMultiProp: false },

  // ImageGallerySection consumes a single data prop
  ImageGallerySection: { propName: 'data', isMultiProp: false },

  // VideoGallerySection consumes a single data prop
  VideoGallerySection: { propName: 'data', isMultiProp: false },
};
