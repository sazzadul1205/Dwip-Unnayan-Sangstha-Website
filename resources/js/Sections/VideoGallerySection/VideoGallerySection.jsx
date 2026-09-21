// js/Sections/VideoGallerySection/VideoGallerySection.jsx

import { useState } from 'react';

// Skeleton primitives
import { Skeleton, SkeletonCircle } from '../../Shared/Skeletons/SkeletonPrimitives';

// ============================================
// SKELETON: Single video card
// Matches real card: 16/9 iframe area + optional caption
// ============================================
const VideoSkeletonCard = () => (
  <div className="rounded-lg overflow-hidden shadow-md bg-white">
    {/* 16:9 aspect-ratio block — same technique as real iframe wrapper */}
    <div className="relative pb-[56.25%] h-0 overflow-hidden">
      <Skeleton
        className="absolute inset-0 w-full h-full"
        rounded="rounded-none"
      />
      {/* Play button placeholder in the middle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <SkeletonCircle size={56} className="opacity-60" />
      </div>
    </div>
  </div>
);

// ============================================
// SKELETON: Header + 2-column grid
// ============================================
const VideoGallerySkeleton = ({
  count = 4,
  sectionTitle,
}) => (
  <>
    {/* Header */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4">
      {sectionTitle ? (
        <h3 className="text-[#171D38] text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] font-semibold">
          {sectionTitle}
        </h3>
      ) : (
        <Skeleton className="h-8 sm:h-9 md:h-10 w-40 sm:w-48 md:w-56" />
      )}
      <Skeleton className="h-8 sm:h-9 md:h-10 w-28 sm:w-32 rounded-lg" />
    </div>

    {/* 2-column grid — matches real grid exactly */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-7.5">
      {Array.from({ length: count }).map((_, index) => (
        <VideoSkeletonCard key={`video-skeleton-${index}`} />
      ))}
    </div>

    {/* Show More button placeholder */}
    <div className="flex justify-center pt-2 sm:pt-3 md:pt-4">
      <Skeleton className="h-11 sm:h-12 md:h-13 lg:h-13.75 w-32 sm:w-36 md:w-40 rounded-lg" />
    </div>
  </>
);

const VideoGallerySection = ({
  data,
  videoData,
  loading = false,                       // ← NEW: externally controlled
  skeletonCount = 4,                     // ← NEW: how many skeleton video cards
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
  // RESOLVE DATA
  // ============================================
  let resolvedData = videoData || data || {};

  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  let resolvedVideos = [];
  let resolvedSectionTitle = sectionTitle;
  let resolvedVideoCountLabel = videoCountLabel;

  if (resolvedData) {
    if (Array.isArray(resolvedData.videos)) resolvedVideos = resolvedData.videos;
    else if (Array.isArray(resolvedData)) resolvedVideos = resolvedData;
    else if (Array.isArray(resolvedData.items)) resolvedVideos = resolvedData.items;
    else if (Array.isArray(resolvedData.gallery)) resolvedVideos = resolvedData.gallery;
    else if (Array.isArray(resolvedData.videoGallery)) resolvedVideos = resolvedData.videoGallery;

    if (resolvedData.sectionTitle) resolvedSectionTitle = resolvedData.sectionTitle;
    else if (resolvedData.title) resolvedSectionTitle = resolvedData.title;

    if (resolvedData.videoCountLabel) resolvedVideoCountLabel = resolvedData.videoCountLabel;
  }

  // ============================================
  // LOADING STATE — SKELETON
  // ============================================
  if (loading) {
    return (
      <section
        id={sectionId}
        className={`${bgColor} ${paddingY} ${paddingX} ${sectionClassName}`}
      >
        <div className="mx-auto space-y-5 sm:space-y-6 md:space-y-7.5">
          <VideoGallerySkeleton
            count={skeletonCount}
            sectionTitle={resolvedSectionTitle}
            videoCountLabel={resolvedVideoCountLabel}
          />
        </div>
      </section>
    );
  }

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const hasVideos = resolvedVideos.length > 0;
  if (!hasVideos) {
    return null;
  }

  // ============================================
  // HANDLERS
  // ============================================
  const handleShowMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + videosPerLoad, resolvedVideos.length)
    );
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
        const match = url.match(/v=([^&]+)/);
        if (match) videoId = match[1];
      }
    } else if (url.includes('youtu.be/')) {
      const parts = url.split('/');
      videoId = parts[parts.length - 1];
      if (videoId.includes('?')) videoId = videoId.split('?')[0];
    } else if (url.includes('embed/')) {
      const parts = url.split('/');
      videoId = parts[parts.length - 1];
      if (videoId.includes('?')) videoId = videoId.split('?')[0];
    } else if (url.length === 11) {
      videoId = url;
    }

    if (videoId) return `https://www.youtube.com/embed/${videoId}`;

    if (url.includes('youtube.com/embed') || url.includes('youtube-nocookie.com/embed')) {
      return url;
    }

    return null;
  };

  const visibleVideos = resolvedVideos.slice(0, visibleCount);

  // ============================================
  // RENDER
  // ============================================
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
            const videoSrc =
              video.src || video.url || video.videoUrl || video.embedUrl || video;
            const videoTitle = video.title || video.caption || `Video ${index + 1}`;
            const videoId = video.id || index;
            const thumbnail = video.thumbnail || video.thumb || video.image || '';

            const embedUrl = getYouTubeEmbedUrl(videoSrc);

            // External video (YouTube etc.)
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

            // Self-hosted video
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

            // Fallback placeholder
            return (
              <div
                key={videoId}
                className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-100"
              >
                <div className="relative pb-[56.25%] h-0 overflow-hidden bg-gray-200 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <svg
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
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

        {/* Show More Button */}
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