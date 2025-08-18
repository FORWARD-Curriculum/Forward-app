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

export default function TextContent({
  textContent,
}: {
  textContent: TextContentType;
}) {
  useResponse<TextContentResponse, TextContentType>({
    type: "TextContent",
    activity: textContent,
    initialFields: { attempts_left: 0, partial_response: false },
  });

  // State to track if the image has finished loading
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <div className="markdown">
      <div className="flex w-full flex-col items-center gap-4">
        {textContent.image && (
          <Dialog>
            <DialogTrigger>
              {!isImageLoaded && (
                <Skeleton className="h-140 min-h-140 w-full min-w-2xl rounded-xl" />
              )}
              <img
                src={textContent.image}
                onLoad={() => setIsImageLoaded(true)}
                className={`m-4 max-h-140 cursor-zoom-in rounded-xl shadow-lg ${isImageLoaded ? "block" : "hidden"} `}
              />
            </DialogTrigger>
            <DialogClose className="sticky" />
            <DialogContent className="h-[90vh] max-h-[90vh] w-[90vw] !max-w-[9999999999999999999px] overflow-y-scroll">
              <img className="h-full w-full" src={textContent.image}></img>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {textContent.content && (
        <MarkdownTTS
          controlsClassName="flex gap-2"
          controlsOrientation="vertical"
        >
          {textContent.content}
        </MarkdownTTS>
      )}
    </div>
  );
}
