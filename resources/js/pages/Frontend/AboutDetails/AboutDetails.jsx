// resources/js/Pages/Frontend/AboutDetails/AboutDetails.jsx

// React
import React from 'react';
import { Head } from "@inertiajs/react";

// Layout
import PublicLayout from '../../../layouts/PublicLayout';

// Components
import DynamicSectionRenderer from '../../../Shared/DynamicSectionRenderer';
import NotFoundContent from '../../../Shared/NotFoundContent';

// Special ContentSection component (fixed)
const ContentSection = ({ subPageData, bgColor, paddingY, paddingX, sectionClassName, sectionId }) => {
  const renderHTML = (htmlString) => ({ __html: htmlString });

  const data = subPageData || {};
  const title = data.title;
  const content = data.full_content || data.content;
  const image = data.image;
  const btnText = data.btn_text || data.btn?.text;
  const btnLink = data.btn_link || data.btn?.link;

  if (!title && !content) {
    console.warn('⚠️ ContentSection: No title or content to render');
    return null;
  }

  return (
    <section id={sectionId} className={`${bgColor || ''} ${paddingY || ''} ${paddingX || ''} ${sectionClassName || ''}`}>
      {title && (
        <h1 className='text-black font-700 text-[28px] sm:text-[36px] md:text-[48px] lg:text-[64px] xl:text-[80px] leading-tight pb-12.5'>
          {title}
        </h1>
      )}
      {image && (
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12.5">
          <img
            src={image}
            alt={title ? `Image for ${title}` : 'About image'}
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
      {btnText && btnLink && (
        <div className="mt-8">
          <a href={btnLink} className="inline-block bg-[#009BE2] text-white font-600 px-8 py-4 rounded-lg hover:bg-[#007BB5] transition-colors">
            {btnText}
          </a>
        </div>
      )}
    </section>
  );
};

// Main Component
const AboutDetails = ({
  topBarData,
  navbarData,
  footerData,
  storageUrl,
  sectionConfig,
  notFound,
  notFoundMessage,
  ...props
}) => {
  if (notFound) {
    return (
      <PublicLayout
        topBarData={topBarData}
        navbarData={navbarData}
        footerData={footerData}
        storageUrl={storageUrl}
      >
        <Head title="Content Not Found | DUS" />
        <NotFoundContent
          icon="📄"
          title="Page Not Available"
          message={notFoundMessage || 'The page you are looking for is no longer available or has been removed.'}
          buttonText="Return to Home"
          buttonLink="/"
        />
      </PublicLayout>
    );
  }

  const pageData = props.pageData || props;

  const allSections = Array.isArray(sectionConfig)
    ? sectionConfig
    : (sectionConfig?.sections || []);

  const fixedSections = allSections.filter(section => section.isFixedSection === true);
  const dynamicSections = allSections.filter(section => section.isFixedSection !== true)
    .sort((a, b) => a.order - b.order);

  const bannerSection = dynamicSections.find(s => s.component === 'PageBannerSection');
  const otherDynamicSections = dynamicSections.filter(s => s.component !== 'PageBannerSection');

  return (
    <PublicLayout
      topBarData={topBarData}
      navbarData={navbarData}
      footerData={footerData}
      storageUrl={storageUrl}
    >
      <Head title={`${pageData.contentSectionData?.title || 'About Us Details'}`} />

      {bannerSection && (
        <DynamicSectionRenderer
          key={bannerSection.id}
          section={bannerSection}
          pageData={pageData}
          globalProps={{ storageUrl }}
        />
      )}

      {fixedSections.map((section) => {
        if (section.component === 'ContentSection') {
          return (
            <ContentSection
              key={section.id}
              subPageData={pageData.contentSectionData}
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
          pageData={pageData}
          globalProps={{ storageUrl }}
        />
      ))}
    </PublicLayout>
  );
};

export default AboutDetails;