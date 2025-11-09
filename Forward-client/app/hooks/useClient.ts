import React, { useEffect, useState } from "react";

export const useClient = (): {
  windowDimensions: { width: number; height: number };
  isMobile: boolean;
} => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 1024,
  });

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 1024,
      });
      setIsMobile((prevIsMobile) => {
        const newIsMobile = window.innerWidth <= 1024;
        if (prevIsMobile !== newIsMobile) {
          return newIsMobile;
        }
        return prevIsMobile;
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { windowDimensions, isMobile };
};
