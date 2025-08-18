import { useEffect } from "react";
import { Outlet } from "react-router";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { useClient } from "@/hooks/useClient";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

export default function Layout() {
  const { windowDimensions } = useClient();
  const user = useSelector((state: RootState) => state.user.user);

  // Get theme and text size, but they can be undefined if not set
  const theme = user?.preferences?.theme;
  const textSize = user?.preferences?.text_size;

  useEffect(() => {
    const root = document.documentElement; // <html> tag

    // Define all possible classes this effect can manage
    const themeClasses = ["dark", "high-contrast"]; // Add any other theme classes
    const textSizeClasses = ["txt-sm", "txt-base", "txt-lg", "txt-xl"];

    // 1. Start with a clean slate by removing all managed classes
    root.classList.remove(...themeClasses, ...textSizeClasses);

    // 2. Create an array of the *valid* classes to add
    const newClasses = [theme, textSize].filter(Boolean) as string[]; // filter(Boolean) removes any empty, null, or undefined values

    // 3. Add the new classes if there are any
    if (newClasses.length > 0) {
      root.classList.add(...newClasses);
    }

    // The cleanup is now implicitly handled by the removal at the start of the effect.
    // This is a more robust pattern than trying to remove the "previous" classes.
  }, [theme, textSize]); // Rerun when theme or textSize changes

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