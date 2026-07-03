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
 */
const BlogSection = ({
  data,           // From DynamicSectionRenderer
  blogData,       // Direct prop (legacy support)
  blogsData,      // Direct prop from config
  mainBlog = null,
  blogPosts = [],
  sectionTitle = null,  // ← Changed from 'Latest Stories' to null
  isRelated = false,
  bgColor = 'bg-white',
  paddingY = 'py-10 sm:py-15 md:py-20 lg:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-50',
  sectionClassName = '',
  sectionId = 'blog-section',
}) => {
  // ============================================
  // RESOLVE DATA
  // ============================================
  let resolvedData = blogsData || data || blogData || [];


  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  let resolvedMainBlog = mainBlog;
  let resolvedBlogPosts = blogPosts;
  let resolvedSectionTitle = sectionTitle;

  if (hasValue(resolvedData)) {
    if (resolvedData.data && typeof resolvedData.data === 'object') {
      resolvedData = resolvedData.data;
    }

    // If resolvedData is an array, use it as blog posts
    if (Array.isArray(resolvedData)) {
      resolvedBlogPosts = resolvedData;

      // Find featured blog for main blog
      const featuredBlog = resolvedData.find(blog => blog.is_featured === true || blog.is_featured === 1);
      if (featuredBlog) {
        resolvedMainBlog = featuredBlog;
      } else if (resolvedData.length > 0) {
        resolvedMainBlog = resolvedData[0];
      }
    } else if (typeof resolvedData === 'object') {
      // Extract main blog
      if (hasValue(resolvedData.mainBlog)) {
        resolvedMainBlog = resolvedData.mainBlog;
      } else if (hasValue(resolvedData.main)) {
        resolvedMainBlog = resolvedData.main;
      } else if (hasValue(resolvedData.featured)) {
        resolvedMainBlog = resolvedData.featured;
      }

      // Extract blog posts
      if (Array.isArray(resolvedData.blogPosts)) {
        resolvedBlogPosts = resolvedData.blogPosts;
      } else if (Array.isArray(resolvedData.posts)) {
        resolvedBlogPosts = resolvedData.posts;
      } else if (Array.isArray(resolvedData.items)) {
        resolvedBlogPosts = resolvedData.items;
      } else if (Array.isArray(resolvedData.blogs)) {
        resolvedBlogPosts = resolvedData.blogs;
      }

      // Extract section title
      if (hasValue(resolvedData.sectionTitle)) {
        resolvedSectionTitle = resolvedData.sectionTitle;
      } else if (hasValue(resolvedData.title)) {
        resolvedSectionTitle = resolvedData.title;
      }
    }
  }

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const isRelatedSection = Boolean(isRelated);

  if (isRelatedSection) {
    resolvedMainBlog = null;
    resolvedBlogPosts = Array.isArray(resolvedBlogPosts) ? resolvedBlogPosts.slice(0, 3) : [];
  }

  const hasMainBlog = !isRelatedSection && hasValue(resolvedMainBlog) &&
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
      {/* Section Title - Only show if sectionTitle exists */}
      {hasValue(resolvedSectionTitle) && (
        <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-15">
          <h2 className="text-[#080C14] font-extrabold text-[28px] sm:text-[34px] md:text-[40px] lg:text-[50px] leading-tight">
            {resolvedSectionTitle}
          </h2>
        </div>
      )}

      {/* Main Blog */}
      {hasMainBlog && (
        <div className='flex flex-col lg:flex-row items-center gap-8 lg:gap-12.5 shadow-lg p-5 sm:p-6 md:p-7.5 rounded-2xl bg-white'>
          {hasValue(resolvedMainBlog.image) && (
            <img
              src={resolvedMainBlog.image}
              alt={resolvedMainBlog.title || "Main blog image"}
              className="w-full lg:w-187.5 h-auto lg:h-112.5 object-cover object-center rounded-2xl"
            />
          )}

          <div className="flex-1 w-full">
            {hasValue(resolvedMainBlog.date) && (
              <label className='font-normal text-[14px] sm:text-[16px] text-[#009BE2] pb-2 block'>
                {resolvedMainBlog.date}
              </label>
            )}

            {hasValue(resolvedMainBlog.title) && (
              <h2 className='font-semibold text-[24px] sm:text-[30px] lg:text-[36px] leading-tight sm:leading-snug pb-3 sm:pb-5'>
                {resolvedMainBlog.title}
              </h2>
            )}

            {hasValue(resolvedMainBlog.excerpt) && (
              <p className='font-normal text-[16px] sm:text-[18px] lg:text-[20px] line-clamp-5 text-gray-700'>
                {resolvedMainBlog.excerpt}
              </p>
            )}

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

      {/* Blogs Grid */}
      {hasBlogPosts && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7.5 ${hasMainBlog ? 'pt-10 sm:pt-12 md:pt-15' : ''}`}>
          {resolvedBlogPosts.map((post) => {
            // Skip the main blog if it's featured and we're showing it separately
            if (hasMainBlog && resolvedMainBlog.id === post.id) {
              return null;
            }

            return (
              <div key={post.id} className='shadow-2xl p-5 sm:p-6 md:p-7.5 rounded-2xl hover:shadow-3xl transition-shadow duration-300 bg-white'>
                {hasValue(post.image) && (
                  <img
                    src={post.image}
                    alt={post.title || "Blog post image"}
                    className="w-full h-48 sm:h-56 md:h-62.5 object-cover object-center rounded-2xl mb-4 sm:mb-5"
                  />
                )}

                {hasValue(post.date) && (
                  <label className='font-normal text-[14px] sm:text-[16px] text-[#009BE2] pb-2 block'>
                    {post.date}
                  </label>
                )}

                {hasValue(post.title) && (
                  <h3 className='font-semibold text-[20px] sm:text-[22px] lg:text-[24px] leading-snug pb-2 sm:pb-3'>
                    {post.title}
                  </h3>
                )}

                {hasValue(post.excerpt) && (
                  <p className='font-normal text-[14px] sm:text-[15px] lg:text-[16px] line-clamp-3 sm:line-clamp-4 lg:line-clamp-5 text-gray-600'>
                    {post.excerpt}
                  </p>
                )}

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
            );
          })}
        </div>
      )}
    </section>
  );
};

export default BlogSection;