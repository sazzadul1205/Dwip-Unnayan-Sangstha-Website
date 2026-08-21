// resources/js/layouts/PublicLayout.jsx


// Components
import Navbar from '../Shared/Navbar';
import TopBar from '../Shared/TopBar';
import Footer from '../Shared/Footer';
import BackToTop from '../Shared/BackToTop';
import CookieConsent from '../Shared/CookieConsent';

const PublicLayout = ({ children, topBarData, navbarData, footerData, storageUrl }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* TopBar */}
      <TopBar topBarData={topBarData} storageUrl={storageUrl} />

      {/* Navbar */}
      <Navbar navbarData={navbarData} />

      {/* Main Content */}
      <main className="grow">
        {children}
      </main>

      {/* Footer */}
      <Footer footerData={footerData} storageUrl={storageUrl} />

      {/* Back to Top Button */}
      <BackToTop />

      {/* Cookie Consent Banner */}
      <CookieConsent
        position="bottom-0"
        theme="dark"
        expiryDays={365}
        cookieName="cookie_consent"
        privacyPolicyUrl="/privacy-policy"
      />
    </div>
  );
};

export default PublicLayout;