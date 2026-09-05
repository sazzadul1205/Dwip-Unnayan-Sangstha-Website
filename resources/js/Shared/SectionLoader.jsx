// dus-frontend/src/Shared/SectionLoader.jsx

/**
 * ============================================
 * SECTION LOADER - Loading Skeleton Component
 * ============================================
 * 
 * PURPOSE:
 * - Shows a loading spinner while a section is being lazy-loaded
 * - Used as the fallback in Suspense for DynamicSectionRenderer
 * - Provides visual feedback during code splitting
 * 
 * USAGE:
 * <Suspense fallback={<SectionLoader message="Loading FAQ..." />}>
 *   <FAQSection />
 * </Suspense>
 * 
 * FEATURES:
 * - Spinning animation with brand color (#009BE2)
 * - Customizable loading message
 * - Full-width with centered content
 * - Minimum height for consistent layout
 * 
 * ============================================
 */

/**
 * SectionLoader Component
 * 
 * @param {Object} props
 * @param {string} props.message - Loading message to display (default: 'Loading Pages...')
 * 
 * @returns {JSX.Element} Loading spinner with message
 */
const SectionLoader = ({ message = "Loading Pages..." }) => {
  return (
    <div data-frontend-loader="true" className="w-full py-20 flex justify-center items-center min-h-screen">
      <div className="animate-pulse flex flex-col items-center">
        {/* Spinning border - brand color with transparent top */}
        <div className="w-12 h-12 border-4 border-[#009BE2] border-t-transparent rounded-full animate-spin" />
        {/* Loading message */}
        <p className="mt-4 text-[#515151] font-400">{message}</p>
      </div>
    </div>
  );
};

export default SectionLoader;