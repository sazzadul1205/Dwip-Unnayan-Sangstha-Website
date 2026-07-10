// resources/js/Sections/SectionIndex.jsx

import React from 'react';

// Import all section components
import HomeBanner from './BannerSection/HomeBanner';
import PageBannerSection from './BannerSection/PageBannerSection';
import PageTagBannerSection from './BannerSection/PageTagBannerSection';
import AboutUsSection from './AboutUsSection/AboutUsSection';
import OurActionSection from './OurActionSection/OurActionSection';
import WhereWeWorkSection from './WhereWeWorkSection/WhereWeWorkSection';
import OurProgramsSection from './OurProgramsSection/OurProgramsSection';
import StoriesSection from './StoriesSection/StoriesSection';
import BlogSection from './BlogSection/BlogSection';
import JobsSection from './JobsSection/JobsSection';
import ProgramImpactSection from './ProgramImpactSection/ProgramImpactSection';
import UpcomingEventsSection from './UpcomingEventsSection/UpcomingEventsSection';
import HeroFigureSection from './HeroFigureSection/HeroFigureSection';
import CardsSection from './CardsSection/CardsSection';
import FAQSection from './FAQSection/FAQSection';
import ContactOfficeSection from './ContactOfficeSection/ContactOfficeSection';
import AddressSection from './AddressSection/AddressSection';
import ContactReachSection from './ContactReachSection/ContactReachSection';
import FollowUSSection from './FollowUSSection/FollowUSSection';
import LegalSection from './LegalSection/LegalSection';
import PublicationsSection from './PublicationsSection/PublicationsSection';
import ImageGallerySection from './ImageGallerySection/ImageGallerySection';
import VideoGallerySection from './VideoGallerySection/VideoGallerySection';

// Import utilities
import { normalizeData } from '../utils/sectionHelpers';

// Component mapping
const sectionComponents = {
  HomeBanner,
  PageBannerSection,
  PageTagBannerSection,
  AboutUsSection,
  OurActionSection,
  WhereWeWorkSection,
  OurProgramsSection,
  StoriesSection,
  BlogSection,
  JobsSection,
  ProgramImpactSection,
  UpcomingEventsSection,
  HeroFigureSection,
  CardsSection,
  FAQSection,
  ContactOfficeSection,
  AddressSection,
  ContactReachSection,
  FollowUSSection,
  LegalSection,
  PublicationsSection,
  ImageGallerySection,
  VideoGallerySection,
};

/**
 * Extract section data from different data structures
 */
