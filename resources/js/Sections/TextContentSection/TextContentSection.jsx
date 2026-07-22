// js/Sections/TextContentSection/TextContentSection.jsx

import React from 'react';
import { sanitizeHTML } from '../../utils/sectionHelpers';

/**
 * TextContentSection Component
 * 
 * Renders arbitrary HTML content (like legal terms, privacy policy, etc.)
 * using the application's global typography and spacing styles.
 * 
 * @param {Object} props
 * @param {Object} props.data - Data from API (from DynamicSectionRenderer)
 * @param {Object} props.textData - Direct prop (legacy support)
 * @param {Object} props.textContentSection - Data from DynamicSectionRenderer (propName)
 * @param {string} props.bgColor - Background color (default: 'bg-white')
 * @param {string} props.paddingY - Vertical padding (default: 'py-10 sm:py-15 md:py-25 lg:py-37.5')
 * @param {string} props.paddingX - Horizontal padding (default: 'px-5 sm:px-10 md:px-20 lg:px-50')
 * @param {string} props.maxWidth - Max width of content container (default: 'max-w-4xl lg:max-w-6xl')
 * @param {string} props.sectionClassName - Additional CSS classes
 * @param {string} props.sectionId - Section ID (default: 'text-content')
 */
const TextContentSection = ({
  data,
  textData,
  textContentSection,
  bgColor = 'bg-white',
  paddingY = 'py-10 sm:py-15 md:py-25 lg:py-37.5',
  paddingX = 'px-5 sm:px-10 md:px-20 lg:px-50',
  maxWidth = 'max-w-4xl lg:max-w-6xl',
  sectionClassName = '',
  sectionId = 'text-content',
}) => {
  // ============================================
  // RESOLVE DATA - Check all possible prop names
  // ============================================
  let resolvedData = data || textData || textContentSection;

  // ============================================
  // NORMALIZE DATA STRUCTURE
  // ============================================
  // Check if the data is wrapped in a 'data' property
  if (resolvedData.data && typeof resolvedData.data === 'object') {
    resolvedData = resolvedData.data;
  }

  // ============================================
  // SAFE DESTRUCTURING
  // ============================================
  const { content = {} } = resolvedData;

  // ============================================
  // CHECK FOR CONTENT
  // ============================================
  const htmlContent = content.html || content.content || content.text || '';


  // ============================================
  // SANITIZE HTML
  // ============================================
  const sanitizedHtml = sanitizeHTML(htmlContent);

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      id={sectionId}
      className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}
    >
      <div className={`mx-auto ${maxWidth}`}>
        <div
          className="prose prose-lg lg:prose-xl max-w-none
                     prose-headings:font-700 prose-headings:text-[#080C14]
                     prose-h1:text-3xl sm:prose-h1:text-4xl lg:prose-h1:text-5xl prose-h1:mt-8 prose-h1:mb-4
                     prose-h2:text-2xl sm:prose-h2:text-3xl lg:prose-h2:text-4xl prose-h2:mt-8 prose-h2:mb-4
                     prose-h3:text-xl sm:prose-h3:text-2xl lg:prose-h3:text-3xl prose-h3:mt-6 prose-h3:mb-3
                     prose-h4:text-lg sm:prose-h4:text-xl lg:prose-h4:text-2xl prose-h4:mt-6 prose-h4:mb-3
                     prose-h5:text-base sm:prose-h5:text-lg lg:prose-h5:text-xl prose-h5:mt-4 prose-h5:mb-2
                     prose-h6:text-sm sm:prose-h6:text-base lg:prose-h6:text-lg prose-h6:mt-4 prose-h6:mb-2
                     prose-p:text-base sm:prose-p:text-lg lg:prose-p:text-xl prose-p:text-[#333333] prose-p:leading-relaxed prose-p:mb-4
                     prose-strong:text-[#009BE2] prose-strong:font-700
                     prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-3 prose-ul:mb-6
                     prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-3 prose-ol:mb-6
                     prose-li:text-base sm:prose-li:text-lg lg:prose-li:text-xl prose-li:text-[#333333] prose-li:leading-relaxed
                     prose-a:text-[#009BE2] prose-a:underline hover:prose-a:no-underline
                     prose-blockquote:border-l-4 prose-blockquote:border-[#009BE2] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[#333333]
                     prose-code:bg-gray-100 prose-code:rounded prose-code:px-2 prose-code:py-1 prose-code:text-sm prose-code:font-mono
                     prose-hr:border-t prose-hr:border-gray-300 prose-hr:my-8
                     prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto
          "
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </div>
    </section>
  );
};

export default TextContentSection;