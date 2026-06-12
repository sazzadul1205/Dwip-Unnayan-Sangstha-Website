// resources/js/Pages/Frontend/BlogDetails/BlogDetails.jsx

import React from 'react';

// Inertia
import { Head, Link } from '@inertiajs/react';

import { CiCalendar } from "react-icons/ci";
import { FaRegClock } from "react-icons/fa";

// Layout
import PublicLayout from '../../../layouts/PublicLayout';

// Components
import ArrowIcon from '../../../components/Shared/ArrowIcon';

const BlogDetails = ({
  // Shared 
  topBarData,
  navbarData,
  footerData,
  storageUrl,

  // Page Specific
  slug,
  bannerData,
  blogData,
}) => {
  // Helper function to get full image URL
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

  // Function to render HTML content safely
  const renderHTML = (htmlString) => {
    return { __html: htmlString };
  };


  return (
    <PublicLayout topBarData={topBarData} navbarData={navbarData} footerData={footerData} storageUrl={storageUrl} >
      <Head title={`${blogData?.title || 'Blog Details'} | DUS - Dwip Unnayan Society | Empowering Communities`} />

      {/* Hero Section with Background Image in Negative Z-index */}
      <div className="relative w-full">
        {/* Background Image - behind everything */}
        <div className="absolute inset-0 -z-10">
          {bannerData?.background?.src && (
            <img
              src={bannerData.background.src}
              alt={bannerData.background.alt || 'Banner background'}
              className="w-full h-125 object-cover object-center"
            />
          )}

          {/* Dark Overlay */}
          <div className={`absolute inset-0 ${bannerData?.overlay?.darkOverlay || 'bg-black/40'}`}>
            {bannerData?.overlay?.gradient && (
              <div className={`absolute inset-0 ${bannerData.overlay.gradient}`}></div>
            )}
          </div>
        </div>

        {/* Content - Normal document flow */}
        <div className="max-w-[1100px] mx-auto px-4 pt-35 pb-15">
          {/* Tags Section */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap mb-6">
            {blogData?.tags && blogData.tags.length > 0 ? (
              blogData.tags.map((tag, index) => (
                <label
                  key={index}
                  className={`text-white text-[16px] font-semibold px-2 py-1 rounded-lg ${tagColors[index % tagColors.length]}`}
                >
                  {tag}
                </label>
              ))
            ) : (
              <label className="text-white bg-[#3866FF] text-[16px] font-semibold px-2 py-1 rounded-lg">
                Blog Post
              </label>
            )}
          </div>

          {/* Title */}
          <h2 className='text-white font-bold text-[100px] text-center leading-tight mb-8'>
            {blogData?.title || 'Blog Post'}
          </h2>

          {/* Meta Information */}
          <div className="flex items-start justify-center space-y-2 text-white text-[16px] font-semibold gap-7.5 flex-wrap mb-12">
            {/* Author */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-5 h-5">
                <img
                  src="https://placehold.co/20x20"
                  alt="Author"
                  className="w-5 h-5 object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-[#503AF2]/40 rounded-md"></div>
              </div>
              <p className="text-sm flex items-center">
                BY :
                <Link className="underline pl-1">
                  {blogData?.createdBy || 'ADMIN'}
                </Link>
              </p>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-white">
              <CiCalendar className="text-base" />
              <span>{blogData?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
            </div>

            {/* Read time */}
            <div className="flex items-center gap-2 text-sm text-white">
              <FaRegClock className="text-base" />
              <span>{blogData?.timerRead || '5 MIN READ'}</span>
            </div>
          </div>

          {/* Main Blog Image */}
          <img
            src={getImageUrl(blogData?.image) || "https://placehold.co/1100x450"}
            alt={blogData?.title || "Blog main image"}
            className="w-full h-auto object-cover rounded-2xl shadow-xl"
          />
        </div>
      </div>

      {/* Content Section - Normal document flow, will naturally sit below */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div
          className="bricolage-grotesque prose prose-lg max-w-none
              prose-headings:font-700 prose-headings:text-[#080C14] 
              prose-p:text-[#333333] prose-p:leading-relaxed
              prose-ul:text-[#333333] prose-ul:leading-relaxed
              prose-li:text-[#333333] prose-li:leading-relaxed
              prose-strong:text-[#009BE2]"
          dangerouslySetInnerHTML={renderHTML(blogData?.fullContent)}
        />
      </div>

    </PublicLayout>
  );
};

export default BlogDetails;