// resources/js/Pages/Frontend/About/About.jsx

// Inertia
import { Head } from "@inertiajs/react";

// Layout
import PublicLayout from '../../../layouts/PublicLayout';

// Sections
import FAQSection from "../About/FAQSection/FAQSection";
import BannerSection from "../About/BannerSection/BannerSection";
import OurProgramsSection from "../Home/OurProgramsSection/OurProgramsSection";

const ProjectsAndPrograms = ({
  // Shared 
  topBarData,
  navbarData,
  footerData,

  // Page Pacific
  faqData,
  bannerData,
  ourProgramsData,

}) => {
  return (
    <PublicLayout topBarData={topBarData} navbarData={navbarData} footerData={footerData} >
      <Head title="About Us | DUS - Dwip Unnayan Society | Empowering Communities" />

      <BannerSection bannerData={bannerData} sectionId='about-us-banner' />

      <OurProgramsSection programsData={ourProgramsData} />

      <FAQSection faqData={faqData} />

    </PublicLayout>
  );
};

export default ProjectsAndPrograms;