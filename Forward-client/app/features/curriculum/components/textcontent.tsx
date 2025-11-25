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
import FwdImage from "@/components/ui/fwdimage";

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
``
  return (
    <div className="markdown">
      <div className="flex w-full flex-col items-center gap-4">
        {textContent.image && <FwdImage image={textContent.image} className="max-h-140 w-full cursor-zoom-in rounded-xl shadow-lg"/>}
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
