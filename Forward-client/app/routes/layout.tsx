import { Outlet } from "react-router";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
// ^ https://sonner.emilkowal.ski/
import { useClient } from "@/hooks/useClient";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

export default function Layout() {
  const { windowDimensions } = useClient();
  const user = useSelector((state: RootState) => state.user.user);

  return (
    <>
      <div
        className={`bg-background relative flex min-h-[100vh] flex-col content-evenly ${
          user?.preferences?.theme || ""
        } ${user?.preferences?.text_size || "txt-base"}`}
      >
        <Header />
        <div className="flex flex-grow">
          <Outlet />
        </div>
        <Footer />
        <Toaster richColors closeButton={windowDimensions.width > 1024} />
      </div>
    </>
  );
}
