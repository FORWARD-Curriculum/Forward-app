import type {
  TextContent as TextContentType,
  TextContentResponse,
} from "@/features/curriculum/types";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useResponse } from "@/features/curriculum/hooks";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleX, Pointer } from "lucide-react";
import { useIsMobile } from "@/hooks/useClient";
import { srcsetOf } from "@/utils/utils";

export default function TextContent({
  textContent,
}: {
  textContent: TextContentType;
}) {
  useResponse<TextContentResponse, TextContentType>({
    activity: textContent,
    initialFields: { attempts_left: 0, partial_response: false },
  });

  // State to track if the image has finished loading
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="markdown">
      <div className="flex w-full flex-col items-center gap-4">
        {textContent.image && (
          <Dialog>
            <DialogTrigger className="relative overflow-clip p-4">
              {!isImageLoaded && (
                <Skeleton className="min-h-70 lg:h-140 lg:min-h-140 aspect-square w-full lg:min-w-2xl rounded-xl" />
              )}
              <img
                src={textContent.image.thumbnail}
                srcSet={srcsetOf(textContent.image)}
                sizes="(max-width: 1020px) 74vw, 43vw"
                onLoad={() => setIsImageLoaded(true)}
                className={`max-h-140 w-full cursor-zoom-in rounded-xl shadow-lg ${isImageLoaded ? "block" : "hidden"} `}
              />
              {isMobile &&
                    <Pointer
                      className="absolute bottom-6 left-6 text-white drop-shadow-[0px_0px_2px_rgba(0,0,0,1)] filter"
                      color="white"
                    />}
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
              <DialogTitle/>
              <DialogClose
                asChild
                className="fixed right-2.5 z-[99999999999] p-1"
                style={{
                  top: isMobile
                    ? ""
                    : (CSS?.supports?.("top", "env(safe-area-inset-top)")
                      ? "calc(env(safe-area-inset-top) + 10px)"
                      : "10px"),
                  bottom:
              isMobile ? (CSS?.supports?.("bottom", "env(safe-area-inset-bottom)")
                ? "calc(env(safe-area-inset-bottom) + 20px)"
                : "20px") : "",
                }}
              >
                <CircleX
                  size={60}
                  className="bg-secondary active:bg-muted hover:bg-muted cursor-pointer rounded-full shadow-lg active:shadow-xs"
                />
              </DialogClose>
              <div
                className={isMobile ? "h-screen w-screen overflow-auto flex items-center":"" }
              >
                <img
                  className={
                    isMobile ? "w-fit max-w-[300vw]" : "w-full max-w-none"
                  }
                  src={textContent.image.original}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {textContent.content && (
        <MarkdownTTS
          controlsClassName="flex gap-2 lg:flex-row flex-col"
          controlsOrientation={isMobile?"horizontal":"vertical"}
        >
          {textContent.content}
        </MarkdownTTS>
      )}
    </div>
  );
}
