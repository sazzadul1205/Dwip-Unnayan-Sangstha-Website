// resources/js/Pages/Frontend/ProjectsPrograms/ProjectsPrograms.jsx

// Inertia
import { Head } from "@inertiajs/react";

// Layout
import PublicLayout from '../../../layouts/PublicLayout';
import BannerSection from "../About/BannerSection/BannerSection";
import OurProgramsSection from "../Home/OurProgramsSection/OurProgramsSection";


const ProjectsPrograms = ({
  // Shared 
  topBarData,
  navbarData,
  footerData,


}) => {

  // Banner Data
  const bannerData = {
    'background': {
      'src': 'https://placehold.co/1920x589',
      'alt': 'Background'
    },
    'overlay': {
      'darkOverlay': 'bg-black/40 lg:bg-black/50',
      'gradient': 'bg-gradient-to-r from-black/85 via-black/10 to-transparent'
    },
    'content': {
      'title': {
        'text': 'Meet Our Charity Projects',
        'className': 'font-bold leading-tight'
      },
    },
  };


  return (
    <PublicLayout topBarData={topBarData} navbarData={navbarData} footerData={footerData} >
      <Head title="Projects Programs | DUS - Dwip Unnayan Society | Empowering Communities" />


      <BannerSection bannerData={bannerData} sectionId='projects-programs-banner' />

      <OurProgramsSection />
    </PublicLayout >
  );
};

export default ProjectsPrograms;