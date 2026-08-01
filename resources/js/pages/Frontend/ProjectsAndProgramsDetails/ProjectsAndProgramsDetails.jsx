// resources/js/Pages/Frontend/ProjectsAndProgramsDetails/ProjectsAndProgramsDetails.jsx (original version)

// React
import React from 'react';
import { Head } from "@inertiajs/react";

// Layout
import PublicLayout from '../../../layouts/PublicLayout';

// Components
import DynamicSectionRenderer from '../../../Shared/DynamicSectionRenderer';
import NotFoundContent from '../../../Shared/NotFoundContent';

// Program Content Section Component
const ProgramContentSection = ({ programData, bgColor, paddingY, paddingX, sectionClassName, sectionId }) => {
  const renderHTML = (htmlString) => ({ __html: htmlString });

  if (!programData) return null;

  const data = programData;
  const content = data.full_content_html || data.fullContentHtml || data.fullContent || data?.content;

  return (
    <section id={sectionId} className={`${bgColor || ''} ${paddingY || ''} ${paddingX || ''} ${sectionClassName || ''}`}>
      {data?.title && (
        <h1 className='text-black font-700 text-[28px] sm:text-[36px] md:text-[48px] lg:text-[64px] xl:text-[80px] leading-tight pb-12.5'>
          {data.title}
        </h1>
      )}

      {data?.image && (
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12.5">
          <img
            src={data.image}
            alt={data?.title ? `Image for ${data.title}` : 'Program image'}
            loading="lazy"
            className="w-full h-auto max-h-64 sm:max-h-80 md:max-h-96 lg:max-h-125 object-cover rounded-2xl"
          />
        </div>
      )}

      {content && (
        <div
          className="bricolage-grotesque prose prose-lg max-w-none
            prose-headings:font-700 prose-headings:text-[#080C14] 
            prose-p:text-[#333333] prose-p:leading-relaxed prose-p:mb-4
            prose-ul:text-[#333333] prose-ul:leading-relaxed
            prose-li:text-[#333333] prose-li:leading-relaxed
            prose-strong:text-[#009BE2]
            prose-h2:font-700 prose-h2:text-[#080C14] prose-h2:mt-8 prose-h2:mb-4
            prose-h2:text-2xl sm:prose-h2:text-3xl lg:prose-h2:text-4xl"
          dangerouslySetInnerHTML={renderHTML(content)}
        />
      )}
    </section>
  );
};

// Main Component
const ProjectsAndProgramsDetails = ({
  topBarData,
  navbarData,
  footerData,
  storageUrl,
  sectionConfig,
  notFound,
  notFoundMessage,
  pageData: incomingPageData,
  ...rest
}) => {
  if (notFound) {
    return (
      <PublicLayout
        topBarData={topBarData}
        navbarData={navbarData}
        footerData={footerData}
        storageUrl={storageUrl}
      >
        <Head title="Program Not Found | DUS" />
        <NotFoundContent
          icon="📁"
          title="Program Not Available"
          message={notFoundMessage || 'The program you are looking for is no longer available or has been removed.'}
          buttonText="View All Programs"
          buttonLink="/projects-programs"
        />
      </PublicLayout>
    );
  }

  const pageData = incomingPageData || rest;

  const allSections = Array.isArray(sectionConfig)
    ? sectionConfig
    : (sectionConfig?.sections || []);

  const fixedSections = allSections.filter(section => section.isFixedSection === true);
  const dynamicSections = allSections.filter(section => section.isFixedSection !== true)
    .sort((a, b) => a.order - b.order);

  const bannerSection = dynamicSections.find(s => s.component === 'PageBannerSection');
  const otherDynamicSections = dynamicSections.filter(s => s.component !== 'PageBannerSection');

  const programData = pageData.programContentData || pageData.programData;

  const enrichedPageData = {
    ...pageData,
    programContentData: programData,
  };

  return (
    <PublicLayout
      topBarData={topBarData}
      navbarData={navbarData}
      footerData={footerData}
      storageUrl={storageUrl}
    >
      <Head title={`${programData?.title || 'Programs and Projects Details'}`} />

      {bannerSection && (
        <DynamicSectionRenderer
          key={bannerSection.id}
          section={bannerSection}
          pageData={enrichedPageData}
          globalProps={{ storageUrl }}
        />
      )}

      {fixedSections.map((section) => {
        if (section.component === 'ProgramContentSection') {
          return (
            <ProgramContentSection
              key={section.id}
              programData={programData}
              {...section.customProps}
            />
          );
        }
        return null;
      })}

      {otherDynamicSections.map((section) => (
        <DynamicSectionRenderer
          key={section.id}
          section={section}
          pageData={enrichedPageData}
          globalProps={{ storageUrl }}
        />
      ))}
    </PublicLayout>
  );
};

export default ProjectsAndProgramsDetails;