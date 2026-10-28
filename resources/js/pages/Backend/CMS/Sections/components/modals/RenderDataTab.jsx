// resources/js/pages/Backend/CMS/Sections/components/modals/RenderDataTab.jsx

import { lazy, Suspense } from 'react';

// Shared generic redirect notice
import ExternalManagerRedirect from '../../../../../../Shared/SectionEditor/ExternalManagerRedirect';

// ===== LAZY LOAD EDITORS =====

// Banner Editors
const HomeBannerEditor = lazy(() => import('../../../../../../Sections/BannerSection/HomeBanner/HomeBannerEditor'));
const PageBannerEditor = lazy(() => import('../../../../../../Sections/BannerSection/PageBannerSection/PageBannerEditor'));
const PageTagBannerEditor = lazy(() => import('../../../../../../Sections/BannerSection/PageTagBannerSection/PageTagBannerEditor'));

// Blog Editors
const BlogEditor = lazy(() => import('../../../../../../Sections/BlogSection/BlogEditor'));

// Address Editors
const AddressEditor = lazy(() => import('../../../../../../Sections/AddressSection/AddressEditor'));

// About Us Editors
const AboutUsEditor = lazy(() => import('../../../../../../Sections/AboutUsSection/AboutUsEditor'));

// Cards Editors
const CardsEditor = lazy(() => import('../../../../../../Sections/CardsSection/CardsEditor'));

// Contact Office Editors
const ContactOfficeEditor = lazy(() => import('../../../../../../Sections/ContactOfficeSection/ContactOfficeEditor'));

// Contact Reach Editors
const ContactReachEditor = lazy(() => import('../../../../../../Sections/ContactReachSection/ContactReachEditor'));

// FAQ Editors
const FAQEditor = lazy(() => import('../../../../../../Sections/FAQSection/FAQEditor'));

// Follow Us Editors
const FollowUsEditor = lazy(() => import('../../../../../../Sections/FollowUSSection/FollowUsEditor'));

// Hero Figure Editors
const HeroFigureEditor = lazy(() => import('../../../../../../Sections/HeroFigureSection/HeroFigureEditor'));

// HTML & CSS Editors
const HtmlCssEditor = lazy(() => import('../../../../../../Sections/HtmlCssSection/HtmlCssEditor'));

// Image Gallery Editors
const ImageGalleryEditor = lazy(() => import('../../../../../../Sections/ImageGallerySection/ImageGalleryEditor'));

const JobsEditor = lazy(() => import('../../../../../../Sections/JobsSection/JobsEditor'));
const LegalEditor = lazy(() => import('../../../../../../Sections/LegalSection/LegalEditor'));
const OurActionEditor = lazy(() => import('../../../../../../Sections/OurActionSection/OurActionEditor'));

const OurProgramsEditor = lazy(() => import('../../../../../../Sections/OurProgramsSection/OurProgramsEditor'));
const WhereWeWorkEditor = lazy(() => import('../../../../../../Sections/WhereWeWorkSection/WhereWeWorkEditor'));
const ProgramImpactEditor = lazy(() => import('../../../../../../Sections/ProgramImpactSection/ProgramImpactEditor'));
const PublicationsEditor = lazy(() => import('../../../../../../Sections/PublicationsSection/PublicationsEditor'));
const VideoGalleryEditor = lazy(() => import('../../../../../../Sections/VideoGallerySection/VideoGalleryEditor'));
const TextContentEditor = lazy(() => import('../../../../../../Sections/TextContentSection/TextContentEditor'));

// ===== SHARED DATA NOTICE =====
// Some section types don't have a local form: their data lives in the
// Shared Data Manager so it can be reused across pages. This notice
// points users to where they can actually edit.
const SHARED_DATA_SECTIONS = {
  StoriesSection: {
    icon: '📖',
    label: 'Stories',
    description:
      'Stories are managed centrally so they can be reused across pages. Add, edit, or remove them from the Shared Data Manager.',
  },
  UpcomingEventsSection: {
    icon: '📅',
    label: 'Upcoming Events',
    description:
      'Events are managed centrally so they can be reused across pages. Add, edit, or remove them from the Shared Data Manager.',
  },
};

const SharedDataNotice = ({ section }) => {
  const info = SHARED_DATA_SECTIONS[section.component];
  if (!info) return null;

  return (
    <ExternalManagerRedirect
      variant="notice"
      heading={`${info.icon} ${info.label} are managed in the Shared Data Manager`}
      description={info.description}
      actionLabel="Go to Shared Data Manager"
      actionHref={route('backend.cms.shared.index')}
    />
  );
};

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
  // Local form editors (each editor has its own file)
  'FAQSection': FAQEditor,
  'JobsSection': JobsEditor,
  'BlogSection': BlogEditor,
  'CardsSection': CardsEditor,
  'LegalSection': LegalEditor,
  'HomeBanner': HomeBannerEditor,
  'AddressSection': AddressEditor,
  'AboutUsSection': AboutUsEditor,
  'FollowUSSection': FollowUsEditor,
  'OurActionSection': OurActionEditor,
  HeroFigureEditor,
  'PageBannerSection': PageBannerEditor,
  'PageTagBannerSection': PageTagBannerEditor,
  'WhereWeWorkSection': WhereWeWorkEditor,
  'OurProgramsSection': OurProgramsEditor,
  'ContactReachSection': ContactReachEditor,
  'ContactOfficeSection': ContactOfficeEditor,
  'ProgramImpactSection': ProgramImpactEditor,
  'PublicationsSection': PublicationsEditor,
  'ImageGallerySection': ImageGalleryEditor,
  'VideoGallerySection': VideoGalleryEditor,
  'TextContentSection': TextContentEditor,
  'HtmlCssSection': HtmlCssEditor,

  // Shared-data sections (no local form; show a pointer instead)
  'StoriesSection': SharedDataNotice,
  'UpcomingEventsSection': SharedDataNotice,
};

// ===== COMPONENT =====
const RenderDataTab = ({ section, hasData, onDataChange, onUploadsChange }) => {
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
          onUploadsChange={onUploadsChange}
        />
      </Suspense>
    </div>
  );
};

export default RenderDataTab;