import { Outlet } from "react-router";
import { useState, type Dispatch, type SetStateAction } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
// ^ https://sonner.emilkowal.ski/
import { AuthContext } from "@/components/authContext";
import type { User } from "@/lib/useUser";
import { useClient } from "@/lib/useClient";

export default function Layout() {
  const [user, setUser] = useState<User | null>(null);
  const { windowDimensions } = useClient();

  return (
    <>
      <AuthContext.Provider value={{ user, setUser }}>
        <div className="relative min-h-[100vh] flex content-evenly flex-col">
          <Header />
          <div className="flex-grow flex">
            <Outlet />
          </div>
          <Footer />
          <Toaster richColors closeButton={windowDimensions.width > 1024} />
        </div>
      </AuthContext.Provider>
    </>
  );
}
