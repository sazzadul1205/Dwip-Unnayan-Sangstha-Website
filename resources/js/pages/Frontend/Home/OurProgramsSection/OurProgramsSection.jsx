// resources/js/pages/Frontend/Home/Sections/OurPrograms.jsx

import React, { useRef, useEffect, useState } from "react";
import ArrowIcon from "../../../../components/Shared/ArrowIcon";

const OurProgramsSection = ({ programsData }) => {
  const [visibleCards, setVisibleCards] = useState([]);
  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardId = parseInt(entry.target.getAttribute("data-id"));

          if (entry.isIntersecting) {
            setVisibleCards((prev) => {
              if (!prev.includes(cardId)) {
                return [...prev, cardId];
              }
              return prev;
            });
          }
        });
      },
      {
        threshold: 0.25,
      }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  const hasTitle = programsData?.section?.title;
  const hasDescription = programsData?.section?.description;
  const hasButton = programsData?.section?.button?.text;

  const showHeader = hasTitle || hasDescription || hasButton;

  const programs = programsData?.programs || [];

  return (
    <section
      id="our-programs"
      className="bg-white py-12 sm:py-16 lg:py-20 px-5 sm:px-10 md:px-20 lg:px-50"
    >
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-8 sm:pb-10 lg:pb-15 gap-5">
          {(hasTitle || hasDescription) && (
            <div className="max-w-250">
              {hasTitle && (
                <h1 className="bricolage-grotesque font-700 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] text-[#080C14] pb-3 sm:pb-4 lg:pb-5">
                  {programsData.section.title}
                </h1>
              )}

              {hasDescription && (
                <p className="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#515151]">
                  {programsData.section.description}
                </p>
              )}
            </div>
          )}

          {hasButton && (
            <button
              onClick={() => {
                if (programsData.section.button.link) {
                  window.location.href =
                    programsData.section.button.link;
                }
              }}
              className="bricolage-grotesque border border-[#009BE2] rounded-md text-[#009BE2] px-5 sm:px-6 lg:px-7.5 py-3 sm:py-4 lg:py-5 font-600 text-[14px] sm:text-[15px] lg:text-[16px] inline-flex items-center gap-3 group hover:bg-[#009BE2] hover:text-white transition-all duration-300 whitespace-nowrap"
            >
              {programsData.section.button.text}

              <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
            </button>
          )}
        </div>
      )}

      {/* Programs */}
      {programs.length > 0 && (
        <>
          <div
            className={`relative ${showHeader ? "mt-16 sm:mt-24 lg:mt-32" : ""
              }`}
            style={{
              height: `${programs.length * 100}vh`,
            }}
          >
            {programs.map((program, index) => (
              <div
                key={program.id}
                ref={(el) => (cardsRef.current[index] = el)}
                data-id={program.id}
                className={`
                  sticky top-25 w-full
                  transition-all duration-700 ease-out
                  ${visibleCards.includes(program.id)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-16"
                  }
                `}
                style={{
                  zIndex: index + 1,
                }}
              >
                <div
                  className={`
                    ${program.bgColor}
                    flex flex-col lg:flex-row
                    justify-between
                    items-center
                    gap-8 lg:gap-25
                    p-5 sm:p-6 md:p-8 lg:p-25
                    rounded-3xl
                    min-h-162.5
                    lg:h-187.5
                    shadow-lg
                  `}
                >
                  {/* Left Content */}
                  <div className="w-full lg:w-1/2 flex flex-col justify-center">
                    <h3 className="bricolage-grotesque font-600 text-[24px] sm:text-[28px] md:text-[36px] lg:text-[46px] text-[#080C14] leading-tight mb-5">
                      {program.title &&
                        program.title
                          .split("<br />")
                          .map((line, idx) => (
                            <React.Fragment key={idx}>
                              {line}
                              {idx !==
                                program.title.split("<br />").length -
                                1 && <br />}
                            </React.Fragment>
                          ))}
                    </h3>

                    {program.description && (
                      <p
                        className="
                          bricolage-grotesque
                          font-400
                          text-[14px]
                          sm:text-[16px]
                          lg:text-[20px]
                          text-[#524B48]
                          leading-relaxed
                          line-clamp-9
                        "
                      >
                        { program.description}
                      </p>
                    )}

                    {program.link && (
                      <button
                        onClick={() =>
                          (window.location.href = program.link)
                        }
                        className="mt-6 bricolage-grotesque flex items-center gap-2 font-500 lg:font-600 text-[16px] sm:text-[17px] lg:text-[20px] text-[#009BE2] group hover:text-[#080C14] transition-colors duration-300"
                      >
                        Read more

                        <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                      </button>
                    )}
                  </div>

                  {/* Right Image */}
                  <div className="w-full lg:w-1/2">
                    {program.image && (
                      <img
                        src={program.image}
                        alt={program.title || "Program image"}
                        className="
                          w-full
                          h-75
                          sm:h-100
                          lg:h-150
                          object-cover
                          rounded-3xl
                        "
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-50" />
        </>
      )}
    </section>
  );
};

export default OurProgramsSection;