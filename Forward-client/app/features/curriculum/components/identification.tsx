import type {
  Identification,
  IdentificationResponse,
} from "@/features/curriculum/types";
import { useResponse } from "@/features/curriculum/hooks";
import type React from "react";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useMemo, useState } from "react";


export default function Identification({
  identification,
}: {
  identification: Identification;
}) {
  const [response] = useResponse<IdentificationResponse, Identification>(
    "Identification",
    identification,
    true,
  );
  const [numberClicked, setNumberClicked] = useState(0);

  // Memoize the Correct component to avoid re-creating it on every render
  const Correct = useMemo(() => {
    const Component: React.FC<React.HTMLAttributes<HTMLElement>> = ({
      children,
    }) => {
      const [clicked, setClicked] = useState(!response.partial_response);
      return (
        <span
          className={`${clicked ? "bg-yellow-400/80" : ""}`}
          onClick={() => {
            if (!clicked) setNumberClicked((o) => o + 1);
            setClicked(true);
          }}
        >
          {children}
        </span>
      );
    };
    return Component;
  }, []);

  return (
    <>
    <p className="mb-4 font-light">{identification.instructions}</p>
      <MarkdownTTS
        customComponents={{ correct: Correct}}
        controlsOrientation="horizontal"
        controlsClassName="flex flex-col"
        className="remark **:max-w-[100ch] !p-16 !pt-10"
      >
        {identification.content}
      </MarkdownTTS>
    </>
  );
}
