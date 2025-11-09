import { useEffect, useState } from "react";

const getWindowSize = () => ({
  width: typeof window !== "undefined" ? window.innerWidth : 0,
  height: typeof window !== "undefined" ? window.innerHeight : 0,
});

export const useWindowDimensions = () => {
  const [size, setSize] = useState(getWindowSize);

  useEffect(() => {
    const onResize = () => setSize(getWindowSize());
    window.addEventListener("resize", onResize);
    // Initialize in case of SSR hydration mismatch
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
};

export const useIsMobile = (breakpoint: number = 1024) => {
  const [isMobile, setIsMobile] = useState(getWindowSize().width < breakpoint);
  useEffect(() => {
    const onResize = () => {
      setIsMobile(getWindowSize().width < breakpoint)
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
};

export function useClient() {
  // compose if you still want a single export
  const isMobile = useIsMobile();
  const windowDimensions = useWindowDimensions();
  return { isMobile, windowDimensions };
}