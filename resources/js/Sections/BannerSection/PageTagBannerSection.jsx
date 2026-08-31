// js/Sections/BannerSection/PageTagBannerSection.jsx

import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

const getPlaceholderImage = (width = 1920, height = 600, text = 'Gallery Banner') => {
  return `https://via.placeholder.com/${width}x${height}/1a1a2e/FFFFFF?text=${encodeURIComponent(text)}`;
};

const PageTagBannerSection = ({
  data,
  bannerData,
  bgColor = '',
  height = 'h-64 sm:h-80 md:h-100 lg:h-120 xl:h-135 2xl:h-147.25',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'page-tag-banner',
  tags = [],
  tagTitle = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const { url } = usePage();
  const currentQuery = new URLSearchParams(url.split('?')[1] || '');
  const currentTagFromUrl = currentQuery.get('tag') || '';

  let resolvedData = data || bannerData;

  if (!hasValue(resolvedData)) return null;

  if (resolvedData?.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  const {
    background = {},
    overlay = {},
    content = {},
  } = resolvedData;

  const title = content.title || {};

  const galleryTags = tags.length > 0 ? tags : (resolvedData.tags || []);
  const galleryTitle = tagTitle || resolvedData.tagTitle || title.text || 'Photo Gallery';

  const defaultColors = [
    '#009BE2', '#FF6B6B', '#4ECDC4', '#FFE66D', '#6C5CE7',
    '#FD79A8', '#00B894', '#FDCB6E', '#E17055', '#0984E3',
    '#A29BFE', '#55EFC4', '#F8A5C2', '#74B9FF', '#FF7675'
  ];

  const hasTitle = hasValue(galleryTitle);
  const hasBackground = hasValue(background.src);
  const hasOverlays = hasValue(overlay.darkOverlay) || hasValue(overlay.gradient);
  const hasTags = galleryTags.length > 0;

  const hasAnyContent = hasTitle || hasBackground || hasOverlays || hasTags;
  if (!hasAnyContent) return null;

  const usePlaceholder = !hasBackground || imageError;
  const imageSrc = usePlaceholder
    ? getPlaceholderImage(1920, 600, galleryTitle)
    : background.src;
  const imageAlt = background.alt || (galleryTitle ? `${galleryTitle} - Banner` : 'Gallery banner background');

  const handleImageError = () => setImageError(true);

  const extractColorValue = (color) => {
    if (!color) return null;
    if (typeof color === 'string' && color.startsWith('#')) return color;
    if (typeof color === 'string' && color.includes('bg-[')) {
      const match = color.match(/bg-\[(#[^\]]+)\]/);
      if (match) return match[1];
    }
    if (typeof color === 'string') {
      const match = color.match(/#[0-9a-fA-F]{6}/);
      if (match) return match[0];
    }
    return color;
  };

  // ─── CHECK IF A TAG IS ACTIVE ──────────────────────────
  // For "All" tag: active when no filter is applied (currentTagFromUrl is empty)
  // For other tags: active when it matches the URL parameter
  const isTagActive = (tagLabel) => {
    if (tagLabel.toLowerCase() === 'all') {
      return currentTagFromUrl === '' || currentTagFromUrl.toLowerCase() === 'all';
    }
    return tagLabel === currentTagFromUrl;
  };

  // ─── HANDLE TAG CLICK ──────────────────────────────────
  const handleTagClick = (tagLabel) => {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);

    // Special case: if tag is "All" (case-insensitive), always clear the filter
    if (tagLabel.toLowerCase() === 'all') {
      params.delete('tag');
    } else {
      // Toggle: if clicked tag is already active, clear; otherwise set
      if (tagLabel === currentTagFromUrl) {
        params.delete('tag');
      } else {
        params.set('tag', tagLabel);
      }
    }

    router.get(`${window.location.pathname}?${params.toString()}`, {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  const renderTags = () => {
    if (!hasTags) return null;

    return (
      <div className="pt-3 sm:pt-4 md:pt-5 max-w-232.5 flex flex-wrap gap-2 sm:gap-3 md:gap-4">
        {galleryTags.map((tag, index) => {
          const tagLabel = typeof tag === 'string' ? tag : tag.label;
          const rawColor = typeof tag === 'object' && tag.color
            ? tag.color
            : defaultColors[index % defaultColors.length];
          const tagColor = extractColorValue(rawColor) || defaultColors[index % defaultColors.length];
          const active = isTagActive(tagLabel);

          return (
            <button
              key={index}
              onClick={() => handleTagClick(tagLabel)}
              className={`
                group flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4.5 md:px-5.5 py-1.5 sm:py-2 md:py-2.75 rounded-lg font-semibold text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px]
                transition-all duration-300 cursor-pointer
                ${active
                  ? 'bg-[#009BE2] text-white hover:bg-[#0080C4]'
                  : 'bg-white/90 text-black hover:bg-[#009BE2] hover:text-white'
                }
                shadow-md hover:shadow-lg
              `}
            >
              <span
                className={`
                  w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 shrink-0
                  ${active ? 'bg-white' : ''}
                  group-hover:bg-white
                `}
                style={{ backgroundColor: tagColor }}
              />
              <span>{tagLabel}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center overflow-hidden">
      <section
        id={sectionId}
        className={`relative w-[1920px] max-w-full ${height} overflow-hidden ${bgColor} ${sectionClassName}`}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover object-center"
          onError={handleImageError}
        />

        {hasValue(overlay.darkOverlay) && (
          <div className={`absolute inset-0 ${overlay.darkOverlay}`} />
        )}
        {hasValue(overlay.gradient) && (
          <div className={`absolute inset-0 ${overlay.gradient}`} />
        )}
        <div className="absolute inset-0 bg-black/30 sm:bg-black/20 md:bg-black/10 lg:bg-black/5" />

        <div className={`absolute left-0 inset-0 flex items-center ${paddingX} ${paddingY}`}>
          <div className="w-full text-white space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
            {hasTitle && (
              <h1 className="bricolage-grotesque font-bold leading-tight text-[28px] sm:text-[36px] md:text-[48px] lg:text-[64px] xl:text-[80px] 2xl:text-[100px] text-center md:text-left w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-215.75">
                {galleryTitle}
              </h1>
            )}
            {renderTags()}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PageTagBannerSection;