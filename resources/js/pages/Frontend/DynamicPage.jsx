// resources/js/Pages/Frontend/DynamicPage.jsx

import React from 'react';
import { Head } from "@inertiajs/react";

// Layout
import PublicLayout from "../../layouts/PublicLayout";

// Components
import DynamicSectionRenderer from '../../Shared/DynamicSectionRenderer';

const DynamicPage = ({
  topbarData,
  navbarData,
  footerData,
  storageUrl,
  sectionConfig,
  pageTitle,
  ...pageData
}) => {

  // console.log("pageData", pageData?.pageData);
  // console.log("sectionConfig", sectionConfig);

  // Render sections
  const sectionsToRender = (sectionConfig || [])
    .filter(section => section.enabled === true)
    .sort((a, b) => a.order - b.order);

  return (
    <PublicLayout
      topBarData={topbarData}
      navbarData={navbarData}
      footerData={footerData}
      storageUrl={storageUrl}
    >
      <Head title={pageTitle || "DUS - Dwip Unnayan Society | Empowering Communities"} />

      {sectionsToRender.length === 0 && (
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-slate-500">
          No page sections were found for this page.
        </div>
      )}

      {sectionsToRender.map((section) => (
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

export default DynamicPage;