import { API_PROGRESS_EVENT } from "@/utils/utils";
import { useEffect, useState } from "react";
import { Progress } from "../ui/progress";

export default function Fetch(){
      const [apiLoading, setApiLoading] = useState<typeof window.apiProgress>({
        progress: 0,
        loading: false,
      });
    
      useEffect(() => {
        const handleProgressUpdate = () => {
          setApiLoading({...window.apiProgress});
        };
    
        window.addEventListener(API_PROGRESS_EVENT, handleProgressUpdate);
    
        return () => {
          window.removeEventListener(API_PROGRESS_EVENT, handleProgressUpdate);
        };
      }, []);

      return apiLoading.loading && apiLoading.progress != 0? (<Progress value={apiLoading.progress} className="width-[100vw] h-1 bg-muted" />) : <></>
}