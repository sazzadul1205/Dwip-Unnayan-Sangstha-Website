// resources/js/layouts/PublicLayout.jsx


// Components
import Navbar from '../Shared/Navbar/Navbar';
import TopBar from '../Shared/TopBar/TopBar';
import Footer from '../Shared/Footer/Footer';
import BackToTop from '../Shared/BackToTop';

const PublicLayout = ({
  children,
  topBarData,
  navbarData,
  footerData,
  storageUrl,
  navbarVariant = 'legacy',
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* TopBar */}
      <TopBar topBarData={topBarData} storageUrl={storageUrl} />

      {navbarVariant === 'overlay' ? (
        <div className="relative z-30 h-0">
          <Navbar navbarData={navbarData} variant="overlay" />
        </div>
      ) : (
        <Navbar navbarData={navbarData} />
      )}

      {/* Main Content */}
      <main className="grow">
        {children}
      </main>

      {/* Footer */}
      <Footer footerData={footerData} storageUrl={storageUrl} />

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default PublicLayout;