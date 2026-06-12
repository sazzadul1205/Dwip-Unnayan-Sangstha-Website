// resources/js/Pages/Frontend/Blogs/Blogs.jsx

import React from 'react';

// Inertia
import { Head } from '@inertiajs/react';

// Layout
import PublicLayout from '../../../layouts/PublicLayout';

// Sections
import BlogSection from './BlogSection/BlogSection';
import FAQSection from '../About/FAQSection/FAQSection';
import BannerSection from '../About/BannerSection/BannerSection';

const Blogs = ({
  // Shared 
  topBarData,
  navbarData,
  footerData,
  storageUrl,

  // Page Specific
  bannerData,
  faqData,
  mainBlog,
  blogPosts,

}) => {
  return (
    <PublicLayout topBarData={topBarData} navbarData={navbarData} footerData={footerData} storageUrl={storageUrl} >
      <Head title="Blogs | DUS - Dwip Unnayan Society | Empowering Communities" />

      <BannerSection bannerData={bannerData} sectionId='blogs-banner' />

      <BlogSection mainBlog={mainBlog} blogPosts={blogPosts} />

      <FAQSection faqData={faqData} />
    </PublicLayout>
  );
};

export default Blogs;