import type { TextContent } from "@/lib/lessonSlice";
import MarkdownTTS from "@/components/ui/markdown-tts";

export default function TextContent({
  textContent,
}: {
  textContent: TextContent;
}) {
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
