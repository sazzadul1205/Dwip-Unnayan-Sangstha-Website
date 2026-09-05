// resources/js/Pages/Frontend/DynamicPage.jsx

import React, { useEffect } from 'react';
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
  useEffect(() => {
    const root = document.documentElement;
    const appRoot = document.getElementById('app') || document.body;
    let cancelled = false;
    let readyFrame = null;

    root.dataset.frontendPage = 'true';
    root.dataset.frontendReady = 'false';

    const signalReady = () => {
      if (cancelled || root.dataset.frontendReady === 'true') return;

      if (!appRoot.querySelector('[data-frontend-loader]')) {
        readyFrame = requestAnimationFrame(() => {
          if (cancelled || appRoot.querySelector('[data-frontend-loader]')) return;

          root.dataset.frontendReady = 'true';
          window.dispatchEvent(new Event('frontend:ready'));
          observer.disconnect();
        });
      }
    };

    const observer = new MutationObserver(signalReady);
    observer.observe(appRoot, { childList: true, subtree: true });
    signalReady();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (readyFrame !== null) cancelAnimationFrame(readyFrame);
      delete root.dataset.frontendPage;
      delete root.dataset.frontendReady;
    };
  }, []);

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
      <Head title={pageTitle} />

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