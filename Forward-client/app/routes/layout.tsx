import { useEffect } from "react";
import { Outlet } from "react-router";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { useClient } from "@/hooks/useClient";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import type { Route } from "./+types/layout";
import { apiFetch } from "@/utils/utils";
import type { User } from "@/features/account/types";
import { setUser } from "@/features/account/slices/userSlice";
import Fetch from "@/components/layout/fetch";

// This runs only on browser reloads or initial page loads, as it its the highest level layout
// it fetches the current user's data
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const res = await apiFetch("/users/me", {}, true);
  const resp = await res.json();
  const user =
    (resp as { detail?: string; data?: { user: User } })?.data?.user ?? null;
  // console.log("clientLoader user", user);
  return user;
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const { windowDimensions } = useClient();
  const fetchUser = loaderData as User;
  const { user, status } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (status === "idle") {
      dispatch(setUser(fetchUser));
    }
  }, [fetchUser, user, status, dispatch]);

  const theme = user?.preferences?.theme;
  const textSize = user?.preferences?.text_size;

  // Apply theme and text size classes to the root element, this fixes dialog and modal issues
  // Apply theme and text size classes to the root element, this fixes dialog and modal issues
  useEffect(() => {
    const root = document.documentElement;
    const themeClasses = ["dark", "high-contrast"]; // Add any other theme classes
    const textSizeClasses = ["txt-sm", "txt-base", "txt-lg", "txt-xl"];
    root.classList.remove(...themeClasses, ...textSizeClasses);
    const newClasses = [theme, textSize].filter(Boolean) as string[];
    if (newClasses.length > 0) {
      root.classList.add(...newClasses);
    }
  }, [theme, textSize]);

  return (
    <>
      <div
        className={`bg-background relative flex min-h-[100vh] flex-col content-evenly ${
          user?.preferences?.theme || ""
        } ${user?.preferences?.text_size || "txt-base"}`}
      >
        <Header />
        <Fetch />
        <div className="flex flex-grow">
          <Outlet />
        </div>
        <Footer />
        <Toaster richColors closeButton={windowDimensions.width > 1024} />
      </div>
    </>
  );
}
