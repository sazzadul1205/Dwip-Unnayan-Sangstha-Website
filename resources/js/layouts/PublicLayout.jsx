// resources/js/layouts/PublicLayout.jsx

// React
import React from 'react';

// Icons
import { Dumbbell } from 'lucide-react';

// Components
import Navbar from '../components/Shared/Navbar';
import TopBar from '../components/Shared/TopBar';
import Footer from '../components/Shared/Footer';

const PublicLayout = ({ children, topBarData, navbarData, footerData, storageUrl }) => {
  return (
    <div >
      <TopBar topBarData={topBarData} storageUrl={storageUrl} />
      <Navbar navbarData={navbarData} />
      <main className="mx-auto">{children}</main>
      <Footer footerData={footerData} storageUrl={storageUrl} />
    </div>
  );
};

export default PublicLayout;