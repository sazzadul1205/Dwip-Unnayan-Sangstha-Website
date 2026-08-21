// js/Sections/VideoGallerySection/VideoGallerySection.jsx

import React, { useState } from 'react';

const VideoGallerySection = ({
  data,
  videoData,
  sectionTitle = 'Videos',
  videoCountLabel = 'Video Count',
  videosPerPage = 4,
  videosPerLoad = 2,
  bgColor = 'bg-white',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'video-gallery-section',
}) => {
  const [visibleCount, setVisibleCount] = useState(videosPerPage);

  // ============================================
  // RESOLVE DATA - FIXED
  // ============================================
  let resolvedData = videoData || data || {};

  // If resolvedData has a 'data' property (from nested structure)
  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  // ============================================
  // NORMALIZE DATA STRUCTURE - FIXED
  // ============================================
  let resolvedVideos = [];
  let resolvedSectionTitle = sectionTitle;
  let resolvedVideoCountLabel = videoCountLabel;

  if (resolvedData) {
    // Direct videos array
    if (Array.isArray(resolvedData.videos)) {
      resolvedVideos = resolvedData.videos;
    }
    // Data is the videos array itself
    else if (Array.isArray(resolvedData)) {
      resolvedVideos = resolvedData;
    }
    // Items array
    else if (Array.isArray(resolvedData.items)) {
      resolvedVideos = resolvedData.items;
    }
    // Gallery array
    else if (Array.isArray(resolvedData.gallery)) {
      resolvedVideos = resolvedData.gallery;
    }
    // VideoGallery array
    else if (Array.isArray(resolvedData.videoGallery)) {
      resolvedVideos = resolvedData.videoGallery;
    }

    // Extract section title
    if (resolvedData.sectionTitle) {
      resolvedSectionTitle = resolvedData.sectionTitle;
    } else if (resolvedData.title) {
      resolvedSectionTitle = resolvedData.title;
    }

    // Extract video count label
    if (resolvedData.videoCountLabel) {
      resolvedVideoCountLabel = resolvedData.videoCountLabel;
    }
  }

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasVideos = resolvedVideos.length > 0;

  if (!hasVideos) {
    return null;
  }

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + videosPerLoad, resolvedVideos.length));
  };

  const isAllVisible = visibleCount >= resolvedVideos.length;

  // ============================================
  // GET YOUTUBE EMBED URL
  // ============================================
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;

    let videoId = null;

    if (url.includes('youtube.com/watch')) {
      try {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
      } catch (e) {
        console.error(e);
        // Invalid URL, try regex
        const match = url.match(/v=([^&]+)/);
        if (match) videoId = match[1];
      }
    }
    else if (url.includes('youtu.be/')) {
      const parts = url.split('/');
      videoId = parts[parts.length - 1];
      if (videoId.includes('?')) {
        videoId = videoId.split('?')[0];
      }
    }
    else if (url.includes('embed/')) {
      const parts = url.split('/');
      videoId = parts[parts.length - 1];
      if (videoId.includes('?')) {
        videoId = videoId.split('?')[0];
      }
    }
    else if (url.length === 11) {
      videoId = url;
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.includes('youtube.com/embed') || url.includes('youtube-nocookie.com/embed')) {
      return url;
    }

    return null;
  };

  const visibleVideos = resolvedVideos.slice(0, visibleCount);

  return (
    <section
      id={sectionId}
      className={`${bgColor} ${paddingY} ${paddingX} ${sectionClassName}`}
    >
      <div className="mx-auto space-y-5 sm:space-y-6 md:space-y-7.5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4">
          <h3 className="text-[#171D38] text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] font-semibold">
            {resolvedSectionTitle}
          </h3>
          <div className="bg-[#EAF6FF] px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg">
            <p className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[16px] font-normal text-[#2781BD]">
              {resolvedVideoCountLabel}: {resolvedVideos.length}
            </p>
          </div>
        </div>

        {/* Video Grid - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-7.5">
          {visibleVideos.map((video, index) => {
            const videoSrc = video.src || video.url || video.videoUrl || video.embedUrl || video;
            const videoTitle = video.title || video.caption || `Video ${index + 1}`;
            const videoId = video.id || index;
            const thumbnail = video.thumbnail || video.thumb || video.image || '';

            // Get embed URL if it's a YouTube video
            const embedUrl = getYouTubeEmbedUrl(videoSrc);

            // If it's an external video (like YouTube), use iframe
            if (embedUrl) {
              return (
                <div
                  key={videoId}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
                >
                  <div className="relative pb-[56.25%] h-0 overflow-hidden bg-black">
                    <iframe
                      src={embedUrl}
                      title={videoTitle}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              );
            }

            // If it's a self-hosted video or has a direct video source
            if (videoSrc && typeof videoSrc === 'string' && !embedUrl) {
              return (
                <div
                  key={videoId}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
                >
                  <div className="relative pb-[56.25%] h-0 overflow-hidden bg-black">
                    <video
                      src={videoSrc}
                      controls
                      className="absolute top-0 left-0 w-full h-full"
                      poster={thumbnail || undefined}
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              );
            }

            // Fallback: display placeholder
            return (
              <div
                key={videoId}
                className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-100"
              >
                <div className="relative pb-[56.25%] h-0 overflow-hidden bg-gray-200 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-sm sm:text-base">Video not available</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 md:p-5">
                  <h4 className="text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-semibold text-[#171D38] mb-1 sm:mb-2">
                    {videoTitle}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More Button - Only show if not all videos are visible */}
        {!isAllVisible && (
          <div className="flex justify-center pt-2 sm:pt-3 md:pt-4">
            <button
              onClick={handleShowMore}
              className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 lg:py-3.75 border border-[#2781BD] rounded-lg text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] font-semibold text-[#2781BD] hover:bg-[#2781BD] hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoGallerySection;