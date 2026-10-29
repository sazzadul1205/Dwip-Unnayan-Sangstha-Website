// resources/js/pages/Backend/CMS/Sections/components/RenderDataTab.jsx
import { lazy, Suspense } from 'react';
import ExternalManagerRedirect from '../../../../../Shared/SectionEditor/ExternalManagerRedirect';

// ─── Lazy-loaded editors ───
const HomeBannerEditor = lazy(() => import('../../../../../Sections/BannerSection/HomeBanner/HomeBannerEditor'));
const PageBannerEditor = lazy(() => import('../../../../../Sections/BannerSection/PageBannerSection/PageBannerEditor'));
const PageTagBannerEditor = lazy(() => import('../../../../../Sections/BannerSection/PageTagBannerSection/PageTagBannerEditor'));
const BlogEditor = lazy(() => import('../../../../../Sections/BlogSection/BlogEditor'));
const AddressEditor = lazy(() => import('../../../../../Sections/AddressSection/AddressEditor'));
const AboutUsEditor = lazy(() => import('../../../../../Sections/AboutUsSection/AboutUsEditor'));
const CardsEditor = lazy(() => import('../../../../../Sections/CardsSection/CardsEditor'));
const ContactOfficeEditor = lazy(() => import('../../../../../Sections/ContactOfficeSection/ContactOfficeEditor'));
const ContactReachEditor = lazy(() => import('../../../../../Sections/ContactReachSection/ContactReachEditor'));
const FAQEditor = lazy(() => import('../../../../../Sections/FAQSection/FAQEditor'));
const FollowUsEditor = lazy(() => import('../../../../../Sections/FollowUSSection/FollowUsEditor'));
const HeroFigureEditor = lazy(() => import('../../../../../Sections/HeroFigureSection/HeroFigureEditor'));
const HtmlCssEditor = lazy(() => import('../../../../../Sections/HtmlCssSection/HtmlCssEditor'));
const ImageGalleryEditor = lazy(() => import('../../../../../Sections/ImageGallerySection/ImageGalleryEditor'));
const JobsEditor = lazy(() => import('../../../../../Sections/JobsSection/JobsEditor'));
const LegalEditor = lazy(() => import('../../../../../Sections/LegalSection/LegalEditor'));
const OurActionEditor = lazy(() => import('../../../../../Sections/OurActionSection/OurActionEditor'));
const OurProgramsEditor = lazy(() => import('../../../../../Sections/OurProgramsSection/OurProgramsEditor'));
const WhereWeWorkEditor = lazy(() => import('../../../../../Sections/WhereWeWorkSection/WhereWeWorkEditor'));
const ProgramImpactEditor = lazy(() => import('../../../../../Sections/ProgramImpactSection/ProgramImpactEditor'));
const PublicationsEditor = lazy(() => import('../../../../../Sections/PublicationsSection/PublicationsEditor'));
const VideoGalleryEditor = lazy(() => import('../../../../../Sections/VideoGallerySection/VideoGalleryEditor'));
const TextContentEditor = lazy(() => import('../../../../../Sections/TextContentSection/TextContentEditor'));

// ─── Shared data notice ───
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

// ─── Loader ───
const EditorLoader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="flex flex-col items-center gap-3">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-slate-500">Loading editor…</p>
    </div>
  </div>
);

// ─── Editor map ───
const EDITOR_COMPONENTS = {
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
  'HeroFigureSection': HeroFigureEditor,
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
  'StoriesSection': SharedDataNotice,
  'UpcomingEventsSection': SharedDataNotice,
};

const RenderDataTab = ({ section, hasData, onDataChange, onUploadsChange }) => {
  const EditorComponent = EDITOR_COMPONENTS[section.component];

  if (!EditorComponent) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 py-12 text-center">
        <p className="text-sm font-medium text-slate-500">No editable fields for this section type</p>
        <p className="mt-0.5 text-xs text-slate-400">Use the data viewer above to inspect stored values</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<EditorLoader />}>
      <EditorComponent
        section={section}
        hasData={hasData}
        onDataChange={onDataChange}
        onUploadsChange={onUploadsChange}
      />
    </Suspense>
  );
};

export default RenderDataTab;