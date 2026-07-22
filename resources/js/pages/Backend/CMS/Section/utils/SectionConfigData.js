
// Section-specific custom props configuration
export const SECTION_CONFIGS = {
  // Banner Sections
  'HomeBanner': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: '' },
      {
        key: 'height', label: 'Height', type: 'select', default: 'h-125 md:h-280', options: [
          { value: 'h-100 md:h-200', label: 'Small' },
          { value: 'h-125 md:h-280', label: 'Medium' },
          { value: 'h-150 md:h-350', label: 'Large' },
          { value: 'h-175 md:h-400', label: 'Extra Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'PageBannerSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: '' },
      {
        key: 'height', label: 'Height', type: 'select', default: 'h-125 md:h-147.25', options: [
          { value: 'h-100 md:h-120', label: 'Small' },
          { value: 'h-125 md:h-147.25', label: 'Medium' },
          { value: 'h-150 md:h-180', label: 'Large' },
        ]
      },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: '', options: [
          { value: '', label: 'Default' },
          { value: 'py-10 sm:py-15 md:py-20', label: 'Small' },
          { value: 'py-15 sm:py-20 md:py-30', label: 'Medium' },
          { value: 'py-20 sm:py-30 md:py-40', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: '', options: [
          { value: '', label: 'Default' },
          { value: 'px-5 sm:px-10 md:px-20', label: 'Small' },
          { value: 'px-10 sm:px-20 md:px-30', label: 'Medium' },
          { value: 'px-20 sm:px-30 md:px-40', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },

  // Content Sections
  'AboutUsSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-15 md:py-25 lg:py-37.5', options: [
          { value: 'py-5 sm:py-10 md:py-15 lg:py-20', label: 'Small' },
          { value: 'py-10 sm:py-15 md:py-25 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-10 md:px-20 lg:px-50', options: [
          { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
          { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'OurActionSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-[#F5F5F5]' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-15 md:py-25 lg:py-37.5', options: [
          { value: 'py-5 sm:py-10 md:py-15 lg:py-20', label: 'Small' },
          { value: 'py-10 sm:py-15 md:py-25 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-10 md:px-20 lg:px-50', options: [
          { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
          { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'WhereWeWorkSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-15 md:py-25 lg:py-37.5', options: [
          { value: 'py-5 sm:py-10 md:py-15 lg:py-20', label: 'Small' },
          { value: 'py-10 sm:py-15 md:py-25 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-10 md:px-20 lg:px-50', options: [
          { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
          { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'OurProgramsSection': {
    fields: [
      { 
        key: 'limit', 
        label: 'Display Limit', 
        type: 'number', 
        default: 3,
        min: 1,
        max: 20,
        description: 'Number of programs to display (1-20)'
      },
      { 
        key: 'showFeatured', 
        label: 'Show Featured Programs First', 
        type: 'checkbox', 
        default: true 
      },
      { 
        key: 'bgColor', 
        label: 'Background Color', 
        type: 'color', 
        default: 'bg-white' 
      },
      {
        key: 'paddingY',
        label: 'Vertical Padding',
        type: 'select',
        default: 'py-12 sm:py-16 lg:py-20',
        options: [
          { value: 'py-8 sm:py-12 lg:py-16', label: 'Small' },
          { value: 'py-12 sm:py-16 lg:py-20', label: 'Medium' },
          { value: 'py-16 sm:py-20 lg:py-30', label: 'Large' },
        ]
      },
      {
        key: 'paddingX',
        label: 'Horizontal Padding',
        type: 'select',
        default: 'px-5 sm:px-10 md:px-20 lg:px-50',
        options: [
          { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
          { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
        ]
      },
      { 
        key: 'sectionClassName', 
        label: 'Additional CSS Classes', 
        type: 'text', 
        default: '' 
      },
    ]
  },
  'StoriesSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-[#F5F5F5]' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-12 sm:py-16 md:py-25 lg:py-37.5', options: [
          { value: 'py-8 sm:py-12 md:py-20 lg:py-25', label: 'Small' },
          { value: 'py-12 sm:py-16 md:py-25 lg:py-37.5', label: 'Medium' },
          { value: 'py-16 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'BlogSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
      { key: 'sectionTitle', label: 'Section Title', type: 'text', default: 'Latest Stories' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-15 md:py-20 lg:py-37.5', options: [
          { value: 'py-8 sm:py-12 md:py-16 lg:py-25', label: 'Small' },
          { value: 'py-10 sm:py-15 md:py-20 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-20 md:py-30 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-8 md:px-12 lg:px-50', options: [
          { value: 'px-4 sm:px-6 md:px-10 lg:px-30', label: 'Small' },
          { value: 'px-5 sm:px-8 md:px-12 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-12 md:px-20 lg:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'JobsSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-[#F5F5F5]' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-12 sm:py-16 md:py-25 lg:py-37.5', options: [
          { value: 'py-8 sm:py-12 md:py-20 lg:py-25', label: 'Small' },
          { value: 'py-12 sm:py-16 md:py-25 lg:py-37.5', label: 'Medium' },
          { value: 'py-16 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-10 md:px-20 lg:px-75', options: [
          { value: 'px-4 sm:px-8 md:px-16 lg:px-50', label: 'Small' },
          { value: 'px-5 sm:px-10 md:px-20 lg:px-75', label: 'Medium' },
          { value: 'px-8 sm:px-16 md:px-30 lg:px-100', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'ProgramImpactSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-12 sm:py-16 md:py-25 lg:py-37.5', options: [
          { value: 'py-8 sm:py-12 md:py-20 lg:py-25', label: 'Small' },
          { value: 'py-12 sm:py-16 md:py-25 lg:py-37.5', label: 'Medium' },
          { value: 'py-16 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-10 md:px-20 lg:px-75', options: [
          { value: 'px-4 sm:px-8 md:px-16 lg:px-50', label: 'Small' },
          { value: 'px-5 sm:px-10 md:px-20 lg:px-75', label: 'Medium' },
          { value: 'px-8 sm:px-16 md:px-30 lg:px-100', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'UpcomingEventsSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-[#FFFFFF]' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-12 sm:py-16 md:py-25 lg:py-37.5', options: [
          { value: 'py-8 sm:py-12 md:py-20 lg:py-25', label: 'Small' },
          { value: 'py-12 sm:py-16 md:py-25 lg:py-37.5', label: 'Medium' },
          { value: 'py-16 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-10 md:px-20 lg:px-50', options: [
          { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
          { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'HeroFigureSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
      {
        key: 'layout', label: 'Layout', type: 'select', default: 'text-left', options: [
          { value: 'text-left', label: 'Image Right' },
          { value: 'text-right', label: 'Image Left' },
        ]
      },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-15 md:py-25 lg:py-37.5', options: [
          { value: 'py-5 sm:py-10 md:py-15 lg:py-20', label: 'Small' },
          { value: 'py-10 sm:py-15 md:py-25 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-10 md:px-20 lg:px-50', options: [
          { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
          { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'CardsSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-8 sm:py-12 md:py-20 lg:py-37.5', options: [
          { value: 'py-5 sm:py-8 md:py-15 lg:py-25', label: 'Small' },
          { value: 'py-8 sm:py-12 md:py-20 lg:py-37.5', label: 'Medium' },
          { value: 'py-12 sm:py-16 md:py-30 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-4 sm:px-8 md:px-16 lg:px-50', options: [
          { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
          { value: 'px-4 sm:px-8 md:px-16 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-12 md:px-24 lg:px-60', label: 'Large' },
        ]
      },
      {
        key: 'gap', label: 'Gap Between Cards', type: 'select', default: 'gap-6 sm:gap-8 md:gap-12 lg:gap-25', options: [
          { value: 'gap-4 sm:gap-6 md:gap-8 lg:gap-15', label: 'Small' },
          { value: 'gap-6 sm:gap-8 md:gap-12 lg:gap-25', label: 'Medium' },
          { value: 'gap-8 sm:gap-12 md:gap-16 lg:gap-35', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'FAQSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-[#F5F5F5]' },
      { key: 'defaultOpenId', label: 'Default Open FAQ ID', type: 'number', default: 1 },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-15 md:py-20 lg:py-37.5', options: [
          { value: 'py-5 sm:py-10 md:py-15 lg:py-25', label: 'Small' },
          { value: 'py-10 sm:py-15 md:py-20 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-20 md:py-30 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-4 sm:px-6 md:px-10 lg:px-20 xl:px-50', options: [
          { value: 'px-4 sm:px-6 md:px-10 lg:px-20 xl:px-30', label: 'Small' },
          { value: 'px-4 sm:px-6 md:px-10 lg:px-20 xl:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-12 md:px-20 lg:px-30 xl:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'ContactOfficeSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
      { key: 'title', label: 'Section Title', type: 'text', default: 'Our Offices' },
      { key: 'orgName', label: 'Organization Name', type: 'text', default: 'Dwip Unnayan Songstha (DUS)' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-14 lg:py-37.5', options: [
          { value: 'py-5 sm:py-10 lg:py-25', label: 'Small' },
          { value: 'py-10 sm:py-14 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-20 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-4 sm:px-6 lg:px-50', options: [
          { value: 'px-4 sm:px-6 lg:px-30', label: 'Small' },
          { value: 'px-4 sm:px-6 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-12 lg:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'AddressSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-[#F5F5F5]' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-14 lg:py-37.5', options: [
          { value: 'py-5 sm:py-10 lg:py-25', label: 'Small' },
          { value: 'py-10 sm:py-14 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-20 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-4 sm:px-6 lg:px-50', options: [
          { value: 'px-4 sm:px-6 lg:px-30', label: 'Small' },
          { value: 'px-4 sm:px-6 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-12 lg:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'ContactReachSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-[#F5F5F5]' },
      { key: 'title', label: 'Section Title', type: 'text', default: 'Reach out to us today!' },
      { key: 'buttonText', label: 'Button Text', type: 'text', default: 'Submit Message' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-20 lg:py-37.5', options: [
          { value: 'py-5 sm:py-15 lg:py-25', label: 'Small' },
          { value: 'py-10 sm:py-20 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-25 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-6 sm:px-10 md:px-16 lg:px-20 xl:px-50', options: [
          { value: 'px-4 sm:px-8 md:px-12 lg:px-16 xl:px-30', label: 'Small' },
          { value: 'px-6 sm:px-10 md:px-16 lg:px-20 xl:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-12 md:px-20 lg:px-30 xl:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'FollowUSSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
      { key: 'title', label: 'Section Title', type: 'text', default: 'Follow Us' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-14 lg:py-37.5', options: [
          { value: 'py-5 sm:py-10 lg:py-25', label: 'Small' },
          { value: 'py-10 sm:py-14 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-20 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-4 sm:px-6 lg:px-8 xl:px-50', options: [
          { value: 'px-4 sm:px-6 lg:px-8 xl:px-30', label: 'Small' },
          { value: 'px-4 sm:px-6 lg:px-8 xl:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-12 lg:px-16 xl:px-60', label: 'Large' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },
  'LegalSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: '' },
      {
        key: 'height', label: 'Height', type: 'select', default: 'h-125 md:h-147.25', options: [
          { value: 'h-100 md:h-120', label: 'Small' },
          { value: 'h-125 md:h-147.25', label: 'Medium' },
          { value: 'h-150 md:h-180', label: 'Large' },
        ]
      },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: '', options: [
          { value: '', label: 'Default' },
          { value: 'py-5 sm:py-10 md:py-15', label: 'Small' },
          { value: 'py-10 sm:py-15 md:py-20', label: 'Medium' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: '', options: [
          { value: '', label: 'Default' },
          { value: 'px-5 sm:px-10 md:px-20', label: 'Small' },
          { value: 'px-10 sm:px-20 md:px-30', label: 'Medium' },
        ]
      },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },

  'TextContentSection': {
    fields: [
      { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
      {
        key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-15 md:py-25 lg:py-37.5', options: [
          { value: 'py-5 sm:py-10 md:py-15 lg:py-20', label: 'Small' },
          { value: 'py-10 sm:py-15 md:py-25 lg:py-37.5', label: 'Medium' },
          { value: 'py-15 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
        ]
      },
      {
        key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-10 md:px-20 lg:px-50', options: [
          { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
          { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
          { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
        ]
      },
      {
        key: 'maxWidth', label: 'Max Width', type: 'select', default: 'max-w-4xl lg:max-w-6xl', options: [
          { value: 'max-w-3xl', label: 'Narrow' },
          { value: 'max-w-4xl lg:max-w-6xl', label: 'Default' },
          { value: 'max-w-5xl lg:max-w-7xl', label: 'Wide' },
        ]
      },
      { key: 'sectionId', label: 'Section ID', type: 'text', default: 'text-content' },
      { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    ]
  },

  'PublicationsSection': {
  fields: [
    { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
    { key: 'sectionTitle', label: 'Section Title', type: 'text', default: 'Our Publications' },
    {
      key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-15 md:py-20 lg:py-37.5', options: [
        { value: 'py-8 sm:py-12 md:py-16 lg:py-25', label: 'Small' },
        { value: 'py-10 sm:py-15 md:py-20 lg:py-37.5', label: 'Medium' },
        { value: 'py-15 sm:py-20 md:py-30 lg:py-50', label: 'Large' },
      ]
    },
    {
      key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-8 md:px-12 lg:px-50', options: [
        { value: 'px-4 sm:px-6 md:px-10 lg:px-30', label: 'Small' },
        { value: 'px-5 sm:px-8 md:px-12 lg:px-50', label: 'Medium' },
        { value: 'px-8 sm:px-12 md:px-20 lg:px-60', label: 'Large' },
      ]
    },
    { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
    { key: 'isRelated', label: 'Is Related Section', type: 'checkbox', default: false },
  ]
},
};

// Default config for sections without specific config
export const DEFAULT_CONFIG = {
  fields: [
    { key: 'bgColor', label: 'Background Color', type: 'color', default: 'bg-white' },
    {
      key: 'paddingY', label: 'Vertical Padding', type: 'select', default: 'py-10 sm:py-15 md:py-25 lg:py-37.5', options: [
        { value: 'py-5 sm:py-10 md:py-15 lg:py-20', label: 'Small' },
        { value: 'py-10 sm:py-15 md:py-25 lg:py-37.5', label: 'Medium' },
        { value: 'py-15 sm:py-20 md:py-35 lg:py-50', label: 'Large' },
      ]
    },
    {
      key: 'paddingX', label: 'Horizontal Padding', type: 'select', default: 'px-5 sm:px-10 md:px-20 lg:px-50', options: [
        { value: 'px-4 sm:px-8 md:px-16 lg:px-30', label: 'Small' },
        { value: 'px-5 sm:px-10 md:px-20 lg:px-50', label: 'Medium' },
        { value: 'px-8 sm:px-16 md:px-30 lg:px-60', label: 'Large' },
      ]
    },
    { key: 'sectionClassName', label: 'Additional CSS Classes', type: 'text', default: '' },
  ]
};
