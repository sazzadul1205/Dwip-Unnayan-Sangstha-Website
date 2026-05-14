import React from 'react';

const WhereWeWork = () => {
  // In-page JSON data
  const workData = {
    section: {
      title: "Where We Work"
    },
    stats: [
      {
        id: 1,
        icon: "/storage/uploads/Home/WhereWeWork/001-kindness.png",
        value: "450K",
        label: "Total Member Reach",
        alt: "Member Reach Icon"
      },
      {
        id: 2,
        icon: "/storage/uploads/Home/WhereWeWork/001-kindness.png",
        value: "450K",
        label: "Total Member Reach",
        alt: "Member Reach Icon"
      },
      {
        id: 3,
        icon: "/storage/uploads/Home/WhereWeWork/001-kindness.png",
        value: "450K",
        label: "Total Member Reach",
        alt: "Member Reach Icon"
      },
      {
        id: 4,
        icon: "/storage/uploads/Home/WhereWeWork/001-kindness.png",
        value: "41,382",
        label: "Mail Engaged in Diverse Livelihoods Options",
        alt: "Mail Engaged Icon"
      },
      {
        id: 5,
        icon: "/storage/uploads/Home/WhereWeWork/001-kindness.png",
        value: "35,193",
        label: "Women Engaged in Diverse Livelihoods Options",
        alt: "Women Engaged Icon"
      },
      {
        id: 6,
        icon: "/storage/uploads/Home/WhereWeWork/001-kindness.png",
        value: "41,382",
        label: "Mail Engaged in Diverse Livelihoods Options",
        alt: "Mail Engaged Icon"
      }
    ],
    image: {
      src: "https://placehold.es/710x930/cccccc/webp?text=Map%20Place%20holder%20Text",
      alt: "Map Place holder Text",
      className: "w-full h-232.5 object-cover rounded-4xl"
    }
  };

  return (
    <section
      id='where-we-work'
      className='flex flex-col lg:flex-row justify-between bg-white gap-15 px-50 py-37.5'
    >
      {/* Left Section - Text Content */}
      <div className='w-full lg:w-1/2 flex flex-col justify-between space-y-12.5'>
        <h1 className='bricolage-grotesque font-700 text-[40px] text-[#080C14]'>
          {workData.section.title}
        </h1>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          {workData.stats.map((stat) => (
            <div
              key={stat.id}
              className='bg-[#F5F5F5] text-center p-8 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group cursor-pointer'
            >
              <img
                src={stat.icon}
                alt={stat.alt}
                className='w-15 h-15 mx-auto mb-7.5 group-hover:scale-110 transition-transform duration-300'
              />
              <h3 className='bricolage-grotesque font-600 text-[50px] text-[#080C14] leading-tight'>
                {stat.value}
              </h3>
              <p className='font-600 text-[16px] text-[#080C14] max-w-63.75 mx-auto leading-relaxed'>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Section - Image */}
      <div className='w-full lg:w-1/2 flex mt-10 lg:mt-0'>
        <img
          src={workData.image.src}
          alt={workData.image.alt}
          className={workData.image.className}
        />
      </div>
    </section>
  );
};

export default WhereWeWork;