// resources/js/Pages/Frontend/Home/Home.jsx

// Inertia
import { Head } from "@inertiajs/react";

// Layout
import PublicLayout from "../../../layouts/PublicLayout";

// Sections
import JobsSection from "./JobsSection/JobsSection";
import BannerSection from "./BannerSection/BannerSection";
import StoriesSection from "./StoriesSection/StoriesSection";
import AboutUsSection from "./AboutUsSection/AboutUsSection";
import OurActionSection from "./OurActionSection/OurActionSection";
import WhereWeWorkSection from "./WhereWeWorkSection/WhereWeWorkSection";
import OurProgramsSection from "./OurProgramsSection/OurProgramsSection";
import ProgramImpactSection from "./ProgramImpactSection/ProgramImpactSection";
import UpcomingEventsSection from "./UpcomingEventsSection/UpcomingEventsSection";

export default function Home({
  // Shared 
  topBarData,
  navbarData,
  footerData,

  // Page Pacific
  jobsData,
  bannerData,
  storiesData,
  aboutUsData,
  ourActionData,
  ourProgramsData,
  whereWeWorkData,
  programImpactData,
  upcomingEventsData,

}) {
  return (
    <PublicLayout topBarData={topBarData} navbarData={navbarData} footerData={footerData}>
      <Head title="Home | DUS - Dwip Unnayan Society | Empowering Communities" />

      <BannerSection bannerData={bannerData} />

      <AboutUsSection aboutUsData={aboutUsData} />

      <OurActionSection actionData={ourActionData} />

      <WhereWeWorkSection workData={whereWeWorkData} />

      <OurProgramsSection programsData={ourProgramsData} />

      <StoriesSection storiesData={storiesData} />

      <UpcomingEventsSection eventsData={upcomingEventsData} />

      <JobsSection jobsData={jobsData} />

      <ProgramImpactSection impactData={programImpactData} />

    </PublicLayout>
  );
}