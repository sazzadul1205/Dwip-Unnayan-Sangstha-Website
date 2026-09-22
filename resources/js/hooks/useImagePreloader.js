// resources/js/hooks/useImagePreloader.js

import { useEffect, useState, useMemo } from 'react';

/**
 * useImagePreloader
 * ------------------------------------------------------------------
 * Preloads a set of images. Returns load state + progress.
 * Useful for gating render of hero blocks or warming the cache.
 */
export function useImagePreloader(urls = []) {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState([]);

  const key = useMemo(() => (urls || []).filter(Boolean).join('|'), [urls]);

  useEffect(() => {
    const list = (urls || []).filter(Boolean);

    if (list.length === 0) {
      setLoaded(true);
      setProgress(100);
      setFailed([]);
      return;
    }

    let cancelled = false;
    let completed = 0;
    const failedUrls = [];
    const imgs = [];

    const promises = list.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          imgs.push(img);

          img.onload = () => {
            completed += 1;
            if (!cancelled) setProgress(Math.round((completed / list.length) * 100));
            resolve();
          };

          img.onerror = () => {
            failedUrls.push(url);
            completed += 1;
            if (!cancelled) {
              setProgress(Math.round((completed / list.length) * 100));
              setFailed([...failedUrls]);
            }
            resolve();
          };

          img.src = url;
        })
    );

    Promise.all(promises).then(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => {
      cancelled = true;
      imgs.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { loaded, progress, failed };
}

/**
 * useImagePreload — fire-and-forget. Warms the browser cache.
 */
export function useImagePreload(urls = []) {
  const key = useMemo(() => (urls || []).filter(Boolean).join('|'), [urls]);

  useEffect(() => {
    const list = (urls || []).filter(Boolean);
    if (!list.length) return;

    const imgs = list.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });

    return () => {
      imgs.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/**
 * useImagePreloadAll — accepts nested arrays / objects and flattens
 * all string URLs. Useful for preloading every image on a page.
 *
 * @example
 * useImagePreloadAll([slides, blogPosts, galleryImages]);
 */
export function useImagePreloadAll(sources = []) {
  const flatUrls = useMemo(() => {
    const out = [];
    const visit = (v) => {
      if (!v) return;
      if (typeof v === 'string' && /^(https?:|\/|data:)/.test(v)) {
        out.push(v);
      } else if (Array.isArray(v)) {
        v.forEach(visit);
      } else if (typeof v === 'object') {
        Object.values(v).forEach(visit);
      }
    };
    sources.forEach(visit);
    return out;
  }, [sources]);

  useImagePreload(flatUrls);
}