const extractSectionData = (section) => {
  if (!section) return null;

  // Get custom props
  const customProps = section.custom_props || {};

  // If section already has data directly
  if (section.data) {
    // For custom_section_data and shared_data, the actual data might be nested
    if (section.data_table === 'custom_section_data' || section.data_table === 'shared_data') {
      const extractedData = normalizeData(section.data);

      // Special handling for AboutUs
      if (section.component === 'AboutUsSection') {
        if (extractedData && (extractedData.section || extractedData.mission || extractedData.impact || extractedData.image)) {
          return { data: extractedData, customProps };
        }
        if (extractedData && typeof extractedData === 'object' && !Array.isArray(extractedData)) {
          return {
            data: {
              section: {
                title: extractedData.title || extractedData.section_title || 'About Us',
                description: extractedData.description || extractedData.section_description || '',
                button: {
                  text: extractedData.button_text || extractedData.cta_text || 'Learn More',
                  link: extractedData.button_link || extractedData.cta_link || '#'
                }
              },
              mission: {
                title: extractedData.mission_title || 'Our Mission',
                items: extractedData.mission_items || extractedData.missions || []
              },
              impact: {
                title: extractedData.impact_title || 'Our Impact',
                stats: extractedData.impact_stats || extractedData.stats || []
              },
              image: {
                src: extractedData.image || extractedData.image_url || '',
                alt: extractedData.image_alt || 'About us image'
              }
            },
            customProps
          };
        }
        return { data: extractedData, customProps };
      }

      // Special handling for Stories
      if (section.component === 'StoriesSection') {
        if (extractedData && (extractedData.section || extractedData.stories)) {
          return { data: extractedData, customProps };
        }
        if (Array.isArray(extractedData)) {
          return {
            data: {
              section: {
                title: 'Stories',
                description: ''
              },
              stories: extractedData
            },
            customProps
          };
        }
        return { data: extractedData, customProps };
      }

      return { data: extractedData, customProps };
    }

    // For about_content, return the data as is
    if (section.data_table === 'about_content') {
      const extractedData = normalizeData(section.data);
      if (extractedData && (extractedData.section || extractedData.mission || extractedData.impact)) {
        return { data: extractedData, customProps };
      }
      return { data: section.data, customProps };
    }

    // For blogs, programs, and stories data, the data is the array itself or has section + items
    if (section.data_table === 'blogs' || section.data_table === 'programs') {
      return { data: section.data, customProps };
    }

    // For stories (without data_table), return the data as is
    if (section.component === 'StoriesSection') {
      if (section.data && (section.data.section || section.data.stories)) {
        return { data: section.data, customProps };
      }
      if (Array.isArray(section.data)) {
        return {
          data: {
            section: {
              title: 'Stories',
              description: ''
            },
            stories: section.data
          },
          customProps
        };
      }
      return { data: section.data, customProps };
    }

    return { data: section.data, customProps };
  }

  // Check for old format - data might be in section.section_data
  if (section.section_data) {
    return { data: normalizeData(section.section_data), customProps };
  }

  // Check for custom section data
  if (section.custom_section_data) {
    return { data: normalizeData(section.custom_section_data), customProps };
  }

  // Check for shared section data
  if (section.shared_section_data) {
    return { data: normalizeData(section.shared_section_data), customProps };
  }

  return { data: null, customProps };
};

/**
 * Build props for each component type
 */
