// js/Shared/Skeletons/SkeletonPrimitives.jsx

import React from 'react';

/**
 * Base skeleton primitive — animated pulsing block.
 * All skeleton components build on top of this.
 */
export const Skeleton = ({
  className = '',
  width,
  height,
  rounded = 'rounded-lg',
  style = {},
}) => (
  <div
    className={`animate-pulse bg-gray-200 ${rounded} ${className}`}
    style={{ width, height, ...style }}
    aria-hidden="true"
  />
);

/**
 * Circle skeleton (avatars, icons)
 */
export const SkeletonCircle = ({ size = 48, className = '' }) => (
  <Skeleton
    rounded="rounded-full"
    width={size}
    height={size}
    className={className}
  />
);

/**
 * Multi-line text skeleton.
 * Last line is shorter to mimic real text flow.
 */
export const SkeletonText = ({
  lines = 1,
  className = '',
  lineClassName = 'h-3.5',
}) => (
  <div className={`space-y-2 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`animate-pulse bg-gray-200 rounded-md ${lineClassName}`}
        style={{ width: i === lines - 1 && lines > 1 ? '70%' : '100%' }}
      />
    ))}
  </div>
);

/**
 * Image skeleton with aspect-ratio support.
 * @param {string} aspectRatio - e.g. '4/3', '16/9', '1/1'
 */
export const SkeletonImage = ({
  className = '',
  aspectRatio,
  rounded = 'rounded-2xl',
}) => (
  <div
    className={`animate-pulse bg-gray-200 ${rounded} ${className}`}
    style={aspectRatio ? { aspectRatio } : undefined}
    aria-hidden="true"
  />
);

/**
 * Card wrapper skeleton (matches card radius/shadow/padding).
 * Use this as the shell so skeletons match real content size.
 */
export const SkeletonCard = ({ className = '', children }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm ${className}`}
    aria-busy="true"
    aria-live="polite"
  >
    {children}
  </div>
);