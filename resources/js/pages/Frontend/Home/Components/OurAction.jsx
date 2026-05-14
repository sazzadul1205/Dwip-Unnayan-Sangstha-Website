import React from 'react';

const OurAction = () => {
  // In-page JSON data
  const actionData = {
    section: {
      title: "Our Actions for Social Change",
      description: "We turn compassion into action by implementing community-led programs, advocating for social justice, and promoting education, health, and equality"
    },
    actions: [
      {
        id: 1,
        icon: "/storage/uploads/Home/OurAction/006-mortarboard.png",
        title: "Education",
        description: "We empower communities by investing in sustainable projects, training livelihood programs.",
        alt: "Education Icon"
      },
      {
        id: 2,
        icon: "/storage/uploads/Home/OurAction/004-financial-inclusion.png",
        title: "Microfinance",
        description: "We empower communities by investing in sustainable projects, training livelihood programs.",
        alt: "Microfinance Icon"
      },
      {
        id: 3,
        icon: "/storage/uploads/Home/OurAction/007-cardiogram.png",
        title: "Health",
        description: "Providing nutritious meals and groceries to individuals and families in need.",
        alt: "Health Icon"
      },
      {
        id: 4,
        icon: "/storage/uploads/Home/OurAction/008-leadership.png",
        title: "Organizational Development",
        description: "We empower underprivileged children with the opportunity to learn, grow, and succeed.",
        alt: "Organizational Development Icon"
      },
      {
        id: 5,
        icon: "/storage/uploads/Home/OurAction/003-global-warming.png",
        title: "Climate Change",
        description: "From free medical camps to life-saving treatments, we support initiatives that provide critical aid to access to proper.",
        alt: "Climate Change Icon"
      },
      {
        id: 6,
        icon: "/storage/uploads/Home/OurAction/002-action.png",
        title: "Human Rights",
        description: "From free medical camps to life-saving treatments, we support initiatives that provide critical aid to access to proper.",
        alt: "Human Rights Icon"
      },
      {
        id: 7,
        icon: "/storage/uploads/Home/OurAction/009-teamwork.png",
        title: "Human Resource",
        description: "Bringing clean and safe drinking water to communities, improving sanitation, and preventing waterborne diseases.",
        alt: "Human Resource Icon"
      },
      {
        id: 8,
        icon: "/storage/uploads/Home/OurAction/001-user.png",
        title: "Social Enterprises",
        description: "We empower communities by investing in sustainable projects, training livelihood programs.",
        alt: "Social Enterprises Icon"
      },
      {
        id: 9,
        icon: "/storage/uploads/Home/OurAction/010-food-safety.png",
        title: "Agriculture Food Security",
        description: "Bringing clean and safe drinking water to communities, improving sanitation, and preventing waterborne diseases.",
        alt: "Agriculture Food Security Icon"
      },
    ]
  };

  return (
    <div className='mx-auto bg-[#F5F5F5] px-50 py-37.5'>
      {/* Section Header */}
      <div className="text-center">
        <h1 className='bricolage-grotesque font-700 text-[40px] text-center text-[#080C14] pb-4'>
          {actionData.section.title}
        </h1>
        <p className='mx-auto font-400 text-center text-[20px] max-w-253 text-[#515151] leading-relaxed'>
          {actionData.section.description}
        </p>
      </div>

      {/* Actions Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7.5 pt-12.5'>
        {actionData.actions.map((action) => (
          <div
            key={action.id}
            className='bg-[#FAFAFA] hover:bg-white p-12.5 rounded-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer hover:shadow-[0_6px_12px_rgba(0,0,0,0.10)]'
          >
            <img
              src={action.icon}
              alt={action.alt}
              className='w-12.5 h-12.5 group-hover:scale-110 transition-transform duration-300 mb-5'
            />
            <h3 className='bricolage-grotesque font-600 text-[24px] text-[#080C14] mb-3'>
              {action.title}
            </h3>
            <p className='font-400 text-[16px] text-[#515151] leading-relaxed'>
              {action.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OurAction;