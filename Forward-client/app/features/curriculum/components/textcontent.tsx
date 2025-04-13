import type {
  TextContent as TextContentType,
  TextContentResponse,
} from "@/features/curriculum/types";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useResponse } from "@/features/curriculum/hooks";

export default function TextContent({
  textContent,
}: {
  textContent: TextContentType;
}) {
  useResponse<TextContentResponse, TextContentType>({
    type: "TextContent",
    activity: textContent,
    initialFields: {attempts_left: 0, partial_response: false}
  }
  );
  return (
    <div className="markdown">
      <p>{textContent.id}</p>
      <MarkdownTTS
        controlsClassName="flex gap-2"
        controlsOrientation="vertical"
      >
        {textContent.content}
      </MarkdownTTS>
    </div>
  );
}
