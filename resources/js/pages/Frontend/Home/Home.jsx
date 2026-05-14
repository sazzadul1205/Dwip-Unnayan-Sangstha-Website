// resources/js/Pages/Frontend/Home.jsx

import { Head } from '@inertiajs/react';
import PublicLayout from '../../../layouts/PublicLayout';
import Banner from './Components/Banner';
import AboutUs from './Components/AboutUs';
import OurAction from './Components/OurAction';
import WhereWeWork from './Components/WhereWeWork';

export default function Home() {
  return (
    <PublicLayout>
      <Head title="Job Match - Find Your Perfect Career" />

      {/* Hero Section */}
      <Banner />

      {/* About Us Section */}
      <AboutUs />

      {/* Our Action Section */}
      <OurAction />

      {/* Where We Work Section */}
      <WhereWeWork />
    </PublicLayout>
  );
}