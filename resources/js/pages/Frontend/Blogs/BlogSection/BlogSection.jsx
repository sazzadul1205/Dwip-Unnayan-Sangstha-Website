// resources/js/Pages/Frontend/Blogs/BlogSection/BlogSection.jsx

// React
import React from 'react';

// Inertia
import { Link } from '@inertiajs/react';

// Components
import ArrowIcon from '../../../../components/Shared/ArrowIcon';

const BlogSection = ({
  mainBlog,
  blogPosts,
  bgColor = null, // Custom background color (e.g., '#f5f5f5' or 'bg-gray-50')
  sectionTitle = null,
}) => {
  // Check if main blog exists and has required fields
  const hasMainBlog = mainBlog && mainBlog.title && mainBlog.image;

  // Check if blog posts exist and is a non-empty array
  const hasBlogPosts = blogPosts && Array.isArray(blogPosts) && blogPosts.length > 0;

  // If no blog data at all, don't render anything
  if (!hasMainBlog && !hasBlogPosts) {
    return null;
  }

  return (
    <section
      id='blog-section'
      className={`py-10 px-5 sm:py-15 sm:px-8 md:py-20 md:px-12 lg:py-37.5 lg:px-50 ${bgColor || ''}`}
      style={bgColor && !bgColor.startsWith('bg-') ? { backgroundColor: bgColor } : {}}
    >
      {(sectionTitle) && (
        <div>
          {sectionTitle && (
            <h2 className="text-[#080C14] font-extrabold text-[50px] sm:text-[34px] lg:text-[40px] leading-tight">
              {sectionTitle}
            </h2>
          )}
        </div>
      )}

      {/* Main Blog - Only show if mainBlog exists */}
      {hasMainBlog && (
        <div className='flex flex-col lg:flex-row items-center gap-8 lg:gap-12.5 shadow-lg p-5 sm:p-6 md:p-7.5 rounded-2xl bg-white'>
          <img
            src={mainBlog.image}
            alt={mainBlog.title}
            className="w-full lg:w-187.5 h-auto lg:h-112.5 object-cover object-center rounded-2xl"
          />

          {/* Content */}
          <div className="flex-1 w-full">
            {/* Date */}
            {mainBlog.date && (
              <label className='font-normal text-[14px] sm:text-[16px] text-[#009BE2] pb-2 block'>
                {mainBlog.date}
              </label>
            )}

            {/* Heading */}
            <h2 className='font-semibold text-[24px] sm:text-[30px] lg:text-[36px] leading-tight sm:leading-snug pb-3 sm:pb-5'>
              {mainBlog.title}
            </h2>

            {/* Text */}
            {mainBlog.description && (
              <p className='font-normal text-[16px] sm:text-[18px] lg:text-[20px] line-clamp-5 text-gray-700'>
                {mainBlog.description}
              </p>
            )}

            {/* Button */}
            {mainBlog.slug && (
              <Link
                href={`/blogs/${mainBlog.slug}`}
                className="mt-4 sm:mt-6 bricolage-grotesque flex items-center gap-2 font-500 lg:font-600 text-[14px] sm:text-[16px] lg:text-[20px] text-[#009BE2] group hover:text-[#080C14] transition-colors duration-300 w-fit"
              >
                Read more
                <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Blogs Grid - Only show if blogPosts array has items */}
      {hasBlogPosts && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7.5 pt-10 sm:pt-12 md:pt-15'>
          {blogPosts.map((post) => (
            <div key={post.id} className='shadow-2xl p-5 sm:p-6 md:p-7.5 rounded-2xl hover:shadow-3xl transition-shadow duration-300 bg-white'>
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 sm:h-56 md:h-62.5 object-cover object-center rounded-2xl mb-4 sm:mb-5"
              />

              {post.date && (
                <label className='font-normal text-[14px] sm:text-[16px] text-[#009BE2] pb-2 block'>
                  {post.date}
                </label>
              )}

              <h3 className='font-semibold text-[20px] sm:text-[22px] lg:text-[24px] leading-snug pb-2 sm:pb-3'>
                {post.title}
              </h3>

              {post.description && (
                <p className='font-normal text-[14px] sm:text-[15px] lg:text-[16px] line-clamp-3 sm:line-clamp-4 lg:line-clamp-5 text-gray-600'>
                  {post.description}
                </p>
              )}

              {/* Button */}
              {post.slug && (
                <Link
                  href={`/blogs/${post.slug}`}
                  className="mt-3 sm:mt-4 bricolage-grotesque flex items-center gap-2 font-500 text-[14px] sm:text-[15px] lg:text-[16px] text-[#009BE2] group hover:text-[#080C14] transition-colors duration-300 w-fit"
                >
                  Read more
                  <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default BlogSection;
