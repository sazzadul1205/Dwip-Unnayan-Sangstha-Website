// js/pages/Frontend/Home/Components/Banner.jsx

// React
import React from 'react';

// Arrow Icon
import ArrowIcon from './ArrowIcon';

const Banner = () => {
  // In-page JSON data
  const bannerData = {
    background: {
      src: "/storage/uploads/banners/Background.jpg",
      alt: "Background"
    },
    overlay: {
      darkOverlay: "bg-black/50",
      gradient: "bg-linear-to-r from-black/85 via-black/10 to-transparent"
    },
    content: {
      tagline: {
        text: "Together, We Create Impact",
        className: "uppercase tracking-[4px] text-[30px] font-semibold"
      },
      title: {
        text: "Be the Light for Someone in Need",
        className: "text-[100px] font-bold leading-tight"
      },
      description: {
        text: "Your kindness has the power to change lives. Join us in bringing hope, support, and brighter futures to those in need. Every donation makes a difference big or small.",
        className: "font-normal text-[30px] leading-tight"
      }
    },
    buttons: [
      {
        id: 1,
        text: "Become a Volunteer",
        variant: "primary",
        className: "bg-[#009BE2] text-white hover:bg-[#009BE2]/90",
        icon: true
      },
      {
        id: 2,
        text: "How can I help?",
        variant: "secondary",
        className: "bg-white text-black hover:bg-gray-50",
        icon: true
      }
    ]
  };

  return (
    <section
      id="banner"
      className="relative w-full h-250 overflow-hidden"
    >

      {/* Background Image */}
      <img
        src={bannerData.background.src}
        alt={bannerData.background.alt}
        className="w-full h-full object-cover"
      />

      {/* Dark Overlay */}
      <div className={`absolute inset-0 ${bannerData.overlay.darkOverlay}`}></div>

      {/* Left Dark Gradient */}
      <div className={`absolute inset-0 ${bannerData.overlay.gradient}`}></div>

      {/* Content */}
      <div className="absolute left-24 inset-0 flex items-center p-12.5">
        <div className="max-w-215.75 px-20 md:px-20 text-white space-y-5">

          {/* Tagline */}
          <p className={`bricolage-grotesque ${bannerData.content.tagline.className} text-white`}>
            {bannerData.content.tagline.text}
          </p>

          {/* Title */}
          <h1 className={`bricolage-grotesque ${bannerData.content.title.className} w-215.75`}>
            {bannerData.content.title.text}
          </h1>

          {/* Description */}
          <p className={`bricolage-grotesque ${bannerData.content.description.className} text-white w-215.75`}>
            {bannerData.content.description.text}
          </p>

          {/* Buttons */}
          <div className='flex items-center gap-6 pt-7.5'>
            {bannerData.buttons.map((button) => (
              <button
                key={button.id}
                className={`capitalize font-600 text-[18px] px-7.5 py-5 bricolage-grotesque rounded-md inline-flex items-center gap-3 group transition-all duration-300 ${button.className}`}
              >
                <span>{button.text}</span>
                {button.icon && (
                  <ArrowIcon className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                )}
              </button>
            ))}
          </div>

        </div>
      </div>

    </section>
  );
};

export default Banner;