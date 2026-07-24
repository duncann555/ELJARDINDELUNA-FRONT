import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import FloatingButtons from "../shared/FloatingButtons";
import Footer from "../shared/Footer";
import Menu from "../shared/Menu";

const LayoutPrincipal = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Menu />
      <div className="site-content">
        <Outlet />
      </div>
      <FloatingButtons />
      <Footer />
    </>
  );
};

export default LayoutPrincipal;
