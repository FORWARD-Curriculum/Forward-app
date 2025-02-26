import { Outlet } from "react-router";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
// ^ https://sonner.emilkowal.ski/
import { useClient } from "@/lib/useClient";

export default function Layout() {
  const { windowDimensions } = useClient();

  return (
    <>
        <div className="relative min-h-[100vh] flex content-evenly flex-col">
          <Header />
          <div className="flex-grow flex">
            <Outlet />
          </div>
          <Footer />
          <Toaster richColors closeButton={windowDimensions.width > 1024} />
        </div>
    </>
  );
}
