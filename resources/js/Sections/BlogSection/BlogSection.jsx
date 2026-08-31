// js/Sections/BlogSection/BlogSection.jsx

// React
import React, { useState } from 'react';

// Inertia
import { Link } from '@inertiajs/react';

// Components
import ArrowIcon from '../../Shared/ArrowIcon';

// Utility function to check if value exists
const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Generate placeholder image URL
const getPlaceholderImage = (width = 800, height = 600, text = 'Blog Post') => {
  return `https://via.placeholder.com/${width}x${height}/009BE2/FFFFFF?text=${encodeURIComponent(text)}`;
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
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'blog-section',
}) => {
  // ============================================
  // HOOKS - Must be called at the top level
  // ============================================
  const [imageErrors, setImageErrors] = useState({});

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
  // IMAGE HANDLING
  // ============================================
  const handleImageError = (postId) => {
    setImageErrors(prev => ({ ...prev, [postId]: true }));
  };

  const getImageSrc = (post, defaultText = 'Blog Post') => {
    if (imageErrors[post.id]) {
      return getPlaceholderImage(800, 600, post.title || defaultText);
    }
    if (hasValue(post.image)) {
      return post.image;
    }
    return getPlaceholderImage(800, 600, post.title || defaultText);
  };

  const getImageAlt = (post) => {
    return post.title || 'Blog post image';
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName} text-black`}
    >
      {/* Section Title - Only show if sectionTitle exists */}
      {hasValue(resolvedSectionTitle) && (
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-15">
          <h2 className="text-[#080C14] font-extrabold text-[24px] sm:text-[28px] md:text-[32px] lg:text-[40px] xl:text-[44px] 2xl:text-[50px] leading-tight">
            {resolvedSectionTitle}
          </h2>
        </div>
      )}

      {/* Main Blog */}
      {hasMainBlog && (
        <div className='flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-10 xl:gap-12.5 shadow-lg p-4 sm:p-5 md:p-6 lg:p-7.5 rounded-2xl bg-white'>
          <div className='w-full lg:w-1/2'>
            <img
              src={getImageSrc(resolvedMainBlog)}
              alt={getImageAlt(resolvedMainBlog)}
              className="w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-100 2xl:h-112.5 object-cover object-center rounded-2xl"
              onError={() => handleImageError(resolvedMainBlog.id)}
            />
          </div>

          <div className="flex-1 w-full lg:w-1/2">
            {hasValue(resolvedMainBlog.date) && (
              <label className='font-normal text-[12px] sm:text-[13px] md:text-[14px] lg:text-[16px] text-[#009BE2] pb-1.5 sm:pb-2 block'>
                {resolvedMainBlog.date}
              </label>
            )}

            {hasValue(resolvedMainBlog.title) && (
              <h2 className='font-semibold text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] xl:text-[36px] leading-tight sm:leading-snug pb-2 sm:pb-3 md:pb-4 lg:pb-5'>
                {resolvedMainBlog.title}
              </h2>
            )}

            {hasValue(resolvedMainBlog.excerpt) && (
              <p className='font-normal text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] xl:text-[20px] line-clamp-4 sm:line-clamp-5 text-gray-700'>
                {resolvedMainBlog.excerpt}
              </p>
            )}

            {hasValue(resolvedMainBlog.slug) && (
              <Link
                href={`/blogs/${resolvedMainBlog.slug}`}
                className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 bricolage-grotesque flex items-center gap-2 font-500 lg:font-600 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[18px] xl:text-[20px] text-[#009BE2] group hover:text-[#080C14] transition-colors duration-300 w-fit"
              >
                Read more
                <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Blogs Grid */}
      {hasBlogPosts && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7.5 ${hasMainBlog ? 'pt-6 sm:pt-8 md:pt-10 lg:pt-12 xl:pt-15' : ''}`}>
          {resolvedBlogPosts.map((post) => {
            // Skip the main blog if it's featured and we're showing it separately
            if (hasMainBlog && resolvedMainBlog.id === post.id) {
              return null;
            }

            return (
              <div key={post.id} className='shadow-2xl p-4 sm:p-5 md:p-6 lg:p-7.5 rounded-2xl hover:shadow-3xl transition-shadow duration-300 bg-white flex flex-col h-full'>
                <img
                  src={getImageSrc(post)}
                  alt={getImageAlt(post)}
                  className="w-full h-40 sm:h-44 md:h-48 lg:h-52 xl:h-56 2xl:h-62.5 object-cover object-center rounded-2xl mb-3 sm:mb-4 md:mb-5"
                  onError={() => handleImageError(post.id)}
                />

                {hasValue(post.date) && (
                  <label className='font-normal text-[12px] sm:text-[13px] md:text-[14px] lg:text-[16px] text-[#009BE2] pb-1.5 sm:pb-2 block'>
                    {post.date}
                  </label>
                )}

                {hasValue(post.title) && (
                  <h3 className='font-semibold text-[18px] sm:text-[19px] md:text-[20px] lg:text-[22px] xl:text-[24px] leading-snug pb-1.5 sm:pb-2 md:pb-3'>
                    {post.title}
                  </h3>
                )}

                {hasValue(post.excerpt) && (
                  <p className='font-normal text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] line-clamp-3 sm:line-clamp-4 lg:line-clamp-5 text-gray-600 flex-1'>
                    {post.excerpt}
                  </p>
                )}

                {hasValue(post.slug) && (
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="mt-3 sm:mt-4 bricolage-grotesque flex items-center gap-2 font-500 text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] text-[#009BE2] group hover:text-[#080C14] transition-colors duration-300 w-fit"
                  >
                    Read more
                    <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
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