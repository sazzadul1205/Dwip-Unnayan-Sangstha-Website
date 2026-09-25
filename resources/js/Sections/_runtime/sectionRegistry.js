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
  HomeBanner: lazy(() => import('../BannerSection/HomeBanner')),
  PageBannerSection: lazy(() => import('../BannerSection/PageBannerSection')),
  PageTagBannerSection: lazy(() => import('../BannerSection/PageTagBannerSection')), // NEW
  
  // --- Common Sections ---
  FAQSection: lazy(() => import('../FAQSection/FAQSection')),
  BlogSection: lazy(() => import('../BlogSection/BlogSection')),
  JobsSection: lazy(() => import('../JobsSection/JobsSection')),
  CardsSection: lazy(() => import('../CardsSection/CardsSection')),
  LegalSection: lazy(() => import('../LegalSection/LegalSection')),
  AddressSection: lazy(() => import('../AddressSection/AddressSection')),
  AboutUsSection: lazy(() => import('../AboutUsSection/AboutUsSection')),
  StoriesSection: lazy(() => import('../StoriesSection/StoriesSection')),
  FollowUSSection: lazy(() => import('../FollowUSSection/FollowUSSection')),
  OurActionSection: lazy(() => import('../OurActionSection/OurActionSection')),
  HeroFigureSection: lazy(() => import('../HeroFigureSection/HeroFigureSection')),
  OurProgramsSection: lazy(() => import('../OurProgramsSection/OurProgramsSection')),
  WhereWeWorkSection: lazy(() => import('../WhereWeWorkSection/WhereWeWorkSection')),
  ContactReachSection: lazy(() => import('../ContactReachSection/ContactReachSection')),
  ContactOfficeSection: lazy(() => import('../ContactOfficeSection/ContactOfficeSection')),
  ProgramImpactSection: lazy(() => import('../ProgramImpactSection/ProgramImpactSection')),
  UpcomingEventsSection: lazy(() => import('../UpcomingEventsSection/UpcomingEventsSection')),
  TextContentSection: lazy(() => import('../TextContentSection/TextContentSection')),
  
  // --- Publications Section ---
  PublicationsSection: lazy(() => import('../PublicationsSection/PublicationsSection')),

  // --- Gallery Sections ---
  ImageGallerySection: lazy(() => import('../ImageGallerySection/ImageGallerySection')),
  VideoGallerySection: lazy(() => import('../VideoGallerySection/VideoGallerySection')),
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
