// resources/js/Sections/FAQSection/FAQSection.jsx

import React, { useState } from 'react';

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

const FAQSection = ({
  faqData,
  data, // Alternative prop name
  bgColor = 'bg-[#F5F5F5]',
  paddingY = 'py-12 sm:py-16 md:py-20 lg:py-25 xl:py-30 2xl:py-37.5',
  paddingX = 'px-5 sm:px-8 md:px-12 lg:px-20 xl:px-30 2xl:px-50',
  sectionClassName = '',
  sectionId = 'faq',
  defaultOpenId = 1,
}) => {
  const [openId, setOpenId] = useState(defaultOpenId);

  // Use either faqData or data prop
  let actualData = faqData || data || {};

  // Normalize data structure - handle wrapped data
  if (actualData && actualData.data && typeof actualData.data === 'object') {
    actualData = actualData.data;
  }

  // Early return if no data (moved after hook)
  if (!hasValue(actualData)) return null;

  const { section = {}, faqs = [] } = actualData;

  const hasTitle = hasValue(section?.title);
  const hasSubtitle = hasValue(section?.subtitle);
  const hasFaqs = hasValue(faqs);
  const hasAnyContent = hasTitle || hasSubtitle || hasFaqs;

  if (!hasAnyContent) return null;

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id);
  };

  // Filter out FAQ items that have no question AND no answer
  const validFaqs = faqs.filter(faq =>
    hasValue(faq.question) || hasValue(faq.answer)
  );

  // If no valid FAQs after filtering, don't render the section
  if (validFaqs.length === 0 && !hasTitle && !hasSubtitle) {
    return null;
  }

  return (
    <section id={sectionId} className={`${bgColor} ${paddingX} ${paddingY} ${sectionClassName}`}>
      <div className='max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto text-center'>
        {hasTitle && (
          <h1 className='font-700 text-black text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] 2xl:text-[48px] leading-tight mb-2 sm:mb-3 md:mb-4 bricolage-grotesque'>
            {section.title}
          </h1>
        )}
        {hasSubtitle && (
          <p className='text-[#333333] text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] xl:text-[19px] 2xl:text-[20px] leading-relaxed bricolage-grotesque px-2 sm:px-4'>
            {section.subtitle}
          </p>
        )}
      </div>

      {hasFaqs && validFaqs.length > 0 && (
        <div className='mt-6 sm:mt-8 md:mt-10 lg:mt-12 xl:mt-15 space-y-2 sm:space-y-2.5 max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto'>
          {validFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            const hasQuestion = hasValue(faq.question);
            const hasAnswer = hasValue(faq.answer);

            return (
              <div
                key={faq.id}
                className='bg-white w-full rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md'
              >
                {hasQuestion && (
                  <button
                    className='w-full text-left py-3.5 sm:py-4 md:py-5 lg:py-6 xl:py-7.5 px-4 sm:px-5 md:px-6 lg:px-7.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#009BE2] focus:ring-inset'
                    onClick={() => toggleFAQ(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <div className='flex items-start sm:items-center justify-between gap-3 sm:gap-4'>
                      <h3 className={`font-600 text-[15px] sm:text-[16px] md:text-[18px] lg:text-[19px] xl:text-[20px] leading-tight flex-1 transition-colors duration-300 ${isOpen ? 'text-[#009BE2]' : 'text-[#080C14]'}`}>
                        {faq.question}
                      </h3>
                      <span
                        className={`font-600 text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] leading-tight shrink-0 transition-all duration-300 ease-in-out ${isOpen ? 'rotate-0 text-[#009BE2]' : 'rotate-0 text-[#080C14]'}`}
                        aria-hidden="true"
                      >
                        {isOpen ? '−' : '+'}
                      </span>
                    </div>
                  </button>
                )}
                {hasAnswer && (
                  <div
                    id={`faq-answer-${faq.id}`}
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                    role="region"
                    aria-labelledby={hasQuestion ? `faq-question-${faq.id}` : undefined}
                  >
                    <div className='px-4 sm:px-5 md:px-6 lg:px-7.5 pb-4 sm:pb-5 md:pb-6 lg:pb-7.5'>
                      <p className='text-[#333333] text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[17px] 2xl:text-[18px] leading-relaxed bricolage-grotesque'>
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default FAQSection;