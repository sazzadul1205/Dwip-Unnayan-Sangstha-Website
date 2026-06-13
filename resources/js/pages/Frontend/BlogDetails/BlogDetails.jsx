// resources/js/Pages/Frontend/BlogDetails/BlogDetails.jsx

import React from 'react';

// Inertia
import { Head, Link } from '@inertiajs/react';

import { CiCalendar } from "react-icons/ci";
import { FaRegClock, FaFacebookF, FaLinkedinIn, FaInstagram } from "react-icons/fa";

// Layout
import PublicLayout from '../../../layouts/PublicLayout';
import BlogSection from '../Blogs/BlogSection/BlogSection';
import UpcomingEventsSection from '../Home/UpcomingEventsSection/UpcomingEventsSection';

const BlogDetails = ({
  // Shared
  topBarData,
  navbarData,
  footerData,
  storageUrl,

  // Page Specific
  slug,
  blogData,
  bannerData,
  relatedBlogs,
  upcomingEventsData,
}) => {
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${storageUrl}/${imagePath}`;
  };

  const tagColors = [
    "bg-[#3866FF]",
    "bg-[#503AF2]",
    "bg-[#00B894]",
    "bg-[#FF6B6B]",
    "bg-[#FDCB6E]",
    "bg-[#6C5CE7]",
  ];

  const renderHTML = (htmlString) => ({ __html: htmlString });

  return (
    <PublicLayout topBarData={topBarData} navbarData={navbarData} footerData={footerData} storageUrl={storageUrl}>
      <Head title={`${blogData?.title || 'Blog Details'} | DUS - Dwip Unnayan Society | Empowering Communities`} />

      {/* Banner */}
      <section className="relative isolate w-full h-125 overflow-hidden bg-[#080C14]">

        {/* Background */}
        <div className="absolute inset-0 z-0">
          {bannerData?.background?.src && (
            <img
              src={bannerData.background.src}
              alt={bannerData.background.alt || 'Banner background'}
              className="h-full w-full object-cover object-center"
            />
          )}
          <div className={`absolute inset-0 ${bannerData?.overlay?.darkOverlay || 'bg-black/60'}`}>
            {bannerData?.overlay?.gradient && (
              <div className={`absolute inset-0 ${bannerData.overlay.gradient}`} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-275 mx-auto px-4 pt-24 sm:pt-28 lg:pt-32 h-full flex flex-col items-center justify-start text-center">
          {/* Tags */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap mb-5">
            {blogData?.tags?.length > 0 ? (
              blogData.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`text-white text-[12px] sm:text-[13px] font-semibold px-2 py-1 rounded-md ${tagColors[index % tagColors.length]}`}
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-white bg-[#3866FF] text-[12px] sm:text-[13px] font-semibold px-2 py-1 rounded-md">
                Blog Post
              </span>
            )}
          </div>

          {/* Main Heading */}
          <h1 className="text-white font-bold text-[40px] sm:text-[54px] lg:text-[100px] leading-[1.05] mb-4 max-w-380">
            {blogData?.title || 'Blog Post'}
          </h1>

          {/* Meta */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-white text-[12px] sm:text-[14px] font-semibold">

            {/* Author */}
            <div className="flex items-center gap-2.5">

              {/* Author: Avatar */}
              <div className="relative w-5 h-5 rounded-full overflow-hidden">
                <img
                  src="https://placehold.co/20x20"
                  alt="Author"
                  className="w-5 h-5 object-cover"
                />
                <div className="absolute inset-0 bg-[#503AF2]/40" />
              </div>

              {/* Author: Name */}
              <p className="flex items-center">
                BY :
                <Link className="underline pl-1">
                  {blogData?.createdBy || 'ADMIN'}
                </Link>
              </p>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <CiCalendar className="text-base" />
              <span>{blogData?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
            </div>

            {/* Read time */}
            <div className="flex items-center gap-2">
              <FaRegClock className="text-base" />
              <span>{blogData?.timerRead || '5 MIN READ'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Blog main image */}
      <div className="relative z-10 w-275 mx-auto px-4 mt-15">
        <img
          src={getImageUrl(blogData?.image) || "https://placehold.co/1100x500"}
          alt={blogData?.title || "Blog main image"}
          className="w-full h-125 object-cover object-center rounded-[28px] shadow-2xl -mt-16"
        />
      </div>

      {/* Blog section */}
      <div className="max-w-275 mx-auto px-4 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row items-start gap-25">

          {/* Social media icons */}
          <div className="hidden lg:flex flex-col items-center gap-4 pt-2">
            <a href="#" className="w-8 h-8 rounded-full bg-[#080C14] text-white flex items-center justify-center">
              <FaFacebookF className="text-sm" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#080C14] text-white flex items-center justify-center">
              <FaLinkedinIn className="text-sm" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#080C14] text-white flex items-center justify-center">
              <FaInstagram className="text-sm" />
            </a>
          </div>

          {/* Blog content */}
          <div className="flex-1 ">
            <div
              className="bricolage-grotesque prose prose-sm sm:prose-base lg:prose-lg max-w-none
                prose-headings:font-700 prose-headings:text-[#080C14]
                prose-p:text-[#333333] prose-p:leading-relaxed
                prose-ul:text-[#333333] prose-ul:leading-relaxed
                prose-li:text-[#333333] prose-li:leading-relaxed
                prose-strong:text-[#009BE2]"
              dangerouslySetInnerHTML={renderHTML(blogData?.fullContent)}
            />
          </div>
        </div>
      </div>

      <BlogSection blogPosts={relatedBlogs} bgColor='bg-[#F5F5F5]' sectionTitle='Related Blogs' />

      <UpcomingEventsSection eventsData={upcomingEventsData} />
    </PublicLayout>
  );
};

export default BlogDetails;
