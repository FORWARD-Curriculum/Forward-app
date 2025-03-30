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
  useResponse<TextContentResponse, TextContentType>(
    "TextContent",
    textContent,
    true,
    {attemptsLeft: 0}
  );
  return (
    <div className="markdown">
      <MarkdownTTS
        controlsClassName="flex gap-2"
        controlsOrientation="vertical"
      >
        {textContent.content}
      </MarkdownTTS>
    </div>
  );
}
