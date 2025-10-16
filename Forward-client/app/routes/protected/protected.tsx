import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { cn } from "@/utils/utils";
import { useEffect } from "react";

//https://github.com/shadcn-ui/ui/discussions/1694
export interface ISVGProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const LoadingSpinner = ({
  size = 24,
  className,
  ...props
}: ISVGProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, status } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (
      user &&
      user.consent &&
      !user.surveyed_at &&
      !location.pathname.startsWith("/account")
    ) {
      navigate("/survey", { replace: true, state: { from: location } });
    }
  }, [
    user?.consent,
    user?.surveyed_at,
    location.pathname,
    navigate,
    location,
  ]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Outlet />
      ) : (
        <Navigate to="/login" state={{ from: location }} replace />
      )}
    </>
  );
}
