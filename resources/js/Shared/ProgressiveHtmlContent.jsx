import { useEffect, useMemo, useRef } from 'react';

const ProgressiveHtmlContent = ({ html, className = '', style }) => {
  const contentRef = useRef(null);
  const progressiveHtml = useMemo(() => prepareProgressiveHtml(html), [html]);

  useEffect(() => {
    const images = contentRef.current?.querySelectorAll('img[data-progressive-src]');
    if (!images) return undefined;

    const cleanupHandlers = [];
    images.forEach((image) => {
      const fullSrc = image.dataset.progressiveSrc;
      const loadFullImage = () => {
        const fullImage = new Image();
        fullImage.decoding = 'async';
        fullImage.onload = () => {
          image.src = fullSrc;
          image.removeAttribute('data-progressive-src');
        };
        fullImage.onerror = () => {
          image.src = fullSrc;
          image.removeAttribute('data-progressive-src');
        };
        fullImage.src = fullSrc;
        cleanupHandlers.push(() => {
          fullImage.onload = null;
          fullImage.onerror = null;
        });
      };
      const restoreOriginalImage = () => {
        image.src = fullSrc;
        image.removeAttribute('data-progressive-src');
      };

      image.addEventListener('load', loadFullImage, { once: true });
      image.addEventListener('error', restoreOriginalImage, { once: true });
      cleanupHandlers.push(() => {
        image.removeEventListener('load', loadFullImage);
        image.removeEventListener('error', restoreOriginalImage);
      });

      if (image.complete) {
        if (image.naturalWidth > 0) loadFullImage();
        else restoreOriginalImage();
      }
    });

    return () => {
      cleanupHandlers.forEach((cleanup) => cleanup());
    };
  }, [progressiveHtml]);

  return (
    <div
      ref={contentRef}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: progressiveHtml }}
    />
  );
};

function prepareProgressiveHtml(html) {
  if (typeof html !== 'string') return '';

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\bsrcset\s*=/i.test(tag) || /\bdata-progressive-src\s*=/i.test(tag)) return tag;

    const sourceMatch = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    if (!sourceMatch) return tag;

    const originalSrc = sourceMatch[2];
    let url;
    try {
      url = new URL(originalSrc, 'http://localhost');
    } catch {
      return tag;
    }

    if (!url.pathname.startsWith('/storage/') || !/\.(?:jpe?g|png|webp|bmp)$/i.test(url.pathname)) {
      return tag;
    }

    url.pathname = url.pathname.replace(/^\/storage\//, '/image-preview/');
    const previewSrc = originalSrc.startsWith('http')
      ? url.href
      : `${url.pathname}${url.search}${url.hash}`;

    const updatedTag = tag
      .replace(sourceMatch[0], `src="${escapeAttribute(previewSrc)}"`);
    return updatedTag.replace(/(\/?>)$/, ` data-progressive-src="${escapeAttribute(originalSrc)}"$1`);
  });
}

function escapeAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export default ProgressiveHtmlContent;
