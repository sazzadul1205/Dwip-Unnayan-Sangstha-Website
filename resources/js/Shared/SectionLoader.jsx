// dus-frontend/src/Shared/SectionLoader.jsx

/**
 * ============================================
 * SECTION LOADER - Inline Loading Skeleton
 * ============================================
 *
 * PURPOSE:
 * - Shown as the Suspense fallback while a section's lazy chunk loads
 * - Reserves a modest amount of vertical space to avoid layout jank
 *   when the real section mounts
 *
 * NOTE:
 * - Does NOT reserve a full viewport height (old behaviour caused the
 *   page to scroll for hundreds of px while multiple sections loaded)
 * - The global loader (in app.blade.php) is what hides after first paint;
 *   this one only fills the slot of the section currently loading
 *
 * USAGE:
 * <Suspense fallback={<SectionLoader message="Loading FAQ..." />}>
 *   <FAQSection />
 * </Suspense>
 */

const SectionLoader = ({ message = "Loading..." }) => {
  return (
    <div
      data-frontend-loader="true"
      className="w-full min-h-60 py-16 flex justify-center items-center"
    >
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-[#009BE2] border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm text-[#515151]">{message}</p>
      </div>
    </div>
  );
};

export default SectionLoader;