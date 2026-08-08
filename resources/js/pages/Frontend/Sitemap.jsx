import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '../../layouts/PublicLayout';

const Sitemap = ({ topbarData, navbarData, footerData, storageUrl, pageTitle, urls = [] }) => {
  return (
    <PublicLayout
      topBarData={topbarData}
      navbarData={navbarData}
      footerData={footerData}
      storageUrl={storageUrl}
    >
      <Head title={pageTitle || 'Sitemap | DUS'} />

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Website Sitemap</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Sitemap</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            A public-facing index of important pages on this website.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Pages</p>
              <p className="text-sm text-slate-500">{urls.length} URLs indexed</p>
            </div>
          </div>

          <div className="space-y-2">
            {urls.length === 0 ? (
              <div className="text-sm text-slate-500">No sitemap URLs available.</div>
            ) : (
              urls.map((url) => (
                <div key={url} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white">
                  <Link href={url} className="text-sm font-medium text-slate-900 hover:text-slate-700" as="a">
                    {url}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </PublicLayout>
  );
};

export default Sitemap;
