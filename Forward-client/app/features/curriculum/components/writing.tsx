import type { Writing, WritingResponse } from "@/features/curriculum/types";
import { useResponse } from "../hooks";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useIsMobile } from "@/hooks/useClient";

const mdPattern = /(\*\*|\n)/m;

export default function Writing({ writing }: { writing: Writing }) {
  const [response, setResponse] = useResponse<WritingResponse, Writing>({
    type: "Writing",
    activity: writing,
    initialFields: {
      responses: [],
    },
  });

  const isMobile = useIsMobile();

  return (
    <div>
      {writing.prompts.map((prompt, index) => (
        <div key={index} className="mb-4">
          <MarkdownTTS
            controlsClassName={`${mdPattern.test(prompt) ? "remark" : ""} flex flex-col lg:flex-row-reverse grow justify-between`}
            controlsOrientation={isMobile?"horizontal":"vertical"}
          >
            {prompt}
          </MarkdownTTS>

          <textarea
            className="resize-y w-full rounded border border-gray-300 p-2 font-mono whitespace-pre-wrap field-sizing-content min-h-30 max-w-full overflow-x-hidden"
            
            value={response.responses[index] || ""}
            onChange={(e) => {
              const newResponses = [...response.responses];
              newResponses[index] = e.target.value;
              setResponse((old) => ({
                ...old,
                responses: newResponses,
              }));
            }}
          />
          <div className="flex justify-end">
            {response.responses[index]
              ? response.responses[index].split(/\s+/)?.length - 1
              : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
