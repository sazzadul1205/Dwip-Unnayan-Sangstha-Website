// resources/js/Pages/Frontend/About/About.jsx

// Inertia
import { Head } from "@inertiajs/react";

// Layout
import PublicLayout from '../../../layouts/PublicLayout';

// Sections
import FAQSection from "./FAQSection/FAQSection";
import CardsSection from "./CardsSection/CardsSection";
import LegalSection from "./LegalSection/LegalSection";
import BannerSection from "./BannerSection/BannerSection";
import HeroFigureSection from "./HeroFigureSection/HeroFigureSection";

const About = ({
  // Shared 
  topBarData,
  navbarData,
  footerData,

  // Page Pacific
  faqData,
  cardsData,
  legalData,
  bannerData,
  programsData,
  trainingData,
  backgroundData,
  governanceData,
  interventionalData,
  visionAndMissionData,
  evolutionaryChangesData,
}) => {

  return (
    <PublicLayout topBarData={topBarData} navbarData={navbarData} footerData={footerData} >
      <Head title="About Us | DUS - Dwip Unnayan Society | Empowering Communities" />

      <BannerSection bannerData={bannerData} sectionId='about-us-banner' />

      <HeroFigureSection
        layout="text-left"
        data={backgroundData}
        sectionId="background"
      />

      <HeroFigureSection
        layout="text-right"
        data={visionAndMissionData}
        sectionId="vision-and-mission"
        bgColor="bg-[#F5F5F5]"
      />

      <HeroFigureSection
        layout="text-left"
        data={interventionalData}
        sectionId="interventional-approaches"
      />

      <LegalSection legalData={legalData} />

      <HeroFigureSection
        layout="text-left"
        data={evolutionaryChangesData}
        sectionId="evolutionary-changes"
      />

      <HeroFigureSection
        layout="text-right"
        data={governanceData}
        sectionId="governance"
        bgColor="bg-[#F5F5F5]"
      />

      <CardsSection cardsData={cardsData} />

      <HeroFigureSection
        layout="text-right"
        data={programsData}
        sectionId="programs-activities"
        bgColor="bg-[#F5F5F5]"
      />

      <HeroFigureSection
        layout="text-left"
        data={trainingData}
        sectionId="training"
      />

      <FAQSection faqData={faqData} />
    </PublicLayout >
  );
};

export default About;