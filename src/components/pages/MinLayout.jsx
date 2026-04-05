import Menu from "../shared/Menu";
import Footer from "../shared/Footer";
import FloatingButtons from "../shared/FloatingButtons";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <>
      <Menu />
      <main className="min-vh-100">
        <Outlet />
      </main>
      <FloatingButtons />
      <Footer />
    </>
  );
};

export default MainLayout;
