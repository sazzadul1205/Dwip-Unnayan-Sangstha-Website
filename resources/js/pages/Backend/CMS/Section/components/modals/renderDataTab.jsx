// resources/js/pages/Backend/CMS/Section/components/modals/RenderDataTab.jsx

import React, { lazy, Suspense } from 'react';

// ===== LAZY LOAD EDITORS =====
const FAQEditor = lazy(() => import('./Editors/FAQEditor'));
const JobsEditor = lazy(() => import('./Editors/JobsEditor'));
const BlogEditor = lazy(() => import('./Editors/BlogEditor'));
const CardsEditor = lazy(() => import('./Editors/CardsEditor'));
const LegalEditor = lazy(() => import('./Editors/LegalEditor'));
const AddressEditor = lazy(() => import('./Editors/AddressEditor'));
const ContentEditor = lazy(() => import('./Editors/ContentEditor'));
// StoriesEditor removed - now using Shared Data
const StoriesEditor = lazy(() => import('./Editors/StoriesEditor'));
const AboutUsEditor = lazy(() => import('./Editors/AboutUsEditor'));
const FollowUsEditor = lazy(() => import('./Editors/FollowUsEditor'));
const OurActionEditor = lazy(() => import('./Editors/OurActionEditor'));
const HeroFigureEditor = lazy(() => import('./Editors/HeroFigureEditor'));
const HomeBannerEditor = lazy(() => import('./Editors/HomeBannerEditor'));
const PageBannerEditor = lazy(() => import('./Editors/PageBannerEditor'));
const PageTagBannerEditor = lazy(() => import('./Editors/PageTagBannerEditor'));
const OurProgramsEditor = lazy(() => import('./Editors/OurProgramsEditor'));
const WhereWeWorkEditor = lazy(() => import('./Editors/WhereWeWorkEditor'));
const ContactReachEditor = lazy(() => import('./Editors/ContactReachEditor'));
const ProgramImpactEditor = lazy(() => import('./Editors/ProgramImpactEditor'));
const ContactOfficeEditor = lazy(() => import('./Editors/ContactOfficeEditor'));
const UpcomingEventsEditor = lazy(() => import('./Editors/UpcomingEventsEditor'));
const PublicationsEditor = lazy(() => import('./Editors/PublicationsEditor'));
const ImageGalleryEditor = lazy(() => import('./Editors/ImageGalleryEditor'));
const VideoGalleryEditor = lazy(() => import('./Editors/VideoGalleryEditor'));
const TextContentEditor = lazy(() => import('./Editors/TextContentEditor'));

// ===== LOADING COMPONENT =====
const EditorLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <p className="text-sm text-gray-500">Loading editor...</p>
    </div>
  </div>
);

// ===== EDITOR MAP =====
const EDITOR_COMPONENTS = {
  'FAQSection': FAQEditor,
  'JobsSection': JobsEditor,
  'BlogSection': BlogEditor,
  'CardsSection': CardsEditor,
  'LegalSection': LegalEditor,
  'HomeBanner': HomeBannerEditor,
  // 'StoriesSection' removed - now in SharedData
  'StoriesSection': StoriesEditor,
  'ContentSection': ContentEditor,
  'AddressSection': AddressEditor,
  'AboutUsSection': AboutUsEditor,
  'FollowUSSection': FollowUsEditor,
  'OurActionSection': OurActionEditor,
  'HeroFigureSection': HeroFigureEditor,
  'PageBannerSection': PageBannerEditor,
  'PageTagBannerSection': PageTagBannerEditor,
  'WhereWeWorkSection': WhereWeWorkEditor,
  'OurProgramsSection': OurProgramsEditor,
  'ContactReachSection': ContactReachEditor,
  'ContactOfficeSection': ContactOfficeEditor,
  'ProgramImpactSection': ProgramImpactEditor,
  'UpcomingEventsSection': UpcomingEventsEditor,
  'PublicationsSection': PublicationsEditor,
  'ImageGallerySection': ImageGalleryEditor,
  'VideoGallerySection': VideoGalleryEditor,
  'TextContentSection': TextContentEditor,
};

// ===== COMPONENT =====
const RenderDataTab = ({ section, hasData, onDataChange }) => {
  const EditorComponent = EDITOR_COMPONENTS[section.component];

  if (!EditorComponent) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No editable fields available for this section type</p>
          <p className="text-xs mt-1">Data viewer is available above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={<EditorLoader />}>
        <EditorComponent
          section={section}
          hasData={hasData}
          onDataChange={onDataChange}
        />
      </Suspense>
    </div>
  );
};
export default RenderDataTab;
