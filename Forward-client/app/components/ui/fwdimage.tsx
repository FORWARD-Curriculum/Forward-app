import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/useClient";
import { srcsetOf, type Image } from "@/utils/utils";
import {
  CircleX,
  MousePointerClick,
  Plus,
  Pointer,
  Search,
} from "lucide-react";
import type React from "react";
import { Skeleton } from "./skeleton";
import { useState } from "react";

interface FwdImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  image: Image | undefined;
  disableInteractive?: boolean;
}

export default function FwdImage({
  image,
  disableInteractive = false,
  className,
  ...props
}: FwdImageProps) {
  const isMobile = useIsMobile();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const finalSrc = image?.thumbnail || props.src;
  const finalSrcSet = image ? srcsetOf(image) : props.srcSet;

  return disableInteractive ? (
    <img
      {...props}
      src={finalSrc}
      srcSet={finalSrcSet}
      sizes={props.sizes}
      onLoad={(e) => {
        //   setIsImageLoaded(true);
        props.onLoad?.(e);
      }}
      className={`cursor-zoom-in ${className || ""}`}
    />
  ) : (
    <Dialog>
      <DialogTrigger className="relative">
        {!isImageLoaded && (
          <Skeleton
            // Merge passed className with Skeleton classes
            className={`aspect-square w-full rounded-xl ${className || ""}`}
          />
        )}
        <img
          {...props} // 4. Spread standard props (alt, id, etc.)
          src={finalSrc}
          srcSet={finalSrcSet}
          sizes={props.sizes}
          onLoad={(e) => {
            setIsImageLoaded(true);
            props.onLoad?.(e); // Optional: Allow parent to listen to load too
          }}
          // Merge internal state classes with the passed className
          className={`cursor-zoom-in ${isImageLoaded ? "block" : "hidden"} ${className || ""}`}
        />
        {isMobile ? (
          <div className="absolute bottom-3 left-3 flex items-center justify-center text-white drop-shadow-[0px_0px_2px_rgba(0,0,0,1)] filter">
            <Pointer color="white" />
            <Plus
              className="absolute bottom-[12px] left-[7px] scale-60"
              strokeWidth={4}
            />
          </div>
        ) : (
          <div
            title="Maximize Image (Zoom In)"
            className="absolute bottom-3 left-3 flex items-center justify-center text-white drop-shadow-[0px_0px_2px_rgba(0,0,0,1)] filter"
          >
            <Search color="white" />
            <Plus
              className="absolute -top-[1px] -left-[1px] scale-55"
              strokeWidth={3}
            />
          </div>
        )}
      </DialogTrigger>
      <DialogClose className="sticky" />
      <DialogContent
        aria-describedby={undefined}
        className={
          isMobile
            ? "h-screen w-screen max-w-none gap-0 p-0"
            : "h-[90vh] max-h-[90vh] w-[90vw] !max-w-[9999999999999999999px] overflow-auto"
        }
        hideCloseIcon
      >
        <DialogTitle />
        <DialogClose
          asChild
          className="fixed right-2.5 z-[99999999999] p-1"
          style={{
            top: isMobile
              ? ""
              : CSS?.supports?.("top", "env(safe-area-inset-top)")
                ? "calc(env(safe-area-inset-top) + 10px)"
                : "10px",
            bottom: isMobile
              ? CSS?.supports?.("bottom", "env(safe-area-inset-bottom)")
                ? "calc(env(safe-area-inset-bottom) + 20px)"
                : "20px"
              : "",
          }}
        >
          <CircleX
            size={60}
            className="bg-secondary active:bg-muted hover:bg-muted cursor-pointer rounded-full shadow-lg active:shadow-xs"
          />
        </DialogClose>
        <div
          className={
            isMobile ? "flex h-screen w-screen items-center overflow-auto" : ""
          }
        >
          <img
            className={isMobile ? "w-fit max-w-[300vw]" : "w-full max-w-none"}
            src={image?.original || props.src}
            alt={props.alt} // Ensure alt is passed to the modal image too
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
