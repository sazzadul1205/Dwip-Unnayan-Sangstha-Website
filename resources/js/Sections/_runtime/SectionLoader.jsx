// resources/js/Sections/_runtime/SectionLoader.jsx

import { Skeleton, SkeletonText } from '../../Shared/Skeletons/SkeletonPrimitives';

/**
 * Generic skeleton fallback for lazy-loaded sections.
 * Used by React Suspense while a section's JS chunk downloads.
 *
 * This is NOT the data-skeleton (those live inside each section and are
 * driven by the `loading` prop). This is only the chunk-load placeholder.
 */
const SectionLoader = ({ message = 'Loading section...' }) => {
  return (
    <div
      data-frontend-loader="true"
      className="w-full py-12 sm:py-16 md:py-20 lg:py-25"
      aria-busy="true"
      aria-label={message}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50 space-y-6">
        {/* Title */}
        <Skeleton className="h-8 sm:h-10 lg:h-12 w-2/3 sm:w-1/2" />

        {/* Body lines */}
        <SkeletonText lines={3} lineClassName="h-4 sm:h-4.5 lg:h-5" />

        {/* Big block — generic image/table/card area */}
        <Skeleton className="h-48 sm:h-64 md:h-80 w-full rounded-2xl mt-8" />
      </div>
    </div>
  );
};

export default SectionLoader;