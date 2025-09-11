import { apiFetch } from "@/utils/utils";
import type { Route } from "./+types/survey";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/account/hooks";
import type { User } from "@/features/account/types";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useLocation, useNavigate } from "react-router";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const res = await apiFetch("/survey", {}, false);

  const resp = (await res.json()) as {
    detail?: string;
    data?: { survey: string };
  };
  return resp;
}

export default function Onboard({ loaderData }: Route.ComponentProps) {
  const updateUser = useAuth().update;
  const user = useSelector((s: RootState) => s.user.user) as User;
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  useEffect(() => {
    const surveyEnd: (this: Window, ev: MessageEvent<any>) => any = (e) => {
      if (e.origin.includes("qualtrics.com") ) console.log(e)
      if (
        e.origin.includes("qualtrics.com") &&
        e.data == "endOfSurvey"
      ) {
        try {
          apiFetch("/users/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ set_surveyed_now: true }),
          }).then((response) => {
            response.json().then((result) => {
              if (!response.ok) {
                throw new Error(result.detail || "Login error.");
              }
              updateUser({
                ...result.data.user,
              });
              navigate(from, { replace: true });
              toast.success("Successfully completed surveying!");
            });
          });
        } catch (err: any) {
          toast.error(err.message);
        }
      }
    };
    window.addEventListener("message", surveyEnd);

    return () => {
      window.removeEventListener("message", surveyEnd);
    };
  }, []);

  return loaderData.data?.survey ? (
    <iframe className="w-full" src={loaderData.data?.survey} />
  ) : (
    loaderData.detail
  );
}
