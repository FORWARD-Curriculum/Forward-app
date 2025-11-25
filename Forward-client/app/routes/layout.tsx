import { useCallback, useEffect } from "react";
import { Outlet, useBeforeUnload, useBlocker, useLocation, useNavigate } from "react-router";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { useIsMobile } from "@/hooks/useClient";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import type { Route } from "./+types/layout";
import { apiFetch } from "@/utils/utils";
import type { User } from "@/features/account/types";
import { setUser } from "@/features/account/slices/userSlice";
import Fetch from "@/components/layout/fetch";
import { saveCurrentResponseThunk } from "@/features/curriculum/slices/userLessonDataSlice";
import { LoadingSpinner } from "./protected/protected";
import { toast } from "sonner";

function NavBlock() {
  const isSaved = useSelector(
    (state: RootState) =>
      state.response.current_context?.current_response_saved ?? true,
  );
  const dispatch = useDispatch<AppDispatch>();

  const shouldBlock = !isSaved;
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state === "blocked") {
      // Logic: Auto-save and proceed
      dispatch(saveCurrentResponseThunk())
        .unwrap()
        .then(() => {
          blocker.proceed();
        })
        .catch(() => {
          blocker.reset(); // Cancel the navigation so they stay on page
          toast.error("Something went wrong saving. Please save manually.");
        });
    }
  }, [blocker, dispatch]);

  useBeforeUnload((event) => {
  if (shouldBlock) {
    event.preventDefault();
  }
}, { capture: true });
  return blocker.state === "blocked" ? (
    <div className="bg-black/40 text-white absolute top-0 left-0 flex h-screen w-screen items-center justify-center text-6xl gap-5 z-[9999]">
      <LoadingSpinner size={60} color="white" /> Saving Lesson...
    </div>
  ) : null;
}


// This runs only on browser reloads or initial page loads, as it its the highest level layout
// it fetches the current user's data
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const res = await apiFetch("/users/me", {}, true);
  if(res.ok){
    const resp = await res.json();
    const user =
      (resp as { detail?: string; data?: { user: User } })?.data?.user ?? null;
    // console.log("clientLoader user", user);
    return user;
  } else {
    return null
  }
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const isMobile = useIsMobile();
  const fetchUser = loaderData as User | null;
  const { user, status } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

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

    useEffect(() => {
      if (
        user &&
        user.consent &&
        user.surveyed_at === null &&
        (!location.pathname.startsWith("/account") || !location.pathname.startsWith("/survey"))
      ) {
        console.log("Redirecting to survey");
        navigate("/survey", { replace: true, state: { from: location } });
      }
    }, [
      user?.consent,
      user?.surveyed_at,
      location.pathname,
      navigate,
      location,
    ]);

  return (
    <>
      <div
        className={`bg-background relative flex min-h-[100vh] flex-col content-evenly ${
          user?.preferences?.theme || ""
        } ${user?.preferences?.text_size || "txt-base"}`}
      >
        <NavBlock/>
        <Header />
        <Fetch />
        <div className="flex flex-grow">
          <Outlet />
        </div>
        <Footer />
        <Toaster richColors closeButton={!isMobile} />
      </div>
    </>
  );
}
