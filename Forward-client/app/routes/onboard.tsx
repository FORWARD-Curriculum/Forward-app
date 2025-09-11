import { apiFetch } from "@/utils/utils";
import type { Route } from "./+types/onboard";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const res = await apiFetch("/onboard",{},false);
  
  const resp = await res.json() as { detail?: string; data?: { survey: string } };
  return resp;
}

export default function Onboard({ loaderData }: Route.ComponentProps){
  console.log("redirected")
    return (
        loaderData.data?.survey ? <iframe src={loaderData.data?.survey}/> : loaderData.detail 
    )
}