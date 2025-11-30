import type {
  TextContent as TextContentType,
  TextContentResponse,
} from "@/features/curriculum/types";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useResponse } from "@/features/curriculum/hooks";
import { useIsMobile } from "@/hooks/useClient";
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
  const isMobile = useIsMobile();
``
  return (
    <div className="markdown">
      <div className="flex w-full flex-col items-center gap-4">
        {textContent.image && <FwdImage image={textContent.image} sizes="50vh" className={`max-h-300 ${isMobile ? "" : "h-120"} w-full cursor-zoom-in rounded-xl shadow-lg`} skeletonClassName="min-h-120"/>}
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
