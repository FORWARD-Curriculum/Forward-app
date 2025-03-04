import { Outlet } from "react-router";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
// ^ https://sonner.emilkowal.ski/
import { useClient } from "@/lib/useClient";
import { useSelector } from "react-redux";
import type { RootState } from "./store";

export default function Layout() {
  const { windowDimensions } = useClient();
  const user = useSelector((state: RootState) => state.user.user);

  return (
    <>
      <div
        className={`bg-background relative min-h-[100vh] flex content-evenly flex-col text-base ${
          user?.preferences?.theme || ""
        } ${user?.preferences?.text_size || ""}`}
      >
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
