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
 *   - `priority` → loading="eager" + fetchpriority="high"
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
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef(null);

  // Reset when `src` changes
  useEffect(() => {
    if (!src) return;
    setCurrentSrc(src);
    setHasError(false);

    // If cached, `onLoad` may not fire — check synchronously
    const img = imgRef.current;
    if (img && img.complete && img.naturalHeight !== 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

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

  // Don't show skeleton for data: URIs (placeholders) — they load instantly
  const isDataUri = typeof src === 'string' && src.startsWith('data:');
  const showSkeleton = !isLoaded && !hasError && !isDataUri;

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

      {!hasError && src && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={eager || priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`
            ${className}
            transition-opacity duration-300 ease-out
            ${isLoaded || isDataUri ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ objectFit }}
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