const buildComponentProps = (component, sectionData, section) => {
  // Start with custom props
  const props = {
    ...(section.custom_props || {}),
  };

  const componentName = section.component;
  const { data: extractedData, customProps } = sectionData;

  // Spread custom props explicitly for components that need them
  switch (componentName) {
    case 'HomeBanner':
      props.bannerData = extractedData;
      break;

    case 'PageBannerSection':
      props.bannerData = extractedData;
      break;

    case 'PageTagBannerSection':
      props.bannerData = extractedData;
      if (customProps.tags) props.tags = customProps.tags;
      if (customProps.activeTag) props.activeTag = customProps.activeTag;
      if (customProps.tagTitle) props.tagTitle = customProps.tagTitle;
      break;

    case 'AboutUsSection':
      props.aboutUsData = extractedData;
      break;

    case 'OurActionSection':
      props.actionData = extractedData;
      break;

    case 'WhereWeWorkSection':
      props.workData = extractedData;
      break;

    case 'OurProgramsSection':
      props.programsData = extractedData;
      // Pass custom props
      if (customProps.limit !== undefined) props.limit = customProps.limit;
      if (customProps.showFeatured !== undefined) props.showFeatured = customProps.showFeatured;
      if (customProps.showHeader !== undefined) props.showHeader = customProps.showHeader;
      break;

    case 'StoriesSection':
      props.storiesData = extractedData;
      break;

    case 'BlogSection':
      if (Array.isArray(extractedData) && extractedData.length > 0) {
        props.mainBlog = extractedData[0] || null;
        props.blogPosts = extractedData.slice(1) || [];
      } else {
        props.mainBlog = null;
        props.blogPosts = [];
      }
      if (customProps.sectionTitle) props.sectionTitle = customProps.sectionTitle;
      break;

    case 'PublicationsSection':
      if (Array.isArray(extractedData) && extractedData.length > 0) {
        const featuredPub = extractedData.find(pub => pub.is_featured === true || pub.is_featured === 1);
        if (featuredPub) {
          props.mainPublication = featuredPub;
          props.publicationItems = extractedData.filter(pub => pub.id !== featuredPub.id);
        } else {
          props.mainPublication = extractedData[0] || null;
          props.publicationItems = extractedData.slice(1) || [];
        }
      } else if (typeof extractedData === 'object' && extractedData !== null) {
        if (extractedData.mainPublication) props.mainPublication = extractedData.mainPublication;
        if (Array.isArray(extractedData.publicationItems)) {
          props.publicationItems = extractedData.publicationItems;
        } else if (Array.isArray(extractedData.items)) {
          props.publicationItems = extractedData.items;
        } else if (Array.isArray(extractedData.publications)) {
          props.publicationItems = extractedData.publications;
        }
      }
      if (customProps.sectionTitle) props.sectionTitle = customProps.sectionTitle;
      break;

    case 'ImageGallerySection':
      props.galleryData = extractedData;
      if (customProps.sectionTitle) props.sectionTitle = customProps.sectionTitle;
      if (customProps.imagesPerPage) props.imagesPerPage = customProps.imagesPerPage;
      if (customProps.imagesPerLoad) props.imagesPerLoad = customProps.imagesPerLoad;
      if (customProps.imageCountLabel) props.imageCountLabel = customProps.imageCountLabel;
      break;

    case 'VideoGallerySection':
      props.videoData = extractedData;
      if (customProps.sectionTitle) props.sectionTitle = customProps.sectionTitle;
      if (customProps.videosPerPage) props.videosPerPage = customProps.videosPerPage;
      if (customProps.videosPerLoad) props.videosPerLoad = customProps.videosPerLoad;
      if (customProps.videoCountLabel) props.videoCountLabel = customProps.videoCountLabel;
      break;

    case 'JobsSection':
      props.data = extractedData;
      // Pass custom props for JobsSection
      if (customProps.limit !== undefined) props.limit = customProps.limit;
      if (customProps.filterPlaceholder) props.filterPlaceholder = customProps.filterPlaceholder;
      break;

    case 'ProgramImpactSection':
      props.impactData = extractedData;
      break;

    case 'UpcomingEventsSection':
      props.eventsData = extractedData;
      break;

    case 'FAQSection':
      props.faqData = extractedData;
      break;

    case 'ContactOfficeSection':
      props.offices = Array.isArray(extractedData) ? extractedData : [];
      break;

    case 'AddressSection':
      props.officesLocation = Array.isArray(extractedData) ? extractedData : [];
      break;

    case 'ContactReachSection':
      if (Array.isArray(extractedData) && extractedData.length > 0) {
        const firstItem = extractedData[0] || {};
        props.image = firstItem.image || '';
        props.title = firstItem.title || 'Reach out to us today!';
        props.buttonText = firstItem.buttonText || 'Submit Message';
      } else if (typeof extractedData === 'object' && extractedData !== null) {
        props.image = extractedData.image || '';
        props.title = extractedData.title || 'Reach out to us today!';
        props.buttonText = extractedData.buttonText || 'Submit Message';
      } else {
        props.image = '';
        props.title = 'Reach out to us today!';
        props.buttonText = 'Submit Message';
      }
      break;

    case 'FollowUSSection':
      props.socialItems = Array.isArray(extractedData) ? extractedData : [];
      if (customProps.title) props.title = customProps.title;
      break;

    case 'LegalSection':
      props.legalData = extractedData;
      break;

    case 'HeroFigureSection':
      props.data = extractedData;
      break;

    case 'CardsSection':
      props.cardsData = extractedData;
      break;

    default:
      props.data = extractedData;
      break;
  }

  return props;
};

/**
 * SectionIndex Component - Main renderer
 */
const SectionIndex = ({ sections }) => {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <>
      {sections.map((section) => {
        const Component = sectionComponents[section.component];

        if (!Component) {
          console.warn(`No component found for: ${section.component}`);
          return null;
        }

        const sectionData = extractSectionData(section);
        const props = buildComponentProps(section.component, sectionData, section);

        return <Component key={section.id} {...props} />;
      })}
    </>
  );
};

export default SectionIndex;