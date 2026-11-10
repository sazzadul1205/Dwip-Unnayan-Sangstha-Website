// resources/js/Shared/ImagePreloader.jsx

import React, { useState, useEffect, useRef, memo } from 'react';
import { Skeleton } from './Skeletons/SkeletonPrimitives';

/**
 * <ImagePreloader />
 * ------------------------------------------------------------------
 * Drop-in replacement for <img> that shows a skeleton while loading
 * and fades in once ready.
 *
 * Notes:
 *   - Passes `alt` through to the <img> (and to the error box as aria-label)
 *   - If `aspectRatio` is provided, wrapper reserves space (no CLS)
 *   - If not, wrapper takes whatever the parent gives it (100% by default)
 *   - `priority` → loading="eager" + fetchPriority="high"
 *   - `fallbackSrc` is tried once before showing the error box
 */
const ImagePreloader = ({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  skeletonClassName = '',
  aspectRatio,
  objectFit = 'cover',
  eager = false,
  priority = false,
  fallbackSrc,
  onLoad,
  onError,
  style,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [loadFullImage, setLoadFullImage] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef(null);
  const previewSrc = getPreviewSrc(src);

  // Reset when `src` changes
  useEffect(() => {
    if (!src) return;
    setCurrentSrc(src);
    setHasError(false);
    setIsLoaded(false);
    setPreviewLoaded(false);
    setLoadFullImage(!previewSrc);

    // If cached, `onLoad` may not fire — check synchronously
    const img = imgRef.current;
    if (img && img.getAttribute('src') === src && img.complete && img.naturalHeight !== 0) {
      setIsLoaded(true);
      setLoadFullImage(true);
    }
  }, [src, previewSrc]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setHasError(true);
    onError?.(e);
  };

  const handlePreviewLoad = () => {
    setPreviewLoaded(true);
    setLoadFullImage(true);
  };

  const handlePreviewError = () => {
    setPreviewLoaded(true);
    setLoadFullImage(true);
  };

  // Don't show skeleton for data: URIs (placeholders) — they load instantly
  const isDataUri = typeof src === 'string' && src.startsWith('data:');
  const showSkeleton = !previewLoaded && !isLoaded && !hasError && !isDataUri;

  return (
    <div
      className={`relative overflow-hidden ${wrapperClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {showSkeleton && (
        <Skeleton
          className={`absolute inset-0 w-full h-full ${skeletonClassName}`}
          rounded="rounded-none"
          aria-hidden="true"
        />
      )}

      {previewSrc && !isLoaded && !hasError && (
        <img
          src={previewSrc}
          alt=""
          aria-hidden="true"
          loading={eager || priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handlePreviewLoad}
          onError={handlePreviewError}
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ease-out ${
            previewLoaded ? 'opacity-100 blur-sm scale-105' : 'opacity-0'
          }`}
          style={{ objectFit }}
        />
      )}

      {!hasError && src && loadFullImage && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={eager || priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`
            ${className}
            transition-opacity duration-300 ease-out
            ${isLoaded || isDataUri ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ objectFit, ...style }}
          {...rest}
        />
      )}

      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs sm:text-sm"
          role="img"
          aria-label={alt || 'Image unavailable'}
        >
          <span>Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export default memo(ImagePreloader);

function getPreviewSrc(src) {
  if (typeof src !== 'string' || src.startsWith('data:')) return null;

  try {
    const isAbsolute = /^https?:\/\//i.test(src);
    const url = new URL(src, 'http://localhost');
    if (!url.pathname.startsWith('/storage/')) return null;
    if (!/\.(?:jpe?g|png|webp|bmp)$/i.test(url.pathname)) return null;

    url.pathname = url.pathname.replace(/^\/storage\//, '/image-preview/');
    return isAbsolute ? url.href : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}