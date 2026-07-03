// js/Sections/BlogSection/BlogSection.jsx

// React
import React from 'react';

// Inertia
import { Link } from '@inertiajs/react';

// Components
import ArrowIcon from '../../components/Shared/ArrowIcon';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * BlogSection Component
 * 
 * @param {Object} props
 * @param {Object} props.data - Blog data from API (from DynamicSectionRenderer)
 * @param {Object} props.blogData - Blog data from API (direct prop - legacy)
 * @param {Object} props.mainBlog - Main blog post (direct prop - legacy)
 * @param {Array} props.blogPosts - Blog posts array (direct prop - legacy)
 * @param {string} props.sectionTitle - Section title (default: 'Latest Stories')
 * @param {string} props.bgColor - Background color (optional)
 * @param {string} props.paddingY - Vertical padding classes
 * @param {string} props.paddingX - Horizontal padding classes
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'blog-section')
 * 
 * @returns {JSX.Element} Rendered blog section
 */
const BlogSection = ({
  data,           // From DynamicSectionRenderer
  blogData,       // Direct prop (legacy support)
  mainBlog = null,
  blogPosts = [],
  sectionTitle = 'Latest Stories',
  bgColor = 'bg-white',
  paddingY = 'py-10 sm:py-15 md:py-20 lg:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-50',
  sectionClassName = '',
  sectionId = 'blog-section',
}) => {
  // ============================================
  // RESOLVE DATA
  // ============================================
  // Use data prop if available, fallback to blogData or direct props
  let resolvedData = data || blogData;

  console.log('BlogSection - resolvedData (raw):', resolvedData);

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  let resolvedMainBlog = mainBlog;
  let resolvedBlogPosts = blogPosts;
  let resolvedSectionTitle = sectionTitle;

  if (hasValue(resolvedData)) {
    // Check if the data is wrapped in a 'data' property
    if (resolvedData.data && typeof resolvedData.data === 'object') {
      console.log('BlogSection - Using nested data property');
      resolvedData = resolvedData.data;
    }

    // If resolvedData is an object, extract properties
    if (typeof resolvedData === 'object') {
      // Extract main blog
      if (hasValue(resolvedData.mainBlog)) {
        resolvedMainBlog = resolvedData.mainBlog;
        console.log('BlogSection - Found mainBlog in data');
      } else if (hasValue(resolvedData.main)) {
        resolvedMainBlog = resolvedData.main;
        console.log('BlogSection - Found main in data');
      } else if (hasValue(resolvedData.featured)) {
        resolvedMainBlog = resolvedData.featured;
        console.log('BlogSection - Found featured in data');
      }

      // Extract blog posts
      if (Array.isArray(resolvedData.blogPosts)) {
        resolvedBlogPosts = resolvedData.blogPosts;
        console.log('BlogSection - Found blogPosts in data');
      } else if (Array.isArray(resolvedData.posts)) {
        resolvedBlogPosts = resolvedData.posts;
        console.log('BlogSection - Found posts in data');
      } else if (Array.isArray(resolvedData.items)) {
        resolvedBlogPosts = resolvedData.items;
        console.log('BlogSection - Found items in data');
      } else if (Array.isArray(resolvedData.blogs)) {
        resolvedBlogPosts = resolvedData.blogs;
        console.log('BlogSection - Found blogs in data');
      }

      // Extract section title
      if (hasValue(resolvedData.sectionTitle)) {
        resolvedSectionTitle = resolvedData.sectionTitle;
        console.log('BlogSection - Found sectionTitle in data');
      } else if (hasValue(resolvedData.title)) {
        resolvedSectionTitle = resolvedData.title;
        console.log('BlogSection - Found title in data');
      }
    }
  }

  console.log('BlogSection - resolvedMainBlog:', resolvedMainBlog);
  console.log('BlogSection - resolvedBlogPosts:', resolvedBlogPosts);
  console.log('BlogSection - resolvedSectionTitle:', resolvedSectionTitle);

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasMainBlog = hasValue(resolvedMainBlog) &&
    hasValue(resolvedMainBlog.title) &&
    hasValue(resolvedMainBlog.image);
  const hasBlogPosts = hasValue(resolvedBlogPosts) && resolvedBlogPosts.length > 0;

  // If no blog data at all, don't render anything
  if (!hasMainBlog && !hasBlogPosts) {
    return null;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      {/* Section Title */}
      {hasValue(resolvedSectionTitle) && (
        <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-15">
          <h2 className="text-[#080C14] font-extrabold text-[28px] sm:text-[34px] md:text-[40px] lg:text-[50px] leading-tight">
            {resolvedSectionTitle}
          </h2>
        </div>
      )}

      {/* Main Blog - Only show if mainBlog exists */}
      {hasMainBlog && (
        <div className='flex flex-col lg:flex-row items-center gap-8 lg:gap-12.5 shadow-lg p-5 sm:p-6 md:p-7.5 rounded-2xl bg-white'>
          {/* Main Blog Image */}
          {hasValue(resolvedMainBlog.image) && (
            <img
              src={resolvedMainBlog.image}
              alt={resolvedMainBlog.title || "Main blog image"}
              className="w-full lg:w-187.5 h-auto lg:h-112.5 object-cover object-center rounded-2xl"
            />
          )}

          {/* Main Blog Content */}
          <div className="flex-1 w-full">
            {/* Date */}
            {hasValue(resolvedMainBlog.date) && (
              <label className='font-normal text-[14px] sm:text-[16px] text-[#009BE2] pb-2 block'>
                {resolvedMainBlog.date}
              </label>
            )}

            {/* Heading */}
            {hasValue(resolvedMainBlog.title) && (
              <h2 className='font-semibold text-[24px] sm:text-[30px] lg:text-[36px] leading-tight sm:leading-snug pb-3 sm:pb-5'>
                {resolvedMainBlog.title}
              </h2>
            )}

            {/* Description - Use excerpt or description */}
            {hasValue(resolvedMainBlog.excerpt) && (
              <p className='font-normal text-[16px] sm:text-[18px] lg:text-[20px] line-clamp-5 text-gray-700'>
                {resolvedMainBlog.excerpt}
              </p>
            )}

            {/* Button */}
            {hasValue(resolvedMainBlog.slug) && (
              <Link
                href={`/blogs/${resolvedMainBlog.slug}`}
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
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7.5 ${hasMainBlog ? 'pt-10 sm:pt-12 md:pt-15' : ''}`}>
          {resolvedBlogPosts.map((post) => (
            <div key={post.id} className='shadow-2xl p-5 sm:p-6 md:p-7.5 rounded-2xl hover:shadow-3xl transition-shadow duration-300 bg-white'>
              {/* Post Image */}
              {hasValue(post.image) && (
                <img
                  src={post.image}
                  alt={post.title || "Blog post image"}
                  className="w-full h-48 sm:h-56 md:h-62.5 object-cover object-center rounded-2xl mb-4 sm:mb-5"
                />
              )}

              {/* Post Date */}
              {hasValue(post.date) && (
                <label className='font-normal text-[14px] sm:text-[16px] text-[#009BE2] pb-2 block'>
                  {post.date}
                </label>
              )}

              {/* Post Title */}
              {hasValue(post.title) && (
                <h3 className='font-semibold text-[20px] sm:text-[22px] lg:text-[24px] leading-snug pb-2 sm:pb-3'>
                  {post.title}
                </h3>
              )}

              {/* Post Description - Use excerpt or description */}
              {hasValue(post.excerpt) && (
                <p className='font-normal text-[14px] sm:text-[15px] lg:text-[16px] line-clamp-3 sm:line-clamp-4 lg:line-clamp-5 text-gray-600'>
                  {post.excerpt}
                </p>
              )}

              {/* Post Button */}
              {hasValue(post.slug) && (
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